import { MapPreview } from './MapPreview';
import type { Observation } from '../types';

interface MapPageProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
}

export const MapPage = ({ observations, onSelect }: MapPageProps) => {
  return (
    <div className="h-screen flex flex-col pt-20" id="map-page">
      <div className="flex-1 w-full bg-zinc-100 overflow-hidden relative">
        <MapPreview observations={observations} onSelect={onSelect} title="API 없이 보존한 생태지도 디자인" />
      </div>
    </div>
  );
};
