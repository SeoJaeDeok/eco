# Supabase Storage Setup Draft

## Purpose And Scope

This document is the phase 16B/16B.5 Supabase Storage bucket and policy setup guide for observation images.

16B is limited to:

- documenting the proposed Storage bucket configuration
- drafting database column SQL for image path metadata
- drafting Storage RLS policies
- documenting manual setup, rollback, cleanup, and follow-up plans

This document is not an applied migration by itself.

In phase 16B.5, the reviewed SQL draft was promoted into this migration candidate:

```text
supabase/migrations/0002_create_observation_storage.sql
```

Do not apply this migration to a Supabase project until the user explicitly approves the exact setup. As of phase 16D, the app code uploads selected images in Supabase mode and resolves runtime signed URLs for display after the required SQL/policies have been applied.

Out of scope for 16B/16B.5:

- creating the real Storage bucket
- applying SQL in Supabase
- implementing upload helpers
- connecting `UploadMockPage` to Storage
- changing repository create flow
- changing admin/public image display UI
- adding dependencies
- changing `src`, `package.json`, or `package-lock.json`

## 16B.5 Migration Candidate

Migration candidate:

```text
supabase/migrations/0002_create_observation_storage.sql
```

The migration candidate includes:

- nullable `public.observations.image_path`
- nullable `public.observations.image_mime_type`
- nullable `public.observations.image_size_bytes`
- constraints to reject URL/blob/data values in `image_path`
- MIME type and size constraints for the approved MVP formats
- a minimal partial index on `image_path`
- private `observation-images` bucket upsert
- bucket size limit of 5 MB
- allowed MIME types `image/jpeg`, `image/png`, and `image/webp`
- admin Storage read/select policy
- approved-observation public Storage read/select policy

The migration candidate intentionally does not activate an upload policy. Anonymous upload and authenticated-only upload remain separate commented candidates in the migration file and require a product/security decision before upload code can work.

For the current MVP public-report flow, the user reported that the active 0002 SQL, anonymous upload insert policy, and matching image metadata insert grant were manually applied in Supabase.

## Approved 16A Decisions

Phase 16A selected this direction:

- Use a private `observation-images` bucket.
- Store a Supabase Storage object path in the database.
- Do not store public URLs, signed URLs, blob URLs, or data URLs in the database.
- Keep `pending` and `rejected` images out of public access.
- Public repositories continue to expose only `approved` observations.
- Generate temporary signed URLs in repository-level helpers for display.
- Do not move files during approval; approval remains an observation status update.
- Prefer adding a new `observations.image_path` column over reusing `observations.image_url`.
- Keep existing `image_url` as a legacy compatibility field for now.

## Current State Summary

The current app can run with mock data by default or Supabase when explicitly configured. Supabase public reads already filter to `status = 'approved'`, and public inserts create pending observations. Admin review uses Supabase Auth, RLS, and `public.profiles.role = 'admin'` through a hidden `/#admin` route.

Image upload and signed URL display are implemented in Supabase mode after the manually applied Storage setup. The current schema still has nullable `observations.image_url` as a legacy field, but new Storage uploads write `observations.image_path`, `image_mime_type`, and `image_size_bytes`. Supabase repository mappers use runtime signed URLs as display-only `Observation.imageUrl` values when `image_path` is present.

The requested files `src/repositories/supabase/supabaseObservationTypes.ts` and `src/repositories/supabase/supabaseObservationMappers.ts` do not exist in the current repository. The current files are:

```text
src/repositories/supabase/observationDbTypes.ts
src/repositories/supabase/observationMappers.ts
```

## Storage Bucket Draft

Bucket:

```text
observation-images
```

Settings:

- `public`: `false`
- File size limit: `5242880` bytes, 5 MB
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Allowed extensions:
  - `.jpg`
  - `.jpeg`
  - `.png`
  - `.webp`

Rationale:

