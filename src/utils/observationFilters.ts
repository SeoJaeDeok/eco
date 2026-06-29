import { ALL_TAXON_FILTER, type TaxonFilter } from '../constants/taxon';
import type { Observation, Taxon } from '../types';

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

export interface FilterMapObservationsOptions {
  selectedTaxa: readonly Taxon[];
  searchQuery: string;
  selectedSpeciesKey?: string | null;
  taxonomyObservationIds?: ReadonlySet<string> | null;
}

export interface ObservationSpeciesGroup {
  key: string;
  name: string;
  scientificName: string;
  count: number;
}

export const hasObservationImage = (observation: Observation) => {
  return Boolean(observation.imageUrl.trim());
};

const normalizeSearchText = (value: string) => {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
};

export const getObservationSpeciesKey = (observation: Pick<Observation, 'name' | 'scientificName'>) => {
  const scientificName = normalizeSearchText(observation.scientificName);

  return scientificName
    ? `scientific:${scientificName}`
    : `name:${normalizeSearchText(observation.name)}`;
};

export const matchesObservationSearchQuery = (observation: Observation, searchQuery: string) => {
  const q = normalizeSearchText(searchQuery);

  if (!q) {
    return true;
  }

  return normalizeSearchText(observation.name).includes(q)
    || normalizeSearchText(observation.scientificName).includes(q)
    || normalizeSearchText(observation.location).includes(q)
    || normalizeSearchText(observation.description).includes(q);
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
    result = result.filter((obs) => matchesObservationSearchQuery(obs, searchQuery));
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

export const filterMapObservations = (
  observations: Observation[],
  { selectedTaxa, searchQuery, selectedSpeciesKey, taxonomyObservationIds = null }: FilterMapObservationsOptions,
) => {
  return observations.filter((observation) => {
    const matchesPublicStatus = observation.status === undefined
      || observation.status === 'sample'
      || observation.status === 'approved';
    const matchesTaxon = selectedTaxa.length === 0 || selectedTaxa.includes(observation.taxon);
    const matchesSpecies = selectedSpeciesKey
      ? getObservationSpeciesKey(observation) === selectedSpeciesKey
      : matchesObservationSearchQuery(observation, searchQuery);
    const matchesTaxonomy = taxonomyObservationIds === null
      || (Boolean(observation.taxonId) && taxonomyObservationIds.has(observation.id));

    return matchesPublicStatus && matchesTaxon && matchesSpecies && matchesTaxonomy;
  });
};

export const getObservationSpeciesGroups = (
  observations: Observation[],
  searchQuery = '',
): ObservationSpeciesGroup[] => {
  const groupsByKey = new Map<string, ObservationSpeciesGroup>();

  observations.forEach((observation) => {
    if (!matchesObservationSearchQuery(observation, searchQuery)) {
      return;
    }

    const key = getObservationSpeciesKey(observation);
    const existingGroup = groupsByKey.get(key);

    if (existingGroup) {
      existingGroup.count += 1;
      return;
    }

    groupsByKey.set(key, {
      key,
      name: observation.name,
      scientificName: observation.scientificName,
      count: 1,
    });
  });

  return [...groupsByKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
};
