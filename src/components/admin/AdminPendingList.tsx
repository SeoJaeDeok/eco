import type { Observation } from '../../types';
import { AdminObservationCard } from './AdminObservationCard';

interface AdminPendingListProps {
  observations: Observation[];
  selectedObservationId?: string;
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onSelectObservation: (observation: Observation) => void;
}

export const AdminPendingList = ({
  observations,
  selectedObservationId,
  isLoading,
  errorMessage,
  onRefresh,
  onSelectObservation,
}: AdminPendingListProps) => {
  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm" id="admin-pending-list">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Pending queue</p>
          <h2 className="mt-2 text-2xl font-serif text-zinc-950">승인 대기 기록</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{observations.length} records waiting for review</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="border border-zinc-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          id="admin-refresh-pending"
        >
          Refresh
        </button>
      </div>

      {errorMessage && (
        <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading && (
        <div className="border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
          Pending 기록을 불러오는 중입니다.
        </div>
      )}

      {!isLoading && observations.length === 0 && (
        <div className="border border-zinc-100 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500" id="admin-pending-empty">
          현재 승인 대기 중인 관찰 기록이 없습니다.
        </div>
      )}

      {!isLoading && observations.length > 0 && (
        <div className="space-y-3">
          {observations.map((observation) => (
            <AdminObservationCard
              key={observation.id}
              observation={observation}
              isSelected={observation.id === selectedObservationId}
              onSelect={onSelectObservation}
            />
          ))}
        </div>
      )}
    </section>
  );
};
