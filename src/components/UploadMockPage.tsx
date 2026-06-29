import { useRef, useState, type ChangeEvent } from 'react';
import {
  MAX_OBSERVATION_IMAGE_SIZE_MB,
  MAX_OBSERVATION_IMAGE_SIZE_BYTES,
  isAllowedObservationImageMimeType,
} from '../constants/upload';
import { createDefaultUploadFormValues, createImagePreviewUrl, createObservationInputFromForm } from '../features/upload/uploadForm';
import {
  canSubmitWithVerifiedTaxonomy,
  createInitialTaxonomyVerificationState,
  getTaxonomySubmitBlockMessage,
  getTaxonomyVerificationStateAfterScientificNameChange,
  type UploadTaxonomyVerificationState,
} from '../features/upload/uploadTaxonomyVerification';
import { activeObservationRepository, getConfiguredObservationRepositoryKind } from '../repositories/observationRepositoryProvider';
import { activeTaxonomyRepository } from '../repositories/taxonomyRepositoryProvider';
import { validateObservationInput } from '../utils/observationValidation';
import type { ObservationRepository } from '../repositories/observationRepository';
import type { TaxonomyRepository, TaxonomyResolutionResult } from '../repositories/taxonomyRepository';
import type { Coordinates, CreateObservationInput, Observation } from '../types';
import { UploadFormActions } from './upload/UploadFormActions';
import { UploadImagePicker } from './upload/UploadImagePicker';
import { UploadLocationSection } from './upload/UploadLocationSection';
import { UploadObservationFields } from './upload/UploadObservationFields';
import { UploadTaxonomyVerificationPanel } from './upload/UploadTaxonomyVerificationPanel';
import { PageHeader } from './ui/PageHeader';

const TAXONOMY_CREATE_SUCCESS_MESSAGE = '학명 확인이 끝난 관찰 기록을 등록했습니다. 공개 목록에 바로 표시됩니다.';

interface UploadMockPageProps {
  onCancel: () => void;
  createObservationWithVerifiedTaxonomy?: ObservationRepository['createObservationWithVerifiedTaxonomy'];
  taxonomyRepository?: TaxonomyRepository;
  onObservationCreated?: (observation: Observation) => void;
}

const MOCK_UPLOAD_ALERT_MESSAGE = '현재 파일은 디자인 시안이라 저장 기능을 연결하지 않았습니다. 다음 단계에서 DB/API를 붙이면 됩니다.';
const REQUIRED_UPLOAD_ALERT_MESSAGE = '필수 항목을 입력하고 지도에서 관찰 위치를 선택해 주세요.';
const UPLOAD_FAILURE_ALERT_MESSAGE = '관찰 기록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';

const ACCEPTED_IMAGE_FORMATS_LABEL = 'JPG, PNG, WebP';
const UNSUPPORTED_IMAGE_TYPE_ALERT_MESSAGE = `사진은 ${ACCEPTED_IMAGE_FORMATS_LABEL} 형식만 업로드할 수 있습니다.`;
const OVERSIZED_IMAGE_ALERT_MESSAGE = `사진은 ${ACCEPTED_IMAGE_FORMATS_LABEL} 형식으로 ${MAX_OBSERVATION_IMAGE_SIZE_MB}MB 이하만 업로드할 수 있습니다.`;

