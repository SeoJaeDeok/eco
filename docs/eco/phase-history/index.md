# Phase History Archive

## Purpose

This archive keeps concise, durable summaries of completed project phases for the KNU Eco Map app.

**한국어:** 이 아카이브는 KNU Eco Map 앱의 완료된 phase를 짧고 오래 유지 가능한 형태로 정리합니다.

The active handoff document remains the source of truth for the latest current state:

**한국어:** 최신 현재 상태는 항상 handoff 문서를 우선 기준으로 확인합니다.

- `docs/architecture/next-session-handoff.md`

This archive is intentionally split into one Markdown file per phase. That structure keeps each phase reviewable, prevents a single long history file from becoming hard to maintain, and makes it easy to add Phase 20 and later records after those phases are complete.

**한국어:** phase별 독립 Markdown 구조는 Git diff 검토가 쉽고, 긴 단일 문서가 비대해지는 문제를 줄이며, Phase 20 이후 기록을 완료 시점마다 추가하기 좋습니다.

## How To Use This Archive

- Use this index to find the phase file you need.
- Use each phase file for historical context, not for current runtime configuration.
- Check `docs/architecture/next-session-handoff.md` before starting new work.
- Use `docs/eco/project-working-guide.md` for the project workflow and decision process.
- When facts are not explicitly recorded in project docs or commits, phase files say so instead of guessing.

**한국어:** 필요한 phase 파일을 찾을 때는 이 index를 사용하되, 실제 다음 작업 전에는 `next-session-handoff.md`를 먼저 확인합니다. 작업 방식과 의사결정 흐름은 `docs/eco/project-working-guide.md`를 참고하고, 문서나 커밋으로 확인되지 않은 내용은 추정하지 않고 명시적으로 불확실하다고 적습니다.

## Phase Files

