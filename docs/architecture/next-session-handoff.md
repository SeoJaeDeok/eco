# Next Session Handoff

## Purpose

This document helps a new ChatGPT/Codex session quickly understand the current project state after phase 18D.

Read this together with:

- `AGENTS.md`
- `README.md`
- `docs/architecture/supabase-setup.md`
- `docs/architecture/admin-approval-flow.md`
- `docs/architecture/supabase-storage-image-upload-design.md`
- `docs/architecture/supabase-storage-setup.md`
- `docs/architecture/supabase-storage-operations-hardening.md`
- `docs/architecture/supabase-storage-monitoring-checklist.md`
- `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`
- `docs/architecture/kakao-map-provider-design.md`

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
- Phase 16 Storage manual upload/admin/approve smoke final check
- 17A Kakao Map provider design
- 17B Kakao SDK loader and provider implementation
- 17C Kakao Map manual verification
- 17D Kakao Map fallback and regression verification
- 17E Kakao Map UX hardening
- 18A Supabase Storage operations hardening design and runbook
- 18B Supabase Storage read-only monitoring checklist
- 18C signed URL refresh UX MVP implementation
- 18D anonymous upload abuse mitigation decision

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
- Final manual smoke check passed:
  - admin pending image display passed
  - approved public detail image display passed
  - pending public invisibility passed
  - rejected public invisibility passed
  - console/log secret check passed
- 16E documented orphan cleanup, rejected-image cleanup, anonymous upload abuse risk, signed URL expiration UX risk, and Storage hardening TODOs.
- Phase 16 Storage, hardening, smoke-status, and alert-fix commits through `5597806` were pushed to GitHub.
- 17A documented the Kakao Map provider design, recommending a dedicated Kakao provider module plus SDK loader helper behind the provider-neutral map interface.
- 17B added a Kakao SDK loader helper and provider module behind the map provider boundary.
- `VITE_KAKAO_MAP_JAVASCRIPT_KEY` enables the Kakao provider; missing env keeps the static provider active.
- SDK load failure falls back to the static map surfaces without exposing keys in errors.
- UI components still use `DesignMap`, `StaticDesignMap`, and `DesignMarkerPicker`; they do not call Kakao SDK APIs directly.
- 17C headless verification passed after the Kakao JavaScript key was corrected and the app was re-tested against the registered local origin `http://127.0.0.1:3003/`:
  - `.env.local` existed and `VITE_KAKAO_MAP_JAVASCRIPT_KEY` was configured, without printing the value.
  - The user confirmed the corrected value is a Kakao JavaScript key, the same Kakao app has `http://127.0.0.1:3003` registered as a JavaScript SDK/Web domain, and Kakao Map product usage is enabled.
  - `npm.cmd run typecheck` passed.
  - `npm.cmd run build` passed.
  - Vite dev server at `http://127.0.0.1:3003/` returned HTTP 200.
  - a non-printing direct SDK request check with the same local referer returned HTTP 200.
  - `window.kakao.maps.load` and `window.kakao.maps.Map` became ready.
  - the map page rendered the Kakao map surface.
  - static fallback UI did not overlap the Kakao map surface.
  - 11 observation markers and labels were detected.
  - marker click opened the existing observation detail flow.
  - the detail modal rendered a Kakao read-only position preview and retained visible coordinate text.
  - the upload page rendered the Kakao location picker, and map click selection updated visible coordinates.
  - mobile-width verification found the map surface and no horizontal overflow.
  - no secret-like console/log pattern was detected by the headless check.
