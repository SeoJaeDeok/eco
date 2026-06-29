import type {
  TaxonomyBlockedResult,
  TaxonomyErrorResult,
  TaxonomyNeedsConfirmationResult,
  TaxonomyResolvedResult,
} from '../../repositories/taxonomyRepository';

export type UploadTaxonomyVerificationState =
  | { status: 'empty' }
  | { status: 'dirty' }
  | { status: 'resolving' }
  | { status: 'resolved'; result: TaxonomyResolvedResult }
  | { status: 'needsConfirmation'; result: TaxonomyNeedsConfirmationResult }
  | { status: 'blocked'; result: TaxonomyBlockedResult }
  | { status: 'error'; result: TaxonomyErrorResult };

export const createInitialTaxonomyVerificationState = (
  scientificName: string,
): UploadTaxonomyVerificationState => {
  return scientificName.trim() ? { status: 'dirty' } : { status: 'empty' };
};

export const getTaxonomyVerificationStateAfterScientificNameChange = (
  scientificName: string,
): UploadTaxonomyVerificationState => {
  return createInitialTaxonomyVerificationState(scientificName);
};

export const canSubmitWithVerifiedTaxonomy = (
  state: UploadTaxonomyVerificationState,
): state is { status: 'resolved'; result: TaxonomyResolvedResult } => {
  return state.status === 'resolved';
};

export const getTaxonomySubmitBlockMessage = (
  state: UploadTaxonomyVerificationState,
) => {
  switch (state.status) {
    case 'empty':
      return '학명을 입력한 뒤 학명 확인을 진행해 주세요.';
    case 'dirty':
      return '학명 확인 후 등록할 수 있습니다.';
    case 'resolving':
      return '학명 확인이 끝난 뒤 등록할 수 있습니다.';
    case 'needsConfirmation':
      return '후보 학명을 먼저 확인해 주세요.';
    case 'blocked':
      return '이 학명은 관찰 기록에 연결할 수 없습니다. 종 수준 학명을 다시 입력해 주세요.';
    case 'error':
      return '학명 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    case 'resolved':
      return '';
  }
};

export const getTaxonomyStatusMessage = (
  state: UploadTaxonomyVerificationState,
) => {
  switch (state.status) {
    case 'empty':
      return '학명을 입력해 주세요.';
    case 'dirty':
      return '학명 확인 후 등록할 수 있습니다.';
    case 'resolving':
      return '학명을 확인하고 있습니다.';
    case 'resolved':
      return `${state.result.acceptedScientificName}로 확인했습니다.`;
    case 'needsConfirmation':
      return state.result.candidate.reason === 'synonym'
        ? `입력한 학명이 동의어로 보입니다. 현재 인정명은 ${state.result.candidate.acceptedScientificName}입니다.`
        : `철자가 다른 후보를 찾았습니다. ${state.result.candidate.acceptedScientificName}이 맞나요?`;
    case 'blocked':
      if (state.result.reason === 'higher_rank_only') {
        return '종 수준까지 확인하지 못했습니다. 속이나 과가 아니라 종 학명을 입력해 주세요.';
      }
      if (state.result.reason === 'no_match') {
        return '일치하는 학명을 찾지 못했습니다. 철자와 표기를 확인해 주세요.';
      }
      return '이 학명은 현재 관찰 기록에 연결할 수 없습니다.';
    case 'error':
      if (state.result.reason === 'timeout') {
        return '확인 시간이 초과되었습니다. 입력 내용은 그대로 유지됩니다.';
      }
      if (state.result.reason === 'rate_limited') {
        return '요청이 잠시 많아 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.';
      }
      if (state.result.reason === 'invalid_input') {
        return '학명 표기를 확인해 주세요.';
      }
      return '학명 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
};

export const getMatchTypeLabel = (matchType: string, synonym: boolean) => {
  if (synonym) return '동의어 확인';
  if (matchType.toUpperCase() === 'EXACT') return '정확 일치';
  if (matchType.toUpperCase() === 'VARIANT') return '철자 후보 확인';
  return matchType;
};

