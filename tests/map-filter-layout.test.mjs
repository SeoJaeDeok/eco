import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as filters from '../src/utils/observationFilters.ts';
import { createMapFilterLayoutFixture } from './fixtures/map-filter-layout.mjs';

// Component/effect contract harness, not React DOM, CSS geometry or a browser.
const mountMap = async (fixture) => {
  const instances = new Map();
  const effects = [];
  let current;
  let dirty = false;
  let tree;
  let focusPath;
  let nextId = 0;
  let mapMounts = 0;
  let mapUnmounts = 0;
  let observations = fixture.observations;
  const selected = [];
  const equalDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const state = (initial) => {
    const frame = current;
    const index = frame.cursor++;
    frame.slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
    return [frame.slots[index].value, (next) => {
      const value = typeof next === 'function' ? next(frame.slots[index].value) : next;
      if (!Object.is(value, frame.slots[index].value)) dirty = true;
      frame.slots[index].value = value;
    }];
  };
  const react = {
    useState: state,
    useId: () => state(() => `layout-test-${++nextId}`)[0],
    useMemo(factory, deps) {
      const index = current.cursor++;
      if (!equalDeps(current.slots[index]?.deps, deps)) current.slots[index] = { value: factory(), deps };
      return current.slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const frame = current;
      const index = frame.cursor++;
      if (!equalDeps(frame.slots[index]?.deps, deps)) effects.push(() => {
        frame.slots[index]?.cleanup?.();
        frame.slots[index] = { deps, cleanup: callback() };
      });
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const stubs = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'lucide-react': Object.fromEntries(['ChevronDown', 'ChevronUp', 'ChevronRight', 'Loader2', 'RotateCw', 'X', 'Search'].map((name) => [name, name])),
    '../constants/taxon': { TAXA: ['식물', '조류'] },
    '../repositories/taxonomyTreeRepositoryProvider': { activeTaxonomyTreeRepository: fixture.repository },
    '../utils/observationFilters': filters,
    './MapPreview': { MapPreview: (props) => {
      react.useEffect(() => { mapMounts++; return () => { mapUnmounts++; }; }, []);
      return jsx('map-preview', props);
    } },
  };
  const sources = {
    './MapPage': 'src/components/MapPage.tsx',
    './map/TaxonomyTreePanel': 'src/components/map/TaxonomyTreePanel.tsx',
    './ui/SearchInput': 'src/components/ui/SearchInput.tsx',
    './ui/TaxonFilterButton': 'src/components/ui/TaxonFilterButton.tsx',
  };
  const load = (name) => {
    if (stubs[name]) return stubs[name];
    assert.ok(sources[name], 'Only explicit local component imports are allowed');
    const file = sources[name];
    const source = process.env.MAP_FILTER_SOURCE_REV
      ? execFileSync('git', ['show', `${process.env.MAP_FILTER_SOURCE_REV}:${file}`], { encoding: 'utf8' })
      : readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    });
    const exports = {};
    runInNewContext(outputText, { exports, require: load });
    stubs[name] = exports;
    return exports;
  };
  const Page = load('./MapPage').MapPage;
  const renderNode = (node, path = 'root', parent = null) => {
    if (node === null || node === undefined || typeof node === 'boolean') return null;
    if (Array.isArray(node)) return node.map((child, i) => renderNode(child, `${path}.${child?.key ?? i}`, parent));
    if (typeof node !== 'object') return node;
    if (typeof node.type === 'function') {
      let frame = instances.get(path);
      if (!frame || frame.type !== node.type) {
        frame?.slots.forEach((slot) => slot.cleanup?.());
        frame = { type: node.type, cursor: 0, slots: [] };
        instances.set(path, frame);
      }
      frame.seen = true;
      frame.cursor = 0;
      current = frame;
      return renderNode(node.type(node.props), `${path}.render`, parent);
    }
    const result = { ...node, path, parent };
    result.children = renderNode(node.props.children, `${path}.children`, result);
    return result;
  };
  const render = () => {
    dirty = false;
    instances.forEach((frame) => { frame.seen = false; });
    tree = renderNode(jsx(Page, { observations, onSelect: (record) => selected.push(record.id) }));
    for (const [path, frame] of instances) {
      if (!frame.seen) { frame.slots.forEach((slot) => slot.cleanup?.()); instances.delete(path); }
    }
    effects.splice(0).forEach((effect) => effect());
  };
  const settle = async () => {
    for (let step = 0; step < 25; step++) {
      await new Promise((resolve) => setImmediate(resolve));
      if (!dirty) return;
      render();
    }
    assert.fail('Effects failed to settle (possible automatic retry loop)');
  };
  const nodes = (predicate, includeHidden = false) => {
    const result = [];
    const walk = (node, hidden = false) => {
      if (Array.isArray(node)) { node.forEach((child) => walk(child, hidden)); return; }
      if (!node || typeof node !== 'object') return;
      const isHidden = hidden || node.props.hidden === true;
      if ((includeHidden || !isHidden) && predicate(node)) result.push(node);
      walk(node.children, isHidden);
    };
    walk(tree);
    return result;
  };
  const text = (node) => {
    if (Array.isArray(node)) return node.map(text).join('');
    if (node && typeof node === 'object') return text(node.children);
    return node == null ? '' : String(node);
  };
  const button = (label) => {
    const found = nodes((node) => node.type === 'button' && (node.props['aria-label'] === label || text(node).includes(label)));
    assert.equal(found.length, 1, 'Expected one visible matching button');
    return found[0];
  };
  render();
  await settle();
  return {
    nodes, text, button, settle, selected,
    get mapMounts() { return mapMounts; }, get mapUnmounts() { return mapUnmounts; },
    get focusPath() { return focusPath; },
    map: () => nodes((node) => node.type === 'map-preview')[0],
    // A hidden-ancestor focus contract, not a browser Tab-order measurement.
    focusable: () => nodes((node) => !node.props.disabled && node.props.tabIndex !== -1 && (
      ['button', 'input', 'select', 'textarea'].includes(node.type)
      || (node.type === 'a' && node.props.href)
      || node.props.tabIndex >= 0
    )),
    async updateObservations(next) { observations = next; render(); await settle(); },
    async click(node) { node.props.onClick({ currentTarget: { focus() { focusPath = node.path; } } }); await settle(); },
    async search(value) { nodes((node) => node.type === 'input')[0].props.onChange({ target: { value } }); await settle(); },
  };
};

