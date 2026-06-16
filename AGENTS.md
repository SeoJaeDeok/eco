# AGENTS.md

## Project Identity

This repository is the Kyungpook National University Daegu Campus biodiversity monitoring and eco-map web app.

The project began as a design-only starter. It now has a Supabase-backed observation workflow and hidden admin approval UI prepared, while preserving the original visual language.

Keep the existing Korean UI copy, calm academic design tone, static map fallback, and small-step implementation style unless the user explicitly asks for a change.

## Current State After Phase 17E

Completed and verified:

- Design-only starter cleanup and component refactors are complete.
- Taxon types, constants, badge UI, and common UI primitives are organized.
- Public `ObservationRepository` is async-ready.
- Repository provider can select `mock` or `supabase`.
- Default repository remains `mock` unless env explicitly selects Supabase.
- Supabase public observation repository is implemented.
- Supabase schema/RLS migration draft and setup docs are prepared.
- Supabase connection smoke test passed.
- Supabase approved public read is verified.
- Supabase pending insert is verified.
- Supabase Auth repository is implemented and admin smoke test passed.
- Supabase admin observation repository is implemented.
- Hidden `/#admin` admin route is implemented.
- Admin login page is implemented.
- Admin pending list and approve/reject UI are implemented.
- Admin approve/reject smoke test passed in phase 15C.
- Admin permission/regression verification completed in phase 15D.
- Supabase Storage image upload helper and create-observation flow are implemented in Supabase mode.
- Signed URL image display is implemented for approved public observations and admin review.
- Phase 16 Storage manual upload/admin/approve smoke test passed.
- Supabase Storage hardening and operations documentation is complete.
- 17A Kakao Map provider design is complete.
- 17B Kakao SDK loader and provider implementation is complete.
- Kakao Map can be enabled with a browser-exposed `VITE_KAKAO_MAP_JAVASCRIPT_KEY`.
- Static map fallback remains available when the Kakao key is missing or SDK loading fails.
- 17C Kakao Map manual verification passed with a configured local Kakao JavaScript key.
- 17D Kakao Map fallback and regression verification passed for normal key, no-key fallback, invalid-key fallback, mock mode, Supabase mode, responsive layout, and secret/logging checks.
- 17E Kakao Map UX hardening is complete: loading states, marker hit area/accessibility, and static fallback copy were minimally tightened without changing repository, Storage, Auth, admin, or package behavior.
- General public flow is normal: home, guide, observation list, detail modal, upload screen, static fallback, and Kakao map when configured.

## Next Starting Point

The next recommended step starts at:

```text
Next user-approved phase
```

Recommended sequence:

1. Continue with the next user-approved phase.
2. Re-run Kakao map fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
3. Continue monitoring rejected/orphan image cleanup needs.

## New Session Entry Checklist

At the beginning of a new Codex session:

1. Read `AGENTS.md`.
2. Read `README.md`.
3. Read `docs/architecture/next-session-handoff.md`.
4. Run `git status --short --branch`.
5. Confirm `.env.local` is not tracked.
6. Do not modify code yet.
7. First report the current state summary and the intended next step.

Suggested new-session prompt:

```text
AGENTS.md를 먼저 읽고, README.md와 docs/architecture/next-session-handoff.md, docs/architecture/kakao-map-provider-design.md를 읽어 현재 상태를 요약해 주세요. 아직 코드는 수정하지 마세요. Phase 17E Kakao Map UX hardening은 완료됐고, 다음 작업은 사용자 승인에 따른 다음 phase입니다.
```

## Current Stack

- Runtime/build: Vite + React + TypeScript
- Styling: Tailwind CSS v4 through `@tailwindcss/vite`
- Animation: `motion/react`
- Icons: `lucide-react`
- Data source selection: `mock` or `supabase` through `VITE_OBSERVATION_REPOSITORY`
- Default data source: `mock`
- Real database option: Supabase
- Admin auth: Supabase Auth
- Admin authorization: Supabase RLS + `public.profiles.role = 'admin'`
- Current map: static fallback plus optional Kakao provider
- Real map provider: Kakao SDK loader/provider implemented, manually verified through phase 17D, and minimally UX-hardened in phase 17E
- Image upload/Storage: private `observation-images` bucket flow with object paths and runtime signed URLs in Supabase mode

## Setup And Verification

Use npm unless the user explicitly asks to migrate package managers.

On Windows PowerShell, prefer `npm.cmd` because `npm.ps1` may be blocked by execution policy.

Install:

```bash
npm.cmd ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
```

Run dev server:

```bash
npm.cmd run dev
```

If port 3000 is already in use, use another port:

```bash
npm.cmd run dev -- --port 3002
```

Verify after code changes:

```bash
npm.cmd run typecheck
npm.cmd run build
```

Run when dependencies change or before release/push checks:

```bash
npm.cmd audit --audit-level=high
```

## Non-Negotiable Security Rules

