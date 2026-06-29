import type { TaxonomyLineage } from '../features/taxonomy/taxonomyCore';
import {
  getTaxonomyTreeChildren,
  getTaxonomyTreeObservationIdsForSelection,
  getTaxonomyTreeRootNodes,
  type TaxonomyTreeObservationSummary,
} from '../features/taxonomy/taxonomyTree';
import type { TaxonomyTreeRepository } from './taxonomyTreeRepository';

const MOCK_SOURCE = 'GBIF Species Match API v2';
const MOCK_CHECKLIST = 'mock-col-xr';

const lineage = (input: {
  kingdom?: [string, string];
  phylum?: [string, string];
  class?: [string, string];
  order?: [string, string];
  family?: [string, string];
  genus?: [string, string];
  species?: [string, string];
}): TaxonomyLineage => ({
  kingdom: input.kingdom ? { key: input.kingdom[0], name: input.kingdom[1] } : { key: null, name: null },
  phylum: input.phylum ? { key: input.phylum[0], name: input.phylum[1] } : { key: null, name: null },
  class: input.class ? { key: input.class[0], name: input.class[1] } : { key: null, name: null },
  order: input.order ? { key: input.order[0], name: input.order[1] } : { key: null, name: null },
  family: input.family ? { key: input.family[0], name: input.family[1] } : { key: null, name: null },
  genus: input.genus ? { key: input.genus[0], name: input.genus[1] } : { key: null, name: null },
  species: input.species ? { key: input.species[0], name: input.species[1] } : { key: null, name: null },
});

const createTaxon = (input: {
  terminalSourceKey: string;
  acceptedScientificName: string;
  canonicalName: string;
  lineage: TaxonomyLineage;
}) => ({
  source: MOCK_SOURCE,
  sourceChecklistKey: MOCK_CHECKLIST,
  terminalSourceKey: input.terminalSourceKey,
  acceptedScientificName: input.acceptedScientificName,
  canonicalName: input.canonicalName,
  terminalRank: 'SPECIES',
  taxonomicStatus: 'ACCEPTED',
  lineage: input.lineage,
});

const taraxacumOfficinale = createTaxon({
  terminalSourceKey: 'mock-terminal-taraxacum-officinale',
  acceptedScientificName: 'Taraxacum officinale Weber ex F.H.Wigg.',
  canonicalName: 'Taraxacum officinale',
  lineage: lineage({
    kingdom: ['mock-kingdom-plantae', 'Plantae'],
    phylum: ['mock-phylum-tracheophyta', 'Tracheophyta'],
    class: ['mock-class-magnoliopsida', 'Magnoliopsida'],
    order: ['mock-order-asterales', 'Asterales'],
    family: ['mock-family-asteraceae', 'Asteraceae'],
    genus: ['mock-genus-taraxacum', 'Taraxacum'],
    species: ['mock-species-taraxacum-officinale', 'Taraxacum officinale'],
  }),
});

const homoSapiens = createTaxon({
  terminalSourceKey: 'mock-terminal-homo-sapiens',
  acceptedScientificName: 'Homo sapiens Linnaeus, 1758',
  canonicalName: 'Homo sapiens',
  lineage: lineage({
    kingdom: ['mock-kingdom-animalia', 'Animalia'],
    phylum: ['mock-phylum-chordata', 'Chordata'],
    class: ['mock-class-mammalia', 'Mammalia'],
    order: ['mock-order-primates', 'Primates'],
    family: ['mock-family-hominidae', 'Hominidae'],
    genus: ['mock-genus-homo', 'Homo'],
    species: ['mock-species-homo-sapiens', 'Homo sapiens'],
  }),
});

const pumaConcolor = createTaxon({
  terminalSourceKey: 'mock-terminal-puma-concolor',
  acceptedScientificName: 'Puma concolor (Linnaeus, 1771)',
  canonicalName: 'Puma concolor',
  lineage: lineage({
    kingdom: ['mock-kingdom-animalia', 'Animalia'],
    phylum: ['mock-phylum-chordata', 'Chordata'],
    class: ['mock-class-mammalia', 'Mammalia'],
    order: ['mock-order-carnivora', 'Carnivora'],
    family: ['mock-family-felidae', 'Felidae'],
    genus: ['mock-genus-puma', 'Puma'],
    species: ['mock-species-puma-concolor', 'Puma concolor'],
  }),
});

const missingRankPlant = createTaxon({
  terminalSourceKey: 'mock-terminal-missing-rank-plant',
  acceptedScientificName: 'Missingrankia examplea',
  canonicalName: 'Missingrankia examplea',
  lineage: lineage({
    kingdom: ['mock-kingdom-plantae', 'Plantae'],
    class: ['mock-class-magnoliopsida', 'Magnoliopsida'],
    order: ['mock-order-asterales', 'Asterales'],
    family: ['mock-family-asteraceae', 'Asteraceae'],
    genus: ['mock-genus-missingrankia', 'Missingrankia'],
    species: ['mock-species-missingrankia-examplea', 'Missingrankia examplea'],
  }),
});

const apisMellifera = createTaxon({
  terminalSourceKey: 'mock-terminal-apis-mellifera',
  acceptedScientificName: 'Apis mellifera Linnaeus, 1758',
  canonicalName: 'Apis mellifera',
  lineage: lineage({
    kingdom: ['mock-kingdom-animalia', 'Animalia'],
    phylum: ['mock-phylum-arthropoda', 'Arthropoda'],
    class: ['mock-class-insecta', 'Insecta'],
    order: ['mock-order-hymenoptera', 'Hymenoptera'],
    family: ['mock-family-apidae', 'Apidae'],
    genus: ['mock-genus-apis', 'Apis'],
    species: ['mock-species-apis-mellifera', 'Apis mellifera'],
  }),
});