const openPath = async (view, fixture) => {
  await view.click(view.button('분류 탐색'));
  for (const name of fixture.names.slice(0, 6)) await view.click(view.button(`${name} 하위 분류 펼치기`));
};
const ids = (view) => Array.from(view.map().props.observations, (record) => record.id);
const resultButtons = (view, includeHidden = false) => view.nodes(
  (node) => node.type === 'button' && node.props.className?.includes('min-h-12'), includeHidden,
);
const resultCounts = (view, includeHidden = false) => view.nodes(
  (node) => node.type === 'p' && view.text(node).startsWith('표시 중 '), includeHidden,
);
const resultHeadings = (view, includeHidden = false) => view.nodes(
  (node) => node.type === 'p' && view.text(node) === '관찰 목록', includeHidden,
);

test('outer disclosure keeps filters, loaded branches, result IDs and map mount intact', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  await openPath(view, fixture);
  await view.search('Taraxacum');
  await view.click(view.nodes((node) => node.type === 'button' && node.props.className?.includes('max-w-full') && view.text(node).startsWith('layout-short'))[0]);
  await view.click(view.nodes((node) => node.type === 'button' && node.props['aria-pressed'] !== undefined && view.text(node).startsWith('식물'))[0]);
  await view.click(view.button('계Plantae'));
  const before = ids(view);
  const mapArray = view.map().props.observations;
  const calls = { ...fixture.calls };
  assert.equal(resultCounts(view).length, 1);
  assert.equal(resultHeadings(view).length, 1);
  assert.equal(resultButtons(view).length, before.length);
  await view.click(resultButtons(view)[0]);
  const toggle = view.button('필터 접기');
  const regionIds = toggle.props['aria-controls'].split(' ');
  await view.click(toggle);
  assert.equal(view.focusPath, toggle.path);
  assert.equal(view.button('필터 열기').props['aria-expanded'], false);
  for (const regionId of regionIds) {
    assert.equal(view.nodes((node) => node.props.id === regionId, true)[0].props.hidden, true);
  }
  assert.equal(view.nodes((node) => node.type === 'input').length, 0);
  assert.ok(view.button('전체 보기'));
  assert.ok(view.button('분류 필터 해제'));
  const summary = view.nodes((node) => node.props['aria-label'] === '적용 중인 필터')[0];
  assert.match(view.text(summary), /검색: layout-short.*선택 종: layout-short.*분류군: 식물/);
  assert.deepEqual(ids(view), before);
  assert.equal(view.map().props.observations, mapArray);
  assert.equal(resultCounts(view).length, 0);
  assert.equal(resultHeadings(view).length, 0);
  assert.equal(resultButtons(view).length, 0);
  assert.equal(resultCounts(view, true).length, 1);
  assert.equal(resultHeadings(view, true).length, 1);
  assert.equal(resultButtons(view, true).length, before.length);
  const focusablePaths = new Set(view.focusable().map((node) => node.path));
  assert.ok(resultButtons(view, true).every((node) => !focusablePaths.has(node.path)));
  assert.deepEqual(view.selected, [before[0]]);
  await view.click(view.button('필터 열기'));
  assert.equal(view.button('Taraxacum 하위 분류 접기').props['aria-expanded'], true);
  assert.equal(view.nodes((node) => node.type === 'input')[0].props.value, 'layout-short');
  assert.equal(resultCounts(view).length, 1);
  assert.equal(resultHeadings(view).length, 1);
  assert.equal(resultButtons(view).length, before.length);
  assert.deepEqual(ids(view), before);
  assert.deepEqual(view.selected, [before[0]]);
  assert.deepEqual(fixture.calls, calls);
  assert.equal(view.mapMounts, 1);
  assert.equal(view.mapUnmounts, 0);
});

