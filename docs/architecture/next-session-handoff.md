# Next Session Handoff

## Purpose

This document helps a new ChatGPT/Codex session quickly understand the current project state before continuing phase 16.

Read this together with:

- `AGENTS.md`
- `README.md`
- `docs/architecture/supabase-setup.md`
- `docs/architecture/admin-approval-flow.md`
- `docs/architecture/supabase-storage-image-upload-design.md`
- `docs/architecture/supabase-storage-setup.md`

## Current Completed Phases

- Design-only starter cleanup
- `App.tsx` thinning and page routing cleanup
- `Taxon`, taxon constants, and `TaxonBadge` cleanup
- Observation repository contract and mock repository
- Async-ready repository flow
- Provider-neutral static map layer
- Upload form types, helpers, and mock submit flow
- Supabase DB row types and mappers
- Supabase public observation repository
- Supabase schema/RLS SQL draft
- Environment placeholder policy
- Public approved observation read through Supabase
- Public pending observation insert through Supabase
- Manual pending-to-approved smoke tests
- `AdminObservationRepository` contract
- Supabase admin observation repository
- `AuthRepository` contract
- Supabase auth repository
- Hidden `/#admin` login page
- Admin pending approve/reject UI
- 15D admin permission and public-flow regression verification
- 15E admin documentation update
- 16A Supabase Storage image upload design document
- 16B Supabase Storage bucket/policy setup draft
- 16B.5 Storage SQL draft promoted to migration candidate
- 16C Supabase Storage upload helper and create-observation connection
- 16D signed URL image display connected for admin review and approved public observations
- 16D.5 Supabase Storage smoke-test preflight and hardening notes
- 16E Supabase Storage hardening and operations documentation

## Verified Current State

- Public flow is normal:
  - Home
  - Biodiversity guide
  - Observation list
  - Observation detail modal
  - Upload screen
  - Static map
- `/#admin` while signed out shows the login form.
- Pending list is hidden while signed out.
- Admin login succeeds with a configured Supabase Auth user.
- Admin pending area is accessible after admin login.
- Sign out returns to the login form.
- Sign out hides the admin session panel and pending list.
- 15C approve/reject smoke test passed.
- 15D had zero pending rows, so approve/reject was not re-tested there.
- No console/runtime errors were observed in 15D.
- 16A selected a private `observation-images` bucket, DB-stored Storage object paths, and runtime signed URLs.
- 16B drafted setup SQL and manual procedures.
- 16B.5 added `supabase/migrations/0002_create_observation_storage.sql` as a migration candidate.
- The user reported the active 0002 SQL, private bucket, anonymous upload policy, and image metadata insert grants were manually applied in Supabase.
- 16C preflight selected the anonymous upload candidate for the MVP public-report flow, and the user reported it was manually applied in Supabase.
- Anonymous upload keeps public submissions ergonomic but increases spam, orphan-object, and storage-abuse risk.
- 16C added Supabase Storage upload helper code and writes `image_path`, `image_mime_type`, and `image_size_bytes` during pending observation creation when an image is selected.
- 16D added runtime signed URL generation from `image_path` for admin/public image rendering.
- Signed URLs remain display-only values and are not stored in the database.
- 16D.5 confirmed local Supabase mode configuration is present without printing secrets.
- 16D.5 read-only Supabase check sampled 10 approved public rows successfully.
- 16D.5 public pending-row read check returned 0 visible rows.
- 16D.5 public rejected-row read check returned 0 visible rows.
- 16D.5 temporary dev server check returned HTTP 200 at the root page.
- 16D.5 full upload/admin UI smoke test was not run because this session has no browser automation dependency and no admin test credentials.
- A later full-smoke-test attempt rechecked the same constraints: typecheck/build passed, `.env.local` exists without being printed, Supabase client configuration is present, 10 approved rows were readable, 0 pending/rejected rows were visible to the public anon client, and a temporary Vite server returned HTTP 200.
- The later attempt still did not run the full upload/admin/approve UI path because no browser automation dependency is installed and no admin test credentials are configured.
- A manual smoke retry found that `UploadMockPage` showed the same mock/design alert for validation failure, create failure, and success; this was fixed.
- After the alert fix, the user reported that a public upload created a `pending` DB row with `image_path`, `image_mime_type`, and `image_size_bytes`, while `image_url` stayed `NULL`; approve and reject flows were normal.
- Admin pending image display and approved public detail image display still need explicit manual confirmation.
- 16E documented orphan cleanup, rejected-image cleanup, anonymous upload abuse risk, signed URL expiration UX risk, and pre-17A Storage TODOs.
- Phase 16 Storage commits `b80c9ce` and `53e4fe0` were pushed to GitHub; the branch was synced with `origin/main` after push.