const parusMinor = createTaxon({
  terminalSourceKey: 'mock-terminal-parus-minor',
  acceptedScientificName: 'Parus minor Temminck & Schlegel, 1848',
  canonicalName: 'Parus minor',
  lineage: lineage({
    kingdom: ['mock-kingdom-animalia', 'Animalia'],
    phylum: ['mock-phylum-chordata', 'Chordata'],
    class: ['mock-class-aves', 'Aves'],
    order: ['mock-order-passeriformes', 'Passeriformes'],
    family: ['mock-family-paridae', 'Paridae'],
    genus: ['mock-genus-parus', 'Parus'],
    species: ['mock-species-parus-minor', 'Parus minor'],
  }),
});

const capsellaBursaPastoris = createTaxon({
  terminalSourceKey: 'mock-terminal-capsella-bursa-pastoris',
  acceptedScientificName: 'Capsella bursa-pastoris (L.) Medik.',
  canonicalName: 'Capsella bursa-pastoris',
  lineage: lineage({
    kingdom: ['mock-kingdom-plantae', 'Plantae'],
    phylum: ['mock-phylum-tracheophyta', 'Tracheophyta'],
    class: ['mock-class-magnoliopsida', 'Magnoliopsida'],
    order: ['mock-order-brassicales', 'Brassicales'],
    family: ['mock-family-brassicaceae', 'Brassicaceae'],
    genus: ['mock-genus-capsella', 'Capsella'],
    species: ['mock-species-capsella-bursa-pastoris', 'Capsella bursa-pastoris'],
  }),
});

const commelinaCommunis = createTaxon({
  terminalSourceKey: 'mock-terminal-commelina-communis',
  acceptedScientificName: 'Commelina communis L.',
  canonicalName: 'Commelina communis',
  lineage: lineage({
    kingdom: ['mock-kingdom-plantae', 'Plantae'],
    phylum: ['mock-phylum-tracheophyta', 'Tracheophyta'],
    class: ['mock-class-magnoliopsida', 'Magnoliopsida'],
    order: ['mock-order-commelinales', 'Commelinales'],
    family: ['mock-family-commelinaceae', 'Commelinaceae'],
    genus: ['mock-genus-commelina', 'Commelina'],
    species: ['mock-species-commelina-communis', 'Commelina communis'],
  }),
});

export const mockTaxonomyTreeObservationSummaries: readonly TaxonomyTreeObservationSummary[] = [
  {
    observationId: 'mock-tree-taraxacum-1',
    status: 'approved',
    taxonId: 'mock-taxon-taraxacum-officinale',
    taxon: taraxacumOfficinale,
  },
  {
    observationId: 'mock-tree-taraxacum-2',
    status: 'approved',
    taxonId: 'mock-taxon-taraxacum-officinale',
    taxon: taraxacumOfficinale,
  },
  {
    observationId: 'mock-tree-homo-sapiens',
    status: 'approved',
    taxonId: 'mock-taxon-homo-sapiens',
    taxon: homoSapiens,
  },
  {
    observationId: 'mock-tree-puma-concolor',
    status: 'approved',
    taxonId: 'mock-taxon-puma-concolor',
    taxon: pumaConcolor,
  },
  {
    observationId: 'mock-tree-missing-rank',
    status: 'approved',
    taxonId: 'mock-taxon-missing-rank',
    taxon: missingRankPlant,
  },
  {
    observationId: 'honeybee',
    status: 'approved',
    taxonId: 'mock-taxon-apis-mellifera',
    taxon: apisMellifera,
  },
  {
    observationId: 'great-tit',
    status: 'approved',
    taxonId: 'mock-taxon-parus-minor',
    taxon: parusMinor,
  },
  {
    observationId: 'capsella',
    status: 'approved',
    taxonId: 'mock-taxon-capsella-bursa-pastoris',
    taxon: capsellaBursaPastoris,
  },
  {
    observationId: 'dayflower',
    status: 'approved',
    taxonId: 'mock-taxon-commelina-communis',
    taxon: commelinaCommunis,
  },
  {
    observationId: 'mock-tree-legacy-unlinked',
    status: 'approved',
    taxonId: null,
    taxon: null,
  },
  {
    observationId: 'mock-tree-pending-linked',
    status: 'pending',
    taxonId: 'mock-taxon-taraxacum-officinale',
    taxon: taraxacumOfficinale,
  },
  {
    observationId: 'mock-tree-rejected-linked',
    status: 'rejected',
    taxonId: 'mock-taxon-homo-sapiens',
    taxon: homoSapiens,
  },
];

export const mockTaxonomyTreeRepository: TaxonomyTreeRepository = {
  async getRootNodes() {
    return getTaxonomyTreeRootNodes(mockTaxonomyTreeObservationSummaries);
  },

  async getChildren(parent) {
    return getTaxonomyTreeChildren(mockTaxonomyTreeObservationSummaries, parent);
  },

  async getObservationIdsForSelection(selection) {
    return getTaxonomyTreeObservationIdsForSelection(mockTaxonomyTreeObservationSummaries, selection);
  },
};
