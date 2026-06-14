-- Eco map observation schema draft for Supabase SQL Editor.
-- This file is a draft migration. Review it in a Supabase project before use.
-- It does not configure Storage buckets, Auth UI, server APIs, or app runtime behavior.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz,

  constraint profiles_role_check
    check (role in ('user', 'admin'))
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scientific_name text,
  taxon text not null,
  location text not null,
  observed_date date not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  image_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz,

  constraint observations_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint observations_scientific_name_not_blank
    check (scientific_name is null or char_length(trim(scientific_name)) > 0),
  constraint observations_taxon_check
    check (taxon in ('식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타')),
  constraint observations_location_not_empty
    check (char_length(trim(location)) > 0),
  constraint observations_description_not_blank
    check (description is null or char_length(trim(description)) > 0),
  constraint observations_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint observations_latitude_check
    check (latitude between -90 and 90),
  constraint observations_longitude_check
    check (longitude between -180 and 180)
);

create index if not exists observations_status_observed_date_idx
  on public.observations (status, observed_date desc);

create index if not exists observations_taxon_status_idx
  on public.observations (taxon, status);

create index if not exists observations_created_at_idx
  on public.observations (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists observations_set_updated_at on public.observations;
create trigger observations_set_updated_at
before update on public.observations
for each row
execute function public.set_updated_at();

-- Helper used by admin RLS policies.
-- SECURITY DEFINER avoids policy recursion when policies need to check public.profiles.
-- Keep this function narrow: it only checks the current authenticated user's role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.observations enable row level security;

-- Supabase APIs need both table grants and RLS policies.
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.observations to anon, authenticated;
grant update, delete on public.observations to authenticated;

-- Profiles RLS.
-- MVP direction: do not open public profile insert/update/delete.
-- Bootstrap the first admin manually from Supabase SQL Editor after creating a user in Auth.
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

-- Observations RLS.
-- Public screens can only read approved rows.
drop policy if exists "Public can read approved observations" on public.observations;
create policy "Public can read approved observations"
on public.observations
for select
to anon, authenticated
using (status = 'approved');

-- Public submissions are allowed only as pending.
-- The frontend must not expose approve/reject controls to public users.
drop policy if exists "Public can create pending observations" on public.observations;
create policy "Public can create pending observations"
on public.observations
for insert
to anon, authenticated
with check (status = 'pending');

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
);

-- Candidate only. Consider soft delete or audit logging before production use.
drop policy if exists "Admins can delete observations" on public.observations;
create policy "Admins can delete observations"
on public.observations
for delete
to authenticated
using (public.is_admin());

-- Storage is intentionally not configured in this migration.
-- Image upload, Storage buckets, object policies, signed URL strategy, and abuse controls
-- should be designed and added in a later dedicated step.
