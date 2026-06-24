# Phase 22 - Signup Profile Provisioning And Live Contribution Smoke

## Status

Verified for the core development/local signup profile provisioning and live contribution flow. Optional operational and multi-account regression checks remain partial.

**한국어:** 개발/로컬 환경의 핵심 signup profile provisioning, 관찰 등록, 작성자 수정, 비로그인 edit-hidden 흐름은 검증되었습니다. 운영성/다중 계정 회귀 검증 일부는 PARTIAL입니다.

## Goal

- Add and verify safe automatic `public.profiles` provisioning for new public Supabase Auth signup users.
- Smoke-test the live flow from signup/login through approved contribution, safe observer display, owner edit, and anonymous edit hiding.

**한국어:** 새 공개 회원가입 사용자의 `public.profiles` 자동 생성을 안전하게 준비하고, 실제 가입부터 관찰 등록/표시/작성자 수정/비로그인 수정 숨김까지 확인하는 것이 목표였습니다.

## Main Work

- Phase 22A prepared `supabase/migrations/0005_public_signup_profile_provisioning.sql` and the apply-readiness documentation.
- The first manual apply attempt failed because ownership-requiring trigger statements targeted `auth.users`.
- `1c2ed84` corrected the migration by removing direct trigger drop/comment statements on `auth.users`, keeping the `SECURITY DEFINER` function, pinning `set search_path = ''`, and adding safe trigger preflight checks.
- The operator manually applied the corrected migration in the intended development/local Supabase environment.
- Phase 22B verified function and trigger existence.
- Phase 22B verified live signup/login, exactly one matching profile row, `role = 'user'`, and safe display name behavior.
- Phase 22B verified authenticated approved observation creation, observer/profile relationship, public safe observer display, owner edit, and anonymous edit-hidden behavior.
- Phase 22B documented remaining optional regression checks without changing app code, package files, migration SQL, RLS, Storage, Kakao, Auth repository, or admin repository behavior.

**한국어:** 0005 migration 준비와 권한 오류 수정, 개발 환경 수동 적용, function/trigger 확인, 실제 가입/프로필/관찰/작성자 수정/비로그인 동작 검증을 기록했습니다.

## Key Files

- `supabase/migrations/0005_public_signup_profile_provisioning.sql`
- `docs/architecture/public-signup-profile-provisioning-apply-readiness.md`
- `docs/architecture/public-signup-profile-setup-plan.md`
- `docs/architecture/public-signup-profile-live-smoke.md`
- `docs/architecture/next-session-handoff.md`
- `src/components/auth/PublicLoginPanel.tsx`
- `src/components/auth/UploadLoginGate.tsx`
- `src/components/Navbar.tsx`
- `src/App.tsx`
- `src/repositories/authRepository.ts`
- `src/repositories/authRepositoryProvider.ts`
- `src/repositories/supabase/supabaseAuthRepository.ts`
- `src/repositories/observationRepository.ts`
- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/repositories/supabase/observationMappers.ts`
- `src/repositories/supabase/observationDbTypes.ts`

**한국어:** signup/profile migration과 apply/live-smoke 문서, public auth UI, Auth/Observation repository 경계 파일이 핵심입니다.

## Verification

- `npm.cmd run typecheck`: pass in the Phase 22B documentation closure session.
- `npm.cmd run build`: pass in the Phase 22B documentation closure session.
- `git diff --check`: pass in the Phase 22B documentation closure session.
- Corrected 0005 migration manually applied in development/local Supabase by the operator: pass.
- Provisioning function exists: pass.
- Provisioning trigger exists: pass.
- Live signup/login: pass.
- Safe nickname shown in Navbar: pass.
- Raw email public non-exposure: pass.
- Signed-in upload form access: pass.
- Navbar no-shift observation: pass.
- Exact signup path, immediate session versus email confirmation: partial / not explicitly reported.
- Matching profile count equals 1: pass.
- Profile role equals `user`: pass.
- Profile display name matches the safe nickname: pass.
- Observation submission: pass.
- Observation visible in public list: pass.
- Detail modal opens: pass.
- Safe observer display: pass.
- Owner edit button visible while signed in as creator: pass.
- Observation status approved: pass.
- Observation `observer_id` matches the provisioned profile: pass.
- Observation `observer_display_name` matches the safe nickname: pass.
- URL-like `image_url` count equals 0: pass.
- Owner edit form opened and saved: pass.
- Changed description remained visible after reopening: pass.
- Logout succeeded: pass.
- Observation remained public after logout: pass.
- Edit button hidden after logout: pass.
- Signed-out upload gate shown: pass.
- Static owner update payload review excludes protected fields: pass.

**한국어:** 자동 명령과 수동 smoke 핵심 경로가 통과했습니다. 즉시 세션/이메일 확인 경로는 명시적으로 보고되지 않았기 때문에 PARTIAL입니다.

## Remaining Risks / Follow-ups

- Exact signup path, immediate session versus email confirmation, was not explicitly reported.
- Second-account non-owner live denial remains PARTIAL.
- Admin live edit regression remains PARTIAL.
- Actual Supabase upload above the former 5 MB limit, optionally near 20 MB, remains PARTIAL.
- Forced expired signed URL retry remains PARTIAL.
- Production/domain smoke remains PARTIAL.
- Existing Auth users without profiles still need a separate reviewed backfill decision if they matter operationally.
- Migration 0005 is now treated as immutable; future database corrections require a separately reviewed follow-up migration.

**한국어:** 두 번째 사용자, admin edit, 큰 파일 업로드, signed URL 만료 재시도, production/domain 확인은 후속 선택 검증입니다. 이미 적용된 0005는 수정하지 않습니다.

## Linked Docs

- `docs/architecture/public-signup-profile-provisioning-apply-readiness.md`
- `docs/architecture/public-signup-profile-setup-plan.md`
- `docs/architecture/public-signup-profile-live-smoke.md`
- `docs/architecture/next-session-handoff.md`
- `docs/eco/phase-history/index.md`

**한국어:** Phase 22A/B의 설계, 적용 준비, live smoke, 현재 handoff 문서를 함께 참고합니다.

## Commit References

- `f15d136 docs: prepare signup profile provisioning migration`
- `1c2ed84 fix: correct auth profile trigger migration permissions`
- `docs: record signup profile provisioning smoke` on `feature/phase-22-signup-profile-live-smoke`

**한국어:** 0005 준비 commit, 권한 수정 commit, Phase 22B 문서 commit이 핵심 기록입니다.

## Notes

- Codex did not apply remote SQL.
- Codex did not push or merge Phase 22B.
- Production was not changed.
- App code, package files, RLS/policies, Storage settings, Kakao behavior, Auth repository boundary, and admin repository boundary were not changed during Phase 22B documentation closure.
- Public approved-only visibility remains required.
- Pending/rejected public non-exposure remains required.
- Email public display remains forbidden.
- Signed/public/blob/data URL DB persistence remains forbidden.
- Test email, password, UUID, project URL, key, token, and confirmation URL are intentionally not recorded.

**한국어:** 원격 SQL은 Codex가 실행하지 않았고 push/merge도 하지 않았습니다. 민감정보는 기록하지 않았으며 기존 public visibility와 URL persistence 원칙을 유지합니다.
