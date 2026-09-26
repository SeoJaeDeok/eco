import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  AUTH_REFRESH_NOTICES, AUTH_REFRESH_STORAGE_KEY, AUTH_REFRESH_TTL_MS,
  consumeAuthRefreshReturn, createPublicAuthRefresh,
} from '../src/features/auth/publicAuthRefresh.ts';

const empty = { user: null, profile: null, isAdmin: false };
const signedIn = { user: { id: 'test-user' }, profile: { displayName: '관찰자' }, isAdmin: false };
const now = () => 1_000_000;
const record = (overrides = {}) => ({ version: 1, page: 'upload', notice: 'confirmation-required', createdAt: now(), ...overrides });
const storageFixture = () => {
  const data = new Map([['sdk-session-fixture', 'untouched'], ['other-setting', 'untouched']]);
  const touched = [];
  const storage = {
    getItem(key) { touched.push(['get', key]); return data.get(key) ?? null; },
    setItem(key, value) { touched.push(['set', key]); data.set(key, value); },
    removeItem(key) { touched.push(['remove', key]); data.delete(key); },
  };
  return { data, touched, storage, getStorage: () => storage };
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// Execute the real App callbacks with injected repositories and shallow UI boundaries.
// This does not assert real browser navigation, CSS, SDK persistence or live authentication.
const mountApp = async ({ repository = {}, storage = storageFixture(), restored = null, hash = '',
  configured = true, strict = false, reload = () => {} } = {}) => {
  const slots = [];
  let cursor = 0, tree, dirty = false, reloads = 0;
  const pendingEffects = [];
  const events = new Map();
  const authListeners = new Set();
  const calls = { session: 0, login: 0, signup: 0, logout: 0 };
  const auth = {
    async getSessionState() { calls.session++; return repository.getSessionState?.() ?? empty; },
    async signInWithPassword(...args) { calls.login++; return repository.signInWithPassword?.(...args) ?? signedIn; },
    async signUpWithPassword(...args) {
      calls.signup++;
      return repository.signUpWithPassword?.(...args)
        ?? { sessionState: signedIn, requiresEmailConfirmation: false, profileSetupRequired: false };
    },
    async signOut(...args) { calls.logout++; assert.equal(args.length, 0); await repository.signOut?.(); },
    onAuthStateChange(callback) { authListeners.add(callback); return { unsubscribe: () => authListeners.delete(callback) }; },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) {
        if (strict && typeof initial === 'function') initial();
        slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      }
      return [slots[index].value, (next) => {
        slots[index].value = typeof next === 'function' ? next(slots[index].value) : next;
        dirty = true;
      }];
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
    useCallback(callback) { return callback; },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !deps.every((value, i) => Object.is(value, slots[index].deps[i]))) {
        pendingEffects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, callback, cleanup: callback() };
        });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const stubs = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'motion/react': { AnimatePresence: 'animate' }, 'lucide-react': { RotateCw: 'reload-icon' },
    './components/Navbar': { Navbar: 'navbar' }, './components/AppRoutes': { AppRoutes: 'routes' },
    './components/ObservationDetail': { ObservationDetail: 'detail' },
    './repositories/authRepositoryProvider': { activeAuthRepository: auth, getConfiguredAuthRepositoryKind: () => configured ? 'supabase' : 'unavailable' },
    './repositories/adminObservationRepositoryProvider': { activeAdminObservationRepository: {} },
    './repositories/observationRepositoryProvider': {
      getConfiguredObservationRepositoryKind: () => 'mock',
      activeObservationRepository: { listObservations: async () => [], countUniqueSpecies: async () => 0 },
    },
    './utils/observationImagePrefetch': { prefetchObservationImages() {} },
    './utils/observationStats': { countUniqueSpecies: () => 0 },
    './utils/observerDisplay': { normalizeObserverDisplayName: (name) => name?.includes('@') ? undefined : name },
    './features/auth/publicAuthRefresh': {
      AUTH_REFRESH_NOTICES,
      createPublicAuthRefresh: () => createPublicAuthRefresh({
        getStorage: storage.getStorage, now,
        reload: () => { reload(); reloads++; },
      }),
    },
  };
  const window = {
    location: { hash, pathname: '/', search: '' }, history: { replaceState() {} }, scrollTo() {},
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name, callback) { if (events.get(name) === callback) events.delete(name); },
  };
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  runInNewContext(outputText, { exports, window, require(name) {
    assert.ok(stubs[name], 'Only reviewed local imports allowed'); return stubs[name];
  } });
  const render = () => {
    cursor = 0; dirty = false;
    tree = exports.default({ authRefreshReturn: restored });
    pendingEffects.splice(0).forEach((effect) => effect());
  };
  const settle = async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setImmediate(resolve));
      if (!dirty) return;
      render();
    }
    assert.fail('App effects did not settle');
  };
  const nodes = (predicate) => {
    const found = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) found.push(node);
      visit(node.props.children);
    };
    visit(tree); return found;
  };
  const text = (node) => Array.isArray(node) ? node.map(text).join('')
    : node && typeof node === 'object' ? text(node.props.children) : node == null || typeof node === 'boolean' ? '' : String(node);
  render();
  if (strict) slots.filter((slot) => slot.callback).forEach((slot) => { slot.cleanup?.(); slot.cleanup = slot.callback(); });
  await settle();
  return {
    calls, storage, nodes, text, settle,
    get reloads() { return reloads; },
    nav: () => nodes((node) => node.type === 'navbar')[0].props,
    routes: () => nodes((node) => node.type === 'routes')[0].props,
    async navigate(page) { nodes((node) => node.type === 'navbar')[0].props.onNavigate(page); await settle(); },
    emitAuth(event) { authListeners.forEach((callback) => callback(event, null)); },
    dispatch(name) { events.get(name)?.(); },
    get authSubscriptions() { return authListeners.size; },
  };
};

