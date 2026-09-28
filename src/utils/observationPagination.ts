import { ALL_TAXON_FILTER, TAXON_FILTERS, type TaxonFilter } from '../constants/taxon';
import type { Observation } from '../types';
import { matchesObservationSearchQuery, type ImageFilter, type ObservationSortKey } from './observationFilters';

export const OBSERVATION_PAGE_SIZE = 20;
// Reject implausible offsets; larger datasets need a separately reviewed read strategy.
export const MAX_OBSERVATION_PAGE = 50_000;

export interface ObservationPageQuery {
  page: number;
  searchQuery: string;
  selectedTaxon: TaxonFilter;
  imageFilter: ImageFilter;
  sortKey: ObservationSortKey;
}

export interface ObservationPage {
  items: Observation[];
  page: number;
  pageSize: typeof OBSERVATION_PAGE_SIZE;
  totalCount: number;
}

export const DEFAULT_OBSERVATION_PAGE_QUERY: ObservationPageQuery = {
  page: 1, searchQuery: '', selectedTaxon: ALL_TAXON_FILTER, imageFilter: 'all', sortKey: 'newest',
};

export const validateObservationPageQuery = (query: ObservationPageQuery) => {
  if (!Number.isSafeInteger(query.page) || query.page < 1 || query.page > MAX_OBSERVATION_PAGE
    || typeof query.searchQuery !== 'string'
    || !(TAXON_FILTERS as readonly string[]).includes(query.selectedTaxon)
    || !['all', 'with-image', 'without-image'].includes(query.imageFilter)
    || !['newest', 'oldest', 'name'].includes(query.sortKey)) {
    throw new Error('Invalid observation page query.');
  }
};

export const observationPageRange = (page: number) => {
  validateObservationPageQuery({ ...DEFAULT_OBSERVATION_PAGE_QUERY, page });
  const from = (page - 1) * OBSERVATION_PAGE_SIZE;
  return { from, to: from + OBSERVATION_PAGE_SIZE - 1 };
};

export const observationTotalPages = (totalCount: number) => Math.ceil(totalCount / OBSERVATION_PAGE_SIZE);

// Literal whitespace characters keep the expression usable in both JS and PostgreSQL ARE.
export const SEARCH_WHITESPACE = '\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
export const REGISTERED_IMAGE_PATH_PATTERN = '^(pending|observations)/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|jpeg|png|webp)$';
const nonSpace = `[^${SEARCH_WHITESPACE}]`;
// Existing read compatibility only: no new URL writes, transient URLs or placeholder assets.
export const LEGACY_IMAGE_REFERENCE_PATTERN = `^(https?://[^/${SEARCH_WHITESPACE}?#]+${nonSpace}*|/(?!/)${nonSpace}+)$`;
export const TRANSIENT_IMAGE_REFERENCE_PATTERN = '(/storage/v1/object/(sign|upload/sign)/|[?&](token|access_token|signature|sig|expires|x-amz-signature|x-goog-signature)=|(^|/)(placeholder|no[-_]?photo|default[-_]?image)([./?_-]|$))';

export const hasRegisteredObservationImage = (observation: Pick<Observation, 'imagePath' | 'imageUrl'>) => (
  new RegExp(REGISTERED_IMAGE_PATH_PATTERN, 'i').test(observation.imagePath ?? '')
  || (new RegExp(LEGACY_IMAGE_REFERENCE_PATTERN, 'i').test(observation.imageUrl)
    && !new RegExp(TRANSIENT_IMAGE_REFERENCE_PATTERN, 'i').test(observation.imageUrl))
);

export const paginateMockObservations = (observations: Observation[], query: ObservationPageQuery): ObservationPage => {
  validateObservationPageQuery(query);
  const filtered = observations.filter((observation) => {
    const isPublic = observation.status === undefined || observation.status === 'sample' || observation.status === 'approved';
    const hasImage = hasRegisteredObservationImage(observation);
    return isPublic
      && (query.selectedTaxon === ALL_TAXON_FILTER || observation.taxon === query.selectedTaxon)
      && matchesObservationSearchQuery(observation, query.searchQuery)
      && (query.imageFilter === 'all' || (query.imageFilter === 'with-image' ? hasImage : !hasImage));
  }).sort((a, b) => {
    const primary = query.sortKey === 'name' ? a.name.localeCompare(b.name, 'ko')
      : query.sortKey === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    return primary || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
  });
  const page = Math.min(query.page, Math.max(1, observationTotalPages(filtered.length)));
  const { from, to } = observationPageRange(page);
  return { items: filtered.slice(from, to + 1), page, pageSize: OBSERVATION_PAGE_SIZE, totalCount: filtered.length };
};
