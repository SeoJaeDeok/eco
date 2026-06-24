# Public Signup Profile Live Smoke

## Goal

Record the Phase 22B development/local live smoke for public signup profile provisioning, authenticated contribution, and owner/anonymous behavior after the corrected 0005 migration was manually applied.

**한국어:** 수정된 0005 migration 수동 적용 뒤, public signup profile 생성부터 관찰 기록 작성과 작성자/비로그인 동작까지 실제 개발 환경에서 확인한 결과를 기록합니다.

## Environment

- Environment category: development/local Supabase project.
- Project URL, keys, tokens, email, password, confirmation URL, and UUID values are intentionally not recorded.
- Codex did not run remote SQL for this smoke.
- Codex did not push or merge this branch.

**한국어:** 개발/로컬 성격의 Supabase 환경에서 확인했습니다. 프로젝트 URL, key, token, 이메일, 비밀번호, 확인 URL, UUID는 기록하지 않습니다.

## Migration Object Confirmation

- Corrected migration `supabase/migrations/0005_public_signup_profile_provisioning.sql` was manually applied by the operator.
- Provisioning function exists: PASS.
- Provisioning trigger exists: PASS.
- Migration 0005 is now treated as immutable.
- Future database corrections must use a separately reviewed follow-up migration.
- Rollback was not run.
- Production application was not performed.

**한국어:** 사용자가 수정된 0005를 개발 환경에 수동 적용했고 function/trigger 존재가 확인되었습니다. 0005는 이후 수정하지 않고, 필요 시 별도 migration으로 검토합니다.

## Signup And Profile Results

- Live signup/login completed: PASS.
- Safe nickname shown in Navbar: PASS.
- Raw email not shown publicly: PASS.
- Signed-in upload form accessible: PASS.
- Navbar movement not noticed: PASS.
- Exact signup path, immediate session vs email confirmation: PARTIAL / not explicitly reported.

Profile verification:

- Auth user found: PASS.
- Matching profile count equals 1: PASS.
- Profile role equals `user`: PASS.
- Display name matches the safe nickname: PASS.

**한국어:** 실제 가입/로그인과 프로필 자동 생성은 통과했습니다. 단, 즉시 세션인지 이메일 확인 경로인지는 명시적으로 기록되지 않아 PARTIAL입니다.

## Observation Contribution Results

Test observation name:

```text
Phase22 프로필 연결 테스트
```

- Observation submission successful: PASS.
- Observation visible in public list: PASS.
- Detail modal opens: PASS.
- Safe nickname shown as observer: PASS.
- Raw email not shown publicly: PASS.
- Owner edit button visible while signed in as creator: PASS.

Observation database relationship verification:

- Observation found: PASS.
- Observation status is approved: PASS.
- Observation `observer_id` matches the provisioned profile: PASS.
- Observation `observer_display_name` matches the safe nickname: PASS.
- URL-like `image_url` count equals 0: PASS.

**한국어:** 새 관찰 기록은 approved 상태로 public list/detail에 보였고, profile과 observer 관계가 안전하게 연결되었습니다. URL-like `image_url` 저장도 없었습니다.

## Owner And Anonymous Behavior

- Owner edit form opened: PASS.
- Owner edit saved successfully: PASS.
- Changed description remained visible after reopening: PASS.
- Safe nickname remained visible: PASS.
- Raw email remained hidden: PASS.
- Logout succeeded: PASS.
- Observation remained publicly visible after logout: PASS.
- Edit button was hidden after logout: PASS.
- Signed-out upload gate was shown: PASS.

Static protected-payload review:

- Owner edit payload excludes `observer_id`, `status`, `role`, `created_at`, image path, image MIME metadata, image size metadata, and `image_url`: PASS.

**한국어:** 작성자는 허용 필드를 수정할 수 있었고, 로그아웃 뒤에는 수정 버튼이 숨겨졌습니다. 정적 검토에서도 보호 필드는 owner update payload에 포함되지 않았습니다.

## Partial Or Not Exercised Paths

- Exact signup path, immediate session vs email confirmation: PARTIAL / not explicitly reported.
- Second-account non-owner live denial: PARTIAL.
- Admin live edit regression: PARTIAL.
- Actual Supabase upload above the former 5 MB limit, optionally near 20 MB: PARTIAL.
- Forced expired signed URL retry: PARTIAL.
- Production/domain smoke: PARTIAL.

**한국어:** 핵심 signup/profile/contribution/owner-anonymous 흐름은 통과했지만, 두 번째 사용자, admin live edit, 큰 파일 업로드, 강제 만료 signed URL, production/domain 검증은 아직 선택적 후속 검증입니다.

## Test Data Cleanup Note

- The test user and test observation were not deleted during this smoke.
- Do not delete test data casually from the database.
- If cleanup is needed later, prepare a separate reviewed cleanup note that preserves auditability and avoids destructive ad hoc SQL.

**한국어:** 테스트 사용자와 관찰 기록은 삭제하지 않았습니다. 정리가 필요하면 별도 검토된 cleanup 절차로 진행해야 합니다.

## Boundary Result

- App code changed: no.
- Package files changed: no.
- Migration SQL changed: no.
- RLS/policies changed: no.
- Storage settings changed: no.
- Kakao behavior changed: no.
- Auth repository boundary changed: no.
- Admin repository boundary changed: no.
- Public approved-only visibility rule changed: no.
- Signed/public/blob/data URL DB persistence rule changed: no.
- Push status: not pushed.

**한국어:** 이번 기록 단계에서는 문서만 작성하며 앱 코드, package, migration, RLS, Storage, Kakao, repository 경계, public visibility 원칙을 바꾸지 않았습니다.
