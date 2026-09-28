import { useEffect, useId, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { TAXA } from '../constants/taxon';
import { activeTaxonomyTreeRepository } from '../repositories/taxonomyTreeRepositoryProvider';
import type { TaxonomyTreeRepository } from '../repositories/taxonomyTreeRepository';
import {
  filterMapObservations,
  getObservationSpeciesGroups,
  type ObservationSpeciesGroup,
} from '../utils/observationFilters';
import type { Observation, Taxon } from '../types';
import { getObservationYears, OBSERVATION_MONTHS, toggleObservationMonth, type ObservationMonth } from '../utils/observationMonth';
import type { TaxonomyTreeSelection } from '../features/taxonomy/taxonomyTree';
import { SearchInput } from './ui/SearchInput';
import { TaxonFilterButton } from './ui/TaxonFilterButton';
import { MapPreview } from './MapPreview';
import { TaxonomyFilterStatus, TaxonomyTreePanel } from './map/TaxonomyTreePanel';

interface MapPageProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
  taxonomyRepository?: TaxonomyTreeRepository;
  MapComponent?: typeof MapPreview;
}

const SPECIES_SUGGESTION_LIMIT = 6;

const getTaxonCount = (observations: Observation[], taxon: Taxon) => {
  return observations.filter((observation) => observation.taxon === taxon).length;
};

const getTaxonButtonClassName = 'px-3 py-1.5 text-[10px] font-sans tracking-wide transition-all border';
const getResetButtonClassName = 'min-h-11 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700';

