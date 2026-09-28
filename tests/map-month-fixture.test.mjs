import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createMapMonthFixture } from './fixtures/map-month-filter.mjs';

const html = readFileSync(new URL('./fixtures/map-month-filter.html', import.meta.url), 'utf8');
const entry = readFileSync(new URL('./fixtures/map-month-filter-browser.mjs', import.meta.url), 'utf8');
const shell = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

const runShell = async (loadModule) => {
  const status = { hidden: false, textContent: 'loading', setAttribute(name, value) { this[name] = value; } };
  const root = {};
  runInNewContext(shell.replace("import('./map-month-filter-browser.mjs')", 'loadModule()'), {
    document: { getElementById: (id) => id === 'root' ? root : status }, loadModule,
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { status, root };
};

test('fixture shell has visible loading copy outside the React root and catches module failure', async () => {
  assert.match(html, /id="fixture-status"[\s\S]*모듈을 불러오는 중/);
  assert.ok(html.indexOf('id="fixture-status"') < html.indexOf('id="root"'));
  const { status } = await runShell(() => Promise.reject(new Error('Synthetic module error')));
  assert.equal(status.hidden, false);
  assert.equal(status.role, 'alert');
  assert.match(status.textContent, /모듈 불러오기 실패/);
  assert.doesNotMatch(status.textContent, /Synthetic/);
});

test('fixture shell distinguishes synchronous initialization and asynchronous render errors', async () => {
  const failed = await runShell(async () => ({ mountMapMonthFixture() { throw new Error('Synthetic root error'); } }));
  assert.match(failed.status.textContent, /초기화 실패/);
  let report;
  const rendered = await runShell(async () => ({ mountMapMonthFixture(_root, callbacks) { report = callbacks.onRenderError; } }));
  assert.match(rendered.status.textContent, /그리는 중/);
  report(new Error('Synthetic render error'));
  assert.equal(rendered.status.hidden, false);
  assert.match(rendered.status.textContent, /렌더링 실패/);
  assert.doesNotMatch(rendered.status.textContent, /Synthetic/);
});

test('fixture loading message hides only after the mounted component signals readiness', async () => {
  let ready;
  const { status } = await runShell(async () => ({ mountMapMonthFixture(_root, callbacks) { ready = callbacks.onReady; } }));
  assert.equal(status.hidden, false);
  ready();
  assert.equal(status.hidden, true);
});

test('actual fixture entry mounts the actual MapPage with isolated tree and static map dependencies', async () => {
  const MapPage = () => assert.fail('Only the entry wiring is exercised here');
  const StaticEcoMap = () => null;
  let rootOptions, ready = 0, mounted;
  const effects = [];
  const react = {
    Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: (initial) => [initial, () => {}], useEffect: (callback) => effects.push(callback),
  };
  const allowed = {
    react,
    'react-dom/client': { createRoot(_container, options) { rootOptions = options; return { render(node) { mounted = node.type(); } }; } },
    '../../src/components/MapPage.tsx': { MapPage },
    '../../src/components/map/StaticEcoMap.tsx': { StaticEcoMap },
    './map-month-filter.mjs': { createMapMonthFixture },
    '../../src/index.css': {},
  };
  const exports = {};
  runInNewContext(ts.transpileModule(entry, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, require(name) { assert.ok(name in allowed, 'Unexpected external dependency'); return allowed[name]; },
  });
  const onRenderError = () => {};
  exports.mountMapMonthFixture({}, { onReady() { ready++; }, onRenderError });
  const page = mounted.props.children.find((node) => node.type === MapPage);
  assert.ok(page);
  assert.equal(page.props.MapComponent, StaticEcoMap);
  assert.equal(page.props.observations.length, 35);
  assert.equal(typeof page.props.onSelect, 'function');
  assert.equal((await page.props.taxonomyRepository.getRootNodes()).length, 1);
  assert.equal(rootOptions.onUncaughtError, onRenderError);
  assert.equal(ready, 0);
  effects.forEach((effect) => effect());
  assert.equal(ready, 1);
  assert.doesNotMatch(entry + shell, /import\.meta\.env|Object\.assign|activeTaxonomyTreeRepository|getActiveMapProviderKind|fetch\(|\.functions\./);
});
