import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// A small effect/SDK harness, not a browser or a Kakao renderer. No SDK/network/env reads.
const mountProvider = async (surface, initialProps, { hasKey = true, failLoad = false } = {}) => {
  const slots = [];
  const effects = [];
  const maps = [];
  const overlays = [];
  const markers = [];
  const observers = [];
  const frames = new Map();
  let cursor = 0;
  let dirty = false;
  let nextFrame = 0;
  let props = initialProps;
  let tree;
  const container = { clientWidth: 800, clientHeight: 600 };
  class Element extends EventTarget {
    style = {};
    attributes = {};
    children = [];
    setAttribute(name, value) { this.attributes[name] = value; }
    append(...children) { this.children.push(...children); }
  }
  class LatLng {
    constructor(lat, lng) { this.lat = lat; this.lng = lng; }
    getLat() { return this.lat; }
    getLng() { return this.lng; }
  }
  class MapInstance {
    listeners = new Map();
    centerCalls = 0;
    levelCalls = 0;
    layouts = 0;
    constructor(_container, options) {
      Object.assign(this, options);
      maps.push(this);
    }
    setCenter(position) { this.center = position; this.centerCalls++; }
    setLevel(level) { this.level = level; this.levelCalls++; }
    relayout() { this.layouts++; }
  }
  class Overlay {
    constructor(options) { Object.assign(this, options); overlays.push(this); }
    setMap(map) { this.map = map; }
    setPosition(position) { this.position = position; }
    setContent(content) { this.content = content; }
  }
  class Marker {
    constructor(options) { Object.assign(this, options); markers.push(this); }
    setMap(map) { this.map = map; }
    setPosition(position) { this.position = position; }
  }
  const sdk = {
    Map: MapInstance, LatLng, CustomOverlay: Overlay, Marker,
    event: {
      addListener(target, type, handler) { target.listeners.set(type, handler); },
      removeListener(target, type, handler) {
        if (target.listeners.get(type) === handler) target.listeners.delete(type);
      },
    },
  };
  const equalDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(value) {
      const index = cursor++;
      slots[index] ??= { current: value };
      return slots[index];
    },
    useState(value) {
      const index = cursor++;
      slots[index] ??= { value: typeof value === 'function' ? value() : value };
      return [slots[index].value, (next) => {
        const result = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(result, slots[index].value)) dirty = true;
        slots[index].value = result;
      }];
    },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!equalDeps(slots[index]?.deps, deps)) slots[index] = { value: factory(), deps };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!equalDeps(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: callback() };
      });
    },
  };
  const jsx = (type, props) => ({ type, props });
  const stubs = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '../../constants/taxon': { getTaxonColor: () => '#338855' },
    '../../components/map/StaticEcoMap': { StaticEcoMap: 'static-map' },
    '../../components/map/StaticLocationPicker': { StaticLocationPicker: 'static-picker' },
    '../../components/map/StaticPositionPreview': { StaticPositionPreview: 'static-preview' },
    './mapProjection': { DEFAULT_MAP_CENTER: { lat: 0, lng: 0 } },
    './kakaoMapLoader': {
      hasKakaoMapJavascriptKey: () => hasKey,
      loadKakaoMapSdk: async () => {
        if (failLoad) throw new Error('Synthetic SDK failure');
        return sdk;
      },
    },
  };
  const schedule = (callback) => { frames.set(++nextFrame, callback); return nextFrame; };
  const cancel = (id) => frames.delete(id);
  const context = {
    document: { createElement: () => new Element() },
    window: { setTimeout: schedule, clearTimeout: cancel, requestAnimationFrame: schedule, cancelAnimationFrame: cancel },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    },
  };
  const loadLocal = (name) => {
    if (stubs[name]) return stubs[name];
    assert.ok(['./kakaoMapProvider', './kakaoMapLayout'].includes(name), `Unexpected module: ${name}`);
    const extension = name === './kakaoMapProvider' ? 'tsx' : 'ts';
    const source = readFileSync(new URL(`../src/features/map/${name.slice(2)}.${extension}`, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    });
    const exports = {};
    runInNewContext(outputText, { ...context, exports, require: loadLocal });
    stubs[name] = exports;
    return exports;
  };
  const Component = loadLocal('./kakaoMapProvider').kakaoMapProvider[surface];
  const attachRefs = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.props?.ref) node.props.ref.current = container;
    const children = node.props?.children;
    (Array.isArray(children) ? children : [children]).forEach(attachRefs);
  };
  const render = () => {
    cursor = 0;
    dirty = false;
    tree = Component(props);
    attachRefs(tree);
    effects.splice(0).forEach((effect) => effect());
  };
  const settle = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    if (dirty) render();
  };
  const flushFrames = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback());
  };
  render();
  await settle();
  flushFrames();
  return {
    maps, overlays, markers, observers, container, frames,
    get tree() { return tree; },
    activeOverlays: () => overlays.filter((overlay) => overlay.map),
    render(next) { props = next; render(); },
    resize(width, height) {
      container.clientWidth = width;
      container.clientHeight = height;
      observers.filter((observer) => !observer.disconnected).forEach((observer) => observer.callback([]));
    },
    settle, flushFrames,
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
};

