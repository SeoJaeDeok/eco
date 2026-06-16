# KNU Eco Map

Kyungpook National University Daegu Campus biodiversity monitoring and eco-map web app.

This repository started as a design-only starter and now has a Supabase-backed observation workflow prepared. The public app can still run with mock data, and Supabase can be enabled through local environment variables.

## Current Status

- Stack: Vite + React + TypeScript
- Styling: Tailwind CSS
- Public data source: `mock` or `supabase`, selected by `VITE_OBSERVATION_REPOSITORY`
- Default repository: `mock` when no local env value is set
- Real repository option: Supabase public approved read and authenticated approved insert
- Admin access: hidden `/#admin` route
- Current map: static fallback plus optional Kakao Map provider
- Kakao Map: SDK loader and provider implemented; a local JavaScript key is required to enable it
- Kakao Map verification: normal key render, no-key fallback, invalid-key fallback, mock mode, and Supabase mode passed through phase 17D
- Kakao Map UX hardening: minimal loading, fallback copy, and marker accessibility improvements completed in phase 17E
- Kakao Map provider design: completed in `docs/architecture/kakao-map-provider-design.md`
- Supabase Storage image upload: implemented for Supabase mode with private object paths and runtime signed URLs
- Supabase Storage signed URL refresh: public detail modal refreshes selected observations through the repository in phase 18C
- Supabase Storage operations hardening: design/runbook completed in `docs/architecture/supabase-storage-operations-hardening.md`
- Supabase Storage monitoring checklist: read-only SQL/checklist completed in `docs/architecture/supabase-storage-monitoring-checklist.md`
- Anonymous upload abuse mitigation: monitoring-first decision completed in `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`
- Supabase Storage cleanup automation: design completed in `docs/architecture/supabase-storage-cleanup-automation-design.md`
- Phase 19 product prioritization: completed in `docs/architecture/phase-19-product-feature-prioritization.md`
- Public observation list UX: client-side search, taxon filtering, image-present filtering, newest/oldest/name sorting, result counts, and empty state completed in phase 19B
- Public observation list regression: mock and Supabase filter/search/sort verification passed in phase 19C
- Public Navbar alignment: fixed route-to-route horizontal shift in phase 20A by reserving stable scrollbar gutter space
- Public user auth/contribution design: completed in phase 20B in `docs/architecture/public-user-auth-contribution-design.md`
- Public user contribution DB/RLS draft: completed in phase 20C in `docs/architecture/public-user-contribution-rls-plan.md`; 20C.5 kept the reviewed draft under `docs/architecture/sql-drafts/`, and 20E-prep promoted an apply-ready candidate to `supabase/migrations/0003_public_user_contribution.sql` without applying it
- Public login UI: login/logout state and signed-out upload gate completed in phase 20D through `AuthRepository`
- Authenticated direct create: implemented in phase 20E for Supabase mode; signed-in users create approved observations with `observer_id`, owner Storage paths, and no URL-like `image_url`
- Public login/create smoke: 20D.5 signed-out/headless smoke is PARTIAL; 20E authenticated create still needs Supabase smoke with a configured test account

## Implemented Features

- Home screen
- Biodiversity guide screen
- Observation list
- Observation list filter/search UX
- Observation detail modal
- Upload screen
- Supabase authenticated approved observation submit
- Supabase Storage image upload for authenticated public submissions
- Public approved observation read
- Runtime signed image display for approved public observations
- Supabase Storage upload/admin/approve manual smoke verification
- Hidden admin page at `/#admin`
- Admin email/password login
- Admin role check through Supabase Auth + RLS + `public.profiles.role = 'admin'`
- Pending observation list for admin users
- Pending observation detail review
- Runtime signed image display for admin review
- Approve pending observations
- Reject pending observations
- Sign out
- Kakao Map SDK loader and provider behind the map provider boundary
- Static map fallback when the Kakao key is missing or SDK loading fails
- Kakao Map manual render and fallback/regression verification
- Kakao Map minimal UX hardening
- Phase 19A next product feature prioritization
- Phase 19B public observation list filter/search UX improvement
- Phase 19C public observation list filter/search regression verification
- Phase 20A public Navbar alignment fix
- Phase 20B public user auth/contribution design
- Phase 20C public user contribution DB/RLS migration draft
- Phase 20C.5 public user contribution SQL draft application-readiness review
- Phase 20D public login/logout UI and signed-out upload gate
- Phase 20E authenticated direct approved observation create

Approved observations appear in the public list. Pending and rejected observations do not appear in the public list.

## Admin Access

Open:

```text
http://localhost:3000/#admin
```

The admin route is intentionally not exposed in `Navbar`.

This hidden route is not a security boundary. Real protection depends on Supabase Auth, Row Level Security, and `public.profiles.role = 'admin'`.

