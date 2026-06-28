-- Phase 24C.1 / 24D-2 unblock: remove unnecessary service_role DELETE.
-- MANUAL APPLY REQUIRED. Codex must not apply this migration remotely.
--
-- Scope:
-- - Keep trusted Edge Function cache reads and upserts working.
-- - Remove DELETE from service_role on taxonomy cache tables.
-- - Keep browser roles unable to write authoritative taxonomy data.
--
-- Non-goals:
-- - No taxonomy data change.
-- - No observation data change.
-- - No RLS policy change.
-- - No anon/authenticated grant change.
-- - No Storage, Auth, Admin, Kakao, Vercel, or deployment change.

begin;

-- ---------------------------------------------------------------------------
-- Preflight checks
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'Phase 24C.1 preflight failed: role service_role does not exist.';
  end if;

  if to_regclass('public.taxa') is null then
    raise exception 'Phase 24C.1 preflight failed: public.taxa does not exist. Apply 0007 first.';
  end if;

  if to_regclass('public.taxonomy_name_resolutions') is null then
    raise exception 'Phase 24C.1 preflight failed: public.taxonomy_name_resolutions does not exist. Apply 0007 first.';
  end if;

  if not (
    has_table_privilege('service_role', 'public.taxa', 'SELECT')
    and has_table_privilege('service_role', 'public.taxa', 'INSERT')
    and has_table_privilege('service_role', 'public.taxa', 'UPDATE')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'SELECT')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'INSERT')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'UPDATE')
  ) then
    raise exception 'Phase 24C.1 preflight failed: service_role must keep SELECT/INSERT/UPDATE on taxonomy cache tables from 0008.';
  end if;

  if not (
    has_table_privilege('service_role', 'public.taxa', 'DELETE')
    or has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'DELETE')
  ) then
    raise exception 'Phase 24C.1 preflight failed: service_role DELETE is already absent on both taxonomy cache tables.';
  end if;

  if (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) then
    raise exception 'Phase 24C.1 preflight failed: browser taxonomy write access is unexpectedly present.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
      and 'anon'::name = any(roles)
      and 'authenticated'::name = any(roles)
  ) then
    raise exception 'Phase 24C.1 preflight failed: public taxa SELECT policy is missing or changed.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxonomy_name_resolutions'
      and roles && array['anon'::name, 'authenticated'::name, 'public'::name]
  ) then
    raise exception 'Phase 24C.1 preflight failed: resolution cache has an unexpected public policy.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Trusted server grant correction
-- ---------------------------------------------------------------------------

-- The resolve-taxonomy Edge Function needs server-only SELECT/INSERT/UPDATE
-- for cache reads and upserts. It does not need DELETE. The service-role
-- credential must stay server-only and must never be exposed to browser code,
-- VITE_* variables, logs, or documentation.
revoke delete
on table public.taxa
from service_role;

revoke delete
on table public.taxonomy_name_resolutions
from service_role;

-- ---------------------------------------------------------------------------
-- Postcondition checks
-- ---------------------------------------------------------------------------

do $$
begin
  if not (
    has_table_privilege('service_role', 'public.taxa', 'SELECT')
    and has_table_privilege('service_role', 'public.taxa', 'INSERT')
    and has_table_privilege('service_role', 'public.taxa', 'UPDATE')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'SELECT')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'INSERT')
    and has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'UPDATE')
  ) then
    raise exception 'Phase 24C.1 postcondition failed: service_role SELECT/INSERT/UPDATE was not preserved.';
  end if;

  if (
    has_table_privilege('service_role', 'public.taxa', 'DELETE')
    or has_table_privilege('service_role', 'public.taxonomy_name_resolutions', 'DELETE')
  ) then
    raise exception 'Phase 24C.1 postcondition failed: service_role still has DELETE after revoke. Stop and investigate role inheritance or ownership before continuing.';
  end if;

  if (
    has_table_privilege('anon', 'public.taxa', 'INSERT')
    or has_table_privilege('anon', 'public.taxa', 'UPDATE')
    or has_table_privilege('anon', 'public.taxa', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxa', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxa', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxa', 'DELETE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('anon', 'public.taxonomy_name_resolutions', 'DELETE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'INSERT')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.taxonomy_name_resolutions', 'DELETE')
  ) then
    raise exception 'Phase 24C.1 postcondition failed: browser taxonomy write access is unexpectedly present.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxa'
      and policyname = 'Public can read accepted taxa'
      and cmd = 'SELECT'
      and 'anon'::name = any(roles)
      and 'authenticated'::name = any(roles)
  ) then
    raise exception 'Phase 24C.1 postcondition failed: public taxa SELECT policy is missing or changed.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'taxonomy_name_resolutions'
      and roles && array['anon'::name, 'authenticated'::name, 'public'::name]
  ) then
    raise exception 'Phase 24C.1 postcondition failed: resolution cache has an unexpected public policy.';
  end if;
end $$;

commit;
