# Taxonomy Service-Role DELETE Revoke Apply Readiness

Phase: 24C.1 / 24D-2 Unblock - Taxonomy Service-Role DELETE Correction

Status: migration candidate prepared and replayability-corrected. Codex did
not apply remote SQL, did not deploy the Edge Function, and did not change
Production UI.

## Problem Statement

Migration `0008_grant_taxonomy_service_role_access.sql` was manually applied to the Supabase project shared with Production. It fixed the trusted Edge Function service-role access needed for taxonomy cache reads and upserts.

The operator then ran read-only post-apply diagnostics and found that `service_role` still had effective `DELETE` privilege on both taxonomy cache tables.

Confirmed diagnostic result:

| Check | Result |
| --- | --- |
| `service_role_delete_direct_grant` | true |
| `service_role_delete_source_category` | direct_grant |
| anon taxonomy writes denied | true |
| authenticated taxonomy writes denied | true |
| `taxa` public SELECT policy exists | true |
| exact `taxa` policy name exists | true |
| resolution cache public SELECT policy count | 0 |
| resolution cache public policy count | 0 |

Interpretation:

- Browser write denial is still safe.
- `public.taxa` public SELECT policy is present and correctly named.
- `public.taxonomy_name_resolutions` remains server-only.
- The remaining mismatch is a direct `service_role` DELETE grant and can be corrected by a new migration.

## Why 0009 Is Needed

The resolver needs trusted server-side cache access:

- `SELECT` to read cached taxonomy rows.
- `INSERT` to create accepted taxa and successful name-resolution cache rows.
- `UPDATE` for upsert conflict handling.

The resolver does not need `DELETE`.

Migration `0009_revoke_taxonomy_service_role_delete.sql` removes only the unnecessary DELETE privilege while preserving the cache read/upsert path.

## Replayability Correction

After `0009` was manually applied to the shared Supabase database and verified,
local Phase 24D-2 replay found that `supabase db reset --local` stopped at
`0009`.

Cause:

- The original `0009` preflight required `service_role` DELETE to be present
  before the migration ran.
- A clean local replay after `0008` can already have `service_role` DELETE
  absent on both taxonomy cache tables.
- That clean local state is already safe and matches the intended final DELETE
  state.

Correction:

- `0009` now accepts both starting states:
  - DELETE currently present, as observed during the shared-DB post-0008
    diagnosis.
  - DELETE already absent, as observed during clean local replay.
- The final expected state is unchanged: `service_role` keeps
  SELECT/INSERT/UPDATE and does not have DELETE on either taxonomy cache table.
- No remote SQL was run for this replayability correction.
- Because the shared Supabase database already passed the post-0009 checks,
  no further manual correction is needed there for this issue.

## Immutable Migration Rule

Migrations `0007` and `0008` have already been manually applied to the database shared with Production. They must not be edited, rerun, replaced, or retroactively changed.

Any correction must be a new reviewed migration. This document prepares migration `0009`.

## Official Supabase Guidance

Supabase documentation confirms:

- Secret/service-role credentials are server-side only and must never be exposed in frontend code.
- `service_role` bypasses RLS, so it must be handled as a trusted server credential.
- Grants determine whether a role can reach a table through the Data API; RLS policies then determine rows.
- PostgreSQL object privileges can be removed with `REVOKE`.

References:

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/roles
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/functions/secrets

## Migration 0009 Candidate

Expected file:

```text
supabase/migrations/0009_revoke_taxonomy_service_role_delete.sql
```

Objects touched:

- `public.taxa`
- `public.taxonomy_name_resolutions`

Exact grant correction:

```sql
revoke delete
on table public.taxa
from service_role;

revoke delete
on table public.taxonomy_name_resolutions
from service_role;
```

Privileges preserved:

- `service_role` USAGE on schema `public`.
- `service_role` SELECT, INSERT, and UPDATE on `public.taxa`.
- `service_role` SELECT, INSERT, and UPDATE on `public.taxonomy_name_resolutions`.

No change:

- No anon/authenticated grant change.
- No RLS policy change.
- No observation table change.
- No taxonomy row change.
- No Storage, Auth, Admin, Kakao, Vercel, or deployment change.
- No public access to `taxonomy_name_resolutions`.

## Pre-Apply SQL

Run this before applying `0009`. It returns only safe booleans/counts.

```sql
select
  exists(select 1 from pg_roles where rolname = 'service_role') as service_role_exists,
  to_regclass('public.taxa') is not null as taxa_exists,
  to_regclass('public.taxonomy_name_resolutions') is not null as resolution_cache_exists,
  has_table_privilege('service_role', 'public.taxa', 'SELECT') as service_role_taxa_select,
  has_table_privilege('service_role', 'public.taxa', 'INSERT') as service_role_taxa_insert,
  has_table_privilege('service_role', 'public.taxa', 'UPDATE') as service_role_taxa_update,
  has_table_privilege('service_role', 'public.taxa', 'DELETE') as service_role_taxa_delete_before,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'SELECT') as service_role_resolution_select,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'INSERT') as service_role_resolution_insert,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'UPDATE') as service_role_resolution_update,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'DELETE') as service_role_resolution_delete_before,
  not (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
  ) as anon_taxa_write_denied,
  not (
    has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
  ) as authenticated_taxa_write_denied,
  not (
    has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as anon_resolution_write_denied,
  not (
    has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as authenticated_resolution_write_denied,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
      and 'anon'::name = any(roles)
      and 'authenticated'::name = any(roles)
  ) as taxa_public_select_policy_exists,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxonomy_name_resolutions'
      and roles && array['anon'::name, 'authenticated'::name, 'public'::name]
  ) as resolution_public_policy_count;
```

