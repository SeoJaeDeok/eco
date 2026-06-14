import { sampleObservations } from '../data/sampleObservations';
import type { ObservationRepository } from './observationRepository';
import { countUniqueSpecies } from '../utils/observationStats';

export const mockObservationRepository: ObservationRepository = {
  listObservations: () => [...sampleObservations],
  getObservationById: (id) => sampleObservations.find((observation) => observation.id === id) ?? null,
  countUniqueSpecies: () => countUniqueSpecies(sampleObservations),
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
