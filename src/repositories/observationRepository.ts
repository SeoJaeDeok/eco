import type { CreateObservationInput, Observation } from '../types';

export interface ObservationRepository {
  listObservations(): Observation[];
  getObservationById(id: string): Observation | null;
  countUniqueSpecies(): number;
  createObservation(input: CreateObservationInput): Promise<Observation>;
}
