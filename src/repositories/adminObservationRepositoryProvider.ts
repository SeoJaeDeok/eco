import type { AdminObservationRepository } from './adminObservationRepository';

const loadSupabaseAdminObservationRepository = async (): Promise<AdminObservationRepository> => {
  const module = await import('./supabase/supabaseAdminObservationRepository');
  return module.supabaseAdminObservationRepository;
};

export const activeAdminObservationRepository: AdminObservationRepository = {
  async listPendingObservations() {
    const repository = await loadSupabaseAdminObservationRepository();
    return repository.listPendingObservations();
  },
  async listAllObservations() {
    const repository = await loadSupabaseAdminObservationRepository();
    return repository.listAllObservations();
  },
  async approveObservation(id) {
    const repository = await loadSupabaseAdminObservationRepository();
    return repository.approveObservation(id);
  },
  async rejectObservation(id) {
    const repository = await loadSupabaseAdminObservationRepository();
    return repository.rejectObservation(id);
  },
  async updateObservationAsAdmin(id, input) {
    const repository = await loadSupabaseAdminObservationRepository();
    return repository.updateObservationAsAdmin(id, input);
  },
};
