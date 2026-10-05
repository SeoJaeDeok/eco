import { getConfiguredObservationRepositoryKind } from './observationRepositoryProvider';
import { mockObservationRepository } from './mockObservationRepository';
import { activeAuthRepository } from './authRepositoryProvider';
import { createMockCommentRepository } from './mockCommentRepository';
import { onMockObservationDeleted } from './mockObservationDeletion';
import type { CommentRepository } from './commentRepository';

const mock = createMockCommentRepository({
  getObservation: (id) => mockObservationRepository.getObservationById(id),
  getSession: () => activeAuthRepository.getSessionState(),
});
onMockObservationDeleted(mock.cascadeObservation);
const load = async () => (await import('./supabase/supabaseCommentRepository')).supabaseCommentRepository;
const supabase: CommentRepository = {
  async listObservationComments(id, page, signal) { return (await load()).listObservationComments(id, page, signal); },
  async createObservationComment(input) { return (await load()).createObservationComment(input); },
  async deleteObservationComment(id) { return (await load()).deleteObservationComment(id); },
};
export const activeCommentRepository = getConfiguredObservationRepositoryKind() === 'supabase' ? supabase : mock.repository;
