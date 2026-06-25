# Taxonomy Schema And RLS Apply Readiness

Phase: 24B - Taxonomy Schema And RLS Migration Candidate

Status: migration candidate only. Codex did not apply SQL to any Supabase project.

## Problem Statement

Phase 24A validated the official GBIF Species Match API v2 and selected a stored taxonomy cache design. Phase 24B prepares the database and security migration candidate needed before any resolver, upload UI, or edit UI implementation.

The migration must keep all existing observations valid, keep public reads approved-only, and prevent browser clients from forging authoritative taxonomy data.

한국어 요약: 이번 단계는 DB/RLS 후보 SQL만 준비합니다. 실제 Supabase 적용, 앱 코드, Edge Function, 배포는 하지 않습니다.

## Actual Current Schema Findings

Current observation table shape from migrations `0001` through `0006`:

- `public.observations.id` is `uuid primary key default gen_random_uuid()`.
- `public.observations.scientific_name` is nullable `text` with a not-blank-when-present check.
- `public.observations.taxon` is required `text` and limited to the broad groups `식물`, `포유류`, `조류`, `곤충`, `양서/파충류`, `균류`, `기타`.
- `public.observations.observer_id` references `public.profiles(id)` and remains nullable for legacy compatibility.
- `status` is limited to `pending`, `approved`, or `rejected`.
- Image database fields store object metadata/path, not signed/public/blob/data URLs.
- `public.set_updated_at()` updates `updated_at`.
- `public.guard_observation_edit_fields()` protects owner/admin edit invariants.
- Existing public reads remain approved-only through `"Public can read approved observations"`.

Current grants and policies:

- `anon` and `authenticated` may `select` observations, but RLS exposes only `status = 'approved'`.
- Authenticated inserts are limited to own approved observations with `observer_id = auth.uid()`, `status = 'approved'`, `image_url is null`, and `observer_display_name` either `NULL` or equal to the user's profile display name.
- Authenticated updates are column-granted only for content/location/status fields.
- Owner update policy permits owners to update their own approved rows.
- Admin update policy depends on `public.is_admin()`.
- The edit guard blocks observer, image, `image_url`, `created_at`, and non-admin status changes.

## Scientific Name Compatibility

Decision: keep existing `observations.scientific_name` as the user-entered/reported scientific name.

Rationale:

- Current upload code maps the form `scientificName` directly to `scientific_name`.
- Current create/update repository payloads do not include accepted taxonomy fields.
- Existing display/search behavior already treats this field as the observation scientific name.
- Adding a separate `reported_scientific_name` column would duplicate current meaning and create migration risk.

No historical scientific names are rewritten in Phase 24B.

## Selected Taxonomy Model

Use Phase 24A Model A: one accepted terminal taxon row with flattened standard lineage columns.

New table:

```text
public.taxa
```

Important fields:

