import type { ReactNode } from 'react';
import { TAXA } from '../../constants/taxon';
import type { CreateObservationFormValues } from '../../types';

interface UploadObservationFieldsProps {
  formData: CreateObservationFormValues;
  onChange: (values: CreateObservationFormValues) => void;
  children?: ReactNode;
}

export const UploadObservationFields = ({ formData, onChange, children }: UploadObservationFieldsProps) => {
  const updateField = <Key extends keyof CreateObservationFormValues>(key: Key, value: CreateObservationFormValues[Key]) => {
    onChange({ ...formData, [key]: value });
  };

  return (
    <>
      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-1.5 opacity-40">분류군</label>
        <div className="flex flex-wrap gap-1.5">
          {TAXA.map((taxon) => (
            <button
              type="button"
              key={taxon}
              onClick={() => updateField('taxon', taxon)}
              className={`px-3 py-1.5 text-[10px] font-light border transition-all ${formData.taxon === taxon ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}
            >
              {taxon}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="국명 / 종명 *" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" />
        <input type="text" placeholder="학명 (선택사항)" value={formData.scientificName} onChange={(e) => updateField('scientificName', e.target.value)} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white italic" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="관찰 위치 (선택사항)" value={formData.location} onChange={(e) => updateField('location', e.target.value)} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" />
        <input type="text" placeholder="날짜 (예: 2026-05-19 13:00)" value={formData.date} onChange={(e) => updateField('date', e.target.value)} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" />
      </div>

      {children}

      <textarea placeholder="상세 설명" value={formData.description} onChange={(e) => updateField('description', e.target.value)} className="w-full border border-zinc-100 p-2.5 text-xs h-24 focus:outline-none focus:border-black bg-white resize-none" />
    </>
  );
};
