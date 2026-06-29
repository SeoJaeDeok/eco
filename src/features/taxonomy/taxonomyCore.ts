import type { Taxon } from '../../types';

export const SCIENTIFIC_NAME_MAX_LENGTH = 200;

export type StandardTaxonomyRank =
  | 'kingdom'
  | 'phylum'
  | 'class'
  | 'order'
  | 'family'
  | 'genus'
  | 'species';

export type TaxonomyRank = StandardTaxonomyRank;

export type TaxonomyRankLabelKo = '계' | '문' | '강' | '목' | '과' | '속' | '종';

export const TAXONOMY_RANK_ORDER: readonly TaxonomyRank[] = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
];

export const TAXONOMY_RANK_LABELS_KO: Record<TaxonomyRank, TaxonomyRankLabelKo> = {
  kingdom: '계',
  phylum: '문',
  class: '강',
  order: '목',
  family: '과',
  genus: '속',
  species: '종',
};

export interface TaxonomyLineageRank {
  key: string | null;
  name: string | null;
}

export type TaxonomyLineage = Record<StandardTaxonomyRank, TaxonomyLineageRank>;

export type ScientificNameNormalizationError =
  | 'not_string'
  | 'empty'
  | 'control_characters'
  | 'too_long';

export type ScientificNameNormalizationResult =
  | {
    ok: true;
    reportedScientificName: string;
    normalizedInput: string;
  }
  | {
    ok: false;
    reason: ScientificNameNormalizationError;
  };

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const REPEATED_WHITESPACE_PATTERN = /\s+/gu;

export const createEmptyTaxonomyLineage = (): TaxonomyLineage => ({
  kingdom: { key: null, name: null },
  phylum: { key: null, name: null },
  class: { key: null, name: null },
  order: { key: null, name: null },
  family: { key: null, name: null },
  genus: { key: null, name: null },
  species: { key: null, name: null },
});

export const normalizeScientificNameInput = (value: unknown): ScientificNameNormalizationResult => {
  if (typeof value !== 'string') {
    return { ok: false, reason: 'not_string' };
  }

  const nfcValue = value.normalize('NFC');

  if (CONTROL_CHARACTER_PATTERN.test(nfcValue)) {
    return { ok: false, reason: 'control_characters' };
  }

  const reportedScientificName = nfcValue.trim().replace(REPEATED_WHITESPACE_PATTERN, ' ');

  if (!reportedScientificName) {
    return { ok: false, reason: 'empty' };
  }

  if ([...reportedScientificName].length > SCIENTIFIC_NAME_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }

  return {
    ok: true,
    reportedScientificName,
    normalizedInput: reportedScientificName.toLocaleLowerCase('en-US'),
  };
};

const normalizeRankName = (value: string | null | undefined) => value?.trim().toLocaleLowerCase('en-US') ?? '';

export const formatTaxonomySourceLabel = (source: string | null | undefined) => {
  const trimmedSource = source?.trim();

  if (!trimmedSource) {
    return null;
  }

  if (trimmedSource.toLocaleLowerCase('en-US').includes('gbif')) {
    return 'GBIF / Catalogue of Life XR';
  }

  return trimmedSource;
};

export const deriveBroadTaxonFromLineage = (lineage: Partial<TaxonomyLineage>): Taxon => {
  const className = normalizeRankName(lineage.class?.name);

  if (className === 'insecta') return '곤충';
  if (className === 'aves') return '조류';
  if (className === 'mammalia') return '포유류';
  if (className === 'amphibia' || className === 'reptilia') return '양서/파충류';

  const kingdomName = normalizeRankName(lineage.kingdom?.name);

  if (kingdomName === 'plantae') return '식물';
  if (kingdomName === 'fungi') return '균류';

  return '기타';
};
