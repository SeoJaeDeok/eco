import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { getObservationDateParts, getObservationMonth, getObservationYears, normalizeObservationMonths, toggleObservationMonth, OBSERVATION_MONTHS } from '../src/utils/observationMonth.ts';
import { filterMapObservations, getObservationSpeciesKey } from '../src/utils/observationFilters.ts';
import { mapObservationRowToObservation } from '../src/repositories/supabase/observationMappers.ts';
import { createMapMonthFixture } from './fixtures/map-month-filter.mjs';

const fixture = createMapMonthFixture();
const filter = (options = {}) => filterMapObservations(fixture.observations, { selectedTaxa: [], searchQuery: '', ...options });
const ids = (rows) => rows.map((row) => row.id);

test('date-only month validates the actual calendar without timezone conversion', () => {
  for (const [date, month] of [['2026-01-01', 1], ['2025-12-31', 12], ['2024-02-29', 2], ['2000-02-29', 2], ['0001-01-01', 1]]) {
    assert.equal(getObservationMonth(date), month);
  }
  for (const date of [null, undefined, '', ' ', '0000-01-01', '2026-00-01', '2026-13-01', '2026-01-00', '2026-01-32', '2026-04-31', '2026-02-30', '2025-02-29', '1900-02-29', '2026-5-01', '2026/05/01', '2026-05-01T00:00:00Z', '2026-05-01\n', ' 2026-05-01']) {
    assert.equal(getObservationMonth(date), null);
  }
});

test('year and month extraction is identical under UTC, Seoul and Los Angeles timezones', () => {
  const code = "import {getObservationDateParts} from './src/utils/observationMonth.ts'; process.stdout.write(JSON.stringify(['2026-01-01','2026-05-01','2025-12-31','2024-02-29'].map(getObservationDateParts)));";
  for (const TZ of ['UTC', 'Asia/Seoul', 'America/Los_Angeles']) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), [{ year: 2026, month: 1 }, { year: 2026, month: 5 }, { year: 2025, month: 12 }, { year: 2024, month: 2 }]);
  }
});

test('selection normalization removes duplicates, invalid months and full-year redundancy', () => {
  assert.deepEqual(normalizeObservationMonths([12, 5, 4, 5, NaN, 0, -1, 13, 1.5, '3']), [4, 5, 12]);
  assert.deepEqual(normalizeObservationMonths(OBSERVATION_MONTHS), []);
  assert.deepEqual(toggleObservationMonth([5], 5), []);
  assert.deepEqual(toggleObservationMonth([5], 4), [4, 5]);
  assert.deepEqual(toggleObservationMonth(OBSERVATION_MONTHS.slice(0, 11), 12), []);
});

test('no month selection preserves existing public results including unknown dates', () => {
  assert.deepEqual(filter(), filter({ selectedMonths: [] }));
  assert.deepEqual(filter(), filter({ selectedMonths: OBSERVATION_MONTHS }));
  assert.equal(filter().length, 33);
  assert.ok(ids(filter()).includes('month-invalid'));
  assert.ok(ids(filter()).includes('month-missing'));
  assert.ok(!ids(filter()).includes('month-pending'));
  assert.ok(!ids(filter()).includes('month-rejected'));
});

test('May includes different years and legacy records without a twenty-item map limit', () => {
  const may = filter({ selectedMonths: [5] });
  assert.equal(may.length, 27);
  assert.ok(may.some((row) => row.date.startsWith('2024-')));
  assert.ok(may.some((row) => row.date.startsWith('2025-')));
  assert.ok(ids(may).includes('month-legacy'));
  assert.ok(!ids(may).includes('month-pending'));
  assert.ok(!ids(may).includes('month-rejected'));
});

test('month choices are OR and compose with broad taxon, search, species and taxonomy by AND', async () => {
  assert.equal(filter({ selectedMonths: [4, 5] }).length, 28);
  const roots = await fixture.repository.getRootNodes();
  const taxonomyObservationIds = new Set(await fixture.repository.getObservationIdsForSelection(roots[0]));
  const options = { selectedMonths: [4, 5], selectedTaxa: ['식물'], searchQuery: 'month-april', taxonomyObservationIds };
  assert.deepEqual(ids(filter(options)), ['month-april']);
  assert.deepEqual(filter({ ...options, selectedMonths: [5] }), []);
  assert.equal(filter({ ...options, searchQuery: '', selectedMonths: [5] }).length, 25);
  const selectedSpeciesKey = getObservationSpeciesKey(fixture.observations[0]);
  assert.equal(filter({ ...options, selectedSpeciesKey, searchQuery: '', selectedMonths: [5] }).length, 25);
  assert.equal(filter({ selectedMonths: [5], selectedTaxa: ['조류'] }).length, 1);
});