test('one-time return permits only public page/notice data and touches only its own storage key', () => {
  const fixture = storageFixture();
  for (const page of ['home', 'intro', 'observations', 'map', 'upload']) {
    fixture.data.set(AUTH_REFRESH_STORAGE_KEY, JSON.stringify(record({ page })));
    assert.deepEqual(consumeAuthRefreshReturn({ ...fixture, now }), record({ page }));
    assert.equal(consumeAuthRefreshReturn({ ...fixture, now }), null);
  }
  assert.ok(fixture.touched.every(([, key]) => key === AUTH_REFRESH_STORAGE_KEY));
  assert.equal(fixture.data.get('sdk-session-fixture'), 'untouched');
  assert.equal(fixture.data.get('other-setting'), 'untouched');
});

test('invalid, expired, future, oversized and non-public returns are ignored and removed', () => {
  const fixture = storageFixture();
  const cases = ['not-json', 'null', '[]', ' '.repeat(513), ...[
    { version: 2 }, { page: 'admin' }, { page: '//external' }, { notice: 'reload' },
    { createdAt: now() - AUTH_REFRESH_TTL_MS - 1 }, { createdAt: now() + 1 },
    { createdAt: 'today' }, { extra: 'unexpected' },
  ].map((overrides) => JSON.stringify(record(overrides)))];
  for (const raw of cases) {
    fixture.data.set(AUTH_REFRESH_STORAGE_KEY, raw);
    assert.equal(consumeAuthRefreshReturn({ ...fixture, now }), null);
    assert.equal(fixture.data.has(AUTH_REFRESH_STORAGE_KEY), false);
  }
});

test('blocked storage reads/removals cannot crash startup or replay commands', () => {
  for (const method of ['getStorage', 'getItem', 'removeItem']) {
    const fixture = storageFixture();
    fixture.data.set(AUTH_REFRESH_STORAGE_KEY, JSON.stringify(record()));
    if (method === 'getStorage') fixture.getStorage = () => { throw new Error('Blocked'); };
    else fixture.storage[method] = () => { throw new Error('Blocked'); };
    assert.equal(consumeAuthRefreshReturn({ ...fixture, now }), null);
  }
});

