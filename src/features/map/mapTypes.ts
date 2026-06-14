import type { Coordinates, Observation, Taxon } from '../../types';

export type { Coordinates };

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapMarker {
  id: string;
  name: string;
  coords: Coordinates;
  taxon: Taxon;
  observation: Observation;
}

export type MapProviderKind = 'static';

export interface StaticMapProps {
  observations?: Observation[];
  onSelect?: (obs: Observation) => void;
}

export interface StaticPositionPreviewProps {
  coordinates: Coordinates;
  taxon?: Taxon;
}

export interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}
