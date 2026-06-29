# Taxonomy Tree Browsing Design

Phase: 25A - Taxonomy Tree Browsing Design For Eco Map

Status: design and data-contract only. No app code, migration SQL, remote SQL,
Edge Function, Vercel, Storage, Auth, Admin, Kakao, package, merge, push, or
Production deployment change is part of this phase.

## Goal

Let public users explore approved stored observations by taxonomy hierarchy on
the existing `생태지도` screen:

```text
계 -> 문 -> 강 -> 목 -> 과 -> 속 -> 종
```

The tree must use only taxonomy data already stored in the project database.
It must not call GBIF during public list rendering, detail modal rendering, map
rendering, search, or tree browsing.

## User Story

A visitor opens `생태지도`, expands `분류 탐색`, sees taxonomy groups with
observation counts, and clicks a node such as a family or genus. The map
markers and list-style result area for that screen then show only approved
observations under the selected taxonomy node. The existing search and broad
taxon filters still work at the same time.

## Chosen UI Placement

MVP placement is inside the existing `생태지도` filter panel, not a new Navbar
page.

Desktop:

- Add a collapsible `분류 탐색` section inside the current top-left map filter
  panel.
- Place it near the existing search/species suggestion and broad taxon filter
  controls.
- Show root nodes as `계` rows first.
- Each row shows an expand/collapse control, a label, rank label, and approved
  observation count.
- Clicking the expand control only loads or toggles children.
- Clicking the node label applies the taxonomy filter.
- Show an active chip such as `분류 필터: Asteraceae` with a clear button.

Mobile:

- Keep the tree inside a collapsible section in the same filter panel for the
  first implementation.
- Keep touch targets large enough for expand and select actions.
- Keep the active taxonomy chip visible above the map/list result count.
- Defer a bottom sheet or separate mobile drawer until the simple collapsible
  panel proves too crowded.

## Data Model Findings

`public.taxa` is the accepted terminal taxonomy cache created by migration
`0007_create_taxonomy_schema.sql`.

Available taxonomy fields:

- `id`
- `source`
- `source_checklist_key`
- `source_taxon_key`
- `accepted_scientific_name`
- `canonical_name`
- `terminal_rank`
- `taxonomic_status`
- `kingdom_key`, `kingdom_name`
- `phylum_key`, `phylum_name`
- `class_key`, `class_name`
- `order_key`, `order_name`
- `family_key`, `family_name`
- `genus_key`, `genus_name`
- `species_key`, `species_name`
- `classification_json`
- `resolved_at`
- `updated_at`

Important properties:

- Source keys are `text`, not numeric.
- Lineage key/name pairs may be null for some ranks.
- `classification_json` is available, but the tree MVP should use flattened
  columns and avoid fetching JSON for list cards.
- `public.taxa` is public-readable for accepted taxonomy data.
- Browser roles cannot write `public.taxa`.
- `public.taxonomy_name_resolutions` remains server-only and is not part of
  tree browsing.

Available observation taxonomy fields:

- `taxon_id`
- `taxonomy_match_type`
- `taxonomy_confidence`
- `taxonomy_verified_at`
- existing reported `scientific_name`
- existing broad `taxon`
- `status`
- `observer_id`
- image path/metadata fields, with runtime signed URL display outside DB rows

Important observation findings:

- `observations.taxon_id` references `taxa.id` and remains nullable.
- Legacy rows with `taxon_id IS NULL` remain valid.
- Public Supabase reads still filter `status = 'approved'`.
- The current public Supabase repository uses `select('*')`, which is too
  broad for a future taxonomy-heavy list payload and should be narrowed in a
  later implementation pass.
- Current `Observation` includes `taxonId` and taxonomy metadata, but not full
  lineage.
- Detail lineage display needs either a joined read model or an optional
  taxonomy summary on `Observation`.

## Node Model

Recommended Phase 25B TypeScript contract:

```ts
export type TaxonomyTreeRank =
  | 'kingdom'
  | 'phylum'
  | 'class'
  | 'order'
  | 'family'
  | 'genus'
  | 'species';

export interface TaxonomyTreeNodeIdentity {
  rank: TaxonomyTreeRank;
  key: string;
  identityKind: 'sourceKey' | 'terminalSourceKeyFallback' | 'nameFallback';
  source: string;
  sourceChecklistKey: string;
}

export interface TaxonomyTreeNode {
  rank: TaxonomyTreeRank;
  rankLabelKo: '계' | '문' | '강' | '목' | '과' | '속' | '종';
  key: string;
  identityKind: TaxonomyTreeNodeIdentity['identityKind'];
  name: string;
  displayName: string;
  observationCount: number;
  hasChildren: boolean;
  parent?: TaxonomyTreeNodeIdentity;
  source?: string;
  isTerminal: boolean;
}

export interface TaxonomyTreeSelection extends TaxonomyTreeNodeIdentity {
  name: string;
  displayName: string;
}
```

Identity rules:

- Prefer stored source lineage keys over names.
- Use a composite internal identity made from source, checklist, rank, and key.
- Do not expose internal UUIDs in UI.
- Do not display source taxon keys in labels, debug copy, or user-visible
  errors.
- Use `displayName` from stored scientific taxonomy names only.
- Never invent Korean taxonomy names.
- If the standard rank key is missing but the row is terminal species-level,
  species may use the accepted terminal source key as an internal fallback.
- If a key is missing but a rank name exists, use a parent-scoped normalized
  name fallback with `identityKind: 'nameFallback'`; this is acceptable only
  for display/filtering within the current source/checklist/parent context.
- If both key and name are missing for a rank, do not create a taxonomy node.

## Rank Traversal

Traversal order:

```text
kingdom -> phylum -> class -> order -> family -> genus -> species
```

Root nodes:

- Distinct kingdoms among approved observations where `observations.taxon_id IS
  NOT NULL`.
- Require stored `kingdom_name`.
- Prefer `kingdom_key` for identity.

Children:

- Kingdom child: distinct phyla where the selected kingdom identity matches.
- Phylum child: distinct classes where selected phylum identity matches.
- Class child: distinct orders where selected class identity matches.
- Order child: distinct families where selected order identity matches.
- Family child: distinct genera where selected family identity matches.
- Genus child: distinct species where selected genus identity matches.

Species representation:

- Use `species_key` and `species_name` when present.
- If `terminal_rank = 'SPECIES'` and `species_key` is absent, use the accepted
  terminal source identity internally and display the accepted/canonical name.
- Infraspecific terminal taxa remain grouped under their species ancestor in
  the MVP. Subspecies/variety/form tree levels are deferred.

## Missing-Rank Behavior

Options considered:

| Option | Behavior | Assessment |
| --- | --- | --- |
| A. Hide missing-rank observations from deeper levels | Ancestor counts include them, child rows do not | Simple and safe, but child counts may not sum to parent |
| B. Create an `정보 없음` pseudo-node | Keeps count totals visible | Understandable, but creates non-taxonomy nodes and more UI rules |
| C. Skip to next available rank | Shows deeper known ranks | Can imply an invented parent-child relationship |
| D. Block expansion when next rank is missing | Avoids invented structure | Too coarse if some children are known and some are missing |

Recommended MVP:

- Show only real stored taxonomy nodes.
- Do not skip ranks.
- Do not create selectable `정보 없음` pseudo-nodes in the first tree.
- Ancestor node counts include all approved linked observations under that
  ancestor, including rows missing a deeper rank.
- Child node counts include only observations with the child rank key/name.
- If a node has no real child nodes, show a quiet empty message such as
  `하위 분류 정보가 없습니다.` rather than inventing a child.
- A later phase may add a non-selectable `하위 분류 미연결 N건` summary if users
  need child counts to visually reconcile with parent counts.

This keeps the MVP honest: it does not invent taxonomy, does not hide linked
observations from selected ancestor counts, and is easy to implement.

## Count Semantics

Counts mean:

- Count only rows where `public.observations.status = 'approved'`.
- Count only rows where `observations.taxon_id IS NOT NULL`.
- Count observations, not taxa rows.
- A node count includes all approved linked observations whose accepted taxon
  has that rank identity.
- Pending and rejected observations do not contribute to counts.
- Legacy unlinked rows do not contribute to taxonomy tree counts.
- Counts are global approved taxonomy-linked counts, independent of current
  text search or broad taxon filters.

Tradeoff:

