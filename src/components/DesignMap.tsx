import type { Taxon } from '../types';
import type { EcoLocationPickerProps, LocationPickerProps, StaticMapProps } from '../features/map/mapTypes';
import { StaticEcoMap } from './map/StaticEcoMap';
import { StaticLocationPicker } from './map/StaticLocationPicker';
import { StaticPositionPreview } from './map/StaticPositionPreview';

export const DesignMap = ({ observations = [], onSelect, onSelectObservation, selectedObservationId, center, zoom, onMapClick, className }: StaticMapProps) => {
  return (
    <StaticEcoMap
      observations={observations}
      selectedObservationId={selectedObservationId}
      center={center}
      zoom={zoom}
      onSelectObservation={onSelectObservation ?? onSelect}
      onMapClick={onMapClick}
      className={className}
    />
  );
};

export const StaticDesignMap = ({ lat, lng, taxon }: { lat: number; lng: number; taxon?: Taxon }) => {
  return <StaticPositionPreview coordinates={{ lat, lng }} taxon={taxon} />;
};

type DesignMarkerPickerProps = Partial<LocationPickerProps> & Partial<EcoLocationPickerProps>;

export const DesignMarkerPicker = ({ value, center, onChange, onLocationSelect, className }: DesignMarkerPickerProps) => {
  return <StaticLocationPicker value={value} center={center} onChange={onChange} onLocationSelect={onLocationSelect} className={className} />;
};