- Private buckets keep pending and rejected media from becoming public by URL.
- Bucket-level upload restrictions provide a server-side backstop for client validation.
- SVG, GIF, HEIC, PDF, and unknown binary files stay out of the MVP.

## Object Path Options

### Option A: Observation Id Path

```text
observations/{observation_id}/{random_id}.{ext}
```

Pros:

- Clear relationship between one observation row and its image object.
- Easier cleanup by observation id.
- Easier to reason about if multiple images are added later.

Cons:

- The current public insert flow cannot read a newly inserted pending row id because public select is approved-only.
- Requires insert-before-upload plus a safe way to return the new id, or a client-generated observation id/RPC.
- Adds more schema/API design before the first image upload can work.

### Option B: Pending Client Id Path

```text
pending/{client_generated_id}/{random_id}.{ext}
```

Pros:

- Works with upload-before-insert.
- Does not require reading a pending row after insert.
- Fits the current frontend-only Supabase repository architecture.
- Approval can remain a simple status update; no Storage move is required.

Cons:

- The path records the upload origin, not the final moderation state.
- Cleanup must use `observations.image_path`, not only folder names.
- Orphan objects are possible if upload succeeds but DB insert fails.

### 16C Path Recommendation

For 16C, use:

```text
pending/{client_generated_id}/{random_id}.{ext}
```

Use `crypto.randomUUID()` for both identifiers where available. Do not use the original local filename in the path.

If the project later adds a server API or RPC that can safely create the row and return its id without exposing pending rows, the path can move to:

```text
observations/{observation_id}/{random_id}.{ext}
```

## Database Change SQL Draft

This SQL is mirrored in `supabase/migrations/0002_create_observation_storage.sql`. Do not apply it until approved.

The recommended MVP adds `image_path` and lightweight metadata columns. `image_path` becomes the source for Supabase Storage objects. `image_url` remains for existing compatibility and must not receive blob URLs, signed URLs, public URLs, or preview data.

```sql
-- 16B draft only. Promote to a reviewed migration only after approval.

alter table public.observations
  add column if not exists image_path text,
  add column if not exists image_mime_type text,
  add column if not exists image_size_bytes integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_path_format_check'
  ) then
    alter table public.observations
      add constraint observations_image_path_format_check
      check (
        image_path is null
        or (
          char_length(trim(image_path)) > 0
          and image_path !~* '^(https?:|blob:|data:)'
          and (
            image_path ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
            or image_path ~* '^observations/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_mime_type_check'
  ) then
    alter table public.observations
      add constraint observations_image_mime_type_check
      check (
        image_mime_type is null
        or image_mime_type in ('image/jpeg', 'image/png', 'image/webp')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_size_bytes_check'
  ) then
    alter table public.observations
      add constraint observations_image_size_bytes_check
      check (
        image_size_bytes is null
        or (image_size_bytes >= 0 and image_size_bytes <= 5242880)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'observations_image_metadata_complete_check'
  ) then
    alter table public.observations
      add constraint observations_image_metadata_complete_check
      check (
        image_path is null
        or (image_mime_type is not null and image_size_bytes is not null)
      );
  end if;
end $$;

create index if not exists observations_image_path_idx
  on public.observations (image_path)
  where image_path is not null;
```

### Metadata Columns

Include metadata columns:

- Pros: supports admin review, cleanup, validation, and future abuse checks.
- Cons: requires mapper/type updates in 16C.

Skip metadata columns:

- Pros: smaller schema change.
- Cons: file type and size become harder to inspect without Storage metadata calls.

Recommendation:

- Add `image_mime_type` and `image_size_bytes` with `image_path`.
- Keep them nullable because images remain optional.
- Require them when `image_path` is present.

### Insert Grants For Image Path

The current public insert grants exclude all image fields. If 16C allows public image submission, the insert grants must be expanded narrowly.

Apply this only if image upload is approved for the public create flow:

```sql
-- 16B draft only. Enables clients to attach Storage path metadata to pending rows.
grant insert (
  image_path,
  image_mime_type,
  image_size_bytes
) on public.observations to anon, authenticated;
```

