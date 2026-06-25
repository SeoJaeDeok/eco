import { normalizeScientificNameInput } from '../../features/taxonomy/taxonomyCore';
import type {
  ConfirmScientificNameInput,
  TaxonomyErrorReason,
  TaxonomyErrorResult,
  TaxonomyRepository,
  TaxonomyResolutionResult,
} from '../taxonomyRepository';
import { getSupabaseClient } from './supabaseClient';

const RESOLVE_TAXONOMY_FUNCTION = 'resolve-taxonomy';

type ResolveTaxonomyRequest =
  | {
    action: 'resolve';
    scientificName: string;
  }
  | {
    action: 'confirm';
    scientificName: string;
    acceptedSourceTaxonKey: string;
  };

const createErrorResult = (
  reason: TaxonomyErrorReason,
  retryable: boolean,
): TaxonomyErrorResult => ({
  status: 'error',
  reason,
  retryable,
  messageKey: 'taxonomy.error',
});

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isLineageRank = (value: unknown) => {
  return isObject(value)
    && (typeof value.key === 'string' || value.key === null)
    && (typeof value.name === 'string' || value.name === null);
};

const isLineage = (value: unknown) => {
  if (!isObject(value)) return false;

  return ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
    .every((rank) => isLineageRank(value[rank]));
};

const isSourceAttribution = (value: unknown) => {
  return isObject(value)
    && value.name === 'GBIF Species Match API v2'
    && typeof value.checklistKey === 'string'
    && typeof value.sourceTaxonKey === 'string';
};

const isConfidence = (value: unknown) => {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100);
};

const isTaxonomyResolutionResult = (value: unknown): value is TaxonomyResolutionResult => {
  if (!isObject(value) || typeof value.status !== 'string') {
    return false;
  }

  if (value.status === 'resolved') {
    return typeof value.taxonId === 'string'
      && typeof value.reportedScientificName === 'string'
      && typeof value.acceptedScientificName === 'string'
      && (typeof value.canonicalName === 'string' || value.canonicalName === null)
      && typeof value.terminalRank === 'string'
      && typeof value.taxonomicStatus === 'string'
      && isLineage(value.lineage)
      && typeof value.matchType === 'string'
      && isConfidence(value.confidence)
      && typeof value.synonym === 'boolean'
      && typeof value.broadTaxon === 'string'
      && isSourceAttribution(value.source)
      && typeof value.resolvedAt === 'string'
      && typeof value.cacheHit === 'boolean'
      && value.messageKey === 'taxonomy.resolved';
  }

  if (value.status === 'needsConfirmation') {
    const candidate = value.candidate;
    return typeof value.reportedScientificName === 'string'
      && isObject(candidate)
      && typeof candidate.acceptedSourceTaxonKey === 'string'
      && typeof candidate.acceptedScientificName === 'string'
      && (typeof candidate.canonicalName === 'string' || candidate.canonicalName === null)
      && typeof candidate.terminalRank === 'string'
      && typeof candidate.taxonomicStatus === 'string'
      && isLineage(candidate.lineage)
      && typeof candidate.matchType === 'string'
      && isConfidence(candidate.confidence)
      && typeof candidate.synonym === 'boolean'
      && (candidate.reason === 'synonym' || candidate.reason === 'variant')
      && typeof candidate.broadTaxon === 'string'
      && isSourceAttribution(candidate.source)
      && value.cacheHit !== undefined
      && typeof value.cacheHit === 'boolean'
      && value.retryable === false
      && value.messageKey === 'taxonomy.confirmationRequired';
  }

  if (value.status === 'blocked') {
    return typeof value.reason === 'string'
      && typeof value.reportedScientificName === 'string'
      && (typeof value.matchType === 'string' || value.matchType === null)
      && value.retryable === false
      && value.messageKey === 'taxonomy.blocked';
  }

  if (value.status === 'error') {
    return typeof value.reason === 'string'
      && typeof value.retryable === 'boolean'
      && value.messageKey === 'taxonomy.error';
  }

  return false;
};

const parseFunctionErrorBody = async (error: unknown) => {
  if (!isObject(error) || !isObject(error.context) || typeof error.context.json !== 'function') {
    return null;
  }

  try {
    return await (error.context.json as () => Promise<unknown>)();
  } catch {
    return null;
  }
};

const invokeResolveTaxonomy = async (body: ResolveTaxonomyRequest): Promise<TaxonomyResolutionResult> => {
  const { data, error } = await getSupabaseClient().functions.invoke(RESOLVE_TAXONOMY_FUNCTION, {
    body,
  });

  if (error) {
    const safeBody = await parseFunctionErrorBody(error);
    if (isTaxonomyResolutionResult(safeBody)) {
      return safeBody;
    }

    return createErrorResult('upstream_failure', true);
  }

  if (!isTaxonomyResolutionResult(data)) {
    return createErrorResult('malformed_response', true);
  }

  return data;
};

const hasValidScientificName = (scientificName: string) => {
  return normalizeScientificNameInput(scientificName).ok;
};

export const supabaseTaxonomyRepository: TaxonomyRepository = {
  async resolveScientificName(input) {
    if (!hasValidScientificName(input.scientificName)) {
      return createErrorResult('invalid_input', false);
    }

    return invokeResolveTaxonomy({
      action: 'resolve',
      scientificName: input.scientificName,
    });
  },

  async confirmScientificName(input: ConfirmScientificNameInput) {
    if (!hasValidScientificName(input.scientificName) || !input.acceptedSourceTaxonKey.trim()) {
      return createErrorResult('invalid_input', false);
    }

    return invokeResolveTaxonomy({
      action: 'confirm',
      scientificName: input.scientificName,
      acceptedSourceTaxonKey: input.acceptedSourceTaxonKey,
    });
  },
};
