# Next Session Handoff

## Purpose

This document helps a new ChatGPT/Codex session quickly understand the current project state after Phase 22A signup profile provisioning preparation.

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
- `docs/architecture/supabase-storage-cleanup-automation-design.md`
- `docs/architecture/kakao-map-provider-design.md`
- `docs/architecture/phase-19-product-feature-prioritization.md`
- `docs/architecture/owner-admin-observation-edit-design.md`
- `docs/architecture/owner-admin-observation-edit-rls-plan.md`
- `docs/architecture/public-signup-profile-setup-plan.md`
- `docs/architecture/public-signup-profile-provisioning-apply-readiness.md`
- `docs/architecture/taxonomy-resolution-design.md`
- `docs/architecture/taxonomy-tree-visualization-design.md`
- `docs/eco/project-working-guide.md`
- `docs/eco/phase-history/index.md`

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
- 18E Storage cleanup automation design
- 19A next product feature prioritization
- 19B public observation list filter/search UX improvement
- 19C public observation list filter/search regression verification
- Phase history archive for phases 1 through 21, plus a reusable bilingual phase template
- Project working guide for source-of-truth hierarchy, phase workflow, feature triage, verification, and commit/push routine
- 20A public Navbar alignment fix
- 20B public user auth/contribution design
- 20C public user contribution DB/RLS migration draft
- 20C.5 public user contribution SQL draft application-readiness review
- 20D public login UI/auth state and signed-out upload gate
- 20E-prep public user contribution SQL draft promoted to an apply-ready migration candidate
- 20E authenticated direct approved observation create
- 20E.6 authenticated direct approved create manual smoke documentation
- 20F observer display in public observation cards and detail modal
- 20F.5 observer display regression and non-admin contributor smoke documentation
- 20G owner/admin observation edit design
- 20H owner/admin observation edit DB/RLS plan and SQL draft
- 20H.5 owner/admin observation edit SQL apply-readiness review and migration candidate
- 20H.6 owner/admin observation edit 0004 manual apply result documentation
- 20H.7 owner/admin edit trigger and public visibility confirmation documentation
- 20I owner/admin observation update repository methods
- 20J owner/admin observation edit UI
- 20K owner/admin observation edit smoke/regression passed by user manual verification.
- 21 full public UX stabilization implementation from `fd02f71`.
- 21.5 public UX hardening and verification from `8046de9`, `e2dc23d`, and `6cada30`.
- 22A signup profile provisioning apply-readiness prepared on `feature/phase-22-signup-profile-provisioning`.

## Phase 21 Current Session Result

Status: implemented and Phase 21.5-hardened. Local signed-out browser smoke passed for the main public UX paths; live account, backend upload-limit, owner/admin, and Kakao normal-key checks remain PARTIAL.

Commit references:

- Base full Phase 21 implementation: `fd02f71 feat: stabilize public UX for phase 21`.
- Phase 21.5 code hardening: `8046de9 fix: harden phase 21 public UX edges`.
- Phase 21.5 documentation closure: `e2dc23d docs: record phase 21 hardening verification`.
- Phase 21.5 follow-up code hardening: `6cada30 fix: harden phase 21 public UX`.
- Current working branch: `feature/phase-21-full-hardening`.
- Push status: not pushed.

Implemented in app code:

- 21A Navbar auth slot stabilization:
  - Desktop auth controls now reserve a fixed slot width.
  - Signed-in display names truncate with ellipsis and do not expand the public nav group.
  - The admin route remains hidden from `Navbar`.
- 21B public signup UI and repository boundary:
  - `AuthRepository.signUpWithPassword` was added.
  - Public login panel now has login/signup modes.
  - Signup validates password confirmation and rejects email-like public display names.
  - Supabase signup passes display name through Auth metadata and requires a usable own `profiles` row before treating the user as contribution-ready.
  - If email confirmation is required, the UI reports that in Korean.
  - If a profile row is missing, the UI reports profile setup required instead of allowing a broken contribution state.
- 21C image prefetch and retry:
  - `Observation.imagePath` is mapped internally from Supabase `image_path` for cache keys only.
  - Approved observation images are preloaded from runtime signed display URLs after repository list reads.
  - Detail open uses cached signed image URLs immediately when available.
  - Detail image load failure invalidates the cache and retries one repository refresh.
- 21D upload size UX:
  - App-side image selection and Supabase upload-helper validation now share a named 20 MB constant.
  - JPG, PNG, and WebP remain the allowed image types.
  - Oversized/unsupported picker errors use Korean copy.
  - Unlimited upload remains intentionally unsupported.
- 21E map search/filter:
  - The map page now supports client-side species/common/scientific-name search.
  - Species suggestions group approved observations by normalized scientific name when present, falling back to common name.
  - Clicking a species suggestion filters the map to all matching approved observations.
  - Taxon filters support multi-select and reset.
  - Filtering stays client-side over observations returned by the active approved-only public repository.
- 21F taxonomy design:
  - Added `docs/architecture/taxonomy-resolution-design.md`.
  - Added `docs/architecture/taxonomy-tree-visualization-design.md`.
  - No taxonomy API calls, DB/RLS migrations, or app tree implementation were added.

Signup/Profile DB note:

- Existing Phase 20 migrations do not fully automate profile row creation for open public signup.
- Added draft-only SQL at `docs/architecture/sql-drafts/0005_public_signup_profile_draft.sql`.
- Added `docs/architecture/public-signup-profile-setup-plan.md`.
- The draft was not promoted to `supabase/migrations/` and was not applied by Codex.

Phase 21.5 hardening notes:

- Invalid image selections now clear stale selected file/preview state.
- Oversized image selection copy states both accepted formats and the 20 MB app-side limit.
- Detail image load failure hides the failed source behind the stable placeholder while the one-time repository refresh path runs.
- Map species grouping was tightened so records sharing a scientific name are grouped together even if common names differ.
- Public Navbar display names now pass through the safe observer display-name normalizer at the App boundary before falling back to `사용자`.
- Signed-image prefetch now prunes expired entries and evicts oldest entries after a fixed cache cap.

Verification recorded in this session:

- `git status --short --branch` on the Phase 21.5 branch reported `feature/phase-21-full-hardening`.
- Branch checks confirmed `backup/phase-21-before-return-to-phase-20` at `fd02f71`, `main` at `4da595e`, and `feature/phase-21-sequential` at `30ecd0e`.
- `git ls-files -- .env .env.local .env.production dist node_modules` returned no tracked entries.
- `npm.cmd run typecheck`: pass.
- `npm.cmd run build`: pass.
- Local dev server on `http://127.0.0.1:3002/` returned HTTP 200.
- Static source scan found no Supabase client calls in public UI components or `src/App.tsx`.
- Static source scan found no admin route exposure in `Navbar`; `#admin` remains only in app routing.
- `git diff --check`: pass with line-ending warnings only.
- Browser automation smoke: local headless Chrome passed for signed-out Navbar, public login/signup mode rendering, password mismatch validation, email-like nickname rejection, upload gate, image card/detail/reopen display, map search, species suggestion click, single/multiple taxon filters, reset, empty state, and secret-like console pattern check.
- Read-only public DB/browser probe saw 13 approved rows, 0 visible non-approved rows, 3 approved rows with `image_path`, and 0 persisted URL-like `image_url` values.
- Live login/logout/signup, upload with real Supabase account, owner/admin edit, and Kakao normal-key render were not run in Phase 21.5.

Boundary result:

- Package files were not changed.
- Supabase migrations/RLS were not changed.
- Storage policies and bucket/project settings were not changed.
- Kakao provider internals were not changed.
- Admin UI and admin repository behavior were not changed.
- `dist` was generated by `npm.cmd run build` but remains untracked/ignored.

Important remaining checks:

1. Run live Supabase login/logout/signup with non-secret test credentials.
2. If signup creates an active session without a profile row, review/apply the draft-only 0005 profile trigger in a separate approved DB phase.
3. Re-run upload size smoke against the real backend before claiming Supabase accepts files above the backend-configured limit. Existing 0002 Storage docs and DB constraints still document a 5 MB backend limit.
4. Run desktop/tablet/mobile visual checks for Navbar no-shift, map filters, upload gate, image prefetch, and static/Kakao fallback.
5. Re-run public pending/rejected invisibility checks against Supabase after any DB/profile/signup change.

## Phase 22A Current Session Result

Status: apply-ready migration candidate and manual-apply documentation prepared. The migration was not applied by Codex, no real test user was created, and no live signup was run.

Commit/source references:

- Phase 20 baseline: `4da595e docs: record owner edit smoke results`.
- Phase 21 source commit: `1addd94 docs: record phase 21 verification results`.
- Current working branch: `feature/phase-22-signup-profile-provisioning`.
- Push status: not pushed.

Implemented as migration/docs only:

- Added `supabase/migrations/0005_public_signup_profile_provisioning.sql` as a manual-review migration candidate.
- Added `docs/architecture/public-signup-profile-provisioning-apply-readiness.md`.
- Updated `docs/architecture/public-signup-profile-setup-plan.md` to mark the older draft as historical context.

Schema findings recorded:

- `public.profiles.id` is the profile primary key and references `auth.users(id)` with cascade delete.
- `public.profiles.role` is constrained to `user` or `admin`, defaulting to `user`.
- `public.profiles.display_name` is nullable and must be non-blank when present.
- `public.observations.observer_id` is nullable and references `public.profiles(id)` with `on delete set null`.
- Existing frontend roles do not have broad `public.profiles` insert access.

Chosen strategy:

- A narrowly scoped `auth.users` insert trigger provisions one matching `public.profiles` row.
- Function: `public.provision_public_profile_for_new_auth_user()`.
- Trigger: `auth_users_provision_public_profile`.
- New rows always use `role = 'user'`.
- The trigger reads only safe `display_name` metadata and never uses email as a public display-name fallback.
- Existing profile rows are not overwritten because the insert uses `on conflict (id) do nothing`.

Boundary result:

- App code was not changed.
- Package files were not changed.
- Storage policies and bucket settings were not changed.
- Kakao provider internals were not changed.
- Admin UI/repository behavior was not changed.
- Public approved-only observation visibility policies were not changed.
- The migration candidate does not grant broad profile insert/update access.

Manual next step:

1. Review `docs/architecture/public-signup-profile-provisioning-apply-readiness.md`.
2. Run the documented read-only preflight queries in the intended dev/local Supabase environment.
3. Stop if an unexpected signup/profile trigger is found; an existing `auth_users_provision_public_profile` trigger is acceptable only when it points to `public.provision_public_profile_for_new_auth_user()`.
4. Manually apply `supabase/migrations/0005_public_signup_profile_provisioning.sql` only to the intended environment.
5. Run the documented post-apply verification queries.
6. Run Phase 22B live signup/contribution smoke with approved disposable credentials.

### Phase 22A Manual Apply Correction

The first user-run manual apply attempt for `supabase/migrations/0005_public_signup_profile_provisioning.sql` failed and has not been accepted as a successful apply.

Recorded failure:

```text
ERROR 42501: must be owner of relation users
```

Cause:

- The previous migration candidate used ownership-requiring statements against `auth.users`.
- The problematic statements were the direct `drop trigger if exists auth_users_provision_public_profile on auth.users` and the `comment on trigger ... on auth.users`.

Corrected procedure:

- The migration keeps `public.provision_public_profile_for_new_auth_user()` as a `SECURITY DEFINER` function.
- The function now uses `set search_path = ''` with schema-qualified app table references.
- The migration does not drop triggers on `auth.users`.
- The migration does not comment on triggers on `auth.users`.
- A safe preflight block allows creation when the expected trigger is absent.
- If `auth_users_provision_public_profile` already exists, the migration verifies that it points to `public.provision_public_profile_for_new_auth_user()`.
- If the existing expected trigger points elsewhere, the migration stops with a clear exception.
- Codex did not apply SQL remotely.

Remaining Phase 22 risks:

- Existing Auth users without profiles need a separate reviewed backfill decision.
- Live signup and email-confirmation behavior remain not run.
- New-user observation create after provisioning remains not run.
- Owner/admin edit regression after applying the migration remains not run.
- Production/domain smoke remains not run.

## Verified Current State

