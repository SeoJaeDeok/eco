import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { activeObservationRepository } from '../repositories/observationRepositoryProvider';
import type { ObservationRepository } from '../repositories/observationRepository';
import { DEFAULT_OBSERVATION_PAGE_QUERY, type ObservationPage, type ObservationPageQuery } from '../utils/observationPagination';
import { prefetchObservationImages } from '../utils/observationImagePrefetch';
import { ObservationGrid } from './observations/ObservationGrid';
import { ObservationListHeader } from './observations/ObservationListHeader';
import { ObservationTaxonFilter } from './observations/ObservationTaxonFilter';
import { ObservationPagination } from './observations/ObservationPagination';
import type { Observation } from '../types';
import { PAGE_FADE } from '../utils/pageTransition';

interface ObservationListPageProps {
  repository?: Pick<ObservationRepository, 'listPublicObservationsPage'>;
  revision?: number;
  onSelect: (obs: Observation) => void;
}

interface PageResponse {
  query: ObservationPageQuery;
  revision: number;
  retry: number;
  repository: NonNullable<ObservationListPageProps['repository']>;
  data?: ObservationPage;
  error?: string;
  pageTransition?: boolean;
}

interface PendingTransition {
  response: PageResponse;
  exit: typeof PAGE_FADE.exit;
}

export const ObservationListPage = ({ repository = activeObservationRepository, revision = 0, onSelect }: ObservationListPageProps) => {
  const [query, setQuery] = useState<ObservationPageQuery>(DEFAULT_OBSERVATION_PAGE_QUERY);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<PageResponse | null>(null);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const pendingRef = useRef<PendingTransition | null>(null);
  const lastSuccess = useRef<PageResponse | null>(null);
  const pageRequest = useRef<ObservationPageQuery | null>(null);
  const requestLocked = useRef(false);
  const reduceMotion = useReducedMotion();
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const matchesRequest = (result: PageResponse | null) => result?.query === query
    && result.revision === revision && result.retry === retry && result.repository === repository;
  const current = matchesRequest(response) ? response : null;
  const isLoading = current === null;
  const exiting = pending && matchesRequest(pending.response) ? pending : null;
  // Retain only the last page of this same explicit page-navigation request.
  const retained = pageRequest.current === query && lastSuccess.current?.revision === revision
    && lastSuccess.current.repository === repository ? lastSuccess.current.data : undefined;
  const visibleData = current?.data ?? retained;
  const showingPrevious = Boolean(visibleData && !current?.data);

  const commitResponse = (result: PageResponse) => {
    if (result.data) {
      lastSuccess.current = result;
      pageRequest.current = null;
    }
    pendingRef.current = null;
    requestLocked.current = false;
    setPending(null);
    setResponse(result);
  };

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    pendingRef.current = null;
    setPending(null);
    void repository.listPublicObservationsPage(query, controller.signal).then((data) => {
      if (!isCurrent) return;
      void prefetchObservationImages(data.items).catch(() => undefined);
      const result = { query, revision, retry, repository, data };
      if (pageRequest.current === query && lastSuccess.current?.data
        && data.page !== lastSuccess.current.data.page && !reduceMotionRef.current) {
        // A unique exit target prevents an obsolete completion from committing another request.
        const transition = { response: { ...result, pageTransition: true }, exit: { ...PAGE_FADE.exit } };
        pendingRef.current = transition;
        setPending(transition);
      } else {
        commitResponse(result);
      }
    }).catch(() => {
      if (!isCurrent) return;
      commitResponse({ query, revision, retry, repository, error: '관찰목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    });
    return () => { isCurrent = false; pendingRef.current = null; controller.abort(); };
  }, [query, repository, retry, revision]);

  useEffect(() => {
    if (reduceMotion && exiting && pendingRef.current === exiting) {
      commitResponse(exiting.response);
    }
  }, [reduceMotion, exiting]);

  const changeConditions = (patch: Partial<Omit<ObservationPageQuery, 'page'>>) => {
    pageRequest.current = null;
    pendingRef.current = null;
    setQuery((previous) => ({ ...previous, ...patch, page: 1 }));
  };

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-20" id="observation-page">
      <div className="max-w-6xl mx-auto">
        <ObservationListHeader
          sortKey={query.sortKey}
          onSortChange={(sortKey) => changeConditions({ sortKey })}
          searchQuery={query.searchQuery}
          onSearchChange={(searchQuery) => changeConditions({ searchQuery })}
          onSearchClear={() => changeConditions({ searchQuery: '' })}
          imageFilter={query.imageFilter}
          onImageFilterChange={(imageFilter) => changeConditions({ imageFilter })}
        />

        <ObservationTaxonFilter
          selectedTaxon={query.selectedTaxon}
          onSelectTaxon={(selectedTaxon) => changeConditions({ selectedTaxon })}
        />

        <div tabIndex={-1} aria-label="관찰 검색 결과" aria-busy={isLoading}
          className="scroll-mt-28 focus-visible:outline-2 focus-visible:outline-offset-4">
          <p role="status" className="mb-4 text-xs text-zinc-500">
            {isLoading ? '관찰 기록을 불러오는 중입니다.' : current?.data
              ? current.data.totalCount === 0 ? '검색 결과 총 0개'
                : `검색 결과 총 ${current.data.totalCount}개 · ${(current.data.page - 1) * current.data.pageSize + 1}–${(current.data.page - 1) * current.data.pageSize + current.data.items.length}개 표시`
              : '관찰 기록 조회 실패'}
            {showingPrevious && visibleData && ` 이전 ${visibleData.page}페이지 결과를 표시하고 있습니다.`}
          </p>
          {current?.error && (
            <div role="alert" className="py-6 text-sm text-zinc-600">
              <p>{current.error}</p>
              <button type="button" onClick={() => setRetry((value) => value + 1)}
                className="mt-3 min-h-11 border border-zinc-300 px-4 focus-visible:outline-2 focus-visible:outline-offset-2">다시 시도</button>
            </div>
          )}
          <motion.div initial={false}
            animate={exiting?.exit ?? PAGE_FADE.animate}
            transition={reduceMotion || (!exiting && !current?.pageTransition) ? { duration: 0 } : undefined}
            onAnimationComplete={(definition) => {
              if (exiting && definition === exiting.exit && pendingRef.current === exiting) {
                commitResponse(exiting.response);
              }
            }}
            inert={showingPrevious} aria-hidden={showingPrevious || undefined}>
            {visibleData && <ObservationGrid observations={visibleData.items} onSelectObservation={onSelect} />}
          </motion.div>
        </div>
        {visibleData && <ObservationPagination page={visibleData.page} totalCount={visibleData.totalCount}
          busy={isLoading}
          onPageChange={(page) => {
            if (isLoading || requestLocked.current || page === visibleData.page) return;
            requestLocked.current = true;
            const nextQuery = { ...query, page };
            pageRequest.current = nextQuery;
            pendingRef.current = null;
            setQuery(nextQuery);
          }} />}
      </div>
    </div>
  );
};
