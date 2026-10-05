import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, RotateCw, X } from 'lucide-react';
import type { TaxonomyTreeNode, TaxonomyTreeSelection } from '../../features/taxonomy/taxonomyTree';
import type { TaxonomyTreeRepository } from '../../repositories/taxonomyTreeRepository';

interface TaxonomyTreePanelProps {
  repository: TaxonomyTreeRepository;
  selectedNode: TaxonomyTreeSelection | null;
  onSelectNode: (node: TaxonomyTreeNode) => void;
  revision?: number;
}

interface TaxonomyFilterStatusProps {
  selectedNode: TaxonomyTreeSelection | null;
  isFilterLoading?: boolean;
  filterError?: string | null;
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
  onSelectNode,
  revision = 0,
}: TaxonomyTreePanelProps) => {
  const treeContentId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [rootNodes, setRootNodes] = useState<TaxonomyTreeNode[] | null>(null);
  const [isLoadingRoots, setIsLoadingRoots] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [expandedNodeKeys, setExpandedNodeKeys] = useState<Set<string>>(() => new Set());
  const [childrenByNodeKey, setChildrenByNodeKey] = useState<Record<string, TaxonomyTreeNode[]>>({});
  const [loadingChildKeys, setLoadingChildKeys] = useState<Set<string>>(() => new Set());
  const [childErrorsByNodeKey, setChildErrorsByNodeKey] = useState<Record<string, string | undefined>>({});
  const scope = useRef({ revision, mounted: true });
  scope.current.revision = revision;
  useEffect(() => { scope.current.mounted = true; return () => { scope.current.mounted = false; }; }, []);
  const previousRevision = useRef(revision);

  useEffect(() => {
    if (previousRevision.current === revision) return;
    previousRevision.current = revision;
    setLoadingChildKeys(new Set());
    if (rootNodes === null) {
      setIsLoadingRoots(false);
      setRootError(null);
      return;
    }
    let current = true;
    const parents = [...rootNodes, ...Object.values(childrenByNodeKey).flat()]
      .filter((node) => Object.prototype.hasOwnProperty.call(childrenByNodeKey, createNodeStateKey(node)));
    setIsLoadingRoots(true);
    setRootError(null);
    void (async () => {
      try {
        const roots = await repository.getRootNodes();
        const children = await Promise.all(parents.map(async (node) => [createNodeStateKey(node), await repository.getChildren(node)] as const));
        if (!current) return;
        setRootNodes(roots);
        setChildrenByNodeKey(Object.fromEntries(children));
        setChildErrorsByNodeKey({});
      } catch {
        if (current) setRootError('분류 집계를 갱신하지 못했습니다. 다시 시도해 주세요.');
      } finally {
        if (current) setIsLoadingRoots(false);
      }
    })();
    return () => { current = false; };
  }, [revision, repository]);

  const loadRootNodes = useCallback(async () => {
    const requestRevision = revision;
    try {
      setIsLoadingRoots(true);
      setRootError(null);
      const roots = await repository.getRootNodes();
      const parents = [...(rootNodes ?? []), ...Object.values(childrenByNodeKey).flat()]
        .filter((node) => Object.prototype.hasOwnProperty.call(childrenByNodeKey, createNodeStateKey(node)));
      const children = await Promise.all(parents.map(async (node) => [createNodeStateKey(node), await repository.getChildren(node)] as const));
      if (scope.current.mounted && scope.current.revision === requestRevision) {
        setRootNodes(roots);
        if (parents.length) setChildrenByNodeKey(Object.fromEntries(children));
        setChildErrorsByNodeKey({});
      }
    } catch {
      if (scope.current.mounted && scope.current.revision === requestRevision) setRootError('분류 탐색 정보를 불러오지 못했습니다.');
    } finally {
      if (scope.current.mounted && scope.current.revision === requestRevision) setIsLoadingRoots(false);
    }
  }, [repository, revision, rootNodes, childrenByNodeKey]);

  useEffect(() => {
    if (isOpen && rootNodes === null && !isLoadingRoots && !rootError) {
      void loadRootNodes();
    }
  }, [isLoadingRoots, isOpen, loadRootNodes, rootNodes, rootError]);

  const loadChildren = useCallback(async (node: TaxonomyTreeNode) => {
    const nodeStateKey = createNodeStateKey(node);
    const requestRevision = revision;

    try {
      setLoadingChildKeys((currentKeys) => new Set(currentKeys).add(nodeStateKey));
      setChildErrorsByNodeKey((currentErrors) => ({
        ...currentErrors,
        [nodeStateKey]: undefined,
      }));
      const children = await repository.getChildren(node);
      if (!scope.current.mounted || scope.current.revision !== requestRevision) return;
      setChildrenByNodeKey((currentChildren) => ({
        ...currentChildren,
        [nodeStateKey]: children,
      }));
    } catch {
      if (!scope.current.mounted || scope.current.revision !== requestRevision) return;
      setChildErrorsByNodeKey((currentErrors) => ({
        ...currentErrors,
        [nodeStateKey]: '하위 분류 정보를 불러오지 못했습니다.',
      }));
    } finally {
      if (scope.current.mounted && scope.current.revision === requestRevision) setLoadingChildKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        nextKeys.delete(nodeStateKey);
        return nextKeys;
      });
    }
  }, [repository, revision]);

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

  const renderNode = (node: TaxonomyTreeNode, depth: number, path: string) => {
    const nodeStateKey = createNodeStateKey(node);
    const isExpanded = expandedNodeKeys.has(nodeStateKey);
    const children = childrenByNodeKey[nodeStateKey];
    const isLoadingChildren = loadingChildKeys.has(nodeStateKey);
    const childError = childErrorsByNodeKey[nodeStateKey];
    const isSelected = isSameSelection(selectedNode, node);
    const childrenId = `${treeContentId}-children-${path}`;

    return (
      <li key={nodeStateKey} className="min-w-0 text-xs">
        <div
          className={`flex min-w-0 items-start gap-1 border-l border-zinc-100 py-1 ${isSelected ? 'bg-zinc-950/[0.03]' : ''}`}
          // Only rows indent; ancestor wrappers must not add cumulative padding.
          style={{ paddingLeft: `${Math.min(depth, 3) * 0.5}rem` }}
        >
          {node.hasChildren ? (
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.focus();
                handleToggleNode(node);
              }}
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-700"
              aria-label={`${node.displayName} 하위 분류 ${isExpanded ? '접기' : '펼치기'}`}
              aria-expanded={isExpanded}
              aria-controls={childrenId}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="h-11 w-9 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => onSelectNode(node)}
            aria-pressed={isSelected}
            className={`grid min-h-11 min-w-0 flex-1 grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-1.5 px-1 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-700 ${isSelected ? 'text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'}`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center border border-zinc-100 bg-white text-[10px] font-semibold text-zinc-500">
              {node.rankLabelKo}
            </span>
            <span className="min-w-0 whitespace-normal font-medium italic leading-5 [overflow-wrap:anywhere]">{node.displayName}</span>
            <span className="text-[10px] leading-5 tabular-nums text-zinc-400">{node.observationCount}</span>
          </button>
        </div>

        {node.hasChildren && (
          <div id={childrenId} hidden={!isExpanded} className="min-w-0">
            {isLoadingChildren && (
              <p className="flex items-center gap-2 py-2 text-[11px] text-zinc-400">
                <Loader2 size={12} className="shrink-0 animate-spin motion-reduce:animate-none" />
                하위 분류를 불러오는 중입니다.
              </p>
            )}
            {childError && (
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px] text-zinc-500">
                <span>{childError}</span>
                <button
                  type="button"
                  onClick={() => loadChildren(node)}
                  className="inline-flex min-h-11 items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-zinc-700"
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
              <ul className="m-0 min-w-0 list-none p-0">
                {children.map((child, index) => renderNode(child, depth + 1, `${path}-${index}`))}
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
        onClick={(event) => {
          event.currentTarget.focus();
          setIsOpen((current) => !current);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-700"
        aria-expanded={isOpen}
        aria-controls={treeContentId}
      >
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Taxonomy tree</span>
          <span className="block font-serif text-sm text-zinc-900">분류 탐색</span>
        </span>
        {isOpen ? <ChevronDown size={15} className="text-zinc-500" /> : <ChevronRight size={15} className="text-zinc-500" />}
      </button>

      <div id={treeContentId} hidden={!isOpen} className="min-w-0 border-t border-zinc-100 px-2 py-3">
        {isLoadingRoots && (
          <p className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Loader2 size={12} className="shrink-0 animate-spin motion-reduce:animate-none" />
            분류 정보를 불러오는 중입니다.
          </p>
        )}
        {rootError && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
            <span>{rootError}</span>
            <button
              type="button"
              onClick={loadRootNodes}
              className="inline-flex min-h-11 items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-zinc-700"
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
          <ul className="m-0 min-w-0 list-none space-y-0.5 p-0">
            {rootNodes.map((node, index) => renderNode(node, 0, String(index)))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const TaxonomyFilterStatus = ({
  selectedNode,
  isFilterLoading = false,
  filterError = null,
  onClearSelection,
}: TaxonomyFilterStatusProps) => {
  if (!selectedNode) return null;

  return (
    <div className="mt-3 border border-zinc-100 bg-zinc-50/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-[11px] text-zinc-600 [overflow-wrap:anywhere]">
          분류 필터: <span className="font-medium italic text-zinc-950">{selectedNode.displayName}</span>
          {isFilterLoading && <span className="ml-2 text-zinc-400">적용 중</span>}
        </p>
        <button
          type="button"
          onClick={onClearSelection}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-white hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-zinc-700"
          aria-label="분류 필터 해제"
        >
          <X size={13} />
        </button>
      </div>
      {filterError && <p className="mt-1 text-[11px] leading-5 text-zinc-500">{filterError}</p>}
    </div>
  );
};
