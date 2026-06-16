import { useMemo, useState } from 'react';
import { ALL_TAXON_FILTER, type TaxonFilter } from '../constants/taxon';
import {
  filterAndSortObservations,
  filterObservations,
  type ImageFilter,
  type ObservationSortKey,
} from '../utils/observationFilters';
import { countUniqueSpecies } from '../utils/observationStats';
import { ObservationGrid } from './observations/ObservationGrid';
import { ObservationListHeader } from './observations/ObservationListHeader';
import { ObservationTaxonFilter } from './observations/ObservationTaxonFilter';
import type { Observation } from '../types';

interface ObservationListPageProps {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
}

export const ObservationListPage = ({ observations, onSelect }: ObservationListPageProps) => {
  const [sortKey, setSortKey] = useState<ObservationSortKey>('newest');
  const [selectedTaxon, setSelectedTaxon] = useState<TaxonFilter>(ALL_TAXON_FILTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFilter, setImageFilter] = useState<ImageFilter>('all');

  const filteredObservations = useMemo(() => {
    return filterObservations(observations, { selectedTaxon, searchQuery, imageFilter });
  }, [imageFilter, observations, selectedTaxon, searchQuery]);

  const sortedObservations = useMemo(() => {
    return filterAndSortObservations(observations, { selectedTaxon, searchQuery, imageFilter, sortKey });
  }, [imageFilter, observations, searchQuery, selectedTaxon, sortKey]);

  const uniqueSpeciesCount = useMemo(() => {
    return countUniqueSpecies(filteredObservations);
  }, [filteredObservations]);

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-20" id="observation-page">
      <div className="max-w-6xl mx-auto">
        <ObservationListHeader
          selectedTaxon={selectedTaxon}
          uniqueSpeciesCount={uniqueSpeciesCount}
          resultCount={filteredObservations.length}
          totalCount={observations.length}
          sortKey={sortKey}
          onSortChange={setSortKey}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
          imageFilter={imageFilter}
          onImageFilterChange={setImageFilter}
        />

        <ObservationTaxonFilter
          observations={observations}
          selectedTaxon={selectedTaxon}
          onSelectTaxon={setSelectedTaxon}
        />

        <ObservationGrid observations={sortedObservations} onSelectObservation={onSelect} />
      </div>
    </div>
  );
};
