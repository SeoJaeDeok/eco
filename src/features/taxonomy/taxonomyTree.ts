import type { ObservationStatus } from '../../types';
import {
  TAXONOMY_RANK_LABELS_KO,
  TAXONOMY_RANK_ORDER,
  type TaxonomyLineage,
  type TaxonomyRank,
  type TaxonomyRankLabelKo,
} from './taxonomyCore';

export type TaxonomyTreeNodeIdentityKind =
  | 'sourceKey'
  | 'terminalSourceKeyFallback'
  | 'nameFallback';

export interface TaxonomyTreeNodeIdentity {
  rank: TaxonomyRank;
  key: string;
  identityKind: TaxonomyTreeNodeIdentityKind;
  source: string;
  sourceChecklistKey: string;
  name: string;
  parent?: TaxonomyTreeNodeIdentity;
}

export interface TaxonomyTreeParent extends TaxonomyTreeNodeIdentity {}

export interface TaxonomyTreeSelection extends TaxonomyTreeNodeIdentity {
  displayName: string;
}

export interface TaxonomyTreeNode extends TaxonomyTreeSelection {
  rankLabelKo: TaxonomyRankLabelKo;
  observationCount: number;
  hasChildren: boolean;
  isTerminal: boolean;
}

export interface TaxonomyTreeTaxonSummary {
  source: string;
  sourceChecklistKey: string;
  terminalSourceKey: string | null;
  acceptedScientificName: string;
  canonicalName: string | null;
  terminalRank: string;
  taxonomicStatus: string;
  lineage: TaxonomyLineage;
}

export interface TaxonomyTreeObservationSummary {
  observationId: string;
  status: ObservationStatus;
  taxonId: string | null;
  taxon: TaxonomyTreeTaxonSummary | null;
}

interface TaxonomyTreeNodeAccumulator {
  identity: TaxonomyTreeNodeIdentity;
  displayName: string;
  observationIds: Set<string>;
  hasChildren: boolean;
}

const normalizeIdentityText = (value: string) => value.trim().toLocaleLowerCase('en-US');

const createNameFallbackKey = (
  rank: TaxonomyRank,
  name: string,
  parent?: TaxonomyTreeNodeIdentity,
) => {
  const parentScope = parent
    ? `${parent.source}:${parent.sourceChecklistKey}:${parent.rank}:${parent.identityKind}:${parent.key}`
    : 'root';

  return `name:${rank}:${parentScope}:${normalizeIdentityText(name)}`;
};

export const getNextTaxonomyRank = (rank: TaxonomyRank) => {
  const currentIndex = TAXONOMY_RANK_ORDER.indexOf(rank);
  return currentIndex >= 0 ? TAXONOMY_RANK_ORDER[currentIndex + 1] ?? null : null;
};

const hasTerminalSpeciesFallback = (taxon: TaxonomyTreeTaxonSummary, rank: TaxonomyRank) => {
  return rank === 'species'
    && taxon.terminalRank.trim().toLocaleLowerCase('en-US') === 'species'
    && Boolean(taxon.terminalSourceKey?.trim())
    && Boolean((taxon.lineage.species.name ?? taxon.canonicalName ?? taxon.acceptedScientificName).trim());
};

const getRankDisplayName = (taxon: TaxonomyTreeTaxonSummary, rank: TaxonomyRank) => {
  const rankName = taxon.lineage[rank].name?.trim();

  if (rankName) {
    return rankName;
  }

  if (hasTerminalSpeciesFallback(taxon, rank)) {
    return taxon.canonicalName?.trim() || taxon.acceptedScientificName.trim();
  }

  return null;
};

export const getTaxonomyRankIdentity = (
  taxon: TaxonomyTreeTaxonSummary,
  rank: TaxonomyRank,
  parent?: TaxonomyTreeNodeIdentity,
): TaxonomyTreeNodeIdentity | null => {
  const displayName = getRankDisplayName(taxon, rank);

  if (!displayName) {
    return null;
  }

  const rankKey = taxon.lineage[rank].key?.trim();

  if (rankKey) {
    return {
      rank,
      key: rankKey,
      identityKind: 'sourceKey',
      source: taxon.source,
      sourceChecklistKey: taxon.sourceChecklistKey,
      name: displayName,
      ...(parent ? { parent } : {}),
    };
  }

  if (hasTerminalSpeciesFallback(taxon, rank) && taxon.terminalSourceKey) {
    return {
      rank,
      key: taxon.terminalSourceKey.trim(),
      identityKind: 'terminalSourceKeyFallback',
      source: taxon.source,
      sourceChecklistKey: taxon.sourceChecklistKey,
      name: displayName,
      ...(parent ? { parent } : {}),
    };
  }

  return {
    rank,
    key: createNameFallbackKey(rank, displayName, parent),
    identityKind: 'nameFallback',
    source: taxon.source,
    sourceChecklistKey: taxon.sourceChecklistKey,
    name: displayName,
    ...(parent ? { parent } : {}),
  };
};

