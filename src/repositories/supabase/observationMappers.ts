import type { CreateObservationInput, Observation } from '../../types';
import type { ObservationDbRow, ObservationInsertRow } from './observationDbTypes';

interface ObservationImageInsertFields {
  path: string;
  mimeType: string;
  sizeBytes: number;
}

interface ObservationDisplayFields {
  imageUrl?: string | null;
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
    ...(imageFields
      ? {
        image_path: imageFields.path,
        image_mime_type: imageFields.mimeType,
        image_size_bytes: imageFields.sizeBytes,
      }
      : {}),
  };
};