## Run Locally

Install dependencies:

```bash
npm.cmd ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
```

Start the dev server:

```bash
npm.cmd run dev
```

Default local URL:

```text
http://localhost:3000
```

Verify:

```bash
npm.cmd run typecheck
npm.cmd run build
```

Security audit:

```bash
npm.cmd audit --audit-level=high
```

## Environment Variables

For local Supabase testing, copy `.env.example` to `.env.local` and fill local values.

```text
VITE_OBSERVATION_REPOSITORY=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_STORAGE_BUCKET=observation-images
VITE_KAKAO_MAP_JAVASCRIPT_KEY=
```

Use `VITE_OBSERVATION_REPOSITORY=mock` for the default mock repository.

Use `VITE_OBSERVATION_REPOSITORY=supabase` only when Supabase is configured and you want to test the real repository.

`VITE_KAKAO_MAP_JAVASCRIPT_KEY` is browser-exposed like all `VITE_*` values. Domain-restrict it in Kakao Developers and keep real values out of source control.

Do not commit `.env.local`, `.env`, API keys, tokens, or secrets. Never put a Supabase service role key in frontend environment variables.

## Important Folders

```text
src/components/ui/
  Shared UI primitives such as Button, ImageFrame, PageHeader, SearchInput, and TaxonFilterButton.

src/components/intro/
  Biodiversity guide screen components.

src/components/observations/
  Observation list and card components.

src/components/observations/detail/
  Observation detail modal components.

src/components/upload/
  Upload screen components.

src/components/admin/
  Hidden admin login and pending review UI.

src/components/map/
  Static map UI components and fallback surfaces.

src/features/map/
  Provider-neutral map types, static/Kakao provider selection, SDK loader, and projection helpers.

src/features/upload/
  Upload form helpers.

src/repositories/
  Public, admin, and auth repository contracts and implementations.

src/repositories/supabase/
  Supabase client helper, public observation repository, admin observation repository, auth repository, DB row types, and mappers.

src/data/
  Mock sample observations.

supabase/migrations/
  SQL migration draft for observations, profiles, RLS, and admin policies.

docs/architecture/
  Architecture notes, setup guides, admin flow docs, and session handoff docs.

docs/eco/phase-history/
  Concise bilingual completed-phase history archive and template for future phase records.

docs/adr/
  Architecture decision records.
```

## Supabase Setup Notes

Supabase setup is documented in:

- `docs/architecture/supabase-setup.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-storage-setup.md`
- `docs/architecture/supabase-storage-operations-hardening.md`
- `docs/architecture/supabase-storage-monitoring-checklist.md`
- `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`
- `docs/architecture/supabase-storage-cleanup-automation-design.md`
- `docs/architecture/kakao-map-provider-design.md`
- `docs/architecture/phase-19-product-feature-prioritization.md`
- `docs/architecture/public-user-auth-contribution-design.md`
- `docs/architecture/public-user-contribution-rls-plan.md`
- `supabase/migrations/0003_public_user_contribution.sql`
- `supabase/migrations/0001_create_observation_schema.sql`
- `supabase/migrations/0002_create_observation_storage.sql`
- `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql`

Admin approval flow is documented in:

- `docs/architecture/admin-approval-flow.md`
- `docs/architecture/admin-ui-routing-plan.md`

## Not Implemented Yet

- Naver Map, Leaflet, or MapLibre provider
- Automated rejected/orphan image cleanup
- Reject note
- Audit log
- Bulk approval
- Admin menu in `Navbar`
- Public self-sign-up and display-name setup UI
- Observer display on public cards/details
- Owner edit or admin edit workflow for submitted observations
- User account management UI
- Spam protection, rate limit, or CAPTCHA
- PWA/app packaging

## Next Steps

Recommended next phase:

1. Smoke test 20E authenticated direct create with a configured non-admin test account.
2. Verify anonymous users still see the upload gate and cannot submit.
3. Verify public reads remain approved-only with pending/rejected hidden.
4. Start 20F observer display only after 20E create smoke is accepted.
5. 18F: CAPTCHA/rate-limit implementation design only if monitoring thresholds are exceeded or launch risk changes.
6. Separately approved cleanup implementation phase only after phase-label confirmation and the 18E safety preconditions are met.
7. Re-run Kakao map fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
8. Re-run the Storage smoke checklist after future Storage, RLS, admin review, or public detail changes.

For a new Codex session, start with:

```text
Read AGENTS.md, README.md, and docs/architecture/next-session-handoff.md. Do not modify code yet. Phase 20E authenticated direct approved create is implemented in the Supabase repository path. Codex did not apply SQL/RLS. The next recommended step is 20E Supabase smoke verification with a configured non-admin test account before 20F observer display. Observer display UI, owner edit, and admin edit are not implemented yet.
```
