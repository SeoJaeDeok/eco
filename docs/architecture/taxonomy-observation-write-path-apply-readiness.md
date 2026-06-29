# Taxonomy Observation Write Path Apply Readiness

Phase: 24E-1 - Taxonomy-Linked Observation Write Path Design And Migration Candidate

Status: migration candidate prepared. No remote SQL has been applied.

Phase 24E-2A correction:

- The first preflight draft checked table-level `SELECT` on `public.taxa`.
- Migration `0007` intentionally uses column-level public `SELECT` grants on
  `public.taxa` plus the `"Public can read accepted taxa"` RLS policy.
- The preflight and post-apply checks now verify column-level read readiness
  and the policy instead of requiring table-level `SELECT`.

Phase 24E-2A execute-grant correction:

- The first 0010 apply attempt failed at its own postcondition because `anon`
  could execute `public.create_observation_with_verified_taxonomy(...)`.
- PostgreSQL/Supabase functions can receive default `EXECUTE` privileges, so
  protected functions must explicitly revoke execution from `public`, `anon`,
  and other roles before granting the intended role.
- The old failed attempt is not considered a successful migration.
- The corrected 0010 uses `CREATE OR REPLACE FUNCTION`, explicitly revokes
  execution from `public`, `anon`, and `authenticated`, then grants only the
  taxonomy-linked create RPC back to `authenticated`.
- The internal helper function remains non-public and is not directly
  executable by browser roles.

Phase 24E-2C runtime-expression correction:

- The corrected 0010 was manually applied and its post-apply metadata checks
  passed.
- The first trusted RPC live smoke reached authentication and taxonomy
  resolution, then failed at RPC execution with SQLSTATE `42883`.
- Diagnosis confirmed the 0010 RPC body used `pg_catalog.nullif(...)` and
  `pg_catalog.coalesce(...)`.
- PostgreSQL treats `NULLIF` and `COALESCE` as SQL conditional expressions, not
  ordinary callable `pg_catalog` functions.
- 0010 is now immutable and must not be edited or rerun.
- New migration candidate
  `0011_repair_taxonomy_observation_rpc_runtime_expressions.sql` replaces the
  trusted create RPC body with runtime-valid `nullif(...)` and `coalesce(...)`
  expressions while preserving the same security model and business logic.
- The failed smoke did not create an observation.
- See
  `docs/architecture/taxonomy-observation-rpc-runtime-fix-apply-readiness.md`
  before applying 0011.

Phase 24E-2B smoke after 0011:

- The operator manually applied 0011 and post-apply checks passed.
- A temporary local PowerShell harness let the operator enter the approved test
  credentials outside chat.
- The deployed resolver returned a resolved accepted species result for
  `Taraxacum officinale`.
- The trusted RPC created one approved taxonomy-linked smoke observation.
- Read-only verification confirmed non-null taxonomy linkage and metadata,
  owner content edit, scientific-name edit protection, anonymous RPC denial,
  and preserved taxonomy table write denials.
- Browser visual UI smoke remains PARTIAL; public API compatibility for the
  approved row passed.

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
EXECUTE on the helper from public/anon/authenticated
EXECUTE on the create RPC from public/anon/authenticated before re-grant
```

It then grants:

```text
EXECUTE on public.create_observation_with_verified_taxonomy(...) to authenticated only
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

## Optional Partial-State Diagnostic SQL

Run this only if the previous failed 0010 attempt may have left functions
behind. It is read-only and returns only safe booleans/counts.

```sql
with function_refs as (
  select
    to_regprocedure(
      'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
    ) as create_rpc_oid,
    to_regprocedure('public.normalize_taxonomy_input_key(text)') as helper_oid
)
select
  create_rpc_oid is not null as create_rpc_exists,
  coalesce(has_function_privilege('anon', create_rpc_oid, 'EXECUTE'), false) as anon_can_execute_create_rpc,
  coalesce(has_function_privilege('authenticated', create_rpc_oid, 'EXECUTE'), false) as authenticated_can_execute_create_rpc,
  coalesce((
    select exists (
      select 1
      from pg_proc p
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
      where p.oid = create_rpc_oid
        and acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    )
  ), false) as public_can_execute_create_rpc,
  helper_oid is not null as helper_exists,
  coalesce(has_function_privilege('anon', helper_oid, 'EXECUTE'), false) as anon_can_execute_helper,
  coalesce(has_function_privilege('authenticated', helper_oid, 'EXECUTE'), false) as authenticated_can_execute_helper,
  coalesce((
    select exists (
      select 1
      from pg_proc p
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
      where p.oid = helper_oid
        and acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    )
  ), false) as public_can_execute_helper
from function_refs;
```

Expected safe interpretation:

- The function existence values may be either `true` or `false` before the
  corrected migration is applied.
- If any unsafe execute value is `true`, do not manually revoke it in the
  Dashboard. Apply only the corrected full 0010 after preflight passes.

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
with function_refs as (
  select
    to_regprocedure('public.normalize_taxonomy_input_key(text)') as helper_oid,
    to_regprocedure(
      'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
    ) as create_rpc_oid
),
function_flags as (
  select
    helper_oid,
    create_rpc_oid,
    coalesce((
      select p.prosecdef
      from pg_proc p
      where p.oid = create_rpc_oid
    ), false) as create_rpc_security_definer,
    coalesce((
      select exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
        where split_part(setting, '=', 1) = 'search_path'
          and replace(split_part(setting, '=', 2), '"', '') = ''
      )
      from pg_proc p
      where p.oid = create_rpc_oid
    ), false) as create_rpc_safe_search_path,
    coalesce((
      select exists (
        select 1
        from pg_proc p
        cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
        where p.oid = create_rpc_oid
          and acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
    ), false) as public_can_execute_create_rpc,
    coalesce((
      select exists (
        select 1
        from pg_proc p
        cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
        where p.oid = helper_oid
          and acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
    ), false) as public_can_execute_helper
  from function_refs
)
select
  helper_oid is not null as normalize_helper_exists,
  create_rpc_oid is not null as create_rpc_exists,
  create_rpc_security_definer,
  create_rpc_safe_search_path,
  has_function_privilege(
    'authenticated',
    create_rpc_oid,
    'EXECUTE'
  ) as authenticated_can_execute_create_rpc,
  not has_function_privilege(
    'anon',
    create_rpc_oid,
    'EXECUTE'
  ) as anon_cannot_execute_create_rpc,
  not public_can_execute_create_rpc as public_cannot_execute_create_rpc,
  not has_function_privilege('anon', helper_oid, 'EXECUTE') as anon_cannot_execute_helper,
  not has_function_privilege('authenticated', helper_oid, 'EXECUTE') as authenticated_cannot_execute_helper,
  not public_can_execute_helper as public_cannot_execute_helper,
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
from function_flags, public.observations
group by
  helper_oid,
  create_rpc_oid,
  create_rpc_security_definer,
  create_rpc_safe_search_path,
  public_can_execute_create_rpc,
  public_can_execute_helper;
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
) from anon;

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
) from authenticated;

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

Phase 24E-2 should run a controlled smoke after 0011 is manually applied and
verified:

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
