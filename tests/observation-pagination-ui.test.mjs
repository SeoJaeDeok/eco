import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as pagination from '../src/utils/observationPagination.ts';
import * as taxa from '../src/constants/taxon.ts';
import * as pageTransition from '../src/utils/pageTransition.ts';
import * as stats from '../src/utils/observationStats.ts';
import { createPaginationObservations } from './fixtures/observation-pagination.mjs';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const emptyAuth = { user: null, profile: null, isAdmin: false };

// Real App -> AppRoutes -> ObservationListPage orchestration, injected I/O and shallow leaf UI.
// Not a real DOM, layout, navigation or Supabase session test.
const mount = async ({ initialPage = 'observations', pageRead, observations = createPaginationObservations(), signedIn = false, admin = false,
  reducedMotion = false, autoFinishExit = true, imageRead = async () => {}, summaryRead, actualNavbar = false } = {}) => {
  const instances = new Map(), effects = [], calls = { all: 0, count: 0, summary: [], pages: [], details: [], updates: [], adminUpdates: [], prefetch: [], mounts: [], scrolls: [], windowScrolls: [], focuses: [] };
  let current, dirty = false, tree;
  const rows = observations;
  const repository = {
    async getPublicObservationSummary(signal) {
      calls.summary.push(signal);
      if (summaryRead) return summaryRead(signal, calls.summary.length);
      const approved = rows.filter((row) => row.status === 'approved');
      return { observationCount: approved.length, uniqueSpeciesCount: stats.countUniqueSpecies(approved) };
    },
    async listObservations() { calls.all++; return [...rows]; },
    async countUniqueSpecies() { calls.count++; return 1; },
    async listPublicObservationsPage(query, signal) {
      calls.pages.push({ query, signal });
      return pageRead ? pageRead(query, signal, calls.pages.length) : pagination.paginateMockObservations(rows, query);
    },
    async getObservationById(id) { calls.details.push(id); return rows.find((row) => row.id === id) ?? null; },
    async updateOwnObservation(id, input) {
      calls.updates.push(id); const index = rows.findIndex((row) => row.id === id);
      rows[index] = { ...rows[index], ...input }; return rows[index];
    },
  };
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const frame = current, index = frame.cursor++;
      frame.slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [frame.slots[index].value, (next) => {
        const value = typeof next === 'function' ? next(frame.slots[index].value) : next;
        if (!Object.is(value, frame.slots[index].value)) dirty = true;
        frame.slots[index].value = value;
      }];
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
    useMemo(factory, deps) {
      const index = current.cursor++;
      if (!equal(current.slots[index]?.deps, deps)) current.slots[index] = { value: factory(), deps };
      return current.slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const frame = current, index = frame.cursor++;
      if (!equal(frame.slots[index]?.deps, deps)) effects.push(() => {
        frame.slots[index]?.cleanup?.(); frame.slots[index] = { deps, cleanup: callback() };
      });
    },
    lazy: () => 'admin', Suspense: 'suspense',
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const root = fileURLToPath(new URL('../src/', import.meta.url));
  const path = (name) => resolve(root, name);
  const components = ['App.tsx', 'components/Navbar.tsx', 'components/AppRoutes.tsx', 'components/ObservationListPage.tsx',
    'components/observations/ObservationListHeader.tsx', 'components/observations/ObservationTaxonFilter.tsx',
    'components/observations/ObservationPagination.tsx', 'components/ui/TaxonFilterButton.tsx', 'components/ui/SearchInput.tsx'];
  const modules = new Map([
    [path('constants/taxon'), taxa], [path('utils/observationPagination'), pagination],
    [path('utils/pageTransition'), pageTransition],
    [path('repositories/observationRepositoryProvider'), { activeObservationRepository: repository, getConfiguredObservationRepositoryKind: () => 'mock' }],
    [path('repositories/adminObservationRepositoryProvider'), { activeAdminObservationRepository: {
      async updateObservationAsAdmin(id, input) {
        calls.adminUpdates.push(id); const index = rows.findIndex((row) => row.id === id);
        rows[index] = { ...rows[index], ...input }; return rows[index];
      },
    } }],
    [path('repositories/authRepositoryProvider'), { activeAuthRepository: { getSessionState: async () => signedIn ? { ...emptyAuth, isAdmin: admin, user: { id: 'fixture-owner' } } : emptyAuth }, getConfiguredAuthRepositoryKind: () => 'mock' }],
    [path('features/auth/publicAuthRefresh'), { AUTH_REFRESH_NOTICES: {}, createPublicAuthRefresh: () => ({}) }],
    [path('utils/observationStats'), { countUniqueSpecies: (items) => new Set(items.map((item) => item.name)).size }],
    [path('utils/observerDisplay'), { normalizeObserverDisplayName: () => undefined }],
    [path('utils/observationImagePrefetch'), {
      prefetchObservationImages: async (items) => { calls.prefetch.push(items.map((item) => item.id)); await imageRead(items); },
      prefetchObservationImage: async () => {}, withCachedObservationImageUrl: (item) => item,
    }],
    ...[['Navbar', 'navbar'], ['auth/PublicLoginPanel', 'login-panel'], ['Hero', 'hero'], ['IntroPage', 'intro'], ['MapPage', 'map'], ['UploadMockPage', 'upload'],
      ['ObservationDetail', 'detail'], ['auth/UploadLoginGate', 'gate'], ['observations/ObservationGrid', 'grid']]
      .map(([name, value]) => [path(`components/${name}`), { [name.split('/').at(-1)]: value }]),
  ]);
  // This is an I/O spy, not browser scroll geometry or native scroll anchoring.
  const window = {
    location: { hash: '', pathname: '/', search: '' }, scrollX: 0, scrollY: 0,
    scrollTo(options) { calls.windowScrolls.push(options); window.scrollY = options.top ?? window.scrollY; window.scrollX = options.left ?? window.scrollX; },
    addEventListener() {}, removeEventListener() {},
  };
  const load = (file) => {
    if (modules.has(file)) return modules.get(file);
    const actual = file.endsWith('.tsx') ? file : `${file}.tsx`;
    assert.ok(components.some((name) => path(name) === actual), 'Only reviewed app modules loaded');
    const exports = {};
    const { outputText } = ts.transpileModule(readFileSync(actual, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    });
    runInNewContext(outputText, { exports, window, AbortController, require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
      if (name === 'motion/react') return { AnimatePresence: 'animate', motion: { div: 'motion-div' }, useReducedMotion: () => reducedMotion };
      if (name === 'lucide-react') return { Menu: 'menu-icon', X: 'close-icon', Search: 'search-icon', RotateCw: 'reload-icon', ChevronLeft: 'left', ChevronRight: 'right' };
      return load(resolve(dirname(actual), name));
    } });
    modules.set(file, exports); return exports;
  };
  if (actualNavbar) {
    const Navbar = load(path('components/Navbar.tsx')).Navbar;
    modules.set(path('components/Navbar'), { Navbar: (props) => jsx('navbar', { ...props, children: jsx(Navbar, props) }) });
  }
  const App = load(path('App.tsx')).default;
  const renderNode = (node, location = 'root') => {
    if (Array.isArray(node)) return node.map((child, i) => renderNode(child, `${location}.${child?.key ?? i}`));
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') {
      let frame = instances.get(location);
      if (!frame || frame.type !== node.type) {
        frame?.slots.forEach((slot) => slot.cleanup?.());
        frame = { type: node.type, slots: [], cursor: 0 }; instances.set(location, frame);
        calls.mounts.push(node.type.name);
      }
      frame.seen = true; frame.cursor = 0; current = frame;
      return renderNode(node.type(node.props), `${location}.render`);
    }
    if (node.props.ref && typeof node.props.ref === 'object') {
      node.props.ref.current = {
        scrollIntoView: (options) => { calls.scrolls.push(options); window.scrollY = 0; },
        focus: (options) => calls.focuses.push(options),
      };
    }
    return { ...node, children: renderNode(node.props.children, `${location}.children`) };
  };
  const render = () => {
    dirty = false; instances.forEach((frame) => { frame.seen = false; });
    tree = renderNode(jsx(App, { authRefreshReturn: { page: initialPage, notice: null } }));
    for (const [key, frame] of instances) if (!frame.seen) {
      frame.slots.forEach((slot) => slot.cleanup?.()); instances.delete(key);
    }
    effects.splice(0).forEach((effect) => effect());
  };
  const settle = async () => {
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setImmediate(resolve));
      const exiting = transitionNode();
      if (autoFinishExit && exiting?.props.animate.opacity === 0) {
        exiting.props.onAnimationComplete(exiting.props.animate);
      }
      if (!dirty) return;
      render();
    }
    assert.fail('Effects failed to settle');
  };
  const nodes = (predicate) => {
    const found = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) found.push(node);
      visit(node.children);
    }; visit(tree); return found;
  };
  const text = (node) => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object'
    ? text(node.children) : node == null || typeof node === 'boolean' ? '' : String(node);
  const button = (name) => {
    const found = nodes((node) => node.type === 'button' && (node.props['aria-label'] === name || text(node) === name));
    assert.equal(found.length, 1, 'Expected one action'); return found[0];
  };
  const transitionNode = () => nodes((node) => node.type === 'motion-div' && node.props.onAnimationComplete)[0];
  render(); await settle();
  return {
    calls, nodes, text, button, settle, render, transitionNode,
    userScroll(x, y) { window.scrollX = x; window.scrollY = y; },
    scrollPosition: () => [window.scrollX, window.scrollY],
    async finishExit() { const node = transitionNode(); node.props.onAnimationComplete(node.props.animate); await settle(); },
    async setReducedMotion(value) { reducedMotion = value; dirty = true; await settle(); },
    grid: () => nodes((node) => node.type === 'grid')[0]?.props,
    async click(name, detail = 1) { const node = button(name); assert.ok(!node.props.disabled); node.props.onClick({ detail }); await settle(); },
    async search(value) { nodes((node) => node.type === 'input')[0].props.onChange({ target: { value } }); await settle(); },
    async navigate(page) { nodes((node) => node.type === 'navbar')[0].props.onNavigate(page); await settle(); },
    unmount() { instances.forEach((frame) => frame.slots.forEach((slot) => slot.cleanup?.())); },
  };
};

