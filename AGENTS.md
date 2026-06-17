# AGENTS.md

## Project Identity

This repository is the Kyungpook National University Daegu Campus biodiversity monitoring and eco-map web app.

The project began as a design-only starter. It now has a Supabase-backed observation workflow and hidden admin approval UI prepared, while preserving the original visual language.

Keep the existing Korean UI copy, calm academic design tone, static map fallback, and small-step implementation style unless the user explicitly asks for a change.

## Current State After Phase 20H.7 Owner/Admin Edit Trigger And Visibility Documentation

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
- 18A Supabase Storage operations hardening design/runbook is complete. It documents rejected/orphan cleanup options, anonymous upload abuse mitigations, signed URL refresh UX options, monitoring cadence, and read-only SQL drafts without changing app code, package files, Supabase migrations, RLS, or Storage policies.
- 18B Supabase Storage read-only monitoring checklist is complete. It documents weekly/monthly checks, read-only SQL drafts, draft thresholds, result recording, and escalation rules without changing app code, package files, Supabase migrations, RLS, or Storage policies.
- 18C signed URL refresh UX MVP is complete. Public detail modal selection refreshes the selected observation through the active repository, giving Supabase mode a fresh runtime signed URL while keeping UI components Supabase-free and keeping signed/public/blob/data URLs out of the database.
- 18D anonymous upload abuse mitigation decision is complete. It chooses a monitoring-first hybrid MVP direction, keeps anonymous upload enabled while volume is low, and defers CAPTCHA, rate-limit, Edge Function gates, and authenticated contributor mode to later approved phases.
- 18E Storage cleanup automation design is complete. It recommends semi-manual candidate export/review for MVP cleanup, keeps automatic delete deferred, and documents safety guards before any future cleanup implementation.
- 19A next product feature prioritization is complete. It recommends public observation list filter/search UX improvement as the 19B implementation target, with upload UX and admin review UX as follow-up candidates.
- 19B public observation list filter/search UX improvement is complete. The public list now supports client-side text search, taxon filtering, image-present filtering, newest/oldest/name sorting, result counts, and an empty state while preserving approved-only repository reads.
- 19C public observation list filter/search regression verification is complete. Mock/no-key and Supabase/no-key browser checks passed for filtering, sorting, empty state, detail modal, static fallback map, mobile layout, and secret/logging checks; Supabase read-only checks confirmed approved-only visibility with 0 pending/rejected rows visible.
- Phase 19 history archive is complete in `docs/eco/phase-history/phase-19.md`.
- 20A Navbar alignment fix is complete. Public pages now reserve stable scrollbar gutter space so the fixed Navbar horizontal alignment does not shift between short and scrolling public routes.
- 20B public user auth/contribution design is complete in `docs/architecture/public-user-auth-contribution-design.md`. It defines the recommended auth, DB/RLS, repository, UI, privacy, and phased implementation direction without implementing public login, direct approved contribution, observer display, owner edit, or admin edit.
- 20C public user contribution DB/RLS draft is complete in `docs/architecture/public-user-contribution-rls-plan.md`.
- 20C.5 public user contribution SQL draft application-readiness review is complete. The `0003` SQL draft now lives in `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql` instead of `supabase/migrations/` to avoid accidental migration-tool application before approval.
- 20D public login/logout UI, public auth state, and signed-out upload gate are implemented through `AuthRepository`.
- 20D.5 signed-out/headless smoke is partially verified: home/list/map/upload routes load, signed-out upload gate appears, upload form is hidden while signed out, Navbar does not expose admin, and direct `/#admin` still loads. Real Supabase login/logout was not verified because no test account credentials were available in-session.
- 20E-prep promoted the reviewed public user contribution SQL into `supabase/migrations/0003_public_user_contribution.sql` as an apply-ready migration candidate. Codex did not apply it to Supabase.
- 20E authenticated direct approved create is implemented in the Supabase repository path. Signed-in Supabase users create `approved` observations with `observer_id = auth.uid()`, optional safe `observer_display_name`, and Storage object paths under the authenticated owner path. Codex did not apply SQL/RLS in this phase.
- 20E.6 manual smoke result is documented. The user confirmed the 0003 ownership/display columns are present and an admin-authenticated smoke passed for login, signed-out upload gate, logged-in upload form access, approved row creation, `observer_id`, safe non-email `observer_display_name`, image metadata, no URL-like `image_url`, public list display, pending/rejected public invisibility, logout gate return, and console/log secret checks.
- 20F observer display is implemented in public observation cards and detail modal. It uses safe `observer_display_name` values when present and falls back to `등록 관찰자`; email-like display names are not shown.
- 20F.5 observer display regression and non-admin contributor smoke documentation is complete. The user reported a non-admin Supabase account with `role = 'user'`, a profile row, and `display_name`; authenticated create worked with that account. Code/static checks confirmed observer display uses safe fallback, email-like values are suppressed, public reads remain approved-only, and owner/admin edit is still not implemented.
- 20G owner/admin observation edit design is complete in `docs/architecture/owner-admin-observation-edit-design.md`. It recommends owner/admin edit for text/classification/date/location/coordinates/description only, keeps status admin-only, keeps observer/image fields non-editable, excludes image replacement from the MVP, and defers SQL/RLS and UI implementation to later phases.
- 20G does not implement owner edit UI, admin edit UI, public sign-up, display-name setup, SQL/RLS application, package changes, or new dependencies.
- 20H owner/admin observation edit DB/RLS plan is complete in `docs/architecture/owner-admin-observation-edit-rls-plan.md`. It recommends repository payload whitelisting plus DB-level column grants/RLS and a protected-field trigger draft, with RPC left as a fallback if the grant/RLS model is not robust enough.
- 20H SQL draft is stored only at `docs/architecture/sql-drafts/0004_owner_admin_observation_edit_draft.sql`. It was not applied to Supabase and was not promoted into `supabase/migrations/`.
- 20H does not implement repository update methods, edit UI, image replacement, SQL/RLS application, package changes, or new dependencies.
- 20H.5 owner/admin observation edit SQL apply-readiness review is complete. The hybrid repository whitelist + column grants + owner/admin RLS + protected-field trigger strategy is accepted as the initial apply-ready direction, with RPC kept as fallback.
- 20H.5 added `supabase/migrations/0004_owner_admin_observation_edit.sql` as an apply-ready migration candidate. Codex did not apply it to Supabase.
- 20H.5 does not implement repository update methods, edit UI, image replacement, package changes, or new dependencies.
- 20H.6 manual apply result documentation is complete. The user manually applied 0004 in dev/local Supabase with no reported errors, production was not changed, and Codex did not apply SQL/RLS. Trigger presence still needs read-only SQL Editor confirmation before 20I.
- 20H.6 does not implement repository update methods, edit UI, image replacement, package changes, or new dependencies.
- 20H.7 trigger and public visibility confirmation documentation is complete. The expected `observations_guard_edit_fields` and `observations_set_updated_at` `BEFORE UPDATE` triggers are connected to `public.observations`.
- 20H.7 records public approved list loading as passed, but pending/rejected were reported as visible in public list/detail. Treat this as a public visibility blocker to clarify or fix before 20I. Codex did not apply SQL/RLS.
- 20H.7 does not implement repository update methods, edit UI, image replacement, package changes, or new dependencies.
- General public routes still load, but 20H.7 reported a pending/rejected public visibility blocker that must be clarified before owner/admin edit work continues.

