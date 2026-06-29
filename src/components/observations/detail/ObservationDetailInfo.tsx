import type { Observation } from '../../../types';
import { getObservationObserverDisplayName } from '../../../utils/observerDisplay';
import { ObservationTaxonomyLineage } from './ObservationTaxonomyLineage';

interface ObservationDetailInfoProps {
  observation: Observation;
}

export const ObservationDetailInfo = ({ observation }: ObservationDetailInfoProps) => {
  const observerDisplayName = getObservationObserverDisplayName(observation);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-[10px] tracking-widest uppercase opacity-30 mb-2 border-b border-zinc-100 pb-1">관찰자</h4>
        <p className="text-xs font-light leading-relaxed opacity-70">{observerDisplayName}</p>
      </div>
      <ObservationTaxonomyLineage observation={observation} />
      <div>
        <h4 className="text-[10px] tracking-widest uppercase opacity-30 mb-2 border-b border-zinc-100 pb-1">상세 정보</h4>
        <p className="text-xs font-light leading-relaxed opacity-70 whitespace-pre-wrap">{observation.description || '상세 설명이 없습니다.'}</p>
      </div>
    </div>
  );
};
