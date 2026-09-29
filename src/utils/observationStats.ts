import type { Observation } from '../types';

export const countUniqueSpecies = (observations: readonly Pick<Observation, 'name'>[]) => {
  return new Set(observations.map((obs) => obs.name.trim()).filter(Boolean)).size;
};
