import {
  getTaxonomyTreeRootNodes,
  getTaxonomyTreeChildren,
  getTaxonomyTreeObservationIdsForSelection,
} from '../../src/features/taxonomy/taxonomyTree.ts';

// Isolated calendar/filter data. No production imports, Storage or shared database writes.
export const createMapMonthFixture = () => {
  const ranks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
  const names = ['Plantae', 'Tracheophyta', 'Magnoliopsida', 'Asterales', 'Asteraceae', 'Monthus', 'Monthus example'];
  const plant = {
    source: 'fixture', sourceChecklistKey: 'local', terminalSourceKey: 'month-plant',
    acceptedScientificName: names[6], canonicalName: names[6], terminalRank: 'species', taxonomicStatus: 'accepted',
    lineage: Object.fromEntries(ranks.map((rank, index) => [rank, { key: names[index], name: names[index] }])),
  };
  const make = (id, date, overrides = {}) => ({
    id, date, name: `월별 식물 ${id}`, scientificName: names[6], taxon: '식물',
    taxonId: 'month-plant', status: 'approved', location: 'Local fixture',
    description: 'Synthetic calendar data', coords: { lat: 0, lng: 0 }, imageUrl: '',
    created_at: '2026-12-01T00:00:00Z', ...overrides,
  });
  const observations = [
    ...Array.from({ length: 25 }, (_, index) => make(`month-may-${index + 1}`, `${index % 2 ? 2024 : 2025}-05-01`)),
    make('month-april', '2026-04-30'),
    make('month-january', '2026-01-01'),
    make('month-december', '2025-12-31', { created_at: '2026-01-01T00:00:00Z' }),
    make('month-leap', '2024-02-29'),
    make('month-invalid', '2025-02-29'),
    make('month-missing', ''),
    make('month-legacy', '2023-05-31', { taxonId: null }),
    make('month-bird', '2022-05-01', { taxon: '조류', taxonId: null, scientificName: 'Local bird', name: '월별 조류' }),
    make('month-pending', '2026-05-01', { status: 'pending' }),
    make('month-rejected', '2026-05-01', { status: 'rejected' }),
  ];
  const summaries = observations.map((row) => ({
    observationId: row.id, status: row.status, taxonId: row.taxonId, taxon: row.taxonId ? plant : null,
  }));
  const calls = { roots: 0, children: 0, selection: 0 };
  const repository = {
    async getRootNodes() { calls.roots++; return getTaxonomyTreeRootNodes(summaries); },
    async getChildren(parent) { calls.children++; return getTaxonomyTreeChildren(summaries, parent); },
    async getObservationIdsForSelection(selection) {
      calls.selection++;
      return getTaxonomyTreeObservationIdsForSelection(summaries, selection);
    },
  };
  return { observations, repository, calls, names };
};
