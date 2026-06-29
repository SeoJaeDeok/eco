import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { mapPublicTaxonDbRowToObservationTaxonomyLineage } from '../src/repositories/supabase/observationMappers.ts';

const detailLineageSource = readFileSync(
  new URL('../src/components/observations/detail/ObservationTaxonomyLineage.tsx', import.meta.url),
  'utf8',
);

const supabaseObservationRepositorySource = readFileSync(
  new URL('../src/repositories/supabase/supabaseObservationRepository.ts', import.meta.url),
  'utf8',
);

test('detail mapper creates safe lineage display data from public taxa columns', () => {
  const taxonomy = mapPublicTaxonDbRowToObservationTaxonomyLineage({
    source: 'GBIF Species Match API v2',
    source_checklist_key: 'internal-checklist',
    source_taxon_key: 'internal-source-key',
    accepted_scientific_name: 'Taraxacum officinale Weber ex F.H.Wigg.',
    canonical_name: 'Taraxacum officinale',
    terminal_rank: 'SPECIES',
    taxonomic_status: 'ACCEPTED',
    kingdom_name: 'Plantae',
    phylum_name: 'Tracheophyta',
    class_name: 'Magnoliopsida',
    order_name: 'Asterales',
    family_name: 'Asteraceae',
    genus_name: 'Taraxacum',
    species_name: 'Taraxacum officinale',
  }, 'Taraxacum officinale');

  assert.equal(taxonomy?.reportedScientificName, 'Taraxacum officinale');
  assert.equal(taxonomy?.acceptedScientificName, 'Taraxacum officinale Weber ex F.H.Wigg.');
  assert.equal(taxonomy?.sourceLabel, 'GBIF / Catalogue of Life XR');
  assert.deepEqual(
    taxonomy?.ranks.map((rank) => [rank.rankLabelKo, rank.name]),
    [
      ['계', 'Plantae'],
      ['문', 'Tracheophyta'],
      ['강', 'Magnoliopsida'],
      ['목', 'Asterales'],
      ['과', 'Asteraceae'],
      ['속', 'Taraxacum'],
      ['종', 'Taraxacum officinale'],
    ],
  );
  assert.equal('source_taxon_key' in taxonomy, false);
  assert.equal('source_checklist_key' in taxonomy, false);
});

test('detail component handles legacy rows and does not display raw source identifiers', () => {
  assert.match(detailLineageSource, /분류 정보 미연결/);
  assert.match(detailLineageSource, /!observation\.taxonId/);
  assert.doesNotMatch(detailLineageSource, /source_taxon_key|sourceTaxonKey|sourceChecklistKey|source_checklist_key/);
});

test('detail fetch joins only safe taxonomy display columns and avoids resolver calls', () => {
  assert.match(supabaseObservationRepositorySource, /taxa!observations_taxon_id_fkey/);
  assert.match(supabaseObservationRepositorySource, /accepted_scientific_name/);
  assert.doesNotMatch(supabaseObservationRepositorySource, /source_taxon_key/);
  assert.doesNotMatch(supabaseObservationRepositorySource, /source_checklist_key/);
  assert.doesNotMatch(supabaseObservationRepositorySource, /classification_json/);
  assert.doesNotMatch(supabaseObservationRepositorySource, /taxonomy_name_resolutions/);
  assert.doesNotMatch(supabaseObservationRepositorySource, /\.functions\.invoke/);
});
