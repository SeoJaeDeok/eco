import type { Observation } from '../types';
import { getActiveMapProviderKind } from '../features/map/mapProvider';
import { DesignMap } from './DesignMap';
import { MapLegend } from './map/MapLegend';
import { MapNoticePanel } from './map/MapNoticePanel';

interface MapPreviewProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
  title?: string;
  noticeClassName?: string;
}

export const MapPreview = ({
  observations,
  onSelect,
  title = 'API 없이 보존된 생태지도 디자인',
  noticeClassName = 'absolute top-6 left-6 z-20 bg-white/85 backdrop-blur-sm border border-zinc-100 px-4 py-3 shadow-sm max-w-xs',
}: MapPreviewProps) => {
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
            description="Kakao 지도를 사용할 수 없을 때는 정적 생태지도에서 마커와 위치 흐름을 확인합니다."
            className={noticeClassName}
          />
        </>
      )}
      <MapLegend />
    </div>
  );
};
