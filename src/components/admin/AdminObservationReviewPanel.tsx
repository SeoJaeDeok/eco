import type { Observation } from '../../types';
import { TaxonBadge } from '../TaxonBadge';
import { ImageFrame } from '../ui/ImageFrame';

interface AdminObservationReviewPanelProps {
  observation: Observation | null;
  actionInProgressId: string | null;
  actionError: string | null;
  onApprove: (observation: Observation) => void;
  onReject: (observation: Observation) => void;
}

export const AdminObservationReviewPanel = ({
  observation,
  actionInProgressId,
  actionError,
  onApprove,
  onReject,
}: AdminObservationReviewPanelProps) => {
  if (!observation) {
    return (
      <section className="border border-zinc-200 bg-white p-5 shadow-sm" id="admin-review-panel">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Review detail</p>
        <div className="mt-5 border border-zinc-100 bg-zinc-50 p-5 text-sm leading-6 text-zinc-500">
          검토할 pending 기록을 선택해 주세요.
        </div>
      </section>
    );
  }

  const isActing = actionInProgressId === observation.id;

  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm" id="admin-review-panel">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Review detail</p>
          <h2 className="mt-2 text-2xl font-serif text-zinc-950">{observation.name}</h2>
          <p className="mt-1 text-sm italic text-zinc-500">{observation.scientificName || 'Scientific name pending'}</p>
        </div>
        <TaxonBadge taxon={observation.taxon} />
      </div>

      <ImageFrame
        src={observation.imageUrl}
        alt={observation.name}
        className="mb-5 flex aspect-[4/3] items-center justify-center border border-zinc-100 bg-zinc-50"
        imageClassName="h-full w-full object-contain"
        placeholder={<div className="text-sm font-serif italic text-zinc-300">No Photo</div>}
      />

      <dl className="grid gap-3 border-y border-zinc-100 py-5 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Location</dt>
          <dd className="mt-1 text-zinc-700">{observation.location}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Observed date</dt>
          <dd className="mt-1 text-zinc-700">{observation.date}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Coordinates</dt>
          <dd className="mt-1 font-mono text-xs text-zinc-600">
            {observation.coords.lat.toFixed(6)}, {observation.coords.lng.toFixed(6)}
          </dd>
        </div>
      </dl>

      <div className="py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Description</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{observation.description || '설명이 입력되지 않았습니다.'}</p>
      </div>

      {actionError && (
        <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
          {actionError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onApprove(observation)}
          disabled={isActing}
          className="flex-1 border border-emerald-700 bg-emerald-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          data-admin-action="approve"
        >
          {isActing ? '처리 중' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => onReject(observation)}
          disabled={isActing}
          className="flex-1 border border-zinc-300 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 transition-colors hover:border-red-700 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          data-admin-action="reject"
        >
          {isActing ? '처리 중' : 'Reject'}
        </button>
      </div>
    </section>
  );
};