- 17C Kakao Map provider manual verification is complete for the headless-tested local dev origin. Re-run it after map provider, layout, Kakao app/domain, or repository visibility changes.
- 17D fallback and regression verification passed at `http://127.0.0.1:3003/` without printing env values:
  - `.env.local` existed and Kakao/Supabase local config was present, without printing values.
  - `npm.cmd run typecheck` passed.
  - `npm.cmd run build` passed.
  - Direct Kakao SDK check returned HTTP 200 for the configured key and HTTP 401 for an intentionally invalid test key.
  - Normal-key mock mode rendered the Kakao map, 6 marker labels, marker click detail flow, Kakao detail preview, Kakao upload picker coordinate selection, mobile map surface, and no horizontal overflow.
  - No-key mock mode did not inject the Kakao script and rendered static fallback map/picker surfaces without crashing.
  - Invalid-key mock mode fell back to static map/picker surfaces without crashing.
  - Normal-key Supabase mode rendered the Kakao map, 11 approved-observation marker labels, marker click detail flow, Kakao detail preview, Kakao upload picker coordinate selection, mobile map surface, and no horizontal overflow.
  - Read-only Supabase public check saw 11 approved rows, 1 approved row with `image_path`, 0 URL-like `image_url` values, 0 pending rows visible, and 0 rejected rows visible.
  - Headless browser logs had 0 console errors and no secret-like key/token/email/password patterns.
  - No app code, package files, Supabase migration files, or dependencies were changed for 17D.
- 17E Kakao Map UX hardening completed with small scoped changes:
  - Added non-sensitive loading notices while Kakao map, location picker, and position preview surfaces are waiting for the SDK.
  - Increased Kakao observation marker hit area and switched marker aria labels to Korean `관찰 지점 선택` wording.
  - Kept marker labels hover/focus-based; clustering remains out of scope.
  - Updated static map/picker/preview copy so no-key and SDK-failure fallback states describe the current fallback behavior instead of only the original design-only state.
  - Updated upload page help copy so mock mode, Supabase submit, and Kakao map support are described without claiming storage or map SDK are unconnected.
  - Did not change Storage, Auth, admin, repository visibility, Supabase migration, package files, or dependencies.
- 18A Storage operations hardening was documented as a design/runbook-only phase:
  - Added `docs/architecture/supabase-storage-operations-hardening.md`.
  - Defined orphan object scenarios and rejected-image retention options.
  - Recommended 30-day rejected-image retention followed by manual cleanup.
  - Recommended monthly orphan checks and weekly pending/bucket usage monitoring.
  - Compared anonymous upload abuse mitigations including CAPTCHA, rate limit, authenticated-only upload, abuse monitoring, quotas, and review queue monitoring.
  - Documented 10-minute signed URL expiration UX options and left refresh implementation for a later phase.
  - Added read-only SQL drafts only; no destructive cleanup SQL, Storage delete, policy change, app code change, package change, or migration change was made.
- 18B Storage monitoring checklist was documented as a read-only operations phase:
  - Added `docs/architecture/supabase-storage-monitoring-checklist.md`.
  - Converted the 18A runbook into weekly and monthly operator checklists.
  - Added read-only SQL drafts for public visibility invariants, status counts, pending queue age, rejected retention candidates, metadata completeness, suspicious `image_url` values, image counts by status, path pattern checks, upload volume, near-limit image sizes, bucket counts, object metadata mismatch candidates, orphan candidates, test row candidates, and approved-image missing-object candidates.
  - Added draft thresholds for pending count, old pending age, rejected retention, anonymous upload spikes, near-limit images, and bucket usage.
  - Added a result recording template and escalation rules.
  - Did not include active destructive SQL, apply SQL, delete Storage objects, change app code, change package files, change Supabase migrations, change policies/RLS, or change Kakao Map code.
- 18C signed URL refresh UX was implemented with an MVP Option B approach:
  - Public detail opens immediately with the selected observation and then refreshes that observation through `activeObservationRepository.getObservationById(id)`.
  - Supabase mode continues to read only approved rows and creates a fresh runtime signed URL from `image_path` through repository/helper code.
  - Mock mode keeps existing sample `imageUrl` behavior through the mock repository.
  - UI components still do not call Supabase directly.
  - Signed URLs remain runtime-only display values and are not stored in DB rows.
  - `image_url` is not updated with signed, public, blob, preview, or data URLs.
  - Admin review automatic retry was not added; the existing pending-list `Refresh` action remains the manual signed URL refresh path for admin review.
  - Image-load-error retry was deferred because it requires a UI-to-repository refresh callback and retry-loop safeguards.
