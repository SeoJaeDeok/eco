# Project Working Guide

**한국어:** 프로젝트 작업 운영 가이드

## Purpose

This guide helps a new GPT/Codex session understand how work is planned, scoped, verified, documented, and committed in the KNU Eco Map project.

It is not the latest status document. Use `docs/architecture/next-session-handoff.md` for current state and next-step truth. Use `docs/eco/phase-history/` for completed phase context.

**한국어:** 이 문서는 새 세션이 프로젝트 작업 방식과 의사결정 흐름을 빠르게 이해하기 위한 운영 가이드입니다. 최신 현재 상태는 `next-session-handoff.md`가 우선이고, 완료 phase 맥락은 `docs/eco/phase-history/`를 봅니다.

## Source-Of-Truth Hierarchy

1. `AGENTS.md`: non-negotiable rules, security boundaries, workflow, and repository conventions.
2. `docs/architecture/next-session-handoff.md`: latest current state, known risks, and recommended next step.
3. `README.md`: setup, run commands, structure, and feature overview.
4. `docs/eco/phase-history/index.md`: completed phase archive and links to phase records.
5. `docs/architecture/*.md`: feature-specific design, RLS, operations, and verification notes.
6. `git status` and `git log`: actual working tree and commit state.

**한국어:** 규칙은 `AGENTS.md`, 최신 상태는 handoff, 실행/구조는 README, 완료 phase는 phase-history, 세부 설계는 architecture 문서를 우선합니다. 실제 파일 변경과 커밋 상태는 항상 git 상태로 확인합니다.

## New Session Entry Routine

At the beginning of a new work session:

1. Read `AGENTS.md`.
2. Read `README.md`.
3. Read `docs/architecture/next-session-handoff.md`.
4. Read relevant phase, design, RLS, Storage, Kakao, or admin docs for the task.
5. Run `git status --short --branch`.
6. Run `git ls-files -- .env .env.local .env.production dist node_modules`.
7. Before editing, report the current state, expected changed files, and a short plan.

**한국어:** 새 세션은 기준 문서와 git 상태를 먼저 확인하고, 코드 수정 전에 현재 상태와 예상 변경 범위를 보고합니다. `.env.local`은 존재 여부나 추적 여부만 확인하고 내용은 읽거나 출력하지 않습니다.

## Phase Workflow

Use small, reviewable phases:

1. Design-only phase: document goals, boundaries, options, and recommended direction.
2. SQL/RLS draft phase: write draft SQL under docs or a clearly marked candidate without applying it.
3. Apply-readiness review: check whether a draft can become an apply-ready migration.
4. Manual apply: the user/operator applies approved SQL outside Codex when required.
5. Implementation phase: change app/repository/UI code within the approved scope.
6. Smoke/regression phase: verify behavior, security invariants, and no-secret logging.
7. Documentation update: record exact PASS/PARTIAL/FAIL facts without overclaiming.
8. Commit/push: stage intended files only and push normally.
9. Phase-history archive: after a phase is complete, add the bilingual archive entry.

**한국어:** 설계, SQL/RLS draft, apply-readiness, 수동 적용, 구현, smoke/regression, 문서화, commit/push, phase-history 작성 순서로 작게 진행합니다. 확인되지 않은 검증은 완료로 쓰지 않습니다.

## Feature Triage Guide

- Small UI bug/polish: usually implement directly after reading relevant components; run typecheck/build and focused smoke.
- Repository-only change: preserve UI boundaries, update contracts/mappers, and verify public approved-only reads.
- DB/RLS/Auth change: design first, then SQL draft, apply-readiness, manual apply, and smoke.
- Storage change: design first; decide object paths, visibility, cleanup, and signed URL behavior before code.
- Map/Kakao change: preserve provider boundary and static fallback; re-run normal/no-key/fallback checks.
- Admin/security change: design first; keep `/#admin` hidden and rely on Auth/RLS, not route hiding.
- Deployment/domain change: document environment/domain prerequisites and run production smoke only after explicit approval.

**한국어:** 작은 UI 수정은 바로 구현 가능할 수 있지만, DB/RLS/Auth/Storage/Kakao/Admin/security 성격의 변경은 먼저 설계와 수동 검증 계획이 필요합니다. 배포/domain 작업은 별도 승인과 smoke 기준을 명확히 해야 합니다.

## Security And Privacy Rules

- Do not print `.env.local`.
- Do not print Supabase URLs, anon keys, tokens, emails, passwords, Kakao keys, or full SDK URLs.
- Do not use a service role key in frontend code.
- Treat every `VITE_*` value as browser-exposed.
- Do not commit `.env`, `.env.local`, `.env.production`, `dist`, or `node_modules`.
- Do not show email addresses in public UI.
- Keep the admin route hidden from `Navbar`.
- Do not weaken RLS.
- Do not expose pending or rejected observations in public list/detail.
- Do not store signed, public, blob, preview, or data URLs in DB rows.

**한국어:** 실제 key, URL, token, email, password는 문서나 로그에 포함하지 않습니다. public UI는 approved-only와 email 비노출을 유지하고, admin route는 Navbar에 노출하지 않으며, signed URL 계열 값은 DB에 저장하지 않습니다.

## Repository And Architecture Boundaries

