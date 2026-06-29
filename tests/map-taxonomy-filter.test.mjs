import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { filterMapObservations } from '../src/utils/observationFilters.ts';
import { sampleObservations } from '../src/data/sampleObservations.ts';
import { mockTaxonomyTreeRepository } from '../src/repositories/mockTaxonomyTreeRepository.ts';

const mapPageSource = readFileSync(new URL('../src/components/MapPage.tsx', import.meta.url), 'utf8');
const treePanelSource = readFileSync(new URL('../src/components/map/TaxonomyTreePanel.tsx', import.meta.url), 'utf8');
const treeRepositoryProviderSource = readFileSync(
  new URL('../src/repositories/taxonomyTreeRepositoryProvider.ts', import.meta.url),
  'utf8',
);

const getObservation = (id) => {
  const observation = sampleObservations.find((candidate) => candidate.id === id);
  assert.ok(observation, `Expected sample observation ${id}`);
  return observation;
};

const findNode = (nodes, displayName) => {
  const node = nodes.find((candidate) => candidate.displayName === displayName);
  assert.ok(node, `Expected taxonomy node ${displayName}`);
  return node;
};

const getPlantSelectionIds = async () => {
  const roots = await mockTaxonomyTreeRepository.getRootNodes();
  const plantae = findNode(roots, 'Plantae');
  return new Set(await mockTaxonomyTreeRepository.getObservationIdsForSelection(plantae));
};

test('no taxonomy filter keeps legacy rows visible in the map collection', () => {
  const filtered = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: null,
  });

  assert.ok(filtered.some((observation) => observation.id === 'geranium'));
});

test('active taxonomy filter excludes legacy null-taxonomy observations', async () => {
  const filtered = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: await getPlantSelectionIds(),
  });

  assert.ok(filtered.some((observation) => observation.id === 'capsella'));
  assert.ok(filtered.some((observation) => observation.id === 'dayflower'));
  assert.equal(filtered.some((observation) => observation.id === 'geranium'), false);
});

test('taxonomy kingdom selection filters map observations by selected node ids', async () => {
  const plantIds = await getPlantSelectionIds();
  const filtered = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: plantIds,
  });

  assert.deepEqual(filtered.map((observation) => observation.id), ['capsella', 'dayflower']);
});

test('taxonomy genus selection matches child species observations', async () => {
  const roots = await mockTaxonomyTreeRepository.getRootNodes();
  const plantae = findNode(roots, 'Plantae');
  const tracheophyta = findNode(await mockTaxonomyTreeRepository.getChildren(plantae), 'Tracheophyta');
  const magnoliopsida = findNode(await mockTaxonomyTreeRepository.getChildren(tracheophyta), 'Magnoliopsida');
  const commelinales = findNode(await mockTaxonomyTreeRepository.getChildren(magnoliopsida), 'Commelinales');
  const commelinaceae = findNode(await mockTaxonomyTreeRepository.getChildren(commelinales), 'Commelinaceae');
  const commelina = findNode(await mockTaxonomyTreeRepository.getChildren(commelinaceae), 'Commelina');
  const ids = new Set(await mockTaxonomyTreeRepository.getObservationIdsForSelection(commelina));

  const filtered = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: ids,
  });

  assert.deepEqual(filtered.map((observation) => observation.id), ['dayflower']);
});

test('search broad taxon and taxonomy filter combine with AND semantics', async () => {
  const honeybee = getObservation('honeybee');
  const roots = await mockTaxonomyTreeRepository.getRootNodes();
  const animalia = findNode(roots, 'Animalia');
  const animalIds = new Set(await mockTaxonomyTreeRepository.getObservationIdsForSelection(animalia));

  const filtered = filterMapObservations(sampleObservations, {
    selectedTaxa: [honeybee.taxon],
    searchQuery: 'Apis',
    taxonomyObservationIds: animalIds,
  });

  assert.deepEqual(filtered.map((observation) => observation.id), ['honeybee']);
});

test('clearing taxonomy filter restores the non-taxonomy map result set', async () => {
  const filteredWithTaxonomy = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: await getPlantSelectionIds(),
  });
  const filteredWithoutTaxonomy = filterMapObservations(sampleObservations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: null,
  });

  assert.ok(filteredWithoutTaxonomy.length > filteredWithTaxonomy.length);
  assert.ok(filteredWithoutTaxonomy.some((observation) => observation.id === 'geranium'));
});

test('taxonomy filter does not introduce pending or rejected observations', () => {
  const honeybee = getObservation('honeybee');
  const observations = [
    {
      ...honeybee,
      id: 'approved-linked',
      status: 'approved',
    },
    {
      ...honeybee,
      id: 'pending-linked',
      status: 'pending',
    },
    {
      ...honeybee,
      id: 'rejected-linked',
      status: 'rejected',
    },
  ];

  const filtered = filterMapObservations(observations, {
    selectedTaxa: [],
    searchQuery: '',
    taxonomyObservationIds: new Set(['approved-linked', 'pending-linked', 'rejected-linked']),
  });

  assert.deepEqual(filtered.map((observation) => observation.id), ['approved-linked']);
});

test('missing rank observations remain selectable through known ancestor nodes only', async () => {
  const missingRankObservation = {
    ...getObservation('capsella'),
    id: 'mock-tree-missing-rank',
    taxonId: 'mock-taxon-missing-rank',
  };
  const roots = await mockTaxonomyTreeRepository.getRootNodes();
  const plantae = findNode(roots, 'Plantae');
  const plantaeIds = new Set(await mockTaxonomyTreeRepository.getObservationIdsForSelection(plantae));
  const tracheophyta = findNode(await mockTaxonomyTreeRepository.getChildren(plantae), 'Tracheophyta');
  const tracheophytaIds = new Set(await mockTaxonomyTreeRepository.getObservationIdsForSelection(tracheophyta));

  assert.deepEqual(
    filterMapObservations([missingRankObservation], {
      selectedTaxa: [],
      searchQuery: '',
      taxonomyObservationIds: plantaeIds,
    }).map((observation) => observation.id),
    ['mock-tree-missing-rank'],
  );
  assert.deepEqual(
    filterMapObservations([missingRankObservation], {
      selectedTaxa: [],
      searchQuery: '',
      taxonomyObservationIds: tracheophytaIds,
    }),
    [],
  );
});

test('map taxonomy UI uses repository boundary and avoids resolver/cache calls', () => {
  assert.match(mapPageSource, /TaxonomyTreePanel/);
  assert.match(mapPageSource, /filterMapObservations/);
  assert.match(mapPageSource, /관찰 목록/);
  assert.match(treePanelSource, /분류 탐색/);
  assert.match(treePanelSource, /분류 필터:/);
  assert.match(treeRepositoryProviderSource, /getObservationIdsForSelection/);
  assert.doesNotMatch(mapPageSource + treePanelSource + treeRepositoryProviderSource, /taxonomy_name_resolutions/);
  assert.doesNotMatch(mapPageSource + treePanelSource + treeRepositoryProviderSource, /resolve-taxonomy/);
  assert.doesNotMatch(mapPageSource + treePanelSource + treeRepositoryProviderSource, /\.functions\.invoke/);
});