test('App restored list requests a page and independent narrow summary, never full collection or old species read', async () => {
  const view = await mount();
  assert.equal(view.calls.all, 0); assert.equal(view.calls.count, 0);
  assert.equal(view.grid().observations.length, 20);
  assert.equal(view.calls.prefetch[0].length, 20);
  assert.equal(view.nodes((node) => node.type === 'navbar')[0].props.publicSummary.observationCount, 47);
  await view.navigate('map');
  assert.equal(view.calls.all, 1);
  assert.equal(view.nodes((node) => node.type === 'navbar')[0].props.publicSummary.observationCount, 47);
  assert.equal(view.nodes((node) => node.type === 'map')[0].props.observations.length, 47);
  await view.navigate('intro');
  assert.equal(view.nodes((node) => node.type === 'intro')[0].props.observations.length, 47);
  assert.equal(view.calls.all, 1);
  await view.navigate('observations');
  assert.equal(view.calls.all, 1); assert.equal(view.calls.count, 0);
  assert.equal(view.calls.summary.length, 1);
});

test('actual Navbar preserves global summary across routes, page two, filters and selected detail', async () => {
  const view = await mount({ actualNavbar: true, initialPage: 'intro' });
  const summary = () => view.nodes((node) => node.props.role === 'status').map(view.text).find((text) => text.includes('SPECIES'));
  assert.equal(summary(), '2 SPECIES / 47 RECORDS');
  await view.navigate('observations'); await view.click('다음 페이지');
  assert.equal(summary(), '2 SPECIES / 47 RECORDS');
  view.grid().onSelectObservation(view.grid().observations[0]); await view.settle();
  view.nodes((node) => node.type === 'detail')[0].props.onClose(); await view.settle();
  assert.equal(view.calls.pages.at(-1).query.page, 2);
  await view.search('뒤 페이지 수국');
  assert.equal(view.grid().observations.length, 1);
  assert.equal(summary(), '2 SPECIES / 47 RECORDS');
  await view.click('사진 없음');
  assert.equal(summary(), '2 SPECIES / 47 RECORDS');
  await view.navigate('map');
  assert.equal(summary(), '2 SPECIES / 47 RECORDS');
  assert.equal(view.calls.summary.length, 1);
});