const createGroupKey = (identity: TaxonomyTreeNodeIdentity) => {
  return [
    identity.source,
    identity.sourceChecklistKey,
    identity.rank,
    identity.identityKind,
    identity.key,
  ].join('|');
};

export const isApprovedTaxonomyLinkedObservation = (
  summary: TaxonomyTreeObservationSummary,
): summary is TaxonomyTreeObservationSummary & { taxonId: string; taxon: TaxonomyTreeTaxonSummary } => {
  return summary.status === 'approved' && Boolean(summary.taxonId) && summary.taxon !== null;
};

export const matchesTaxonomyTreeSelection = (
  taxon: TaxonomyTreeTaxonSummary,
  selection: TaxonomyTreeSelection | TaxonomyTreeParent,
) => {
  if (taxon.source !== selection.source || taxon.sourceChecklistKey !== selection.sourceChecklistKey) {
    return false;
  }

  const identity = getTaxonomyRankIdentity(taxon, selection.rank, selection.parent);
  if (!identity) {
    return false;
  }

  return identity.identityKind === selection.identityKind && identity.key === selection.key;
};

const hasChildNode = (taxon: TaxonomyTreeTaxonSummary, rank: TaxonomyRank) => {
  const childRank = getNextTaxonomyRank(rank);
  return childRank ? getTaxonomyRankIdentity(taxon, childRank) !== null : false;
};

export const getTaxonomyTreeNodesForRank = (
  summaries: readonly TaxonomyTreeObservationSummary[],
  rank: TaxonomyRank,
  parent?: TaxonomyTreeParent,
): TaxonomyTreeNode[] => {
  const groups = new Map<string, TaxonomyTreeNodeAccumulator>();

  summaries
    .filter(isApprovedTaxonomyLinkedObservation)
    .filter((summary) => !parent || matchesTaxonomyTreeSelection(summary.taxon, parent))
    .forEach((summary) => {
      const identity = getTaxonomyRankIdentity(summary.taxon, rank, parent);

      if (!identity) {
        return;
      }

      const groupKey = createGroupKey(identity);
      const existingGroup = groups.get(groupKey);

      if (existingGroup) {
        existingGroup.observationIds.add(summary.observationId);
        existingGroup.hasChildren = existingGroup.hasChildren || hasChildNode(summary.taxon, rank);
        return;
      }

      groups.set(groupKey, {
        identity,
        displayName: identity.name,
        observationIds: new Set([summary.observationId]),
        hasChildren: hasChildNode(summary.taxon, rank),
      });
    });

  return [...groups.values()]
    .map<TaxonomyTreeNode>((group) => ({
      ...group.identity,
      displayName: group.displayName,
      rankLabelKo: TAXONOMY_RANK_LABELS_KO[group.identity.rank],
      observationCount: group.observationIds.size,
      hasChildren: group.hasChildren,
      isTerminal: group.identity.rank === 'species' || !group.hasChildren,
    }))
    .sort((a, b) => {
      if (a.observationCount !== b.observationCount) {
        return b.observationCount - a.observationCount;
      }

      return a.displayName.localeCompare(b.displayName, 'en');
    });
};

export const getTaxonomyTreeRootNodes = (
  summaries: readonly TaxonomyTreeObservationSummary[],
) => getTaxonomyTreeNodesForRank(summaries, 'kingdom');

export const getTaxonomyTreeChildren = (
  summaries: readonly TaxonomyTreeObservationSummary[],
  parent: TaxonomyTreeParent,
) => {
  const childRank = getNextTaxonomyRank(parent.rank);

  if (!childRank) {
    return [];
  }

  return getTaxonomyTreeNodesForRank(summaries, childRank, parent);
};