Expected pre-apply result:

- Required role and tables exist.
- `service_role` SELECT/INSERT/UPDATE are true on both tables.
- `service_role` DELETE may be true on one or both tables before correction,
  or already false on both tables during clean local replay.
- anon/authenticated write-denial checks are true.
- `taxa_public_select_policy_exists = true`.
- `resolution_public_policy_count = 0`.

If any required object is missing, browser write access is present, or the
expected public/private policy state differs, stop and do not apply `0009`.
Do not stop merely because service-role DELETE is already false before apply;
that is a valid replay-safe starting state.

## Manual Apply Instructions

1. Open the intended Supabase project privately.
2. Confirm that this is the intended database. It is likely shared with Production.
3. Open SQL Editor.
4. Run the pre-apply SQL once.
5. If the pre-apply values match the expected safe values, open a new query.
6. Paste the complete `0009_revoke_taxonomy_service_role_delete.sql`.
7. Do not edit the SQL inside the Dashboard.
8. Click Run exactly once.
9. If an error appears, stop. Do not retry repeatedly and do not run rollback automatically.
10. Report only a redacted safe error summary.

After successful apply, migration `0009` is immutable too. Future corrections require a new migration.

## Post-Apply SQL

Run after successful manual apply.

```sql
select
  has_schema_privilege('service_role', 'public', 'USAGE') as service_role_public_usage,
  has_table_privilege('service_role', 'public.taxa', 'SELECT') as service_role_taxa_select,
  has_table_privilege('service_role', 'public.taxa', 'INSERT') as service_role_taxa_insert,
  has_table_privilege('service_role', 'public.taxa', 'UPDATE') as service_role_taxa_update,
  has_table_privilege('service_role', 'public.taxa', 'DELETE') as service_role_taxa_delete,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'SELECT') as service_role_resolution_select,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'INSERT') as service_role_resolution_insert,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'UPDATE') as service_role_resolution_update,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'DELETE') as service_role_resolution_delete,
  not (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
  ) as anon_taxa_write_denied,
  not (
    has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
  ) as authenticated_taxa_write_denied,
  not (
    has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as anon_resolution_access_denied,
  not (
    has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) as authenticated_resolution_access_denied,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
      and 'anon'::name = any(roles)
      and 'authenticated'::name = any(roles)
  ) as taxa_public_select_policy_exists,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxonomy_name_resolutions'
      and roles && array['anon'::name, 'authenticated'::name, 'public'::name]
  ) as resolution_public_policy_count,
  (select relrowsecurity from pg_class where oid = 'public.taxa'::regclass) as taxa_rls_enabled,
  (select relrowsecurity from pg_class where oid = 'public.taxonomy_name_resolutions'::regclass) as resolution_rls_enabled;
```

Expected post-apply result:

- `service_role_public_usage = true`.
- service_role SELECT/INSERT/UPDATE are true on both taxonomy tables.
- service_role DELETE is false on both taxonomy tables.
- anon/authenticated taxonomy writes remain denied.
- anon/authenticated cannot access `taxonomy_name_resolutions`.
- `taxa_public_select_policy_exists = true`.
- `resolution_public_policy_count = 0`.
- RLS remains enabled on both taxonomy tables.

## Rollback Guidance

Rollback should be considered only for a confirmed unexpected issue immediately after applying `0009`.

Normal resolver operation should not require DELETE. Do not re-grant DELETE just because the table is empty or because the resolver has not been deployed yet.

Immediate rollback, only if explicitly chosen:

```sql
begin;

grant delete
on table public.taxa
to service_role;

grant delete
on table public.taxonomy_name_resolutions
to service_role;

commit;
```

Do not weaken anon/authenticated permissions. Do not change RLS as rollback. Do not delete observations or taxonomy rows.

After taxonomy data exists, prefer a new corrective migration rather than ad hoc rollback.

## Next Step After Apply

After `0009` is manually applied and verified, or after replay-safe local
reset confirms the same final state:

```text
Resume Phase 24D-2 local resolver smoke.
```

Phase 24D-2 remains blocked until:

- `service_role` DELETE is false on both taxonomy cache tables.
- service_role SELECT/INSERT/UPDATE remain true.
- browser taxonomy writes remain denied.
- the resolver cache tables retain the intended public/server-only policy split.

No Edge Function deployment should occur until the separate Phase 24D-3 deployment step is explicitly started.
