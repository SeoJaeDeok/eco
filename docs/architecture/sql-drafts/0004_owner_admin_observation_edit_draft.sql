-- DRAFT ONLY, NOT APPLIED.
-- Do not run without explicit approval and a 20H.5 apply-readiness review.
--
-- Purpose:
-- - Draft owner/admin observation edit DB/RLS field protection.
-- - Keep public reads approved-only.
-- - Keep pending/rejected observations hidden from public list/detail.
-- - Keep image replacement out of scope.
-- - Keep signed/public/blob/data URLs out of image_url.
--
-- Placement:
-- - This file intentionally lives in docs/architecture/sql-drafts/.
-- - Do not place this draft in supabase/migrations/ until it is approved as
--   an apply-ready migration candidate.
--
-- Assumptions:
-- - 0001_create_observation_schema.sql exists.
-- - 0002_create_observation_storage.sql exists.
-- - 0003_public_user_contribution.sql has been reviewed/applied before this
--   draft is promoted.
-- - public.set_updated_at() already exists and observations_set_updated_at
--   already maintains public.observations.updated_at.
--
-- Security notes:
-- - No service-role key is required or allowed in frontend code.
-- - Admin authorization continues to use public.is_admin().
-- - Owner authorization uses observations.observer_id = auth.uid().

begin;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Tighten direct update privileges for the Supabase authenticated API role.
-- The public frontend may update content/location fields only. The status
-- column remains granted so existing admin repository status updates can work,
-- but RLS and the trigger below prevent non-admin status changes.
--
-- Protected fields intentionally not granted for update:
-- - observer_id
-- - observer_display_name
-- - image_path
-- - image_mime_type
-- - image_size_bytes
-- - image_url
-- - created_at
-- - updated_at

revoke update on public.observations from authenticated;
revoke delete on public.observations from authenticated;

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

-- ---------------------------------------------------------------------------
-- Protected field guard
-- ---------------------------------------------------------------------------
-- This trigger is a defense-in-depth guard for field-level invariants that RLS
-- alone cannot express. It is intentionally conservative for the MVP.

create or replace function public.guard_observation_edit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.observer_id is distinct from old.observer_id then
    raise exception 'observer_id cannot be changed by the observation edit flow';
  end if;

  if new.observer_display_name is distinct from old.observer_display_name then
    raise exception 'observer_display_name cannot be changed by the observation edit flow';
  end if;

  if new.image_path is distinct from old.image_path then
    raise exception 'image_path cannot be changed by the observation edit flow';
  end if;

  if new.image_mime_type is distinct from old.image_mime_type then
    raise exception 'image_mime_type cannot be changed by the observation edit flow';
  end if;

  if new.image_size_bytes is distinct from old.image_size_bytes then
    raise exception 'image_size_bytes cannot be changed by the observation edit flow';
  end if;

  if new.image_url is distinct from old.image_url then
    raise exception 'image_url cannot be changed by the observation edit flow';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'created_at cannot be changed by the observation edit flow';
  end if;

  if new.status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid observation status';
  end if;

  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'only admins can change observation status';
  end if;

  if not public.is_admin() then
    if auth.uid() is null then
      raise exception 'authenticated owner is required for observation edit';
    end if;

    if old.observer_id is null or old.observer_id <> auth.uid() then
      raise exception 'only the observation owner can edit this observation';
    end if;

    if old.status <> 'approved' or new.status <> 'approved' then
      raise exception 'owners can edit approved observations only';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists observations_guard_edit_fields on public.observations;
create trigger observations_guard_edit_fields
before update on public.observations
for each row
execute function public.guard_observation_edit_fields();

-- ---------------------------------------------------------------------------
-- Observation RLS
-- ---------------------------------------------------------------------------

alter table public.observations enable row level security;

-- Keep public list/detail approved-only for anonymous and authenticated users.
drop policy if exists "Public can read approved observations" on public.observations;
create policy "Public can read approved observations"
on public.observations
for select
to anon, authenticated
using (status = 'approved');

-- Owner content update. Field-level restrictions come from column grants and
-- public.guard_observation_edit_fields().
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

-- Admin update remains tied to public.is_admin(). The protected-field trigger
-- still prevents image/observer field changes in the MVP, while allowing admin
-- status changes.
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

-- No owner read policy for pending/rejected rows is added in this phase.
-- If a future "my observations" page needs private owner reads, draft that
-- separately and re-verify public visibility invariants.

commit;

-- ---------------------------------------------------------------------------
-- Rollback considerations, draft only
-- ---------------------------------------------------------------------------
-- If this draft is later promoted and applied, rollback should be a separate
-- reviewed migration. At minimum it would need to:
-- - drop trigger observations_guard_edit_fields on public.observations
-- - drop function public.guard_observation_edit_fields()
-- - restore the previously approved grants/policies
-- - re-run public approved-only and pending/rejected invisibility checks
