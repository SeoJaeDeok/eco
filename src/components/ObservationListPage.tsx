import { useMemo, useState } from 'react';
import { ALL_TAXON_FILTER, type TaxonFilter } from '../constants/taxon';
import { filterObservations, sortObservations, type ObservationSortOrder } from '../utils/observationFilters';
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
  const [sortBy, setSortBy] = useState<ObservationSortOrder>('latest');
  const [selectedTaxon, setSelectedTaxon] = useState<TaxonFilter>(ALL_TAXON_FILTER);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObservations = useMemo(() => {
    return filterObservations(observations, { selectedTaxon, searchQuery });
  }, [observations, selectedTaxon, searchQuery]);

  const sortedObservations = useMemo(() => {
    return sortObservations(filteredObservations, sortBy);
  }, [filteredObservations, sortBy]);

  const uniqueSpeciesCount = useMemo(() => {
    return countUniqueSpecies(filteredObservations);
  }, [filteredObservations]);

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-20" id="observation-page">
      <div className="max-w-6xl mx-auto">
        <ObservationListHeader
          selectedTaxon={selectedTaxon}
          uniqueSpeciesCount={uniqueSpeciesCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
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
