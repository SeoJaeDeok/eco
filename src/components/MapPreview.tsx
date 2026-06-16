import type { Observation } from '../types';
import { getActiveMapProviderKind } from '../features/map/mapProvider';
import { DesignMap } from './DesignMap';
import { MapLegend } from './map/MapLegend';
import { MapNoticePanel } from './map/MapNoticePanel';

interface MapPreviewProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
  title?: string;
}

export const MapPreview = ({ observations, onSelect, title = 'API 없이 보존한 생태지도 디자인' }: MapPreviewProps) => {
  const isStaticMapProvider = getActiveMapProviderKind() === 'static';

  return (
    <div className="relative w-full h-full">
      <DesignMap observations={observations} onSelect={onSelect} />
      {isStaticMapProvider && (
        <>
      <div className="absolute top-24 right-6 z-10 bg-black text-white px-3 py-2 text-[9px] tracking-[0.2em] uppercase shadow-xl">
        No Map API
      </div>
      <MapNoticePanel
        title={title}
        description="카카오맵 스크립트, API 키, 서버 연결 없이 화면 구성만 확인합니다."
        className="absolute top-6 left-6 z-20 bg-white/85 backdrop-blur-sm border border-zinc-100 px-4 py-3 shadow-sm max-w-xs"
      />
        </>
      )}
      <MapLegend />
    </div>
  );
};