This does not let public users approve rows. The existing insert policy must still require `status = 'pending'`, and public select must still expose only `approved` rows.

## Storage Bucket SQL Draft

This SQL creates or updates a private bucket with upload restrictions.
It is mirrored in `supabase/migrations/0002_create_observation_storage.sql`.

```sql
-- 16B draft only. Promote to a reviewed migration only after approval.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'observation-images',
  'observation-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

## Storage RLS And Policy SQL Draft

Supabase Storage uses RLS policies on `storage.objects`. A private bucket requires explicit policies for upload, read, and signed URL generation. The service role key must not be used in the frontend.

### Admin Read Policy

Admins need to review pending images. This policy lets authenticated admins read objects in the private bucket.

```sql
-- 16B draft only.

drop policy if exists "Admins can read observation images" on storage.objects;
create policy "Admins can read observation images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'observation-images'
  and public.is_admin()
);
```

### Public Approved Read Policy

Public approved image display requires a way to create or fetch a display URL only when the object belongs to an approved observation. For the signed URL approach, repository/helper code should call `createSignedUrl()` only after the public repository has selected an approved row.

The Storage policy should also prevent direct public reads of pending/rejected images:

```sql
-- 16B draft only.
-- Allows reads only for objects referenced by approved observations.
-- If the Supabase project has operation-aware Storage helpers available,
-- add an operation helper to prevent bucket listing from becoming an enumeration path.

drop policy if exists "Public can read approved observation images" on storage.objects;
create policy "Public can read approved observation images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'observation-images'
  and exists (
    select 1
    from public.observations
    where observations.status = 'approved'
      and observations.image_path = storage.objects.name
  )
);
```

This policy must not change the public observation table policy. Public lists still query only `approved` observations.

### Anonymous Upload Policy Candidate

The current app has public no-login submissions. If that behavior must include images in 16C, anonymous upload needs a tightly scoped Storage insert policy.

Risk:

- anonymous users can consume Storage capacity
- client validation can be bypassed
- there is no owner identity for cleanup or abuse tracing
- upload can succeed before DB insert, creating orphan objects

Candidate policy if anonymous upload is approved:

```sql
-- 16B.5 candidate only. Apply only if anonymous image upload is explicitly approved.
-- This allows insert only, not select/update/delete.

drop policy if exists "Public can upload pending observation images" on storage.objects;
create policy "Public can upload pending observation images"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'observation-images'
  and name ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
);
```

16C should upload without `upsert`. Allowing upsert requires additional `select` and `update` policies and increases risk.

This policy is not active in `0002_create_observation_storage.sql`; it is included there only as a commented candidate.

### Authenticated Upload Policy Alternative

If anonymous image upload is not acceptable, require login before image upload:

```sql
-- 16B.5 candidate only. Apply instead of anonymous upload if image upload requires login.

