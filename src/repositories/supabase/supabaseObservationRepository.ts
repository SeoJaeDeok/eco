import type { CreateObservationInput, Observation } from '../../types';
import { countUniqueSpecies } from '../../utils/observationStats';
import type { ObservationRepository } from '../observationRepository';
import type { ObservationDbRow } from './observationDbTypes';
import {
  mapCreateObservationInputToInsertRow,
  mapObservationRowToObservation,
  mapObservationRowsToObservations,
} from './observationMappers';
import { getSupabaseClient } from './supabaseClient';

const OBSERVATIONS_TABLE = 'observations';

const createRepositoryError = (message: string, cause: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
};

const createPendingObservationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pending-${crypto.randomUUID()}`;
  }

  return `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createPendingObservationFromInput = (input: CreateObservationInput): Observation => {
  return {
    id: createPendingObservationId(),
    name: input.name,
    scientificName: input.scientificName ?? '',
    taxon: input.taxon,
    location: input.location,
    date: input.date,
    description: input.description ?? '',
    coords: input.coords,
    imageUrl: '',
    status: 'pending',
  };
};

export const supabaseObservationRepository: ObservationRepository = {
  async listObservations() {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .select('*')
      .eq('status', 'approved')
      .order('observed_date', { ascending: false });

    if (error) {
      throw createRepositoryError('Failed to list approved observations from Supabase.', error);
    }

    return mapObservationRowsToObservations((data ?? []) as ObservationDbRow[]);
  },

  async getObservationById(id) {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) {
      throw createRepositoryError(`Failed to get approved observation "${id}" from Supabase.`, error);
    }

    return data ? mapObservationRowToObservation(data as ObservationDbRow) : null;
  },

  async countUniqueSpecies() {
    const observations = await this.listObservations();
    return countUniqueSpecies(observations);
  },

  async createObservation(input) {
    const insertRow = mapCreateObservationInputToInsertRow(input);
    const { error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .insert(insertRow);

    if (error) {
      throw createRepositoryError('Failed to create pending observation in Supabase.', error);
    }

    return createPendingObservationFromInput(input);
  },
};
