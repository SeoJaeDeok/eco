import test from 'node:test';
import assert from 'node:assert/strict';

import { mockTaxonomyRepository } from '../src/repositories/mockTaxonomyRepository.ts';

test('mock repository resolves exact accepted species', async () => {
  const result = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Apis mellifera' });

  assert.equal(result.status, 'resolved');
  assert.equal(result.acceptedScientificName, 'Apis mellifera Linnaeus, 1758');
  assert.equal(result.broadTaxon, '곤충');
  assert.equal(result.cacheHit, true);
});

test('mock repository requires confirmation for synonym and variant cases', async () => {
  const synonym = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Felis concolor' });
  const variant = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Homo sapines' });

  assert.equal(synonym.status, 'needsConfirmation');
  assert.equal(synonym.candidate.reason, 'synonym');
  assert.equal(synonym.candidate.acceptedScientificName, 'Puma concolor (Linnaeus, 1771)');

  assert.equal(variant.status, 'needsConfirmation');
  assert.equal(variant.candidate.reason, 'variant');
  assert.equal(variant.candidate.acceptedSourceTaxonKey, '6MB3T');
});

test('mock confirmation verifies the candidate key', async () => {
  const confirmed = await mockTaxonomyRepository.confirmScientificName({
    scientificName: 'Felis concolor',
    acceptedSourceTaxonKey: '4QHKG',
  });
  const mismatch = await mockTaxonomyRepository.confirmScientificName({
    scientificName: 'Felis concolor',
    acceptedSourceTaxonKey: 'WRONG',
  });

  assert.equal(confirmed.status, 'resolved');
  assert.equal(confirmed.synonym, true);
  assert.equal(confirmed.broadTaxon, '포유류');

  assert.equal(mismatch.status, 'error');
  assert.equal(mismatch.reason, 'invalid_confirmation');
});

test('mock repository blocks higher rank and no-match inputs', async () => {
  const higherRank = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Homo' });
  const noMatch = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Xyzabc nonexistentii' });

  assert.equal(higherRank.status, 'blocked');
  assert.equal(higherRank.reason, 'higher_rank_only');

  assert.equal(noMatch.status, 'blocked');
  assert.equal(noMatch.reason, 'no_match');
});

test('mock repository provides a controlled retryable error fixture', async () => {
  const result = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Timeout test' });

  assert.equal(result.status, 'error');
  assert.equal(result.reason, 'timeout');
  assert.equal(result.retryable, true);
});