drop policy if exists "Authenticated users can upload pending observation images" on storage.objects;
create policy "Authenticated users can upload pending observation images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'observation-images'
  and name ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
);
```

This is safer for abuse tracing but would require a product decision because the current public upload flow does not require login.

This policy is not active in `0002_create_observation_storage.sql`; it is included there only as a commented candidate.

### Status-Linked Policy Limits

`storage.objects` policies can check `public.observations` for approved rows during read. They cannot cleanly verify a pending observation row during upload when the upload happens before the row insert.

Workarounds:

- use `pending/{client_generated_id}/{random_id}.{ext}` and accept orphan cleanup risk for the MVP
- use insert-before-upload with a dedicated RPC that creates the row and returns an id
- require login and store ownership metadata later
- move signed URL generation to a server/Edge Function later

For 16B.5, do not weaken public table visibility to make Storage easier.

## Signed URL Strategy

Signed URLs are runtime display values only.

Rules:

- Do not store signed URLs in `public.observations`.
- Do not store public URLs in `public.observations`.
- Do not store blob/data/preview URLs in `public.observations`.
- Store only `image_path` plus optional metadata.

16D responsibility split:

- Public repository reads only approved rows.
- Public repository/helper creates signed URLs only for approved rows with `image_path`.
- Admin repository/helper creates signed URLs for pending rows shown in admin review.
- UI components receive display-ready `Observation.imageUrl` strings and do not call Supabase directly.

Expiration:

- Admin review signed URL: 10 minutes.
- Public detail/list signed URL: 10 minutes.
- Avoid longer durations until revocation and cache behavior are reviewed.

Official Supabase docs describe private bucket downloads as controlled by RLS or time-limited signed URLs:

- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/serving/downloads
- https://supabase.com/docs/reference/javascript/storage-from-createsignedurl

## Rejected And Orphan Cleanup

### Rejected Images

Delete immediately:

- Pros: reduces storage usage and removes rejected content quickly.
- Cons: harder to audit moderation decisions, harder to recover accidental rejection.

Retain then cleanup:

- Pros: supports review and recovery.
- Cons: consumes storage and needs periodic manual maintenance.

MVP recommendation:

- Retain rejected images in the private bucket for a short manual review period.
- Keep them inaccessible to public users.
- Add automated deletion only after a retention policy is approved.

### Orphan Images

Orphan scenarios:

- Storage upload succeeds but observation insert fails.
- User closes the browser after upload but before insert.
- Upload succeeds with a path that fails DB constraints.
- A later manual DB cleanup removes a row but not the object.

MVP recommendation:

- Manual cleanup only.
- Compare Storage object listing under `pending/` with `public.observations.image_path`.
- Do not add Edge Functions, scheduled cleanup, or automatic deletion in 16B.

Candidate orphan check query:

```sql
-- 16B draft only. This only finds DB rows that point to missing/changed paths
-- if paired with a Storage object listing outside SQL.
select
  id,
  image_path,
  status,
  created_at
from public.observations
where image_path is not null
order by created_at desc;
```

## Manual Setup Procedure

Do not perform these steps until the user approves applying 16B.5 to a real Supabase project.

16C must not start against a real Supabase project until the selected bucket, columns, and policies are applied and verified.

### Before Applying

Confirm:

- `0001_create_observation_schema.sql` has been reviewed and applied.
- `public.observations` exists.
- `public.profiles` exists.
- RLS is enabled.
- `public.is_admin()` exists.
- The first admin user is configured through `public.profiles.role = 'admin'`.
- `.env.local` is not committed.
- No service role key is in frontend code or Vite environment variables.
- The team has decided anonymous image upload vs authenticated-only image upload.
- `supabase/migrations/0002_create_observation_storage.sql` has been reviewed.
- The team understands that the migration candidate does not activate upload insert policies.

### Dashboard Bucket Setup

Use either the dashboard bucket setup or the bucket SQL in the migration candidate. Do not do both unless you understand the resulting upsert behavior.

1. Open Supabase Dashboard.
2. Go to Storage.
3. Create a bucket.
4. Set bucket id/name to:

```text
observation-images
```

5. Keep the bucket private.
6. Set max file size to 5 MB.
7. Set allowed MIME types to JPEG, PNG, and WebP.
8. Confirm the bucket is not public.

If the dashboard is used, the bucket SQL in `0002_create_observation_storage.sql` is still safe because it uses `on conflict (id) do update`, but review this before applying.

### SQL Editor Setup

Recommended SQL Editor flow:

1. Open `supabase/migrations/0002_create_observation_storage.sql`.
2. Review the active SQL:
   - image columns and constraints
   - `observations_image_path_idx`
   - private bucket upsert
   - admin read policy
   - approved-observation public read policy
3. Confirm the commented upload policy candidates remain commented unless the user explicitly approves one.
4. Paste the reviewed active SQL into Supabase SQL Editor.
5. Run it manually.
6. Choose exactly one upload policy later, before 16C can upload images:
   - anonymous upload candidate
   - authenticated-only upload candidate
7. Add insert grants for image metadata only with the selected upload policy.

### After Applying

Confirm:

- `observation-images` exists.
- Bucket `public` is false.
- File size limit is 5 MB.
- Allowed MIME types are JPEG, PNG, and WebP.
- `public.observations.image_path` exists.
- `public.observations.image_mime_type` exists.
- `public.observations.image_size_bytes` exists.
- Existing public select still returns only `approved` observations.
- Pending/rejected observations remain hidden from public queries.
- Non-admin users cannot read pending/rejected image objects.
- Admin users can generate/read review images once 16C helper code exists.
- Upload attempts should still fail until one upload policy candidate and matching insert grant are explicitly approved and applied.

## Rollback Procedure

Do not run rollback SQL unless intentionally reverting the Storage setup after it has been applied manually.

Recommended rollback order:

1. Disable new upload/display code first if 16C or 16D has already been implemented.
2. Export or record any image metadata that must be retained.
3. Remove or archive objects from `observation-images` manually in the dashboard.
4. Confirm the bucket is empty before deleting the bucket row.
5. Drop Storage policies:

```sql
drop policy if exists "Public can upload pending observation images" on storage.objects;
drop policy if exists "Authenticated users can upload pending observation images" on storage.objects;
drop policy if exists "Public can read approved observation images" on storage.objects;
drop policy if exists "Admins can read observation images" on storage.objects;
```

6. Remove the bucket only after confirming it is empty:

```sql
delete from storage.buckets
where id = 'observation-images';
```

7. Remove image grants and DB additions if needed:

```sql
revoke insert (
  image_path,
  image_mime_type,
  image_size_bytes
) on public.observations from anon, authenticated;

