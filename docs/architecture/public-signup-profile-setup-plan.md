# Public Signup Profile Setup Plan

## Purpose

Phase 21B adds public signup UI through `AuthRepository`, but direct approved contribution still requires a matching `public.profiles` row because `observations.observer_id` references `public.profiles(id)`.

**한국어:** Phase 21B의 회원가입 UI는 `AuthRepository`를 통해 추가되지만, 관찰 기록 직접 등록은 `public.profiles` 행이 있어야 안전하게 동작합니다. `observations.observer_id`가 `public.profiles(id)`를 참조하기 때문입니다.

## Current Constraint

Existing Phase 20 migrations support `profiles.display_name` and own-profile display-name updates. They do not yet define an automatic Auth-user-to-profile creation trigger for open public signup.

Without a profile row:

- signup can create an Auth user;
- an active session may exist;
- the app must not treat that session as fully contribution-ready;
- authenticated approved create can fail because the observer foreign key has no profile row.

**한국어:** 기존 Phase 20 마이그레이션은 `display_name`과 본인 프로필 수정은 지원하지만 공개 회원가입 시 프로필 행을 자동 생성하는 트리거는 아직 없습니다. 프로필 행이 없으면 Auth 계정은 생겨도 관찰 기록 등록은 실패할 수 있습니다.

## Phase 21 App Behavior

Implemented app behavior:

- Signup stays behind `AuthRepository`.
- UI components do not call Supabase directly.
- Signup collects email, password, password confirmation, and public display name.
- Email-like display names are rejected before submit and also normalized in the Supabase auth repository.
- If Supabase returns no active session, the UI reports that email confirmation is required.
- If an active session exists but no profile row is available, the repository signs out and returns `profileSetupRequired`.
- The UI reports that profile setup is required instead of exposing the upload form as ready.

**한국어:** 앱은 회원가입 성공, 이메일 확인 필요, 프로필 준비 필요 상태를 구분합니다. 프로필이 준비되지 않은 세션은 업로드 가능 상태로 취급하지 않습니다.

## Draft SQL

Draft-only SQL lives at:

```text
docs/architecture/sql-drafts/0005_public_signup_profile_draft.sql
```

The draft uses an `auth.users` insert trigger to create `public.profiles` rows with:

- `id = new.id`
- `role = 'user'`
- optional safe `display_name` from Auth metadata

It intentionally does not grant broad `insert` privileges on `public.profiles` to frontend roles.

**한국어:** SQL 초안은 프론트엔드에 넓은 profile insert 권한을 주지 않고, Auth 사용자 생성 시 트리거로 `profiles` 행을 만듭니다.

## Apply-Readiness Notes

Do not promote or apply this draft until a separate signup/profile DB phase is approved.

Before applying in dev/local:

- Confirm `public.profiles.display_name` exists.
- Confirm `public.profiles` RLS remains enabled.
- Confirm `public.is_admin()` remains intact.
- Confirm existing admin profiles are not overwritten.
- Confirm public observation reads remain approved-only.
- Confirm pending/rejected rows remain hidden from public list/detail.

After applying in dev/local:

- Sign up a test user without printing credentials.
- Confirm the profile row exists with `role = 'user'`.
- Confirm email-like display names are not stored as display names.
- Confirm login/logout still works.
- Confirm upload gate allows only signed-in users with usable session/profile state.
- Confirm authenticated direct approved create works with `observer_id = auth.uid()`.

**한국어:** 이 초안은 별도 승인 전에는 적용하지 않습니다. 적용 후에는 프로필 생성, role, 안전한 display name, 로그인/로그아웃, 업로드 gate, 직접 등록, public approved-only 읽기를 모두 확인해야 합니다.

## Non-Scope

- No RLS weakening.
- No service-role key in frontend code.
- No public profile directory.
- No contributor approval workflow.
- No CAPTCHA/rate-limit implementation.
- No package changes.
- No Supabase migration promotion in Phase 21.
