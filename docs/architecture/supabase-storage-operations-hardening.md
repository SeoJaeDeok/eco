# Supabase Storage Operations Hardening

## Purpose And Scope

This document defines the phase 18A Storage operations hardening design and runbook for observation images.

18A is documentation-only:

- design rejected and orphan image operations
- document anonymous upload abuse risks and mitigation options
- document signed URL refresh UX options
- document Storage monitoring cadence
- provide read-only SQL and manual review procedures

18A does not:

- delete Storage objects
- automate cleanup
- deploy Edge Functions
- change Storage policies or RLS
- change app code
- change package files
- change Kakao Map code

The phase 18B read-only monitoring checklist is documented in:

```text
docs/architecture/supabase-storage-monitoring-checklist.md
```

The phase 18D anonymous upload abuse mitigation decision is documented in:

```text
docs/architecture/anonymous-upload-abuse-mitigation-decision.md
```

Actual cleanup automation starts no earlier than 18E or a later approved phase. Any policy, RLS, Edge Function, CAPTCHA, rate-limit, or admin cleanup UI change requires separate approval.

## Current Storage Structure

The current Supabase Storage flow is:

- Bucket: private `observation-images`
- Object path: `pending/{client_generated_id}/{random_id}.{ext}`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- File size limit: 5 MB
- Upload model: public no-login image upload through an anonymous insert-only Storage policy
- Upsert: disabled in app code
- DB image fields:
  - `public.observations.image_path`
  - `public.observations.image_mime_type`
  - `public.observations.image_size_bytes`
- Legacy DB field:
  - `public.observations.image_url` remains for compatibility and must not receive signed, public, blob, preview, or data URLs
- Display model: runtime signed URLs generated from `image_path`
- Signed URL duration: 10 minutes
- Public create: pending observations only
- Public read: approved observations only
- Pending and rejected rows: not exposed in public lists or public detail
- Admin review: Supabase Auth, RLS, and `public.profiles.role = 'admin'`

Current protections:

- private bucket
- insert-only upload policy
- no upsert
- constrained random object path
- 5 MB bucket and client limit
- MIME restrictions
- approved-only public observation reads
- pending/rejected public non-exposure
- signed URLs are not stored in the database
- public/blob/data/preview URLs are not stored in the database

These controls reduce exposure but do not solve cleanup, abuse prevention, or long-lived signed URL UX.

## Orphan Object Definition And Scenarios

An orphan object is a Storage object in `observation-images` that is not referenced by any active `public.observations.image_path` row and is not intentionally retained by an approved operational process.

Likely orphan scenarios:

- Storage upload succeeds, then DB insert fails.
- A user closes the browser during submit after upload succeeds.
- Network failure occurs between upload and row insert.
- Client validation passes but DB constraints reject the insert.
- A duplicate submit creates multiple uploaded objects but only one row.
- Manual testing leaves Storage objects without matching observation rows.
- A future DB cleanup removes observation rows without removing Storage objects.

Important distinction:

- A rejected observation image is not automatically an orphan if the row still references it.
- A pending observation image is not an orphan while it remains in the moderation queue.
- An approved observation image is not an orphan if public display still depends on it.

## Rejected Image Retention Options

### Option A: Delete Rejected Images Immediately

Summary:

- Delete the Storage object as soon as an observation is rejected.

Pros:

- Reduces Storage usage quickly.
- Minimizes retention of rejected user-submitted content.
- Reduces privacy exposure if an admin account is later compromised.

Cons:

- Makes accidental rejection harder to recover.
- Removes visual context for moderation review.
- Requires reliable object delete handling in the reject flow.
- A delete failure can leave the DB row and Storage object out of sync.

Privacy and operational risk:

- Lowest retention risk.
- Higher operational risk if moderation decisions need to be audited.

Implementation difficulty:

- Medium, because it couples admin rejection to Storage deletion and failure handling.

### Option B: Retain For A Short Window, Then Manual Cleanup

Summary:

- Keep rejected images private for a defined review window, then delete manually after review.

Pros:

- Supports accidental rejection recovery.
- Keeps moderation flow simple.
- Avoids frontend service-role cleanup shortcuts.
- Allows cleanup to start as a manual operation before automation exists.

Cons:

- Requires calendar discipline.
- Storage usage continues until cleanup.
- Rejected content remains accessible to admins until removed.

Privacy and operational risk:

- Balanced for MVP operations.
- Risk depends on retention length and admin access hygiene.