- Public routes load, and 20K verified pending/rejected public invisibility:
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
- 18E Storage cleanup automation was documented as a design-only phase:
  - Added `docs/architecture/supabase-storage-cleanup-automation-design.md`.
  - Compared manual-only, semi-manual export/review, scheduled dry-run Edge Function, scheduled delete Edge Function, and admin cleanup UI options.
  - Recommended Option B for the MVP: semi-manual candidate export/review with manual deletion approval.
  - Kept Option C scheduled dry-run reporting as a later candidate if manual reporting becomes repetitive.
  - Deferred automatic delete, Edge Function implementation, service-role handling, and admin cleanup UI to later approved phases.
  - Documented safety guards including retention age, status, DB match, path prefix, dry-run first, max delete per run, manual approval, export before delete, audit report, and rollback limitations.
  - Did not delete Storage objects, implement Edge Functions, change app code, change package files, change Supabase migrations, change policies/RLS, change secrets, or change public visibility behavior.
- 19A next product feature prioritization was documented as a planning-only phase:
  - Added `docs/architecture/phase-19-product-feature-prioritization.md`.
  - Compared public list filters/search, map/list coordination, upload UX, admin review UX, reject note/audit log design, biodiversity guide content, and Storage operations next steps.
  - Recommended public observation list filter/search UX improvement as the 19B implementation target.
  - Ranked upload UX and admin review UX as useful follow-up candidates.
  - Kept 19A documentation-only with no app code, package, Supabase migration, policy, RLS, Storage, Kakao Map, Auth, admin, or public visibility changes.
- 19B public observation list filter/search UX improvement was implemented:
  - Public list filtering remains client-side against already-loaded approved observations.
  - Existing text search and taxon filtering were preserved.
  - Added image-present filtering for all, with-image, and without-image states.
  - Added name sorting alongside newest and oldest sorting.
  - Added result count and a Korean empty state for no matching public list results.
  - Did not change Supabase queries, RLS, policies, Storage rules, Kakao provider/fallback, Auth/admin flows, package files, or public visibility behavior.
- 19C public observation list filter/search regression verification passed:
  - `npm.cmd run typecheck` passed.
  - `npm.cmd run build` passed after rerunning outside the sandbox because the first sandboxed build hit a native dependency `spawn EPERM`.
  - Mock/no-key browser smoke passed for default newest ordering, result count, text search over name/scientific name/location/description, case/space-tolerant search, taxon filtering, image-present filtering, newest/oldest/name sorting, combined filters, empty state, detail modal, static map fallback, mobile width, runtime console errors, and secret-like console/log patterns.
  - Supabase read-only check saw 11 approved rows, 1 approved row with `image_path`, 0 URL-like `image_url` values, 0 pending/rejected rows visible, and no query errors.
  - Supabase/no-key browser smoke passed for approved public list render, result count, name search, empty state, image-present filtering, detail modal image display, static map fallback, mobile width, runtime console errors, and secret-like console/log patterns.
  - Browser resource logs contained one non-secret resource load error during each mock/Supabase run, but no runtime console errors and no secret-like patterns.
  - No app code, package files, Supabase migration/policy files, Kakao provider files, Storage/Auth/Admin flows, or public visibility rules were changed.
- Phase history archive bilingual update:
  - Added Korean companion summaries under the English phase-history sections for Phase 1 through Phase 18.
  - Updated the phase-history index and reusable template with the same bilingual convention.
  - `docs/eco/phase-history/phase-19.md` was not created in this update.
- Phase 19 history archive update:
  - Added `docs/eco/phase-history/phase-19.md` after 19C verification passed.
  - Updated the phase-history index with the Phase 19 row.
- 20A Navbar alignment fix:
  - Added stable viewport scrollbar gutter spacing in global CSS.
  - This keeps the fixed public Navbar horizontally aligned between short pages such as Home/Map and scrolling pages such as Intro/List/Upload.
  - Did not change Navbar labels, menu count, admin route visibility, Auth/Admin/Storage/Supabase/Kakao behavior, package files, or Supabase migrations.

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
- Blocks anonymous submit in the UI through the signed-out upload gate.
- Inserts signed-in public submissions as `approved` observations.
- Stores `observer_id = auth.uid()` for signed-in Supabase submissions.
- Stores `observer_display_name` only when a non-email profile display name is available.
- Uploads selected images to private Supabase Storage before approved row insert.
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
docs/architecture/supabase-storage-cleanup-automation-design.md
docs/architecture/kakao-map-provider-design.md
docs/architecture/phase-19-product-feature-prioritization.md
docs/eco/phase-history/index.md
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
Read AGENTS.md, README.md, docs/architecture/next-session-handoff.md, and docs/eco/project-working-guide.md. Do not modify code yet. Phase 20 core feature set and Phase 20 history archive are complete. Repository update payloads are content-only and exclude status/image/observer fields. The expected 0004 update triggers are connected in dev/local Supabase, production was not changed, and Codex did not apply SQL. The next step is choosing the Phase 21/product polish direction.
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

### 18E: Storage Cleanup Automation Design

Completed as documentation-only work:

- Added `docs/architecture/supabase-storage-cleanup-automation-design.md`.
- Compared:
  - Option A: manual-only
  - Option B: semi-manual export/review
  - Option C: scheduled Edge Function dry-run only
  - Option D: scheduled Edge Function delete with guards
  - Option E: admin cleanup UI
- Recommended Option B for the MVP:
  - keep manual cleanup operations while volume is low
  - use read-only candidate exports and human review before any deletion
  - keep actual deletion as a separately approved manual maintenance step
  - reconsider scheduled dry-run reporting only after manual reports become repetitive or thresholds are exceeded
- Documented cleanup target definitions for rejected retention candidates, orphan object candidates, failed upload leftovers, smoke/test objects, unexpected path prefix objects, and near-5 MB suspicious objects.
- Documented safety guards: retention age, status, DB match, path prefix, dry-run first, max delete per run, manual approval, export before delete, audit report, and rollback limitations.
- Did not implement delete, Edge Functions, admin cleanup UI, app code changes, package changes, SQL/policy/RLS changes, service-role additions, Storage object deletion, or Kakao Map changes.

Recommended next steps:

1. Start 20E authenticated direct create planning only with an approved DB/RLS apply/test window.
2. Use `supabase/migrations/0003_public_user_contribution.sql` only during that approved 20E window; it exists as a candidate and has not been applied.
3. Keep observer display UI, owner edit, and admin edit unimplemented until their later approved implementation phases.
4. 18F: CAPTCHA/rate-limit implementation design only if 18B/18D thresholds are exceeded or launch risk changes.
5. Separately approved cleanup implementation phase only after phase-label confirmation and the 18E preconditions are met.
6. Re-run Kakao map fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
7. Re-run Storage smoke checks after any future Storage, RLS, admin review, or public detail changes.

