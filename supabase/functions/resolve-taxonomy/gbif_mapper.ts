import {
  createEmptyTaxonomyLineage,
  deriveBroadTaxonFromLineage,
  createSourceAttribution,
  type Taxon,
  type TaxonomyLineage,
} from './taxonomy_core.ts';

export type TaxonomyBlockedReason =
  | 'higher_rank_only'
  | 'no_match'
  | 'unsupported_terminal_rank'
  | 'ambiguous_result'
  | 'incomplete_accepted_identity'
  | 'malformed_upstream_response';

export type TaxonomyConfirmationReason = 'synonym' | 'variant';

export interface AcceptedTaxonCandidate {
  sourceTaxonKey: string;
  acceptedScientificName: string;
  canonicalName: string | null;
  terminalRank: string;
  taxonomicStatus: string;
  lineage: TaxonomyLineage;
  matchType: string;
  confidence: number | null;
  synonym: boolean;
  reason: TaxonomyConfirmationReason | null;
  broadTaxon: Taxon;
  issues: string[];
}

export type GbifInterpretation =
  | {
    kind: 'resolved';
    taxon: AcceptedTaxonCandidate;
  }
  | {
    kind: 'needsConfirmation';
    taxon: AcceptedTaxonCandidate & { reason: TaxonomyConfirmationReason };
  }
  | {
    kind: 'blocked';
    reason: TaxonomyBlockedReason;
    reportedScientificName: string;
    matchType: string | null;
  };

type UnknownRecord = Record<string, unknown>;

const STANDARD_RANKS = {
  KINGDOM: 'kingdom',
  PHYLUM: 'phylum',
  CLASS: 'class',
  ORDER: 'order',
  FAMILY: 'family',
  GENUS: 'genus',
  SPECIES: 'species',
} as const;

const ACCEPTED_TERMINAL_RANKS = new Set(['SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM']);
const HIGHER_RANKS = new Set(['KINGDOM', 'PHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS']);

const isObject = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readBoolean = (value: unknown) => value === true;

const readIssues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((issue): issue is string => typeof issue === 'string' && issue.trim().length > 0);
};

const normalizeRank = (value: string | null) => value?.trim().toUpperCase() ?? null;

const extractLineage = (classification: unknown): TaxonomyLineage => {
  const lineage = createEmptyTaxonomyLineage();

  if (!Array.isArray(classification)) {
    return lineage;
  }

  for (const item of classification) {
    if (!isObject(item)) continue;

    const rank = normalizeRank(readString(item.rank));
    if (!rank || !(rank in STANDARD_RANKS)) continue;

    const lineageRank = STANDARD_RANKS[rank as keyof typeof STANDARD_RANKS];
    lineage[lineageRank] = {
      key: readString(item.key) ?? null,
      name: readString(item.name) ?? null,
    };
  }

  return lineage;
};

const createBlocked = (
  reason: TaxonomyBlockedReason,
  reportedScientificName: string,
  matchType: string | null,
): GbifInterpretation => ({
  kind: 'blocked',
  reason,
  reportedScientificName,
  matchType,
});

export const interpretGbifSpeciesMatch = (
  reportedScientificName: string,
  response: unknown,
): GbifInterpretation => {
  if (!isObject(response)) {
    return createBlocked('malformed_upstream_response', reportedScientificName, null);
  }

  const diagnostics = isObject(response.diagnostics) ? response.diagnostics : {};
  const matchType = readString(diagnostics.matchType);
  const confidence = readNumber(diagnostics.confidence);
  const issues = readIssues(response.issues);
  const usage = isObject(response.usage) ? response.usage : null;

  if (!usage) {
    return createBlocked(matchType === 'NONE' ? 'no_match' : 'malformed_upstream_response', reportedScientificName, matchType);
  }

  const usageStatus = normalizeRank(readString(usage.status));
  const synonym = readBoolean(response.synonym) || usageStatus === 'SYNONYM';
  const acceptedUsage = isObject(response.acceptedUsage) ? response.acceptedUsage : null;
  const accepted = synonym ? acceptedUsage : acceptedUsage ?? usage;

  if (!accepted) {
    return createBlocked('incomplete_accepted_identity', reportedScientificName, matchType);
  }

  const sourceTaxonKey = readString(accepted.key);
  const acceptedScientificName = readString(accepted.name);
  const terminalRank = normalizeRank(readString(accepted.rank));
  const taxonomicStatus = normalizeRank(readString(accepted.status)) ?? (synonym ? 'ACCEPTED' : usageStatus);

  if (!sourceTaxonKey || !acceptedScientificName || !terminalRank || !taxonomicStatus) {
    return createBlocked('incomplete_accepted_identity', reportedScientificName, matchType);
  }

  if (HIGHER_RANKS.has(terminalRank)) {
    return createBlocked('higher_rank_only', reportedScientificName, matchType);
  }

  if (!ACCEPTED_TERMINAL_RANKS.has(terminalRank)) {
    return createBlocked('unsupported_terminal_rank', reportedScientificName, matchType);
  }

  const lineage = extractLineage(response.classification);

  if (terminalRank !== 'SPECIES' && !lineage.species.key) {
    return createBlocked('incomplete_accepted_identity', reportedScientificName, matchType);
  }

  const taxon: AcceptedTaxonCandidate = {
    sourceTaxonKey,
    acceptedScientificName,
    canonicalName: readString(accepted.canonicalName),
    terminalRank,
    taxonomicStatus,
    lineage,
    matchType: matchType ?? 'UNKNOWN',
    confidence,
    synonym,
    reason: null,
    broadTaxon: deriveBroadTaxonFromLineage(lineage),
    issues,
  };

  if (synonym) {
    return {
      kind: 'needsConfirmation',
      taxon: {
        ...taxon,
        reason: 'synonym',
      },
    };
  }

  if (matchType === 'EXACT' && taxonomicStatus === 'ACCEPTED') {
    return {
      kind: 'resolved',
      taxon,
    };
  }

  if (matchType === 'VARIANT' && taxonomicStatus === 'ACCEPTED') {
    return {
      kind: 'needsConfirmation',
      taxon: {
        ...taxon,
        reason: 'variant',
      },
    };
  }

  return createBlocked('ambiguous_result', reportedScientificName, matchType);
};

export const createCandidateResult = (
  reportedScientificName: string,
  taxon: AcceptedTaxonCandidate & { reason: TaxonomyConfirmationReason },
  cacheHit: boolean,
) => ({
  status: 'needsConfirmation',
  reportedScientificName,
  candidate: {
    acceptedSourceTaxonKey: taxon.sourceTaxonKey,
    acceptedScientificName: taxon.acceptedScientificName,
    canonicalName: taxon.canonicalName,
    terminalRank: taxon.terminalRank,
    taxonomicStatus: taxon.taxonomicStatus,
    lineage: taxon.lineage,
    matchType: taxon.matchType,
    confidence: taxon.confidence,
    synonym: taxon.synonym,
    reason: taxon.reason,
    broadTaxon: taxon.broadTaxon,
    source: createSourceAttribution(taxon.sourceTaxonKey),
  },
  cacheHit,
  retryable: false,
  messageKey: 'taxonomy.confirmationRequired',
} as const);
