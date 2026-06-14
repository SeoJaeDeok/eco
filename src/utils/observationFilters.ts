import { ALL_TAXON_FILTER, type TaxonFilter } from '../constants/taxon';
import type { Observation } from '../types';

export type ObservationSortOrder = 'latest' | 'oldest';

interface FilterObservationsOptions {
  selectedTaxon: TaxonFilter;
  searchQuery: string;
}

export const filterObservations = (observations: Observation[], { selectedTaxon, searchQuery }: FilterObservationsOptions) => {
  let result = observations;

  if (selectedTaxon !== ALL_TAXON_FILTER) {
    result = result.filter((obs) => obs.taxon === selectedTaxon);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((obs) =>
      obs.name.toLowerCase().includes(q)
      || obs.scientificName.toLowerCase().includes(q)
      || obs.location.toLowerCase().includes(q)
      || obs.description.toLowerCase().includes(q),
    );
  }

  return result;
};

export const sortObservations = (observations: Observation[], sortBy: ObservationSortOrder) => {
  return [...observations].sort((a, b) => {
    const aTime = Date.parse(a.date.replace(/-/g, '/')) || 0;
    const bTime = Date.parse(b.date.replace(/-/g, '/')) || 0;
    return sortBy === 'latest' ? bTime - aTime : aTime - bTime;
  });
};

export const countObservationsByTaxon = (observations: Observation[], taxon: TaxonFilter) => {
  return observations.filter((obs) => taxon === ALL_TAXON_FILTER || obs.taxon === taxon).length;
};
