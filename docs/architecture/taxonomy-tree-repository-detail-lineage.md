# Taxonomy Tree Repository And Detail Lineage

Phase: 25B - TaxonomyTreeRepository And Public Detail Taxonomy Lineage

Status: implemented locally on
`feature/phase-25b-taxonomy-tree-repository-detail`. No push, merge,
migration, remote SQL, Edge Function redeploy, Vercel config change, or
Production deployment was performed.

## Goal

Build the read-only taxonomy tree data foundation for Phase 25C and show safe
stored taxonomy lineage in the public observation detail modal.

한국어 요약: 이번 단계는 `생태지도`에 분류 트리를 아직 보여주지 않고, 그 전에 필요한 저장소와 타입을 만들고 상세 모달에 저장된 분류 계통을 보여주는 작업입니다.

## Implemented Contracts

New public tree repository contract:

```ts
export interface TaxonomyTreeRepository {
  getRootNodes(): Promise<TaxonomyTreeNode[]>;
  getChildren(parent: TaxonomyTreeParent): Promise<TaxonomyTreeNode[]>;
}
```

New or extended domain concepts:

- `TaxonomyRank`
- `TaxonomyRankLabelKo`
- `TaxonomyTreeNode`
- `TaxonomyTreeSelection`
- `TaxonomyTreeParent`
- `TaxonomyTreeObservationSummary`
- `ObservationTaxonomyLineage`

Rank order:

```text
kingdom -> phylum -> class -> order -> family -> genus -> species
```

Korean rank labels:

```text
계 -> 문 -> 강 -> 목 -> 과 -> 속 -> 종
```

## Aggregation Helper Behavior

Pure helper functions live under `src/features/taxonomy/taxonomyTree.ts`.

They:

- count only approved observations;
- count only observations with `taxonId` and stored taxon summary;
- count observations, not distinct taxa rows;
- create root nodes from stored kingdoms;
- load children one rank at a time;
- prefer stored source lineage keys for internal identity;
- use terminal source identity only as a species fallback;
- use parent-scoped name fallback only when a rank key is missing but a stored
  name exists;
- never create an invented `정보 없음` taxonomy node;
- keep ancestor counts inclusive when deeper ranks are missing;
- sort deterministically by count descending, then display name.

Missing rank behavior follows Phase 25A: show only real stored taxonomy nodes.
Rows with missing deeper ranks still contribute to ancestor counts, but they do
not create pseudo children and the tree does not skip ranks.

## Mock Repository

`mockTaxonomyTreeRepository` is deterministic and network-free.

Fixture coverage includes:

- a plant path for `Taraxacum officinale`;
- a mammal path for `Homo sapiens`;
- a synonym-derived accepted mammal example for `Puma concolor`;
- a missing-rank plant example;
- a legacy approved row with no taxonomy linkage, excluded from the tree;
- pending and rejected linked rows, excluded from the tree.

## Supabase Repository

`supabaseTaxonomyTreeRepository` uses a read-only repository-level SELECT:

- reads from `public.observations`;
- filters `status = 'approved'`;
- filters `taxon_id IS NOT NULL`;
- joins stored public `taxa` through `observations_taxon_id_fkey`;
- selects only flattened taxonomy lineage columns needed for tree grouping;
- does not select `classification_json`;
- does not read `taxonomy_name_resolutions`;
- does not call GBIF or the resolver Edge Function;
- does not require or expose a service-role key;
- caches the loaded approved linked summary rows in memory for the browser
  session.

If embedded joins or payload size become awkward later, Phase 25C/25D can move
the same contract behind a reviewed read-only RPC. No RPC or migration was
created in Phase 25B.

## Public Detail Lineage UI

`Observation` now has optional `taxonomy` display data. Supabase
`getObservationById` joins safe `taxa` display columns for approved detail
reads only.

For taxonomy-linked observations, the detail modal can show:

- reported scientific name;
- accepted scientific name;
- taxonomic status;
- lineage names for 계/문/강/목/과/속/종;
- high-level source attribution such as `GBIF / Catalogue of Life XR`.

For legacy observations without `taxonId`, the detail modal still works. If a
legacy row has a scientific name but no taxonomy linkage, it shows the calm note
`분류 정보 미연결`.

The UI does not display:

- source taxon keys;
- source checklist keys;
- taxonomy table UUIDs;
- observation UUIDs;
- raw JSON;
- raw email values.

## No-GBIF Guarantee

Tree browsing and detail lineage use only stored database fields. The new tree
repository does not import or invoke:

- GBIF mapper code;
- `resolve-taxonomy`;
- Supabase Functions;
- `taxonomy_name_resolutions`.

The existing Upload UI taxonomy verification flow is unchanged and remains the
only public user path that can intentionally trigger taxonomy resolution.

## Phase 25C Readiness

Phase 25C can now build the visible `분류 탐색` panel by using:

- `activeTaxonomyTreeRepository.getRootNodes()`;
- `activeTaxonomyTreeRepository.getChildren(parent)`;
- `TaxonomyTreeNode` for rendering rows;
- `TaxonomyTreeSelection` for active selected-node state.

Map/list taxonomy filtering is still deferred. Phase 25C should connect node
selection to map/list filtering without changing the repository contract unless
it needs an additional read-only method for observation ids.

## Known Limitations

- The visible tree panel is not implemented yet.
- Map/list taxonomy node filtering is not implemented yet.
- Public list payloads still use the existing observation list read; taxonomy
  lineage is added to detail refresh, not every list card.
- Owner/admin update responses still return the existing observation row shape.
  If an edit happens while a taxonomy-linked detail is open, a later detail
  refresh may be needed to show lineage again.
- Supabase embedded join behavior should be browser-smoked against the shared
  project before Phase 25C is considered fully verified.
- Server-side pagination, read-only RPCs, normal views, and materialized views
  remain future scale options.

## Verification

Expected checks for this phase:

- `npm.cmd run typecheck`
- `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`
- `npm.cmd run build`
- `git diff --check`
- forbidden tracked-path check
- secret-like diff scan without reading `.env.local`

No app deployment, DB mutation, migration apply, Edge Function redeploy, or
Production smoke is part of this document.
