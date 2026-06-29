# Taxonomy Tree Query Prototypes

Phase: 25A - Taxonomy Tree Browsing Design For Eco Map

Status: documentation-only query sketches. These examples are read-only
pseudocode/SQL drafts for later design review. They are not migrations, were
not applied, and do not create migration 0012.

## Scope Rules

- Read only from `public.observations` and `public.taxa`.
- Count only approved observations.
- Count only observations with `taxon_id IS NOT NULL`.
- Do not read `public.taxonomy_name_resolutions`.
- Do not call GBIF.
- Do not mutate taxonomy tables, observation rows, Storage, Auth, RLS, Edge
  Functions, or Vercel configuration.
- Do not return internal UUIDs or source keys to UI labels.

## Shared Rank Concept

Application rank order:

```text
kingdom -> phylum -> class -> order -> family -> genus -> species
```

Each rank maps to a stored key/name pair:

| Rank | Key column | Name column |
| --- | --- | --- |
| `kingdom` | `taxa.kingdom_key` | `taxa.kingdom_name` |
| `phylum` | `taxa.phylum_key` | `taxa.phylum_name` |
| `class` | `taxa.class_key` | `taxa.class_name` |
| `order` | `taxa.order_key` | `taxa.order_name` |
| `family` | `taxa.family_key` | `taxa.family_name` |
| `genus` | `taxa.genus_key` | `taxa.genus_name` |
| `species` | `taxa.species_key` | `taxa.species_name` |

The repository may use `source` and `source_checklist_key` internally to avoid
cross-source collisions. UI labels should use stored names only.

## Repository-Level SELECT Prototype

For Phase 25B, a repository-level read can fetch a narrow approved linked
dataset and group it in TypeScript.

Conceptual Supabase select:

```ts
const { data, error } = await client
  .from('observations')
  .select(`
    id,
    taxon_id,
    taxa!observations_taxon_id_fkey (
      source,
      source_checklist_key,
      accepted_scientific_name,
      canonical_name,
      terminal_rank,
      taxonomic_status,
      kingdom_key,
      kingdom_name,
      phylum_key,
      phylum_name,
      class_key,
      class_name,
      order_key,
      order_name,
      family_key,
      family_name,
      genus_key,
      genus_name,
      species_key,
      species_name
    )
  `)
  .eq('status', 'approved')
  .not('taxon_id', 'is', null);
```

Notes:

- This should be kept behind `TaxonomyTreeRepository`, not called from UI.
- It intentionally does not select `classification_json`.
- It relies on the existing approved-only public observation policy and public
  accepted taxa read policy.
- If Supabase embedded join behavior is awkward under the existing grants/RLS,
  move to a read-only RPC in a later SQL phase.

## Root Node Query Idea

Root nodes are distinct kingdoms represented by approved linked observations.

Read-only SQL sketch:

```sql
select
  'kingdom'::text as rank,
  t.source,
  t.source_checklist_key,
  t.kingdom_key as node_key,
  t.kingdom_name as node_name,
  count(o.id)::bigint as observation_count,
  bool_or(t.phylum_name is not null) as has_children
from public.observations o
join public.taxa t on t.id = o.taxon_id
where o.status = 'approved'
  and o.taxon_id is not null
  and t.kingdom_name is not null
group by
  t.source,
  t.source_checklist_key,
  t.kingdom_key,
  t.kingdom_name
order by lower(t.kingdom_name);
```

Implementation notes:

- Prefer `kingdom_key` for identity.
- If `kingdom_key` is null but `kingdom_name` is present, the repository may
  create a parent-scoped name fallback identity.
- Counts are observations, not taxa rows.

## Children Query Idea

Children are the next rank under the selected parent. This sketch shows
kingdom -> phylum.

```sql
select
  'phylum'::text as rank,
  t.source,
  t.source_checklist_key,
  t.phylum_key as node_key,
  t.phylum_name as node_name,
  count(o.id)::bigint as observation_count,
  bool_or(t.class_name is not null) as has_children
from public.observations o
join public.taxa t on t.id = o.taxon_id
where o.status = 'approved'
  and o.taxon_id is not null
  and t.source = :parent_source
  and t.source_checklist_key = :parent_source_checklist_key
  and (
    (:parent_key is not null and t.kingdom_key = :parent_key)
    or (
      :parent_key is null
      and :parent_name is not null
      and lower(t.kingdom_name) = lower(:parent_name)
    )
  )
  and t.phylum_name is not null
group by
  t.source,
  t.source_checklist_key,
  t.phylum_key,
  t.phylum_name
order by lower(t.phylum_name);
```

The same pattern applies for deeper ranks:

| Parent rank | Child rank | Parent match column | Child columns | Deeper child check |
| --- | --- | --- | --- | --- |
| `kingdom` | `phylum` | `kingdom_key/name` | `phylum_key/name` | `class_name` |
| `phylum` | `class` | `phylum_key/name` | `class_key/name` | `order_name` |
| `class` | `order` | `class_key/name` | `order_key/name` | `family_name` |
| `order` | `family` | `order_key/name` | `family_key/name` | `genus_name` |
| `family` | `genus` | `family_key/name` | `genus_key/name` | `species_name` |
| `genus` | `species` | `genus_key/name` | `species_key/name` | none |