test('chip clear and full reset work while collapsed without resetting the tree', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  await openPath(view, fixture);
  await view.search('Legacy');
  await view.click(view.nodes((node) => node.type === 'button' && node.props['aria-pressed'] !== undefined && view.text(node).startsWith('식물'))[0]);
  await view.click(view.button('계Plantae'));
  assert.equal(ids(view).length, 0);
  await view.click(view.button('필터 접기'));
  await view.click(view.button('분류 필터 해제'));
  assert.deepEqual(ids(view), ['layout-legacy']);
  await view.click(view.button('전체 보기'));
  assert.equal(ids(view).length, 5);
  assert.ok(!ids(view).includes('layout-pending') && !ids(view).includes('layout-rejected'));
  assert.equal(view.button('필터 열기').props['aria-expanded'], false);
  assert.equal(view.nodes((node) => node.props['aria-label'] === '적용 중인 필터').length, 0);
  assert.equal(view.nodes((node) => node.type === 'p' && view.text(node) === '전체 관찰').length, 0);
  await view.click(view.button('필터 열기'));
  assert.equal(view.button('Taraxacum 하위 분류 접기').props['aria-expanded'], true);
  assert.equal(fixture.calls.roots, 1);
  assert.equal(fixture.calls.children, 6);
});

test('hidden results use fresh observation props without refetching taxonomy or clearing selection', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  await openPath(view, fixture);
  await view.search('layout-short');
  await view.click(view.button('계Plantae'));
  assert.deepEqual(ids(view), ['layout-short']);
  await view.click(resultButtons(view)[0]);
  const calls = { ...fixture.calls };
  await view.click(view.button('필터 접기'));
  await view.updateObservations(fixture.updatedObservations);
  assert.deepEqual(ids(view), ['layout-long']);
  assert.equal(resultButtons(view).length, 0);
  assert.equal(resultCounts(view).length, 0);
  assert.deepEqual(view.selected, ['layout-short']);
  assert.deepEqual(fixture.calls, calls);
  await view.click(view.button('필터 열기'));
  assert.deepEqual(ids(view), ['layout-long']);
  assert.match(view.text(resultCounts(view)[0]), /^표시 중 1건/);
  assert.match(view.text(resultButtons(view)[0]), /^layout-short updated/);
  assert.equal(view.nodes((node) => node.type === 'input')[0].props.value, 'layout-short');
  assert.equal(view.button('Taraxacum 하위 분류 접기').props['aria-expanded'], true);
  await view.click(resultButtons(view)[0]);
  assert.deepEqual(view.selected, ['layout-short', 'layout-long']);
  assert.deepEqual(fixture.calls, calls);
  assert.equal(view.mapMounts, 1);
  assert.equal(view.mapUnmounts, 0);
});

