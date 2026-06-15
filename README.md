# KNU Eco Map

Kyungpook National University Daegu Campus biodiversity monitoring and eco-map web app.

This repository started as a design-only starter and now has a Supabase-backed observation workflow prepared. The public app can still run with mock data, and Supabase can be enabled through local environment variables.

## Current Status

- Stack: Vite + React + TypeScript
- Styling: Tailwind CSS
- Public data source: `mock` or `supabase`, selected by `VITE_OBSERVATION_REPOSITORY`
- Default repository: `mock` when no local env value is set
- Real repository option: Supabase public approved read and pending insert
- Admin access: hidden `/#admin` route
- Current map: static design-only map
- Kakao Map: not implemented yet
- Supabase Storage image upload: implemented for Supabase mode with private object paths and runtime signed URLs

## Implemented Features

- Home screen
- Biodiversity guide screen
- Observation list
- Observation detail modal
- Upload screen
- Supabase pending observation submit
- Supabase Storage image upload for pending public submissions
- Public approved observation read
- Runtime signed image display for approved public observations
- Hidden admin page at `/#admin`
- Admin email/password login
- Admin role check through Supabase Auth + RLS + `public.profiles.role = 'admin'`
- Pending observation list for admin users
- Pending observation detail review
- Runtime signed image display for admin review
- Approve pending observations
- Reject pending observations
- Sign out

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
  Static map UI components.

src/features/map/
  Provider-neutral map types, static provider selection, and projection helpers.

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

docs/adr/
  Architecture decision records.
```

## Supabase Setup Notes

Supabase setup is documented in:

- `docs/architecture/supabase-setup.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-storage-setup.md`
- `supabase/migrations/0001_create_observation_schema.sql`
- `supabase/migrations/0002_create_observation_storage.sql`

Admin approval flow is documented in:

- `docs/architecture/admin-approval-flow.md`
- `docs/architecture/admin-ui-routing-plan.md`

## Not Implemented Yet

- Kakao Map real provider
- Naver Map, Leaflet, or MapLibre provider
- Automated rejected/orphan image cleanup
- Reject note
- Audit log
- Bulk approval
- Admin menu in `Navbar`
- User account management UI
- Spam protection, rate limit, or CAPTCHA
- PWA/app packaging

## Next Steps

Recommended next phase:

1. Complete full manual Supabase upload/admin image smoke verification in the target project.
2. Keep monitoring rejected/orphan image cleanup needs.
3. After Storage is stable, implement the real Kakao Map provider.

For a new Codex session, start with:

```text
Read AGENTS.md, README.md, docs/architecture/next-session-handoff.md, and docs/architecture/supabase-storage-setup.md. Do not modify code yet. The next step is the full manual Supabase upload/admin/approve smoke test, then 17A Kakao Map provider design after Storage is stable.
```