Implementation difficulty:

- Low for manual operations.
- Medium if later automated.

### Option C: Retain Regardless Of Status For Audit Window

Summary:

- Keep images for approved, pending, and rejected observations for a team-approved audit period.

Pros:

- Best for auditability and later moderation review.
- Avoids accidental data loss.
- Simplifies early operations because deletion is deferred.

Cons:

- Consumes more Storage.
- Retains rejected content longer.
- Requires a clear privacy and retention policy.

Privacy and operational risk:

- Highest retention risk.
- Better audit posture if the team needs evidence review.

Implementation difficulty:

- Low if manual.
- Medium if enforced with scheduled cleanup later.

### Recommended Rejected Image Retention

MVP recommendation:

- Use Option B.
- Retain rejected images for 30 days.
- Keep them private and publicly hidden.
- Review and delete manually after the retention window.
- Do not add automatic deletion until failure handling and recovery expectations are approved.

The 30-day value is a starting point. It should be approved by the project owner before any destructive cleanup.

## Orphan Cleanup Options

### Option A: Manual SQL And Storage Listing

Summary:

- Periodically compare `storage.objects.name` with `public.observations.image_path`.
- Review candidates manually before deletion.

Pros:

- No app code change.
- No service role key in frontend.
- Easy to audit before deleting.
- Fits MVP operations and small volume.

Cons:

- Manual and easy to forget.
- Requires dashboard access.
- Does not prevent abuse spikes in real time.

Risks:

- Human error during deletion.
- SQL Editor role may bypass app-level RLS, so operators must follow the runbook carefully.

### Option B: Scheduled Edge Function

Summary:

- A scheduled function lists old unreferenced objects and deletes approved candidates.

Pros:

- Consistent cleanup cadence.
- Can enforce retention windows.
- Can produce logs and summaries.

Cons:

- Requires backend function code and service-role handling.
- Needs careful dry-run mode and delete safeguards.
- More operational surface to monitor.

Risks:

- A bug can delete valid images.
- Service-role credentials must be isolated from frontend code.

### Option C: Admin Cleanup Tool

Summary:

- Add an admin-only UI for orphan/rejected candidates and explicit deletion.

Pros:

- Gives reviewers context.
- Keeps deletion under human control.
- Can show row status, size, age, and path in one place.

Cons:

- Adds admin UI scope.
- Needs strict RLS or server-side access design.
- Can distract from core moderation work.

Risks:

- A poorly designed UI could expose paths or allow accidental deletion.
- Frontend must not receive service-role credentials.

### Option D: Path Naming Convention Based Cleanup

Summary:

- Use the `pending/{client_generated_id}/{random_id}.{ext}` structure and object age to identify likely stale uploads.

Pros:

- Simple rule for first-pass candidate discovery.
- Works with upload-before-insert.
- Helps separate pending upload artifacts from future status-based paths.

Cons:

- Path prefix alone does not prove orphan status.
- Approved images currently remain under `pending/` paths by design.
- Must always cross-check with `public.observations.image_path`.

Risks:

- Deleting by prefix alone would remove valid approved images.
- Path age must be treated as a clue, not proof.

### Recommended Orphan Cleanup

MVP recommendation:

- Use manual SQL and Storage listing first.
- Run monthly while volume is low.
- Treat path convention and object age as candidate signals only.
- Delete only after verifying the object path is not referenced by any observation row.
- Move to scheduled cleanup only after 18B read-only checks and a later automation design are approved.

## Anonymous Upload Abuse Mitigation Options

### Current Mitigations

The current MVP already has these controls:

- private bucket
- insert-only upload policy
- no upsert
- path regex restriction
- 5 MB file limit
- MIME restrictions to JPEG, PNG, and WebP
- approved-only public reads
- pending/rejected public non-exposure
- signed URLs are runtime-only and not stored in DB

These controls limit public exposure and overwrite risk, but they do not prevent repeated anonymous uploads.

### CAPTCHA

Pros:

- Reduces automated spam.
- Preserves no-login public submissions.

Cons:

- Adds UX friction.
- Requires provider selection and integration.
- May affect accessibility.

Implementation difficulty:

- Medium.

### Rate Limit

Pros:

- Directly limits abuse volume.
- Can be tuned by IP/session if implemented server-side.

Cons:

- Requires a server, Edge Function, or proxy layer.
- Client-only rate limits are bypassable.