- 18D anonymous upload abuse mitigation was documented as a decision-only phase:
  - Added `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`.
  - Compared monitoring-only, CAPTCHA, rate limit, authenticated-only upload, and hybrid approaches.
  - Chose a monitoring-first hybrid MVP direction.
  - Kept anonymous image upload enabled for now.
  - Linked escalation to 18B thresholds and read-only monitoring.
  - Deferred CAPTCHA, rate-limit, Edge Function, and authenticated contributor mode to later approved phases.
  - Did not change app code, package files, Supabase migrations, Storage policies, RLS, Kakao Map code, or public visibility behavior.

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

### Map Provider

The current map supports a static fallback and an optional Kakao provider.

Key file:

```text
src/features/map/mapProvider.ts
```

Kakao provider files:

```text
src/features/map/kakaoMapLoader.ts
src/features/map/kakaoMapProvider.tsx
```

Static map fallback remains the default when the Kakao JavaScript key is missing. If SDK loading fails at runtime, the Kakao provider renders the static fallback components.

17A design is documented in:

```text
docs/architecture/kakao-map-provider-design.md
```

17B implementation summary:

- Dedicated Kakao SDK loader with duplicate-script protection.
- Dedicated Kakao provider module behind provider-neutral map props.
- Static fallback for missing env, invalid key, SDK load failure, and API-key-free demos.
- No direct Kakao SDK calls from general UI components.
- No package dependency added.

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
src/features/map/kakaoMapLoader.ts
src/features/map/kakaoMapProvider.tsx
src/features/map/mapProvider.ts
supabase/migrations/0001_create_observation_schema.sql
supabase/migrations/0002_create_observation_storage.sql
docs/architecture/supabase-setup.md
docs/architecture/admin-approval-flow.md
docs/architecture/admin-ui-routing-plan.md
docs/architecture/supabase-storage-image-upload-design.md
docs/architecture/supabase-storage-setup.md
docs/architecture/supabase-storage-operations-hardening.md
docs/architecture/supabase-storage-monitoring-checklist.md
docs/architecture/anonymous-upload-abuse-mitigation-decision.md
docs/architecture/kakao-map-provider-design.md
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
Read AGENTS.md, README.md, docs/architecture/next-session-handoff.md, docs/architecture/supabase-storage-setup.md, docs/architecture/supabase-storage-operations-hardening.md, docs/architecture/supabase-storage-monitoring-checklist.md, and docs/architecture/anonymous-upload-abuse-mitigation-decision.md. Do not modify code yet. Phase 18D anonymous upload abuse mitigation decision is complete; the next recommended phase is 18E optional cleanup automation design, 18F CAPTCHA/rate-limit design only if thresholds are exceeded, or another user-approved phase.
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
- Final manual smoke result: PASS.
- Final user-reported checks:
  - Admin pending image display: pass.
  - Approved public detail image display: pass.
  - Pending public invisibility: pass.
  - Rejected public invisibility: pass.
  - Console/log secret check: pass.

Manual smoke status:

- Phase 16 Storage upload/admin/approve smoke verification is complete for the manually tested flow.
- Re-run the same checklist after Storage policy, RLS, upload helper, admin review UI, or public detail UI changes.

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

### 18A: Storage Operations Hardening Design And Runbook

Completed as documentation-only work:

- Added `docs/architecture/supabase-storage-operations-hardening.md`.
- Documented the current private `observation-images` bucket flow, object path storage, runtime signed URL display, approved-only public reads, pending public creates, anonymous insert-only upload, and no-upsert policy.
- Defined orphan object scenarios including upload-succeeds/insert-fails, interrupted submit, network failure, validation/constraint mismatch, duplicate submit, and manual test leftovers.
- Compared rejected-image retention options:
  - immediate delete
  - 30-day manual retention and cleanup
  - audit-window retention
- Recommended rejected images remain private and be retained for 30 days before manual cleanup.
- Compared orphan cleanup options:
  - manual SQL/listing review
  - scheduled Edge Function
  - admin cleanup tool
  - path naming convention based candidate detection
- Recommended monthly manual orphan checks while volume is low.
- Compared anonymous upload abuse mitigations:
  - CAPTCHA
  - rate limit
  - authenticated-only upload
  - abuse monitoring
  - file count/size quotas
  - admin queue monitoring