test('fresh/restored list mounts render actual summary without visiting collection screens', async () => {
  for (let visit = 0; visit < 2; visit++) {
    const view = await mount({ actualNavbar: true });
    assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '2 SPECIES / 47 RECORDS'));
    assert.equal(view.calls.all, 0); assert.equal(view.calls.count, 0);
    assert.equal(view.calls.summary.length, 1);
    assert.deepEqual(view.calls.prefetch.map((items) => items.length), [20]);
    view.unmount();
  }
});

test('actual summary distinguishes loading, failure, retry and verified zero without blocking list', async () => {
  const request = deferred();
  const view = await mount({ actualNavbar: true, summaryRead: (_signal, attempt) => attempt === 1 ? request.promise : Promise.resolve({ observationCount: 0, uniqueSpeciesCount: 0 }) });
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '공개 요약 불러오는 중'));
  assert.equal(view.grid().observations.length, 20);
  request.reject(new Error('fixture')); await view.settle();
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '공개 요약 조회 실패'));
  await view.click('공개 요약 다시 조회');
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '0 SPECIES / 0 RECORDS'));
  assert.equal(view.calls.pages.length, 1);
});

test('summary refresh retains confirmed values, rejects stale results and follows existing edit revision', async () => {
  const second = deferred(), third = deferred();
  const view = await mount({ actualNavbar: true, signedIn: true, summaryRead: (_signal, attempt) => attempt === 1
    ? Promise.resolve({ observationCount: 47, uniqueSpeciesCount: 2 }) : attempt === 2 ? second.promise : third.promise });
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  const edit = view.nodes((node) => node.type === 'detail')[0].props.onUpdateObservation;
  await edit(selected.id, { name: '다른 이름' }); await view.settle();
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('2 SPECIES / 47 RECORDS갱신 중')));
  await edit(selected.id, { name: '또 다른 이름' }); await view.settle();
  assert.equal(view.calls.summary[1].aborted, true);
  third.resolve({ observationCount: 47, uniqueSpeciesCount: 3 }); await view.settle();
  second.resolve({ observationCount: 1, uniqueSpeciesCount: 1 }); await view.settle();
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '3 SPECIES / 47 RECORDS'));
});

