import { X } from 'lucide-react';
import type { Observation } from '../../../types';
import { TaxonBadge } from '../../TaxonBadge';

interface ObservationDetailHeaderProps {
  observation: Observation;
  onClose: () => void;
}

export const ObservationDetailHeader = ({ observation, onClose }: ObservationDetailHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-12">
      <div className="text-left">
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2"><TaxonBadge taxon={observation.taxon} variant="text" /> • {observation.location} • {observation.date}</p>
        <h2 className="font-serif text-4xl mb-2">{observation.name}</h2>
        <p className="text-sm italic opacity-50 font-light">{observation.scientificName}</p>
      </div>
      <button type="button" onClick={onClose} className="p-2 hover:opacity-50 transition-opacity" aria-label="닫기"><X size={24} /></button>
    </div>
  );
};
