import { sampleObservations } from '../data/sampleObservations';
import type { Observation, OwnerObservationUpdateInput } from '../types';
import type { ObservationRepository } from './observationRepository';
import { countUniqueSpecies } from '../utils/observationStats';
import { paginateMockObservations } from '../utils/observationPagination';
import { deletedMockObservationIds, markMockObservationDeleted } from './mockObservationDeletion';

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

const getMockObservations = () => sampleObservations.filter((observation) => !deletedMockObservationIds.has(observation.id)).map((observation) => (
  updatedObservationsById.get(observation.id) ?? observation
));

export const mockObservationRepository: ObservationRepository = {
  async deleteObservation(id) {
    const { activeAuthRepository } = await import('./authRepositoryProvider');
    const session = await activeAuthRepository.getSessionState();
    const observation = getMockObservations().find((item) => item.id === id);
    if (!session.user || !observation || observation.status !== 'approved'
      || (!session.isAdmin && observation.observerId !== session.user.id)) {
      throw new Error('Observation deletion not allowed.');
    }
    markMockObservationDeleted(id);
    return { imageCleanup: 'not-needed' };
  },
  async getPublicObservationSummary(signal) {
    signal?.throwIfAborted();
    const observations = getMockObservations().filter((observation) => observation.status === 'approved');
    return { observationCount: observations.length, uniqueSpeciesCount: countUniqueSpecies(observations) };
  },
  listPublicObservationsPage: async (query, signal) => {
    signal?.throwIfAborted();
    return paginateMockObservations(getMockObservations(), query);
  },
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
  createObservationWithVerifiedTaxonomy: async (input) => ({
    id: `mock-taxonomy-${Date.now()}`,
    name: input.name,
    scientificName: input.taxonomy.reportedScientificName,
    taxon: input.taxonomy.broadTaxon,
    location: input.location,
    date: input.date,
    description: input.description ?? '',
    coords: input.coords,
    imageUrl: input.imagePreviewUrl ?? '',
    taxonId: input.taxonomy.taxonId,
    taxonomyMatchType: 'MOCK_VERIFIED',
    taxonomyConfidence: 99,
    taxonomyVerifiedAt: new Date().toISOString(),
    status: 'approved',
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
