import {
  deriveBroadTaxonFromLineage,
  normalizeScientificNameInput,
  type TaxonomyLineage,
} from '../features/taxonomy/taxonomyCore';
import type {
  TaxonomyBlockedResult,
  TaxonomyConfirmationCandidate,
  TaxonomyErrorResult,
  TaxonomyNeedsConfirmationResult,
  TaxonomyRepository,
  TaxonomyResolutionResult,
  TaxonomyResolvedResult,
  TaxonomySourceAttribution,
} from './taxonomyRepository';

const CHECKLIST_KEY = '7ddf754f-d193-4cc9-b351-99906754a03b';
const MOCK_RESOLVED_AT = '2026-06-25T00:00:00.000Z';

const source = (sourceTaxonKey: string): TaxonomySourceAttribution => ({
  name: 'GBIF Species Match API v2',
  checklistKey: CHECKLIST_KEY,
  sourceTaxonKey,
});

const lineage = (input: {
  kingdom?: [string, string];
  phylum?: [string, string];
  class?: [string, string];
  order?: [string, string];
  family?: [string, string];
  genus?: [string, string];
  species?: [string, string];
}): TaxonomyLineage => ({
  kingdom: input.kingdom ? { key: input.kingdom[0], name: input.kingdom[1] } : { key: null, name: null },
  phylum: input.phylum ? { key: input.phylum[0], name: input.phylum[1] } : { key: null, name: null },
  class: input.class ? { key: input.class[0], name: input.class[1] } : { key: null, name: null },
  order: input.order ? { key: input.order[0], name: input.order[1] } : { key: null, name: null },
  family: input.family ? { key: input.family[0], name: input.family[1] } : { key: null, name: null },
  genus: input.genus ? { key: input.genus[0], name: input.genus[1] } : { key: null, name: null },
  species: input.species ? { key: input.species[0], name: input.species[1] } : { key: null, name: null },
});

const createResolvedFixture = (input: {
  taxonId: string;
  reportedScientificName: string;
  acceptedScientificName: string;
  canonicalName: string;
  sourceTaxonKey: string;
  lineage: TaxonomyLineage;
  matchType?: string;
  confidence?: number;
  synonym?: boolean;
  cacheHit?: boolean;
}): TaxonomyResolvedResult => ({
  status: 'resolved',
  taxonId: input.taxonId,
  reportedScientificName: input.reportedScientificName,
  acceptedScientificName: input.acceptedScientificName,
  canonicalName: input.canonicalName,
  terminalRank: 'SPECIES',
  taxonomicStatus: 'ACCEPTED',
  lineage: input.lineage,
  matchType: input.matchType ?? 'EXACT',
  confidence: input.confidence ?? 99,
  synonym: input.synonym ?? false,
  broadTaxon: deriveBroadTaxonFromLineage(input.lineage),
  source: source(input.sourceTaxonKey),
  resolvedAt: MOCK_RESOLVED_AT,
  cacheHit: input.cacheHit ?? true,
  messageKey: 'taxonomy.resolved',
});

const homoSapiensLineage = lineage({
  kingdom: ['N', 'Animalia'],
  phylum: ['CH2', 'Chordata'],
  class: ['6', 'Mammalia'],
  order: ['PR', 'Primates'],
  family: ['HM', 'Hominidae'],
  genus: ['H', 'Homo'],
  species: ['6MB3T', 'Homo sapiens'],
});

const exactFixtures: Record<string, TaxonomyResolvedResult> = {
  'homo sapiens': createResolvedFixture({
    taxonId: 'mock-taxon-6MB3T',
    reportedScientificName: 'Homo sapiens',
    acceptedScientificName: 'Homo sapiens Linnaeus, 1758',
    canonicalName: 'Homo sapiens',
    sourceTaxonKey: '6MB3T',
    lineage: homoSapiensLineage,
  }),
  'apis mellifera': createResolvedFixture({
    taxonId: 'mock-taxon-FN46',
    reportedScientificName: 'Apis mellifera',
    acceptedScientificName: 'Apis mellifera Linnaeus, 1758',
    canonicalName: 'Apis mellifera',
    sourceTaxonKey: 'FN46',
    lineage: lineage({
      kingdom: ['N', 'Animalia'],
      phylum: ['AR', 'Arthropoda'],
      class: ['IN', 'Insecta'],
      order: ['HY', 'Hymenoptera'],
      family: ['AP', 'Apidae'],
      genus: ['APIS', 'Apis'],
      species: ['FN46', 'Apis mellifera'],
    }),
  }),
  'taraxacum officinale': createResolvedFixture({
    taxonId: 'mock-taxon-54VX8',
    reportedScientificName: 'Taraxacum officinale',
    acceptedScientificName: 'Taraxacum officinale Weber ex F.H.Wigg.',
    canonicalName: 'Taraxacum officinale',
    sourceTaxonKey: '54VX8',
    lineage: lineage({
      kingdom: ['P', 'Plantae'],
      phylum: ['TP', 'Tracheophyta'],
      class: ['MG', 'Magnoliopsida'],
      order: ['AST', 'Asterales'],
      family: ['ASTR', 'Asteraceae'],
      genus: ['TAR', 'Taraxacum'],
      species: ['54VX8', 'Taraxacum officinale'],
    }),
  }),
  'amanita muscaria': createResolvedFixture({
    taxonId: 'mock-taxon-5TYZ9',
    reportedScientificName: 'Amanita muscaria',
    acceptedScientificName: 'Amanita muscaria (L.) Lam.',
    canonicalName: 'Amanita muscaria',
    sourceTaxonKey: '5TYZ9',
    confidence: 97,
    lineage: lineage({
      kingdom: ['F', 'Fungi'],
      phylum: ['BAS', 'Basidiomycota'],
      class: ['AGA', 'Agaricomycetes'],
      order: ['AGR', 'Agaricales'],
      family: ['AMA', 'Amanitaceae'],
      genus: ['AMAN', 'Amanita'],
      species: ['5TYZ9', 'Amanita muscaria'],
    }),
  }),
};

