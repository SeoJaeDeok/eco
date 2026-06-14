import { TAXA } from '../../constants/taxon';
import { TaxonBadge } from '../TaxonBadge';

export const MapLegend = () => {
  return (
    <div className="absolute bottom-6 left-6 z-20 bg-white/80 backdrop-blur-sm p-3 border border-zinc-100 shadow-xl max-w-[160px]">
      <h4 className="text-[8px] tracking-[0.2em] uppercase opacity-40 mb-2 border-b border-zinc-100 pb-1">Legend</h4>
      <div className="space-y-1">
        {TAXA.map((taxon) => (
          <TaxonBadge key={taxon} taxon={taxon} variant="legend" />
        ))}
      </div>
    </div>
  );
};
