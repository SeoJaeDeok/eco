import type { CreateObservationInput, Observation } from '../types';

export interface ObservationRepository {
  listObservations(): Promise<Observation[]>;
  getObservationById(id: string): Promise<Observation | null>;
  countUniqueSpecies(): Promise<number>;
  createObservation(input: CreateObservationInput): Promise<Observation>;
}
