import { useMemo, useState } from 'react';
import { Map as MapIcon, Minus, Plus } from 'lucide-react';
import { createBoundsFromCoordinates, projectCoordinatesToPercent } from '../../features/map/mapProjection';
import type { StaticMapProps } from '../../features/map/mapTypes';
import { TaxonBadge } from '../TaxonBadge';
import { CampusLabels, MapTexture } from './StaticMapDecor';
import { MapNoticePanel } from './MapNoticePanel';

export const StaticEcoMap = ({ observations = [], onSelect, onSelectObservation, className }: StaticMapProps) => {
  const [zoom, setZoom] = useState(1);
  const handleSelectObservation = onSelectObservation ?? onSelect;
  const rootClassName = className ? `relative w-full h-full overflow-hidden bg-zinc-100 ${className}` : 'relative w-full h-full overflow-hidden bg-zinc-100';
  const bounds = useMemo(() => createBoundsFromCoordinates(observations.map((obs) => obs.coords)), [observations]);

  return (
    <div className={rootClassName} id="design-map">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-emerald-50" />
      <MapTexture />
      <div className="absolute inset-10 border border-zinc-200/70 bg-white/20 backdrop-blur-[1px]" />
      <CampusLabels />

      <MapNoticePanel
        title="Design Map"
        description="지도 SDK를 연결하지 않은 정적 시안입니다. 마커 배치와 상세 패널 디자인만 확인합니다."
        icon={<MapIcon size={14} className="text-zinc-500" />}
        className="absolute top-6 left-6 z-10 bg-white/85 backdrop-blur-sm border border-zinc-100 px-4 py-3 shadow-sm max-w-xs"
        titleClassName="text-[10px] tracking-[0.24em] uppercase text-zinc-500"
      />

      <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
        {observations.map((obs) => {
          const pos = projectCoordinatesToPercent(obs.coords, bounds);
          return (
            <button
              type="button"
              key={obs.id}
              onClick={() => handleSelectObservation?.(obs)}
              className="absolute z-20 group -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              style={pos}
              aria-label={`${obs.name} 관찰 지점`}
            >
              <TaxonBadge taxon={obs.taxon} variant="marker" className="block w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 group-focus:scale-150" />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border border-zinc-100 px-2 py-1 text-[10px] text-zinc-700 shadow-sm">
                {obs.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute right-4 bottom-6 z-30 flex flex-col gap-1.5">
        <button type="button" onClick={() => setZoom((value) => Math.min(1.24, value + 0.08))} className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer" title="확대">
          <Plus size={15} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.92, value - 0.08))} className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer" title="축소">
          <Minus size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
