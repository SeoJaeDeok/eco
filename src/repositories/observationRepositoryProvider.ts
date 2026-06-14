import { mockObservationRepository } from './mockObservationRepository';
import type { ObservationRepository, ObservationRepositoryKind } from './observationRepository';

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

export const activeObservationRepository = mockObservationRepository;
