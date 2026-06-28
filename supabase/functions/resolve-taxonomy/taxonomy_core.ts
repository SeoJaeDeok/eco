export const SCIENTIFIC_NAME_MAX_LENGTH = 200;
export const TAXONOMY_SOURCE_NAME = "GBIF Species Match API v2";
export const GBIF_CHECKLIST_KEY = "7ddf754f-d193-4cc9-b351-99906754a03b";
export const GBIF_MATCH_ENDPOINT = "https://api.gbif.org/v2/species/match";
export const GBIF_REQUEST_TIMEOUT_MS = 9000;

export type Taxon =
  | "식물"
  | "포유류"
  | "조류"
  | "곤충"
  | "양서/파충류"
  | "균류"
  | "기타";

export type StandardTaxonomyRank =
  | "kingdom"
  | "phylum"
  | "class"
  | "order"
  | "family"
  | "genus"
  | "species";

export interface TaxonomyLineageRank {
  key: string | null;
  name: string | null;
}

export type TaxonomyLineage = Record<StandardTaxonomyRank, TaxonomyLineageRank>;

export type ScientificNameNormalizationError =
  | "not_string"
  | "empty"
  | "control_characters"
  | "too_long";

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

const REPEATED_WHITESPACE_PATTERN = /\s+/gu;

const hasControlCharacter = (value: string) => {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)) {
      return true;
    }
  }

  return false;
};

export const createEmptyTaxonomyLineage = (): TaxonomyLineage => ({
  kingdom: { key: null, name: null },
  phylum: { key: null, name: null },
  class: { key: null, name: null },
  order: { key: null, name: null },
  family: { key: null, name: null },
  genus: { key: null, name: null },
  species: { key: null, name: null },
});

export const normalizeScientificNameInput = (
  value: unknown,
): ScientificNameNormalizationResult => {
  if (typeof value !== "string") {
    return { ok: false, reason: "not_string" };
  }

  const nfcValue = value.normalize("NFC");

  if (hasControlCharacter(nfcValue)) {
    return { ok: false, reason: "control_characters" };
  }

  const reportedScientificName = nfcValue.trim().replace(
    REPEATED_WHITESPACE_PATTERN,
    " ",
  );

  if (!reportedScientificName) {
    return { ok: false, reason: "empty" };
  }

  if ([...reportedScientificName].length > SCIENTIFIC_NAME_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  return {
    ok: true,
    reportedScientificName,
    normalizedInput: reportedScientificName.toLocaleLowerCase("en-US"),
  };
};

const normalizeRankName = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase("en-US") ?? "";

export const deriveBroadTaxonFromLineage = (
  lineage: Partial<TaxonomyLineage>,
): Taxon => {
  const className = normalizeRankName(lineage.class?.name);

  if (className === "insecta") return "곤충";
  if (className === "aves") return "조류";
  if (className === "mammalia") return "포유류";
  if (className === "amphibia" || className === "reptilia") {
    return "양서/파충류";
  }

  const kingdomName = normalizeRankName(lineage.kingdom?.name);

  if (kingdomName === "plantae") return "식물";
  if (kingdomName === "fungi") return "균류";

  return "기타";
};

export const createSourceAttribution = (sourceTaxonKey: string) => ({
  name: TAXONOMY_SOURCE_NAME,
  checklistKey: GBIF_CHECKLIST_KEY,
  sourceTaxonKey,
} as const);
