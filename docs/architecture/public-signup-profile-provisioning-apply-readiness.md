# Public Signup Profile Provisioning Apply Readiness

## Problem Statement

Phase 21 added public signup through `AuthRepository.signUpWithPassword`, but the contribution model depends on a matching `public.profiles` row. In the current schema, `public.observations.observer_id` references `public.profiles(id)`, while `public.profiles.id` references `auth.users(id)`.

If a new Supabase Auth user is created without a profile row, login can succeed but authenticated observation creation can fail or the app can return `profileSetupRequired`.

한국어 요약: 공개 회원가입은 구현되었지만 Auth 사용자 생성과 `public.profiles` 행 생성이 아직 DB 수준에서 자동 연결되지 않았습니다. 이 문서는 수동 검토 후 적용할 수 있는 안전한 준비안을 기록합니다.

## Current Schema Findings

Implementation evidence comes from `supabase/migrations/0001_create_observation_schema.sql`, `0003_public_user_contribution.sql`, and `0004_owner_admin_observation_edit.sql`.

`public.profiles` currently has:

- `id uuid primary key references auth.users(id) on delete cascade`
- `role text not null default 'user'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `display_name text null`
- `profiles_role_check`, allowing only `user` and `admin`
- `profiles_display_name_not_blank`, allowing `null` or non-blank trimmed text

`public.observations` currently has:

- `observer_id uuid null references public.profiles(id) on delete set null`
- `observer_display_name text null`
- approved-only public read policy
- authenticated own approved insert policy requiring `observer_id = auth.uid()`
- owner/admin update paths for content-only edits

Existing relevant functions/triggers:

- `public.set_updated_at()` with `profiles_set_updated_at` and `observations_set_updated_at`
- `public.is_admin()` for RLS/admin checks
- `public.guard_observation_edit_fields()` with `observations_guard_edit_fields`

Existing relevant profile RLS/grants:

- authenticated users can select their own profile
- admins can select all profiles
- authenticated users can update `display_name` only
- frontend roles do not have broad `public.profiles` insert access
- restricted fields such as `role` are protected by column grants and trigger/function design; row-level policies alone are not treated as column-level protection

No apply-ready migration currently creates a `public.profiles` row from a new `auth.users` row. The older `docs/architecture/sql-drafts/0005_public_signup_profile_draft.sql` remains draft-only and was not promoted into `supabase/migrations`.

## App Compatibility Findings

The current app remains compatible with trigger-based provisioning:

- `AuthRepository.signUpWithPassword` is the signup boundary.
- UI components do not call Supabase directly for signup/profile provisioning.
- `supabaseAuthRepository` sends safe display-name metadata as `display_name`.
- `normalizeObserverDisplayName` rejects blank and email-like display names.
- active-session signup loads the profile row before treating the session as contribution-ready.
- if no active session is returned, the app reports email confirmation required.
- if an active session exists but no profile is available, the app signs out and returns `profileSetupRequired`.

No app-code change is required for Phase 22A.

## Chosen Strategy

Use a narrowly scoped database trigger on `auth.users` insert.

The migration candidate is:

```text
supabase/migrations/0005_public_signup_profile_provisioning.sql
```

It creates:

- function: `public.provision_public_profile_for_new_auth_user()`
- trigger: `auth_users_provision_public_profile` on `auth.users`

The trigger inserts one `public.profiles` row with:

- `id = new.id`
- `role = 'user'`
- `display_name = safe display_name metadata, or null`

## 22A Manual Apply Correction

The first manual apply attempt failed with:

```text
ERROR 42501: must be owner of relation users
```

The failed attempt was not accepted as a successful apply. The failure came from ownership-requiring statements against `auth.users`, especially a direct trigger drop and a trigger comment.

The corrected migration:

- does not run `drop trigger` on `auth.users`
- does not run `comment on trigger` on `auth.users`
- keeps the `SECURITY DEFINER` function
- pins the function to `set search_path = ''`
- creates the expected trigger only when it does not already exist
- permits an existing expected trigger only when it points to `public.provision_public_profile_for_new_auth_user()`
- stops with a clear exception if the expected trigger points to another function
- does not alter ownership of `auth.users`
- does not grant superuser or broad Auth-schema privileges

한국어 요약: 첫 수동 적용은 `auth.users` trigger drop/comment 권한 문제로 실패했으며 성공 적용으로 인정하지 않습니다. 수정본은 trigger를 직접 삭제하거나 comment하지 않고, 기존 trigger가 있으면 expected function을 가리키는지 검증한 뒤 안전하게 진행합니다.

## Rejected Alternatives

Client self-insert into `public.profiles` was rejected for the MVP because it would require opening profile insert grants/policies to frontend roles. That adds RLS complexity and makes signup success depend on a second client-side write.

A server-side/RPC provisioning path was rejected for this phase because the project does not currently have a server API boundary. It would add more moving parts than an Auth insert trigger and still requires careful role protection.

The older draft SQL was not used as-is because it could update an existing profile's `display_name` and `updated_at` on conflict. Phase 22A uses `on conflict (id) do nothing` so existing profiles, roles, and timestamps are not overwritten.

## Security Model

- The function is `SECURITY DEFINER` because frontend roles should not receive broad profile insert privileges.
- The function pins `search_path = ''` and uses explicit schema names for app tables.
- The trigger never reads role/admin values from client metadata.
- New profiles are always created with `role = 'user'`.
- The trigger never uses the Auth email as a public display-name fallback.
- Existing profile rows are not updated by the trigger.
- Observation, owner-edit, admin-edit, Storage, and Kakao policies are unchanged.

## Display-Name Rule

The trigger reads only:

```text
new.raw_user_meta_data ->> 'display_name'
```

It trims the value and stores it only when it is:

- present after trimming
- not email-like

If the value is missing, blank, or email-like, `display_name` is stored as `null`. This is acceptable because `public.profiles.display_name` is nullable. Public UI must continue using safe display-name helpers and fallback copy instead of showing email addresses.

## Email Confirmation Behavior

Supabase may create an Auth user before email confirmation is completed. An `auth.users` insert trigger provisions the profile at user-row creation time, so the profile should be available when the user later confirms and logs in.

If a provider returns an active session immediately, the app can load the newly provisioned profile in the existing signup flow.

## Idempotency And Conflict Behavior

The provisioning insert uses:

```sql
on conflict (id) do nothing
```

This prevents duplicate profile rows and avoids overwriting existing admin/user profile data.

The migration also refuses to continue when it detects the older draft trigger name or another profile-related `auth.users` trigger. If the expected trigger name already exists, the corrected migration verifies that it points to the expected function. If it points elsewhere, the migration stops and requires manual review.

## Existing Users And Backfill

Phase 22A does not backfill existing Auth users.

Run the read-only preflight count first. If existing Auth users without profiles exist, review a separate backfill plan. Do not derive display names from email addresses.

Example backfill candidate for a later, separately reviewed step:

```sql
-- Candidate only. Do not run as part of Phase 22A.
insert into public.profiles (id, role, display_name)
select auth_user.id, 'user', null
from auth.users auth_user
left join public.profiles profile
  on profile.id = auth_user.id
