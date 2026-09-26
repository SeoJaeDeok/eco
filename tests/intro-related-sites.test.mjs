import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { BIODIVERSITY_SITES } from '../src/constants/biodiversitySites.ts';

// Render the real TSX with installed React, not a copied HTML fixture or browser.
const require = createRequire(import.meta.url);
const modules = new Map();
const load = (file) => {
  if (modules.has(file.href)) return modules.get(file.href);
  const source = readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  modules.set(file.href, exports);
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (!name.startsWith('.')) return require(name);
      const base = new URL(name, file);
      const extension = base.pathname.includes('/components/') ? '.tsx' : '.ts';
      return load(new URL(`${base.href}${extension}`));
    },
  });
  return exports;
};
const { IntroPage } = load(new URL('../src/components/IntroPage.tsx', import.meta.url));
const { IntroRelatedSites } = load(new URL('../src/components/intro/IntroRelatedSites.tsx', import.meta.url));
const walk = (node) => {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
};
const text = (node) => React.isValidElement(node)
  ? React.Children.toArray(node.props.children).map(text).join('')
  : String(node ?? '');
const renderIntro = (observations = []) => renderToStaticMarkup(React.createElement(IntroPage, {
  observations,
  onSelectSpecimen: () => assert.fail('Rendering must not select a record'),
  onNavigate: () => assert.fail('Rendering must not navigate'),
}));

test('resource data contains exactly the three approved names, descriptions and URLs', () => {
  assert.deepEqual(BIODIVERSITY_SITES.map(({ name, description, href }) => [name, description, href]), [
    ['국립생물자원관', '생물자원 연구와 전시·교육 정보를 확인할 수 있습니다.', 'https://www.nibr.go.kr/'],
    ['한반도의 생물다양성', '국명·학명으로 우리나라 생물의 형태·생태·분포 정보를 찾아볼 수 있습니다.', 'https://species.nibr.go.kr/'],
    ['GBIF', '전 세계 생물종과 관찰·표본 기록 등 생물다양성 데이터를 찾아볼 수 있습니다.', 'https://www.gbif.org/'],
  ]);
});

test('resource IDs are unique and static HTTPS destinations carry no user data', () => {
  assert.equal(new Set(BIODIVERSITY_SITES.map((site) => site.id)).size, 3);
  const hosts = new Set(['www.nibr.go.kr', 'species.nibr.go.kr', 'www.gbif.org']);
  for (const site of BIODIVERSITY_SITES) {
    const url = new URL(site.href);
    assert.equal(url.protocol, 'https:');
    assert.ok(hosts.has(url.host));
    assert.equal(url.pathname, '/');
    assert.equal(url.search + url.hash + url.username + url.password, '');
    assert.deepEqual(Object.keys(site).sort(), ['description', 'href', 'id', 'name']);
  }
});

test('native links name their destination and new tab, with safe rel and no nested controls', () => {
  const nodes = walk(IntroRelatedSites());
  const links = nodes.filter((node) => node.type === 'a');
  const ids = nodes.filter((node) => node.props.id).map((node) => node.props.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(links.length, 3);
  links.forEach((link, index) => {
    const site = BIODIVERSITY_SITES[index];
    assert.equal(link.props.href, site.href);
    assert.equal(link.props.target, '_blank');
    assert.deepEqual(link.props.rel.split(' ').sort(), ['noopener', 'noreferrer']);
    const label = link.props['aria-labelledby'].split(' ').map((id) => text(nodes.find((node) => node.props.id === id))).join(' ');
    assert.equal(label, `${site.name} 새 탭에서 열기`);
    assert.equal(text(nodes.find((node) => node.props.id === link.props['aria-describedby'])), site.description);
    assert.equal(link.props.tabIndex, undefined);
    assert.match(link.props.className, /focus-visible:outline-2/);
    assert.equal(walk(link).slice(1).some((node) => ['a', 'button', 'input'].includes(node.type)), false);
    assert.equal(walk(link).filter((node) => typeof node.type !== 'string').length, 1);
    assert.equal(walk(link).find((node) => typeof node.type !== 'string').props['aria-hidden'], 'true');
  });
});

test('layout declares one mobile column, three wide columns and wrapping without clipping', () => {
  const nodes = walk(IntroRelatedSites());
  assert.match(nodes.find((node) => node.type === 'ul').props.className, /grid-cols-1.*lg:grid-cols-3/);
  for (const node of nodes.filter((node) => ['li', 'a'].includes(node.type))) {
    assert.match(node.props.className, /min-w-0/);
  }
  for (const node of nodes.filter((node) => node.props.id?.match(/-(name|description)$/))) {
    assert.match(node.props.className, /overflow-wrap:anywhere/);
  }
  assert.ok(nodes.every((node) => !/truncate|overflow-hidden|line-clamp/.test(node.props.className ?? '')));
  // CSS contracts only: pixel geometry and focus painting need a real browser.
});

test('actual IntroPage renders links with no observations or auth requirement', () => {
  const html = renderIntro();
  assert.match(html, /생물다양성 도감/);
  assert.match(html, /생태지도 보기/);
  assert.match(html, /생물 정보 찾아보기/);
  assert.match(html, /찾고 있는 한글 국명 또는 학명을 입력하세요/);
  assert.equal((html.match(/target="_blank"/g) ?? []).length, 3);
  assert.equal((html.match(/rel="noopener noreferrer"/g) ?? []).length, 3);
  for (const site of BIODIVERSITY_SITES) {
    assert.ok(html.includes(`href="${site.href}"`));
    assert.ok(html.includes(site.name));
    assert.ok(html.includes(site.description));
  }
});

test('actual IntroPage keeps the existing species content before the related sites', () => {
  const html = renderIntro([{ name: '테스트 표본', scientificName: 'Local specimen', taxon: '식물' }]);
  assert.ok(html.indexOf('테스트 표본') < html.indexOf('생물 정보 찾아보기'));
  assert.match(html, /Local specimen/);
  assert.match(html, /1<!-- --> observation records|1 observation records/);
  assert.equal((html.match(/생태지도 보기/g) ?? []).length, 1);
  for (const site of BIODIVERSITY_SITES) assert.ok(html.includes(`href="${site.href}"`));
});

test('related sites add no automatic request, tracking, resolver or reload path', () => {
  const component = readFileSync(new URL('../src/components/intro/IntroRelatedSites.tsx', import.meta.url), 'utf8');
  const data = readFileSync(new URL('../src/constants/biodiversitySites.ts', import.meta.url), 'utf8');
  const imports = ts.createSourceFile('IntroRelatedSites.tsx', component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    .statements.filter(ts.isImportDeclaration).map((statement) => statement.moduleSpecifier.text);
  assert.deepEqual(imports, ['lucide-react', '../../constants/biodiversitySites']);
  assert.doesNotMatch(component + data, /fetch\s*\(|XMLHttpRequest|sendBeacon|window\.|useEffect|onClick|onMouseEnter|<iframe|<img|<script|<link\b|taxonomy_name_resolutions|resolver|supabase/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(IntroRelatedSites)), /<(?:iframe|img|script|link)\b|\sping=/);
});
