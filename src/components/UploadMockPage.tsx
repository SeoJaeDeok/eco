import { useState, type ChangeEvent } from 'react';
import { createDefaultUploadFormValues, createImagePreviewUrl, createObservationInputFromForm } from '../features/upload/uploadForm';
import { activeObservationRepository, getConfiguredObservationRepositoryKind } from '../repositories/observationRepositoryProvider';
import { validateObservationInput } from '../utils/observationValidation';
import type { ObservationRepository } from '../repositories/observationRepository';
import type { Coordinates, CreateObservationInput } from '../types';
import { UploadFormActions } from './upload/UploadFormActions';
import { UploadImagePicker } from './upload/UploadImagePicker';
import { UploadLocationSection } from './upload/UploadLocationSection';
import { UploadObservationFields } from './upload/UploadObservationFields';
import { PageHeader } from './ui/PageHeader';

interface UploadMockPageProps {
  onCancel: () => void;
  createObservation?: ObservationRepository['createObservation'];
}

const MOCK_UPLOAD_ALERT_MESSAGE = '현재 파일은 디자인 시안이라 저장 기능을 연결하지 않았습니다. 다음 단계에서 DB/API를 붙이면 됩니다.';
const REQUIRED_UPLOAD_ALERT_MESSAGE = '필수 항목을 입력하고 지도에서 관찰 위치를 선택해 주세요.';
const SUPABASE_UPLOAD_SUCCESS_MESSAGE = '관찰 기록이 접수되었습니다. 관리자 승인 후 공개 목록에 표시됩니다.';
const UPLOAD_FAILURE_ALERT_MESSAGE = '관찰 기록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';

export const UploadMockPage = ({ onCancel, createObservation = activeObservationRepository.createObservation }: UploadMockPageProps) => {
  const [formData, setFormData] = useState(createDefaultUploadFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSupabaseRepository = getConfiguredObservationRepositoryKind() === 'supabase';

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const imagePreviewUrl = await createImagePreviewUrl(file);
    setFormData((current) => ({ ...current, imageFile: file, imagePreviewUrl }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const input = createObservationInputFromForm(formData);
    const validationInput: Partial<CreateObservationInput> = input ?? {
      name: formData.name,
      scientificName: formData.scientificName || undefined,
      taxon: formData.taxon,
      location: formData.location,
      date: formData.date,
      description: formData.description || undefined,
      coords: formData.coords ?? undefined,
      imageFile: formData.imageFile ?? undefined,
      imagePreviewUrl: formData.imagePreviewUrl ?? undefined,
    };
    const validation = validateObservationInput(validationInput);

    if (!validation.isValid || !input) {
      console.warn('Invalid observation input.', validation.missingFields);
      alert(REQUIRED_UPLOAD_ALERT_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      await createObservation(input);
      alert(isSupabaseRepository ? SUPABASE_UPLOAD_SUCCESS_MESSAGE : MOCK_UPLOAD_ALERT_MESSAGE);
    } catch (error) {
      console.error('Failed to create observation.', error);
      alert(UPLOAD_FAILURE_ALERT_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (coords: Coordinates) => {
    setFormData((current) => ({ ...current, coords }));
  };

  return (
    <div className="min-h-screen pt-24 px-6 md:px-20 pb-20 max-w-2xl mx-auto" id="upload-page">
      <PageHeader
        title={<h2 className="font-serif text-2xl mb-3 text-center opacity-80 underline underline-offset-8 decoration-1 decoration-zinc-200">관찰 기록하기</h2>}
        description={(
          <p className="text-center text-[10px] text-zinc-400 tracking-wider mb-8">
            현재는 API 없는 디자인 시안입니다. 저장, 업로드, 지도 SDK는 연결하지 않았습니다.
          </p>
        )}
      />

      <div className="space-y-5 text-left">
        <UploadObservationFields formData={formData} onChange={setFormData}>
          <UploadImagePicker imagePreviewUrl={formData.imagePreviewUrl} onImageChange={handleImageChange} />
          <UploadLocationSection coords={formData.coords} onLocationSelect={handleLocationSelect} />
        </UploadObservationFields>
        <UploadFormActions onCancel={onCancel} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};
