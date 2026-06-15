import type { CreateObservationInput, Observation } from '../../types';
import { countUniqueSpecies } from '../../utils/observationStats';
import type { ObservationRepository } from '../observationRepository';
import type { ObservationDbRow } from './observationDbTypes';
import {
  mapCreateObservationInputToInsertRow,
  mapObservationRowToObservation,
  mapObservationRowsToObservations,
} from './observationMappers';
import {
  resolveObservationImageSignedUrl,
  uploadObservationImage,
} from './supabaseObservationImageStorage';
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

const createImageDisplayFieldsById = async (rows: ObservationDbRow[]) => {
  const entries = await Promise.all(rows.map(async (row) => {
    const signedImageUrl = await resolveObservationImageSignedUrl(row.image_path);
    return signedImageUrl ? [row.id, { imageUrl: signedImageUrl }] as const : null;
  }));

  return new Map(entries.filter((entry): entry is [string, { imageUrl: string }] => entry !== null));
};

const mapObservationRowWithSignedImageUrl = async (row: ObservationDbRow) => {
  const signedImageUrl = await resolveObservationImageSignedUrl(row.image_path);
  return mapObservationRowToObservation(row, signedImageUrl ? { imageUrl: signedImageUrl } : undefined);
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

    const rows = (data ?? []) as ObservationDbRow[];
    const displayFieldsById = await createImageDisplayFieldsById(rows);

    return mapObservationRowsToObservations(rows, displayFieldsById);
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

    return data ? mapObservationRowWithSignedImageUrl(data as ObservationDbRow) : null;
  },

  async countUniqueSpecies() {
    const observations = await this.listObservations();
    return countUniqueSpecies(observations);
  },

  async createObservation(input) {
    const uploadedImage = input.imageFile ? await uploadObservationImage(input.imageFile) : undefined;
    const insertRow = mapCreateObservationInputToInsertRow(input, uploadedImage);
    const { error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .insert(insertRow);

    if (error) {
      // TODO: Define manual cleanup for uploaded orphan images if this insert fails.
      throw createRepositoryError('Failed to create pending observation in Supabase.', error);
    }

    return createPendingObservationFromInput(input);
  },
};
