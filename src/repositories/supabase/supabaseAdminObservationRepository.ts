import type { AdminObservationRepository } from '../adminObservationRepository';
import type { ObservationDbRow } from './observationDbTypes';
import { mapObservationRowToObservation, mapObservationRowsToObservations } from './observationMappers';
import { getSupabaseClient } from './supabaseClient';

const OBSERVATIONS_TABLE = 'observations';

const createAdminRepositoryError = (message: string, cause: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
};

const mapRequiredObservationRow = (row: ObservationDbRow | null, message: string) => {
  if (!row) {
    throw new Error(message);
  }

  return mapObservationRowToObservation(row);
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

    return mapObservationRowsToObservations((data ?? []) as ObservationDbRow[]);
  },

  async listAllObservations() {
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw createAdminRepositoryError('Failed to list all observations from Supabase.', error);
    }

    return mapObservationRowsToObservations((data ?? []) as ObservationDbRow[]);
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
