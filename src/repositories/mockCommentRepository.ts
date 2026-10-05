import type { AuthSessionState } from './authRepository';
import type { Observation } from '../types';
import { normalizeObserverDisplayName } from '../utils/observerDisplay';
import { commentPageRange, normalizeCommentInput, type CommentRepository, type ObservationComment } from './commentRepository';

interface MockCommentOptions {
  getObservation: (id: string) => Promise<Observation | null>;
  getSession: () => Promise<AuthSessionState>;
  initialComments?: readonly ObservationComment[];
}

export const createMockCommentRepository = ({ getObservation, getSession, initialComments = [] }: MockCommentOptions) => {
  const comments = new Map(initialComments.map((comment) => [comment.id, { ...comment }]));
  const repository: CommentRepository = {
    async listObservationComments(observationId, page, signal) {
      const { from, to } = commentPageRange(page);
      signal?.throwIfAborted();
      const observation = await getObservation(observationId);
      signal?.throwIfAborted();
      const items = observation?.status === 'approved' ? [...comments.values()]
        .filter((comment) => comment.observationId === observationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)) : [];
      return { items: items.slice(from, to + 1).map((comment) => ({ ...comment })), page, totalCount: items.length };
    },
    async createObservationComment(input) {
      const value = normalizeCommentInput(input);
      const session = await getSession();
      const observation = await getObservation(value.observationId);
      if (!session.user || observation?.status !== 'approved') throw new Error('Comment creation not allowed.');
      const comment: ObservationComment = {
        ...value, id: crypto.randomUUID(), authorId: session.user.id,
        authorDisplayName: normalizeObserverDisplayName(session.profile?.displayName),
        createdAt: new Date().toISOString(),
      };
      comments.set(comment.id, comment);
      return { ...comment };
    },
    async deleteObservationComment(id) {
      const session = await getSession();
      const comment = comments.get(id);
      if (!session.user || !comment || (!session.isAdmin && comment.authorId !== session.user.id)) throw new Error('Comment deletion not allowed.');
      comments.delete(id);
    },
  };
  return {
    repository,
    cascadeObservation(id: string) {
      for (const [key, comment] of comments) if (comment.observationId === id) comments.delete(key);
    },
  };
};
