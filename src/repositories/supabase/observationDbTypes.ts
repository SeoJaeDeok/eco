import type { Taxon } from '../../types';

export type ObservationDbStatus = 'pending' | 'approved' | 'rejected';

export interface PublicTaxonDbRow {
  source: string;
  source_checklist_key?: string | null;
  source_taxon_key?: string | null;
  accepted_scientific_name: string;
  canonical_name: string | null;
  terminal_rank: string;
  taxonomic_status: string | null;
  kingdom_key?: string | null;
  kingdom_name: string | null;
  phylum_key?: string | null;
  phylum_name: string | null;
  class_key?: string | null;
  class_name: string | null;
  order_key?: string | null;
  order_name: string | null;
  family_key?: string | null;
  family_name: string | null;
  genus_key?: string | null;
  genus_name: string | null;
  species_key?: string | null;
  species_name: string | null;
}

export interface ObservationDbRow {
  id: string;
  name: string;
  scientific_name: string | null;
  taxon: Taxon;
  location: string;
  observed_date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  image_path: string | null;
  image_mime_type: string | null;
  image_size_bytes: number | null;
  status: ObservationDbStatus;
  observer_id: string | null;
  observer_display_name: string | null;
  taxon_id: string | null;
  taxonomy_match_type: string | null;
  taxonomy_confidence: number | null;
  taxonomy_verified_at: string | null;
  taxa?: PublicTaxonDbRow | PublicTaxonDbRow[] | null;
  created_at: string;
  updated_at: string;
}

export interface ObservationInsertRow {
  name: string;
  scientific_name: string | null;
  taxon: Taxon;
  location: string;
  observed_date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_path?: string;
  image_mime_type?: string;
  image_size_bytes?: number;
  status?: ObservationDbStatus;
  observer_id?: string;
  observer_display_name?: string;
}

export interface ObservationContentUpdateRow {
  name: string;
  scientific_name: string | null;
  taxon: Taxon;
  location: string;
  observed_date: string;
  description: string | null;
  latitude: number;
  longitude: number;
}
