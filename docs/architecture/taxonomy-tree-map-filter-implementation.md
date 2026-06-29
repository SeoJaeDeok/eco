# Taxonomy Tree Map Filter Implementation

Phase: 25C - Taxonomy Tree Panel And Eco Map Filtering

Status: implemented on `feature/phase-25c-taxonomy-tree-map-filter` and pushed
for Vercel Preview smoke in Phase 25D-1. No merge to `main`, migration, remote
SQL, Edge Function redeploy, Vercel config change, or Production deployment was
performed.

## Goal

Add the first visible taxonomy browsing surface to the existing `생태지도`
screen and connect selected taxonomy nodes to the same observation collection
that drives map markers and the compact map-side list.

한국어 요약: `생태지도` 화면 안에 `분류 탐색` 패널을 넣고, 사용자가 분류 노드를 누르면 지도 마커와 작은 관찰 목록이 함께 줄어들도록 구현했습니다.

## UI Placement

The panel is placed inside the existing Eco Map filter overlay, below the
existing broad taxon filter buttons.

Desktop behavior:

- the existing left-side filter overlay remains the control surface;
- `분류 탐색` is collapsed by default;
- opening it loads root taxonomy nodes;
- expanding a node loads only the next rank;
- clicking the label selects the node as a filter;
- the active chip shows `분류 필터: <displayName>`;
- the chip clear button removes only the taxonomy filter;
- the existing full reset control clears search, broad taxon, species, and
  taxonomy filters together.

Mobile behavior:

- the same overlay remains scrollable within the viewport;
- the taxonomy section is collapsed by default to avoid crowding the map;
- row buttons use touch-sized hit areas;
- the active filter chip remains inside the opened filter overlay.

## Repository Path

Phase 25C keeps UI components out of direct Supabase access.

`MapPage` uses:

```text
activeTaxonomyTreeRepository
  -> getRootNodes()
  -> getChildren(parent)
  -> getObservationIdsForSelection(selection)
```

Mock mode uses deterministic in-memory summaries. Supabase mode uses the
Phase 25B repository-level read from approved `observations` joined to public
`taxa`, cached in memory for the session.

No Phase 25C code calls GBIF, invokes `resolve-taxonomy`, reads
`taxonomy_name_resolutions`, uses service-role credentials, or writes taxonomy
tables.

## Selection And Filter State

`TaxonomyTreeSelection` remains the internal node identity shape. The UI shows
only:

- rank label;
- display name;
- approved linked observation count.

The UI does not display source keys, taxonomy table ids, observation UUIDs, or
raw JSON.

When a node is selected:

1. `MapPage` stores the selected node.
2. `MapPage` requests approved linked observation ids for that node from the
   taxonomy tree repository.
3. `filterMapObservations` receives those ids as `taxonomyObservationIds`.
4. While the id set is loading, the taxonomy filter is active with an empty
   temporary id set.
5. When loading completes, map markers and the compact list use the same
   filtered collection.

## AND Filter Semantics

The final Eco Map collection uses:

```text
public status guard
AND text/species search
AND existing broad taxon filters
AND taxonomy selected-node id filter
```

Rules:

- no taxonomy filter: existing behavior remains, and legacy unlinked rows stay
  visible;
- active taxonomy filter: only taxonomy-linked observations whose ids are under
  the selected node remain visible;
- broad taxon filters still work as before;
- search still works as before;
- species suggestion selection still works as before;
- selecting a taxonomy node filters both map markers and the map-side compact
  observation list.

## Legacy Rows

Legacy observations with `taxon_id IS NULL` are still valid.

- They remain visible when no taxonomy filter is active.
- They are excluded while a taxonomy filter is active.
- Opening legacy detail still works through the Phase 25B detail compatibility
  path.

## Missing-Rank Handling

Phase 25C follows the Phase 25A/25B missing-rank policy:

- ancestor nodes count approved linked observations even when a deeper rank is
  missing;
- child nodes are created only for real stored rank values;
- the tree does not create `정보 없음` pseudo-nodes;
- the tree does not skip ranks;
- a node with no real children shows a quiet empty child message.

## Map/List Behavior

The same `filteredObservations` array now drives:

- map markers through `MapPreview`;
- the result count;
- the compact `관찰 목록` inside the map filter overlay;
- detail opening from either marker or list row.

The separate public `관찰목록` page is not changed in Phase 25C because the MVP
taxonomy panel belongs first inside `생태지도`.

## Tests

Automated tests cover:

- no taxonomy filter keeps legacy rows visible;
- active taxonomy filter excludes legacy rows;
- kingdom selection filters the map collection;
- genus selection reaches child species observations;
- search, broad taxon, and taxonomy filters combine with AND semantics;
- clearing taxonomy filter restores non-taxonomy results;
- pending/rejected rows are not introduced by the helper;
- missing-rank rows remain selectable through known ancestor nodes only;
- mock repository returns selected-node observation ids;
- Supabase repository exposes the selected-node id path without resolver/cache
  calls;
- UI source uses the repository boundary and includes the `분류 탐색` panel,
  active chip, and compact observation list.

## Verification Result

Recorded in this phase:

- `npm.cmd run typecheck`: PASS
- Node tests: PASS, 45 tests
- `npm.cmd run build`: PASS
- Local app HTTP smoke at `http://127.0.0.1:3002/`: PASS, HTTP 200
- Preview branch push: PASS in Phase 25D-1
- Vercel Preview status check: PASS in Phase 25D-1
- Preview browser smoke: PASS for basic site, tree panel, expand/collapse, node
  selection, active chip, clear filter, map/list filtering, search/broad filter
  combination, detail lineage, and legacy detail
- Preview GBIF network inspection: PARTIAL/unknown
- Preview build log secret review: PARTIAL

No migration, live DB mutation, Edge Function redeploy, Vercel config change,
or Production deployment was performed.

## Known Limitations

- The first tree loads ids for selected nodes client-side through the repository
  cache. Server-side filtering/pagination remains a later scale option.
- The mock tree fixture includes extra deterministic taxonomy examples from
  Phase 25B, so mock tree counts can be higher than the compact map list count
  if some fixture ids are not present in `sampleObservations`.
- Full browser verification with a shared Supabase dataset should be completed
  in Phase 25D Preview smoke. Phase 25D-1 completed operator browser smoke for
  Preview, but Production smoke is still pending.
- Phase 25D-1 read-only DB verification found `public.taxa` direct SELECT
  privilege checks false for both `anon` and `authenticated`, even though the
  Preview UI smoke passed. Review this grant/RLS result before merging to
  `main`.
- The separate public observation list page does not yet have its own taxonomy
  tree panel.
- Read-only RPC/view/materialized cache options remain deferred until
  performance evidence justifies migration work.
