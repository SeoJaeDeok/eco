# Observation Image Size DB Alignment Apply Readiness

## Purpose

This document records the Phase 22C diagnosis and manual-apply plan for aligning the observation image-size database constraint with the existing 20 MiB app and Storage bucket limits.

한국어 요약: 앱과 Storage bucket은 20 MiB까지 허용하도록 맞춰졌지만, observation DB row의 `image_size_bytes` check constraint가 아직 5 MiB라서 9 MB 이미지 제출이 실패했습니다. 이번 문서는 DB check만 20 MiB로 올리는 수동 적용 준비 문서입니다.

## Confirmed Diagnosis

- App-side limit: `20 * 1024 * 1024 = 20971520` bytes.
- Supabase global Storage limit reported by the operator: 50 MB.
- Observation image bucket limit reported by the operator: changed from 5 MB to 20 MB.
- Allowed MIME types remain `image/jpeg`, `image/png`, and `image/webp`.
- A roughly 9 MB supported image passed app validation and appeared in Supabase Storage.
- The observation DB row was not created.
- The public observation list did not show the failed observation.
- The app showed the generic Korean create failure message.
- The live database check constraint still included `image_size_bytes <= 5242880`.

한국어 요약: Storage 업로드는 성공했고, 그 다음 DB insert가 `image_size_bytes` 5 MiB 제한에 걸려 실패한 것으로 확인했습니다.

## Migration Candidate

File:

```text
supabase/migrations/0006_raise_observation_image_size_limit.sql
```

Scope:

- Changes only `public.observations.observations_image_size_bytes_check`.
- Preserves the constraint name.
- Allows `image_size_bytes IS NULL`.
- Allows values from `0` through `20971520` bytes inclusive.
- Does not change MIME validation.
- Does not change `observations_image_metadata_complete_check`.
- Does not change RLS, Storage policies, bucket settings, Auth, admin behavior, owner edit behavior, image paths, or URL persistence rules.

Codex did not apply this migration remotely.

## Pre-Apply Read-Only SQL

Run this before applying `0006` and confirm the old `5242880` definition is still present, or that the constraint is already at `20971520`.

```sql
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
from pg_constraint
where conrelid = 'public.observations'::regclass
  and contype = 'c'
  and conname = 'observations_image_size_bytes_check';
```

Expected before apply:

- `constraint_name = observations_image_size_bytes_check`
- `constraint_definition` contains `5242880`

If the definition is neither the known 5 MiB version nor the target 20 MiB version, stop and review before applying.

## Manual Apply Steps

1. Open the intended development Supabase project.
2. Open SQL Editor.
3. Create a new query.
4. Paste the full contents of `supabase/migrations/0006_raise_observation_image_size_limit.sql`.
5. Run it once.
6. Do not run rollback SQL unless a reviewed rollback is explicitly needed.
7. Do not re-run failed upload attempts until the post-apply verification passes.

한국어 초보자 안내:

1. Supabase 대시보드에서 개발용 프로젝트를 엽니다.
2. 왼쪽에서 SQL Editor를 누릅니다.
3. New Query를 누릅니다.
4. `0006_raise_observation_image_size_limit.sql` 내용을 그대로 붙여넣습니다.
5. Run을 한 번만 누릅니다.
6. 성공 후 아래 확인 SQL을 실행합니다.

## Post-Apply Verification SQL

Run this after applying `0006`.

```sql
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition,
  pg_get_constraintdef(oid) like '%20971520%' as has_twenty_mib_limit,
  pg_get_constraintdef(oid) like '%5242880%' as still_has_five_mib_limit
from pg_constraint
where conrelid = 'public.observations'::regclass
  and contype = 'c'
  and conname = 'observations_image_size_bytes_check';
```

Expected safe result:

- `constraint_name = observations_image_size_bytes_check`
- `constraint_definition` contains `20971520`
- `has_twenty_mib_limit = true`
- `still_has_five_mib_limit = false`

## Rollback Plan

Rollback should be used only if the `0006` apply causes a concrete problem and the operator approves rollback.

Rollback candidate:

```sql
begin;

alter table public.observations
  drop constraint observations_image_size_bytes_check;

alter table public.observations
  add constraint observations_image_size_bytes_check
  check (
    image_size_bytes is null
    or (
      image_size_bytes >= 0
      and image_size_bytes <= 5242880
    )
  );

commit;
```

한국어 요약: 되돌리기는 문제 발생 시에만 별도 승인 후 실행합니다. 평소에는 실행하지 않습니다.

## Orphan Storage Object Note

The failed 9 MB attempt likely created a Storage object before the DB insert failed. Do not delete that object until the failed observation row absence is confirmed and a cleanup approach is reviewed.

Follow-up recommendation:

- Add a small compensating cleanup design for “Storage upload succeeded, DB insert failed”.
- Keep cleanup narrow and reviewed.
- Do not add broad Storage delete permissions automatically.

## App Error Category Follow-Up

The current UI intentionally shows a generic Korean failure message. A later UX follow-up can classify safe error categories, for example:

```text
사진 업로드는 완료되었지만 관찰 기록 저장에 실패했습니다. 관리자에게 문의해 주세요.
```

The UI must not expose backend internals, object paths, project URLs, keys, tokens, emails, passwords, or UUIDs.

## Status

- Migration candidate prepared: yes.
- Migration 0006 manually applied by the operator in the intended development environment: yes.
- Post-apply DB constraint verification passed:
  - `has_twenty_mib_limit = true`
  - `still_has_five_mib_limit = false`
- Approximately 9 MB live upload after applying 0006: pass.
- Migration 0006 is now immutable; do not edit or reapply it.
- Rollback was not run.
- Production application was not separately verified.
- Near-20 MB upload remains partial / not tested.
- The current Storage-first create sequence can still leave an orphan object if DB insert fails after upload succeeds.
- One test orphan from the pre-0006 failure was manually cleaned through the Storage Dashboard, not through SQL.
- Remote SQL applied by Codex: no.
- App code changed: no.
- Package files changed: no.
- RLS/policies changed: no.
- Storage settings changed by Codex: no.
- Repeated upload retry before applying `0006`: no longer relevant for development because 0006 has been applied and verified there.
