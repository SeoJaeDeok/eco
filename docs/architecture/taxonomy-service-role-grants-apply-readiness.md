# Taxonomy Service-Role Grants Apply Readiness

Phase: 24C.1 / 24D-2 Unblock - Taxonomy Service-Role Grants And Resolver Access Diagnosis

Status: migration candidate prepared and locally verified. Codex did not apply remote SQL, did not deploy an Edge Function, and did not change Production.

## Problem Statement

Phase 24D-2 local resolver smoke reached the trusted Edge Function path, but authenticated resolver requests stopped before GBIF with a safe domain result of `database_failure`.

Local diagnosis showed that PostgREST access to these tables failed with HTTP 403 and SQL reason `42501`:

- `public.taxa`
- `public.taxonomy_name_resolutions`

The failure happened before any taxonomy row was created and before observation taxonomy linkage was written.

## Why 0007 Is Immutable

Migration `0007_create_taxonomy_schema.sql` has already been manually applied to the Supabase database shared with Production. It must not be edited, rerun, replaced, or retroactively changed.

Any database correction must be a separately reviewed new migration. This unblock therefore creates `0008_grant_taxonomy_service_role_access.sql`.

## Official Supabase Guidance Checked

Official Supabase docs confirm these points:

- Edge Functions can use server-only secret/service credentials, but these must never be used in browser code.
- User JWTs arrive through the `Authorization` header for authenticated function calls.
- A service/admin client must be separate from a user-scoped client.
- If a user JWT overwrites the service client's `Authorization` header, the service client will no longer behave as intended.
- Service-role bypasses RLS, but SQL table privileges still must permit the operation path.

References:

- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z

## Diagnosis Method

Code inspection checked the Edge Function client construction.

Local database checks used only the local Supabase stack. No remote SQL was run.

Safe local checks returned booleans/counts only. No local keys, JWTs, user emails, project references, source taxon keys, row contents, or URLs are recorded here.

## Admin Client Construction Result

Result: PASS.

Findings:

- The user JWT is used only inside `authenticateRequest()` for caller validation.
- The user-scoped client is created with the anon key and the request `Authorization` header.
- The admin client is created separately with `SUPABASE_SERVICE_ROLE_KEY`.
- The admin client does not set `Authorization: Bearer <user jwt>`.
- No `VITE_*` value is used for service/admin access.
- The service credential is read only from the Edge Function runtime environment.
- The function does not intentionally log JWTs or secret values.

No code fix was required for client separation.

## Grant Diagnosis Result Before 0008

Local checks after applying migrations `0001` through `0007` showed:

| Check | Result |
| --- | --- |
| `service_role` exists | PASS |
| `service_role` has schema `public` USAGE | PASS |
| `service_role` SELECT on `public.taxa` | FAIL |
| `service_role` INSERT on `public.taxa` | FAIL |
| `service_role` UPDATE on `public.taxa` | FAIL |
| `service_role` DELETE on `public.taxa` | PASS, correctly absent |
| `service_role` SELECT on `public.taxonomy_name_resolutions` | FAIL |
| `service_role` INSERT on `public.taxonomy_name_resolutions` | FAIL |
| `service_role` UPDATE on `public.taxonomy_name_resolutions` | FAIL |
| `service_role` DELETE on `public.taxonomy_name_resolutions` | PASS, correctly absent |
| anon/authenticated write access to taxonomy tables | PASS, denied |
| `taxa` public read policy | PASS, unchanged |
| resolution cache public policies | PASS, none |
| RLS enabled on both taxonomy tables | PASS |

Conclusion: the blocker is missing `service_role` grants, not incorrect admin client construction.

## Migration 0008 Candidate

Expected filename:

```text
supabase/migrations/0008_grant_taxonomy_service_role_access.sql
```

Objects changed:

- schema `public`
- table `public.taxa`
- table `public.taxonomy_name_resolutions`

Exact grants introduced:

```sql
grant usage on schema public to service_role;

grant select, insert, update
on table public.taxa
to service_role;

grant select, insert, update
on table public.taxonomy_name_resolutions
to service_role;
```

DELETE is not granted.

No new privileges are granted to `anon` or `authenticated`.

No RLS policy is changed.

No sequence grants are added because the taxonomy tables use UUID defaults, not sequence-backed identity columns. The migration preflight raises an exception if an unexpected sequence-backed taxonomy column is found.

## Local Verification After 0008

Local-only reset applying migrations `0001` through `0008` passed.

Safe grant checks after local apply showed:

| Check | Result |
| --- | --- |
| `service_role` schema USAGE | PASS |
| `service_role` SELECT/INSERT/UPDATE on `public.taxa` | PASS |
| `service_role` DELETE on `public.taxa` | PASS, still absent |
| `service_role` SELECT/INSERT/UPDATE on `public.taxonomy_name_resolutions` | PASS |
| `service_role` DELETE on `public.taxonomy_name_resolutions` | PASS, still absent |
| anon/authenticated public taxonomy read readiness | PASS |
| anon/authenticated taxonomy write denial | PASS |
| public access to resolution cache remains denied | PASS |
| `taxa` public SELECT policy count remains 1 | PASS |
| resolution-cache public policy count remains 0 | PASS |
| RLS remains enabled on both tables | PASS |
| local PostgREST service-role SELECT from both tables | PASS |