test('summary refresh failure labels retained values and navigation does not retry in a loop', async () => {
  const view = await mount({ actualNavbar: true, signedIn: true, summaryRead: (_signal, attempt) => attempt === 1
    ? Promise.resolve({ observationCount: 47, uniqueSpeciesCount: 2 }) : Promise.reject(new Error('fixture')) });
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  await view.nodes((node) => node.type === 'detail')[0].props.onUpdateObservation(selected.id, { name: '수정 이름' });
  await view.settle();
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node) === '2 SPECIES / 47 RECORDS갱신 실패 · 이전 확인값'));
  await view.navigate('map'); await view.navigate('intro'); await view.navigate('observations');
  assert.equal(view.calls.summary.length, 2);
  assert.ok(view.button('공개 요약 다시 조회'));
});

test('page controls show exact range, final count and preserve the page across detail open/close', async () => {
  const view = await mount();
  assert.equal(view.button('이전 페이지').props['aria-disabled'], true);
  await view.click('다음 페이지');
  assert.equal(view.calls.pages.at(-1).query.page, 2);
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('21–40')));
  const selected = view.grid().observations[3];
  view.grid().onSelectObservation(selected); await view.settle();
  const detail = view.nodes((node) => node.type === 'detail')[0];
  assert.equal(detail.props.observation.id, selected.id);
  assert.deepEqual(view.calls.details, [selected.id]);
  detail.props.onClose(); await view.settle();
  assert.equal(view.calls.pages.length, 2);
  assert.equal(view.calls.all, 0);
  await view.click('다음 페이지');
  assert.equal(view.grid().observations.length, 7);
  assert.equal(view.button('다음 페이지').props['aria-disabled'], true);
});

test('search, taxon, image and sort changes reset page one; zero has no invalid range/navigation', async () => {
  for (const change of [(view) => view.search('같은'), (view) => view.click('식물'), (view) => view.click('사진 있음'), (view) => view.click('관찰명순')]) {
    const view = await mount();
    await view.click('다음 페이지'); await change(view);
    assert.equal(view.calls.pages.at(-1).query.page, 1);
    view.unmount();
  }
  const view = await mount();
  await view.search('검색 결과 없음');
  assert.equal(view.grid().observations.length, 0);
  assert.equal(view.nodes((node) => node.type === 'nav').length, 0);
  const messages = view.nodes((node) => node.props.role === 'status').map(view.text).join('');
  assert.match(messages, /총 0개/); assert.doesNotMatch(messages, /1–0|1 \/ 0/);
});

test('a late successful page response cannot overwrite newer search results', async () => {
  const old = deferred();
  const records = createPaginationObservations();
  const view = await mount({ pageRead: (query, _signal, index) => index === 1 ? old.promise
    : Promise.resolve(pagination.paginateMockObservations(records, query)) });
  await view.search('수국');
  old.resolve(pagination.paginateMockObservations(records, pagination.DEFAULT_OBSERVATION_PAGE_QUERY));
  await view.settle();
  assert.equal(view.grid().observations.length, 1);
  assert.equal(view.calls.prefetch.length, 1);
});