1. Do not print `.env.local`.
2. Do not print Supabase URL, anon key, tokens, emails, or passwords.
3. Do not hardcode API keys, tokens, service-role keys, database URLs, or private configuration.
4. Do not use a Supabase service role key in frontend code.
5. Do not add a service role key to `.env.example`.
6. Treat every `VITE_*` value as browser-exposed. Do not put secrets in `VITE_*` variables.
7. Do not create or commit `.env`, `.env.local`, `.env.production`, or other secret-bearing files.
8. Do not commit `dist` or `node_modules`.
9. Keep Supabase RLS enabled.
10. Hidden `/#admin` routing is not a security boundary. Real security must stay in Supabase Auth + RLS + `profiles.role = 'admin'`.

## Current Implementation Boundaries

Do not do these without explicit user approval:

1. Expand Kakao Map beyond the approved phase 17B provider scope.
2. Add Naver Map real provider.
3. Add Leaflet or MapLibre real provider.
4. Add new Supabase Storage behavior beyond the approved phase 16 scope.
5. Add new image upload behavior beyond the approved phase 16 scope.
6. Add new dependencies.
7. Expose the admin route in `Navbar`.
8. Weaken RLS policies.
9. Let public insert create `approved` observations directly.
10. Show `pending` or `rejected` observations in public lists.
11. Add server APIs.
12. Add audit log, reject note, bulk approval, user management UI, spam/rate-limit/CAPTCHA, PWA, or app packaging unless that phase is requested.
13. Change UI design, Korean copy, colors, spacing, layout, animations, or behavior unless requested.
14. Modify `package.json` or `package-lock.json` unless there is a clear user-approved reason.

## Repository Structure

```text
src/App.tsx
  App shell, page state, selected observation modal state, repository reads, Navbar, routes.

src/components/AppRoutes.tsx
  Simple state/hash based route switch. No React Router.

src/components/Navbar.tsx
  Main public navigation. Admin link is intentionally not shown.

src/components/Hero.tsx
  Landing/hero section. Treat as a distinct design surface.

src/components/IntroPage.tsx
  Biodiversity guide page state and composition.

src/components/ObservationListPage.tsx
  Public observation list state, filtering/sorting composition, card selection wiring.

src/components/ObservationDetail.tsx
  Observation detail modal wrapper and detail composition.

src/components/UploadMockPage.tsx
  Upload form state and submit flow. Uses repository create flow; Supabase mode uploads selected images through repository/helper code.

src/components/admin/
  Hidden admin login/session/pending review UI.

src/components/ui/
  Small reusable UI primitives: Button, ImageFrame, PageHeader, SearchInput, TaxonFilterButton.

src/components/intro/
  IntroPage-only UI components.

src/components/observations/
  Observation list/card UI components.

src/components/observations/detail/
  Observation detail modal UI components.

src/components/upload/
  Upload page UI components.

src/components/map/
  Static design-only map UI components.

src/features/map/
  Provider-neutral map types, static provider, and projection helpers.

src/features/upload/
  Upload form helpers and form-to-create-input conversion.

src/repositories/
  Public, admin, and auth repository contracts and provider selection.

src/repositories/supabase/
  Supabase client helper, public observation repository, admin observation repository, auth repository, DB row types, and mappers.

src/constants/
  Taxon list, taxon filters, taxon style/color mapping.

src/data/
  Static mock sample observations.

src/utils/
  Observation filters, stats, and validation helpers.

src/types.ts
  Shared domain and page types.

supabase/migrations/
  SQL migration draft for observations, profiles, RLS, and admin policies.

docs/architecture/
  Architecture notes, setup guides, admin flow docs, and session handoff docs.

docs/adr/
  Architecture decision records.
```

## Data And Repository Rules

- Keep public observation reads behind `ObservationRepository`.
- Keep admin-only review actions behind `AdminObservationRepository`.
- Keep auth/session checks behind `AuthRepository`.
- Do not call Supabase directly from UI components unless that phase explicitly chooses it.
- Public list must show only approved observations.
- Public create must produce pending observations.
- Pending and rejected observations must remain hidden from public lists.
- Admin approve/reject must rely on the Supabase admin repository and RLS.
- Do not mutate `sampleObservations` to simulate persistence unless the user asks for that behavior.
- Do not store preview/blob URLs as DB `image_url`.
- Supabase image uploads store files in object storage and save only object paths/metadata in database rows.

## Map Rules

- Static map components are intentional placeholders.
- Keep `No Map API` / design-only messaging for static fallback states.
- Keep static fallback available after a real provider is added.
- Do not add SDK loaders, script tags, map env reads, or provider implementation files before the user approves that phase.
- Marker colors must remain taxon-based.
- Provider-neutral map types belong in `src/features/map/`.
- Static map UI belongs in `src/components/map/`.
- `src/components/DesignMap.tsx` is a compatibility wrapper. Do not remove it casually.

## Storage Phase Rules

When phase 16 begins:

- Start with documentation and policy design.
- Decide public vs private bucket before coding.
- Decide object paths before coding.
- Decide how pending images are protected before coding.
- Decide how approved images are served before coding.
- Do not implement image upload until the Storage design is approved.
- Do not weaken observation visibility rules to make image display easier.

