import { mockTaxonomyTreeRepository } from './mockTaxonomyTreeRepository';
import { getConfiguredObservationRepositoryKind } from './observationRepositoryProvider';
import type { TaxonomyTreeRepository, TaxonomyTreeRepositoryKind } from './taxonomyTreeRepository';

export const DEFAULT_TAXONOMY_TREE_REPOSITORY_KIND: TaxonomyTreeRepositoryKind = 'mock';

const loadSupabaseTaxonomyTreeRepository = async (): Promise<TaxonomyTreeRepository> => {
  const module = await import('./supabase/supabaseTaxonomyTreeRepository');
  return module.supabaseTaxonomyTreeRepository;
};

const lazySupabaseTaxonomyTreeRepository: TaxonomyTreeRepository = {
  async getRootNodes() {
    const repository = await loadSupabaseTaxonomyTreeRepository();
    return repository.getRootNodes();
  },
  async getChildren(parent) {
    const repository = await loadSupabaseTaxonomyTreeRepository();
    return repository.getChildren(parent);
  },
};

export const getConfiguredTaxonomyTreeRepositoryKind = (): TaxonomyTreeRepositoryKind => {
  return getConfiguredObservationRepositoryKind();
};

export const getTaxonomyTreeRepository = (
  kind: TaxonomyTreeRepositoryKind = DEFAULT_TAXONOMY_TREE_REPOSITORY_KIND,
): TaxonomyTreeRepository => {
  switch (kind) {
    case 'mock':
      return mockTaxonomyTreeRepository;
    case 'supabase':
      return lazySupabaseTaxonomyTreeRepository;
  }
};

export const activeTaxonomyTreeRepository = getTaxonomyTreeRepository(getConfiguredTaxonomyTreeRepositoryKind());