test('refresh guard releases failures but latches once reload is requested; admin completion skips reload', () => {
  const fixture = storageFixture();
  let reloads = 0;
  const refresh = createPublicAuthRefresh({ ...fixture, now, reload: () => reloads++ });
  assert.equal(refresh.complete('home'), 'skipped');
  assert.equal(refresh.begin(), true);
  assert.equal(refresh.begin(), false);
  refresh.release();
  assert.equal(refresh.begin(), true);
  assert.equal(refresh.complete('admin'), 'skipped');
  assert.equal(fixture.data.has(AUTH_REFRESH_STORAGE_KEY), false);
  assert.equal(refresh.begin(), true);
  assert.equal(refresh.complete('map'), 'reloading');
  refresh.release();
  refresh.complete('map');
  refresh.reloadManually();
  assert.equal(refresh.begin(), false);
  assert.equal(reloads, 1);
});

test('real App waits for login success and blocks repeated and cross-action requests before rerender', async () => {
  const pending = deferred();
  const view = await mountApp({ repository: { signInWithPassword: () => pending.promise } });
  await view.navigate('upload');
  const callback = view.routes().onPublicSignIn;
  const task = callback('input', 'input');
  assert.equal(await callback('input', 'input'), false);
  assert.equal(await view.nav().onPublicSignUp('input', 'input', 'input'), 'failed');
  await view.nav().onPublicSignOut();
  assert.deepEqual(view.calls, { session: 1, login: 1, signup: 0, logout: 0 });
  assert.equal(view.reloads, 0);
  pending.resolve(signedIn);
  assert.equal(await task, true);
  await view.settle();
  assert.equal(view.reloads, 1);
  assert.equal(view.nav().isPublicUserSignedIn, true);
  assert.equal(JSON.parse(view.storage.data.get(AUTH_REFRESH_STORAGE_KEY)).page, 'upload');
  assert.equal(await callback('input', 'input'), false);
  assert.equal(view.reloads, 1);
});

test('real App login failures and missing users do not reload, and allow retry', async () => {
  let attempt = 0;
  const view = await mountApp({ repository: { signInWithPassword: async () => {
    if (++attempt === 1) throw new Error('Synthetic auth failure');
    return attempt === 2 ? empty : signedIn;
  } } });
  for (let i = 0; i < 2; i++) {
    assert.equal(await view.nav().onPublicSignIn('input', 'input'), false);
    await view.settle();
    assert.equal(view.reloads, 0);
    assert.match(view.nav().publicAuthError, /로그인에 실패/);
    assert.equal(view.storage.data.has(AUTH_REFRESH_STORAGE_KEY), false);
  }
  assert.equal(await view.nav().onPublicSignIn('input', 'input'), true);
  assert.equal(view.reloads, 1);
});

test('real App awaits logout, keeps the same scope call, clears user state and refreshes once', async () => {
  const pending = deferred();
  const view = await mountApp({ repository: { getSessionState: async () => signedIn, signOut: () => pending.promise } });
  await view.navigate('upload');
  const task = view.nav().onPublicSignOut();
  await view.nav().onPublicSignOut();
  assert.equal(view.calls.logout, 1);
  assert.equal(view.reloads, 0);
  pending.resolve();
  await task;
  await view.settle();
  assert.equal(view.reloads, 1);
  assert.equal(view.routes().publicAuthState.user, null);
  assert.equal(JSON.parse(view.storage.data.get(AUTH_REFRESH_STORAGE_KEY)).page, 'upload');
});

