import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editFormSource = readFileSync(
  new URL('../src/components/observations/detail/ObservationDetailEditForm.tsx', import.meta.url),
  'utf8',
);

test('taxonomy-linked observation edit keeps scientific name and broad taxon locked', () => {
  assert.match(editFormSource, /const isTaxonomyLinked = Boolean\(observation\.taxonId\)/);
  assert.match(editFormSource, /scientificName: isTaxonomyLinked/);
  assert.match(editFormSource, /taxon: isTaxonomyLinked \? observation\.taxon : values\.taxon/);
  assert.match(editFormSource, /disabled=\{isTaxonomyLinked\}/);
});

