import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleObservations } from '../src/data/sampleObservations.ts';
import { mockObservationRepository } from '../src/repositories/mockObservationRepository.ts';
import { mockTaxonomyTreeObservationSummaries, mockTaxonomyTreeRepository } from '../src/repositories/mockTaxonomyTreeRepository.ts';
import { filterMapObservations } from '../src/utils/observationFilters.ts';
import { getObservationYears } from '../src/utils/observationMonth.ts';
import { DEFAULT_OBSERVATION_PAGE_QUERY, paginateMockObservations } from '../src/utils/observationPagination.ts';

// Read from the six default records, not generated from the date/filter helpers.
const expectedIds = ['great-tit', 'honeybee', 'geranium', 'capsella', 'butterfly', 'dayflower'];
const expectedDates = ['2026-05-06', '2026-05-08', '2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13'];
const ids = (rows) => rows.map((row) => row.id);
const filter = (rows, options = {}) => filterMapObservations(rows, { selectedTaxa: [], searchQuery: '', ...options });

test('the six intended default public samples explicitly declare approval', () => {
  assert.deepEqual(ids(sampleObservations), expectedIds);
  assert.deepEqual(sampleObservations.map((row) => row.date), expectedDates);
  assert.deepEqual(sampleObservations.map((row) => row.status), Array(6).fill('approved'));
});

test('actual default mock collection, page and detail reads agree on public status and years', async () => {
  const rows = await mockObservationRepository.listObservations();
  const page = await mockObservationRepository.listPublicObservationsPage(DEFAULT_OBSERVATION_PAGE_QUERY);
  assert.deepEqual(ids(rows), expectedIds);
  assert.deepEqual(getObservationYears(rows), [2026]);
  assert.equal(page.totalCount, 6);
  assert.equal(page.pageSize, 20);
  assert.deepEqual(ids(page.items), [...expectedIds].reverse());
  assert.deepEqual(getObservationYears(page.items), [2026]);
  for (const id of expectedIds) {
    const detail = await mockObservationRepository.getObservationById(id);
    assert.equal(detail.status, 'approved');
    assert.equal(detail, rows.find((row) => row.id === id));
    assert.equal(detail, page.items.find((row) => row.id === id));
  }
});

test('actual mock dates give six May records, empty April and retain both unlinked records', async () => {
  const rows = await mockObservationRepository.listObservations();
  assert.deepEqual(ids(filter(rows)), expectedIds);
  assert.deepEqual(ids(filter(rows, { selectedYear: 2026 })), expectedIds);
  assert.deepEqual(ids(filter(rows, { selectedYear: 2026, selectedMonths: [5] })), expectedIds);
  assert.deepEqual(ids(filter(rows, { selectedYear: 2026, selectedMonths: [4, 5] })), expectedIds);
  assert.deepEqual(filter(rows, { selectedYear: 2026, selectedMonths: [4] }), []);
  assert.deepEqual(filter(rows, { selectedYear: 2025, selectedMonths: [5] }), []);
  const legacy = rows.filter((row) => !row.taxonId);
  assert.deepEqual(ids(legacy), ['geranium', 'butterfly']);
  assert.deepEqual(getObservationYears(legacy), [2026]);
  assert.deepEqual(ids(filter(legacy, { selectedYear: 2026, selectedMonths: [5] })), ['geranium', 'butterfly']);
  assert.deepEqual(filter(legacy, { selectedYear: 2026, taxonomyObservationIds: new Set(expectedIds) }), []);
});

test('non-public and unknown inputs are not promoted by the public-sample correction', async () => {
  const rows = await mockObservationRepository.listObservations();
  const nonPublic = ['pending', 'rejected'].map((status, index) => Object.freeze({
    ...rows[0], id: `isolated-${status}`, status, date: `${2030 + index}-05-01`,
  }));
  const unknown = { ...rows[0], id: 'isolated-unknown', date: '2032-05-01' };
  delete unknown.status;
  Object.freeze(unknown);
  const sample = Object.freeze({ ...rows[0], id: 'isolated-sample', status: 'sample', date: '2033-05-01' });
  const mixed = [...rows, ...nonPublic];
  assert.deepEqual(ids(filter(mixed)), expectedIds);
  assert.deepEqual(filter(nonPublic, { selectedMonths: [5] }), []);
  const page = paginateMockObservations(mixed, DEFAULT_OBSERVATION_PAGE_QUERY);
  assert.equal(page.totalCount, 6);
  assert.deepEqual(ids(page.items), [...expectedIds].reverse());
  assert.deepEqual(getObservationYears([...mixed, unknown, sample]), [2026]);
  assert.deepEqual(getObservationYears([unknown, sample, ...nonPublic]), []);
  // Legacy mock visibility remains compatible; it must not manufacture approval.
  const compatible = paginateMockObservations([unknown, sample], DEFAULT_OBSERVATION_PAGE_QUERY);
  assert.deepEqual(compatible.items.map((row) => row.status), ['sample', undefined]);
  assert.deepEqual(getObservationYears(compatible.items), []);
  assert.equal(Object.hasOwn(unknown, 'status'), false);
  assert.deepEqual(nonPublic.map((row) => row.status), ['pending', 'rejected']);
});

test('separate taxonomy review fixtures keep pending and rejected states and exclude their IDs', async () => {
  const review = mockTaxonomyTreeObservationSummaries.filter((row) => ['pending', 'rejected'].includes(row.status));
  assert.deepEqual(review.map((row) => [row.observationId, row.status]), [
    ['mock-tree-pending-linked', 'pending'], ['mock-tree-rejected-linked', 'rejected'],
  ]);
  const roots = await mockTaxonomyTreeRepository.getRootNodes();
  assert.deepEqual(roots.map((node) => [node.displayName, node.observationCount]), [['Plantae', 5], ['Animalia', 4]]);
  for (const root of roots) {
    const selected = await mockTaxonomyTreeRepository.getObservationIdsForSelection(root);
    assert.ok(review.every((row) => !selected.includes(row.observationId)));
  }
});