Implementation difficulty:

- Medium to high, depending on architecture.

### Authenticated-Only Upload

Pros:

- Improves attribution and abuse tracing.
- Reduces anonymous Storage consumption.

Cons:

- Changes the public-report product experience.
- Requires users to sign in before image upload.
- Text-only public reports would need a separate decision.

Implementation difficulty:

- Medium, mostly product flow and policy changes.

### Abuse Monitoring

Pros:

- Low implementation cost.
- Useful before heavier controls are justified.
- Can track object count, total size, pending queue age, and failed reports.

Cons:

- Reactive rather than preventive.
- Requires someone to check the dashboard.

Implementation difficulty:

- Low for manual operations.

### File Count And Size Quota

Pros:

- Gives concrete thresholds for intervention.
- Helps identify spikes before Storage cost grows.

Cons:

- Manual quota checks are not enforcement.
- Automated quota enforcement needs a backend layer.

Implementation difficulty:

- Low for manual monitoring, medium for enforcement.

### Admin Review Queue Monitoring

Pros:

- Detects upload abuse indirectly through moderation load.
- Uses existing admin workflow.

Cons:

- Does not catch orphan uploads with no DB row.
- Can overload reviewers before abuse is addressed.

Implementation difficulty:

- Low for manual checks.

### Recommended Abuse Mitigation

MVP recommendation:

- Continue anonymous upload for the current public-report UX.
- Use the 18B monitoring checklist for draft weekly/monthly thresholds.
- Revisit CAPTCHA or rate limit if upload count, total size, or pending queue age spikes.
- Consider authenticated-only image upload before public launch if abuse becomes likely.

Phase 18D refined this into a monitoring-first hybrid decision:

- Keep anonymous upload enabled while volume is low.
- Use explicit 18B/18D thresholds as escalation triggers.
- Start CAPTCHA or rate-limit design only after observed abuse or a public-launch risk decision.
- Treat authenticated contributor mode as a separate product decision.
- Do not change Storage policies, RLS, app code, or package files as part of the 18D decision.

## Signed URL Refresh UX Options

Current state:

- Runtime signed URLs expire after 10 minutes.
- Repositories generate signed URLs when rows are fetched.
- UI does not call Supabase directly.

Problem:

- A long-lived list, detail modal, or admin review page may keep an image URL after expiration.
- The user may see a broken image if the page is open past expiration.

### Option A: Regenerate On Detail Modal Open

Pros:

- Fresh URL when the user inspects a single observation.
- Keeps refresh tied to user intent.
- Fits detail-focused image viewing.

Cons:

- Needs a repository refresh path or row re-fetch.
- Does not refresh images in already-open views.

Implementation difficulty:

- Medium.

### Option B: Retry On Image Load Error

Pros:

- Handles actual expiration only when needed.
- Good UX for long-lived pages.
- Can remain behind repository/helper boundaries if implemented carefully.

Cons:

- UI needs a non-Supabase callback boundary.
- Must avoid retry loops.

Implementation difficulty:

- Medium.

### Option C: Repository Refresh Action

Pros:

- Clean architecture if exposed as a repository method.
- UI can request refreshed display data without knowing Supabase details.

Cons:

- Adds repository API surface.
- Needs consistent behavior in mock and Supabase modes.

Implementation difficulty:

- Medium.

### Option D: User Refresh Guidance

Pros:

- No code change.
- Acceptable for MVP if image viewing is short-lived.

Cons:

- Weak UX.
- Does not help admin review if a queue stays open.

Implementation difficulty:

- Low.

### Recommended Signed URL UX

MVP recommendation:

- Keep current 10-minute signed URLs.
- For 18C, prefer image load error retry through a repository/helper refresh path.
- Consider detail-modal-open refresh if the implementation can stay provider-neutral and avoid UI-level Supabase calls.
- Until 18C, document that page refresh or reopening the detail view generates fresh display data.

## Monitoring Cadence

### Weekly Checks

Run weekly while anonymous upload remains enabled:

- pending observation count
- oldest pending observation age
- rejected observation count with images
- recent upload object count
- recent upload total bytes
- public visibility spot check for pending/rejected rows
- failed upload reports from users/admins

### Monthly Checks

Run monthly while volume is low:

- orphan candidate count
- rejected image candidates older than retention window
- bucket total object count
- bucket total stored bytes
- Storage objects with unsupported or missing metadata
- approved image rows with missing objects
- URL-like values in `image_url`
- signed URL expiry UX complaints

