export type CommentKind = 'comment' | 'identification';
export interface ObservationComment {
  id: string;
  observationId: string;
  authorId: string | null;
  authorDisplayName?: string;
  kind: CommentKind;
  body: string;
  createdAt: string;
}
export interface CreateCommentInput {
  observationId: string;
  kind: CommentKind;
  body: string;
}
export interface CommentPage {
  items: ObservationComment[];
  page: number;
  totalCount: number;
}
export interface CommentRepository {
  listObservationComments(observationId: string, page: number, signal?: AbortSignal): Promise<CommentPage>;
  createObservationComment(input: CreateCommentInput): Promise<ObservationComment>;
  deleteObservationComment(id: string): Promise<void>;
}

export const COMMENT_PAGE_SIZE = 20;
export const COMMENT_MAX_LENGTH = 1000;
export const commentPageRange = (page: number) => {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) throw new Error('Invalid comment page.');
  const from = (page - 1) * COMMENT_PAGE_SIZE;
  return { from, to: from + COMMENT_PAGE_SIZE - 1 };
};
export const normalizeCommentInput = (input: CreateCommentInput): CreateCommentInput => {
  if (typeof input.observationId !== 'string' || !input.observationId.trim()
    || !['comment', 'identification'].includes(input.kind) || typeof input.body !== 'string') {
    throw new Error('Invalid comment input.');
  }
  const body = input.body.trim();
  if (!body || Array.from(body).length > COMMENT_MAX_LENGTH) throw new Error('Invalid comment length.');
  // Whitelist instead of forwarding an unexpected author/id/timestamp from runtime input.
  return { observationId: input.observationId, kind: input.kind, body };
};