## UI And Design Rules

- Preserve the calm academic visual language.
- Preserve Korean UI copy unless the user asks for another language.
- Preserve serif Korean headings, small uppercase metadata, subtle borders, light shadows, white/zinc palette, and muted accent colors.
- Do not change spacing, layout, color, typography, button labels, placeholder text, or animation timing during refactors.
- Use existing reusable primitives in `src/components/ui/` only when they preserve visual output.
- Do not over-abstract. Extract repeated UI only when it reduces real duplication without changing behavior.
- Do not add a component library unless the user asks.

## Working Style

- Before modifying code, inspect relevant files and state a short plan with expected files.
- Work in small, reviewable steps.
- Keep refactors separate from feature work.
- Preserve existing import compatibility where wrappers already exist.
- Avoid large rewrites and broad folder moves.
- Avoid adding barrel files unless the user asks for that cleanup.
- Use TypeScript strict mode and explicit prop interfaces for exported components.
- Avoid `any`; prefer concrete types or `unknown` plus narrowing.
- Buttons that perform UI actions must use `type="button"` unless intentionally submit/reset buttons.
- Images must have meaningful `alt` text or empty alt if purely decorative.
- Use `rg`/`rg --files` for searches when available.

## Git And GitHub Push Checklist

Before committing or pushing to GitHub:

1. Run `git status --short --branch`.
2. Confirm `.env.local` is ignored and not staged.
3. Confirm `dist` and `node_modules` are not staged.
4. Check tracked files for sensitive files:

```bash
git ls-files .env .env.local .env.production dist node_modules
```

5. Confirm `README.md`, `AGENTS.md`, and `docs/architecture/next-session-handoff.md` are up to date.
6. Run:

```bash
npm.cmd run typecheck
npm.cmd run build
```

7. If dependencies changed, run:

```bash
npm.cmd audit --audit-level=high
```

8. Review `git diff --stat` and relevant diffs before staging.
9. Stage only intended files.
10. Push only after verifying no secrets or generated folders are included.

## Completed Phase Summary

- Phase 1: `App.tsx` thinned and page routing/page state moved into app route/page components.
- Phase 2: `Taxon`, taxon constants/style mapping, and `TaxonBadge` organized.
- Phase 3: Observation repository interface and mock repository structure added.
- Phase 4: Static map layer split into provider-neutral map types/projection and static map components.
- Phase 5: `CreateObservationInput`, upload form values, upload helpers, and validation helper prepared.
- Phase 6A: `UploadMockPage` split into upload-specific components.
- Phase 6B: `ObservationListPage` split into observation list components.
- Phase 6C: `ObservationDetail` modal split into detail components.
- Phase 6D: `IntroPage` biodiversity guide split into intro components.
- Phase 7A: `SearchInput` common UI component added and minimally applied.
- Phase 7B: `ImageFrame` common UI component added and minimally applied.
- Phase 7C: `Button` common UI component added and minimally applied.
- Phase 7D: `TaxonFilterButton` common UI component added and minimally applied.
- Phase 7E: `PageHeader` common UI component added and minimally applied.
- Phase 8A: Structure check and reproducibility baseline completed.
- Phase 9: Storage/map provider ADRs and Supabase schema/RLS planning completed.
- Phase 10: Repository async flow, upload submit repository path, and DB row mappers prepared.
- Phase 11: Supabase public repository and repository selection policy implemented.
- Phase 12: Supabase schema/RLS SQL draft and hardening completed.
- Phase 13: Supabase public read, pending insert, and manual approval smoke tests completed.
- Phase 14: Admin/auth repository contracts and Supabase implementations completed.
- Phase 15A: Admin routing/UI plan documented.
- Phase 15B: Hidden admin login page implemented.
- Phase 15C: Admin pending approval UI implemented.
- Phase 15D: Admin permission/regression verification completed.
- Phase 15E: Admin documentation updated.
- Phase 16A: Supabase Storage image upload design completed.
- Phase 16B: Supabase Storage setup guide completed.
- Phase 16B.5: Storage migration candidate completed.
- Phase 16C: Supabase Storage upload helper and create flow implemented.
- Phase 16D: Signed URL image display connected for admin review and approved public observations.
- Phase 16D.5: Supabase Storage read-only preflight and dev server root check completed.
- Phase 16E: Supabase Storage hardening and operations documentation completed.
- Phase 16 final smoke: Supabase Storage upload/admin/approve manual smoke test passed.
- Phase 17A: Kakao Map provider design completed.
- Phase 17B: Kakao SDK loader and provider implementation completed.
- Phase 17C: Kakao Map manual verification completed.
- Phase 17D: Kakao Map fallback and regression verification completed.
- Phase 17E: Kakao Map UX hardening completed.

## Review Checklist Before Final Response

For every code-changing task, report:

- Files changed
- What changed and why
- Whether UI behavior changed
- Commands run and pass/fail results
- Any remaining risks or TODOs

For documentation-only tasks, report:

- Files changed
- Main sections updated
- Whether app code or package files changed
- Whether verification commands were run
