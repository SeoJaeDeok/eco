import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
import * as pagination from '../src/utils/observationPagination.ts';
import * as mappers from '../src/repositories/supabase/observationMappers.ts';
import * as taxa from '../src/constants/taxon.ts';
import * as stats from '../src/utils/observationStats.ts';
import { mockObservationRepository } from '../src/repositories/mockObservationRepository.ts';
import { createPaginationObservations, fixtureImagePath, toPaginationDbRow } from './fixtures/observation-pagination.mjs';

const defaults = pagination.DEFAULT_OBSERVATION_PAGE_QUERY;
const options = (patch = {}) => ({ ...defaults, ...patch });
const plain = (value) => JSON.parse(JSON.stringify(value));

// Parses the emitted PostgREST logic for transport tests; not a live PostgreSQL engine.
const parseLogic = (source) => {
  let position = 0;
  const read = () => {
    for (const operator of ['and', 'or']) {
      if (source.startsWith(`${operator}(`, position)) {
        position += operator.length + 1;
        const children = [read()];
        while (source[position] === ',') { position++; children.push(read()); }
        assert.equal(source[position++], ')');
        return { operator, children };
      }
    }
    const prefix = source.slice(position).match(/^(\w+)\.(not\.)?(imatch|eq|is)\./);
    assert.ok(prefix, 'Expected a fixed field and filter operator');
    position += prefix[0].length;
    let value = '';
    if (source[position] === '"') {
      position++;
      while (position < source.length && source[position] !== '"') {
        if (source[position] === '\\') position++;
        value += source[position++];
      }
      assert.equal(source[position++], '"');
    } else {
      while (position < source.length && ![',', ')'].includes(source[position])) value += source[position++];
    }
    return { field: prefix[1], negate: Boolean(prefix[2]), operator: prefix[3], value };
  };
  const result = read();
  assert.equal(position, source.length, 'Input must remain inside exactly one logic expression');
  return result;
};
const evaluate = (node, row) => {
  if (node.children) return node.operator === 'and'
    ? node.children.every((child) => evaluate(child, row)) : node.children.some((child) => evaluate(child, row));
  const value = row[node.field];
  if (node.operator === 'is') return value == null;
  if (value == null) return false;
  const match = node.operator === 'imatch' ? new RegExp(node.value, 'i').test(value) : value === node.value;
  return node.negate ? !match : match;
};

const makeRepository = ({ observations = createPaginationObservations(), intercept, sign = async () => null } = {}) => {
  const requests = [], signed = [];
  let rows = observations.map(toPaginationDbRow);
  const client = createClient('https://pagination-test.invalid', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      const request = { params: url.searchParams, method: init.method, headers: new Headers(init.headers), signal: init.signal };
      requests.push(request);
      if (intercept) {
        const custom = await intercept(request, requests.length);
        if (custom) return custom;
      }
      let filtered = rows.filter((row) => row.status === request.params.get('status').slice(3));
      if (request.params.has('taxon')) filtered = filtered.filter((row) => row.taxon === request.params.get('taxon').slice(3));
      if (request.params.has('or')) {
        const expression = parseLogic(`or${request.params.get('or')}`);
        filtered = filtered.filter((row) => evaluate(expression, row));
      }
      const order = request.params.get('order').split(',').map((term) => term.split('.'));
      filtered.sort((a, b) => {
        for (const [field, direction] of order) {
          const comparison = String(a[field]).localeCompare(String(b[field]), field === 'name' ? 'ko' : undefined);
          if (comparison) return direction === 'desc' ? -comparison : comparison;
        }
        return 0;
      });
      const from = Number(request.params.get('offset') ?? 0);
      const limit = Number(request.params.get('limit') ?? filtered.length);
      const head = request.method === 'HEAD';
      if (!head && from >= filtered.length && from > 0) return new Response(JSON.stringify({ code: 'PGRST103', message: 'Range not satisfiable' }), { status: 416 });
      const items = filtered.slice(from, from + limit);
      return new Response(head ? null : JSON.stringify(request.params.get('select') === 'id,name'
        ? items.map(({ id, name }) => ({ id, name })) : items), {
        status: 200, headers: { 'content-type': 'application/json', 'content-range': `0-0/${filtered.length}` },
      });
    } },
  });
  const compile = (path, dependencies) => {
    const exports = {};
    const { outputText } = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    runInNewContext(outputText, { exports, require(name) {
      assert.ok(dependencies[name], `Reviewed import required: ${name}`); return dependencies[name];
    } });
    return exports;
  };
  const queryModule = compile('src/repositories/supabase/observationPageQuery.ts', {
    '../../constants/taxon': taxa, '../../utils/observationPagination': pagination,
    './supabaseClient': { getSupabaseClient: () => client },
  });
  const repository = compile('src/repositories/supabase/supabaseObservationRepository.ts', {
    '../../utils/observationPagination': pagination, './observationPageQuery': queryModule,
    '../../utils/observerDisplay': {}, '../../utils/observationStats': stats, './observationMappers': mappers,
    './supabaseClient': { getSupabaseClient: () => client },
    './supabaseObservationImageStorage': {
      async resolveObservationImageSignedUrl(path) { if (path) signed.push(path); return sign(path); },
    },
  }).supabaseObservationRepository;
  return { repository, requests, signed, queryModule, replaceRows: (next) => { rows = next.map(toPaginationDbRow); } };
};

