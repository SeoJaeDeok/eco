import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as pagination from '../src/utils/observationPagination.ts';
import * as taxa from '../src/constants/taxon.ts';
import { createPaginationObservations } from './fixtures/observation-pagination.mjs';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const emptyAuth = { user: null, profile: null, isAdmin: false };

// Real App -> AppRoutes -> ObservationListPage orchestration, injected I/O and shallow leaf UI.
// Not a real DOM, layout, navigation or Supabase session test.
const mount = async ({ initialPage = 'observations', pageRead, observations = createPaginationObservations(), signedIn = false, admin = false } = {}) => {
  const instances = new Map(), effects = [], calls = { all: 0, count: 0, pages: [], details: [], updates: [], adminUpdates: [], prefetch: [] };
  let current, dirty = false, tree;
  const rows = observations;
  const repository = {
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
  const components = ['App.tsx', 'components/AppRoutes.tsx', 'components/ObservationListPage.tsx',
    'components/observations/ObservationListHeader.tsx', 'components/observations/ObservationTaxonFilter.tsx',
    'components/observations/ObservationPagination.tsx', 'components/ui/TaxonFilterButton.tsx', 'components/ui/SearchInput.tsx'];
  const modules = new Map([
    [path('constants/taxon'), taxa], [path('utils/observationPagination'), pagination],
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
      prefetchObservationImages: async (items) => { calls.prefetch.push(items.map((item) => item.id)); },
      prefetchObservationImage: async () => {}, withCachedObservationImageUrl: (item) => item,
    }],
    ...[['Navbar', 'navbar'], ['Hero', 'hero'], ['IntroPage', 'intro'], ['MapPage', 'map'], ['UploadMockPage', 'upload'],
      ['ObservationDetail', 'detail'], ['auth/UploadLoginGate', 'gate'], ['observations/ObservationGrid', 'grid']]
      .map(([name, value]) => [path(`components/${name}`), { [name.split('/').at(-1)]: value }]),
  ]);
  const window = { location: { hash: '', pathname: '/', search: '' }, scrollTo() {}, addEventListener() {}, removeEventListener() {} };
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
      if (name === 'motion/react') return { AnimatePresence: 'animate', motion: { div: 'motion-div' } };
      if (name === 'lucide-react') return { Search: 'search-icon', RotateCw: 'reload-icon', ChevronLeft: 'left', ChevronRight: 'right' };
      return load(resolve(dirname(actual), name));
    } });
    modules.set(file, exports); return exports;
  };
  const App = load(path('App.tsx')).default;
  const renderNode = (node, location = 'root') => {
    if (Array.isArray(node)) return node.map((child, i) => renderNode(child, `${location}.${child?.key ?? i}`));
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') {
      let frame = instances.get(location);
      if (!frame || frame.type !== node.type) {
        frame?.slots.forEach((slot) => slot.cleanup?.());
        frame = { type: node.type, slots: [], cursor: 0 }; instances.set(location, frame);
      }
      frame.seen = true; frame.cursor = 0; current = frame;
      return renderNode(node.type(node.props), `${location}.render`);
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
  render(); await settle();
  return {
    calls, nodes, text, button, settle, render,
    grid: () => nodes((node) => node.type === 'grid')[0]?.props,
    async click(name) { const node = button(name); assert.ok(!node.props.disabled); node.props.onClick(); await settle(); },
    async search(value) { nodes((node) => node.type === 'input')[0].props.onChange({ target: { value } }); await settle(); },
    async navigate(page) { nodes((node) => node.type === 'navbar')[0].props.onNavigate(page); await settle(); },
    unmount() { instances.forEach((frame) => frame.slots.forEach((slot) => slot.cleanup?.())); },
  };
};

test('App restored list requests only a page, not the collection or species count; routes keep map/intro separate', async () => {
  const view = await mount();
  assert.equal(view.calls.all, 0); assert.equal(view.calls.count, 0);
  assert.equal(view.grid().observations.length, 20);
  assert.equal(view.calls.prefetch[0].length, 20);
  assert.equal(view.nodes((node) => node.type === 'navbar')[0].props.showObservationStats, false);
  await view.navigate('map');
  assert.equal(view.calls.all, 1);
  assert.equal(view.nodes((node) => node.type === 'navbar')[0].props.showObservationStats, true);
  assert.equal(view.nodes((node) => node.type === 'map')[0].props.observations.length, 47);
  await view.navigate('intro');
  assert.equal(view.nodes((node) => node.type === 'intro')[0].props.observations.length, 47);
  assert.equal(view.calls.all, 1);
  await view.navigate('observations');
  assert.equal(view.calls.all, 1); assert.equal(view.calls.count, 0);
});

test('page controls show exact range, final count and preserve the page across detail open/close', async () => {
  const view = await mount();
  assert.equal(view.button('이전 페이지').props.disabled, true);
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
  assert.equal(view.button('다음 페이지').props.disabled, true);
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

test('pending page clears old cards/count; errors offer explicit same-query retry', async () => {
  const pending = deferred();
  const view = await mount({ pageRead: (query, _signal, index) => index === 2 ? pending.promise
    : Promise.resolve(pagination.paginateMockObservations(createPaginationObservations(), query)) });
  await view.click('다음 페이지');
  assert.equal(view.grid(), undefined);
  assert.ok(view.nodes((node) => node.props.role === 'status').some((node) => view.text(node).includes('불러오는')));
  pending.reject(new Error('Synthetic failure')); await view.settle();
  assert.equal(view.grid(), undefined);
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