drop index if exists observations_image_path_idx;

alter table public.observations
  drop constraint if exists observations_image_metadata_complete_check,
  drop constraint if exists observations_image_size_bytes_check,
  drop constraint if exists observations_image_mime_type_check,
  drop constraint if exists observations_image_path_format_check;

alter table public.observations
  drop column if exists image_size_bytes,
  drop column if exists image_mime_type,
  drop column if exists image_path;
```

8. Confirm existing public observation reads still work.
9. Confirm public lists still expose only `approved` observations.
10. Confirm `.env.local`, tokens, and Supabase keys were not printed or committed.

Rollback notes:

- If existing rows have `image_path` values, dropping image columns permanently removes those references.
- If 16C has already mapped `image_path` into UI display values, revert that app code before dropping columns.
- Deleting `storage.buckets` does not replace a careful object retention decision.
- Do not use a frontend service role key for cleanup.

## 16C Implementation Plan

16C can start only after:

- `0002_create_observation_storage.sql` active SQL has been applied to the target Supabase project.
- Exactly one upload policy candidate has been approved and applied.
- Matching insert grants for `image_path`, `image_mime_type`, and `image_size_bytes` have been approved and applied.
- The private bucket and read policies have been verified.
- Pending/rejected public non-exposure has been rechecked.

Expected files to inspect or modify in 16C:

```text
src/types.ts
src/components/UploadMockPage.tsx
src/features/upload/uploadForm.ts
src/repositories/observationRepository.ts
src/repositories/observationRepositoryProvider.ts
src/repositories/supabase/observationDbTypes.ts
src/repositories/supabase/observationMappers.ts
src/repositories/supabase/supabaseObservationRepository.ts
src/repositories/supabase/supabaseAdminObservationRepository.ts
src/repositories/supabase/supabaseClient.ts
```

Suggested new helper:

```text
src/repositories/supabase/supabaseObservationImageStorage.ts
```

Repository/helper responsibilities:

- validate file size and MIME type before upload
- generate object paths
- upload to the private bucket
- store only `image_path` and metadata in DB rows
- generate signed URLs for display
- keep Supabase calls outside UI components
- keep public reads approved-only
- keep admin reads behind admin repository and RLS

UI responsibilities:

- keep local preview behavior
- pass `imageFile` through existing form/repository flow
- receive display strings through existing observation rendering paths
- never call Supabase directly

Verification after 16C code changes:

```bash
npm.cmd run typecheck
npm.cmd run build
```

## 16D Implementation Note

Phase 16D connects `image_path` display through repository/helper code:

- `supabaseObservationImageStorage.ts` creates 10-minute signed URLs from Storage object paths.
- The public Supabase repository creates signed URLs only after selecting approved observation rows.
- The admin Supabase repository creates signed URLs for pending/all admin review rows.
- Signed URLs remain runtime-only display values and are not inserted or updated in `public.observations`.
- UI components continue to receive `Observation.imageUrl` and do not call Supabase directly.

## 16D Verification Scenarios

Verify:

- Upload page preview still works before upload.
- Supabase public submit with no image still creates a pending observation.
- Supabase public submit with an allowed image uploads an object and creates a pending observation.
- Admin pending review can show the submitted image.
- Approve keeps the file in place and changes only observation status.
- Approved public detail can show the image through a temporary signed URL.
- Rejected observations remain hidden from public lists.
- Rejected images remain inaccessible to public users.
- Signed URLs are not stored in the database.
- Public URLs are not stored in the database.
- Blob/data preview URLs are not stored in the database.
- Console logs do not include secrets, tokens, emails, passwords, Supabase keys, or `.env.local` contents.

## 16D.5 Smoke Test And Operational Hardening

Phase 16D.5 checked the current local/Supabase readiness without printing `.env.local` values or Supabase credentials.

Read-only Supabase check result:

- Supabase mode local configuration was present.
- Supabase project client configuration was present.
- Approved public read succeeded with 10 sampled approved rows.
- 0 sampled approved rows had `image_path`, so approved image display could not be confirmed from existing data.
- Public pending-row query returned 0 visible rows.
- Public rejected-row query returned 0 visible rows.
- No query errors were reported.
- A temporary Vite dev server returned HTTP 200 at the root page and was stopped after the check.

Full upload/admin smoke test status:

- Not run in this session.
- Reason: no browser automation dependency is installed, no new dependency should be added, and no admin test credentials are configured for automated login/approval.
- No test Storage object or test observation row was created, avoiding orphan cleanup risk.

Manual full smoke checklist:

1. Start the app in Supabase mode.
2. Submit a JPEG, PNG, or WebP through the upload screen.
3. Confirm the row is created as `pending`.
4. Confirm the row stores `image_path`, `image_mime_type`, and `image_size_bytes`.
5. Confirm `image_url` does not store signed, public, blob, preview, or data URLs.
6. Confirm public reads do not expose the pending row.
7. Sign in to `/#admin` as an admin user.
8. Confirm the pending image displays through a temporary signed URL.
9. Approve the observation.
10. Confirm the approved public detail image displays through a temporary signed URL.
11. Reject a separate test observation and confirm it remains hidden publicly.
12. Confirm logs do not expose secrets, tokens, Supabase URL, anon key, emails, passwords, or `.env.local` contents.

