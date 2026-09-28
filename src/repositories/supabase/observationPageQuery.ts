import { ALL_TAXON_FILTER } from '../../constants/taxon';
import {
  LEGACY_IMAGE_REFERENCE_PATTERN, REGISTERED_IMAGE_PATH_PATTERN, SEARCH_WHITESPACE,
  TRANSIENT_IMAGE_REFERENCE_PATTERN, type ObservationPageQuery,
} from '../../utils/observationPagination';
import { getSupabaseClient } from './supabaseClient';

export const OBSERVATION_PAGE_SELECT = 'id,name,scientific_name,taxon,location,observed_date,description,latitude,longitude,image_url,image_path,status,observer_id,observer_display_name,taxon_id,taxonomy_match_type,taxonomy_confidence,taxonomy_verified_at';

export const quotePostgrestValue = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export const observationSearchPattern = (search: string) => search.trim().replace(/\s+/g, ' ')
  .split(' ').map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(`[${SEARCH_WHITESPACE}]+`);

const imagePathMatch = `image_path.imatch.${quotePostgrestValue(REGISTERED_IMAGE_PATH_PATTERN)}`;
const legacyMatch = `and(image_url.imatch.${quotePostgrestValue(LEGACY_IMAGE_REFERENCE_PATTERN)},image_url.not.imatch.${quotePostgrestValue(TRANSIENT_IMAGE_REFERENCE_PATTERN)})`;
const imageMissing = `and(or(image_path.is.null,image_path.not.imatch.${quotePostgrestValue(REGISTERED_IMAGE_PATH_PATTERN)}),or(image_url.is.null,image_url.not.imatch.${quotePostgrestValue(LEGACY_IMAGE_REFERENCE_PATTERN)},image_url.imatch.${quotePostgrestValue(TRANSIENT_IMAGE_REFERENCE_PATTERN)}))`;

export const buildObservationPageQuery = (options: ObservationPageQuery, head = false) => {
  let query = getSupabaseClient().from('observations')
    .select(head ? 'id' : OBSERVATION_PAGE_SELECT, { count: 'exact', head })
    .eq('status', 'approved');
  if (options.selectedTaxon !== ALL_TAXON_FILTER) query = query.eq('taxon', options.selectedTaxon);

  // Fixed columns/operators; user input is a quoted, escaped literal regex, never filter syntax.
  const conditions: string[] = [];
  if (options.searchQuery.trim()) {
    const pattern = quotePostgrestValue(observationSearchPattern(options.searchQuery));
    conditions.push(`or(${['name', 'scientific_name', 'location', 'description'].map((field) => `${field}.imatch.${pattern}`).join(',')})`);
  }
  if (options.imageFilter === 'with-image') conditions.push(`or(${imagePathMatch},${legacyMatch})`);
  if (options.imageFilter === 'without-image') conditions.push(imageMissing);
  if (conditions.length) query = query.or(`and(${conditions.join(',')})`);

  // Keep retries explicit in the list UI; bound range recovery separately in the repository.
  return query.order(options.sortKey === 'name' ? 'name' : 'observed_date', {
    ascending: options.sortKey !== 'newest',
  }).order('id', { ascending: false }).retry(false);
};