export const MapPage = ({
  observations,
  onSelect,
  taxonomyRepository = activeTaxonomyTreeRepository,
  MapComponent = MapPreview,
}: MapPageProps) => {
  const [areFiltersExpanded, setAreFiltersExpanded] = useState(true);
  const filterControlsId = useId();
  const filterResultsId = `${filterControlsId}-results`;
  const yearSelectId = `${filterControlsId}-year`;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaxa, setSelectedTaxa] = useState<Taxon[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<ObservationMonth[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSpeciesKey, setSelectedSpeciesKey] = useState<string | null>(null);
  const [selectedTaxonomyNode, setSelectedTaxonomyNode] = useState<TaxonomyTreeSelection | null>(null);
  const [taxonomyObservationIds, setTaxonomyObservationIds] = useState<ReadonlySet<string> | null>(null);
  const [isLoadingTaxonomyFilter, setIsLoadingTaxonomyFilter] = useState(false);
  const [taxonomyFilterError, setTaxonomyFilterError] = useState<string | null>(null);
  const availableYears = useMemo(() => getObservationYears(observations), [observations]);
  const isSelectedYearMissing = selectedYear !== null && !availableYears.includes(selectedYear);
  const yearOptions = isSelectedYearMissing
    ? [...availableYears, selectedYear].sort((a, b) => b - a)
    : availableYears;

  useEffect(() => {
    if (!selectedTaxonomyNode) {
      setTaxonomyObservationIds(null);
      setIsLoadingTaxonomyFilter(false);
      setTaxonomyFilterError(null);
      return;
    }

    let isCurrent = true;

    const loadTaxonomyObservationIds = async () => {
      try {
        setIsLoadingTaxonomyFilter(true);
        setTaxonomyFilterError(null);
        setTaxonomyObservationIds(new Set());
        const ids = await taxonomyRepository.getObservationIdsForSelection(selectedTaxonomyNode);

        if (!isCurrent) return;
        setTaxonomyObservationIds(new Set(ids));
      } catch {
        if (!isCurrent) return;
        setTaxonomyObservationIds(new Set());
        setTaxonomyFilterError('분류 필터를 적용하지 못했습니다. 다시 선택해 주세요.');
      } finally {
        if (isCurrent) {
          setIsLoadingTaxonomyFilter(false);
        }
      }
    };

    void loadTaxonomyObservationIds();

    return () => {
      isCurrent = false;
    };
  }, [selectedTaxonomyNode, taxonomyRepository]);

  const filteredObservations = useMemo(() => {
    return filterMapObservations(observations, {
      selectedTaxa,
      searchQuery,
      selectedSpeciesKey,
      selectedMonths,
      selectedYear,
      taxonomyObservationIds: selectedTaxonomyNode ? taxonomyObservationIds ?? new Set() : null,
    });
  }, [observations, searchQuery, selectedSpeciesKey, selectedTaxa, selectedMonths, selectedYear, selectedTaxonomyNode, taxonomyObservationIds]);

  const speciesSuggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return getObservationSpeciesGroups(observations, searchQuery).slice(0, SPECIES_SUGGESTION_LIMIT);
  }, [observations, searchQuery]);

  const selectedSpecies = useMemo(() => {
    if (!selectedSpeciesKey) {
      return null;
    }

    return getObservationSpeciesGroups(observations).find((group) => group.key === selectedSpeciesKey) ?? null;
  }, [observations, selectedSpeciesKey]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedSpeciesKey || selectedTaxa.length > 0 || selectedMonths.length > 0 || selectedYear !== null || selectedTaxonomyNode,
  );

  const handleSearchChange = (nextSearchQuery: string) => {
    setSearchQuery(nextSearchQuery);
    setSelectedSpeciesKey(null);
  };

  const handleTaxonToggle = (taxon: Taxon) => {
    setSelectedTaxa((currentTaxa) => (
      currentTaxa.includes(taxon)
        ? currentTaxa.filter((currentTaxon) => currentTaxon !== taxon)
        : [...currentTaxa, taxon]
    ));
  };

  const handleSpeciesSelect = (speciesGroup: ObservationSpeciesGroup) => {
    setSelectedSpeciesKey(speciesGroup.key);
    setSearchQuery(speciesGroup.name);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedSpeciesKey(null);
    setSelectedTaxa([]);
    setSelectedMonths([]);
    setSelectedYear(null);
    setSelectedTaxonomyNode(null);
  };

  return (
    <div className="h-screen flex flex-col pt-20" id="map-page">
      <div className="flex-1 w-full bg-zinc-100 overflow-hidden relative">
        <MapComponent
          observations={filteredObservations}
          onSelect={onSelect}
          title="정적 생태지도 표시"
          noticeClassName="absolute bottom-6 left-6 z-20 hidden max-w-xs border border-zinc-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm md:block"
        />

        <section aria-label="생태지도 필터와 결과" className="absolute left-4 right-4 top-4 z-30 max-h-[calc(100vh-8rem)] overflow-y-auto border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm md:left-6 md:right-auto md:w-[26rem]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Eco map filter</p>
              <h1 className="mt-1 font-serif text-xl text-zinc-950">생태지도 검색</h1>
            </div>
            <button
              type="button"
              aria-expanded={areFiltersExpanded}
              aria-controls={`${filterControlsId} ${filterResultsId}`}
              onClick={(event) => {
                event.currentTarget.focus();
                setAreFiltersExpanded((current) => !current);
              }}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-xs text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
            >
              {areFiltersExpanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
              {areFiltersExpanded ? '필터 접기' : '필터 열기'}
            </button>
          </div>

          {!areFiltersExpanded && hasActiveFilters && (
            <div className="mb-2 space-y-1 text-[11px] leading-5 text-zinc-600 [overflow-wrap:anywhere]" aria-label="적용 중인 필터">
              {searchQuery.trim() && <p>검색: {searchQuery}</p>}
              {selectedSpecies && <p>선택 종: {selectedSpecies.name}{selectedSpecies.scientificName && ` (${selectedSpecies.scientificName})`}</p>}
              {selectedTaxa.length > 0 && <p>분류군: {selectedTaxa.join(', ')}</p>}
              {selectedYear !== null && (
                <div className="flex items-center gap-2">
                  <p className="min-w-0">관찰 연도: {selectedYear}년</p>
                  <button
                    type="button"
                    aria-label="관찰 연도 필터 해제"
                    title="관찰 연도 필터 해제"
                    onClick={() => setSelectedYear(null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
              {selectedMonths.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="min-w-0">관찰 월: {selectedMonths.map((month) => `${month}월`).join(', ')}</p>
                  <button
                    type="button"
                    aria-label="관찰 월 필터 해제"
                    title="관찰 월 필터 해제"
                    onClick={() => setSelectedMonths([])}
                    className="flex h-11 w-11 shrink-0 items-center justify-center hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button type="button" onClick={handleReset} className={getResetButtonClassName}>
                전체 보기
              </button>
            </div>
          )}

          {/* Keep the tree mounted so hiding controls does not reset its cache or branches. */}
          <div id={filterControlsId} hidden={!areFiltersExpanded}>
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="종명, 학명, 위치 검색"
              ariaLabel="생태지도 관찰 기록 검색"
              className="relative w-full"
              iconClassName="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              iconSize={13}
              inputClassName="w-full border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-10 text-xs text-zinc-700 transition-all focus:border-black focus:bg-white focus:outline-none"
              rightElement={searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-zinc-200/50 px-1.5 py-0.5 font-sans text-[10px] text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-black"
                >
                  지우기
                </button>
              )}
            />

            {(selectedSpecies || speciesSuggestions.length > 0) && (
              <div className="mt-3 border border-zinc-100 bg-zinc-50/80 p-3">
                {selectedSpecies && (
                  <p className="mb-2 text-[11px] leading-5 text-zinc-600 [overflow-wrap:anywhere]">
                    선택 종: <span className="font-medium text-zinc-900">{selectedSpecies.name}</span>
                    {selectedSpecies.scientificName && <span className="ml-1 italic text-zinc-500">{selectedSpecies.scientificName}</span>}
                  </p>
                )}
                {speciesSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {speciesSuggestions.map((speciesGroup) => (
                      <button
                        key={speciesGroup.key}
                        type="button"
                        onClick={() => handleSpeciesSelect(speciesGroup)}
                        className="max-w-full border border-zinc-200 bg-white px-2.5 py-1 text-left text-[10px] leading-4 text-zinc-600 transition-colors [overflow-wrap:anywhere] hover:border-zinc-900 hover:text-zinc-950"
                      >
                        <span className="font-medium">{speciesGroup.name}</span>
                        {speciesGroup.scientificName && <span className="ml-1 italic opacity-70">{speciesGroup.scientificName}</span>}
                        <span className="ml-1 text-zinc-400">{speciesGroup.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <fieldset className="mt-4 flex flex-wrap gap-1.5">
              <legend className="sr-only">생태지도 분류군 다중 선택</legend>
              {TAXA.map((taxon) => {
                const isSelected = selectedTaxa.includes(taxon);
                return (
                  <TaxonFilterButton
                    key={taxon}
                    label={taxon}
                    active={isSelected}
                    onClick={() => handleTaxonToggle(taxon)}
                    count={getTaxonCount(observations, taxon)}
                    className={getTaxonButtonClassName}
                    activeClassName="border-black bg-black text-white shadow-sm font-semibold"
                    inactiveClassName="border-zinc-100 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
                    countClassName={`ml-1 text-[10px] font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}
                  />
                );
              })}
            </fieldset>

            <div className="mt-4">
              <label htmlFor={yearSelectId} className="block text-xs font-medium text-zinc-700">관찰 연도</label>
              <select
                id={yearSelectId}
                value={selectedYear ?? ''}
                aria-describedby={availableYears.length === 0 || isSelectedYearMissing ? `${yearSelectId}-notice` : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '') setSelectedYear(null);
                  else if (yearOptions.includes(Number(value))) setSelectedYear(Number(value));
                }}
                className="mt-2 min-h-11 w-full min-w-0 max-w-full border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
              >
                <option value="">전체 연도</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년{isSelectedYearMissing && year === selectedYear ? ' (현재 자료 없음)' : ''}
                  </option>
                ))}
              </select>
              {(availableYears.length === 0 || isSelectedYearMissing) && (
                <p id={`${yearSelectId}-notice`} className="mt-1 text-[11px] leading-5 text-zinc-500">
                  {isSelectedYearMissing ? '선택한 연도의 관찰이 현재 자료에 없습니다. 전체 연도로 해제할 수 있습니다.' : '선택할 수 있는 유효한 관찰 연도가 없습니다.'}
                </p>
              )}
            </div>

            <fieldset className="mt-4" aria-label="관찰 월 다중 선택">
              <legend className="text-xs font-medium text-zinc-700">관찰 월</legend>
              <button
                type="button"
                aria-pressed={selectedMonths.length === 0}
                onClick={() => setSelectedMonths([])}
                className="my-1 inline-flex min-h-11 items-center gap-1 px-2 text-xs text-zinc-700 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
              >
                <Check size={12} aria-hidden="true" className={selectedMonths.length === 0 ? '' : 'invisible'} />
                전체 월
              </button>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {OBSERVATION_MONTHS.map((month) => {
                  const isSelected = selectedMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMonths((current) => toggleObservationMonth(current, month))}
                      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1 border px-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700 ${isSelected ? 'border-black bg-black font-semibold text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'}`}
                    >
                      <Check size={12} aria-hidden="true" className={`shrink-0 ${isSelected ? '' : 'invisible'}`} />
                      {month}월
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-3 text-[11px] leading-5 text-zinc-500">분류 옆 숫자는 전체 기록 기준</p>
            <TaxonomyTreePanel
              repository={taxonomyRepository}
              selectedNode={selectedTaxonomyNode}
              onSelectNode={(node) => setSelectedTaxonomyNode(node)}
            />
          </div>

          <TaxonomyFilterStatus
            selectedNode={selectedTaxonomyNode}
            isFilterLoading={isLoadingTaxonomyFilter}
            filterError={taxonomyFilterError}
            onClearSelection={() => setSelectedTaxonomyNode(null)}
          />

          <div id={filterResultsId} hidden={!areFiltersExpanded}>
            <p className="mt-4 border-t border-zinc-100 pt-3 text-[11px] leading-5 text-zinc-500">
              표시 중 {filteredObservations.length}건 / 전체 {observations.length}건
            </p>

            {filteredObservations.length > 0 && (
              <div className="mt-3 max-h-44 overflow-y-auto border border-zinc-100 bg-white/70">
                <p className="border-b border-zinc-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  관찰 목록
                </p>
                <div className="divide-y divide-zinc-100">
                  {filteredObservations.map((observation) => (
                    <button
                      key={observation.id}
                      type="button"
                      onClick={() => onSelect(observation)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-medium text-zinc-800">{observation.name}</span>
                        <span className="block truncate text-[10px] italic text-zinc-400">{observation.scientificName || observation.location}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-400">{observation.taxon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredObservations.length === 0 && (
              <p className="mt-3 border border-zinc-100 bg-white px-3 py-2 text-[11px] leading-5 text-zinc-500">
                조건에 맞는 등록 관찰 기록이 없습니다. 검색어를 줄이거나 분류군 선택을 조정해 주세요.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