## Next Starting Point

The next recommended step starts at:

```text
Clarify public visibility, then 20I repository update methods
```

Recommended sequence:

1. Clarify whether the 20H.7 `pending/rejected visible: yes` result means the rows were actually visible in public list/detail.
2. If pending/rejected are actually visible, run a focused public visibility investigation/fix before owner/admin edit work.
3. If public visibility is corrected to pending/rejected hidden, start 20I repository update methods.
4. Keep edit UI implementation deferred until repository update methods are accepted.
5. Run owner/non-owner/admin update probes in 20K after repository and UI paths exist.
6. If launch needs field-by-field evidence for a non-admin row, recheck `status`, `observer_id`, safe `observer_display_name`, image metadata, and URL-like `image_url` before edit implementation.
7. Start 18F CAPTCHA/rate-limit design only if monitoring thresholds are exceeded or launch risk changes.
8. Start a separately approved cleanup implementation phase only after phase-label confirmation and the 18E safety preconditions are met.
9. Continue monitoring rejected/orphan image cleanup and anonymous upload thresholds.

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
Read AGENTS.md, README.md, and docs/architecture/next-session-handoff.md. Do not modify code yet. Phase 20H.7 owner/admin edit trigger and visibility documentation is complete. The expected 0004 triggers are connected in dev/local Supabase, production was not changed, and Codex did not apply SQL/RLS. Pending/rejected were reported as visible in public list/detail; clarify or fix that public visibility blocker before 20I repository update methods. Edit UI, owner edit, and admin edit are not implemented yet.
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
9. Change the approved 20E authenticated direct-create behavior without a new approved phase.
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