const confirmationCandidates: Record<string, TaxonomyConfirmationCandidate> = {
  'felis concolor': {
    acceptedSourceTaxonKey: '4QHKG',
    acceptedScientificName: 'Puma concolor (Linnaeus, 1771)',
    canonicalName: 'Puma concolor',
    terminalRank: 'SPECIES',
    taxonomicStatus: 'ACCEPTED',
    lineage: lineage({
      kingdom: ['N', 'Animalia'],
      phylum: ['CH2', 'Chordata'],
      class: ['6', 'Mammalia'],
      order: ['CAR', 'Carnivora'],
      family: ['FEL', 'Felidae'],
      genus: ['PUMA', 'Puma'],
      species: ['4QHKG', 'Puma concolor'],
    }),
    matchType: 'EXACT',
    confidence: 98,
    synonym: true,
    reason: 'synonym',
    broadTaxon: '포유류',
    source: source('4QHKG'),
  },
  'homo sapines': {
    acceptedSourceTaxonKey: '6MB3T',
    acceptedScientificName: 'Homo sapiens Linnaeus, 1758',
    canonicalName: 'Homo sapiens',
    terminalRank: 'SPECIES',
    taxonomicStatus: 'ACCEPTED',
    lineage: homoSapiensLineage,
    matchType: 'VARIANT',
    confidence: 95,
    synonym: false,
    reason: 'variant',
    broadTaxon: '포유류',
    source: source('6MB3T'),
  },
};

const createBlockedResult = (
  reportedScientificName: string,
  reason: TaxonomyBlockedResult['reason'],
  matchType: string | null,
): TaxonomyBlockedResult => ({
  status: 'blocked',
  reason,
  reportedScientificName,
  matchType,
  retryable: false,
  messageKey: 'taxonomy.blocked',
});

const createInvalidInputError = (): TaxonomyErrorResult => ({
  status: 'error',
  reason: 'invalid_input',
  retryable: false,
  messageKey: 'taxonomy.error',
});

const createNeedsConfirmationResult = (
  reportedScientificName: string,
  candidate: TaxonomyConfirmationCandidate,
): TaxonomyNeedsConfirmationResult => ({
  status: 'needsConfirmation',
  reportedScientificName,
  candidate,
  cacheHit: true,
  retryable: false,
  messageKey: 'taxonomy.confirmationRequired',
});

export const mockTaxonomyRepository: TaxonomyRepository = {
  async resolveScientificName(input) {
    const normalized = normalizeScientificNameInput(input.scientificName);

    if (!normalized.ok) {
      return createInvalidInputError();
    }

    if (normalized.normalizedInput === 'timeout test') {
      return {
        status: 'error',
        reason: 'timeout',
        retryable: true,
        messageKey: 'taxonomy.error',
      };
    }

    const exact = exactFixtures[normalized.normalizedInput];
    if (exact) {
      return {
        ...exact,
        reportedScientificName: normalized.reportedScientificName,
      };
    }

    const candidate = confirmationCandidates[normalized.normalizedInput];
    if (candidate) {
      return createNeedsConfirmationResult(normalized.reportedScientificName, candidate);
    }

    if (normalized.normalizedInput === 'homo') {
      return createBlockedResult(normalized.reportedScientificName, 'higher_rank_only', 'EXACT');
    }

    if (normalized.normalizedInput === 'xyzabc nonexistentii') {
      return createBlockedResult(normalized.reportedScientificName, 'no_match', 'NONE');
    }

    return createBlockedResult(normalized.reportedScientificName, 'no_match', 'NONE');
  },

  async confirmScientificName(input) {
    const normalized = normalizeScientificNameInput(input.scientificName);

    if (!normalized.ok || !input.acceptedSourceTaxonKey.trim()) {
      return createInvalidInputError();
    }

    const candidate = confirmationCandidates[normalized.normalizedInput];

    if (!candidate || candidate.acceptedSourceTaxonKey !== input.acceptedSourceTaxonKey) {
      return {
        status: 'error',
        reason: 'invalid_confirmation',
        retryable: false,
        messageKey: 'taxonomy.error',
      };
    }

    return createResolvedFixture({
      taxonId: `mock-taxon-${candidate.acceptedSourceTaxonKey}`,
      reportedScientificName: normalized.reportedScientificName,
      acceptedScientificName: candidate.acceptedScientificName,
      canonicalName: candidate.canonicalName ?? candidate.acceptedScientificName,
      sourceTaxonKey: candidate.acceptedSourceTaxonKey,
      lineage: candidate.lineage,
      matchType: candidate.matchType,
      confidence: candidate.confidence ?? undefined,
      synonym: candidate.synonym,
      cacheHit: true,
    });
  },
};

export const mockTaxonomyFixtures = {
  exactInputs: Object.keys(exactFixtures),
  confirmationInputs: Object.keys(confirmationCandidates),
  blockedInputs: ['Homo', 'Xyzabc nonexistentii'],
  errorInputs: ['Timeout test'],
} as const;