test('real App logout failure stays signed in, shows a public alert, and permits retry', async () => {
  let fail = true;
  const view = await mountApp({ repository: {
    getSessionState: async () => signedIn,
    signOut: async () => { if (fail) throw new Error('Synthetic failure'); },
  } });
  await view.nav().onPublicSignOut();
  await view.settle();
  assert.equal(view.reloads, 0);
  assert.equal(view.nav().isPublicUserSignedIn, true);
  assert.ok(view.nodes((node) => node.props.role === 'alert' && view.text(node).includes('로그아웃에 실패')).length);
  fail = false;
  await view.nav().onPublicSignOut();
  assert.equal(view.reloads, 1);
});

for (const outcome of ['signed-in', 'confirmation-required', 'profile-setup-required']) {
  test(`real App signup ${outcome} writes only safe return data then reloads once`, async () => {
    const pending = deferred();
    const view = await mountApp({ repository: { signUpWithPassword: () => pending.promise } });
    await view.navigate('map');
    const task = view.nav().onPublicSignUp('input', 'input', 'input');
    assert.equal(await view.nav().onPublicSignUp('input', 'input', 'input'), 'failed');
    view.emitAuth('SIGNED_IN');
    assert.equal(view.reloads, 0);
    pending.resolve({ sessionState: outcome === 'signed-in' ? signedIn : empty,
      requiresEmailConfirmation: outcome === 'confirmation-required', profileSetupRequired: outcome === 'profile-setup-required' });
    assert.equal(await task, outcome);
    await view.settle();
    assert.equal(view.reloads, 1);
    assert.equal(view.calls.signup, 1);
    assert.equal(view.calls.login, 0);
    assert.equal(view.nav().isPublicUserSignedIn, outcome === 'signed-in');
    assert.deepEqual(JSON.parse(view.storage.data.get(AUTH_REFRESH_STORAGE_KEY)), record({ page: 'map', notice: outcome }));
    assert.equal(view.nav().publicAuthNotice, AUTH_REFRESH_NOTICES[outcome]);
  });
}

test('real App signup rejection or unusable result leaves errors with no notice, storage or reload', async () => {
  for (const reject of [true, false]) {
    const view = await mountApp({ repository: { signUpWithPassword: async () => {
      if (reject) throw new Error('Synthetic failure');
      return { sessionState: empty, requiresEmailConfirmation: false, profileSetupRequired: false };
    } } });
    assert.equal(await view.nav().onPublicSignUp('input', 'input', 'input'), 'failed');
    await view.settle();
    assert.equal(view.reloads, 0);
    assert.equal(view.nav().publicAuthNotice, null);
    assert.match(view.nav().publicAuthError, /회원가입을 완료하지 못했습니다/);
    assert.equal(view.storage.data.has(AUTH_REFRESH_STORAGE_KEY), false);
  }
});