Species `has_children` should be false in the MVP.

## Node Filter Query Idea

When the user selects a node, the repository can return approved observation
ids under that node. UI filters the already loaded approved observation list by
these ids.

Example for family:

```sql
select o.id
from public.observations o
join public.taxa t on t.id = o.taxon_id
where o.status = 'approved'
  and o.taxon_id is not null
  and t.source = :selection_source
  and t.source_checklist_key = :selection_source_checklist_key
  and (
    (:selection_key is not null and t.family_key = :selection_key)
    or (
      :selection_key is null
      and :selection_name is not null
      and lower(t.family_name) = lower(:selection_name)
    )
  )
order by o.observed_date desc, o.id;
```

Rank-specific match column:

| Selection rank | Match expression |
| --- | --- |
| `kingdom` | `t.kingdom_key/name` |
| `phylum` | `t.phylum_key/name` |
| `class` | `t.class_key/name` |
| `order` | `t.order_key/name` |
| `family` | `t.family_key/name` |
| `genus` | `t.genus_key/name` |
| `species` | `t.species_key/name`, with terminal species fallback if needed |

## Read-Only RPC Prototype

If repository-level grouping is too broad or embedded joins are awkward,
Phase 25 can add a read-only RPC in a separate reviewed SQL phase.

Conceptual function signature:

```sql
create or replace function public.get_taxonomy_tree_children(
  p_parent_rank text default null,
  p_parent_key text default null,
  p_parent_name text default null,
  p_parent_source text default null,
  p_parent_source_checklist_key text default null
)
returns table (
  rank text,
  node_key text,
  node_name text,
  source text,
  source_checklist_key text,
  observation_count bigint,
  has_children boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  -- Implementation would branch by p_parent_rank and return only the next
  -- rank's approved linked observation counts.
$$;
```

RPC requirements:

- `stable` and read-only.
- `security invoker` unless a reviewed reason requires otherwise.
- Grant execute only to roles intended for public tree reads.
- Preserve RLS so counts cannot include pending/rejected rows.
- Return stored names for UI labels, not internal UUIDs.
- Keep source/checklist fields as internal identity fields in repository code.

## Normal View Prototype

A normal view can simplify repository reads while preserving current RLS.

Conceptual view:

```sql
create view public.approved_observation_taxonomy_lineage as
select
  o.id as observation_id,
  o.observed_date,
  t.source,
  t.source_checklist_key,
  t.accepted_scientific_name,
  t.canonical_name,
  t.terminal_rank,
  t.taxonomic_status,
  t.kingdom_key,
  t.kingdom_name,
  t.phylum_key,
  t.phylum_name,
  t.class_key,
  t.class_name,
  t.order_key,
  t.order_name,
  t.family_key,
  t.family_name,
  t.genus_key,
  t.genus_name,
  t.species_key,
  t.species_name
from public.observations o
join public.taxa t on t.id = o.taxon_id
where o.status = 'approved'
  and o.taxon_id is not null;
```

This is not recommended as the first MVP unless repository SELECT or RPC proves
too noisy. A view still requires migration review and grants.

## Materialized View Prototype

Not recommended for MVP.

Use only if:

- approved observation count grows enough to make live grouping slow,
- mobile expansion becomes visibly delayed,
- or tree counts are needed across many pages.

If introduced later, define a refresh strategy after approved taxonomy-linked
create/edit/review paths. Do not materialize pending/rejected counts into a
public-readable object.

## Detail Lineage Query Idea

The detail modal can fetch lineage for a selected approved observation without
GBIF.

```sql
select
  o.id,
  o.scientific_name as reported_scientific_name,
  o.taxonomy_match_type,
  o.taxonomy_confidence,
  o.taxonomy_verified_at,
  t.accepted_scientific_name,
  t.canonical_name,
  t.terminal_rank,
  t.taxonomic_status,
  t.source,
  t.kingdom_name,
  t.phylum_name,
  t.class_name,
  t.order_name,
  t.family_name,
  t.genus_name,
  t.species_name
from public.observations o
left join public.taxa t on t.id = o.taxon_id
where o.id = :observation_id
  and o.status = 'approved';
```

Legacy behavior:

- If `taxon_id` is null, return the approved observation without lineage.
- The UI can show existing scientific name plus `분류 정보 미연결`.

## Testing Notes For Phase 25B

Add focused tests for:

- root node grouping counts approved linked observations only;
- children grouping follows rank order;
- missing-rank rows contribute to ancestor counts but do not create invented
  child nodes;
- selected node id-set filtering excludes legacy rows only while taxonomy
  filter is active;
- current search AND broad taxon AND taxonomy filter composition;
- no GBIF calls in tree repository tests;
- detail lineage handles both linked and legacy rows.
