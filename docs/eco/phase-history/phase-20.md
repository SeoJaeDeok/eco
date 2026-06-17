# Phase 20 - Public User Contribution And Owner Editing

**한국어:** Phase 20 - 공개 사용자 기여와 작성자/관리자 수정

## Status

- Status: Verified
- Source basis: `AGENTS.md`, `README.md`, `docs/architecture/next-session-handoff.md`, Phase 20 architecture docs, and commit history through `4da595e`.

**한국어:** Phase 20은 20K live owner/non-owner/admin edit smoke가 PASS로 기록된 verified phase입니다. 근거는 handoff, 관련 architecture 문서, 그리고 Phase 20 커밋 이력입니다.

## Goal

- Add public user login/logout and keep signed-out users from submitting observations.
- Let signed-in users create approved observations directly.
- Show safe observer display names in the public list and detail modal.
- Let only the original observer or an admin edit approved observation content.

**한국어:** 공개 사용자 로그인, 로그인 사용자 직접 approved 기록 생성, 관찰자 표시, 작성자/관리자 전용 수정 기능을 추가하는 것이 목표였습니다. 비로그인 사용자는 계속 열람만 가능하고 기록 제출은 차단됩니다.

## Main Work

- 20A fixed public Navbar horizontal alignment across public routes.
- 20B documented the public user auth, direct contribution, observer display, and owner/admin edit design.
- 20C and 20C.5 drafted and reviewed the public user contribution DB/RLS plan.
- 20D implemented public login/logout UI, public auth state, and the signed-out upload gate.
- 20E implemented authenticated direct approved create in the Supabase repository path.
- 20F added safe observer display to public observation cards and detail modal.
- 20G documented the owner/admin observation edit design.
- 20H, 20H.5, 20H.6, and 20H.7 planned, promoted, manually applied, and documented the owner/admin edit RLS and trigger readiness work.
- 20I added owner/admin content-only repository update methods.
- 20J implemented the owner/admin edit UI inside the public observation detail modal.
- 20K verified owner, non-owner, anonymous, and admin edit behavior by user-reported live manual smoke.

**한국어:** Phase 20은 Navbar alignment 보정부터 public auth, 직접 기여, 관찰자 표시, owner/admin edit 설계와 RLS 준비, repository update, detail modal edit UI, 그리고 20K live smoke까지 단계적으로 진행되었습니다.

## Key Files

- `src/App.tsx`
- `src/components/Navbar.tsx`
- `src/components/UploadMockPage.tsx`
- `src/components/auth/PublicLoginPanel.tsx`
- `src/components/auth/UploadLoginGate.tsx`
- `src/components/ObservationDetail.tsx`
- `src/components/observations/detail/ObservationDetailEditForm.tsx`
- `src/components/observations/detail/ObservationDetailHeader.tsx`
- `src/components/observations/ObservationCard.tsx`
- `src/utils/observerDisplay.ts`
- `src/repositories/observationRepository.ts`
- `src/repositories/adminObservationRepository.ts`
- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/repositories/supabase/supabaseAdminObservationRepository.ts`
- `src/repositories/supabase/observationMappers.ts`
- `supabase/migrations/0003_public_user_contribution.sql`
- `supabase/migrations/0004_owner_admin_observation_edit.sql`
- `docs/architecture/public-user-auth-contribution-design.md`
- `docs/architecture/public-user-contribution-rls-plan.md`
- `docs/architecture/owner-admin-observation-edit-design.md`
- `docs/architecture/owner-admin-observation-edit-rls-plan.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** 핵심 변경 파일은 public auth/upload gate UI, observation detail edit UI, observer display helper, public/admin repository update 경계, Supabase migration 후보, 그리고 Phase 20 architecture 문서입니다.

## Verification