test('entry-point consumption survives StrictMode initializers/effects without inventing a session', async () => {
  const fixture = storageFixture();
  fixture.data.set(AUTH_REFRESH_STORAGE_KEY, JSON.stringify(record()));
  const restored = consumeAuthRefreshReturn({ ...fixture, now });
  const view = await mountApp({ storage: fixture, restored, strict: true });
  assert.equal(view.routes().currentPage, 'upload');
  assert.equal(view.nav().isPublicUserSignedIn, false);
  assert.equal(view.nav().publicAuthNotice, AUTH_REFRESH_NOTICES['confirmation-required']);
  assert.ok(view.nodes((node) => node.props.role === 'status' && view.text(node).includes('이메일 확인')).length);
  for (const event of ['INITIAL_SESSION', 'TOKEN_REFRESHED', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED']) view.emitAuth(event);
  for (const event of ['focus', 'visibilitychange', 'storage']) view.dispatch(event);
  await view.settle();
  assert.equal(view.authSubscriptions, 0);
  assert.equal(view.reloads, 0);
  assert.deepEqual(view.calls, { session: 2, login: 0, signup: 0, logout: 0 });
  assert.equal(consumeAuthRefreshReturn({ ...fixture, now }), null);
  const second = await mountApp({ storage: fixture });
  assert.equal(second.nav().publicAuthNotice, null);
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.ok(main.indexOf('const authRefreshReturn = consumeAuthRefreshReturn()') < main.indexOf('createRoot(document'));
  assert.match(main, /<App authRefreshReturn=\{authRefreshReturn\}/);
});

test('restored public page uses repository session, never return metadata, for authenticated controls', async () => {
  const view = await mountApp({ restored: record({ notice: 'signed-in' }), repository: { getSessionState: async () => signedIn } });
  assert.equal(view.routes().currentPage, 'upload');
  assert.equal(view.nav().isPublicUserSignedIn, true);
  assert.equal(view.nav().publicAuthDisplayName, '관찰자');
  assert.equal(view.reloads, 0);
  const signedOut = await mountApp({ restored: record({ notice: 'signed-in' }) });
  assert.equal(signedOut.nav().isPublicUserSignedIn, false);
  assert.equal(signedOut.routes().publicAuthState.isAdmin, false);
});

test('blocked notice storage leaves successful confirmation visible with explicit manual reload only', async () => {
  for (const method of ['getStorage', 'setItem']) {
    const fixture = storageFixture();
    if (method === 'getStorage') fixture.getStorage = () => { throw new Error('Blocked'); };
    else fixture.storage.setItem = () => { throw new Error('Blocked'); };
    const view = await mountApp({ storage: fixture, repository: { signUpWithPassword: async () => ({
      sessionState: empty, requiresEmailConfirmation: true, profileSetupRequired: false,
    }) } });
    assert.equal(await view.nav().onPublicSignUp('input', 'input', 'input'), 'confirmation-required');
    await view.settle();
    assert.equal(view.reloads, 0);
    assert.equal(view.nav().publicAuthError, null);
    assert.equal(view.nav().isPublicUserSignedIn, false);
    assert.equal(view.nav().publicAuthNotice, AUTH_REFRESH_NOTICES['confirmation-required']);
    const button = view.nodes((node) => node.type === 'button' && view.text(node) === '새로고침')[0];
    assert.ok(button);
    button.props.onClick(); button.props.onClick();
    assert.equal(view.reloads, 1);
    assert.equal(view.calls.signup, 1);
    assert.equal(view.calls.login, 0);
  }
});

test('reload exception is not reported as wrong credentials and manual retry does not repeat auth', async () => {
  let fail = true;
  const view = await mountApp({ reload: () => { if (fail) throw new Error('Navigation blocked'); } });
  assert.equal(await view.nav().onPublicSignIn('input', 'input'), true);
  await view.settle();
  assert.equal(view.nav().publicAuthError, null);
  assert.equal(view.nav().isPublicUserSignedIn, true);
  fail = false;
  view.nodes((node) => node.type === 'button' && view.text(node) === '새로고침')[0].props.onClick();
  assert.equal(view.reloads, 1);
  assert.equal(view.calls.login, 1);
});

test('admin route ignores public return and its public Navbar action does not trigger reload', async () => {
  const view = await mountApp({ hash: '#admin', restored: record() });
  assert.equal(view.routes().currentPage, 'admin');
  assert.equal(view.nav().publicAuthNotice, null);
  assert.equal(await view.nav().onPublicSignIn('input', 'input'), true);
  assert.equal(view.reloads, 0);
  assert.equal(view.storage.data.has(AUTH_REFRESH_STORAGE_KEY), false);
  const admin = readFileSync(new URL('../src/components/admin/AdminPage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(admin, /publicAuthRefresh|location\.reload/);
});

test('unconfigured auth remains unavailable rather than simulating signup or session persistence', async () => {
  const view = await mountApp({ configured: false });
  assert.equal(await view.nav().onPublicSignIn('input', 'input'), false);
  assert.equal(await view.nav().onPublicSignUp('input', 'input', 'input'), 'failed');
  assert.equal(view.calls.login + view.calls.signup, 0);
  assert.equal(view.reloads, 0);
});
