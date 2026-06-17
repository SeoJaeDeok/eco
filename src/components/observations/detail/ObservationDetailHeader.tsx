import { Pencil, X } from 'lucide-react';
import type { Observation } from '../../../types';
import { TaxonBadge } from '../../TaxonBadge';

interface ObservationDetailHeaderProps {
  observation: Observation;
  canEdit?: boolean;
  isEditing?: boolean;
  onClose: () => void;
  onStartEdit?: () => void;
}

export const ObservationDetailHeader = ({
  observation,
  canEdit = false,
  isEditing = false,
  onClose,
  onStartEdit,
}: ObservationDetailHeaderProps) => {
  return (
    <div className="mb-12 flex justify-between gap-4 items-start">
      <div className="text-left">
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2"><TaxonBadge taxon={observation.taxon} variant="text" /> · {observation.location} · {observation.date}</p>
        <h2 className="font-serif text-4xl mb-2">{observation.name}</h2>
        <p className="text-sm italic opacity-50 font-light">{observation.scientificName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canEdit && !isEditing && onStartEdit && (
          <button
            type="button"
            onClick={onStartEdit}
            className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600 transition-all hover:border-zinc-900 hover:text-zinc-900"
            aria-label="관찰 기록 수정"
          >
            <Pencil size={13} aria-hidden="true" />
            <span>수정</span>
          </button>
        )}
        <button type="button" onClick={onClose} className="p-2 hover:opacity-50 transition-opacity" aria-label="닫기"><X size={24} /></button>
      </div>
    </div>
  );
};
