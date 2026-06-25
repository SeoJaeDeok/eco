import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmptyTaxonomyLineage,
  deriveBroadTaxonFromLineage,
  normalizeScientificNameInput,
  SCIENTIFIC_NAME_MAX_LENGTH,
} from '../src/features/taxonomy/taxonomyCore.ts';

test('normalizes scientific names without lowercasing reported text', () => {
  const result = normalizeScientificNameInput('  Homo   sapiens  ');

  assert.equal(result.ok, true);
  assert.equal(result.reportedScientificName, 'Homo sapiens');
  assert.equal(result.normalizedInput, 'homo sapiens');
});

test('rejects invalid scientific-name inputs', () => {
  assert.deepEqual(normalizeScientificNameInput('   '), { ok: false, reason: 'empty' });
  assert.deepEqual(normalizeScientificNameInput('Homo\nsapiens'), { ok: false, reason: 'control_characters' });
  assert.deepEqual(normalizeScientificNameInput(42), { ok: false, reason: 'not_string' });
  assert.deepEqual(
    normalizeScientificNameInput('A'.repeat(SCIENTIFIC_NAME_MAX_LENGTH + 1)),
    { ok: false, reason: 'too_long' },
  );
});

test('derives broad taxon from the most specific supported rank first', () => {
  const lineage = createEmptyTaxonomyLineage();

  lineage.kingdom = { key: 'N', name: 'Animalia' };
  lineage.class = { key: 'IN', name: 'Insecta' };
  assert.equal(deriveBroadTaxonFromLineage(lineage), '곤충');

  lineage.class = { key: 'AV', name: 'Aves' };
  assert.equal(deriveBroadTaxonFromLineage(lineage), '조류');

  lineage.class = { key: 'MM', name: 'Mammalia' };
  assert.equal(deriveBroadTaxonFromLineage(lineage), '포유류');

  lineage.class = { key: 'AM', name: 'Amphibia' };
  assert.equal(deriveBroadTaxonFromLineage(lineage), '양서/파충류');

  lineage.class = { key: 'RP', name: 'Reptilia' };
  assert.equal(deriveBroadTaxonFromLineage(lineage), '양서/파충류');
});

test('falls back through kingdom and then 기타', () => {
  assert.equal(deriveBroadTaxonFromLineage({ kingdom: { key: 'P', name: 'Plantae' } }), '식물');
  assert.equal(deriveBroadTaxonFromLineage({ kingdom: { key: 'F', name: 'Fungi' } }), '균류');
  assert.equal(deriveBroadTaxonFromLineage({}), '기타');
});