test('empty-result feedback also hides and restores with the existing disclosure', async () => {
  const view = await mountMap(createMapFilterLayoutFixture());
  await view.search('no-matching-fixture');
  const emptyMessages = (includeHidden = false) => view.nodes(
    (node) => node.type === 'p' && view.text(node).startsWith('조건에 맞는 등록 관찰 기록이 없습니다.'), includeHidden,
  );
  assert.equal(emptyMessages().length, 1);
  assert.match(view.text(resultCounts(view)[0]), /^표시 중 0건/);
  await view.click(view.button('필터 접기'));
  assert.equal(emptyMessages().length, 0);
  assert.equal(emptyMessages(true).length, 1);
  assert.equal(resultCounts(view).length, 0);
  assert.deepEqual(ids(view), []);
  await view.click(view.button('전체 보기'));
  assert.equal(ids(view).length, 5);
  assert.equal(resultButtons(view).length, 0);
  await view.click(view.button('필터 열기'));
  assert.equal(emptyMessages().length, 0);
  assert.equal(resultButtons(view).length, 5);
  assert.match(view.text(resultCounts(view)[0]), /^표시 중 5건/);
});

test('seven-rank rows bound total indentation and retain full labels, counts and separate actions', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  const before = ids(view);
  await openPath(view, fixture);
  assert.deepEqual(ids(view), before);
  assert.equal(fixture.calls.selection, 0);
  const rows = view.nodes((node) => node.props.style?.paddingLeft !== undefined);
  const contentId = view.button('분류 탐색').props['aria-controls'];
  assert.equal(rows.length, 9);
  assert.ok(rows.every((row) => parseFloat(row.props.style.paddingLeft) <= 1.5));
  for (const row of rows) {
    for (let parent = row.parent; parent?.props.id !== contentId; parent = parent.parent) {
      assert.ok(parent);
      assert.doesNotMatch(parent.props.className ?? '', /(?:^|\s)(?:ml|pl|px)-[1-9]/);
    }
  }
  const selections = view.nodes((node) => node.type === 'button' && node.props.className?.includes('grid-cols-'));
  assert.equal(selections.length, 9);
  assert.deepEqual(selections.slice(0, 7).map((node) => view.text(node).charAt(0)), ['계', '문', '강', '목', '과', '속', '종']);
  for (const node of selections) {
    assert.match(node.props.className, /minmax\(0,1fr\)/);
    assert.match(view.text(node), /12345$/);
  }
  for (const name of [fixture.longName, fixture.unbrokenName]) {
    const label = view.nodes((node) => node.type === 'span' && view.text(node) === name)[0];
    assert.match(label.props.className, /overflow-wrap:anywhere/);
    assert.doesNotMatch(label.props.className, /truncate/);
  }
  await view.click(view.button(`종${fixture.unbrokenName}`));
  assert.deepEqual(ids(view), ['layout-unbroken']);
  assert.equal(resultButtons(view).length, 1);
});