## Core Architecture

### Public Observation Repository

`ObservationRepository` is the public observation contract.

The active repository is selected in:

```text
src/repositories/observationRepositoryProvider.ts
```

Default behavior is `mock`. Supabase is selected only when:

```text
VITE_OBSERVATION_REPOSITORY=supabase
```

Supabase public repository:

```text
src/repositories/supabase/supabaseObservationRepository.ts
```

Public Supabase behavior:

- Reads only `approved` observations.
- Inserts public submissions as `pending`.
- Uploads selected images to private Supabase Storage before pending row insert.
- Stores only `image_path`, `image_mime_type`, and `image_size_bytes` for submitted images.
- Resolves `image_path` to runtime signed URLs only after approved rows are selected.
- Does not expose pending/rejected rows in public lists.

### Admin Observation Repository

Admin contract:

```text
src/repositories/adminObservationRepository.ts
```

Supabase implementation:

```text
src/repositories/supabase/supabaseAdminObservationRepository.ts
```

Admin repository methods:

- `listPendingObservations()`
- `listAllObservations()`
- `approveObservation(id)`
- `rejectObservation(id)`

Admin access depends on Supabase Auth plus RLS policies using `public.profiles.role = 'admin'`.
Admin repository results resolve `image_path` to runtime signed URLs for review images.

### Auth Repository

Auth contract:

```text
src/repositories/authRepository.ts
```

Supabase implementation:

```text
src/repositories/supabase/supabaseAuthRepository.ts
```

Auth repository methods:

- `getCurrentUser()`
- `getCurrentProfile()`
- `getSessionState()`
- `isCurrentUserAdmin()`
- `signInWithPassword(email, password)`
- `signOut()`

### Admin Hidden Hash Route

Admin UI is accessed at:

```text
/#admin
```

The route is intentionally hidden from `Navbar`.

This hidden route is not a security boundary. Supabase Auth, RLS, and `profiles.role = 'admin'` are the actual protection.

### Static Map Provider

The current map is still static and design-only.

Key file:

```text
src/features/map/mapProvider.ts
```

Kakao Map is not implemented yet. The static map provider remains the default map experience.

## Important Files

```text
src/repositories/observationRepositoryProvider.ts
src/repositories/supabase/supabaseObservationRepository.ts
src/repositories/supabase/supabaseAdminObservationRepository.ts
src/repositories/supabase/supabaseAuthRepository.ts
src/repositories/supabase/observationDbTypes.ts
src/repositories/supabase/observationMappers.ts
src/components/admin/AdminPage.tsx
src/components/admin/AdminPendingList.tsx
src/components/admin/AdminObservationReviewPanel.tsx
src/features/map/mapProvider.ts
supabase/migrations/0001_create_observation_schema.sql
supabase/migrations/0002_create_observation_storage.sql
docs/architecture/supabase-setup.md
docs/architecture/admin-approval-flow.md
docs/architecture/admin-ui-routing-plan.md
docs/architecture/supabase-storage-image-upload-design.md
docs/architecture/supabase-storage-setup.md
```

## Security Rules For The Next Session

- Do not print `.env.local`.
- Do not print Supabase URL, anon key, tokens, email, or password.
- Do not use or add a Supabase service role key in frontend code.
- Do not commit `.env.local`, `.env`, `dist`, or `node_modules`.
- Keep RLS enabled.
- Remember that hidden `/#admin` routing is not security.
- Admin permissions must continue to rely on Supabase Auth + RLS + `public.profiles.role = 'admin'`.
- Do not store signed URLs, public URLs, blob URLs, or data URLs in observation rows.

## New Session Start Prompt

Use this prompt to start the next session:

