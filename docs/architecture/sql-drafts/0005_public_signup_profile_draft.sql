-- Public signup profile setup draft.
-- Draft only. Do not apply through migration tooling without an approved
-- signup/profile apply-readiness phase and manual dev/local smoke.
--
-- Purpose:
-- - Create a public.profiles row when a new Supabase Auth user is created.
-- - Preserve the existing invite/manual account model for already-created users.
-- - Keep frontend clients from receiving broad insert privileges on profiles.
-- - Keep public display names optional, non-email-like, and non-blank when present.
--
-- Non-goals:
-- - No public profile directory.
-- - No service-role key in frontend code.
-- - No contributor role or CAPTCHA/rate-limit implementation.
-- - No change to observation visibility policies.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_display_name text;
  safe_display_name text;
begin
  raw_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  safe_display_name := case
    when raw_display_name is null then null
    when raw_display_name ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then null
    else raw_display_name
  end;

  insert into public.profiles (
    id,
    role,
    display_name
  )
  values (
    new.id,
    'user',
    safe_display_name
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now()
  where public.profiles.display_name is null
    and excluded.display_name is not null;

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public;

drop trigger if exists auth_users_create_public_profile on auth.users;
create trigger auth_users_create_public_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

-- Post-apply checks:
-- 1. Sign up a test user in dev/local only.
-- 2. Confirm public.profiles has exactly one row for the new user.
-- 3. Confirm role = 'user'.
-- 4. Confirm display_name is set only when the submitted value is safe.
-- 5. Confirm public approved-only observation reads still hide pending/rejected rows.
-- 6. Confirm authenticated direct approved create works only for the signed-in owner.
