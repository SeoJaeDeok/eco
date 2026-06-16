# Phase History Archive

## Purpose

This archive keeps concise, durable summaries of completed project phases for the KNU Eco Map app.

The active handoff document remains the source of truth for the latest current state:

- `docs/architecture/next-session-handoff.md`

This archive is intentionally split into one Markdown file per phase. That structure keeps each phase reviewable, prevents a single long history file from becoming hard to maintain, and makes it easy to add Phase 19, Phase 20, and later records after those phases are complete.

## How To Use This Archive

- Use this index to find the phase file you need.
- Use each phase file for historical context, not for current runtime configuration.
- Check `docs/architecture/next-session-handoff.md` before starting new work.
- When facts are not explicitly recorded in project docs or commits, phase files say so instead of guessing.

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

## Adding A New Completed Phase

1. Wait until the phase is complete or intentionally closed.
2. Copy `_phase-template.md` to `phase-XX.md`.
3. Fill only facts supported by `AGENTS.md`, `README.md`, `docs/architecture/next-session-handoff.md`, relevant architecture docs, and commit history.
4. Mark unknown verification as `not explicitly recorded`.
5. Do not include `.env.local` contents, real API keys, tokens, passwords, emails, full SDK URLs, or project-specific secret values.
6. Add the new phase row to this index.
7. If useful, add a short pointer in `README.md`, `AGENTS.md`, or the handoff document.
8. Run the documentation checks requested for the phase.
