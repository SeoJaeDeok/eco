# Observation Image Size Live Smoke

## Goal

Record the Phase 22C live Storage upload smoke after aligning the observation image-size database constraint with the existing 20 MiB app-side and bucket-side limit.

한국어 요약: Phase 22C에서는 5 MiB를 넘는 실제 이미지 업로드가 앱, Storage, DB, public detail 표시까지 끝까지 동작하는지 확인했습니다.

## Environment And Boundaries

- Environment category: development/local Supabase.
- No production/domain smoke was performed.
- Codex did not run remote SQL in this closure step.
- Codex did not push or merge.
- No app code, package files, RLS policies, Storage policies, Auth code, Admin code, Kakao code, or URL-persistence rules changed in this documentation closure.
- This document intentionally omits object paths, object names, UUIDs, project URLs, credentials, keys, tokens, emails, passwords, and `.env.local` values.

## Original Limit Mismatch

- App-side image validation already allowed `20 * 1024 * 1024 = 20971520` bytes.
- Supabase global Storage limit remained 50 MB.
- The observation image bucket was manually changed by the operator from 5 MB to 20 MB.
- Allowed MIME types remained:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- The bucket remained private.
- The live database constraint still enforced `image_size_bytes <= 5242880` before migration 0006.

한국어 요약: 앱과 bucket은 20 MB 쪽으로 맞춰졌지만, DB check constraint가 아직 5 MiB라서 실제 9 MB 제출이 실패했습니다.

## Initial Failure

- An approximately 9 MB supported image passed app validation.
- Storage upload succeeded.
- Observation DB insert failed.
- The observation did not appear in the public observation list.
- The app showed the generic Korean create failure message.
- One unreferenced Storage object remained after the failed DB insert.

The repository create sequence was confirmed statically:

1. Upload image to Storage.
2. Insert the observation DB row with `image_path`, `image_mime_type`, and `image_size_bytes`.

Because of that order, a DB insert failure after a successful Storage upload can leave an orphan object.

## Fix Applied Manually

- Migration `supabase/migrations/0006_raise_observation_image_size_limit.sql` was manually applied by the operator to the intended development Supabase project.
- Migration 0006 changed only `public.observations.observations_image_size_bytes_check`.
- Previous DB limit: `5242880`.
- New DB limit: `20971520`.
- Migration 0006 is now treated as immutable.
- Rollback was not run.

Post-apply verification:

- `has_twenty_mib_limit = true`: PASS.
- `still_has_five_mib_limit = false`: PASS.

## Successful Live Retry

Test observation:

```text
Phase22C 9MB 이미지 재시험
```

Result:

- App accepted the approximately 9 MB image: PASS.
- Observation submission succeeded: PASS.
- Observation appeared in the public list: PASS.
- Detail modal opened: PASS.
- Image appeared in detail: PASS.
- Image appeared after closing and reopening detail: PASS.
- Safe nickname appeared: PASS.
- Raw email did not appear publicly: PASS.

## DB And Storage Verification

Read-only SQL checks returned:

- `observation_found = true`: PASS.
- `matching_observation_count = 1`: PASS.
- `observation_status_is_approved = true`: PASS.
- `observer_profile_matches = true`: PASS.
- `image_path_present = true`: PASS.
- `image_size_above_five_mib = true`: PASS.
- `image_size_within_twenty_mib = true`: PASS.
- `image_mime_type_allowed = true`: PASS.
- `matching_storage_object_count = 1`: PASS.
- `image_url_is_null_or_non_url = true`: PASS.

Interpretation:

- The successful observation row is connected to exactly one Storage object.
- The stored image metadata is within the new DB limit.
- The runtime image display path works after reopening the detail modal.
- Signed/public/blob/data URL values were not persisted in `image_url`.

## Orphan Cleanup

The initial failed upload left one likely unreferenced Storage object candidate.

Read-only orphan diagnosis:

- Recent unreferenced object count: 1.
- Recent unreferenced object above 5 MiB count: 1.
- Exactly one likely orphan: true.

Cleanup:

- The operator deleted only that one candidate through the Supabase Storage Dashboard.
- Deletion was not performed through SQL.
- The successful referenced image was not deleted.

Post-delete verification:

- `successful_observation_found = true`: PASS.
- `successful_object_reference_count = 1`: PASS.
- `remaining_recent_unreferenced_object_count = 0`: PASS.
- `remaining_recent_unreferenced_over_five_mib_count = 0`: PASS.
- `orphan_cleanup_complete = true`: PASS.
- The successful observation image remained visible after cleanup: PASS.

한국어 요약: 실패한 시도에서 남은 후보 object 한 개만 Dashboard에서 삭제했고, 성공한 관찰의 이미지는 계속 정상 표시되었습니다.

## Remaining Partial Items

- Near-20 MB upload: PARTIAL / not tested.
- Automatic compensating Storage cleanup after DB insert failure: not implemented.
- Forced expired signed URL retry: PARTIAL.
- Optional second-account non-owner live denial: PARTIAL.
- Optional admin live edit regression: PARTIAL.
- Production/domain smoke: PARTIAL.

## Follow-Up Recommendation

Recommended next phase:

```text
Phase 23A - Compensating Storage Cleanup Design
```

Goal:

- If Storage upload succeeds but observation DB insert fails, remove only the just-uploaded object.
- Preserve the original DB error for diagnostics.
- Avoid deleting any pre-existing or referenced object.
- Keep cleanup behind repository/helper boundaries.
- Provide a safe fallback when cleanup itself fails.
- Improve the generic Korean error category without exposing backend details.