- UI components must not call Supabase directly.
- Public reads and public create/update paths stay behind `ObservationRepository`.
- Admin review and admin update actions stay behind `AdminObservationRepository`.
- Auth/session/profile checks stay behind `AuthRepository`.
- Storage image upload and signed URL generation stay behind repository/helper code.
- Kakao SDK usage stays behind the map provider boundary.
- Static map fallback must remain available.

**한국어:** UI는 Supabase, Storage, Kakao SDK를 직접 호출하지 않습니다. public/admin/auth/storage/map 경계는 repository/helper/provider 계층에 유지하고, static fallback은 계속 보존합니다.

## Current Core Invariants

- Public reads are approved-only.
- Pending and rejected observations are hidden from public list/detail.
- Signed-in Supabase users create approved observations through the authenticated direct-create path.
- Observer display uses safe display text only; email-like values are suppressed.
- Only the owner or an admin can edit observation content.
- Protected fields must not be updated through owner/admin edit payloads.
- Image replacement remains out of scope.
- The admin route is not shown in `Navbar`.
- Kakao has a static fallback for missing or failed SDK loading.
- Image display uses runtime signed URLs; DB rows store paths and metadata only.

**한국어:** approved-only public read, pending/rejected 미노출, 로그인 사용자 approved create, safe observer display, owner/admin edit, protected field 차단, image replacement 비범위, admin Navbar 미노출, Kakao fallback, runtime signed URL 원칙을 깨면 안 됩니다.

## Manual Verification Patterns

- Storage smoke: upload, DB row, Storage metadata, admin review image, approve/reject, public image display, no URL-like `image_url`.
- Kakao smoke: normal key render, no-key fallback, invalid/domain fallback, mock/Supabase mode, responsive layout, no key logging.
- Public visibility check: approved rows visible, pending/rejected rows invisible in list/detail, public repository query remains approved-only.
- Auth/login smoke: signed-out gate, login, safe Navbar display, upload form access, logout returns to gate.
- Owner/non-owner/admin edit smoke: owner edits allowed fields, non-owner denied/hidden, anonymous hidden, admin edit works, protected fields unchanged.
- Secret/logging check: console/logs and diffs contain no keys, tokens, emails, passwords, full SDK URLs, or `.env.local` contents.
- Production smoke: run only after deployment/domain approval and record exact environment scope.

**한국어:** 수동 검증은 기능별 템플릿으로 기록합니다. 전체 검증이 불가능하면 PASS가 아니라 PARTIAL로 남기고 필요한 전제나 남은 항목을 명확히 적습니다.

## Commit And Push Routine

Before commit/push:

1. Run `git status --short --branch`.
2. Run `git diff --check`.
3. Run `npm.cmd run typecheck` and `npm.cmd run build` for code changes.
4. For docs-only changes, typecheck/build may be skipped with a stated reason.
5. Run a secret-like diff scan without reading or printing `.env.local`.
6. Confirm `src`, package files, and migrations changed only when intended.
7. Stage intended files only.
8. Do not amend already pushed commits unless explicitly requested.
9. Do not force push.
10. Use normal `git push`.
11. Report commit hash, files, verification, secret check, and remaining TODOs.

**한국어:** commit 전에는 상태, diff, 검증, secret-like scan, intended files stage를 확인합니다. 이미 push된 commit은 amend하지 않고 force push도 하지 않습니다.

## Phase History Procedure

When a phase is complete:

1. Copy `docs/eco/phase-history/_phase-template.md` to `phase-XX.md`.
2. Keep English sections and add Korean companion summaries.
3. Update `docs/eco/phase-history/index.md`.
4. Use `not explicitly recorded` for missing verification.
5. Do not overstate completion or smoke results.
6. Keep phase history as historical context; keep current state in `next-session-handoff.md`.
7. Run `git diff --check`, trailing whitespace check, EOF newline check, and secret-like scan.

**한국어:** phase-history는 완료된 작업의 역사적 맥락입니다. 최신 상태와 다음 작업은 handoff가 우선입니다. 검증 기록이 없으면 추정하지 않고 `not explicitly recorded`를 사용합니다.

## Prompt Style Guide

- Ask the session to read relevant files before changing anything.
- Ask for expected changed files and a short plan before edits.
- State whether app code, package files, Supabase migrations, RLS, Storage, Kakao, Auth, or Admin flows may change.
- Require verification commands and pass/fail reporting.
- Require remaining risks and TODOs.
- Record manual smoke as PASS, PARTIAL, or FAIL based only on checked facts.

**한국어:** 좋은 프롬프트는 읽을 파일, 변경 범위, 비범위, 검증 명령, 보고 형식을 분명히 줍니다. 수동 smoke가 불완전하면 PARTIAL로 기록해야 합니다.

## Recommended Next Decision Point

After Phase 20, choose the next work explicitly before implementing:

- deployment/domain readiness
- upload UX polish
- admin review UX polish
- map-list synchronization
- content expansion
- operations hardening follow-up

The next actual phase should be selected and scoped by the user before code, SQL, or deployment work begins.

**한국어:** Phase 20 이후에는 배포/domain 준비, upload UX, admin review UX, 지도-목록 연동, 콘텐츠 확장, 운영 hardening 후속 중에서 사용자가 다음 방향을 선택한 뒤 진행합니다.
