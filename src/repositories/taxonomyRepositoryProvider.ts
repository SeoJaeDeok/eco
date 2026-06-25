import { mockTaxonomyRepository } from './mockTaxonomyRepository';
import { getConfiguredObservationRepositoryKind } from './observationRepositoryProvider';
import type { TaxonomyRepository, TaxonomyRepositoryKind } from './taxonomyRepository';

export const DEFAULT_TAXONOMY_REPOSITORY_KIND: TaxonomyRepositoryKind = 'mock';

const loadSupabaseTaxonomyRepository = async (): Promise<TaxonomyRepository> => {
  const module = await import('./supabase/supabaseTaxonomyRepository');
  return module.supabaseTaxonomyRepository;
};

const lazySupabaseTaxonomyRepository: TaxonomyRepository = {
  async resolveScientificName(input) {
    const repository = await loadSupabaseTaxonomyRepository();
    return repository.resolveScientificName(input);
  },
  async confirmScientificName(input) {
    const repository = await loadSupabaseTaxonomyRepository();
    return repository.confirmScientificName(input);
  },
};

export const getConfiguredTaxonomyRepositoryKind = (): TaxonomyRepositoryKind => {
  return getConfiguredObservationRepositoryKind();
};

export const getTaxonomyRepository = (
  kind: TaxonomyRepositoryKind = DEFAULT_TAXONOMY_REPOSITORY_KIND,
): TaxonomyRepository => {
  switch (kind) {
    case 'mock':
      return mockTaxonomyRepository;
    case 'supabase':
      return lazySupabaseTaxonomyRepository;
  }
};

export const activeTaxonomyRepository = getTaxonomyRepository(getConfiguredTaxonomyRepositoryKind());
