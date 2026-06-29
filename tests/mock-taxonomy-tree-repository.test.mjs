import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { mockTaxonomyTreeRepository } from '../src/repositories/mockTaxonomyTreeRepository.ts';

const providerSource = readFileSync(
  new URL('../src/repositories/taxonomyTreeRepositoryProvider.ts', import.meta.url),
  'utf8',
);

const findNode = (nodes, displayName) => {
  const node = nodes.find((candidate) => candidate.displayName === displayName);
  assert.ok(node, `Expected taxonomy node ${displayName}`);
  return node;
};

test('mock taxonomy tree repository returns deterministic root nodes', async () => {
  const roots = await mockTaxonomyTreeRepository.getRootNodes();

  assert.deepEqual(roots.map((node) => [node.displayName, node.observationCount]), [
    ['Plantae', 3],
    ['Animalia', 2],
  ]);
});

test('mock taxonomy tree repository supports child traversal', async () => {
  const plantae = findNode(await mockTaxonomyTreeRepository.getRootNodes(), 'Plantae');
  const phyla = await mockTaxonomyTreeRepository.getChildren(plantae);

  assert.deepEqual(phyla.map((node) => [node.rank, node.displayName, node.observationCount]), [
    ['phylum', 'Tracheophyta', 2],
  ]);
});

test('taxonomy tree provider wires mock and Supabase repositories', () => {
  assert.match(providerSource, /mockTaxonomyTreeRepository/);
  assert.match(providerSource, /supabaseTaxonomyTreeRepository/);
  assert.match(providerSource, /getConfiguredObservationRepositoryKind/);
});