test('mapper preserves observed_date; created_at never supplies a month or a missing date', () => {
  const row = { id: 'date-contract', name: 'Calendar fixture', scientific_name: '', taxon: '식물', location: 'Local', description: '', latitude: 0, longitude: 0, status: 'approved', image_url: null, observed_date: '2024-05-01', created_at: '2026-12-01T00:00:00Z' };
  const observation = mapObservationRowToObservation(row);
  assert.equal(observation.date, '2024-05-01');
  const apply = (rows, month) => filterMapObservations(rows, { selectedTaxa: [], searchQuery: '', selectedMonths: [month] });
  assert.equal(apply([observation], 5).length, 1);
  assert.equal(apply([observation], 12).length, 0);
  assert.equal(apply([mapObservationRowToObservation({ ...row, observed_date: null })], 12).length, 0);
  assert.deepEqual(ids(filter({ selectedMonths: [12] })), ['month-december']);
});

test('invalid dates stay excluded for active months and return only when months clear', () => {
  assert.deepEqual(ids(filter({ selectedMonths: [2] })), ['month-leap']);
  const active = filter({ selectedMonths: [1, 2, 12] });
  assert.deepEqual(ids(active), ['month-january', 'month-december', 'month-leap']);
  assert.ok(!ids(active).includes('month-invalid'));
  assert.equal(filter({ selectedMonths: [] }).length, 33);
});

test('year options use unique descending valid approved dates, including legacy but not registration dates', () => {
  const extra = (id, date, status) => ({ ...fixture.observations[0], id, date, status });
  const rows = [...fixture.observations,
    extra('hidden-pending', '2030-05-01', 'pending'),
    extra('hidden-rejected', '2029-05-01', 'rejected'),
    extra('unknown-status', '2028-05-01', undefined),
    extra('invalid-year-date', '2027-02-29', 'approved'),
  ];
  assert.deepEqual(getObservationYears(rows), [2026, 2025, 2024, 2023, 2022]);
  assert.deepEqual(getObservationYears([]), []);
  assert.deepEqual(getObservationYears([extra('legacy', '1999-01-01', 'approved')]), [1999]);
  assert.equal(getObservationDateParts('2025-02-29'), null);
  assert.deepEqual(getObservationDateParts('2024-02-29'), { year: 2024, month: 2 });
});

test('single year and multi-month intersection has independently counted fixture results', () => {
  // 25 linked May plants alternate 2025 (13) / 2024 (12); other dated records are explicit fixture rows.
  for (const [year, all, may, aprilMay] of [[2026, 2, 0, 1], [2025, 14, 13, 13], [2024, 13, 12, 12], [2023, 1, 1, 1], [2022, 1, 1, 1]]) {
    assert.equal(filter({ selectedYear: year }).length, all);
    assert.equal(filter({ selectedYear: year, selectedMonths: [5] }).length, may);
    assert.equal(filter({ selectedYear: year, selectedMonths: [4, 5] }).length, aprilMay);
  }
  assert.equal(filter({ selectedYear: null, selectedMonths: [5] }).length, 27);
  assert.equal(filter({ selectedYear: 2024, selectedMonths: [2] }).length, 1);
  assert.deepEqual(ids(filter({ selectedYear: 2025, selectedMonths: [12] })), ['month-december']);
  assert.deepEqual(ids(filter({ selectedYear: 2026, selectedMonths: [1] })), ['month-january']);
  assert.equal(filter({ selectedYear: 1990 }).length, 0);
});

test('year joins search, species, broad taxon and taxonomy with AND without excluding legacy by itself', async () => {
  const root = (await fixture.repository.getRootNodes())[0];
  const taxonomyObservationIds = new Set(await fixture.repository.getObservationIdsForSelection(root));
  const options = { selectedYear: 2025, selectedMonths: [5], selectedTaxa: ['식물'], searchQuery: 'month-may-1', taxonomyObservationIds };
  assert.deepEqual(ids(filter(options)), ['month-may-1', 'month-may-11', 'month-may-13', 'month-may-15', 'month-may-17', 'month-may-19']);
  assert.equal(filter({ ...options, selectedTaxa: ['조류'] }).length, 0);
  assert.equal(filter({ ...options, searchQuery: '', selectedSpeciesKey: getObservationSpeciesKey(fixture.observations[0]) }).length, 13);
  assert.deepEqual(ids(filter({ selectedYear: 2023, selectedMonths: [5] })), ['month-legacy']);
  assert.equal(filter({ selectedYear: 2023, selectedMonths: [5], taxonomyObservationIds }).length, 0);
});

test('either date condition excludes unknown dates and clearing both restores the existing public set', () => {
  assert.ok(!ids(filter({ selectedYear: 2025 })).includes('month-invalid'));
  assert.ok(!ids(filter({ selectedYear: 2026 })).includes('month-missing'));
  assert.equal(filter({ selectedYear: 2026, selectedMonths: OBSERVATION_MONTHS }).length, 2);
  assert.equal(filter({ selectedYear: null, selectedMonths: [] }).length, 33);
  const row = { ...fixture.observations[0], date: '2023-05-01', created_at: '2026-12-01T00:00:00Z' };
  const apply = (selectedYear) => filterMapObservations([row], { selectedTaxa: [], searchQuery: '', selectedYear });
  assert.equal(apply(2023).length, 1);
  assert.equal(apply(2026).length, 0);
});