test('late responses and errors cannot replace newer conditions, and unmount aborts pending requests', async () => {
  const first = deferred(), second = deferred();
  const view = await mount({ pageRead: (_query, _signal, index) => index === 1 ? first.promise : second.promise });
  await view.search('수국');
  assert.equal(view.calls.pages[0].signal.aborted, true);
  second.resolve(pagination.paginateMockObservations(createPaginationObservations(), { ...pagination.DEFAULT_OBSERVATION_PAGE_QUERY, searchQuery: '수국' }));
  await view.settle();
  assert.equal(view.grid().observations.length, 1);
  first.reject(new Error('Stale failure')); await view.settle();
  assert.equal(view.grid().observations.length, 1);
  assert.equal(view.nodes((node) => node.props.role === 'alert').length, 0);
  view.unmount(); assert.equal(view.calls.pages.at(-1).signal.aborted, true);
});

test('pending/error page retains inert old cards and page controls with an explicit notice; retry uses same query', async () => {
  const pending = deferred();
  const view = await mount({ pageRead: (query, _signal, index) => index === 2 ? pending.promise
    : Promise.resolve(pagination.paginateMockObservations(createPaginationObservations(), query)) });
  await view.click('다음 페이지');
  assert.equal(view.grid().observations.length, 20);
  assert.equal(view.transitionNode().props.inert, true);
  assert.equal(view.transitionNode().props['aria-hidden'], true);
  assert.equal(view.button('1페이지').props['aria-current'], 'page');
  assert.equal(view.button('다음 페이지').props['aria-disabled'], true);
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('불러오는')));
  pending.reject(new Error('Synthetic failure')); await view.settle();
  assert.equal(view.grid().observations.length, 20);
  assert.equal(view.transitionNode().props.inert, true);
  assert.equal(view.button('1페이지').props['aria-current'], 'page');
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('이전 1페이지')));
  assert.equal(view.nodes((node) => node.props.role === 'alert').length, 1);
  await view.click('다시 시도');
  assert.equal(view.calls.pages.at(-1).query.page, 2);
  assert.equal(view.grid().observations.length, 20);
});

test('owner edit refreshes the current filtered page/count through App without full collection reads', async () => {
  const view = await mount({ signedIn: true });
  await view.search('같은');
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  await view.nodes((node) => node.type === 'detail')[0].props.onUpdateObservation(selected.id, { name: '다른 이름' });
  await view.settle();
  assert.equal(view.calls.updates.length, 1);
  assert.equal(view.calls.pages.at(-1).query.searchQuery, '같은');
  assert.ok(!view.grid().observations.some((row) => row.id === selected.id));
  assert.equal(view.calls.all, 0);
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('총 45개')));
});

test('corrected repository page displays once without triggering an automatic UI request loop', async () => {
  let observations = createPaginationObservations();
  const view = await mount({ pageRead: (query) => Promise.resolve(pagination.paginateMockObservations(observations, query)) });
  await view.click('다음 페이지');
  observations = createPaginationObservations(1);
  await view.click('다음 페이지');
  assert.equal(view.calls.pages.length, 3);
  assert.equal(view.grid().observations.length, 1);
  assert.equal(view.nodes((node) => node.type === 'nav').length, 0);
});

test('existing admin edit callback also invalidates the current list without changing the write path', async () => {
  const view = await mount({ signedIn: true, admin: true });
  await view.search('같은');
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  await view.nodes((node) => node.type === 'detail')[0].props.onUpdateObservation(selected.id, { name: '수정 후 다른 이름' });
  await view.settle();
  assert.equal(view.calls.adminUpdates.length, 1); assert.equal(view.calls.updates.length, 0);
  assert.equal(view.calls.pages.length, 3);
  assert.ok(!view.grid().observations.some((row) => row.id === selected.id));
});

test('large page counts render at most five number buttons, with labelled arrows and aria-current', async () => {
  const view = await mount({ pageRead: () => Promise.resolve({ items: createPaginationObservations(20), page: 100, pageSize: 20, totalCount: 50_000 }) });
  const numbers = view.nodes((node) => node.type === 'button' && /^\d+페이지$/.test(node.props['aria-label'] ?? ''));
  assert.equal(numbers.length, 5);
  assert.equal(numbers.filter((node) => node.props['aria-current'] === 'page').length, 1);
  assert.ok(numbers.every((node) => node.props.type === 'button' && node.props.className.includes('focus-visible')));
});

test('actual route keeps the original wait/fade props; first list data does not run a second entry fade', async () => {
  const view = await mount({ initialPage: 'intro', autoFinishExit: false });
  const route = view.nodes((node) => node.type === 'motion-div' && node.key === 'intro')[0];
  assert.deepEqual(route.props.initial, { opacity: 0 });
  assert.deepEqual(route.props.animate, { opacity: 1 });
  assert.deepEqual(route.props.exit, { opacity: 0 });
  assert.equal(route.props.transition, undefined);
  assert.ok(view.nodes((node) => node.type === 'animate' && node.props.mode === 'wait').length);
  await view.navigate('observations');
  assert.equal(view.grid().observations.length, 20);
  assert.equal(view.transitionNode().props.initial, false);
  assert.equal(view.transitionNode().props.animate, pageTransition.PAGE_FADE.animate);
  assert.equal(view.transitionNode().props.transition.duration, 0);
});

