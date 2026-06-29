import test from 'node:test';
import assert from 'node:assert/strict';

import { mockObservationRepository } from '../src/repositories/mockObservationRepository.ts';
import { mockTaxonomyRepository } from '../src/repositories/mockTaxonomyRepository.ts';

test('mock trusted taxonomy create stores deterministic taxonomy linkage', async () => {
  const resolution = await mockTaxonomyRepository.resolveScientificName({ scientificName: 'Taraxacum officinale' });
  assert.equal(resolution.status, 'resolved');
  assert.equal(resolution.broadTaxon, '식물');

  const observation = await mockObservationRepository.createObservationWithVerifiedTaxonomy({
    name: 'Mock taxonomy create',
    scientificName: resolution.reportedScientificName,
    taxon: resolution.broadTaxon,
    location: '경북대학교',
    date: '2026-06-29',
    description: 'Mock trusted taxonomy create test',
    coords: { lat: 35.888, lng: 128.61 },
    taxonomy: {
      taxonId: resolution.taxonId,
      reportedScientificName: resolution.reportedScientificName,
      broadTaxon: resolution.broadTaxon,
    },
  });

  assert.equal(observation.status, 'approved');
  assert.equal(observation.scientificName, 'Taraxacum officinale');
  assert.equal(observation.taxon, '식물');
  assert.equal(observation.taxonId, resolution.taxonId);
  assert.equal(observation.taxonomyMatchType, 'MOCK_VERIFIED');
  assert.equal(observation.taxonomyConfidence, 99);
  assert.ok(observation.taxonomyVerifiedAt);
});