```text
Read AGENTS.md, README.md, docs/architecture/next-session-handoff.md, docs/architecture/supabase-storage-image-upload-design.md, and docs/architecture/supabase-storage-setup.md. Do not modify code yet. The next step is the full manual Supabase upload/admin/approve smoke test; after Storage is stable, start 17A Kakao Map provider design.
```

## Recommended Phase 16 Direction

### 16A: Supabase Storage Image Upload Design

Completed as:

```text
docs/architecture/supabase-storage-image-upload-design.md
```

Decision:

- Private `observation-images` bucket.
- Store Storage object paths in DB.
- Do not store signed/public/blob URLs in DB.
- Generate signed URLs at repository/helper level.
- Keep pending/rejected images out of public access.
- Keep approval as observation status update, without moving files.
- Prefer new nullable `observations.image_path` for Storage paths.

### 16B: Storage Bucket/Policy SQL Or Setup Document

Completed as:

```text
docs/architecture/supabase-storage-setup.md
```

Status:

- SQL started as a draft inside the setup guide.
- The user reported the target Supabase project now has the active 0002 SQL and private bucket applied.
- The draft includes manual setup, rollback, cleanup, and 16C/16D follow-up plans.
- Anonymous image upload was selected and manually applied for the MVP public-report flow.

### 16B.5: Storage Migration Candidate

Completed as:

```text
supabase/migrations/0002_create_observation_storage.sql
```

Status:

- Migration candidate exists and the user reported the active SQL was manually applied.
- Active SQL adds `image_path`, image metadata columns, private bucket upsert, admin read policy, and approved-image read policy.
- The anonymous upload candidate and matching insert grants were manually applied for the MVP public-report flow.
- App code, `package.json`, and `package-lock.json` were not changed.

### 16C Preflight

Decision for the MVP public-report flow:

- Use the anonymous upload candidate from `0002_create_observation_storage.sql`.
- Keep uploads insert-only.
- Keep the bucket private.
- Keep public reads approved-only.
- Continue storing only `image_path` and metadata in DB rows.
- Never store signed URLs, public URLs, blob URLs, or data URLs in the DB.

Before re-testing 16C against a real Supabase project:

- Confirm the active 0002 migration SQL is applied.
- Confirm the anonymous upload policy candidate is applied.
- Confirm the matching `image_path`, `image_mime_type`, and `image_size_bytes` insert grant for `anon, authenticated` is applied.
- Confirm pending/rejected rows and images remain hidden from public reads.

### 16C: Connect Upload Image Flow

Implemented after the 16B setup was manually applied:

- Added `src/repositories/supabase/supabaseObservationImageStorage.ts`.
- Supabase public create uploads selected images to private Storage before inserting the pending observation.
- Stored DB values are `image_path`, `image_mime_type`, and `image_size_bytes`.
- Upload path format is `pending/{client_generated_id}/{random_id}.{ext}`.
- Upload validation allows JPEG, PNG, and WebP up to 5 MB.
- Upload uses insert-only behavior with `upsert: false`.
- Supabase calls stay inside repository/helper code.
- Public reads remain approved-only.
- Signed URL display is handled in 16D.

### 16D: Image Display Verification

Implemented:

- `image_path` is resolved to 10-minute signed URLs in repository/helper code.
- Approved public observations receive signed image display URLs after approved-only reads.
- Admin pending/all review rows receive signed image display URLs through the admin repository.
- UI components continue using `Observation.imageUrl`; they do not call Supabase directly.
- Signed/public/blob/data URLs are not stored in DB rows.
- `npm.cmd run typecheck` and `npm.cmd run build` passed after the 16D code changes.
- Supabase end-to-end smoke testing was not run in this Codex session because it requires target-project credentials and manual admin/UI verification.

Manual verification still recommended:

- Upload page preview still works.
- Admin review can show submitted images through signed URLs.
- Approved public detail can show images through signed URLs.
- Rejected rows stay hidden publicly.
- Signed URLs are not stored in DB.
- No secrets are logged.

### 16D.5: Smoke Test And Hardening Notes

Completed in this session:

- Checked `.env.local` existence and Supabase mode configuration without printing values.
- Confirmed Supabase project client configuration is present without printing values.
- Ran a read-only Supabase check with the anon client:
  - approved public read succeeded
  - 10 approved rows were sampled
  - 0 sampled approved rows had `image_path`
  - public pending-row query returned 0 visible rows
  - public rejected-row query returned 0 visible rows
  - no query errors were reported
- Started a temporary Vite dev server on a non-default port and confirmed the root page returned HTTP 200.
- Stopped the temporary dev server after the check.
- Did not create test Storage objects or test observation rows, because cleanup/approval requires admin test credentials.

Later full-smoke-test attempt result:

- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `.env.local` exists, but its contents were not printed.
- `VITE_OBSERVATION_REPOSITORY=supabase` is configured locally.
- Supabase client configuration is present locally without printing URL or key values.
- No browser automation dependency is installed.
- No admin test email/password variables are configured for automated login.
- Read-only anon Supabase check succeeded again:
  - 10 approved rows were sampled
  - 0 sampled approved rows had `image_path`
  - public pending-row query returned 0 visible rows
  - public rejected-row query returned 0 visible rows
  - no query errors were reported
- A temporary Vite dev server returned HTTP 200 at the root page and was stopped.
- Full upload/admin/approve UI smoke verification was not run in this automated session.

Manual smoke progress after upload alert fix:

- `UploadMockPage` alert handling was corrected so validation failure, repository/create failure, and success no longer show the same mock/design message.
- User-reported manual upload result after the alert fix:
  - DB row was created.
  - New row status was `pending`.
  - `image_path` was present.
  - `image_mime_type` was present.
  - `image_size_bytes` was present.
  - `image_url` was `NULL`.
  - Approve flow was normal.
  - Reject flow was normal.
- This confirms Storage metadata is persisted without storing signed/public/blob/preview/data URLs in `image_url`.
- Admin pending image display and approved public detail image display were not explicitly reported and still need manual confirmation.

Still needs manual full smoke verification:

- Submit a JPEG/PNG/WebP through the upload screen in Supabase mode.
- Confirm `/#admin` pending review shows the submitted image.
- Confirm approved public detail shows the approved image through a runtime signed URL.
- Confirm pending/rejected rows stay hidden from public list/detail for the manually tested rows.
- Confirm console/logs do not expose secrets, tokens, Supabase URL, anon key, email, password, or `.env.local` contents.

Hardening TODOs:

- Define rejected-image retention and manual cleanup cadence.
- Define orphan Storage object cleanup for upload-succeeds/insert-fails cases.
- Revisit anonymous upload abuse controls before public launch.
- Decide whether signed URL refresh is needed for long-lived pages.
- Consider surfacing a non-sensitive admin/public fallback state if signed URL generation fails.

### 16E: Storage Hardening And Operations

Completed as documentation-only work:

- Added a 16E hardening section to `docs/architecture/supabase-storage-setup.md`.
- Documented orphan object scenarios and a manual cleanup procedure.
- Documented rejected-image cleanup operations and retention decision points.
- Documented anonymous upload abuse risk and current mitigations.
- Documented future hardening candidates:
  - CAPTCHA or rate limit
  - authenticated-only upload
  - Edge Function cleanup
  - scheduled cleanup
  - admin cleanup tool
  - file count/size monitoring
  - signed URL refresh UX
- Expanded the full manual Supabase UI smoke test checklist.
- No app code, package files, or Supabase migration files were changed in 16E.

Recommended next steps:

1. Run the full manual Supabase upload/admin/approve UI smoke test in the target project.
2. Record the result in this handoff and `supabase-storage-setup.md`.
3. If the smoke test passes and Storage is stable, start `17A: Kakao Map provider design`.

## Missing Features

- Kakao Map real provider
- Naver Map, Leaflet, or MapLibre provider
- Automated rejected/orphan image cleanup
- Reject note
- Audit log
- Bulk approval
- Admin menu in `Navbar`
- User account management UI
- Spam/rate-limit/CAPTCHA protection
- PWA/app packaging

## Verification Commands

Use Windows-safe npm commands after code changes:

```bash
npm.cmd run typecheck
npm.cmd run build
```

When dependencies change:

```bash
npm.cmd audit --audit-level=high
```