test('public summary reads only approved IDs/names, preserving trimmed-name grouping and legacy records', async () => {
  const rows = createPaginationObservations(47);
  rows[0].name = ' 같은 관찰종 ';
  rows[1].status = 'pending'; rows[1].name = '비공개 하나';
  rows[2].status = 'rejected'; rows[2].name = '비공개 둘';
  rows[3].name = '   ';
  const fixture = makeRepository({ observations: rows });
  assert.deepEqual(plain(await fixture.repository.getPublicObservationSummary()), { observationCount: 45, uniqueSpeciesCount: 2 });
  assert.equal(fixture.requests.length, 1);
  const request = fixture.requests[0];
  assert.equal(request.params.get('select'), 'id,name');
  assert.equal(request.params.get('status'), 'eq.approved');
  assert.equal(request.params.get('order'), 'id.asc');
  assert.equal(request.params.get('limit'), '500');
  assert.equal(request.headers.get('Prefer'), 'count=exact');
  assert.equal(fixture.signed.length, 0);
});

test('summary completes multiple narrow batches instead of treating server truncation as a total', async () => {
  const fixture = makeRepository({ observations: createPaginationObservations(1001) });
  assert.deepEqual(plain(await fixture.repository.getPublicObservationSummary()), { observationCount: 1001, uniqueSpeciesCount: 2 });
  assert.deepEqual(fixture.requests.map((r) => r.params.get('offset')), ['0', '500', '1000']);
  assert.equal(fixture.signed.length, 0);
});

test('summary supports a lower server cap by advancing only over verified returned rows', async () => {
  const fixture = makeRepository({ intercept: (request) => {
    const offset = Number(request.params.get('offset'));
    return new Response(JSON.stringify(Array.from({ length: Math.min(2, 5 - offset) }, (_, i) => ({ id: `row-${offset + i}`, name: '같은 종' }))), {
      status: 200, headers: { 'content-range': '0-0/5' },
    });
  } });
  assert.deepEqual(plain(await fixture.repository.getPublicObservationSummary()), { observationCount: 5, uniqueSpeciesCount: 1 });
  assert.deepEqual(fixture.requests.map((r) => r.params.get('offset')), ['0', '2', '4']);
});

test('summary zero is verified and distinct from missing count, malformed rows or permission failure', async () => {
  assert.deepEqual(plain(await makeRepository({ observations: [] }).repository.getPublicObservationSummary()), { observationCount: 0, uniqueSpeciesCount: 0 });
  for (const response of [
    () => new Response('[]', { status: 200 }),
    () => new Response('[{"id":"row","name":null}]', { status: 200, headers: { 'content-range': '0-0/1' } }),
    () => new Response('{}', { status: 403 }),
    () => new Response('[]', { status: 200, headers: { 'content-range': '0-0/1' } }),
  ]) {
    await assert.rejects(makeRepository({ intercept: response }).repository.getPublicObservationSummary());
  }
});

