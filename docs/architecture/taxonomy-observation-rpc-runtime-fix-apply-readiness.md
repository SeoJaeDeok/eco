# Taxonomy Observation RPC Runtime Fix Apply Readiness

Phase: 24E-2C - Repair Taxonomy Observation RPC Runtime Expressions

Status: migration applied and verified by operator. Trusted RPC create smoke
was rerun after this repair.

## Problem Statement

The corrected `0010_create_taxonomy_observation_write_path.sql` migration was
manually applied to the Supabase project shared with Production and passed its
post-apply metadata checks. The later trusted RPC live smoke reached:

- approved user authentication
- deployed `resolve-taxonomy`
- accepted plant taxonomy resolution

The smoke then failed when executing
`public.create_observation_with_verified_taxonomy(...)`.

Safe failure category:

```text
SQLSTATE 42883
```

Root cause:

- The 0010 RPC body used `pg_catalog.nullif(...)`.
- The 0010 RPC body used `pg_catalog.coalesce(...)`.
- PostgreSQL documents `NULLIF` and `COALESCE` under conditional expressions.
  They are valid SQL expressions, but they are not ordinary callable
  `pg_catalog` functions.
- Runtime calls such as `pg_catalog.nullif(text,text)` and
  `pg_catalog.coalesce(text,text)` therefore fail.

Confirmed safe metadata:

- `auth.uid()` exists.
- `public.normalize_taxonomy_input_key(text)` exists.
- `pg_catalog.btrim(text)` exists.
- `pg_catalog.lower(text)` exists.
- `pg_catalog.nullif(text,text)` does not exist.
- `pg_catalog.coalesce(text,text)` does not exist.

## Why 0010 Is Immutable

Migration 0010 has already been manually applied to the shared Supabase DB.
It must not be edited, rerun, or replaced. The correction must be a new
immutable migration.

## Migration

Filename:

```text
supabase/migrations/0011_repair_taxonomy_observation_rpc_runtime_expressions.sql
```

Objects affected:

```text
public.create_observation_with_verified_taxonomy(
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
)
```

Objects checked/preserved:

```text
public.normalize_taxonomy_input_key(text)
public.observations
public.profiles
public.taxa
public.taxonomy_name_resolutions
public.guard_observation_edit_fields()
```

## What 0011 Changes

0011 uses `CREATE OR REPLACE FUNCTION` for the trusted create RPC with the same
signature and the same business rules as 0010.

It replaces only runtime-invalid expressions:

```text
pg_catalog.nullif(...)   -> nullif(...)
pg_catalog.coalesce(...) -> coalesce(...)
```

It intentionally keeps valid safe qualifications such as:

```text
pg_catalog.btrim(...)
pg_catalog.lower(...)
pg_catalog.char_length(...)
pg_catalog.regexp_replace(...)
```

It re-converges function execution privileges:

- helper function: no direct execute for `public`, `anon`, or `authenticated`
- create RPC: no execute for `public` or `anon`
- create RPC: execute granted to `authenticated`

## What 0011 Does Not Change

0011 does not:

- modify observation rows
- delete observation rows
- backfill taxonomy
- alter table schemas
- change RLS policies
- grant browser taxonomy table writes
- expose `taxonomy_name_resolutions`
- change Storage policies
- change Auth, Admin, Kakao, Vercel, or UI behavior
- deploy or change the `resolve-taxonomy` Edge Function

## Security Model Preserved

The trusted create RPC still:

- requires a signed-in user through `auth.uid()`
- uses `SECURITY DEFINER`
- uses locked `search_path = ''`
- checks the user's profile
- checks the accepted taxon in trusted `public.taxa`
- checks the reported scientific name against trusted
  `public.taxonomy_name_resolutions`
- sets `observer_id`, `status`, `taxon_id`, `taxonomy_match_type`,
  `taxonomy_confidence`, and `taxonomy_verified_at` inside the database
- rejects client-supplied arbitrary lineage, status, observer, role, verified
  timestamp, or taxonomy confidence

## Pre-Apply SQL

Run this before applying 0011. It returns only safe booleans/counts.

```sql
with function_refs as (
  select
    to_regprocedure('public.normalize_taxonomy_input_key(text)') as helper_oid,
    to_regprocedure(
      'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
    ) as create_rpc_oid
)
select
  to_regclass('public.observations') is not null as observations_exists,
  to_regclass('public.profiles') is not null as profiles_exists,
  to_regclass('public.taxa') is not null as taxa_exists,
  to_regclass('public.taxonomy_name_resolutions') is not null as resolution_cache_exists,
  to_regprocedure('auth.uid()') is not null as auth_uid_exists,
  helper_oid is not null as helper_exists,
  create_rpc_oid is not null as create_rpc_exists,
  to_regprocedure('public.guard_observation_edit_fields()') is not null as edit_guard_exists,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'observations'
      and column_name in (
        'taxon_id',
        'taxonomy_match_type',
        'taxonomy_confidence',
        'taxonomy_verified_at'
      )
    group by table_schema, table_name
    having count(*) = 4
  ) as observation_taxonomy_columns_exist,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
      and cmd = 'SELECT'
  ) as approved_only_policy_present,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Owners can update own approved observation content'
      and cmd = 'UPDATE'
  ) as owner_update_policy_present,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Admins can update observations'
      and cmd = 'UPDATE'
  ) as admin_update_policy_present,
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
  not (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as browser_taxonomy_cache_access_denied
from function_refs;
```

