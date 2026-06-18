# Phase 21 - Public UX Stabilization And Taxonomy Design

## Status

Verified with Phase 21.5 hardening checks. Live account, backend upload-limit, and Kakao normal-key checks remain partially verified.

**한국어:** Phase 21.5 hardening 검증까지 반영했습니다. 실제 계정, backend 업로드 제한, Kakao 정상 키 검증은 아직 PARTIAL입니다.

## Goal

- Stabilize public UX around Navbar auth state, signup, image loading, upload limits, and map search/filter.
- Add design-only taxonomy resolver and taxonomy tree plans without external API, DB/RLS, or app taxonomy implementation.

**한국어:** Navbar/auth/signup/image/upload/map UX를 안정화하고, taxonomy resolver/tree는 설계 문서로만 정리했습니다.

## Main Work

- Phase 21A reserved a stable Navbar auth slot and truncates long display names.
- Phase 21B added public signup through `AuthRepository`, with login/signup modes and email-confirmation/profile-setup handling.
- Phase 21C/21D added runtime signed-image prefetch/retry and a named 20 MB app-side image validation limit.
- Phase 21E added client-side map search, species suggestions, multi-select taxon filters, reset, and Korean empty state copy.
- Phase 21F added taxonomy resolver and taxonomy tree visualization design docs.
- Phase 21.5 hardened small UX edges:
  - invalid image selections now clear stale selected image state;
  - oversized image copy states both accepted formats and the 20 MB app-side limit;
  - failed detail images show the stable placeholder while the one-time repository refresh path runs;
  - map species grouping keys by scientific name when present, so matching scientific names group together.

**한국어:** Phase 21A~21F 구현/설계에 더해 Phase 21.5에서 이미지 선택, 이미지 실패 표시, species grouping을 작게 보강했습니다.

## Key Files

- `src/components/Navbar.tsx`
- `src/components/auth/PublicLoginPanel.tsx`
- `src/components/auth/UploadLoginGate.tsx`
- `src/App.tsx`
- `src/components/MapPage.tsx`
- `src/components/UploadMockPage.tsx`
- `src/components/observations/detail/ObservationDetailImage.tsx`
- `src/constants/upload.ts`
- `src/utils/observationFilters.ts`
- `src/utils/observationImagePrefetch.ts`
- `src/repositories/authRepository.ts`
- `src/repositories/supabase/supabaseAuthRepository.ts`
- `docs/architecture/public-signup-profile-setup-plan.md`
- `docs/architecture/sql-drafts/0005_public_signup_profile_draft.sql`
- `docs/architecture/taxonomy-resolution-design.md`
- `docs/architecture/taxonomy-tree-visualization-design.md`

**한국어:** public auth/signup, upload/image, map filtering, taxonomy design 관련 파일이 핵심입니다.

## Verification

- Base full Phase 21 commit `fd02f71`: `npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check` passed in the implementation session.
- Phase 21.5 branch setup confirmed `backup/phase-21-before-return-to-phase-20` still points to `fd02f71`, `main` still points to `4da595e`, and `feature/phase-21-sequential` still points to `30ecd0e`.
- Phase 21.5 code hardening commit `8046de9`: `npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check` passed before commit.
- Phase 21.5 headless local Chrome smoke passed for:
  - signed-out Navbar without admin exposure;
  - auth panel login/signup mode rendering;
  - signup password mismatch and email-like nickname validation;
  - signed-out upload gate and signup tab;
  - observation image cards/detail/reopen display;
  - app-side 20 MB validation constants and accepted MIME set;
  - map search, species suggestion click, single/multiple taxon filters, reset, and empty state;
  - public approved-only read count with zero visible non-approved rows;
  - zero persisted URL-like `image_url` values in approved rows;
  - zero secret-like browser console patterns.
- Live login/logout/signup with real test credentials was not run.
- Live 20 MB Supabase upload/backend acceptance was not run.
- Kakao normal-key render was not rerun in Phase 21.5.
- Owner/admin edit live regression was not rerun in Phase 21.5.

**한국어:** 자동 검증과 signed-out/browser smoke는 통과했습니다. 실제 계정 회원가입/로그인, 20MB backend 업로드, Kakao 정상 키, owner/admin live smoke는 이번 Phase 21.5에서 실행하지 않았습니다.

## Remaining Risks / Follow-ups

- Public signup profile auto-create SQL remains draft-only and was not applied.
- Existing Storage/backend docs still record a 5 MB backend limit; do not claim 20 MB end-to-end support until a separate approved Storage/DB alignment phase verifies it.
- Live account signup/login/logout/upload checks need disposable test credentials.
- Mobile/tablet visual Navbar no-shift checks and Kakao normal-key fallback/regression checks should be rerun before release.
- Taxonomy resolver/tree work remains design-only.

**한국어:** profile trigger SQL 적용, backend 20MB 검증, 실제 계정 smoke, mobile/tablet/Kakao 재검증, taxonomy 구현은 후속 작업입니다.

## Linked Docs

- `docs/architecture/next-session-handoff.md`
- `docs/architecture/public-signup-profile-setup-plan.md`
- `docs/architecture/sql-drafts/0005_public_signup_profile_draft.sql`
- `docs/architecture/supabase-storage-setup.md`
- `docs/architecture/taxonomy-resolution-design.md`
- `docs/architecture/taxonomy-tree-visualization-design.md`

**한국어:** handoff, signup profile draft, Storage 제한 주석, taxonomy 설계 문서를 함께 참고합니다.

## Commit References

- `fd02f71 feat: stabilize public UX for phase 21`
- `8046de9 fix: harden phase 21 public UX edges`

**한국어:** Phase 21 전체 구현 base commit과 Phase 21.5 code hardening commit입니다.

## Notes

- `feature/phase-21-full-hardening` was created from `fd02f71`; the preserved backup branch was not edited directly.
- `feature/phase-21-sequential` remains separate and unchanged.
- No package files, Supabase migrations/RLS, Storage policies, Kakao provider internals, or admin repository behavior changed in Phase 21.5.

**한국어:** hardening branch는 `fd02f71`에서 분기했고, backup/sequential/main branch는 보존했습니다. Phase 21.5는 package, migration/RLS, Storage policy, Kakao provider, admin repository를 바꾸지 않았습니다.