docs/architecture/sql-drafts/
  Reviewed SQL drafts that should not be auto-applied by migration tooling.

docs/architecture/
  Architecture notes, setup guides, admin flow docs, and session handoff docs.

docs/eco/phase-history/
  Concise bilingual completed-phase history archive and template for future phase records.

docs/adr/
  Architecture decision records.
```

## Data And Repository Rules

- Keep public observation reads behind `ObservationRepository`.
- Keep admin-only review actions behind `AdminObservationRepository`.
- Keep auth/session checks behind `AuthRepository`.
- Do not call Supabase directly from UI components unless that phase explicitly chooses it.
- Public list must show only approved observations.
- Anonymous users must not submit observations after the 20D/20E gate.
- Authenticated Supabase create now produces approved observations through the 20E repository path.
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
- Phase 18A: Supabase Storage operations hardening design/runbook completed.
- Phase 18B: Supabase Storage read-only monitoring checklist completed.
- Phase 18C: Signed URL refresh UX MVP implementation completed.
- Phase 18D: Anonymous upload abuse mitigation decision completed.
- Phase 18E: Storage cleanup automation design completed.
- Phase 19A: Next product feature prioritization completed.
- Phase 19B: Public observation list filter/search UX improvement completed.
- Phase 19C: Public observation list filter/search regression verification completed.
- Phase 20A: Public Navbar alignment fix completed.
- Phase 20B: Public user auth/contribution design completed.
- Phase 20C: Public user contribution DB/RLS migration draft completed.
- Phase 20C.5: Public user contribution SQL draft application-readiness review completed.
- Phase 20D: Public login UI/auth state and signed-out upload gate completed.
- Phase 20E-prep: Public user contribution SQL draft promoted to an apply-ready migration candidate; SQL was not applied.
- Phase 20E: Authenticated direct approved observation create implemented in the Supabase repository path.
- Phase 20E.6: Admin-authenticated manual smoke result for direct approved create documented.
- Phase 20F: Observer display implemented in public observation cards and detail modal.
- Phase 20F.5: Observer display regression and non-admin contributor smoke results documented.
- Phase 20G: Owner/admin observation edit design completed.
- Phase 20H: Owner/admin observation edit DB/RLS plan and SQL draft completed; SQL was not applied.
- Phase 20H.5: Owner/admin edit SQL apply-readiness review completed and 0004 migration candidate added; SQL was not applied.
- Phase 20H.6: Owner/admin edit 0004 manual dev/local apply result documented; Codex did not apply SQL.
- Phase 20H.7: Owner/admin edit trigger confirmation documented; pending/rejected public visibility was reported as visible and remains a blocker to clarify/fix before 20I.

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
