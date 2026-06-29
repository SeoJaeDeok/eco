import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, RotateCw, X } from 'lucide-react';
import type { TaxonomyTreeNode, TaxonomyTreeSelection } from '../../features/taxonomy/taxonomyTree';
import type { TaxonomyTreeRepository } from '../../repositories/taxonomyTreeRepository';

interface TaxonomyTreePanelProps {
  repository: TaxonomyTreeRepository;
  selectedNode: TaxonomyTreeSelection | null;
  isFilterLoading?: boolean;
  filterError?: string | null;
  onSelectNode: (node: TaxonomyTreeNode) => void;
  onClearSelection: () => void;
}

const createNodeStateKey = (node: TaxonomyTreeSelection) => {
  return [
    node.source,
    node.sourceChecklistKey,
    node.rank,
    node.identityKind,
    node.key,
  ].join('|');
};

const isSameSelection = (a: TaxonomyTreeSelection | null, b: TaxonomyTreeSelection) => {
  if (!a) {
    return false;
  }

  return a.rank === b.rank
    && a.key === b.key
    && a.identityKind === b.identityKind
    && a.source === b.source
    && a.sourceChecklistKey === b.sourceChecklistKey;
};

export const TaxonomyTreePanel = ({
  repository,
  selectedNode,
  isFilterLoading = false,
  filterError = null,
  onSelectNode,
  onClearSelection,
}: TaxonomyTreePanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rootNodes, setRootNodes] = useState<TaxonomyTreeNode[] | null>(null);
  const [isLoadingRoots, setIsLoadingRoots] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [expandedNodeKeys, setExpandedNodeKeys] = useState<Set<string>>(() => new Set());
  const [childrenByNodeKey, setChildrenByNodeKey] = useState<Record<string, TaxonomyTreeNode[]>>({});
  const [loadingChildKeys, setLoadingChildKeys] = useState<Set<string>>(() => new Set());
  const [childErrorsByNodeKey, setChildErrorsByNodeKey] = useState<Record<string, string | undefined>>({});

  const loadRootNodes = useCallback(async () => {
    try {
      setIsLoadingRoots(true);
      setRootError(null);
      setRootNodes(await repository.getRootNodes());
    } catch {
      setRootError('분류 탐색 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoadingRoots(false);
    }
  }, [repository]);

  useEffect(() => {
    if (isOpen && rootNodes === null && !isLoadingRoots) {
      void loadRootNodes();
    }
  }, [isLoadingRoots, isOpen, loadRootNodes, rootNodes]);

  const loadChildren = useCallback(async (node: TaxonomyTreeNode) => {
    const nodeStateKey = createNodeStateKey(node);

    try {
      setLoadingChildKeys((currentKeys) => new Set(currentKeys).add(nodeStateKey));
      setChildErrorsByNodeKey((currentErrors) => ({
        ...currentErrors,
        [nodeStateKey]: undefined,
      }));
      const children = await repository.getChildren(node);
      setChildrenByNodeKey((currentChildren) => ({
        ...currentChildren,
        [nodeStateKey]: children,
      }));
    } catch {
      setChildErrorsByNodeKey((currentErrors) => ({
        ...currentErrors,
        [nodeStateKey]: '하위 분류 정보를 불러오지 못했습니다.',
      }));
    } finally {
      setLoadingChildKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        nextKeys.delete(nodeStateKey);
        return nextKeys;
      });
    }
  }, [repository]);

  const handleToggleNode = (node: TaxonomyTreeNode) => {
    if (!node.hasChildren) return;

    const nodeStateKey = createNodeStateKey(node);
    const isExpanded = expandedNodeKeys.has(nodeStateKey);

    setExpandedNodeKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (isExpanded) {
        nextKeys.delete(nodeStateKey);
      } else {
        nextKeys.add(nodeStateKey);
      }
      return nextKeys;
    });

    if (!isExpanded && !childrenByNodeKey[nodeStateKey] && !loadingChildKeys.has(nodeStateKey)) {
      void loadChildren(node);
    }
  };

  const renderNode = (node: TaxonomyTreeNode, depth = 0) => {
    const nodeStateKey = createNodeStateKey(node);
    const isExpanded = expandedNodeKeys.has(nodeStateKey);
    const children = childrenByNodeKey[nodeStateKey];
    const isLoadingChildren = loadingChildKeys.has(nodeStateKey);
    const childError = childErrorsByNodeKey[nodeStateKey];
    const isSelected = isSameSelection(selectedNode, node);

    return (
      <li key={nodeStateKey} className="text-xs">
        <div
          className={`flex min-h-9 items-center gap-1.5 border-l border-zinc-100 py-1 ${isSelected ? 'bg-zinc-950/[0.03]' : ''}`}
          style={{ paddingLeft: `${depth * 0.75}rem` }}
        >
          {node.hasChildren ? (
            <button
              type="button"
              onClick={() => handleToggleNode(node)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              aria-label={`${node.displayName} 하위 분류 ${isExpanded ? '접기' : '펼치기'}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="h-8 w-8 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => onSelectNode(node)}
            className={`min-w-0 flex-1 px-2 py-1.5 text-left transition-colors ${isSelected ? 'text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'}`}
          >
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center border border-zinc-100 bg-white text-[10px] font-semibold text-zinc-500">
              {node.rankLabelKo}
            </span>
            <span className="font-medium italic">{node.displayName}</span>
            <span className="ml-1.5 text-[10px] text-zinc-400">{node.observationCount}</span>
          </button>
        </div>

        {isExpanded && (
          <div className="ml-8 border-l border-zinc-100 pl-2">
            {isLoadingChildren && (
              <p className="flex items-center gap-2 py-2 text-[11px] text-zinc-400">
                <Loader2 size={12} className="animate-spin" />
                하위 분류를 불러오는 중입니다.
              </p>
            )}
            {childError && (
              <div className="flex items-center justify-between gap-3 py-2 text-[11px] text-zinc-500">
                <span>{childError}</span>
                <button
                  type="button"
                  onClick={() => loadChildren(node)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-950"
                >
                  <RotateCw size={11} />
                  다시
                </button>
              </div>
            )}
            {children && children.length === 0 && (
              <p className="py-2 text-[11px] text-zinc-400">하위 분류 정보가 없습니다.</p>
            )}
            {children && children.length > 0 && (
              <ul>
                {children.map((child) => renderNode(child, depth + 1))}
              </ul>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="mt-4 border border-zinc-100 bg-white/70">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left"
        aria-expanded={isOpen}
      >
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Taxonomy tree</span>
          <span className="block font-serif text-sm text-zinc-900">분류 탐색</span>
        </span>
        {isOpen ? <ChevronDown size={15} className="text-zinc-500" /> : <ChevronRight size={15} className="text-zinc-500" />}
      </button>

      {selectedNode && (
        <div className="border-t border-zinc-100 bg-zinc-50/80 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[11px] text-zinc-600">
              분류 필터: <span className="font-medium italic text-zinc-950">{selectedNode.displayName}</span>
              {isFilterLoading && <span className="ml-2 text-zinc-400">적용 중</span>}
            </p>
            <button
              type="button"
              onClick={onClearSelection}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-white hover:text-zinc-950"
              aria-label="분류 필터 해제"
            >
              <X size={13} />
            </button>
          </div>
          {filterError && (
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">{filterError}</p>
          )}
        </div>
      )}

      {isOpen && (
        <div className="border-t border-zinc-100 px-3 py-3">
          {isLoadingRoots && (
            <p className="flex items-center gap-2 text-[11px] text-zinc-400">
              <Loader2 size={12} className="animate-spin" />
              분류 정보를 불러오는 중입니다.
            </p>
          )}
          {rootError && (
            <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500">
              <span>{rootError}</span>
              <button
                type="button"
                onClick={loadRootNodes}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-950"
              >
                <RotateCw size={11} />
                다시
              </button>
            </div>
          )}
          {rootNodes && rootNodes.length === 0 && (
            <p className="text-[11px] leading-5 text-zinc-500">분류 정보가 연결된 관찰이 아직 없습니다.</p>
          )}
          {rootNodes && rootNodes.length > 0 && (
            <ul className="space-y-0.5">
              {rootNodes.map((node) => renderNode(node))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
