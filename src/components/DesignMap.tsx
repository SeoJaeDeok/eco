import type { Taxon } from '../types';
import type { EcoLocationPickerProps, LocationPickerProps, StaticMapProps } from '../features/map/mapTypes';
import { getActiveMapProvider } from '../features/map/mapProvider';

export const DesignMap = ({ observations = [], onSelect, onSelectObservation, selectedObservationId, center, zoom, onMapClick, className }: StaticMapProps) => {
  const MapComponent = getActiveMapProvider().EcoMap;

  return (
    <MapComponent
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
  const PositionPreview = getActiveMapProvider().PositionPreview;
  return <PositionPreview coordinates={{ lat, lng }} taxon={taxon} />;
};

type DesignMarkerPickerProps = Partial<LocationPickerProps> & Partial<EcoLocationPickerProps>;

export const DesignMarkerPicker = ({ value, center, onChange, onLocationSelect, className }: DesignMarkerPickerProps) => {
  const LocationPicker = getActiveMapProvider().LocationPicker;
  return (
    <LocationPicker
      value={value}
      center={center}
      onChange={(coords) => {
        onChange?.(coords);
        onLocationSelect?.(coords.lat, coords.lng);
      }}
      className={className}
    />
  );
};