- Recommended monitoring first, then CAPTCHA/rate limit or authenticated-only image upload if abuse appears.
- Compared signed URL refresh UX options and left image-load-error retry or detail-open refresh as a 18C candidate.
- Added read-only SQL drafts for image inventory, URL-like legacy values, pending queue age, rejected retention candidates, bucket object inventory, daily upload volume, and orphan candidates.
- Did not include active destructive delete SQL.
- Did not change app code, package files, Supabase migrations, Storage policies, RLS, Kakao Map code, or public visibility behavior.

### 18B: Storage Read-Only Monitoring Checklist

Completed as documentation-only work:

- Added `docs/architecture/supabase-storage-monitoring-checklist.md`.
- Documented pre-run safety checks for project/environment confirmation, read-only query use, destructive query avoidance, export hygiene, and secret non-exposure.
- Re-stated Storage/Observation invariants:
  - approved-only public reads
  - pending public creates
  - pending/rejected public non-exposure
  - `image_path`, `image_mime_type`, and `image_size_bytes` as DB Storage metadata
  - no signed/public/blob/data URL storage
  - private `observation-images` bucket
  - runtime-only signed URLs
- Added weekly monitoring checklist items for pending count, rejected count, old pending age, metadata completeness, suspicious `image_url` values, public visibility invariants, approved/pending/rejected image counts, and admin queue age.
- Added monthly review checklist items for rejected retention candidates, orphan candidate review, bucket object count/size, anonymous upload spikes, manual test objects, and delete-candidate approval workflow.
- Added read-only SQL drafts only.
- Documented orphan candidate limitations and the `storage.objects.name = public.observations.image_path` matching rule.
- Added draft thresholds and escalation rules.
- Did not change app code, package files, Supabase migrations, Storage policies, RLS, Kakao Map code, or public visibility behavior.

### 18C: Signed URL Refresh UX MVP

Implemented as a minimal code change:

- Compared refresh options and chose Option B for the MVP:
  - A: no automatic refresh, refresh guidance only
  - B: refresh observation data when public detail modal opens
  - C: retry signed URL on image load error
  - D: combine B and C
- Updated `src/App.tsx` so selecting an observation:
  - opens the detail modal immediately using the selected row
  - calls `activeObservationRepository.getObservationById(id)` in the background
  - replaces the selected observation only if the same modal is still open
- Supabase mode behavior:
  - `getObservationById()` still filters to `status = 'approved'`
  - repository/helper code generates a fresh 10-minute signed URL from `image_path`
  - pending/rejected rows remain hidden publicly
- Mock mode behavior:
  - mock `getObservationById()` keeps existing sample image behavior
- Admin behavior:
  - existing pending-list `Refresh` action remains the manual refresh path for admin signed URLs
  - automatic image-load retry is deferred
- DB behavior:
  - no signed, public, blob, preview, or data URLs are stored
  - no Storage schema, policy, RLS, or migration changes

### 18D: Anonymous Upload Abuse Mitigation Decision

Completed as documentation-only work:

- Added `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`.
- Compared:
  - Option A: monitoring-only
  - Option B: CAPTCHA
  - Option C: rate limit
  - Option D: authenticated-only upload
  - Option E: hybrid approach
- Recommended Option E for the MVP:
  - keep anonymous image upload enabled while volume is low
  - use 18B monitoring thresholds as action triggers
  - start CAPTCHA/rate-limit design only if abuse appears or launch risk changes
  - treat authenticated contributor mode as a product decision, not a Storage-only tweak
- Added draft thresholds for daily upload count, daily pending count, near-limit images, orphan candidates, old pending queue age, repeated smoke/test rows, and bucket size growth.
- Added an escalation workflow that preserves approved-only public reads, pending public creates, and no signed URL DB persistence.
- Did not implement CAPTCHA, rate limit, Edge Functions, authenticated upload, app code changes, package changes, SQL/policy/RLS changes, Storage deletion, or Kakao Map changes.

Recommended next steps:

1. 18E: Optional cleanup automation design, if Storage cleanup workload needs automation.
2. 18F: CAPTCHA/rate-limit implementation design only if 18B/18D thresholds are exceeded or launch risk changes.
3. 19A: Next product feature if no abuse is observed and cleanup remains manageable.
4. Re-run Kakao map fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
5. Re-run Storage smoke checks after any future Storage, RLS, admin review, or public detail changes.

## Missing Features

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