### 19A: Product Feature Prioritization

Completed as:

```text
docs/architecture/phase-19-product-feature-prioritization.md
```

Decision:

- 19A was planning-only.
- Candidate A, public observation list filter/search UX, is recommended for 19B.
- The recommended 19B scope is a narrow client-side improvement using the already-loaded approved observations.
- Expected 19B work may touch `src/utils/observationFilters.ts`, `src/components/ObservationListPage.tsx`, `src/components/observations/ObservationListHeader.tsx`, and optionally `src/components/observations/ObservationGrid.tsx`.
- 19B must not change Supabase schema, RLS, Storage, Kakao provider/fallback, admin Auth, public visibility, package files, or pending/rejected exposure behavior.

### 19B: Public Observation List Filter/Search UX Improvement

Implemented:

- Extended `src/utils/observationFilters.ts` with explicit `ImageFilter` and `ObservationSortKey` unions.
- Added image-present filtering using display-only `Observation.imageUrl`.
- Added name sorting while keeping newest as the default public list sort.
- Kept search over observation name, scientific name, location, and description.
- Kept taxon filtering and taxon count behavior.
- Added public list result count and empty state.

Scope boundaries kept:

- No server-side filtering.
- No Supabase query, policy, RLS, grant, migration, or Storage change.
- No public exposure of pending or rejected observations.
- No signed/public/blob/preview/data URL persistence.
- No Kakao Map, Auth, admin, package, or dependency change.

### 19C: Public Observation List Filter/Search Regression Verification

Completed:

- Mock/no-key browser regression passed for the public list filter/search/sort surface.
- Supabase/no-key browser regression passed for approved public list render, image-present filtering, detail modal image display, static map fallback, and mobile layout.
- Supabase read-only public invariant check passed:
  - 11 approved rows visible
  - 0 pending/rejected rows visible
  - 1 approved row with `image_path`
  - 0 URL-like `image_url` values
- Public filtering remains client-side and operates only on observations already returned by the active public repository.
- `src/repositories/supabase/supabaseObservationRepository.ts` still filters public reads to `status = 'approved'`.
- No app code was changed during 19C.
- `docs/eco/phase-history/phase-19.md` was intentionally not created during 19C, then added after Phase 19 was declared complete.

### 20B: Public User Auth/Contribution Design

Completed as documentation-only work:

- Added `docs/architecture/public-user-auth-contribution-design.md`.
- Designed the relationship between existing admin auth and future public user auth.
- Recommended a conservative MVP:
  - public users are Supabase Auth users with `profiles.role = 'user'`
  - initial contributor account creation is handled outside the public frontend
  - login uses the existing Supabase email/password auth path behind `AuthRepository`
  - anonymous users can browse public approved records but cannot submit
  - authenticated contributors may create approved observations directly only after reviewed DB/RLS work
  - `profiles.display_name` is used for observer display; email is never shown publicly
  - `observations.observer_id` is the owner authorization field
  - owner/admin edit starts with text and metadata fields only
- Proposed 20C DB/RLS draft topics:
  - nullable `observer_id`
  - optional observer display-name snapshot
  - `profiles.display_name`
  - anon approved-only read
  - authenticated owner insert/update checks
  - admin all-read/all-update preservation
  - anonymous pending insert transition decision
- Did not implement app code, package changes, Supabase migrations, RLS/policies, Storage changes, Kakao changes, or admin Navbar exposure.

Recommended next phase:

1. Start 20C DB/RLS migration design and draft.
2. Decide whether public self-sign-up is allowed or contributor accounts are invite/admin-created.
3. Decide whether direct approved insert is allowed for every authenticated user or only a contributor role.
4. Keep implementation deferred until the DB/RLS draft is reviewed.

### 20C: Public User Contribution DB/RLS Migration Draft

Completed as documentation/draft-only work:

- Added `docs/architecture/public-user-contribution-rls-plan.md`.
- Added `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql` as a draft candidate only.
- Updated `docs/architecture/public-user-auth-contribution-design.md` with links to the 20C plan and draft.
- Recommended DB/RLS direction:
  - add nullable `profiles.display_name`
  - add nullable `observations.observer_id` referencing `public.profiles(id)` with `on delete set null`
  - add nullable `observations.observer_display_name` as a public display snapshot candidate
  - keep public anon/authenticated reads approved-only
  - transition anonymous pending insert off only after login UI and authenticated create implementation are ready
  - allow authenticated own approved insert only with `observer_id = auth.uid()` and `image_url is null`
  - keep email out of public display
  - keep owner edit scoped to content/location metadata and status changes admin-only
  - keep image replacement out of scope
- The `0003` SQL draft includes grant/policy candidates and an authenticated Storage upload policy candidate, but it was not applied.
- No app code, package file, live Supabase policy/RLS, Storage object, Kakao Map, Auth UI, admin UI, or public visibility behavior was changed.

Recommended next phase:

1. Review the 20C draft before any Supabase apply.
2. Start 20D public login UI/auth state implementation planning.
3. Keep direct approved create for 20E, observer display for 20F, and owner/admin edit for later approved phases.

### 20C.5: Public User Contribution SQL Draft Application-Readiness Review

Completed as documentation/placement review work:

- Reviewed `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql` against 0001 schema, 0002 Storage, and the 20B/20C architecture docs.
- Moved the 0003 draft out of `supabase/migrations/` to `docs/architecture/sql-drafts/` because migration tooling can apply files from `supabase/migrations/` regardless of warning comments.
- Kept the draft as not apply-ready for automatic migration.
- Confirmed the DB/RLS direction remains:
  - nullable `profiles.display_name`
  - nullable `observations.observer_id` referencing `public.profiles(id)`
  - nullable `observations.observer_display_name` snapshot candidate
  - public anon/authenticated reads approved-only
  - no owner read of non-approved rows in the MVP
  - authenticated own approved insert guarded by `observer_id = auth.uid()`
  - status changes remain admin-only in product design
  - email public display remains prohibited
  - image replacement remains out of scope
- Added manual apply and rollback checklists to `docs/architecture/public-user-contribution-rls-plan.md`.
- Did not apply SQL to Supabase, did not change live RLS/policies, did not change app code, and did not change package files.

Recommended next phase:

1. Continue with 20D public login UI/auth state implementation and smoke verification.
2. Keep the reviewed draft in `docs/architecture/sql-drafts/` for history.
3. Use the 20E-prep migration candidate in `supabase/migrations/0003_public_user_contribution.sql` only during an approved apply/test window.

### 20D: Public Login UI, Auth State, And Upload Gate

Implemented as a scoped app-code phase:

- Added an auth repository provider that keeps public auth behind `AuthRepository` and returns a safe unavailable fallback when Supabase auth env is not configured.
- Added public login/logout state in `App`.
- Added a public login affordance to `Navbar` without exposing `/#admin`.
- Added a signed-out upload gate that shows login guidance instead of the upload form.
- Signed-in users can reach the existing upload form.
- Existing submit behavior is unchanged: 20D does not implement direct approved create.
- No Supabase SQL was applied during 20D, and the 0003 draft remained in `docs/architecture/sql-drafts/` until 20E-prep created the migration candidate.
- No observer display, owner edit, admin edit, signup, display-name setup, package change, or Kakao Map change was made.

Recommended next phase:

1. Start 20E authenticated direct create planning only after explicitly approving a DB/RLS apply/test window.
2. Apply `supabase/migrations/0003_public_user_contribution.sql` only as part of that approved window.
3. Keep observer display for 20F and owner/admin edit for later approved phases.

### 20D.5: Public Login UI/Auth State/Upload Gate Smoke Verification

Status: PARTIAL.

Completed checks:

- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- Headless Chrome smoke loaded home, observation list, map, and upload routes without crashing.
- Signed-out Navbar login control was present.
- Signed-out upload route rendered `UploadLoginGate`.
- Signed-out upload route did not render the upload form.
- Public login panel was present in the signed-out upload gate.
- Navbar did not expose an admin route or admin link.
- Direct `/#admin` access still loaded the hidden admin route.
- Static boundary checks confirmed UI components still do not call Supabase directly.
- Static boundary checks confirmed no direct approved create, `observer_id` save, observer display, owner edit, admin edit, SQL apply, package change, or Supabase migration change was added.
- Browser runtime check saw 0 JavaScript exceptions and 0 console errors.
- Browser log check saw 1 URL-like resource log, but 0 actual secret-like key/token/password patterns.

Not completed:

- Supabase login success was not run because no test account email/password was available in this session.
- Logout success after a real login was not run for the same reason.
- Logged-in upload form access after real login remains a manual smoke TODO.
- Live Supabase read-only pending/rejected count was not rerun in 20D.5; repository code and public approved-only query paths were unchanged.

Recommended next phase:

1. Run a manual 20D.5 retry with a configured non-admin test account to verify login success, logout success, and logged-in upload form access without printing credentials.
2. Start 20E only after 20D.5 login/logout smoke is accepted and the DB/RLS apply/test window is explicitly approved.

### 20E-prep: Public User Contribution SQL Migration Candidate

Completed as documentation/SQL-prep work:

- Promoted the reviewed 20C/20C.5 SQL draft into `supabase/migrations/0003_public_user_contribution.sql`.
- Kept the historical draft at `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql`.
- Marked the migration as an apply-ready candidate for a future approved 20E DB/RLS apply/test window.
- Updated `docs/architecture/public-user-contribution-rls-plan.md` with the manual apply checklist, rollout sequence, and remaining decisions before 20E.
- Did not apply SQL to Supabase.
- Did not change app code, package files, live RLS/policies, Storage objects, Kakao Map code, direct approved create, observer display, owner edit, or admin edit.

Required before applying `0003`:

1. Finish the real 20D.5 login/logout smoke retry with a configured non-admin test account.
2. Confirm contributor account provisioning for the target environment.
3. Confirm the `observer_display_name` snapshot policy.
4. Decide whether authenticated Storage uploads switch to `observations/{auth.uid()}/...` with the migration.
5. Prepare 20E repository create changes to set `observer_id`, optional `observer_display_name`, and `status = 'approved'`.
6. Apply the migration only in an explicitly approved DB/RLS apply/test window and immediately run the 20E authenticated create smoke.

Recommended next phase:

1. Run the remaining 20D.5 real login/logout smoke.
2. Start 20E authenticated direct create only with explicit DB/RLS apply/test approval.

### 20E: Authenticated Direct Approved Observation Create

Implemented as a scoped repository/app-state phase:

- Updated the Supabase public observation repository create path to require the current authenticated Supabase user.
- New Supabase submissions are inserted with `status = 'approved'` and `observer_id = auth.uid()`.
- `observer_display_name` is stored only when the current profile has a non-empty, non-email `display_name`; email is not stored as a display snapshot.
- Storage image upload now uses the authenticated owner path `observations/{auth.uid()}/...`, matching the 0003 Storage insert policy.
- DB rows still store only `image_path`, `image_mime_type`, and `image_size_bytes` for images.
- Signed/public/blob/data URLs are not stored in DB rows.
- The returned approved row is added to the in-memory public observation list when the upload succeeds.
- Anonymous users still hit `UploadLoginGate` and cannot reach the submit path.
- Mock mode keeps its existing mock create behavior and does not add pending mock rows to the public list.
- Observer display UI, owner edit, admin edit, public sign-up, display-name setup, package changes, and new dependencies remain out of scope.
- Codex did not apply SQL/RLS; this implementation assumes the user-applied 0003 migration is active in the target Supabase environment.
- Implementation-session verification: `npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check` passed.
- Live Supabase create smoke was not run in-session because no test account credentials were provided; run it before starting 20F.

### 20E.5: Authenticated Direct Create Smoke Verification

Status: PARTIAL.

- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- `.env.local` exists but was not printed.
- Supabase client configuration is present, but the current local repository mode is not set to Supabase.
- Kakao key configuration is present, without printing the value.
- Test account credentials were not available in-session.
- Read-only anon Supabase probes confirmed the approved-read endpoint works and the `observations` ownership columns are readable through the public approved read shape.
- `profiles.display_name` could not be confirmed through the anon probe because profile reads are not public; this does not prove the column is absent.
- Authenticated insert policy, anonymous insert transition, and owner Storage upload policy could not be fully confirmed without a logged-in test account.
- Static boundary checks found no direct Supabase client usage in UI components.
- Static boundary checks confirmed public repository reads still filter `status = 'approved'`.
- Static boundary checks confirmed Supabase create still sets `status = 'approved'`, `observer_id`, and authenticated owner Storage paths.
- Observer display UI, owner edit, admin edit, and extra SQL/RLS application remain unimplemented.
- 20E full authenticated submit smoke pending: requires 0003 applied + test credentials.

