import type { Observation } from '../../types';
import { TaxonBadge } from '../TaxonBadge';
import { ImageFrame } from '../ui/ImageFrame';

interface AdminObservationCardProps {
  observation: Observation;
  isSelected: boolean;
  onSelect: (observation: Observation) => void;
}

export const AdminObservationCard = ({ observation, isSelected, onSelect }: AdminObservationCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(observation)}
      className={`w-full border bg-white p-3 text-left transition-colors hover:border-zinc-900 ${
        isSelected ? 'border-zinc-900' : 'border-zinc-200'
      }`}
      data-admin-pending-card={observation.id}
    >
      <div className="flex gap-3">
        <ImageFrame
          src={observation.imageUrl}
          alt={observation.name}
          className="flex h-20 w-20 shrink-0 items-center justify-center border border-zinc-100 bg-zinc-50"
          imageClassName="h-full w-full object-contain"
          placeholder={<div className="text-[10px] font-serif italic text-zinc-300">No Photo</div>}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <TaxonBadge taxon={observation.taxon} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">pending</span>
          </div>
          <h3 className="truncate text-sm font-medium text-zinc-950">{observation.name}</h3>
          <p className="mt-1 truncate text-xs italic text-zinc-500">{observation.scientificName || 'Scientific name pending'}</p>
          <p className="mt-2 truncate text-[11px] uppercase tracking-[0.12em] text-zinc-400">
            {observation.location} / {observation.date}
          </p>
        </div>
      </div>
    </button>
  );
};