const observation = (id, name = id) => Object.freeze({
  id, name, taxon: 'plant', coords: Object.freeze({ lat: 1 + id.length, lng: 2 + id.length }),
});

test('observation overlay anchors the dot, independent of label length, focus and selection', async () => {
  const short = observation('a', 'A');
  const long = observation('bb', 'A much longer observation name');
  const props = { observations: [short, long], selectedObservationId: long.id };
  const view = await mountProvider('EcoMap', props);
  const [first, second] = view.activeOverlays();
  for (const overlay of [first, second]) {
    const button = overlay.content;
    const [dot, label] = button.children;
    assert.equal(overlay.xAnchor, 0.5);
    assert.equal(overlay.yAnchor, 0.5);
    assert.equal(button.style.width, '36px');
    assert.equal(button.style.height, '36px');
    assert.equal(button.style.margin, '0');
    assert.equal(button.style.padding, '0');
    assert.equal(button.style.alignItems, 'center');
    assert.equal(button.style.justifyContent, 'center');
    assert.equal(label.style.position, 'absolute');
    assert.equal(dot.style.flexShrink, '0');
    const before = JSON.stringify(button.style);
    button.dispatchEvent(new Event('focus'));
    assert.equal(label.style.opacity, '1');
    button.dispatchEvent(new Event('blur'));
    assert.equal(dot.style.transform, 'scale(1)');
    assert.equal(JSON.stringify(button.style), before);
  }
  assert.equal(first.content.children[1].style.opacity, '0');
  assert.equal(second.content.children[1].style.opacity, '1');
  view.unmount();
});

test('filtering and equivalent props preserve the user camera and correct observation selection', async () => {
  const records = [observation('a'), observation('bb'), observation('ccc')];
  const selected = [];
  const onSelectObservation = (record) => selected.push(record);
  const view = await mountProvider('EcoMap', { observations: records, onSelectObservation });
  const map = view.maps[0];
  const initialPositions = view.activeOverlays().map((overlay) => overlay.position);
  for (const level of [3, 6, 2, 4, 7]) {
    map.setLevel(level);
    map.listeners.get('zoom_changed')?.();
    map.listeners.get('bounds_changed')?.();
    assert.ok(view.activeOverlays().every((overlay, index) => overlay.position === initialPositions[index]));
  }
  const pannedCenter = { synthetic: true };
  map.setCenter(pannedCenter);
  const old = view.activeOverlays();
  view.render({ observations: [records[2], records[1]], onSelectObservation });
  assert.equal(map.level, 7);
  assert.equal(map.center, pannedCenter);
  assert.equal(view.maps.length, 1);
  assert.ok(old.every((overlay) => overlay.map === null));
  old[0].content.dispatchEvent(new Event('click'));
  assert.equal(selected.length, 0);
  for (const [index, overlay] of view.activeOverlays().entries()) {
    const record = [records[2], records[1]][index];
    assert.equal(overlay.position.getLat(), record.coords.lat);
    assert.equal(overlay.position.getLng(), record.coords.lng);
    overlay.content.dispatchEvent(new Event('click'));
    assert.equal(selected.at(-1), record);
  }
  view.render({ observations: [], onSelectObservation });
  assert.equal(view.activeOverlays().length, 0);
  view.render({ observations: records, onSelectObservation });
  assert.equal(view.activeOverlays().length, 3);
  assert.equal(map.center, pannedCenter);
  assert.equal(map.level, 7);
  view.unmount();
  assert.equal(view.activeOverlays().length, 0);
  assert.equal(map.listeners.size, 0);
});

