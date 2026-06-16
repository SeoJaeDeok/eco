# Phase 16 - Supabase Storage Image Flow

## Status

Verified.

## Goal

Add Supabase Storage image upload and runtime image display while preserving approved-only public visibility and pending public creates.

## Main Work

- Phase 16A documented the Storage image upload design.
- Phase 16B documented bucket and policy setup.
- Phase 16B.5 added the Storage migration candidate.
- Phase 16C implemented the Storage upload helper and connected it to create-observation in Supabase mode.
- Phase 16D resolved `image_path` to runtime signed URLs for approved public observations and admin review.
- Phase 16D.5 recorded read-only Supabase preflight and dev server root checks.
- Phase 16E documented Storage hardening and operations notes.
- Final manual upload/admin/approve smoke test passed.

## Key Files

- `docs/architecture/supabase-storage-image-upload-design.md`
- `docs/architecture/supabase-storage-setup.md`
- `supabase/migrations/0002_create_observation_storage.sql`
- `src/repositories/supabase/supabaseObservationImageStorage.ts`
- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/repositories/supabase/supabaseAdminObservationRepository.ts`
- `src/repositories/supabase/observationDbTypes.ts`
- `src/repositories/supabase/observationMappers.ts`
- `src/components/UploadMockPage.tsx`
- `docs/architecture/next-session-handoff.md`

## Verification

- `npm.cmd run typecheck` and `npm.cmd run build` passed for the relevant Storage implementation phases according to handoff notes.
- Read-only Supabase checks confirmed approved rows were readable and pending/rejected rows were not visible to the public anon client.
- Final manual Storage smoke result passed:
  - public upload created a pending row
  - `image_path`, `image_mime_type`, and `image_size_bytes` were present
  - `image_url` remained `NULL`
  - admin pending image display passed
  - approved public detail image display passed
  - pending and rejected public invisibility passed
  - console/log secret check passed

## Remaining Risks / Follow-ups

- Rejected/orphan image cleanup policy needed operations hardening.
- Anonymous upload abuse mitigation needed monitoring and thresholds.
- Signed URL refresh UX for long-lived pages needed a follow-up.
- These were handled or documented in Phase 18.

## Linked Docs

- `docs/architecture/supabase-storage-image-upload-design.md`
- `docs/architecture/supabase-storage-setup.md`
- `docs/architecture/supabase-storage-operations-hardening.md`
- `docs/architecture/next-session-handoff.md`

## Notes

- The DB stores Storage object paths and metadata only.
- Signed URLs, public URLs, blob URLs, preview URLs, and data URLs are not stored in observation rows.
