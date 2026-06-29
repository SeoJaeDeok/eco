import type { Observation } from '../../../types';

interface ObservationTaxonomyLineageProps {
  observation: Observation;
}

const UNKNOWN_TAXONOMY_VALUE = '정보 없음';

export const ObservationTaxonomyLineage = ({ observation }: ObservationTaxonomyLineageProps) => {
  const taxonomy = observation.taxonomy;

  if (!taxonomy) {
    if (!observation.taxonId && observation.scientificName.trim()) {
      return (
        <div>
          <h4 className="mb-2 border-b border-zinc-100 pb-1 text-[10px] uppercase tracking-widest opacity-30">분류 정보</h4>
          <p className="text-xs font-light leading-relaxed text-zinc-500">분류 정보 미연결</p>
        </div>
      );
    }

    return null;
  }

  const reportedScientificName = taxonomy.reportedScientificName || observation.scientificName;

  return (
    <div>
      <h4 className="mb-3 border-b border-zinc-100 pb-1 text-[10px] uppercase tracking-widest opacity-30">분류 정보</h4>
      <dl className="space-y-3 text-xs leading-relaxed">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">보고 학명</dt>
          <dd className="mt-1 font-light italic text-zinc-700">{reportedScientificName || UNKNOWN_TAXONOMY_VALUE}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">승인 학명</dt>
          <dd className="mt-1 font-light italic text-zinc-700">{taxonomy.acceptedScientificName}</dd>
        </div>
        {taxonomy.taxonomicStatus && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">분류 상태</dt>
            <dd className="mt-1 font-light text-zinc-600">{taxonomy.taxonomicStatus}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">계통</dt>
          <dd className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {taxonomy.ranks.map((rank) => (
              <span key={rank.rank} className="flex items-baseline gap-2 border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5">
                <span className="shrink-0 text-[10px] font-semibold text-zinc-400">{rank.rankLabelKo}</span>
                <span className="min-w-0 truncate font-light italic text-zinc-700" title={rank.name ?? UNKNOWN_TAXONOMY_VALUE}>
                  {rank.name ?? UNKNOWN_TAXONOMY_VALUE}
                </span>
              </span>
            ))}
          </dd>
        </div>
        {taxonomy.sourceLabel && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">출처</dt>
            <dd className="mt-1 font-light text-zinc-600">{taxonomy.sourceLabel}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
