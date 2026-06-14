import type { Observation } from '../../types';
import { ObservationCard } from './ObservationCard';

interface ObservationGridProps {
  observations: Observation[];
  onSelectObservation: (observation: Observation) => void;
}

export const ObservationGrid = ({ observations, onSelectObservation }: ObservationGridProps) => {
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