test('next/number/previous fade only ready results, then atomically commit cards, range, count and page', async () => {
  const view = await mount({ autoFinishExit: false });
  const sequence = [['다음 페이지', 2, 20, '21–40'], ['3페이지', 3, 7, '41–47'],
    ['이전 페이지', 2, 20, '21–40'], ['1페이지', 1, 20, '1–20']];
  for (const [button, page, count, range] of sequence) {
    const previousIds = view.grid().observations.map((row) => row.id);
    const previousPage = view.nodes((node) => node.type === 'button' && node.props['aria-current'] === 'page')[0].props['aria-label'];
    await view.click(button);
    assert.equal(view.calls.pages.at(-1).query.page, page);
    assert.equal(view.transitionNode().props.animate.opacity, pageTransition.PAGE_FADE.exit.opacity);
    assert.equal(view.transitionNode().props.transition, undefined);
    assert.deepEqual(view.grid().observations.map((row) => row.id), previousIds);
    assert.equal(view.button(previousPage).props['aria-current'], 'page');
    assert.equal(view.transitionNode().props.inert, true);
    assert.equal(view.nodes((node) => node.type === 'grid').length, 1);
    await view.finishExit();
    assert.equal(view.grid().observations.length, count);
    assert.equal(view.button(`${page}페이지`).props['aria-current'], 'page');
    assert.equal(view.transitionNode().props.animate, pageTransition.PAGE_FADE.animate);
    assert.equal(view.transitionNode().props.inert, false);
    assert.equal(view.transitionNode().props.transition, undefined);
    assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes(range) && view.text(node).includes('총 47개')));
  }
  assert.equal(view.calls.pages.length, 5);
  for (const name of ['App', 'AppRoutes', 'ObservationListPage', 'ObservationListHeader', 'ObservationPagination']) {
    assert.equal(view.calls.mounts.filter((value) => value === name).length, 1, `${name} stays mounted`);
  }
});

test('pending request starts immediately, keeps result height/content, blocks duplicate clicks and waits for data not images', async () => {
  const pending = deferred(), image = deferred();
  const rows = createPaginationObservations();
  const view = await mount({ autoFinishExit: false, imageRead: () => image.promise,
    pageRead: (query, _signal, count) => count === 2 ? pending.promise : Promise.resolve(pagination.paginateMockObservations(rows, query)) });
  const click = view.button('다음 페이지').props.onClick;
  click({ detail: 1 }); click({ detail: 1 }); await view.settle();
  assert.equal(view.calls.pages.length, 2);
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  assert.equal(view.grid().observations.length, 20);
  await view.click('3페이지');
  assert.equal(view.calls.pages.length, 2);
  pending.resolve(pagination.paginateMockObservations(rows, view.calls.pages.at(-1).query));
  await view.settle();
  assert.equal(view.transitionNode().props.animate.opacity, 0);
  await view.click('3페이지');
  assert.equal(view.calls.pages.length, 2);
  await view.finishExit();
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  assert.equal(view.calls.prefetch.length, 2);
  image.resolve(); await view.settle();
  assert.equal(view.transitionNode().props.animate.opacity, 1);
});

test('current page, disabled boundaries and ordinary rerenders do not request or replay a fade', async () => {
  const view = await mount({ autoFinishExit: false });
  await view.click('1페이지'); await view.click('이전 페이지');
  assert.equal(view.calls.pages.length, 1);
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  await view.click('3페이지'); await view.finishExit();
  const target = view.transitionNode().props.animate;
  await view.click('다음 페이지'); await view.click('3페이지');
  view.render(); await view.settle();
  assert.equal(view.calls.pages.length, 2);
  assert.equal(view.transitionNode().props.animate, target);
});

test('detail open/close, refreshed image object and entry completion cannot replay the page fade', async () => {
  const view = await mount({ autoFinishExit: false });
  await view.click('다음 페이지'); await view.finishExit();
  const target = view.transitionNode().props.animate;
  const row = view.grid().observations[3];
  view.grid().onSelectObservation({ ...row, imageUrl: '/fixture-image-refresh.jpg' }); await view.settle();
  assert.equal(view.nodes((node) => node.type === 'detail')[0].props.observation.id, row.id);
  assert.equal(view.transitionNode().props.animate, target);
  view.nodes((node) => node.type === 'detail')[0].props.onClose(); await view.settle();
  await view.finishExit(); // An opacity-one completion is not a page commit.
  assert.equal(view.transitionNode().props.animate, target);
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  assert.equal(view.calls.pages.length, 2);
  assert.equal(view.calls.prefetch.length, 2);
});

