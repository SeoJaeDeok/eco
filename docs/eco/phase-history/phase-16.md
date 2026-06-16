# Phase 16 - Supabase Storage Image Flow

## Status

Verified.

**한국어:** 검증 완료로 기록된 phase입니다.

## Goal

Add Supabase Storage image upload and runtime image display while preserving approved-only public visibility and pending public creates.

**한국어:** approved-only public visibility와 pending public create 원칙을 유지하면서 Supabase Storage 이미지 업로드와 runtime 이미지 표시를 추가했습니다.

## Main Work

- Phase 16A documented the Storage image upload design.
- Phase 16B documented bucket and policy setup.
- Phase 16B.5 added the Storage migration candidate.
- Phase 16C implemented the Storage upload helper and connected it to create-observation in Supabase mode.
- Phase 16D resolved `image_path` to runtime signed URLs for approved public observations and admin review.
- Phase 16D.5 recorded read-only Supabase preflight and dev server root checks.
- Phase 16E documented Storage hardening and operations notes.
- Final manual upload/admin/approve smoke test passed.

**한국어:** Storage 설계, bucket/policy setup, migration 후보, upload helper, signed URL 표시, preflight/hardening 문서화, 최종 수동 smoke 검증까지 완료했습니다.

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

**한국어:** Storage 설계/설정 문서, 0002 migration 후보, Supabase Storage helper/repository, upload 화면, handoff가 핵심입니다.

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

**한국어:** 관련 구현 phase에서 typecheck/build가 통과했고, read-only public visibility와 최종 upload/admin/approve 수동 smoke가 통과했습니다. DB에는 `image_path`, `image_mime_type`, `image_size_bytes`만 저장되고 `image_url`은 `NULL`로 유지된 것이 확인되었습니다.

## Remaining Risks / Follow-ups

- Rejected/orphan image cleanup policy needed operations hardening.
- Anonymous upload abuse mitigation needed monitoring and thresholds.
- Signed URL refresh UX for long-lived pages needed a follow-up.
- These were handled or documented in Phase 18.

**한국어:** rejected/orphan cleanup, anonymous upload abuse, signed URL refresh UX는 운영 hardening이 필요했고 Phase 18에서 문서화 또는 MVP 구현으로 이어졌습니다.

## Linked Docs

- `docs/architecture/supabase-storage-image-upload-design.md`
- `docs/architecture/supabase-storage-setup.md`
- `docs/architecture/supabase-storage-operations-hardening.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** Storage 설계/설정/운영 hardening 문서와 handoff를 함께 참고합니다.

## Notes

- The DB stores Storage object paths and metadata only.
- Signed URLs, public URLs, blob URLs, preview URLs, and data URLs are not stored in observation rows.

**한국어:** DB에는 Storage object path와 metadata만 저장하며, signed/public/blob/preview/data URL은 observation row에 저장하지 않습니다.
