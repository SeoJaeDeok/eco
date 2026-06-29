import type { TaxonomyLineage } from '../../features/taxonomy/taxonomyCore';
import {
  getTaxonomyTreeChildren,
  getTaxonomyTreeObservationIdsForSelection,
  getTaxonomyTreeRootNodes,
  type TaxonomyTreeObservationSummary,
  type TaxonomyTreeTaxonSummary,
} from '../../features/taxonomy/taxonomyTree';
import type { TaxonomyTreeRepository } from '../taxonomyTreeRepository';
import type { ObservationDbStatus, PublicTaxonDbRow } from './observationDbTypes';
import { getSupabaseClient } from './supabaseClient';

const OBSERVATIONS_TABLE = 'observations';
const TAXONOMY_TREE_SELECT = `
  id,
  status,
  taxon_id,
  taxa!observations_taxon_id_fkey (
    source,
    source_checklist_key,
    source_taxon_key,
    accepted_scientific_name,
    canonical_name,
    terminal_rank,
    taxonomic_status,
    kingdom_key,
    kingdom_name,
    phylum_key,
    phylum_name,
    class_key,
    class_name,
    order_key,
    order_name,
    family_key,
    family_name,
    genus_key,
    genus_name,
    species_key,
    species_name
  )
`;

interface SupabaseTaxonomyTreeObservationRow {
  id: string;
  status: ObservationDbStatus;
  taxon_id: string | null;
  taxa: PublicTaxonDbRow | PublicTaxonDbRow[] | null;
}

const createRepositoryError = (message: string, cause: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
};

const getEmbeddedTaxonRow = (value: SupabaseTaxonomyTreeObservationRow['taxa']) => {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
};

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isUsableTaxonRow = (value: PublicTaxonDbRow | null): value is PublicTaxonDbRow & {
  source_checklist_key: string;
  source_taxon_key: string;
  taxonomic_status: string;
} => {
  return value !== null
    && hasText(value.source)
    && hasText(value.source_checklist_key)
    && hasText(value.source_taxon_key)
    && hasText(value.accepted_scientific_name)
    && hasText(value.terminal_rank)
    && hasText(value.taxonomic_status);
};

const lineageFromTaxonRow = (taxon: PublicTaxonDbRow): TaxonomyLineage => ({
  kingdom: { key: taxon.kingdom_key ?? null, name: taxon.kingdom_name },
  phylum: { key: taxon.phylum_key ?? null, name: taxon.phylum_name },
  class: { key: taxon.class_key ?? null, name: taxon.class_name },
  order: { key: taxon.order_key ?? null, name: taxon.order_name },
  family: { key: taxon.family_key ?? null, name: taxon.family_name },
  genus: { key: taxon.genus_key ?? null, name: taxon.genus_name },
  species: { key: taxon.species_key ?? null, name: taxon.species_name },
});

const mapTaxonRowToTreeSummary = (
  taxon: PublicTaxonDbRow & {
    source_checklist_key: string;
    source_taxon_key: string;
    taxonomic_status: string;
  },
): TaxonomyTreeTaxonSummary => ({
  source: taxon.source,
  sourceChecklistKey: taxon.source_checklist_key,
  terminalSourceKey: taxon.source_taxon_key,
  acceptedScientificName: taxon.accepted_scientific_name,
  canonicalName: taxon.canonical_name,
  terminalRank: taxon.terminal_rank,
  taxonomicStatus: taxon.taxonomic_status,
  lineage: lineageFromTaxonRow(taxon),
});

const mapObservationRowToTreeSummary = (
  row: SupabaseTaxonomyTreeObservationRow,
): TaxonomyTreeObservationSummary | null => {
  const taxon = getEmbeddedTaxonRow(row.taxa);

  if (!row.taxon_id || !isUsableTaxonRow(taxon)) {
    return null;
  }

  return {
    observationId: row.id,
    status: row.status,
    taxonId: row.taxon_id,
    taxon: mapTaxonRowToTreeSummary(taxon),
  };
};

let cachedSummaries: TaxonomyTreeObservationSummary[] | null = null;

const loadApprovedLinkedSummaries = async () => {
  if (cachedSummaries) {
    return cachedSummaries;
  }

  const { data, error } = await getSupabaseClient()
    .from(OBSERVATIONS_TABLE)
    .select(TAXONOMY_TREE_SELECT)
    .eq('status', 'approved')
    .not('taxon_id', 'is', null);

  if (error) {
    throw createRepositoryError('Failed to load taxonomy tree rows from Supabase.', error);
  }

  cachedSummaries = ((data ?? []) as SupabaseTaxonomyTreeObservationRow[])
    .map(mapObservationRowToTreeSummary)
    .filter((summary): summary is TaxonomyTreeObservationSummary => summary !== null);

  return cachedSummaries;
};

export const supabaseTaxonomyTreeRepository: TaxonomyTreeRepository = {
  async getRootNodes() {
    const summaries = await loadApprovedLinkedSummaries();
    return getTaxonomyTreeRootNodes(summaries);
  },

  async getChildren(parent) {
    const summaries = await loadApprovedLinkedSummaries();
    return getTaxonomyTreeChildren(summaries, parent);
  },

  async getObservationIdsForSelection(selection) {
    const summaries = await loadApprovedLinkedSummaries();
    return getTaxonomyTreeObservationIdsForSelection(summaries, selection);
  },
};
