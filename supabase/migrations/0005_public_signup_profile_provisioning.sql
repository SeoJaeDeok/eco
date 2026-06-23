-- Public signup profile provisioning migration candidate.
-- Review and apply manually only in the intended Supabase environment.
--
-- Scope:
-- - Creates a profile provisioning function for new Supabase Auth users.
-- - Creates an auth.users insert trigger that inserts exactly one matching
--   public.profiles row.
--
-- Non-scope:
-- - Does not grant frontend clients broad profile insert access.
-- - Does not change observation visibility, owner edit, admin edit, Storage,
--   or Kakao behavior.
-- - Does not backfill existing Auth users.
-- - Does not derive role/admin values from client-controlled metadata.

do $$
begin
  if to_regclass('auth.users') is null then
    raise exception 'Phase 22A requires auth.users to exist before profile provisioning is applied.';
  end if;

  if to_regclass('public.profiles') is null then
    raise exception 'Phase 22A requires public.profiles to exist before profile provisioning is applied.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'display_name'
  ) then
    raise exception 'Phase 22A requires public.profiles.display_name from the public contribution migration.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'observations'
      and column_name = 'observer_id'
  ) then
    raise exception 'Phase 22A expects public.observations.observer_id to be present before applying.';
  end if;

  if exists (
    select 1
    from pg_trigger trigger_info
    where trigger_info.tgrelid = 'auth.users'::regclass
      and trigger_info.tgname = 'auth_users_create_public_profile'
      and not trigger_info.tgisinternal
  ) then
    raise exception 'Existing draft profile trigger auth_users_create_public_profile found. Review compatibility before applying Phase 22A.';
  end if;

  if exists (
    select 1
    from pg_trigger trigger_info
    join pg_proc trigger_function
      on trigger_function.oid = trigger_info.tgfoid
    join pg_namespace trigger_function_schema
      on trigger_function_schema.oid = trigger_function.pronamespace
    where trigger_info.tgrelid = 'auth.users'::regclass
      and trigger_info.tgname = 'auth_users_provision_public_profile'
      and not trigger_info.tgisinternal
      and not (
        trigger_function_schema.nspname = 'public'
        and trigger_function.proname = 'provision_public_profile_for_new_auth_user'
        and pg_get_function_identity_arguments(trigger_function.oid) = ''
      )
  ) then
    raise exception 'Existing auth_users_provision_public_profile trigger points to an unexpected function. Stop and review before applying Phase 22A.';
  end if;

  if exists (
    select 1
    from pg_trigger trigger_info
    join pg_proc trigger_function
      on trigger_function.oid = trigger_info.tgfoid
    where trigger_info.tgrelid = 'auth.users'::regclass
      and trigger_info.tgname <> 'auth_users_provision_public_profile'
      and not trigger_info.tgisinternal
      and (
        trigger_info.tgname ilike '%profile%'
        or trigger_function.proname ilike '%profile%'
      )
  ) then
    raise exception 'Existing auth.users profile-related trigger found. Review compatibility before applying Phase 22A.';
  end if;
end $$;

create or replace function public.provision_public_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.provision_public_profile_for_new_auth_user()
is 'Creates a public.profiles row for each new auth.users row without trusting client metadata for role/admin values.';

revoke all on function public.provision_public_profile_for_new_auth_user() from public;

do $$
declare
  expected_trigger_name constant name := 'auth_users_provision_public_profile';
  expected_function regprocedure := 'public.provision_public_profile_for_new_auth_user()'::regprocedure;
  existing_trigger_function regprocedure;
begin
  select trigger_info.tgfoid::regprocedure
    into existing_trigger_function
  from pg_trigger trigger_info
  where trigger_info.tgrelid = 'auth.users'::regclass
    and trigger_info.tgname = expected_trigger_name
    and not trigger_info.tgisinternal;

  if existing_trigger_function is null then
    execute $create_trigger$
      create trigger auth_users_provision_public_profile
      after insert on auth.users
      for each row
      execute function public.provision_public_profile_for_new_auth_user()
    $create_trigger$;
  elsif existing_trigger_function = expected_function then
    null;
  else
    raise exception
      'Existing auth.users trigger % points to %, expected %. Stop and review before applying Phase 22A.',
      expected_trigger_name,
      existing_trigger_function,
      expected_function;
  end if;
end $$;
