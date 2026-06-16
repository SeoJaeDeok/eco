import type { Observation } from '../../types';
import { ObservationCard } from './ObservationCard';

interface ObservationGridProps {
  observations: Observation[];
  onSelectObservation: (observation: Observation) => void;
}

export const ObservationGrid = ({ observations, onSelectObservation }: ObservationGridProps) => {
  if (observations.length === 0) {
    return (
      <div className="border border-zinc-100 bg-zinc-50 px-5 py-12 text-center">
        <p className="font-serif text-lg text-zinc-500">조건에 맞는 관찰 기록이 없습니다.</p>
        <p className="mt-2 text-xs leading-6 text-zinc-400">
          검색어를 줄이거나 분류와 사진 필터를 다시 조정해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {observations.map((observation) => (
        <ObservationCard
          key={observation.id}
          observation={observation}
          onSelect={onSelectObservation}
        />
      ))}
    </div>
  );
};