test('each condition change cancels an exit and rejects its stale completion without animating search results', async () => {
  for (const change of [(view) => view.search('같은'), (view) => view.click('식물'),
    (view) => view.click('사진 있음'), (view) => view.click('관찰명순')]) {
    const view = await mount({ autoFinishExit: false });
    await view.click('다음 페이지');
    const old = view.transitionNode();
    assert.equal(old.props.animate.opacity, 0);
    await change(view);
    const ids = view.grid().observations.map((row) => row.id);
    old.props.onAnimationComplete(old.props.animate); await view.settle();
    assert.deepEqual(view.grid().observations.map((row) => row.id), ids);
    assert.equal(view.calls.pages.at(-1).query.page, 1);
    assert.equal(view.transitionNode().props.animate.opacity, 1);
    assert.equal(view.transitionNode().props.transition.duration, 0);
    assert.equal(view.calls.scrolls.length, 0);
    view.unmount();
  }
});

test('late page response cannot start a fade after a newer search or replace its count', async () => {
  const latePage = deferred();
  const rows = createPaginationObservations();
  const view = await mount({ autoFinishExit: false, pageRead: (query, _signal, index) => index === 2
    ? latePage.promise : Promise.resolve(pagination.paginateMockObservations(rows, query)) });
  await view.click('다음 페이지');
  const oldQuery = view.calls.pages.at(-1).query;
  await view.search('수국');
  latePage.resolve(pagination.paginateMockObservations(rows, oldQuery)); await view.settle();
  assert.equal(view.grid().observations.length, 1);
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  assert.equal(view.calls.prefetch.length, 2);
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('총 1개')));
});

test('failed request does not fade or advance; retry fades only after a successful response', async () => {
  const view = await mount({ autoFinishExit: false, pageRead: (query, _signal, index) => index === 2
    ? Promise.reject(new Error('Synthetic page failure')) : Promise.resolve(pagination.paginateMockObservations(createPaginationObservations(), query)) });
  await view.click('다음 페이지');
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  assert.equal(view.nodes((node) => node.props.role === 'alert').length, 1);
  assert.equal(view.button('1페이지').props['aria-current'], 'page');
  await view.click('다시 시도');
  assert.equal(view.nodes((node) => node.props.role === 'alert').length, 0);
  assert.equal(view.transitionNode().props.animate.opacity, 0);
  await view.finishExit();
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  assert.equal(view.calls.pages.length, 3);
});

test('reduced motion commits pages without any completion event, including when enabled mid-exit', async () => {
  const view = await mount({ autoFinishExit: false, reducedMotion: true });
  await view.click('다음 페이지');
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  assert.equal(view.transitionNode().props.transition.duration, 0);
  await view.setReducedMotion(false);
  await view.click('다음 페이지');
  const old = view.transitionNode();
  assert.equal(old.props.animate.opacity, 0);
  await view.setReducedMotion(true);
  assert.equal(view.grid().observations.length, 7);
  assert.equal(view.button('3페이지').props['aria-current'], 'page');
  old.props.onAnimationComplete(old.props.animate); await view.settle();
  assert.equal(view.calls.pages.length, 3);
  assert.equal(view.transitionNode().props.transition.duration, 0);
});

test('pointer and keyboard page controls never request scrolling or focus transfer and remain mounted', async () => {
  for (const detail of [1, 0]) {
    const view = await mount();
    await view.search('같은');
    const controlMounts = view.calls.mounts.filter((name) => name === 'ObservationPagination').length;
    view.userScroll(0, 720);
    for (const name of ['다음 페이지', '3페이지', '이전 페이지', '1페이지']) {
      await view.click(name, detail);
      assert.deepEqual(view.scrollPosition(), [0, 720]);
      assert.equal(view.calls.scrolls.length, 0);
      assert.equal(view.calls.windowScrolls.length, 0);
      assert.equal(view.calls.focuses.length, 0);
      assert.equal(view.nodes((node) => node.type === 'input')[0].props.value, '같은');
    }
    assert.equal(view.button('이전 페이지').props['aria-disabled'], true);
    assert.equal(view.button('이전 페이지').props.disabled, undefined);
    assert.equal(view.calls.mounts.filter((name) => name === 'ObservationPagination').length, controlMounts);
    view.unmount();
  }
});