### Spike Triggers

Escalate if any of these occur:

- sudden daily object count increase
- sudden daily Storage byte increase
- pending queue older than the agreed review window
- repeated upload failures
- repeated signed URL expiration reports
- repeated rejected observations from the same pattern of submissions

## Manual Runbook

### Safe Dashboard Review

1. Open Supabase Dashboard.
2. Confirm the target project before inspecting data.
3. Open Storage bucket `observation-images`.
4. Review object paths, sizes, MIME metadata, and created time.
5. Do not delete objects during inspection.
6. Open SQL Editor for read-only queries.
7. Compare Storage object paths with `public.observations.image_path`.
8. Mark candidates for review before any deletion.
9. Export or record candidate paths and matching row ids.
10. Get explicit approval before destructive cleanup.

### Backup And Review Principles

- Prefer export/listing before deletion.
- Never delete by `pending/` prefix alone.
- Never delete objects referenced by approved rows unless intentionally removing approved media.
- Do not delete pending-row images during active moderation.
- Follow the rejected retention window before deleting rejected-row images.
- Do not use a service role key in frontend code.
- Do not store cleanup credentials in `.env.example`.

### Matching Object Paths To Rows

Use this relationship:

```text
storage.objects.name = public.observations.image_path
```

Bucket name:

```text
storage.objects.bucket_id = 'observation-images'
```

Because approved images currently keep their original `pending/` object path, moderation status must be read from `public.observations.status`, not inferred from the Storage path prefix.

### Destructive Actions

This runbook does not execute deletion.

If deletion is later approved:

- review candidates manually first
- export the candidate list
- confirm the bucket and project
- delete through a separate approved maintenance procedure
- log what was deleted and why

Do not paste destructive SQL from this document. This document intentionally does not provide active delete SQL.

## SQL Query Drafts

These queries are read-only drafts for Supabase SQL Editor. They do not weaken RLS and do not change public visibility. SQL Editor privileges may see more data than the public app, so treat results as operator-only diagnostics.

### Image Row Inventory

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

### URL-Like Legacy Image Values

Expected result for new Storage uploads is zero rows.

```sql
select
  id,
  status,
  image_url,
  image_path,
  created_at
from public.observations
where image_url ~* '^(https?:|blob:|data:)'
order by created_at desc;
```

### Pending Queue Age

```sql
select
  count(*) as pending_count,
  min(created_at) as oldest_pending_created_at,
  max(created_at) as newest_pending_created_at
from public.observations
where status = 'pending';
```

### Rejected Images Older Than 30 Days

This query only lists candidates. It does not delete anything.

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
  and updated_at < now() - interval '30 days'
order by updated_at asc;
```

### Bucket Object Inventory

```sql
select
  name,
  created_at,
  updated_at,
  metadata ->> 'mimetype' as mime_type,
  (metadata ->> 'size')::bigint as size_bytes
from storage.objects
where bucket_id = 'observation-images'
order by created_at desc
limit 200;
```

### Bucket Count And Size

```sql
select
  count(*) as object_count,
  coalesce(sum((metadata ->> 'size')::bigint), 0) as total_size_bytes
from storage.objects
where bucket_id = 'observation-images';
```

### Daily Upload Volume

```sql
select
  date_trunc('day', created_at) as upload_day,
  count(*) as object_count,
  coalesce(sum((metadata ->> 'size')::bigint), 0) as total_size_bytes
from storage.objects
where bucket_id = 'observation-images'
group by date_trunc('day', created_at)
order by upload_day desc
limit 30;
```

### Orphan Candidates

This query lists Storage objects that are not referenced by any observation row. Review manually before deletion.

```sql
with storage_paths as (
  select
    name,
    created_at,
    updated_at,
    metadata ->> 'mimetype' as mime_type,
    (metadata ->> 'size')::bigint as size_bytes
  from storage.objects
  where bucket_id = 'observation-images'
),
db_paths as (
  select image_path
  from public.observations
  where image_path is not null
)
select
  storage_paths.name,
  storage_paths.created_at,
  storage_paths.updated_at,
  storage_paths.mime_type,
  storage_paths.size_bytes
from storage_paths
left join db_paths
  on db_paths.image_path = storage_paths.name
