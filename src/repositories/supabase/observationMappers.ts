import type { CreateObservationInput, Observation } from '../../types';
import { normalizeObserverDisplayName } from '../../utils/observerDisplay';
import type { ObservationDbRow, ObservationInsertRow } from './observationDbTypes';

interface ObservationImageInsertFields {
  path: string;
  mimeType: string;
  sizeBytes: number;
}

interface ObservationDisplayFields {
  imageUrl?: string | null;
}

interface CreateObservationInsertOptions {
  status?: ObservationInsertRow['status'];
  observerId?: string;
  observerDisplayName?: string;
}

const nullableText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const resolveObservationImageUrl = (row: ObservationDbRow, displayFields?: ObservationDisplayFields) => {
  return displayFields?.imageUrl ?? row.image_url ?? '';
};

export const mapObservationRowToObservation = (
  row: ObservationDbRow,
  displayFields?: ObservationDisplayFields,
): Observation => {
  const observerDisplayName = normalizeObserverDisplayName(row.observer_display_name);

  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name ?? '',
    taxon: row.taxon,
    location: row.location,
    date: row.observed_date,
    description: row.description ?? '',
    coords: {
      lat: row.latitude,
      lng: row.longitude,
    },
    imageUrl: resolveObservationImageUrl(row, displayFields),
    ...(observerDisplayName ? { observerDisplayName } : {}),
    status: row.status,
  };
};

export const mapObservationRowsToObservations = (
  rows: ObservationDbRow[],
  displayFieldsById?: Map<string, ObservationDisplayFields>,
) => {
  return rows.map((row) => mapObservationRowToObservation(row, displayFieldsById?.get(row.id)));
};

export const mapCreateObservationInputToInsertRow = (
  input: CreateObservationInput,
  imageFields?: ObservationImageInsertFields,
  options: CreateObservationInsertOptions = {},
): ObservationInsertRow => {
  return {
    name: input.name,
    scientific_name: nullableText(input.scientificName),
    taxon: input.taxon,
    location: input.location,
    observed_date: input.date,
    description: nullableText(input.description),
    latitude: input.coords.lat,
    longitude: input.coords.lng,
    ...(options.status ? { status: options.status } : {}),
    ...(options.observerId ? { observer_id: options.observerId } : {}),
    ...(options.observerDisplayName ? { observer_display_name: options.observerDisplayName } : {}),
    ...(imageFields
      ? {
        image_path: imageFields.path,
        image_mime_type: imageFields.mimeType,
        image_size_bytes: imageFields.sizeBytes,
      }
      : {}),
  };
};