Expected result:

- every value should be `true`

If any value is false:

- stop
- do not apply 0011
- do not edit SQL manually in the Dashboard
- report only the failed safe boolean name

## Manual Apply Instructions

1. Open the intended Supabase project.
2. Go to SQL Editor.
3. Run the pre-apply SQL once.
4. If every value is `true`, open a new query.
5. Paste the full contents of
   `supabase/migrations/0011_repair_taxonomy_observation_rpc_runtime_expressions.sql`.
6. Click Run exactly once.
7. If it succeeds, open another new query.
8. Run the post-apply SQL once.
9. Do not retry repeatedly.
10. Do not edit SQL in the Dashboard.
11. Do not run rollback unless a confirmed immediate issue occurs and the
    operator explicitly decides to roll back.

## Post-Apply SQL

Run this after 0011 applies. It returns only safe booleans/counts.

```sql
with function_refs as (
  select
    to_regprocedure('public.normalize_taxonomy_input_key(text)') as helper_oid,
    to_regprocedure(
      'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)'
    ) as create_rpc_oid
),
function_status as (
  select
    helper_oid,
    create_rpc_oid,
    pg_get_functiondef(create_rpc_oid::oid) as create_definition,
    exists (
      select 1
      from pg_proc p
      where p.oid = create_rpc_oid
        and p.prosecdef
    ) as create_rpc_security_definer,
    exists (
      select 1
      from pg_proc p
      where p.oid = create_rpc_oid
        and exists (
          select 1
          from unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
          where split_part(setting, '=', 1) = 'search_path'
            and replace(split_part(setting, '=', 2), '"', '') = ''
        )
    ) as create_rpc_safe_search_path,
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
  helper_oid is not null as helper_exists,
  create_rpc_oid is not null as create_rpc_exists,
  create_rpc_security_definer,
  create_rpc_safe_search_path,
  lower(create_definition) not like '%pg_catalog.nullif(%' as create_rpc_has_no_pg_catalog_nullif,
  lower(create_definition) not like '%pg_catalog.coalesce(%' as create_rpc_has_no_pg_catalog_coalesce,
  has_function_privilege('authenticated', create_rpc_oid, 'EXECUTE') as authenticated_can_execute_create_rpc,
  not has_function_privilege('anon', create_rpc_oid, 'EXECUTE') as anon_cannot_execute_create_rpc,
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
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Public can read approved observations'
      and cmd = 'SELECT'
  ) as approved_only_policy_present,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Owners can update own approved observation content'
      and cmd = 'UPDATE'
  ) as owner_update_policy_present,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observations'
      and policyname = 'Admins can update observations'
      and cmd = 'UPDATE'
  ) as admin_update_policy_present
from function_status;
```

Expected result:

- every value should be `true`

## Rollback Guidance

Do not run rollback just because the RPC is unused.

Rollback is only for a confirmed immediate issue. It should not delete
observations, delete taxonomy cache rows, weaken RLS, or grant browser taxonomy
writes.

Emergency rollback concept:

- Restore the previous 0010 function body only as a deliberate emergency step.
- Revoke execute from `public` and `anon`.
- Grant execute only to `authenticated`.
- Keep helper execution denied.

After any successful smoke or data creation, prefer a new corrective migration
over dropping or restoring objects.

## Smoke Retry Plan

After 0011 is manually applied and post-apply checks pass:

1. Rerun Phase 24E-2B trusted RPC live smoke.
2. Use an approved signed-in test user.
3. Resolve `Taraxacum officinale` through the deployed resolver.
4. Call `create_observation_with_verified_taxonomy(...)` with the returned
   trusted `taxonId`.
5. Confirm one approved observation is created with non-null taxonomy linkage.
6. Confirm direct browser taxonomy writes remain denied.
7. Confirm Upload UI remains unintegrated until Phase 24E-3.

## Remote Status

The operator manually applied 0011 to the Supabase project shared with
Production and reported all post-apply checks as passing. 0011 is now
immutable and must not be edited, rerun, or replaced.

After 0011, Phase 24E-2B trusted RPC smoke created one approved taxonomy-linked
observation through `public.create_observation_with_verified_taxonomy(...)`.
The create, DB verification, owner content edit, scientific-name edit
protection, anonymous RPC denial, and taxonomy permission checks passed. The
browser visual UI check remains PARTIAL and should be covered before or during
Phase 24E-3.
