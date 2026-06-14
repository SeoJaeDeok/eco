import { sampleObservations } from '../data/sampleObservations';
import type { ObservationRepository } from './observationRepository';
import { countUniqueSpecies } from '../utils/observationStats';

export const mockObservationRepository: ObservationRepository = {
  listObservations: async () => [...sampleObservations],
  getObservationById: async (id) => sampleObservations.find((observation) => observation.id === id) ?? null,
  countUniqueSpecies: async () => countUniqueSpecies(sampleObservations),
  createObservation: async (input) => ({
    id: `mock-${Date.now()}`,
    name: input.name,
    scientificName: input.scientificName ?? '',
    taxon: input.taxon,
    location: input.location,
    date: input.date,
    description: input.description ?? '',
    coords: input.coords,
    imageUrl: input.imagePreviewUrl ?? '',
    status: 'pending',
  }),
};
