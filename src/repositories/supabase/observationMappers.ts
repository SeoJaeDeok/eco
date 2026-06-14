import type { CreateObservationInput, Observation } from '../../types';
import type { ObservationDbRow, ObservationInsertRow } from './observationDbTypes';

const nullableText = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const mapObservationRowToObservation = (row: ObservationDbRow): Observation => {
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
    imageUrl: row.image_url ?? '',
    status: row.status,
  };
};

export const mapObservationRowsToObservations = (rows: ObservationDbRow[]) => {
  return rows.map(mapObservationRowToObservation);
};

export const mapCreateObservationInputToInsertRow = (input: CreateObservationInput): ObservationInsertRow => {
  return {
    name: input.name,
    scientific_name: nullableText(input.scientificName),
    taxon: input.taxon,
    location: input.location,
    observed_date: input.date,
    description: nullableText(input.description),
    latitude: input.coords.lat,
    longitude: input.coords.lng,
  };
};