- `id uuid primary key default gen_random_uuid()`
- `source text not null`
- `source_checklist_key text not null`
- `source_taxon_key text not null`
- `accepted_scientific_name text not null`
- `canonical_name text`
- `terminal_rank text not null`
- `taxonomic_status text not null`
- lineage key/name pairs for kingdom, phylum, class, order, family, genus, and species
- `classification_json jsonb not null default '{}'::jsonb`
- `resolved_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Source and lineage keys are `text`, not numeric, because Phase 24A GBIF/COL XR probes returned non-numeric keys.

Missing ranks stay `NULL`. The migration does not invent lineage values.

`classification_json` is for compact normalized taxonomy data only. It must not store a large raw provider response, credentials, email, Auth metadata, or AI-generated taxonomy.

## Alias And Query Cache Decision

Decision: add a small server-only successful resolution cache table.

New table:

```text
public.taxonomy_name_resolutions
```

Purpose:

- Avoid repeated GBIF calls for exact accepted names.
- Avoid repeated GBIF calls for synonyms after accepted mapping is known.
- Avoid repeated GBIF calls for user-confirmed variants.

Rules:

- Unique by `source`, `source_checklist_key`, and `normalized_input`.
- Points to canonical taxonomy identity through `taxon_id`.
- Caches only successful accepted mappings.
- Does not cache no-match, timeout, HTTP 429, GBIF 5xx, or malformed response results.
- A synonym or variant row may be inserted only after the future trusted resolver flow has handled required confirmation.
- No public read or browser write policy is added.

This table is not a public editable alias directory.

## Observation Columns

The migration adds only nullable, backward-compatible observation columns:

```text
taxon_id uuid references public.taxa(id) on delete restrict
taxonomy_match_type text
taxonomy_confidence integer
taxonomy_verified_at timestamptz
```

Compatibility rules:

- Existing observations remain valid with all taxonomy linkage fields `NULL`.
- No backfill occurs.
- Existing create/edit code can continue omitting the new columns.
- `taxon_id` is not globally `NOT NULL`.
- `scientific_name` is not made `NOT NULL`.

Completeness rule:

- Either all taxonomy linkage metadata is absent, or
- `taxon_id`, `taxonomy_match_type`, and `taxonomy_verified_at` are present.
- `taxonomy_confidence` may remain `NULL` when the authoritative source omits it.

## Constraints And Indexes

Taxa constraints:

- `taxa_source_identity_key`: unique `(source, source_checklist_key, source_taxon_key)`.
- Required taxonomy identity fields reject blank-only values.
- Optional text lineage fields reject blank-only values when present.
- `classification_json` must be a JSON object.

Resolution cache constraints:

- `taxonomy_name_resolutions_source_input_key`: unique `(source, source_checklist_key, normalized_input)`.
- Required query identity fields reject blank-only values.
- `confidence` is `NULL` or between 0 and 100.
- `issues_json` must be a JSON array.
- `match_type` cannot be a known non-success category: `NONE`, `NO_MATCH`, `HIGHERRANK`, or `AMBIGUOUS`.

Observation constraints:

- `taxonomy_confidence` is `NULL` or between 0 and 100.
- `taxonomy_match_type` rejects blank-only values when present.
- Taxonomy linkage is either fully absent or has required relation metadata.

Indexes:

- `taxa_accepted_scientific_name_lower_idx`
- `taxa_canonical_name_lower_idx`
- `taxa_kingdom_key_idx`
- `taxa_phylum_key_idx`
- `taxa_class_key_idx`
- `taxa_order_key_idx`
- `taxa_family_key_idx`
- `taxa_genus_key_idx`
- `taxa_species_key_idx`
- `taxonomy_name_resolutions_taxon_id_idx`
- `observations_taxon_id_idx`

The unique source/checklist/source-key constraint covers primary accepted taxon lookup, so no duplicate source-key index is added.

## RLS And Grant Model

`public.taxa`:

- RLS enabled.
- `anon` and `authenticated` get `SELECT` only on public taxonomy fields.
- Policy `"Public can read accepted taxa"` allows public reads.
- No `INSERT`, `UPDATE`, or `DELETE` policy is added for browser roles.

`public.taxonomy_name_resolutions`:

- RLS enabled.
- `anon` and `authenticated` privileges are revoked.
- No public policy is added.
- It remains server-only.

`public.observations`:

- New taxonomy columns are not granted for browser insert/update.
- Existing authenticated approved-create policy is recreated with added checks that all taxonomy linkage fields must be `NULL`.
- Existing owner/admin update policies remain in place.

## Client-Write Protection

The migration extends `public.guard_observation_edit_fields()` instead of replacing the security model.

Additional protection:

- Direct edits cannot change `taxon_id`.
- Direct edits cannot change `taxonomy_match_type`.
- Direct edits cannot change `taxonomy_confidence`.
- Direct edits cannot change `taxonomy_verified_at`.
- If a row already has `taxon_id`, direct edits cannot change `scientific_name`.

This prevents stale taxonomy links when the scientific name changes.

Legacy compatibility:

- Rows with `taxon_id is null` can still use the current owner/admin scientific-name edit behavior.
- Current content-only owner/admin edits remain compatible.

Trusted write boundary:

- Phase 24B does not create a trusted taxonomy write path.
- Phase 24D must explicitly design the Supabase Edge Function or RPC path that can upsert `taxa`, upsert successful resolution-cache rows, and attach taxonomy metadata safely.
- The service-role value must never be placed in frontend code, `VITE_*` variables, or documentation.

## Broad Taxon Compatibility

The existing broad `observations.taxon` column is preserved.

No duplicate broad project-group column is added to `public.taxa`.

Future mapping from resolved hierarchy to broad group belongs in Phase 24D resolver implementation. It must use explicit rules, not common-name inference and not an LLM.

## Expected Migration

Expected file:

```text
supabase/migrations/0007_create_taxonomy_schema.sql
```

Object names:

- `public.taxa`
- `public.taxonomy_name_resolutions`
- `taxa_set_updated_at`
- `taxonomy_name_resolutions_set_updated_at`
- `observations_taxon_id_idx`
- updated `public.guard_observation_edit_fields()`
- updated policy `"Authenticated users can create own approved observations"`
- policy `"Public can read accepted taxa"`

## Pre-Apply Checklist

Before manual SQL application:

- Confirm migration number `0007` has not already been used in the target database process.
- Confirm `public.observations` exists.
- Confirm `public.profiles` and `public.profiles.display_name` exist.
- Confirm `public.taxa` does not exist.
- Confirm `public.taxonomy_name_resolutions` does not exist.
- Confirm observation columns `taxon_id`, `taxonomy_match_type`, `taxonomy_confidence`, and `taxonomy_verified_at` do not exist.
- Confirm `public.set_updated_at()` exists.
- Confirm `public.guard_observation_edit_fields()` exists.
- Confirm trigger `observations_guard_edit_fields` exists.
- Confirm policies `"Public can read approved observations"`, `"Authenticated users can create own approved observations"`, `"Owners can update own approved observation content"`, and `"Admins can update observations"` exist.
- Record current observation count.
- Record current approved/pending/rejected counts.
- Confirm public read policy still says approved-only.
- Confirm current owner/admin edit protection function is the expected Phase 20H/20J design.
- Use a dev/local apply window first; do not start in production.

Helpful pre-apply SQL:

```sql
select count(*) as observation_count from public.observations;

