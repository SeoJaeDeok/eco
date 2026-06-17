import { sampleObservations } from '../data/sampleObservations';
import type { Observation, OwnerObservationUpdateInput } from '../types';
import type { ObservationRepository } from './observationRepository';
import { countUniqueSpecies } from '../utils/observationStats';

const updatedObservationsById = new Map<string, Observation>();

const mergeObservationUpdate = (
  observation: Observation,
  input: OwnerObservationUpdateInput,
): Observation => ({
  ...observation,
  name: input.name,
  scientificName: input.scientificName ?? '',
  taxon: input.taxon,
  location: input.location,
  date: input.date,
  description: input.description ?? '',
  coords: input.coords,
});

const getMockObservations = () => sampleObservations.map((observation) => (
  updatedObservationsById.get(observation.id) ?? observation
));

export const mockObservationRepository: ObservationRepository = {
  listObservations: async () => [...getMockObservations()],
  getObservationById: async (id) => getMockObservations().find((observation) => observation.id === id) ?? null,
  countUniqueSpecies: async () => countUniqueSpecies(getMockObservations()),
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
  updateOwnObservation: async (id, input) => {
    const existingObservation = getMockObservations().find((observation) => observation.id === id);

    if (!existingObservation) {
      throw new Error(`Mock observation "${id}" was not found.`);
    }

    const updatedObservation = mergeObservationUpdate(existingObservation, input);
    updatedObservationsById.set(id, updatedObservation);
    return updatedObservation;
  },
};