where db_paths.image_path is null
order by storage_paths.created_at asc;
```

### Stale Orphan Candidates Under Pending Prefix

Prefix and age do not prove orphan status. This query still cross-checks DB references.

```sql
with storage_paths as (
  select
    name,
    created_at,
    metadata ->> 'mimetype' as mime_type,
    (metadata ->> 'size')::bigint as size_bytes
  from storage.objects
  where bucket_id = 'observation-images'
    and name like 'pending/%'
    and created_at < now() - interval '7 days'
),
db_paths as (
  select image_path
  from public.observations
  where image_path is not null
)
select
  storage_paths.name,
  storage_paths.created_at,
  storage_paths.mime_type,
  storage_paths.size_bytes
from storage_paths
left join db_paths
  on db_paths.image_path = storage_paths.name
where db_paths.image_path is null
order by storage_paths.created_at asc;
```

### Public Visibility State Check

This checks table state only. App-level public reads must still be tested through the anon client or app repository.

```sql
select
  status,
  count(*) as row_count,
  count(*) filter (where image_path is not null) as image_row_count
from public.observations
group by status
order by status;
```

## Recommended 18A Direction

MVP operations recommendation:

- Retain rejected images for 30 days, then run manual cleanup after review.
- Run orphan candidate checks monthly while upload volume is low.
- Run pending queue and bucket usage checks weekly.
- Keep anonymous upload for the current public-report UX, but monitor object count, total size, and queue age.
- If abuse appears, evaluate CAPTCHA, rate limit, or authenticated-only image upload as a separate approved phase.
- Keep 10-minute signed URLs for now.
- Use 18C to consider image-load-error retry or detail-modal-open refresh without exposing Supabase calls to UI components.
- Do not change RLS, Storage policies, or public visibility rules in 18A.

## 18B And Later Plan

### 18B: Read-Only Cleanup And Monitoring SQL

Completed as:

```text
docs/architecture/supabase-storage-monitoring-checklist.md
```

Scope:

- refine read-only SQL into an operator checklist
- define weekly/monthly thresholds
- document how to export candidate lists
- avoid destructive SQL
- avoid app code changes unless separately approved

### 18C: Signed URL Refresh UX Improvement

Completed direction:

- Chose Option B for the MVP: refresh the selected public observation through the active repository when the detail modal opens.
- `App.tsx` now opens the detail immediately with the selected observation and then calls `activeObservationRepository.getObservationById(id)` to receive a freshly mapped display observation.
- In Supabase mode, `getObservationById()` still reads only approved rows and resolves `image_path` to a new runtime signed URL through repository/helper code.
- In mock mode, `getObservationById()` returns the existing sample observation and preserves the current display behavior.
- UI components still do not call Supabase directly.
- Signed URLs remain display-only values and are not written to `public.observations`.
- `image_path`, `image_mime_type`, and `image_size_bytes` remain the only new Storage fields stored by create flow.

Deferred:

- Image load error retry remains a later candidate because it needs a UI-to-repository refresh callback and retry-loop safeguards.
- Admin review still supports signed URL refresh through the existing pending-list `Refresh` action; automatic image-load retry for admin review remains a later candidate.

Scope:

- choose a refresh strategy for long-lived pages
- keep Supabase calls behind repository/helper code
- avoid storing signed URLs in DB
- preserve mock mode and public approved-only reads

### 18D: Abuse Mitigation Decision

Completed as:

```text
docs/architecture/anonymous-upload-abuse-mitigation-decision.md
```

Decision:

- keep anonymous upload for now
- use a monitoring-first hybrid strategy
- connect action triggers to explicit daily upload, pending queue, near-limit image, orphan candidate, and bucket growth thresholds
- defer CAPTCHA, rate limit, Edge Function gates, and authenticated contributor mode to later approved phases
- keep public approved-only reads, pending public creates, private Storage, insert-only/no-upsert upload, and no signed URL DB persistence unchanged

### 18E: Optional Automated Cleanup Design

Expected scope:

- design scheduled cleanup or admin cleanup tooling
- include dry-run mode, audit logs, and rollback expectations
- keep service-role credentials out of frontend code
- do not implement without separate approval

## Explicit Non-Scope

- No real Storage delete.
- No Edge Function implementation.
- No CAPTCHA implementation.
- No rate-limit implementation.
- No admin cleanup UI.
- No policy or RLS change.
- No package addition.
- No app code change.
- No Kakao Map change.
- No weakening public approved-only reads.
- No public exposure of pending or rejected observations.
- No signed, public, blob, preview, or data URL persistence in the database.
