import { ALL_TAXON_FILTER, type TaxonFilter } from '../constants/taxon';
import type { Observation } from '../types';

export type ImageFilter = 'all' | 'with-image' | 'without-image';
export type ObservationSortKey = 'newest' | 'oldest' | 'name';

export interface FilterObservationsOptions {
  selectedTaxon: TaxonFilter;
  searchQuery: string;
  imageFilter?: ImageFilter;
}

export interface FilterAndSortObservationsOptions extends FilterObservationsOptions {
  sortKey: ObservationSortKey;
}

export const hasObservationImage = (observation: Observation) => {
  return Boolean(observation.imageUrl.trim());
};

export const filterObservations = (
  observations: Observation[],
  { selectedTaxon, searchQuery, imageFilter = 'all' }: FilterObservationsOptions,
) => {
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

  if (imageFilter !== 'all') {
    result = result.filter((obs) => {
      const hasImage = hasObservationImage(obs);
      return imageFilter === 'with-image' ? hasImage : !hasImage;
    });
  }

  return result;
};

const getObservationTime = (observation: Observation) => {
  return Date.parse(observation.date.replace(/-/g, '/')) || 0;
};

export const sortObservations = (observations: Observation[], sortKey: ObservationSortKey) => {
  return [...observations].sort((a, b) => {
    if (sortKey === 'name') {
      return a.name.localeCompare(b.name, 'ko');
    }

    const aTime = getObservationTime(a);
    const bTime = getObservationTime(b);
    return sortKey === 'newest' ? bTime - aTime : aTime - bTime;
  });
};

export const filterAndSortObservations = (
  observations: Observation[],
  { sortKey, ...filterOptions }: FilterAndSortObservationsOptions,
) => {
  return sortObservations(filterObservations(observations, filterOptions), sortKey);
};

export const countObservationsByTaxon = (observations: Observation[], taxon: TaxonFilter) => {
  return observations.filter((obs) => taxon === ALL_TAXON_FILTER || obs.taxon === taxon).length;
};
