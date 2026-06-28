# Taxonomy Observation Write Path Apply Readiness

Phase: 24E-1 - Taxonomy-Linked Observation Write Path Design And Migration Candidate

Status: migration candidate prepared. No remote SQL has been applied.

Phase 24E-2A correction:

- The first preflight draft checked table-level `SELECT` on `public.taxa`.
- Migration `0007` intentionally uses column-level public `SELECT` grants on
  `public.taxa` plus the `"Public can read accepted taxa"` RLS policy.
- The preflight and post-apply checks now verify column-level read readiness
  and the policy instead of requiring table-level `SELECT`.

## Migration

Filename:

```text
supabase/migrations/0010_create_taxonomy_observation_write_path.sql
```

Objects:

- `public.normalize_taxonomy_input_key(text)`
- `public.create_observation_with_verified_taxonomy(...)`

Purpose:

- Allow a signed-in user to create a new approved observation with taxonomy
  linkage only through a narrow trusted database function.
- Keep browser clients unable to directly write taxonomy columns.
- Keep legacy observations and current direct create behavior compatible.

한국어 요약: 0010은 업로드 화면을 바꾸지 않습니다. 나중에 검증된 학명 결과가 있을 때만 관찰 기록에 taxonomy link를 붙일 수 있는 안전한 DB 함수 후보입니다.

## What 0010 Changes

It creates:

```text
public.normalize_taxonomy_input_key(text)
public.create_observation_with_verified_taxonomy(...)
```

It grants:

```text
EXECUTE on public.create_observation_with_verified_taxonomy(...) to authenticated
```

It revokes:

```text
EXECUTE on the new functions from public/anon by default
```

It does not:

- change existing observation rows
- backfill taxonomy
- make taxonomy columns globally required
- grant direct browser writes to taxonomy columns
- grant browser writes to `public.taxa`
- grant browser access to `public.taxonomy_name_resolutions`
- change RLS policies
- change Storage policies
- change Auth, Admin, Kakao, Vercel, or UI

## Pre-Apply SQL

Run this before applying 0010. It returns only safe booleans/counts.

```sql
select
  to_regclass('public.observations') is not null as observations_exists,
  to_regclass('public.profiles') is not null as profiles_exists,
  to_regclass('public.taxa') is not null as taxa_exists,
  to_regclass('public.taxonomy_name_resolutions') is not null as resolution_cache_exists,
  to_regprocedure('auth.uid()') is not null as auth_uid_exists,
  to_regprocedure('public.guard_observation_edit_fields()') is not null as edit_guard_exists,
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.observations'::regclass
      and tgname = 'observations_guard_edit_fields'
      and not tgisinternal
  ) as edit_guard_trigger_exists,
  to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
  ) is null as create_rpc_not_present_yet,
  has_any_column_privilege('anon', 'public.taxa', 'SELECT') as anon_has_taxa_column_select,
  has_any_column_privilege('authenticated', 'public.taxa', 'SELECT') as authenticated_has_taxa_column_select,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
  ) as taxa_public_select_policy_exists,
  not (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
  ) as browser_taxa_writes_denied,
  not (
    has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as resolution_cache_server_only,
  not (
    has_column_privilege('anon', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
  ) as direct_observation_taxonomy_writes_denied,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
      and cmd = 'SELECT'
  ) as approved_only_public_policy_exists;
```

Expected pre-apply result:

- all values should be `true`.

If any value is false:

- stop
- do not apply 0010
- do not manually edit live objects
- report only the failed safe boolean name

## Manual Apply Steps

1. Open the intended Supabase project.
2. Go to SQL Editor.
3. Run the pre-apply SQL once.
4. If all expected values are safe, open a new query.
5. Paste the full contents of
   `supabase/migrations/0010_create_taxonomy_observation_write_path.sql`.
6. Click Run exactly once.
7. If it succeeds, open another new query.
8. Run the post-apply SQL once.
9. Do not repeatedly rerun 0010.
10. Do not edit the SQL in the Dashboard.

If an error occurs:

- stop
- do not retry automatically
- do not run rollback automatically
- report only a redacted error summary

## Post-Apply SQL

Run this after 0010 applies.

```sql
select
  to_regprocedure('public.normalize_taxonomy_input_key(text)') is not null as normalize_helper_exists,
  to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
  ) is not null as create_rpc_exists,
  has_function_privilege(
    'authenticated',
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'EXECUTE'
  ) as authenticated_can_execute_create_rpc,
  not has_function_privilege(
    'anon',
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'EXECUTE'
  ) as anon_cannot_execute_create_rpc,
  not (
    has_column_privilege('anon', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'INSERT')
    or has_column_privilege('anon', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxon_id', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_match_type', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_confidence', 'UPDATE')
    or has_column_privilege('anon', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.observations', 'taxonomy_verified_at', 'UPDATE')
  ) as direct_observation_taxonomy_writes_denied,
  has_any_column_privilege('anon', 'public.taxa', 'SELECT') as anon_has_taxa_column_select,
  has_any_column_privilege('authenticated', 'public.taxa', 'SELECT') as authenticated_has_taxa_column_select,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
  ) as taxa_public_select_policy_exists,
  not (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
  ) as browser_taxa_writes_denied,
  not (
    has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as resolution_cache_server_only,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
      and cmd = 'SELECT'
  ) as approved_only_public_policy_exists,
  count(*) filter (where taxon_id is not null) >= 0 as observation_taxonomy_count_safe_boolean
from public.observations;
```

Expected post-apply result:

- all values should be `true`.

The final count-derived boolean is intentionally not a data export. It only
confirms the query shape is safe.

## Rollback Guidance

Do not run rollback just because the RPC is unused.

Rollback is only for a confirmed immediate problem before application code
depends on the RPC.

Rollback candidate:

```sql
begin;

revoke all on function public.create_observation_with_verified_taxonomy(
  text,
  text,
  uuid,
  text,
  date,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
) from public;

drop function if exists public.create_observation_with_verified_taxonomy(
  text,
  text,
  uuid,
  text,
  date,
  double precision,
  double precision,
  text,
  text,
  text,
  integer
);

drop function if exists public.normalize_taxonomy_input_key(text);

commit;
```

Rollback must not:

- delete observations
- delete taxonomy cache rows
- weaken RLS
- grant browser writes to taxonomy columns
- grant public access to `taxonomy_name_resolutions`

## Smoke Plan After Apply

Phase 24E-2 should run a controlled smoke:

1. Confirm 0010 post-apply checks pass.
2. Use an approved signed-in test user.
3. Resolve a scientific name through `TaxonomyRepository`.
4. Call the RPC with the returned `taxonId` and reported scientific name.
5. Confirm the new observation has:
   - `status = approved`
   - `observer_id = auth.uid()`
   - non-null `taxon_id`
   - non-null `taxonomy_match_type`
   - valid `taxonomy_verified_at`
6. Confirm direct browser insert with taxonomy columns is still denied.
7. Confirm no observation gets a stale taxonomy link after direct scientific
   name edit attempts.
8. Confirm public list/detail remains approved-only.
9. Clean up or clearly mark any smoke observation according to project policy.

Do not integrate Upload UI until the RPC smoke passes.
