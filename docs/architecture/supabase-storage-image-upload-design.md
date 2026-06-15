# Supabase Storage Image Upload Design

## Purpose And Scope

This document defines the phase 16A design for Supabase Storage image uploads in the KNU Eco Map app.

This phase is design-only:

- 16A writes the Storage image upload design and records policy decisions.
- 16B drafts the Storage bucket and policy SQL or setup guide.
- 16C adds the upload helper and connects image upload to the create-observation flow.
- 16D verifies image display in admin review and public detail views.

This document does not create a Storage bucket, apply SQL, add upload code, change UI behavior, or modify package files.

## Current Constraints

- Public observation lists must expose only `approved` observations.
- Public uploads must create only `pending` observations.
- `pending` and `rejected` observations must not appear in public lists.
- UI components must not call Supabase directly.
- Supabase direct calls should stay behind repository/helper boundaries.
- The frontend must never use a Supabase service role key.
- Preview URLs, data URLs, and blob URLs must not be stored as `observations.image_url`.
- Hidden `/#admin` routing is not a security boundary.
- Real protection must remain Supabase Auth, RLS, and `public.profiles.role = 'admin'`.
- `image_url` is currently nullable.
- Public insert grants currently exclude `image_url`, so 16B/16C must explicitly decide how image paths are written.
- The current Supabase public repository inserts observation rows only; it does not upload files.
- The current upload form can hold `imageFile` and `imagePreviewUrl`, but preview is local-only.

## Decisions To Make

The Storage phase must decide these before implementation:

- Bucket visibility: public bucket or private bucket.
- Operation order: upload-before-insert or insert-before-upload.
- Object path rules.
- Pending image protection.
- Approved image serving.
- Rejected image cleanup.
- File size limit.
- Allowed MIME types and file extensions.
- Client-side compression or resize timing.
- Database value: public URL, signed URL, storage path, metadata, or a combination.

## Option A: Public Bucket With Random Object Paths

### Summary

Use one public `observation-images` bucket. The client uploads before inserting the observation row. The DB stores either a public URL or a storage path that can be converted to a public URL.

Candidate path:

```text
submissions/{random-uuid}.{ext}
```

### Public/Admin Flow

- Public submit:
  - validate file
  - upload to public bucket
  - insert pending observation with image path or URL
- Admin review:
  - load pending row
  - render image using public URL
  - approve or reject row
- Public approved display:
  - approved row already contains displayable image URL or path

### Pros

- Easiest to implement.
- Public image rendering is simple.
- No signed URL lifecycle.
- Works well with CDN-style static image delivery.
- Admin review needs minimal extra code.

### Cons

- Pending and rejected images are publicly reachable if the object URL is known.
- Random paths reduce discoverability but do not provide policy-level privacy.
- A submitted image can become public before admin approval.
- Rejected image cleanup is easy to forget.

### Security Impact

This option weakens the moderation privacy model. The public list still hides pending/rejected observations, but Storage does not hide the corresponding files.

### Implementation Difficulty

Low.

## Option B: Private Bucket, Store Storage Path, Resolve Signed Display URLs

### Summary

Use one private `observation-images` bucket. The DB stores only a Storage object path, not a public URL or signed URL. Repositories resolve temporary display URLs when rows are allowed to be shown.

Candidate path:

```text
submissions/{yyyy}/{mm}/{random-uuid}.{ext}
```

The path should be random and unguessable. It should not include user-entered filenames.

### Public/Admin Flow

- Public submit:
  - validate file
  - upload to private bucket under a constrained `submissions/` path
  - insert pending observation with the storage path
- Admin review:
  - admin repository lists pending rows through existing admin RLS
  - admin repository/helper creates signed display URLs for pending images
  - UI receives normal `Observation.imageUrl` display values
- Public approved display:
  - public repository lists only approved rows
  - repository/helper creates signed display URLs only for approved rows
  - pending and rejected rows remain invisible to public queries

### Pros

- Best match for the current observation visibility model.
- Pending and rejected images are not publicly readable by default.
- DB does not store expiring signed URLs.
- DB does not store browser preview/blob URLs.
- UI components can stay Supabase-free.
- Approval can remain a status update; object movement is not required.
- Future cleanup can delete rejected or orphaned paths without changing public URLs stored in DB.

### Cons

- Storage policies are more complex.
- Public approved image display needs signed URL generation.
- Signed URLs expire and must be generated at read time.
- List/detail queries may need extra async work per image.
- Upload-before-insert can leave orphan objects if DB insert fails.
- Public insert grants or an RPC must be adjusted so the storage path can be associated with the pending row.

