import type { Observation } from '../types';

export const countUniqueSpecies = (observations: Observation[]) => {
  return new Set(observations.map((obs) => obs.name.trim()).filter(Boolean)).size;
};
