import test from 'node:test';
import assert from 'node:assert/strict';

import { TAXONOMY_RANK_LABELS_KO } from '../src/features/taxonomy/taxonomyCore.ts';
import {
  getTaxonomyTreeChildren,
  getTaxonomyTreeRootNodes,
  getTaxonomyTreeNodesForRank,
} from '../src/features/taxonomy/taxonomyTree.ts';
import { mockTaxonomyTreeObservationSummaries } from '../src/repositories/mockTaxonomyTreeRepository.ts';

const findNode = (nodes, displayName) => {
  const node = nodes.find((candidate) => candidate.displayName === displayName);
  assert.ok(node, `Expected taxonomy node ${displayName}`);
  return node;
};

test('root nodes count approved taxonomy-linked observations only', () => {
  const roots = getTaxonomyTreeRootNodes(mockTaxonomyTreeObservationSummaries);

  assert.deepEqual(roots.map((node) => node.displayName), ['Plantae', 'Animalia']);
  assert.equal(findNode(roots, 'Plantae').observationCount, 5);
  assert.equal(findNode(roots, 'Animalia').observationCount, 4);
  assert.equal(roots[0].rank, 'kingdom');
  assert.equal(roots[0].rankLabelKo, TAXONOMY_RANK_LABELS_KO.kingdom);
});

test('children load one rank at a time and do not skip missing ranks', () => {
  const plantae = findNode(getTaxonomyTreeRootNodes(mockTaxonomyTreeObservationSummaries), 'Plantae');
  const phyla = getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, plantae);

  assert.deepEqual(phyla.map((node) => node.displayName), ['Tracheophyta']);
  assert.equal(phyla[0].rank, 'phylum');
  assert.equal(phyla[0].observationCount, 4);
});

test('genus children return species nodes with observation counts', () => {
  const plantae = findNode(getTaxonomyTreeRootNodes(mockTaxonomyTreeObservationSummaries), 'Plantae');
  const tracheophyta = findNode(getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, plantae), 'Tracheophyta');
  const magnoliopsida = findNode(
    getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, tracheophyta),
    'Magnoliopsida',
  );
  const asterales = findNode(getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, magnoliopsida), 'Asterales');
  const asteraceae = findNode(getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, asterales), 'Asteraceae');
  const taraxacum = findNode(getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, asteraceae), 'Taraxacum');
  const species = getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, taraxacum);

  assert.deepEqual(species.map((node) => node.displayName), ['Taraxacum officinale']);
  assert.equal(species[0].rank, 'species');
  assert.equal(species[0].observationCount, 2);
  assert.equal(species[0].hasChildren, false);
  assert.equal(species[0].isTerminal, true);
});

test('pending rejected and legacy null-taxonomy rows are excluded from tree nodes', () => {
  const roots = getTaxonomyTreeRootNodes(mockTaxonomyTreeObservationSummaries);
  const totalRootCount = roots.reduce((total, node) => total + node.observationCount, 0);

  assert.equal(totalRootCount, 9);
});

test('name fallback identity is deterministic and parent scoped', () => {
  const summaries = [
    {
      observationId: 'fallback-1',
      status: 'approved',
      taxonId: 'fallback-taxon-1',
      taxon: {
        source: 'GBIF Species Match API v2',
        sourceChecklistKey: 'mock-checklist',
        terminalSourceKey: 'fallback-terminal-1',
        acceptedScientificName: 'Fallbackia alba',
        canonicalName: 'Fallbackia alba',
        terminalRank: 'SPECIES',
        taxonomicStatus: 'ACCEPTED',
        lineage: {
          kingdom: { key: 'mock-kingdom-plantae', name: 'Plantae' },
          phylum: { key: null, name: 'Fallbackophyta' },
          class: { key: null, name: null },
          order: { key: null, name: null },
          family: { key: null, name: null },
          genus: { key: null, name: null },
          species: { key: null, name: 'Fallbackia alba' },
        },
      },
    },
  ];
  const kingdom = findNode(getTaxonomyTreeRootNodes(summaries), 'Plantae');
  const phylum = getTaxonomyTreeNodesForRank(summaries, 'phylum', kingdom)[0];

  assert.equal(phylum.identityKind, 'nameFallback');
  assert.equal(phylum.displayName, 'Fallbackophyta');
  assert.match(phylum.key, /^name:phylum:/);
  assert.equal(getTaxonomyTreeNodesForRank(summaries, 'phylum', kingdom)[0].key, phylum.key);
});
