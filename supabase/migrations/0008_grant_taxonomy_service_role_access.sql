-- Phase 24C.1 / 24D-2 unblock: grant trusted taxonomy cache access to service_role.
-- MANUAL APPLY REQUIRED. Codex must not apply this migration remotely.
--
-- Scope:
-- - Allow the trusted Supabase Edge Function service-role client to read and
--   upsert the taxonomy cache tables created by migration 0007.
-- - Keep browser roles unable to write authoritative taxonomy data.
--
-- Non-goals:
-- - No taxonomy data backfill.
-- - No observation data change.
-- - No DELETE grant.
-- - No RLS policy change.
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

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.taxa'::regclass
      and conname = 'taxa_source_identity_key'
  ) then
    raise exception 'Phase 24C.1 preflight failed: taxa_source_identity_key is missing.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.taxonomy_name_resolutions'::regclass
      and conname = 'taxonomy_name_resolutions_source_input_key'
  ) then
    raise exception 'Phase 24C.1 preflight failed: taxonomy_name_resolutions_source_input_key is missing.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('taxa', 'taxonomy_name_resolutions')
      and (
        is_identity = 'YES'
        or column_default like 'nextval(%'
      )
  ) then
    raise exception 'Phase 24C.1 preflight failed: unexpected sequence-backed taxonomy column found. Review sequence grants before applying.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Trusted server grants
-- ---------------------------------------------------------------------------

-- The service-role key is server-only. It must be used only inside trusted
-- server code such as the resolve-taxonomy Edge Function, never in browser code
-- or VITE_* environment variables.
grant usage on schema public to service_role;

grant select, insert, update
on table public.taxa
to service_role;

grant select, insert, update
on table public.taxonomy_name_resolutions
to service_role;

comment on table public.taxa is
  'Accepted terminal taxonomy cache. Source keys are text because GBIF/COL XR keys are not guaranteed numeric. Trusted service-role server code may read and upsert this cache; browser roles must not write it.';

comment on table public.taxonomy_name_resolutions is
  'Server-only cache for successful accepted name resolutions. Trusted service-role server code may read and upsert this cache; browser roles must not read or write it.';

commit;