Later manual smoke progress:

- `UploadMockPage` alert handling was fixed after the manual test showed the same mock/design alert for validation failure, create failure, and success.
- User-reported retest result after the alert fix:
  - DB row was created.
  - Row status was `pending`.
  - `image_path` was present.
  - `image_mime_type` was present.
  - `image_size_bytes` was present.
  - `image_url` was `NULL`.
  - Approve flow was normal.
  - Reject flow was normal.
- This confirms the Storage create path stores object path metadata and does not store signed, public, blob, preview, or data URLs in `image_url`.
- Admin pending image display and approved public detail image display were not explicitly reported and still need manual confirmation.

Operational risks to keep visible:

- Anonymous upload can consume Storage capacity before moderation.
- Upload-before-insert can leave orphan objects if DB insert fails.
- Rejected images remain in private Storage until manual cleanup.
- Signed URLs expire after 10 minutes; long-lived pages may need a future refresh strategy.
- Signed URL generation failures currently fall back to the existing no-image display.
- `image_url` remains a legacy compatibility field and should not receive new Storage display URLs.

## 16E Storage Hardening And Operations

Phase 16E is documentation-only. It does not change app code, Supabase SQL, Storage policies, package files, or UI behavior.

### Current Protections

The MVP Storage flow currently relies on these controls:

