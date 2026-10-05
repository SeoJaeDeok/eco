import { useEffect, useId, useRef, useState } from 'react';
import { MessageSquare, Plus, RotateCw, Send } from 'lucide-react';
import type { AuthSessionState } from '../../../repositories/authRepository';
import { activeCommentRepository } from '../../../repositories/commentRepositoryProvider';
import { COMMENT_MAX_LENGTH, normalizeCommentInput, type CommentKind, type CommentPage, type CommentRepository } from '../../../repositories/commentRepository';
import { DEFAULT_OBSERVER_DISPLAY_NAME, normalizeObserverDisplayName } from '../../../utils/observerDisplay';
import { DeleteConfirmation } from '../../ui/DeleteConfirmation';

interface ObservationCommentsProps {
  observationId: string;
  authState: AuthSessionState;
  repository?: CommentRepository;
}
const control = 'inline-flex min-h-11 items-center justify-center gap-2 border border-zinc-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
const displayTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '작성 시간 확인 불가' : date.toLocaleString('ko-KR');
};

export const ObservationComments = ({ observationId, authState, repository = activeCommentRepository }: ObservationCommentsProps) => {
  const inputId = useId();
  const [result, setResult] = useState<CommentPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<CommentKind>('comment');
  const [writing, setWriting] = useState(false);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const mutating = useRef(false);
  const sessionScope = `${authState.user?.id ?? ''}:${authState.isAdmin}`;
  const scope = useRef({ observationId, sessionScope, repository });
  scope.current = { observationId, sessionScope, repository };
  const isCurrentScope = () => active.current && scope.current.observationId === observationId
    && scope.current.sessionScope === sessionScope && scope.current.repository === repository;

  const load = async (page = 1) => {
    const identity = ++request.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setReadError(null);
    try {
      const next = await repository.listObservationComments(observationId, page, abort.signal);
      if (!active.current || identity !== request.current) return;
      if (page > 1 && (!result || next.totalCount !== result.totalCount
        || next.items.some((item) => result.items.some((old) => old.id === item.id)))) {
        throw new Error('Comment collection changed; refresh required.');
      }
      setResult(page === 1 ? next : { ...next, items: [...(result?.items ?? []), ...next.items] });
    } catch {
      if (active.current && identity === request.current) setReadError('댓글을 불러오지 못했거나 목록이 변경됐습니다. 다시 불러와 주세요.');
    } finally {
      if (active.current && identity === request.current) setLoading(false);
    }
  };

  useEffect(() => {
    active.current = true;
    setResult(null);
    setWriteError(null);
    setNotice(null);
    void load();
    return () => { active.current = false; request.current++; controller.current?.abort(); };
  }, [observationId, repository, sessionScope]);

  const mutate = async (operation: () => Promise<unknown>, success: () => void) => {
    if (mutating.current || !authState.user) throw new Error('Comment action not available.');
    mutating.current = true;
    setWriting(true);
    request.current++;
    controller.current?.abort();
    setLoading(false);
    try {
      await operation();
      if (!isCurrentScope()) return;
      success();
      // A failed refresh is a read error, never a reason to resubmit a successful write.
      await load();
    } finally {
      mutating.current = false;
      if (active.current) setWriting(false);
    }
  };

  const submit = async () => {
    if (mutating.current) return;
    setWriteError(null);
    setNotice(null);
    try {
      const input = normalizeCommentInput({ observationId, kind, body });
      await mutate(() => repository.createObservationComment(input), () => {
        setBody('');
        setNotice('댓글이 등록됐습니다.');
      });
    } catch {
      if (isCurrentScope()) setWriteError('댓글을 등록하지 못했습니다. 로그인·관찰 상태와 입력 내용을 확인해 주세요.');
    }
  };
  const length = Array.from(body.trim()).length;

  return <section className="mt-10 border-t border-zinc-200 pt-6" aria-labelledby={`${inputId}-heading`}>
    <h2 id={`${inputId}-heading`} className="mb-4 flex items-center gap-2 text-xl font-serif"><MessageSquare size={20} aria-hidden="true" />댓글 {result?.totalCount ?? ''}</h2>
    <p className="mb-4 text-sm leading-6 text-zinc-500">동정 의견은 참고 정보이며 관찰 기록의 공식 분류를 자동으로 변경하지 않습니다.</p>
    {authState.user ? <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-3">
      <fieldset disabled={writing} className="flex flex-wrap gap-2">
        <legend className="sr-only">댓글 종류</legend>
        {(['comment', 'identification'] as const).map((value) => <label key={value} className="flex min-h-11 items-center gap-2 border border-zinc-200 px-3 text-sm">
          <input type="radio" name={`${inputId}-kind`} value={value} checked={kind === value} onChange={() => setKind(value)} />{value === 'comment' ? '일반 댓글' : '동정 의견'}
        </label>)}
      </fieldset>
      <label className="block text-sm" htmlFor={inputId}>댓글 내용</label>
      <textarea id={inputId} value={body} onChange={(event) => setBody(event.target.value)} disabled={writing}
        rows={3} maxLength={2000} aria-describedby={`${inputId}-length`}
        className="w-full resize-y border border-zinc-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id={`${inputId}-length`} className={`text-xs ${length > COMMENT_MAX_LENGTH ? 'text-red-700' : 'text-zinc-500'}`}>{length} / {COMMENT_MAX_LENGTH}자</span>
        <button type="submit" className={control} disabled={writing || length === 0 || length > COMMENT_MAX_LENGTH}><Send size={14} aria-hidden="true" />{writing ? '처리 중' : '등록'}</button>
      </div>
      {writeError && <p role="alert" className="text-sm text-red-700">{writeError}</p>}
    </form> : <p className="mb-4 text-sm text-zinc-600">댓글과 동정 의견을 작성하려면 로그인해 주세요.</p>}
    {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    <div aria-busy={loading} className="mt-5">
      {loading && <p role="status" className="py-3 text-sm text-zinc-500">댓글을 불러오는 중입니다.</p>}
      {readError && <div className="space-y-2 py-3"><p role="alert" className="text-sm text-red-700">{readError}</p>
        <button type="button" className={control} disabled={loading || writing} onClick={() => void load()}><RotateCw size={14} aria-hidden="true" />다시 불러오기</button></div>}
      {!loading && !readError && result?.totalCount === 0 && <p className="py-4 text-sm text-zinc-500">아직 댓글이 없습니다.</p>}
      <ul className="divide-y divide-zinc-100">{result?.items.map((comment) => <li key={comment.id} className="min-w-0 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="break-words font-medium text-zinc-700">{normalizeObserverDisplayName(comment.authorDisplayName) ?? DEFAULT_OBSERVER_DISPLAY_NAME}</span>
          <span>{comment.kind === 'identification' ? '동정 의견' : '일반 댓글'}</span>
          <time dateTime={comment.createdAt}>{displayTime(comment.createdAt)}</time>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{comment.body}</p>
        {authState.user && (authState.isAdmin || comment.authorId === authState.user.id) && <DeleteConfirmation label="댓글 삭제"
          message="이 댓글을 삭제하시겠습니까? 삭제한 댓글은 복구할 수 없습니다." disabled={writing}
          onDelete={() => mutate(() => repository.deleteObservationComment(comment.id), () => setNotice('댓글이 삭제됐습니다.'))} />}
      </li>)}</ul>
      {result && result.items.length < result.totalCount && !readError && <button type="button" className={control}
        disabled={loading || writing} onClick={() => void load(result.page + 1)}><Plus size={14} aria-hidden="true" />댓글 더 보기</button>}
    </div>
  </section>;
};