test('late page success and fade completion respect manual scrolling after the click, including reduced motion', async () => {
  for (const reducedMotion of [false, true]) {
    const pending = deferred();
    const records = createPaginationObservations();
    const view = await mount({ autoFinishExit: false, reducedMotion,
      pageRead: (query, _signal, index) => index === 2 ? pending.promise : Promise.resolve(pagination.paginateMockObservations(records, query)) });
    view.userScroll(0, 950);
    await view.click('다음 페이지');
    view.userScroll(0, 480);
    pending.resolve(pagination.paginateMockObservations(records, view.calls.pages.at(-1).query));
    await view.settle();
    assert.deepEqual(view.scrollPosition(), [0, 480]);
    if (!reducedMotion) {
      assert.equal(view.transitionNode().props.animate.opacity, 0);
      view.userScroll(0, 610);
      await view.finishExit();
      assert.deepEqual(view.scrollPosition(), [0, 610]);
    }
    assert.equal(view.transitionNode().props.animate.opacity, 1);
    assert.equal(view.button('2페이지').props['aria-current'], 'page');
    assert.equal(view.calls.scrolls.length, 0);
    assert.equal(view.calls.windowScrolls.length, 0);
    assert.equal(view.calls.focuses.length, 0);
    view.unmount();
  }
});

test('failed page and successful retry never request scroll, even when the user moved during the failure', async () => {
  const view = await mount({ autoFinishExit: false,
    pageRead: (query, _signal, index) => index === 2 ? Promise.reject(new Error('Synthetic read failure'))
      : Promise.resolve(pagination.paginateMockObservations(createPaginationObservations(), query)) });
  view.userScroll(0, 650);
  await view.click('다음 페이지');
  assert.equal(view.nodes((node) => node.props.role === 'alert').length, 1);
  assert.deepEqual(view.scrollPosition(), [0, 650]);
  view.userScroll(0, 420);
  await view.click('다시 시도');
  assert.equal(view.transitionNode().props.animate.opacity, 0);
  await view.finishExit();
  assert.deepEqual(view.scrollPosition(), [0, 420]);
  assert.equal(view.calls.scrolls.length, 0);
  assert.equal(view.calls.windowScrolls.length, 0);
  assert.equal(view.calls.focuses.length, 0);
});

test('route navigation still performs its original scroll; pagination and detail do not invoke that route action', async () => {
  const view = await mount({ initialPage: 'intro' });
  view.userScroll(0, 430);
  await view.navigate('observations');
  assert.equal(view.calls.windowScrolls.length, 1);
  assert.equal(view.calls.windowScrolls[0].top, 0);
  assert.equal(view.calls.windowScrolls[0].behavior, 'smooth');
  view.userScroll(0, 640);
  await view.click('다음 페이지');
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  view.nodes((node) => node.type === 'detail')[0].props.onClose(); await view.settle();
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  assert.equal(view.calls.windowScrolls.length, 1);
  assert.equal(view.calls.scrolls.length, 0);
  assert.deepEqual(view.scrollPosition(), [0, 640]);
});

test('obsolete fade completion cannot commit a later page or run after unmount', async () => {
  const view = await mount({ autoFinishExit: false });
  await view.click('다음 페이지'); const first = view.transitionNode();
  await view.finishExit();
  await view.click('다음 페이지'); const latest = view.transitionNode();
  first.props.onAnimationComplete(first.props.animate); await view.settle();
  assert.equal(view.transitionNode().props.animate, latest.props.animate);
  assert.equal(view.button('2페이지').props['aria-current'], 'page');
  view.unmount();
  latest.props.onAnimationComplete(latest.props.animate);
  assert.equal(view.calls.pages.at(-1).signal.aborted, true);
});

test('a later edit refresh does not reuse the completed page-navigation animation intent', async () => {
  const records = createPaginationObservations();
  const view = await mount({ autoFinishExit: false, signedIn: true,
    pageRead: (query, _signal, index) => Promise.resolve(pagination.paginateMockObservations(index > 2 ? records.slice(0, 1) : records, query)) });
  await view.click('다음 페이지'); await view.finishExit();
  const selected = view.grid().observations[0];
  view.grid().onSelectObservation(selected); await view.settle();
  await view.nodes((node) => node.type === 'detail')[0].props.onUpdateObservation(selected.id, { name: '갱신한 관찰' });
  await view.settle();
  assert.equal(view.calls.pages.length, 3);
  assert.equal(view.grid().observations.length, 1);
  assert.equal(view.transitionNode().props.animate.opacity, 1);
  assert.equal(view.transitionNode().props.transition.duration, 0);
});
