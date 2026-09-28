import type {
  CreateObservationInput,
  Observation,
  OwnerObservationUpdateInput,
  VerifiedTaxonomyObservationInput,
} from '../types';
import type { ObservationPage, ObservationPageQuery } from '../utils/observationPagination';

export type ObservationRepositoryKind = 'mock' | 'supabase';

export interface ObservationRepository {
  listPublicObservationsPage(query: ObservationPageQuery, signal?: AbortSignal): Promise<ObservationPage>;
  listObservations(): Promise<Observation[]>;
  getObservationById(id: string): Promise<Observation | null>;
  countUniqueSpecies(): Promise<number>;
  createObservation(input: CreateObservationInput): Promise<Observation>;
  createObservationWithVerifiedTaxonomy(input: VerifiedTaxonomyObservationInput): Promise<Observation>;
  updateOwnObservation(id: string, input: OwnerObservationUpdateInput): Promise<Observation>;
}