where profile.id is null
on conflict (id) do nothing;
```

## Pre-Apply Checklist

Codex did not apply this migration. Before applying it manually, confirm the target environment and run the read-only checks below.

### Selected Function Check

```sql
select
  namespace_info.nspname as schema_name,
  function_info.proname as function_name,
  pg_get_function_identity_arguments(function_info.oid) as arguments
from pg_proc function_info
join pg_namespace namespace_info
  on namespace_info.oid = function_info.pronamespace
where namespace_info.nspname = 'public'
  and function_info.proname in (
    'provision_public_profile_for_new_auth_user',
    'handle_new_user_profile'
  )
order by function_info.proname;
```

### Auth Trigger Check

```sql
select
  trigger_info.tgname as trigger_name,
  trigger_function.proname as function_name,
  not trigger_info.tgisinternal as is_user_trigger
from pg_trigger trigger_info
join pg_proc trigger_function
  on trigger_function.oid = trigger_info.tgfoid
where trigger_info.tgrelid = 'auth.users'::regclass
  and not trigger_info.tgisinternal
order by trigger_info.tgname;
```

Stop before applying if an existing signup/profile trigger is present and has not been reviewed. The expected trigger name `auth_users_provision_public_profile` is acceptable only when it already points to `public.provision_public_profile_for_new_auth_user()`.

### Users Without Profiles Count

```sql
select count(*) as auth_users_without_profiles
from auth.users auth_user
left join public.profiles profile
  on profile.id = auth_user.id
where profile.id is null;
```

### Impossible Relationship Count

```sql
select count(*) as profiles_without_auth_users
from public.profiles profile
left join auth.users auth_user
  on auth_user.id = profile.id
where auth_user.id is null;
```

### Profile And Observation Constraints

```sql
select
  constraint_info.conname,
  constraint_info.contype,
  pg_get_constraintdef(constraint_info.oid) as definition
