import {
  formatTaxonomySourceLabel,
  TAXONOMY_RANK_LABELS_KO,
  TAXONOMY_RANK_ORDER,
  type TaxonomyRank,
} from '../../features/taxonomy/taxonomyCore';
import type { CreateObservationInput, Observation, OwnerObservationUpdateInput } from '../../types';
import { normalizeObserverDisplayName } from '../../utils/observerDisplay';
import type {
  ObservationContentUpdateRow,
  ObservationDbRow,
  ObservationInsertRow,
  PublicTaxonDbRow,
} from './observationDbTypes';

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

const getEmbeddedTaxonRow = (value: ObservationDbRow['taxa']) => {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
};

const getTaxonRankName = (taxon: PublicTaxonDbRow, rank: TaxonomyRank) => {
  switch (rank) {
    case 'kingdom':
      return taxon.kingdom_name;
    case 'phylum':
      return taxon.phylum_name;
    case 'class':
      return taxon.class_name;
    case 'order':
      return taxon.order_name;
    case 'family':
      return taxon.family_name;
    case 'genus':
      return taxon.genus_name;
    case 'species':
      return taxon.species_name;
  }
};

export const mapPublicTaxonDbRowToObservationTaxonomyLineage = (
  taxon: PublicTaxonDbRow,
  reportedScientificName: string,
): Observation['taxonomy'] => ({
  reportedScientificName,
  acceptedScientificName: taxon.accepted_scientific_name,
  canonicalName: taxon.canonical_name,
  terminalRank: taxon.terminal_rank,
  taxonomicStatus: taxon.taxonomic_status,
  sourceLabel: formatTaxonomySourceLabel(taxon.source),
  ranks: TAXONOMY_RANK_ORDER.map((rank) => ({
    rank,
    rankLabelKo: TAXONOMY_RANK_LABELS_KO[rank],
    name: getTaxonRankName(taxon, rank),
  })),
});

export const mapObservationRowToObservation = (
  row: ObservationDbRow,
  displayFields?: ObservationDisplayFields,
): Observation => {
  const observerDisplayName = normalizeObserverDisplayName(row.observer_display_name);
  const taxon = getEmbeddedTaxonRow(row.taxa);
  const taxonomy = row.taxon_id && taxon
    ? mapPublicTaxonDbRowToObservationTaxonomyLineage(taxon, row.scientific_name ?? '')
    : null;

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
    ...(row.image_path ? { imagePath: row.image_path } : {}),
    ...(row.observer_id ? { observerId: row.observer_id } : {}),
    ...(observerDisplayName ? { observerDisplayName } : {}),
    ...(row.taxon_id ? { taxonId: row.taxon_id } : {}),
    ...(row.taxonomy_match_type ? { taxonomyMatchType: row.taxonomy_match_type } : {}),
    ...(row.taxonomy_verified_at ? { taxonomyVerifiedAt: row.taxonomy_verified_at } : {}),
    ...(taxonomy ? { taxonomy } : {}),
    taxonomyConfidence: row.taxonomy_confidence,
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

export const mapOwnerObservationUpdateInputToUpdateRow = (
  input: OwnerObservationUpdateInput,
): ObservationContentUpdateRow => {
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