| Phase | Title | Status | Summary | Link |
| --- | --- | --- | --- | --- |
| 1 | App Shell And Routing Cleanup | Completed | Thinned `App.tsx` and moved route/page state into app route and page components. | [phase-01.md](phase-01.md) |
| 2 | Taxon Types And Badge Cleanup | Completed | Organized taxon types, constants, style mapping, and badge UI. | [phase-02.md](phase-02.md) |
| 3 | Observation Repository Contract | Completed | Added the public observation repository interface and mock repository structure. | [phase-03.md](phase-03.md) |
| 4 | Provider-Neutral Static Map Layer | Completed | Split static map behavior into provider-neutral map types, projection helpers, and static map components. | [phase-04.md](phase-04.md) |
| 5 | Upload Types And Validation Helpers | Completed | Prepared create-observation input types, upload form values, upload helpers, and validation helpers. | [phase-05.md](phase-05.md) |
| 6 | Page Component Splits | Completed | Split upload, observation list, observation detail, and intro page UI into focused components. | [phase-06.md](phase-06.md) |
| 7 | Shared UI Primitives | Completed | Added and minimally applied common UI primitives such as search, image frame, buttons, taxon filter buttons, and page headers. | [phase-07.md](phase-07.md) |
| 8 | Structure Check And Reproducibility Baseline | Completed | Established the post-refactor structure check and reproducibility baseline. | [phase-08.md](phase-08.md) |
| 9 | Provider ADRs And Supabase Planning | Design completed | Documented Storage and map provider decisions plus Supabase schema/RLS planning. | [phase-09.md](phase-09.md) |
| 10 | Async Repository And Mapper Preparation | Completed | Prepared async repository flow, upload submit repository routing, and Supabase DB row mappers. | [phase-10.md](phase-10.md) |
| 11 | Supabase Public Repository Selection | Completed | Implemented the Supabase public observation repository and repository provider selection policy. | [phase-11.md](phase-11.md) |
| 12 | Supabase Schema And RLS Draft | Design completed | Added the Supabase schema/RLS migration draft and hardening notes. | [phase-12.md](phase-12.md) |
| 13 | Supabase Public Read And Pending Insert Smoke | Verified | Verified Supabase approved public reads, pending public insert, and manual approval flow. | [phase-13.md](phase-13.md) |
| 14 | Admin/Auth Repository Layer | Completed | Added admin observation and auth repository contracts plus Supabase implementations. | [phase-14.md](phase-14.md) |
| 15 | Hidden Admin Approval UI | Verified | Documented and implemented the hidden admin login, pending review, approve/reject UI, and permission regression checks. | [phase-15.md](phase-15.md) |
| 16 | Supabase Storage Image Flow | Verified | Designed, implemented, and manually verified private Storage upload plus runtime signed image display. | [phase-16.md](phase-16.md) |
| 17 | Kakao Map Provider | Verified | Designed, implemented, verified, and UX-hardened the Kakao Map provider while preserving static fallback. | [phase-17.md](phase-17.md) |
| 18 | Storage Operations Hardening | Completed | Documented operations runbooks, monitoring, signed URL refresh MVP, abuse mitigation, and cleanup automation design. | [phase-18.md](phase-18.md) |
| 19 | Public Observation List Filter/Search UX | Verified | Prioritized, implemented, and regression-verified client-side public list search, taxon/image filters, sorting, result counts, and empty state while preserving approved-only reads. | [phase-19.md](phase-19.md) |
| 20 | Public User Contribution And Owner Editing | Verified | Implemented public login/upload gate, authenticated approved contribution, safe observer display, owner/admin content editing, and live owner/non-owner/admin smoke while preserving approved-only public reads. | [phase-20.md](phase-20.md) |
| 21 | Public UX Stabilization And Taxonomy Design | Verified with partial live checks | Implemented Navbar auth-slot stabilization, public signup, image prefetch/retry, 20 MB app-side upload validation, map search/multi-taxon filtering, taxonomy design docs, and Phase 21.5 hardening checks. | [phase-21.md](phase-21.md) |
| 22 | Signup Profile Provisioning And Live Contribution Smoke | Verified with partial operational checks | Prepared and corrected signup profile provisioning migration 0005, verified live signup/profile/contribution/owner-edit flow, aligned the image-size DB check through 0006, and verified an approximately 9 MB Storage upload plus manual orphan cleanup while leaving near-20 MB/production checks partial. | [phase-22.md](phase-22.md) |
| 23 | Vercel Deployment And Production Smoke | Verified with partial production regression checks | Prepared and deployed the Vite SPA through Vercel, configured SPA fallback, integrated the verified release into main, and verified the first HTTPS production deployment. | [phase-23.md](phase-23.md) |

**한국어:** 위 표는 완료된 Phase 1~23의 핵심 제목, 상태, 요약, 링크를 한눈에 찾기 위한 목록입니다. Phase 24 이후는 해당 phase가 완료되거나 명시적으로 종료된 뒤 같은 형식으로 추가합니다.

## Adding A New Completed Phase

1. Wait until the phase is complete or intentionally closed.
2. Copy `_phase-template.md` to `phase-XX.md`.
3. Fill only facts supported by `AGENTS.md`, `README.md`, `docs/architecture/next-session-handoff.md`, relevant architecture docs, and commit history.
4. Mark unknown verification as `not explicitly recorded`.
5. Do not include `.env.local` contents, real API keys, tokens, passwords, emails, full SDK URLs, or project-specific secret values.
6. Add the new phase row to this index.
7. If useful, add a short pointer in `README.md`, `AGENTS.md`, or the handoff document.
8. Run the documentation checks requested for the phase.

**한국어:** 새 phase는 완료 또는 종료가 확인된 뒤 `_phase-template.md`를 복사해 작성합니다. 영어 설명을 유지하고, 각 섹션 아래에는 한국어 요약을 병기하되 실제 비밀값이나 확인되지 않은 검증 결과는 쓰지 않습니다.