- The `observation-images` bucket is private.
- Public uploads use an insert-only Storage policy.
- Upload code uses `upsert: false`.
- Bucket and client validation limit files to 5 MB.
- Bucket and client validation allow only `image/jpeg`, `image/png`, and `image/webp`.
- Object paths are random and constrained to `pending/{client_generated_id}/{random_id}.{ext}`.
- Public observation reads remain approved-only.
- Pending and rejected observations remain hidden from public repositories and public UI.
- Public approved image display is generated from `image_path` only after approved rows are selected.
- Signed URLs are runtime display values and are not stored in the database.
- Public URLs, blob URLs, preview URLs, and data URLs are not stored in the database.
- New Storage uploads store only `image_path`, `image_mime_type`, and `image_size_bytes`.

These controls reduce accidental exposure but do not replace abuse prevention, cleanup automation, or full manual smoke verification.

### Orphan Object Scenarios

Orphan objects can occur when:

- Storage upload succeeds but `public.observations` insert fails.
- A user closes the browser after upload but before row insert completes.
- Upload succeeds but the row insert fails a DB constraint.
- Manual DB cleanup removes an observation row without deleting its Storage object.
- A future moderation or cleanup workflow partially fails.

### Manual Orphan Cleanup Procedure

For MVP operations, cleanup is manual:

1. In Supabase Dashboard, open Storage bucket `observation-images`.
2. Export or record object paths under `pending/`, including created time and size where available.
3. In SQL Editor, list DB image references:

```sql
select
  id,
  status,
  image_path,
  image_mime_type,
  image_size_bytes,
  created_at,
  updated_at
from public.observations
where image_path is not null
order by created_at desc;
```

4. Treat a Storage object as an orphan only if its object path is not referenced by any `public.observations.image_path`.
5. Do not delete objects referenced by `pending` rows during active moderation.
6. Do not delete objects referenced by `approved` rows unless intentionally removing the approved image.
7. For `rejected` rows, follow the rejected-image retention procedure below.
8. Delete confirmed orphan objects manually in the Storage dashboard after review.
9. Never use a service role key in frontend code for cleanup.

### Rejected Image Cleanup Procedure

Rejected observations remain private and publicly hidden, but their images still consume Storage until cleanup.

MVP procedure:

1. Choose a retention window before deletion. The recommended first value is manual review first, then delete after a team-approved number of days.
2. List rejected rows with images:

```sql
select
  id,
  image_path,
  image_mime_type,
  image_size_bytes,
  created_at,
  updated_at
from public.observations
where status = 'rejected'
  and image_path is not null
order by updated_at asc;
```

3. Confirm each rejected row no longer needs review or recovery.
4. Delete the matching Storage object from `observation-images` manually.
5. Decide separately whether to keep the DB `image_path` for audit/debug context or clear it in a later approved DB maintenance step.

Do not add automatic deletion until a retention policy and failure handling are approved.

### Anonymous Upload Abuse Risk

The MVP keeps public no-login reports, so anonymous image upload remains a risk:

- Storage capacity can be consumed before moderation.
- Client-side validation can be bypassed.
- Anonymous uploads have limited attribution.
- Upload-before-insert can create orphan objects.
- Repeated uploads can create review workload even when rows stay pending or rejected.

Current mitigations are the private bucket, insert-only policy, no upsert, constrained path pattern, 5 MB limit, MIME restrictions, approved-only public reads, and signed URLs not being persisted.

Future hardening candidates:

