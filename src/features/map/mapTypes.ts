import type { ComponentType } from 'react';
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

export type MapProviderKind = 'static' | 'kakao' | 'naver' | 'leaflet' | 'maplibre';

export interface EcoMapProps {
  observations: Observation[];
  selectedObservationId?: string | null;
  center?: Coordinates;
  zoom?: number;
  onSelectObservation?: (observation: Observation) => void;
  onMapClick?: (coords: Coordinates) => void;
  className?: string;
}

export interface StaticMapProps extends Partial<Omit<EcoMapProps, 'observations'>> {
  observations?: Observation[];
  onSelect?: (obs: Observation) => void;
}

export interface StaticPositionPreviewProps {
  coordinates: Coordinates;
  taxon?: Taxon;
}

export interface EcoLocationPickerProps {
  value?: Coordinates | null;
  center?: Coordinates;
  onChange: (coords: Coordinates) => void;
  className?: string;
}

export interface LocationPickerProps extends Partial<Omit<EcoLocationPickerProps, 'onChange'>> {
  onLocationSelect: (lat: number, lng: number) => void;
}

export interface MapProviderAdapter {
  kind: MapProviderKind;
  EcoMap: ComponentType<EcoMapProps>;
  LocationPicker: ComponentType<EcoLocationPickerProps>;
}
