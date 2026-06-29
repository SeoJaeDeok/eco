import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repositorySource = readFileSync(
  new URL('../src/repositories/supabase/supabaseTaxonomyTreeRepository.ts', import.meta.url),
  'utf8',
);

test('Supabase taxonomy tree repository reads approved linked observations only', () => {
  assert.match(repositorySource, /\.from\(OBSERVATIONS_TABLE\)/);
  assert.match(repositorySource, /\.eq\('status', 'approved'\)/);
  assert.match(repositorySource, /\.not\('taxon_id', 'is', null\)/);
});

test('Supabase taxonomy tree repository uses public taxa lineage columns without raw JSON', () => {
  assert.match(repositorySource, /taxa!observations_taxon_id_fkey/);
  assert.match(repositorySource, /kingdom_key/);
  assert.match(repositorySource, /species_name/);
  assert.doesNotMatch(repositorySource, /classification_json/);
});

test('Supabase taxonomy tree repository does not call resolver or read server-only cache', () => {
  assert.doesNotMatch(repositorySource, /taxonomy_name_resolutions/);
  assert.doesNotMatch(repositorySource, /resolve-taxonomy/);
  assert.doesNotMatch(repositorySource, /\.functions\.invoke/);
  assert.doesNotMatch(repositorySource, /GBIF/);
  assert.doesNotMatch(repositorySource, /service_role|SERVICE_ROLE/);
});
