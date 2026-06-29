import { useEffect, useMemo, useState } from 'react';
import { TAXA } from '../constants/taxon';
import { activeTaxonomyTreeRepository } from '../repositories/taxonomyTreeRepositoryProvider';
import {
  filterMapObservations,
  getObservationSpeciesGroups,
  type ObservationSpeciesGroup,
} from '../utils/observationFilters';
import type { Observation, Taxon } from '../types';
import type { TaxonomyTreeSelection } from '../features/taxonomy/taxonomyTree';
import { SearchInput } from './ui/SearchInput';
import { TaxonFilterButton } from './ui/TaxonFilterButton';
import { MapPreview } from './MapPreview';
import { TaxonomyTreePanel } from './map/TaxonomyTreePanel';

interface MapPageProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
}

const SPECIES_SUGGESTION_LIMIT = 6;

const getTaxonCount = (observations: Observation[], taxon: Taxon) => {
  return observations.filter((observation) => observation.taxon === taxon).length;
};

const getTaxonButtonClassName = 'px-3 py-1.5 text-[10px] font-sans tracking-wide transition-all border';
const getResetButtonClassName = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-950';

export const MapPage = ({ observations, onSelect }: MapPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaxa, setSelectedTaxa] = useState<Taxon[]>([]);
  const [selectedSpeciesKey, setSelectedSpeciesKey] = useState<string | null>(null);
  const [selectedTaxonomyNode, setSelectedTaxonomyNode] = useState<TaxonomyTreeSelection | null>(null);
  const [taxonomyObservationIds, setTaxonomyObservationIds] = useState<ReadonlySet<string> | null>(null);
  const [isLoadingTaxonomyFilter, setIsLoadingTaxonomyFilter] = useState(false);
  const [taxonomyFilterError, setTaxonomyFilterError] = useState<string | null>(null);

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
        const ids = await activeTaxonomyTreeRepository.getObservationIdsForSelection(selectedTaxonomyNode);

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
  }, [selectedTaxonomyNode]);

  const filteredObservations = useMemo(() => {
    return filterMapObservations(observations, {
      selectedTaxa,
      searchQuery,
      selectedSpeciesKey,
      taxonomyObservationIds: selectedTaxonomyNode ? taxonomyObservationIds ?? new Set() : null,
    });
  }, [observations, searchQuery, selectedSpeciesKey, selectedTaxa, selectedTaxonomyNode, taxonomyObservationIds]);

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
    searchQuery.trim() || selectedSpeciesKey || selectedTaxa.length > 0 || selectedTaxonomyNode,
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
    setSelectedTaxonomyNode(null);
  };

  return (
    <div className="h-screen flex flex-col pt-20" id="map-page">
      <div className="flex-1 w-full bg-zinc-100 overflow-hidden relative">
        <MapPreview
          observations={filteredObservations}
          onSelect={onSelect}
          title="정적 생태지도 표시"
          noticeClassName="absolute bottom-6 left-6 z-20 hidden max-w-xs border border-zinc-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm md:block"
        />

        <section className="absolute left-4 right-4 top-4 z-30 max-h-[calc(100vh-8rem)] overflow-y-auto border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm md:left-6 md:right-auto md:w-[26rem]">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Eco map filter</p>
              <h1 className="mt-1 font-serif text-xl text-zinc-950">생태지도 검색</h1>
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={handleReset} className={getResetButtonClassName}>
                전체 보기
              </button>
            )}
          </div>

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
                <p className="mb-2 text-[11px] leading-5 text-zinc-600">
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
                      className="border border-zinc-200 bg-white px-2.5 py-1 text-left text-[10px] leading-4 text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-950"
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

          <TaxonomyTreePanel
            repository={activeTaxonomyTreeRepository}
            selectedNode={selectedTaxonomyNode}
            isFilterLoading={isLoadingTaxonomyFilter}
            filterError={taxonomyFilterError}
            onSelectNode={(node) => setSelectedTaxonomyNode(node)}
            onClearSelection={() => setSelectedTaxonomyNode(null)}
          />

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
        </section>
      </div>
    </div>
  );
};
