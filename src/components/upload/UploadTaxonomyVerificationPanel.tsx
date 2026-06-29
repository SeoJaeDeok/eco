import type { KeyboardEvent } from 'react';
import type { TaxonomyLineage } from '../../features/taxonomy/taxonomyCore';
import {
  getMatchTypeLabel,
  getTaxonomyStatusMessage,
  type UploadTaxonomyVerificationState,
} from '../../features/upload/uploadTaxonomyVerification';
import { Button } from '../ui/Button';

interface UploadTaxonomyVerificationPanelProps {
  state: UploadTaxonomyVerificationState;
  scientificName: string;
  onCheck: () => void;
  onConfirmCandidate: () => void;
}

const RANK_LABELS: Array<{
  key: keyof TaxonomyLineage;
  label: string;
}> = [
  { key: 'kingdom', label: '계' },
  { key: 'phylum', label: '문' },
  { key: 'class', label: '강' },
  { key: 'order', label: '목' },
  { key: 'family', label: '과' },
  { key: 'genus', label: '속' },
  { key: 'species', label: '종' },
];

const isCheckDisabled = (state: UploadTaxonomyVerificationState, scientificName: string) => {
  return state.status === 'resolving' || !scientificName.trim();
};

const renderLineage = (lineage: TaxonomyLineage) => (
  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {RANK_LABELS.map(({ key, label }) => (
      <div key={key} className="flex items-center justify-between gap-4 border border-zinc-100 px-3 py-2">
        <dt className="text-[10px] font-medium tracking-widest text-zinc-400">{label}</dt>
        <dd className="truncate text-right text-xs italic text-zinc-600">{lineage[key].name ?? '정보 없음'}</dd>
      </div>
    ))}
  </dl>
);

export const UploadTaxonomyVerificationPanel = ({
  state,
  scientificName,
  onCheck,
  onConfirmCandidate,
}: UploadTaxonomyVerificationPanelProps) => {
  const resolvedResult = state.status === 'resolved' ? state.result : null;
  const confirmationResult = state.status === 'needsConfirmation' ? state.result : null;
  const statusTone = state.status === 'resolved'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
    : state.status === 'blocked' || state.status === 'error'
      ? 'border-red-100 bg-red-50 text-red-700'
      : 'border-zinc-100 bg-zinc-50 text-zinc-600';

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' && !isCheckDisabled(state, scientificName)) {
      event.preventDefault();
      onCheck();
    }
  };

  return (
    <section className="space-y-3 border border-zinc-100 bg-white p-4" aria-label="학명 확인">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Taxonomy Check</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">학명을 확인해야 관찰 기록을 등록할 수 있습니다.</p>
        </div>
        <Button
          type="button"
          onClick={onCheck}
          onKeyDown={handleKeyDown}
          disabled={isCheckDisabled(state, scientificName)}
          className="border border-zinc-900 bg-zinc-900 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-white hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === 'resolving' ? '확인 중' : state.status === 'error' ? '다시 확인' : '학명 확인'}
        </Button>
      </div>

      <p className={`border px-3 py-2 text-xs leading-5 ${statusTone}`} role="status">
        {getTaxonomyStatusMessage(state)}
      </p>

      {confirmationResult && (
        <div className="space-y-3 border border-amber-100 bg-amber-50 px-3 py-3">
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <p><span className="text-zinc-400">입력명</span><br /><span className="italic">{confirmationResult.reportedScientificName}</span></p>
            <p><span className="text-zinc-400">후보 인정명</span><br /><span className="italic">{confirmationResult.candidate.acceptedScientificName}</span></p>
          </div>
          <Button
            type="button"
            onClick={onConfirmCandidate}
            className="border border-amber-900 bg-amber-900 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-white hover:bg-white hover:text-amber-900"
          >
            이 학명으로 연결
          </Button>
        </div>
      )}

      {resolvedResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-xs text-zinc-600 sm:grid-cols-2">
            <p><span className="text-zinc-400">인정 학명</span><br /><span className="italic">{resolvedResult.acceptedScientificName}</span></p>
            {resolvedResult.reportedScientificName !== resolvedResult.acceptedScientificName && (
              <p><span className="text-zinc-400">입력 학명</span><br /><span className="italic">{resolvedResult.reportedScientificName}</span></p>
            )}
            <p><span className="text-zinc-400">분류군</span><br />{resolvedResult.broadTaxon}</p>
            <p>
              <span className="text-zinc-400">일치 유형</span><br />
              {getMatchTypeLabel(resolvedResult.matchType, resolvedResult.synonym)}
            </p>
            <p><span className="text-zinc-400">출처</span><br />{resolvedResult.source.name}</p>
          </div>
          {renderLineage(resolvedResult.lineage)}
        </div>
      )}
    </section>
  );
};