test('explicit camera prop changes work without resetting unrelated zoom or center', async () => {
  const props = { observations: [observation('a')], center: { lat: 1, lng: 2 }, zoom: 4 };
  const view = await mountProvider('EcoMap', props);
  const map = view.maps[0];
  map.setLevel(8);
  const centerCalls = map.centerCalls;
  view.render({ ...props, center: { ...props.center } });
  assert.equal(map.level, 8);
  assert.equal(map.centerCalls, centerCalls);
  view.render({ ...props, center: { lat: 3, lng: 4 } });
  assert.equal(map.center.getLat(), 3);
  assert.equal(map.level, 8);
  const currentCenter = map.center;
  view.render({ ...props, center: { lat: 3, lng: 4 }, zoom: 6 });
  assert.equal(map.level, 6);
  assert.equal(map.center, currentCenter);
  view.unmount();
});

test('all Kakao surfaces relayout only at valid changed sizes and clean up scheduled work', async () => {
  for (const [surface, props] of [
    ['EcoMap', { observations: [observation('a')] }],
    ['LocationPicker', { value: { lat: 1, lng: 2 }, onChange() {} }],
    ['PositionPreview', { coordinates: { lat: 1, lng: 2 } }],
  ]) {
    const view = await mountProvider(surface, props);
    const map = view.maps[0];
    assert.equal(view.observers.length, 1);
    const layouts = map.layouts;
    const centerCalls = map.centerCalls;
    const levelCalls = map.levelCalls;
    view.resize(800, 600);
    view.flushFrames();
    assert.equal(map.layouts, layouts);
    view.resize(400, 500);
    view.resize(420, 500);
    view.flushFrames();
    assert.equal(map.layouts, layouts + 1);
    view.resize(0, 0);
    view.flushFrames();
    assert.equal(map.layouts, layouts + 1);
    view.resize(420, 500);
    view.flushFrames();
    assert.equal(map.layouts, layouts + 2);
    assert.equal(map.centerCalls, centerCalls);
    assert.equal(map.levelCalls, levelCalls);
    view.resize(500, 500);
    view.unmount();
    view.flushFrames();
    assert.equal(map.layouts, layouts + 2);
    assert.equal(view.frames.size, 0);
    assert.ok(view.observers.every((observer) => observer.disconnected));
    assert.equal(map.listeners.size, 0);
  }
});

test('picker movement and relayout do not select a location; only a map click does', async () => {
  const changes = [];
  const value = Object.freeze({ lat: 1, lng: 2 });
  const view = await mountProvider('LocationPicker', { value, onChange: (coords) => changes.push(coords) });
  const map = view.maps[0];
  const marker = view.markers[0];
  const position = marker.position;
  for (const level of [3, 6, 2, 4]) map.setLevel(level);
  map.setCenter({ synthetic: true });
  view.resize(400, 500);
  view.flushFrames();
  assert.equal(marker.position, position);
  assert.equal(changes.length, 0);
  map.listeners.get('click')({ latLng: { getLat: () => 3, getLng: () => 4 } });
  assert.equal(changes.length, 1);
  assert.equal(changes[0].lat, 3);
  assert.equal(changes[0].lng, 4);
  view.unmount();
  assert.equal(marker.map, null);
});

test('missing key and SDK failure retain each static fallback surface', async () => {
  for (const options of [{ hasKey: false }, { failLoad: true }]) {
    for (const [surface, props, expected] of [
      ['EcoMap', { observations: [] }, 'static-map'],
      ['LocationPicker', { onChange() {} }, 'static-picker'],
      ['PositionPreview', { coordinates: { lat: 1, lng: 2 } }, 'static-preview'],
    ]) {
      const view = await mountProvider(surface, props, options);
      assert.equal(view.tree.type, expected);
      assert.equal(view.maps.length, 0);
      view.unmount();
    }
  }
});