### 20E.6: Authenticated Direct Create Manual Smoke Result

Status: admin-authenticated manual smoke passed; non-admin contributor smoke remains recommended.

The user confirmed the 0003 schema columns in Supabase SQL Editor:

- `profiles.display_name` is present as nullable `text`.
- `observations.observer_id` is present.
- `observations.observer_display_name` is present.

Test account type:

- The manual smoke used the existing `/#admin` account.
- This confirms the authenticated create path for an authenticated/admin profile, but it is not a separate non-admin contributor smoke.
- A `profiles` row is the app-owned profile record for the Supabase Auth user. It carries `role` for authorization and optional `display_name` for safe public display.
- `observer_display_name` is a snapshot copied from a non-empty, non-email `profiles.display_name`; email must not be used as the public observer label.

Manual smoke result reported by the user:

- Login: passed.
- Signed-out upload gate: passed.
- Logged-in upload form access: passed.
- Submit: passed.
- DB row created: yes.
- Inserted `status`: `approved`.
- `observer_id`: present.
- `observer_display_name`: safe display text, not an email.
- `image_path`, `image_mime_type`, and `image_size_bytes`: stored normally when an image was submitted.
- `image_url`: no signed, public, blob, or data URL stored.
- Public list shows the new approved row: yes.
- Pending/rejected public visibility: none observed.
- Logout returns to upload gate: passed.
- Console/log secret exposure: none observed.

Scope boundaries:

- Codex did not apply Supabase SQL/RLS.
- Observer display UI remains unimplemented and is the 20F target.
- Owner/admin edit remains unimplemented.
- Public sign-up and display-name setup remain unimplemented.
- A non-admin contributor smoke is still recommended before treating the contributor-only path as fully verified.

### 20F: Observer Display In Public Cards And Detail

Implemented as a scoped public UI/repository mapping phase:

- Added optional `observerDisplayName` to the `Observation` domain model.
- Added a shared observer display helper that normalizes non-empty display names and rejects email-like strings.
- Supabase row mapping now maps `observer_display_name` into `Observation.observerDisplayName` only after the same safe normalization.
- Public observation cards show a compact `관찰자` line.
- Public detail modal shows a `관찰자` field above the detail description.
- Legacy/mock rows without observer display data fall back to `등록 관찰자`.
- Public reads remain approved-only through the existing Supabase repository query.
- No owner edit, admin edit, public sign-up, display-name setup, package change, Supabase migration, RLS/policy change, or admin route exposure was added.

Recommended next phase:

1. Review the 20F.5 documented smoke scope below.
2. If launch needs field-by-field evidence for the non-admin contributor row, recheck `status`, `observer_id`, safe `observer_display_name`, image metadata, and URL-like `image_url`.
3. Confirm anonymous submit remains gated and pending/rejected public visibility remains blocked after future observer/edit changes.
4. Start 20G owner/admin edit design only after the 20F.5 documentation is accepted.

### 20F.5: Observer Display Regression And Non-Admin Contributor Smoke Documentation

Status: documented; code/static verification passed. Codex did not apply SQL/RLS and did not run a new live Supabase browser smoke in this session.

20E non-admin contributor smoke result reported by the user:

- A new ordinary Supabase account was prepared with `role = 'user'`, not `admin`.
- The account has a `public.profiles` row.
- The account has a `display_name`.
- The user tested the upload/create flow with this ordinary account and reported normal operation.
- The prompt did not itemize field-by-field DB checks for the non-admin row. The 20E.6 admin-authenticated smoke remains the recorded field-level check for `status`, `observer_id`, safe `observer_display_name`, image metadata, URL-like `image_url`, public list display, and pending/rejected invisibility.
- If launch readiness needs non-admin field-level evidence, recheck those row values with the non-admin account before implementing owner/admin edit.

20F observer display static/regression result:

- `Observation.observerDisplayName` is optional and display-only.
- `src/utils/observerDisplay.ts` normalizes non-empty observer display names and rejects email-like strings.
- Supabase row mapping reads `observer_display_name` only through the safe normalization helper.
- Public observation cards and detail modal display observer text through the same helper.
- Legacy/mock rows without observer display data use the fallback `등록 관찰자`.
- Public Supabase reads still filter `status = 'approved'`.
- UI components still do not call Supabase directly.
- Owner edit and admin edit remain unimplemented.
- No package file, Supabase migration, RLS/policy, Storage, Kakao Map, or admin Navbar behavior changed.

Recommended next phase:

1. Start 20G owner/admin edit design.
2. Keep edit implementation deferred until the 20G design is accepted.
3. Before launch or edit implementation, optionally run a live browser smoke for mock/Supabase observer display and field-level non-admin row confirmation.

### 20G: Owner/Admin Observation Edit Design

Completed as documentation-only work:

- Added `docs/architecture/owner-admin-observation-edit-design.md`.
- Confirmed the user requirement: observation records should be editable only by the original observer or an admin.
- Recommended owner edit MVP fields:
  - common name/title
  - scientific name
  - taxon
  - observed date
  - location name
  - coordinates
  - description
- Recommended non-editable owner/admin MVP fields:
  - `observer_id`
  - `observer_display_name`
  - `image_url`
  - `image_path`
  - `image_mime_type`
  - `image_size_bytes`
- Recommended status changes remain admin-only.
- Recommended image replacement stay out of the MVP and move to a later dedicated design phase.
- Recommended owner edit enter from public detail only, not observation cards.
- Recommended admin edit begin inside hidden `/#admin`, without exposing admin in `Navbar`.
- Recommended field-level protection combine RLS/grants with repository payload narrowing, and review an RPC option in 20H if owner/admin status separation is not robust enough with grants alone.
- Did not implement edit UI, repository updates, SQL/RLS changes, package changes, Storage changes, Kakao Map changes, or admin Navbar exposure.

Recommended next phase:

1. Start 20H owner/admin edit DB/RLS implementation plan or migration candidate.
2. Keep SQL application separate and explicitly approved.
3. Keep owner/admin edit UI implementation deferred until repository/RLS design is accepted.
4. Keep image replacement out of scope.