test('summary rejects changed counts, overlapping rows and bounded read-budget overflow', async () => {
  for (const scenario of ['changed', 'overlap', 'too-many', 'budget']) {
    const fixture = makeRepository({ intercept: (_request, attempt) => {
      const count = scenario === 'too-many' ? 10001 : scenario === 'changed' ? 3 + attempt : 21;
      const id = scenario === 'overlap' ? 'same-id' : `row-${attempt}`;
      return new Response(JSON.stringify([{ id, name: '종' }]), { status: 200, headers: { 'content-range': `0-0/${count}` } });
    } });
    await assert.rejects(fixture.repository.getPublicObservationSummary());
    assert.equal(fixture.requests.length, scenario === 'budget' ? 20 : scenario === 'too-many' ? 1 : 2);
  }
});

test('summary abort prevents any request and does not call full collection or image code', async () => {
  const controller = new AbortController(); controller.abort();
  const fixture = makeRepository();
  await assert.rejects(fixture.repository.getPublicObservationSummary(controller.signal));
  assert.equal(fixture.requests.length, 0);
  assert.equal(fixture.signed.length, 0);
  assert.deepEqual(await mockObservationRepository.getPublicObservationSummary(), { observationCount: 6, uniqueSpeciesCount: 6 });
});

test('actual mock summary excludes pending, rejected and unknown status without mutating samples', async () => {
  const rows = Object.freeze([
    { id: 'a', name: '같은 종', status: 'approved' },
    { id: 'b', name: ' 같은 종 ', status: 'approved', taxonId: null },
    { id: 'c', name: '다른 이름', status: 'pending' },
    { id: 'd', name: '다른 이름', status: 'rejected' },
    { id: 'e', name: '다른 이름' },
  ].map(Object.freeze));
  const exports = {};
  const source = readFileSync(new URL('../src/repositories/mockObservationRepository.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  runInNewContext(outputText, { exports, require(name) {
    const modules = { '../data/sampleObservations': { sampleObservations: rows }, '../utils/observationStats': stats,
      '../utils/observationPagination': pagination };
    assert.ok(modules[name]); return modules[name];
  } });
  assert.deepEqual(plain(await exports.mockObservationRepository.getPublicObservationSummary()), { observationCount: 2, uniqueSpeciesCount: 1 });
  assert.equal(rows[2].status, 'pending'); assert.equal(rows[3].status, 'rejected');
  assert.equal(Object.hasOwn(rows[4], 'status'), false);
});