- Add CAPTCHA or rate limiting before upload.
- Switch image upload to authenticated-only while keeping text-only public reports available.
- Add an Edge Function that atomically validates upload intent and observation creation.
- Add scheduled cleanup for stale orphan objects.
- Add an admin cleanup tool for rejected/orphan images.
- Monitor Storage object count and total size.
- Review bucket usage regularly after public launch.
- Add alerts or manual thresholds for sudden upload spikes.

### Signed URL Expiration UX

Signed URLs currently expire after 10 minutes.

Expected MVP behavior:

- Fresh repository reads generate fresh signed URLs.
- Long-lived pages may show expired images after the URL expires.
- Signed URL generation failures fall back to the existing no-image display.

Future UX options:

- Regenerate signed URLs when a detail modal opens.
- Regenerate signed URLs when an image load fails.
- Add a repository-level refresh helper without exposing Supabase calls to UI components.
- Consider a longer expiration only after privacy and revocation behavior are reviewed.

### Manual Full Smoke Test Checklist

Before moving to 17A, run the full Supabase UI smoke test in the target project:

1. Confirm `VITE_OBSERVATION_REPOSITORY=supabase` locally without printing `.env.local`.
2. Confirm active `0002` SQL, private bucket, anonymous upload policy, and metadata insert grants are applied.
3. Prepare one small JPEG, PNG, or WebP under 5 MB.
4. Start the app with `npm.cmd run dev`.
5. Submit a public report with the test image.
6. Confirm the new observation row is `pending`.
7. Confirm the row stores `image_path`, `image_mime_type`, and `image_size_bytes`.
8. Confirm `image_url` does not contain signed, public, blob, preview, or data URLs.
9. Confirm public list/detail does not expose the pending row.
10. Sign in to `/#admin` with an admin account.
11. Confirm the pending image appears in the admin queue or review panel.
12. Approve the observation.
13. Confirm the approved public detail image appears through a temporary signed URL.
14. Reject a separate test observation with an image, if available.
15. Confirm rejected rows remain hidden from public list/detail.
16. Confirm console/log output does not expose Supabase URL, anon key, token, email, password, or `.env.local` contents.
17. Clean up test data and Storage objects according to the agreed retention policy.

### Storage TODOs Before 17A

Before starting real Kakao Map provider work, keep these Storage items visible:

- Complete the full manual upload/admin/approve smoke test.
- Decide rejected image retention duration.
- Decide manual or automated orphan cleanup cadence.
- Decide whether anonymous upload remains acceptable for public launch.
- Decide whether signed URL refresh is needed for long-lived list/detail pages.
- Decide whether Storage monitoring should be manual or automated.

## Explicit Non-Scope

- Do not implement Kakao Map.
- Do not expose the admin route in `Navbar`.
- Do not add reject notes.
- Do not add audit logs.
- Do not add bulk approval.
- Do not add user management UI.
- Do not add spam, rate-limit, or CAPTCHA features.
- Do not add new dependencies.
- Do not change app code in 16B.5.
- Do not change package files in 16B.5.
- Do not apply SQL to Supabase in 16B.5.
- Do not create the real Storage bucket in 16B.5.
- Do not weaken RLS.
- Do not create policies that expose pending or rejected observations in public lists.

## Decisions Needing Approval Before Applying

- Allow anonymous image upload, or require login before image upload.
- Use `pending/{client_generated_id}/{random_id}.{ext}` for 16C, or design an insert-before-upload RPC for `observations/{observation_id}/{random_id}.{ext}`.
- Include `image_mime_type` and `image_size_bytes` as required metadata when `image_path` exists.
- Accept 5 MB as the first Storage limit.
- Accept 10-minute admin and public signed URLs.
- Define rejected image retention duration.
- Decide when to apply `supabase/migrations/0002_create_observation_storage.sql` to the real Supabase project.
- Decide whether to uncomment and apply the anonymous upload candidate or the authenticated-only upload candidate before 16C.