### Security Impact

This option preserves the important security boundary: public users can only see approved observation rows and only approved image display URLs generated through repository logic and Storage policies.

Storage RLS should allow:

- public/anon insert only to constrained upload paths if anonymous upload remains allowed
- admin read of pending, approved, and rejected images
- public read or signed URL creation only for objects referenced by approved observations

### Implementation Difficulty

Medium.

## Option C: Pending Private Path, Approved Public Path

### Summary

Use separate visibility areas, either in one bucket or two buckets:

```text
pending/{random-uuid}.{ext}
approved/{observation-id}/{random-uuid}.{ext}
```

Uploads start in private pending storage. On approval, admin code moves or copies the object to an approved public path and updates the observation row.

### Public/Admin Flow

- Public submit:
  - upload image to private pending path
  - insert pending observation with pending path
- Admin review:
  - admin reads pending image using private access or signed URL
  - approve action moves/copies image to approved path
  - approve action updates row status and image path
- Public approved display:
  - public row points to approved public path or approved signed path

### Pros

- Strong pending image protection.
- Approved images can be served very simply if approved storage is public.
- Rejected images stay private.
- Object path can mirror moderation state.

### Cons

- Approval becomes a multi-step operation.
- Move/copy/update can partially fail.
- Without a server/API or transaction across Storage and Postgres, consistency is harder.
- Reject cleanup and retry behavior need careful rules.
- More code changes are required in the admin repository.

### Security Impact

This can be strong if implemented carefully, but partial failures can create stale paths or expose files earlier than intended.

### Implementation Difficulty

High for the current frontend-only Supabase architecture.

## Recommendation

Use Option B: a private `observation-images` bucket, store only a Storage object path in the database, and generate temporary display URLs in repository-level Supabase helpers.

Recommended DB value:

```text
storage path only
```

Do not store:

- public URLs
- signed URLs
- data URLs
- blob URLs
- original local filenames as trusted paths

For the current schema, `observations.image_url` can continue to hold the storage path for the MVP, even though the column name is legacy. If 16B accepts a small schema improvement, a clearer `image_path` column can be added and `image_url` can remain a mapped display value in the frontend. The lower-change path is to keep `image_url` and document that Supabase rows store object paths, not final display URLs.

### Why This Fits This Project

Public visibility:

- Public repositories already read only `approved` rows.
- Signed display URLs can be generated only after approved rows are returned.
- Pending and rejected rows remain hidden from public list/detail queries.

Admin approval flow:

- Admin repositories already read pending rows through Auth and RLS.
- Admin review can generate signed URLs for pending objects without exposing them publicly.
- Approve/reject can remain status changes at first.

RLS:

- Database RLS continues to protect row visibility.
- Storage policies can mirror the same rule: admin can read review images, public can read only images referenced by approved observations.
- The hidden admin route remains only a UI entry point.

Implementation complexity:

- More secure than a public bucket.
- Simpler than moving files between pending and approved locations.
- No new dependency is required.
- UI components can continue receiving `Observation.imageUrl` as a display string.

Maintenance:

- Storage paths are stable.
- Signed URL expiration is handled by repository calls.
- Rejected-image cleanup can be added later without changing public URLs stored in the DB.
- If the project later adds a server API, signed URL generation can move server-side without changing the stored DB value.

### Recommended Detailed Decisions

Bucket:

- Name: `observation-images`
- Visibility: private

Upload order:

- Prefer upload-before-insert for the first frontend-only implementation.
- Reason: current public RLS does not allow selecting newly inserted pending rows to obtain DB-generated ids.
- Use a client-generated random upload id for the object path.
- Accept a known MVP risk: DB insert failure can leave an orphan Storage object.

Object path:

```text
submissions/{yyyy}/{mm}/{random-uuid}.{ext}
```

Rules:

- Use `crypto.randomUUID()` when available.
- Never trust or preserve user-entered filenames in the path.
- Derive extension from validated MIME type.
- Keep the same path after approval; do not encode status into the path.

Pending image protection:

- Bucket remains private.
- Public users must not be able to select/download arbitrary objects.
- Public approved-image access must be tied to an approved observation row.
- Admin access must require authenticated admin status through existing `public.is_admin()`.

Approved image serving:

- Repository/helper creates signed display URLs from stored paths.
- Public repository should do this only after reading approved observations.
- Admin repository may do this for pending rows during review.
- Signed URLs are runtime display values only; they are never written back to the DB.

Rejected image cleanup:

- 16C may leave rejected images in private storage.
- 16D should verify rejected rows stay hidden publicly.
- A later cleanup phase can delete rejected or orphaned objects after retention policy is defined.
- Do not add audit logs or reject notes in this phase.

File size:

- Storage bucket hard limit: 5 MB.
- Client validation should reject files above 5 MB before upload.

MIME types and extensions:

- Allow `image/jpeg` with `.jpg` or `.jpeg`.
- Allow `image/png` with `.png`.
- Allow `image/webp` with `.webp`.
- Reject SVG, GIF, HEIC, PDF, and unknown binary types for the MVP.

Client-side compression/resize:

- Do not add a new dependency.
- First implementation should validate size and type before upload.
- Browser-native resize/compression can be added later if 5 MB rejects too many mobile photos.
- Storage policy must still enforce the hard size and MIME limits.

## How This Continues Into 16B, 16C, And 16D

### 16B: Storage Bucket And Policy Draft

Prepare, but do not automatically apply, a SQL/setup draft for:

- Creating or updating private `observation-images` bucket.
- Setting `file_size_limit` to 5 MB.
- Setting allowed MIME types to JPEG, PNG, and WebP.
- Allowing anon/authenticated upload only to constrained `submissions/` paths.
- Allowing admin read of observation images with `public.is_admin()`.
- Allowing public read or signed URL creation only when the object path is referenced by an `approved` observation.
- Deciding whether to keep using `observations.image_url` as path storage or add `observations.image_path`.
- Updating observation insert grants/checks only as narrowly as needed for image path association.
- Documenting orphan object cleanup as a later manual or admin task.

Expected files for 16B:

```text
docs/architecture/supabase-storage-setup.md
supabase/migrations/0002_create_observation_storage.sql
```

The exact filenames can be adjusted in 16B, but the SQL should remain a reviewed draft unless the user asks to apply it.

### 16C: Upload Helper And Create Flow

Expected code files to inspect or modify in 16C:

```text
src/components/UploadMockPage.tsx
src/features/upload/uploadForm.ts
src/repositories/observationRepository.ts
src/repositories/observationRepositoryProvider.ts
src/repositories/supabase/supabaseObservationRepository.ts
src/repositories/supabase/supabaseAdminObservationRepository.ts
src/repositories/supabase/observationMappers.ts
src/repositories/supabase/observationDbTypes.ts
src/repositories/supabase/supabaseClient.ts
src/types.ts
```

Likely new helper file:

```text
src/repositories/supabase/supabaseObservationImageStorage.ts
```

Implementation expectations:

- Keep UI components from calling Supabase directly.
- Validate image file type and size before upload.
- Upload image only when `CreateObservationInput.imageFile` exists.
- Store only the Storage path in the DB.
- Do not store `imagePreviewUrl`.
- Preserve pending observation creation.
- Preserve mock repository behavior unless explicitly changed.
- Do not add dependencies.

### 16D: Image Display Verification

Verify these scenarios:

- Mock repository mode still works without Supabase env values.
- Upload page local preview still works.
- Supabase public submit with no image still creates a pending row.
- Supabase public submit with an allowed image uploads the object and creates a pending row.
- Public observation list still shows only approved rows.
- Pending image is not publicly displayable before approval.
- Admin pending list can show a submitted image for review.
- Admin review panel can show the submitted image.
- Approving an observation makes the row public.
- Approved public detail view can show the submitted image.
- Rejecting an observation keeps the row hidden publicly.
- Rejected image remains inaccessible to public users.
- No Supabase URL, anon key, token, email, password, or `.env.local` content is logged.

## Explicit Non-Scope

- Do not implement Kakao Map.
- Do not expose the admin route in `Navbar`.
- Do not add reject notes.
- Do not add audit logs.
- Do not add bulk approval.
- Do not add user management UI.
- Do not add spam, rate-limit, or CAPTCHA features.
- Do not add new dependencies.
- Do not weaken RLS policies.
- Do not create Storage buckets in this phase.
- Do not apply Storage policy SQL in this phase.
- Do not implement upload helpers in this phase.
- Do not connect image upload to the UI in this phase.

## Remaining Decisions Needing Approval

- Approve Option B as the Storage design direction.
- Decide whether `observations.image_url` may store a Storage path for the MVP or whether 16B should add a clearer `image_path` column.
- Decide whether anonymous image upload is acceptable for the MVP before spam controls exist.
- Decide the rejected/orphan image retention policy before adding automated cleanup.
- Decide whether 5 MB is acceptable for field photos or whether client resize should become part of 16C.
