import { DEFAULT_MAP_BOUNDS, projectCoordinatesToPercent } from '../../features/map/mapProjection';
import type { StaticPositionPreviewProps } from '../../features/map/mapTypes';
import { TaxonBadge } from '../TaxonBadge';
import { CampusLabels, MapTexture } from './StaticMapDecor';

export const StaticPositionPreview = ({ coordinates, taxon }: StaticPositionPreviewProps) => {
  const pos = projectCoordinatesToPercent(coordinates, DEFAULT_MAP_BOUNDS);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-emerald-50">
      <MapTexture />
      <CampusLabels />
      <div className="absolute inset-4 border border-zinc-200/60" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 border border-zinc-200 text-[8px] tracking-wider uppercase opacity-60 z-10">
        Static Position Preview
      </div>
      <TaxonBadge taxon={taxon ?? '기타'} variant="marker" className="absolute z-20 block w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2" style={pos} />
    </div>
  );
};
