import { getSupabaseClient } from './supabaseClient';
import { normalizeObserverDisplayName } from '../../utils/observerDisplay';
import { COMMENT_PAGE_SIZE, commentPageRange, normalizeCommentInput, type CommentRepository, type ObservationComment } from '../commentRepository';

interface CommentRow {
  id: string;
  observation_id: string;
  author_id: string | null;
  author_display_name: string | null;
  kind: 'comment' | 'identification';
  body: string;
  created_at: string;
}
const COLUMNS = 'id,observation_id,author_id,author_display_name,kind,body,created_at';
const mapComment = (row: CommentRow): ObservationComment => ({
  id: row.id, observationId: row.observation_id, authorId: row.author_id,
  authorDisplayName: normalizeObserverDisplayName(row.author_display_name),
  kind: row.kind, body: row.body, createdAt: row.created_at,
});
const requireUser = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) throw new Error('Comment action requires authentication.');
};

export const supabaseCommentRepository: CommentRepository = {
  async listObservationComments(observationId, page, signal) {
    const { from, to } = commentPageRange(page);
    signal?.throwIfAborted();
    let query = getSupabaseClient().from('observation_comments')
      .select(`${COLUMNS},observations!inner(status)`, { count: 'exact' })
      .eq('observation_id', observationId).eq('observations.status', 'approved')
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(from, to).retry(false);
    if (signal) query = query.abortSignal(signal);
    const { data, error, count } = await query;
    signal?.throwIfAborted();
    if (error || !Array.isArray(data) || count === null || !Number.isSafeInteger(count) || count < 0
      || data.length !== Math.min(COMMENT_PAGE_SIZE, Math.max(0, count - from))) throw new Error('Comment list unavailable.');
    return { items: (data as CommentRow[]).map(mapComment), page, totalCount: count };
  },
  async createObservationComment(input) {
    const value = normalizeCommentInput(input);
    await requireUser();
    const { data, error } = await getSupabaseClient().from('observation_comments')
      .insert({ observation_id: value.observationId, kind: value.kind, body: value.body })
      .select(COLUMNS).single();
    if (error || !data) throw new Error('Comment creation failed.');
    return mapComment(data as CommentRow);
  },
  async deleteObservationComment(id) {
    await requireUser();
    const { data, error } = await getSupabaseClient().from('observation_comments')
      .delete().eq('id', id).select('id').maybeSingle();
    if (error || !data || data.id !== id) throw new Error('Comment deletion failed or not allowed.');
  },
};
