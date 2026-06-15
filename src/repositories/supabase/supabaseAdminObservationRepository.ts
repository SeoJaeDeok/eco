import type { AdminObservationRepository } from '../adminObservationRepository';
import type { ObservationDbRow } from './observationDbTypes';
import { mapObservationRowToObservation, mapObservationRowsToObservations } from './observationMappers';
import { resolveObservationImageSignedUrl } from './supabaseObservationImageStorage';
import { getSupabaseClient } from './supabaseClient';

const OBSERVATIONS_TABLE = 'observations';

const createAdminRepositoryError = (message: string, cause: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
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

const mapRequiredObservationRow = async (row: ObservationDbRow | null, message: string) => {
  if (!row) {
    throw new Error(message);
  }

  return mapObservationRowWithSignedImageUrl(row);
};

export const supabaseAdminObservationRepository: AdminObservationRepository = {
  async listPendingObservations() {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw createAdminRepositoryError('Failed to list pending observations from Supabase.', error);
    }

    const rows = (data ?? []) as ObservationDbRow[];
    const displayFieldsById = await createImageDisplayFieldsById(rows);

    return mapObservationRowsToObservations(rows, displayFieldsById);
  },

  async listAllObservations() {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw createAdminRepositoryError('Failed to list all observations from Supabase.', error);
    }

    const rows = (data ?? []) as ObservationDbRow[];
    const displayFieldsById = await createImageDisplayFieldsById(rows);

    return mapObservationRowsToObservations(rows, displayFieldsById);
  },

  async approveObservation(id) {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .update({ status: 'approved' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw createAdminRepositoryError(`Failed to approve observation "${id}" in Supabase.`, error);
    }

    return mapRequiredObservationRow(data as ObservationDbRow | null, `Approved observation "${id}" was not returned from Supabase.`);
  },

  async rejectObservation(id) {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .update({ status: 'rejected' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw createAdminRepositoryError(`Failed to reject observation "${id}" in Supabase.`, error);
    }

    return mapRequiredObservationRow(data as ObservationDbRow | null, `Rejected observation "${id}" was not returned from Supabase.`);
  },
};
