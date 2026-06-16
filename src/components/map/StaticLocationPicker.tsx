import { useEffect, useState, type MouseEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import { DEFAULT_MAP_BOUNDS, DEFAULT_MAP_CENTER, percentToCoordinates, projectCoordinatesToPercent } from '../../features/map/mapProjection';
import type { Coordinates, EcoLocationPickerProps, LocationPickerProps } from '../../features/map/mapTypes';
import { CampusLabels, MapTexture } from './StaticMapDecor';

type StaticLocationPickerProps = Partial<EcoLocationPickerProps> & Partial<LocationPickerProps>;

export const StaticLocationPicker = ({ value, center = DEFAULT_MAP_CENTER, onChange, onLocationSelect, className }: StaticLocationPickerProps) => {
  const [coords, setCoords] = useState<Coordinates | null>(value ?? null);
  const [marker, setMarker] = useState<{ left: string; top: string }>(() => projectCoordinatesToPercent(value ?? center));
  const rootClassName = className
    ? `w-full h-full border border-zinc-200 relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-emerald-50 cursor-crosshair ${className}`
    : 'w-full h-full border border-zinc-200 relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-emerald-50 cursor-crosshair';

  useEffect(() => {
    if (!value) return;
    setCoords(value);
    setMarker(projectCoordinatesToPercent(value));
  }, [value]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const next = percentToCoordinates(x, y, DEFAULT_MAP_BOUNDS);
    setCoords(next);
    setMarker({ left: `${x * 100}%`, top: `${y * 100}%` });
    onChange?.(next);
    onLocationSelect?.(next.lat, next.lng);
  };

  return (
    <div className={rootClassName} id="design-picker-container" onClick={handleClick}>
      <MapTexture />
      <CampusLabels />
      <div className="absolute inset-4 border border-zinc-200/60" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 border border-zinc-200 text-[10px] tracking-wider uppercase opacity-80 z-10 pointer-events-none">
        지도를 클릭해 관찰 위치를 선택하세요
      </div>
      <span className="absolute z-20 block w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 transition-all" style={marker} />
      {coords && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 border border-zinc-200 text-[8px] opacity-60 z-10 pointer-events-none">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      )}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700">
          <Plus size={15} strokeWidth={2.5} />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700">
          <Minus size={15} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};
