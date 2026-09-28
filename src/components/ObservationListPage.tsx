import { useEffect, useRef, useState } from 'react';
import { activeObservationRepository } from '../repositories/observationRepositoryProvider';
import type { ObservationRepository } from '../repositories/observationRepository';
import { DEFAULT_OBSERVATION_PAGE_QUERY, type ObservationPage, type ObservationPageQuery } from '../utils/observationPagination';
import { prefetchObservationImages } from '../utils/observationImagePrefetch';
import { ObservationGrid } from './observations/ObservationGrid';
import { ObservationListHeader } from './observations/ObservationListHeader';
import { ObservationTaxonFilter } from './observations/ObservationTaxonFilter';
import { ObservationPagination } from './observations/ObservationPagination';
import type { Observation } from '../types';

interface ObservationListPageProps {
  repository?: Pick<ObservationRepository, 'listPublicObservationsPage'>;
  revision?: number;
  onSelect: (obs: Observation) => void;
}

export const ObservationListPage = ({ repository = activeObservationRepository, revision = 0, onSelect }: ObservationListPageProps) => {
  const [query, setQuery] = useState<ObservationPageQuery>(DEFAULT_OBSERVATION_PAGE_QUERY);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{
    query: ObservationPageQuery; revision: number; retry: number; repository: typeof repository;
    data?: ObservationPage; error?: string;
  } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const focusAfterPageChange = useRef(false);
  const current = response?.query === query && response.revision === revision
    && response.retry === retry && response.repository === repository ? response : null;
  const isLoading = current === null;

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    void repository.listPublicObservationsPage(query, controller.signal).then((data) => {
      if (!isCurrent) return;
      setResponse({ query, revision, retry, repository, data });
      void prefetchObservationImages(data.items).catch(() => undefined);
    }).catch(() => {
      if (!isCurrent) return;
      setResponse({ query, revision, retry, repository, error: '관찰목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    });
    return () => { isCurrent = false; controller.abort(); };
  }, [query, repository, retry, revision]);

  useEffect(() => {
    if (!isLoading && focusAfterPageChange.current) {
      focusAfterPageChange.current = false;
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [isLoading]);

  const changeConditions = (patch: Partial<Omit<ObservationPageQuery, 'page'>>) => {
    focusAfterPageChange.current = false;
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

        <div ref={resultRef} tabIndex={-1} aria-label="관찰 검색 결과" aria-busy={isLoading}
          className="scroll-mt-28 focus-visible:outline-2 focus-visible:outline-offset-4">
          <p role="status" className="mb-4 text-xs text-zinc-500">
            {isLoading ? '관찰 기록을 불러오는 중입니다.' : current?.data
              ? current.data.totalCount === 0 ? '검색 결과 총 0개'
                : `검색 결과 총 ${current.data.totalCount}개 · ${(current.data.page - 1) * current.data.pageSize + 1}–${(current.data.page - 1) * current.data.pageSize + current.data.items.length}개 표시`
              : '관찰 기록 조회 실패'}
          </p>
          {current?.error && (
            <div role="alert" className="py-6 text-sm text-zinc-600">
              <p>{current.error}</p>
              <button type="button" onClick={() => setRetry((value) => value + 1)}
                className="mt-3 min-h-11 border border-zinc-300 px-4 focus-visible:outline-2 focus-visible:outline-offset-2">다시 시도</button>
            </div>
          )}
          {current?.data && <ObservationGrid observations={current.data.items} onSelectObservation={onSelect} />}
        </div>
        {current?.data && <ObservationPagination page={current.data.page} totalCount={current.data.totalCount}
          onPageChange={(page) => {
            focusAfterPageChange.current = true;
            setQuery((previous) => ({ ...previous, page }));
          }} />}
      </div>
    </div>
  );
};
