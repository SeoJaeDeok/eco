import type { Observation } from '../../types';
import { TaxonBadge } from '../TaxonBadge';
import { ImageFrame } from '../ui/ImageFrame';

interface ObservationCardProps {
  observation: Observation;
  onSelect: (observation: Observation) => void;
}

export const ObservationCard = ({ observation, onSelect }: ObservationCardProps) => {
  return (
    <button type="button" className="group cursor-pointer text-left" onClick={() => onSelect(observation)}>
      <ImageFrame
        src={observation.imageUrl}
        alt={observation.name}
        className="aspect-square bg-zinc-50 border border-zinc-100 mb-1.5 overflow-hidden relative transition-all duration-700 flex items-center justify-center"
        imageClassName="w-full h-full object-contain"
        placeholder={<div className="text-zinc-300 font-serif text-[10px] italic">No Photo</div>}
      />
      <p className="text-[9px] tracking-widest uppercase opacity-40 mb-0.5 ml-[1px]"><TaxonBadge taxon={observation.taxon} variant="text" /> • {observation.location} • {observation.date}</p>
      <h3 className="text-[11px] font-medium opacity-70 ml-[1px] group-hover:opacity-100 transition-opacity leading-tight truncate">{observation.name}</h3>
    </button>
  );
};
