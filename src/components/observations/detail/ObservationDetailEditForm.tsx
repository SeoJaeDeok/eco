import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TAXA } from '../../../constants/taxon';
import type { Observation, OwnerObservationUpdateInput } from '../../../types';
import { Button } from '../../ui/Button';

interface ObservationDetailEditFormProps {
  observation: Observation;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: OwnerObservationUpdateInput) => void;
}

interface ObservationEditFormValues {
  name: string;
  scientificName: string;
  taxon: Observation['taxon'];
  location: string;
  date: string;
  description: string;
  lat: string;
  lng: string;
}

const createFormValues = (observation: Observation): ObservationEditFormValues => ({
  name: observation.name,
  scientificName: observation.scientificName,
  taxon: observation.taxon,
  location: observation.location,
  date: observation.date,
  description: observation.description,
  lat: String(observation.coords.lat),
  lng: String(observation.coords.lng),
});

export const ObservationDetailEditForm = ({
  observation,
  errorMessage,
  isSubmitting,
  onCancel,
  onSubmit,
}: ObservationDetailEditFormProps) => {
  const [values, setValues] = useState<ObservationEditFormValues>(() => createFormValues(observation));
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const updateField = <Key extends keyof ObservationEditFormValues>(
    key: Key,
    value: ObservationEditFormValues[Key],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setValidationMessage(null);
  };

  const handleInputChange = (key: Exclude<keyof ObservationEditFormValues, 'taxon'>) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateField(key, event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const lat = Number(values.lat);
    const lng = Number(values.lng);

    if (!values.name.trim() || !values.location.trim() || !values.date.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setValidationMessage('필수 항목과 좌표 값을 확인해 주세요.');
      return;
    }

    onSubmit({
      name: values.name,
      scientificName: values.scientificName.trim() ? values.scientificName : undefined,
      taxon: values.taxon,
      location: values.location,
      date: values.date,
      description: values.description.trim() ? values.description : undefined,
      coords: { lat, lng },
    });
  };

  const fieldClassName = 'w-full border border-zinc-100 bg-white p-2.5 text-xs focus:border-black focus:outline-none';

  return (
    <form className="space-y-5" onSubmit={handleSubmit} aria-label="관찰 기록 수정">
      <div>
        <h4 className="mb-2 border-b border-zinc-100 pb-1 text-[10px] uppercase tracking-widest opacity-30">기록 수정</h4>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-name">
          관찰명
        </label>
        <input
          id="observation-edit-name"
          type="text"
          value={values.name}
          onChange={handleInputChange('name')}
          className={fieldClassName}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-scientific-name">
          학명
        </label>
        <input
          id="observation-edit-scientific-name"
          type="text"
          value={values.scientificName}
          onChange={handleInputChange('scientificName')}
          className={`${fieldClassName} italic`}
        />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-widest opacity-40">분류군</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="분류군 선택">
          {TAXA.map((taxon) => (
            <button
              type="button"
              key={taxon}
              onClick={() => updateField('taxon', taxon)}
              className={`border px-3 py-1.5 text-[10px] font-light transition-all ${
                values.taxon === taxon
                  ? 'border-black bg-black text-white'
                  : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-300'
              }`}
            >
              {taxon}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-location">
            관찰 위치
          </label>
          <input
            id="observation-edit-location"
            type="text"
            value={values.location}
            onChange={handleInputChange('location')}
            className={fieldClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-date">
            관찰 일시
          </label>
          <input
            id="observation-edit-date"
            type="text"
            value={values.date}
            onChange={handleInputChange('date')}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-lat">
            위도
          </label>
          <input
            id="observation-edit-lat"
            type="number"
            step="any"
            value={values.lat}
            onChange={handleInputChange('lat')}
            className={fieldClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-lng">
            경도
          </label>
          <input
            id="observation-edit-lng"
            type="number"
            step="any"
            value={values.lng}
            onChange={handleInputChange('lng')}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest opacity-40" htmlFor="observation-edit-description">
          상세 설명
        </label>
        <textarea
          id="observation-edit-description"
          value={values.description}
          onChange={handleInputChange('description')}
          className={`${fieldClassName} h-28 resize-none`}
        />
      </div>

      {(validationMessage || errorMessage) && (
        <p className="border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
          {validationMessage || errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 border border-zinc-900 bg-zinc-900 px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-white transition-all hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '저장 중' : '변경 저장'}
        </Button>
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 border border-zinc-200 bg-white px-5 py-3 text-[10px] font-medium uppercase tracking-widest text-zinc-600 transition-all hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          취소
        </Button>
      </div>
    </form>
  );
};