for (const count of [0, 1, 19, 20, 21, 40, 41, 47]) {
  test(`mock and actual SDK page transport: ${count} records`, async () => {
    const observations = createPaginationObservations(count);
    const fixture = makeRepository({ observations });
    const ids = [];
    for (let page = 1; page <= Math.max(1, Math.ceil(count / 20)); page++) {
      const mock = pagination.paginateMockObservations(observations, options({ page }));
      const actual = await fixture.repository.listPublicObservationsPage(options({ page }));
      assert.equal(actual.totalCount, count);
      assert.equal(actual.page, page);
      assert.equal(actual.pageSize, 20);
      assert.equal(actual.items.length, Math.min(20, count - (page - 1) * 20));
      assert.deepEqual(plain(actual.items.map((row) => row.id)), mock.items.map((row) => row.id));
      ids.push(...actual.items.map((row) => row.id));
      const request = fixture.requests.at(-1);
      assert.equal(request.params.get('offset'), String((page - 1) * 20));
      assert.equal(request.params.get('limit'), '20');
      assert.equal(request.headers.get('Prefer'), 'count=exact');
      assert.equal(request.params.get('order'), 'observed_date.desc,id.desc');
      assert.doesNotMatch(request.params.get('select'), /\*|taxa\(|classification_json|taxonomy_name_resolutions/);
    }
    assert.equal(new Set(ids).size, count);
  });
}

test('page validation rejects malformed or excessive offsets before any network request', async () => {
  const fixture = makeRepository();
  for (const page of [NaN, Infinity, -1, 0, 1.2, '2', pagination.MAX_OBSERVATION_PAGE + 1]) {
    await assert.rejects(fixture.repository.listPublicObservationsPage(options({ page })));
    assert.throws(() => pagination.observationPageRange(page));
  }
  for (const patch of [{ sortKey: 'unknown' }, { selectedTaxon: 'unknown' }, { imageFilter: 'unknown' }]) {
    await assert.rejects(fixture.repository.listPublicObservationsPage(options(patch)));
  }
  assert.equal(fixture.requests.length, 0);
});

test('same-species and same-date records remain separate; public visibility and legacy rows survive', async () => {
  const observations = createPaginationObservations(47);
  observations[0].status = 'pending'; observations[1].status = 'rejected';
  const fixture = makeRepository({ observations });
  for (const sortKey of ['newest', 'oldest', 'name']) {
    const actual = await fixture.repository.listPublicObservationsPage(options({ sortKey }));
    assert.equal(actual.totalCount, 45);
    assert.ok(actual.items.every((row) => row.status === 'approved' && !row.taxonId));
    assert.deepEqual(plain(actual.items.map((row) => row.id)), pagination.paginateMockObservations(observations, options({ sortKey })).items.map((row) => row.id));
  }
  assert.ok((await mockObservationRepository.listPublicObservationsPage(options())).items.length > 0);
});

test('search and filters run before paging, including a match originally past page two', async () => {
  const observations = createPaginationObservations(47);
  observations[0].description = '뒤쪽 검색 일치';
  const fixture = makeRepository({ observations });
  for (const query of [options({ searchQuery: '뒤쪽 검색' }), options({ selectedTaxon: '식물', imageFilter: 'with-image' })]) {
    const actual = await fixture.repository.listPublicObservationsPage(query);
    const expected = pagination.paginateMockObservations(observations, query);
    assert.equal(actual.totalCount, expected.totalCount);
    assert.deepEqual(plain(actual.items.map((row) => row.id)), expected.items.map((row) => row.id));
  }
  assert.equal((await fixture.repository.listPublicObservationsPage(options({ searchQuery: '뒤쪽 검색' }))).items[0].id, observations[0].id);
});

test('literal Korean, punctuation, wildcard, quoting and whitespace searches cannot inject filter syntax', async () => {
  for (const searchQuery of ['수국', 'A,B(C)', 'a"b\\c', '%_*.+?^$[]{}|', 'x),status.eq.pending', '  꽃\t 이름  ', 'Parus minor']) {
    for (const field of ['name', 'scientificName', 'location', 'description']) {
      const observations = createPaginationObservations(2);
      observations[0][field] = `앞 ${searchQuery.trim().replace(/\s+/g, '\n\t')} 뒤`;
      const fixture = makeRepository({ observations });
      const actual = await fixture.repository.listPublicObservationsPage(options({ searchQuery }));
      assert.equal(actual.totalCount, 1);
      assert.equal(actual.items[0].id, observations[0].id);
    }
  }
});

test('registered photo filters use identical predicates for rows and count, independent of signing success', async () => {
  const cases = [
    { imagePath: fixtureImagePath }, { imageUrl: '/observations/legacy.jpg' },
    { imageUrl: 'https://images.example.org/photo.jpg?width=300' },
    {}, { imagePath: ' \t ' }, { imagePath: 'placeholder' },
    { imageUrl: 'blob:fixture' }, { imageUrl: 'data:image/png;base64,fixture' },
    { imageUrl: '/placeholder.svg' }, { imageUrl: 'https://images.example.org/placeholder.jpg' },
    { imageUrl: 'https://images.example.org/storage/v1/object/sign/image.jpg?token=fixture' },
    { imageUrl: 'https://images.example.org/photo.jpg?signature=fixture' },
    { imagePath: 'https://images.example.org/not-a-storage-path.jpg' }, { imageUrl: '  ' },
    { imageMimeType: 'image/jpeg', imageSizeBytes: 100 },
  ];
  const observations = createPaginationObservations(cases.length).map((row, index) => ({ ...row, imagePath: undefined, ...cases[index] }));
  const fixture = makeRepository({ observations });
  for (const imageFilter of ['with-image', 'without-image', 'all']) {
    const result = await fixture.repository.listPublicObservationsPage(options({ imageFilter }));
    const expected = pagination.paginateMockObservations(observations, options({ imageFilter }));
    assert.equal(result.totalCount, imageFilter === 'with-image' ? 3 : imageFilter === 'without-image' ? cases.length - 3 : cases.length);
    assert.deepEqual(plain(result.items.map((row) => row.id)), expected.items.map((row) => row.id));
    if (imageFilter === 'with-image') assert.ok(result.items.some((row) => row.imagePath && !row.imageUrl));
  }
});

test('signed image work is restricted to the returned page and never used to compute count', async () => {
  const observations = createPaginationObservations(47).map((row) => ({ ...row, imagePath: fixtureImagePath }));
  const fixture = makeRepository({ observations });
  const result = await fixture.repository.listPublicObservationsPage(options({ page: 2, imageFilter: 'with-image' }));
  assert.equal(result.totalCount, 47);
  assert.equal(fixture.signed.length, 20);
  assert.equal(fixture.requests.length, 1);
});

test('a successful empty offset response is corrected once using its exact count', async () => {
  const fixture = makeRepository({ intercept: (_request, attempt) => attempt === 1
    ? new Response('[]', { status: 200, headers: { 'content-range': '*/47' } }) : undefined });
  const result = await fixture.repository.listPublicObservationsPage(options({ page: 10 }));
  assert.equal(result.page, 3); assert.equal(result.items.length, 7);
  assert.equal(fixture.requests.length, 2);
});

test('out-of-range 416 performs filtered HEAD count and exactly one corrected page read', async () => {
  const fixture = makeRepository();
  const result = await fixture.repository.listPublicObservationsPage(options({ page: 10, imageFilter: 'with-image' }));
  assert.equal(result.page, 1);
  assert.equal(result.totalCount, 16);
  assert.deepEqual(fixture.requests.map((request) => request.method), ['GET', 'HEAD', 'GET']);
  assert.equal(fixture.requests[1].params.get('limit'), null);
  assert.equal(fixture.requests[1].params.get('or'), fixture.requests[0].params.get('or'));
  assert.equal(fixture.signed.length, 16);
});

test('zero results outside range normalize to page one without a correction loop', async () => {
  const fixture = makeRepository({ observations: [] });
  const result = await fixture.repository.listPublicObservationsPage(options({ page: 3 }));
  assert.equal(result.page, 1); assert.equal(result.totalCount, 0);
  assert.equal(fixture.requests.length, 2);
});

test('ordinary errors and missing count are not disguised as zero results or retried automatically', async () => {
  for (const failure of [
    () => new Response(JSON.stringify({ code: '42501', message: 'Synthetic denial' }), { status: 403 }),
    () => new Response('[]', { status: 200 }),
    () => { throw new TypeError('Synthetic network failure'); },
  ]) {
    const fixture = makeRepository({ intercept: failure });
    await assert.rejects(fixture.repository.listPublicObservationsPage(options()));
    assert.equal(fixture.requests.length, 1);
    assert.equal(fixture.signed.length, 0);
  }
});

test('a second range failure stops; an aborted request performs no signing', async () => {
  const fixture = makeRepository({ intercept: (request) => request.method === 'GET'
    ? new Response(JSON.stringify({ code: 'PGRST103' }), { status: 416 }) : undefined });
  await assert.rejects(fixture.repository.listPublicObservationsPage(options({ page: 10 })));
  assert.equal(fixture.requests.length, 3);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fixture.repository.listPublicObservationsPage(options(), controller.signal));
  assert.equal(fixture.signed.length, 0);
});
