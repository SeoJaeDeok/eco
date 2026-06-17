import type { CreateObservationInput, Observation } from '../../types';
import { normalizeObserverDisplayName } from '../../utils/observerDisplay';
import { countUniqueSpecies } from '../../utils/observationStats';
import type { ObservationRepository } from '../observationRepository';
import type { ObservationDbRow } from './observationDbTypes';
import {
  mapCreateObservationInputToInsertRow,
  mapOwnerObservationUpdateInputToUpdateRow,
  mapObservationRowToObservation,
  mapObservationRowsToObservations,
} from './observationMappers';
import {
  resolveObservationImageSignedUrl,
  uploadObservationImage,
} from './supabaseObservationImageStorage';
import { getSupabaseClient } from './supabaseClient';

const OBSERVATIONS_TABLE = 'observations';
const PROFILES_TABLE = 'profiles';

interface SupabaseContributionProfileRow {
  display_name: string | null;
}

const createRepositoryError = (message: string, cause: unknown) => {
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

const requireCurrentUserId = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw createRepositoryError('Observation updates require a signed-in user.', error);
  }

  return data.user.id;
};

const getCurrentContributor = async () => {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    throw createRepositoryError('Authenticated observation creation requires a signed-in user.', userError);
  }

  const { data: profileData, error: profileError } = await client
    .from(PROFILES_TABLE)
    .select('display_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw createRepositoryError('Failed to load contributor profile from Supabase.', profileError);
  }

  return {
    userId: userData.user.id,
    displayName: normalizeObserverDisplayName((profileData as SupabaseContributionProfileRow | null)?.display_name),
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
    const contributor = await getCurrentContributor();
    const uploadedImage = input.imageFile
      ? await uploadObservationImage(input.imageFile, { ownerId: contributor.userId })
      : undefined;
    const insertRow = mapCreateObservationInputToInsertRow(input, uploadedImage, {
      status: 'approved',
      observerId: contributor.userId,
      observerDisplayName: contributor.displayName,
    });
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .insert(insertRow)
      .select('*')
      .single();

    if (error) {
      // TODO: Define manual cleanup for uploaded orphan images if this insert fails.
      throw createRepositoryError('Failed to create approved observation in Supabase.', error);
    }

    return mapObservationRowWithSignedImageUrl(data as ObservationDbRow);
  },

  async updateOwnObservation(id, input) {
    const currentUserId = await requireCurrentUserId();

    const updateRow = mapOwnerObservationUpdateInputToUpdateRow(input);
    const { data, error } = await getSupabaseClient()
      .from(OBSERVATIONS_TABLE)
      .update(updateRow)
      .eq('id', id)
      .eq('status', 'approved')
      .eq('observer_id', currentUserId)
      .select('*')
      .single();

    if (error) {
      throw createRepositoryError(`Failed to update owned approved observation "${id}" in Supabase.`, error);
    }

    return mapObservationRowWithSignedImageUrl(data as ObservationDbRow);
  },
};
