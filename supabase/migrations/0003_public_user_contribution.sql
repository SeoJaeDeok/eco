-- Public user contribution DB/RLS apply-ready migration candidate.
-- DO NOT APPLY WITHOUT AN APPROVED 20E APPLY/TEST WINDOW.
--
-- This file was promoted from the reviewed phase 20C/20C.5 SQL draft during
-- 20E-prep. It has not been applied to any Supabase project by Codex.
-- Apply only after explicit approval and together with the 20E frontend and
-- repository changes that create authenticated approved observations.
--
-- 20E-prep placement decision:
-- - The historical draft remains under docs/architecture/sql-drafts/.
-- - This migration file is the apply-ready candidate for a future approved
--   20E manual apply/test window.
-- - Because files in supabase/migrations/ can be applied by migration tooling,
--   do not run migration tooling against a real project until the checklist in
--   docs/architecture/public-user-contribution-rls-plan.md is satisfied.
--
-- Goals:
-- - Add public user display-name and observation ownership columns.
-- - Keep public reads approved-only.
-- - Transition from anonymous pending insert to authenticated own approved insert.
-- - Keep admin all-read/all-update review policies.
-- - Keep signed/public/blob/data URLs out of database rows.
--
-- Non-goals:
-- - No image replacement workflow.
-- - No public profile directory.
-- - No service role key usage.
-- - No Storage object deletion.
-- - No live SQL application from this repository file alone.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists display_name text;

alter table public.observations
  add column if not exists observer_id uuid references public.profiles(id) on delete set null,
  add column if not exists observer_display_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_display_name_not_blank'
  ) then
    alter table public.profiles
      add constraint profiles_display_name_not_blank
      check (display_name is null or char_length(trim(display_name)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_observer_display_name_not_blank'
  ) then
    alter table public.observations
      add constraint observations_observer_display_name_not_blank
      check (observer_display_name is null or char_length(trim(observer_display_name)) > 0);
  end if;
end $$;

create index if not exists observations_observer_id_idx
  on public.observations (observer_id)
  where observer_id is not null;

create index if not exists observations_observer_status_idx
  on public.observations (observer_id, status, observed_date desc)
  where observer_id is not null;

-- The existing public.set_updated_at() trigger from 0001 already covers
-- profiles.updated_at and observations.updated_at. No new trigger is needed.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Target grant model for the public-user contribution phase.
-- This intentionally removes anonymous insert privileges. Do not apply before
-- the public login UI and authenticated create flow are ready.

grant usage on schema public to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select (
  id,
  role,
  display_name,
  created_at,
  updated_at
) on public.profiles to authenticated;
grant update (
  display_name
) on public.profiles to authenticated;

revoke all on public.observations from anon, authenticated;
grant select on public.observations to anon, authenticated;

grant insert (
  name,
  scientific_name,
  taxon,
  location,
  observed_date,
  description,
  latitude,
  longitude,
  image_path,
  image_mime_type,
  image_size_bytes,
  status,
  observer_id,
  observer_display_name
) on public.observations to authenticated;

grant update (
  name,
  scientific_name,
  taxon,
  location,
  observed_date,
  description,
  latitude,
  longitude,
  status
) on public.observations to authenticated;

-- No delete grant is included in the public-user MVP target. Admin delete
-- should remain a separately approved cleanup/governance decision.

-- ---------------------------------------------------------------------------
-- Profile RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can update own display name" on public.profiles;
create policy "Users can update own display name"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Observation RLS
-- ---------------------------------------------------------------------------

alter table public.observations enable row level security;

-- Public screens remain approved-only. Pending/rejected rows must not appear in
-- public list/detail for anon or non-admin authenticated users.
drop policy if exists "Public can read approved observations" on public.observations;
create policy "Public can read approved observations"
on public.observations
for select
to anon, authenticated
using (status = 'approved');

-- Target transition: anonymous pending insert is disabled.
-- Drop the previous phase policy only when the 20D/20E UI/repository changes
-- are ready and this migration is explicitly approved.
drop policy if exists "Public can create pending observations" on public.observations;

-- Authenticated users can create only their own approved observations.
-- This policy assumes contributor accounts are controlled outside the public
-- frontend for the MVP. If open self-sign-up is enabled later, add a contributor
-- role or another abuse gate before using this direct-approved path.
drop policy if exists "Authenticated users can create own approved observations" on public.observations;
create policy "Authenticated users can create own approved observations"
on public.observations
for insert
to authenticated
with check (
  observer_id = auth.uid()
  and status = 'approved'
  and image_url is null
  and (
    observer_display_name is null
    or observer_display_name = (
      select profiles.display_name
      from public.profiles
      where profiles.id = auth.uid()
    )
  )
);

-- Owner update MVP: text and location metadata only. Column-level grants exclude
-- observer_id, observer_display_name, image_url, image_path, image_mime_type,
-- and image_size_bytes. The status column is granted so admin status updates
-- can continue, but this owner policy requires the new row to remain approved.
drop policy if exists "Owners can update own approved observation content" on public.observations;
create policy "Owners can update own approved observation content"
on public.observations
for update
to authenticated
using (
  observer_id = auth.uid()
  and status = 'approved'
)
with check (
  observer_id = auth.uid()
  and status = 'approved'
  and image_url is null
);

drop policy if exists "Admins can read all observations" on public.observations;
create policy "Admins can read all observations"
on public.observations
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update observations" on public.observations;
create policy "Admins can update observations"
on public.observations
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'approved', 'rejected')
  and image_url is null
);

-- Optional future policy, intentionally not active:
-- If a "my observations" page needs to show owner pending/rejected rows later,
-- add a separate owner-select policy after UI requirements are approved.
--
-- create policy "Owners can read own observations"
-- on public.observations
-- for select
-- to authenticated
-- using (observer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage upload policy candidate
-- ---------------------------------------------------------------------------
-- 0002 already defines private bucket setup plus approved public/admin image
-- read policies. This candidate transitions upload from anonymous pending paths
-- to authenticated owner paths. Apply only with matching app upload-path changes.

drop policy if exists "Public can upload pending observation images" on storage.objects;
drop policy if exists "Authenticated users can upload pending observation images" on storage.objects;

drop policy if exists "Authenticated users can upload own observation images" on storage.objects;
create policy "Authenticated users can upload own observation images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'observation-images'
  and name ~* ('^observations/' || auth.uid()::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
);

-- No storage.objects update/delete policy is added. Upload remains insert-only.
