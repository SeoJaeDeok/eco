import type { AdminObservationUpdateInput, Observation, ObservationStatus } from '../types';

export type AdminObservationAction = 'approve' | 'reject';
export type AdminObservationStatusUpdate = Extract<ObservationStatus, 'approved' | 'rejected'>;

export interface AdminObservationRepository {
  listPendingObservations(): Promise<Observation[]>;
  listAllObservations(): Promise<Observation[]>;
  approveObservation(id: string): Promise<Observation>;
  rejectObservation(id: string): Promise<Observation>;
  updateObservationAsAdmin(id: string, input: AdminObservationUpdateInput): Promise<Observation>;
}
