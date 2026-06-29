import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repositorySource = readFileSync(
  new URL('../src/repositories/supabase/supabaseObservationRepository.ts', import.meta.url),
  'utf8',
);

const getTrustedCreateSection = () => {
  const start = repositorySource.indexOf('async createObservationWithVerifiedTaxonomy');
  const end = repositorySource.indexOf('async updateOwnObservation', start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  return repositorySource.slice(start, end);
};

test('Supabase taxonomy-linked create uses the trusted RPC instead of direct table insert', () => {
  const section = getTrustedCreateSection();

  assert.match(section, /\.rpc\(TAXONOMY_CREATE_RPC/);
  assert.doesNotMatch(section, /\.from\(OBSERVATIONS_TABLE\)[\s\S]*\.insert\(/);
  assert.match(section, /p_taxon_id:\s*input\.taxonomy\.taxonId/);
  assert.doesNotMatch(section, /taxonomy_match_type|taxonomy_confidence|taxonomy_verified_at/);
});

test('Supabase taxonomy-linked create attempts image cleanup after RPC failure', () => {
  const section = getTrustedCreateSection();

  assert.match(repositorySource, /removeUploadedObservationImage/);
  assert.match(section, /cleanupUploadedImageAfterCreateFailure\(uploadedImage\)/);
});

