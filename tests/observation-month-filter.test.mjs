import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { getObservationMonth, normalizeObservationMonths, toggleObservationMonth, OBSERVATION_MONTHS } from '../src/utils/observationMonth.ts';
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

test('month extraction is identical under UTC, Seoul and Los Angeles timezones', () => {
  const code = "import {getObservationMonth} from './src/utils/observationMonth.ts'; process.stdout.write(JSON.stringify(['2026-01-01','2026-05-01','2025-12-31','2024-02-29'].map(getObservationMonth)));";
  for (const TZ of ['UTC', 'Asia/Seoul', 'America/Los_Angeles']) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), [1, 5, 12, 2]);
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
