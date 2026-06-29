import type { TaxonomyRank, TaxonomyRankLabelKo } from './features/taxonomy/taxonomyCore';

export type Taxon = '식물' | '포유류' | '조류' | '곤충' | '양서/파충류' | '균류' | '기타';

export type ObservationStatus = 'sample' | 'pending' | 'approved' | 'rejected';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ObservationTaxonomyLineageRank {
  rank: TaxonomyRank;
  rankLabelKo: TaxonomyRankLabelKo;
  name: string | null;
}

export interface ObservationTaxonomyLineage {
  reportedScientificName: string;
  acceptedScientificName: string;
  canonicalName: string | null;
  terminalRank: string;
  taxonomicStatus: string | null;
  sourceLabel: string | null;
  ranks: ObservationTaxonomyLineageRank[];
}

export interface Observation {
  id: string;
  name: string;
  scientificName: string;
  taxon: Taxon;
  location: string;
  date: string;
  description: string;
  coords: Coordinates;
  imageUrl: string;
  imagePath?: string;
  observerId?: string;
  observerDisplayName?: string;
  taxonId?: string;
  taxonomyMatchType?: string;
  taxonomyConfidence?: number | null;
  taxonomyVerifiedAt?: string;
  taxonomy?: ObservationTaxonomyLineage;
  status?: ObservationStatus;
  isFixed?: boolean;
}

export interface CreateObservationInput {
  name: string;
  scientificName?: string;
  taxon: Taxon;
  location: string;
  date: string;
  description?: string;
  coords: Coordinates;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export interface VerifiedTaxonomyObservationInput extends CreateObservationInput {
  scientificName: string;
  taxonomy: {
    taxonId: string;
    reportedScientificName: string;
    broadTaxon: Taxon;
  };
}

export interface OwnerObservationUpdateInput {
  name: string;
  scientificName?: string;
  taxon: Taxon;
  location: string;
  date: string;
  description?: string;
  coords: Coordinates;
}

export type AdminObservationUpdateInput = OwnerObservationUpdateInput;

export interface CreateObservationFormValues {
  name: string;
  scientificName: string;
  taxon: Taxon;
  location: string;
  date: string;
  description: string;
  coords: Coordinates | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

export type PageId = 'home' | 'intro' | 'observations' | 'map' | 'upload' | 'admin';
