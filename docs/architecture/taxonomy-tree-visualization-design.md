# Taxonomy Tree Visualization Design

## Purpose

This document designs a later taxonomy tree/mindmap view for observations. It is design-only for Phase 21F.

**한국어:** 이 문서는 관찰 기록을 계통 분류 트리로 탐색하는 향후 기능을 설계합니다. Phase 21F에서는 구현하지 않습니다.

## Phase 24A Note

Phase 24A keeps the taxonomy tree as Phase 25 work.

Tree browsing must use stored taxonomy data from the project database. It must not call GBIF while rendering, expanding, searching, or filtering tree nodes.

**한국어:** 트리 구현은 Phase 25 범위입니다. 트리 탐색 중 GBIF를 직접 호출하지 않고 저장된 taxonomy 데이터만 사용해야 합니다.

## MVP Direction

Start with a collapsible tree view, not a complex graph library.

The first useful version should support:

- rank hierarchy from kingdom to species;
- counts at every visible node;
- lazy expansion;
- clicking a species to filter map/list observations;
- client-side grouping for small approved datasets.

React Flow, D3, or a mindmap canvas can be considered later only if the collapsible tree cannot support the information density or interaction model.

**한국어:** 첫 구현은 복잡한 그래프가 아니라 접고 펼치는 트리로 시작합니다. 데이터가 커지거나 표현 요구가 커질 때만 별도 graph library를 검토합니다.

## Node Model

Conceptual tree node shape:

```ts
interface TaxonomyTreeNode {
  rank: 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species';
  name: string;
  count: number;
  children?: TaxonomyTreeNode[];
  hasChildren?: boolean;
  observationIds?: string[];
}
```

**한국어:** 각 노드는 rank, name, count, children을 기본으로 갖고, species 단계에서는 연결된 observation id를 가질 수 있습니다.

## Lazy Expansion

Recommended expansion sequence:

1. Initial load shows kingdom counts.
2. Clicking a kingdom loads phylum counts under that kingdom.
3. Clicking a phylum loads class counts.
4. Continue through order, family, genus, and species.
5. Clicking a species filters public map/list to matching approved observations.

For small datasets, expansion can be computed client-side from loaded approved observations. For larger datasets, use an RPC, view, or materialized view in a later scale phase.

**한국어:** 초기에는 kingdom count만 보여주고 클릭할 때 다음 rank count를 계산하거나 불러옵니다. 작은 데이터는 client-side groupBy로 충분합니다.

## Data Source

Tree data should come from accepted taxonomy fields, not from raw user-entered names.

Before a production tree:

- implement taxonomy resolution or curated backfill;
- store canonical ranks;
- define how unresolved or ambiguous records appear;
- decide whether legacy observations without canonical taxonomy are hidden, grouped as unresolved, or shown with warnings.

**한국어:** 트리는 사용자가 입력한 원문 학명이 아니라 검증된 canonical rank 필드를 기준으로 구성합니다.

## Filtering Behavior

Species click behavior:

- sets a shared species filter key;
- narrows map markers to matching approved observations;
- narrows public list results when map/list filter state is shared;
- shows a reset control such as `전체 보기`;
- never fetches or displays pending/rejected rows.

If map and list do not yet share state, implement tree-to-map first and document list synchronization as a follow-up.

**한국어:** species를 클릭하면 approved 관찰 기록만 대상으로 지도와 목록 필터를 좁힙니다. 상태 공유가 아직 어렵다면 지도 필터부터 구현하고 목록 연동은 후속으로 둡니다.

## Client-Side Grouping MVP

For the current small MVP dataset:

- group approved observations already returned by `ObservationRepository`;
- use a pure helper such as `groupObservationsByTaxonomyRank`;
- keep pending/rejected non-exposure guaranteed by the repository read boundary;
- avoid a server API until scale requires it.

**한국어:** 현재 규모에서는 repository가 반환한 approved observation을 클라이언트에서 groupBy하는 방식이 충분합니다.

## Scale Path

If observation volume grows:

- add indexed canonical rank columns;
- add a read-only RPC returning child counts for a selected parent node;
- consider a materialized view for rank counts;
- refresh materialized data after approved observation create/edit/taxonomy review;
- keep RLS so public tree counts are derived only from approved rows.

**한국어:** 규모가 커지면 rank count RPC나 materialized view를 검토하되 public count는 approved row 기준을 유지합니다.

## UI Notes

The tree should match the existing academic visual language:

- compact rows;
- subtle borders;
- clear expand/collapse icons;
- count badges;
- keyboard-accessible tree buttons;
- no decorative graph canvas in the first MVP.

**한국어:** 기존 차분한 학술적 UI에 맞춰 밀도 있는 행, count badge, 명확한 펼침/접힘 버튼을 사용합니다.

## Non-Scope For Phase 21F

- No taxonomy tree app implementation.
- No external taxonomy API calls.
- No DB/RLS migration.
- No React Flow, D3, or graph dependency.
- No admin taxonomy review UI.
- No required scientific-name validation.