- `npm.cmd run typecheck`: pass
- `npm.cmd run build`: pass
- `git diff --check`: pass
- 20E non-admin authenticated create smoke: pass, user-reported
- 20F observer display manual/static check: pass
- 20H.7 trigger check: pass
- 20K owner edit smoke: pass
- 20K non-owner denial/hidden smoke: pass
- 20K anonymous hidden smoke: pass
- 20K admin edit smoke: pass
- Pending/rejected public invisibility: pass
- `image_url` URL-like storage check: pass
- Console/log secret check: pass
- Malicious protected-field DB update attempt: not explicitly recorded

**한국어:** typecheck/build/diff check와 20E, 20F, 20H.7, 20K 검증이 기록되어 있습니다. 20K에서는 owner edit, non-owner 차단, anonymous edit 숨김, admin edit, pending/rejected public 미노출, URL-like `image_url` 미저장, console/log secret check가 PASS로 기록되었습니다. 악의적인 protected-field 직접 DB update 시도는 별도 수행 기록이 없어 optional hardening으로 남아 있습니다.

## Remaining Risks / Follow-ups

- Image replacement remains out of scope.
- Malicious protected-field DB update attempts can be run later as an optional hardening check.
- Production/domain smoke remains a follow-up if the app is deployed beyond dev/local.
- Optional audit log, reject note, user management, and bulk approval remain out of scope.
- Optional field-level hardening review can be considered after launch.

**한국어:** 이미지 교체, 악의적 protected-field 직접 update 시도 검증, production/domain smoke, audit log, reject note, user management, bulk approval은 Phase 20 범위 밖이거나 후속 hardening 후보입니다.

## Linked Docs

- `docs/architecture/public-user-auth-contribution-design.md`
- `docs/architecture/public-user-contribution-rls-plan.md`
- `docs/architecture/owner-admin-observation-edit-design.md`
- `docs/architecture/owner-admin-observation-edit-rls-plan.md`
- `docs/architecture/next-session-handoff.md`
- `docs/eco/phase-history/index.md`

**한국어:** Phase 20의 public auth/contribution 설계, contribution RLS 계획, owner/admin edit 설계, owner/admin edit RLS 계획, handoff 문서와 연결됩니다.

## Commit References

- `c4342db fix: align navbar across public pages`
- `693c062 docs: design public user contribution flow`
- `8cbca8f docs: draft public user contribution RLS plan`
- `1418d1f docs: review public contribution RLS draft readiness`
- `9ee71d1 feat: add public login UI and upload gate`
- `72de03b docs: prepare public contribution RLS migration`
- `50621a3 feat: create approved observations for signed-in users`
- `5e3fd8b docs: record authenticated contribution smoke result`
- `bbdf789 feat: show safe observer names`
- `2eaf679 docs: design owner and admin observation editing`
- `74599b6 docs: plan owner and admin edit RLS`
- `e1cce81 docs: review owner edit RLS apply readiness`
- `944de85 docs: record owner edit migration apply result`
- `bf1284a docs: confirm owner edit triggers and visibility checks`
- `6d9caae feat: add observation edit repository methods`
- `2d7007b feat: add owner and admin observation edit UI`
- `4da595e docs: record owner edit smoke results`

**한국어:** Phase 20은 20A부터 20K까지 여러 feature, docs, migration-candidate 커밋으로 분리되어 관리되었습니다.

## Notes

- Public approved-only invariant was maintained.
- Pending/rejected public non-exposure was maintained.
- Email public display remains forbidden.
- The admin route remains hidden from the public Navbar.
- Signed, public, blob, and data URLs must not be stored in DB rows.
- Image replacement remains out of scope.
- Codex did not print or store real Supabase/Kakao secrets in the recorded Phase 20 work.

**한국어:** public read는 approved-only를 유지했고 pending/rejected는 public list/detail에 노출되지 않는 것으로 기록되었습니다. email public display, admin Navbar 노출, DB 내 signed/public/blob/data URL 저장은 계속 금지이며, image replacement는 후속 범위입니다.
