import type { Taxon } from '../types';
import type { LocationPickerProps, StaticMapProps } from '../features/map/mapTypes';
import { StaticEcoMap } from './map/StaticEcoMap';
import { StaticLocationPicker } from './map/StaticLocationPicker';
import { StaticPositionPreview } from './map/StaticPositionPreview';

export const DesignMap = ({ observations = [], onSelect }: StaticMapProps) => {
  return <StaticEcoMap observations={observations} onSelect={onSelect} />;
};

export const StaticDesignMap = ({ lat, lng, taxon }: { lat: number; lng: number; taxon?: Taxon }) => {
  return <StaticPositionPreview coordinates={{ lat, lng }} taxon={taxon} />;
};

export const DesignMarkerPicker = ({ onLocationSelect }: LocationPickerProps) => {
  return <StaticLocationPicker onLocationSelect={onLocationSelect} />;
};
