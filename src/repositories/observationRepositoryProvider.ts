import { mockObservationRepository } from './mockObservationRepository';
import type { ObservationRepository, ObservationRepositoryKind } from './observationRepository';

const OBSERVATION_REPOSITORY_ENV_KEY = 'VITE_OBSERVATION_REPOSITORY';

type ViteImportMeta = ImportMeta & {
  env: Record<string, string | undefined>;
};

export const DEFAULT_OBSERVATION_REPOSITORY_KIND: ObservationRepositoryKind = 'mock';

const loadSupabaseObservationRepository = async (): Promise<ObservationRepository> => {
  const module = await import('./supabase/supabaseObservationRepository');
  return module.supabaseObservationRepository;
};

const lazySupabaseObservationRepository: ObservationRepository = {
  async listObservations() {
    const repository = await loadSupabaseObservationRepository();
    return repository.listObservations();
  },
  async getObservationById(id) {
    const repository = await loadSupabaseObservationRepository();
    return repository.getObservationById(id);
  },
  async countUniqueSpecies() {
    const repository = await loadSupabaseObservationRepository();
    return repository.countUniqueSpecies();
  },
  async createObservation(input) {
    const repository = await loadSupabaseObservationRepository();
    return repository.createObservation(input);
  },
};

export const resolveObservationRepositoryKind = (value?: string): ObservationRepositoryKind => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'mock') {
    return DEFAULT_OBSERVATION_REPOSITORY_KIND;
  }

  if (normalizedValue === 'supabase') {
    return 'supabase';
  }

  console.warn(
    `Unsupported ${OBSERVATION_REPOSITORY_ENV_KEY} value "${value}". Falling back to the mock observation repository.`,
  );

  return DEFAULT_OBSERVATION_REPOSITORY_KIND;
};

export const getConfiguredObservationRepositoryKind = (): ObservationRepositoryKind => {
  return resolveObservationRepositoryKind((import.meta as ViteImportMeta).env[OBSERVATION_REPOSITORY_ENV_KEY]);
};

export const getObservationRepository = (
  kind: ObservationRepositoryKind = DEFAULT_OBSERVATION_REPOSITORY_KIND,
): ObservationRepository => {
  switch (kind) {
    case 'mock':
      return mockObservationRepository;
    case 'supabase':
      return lazySupabaseObservationRepository;
  }
};

export const activeObservationRepository = getObservationRepository(getConfiguredObservationRepositoryKind());