- Global counts are stable and cheap to explain.
- The existing map/list result count can still show the current filtered result
  after search, broad taxon, and taxonomy filter are combined.
- Showing both global and currently-filtered counts is useful later, but not
  necessary for the first tree.

## Query Architecture Recommendation

Options considered:

| Option | Evaluation |
| --- | --- |
| A. Repository SELECT queries with client grouping | No new SQL migration, uses existing public approved reads and public `taxa` reads. Good for current small data. Must select narrow columns and avoid `classification_json` for cards. |
| B. Read-only PostgreSQL RPC | Best long-term fit for lazy child counts, approved-only enforcement, and smaller payloads. Requires a migration/apply phase and function tests. |
| C. Normal view or materialized view | Useful when counts become expensive or need caching. Adds lifecycle/refresh concerns. Not needed for MVP without performance evidence. |
| D. Edge Function | Avoids PostgREST grouping limits but adds deployment/secrets/logging surface. Not justified because no GBIF call or privileged write is needed. |

Recommended Phase 25B direction:

- Start with a `TaxonomyTreeRepository` boundary.
- For mock mode, use deterministic in-memory tree fixtures.
- For Supabase mode, first attempt a narrow repository-level read using
  approved observations joined to public `taxa`, then group in repository code.
- Keep a read-only RPC as the fallback if Supabase embedded joins, payload
  size, or lazy child count performance become awkward.
- Do not use an Edge Function for tree reads.
- Do not create a materialized view in MVP.

This lets Phase 25B avoid migration 0012 unless implementation proves the
repository SELECT approach is not robust enough.

## Map/List Filter Behavior

Selected taxonomy node filters approved observations conceptually as:

- kingdom: linked taxon has matching `kingdom_key` or safe fallback identity.
- phylum: matching `phylum_key` or safe fallback identity.
- class: matching `class_key` or safe fallback identity.
- order: matching `order_key` or safe fallback identity.
- family: matching `family_key` or safe fallback identity.
- genus: matching `genus_key` or safe fallback identity.
- species: matching `species_key`, or terminal species identity fallback.

Rules:

- Taxonomy filter applies only to taxonomy-linked observations.
- While taxonomy filter is active, legacy `taxon_id IS NULL` observations are
  excluded.
- When no taxonomy filter is active, legacy observations remain visible exactly
  as before.
- Existing broad taxon filters remain available:
  `식물`, `포유류`, `조류`, `곤충`, `양서/파충류`, `균류`, `기타`.
- Existing search remains available.
- Existing detail modal selection remains available.

Combination rule:

```text
text search AND broad taxon filters AND taxonomy tree filter
```

UI behavior:

- Expanding a node does not filter results.
- Selecting a node label applies the taxonomy filter.
- Active chip copy: `분류 필터: {displayName}`.
- Clear action removes only the taxonomy filter unless the user chooses the
  existing full reset control.
- Empty result copy should mention all filters together, for example:
  `현재 검색어와 분류 조건에 맞는 관찰 기록이 없습니다.`

## Detail Modal Taxonomy Display Plan

Detail display should be added after or alongside the first repository read
model, without calling GBIF.

Recommended Phase 25B inclusion:

- Add a small read-only taxonomy lineage block for taxonomy-linked observations
  if the repository can fetch lineage safely with the selected observation.
- Show reported scientific name from `observations.scientific_name`.
- Show accepted scientific name from `taxa.accepted_scientific_name`.
- Show `계/문/강/목/과/속/종` from stored lineage columns.
- Show source attribution at a high level, without showing source keys.
- For legacy rows, keep the detail modal working and show existing scientific
  name; optional copy: `분류 정보 미연결`.

If this makes Phase 25B too large, defer visible detail UI to Phase 25C and
only prepare the repository/type read model in Phase 25B.

## Repository And Type Design

Suggested files for Phase 25B:

- `src/repositories/taxonomyTreeRepository.ts`
- `src/repositories/taxonomyTreeRepositoryProvider.ts`
- `src/repositories/mockTaxonomyTreeRepository.ts`
- `src/repositories/supabase/supabaseTaxonomyTreeRepository.ts`
- pure helpers under `src/features/taxonomy/` or `src/utils/`

Suggested contracts:

