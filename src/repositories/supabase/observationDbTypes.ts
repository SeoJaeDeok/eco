import type { Taxon } from '../../types';

export type ObservationDbStatus = 'pending' | 'approved' | 'rejected';

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
}

export type ObservationUpdateRow = Partial<
  Pick<
    ObservationDbRow,
    | 'name'
    | 'scientific_name'
    | 'taxon'
    | 'location'
    | 'observed_date'
    | 'description'
    | 'latitude'
    | 'longitude'
    | 'image_url'
    | 'image_path'
    | 'image_mime_type'
    | 'image_size_bytes'
    | 'status'
  >
>;