select status, count(*)
from public.observations
group by status
order by status;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('taxa', 'taxonomy_name_resolutions');

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'observations'
  and column_name in (
    'taxon_id',
    'taxonomy_match_type',
    'taxonomy_confidence',
    'taxonomy_verified_at'
  );

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'observations'
order by policyname;
```

## Manual Apply Instructions

Manual Phase 24C only:

1. Review `supabase/migrations/0007_create_taxonomy_schema.sql`.
2. Apply first to a local/dev Supabase database during an approved apply window.
3. Run the post-apply verification SQL below.
4. Smoke existing create, list, detail, owner edit, and admin edit behavior.
5. Record results before considering any production apply.

Do not run remote SQL from Codex. Do not paste or print project URLs, keys, tokens, passwords, email addresses, or service-role values in session logs.

## Post-Apply Verification SQL

```sql
select to_regclass('public.taxa') as taxa_table;
select to_regclass('public.taxonomy_name_resolutions') as resolution_cache_table;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'taxa'
order by ordinal_position;

select conname
from pg_constraint
where conrelid = 'public.taxa'::regclass
order by conname;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('taxa', 'taxonomy_name_resolutions', 'observations')
  and indexname like any (array[
    'taxa_%',
    'taxonomy_name_resolutions_%',
    'observations_taxon_id_idx'
  ])
order by tablename, indexname;

select relname, relrowsecurity
from pg_class
where oid in (
  'public.taxa'::regclass,
  'public.taxonomy_name_resolutions'::regclass,
  'public.observations'::regclass
);

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('taxa', 'taxonomy_name_resolutions', 'observations')
order by tablename, policyname;

select
  has_any_column_privilege('anon', 'public.taxa', 'select') as anon_can_select_taxa_columns,
  has_any_column_privilege('authenticated', 'public.taxa', 'select') as authenticated_can_select_taxa_columns,
  has_table_privilege('anon', 'public.taxa', 'insert') as anon_can_insert_taxa,
  has_table_privilege('authenticated', 'public.taxa', 'insert') as authenticated_can_insert_taxa,
  has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'select') as anon_can_select_resolution_cache,
  has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'select') as authenticated_can_select_resolution_cache;

select
  count(*) as observation_count,
  count(*) filter (where taxon_id is not null) as linked_taxonomy_count,
  count(*) filter (
    where taxonomy_match_type is not null
       or taxonomy_confidence is not null
       or taxonomy_verified_at is not null
  ) as taxonomy_metadata_count
from public.observations;

select tgname
from pg_trigger
where tgrelid = 'public.observations'::regclass
  and not tgisinternal
order by tgname;
```

Expected post-apply results:

- `public.taxa` exists.
- `public.taxonomy_name_resolutions` exists.
- RLS is enabled on both new tables.
- `anon` and `authenticated` can select `public.taxa`.
- `anon` and `authenticated` cannot insert/update/delete `public.taxa`.
- `anon` and `authenticated` cannot read or write `public.taxonomy_name_resolutions`.
- All preexisting observations remain present.
- All preexisting observations have `taxon_id`, `taxonomy_match_type`, `taxonomy_confidence`, and `taxonomy_verified_at` as `NULL`.
- Existing approved-only observation read policy still exists.
- Existing owner/admin update policies still exist.
- `observations_guard_edit_fields` still exists and uses the expanded guard.

## Rollback Guidance

If the migration fails during the transaction, PostgreSQL should roll back the whole transaction.

If the migration was applied to a dev/local database and no taxonomy data has been created, rollback may be drafted as a reviewed reverse migration that removes the new policies, trigger changes, observation columns, and new tables.

After production taxonomy data exists, do not drop taxonomy tables as a shortcut. Use a new corrective migration that preserves observation history and keeps RLS strict.

Never weaken RLS as a rollback shortcut.

## Known Risks

- The migration is static-reviewed only in Phase 24B; it is not live-tested against Supabase in this phase.
- The trusted Edge Function/RPC write path is intentionally deferred to Phase 24D.
- The expanded edit guard blocks direct taxonomy relinking for all direct update flows; Phase 24D must provide a reviewed trusted path.
- Public list queries currently use `select('*')`; Phase 24F should narrow public list fields before taxonomy data grows.
- Future Phase 25 tree browsing must aggregate stored data lazily and must not call GBIF during browsing.

## Exact Phase 24C Plan

Phase 24C should be an apply-readiness and manual Supabase apply phase:

1. Review this document and `supabase/migrations/0007_create_taxonomy_schema.sql`.
2. Run pre-apply SQL in a dev/local Supabase database.
3. Manually apply migration `0007`.
4. Run post-apply SQL.
5. Smoke current app behavior without implementing taxonomy UI.
6. Record PASS/PARTIAL/FAIL results.
7. Do not implement `TaxonomyRepository`, Edge Function code, upload UI integration, or taxonomy tree in Phase 24C.