test('outer visibility alone does not load taxonomy or call observation selection', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  const before = view.map().props.observations;
  assert.equal(resultCounts(view).length, 1);
  assert.equal(resultButtons(view).length, before.length);
  await view.click(view.button('필터 접기'));
  assert.equal(view.nodes((node) => node.type === 'h1' && view.text(node) === '생태지도 검색').length, 1);
  assert.equal(view.button('필터 열기').props['aria-expanded'], false);
  assert.equal(view.nodes((node) => node.type === 'p' && view.text(node) === '전체 관찰').length, 0);
  assert.equal(view.nodes((node) => node.props['aria-label'] === '적용 중인 필터').length, 0);
  assert.equal(resultCounts(view).length, 0);
  assert.equal(resultButtons(view).length, 0);
  assert.equal(view.map().props.observations, before);
  await view.click(view.button('필터 열기'));
  assert.equal(resultCounts(view).length, 1);
  assert.equal(resultButtons(view).length, before.length);
  assert.equal(view.button('분류 탐색').props['aria-expanded'], false);
  assert.deepEqual(fixture.calls, { roots: 0, children: 0, selection: 0 });
  assert.equal(view.map().props.observations, before);
  assert.deepEqual(view.selected, []);
  assert.equal(view.mapMounts, 1);
});

test('disclosures link to mounted regions and hide descendants without role tree or nested buttons', async () => {
  const fixture = createMapFilterLayoutFixture();
  const view = await mountMap(fixture);
  await openPath(view, fixture);
  for (const node of view.nodes((node) => node.props['aria-expanded'] !== undefined)) {
    assert.equal(node.type, 'button');
    assert.equal(node.props.type, 'button');
    assert.match(node.props.className, /focus-visible:/);
    for (const regionId of node.props['aria-controls'].split(' ')) {
      assert.equal(view.nodes((region) => region.props.id === regionId, true).length, 1);
    }
  }
  for (const node of view.nodes((node) => node.type === 'button')) {
    for (let parent = node.parent; parent; parent = parent.parent) assert.notEqual(parent.type, 'button');
  }
  assert.equal(view.nodes((node) => node.props.role === 'tree').length, 0);
  const toggle = view.button('Plantae 하위 분류 접기');
  await view.click(toggle);
  assert.equal(view.focusPath, toggle.path);
  assert.equal(view.nodes((node) => node.props.className?.includes('grid-cols-')).length, 1);
  await view.click(view.button('Plantae 하위 분류 펼치기'));
  assert.equal(view.nodes((node) => node.props.className?.includes('grid-cols-')).length, 9);
  assert.equal(fixture.calls.children, 6);
});

test('pending child requests survive outer collapse and are not fetched again', async () => {
  const fixture = createMapFilterLayoutFixture();
  const original = fixture.repository.getChildren;
  let resolveChildren;
  fixture.repository.getChildren = (parent) => new Promise((resolve) => {
    resolveChildren = async () => resolve(await original(parent));
  });
  const view = await mountMap(fixture);
  await view.click(view.button('분류 탐색'));
  await view.click(view.button('Plantae 하위 분류 펼치기'));
  await view.click(view.button('필터 접기'));
  await resolveChildren();
  await view.settle();
  await view.click(view.button('필터 열기'));
  assert.ok(view.button('문Tracheophyta'));
  assert.equal(fixture.calls.children, 1);
});

test('root error waits for explicit retry and empty roots remain a visible state', async () => {
  const fixture = createMapFilterLayoutFixture();
  let attempts = 0;
  fixture.repository.getRootNodes = async () => {
    attempts++;
    if (attempts === 1) throw new Error('Synthetic failure');
    return [];
  };
  const view = await mountMap(fixture);
  await view.click(view.button('분류 탐색'));
  assert.equal(attempts, 1);
  await view.click(view.button('필터 접기'));
  await view.click(view.button('필터 열기'));
  assert.equal(attempts, 1);
  await view.click(view.button('다시'));
  assert.equal(attempts, 2);
  assert.ok(view.nodes((node) => node.type === 'p' && view.text(node) === '분류 정보가 연결된 관찰이 아직 없습니다.').length);
});