This verifies the migration candidate locally only. It has not been applied remotely.

## Pre-Apply SQL

Run this in the intended Supabase SQL Editor before applying `0008`. It returns safe booleans only.

```sql
select
  exists(select 1 from pg_roles where rolname = 'service_role') as service_role_exists,
  to_regclass('public.taxa') is not null as taxa_exists,
  to_regclass('public.taxonomy_name_resolutions') is not null as resolution_cache_exists,
  has_schema_privilege('service_role', 'public', 'USAGE') as service_role_public_usage_before,
  has_table_privilege('service_role', 'public.taxa', 'SELECT') as service_role_taxa_select_before,
  has_table_privilege('service_role', 'public.taxa', 'INSERT') as service_role_taxa_insert_before,
  has_table_privilege('service_role', 'public.taxa', 'UPDATE') as service_role_taxa_update_before,
  has_table_privilege('service_role', 'public.taxa', 'DELETE') as service_role_taxa_delete_before,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'SELECT') as service_role_resolution_select_before,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'INSERT') as service_role_resolution_insert_before,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'UPDATE') as service_role_resolution_update_before,
  has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'DELETE') as service_role_resolution_delete_before,
  not has_table_privilege('anon', 'public.taxa', 'INSERT') as anon_taxa_insert_denied,
  not has_table_privilege('authenticated', 'public.taxa', 'INSERT') as authenticated_taxa_insert_denied,
  not has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'SELECT') as anon_resolution_select_denied,
  not has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'SELECT') as authenticated_resolution_select_denied;
```

Expected pre-apply result:

- Required objects exist.
- `service_role` SELECT/INSERT/UPDATE on the two taxonomy tables are likely false before 0008.
- `service_role` DELETE remains false.
- Browser write/read denial checks remain true where expected.

If a required table or role is missing, stop and do not apply 0008.

## Manual Apply Instructions

1. Open the intended Supabase project privately.
2. Confirm whether this is the shared Production database.
3. Open SQL Editor.
4. Create a new query.
5. Paste the complete contents of `supabase/migrations/0008_grant_taxonomy_service_role_access.sql`.
6. Do not edit the SQL inside the Dashboard.
7. Click Run exactly once.
8. If an error appears, stop. Do not retry repeatedly and do not change live grants manually.
9. Report only the safe error summary with URLs, keys, tokens, emails, project refs, and row data removed.

After successful manual apply, migration 0008 is immutable too. Future DB corrections require a new migration.

## Post-Apply SQL

Run after a successful manual apply.

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
  has_column_privilege('anon', 'public.taxa', 'id', 'SELECT') as anon_taxa_id_select,
  has_column_privilege('authenticated', 'public.taxa', 'id', 'SELECT') as authenticated_taxa_id_select,
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
  (select relrowsecurity from pg_class where oid = 'public.taxa'::regclass) as taxa_rls_enabled,
  (select relrowsecurity from pg_class where oid = 'public.taxonomy_name_resolutions'::regclass) as resolution_rls_enabled,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'taxa' and policyname = 'Public can read accepted taxa') as taxa_public_read_policy_count,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'taxonomy_name_resolutions') as resolution_public_policy_count;
```

Expected post-apply result:

- `service_role_public_usage = true`
- service_role SELECT/INSERT/UPDATE on both taxonomy tables are true
- service_role DELETE on both taxonomy tables is false
- anon/authenticated taxonomy writes remain denied
- anon/authenticated cannot access `taxonomy_name_resolutions`
- RLS remains enabled
- `taxa_public_read_policy_count = 1`
- `resolution_public_policy_count = 0`

## Rollback Guidance

Rollback is only for an immediate confirmed problem after applying 0008 and before relying on resolver cache writes.

Do not delete observations. Do not drop taxonomy tables. Do not weaken RLS.

Immediate rollback block:

```sql
begin;

revoke select, insert, update
on table public.taxonomy_name_resolutions
from service_role;

revoke select, insert, update
on table public.taxa
from service_role;

commit;
```

Do not revoke schema USAGE casually because other Supabase internals or future reviewed server paths may depend on it. If a broader rollback is required after data exists, write a new corrective migration instead of manual ad hoc changes.

## Local Smoke Retry Plan

After 0008 is manually applied to the target DB, resume Phase 24D-2 locally:

1. Start local Supabase stack.
2. Reset local DB with migrations through 0008.
3. Confirm service-role PostgREST reads for `taxa` and `taxonomy_name_resolutions` pass.
4. Serve or otherwise run `resolve-taxonomy` locally.
5. Retry the authenticated resolver matrix.
6. Continue to cache/duplicate/RLS checks only after exact lookup reaches GBIF or cache successfully.

## Production / Live DB Caution

The target database is shared with Production. Applying 0008 is a live database permission change, even though it should not visually change the current site.

Apply during a low-traffic period and run the post-apply checks immediately.

No app deployment is required for 0008 alone.
