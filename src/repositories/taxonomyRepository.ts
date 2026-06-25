import type { Taxon } from '../types';
import type { TaxonomyLineage } from '../features/taxonomy/taxonomyCore';

export type TaxonomyRepositoryKind = 'mock' | 'supabase';

export type TaxonomyResultStatus = 'resolved' | 'needsConfirmation' | 'blocked' | 'error';

export type TaxonomyBlockedReason =
  | 'higher_rank_only'
  | 'no_match'
  | 'unsupported_terminal_rank'
  | 'ambiguous_result'
  | 'incomplete_accepted_identity'
  | 'malformed_upstream_response';

export type TaxonomyErrorReason =
  | 'invalid_input'
  | 'unauthorized'
  | 'rate_limited'
  | 'timeout'
  | 'upstream_failure'
  | 'database_failure'
  | 'malformed_response'
  | 'invalid_confirmation';

export type TaxonomyConfirmationReason = 'synonym' | 'variant';

export interface TaxonomySourceAttribution {
  name: 'GBIF Species Match API v2';
  checklistKey: string;
  sourceTaxonKey: string;
}

export interface TaxonomyResolvedResult {
  status: 'resolved';
  taxonId: string;
  reportedScientificName: string;
  acceptedScientificName: string;
  canonicalName: string | null;
  terminalRank: string;
  taxonomicStatus: string;
  lineage: TaxonomyLineage;
  matchType: string;
  confidence: number | null;
  synonym: boolean;
  broadTaxon: Taxon;
  source: TaxonomySourceAttribution;
  resolvedAt: string;
  cacheHit: boolean;
  messageKey: 'taxonomy.resolved';
}

export interface TaxonomyConfirmationCandidate {
  acceptedSourceTaxonKey: string;
  acceptedScientificName: string;
  canonicalName: string | null;
  terminalRank: string;
  taxonomicStatus: string;
  lineage: TaxonomyLineage;
  matchType: string;
  confidence: number | null;
  synonym: boolean;
  reason: TaxonomyConfirmationReason;
  broadTaxon: Taxon;
  source: TaxonomySourceAttribution;
}

export interface TaxonomyNeedsConfirmationResult {
  status: 'needsConfirmation';
  reportedScientificName: string;
  candidate: TaxonomyConfirmationCandidate;
  cacheHit: boolean;
  retryable: false;
  messageKey: 'taxonomy.confirmationRequired';
}

export interface TaxonomyBlockedResult {
  status: 'blocked';
  reason: TaxonomyBlockedReason;
  reportedScientificName: string;
  matchType: string | null;
  retryable: false;
  messageKey: 'taxonomy.blocked';
}

export interface TaxonomyErrorResult {
  status: 'error';
  reason: TaxonomyErrorReason;
  retryable: boolean;
  messageKey: 'taxonomy.error';
}

export type TaxonomyResolutionResult =
  | TaxonomyResolvedResult
  | TaxonomyNeedsConfirmationResult
  | TaxonomyBlockedResult
  | TaxonomyErrorResult;

export interface ResolveScientificNameInput {
  scientificName: string;
}

export interface ConfirmScientificNameInput {
  scientificName: string;
  acceptedSourceTaxonKey: string;
}

export interface TaxonomyRepository {
  resolveScientificName(input: ResolveScientificNameInput): Promise<TaxonomyResolutionResult>;
  confirmScientificName(input: ConfirmScientificNameInput): Promise<TaxonomyResolutionResult>;
}