```ts
export interface TaxonomyTreeRepository {
  getRootNodes(): Promise<TaxonomyTreeNode[]>;
  getChildren(parent: TaxonomyTreeSelection): Promise<TaxonomyTreeNode[]>;
  getObservationIdsForSelection(selection: TaxonomyTreeSelection): Promise<string[]>;
  getNodePath(selection: TaxonomyTreeSelection): Promise<TaxonomyTreeNode[]>;
}

export interface ObservationTaxonomyFilter {
  selection: TaxonomyTreeSelection;
  observationIds: ReadonlySet<string>;
}
```

Filtering implementation:

- Initial MVP can filter client-side by observation id after the tree
  repository returns ids for the selected node.
- This avoids pushing full lineage into every map/list observation card.
- Detail lineage can use a separate optional `ObservationTaxonomySummary` or a
  focused `getObservationTaxonomySummary(observationId)` method.
- If approved observation volume grows, move taxonomy filtering and search to
  server-side repository queries with pagination.

## Performance And Caching Plan

- No GBIF calls.
- Lazy load children only when a node is expanded.
- Cache loaded child arrays in memory for the current browser session.
- Cache selected-node observation id sets in memory.
- Invalidate on page reload; no live invalidation is needed until taxonomy data
  can mutate from public UI, which is currently not allowed.
- Do not expand the full tree by default.
- Do not fetch `classification_json` for list cards.
- Keep `classification_json` out of public list payloads unless a detail or
  admin-specific view needs it.
- Revisit server-side pagination/filtering when approved observations or tree
  expansion become visibly slow on mobile.

## Security And Privacy Checklist

Preserve existing invariants:

- Public reads remain approved-only.
- Pending and rejected observations remain hidden.
- No public write to taxonomy data.
- `taxonomy_name_resolutions` remains server-only.
- No service-role key in frontend code.
- No direct UI writes to taxonomy tables.
- No raw email display.
- No signed/public/blob/data URL persistence in observation rows.
- Admin route remains hidden from `Navbar`.

Tree-specific requirements:

- Tree counts must be based on approved observations only.
- Tree counts must not reveal pending or rejected observations.
- Do not expose internal observation UUIDs or taxonomy table UUIDs in UI.
- Do not show source taxon keys in labels, user-facing debug text, or logs.
- Do not expose user-specific private data in tree nodes.
- Legacy unlinked rows stay valid and visible when no taxonomy filter is active.

## Rollout Plan

1. Phase 25A: design and query prototypes only. Completed by these documents.
2. Phase 25B: implement `TaxonomyTreeRepository`, mock/Supabase read models,
   and public detail taxonomy lineage where the read model is ready.
3. Phase 25C: add the collapsible `분류 탐색` panel to `생태지도` and connect
   taxonomy node selection to map/list filtering.
4. Phase 25D: browser smoke and regression for mock/Supabase, no-key/static
   map fallback, Kakao normal-key if available, approved-only counts, legacy
   row behavior, and no-secret logging.
5. Later scale phase: add read-only RPC/view/materialization if data volume or
   mobile performance requires it.

## Deferred Work

- New Navbar taxonomy page.
- Full graph/mindmap visualization.
- React Flow, D3, or other graph dependencies.
- GBIF calls during browsing.
- Legacy taxonomy backfill.
- Infraspecific ranks below species.
- Korean common taxonomy name enrichment.
- Admin taxonomy review or relink UI.
- Taxonomy edit/re-resolution flow for existing observations.
- Server-side search/pagination until scale requires it.
- Migration 0012 or remote SQL during Phase 25A.

## Known Risks

- Current Supabase public observation reads use `select('*')`; Phase 25B should
  narrow public list fields before adding richer taxonomy payloads.
- Supabase embedded joins from observations to taxa should be verified locally;
  if they are awkward under current RLS/column grants, use a read-only RPC in a
  later SQL phase.
- Child counts may not visually sum to parent counts when some linked taxa are
  missing intermediate ranks. The MVP should document this with calm empty or
  missing-rank copy rather than inventing taxonomy.
- Mock observations do not currently include stored lineage, so mock tree data
  needs deterministic fixtures separate from `sampleObservations`.
- Detail lineage requires a mapper/type extension because `Observation` only
  stores `taxonId` and taxonomy metadata today.