### 20H: Owner/Admin Observation Edit DB/RLS Plan

Completed as documentation and SQL-draft-only work:

- Added `docs/architecture/owner-admin-observation-edit-rls-plan.md`.
- Added draft-only SQL at `docs/architecture/sql-drafts/0004_owner_admin_observation_edit_draft.sql`.
- Kept the SQL draft out of `supabase/migrations/`.
- Recommended a hybrid field-protection model:
  - repository payload whitelist
  - column-level update grants
  - owner/admin RLS policies
  - protected-field trigger guard
  - RPC only as a fallback if grant/RLS separation is not robust enough
- Kept public reads approved-only.
- Kept pending/rejected observations hidden from public list/detail.
- Kept status changes admin-only.
- Kept observer fields, image fields, `image_url`, `created_at`, and direct `updated_at` writes protected.
- Reused the existing 0001 `updated_at` trigger strategy.
- Did not apply SQL/RLS to Supabase.
- Did not create `supabase/migrations/0004...`.
- Did not implement repository update methods, edit UI, image replacement, package changes, Storage changes, Kakao Map changes, or admin Navbar exposure.

Recommended next phase:

1. Start 20H.5 owner/admin edit SQL draft apply-readiness review.
2. Decide whether `docs/architecture/sql-drafts/0004_owner_admin_observation_edit_draft.sql` should be promoted to `supabase/migrations/0004_owner_admin_observation_edit.sql`.
3. Keep repository update methods and owner/admin edit UI deferred until the 0004 SQL approach is accepted.
4. Keep image replacement out of scope.

### 20H.5: Owner/Admin Observation Edit SQL Apply-Readiness Review

Completed as documentation and migration-candidate work:

- Reviewed the 0004 draft placement and confirmed it began in `docs/architecture/sql-drafts/`.
- Compared repository whitelist, column grants, trigger guard, RPC, and hybrid approaches.
- Accepted the hybrid strategy as the initial apply-ready direction:
  - repository payload whitelist
  - column-level update grants
  - owner/admin RLS
  - protected-field trigger guard
  - RPC only as fallback
- Added `supabase/migrations/0004_owner_admin_observation_edit.sql` as an apply-ready migration candidate.
- Did not apply SQL/RLS to Supabase.
- Did not implement repository update methods, edit UI, image replacement, package changes, Storage changes, Kakao Map changes, or admin Navbar exposure.
- Manual apply checklist was added to `docs/architecture/owner-admin-observation-edit-rls-plan.md`.

Recommended next phase:

1. Manual dev/local apply was later reported and documented in 20H.6 below.
2. Owner/non-owner/admin update-denial and update-success probes remain pending until repository/UI paths exist.
3. Trigger presence was later confirmed in 20H.7.
4. Keep owner/admin edit UI deferred until repository update methods are accepted.

### 20H.6: Owner/Admin Observation Edit 0004 Manual Apply Result Documentation

Completed as documentation-only work from the user's manual Supabase checks:

- The user manually applied `supabase/migrations/0004_owner_admin_observation_edit.sql` in dev/local Supabase.
- Production Supabase was not changed.
- Codex did not run or apply SQL/RLS in this phase.
- Apply errors: none reported.
- Rollback needed: no.
- `observations.updated_at` is present as `timestamp with time zone` and not nullable.
- The protected-field function was observed as `guard_observation_edit_fields`.
- The `updated_at` function was observed as `set_updated_at`.
- Protected-field trigger presence was not checked in the provided screenshot set.
- `updated_at` trigger presence was not checked in the provided screenshot set.
- Policy checks from the user-reported result:
  - public approved-only select retained: pass
  - owner update policy present: yes
  - owner update `observer_id = auth.uid()` guard present: yes
  - owner update `status = 'approved'` guard present: yes
  - admin update/read/delete policies remain `public.is_admin()` based
  - authenticated own approved insert policy remains present
  - no visible pending/rejected public exposure policy was found in the provided policy result
- Total DB status counts reported in the screenshot set:
  - approved: 13
  - pending: 3
  - rejected: 2
- The status counts are total DB row counts, not public visibility verification.
- Pending/rejected visible count in public UI/query was not checked in this 20H.6 screenshot set.
- Owner A is ready using the existing non-admin general account created earlier.
- Owner A has an approved row based on the earlier 20E non-admin create smoke.
- Non-owner B is not yet checked or prepared unless later confirmed.
- Admin is ready through the existing hidden-admin account.
- Actual owner/non-owner/admin update attempts are not yet run because repository update methods and edit UI are not implemented.

Trigger verification TODO:

```sql
select
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'observations'
order by trigger_name;
```

Recommended next phase:

1. Trigger presence was later confirmed in 20H.7 below.
2. Rejected visibility was later corrected to hidden; the earlier pending visibility ambiguity was resolved by 20K manual smoke as hidden.
3. Keep owner/admin edit UI deferred until repository update methods are accepted.
4. Keep image replacement out of scope.
5. Run full owner/non-owner/admin update smoke in 20K after repository and UI paths exist.

### 20H.7: Owner/Admin Edit Trigger And Public Visibility Confirmation

Completed as documentation-only work from the user's manual checks.

Trigger check result:

- Protected-field trigger connected to `public.observations`: yes.
  - Trigger name: `observations_guard_edit_fields`.
  - Event: `UPDATE`.
  - Table: `observations`.
  - Timing: `BEFORE`.
- `updated_at` trigger connected to `public.observations`: yes.
  - Trigger name: `observations_set_updated_at`.
  - Event: `UPDATE`.
  - Table: `observations`.
  - Timing: `BEFORE`.

Public visibility result:

- Public approved list loads: pass.
- Pending visible in public list/detail: reported `yes`.
- Rejected visible in public list/detail: corrected to `no`.
- Console/log secret exposure: pass.

Interpretation:

- Trigger confirmation is complete for the expected 0004 update triggers.
- Rejected visibility is corrected to hidden.
- The pending visibility report was ambiguous at the time of 20H.7 and was later resolved by 20K manual smoke as hidden.
- The project invariant is unchanged: pending/rejected rows may exist in the DB, but public list/detail and public repository reads must not show them.
- This 20H.7 public visibility result was recorded as PARTIAL at that time, then resolved by 20K manual smoke.
- Codex did not apply SQL/RLS in this phase.
- Repository update methods, edit UI, image replacement, and owner/non-owner/admin update attempts remain unimplemented/not run.

