import type { Coordinates } from '../../types';
import { DesignMarkerPicker } from '../DesignMap';

interface UploadLocationSectionProps {
  coords: Coordinates | null;
  onLocationSelect: (coords: Coordinates) => void;
}

export const UploadLocationSection = ({ coords, onLocationSelect }: UploadLocationSectionProps) => {
  return (
    <>
      <div className="h-64 rounded-sm overflow-hidden border border-zinc-100">
        <DesignMarkerPicker onLocationSelect={(lat, lng) => onLocationSelect({ lat, lng })} />
      </div>
      {coords && <p className="text-[9px] font-mono opacity-40">선택 위치: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>}
    </>
  );
};
