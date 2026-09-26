import {
  getTaxonomyTreeRootNodes,
  getTaxonomyTreeChildren,
  getTaxonomyTreeObservationIdsForSelection,
} from '../../src/features/taxonomy/taxonomyTree.ts';

// Synthetic, local-only layout data. Never imported by the production entry point.
export const createMapFilterLayoutFixture = () => {
  const ranks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
  const names = ['Plantae', 'Tracheophyta', 'Magnoliopsida', 'Asterales', 'Asteraceae', 'Taraxacum', 'Taraxacum officinale'];
  const longName = 'Taraxacum officinale synthetic long scientific display name for layout testing';
  const unbrokenName = 'SyntheticUnbrokenDisplayLabel'.repeat(6);
  const makeTaxon = (species) => ({
    source: 'fixture', sourceChecklistKey: 'local-only', terminalSourceKey: species,
    acceptedScientificName: species, canonicalName: species, terminalRank: 'species', taxonomicStatus: 'accepted',
    lineage: Object.fromEntries(ranks.map((rank, index) => [rank, {
      key: rank === 'species' ? species : rank,
      name: rank === 'species' ? species : names[index],
    }])),
  });
  const complete = makeTaxon(names[6]);
  const missing = { ...complete, lineage: { ...complete.lineage, phylum: { key: null, name: null } } };
  const entries = [
    ['layout-short', complete, 'approved'],
    ['layout-long', makeTaxon(longName), 'approved'],
    ['layout-unbroken', makeTaxon(unbrokenName), 'approved'],
    ['layout-missing', missing, 'approved'],
    ['layout-legacy', null, 'approved'],
    ['layout-pending', complete, 'pending'],
    ['layout-rejected', complete, 'rejected'],
  ];
  const summaries = entries.map(([id, taxon, status]) => ({ observationId: id, taxonId: taxon ? id : null, taxon, status }));
  const observations = entries.map(([id, taxon, status]) => ({
    id, name: id, scientificName: taxon?.acceptedScientificName ?? 'Legacy fixture',
    taxon: '식물', status, taxonId: taxon ? id : null,
    location: 'Local fixture', description: 'Synthetic layout test only', date: '2026-01-01',
    coords: { lat: 0, lng: 0 }, imageUrl: '',
  }));
  // Simulate incoming props while the panel is hidden; no repository write.
  const updatedObservations = observations.map((observation) => {
    if (observation.id === 'layout-short') return { ...observation, name: 'layout-refreshed' };
    if (observation.id === 'layout-long') return { ...observation, name: 'layout-short updated' };
    return observation;
  });
  const calls = { roots: 0, children: 0, selection: 0 };
  // Deliberately exaggerated display counts exercise narrow rows; not DB counts.
  const layoutCounts = (nodes) => nodes.map((node) => ({ ...node, observationCount: 12345 }));
  const repository = {
    async getRootNodes() { calls.roots++; return layoutCounts(getTaxonomyTreeRootNodes(summaries)); },
    async getChildren(parent) { calls.children++; return layoutCounts(getTaxonomyTreeChildren(summaries, parent)); },
    async getObservationIdsForSelection(selection) {
      calls.selection++;
      return getTaxonomyTreeObservationIdsForSelection(summaries, selection);
    },
  };
  return { repository, calls, observations, updatedObservations, longName, unbrokenName, names };
};