Later result:

- 20K manual smoke resolved pending/rejected public visibility as hidden.
- Owner/admin edit UI and repository update methods were completed after this 20H.7 checkpoint.
- Image replacement remains out of scope.

### 20I: Owner/Admin Observation Update Repository Methods

Implemented as a repository-only phase:

- Added `OwnerObservationUpdateInput` for owner content updates.
- Added `AdminObservationUpdateInput` for admin content updates.
- Added `ObservationRepository.updateOwnObservation(id, input)`.
- Added `AdminObservationRepository.updateObservationAsAdmin(id, input)`.
- Supabase public owner update requires a signed-in user and updates only that user's approved rows.
- Supabase public owner update payload includes only:
  - `name`
  - `scientific_name`
  - `taxon`
  - `location`
  - `observed_date`
  - `description`
  - `latitude`
  - `longitude`
- Supabase admin content update uses the same content-only payload whitelist.
- Existing admin `approveObservation` and `rejectObservation` methods remain the only status-specific admin methods.
- Mock owner update uses an in-memory overlay and does not mutate `sampleObservations`.
- Public list/detail reads remain approved-only in repository code.
- Runtime signed image display remains repository-side and no URL-like image value is stored by update methods.

Protected fields excluded from 20I update inputs/payloads:

- `status`
- `observer_id`
- `observer_display_name`
- `image_url`
- `image_path`
- `image_mime_type`
- `image_size_bytes`
- `created_at`
- `updated_at`

Not implemented in 20I:

- edit button
- edit form UI
- owner/admin live update smoke
- image replacement
- additional SQL/RLS application
- admin route exposure in `Navbar`

Recommended next phase:

1. 20J was later implemented below.
2. Run full owner/non-owner/admin update smoke in 20K now that UI paths exist.
3. Recheck public pending/rejected invisibility during 20K.

### 20J: Owner/Admin Observation Edit UI

Implemented as a scoped public detail-modal edit phase:

- Added internal `Observation.observerId` mapping for permission checks only.
- Added owner/admin edit affordance inside the public observation detail modal.
- Kept observation cards unchanged; no card-level edit button was added.
- Edit affordance is visible only when:
  - the signed-in user owns the approved observation, or
  - the signed-in user is an admin and the active observation repository is Supabase.
- Added a compact detail-modal edit form with only allowed fields:
  - `name`
  - `scientificName`
  - `taxon`
  - `location`
  - `date`
  - `description`
  - `coords`
- Owner updates call `ObservationRepository.updateOwnObservation`.
- Admin updates call `AdminObservationRepository.updateObservationAsAdmin` through a lazy repository provider.
- Successful updates replace the matching public list item, refresh the selected detail state, and recalculate unique species count.
- The hidden admin page now uses the admin repository provider boundary for admin observation actions.

Protected fields remain excluded from 20J edit UI and update inputs:

- `status`
- `observer_id`
- `observer_display_name`
- `image_url`
- `image_path`
- `image_mime_type`
- `image_size_bytes`
- `created_at`
- `updated_at`

Not implemented in 20J:

- image replacement
- status edit UI
- observer edit UI
- image metadata edit UI
- card/list edit button
- owner/non-owner/admin live update smoke
- additional Supabase SQL/RLS application
- admin route exposure in `Navbar`

Recommended next phase:

1. 20K passed by user manual verification.
2. Phase 20 history archive was completed after this checkpoint.
3. Keep malicious direct protected-field update attempts as an optional hardening check.

### 20K: Owner/Admin Observation Edit Smoke And Regression

Status: PASS.

Preconditions recorded without exposing credentials or secrets:

- Owner A ordinary account ready: yes, user-reported from earlier non-admin contributor setup.
- Owner A approved row exists: yes, user-reported from the earlier 20E non-admin create smoke.
- Non-owner B ordinary account ready: yes, used for the user-reported 20K non-owner check.
- Admin account ready: yes, user-reported existing hidden-admin account.
- 0004 migration applied in dev/local Supabase: yes, user-reported and documented in 20H.6/20H.7.
- Production Supabase apply: no.
- Login credentials were not available to Codex and were not requested or printed.

Verification completed before live manual smoke:

- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed, with line-ending warnings only.
- `http://localhost:3000/` returned HTTP 200 from the currently running local dev server.
- Static edit-form check found no `status`, observer, image, `image_url`, or timestamp fields in the detail edit form/header path.
- Static update-payload check confirmed `mapOwnerObservationUpdateInputToUpdateRow` returns only `name`, `scientific_name`, `taxon`, `location`, `observed_date`, `description`, `latitude`, and `longitude`.
- Static UI boundary check found no Supabase client calls in `src/components` or `src/App.tsx`.
- Static Navbar check found no admin route exposure.
- Package files and `supabase/migrations` are unchanged by the 20J/20K working tree.

User-reported live manual smoke result:

- Owner A live edit result: pass.
- Owner A allowed field update reflected in detail/list: pass.
- Owner A status/image/observer fields not editable in UI: pass.
- Owner A DB protected fields unchanged: pass.
- Non-owner B edit hidden/denied result: pass.
- Anonymous edit hidden result: pass.
- Admin edit result: pass.
- Admin route still hidden from `Navbar`: pass.
- Updated approved row remains public: pass.
- Pending visible in public list/detail: no.
- Rejected visible in public list/detail: no.
- `image_url` URL-like storage check: pass; no signed/public/blob/data URL stored.
- Console/log secret check: pass.
- Overall: PASS.

Remaining optional hardening:

- Malicious direct protected-field DB update attempts were not separately run.
- Image replacement remains out of scope.
- Audit log, reject note, bulk approval, and user management remain out of scope.

Recommended next phase:

1. Phase 20 history archive entry is now recorded in `docs/eco/phase-history/phase-20.md`.
2. `docs/eco/phase-history/index.md` now includes the Phase 20 row.
3. Project working guide is now recorded in `docs/eco/project-working-guide.md`.
4. Next work can choose the Phase 21/product polish direction.
5. Optionally run malicious direct protected-field update attempts later as a hardening check.

## Missing Features

- Naver Map, Leaflet, or MapLibre provider
- Automated rejected/orphan image cleanup
- Public signup profile auto-create SQL application and live signup/account smoke
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