from pg_constraint constraint_info
where constraint_info.conrelid in (
  'public.profiles'::regclass,
  'public.observations'::regclass
)
  and (
    constraint_info.conname ilike '%profile%'
    or constraint_info.conname ilike '%observer%'
    or constraint_info.conname ilike '%role%'
  )
order by constraint_info.conname;
```

### Current RLS Policies

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'observations')
order by tablename, policyname;
```

### Current Profile Grants

```sql
select
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles'
order by grantee, privilege_type;
```

```sql
select
  grantee,
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
order by grantee, column_name, privilege_type;
```

## Manual Apply Instructions

1. Review `supabase/migrations/0005_public_signup_profile_provisioning.sql`.
2. Run the pre-apply checks in the intended dev/local Supabase project.
3. Stop if another signup/profile trigger already exists.
4. If `auth_users_provision_public_profile` already exists, confirm it points to `public.provision_public_profile_for_new_auth_user()`. The migration will also enforce this check.
5. Apply the migration only to the intended environment through the established Supabase migration workflow or SQL editor.
6. Do not paste project URLs, keys, tokens, passwords, or test credentials into repository documentation.
7. Record the apply result without secrets.
8. Run the post-apply checks below.

Codex did not apply this migration.

## Post-Apply Verification Queries

### Function Existence And Security Settings

```sql
select
  function_info.proname,
  pg_get_userbyid(function_info.proowner) as function_owner,
  function_info.prosecdef as is_security_definer,
  function_info.proconfig as function_config
from pg_proc function_info
join pg_namespace namespace_info
  on namespace_info.oid = function_info.pronamespace
where namespace_info.nspname = 'public'
  and function_info.proname = 'provision_public_profile_for_new_auth_user';
```

### Trigger Existence And Function Target

```sql
select
  trigger_info.tgname as trigger_name,
  trigger_function.oid::regprocedure as trigger_function
from pg_trigger trigger_info
join pg_proc trigger_function
  on trigger_function.oid = trigger_info.tgfoid
where trigger_info.tgrelid = 'auth.users'::regclass
  and trigger_info.tgname = 'auth_users_provision_public_profile';
```

Expected result: the trigger exists and `trigger_function` is `public.provision_public_profile_for_new_auth_user()`.

### Function Definition Review

```sql
select pg_get_functiondef(
  'public.provision_public_profile_for_new_auth_user()'::regprocedure
);
```

Confirm the definition:

- inserts into `public.profiles`
- sets `role = 'user'`
- reads only `raw_user_meta_data ->> 'display_name'`
- does not read email as a display-name fallback
- uses `on conflict (id) do nothing`

### Policy And Grant Recheck

Re-run the pre-apply RLS and grant queries. No broad `public.profiles` insert grant or policy should appear.

### Public Visibility Recheck

Public observation behavior should still be verified after apply:

- approved rows visible
- pending rows hidden
- rejected rows hidden
- no signed/public/blob/data URL persisted in `image_url`

## Rollback Plan

Rollback removes only Phase 22A objects, but managing triggers on `auth.users` can require ownership-level privileges. Do not add automatic rollback SQL to this forward migration. If rollback is needed, prepare a separate reviewed rollback runbook and have an operator with appropriate Auth-table trigger privileges remove the trigger before dropping the function.

Rollback must not:

- drop `public.profiles`
- delete Auth users
- delete profile rows
- alter observation history
- weaken RLS
- change Storage policies

## Known Risks

- Applying with an unexpected existing Auth trigger could create duplicate or conflicting provisioning behavior. The migration blocks known profile-trigger conflicts, but operators should still review all Auth triggers.
- Existing Auth users without profiles need a separate reviewed backfill decision.
- Supabase email confirmation behavior must be live-smoked in the intended environment.
- If the migration is applied by an unexpected low-privilege role, function or trigger creation may fail.
- This phase does not verify live signup, live observation create, owner edit, admin edit, or production/domain behavior.

## Phase 22B Live Smoke Plan

Use only approved disposable/test credentials and do not print them.

1. Apply the migration manually in the intended dev/local environment.
2. Sign up a new public user with a safe non-email display name.
3. If email confirmation is required, confirm the account through the approved test path.
4. Verify exactly one `public.profiles` row exists for the new Auth user.
5. Verify `role = 'user'`.
6. Verify `display_name` is safe and non-email when supplied.
7. Verify login/logout still works.
8. Verify the upload gate allows the signed-in user and hides the upload form when signed out.
9. Verify authenticated approved observation creation works with `observer_id = auth.uid()`.
10. Verify public list/detail remain approved-only.
11. Verify owner/admin edit behavior remains unchanged.