export const UploadMockPage = ({
  onCancel,
  createObservationWithVerifiedTaxonomy = activeObservationRepository.createObservationWithVerifiedTaxonomy,
  taxonomyRepository = activeTaxonomyRepository,
  onObservationCreated,
}: UploadMockPageProps) => {
  const [formData, setFormData] = useState(createDefaultUploadFormValues);
  const [taxonomyState, setTaxonomyState] = useState<UploadTaxonomyVerificationState>(() => (
    createInitialTaxonomyVerificationState('')
  ));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestScientificNameRef = useRef(formData.scientificName);
  const isSupabaseRepository = getConfiguredObservationRepositoryKind() === 'supabase';

  const applyTaxonomyResult = (result: TaxonomyResolutionResult) => {
    if (result.status === 'resolved') {
      setTaxonomyState({ status: 'resolved', result });
      setFormData((current) => ({ ...current, taxon: result.broadTaxon }));
      return;
    }

    if (result.status === 'needsConfirmation') {
      setTaxonomyState({ status: 'needsConfirmation', result });
      return;
    }

    if (result.status === 'blocked') {
      setTaxonomyState({ status: 'blocked', result });
      return;
    }

    setTaxonomyState({ status: 'error', result });
  };

  const handleFormChange = (values: ReturnType<typeof createDefaultUploadFormValues>) => {
    if (values.scientificName !== latestScientificNameRef.current) {
      latestScientificNameRef.current = values.scientificName;
      setTaxonomyState(getTaxonomyVerificationStateAfterScientificNameChange(values.scientificName));
    }

    setFormData(values);
  };

  const handleTaxonomyCheck = async () => {
    const requestedScientificName = formData.scientificName;

    if (!requestedScientificName.trim() || taxonomyState.status === 'resolving') {
      setTaxonomyState(createInitialTaxonomyVerificationState(requestedScientificName));
      return;
    }

    try {
      setTaxonomyState({ status: 'resolving' });
      const result = await taxonomyRepository.resolveScientificName({ scientificName: requestedScientificName });

      if (latestScientificNameRef.current !== requestedScientificName) {
        setTaxonomyState(getTaxonomyVerificationStateAfterScientificNameChange(latestScientificNameRef.current));
        return;
      }

      applyTaxonomyResult(result);
    } catch {
      setTaxonomyState({
        status: 'error',
        result: {
          status: 'error',
          reason: 'upstream_failure',
          retryable: true,
          messageKey: 'taxonomy.error',
        },
      });
    }
  };

  const handleConfirmCandidate = async () => {
    if (taxonomyState.status !== 'needsConfirmation') return;

    const requestedScientificName = formData.scientificName;
    const candidateKey = taxonomyState.result.candidate.acceptedSourceTaxonKey;

    try {
      setTaxonomyState({ status: 'resolving' });
      const result = await taxonomyRepository.confirmScientificName({
        scientificName: requestedScientificName,
        acceptedSourceTaxonKey: candidateKey,
      });

      if (latestScientificNameRef.current !== requestedScientificName) {
        setTaxonomyState(getTaxonomyVerificationStateAfterScientificNameChange(latestScientificNameRef.current));
        return;
      }

      applyTaxonomyResult(result);
    } catch {
      setTaxonomyState({
        status: 'error',
        result: {
          status: 'error',
          reason: 'invalid_confirmation',
          retryable: false,
          messageKey: 'taxonomy.error',
        },
      });
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    const clearSelectedImage = () => {
      e.target.value = '';
      setFormData((current) => ({ ...current, imageFile: null, imagePreviewUrl: null }));
    };

    if (!isAllowedObservationImageMimeType(file.type)) {
      clearSelectedImage();
      alert(UNSUPPORTED_IMAGE_TYPE_ALERT_MESSAGE);
      return;
    }

    if (file.size > MAX_OBSERVATION_IMAGE_SIZE_BYTES) {
      clearSelectedImage();
      alert(OVERSIZED_IMAGE_ALERT_MESSAGE);
      return;
    }

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

    if (!canSubmitWithVerifiedTaxonomy(taxonomyState)) {
      alert(getTaxonomySubmitBlockMessage(taxonomyState));
      return;
    }

    try {
      setIsSubmitting(true);
      const verifiedResult = taxonomyState.result;
      const createdObservation = await createObservationWithVerifiedTaxonomy({
        ...input,
        scientificName: verifiedResult.reportedScientificName,
        taxon: verifiedResult.broadTaxon,
        taxonomy: {
          taxonId: verifiedResult.taxonId,
          reportedScientificName: verifiedResult.reportedScientificName,
          broadTaxon: verifiedResult.broadTaxon,
        },
      });
      onObservationCreated?.(createdObservation);
      alert(isSupabaseRepository ? TAXONOMY_CREATE_SUCCESS_MESSAGE : MOCK_UPLOAD_ALERT_MESSAGE);
    } catch {
      console.warn('observation_create_failed');
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
            환경 설정에 따라 Supabase 저장과 Kakao 지도를 사용하며, 기본 mock 모드에서는 화면 흐름을 확인합니다.
          </p>
        )}
      />

      <div className="space-y-5 text-left">
        <UploadObservationFields
          formData={formData}
          onChange={handleFormChange}
          isTaxonLocked={taxonomyState.status === 'resolved'}
          taxonHelpText={taxonomyState.status === 'resolved' ? '학명 확인 결과에서 자동으로 정한 분류군입니다.' : undefined}
          onScientificNameEnter={handleTaxonomyCheck}
        >
          <UploadTaxonomyVerificationPanel
            state={taxonomyState}
            scientificName={formData.scientificName}
            onCheck={handleTaxonomyCheck}
            onConfirmCandidate={handleConfirmCandidate}
          />
          <UploadImagePicker imagePreviewUrl={formData.imagePreviewUrl} onImageChange={handleImageChange} />
          <UploadLocationSection coords={formData.coords} onLocationSelect={handleLocationSelect} />
        </UploadObservationFields>
        <UploadFormActions
          onCancel={onCancel}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isSubmitDisabled={!canSubmitWithVerifiedTaxonomy(taxonomyState)}
        />
      </div>
    </div>
  );
};
