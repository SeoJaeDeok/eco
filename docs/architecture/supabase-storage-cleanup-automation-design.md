# Supabase Storage Cleanup Automation Design

## Purpose And Scope

This document records the phase 18E design for rejected/orphan Supabase Storage cleanup automation.

18E is design-only:

- decide whether cleanup automation is needed now
- compare cleanup automation options
- define candidate types and safety guards
- document dry-run report expectations
- document implementation preconditions for a later approved phase

18E does not:

- delete Storage objects
- implement an Edge Function
- implement an admin cleanup UI
- apply SQL, Storage policy, RLS, or grant changes
- change app code
- change package files
- add secrets
- change Kakao Map, Auth, admin, Storage upload, or public visibility behavior

Actual cleanup or automation must be approved as a separate phase after this design.

## Current Cleanup-Related State

Current Storage flow:

- Bucket: private `observation-images`
- Object path format: `pending/{client_generated_id}/{random_id}.{ext}`
- DB matching key: `public.observations.image_path`
- Storage matching key: `storage.objects.name`
- Public create produces `pending` observations.
- Public read exposes only `approved` observations.
- `pending` and `rejected` rows are not exposed publicly.
- DB rows store only `image_path`, `image_mime_type`, and `image_size_bytes`.
- Signed, public, blob, preview, and data URLs are not stored in DB rows.

Existing operations references:

- 18A runbook: `docs/architecture/supabase-storage-operations-hardening.md`
- 18B monitoring checklist: `docs/architecture/supabase-storage-monitoring-checklist.md`
- 18D abuse decision: `docs/architecture/anonymous-upload-abuse-mitigation-decision.md`

Current cleanup posture:

- Rejected image cleanup is a manual operations TODO.
- Orphan object cleanup is a manual operations TODO.
- Draft rejected-image retention is 30 days after rejection.
- Draft orphan review cadence is monthly while volume is low.
- 18D recommends monitoring-first abuse mitigation while volume is low.

## Cleanup Target Definitions

### Rejected Retention Candidates

Rejected retention candidates are rows where:

- `status = 'rejected'`
- `image_path` is present
- the rejected row is older than the approved retention window
- the image is still referenced by the rejected row

These are not orphan objects. They are retained private moderation artifacts until the retention policy allows cleanup.

### Orphan Object Candidates

Orphan candidates are Storage objects where:

- the object is in bucket `observation-images`
- the object path is not referenced by any `public.observations.image_path`
- the object is not intentionally retained by an approved process

Likely causes:

- upload succeeded but DB insert failed
- user closed the browser during submit
- network failure after upload
- validation or DB constraint mismatch
- duplicate submit left an unused object
- manual smoke test created leftover objects

### Failed Upload Leftovers

Failed upload leftovers are a subset of orphan candidates, usually under `pending/`, where the object exists but no row was created.

### Manual Smoke Or Test Objects

Smoke/test candidates are rows or objects matching known manual verification patterns. These require human review because the path itself is random and the project should not rely on naming alone.

### Unexpected Path Prefix Objects

Unexpected path candidates are objects or DB `image_path` values that do not match the approved path patterns:

- `pending/{uuid}/{uuid}.{jpg|jpeg|png|webp}`
- future compatible `observations/{uuid}/{uuid}.{jpg|jpeg|png|webp}`

Unexpected paths are investigation targets, not automatic delete targets.

### Near-5 MB Suspicious Objects

Near-limit objects are images near the 5 MB limit. They may be legitimate mobile photos or abuse indicators. Size alone must not authorize deletion.

### Explicit Non-Targets

Do not treat these as cleanup targets:

- approved observations
- recent pending observations
- rows currently in admin review
- objects referenced by a valid `public.observations.image_path`
- rejected images that are still inside the approved retention window
- any object where DB/storage matching is unclear

## Automation Option Comparison

### Option A: Manual-Only

Summary:

- Continue using the 18A runbook and 18B checklist.
- Operators inspect candidates and delete manually in Supabase Dashboard only after approval.

Safety:

- High, because every delete is human reviewed.

Implementation difficulty:

- Low.

Operational burden:

- Medium to high if volume grows.

Mistaken delete risk:

- Lower than automated delete, but still possible through operator error.

Service role need:

- None for the frontend.
- Dashboard operator permissions may still be needed.

Auditability:

- Depends on manual records and exports.

Rollback:

- Limited after delete. Prevention is the main safeguard.

MVP fit:

- Good while volume is low.

### Option B: Semi-Manual Export And Review

Summary:

- Use read-only checks to export cleanup candidates.
- A human reviews exported rows/objects.
- Approved deletion still happens manually in Supabase Dashboard or a later approved maintenance step.

Safety:

- High.
- Separates detection from deletion.

Implementation difficulty:

- Low.
- Requires documentation and consistent report format, not app code.

Operational burden:

- Medium.
- Less ad hoc than manual-only because candidate reports are standardized.

Mistaken delete risk:

- Low if exports include row status, object path, age, size, and reason.

Service role need:

- None for this phase.
- No service role in frontend.

Auditability:

- Better than manual-only because candidate reports can be retained.

Rollback:

- Still limited after delete, but pre-delete reports improve review and recovery planning.

MVP fit:

- Best current fit.

### Option C: Scheduled Edge Function Dry-Run Only

Summary:

- A scheduled backend task produces candidate reports.
- It does not delete anything.

Safety:

- High, if it is truly dry-run only.

Implementation difficulty:

- Medium.
- Requires Edge Function deployment, schedule, logs, and server-side secrets.

Operational burden:

- Medium.
- Reduces manual query cadence but adds function monitoring.

Mistaken delete risk:

- Low because there is no delete.
- Candidate false positives can still mislead operators.

Service role need:

- Likely needed server-side to list Storage objects and join operator data.
- Must never be exposed to frontend or `VITE_*`.

Auditability:

- Good if reports are stored or exported.

Rollback:

- Not relevant for delete because it does not delete.
- Function deployment can be disabled.

MVP fit:

- Good later if manual reporting becomes repetitive.

### Option D: Scheduled Edge Function Delete With Guards

Summary:

- A scheduled backend task deletes candidates that pass retention, status, path, and allowlist guards.

Safety:

- Medium to low until thoroughly proven.
- Delete is irreversible for normal operations.

Implementation difficulty:

- High.
- Requires service role isolation, dry-run mode, guard tests, max delete limits, audit logs, and alerting.

Operational burden:

- Lower routine burden after setup, higher engineering/ops burden.

Mistaken delete risk:

- Highest of the options.
- A bug can remove valid approved or review-needed images.

Service role need:

- Yes, server-side only.
- Must not be in frontend or `.env.example`.

Auditability:

- Required, not optional.
- Every delete must produce an immutable report.

Rollback:

- Poor unless backups/exported candidates are available.
- Deleted Storage objects may not be recoverable.

MVP fit:

- Not recommended now.

### Option E: Admin Cleanup UI

Summary:

- Admin users review candidates in a UI and approve deletion.

Safety:

- Medium to high if the UI is conservative and server-side deletion is well isolated.

Implementation difficulty:

- High.
- Requires UI, authorization, backend deletion path, audit logging, and service role isolation.

Operational burden:

- Lower for reviewers once implemented.
- Higher engineering maintenance.

Mistaken delete risk:

- Medium.
- UI mistakes, stale candidate data, or weak confirmation flows can cause data loss.

Service role need:

- Likely yes server-side.
- Never frontend.

Auditability:

- Can be strong if designed with explicit approval records.

Rollback:

- Limited after delete.
- UI should emphasize export and review before deletion.

MVP fit:

- Not recommended now.

## MVP Recommendation

Recommended direction: Option B, semi-manual export and review, with Option C as the next automation candidate only if manual review becomes repetitive.

For the current MVP:

- Keep manual cleanup procedures from 18A.
- Use 18B read-only checks to generate candidate lists.
- Standardize export/review records before any deletion.
- Do not add automatic delete.
- Do not implement Edge Functions yet.
- Do not add admin cleanup UI yet.

Rationale:

- Storage delete is hard to reverse.
- Rejected rows may still be needed for moderation recovery or review context.
- Approved images can still use `pending/` paths, so prefix-only cleanup is unsafe.
- Service role and Edge Function boundaries add significant operational surface.
- 18D chose monitoring-first mitigation because abuse has not been observed.
- Current volume does not justify automatic deletion without stronger evidence.

Option C can be reconsidered when:

- monthly orphan candidate checks become repetitive
- candidate counts exceed 18D thresholds
- operators need scheduled reports
- service role handling and report storage are approved

Option D should wait until dry-run reports are trusted over several review cycles.

## Safety Guards

Any future cleanup automation must include these guards before deletion is considered.

### Retention Age Guard

- Rejected images must be older than the approved retention period.
- Draft value: 30 days after rejection.
- Escalation value from 18B: rejected candidates older than 45 days.

### Status Guard

- Never delete objects referenced by `approved` rows.
- Never delete objects referenced by recent `pending` rows.
- Never delete objects referenced by rows still under admin review.
- Rejected rows require retention approval before cleanup.

### DB Match Guard

- Match objects by `storage.objects.name = public.observations.image_path`.
- A referenced object is not an orphan.
- A missing DB match makes an object a candidate, not an automatic delete.

### Path Prefix Guard

- Expected current path prefix is `pending/`.
- Approved rows may still reference `pending/` paths.
- Prefix must be used only as a candidate signal.

### Dry-Run First

- Any automated workflow must run in dry-run mode first.
- Dry-run reports must be reviewed before enabling delete.
- Dry-run and delete modes must be clearly separated.

### Max Delete Per Run

- Future delete mode must cap the number of objects deleted per run.
- The first cap should be very small.
- Exceeding the cap should stop the run and require human review.

### Manual Approval Step

- Candidate export must be reviewed before deletion.
- Delete approval should identify reviewer, date, environment, and candidate batch.

### Export Before Delete

- Export candidate paths, linked row ids, status, size, age, and reason before cleanup.
- Treat exports as operational data.

### Audit Report

- Every dry-run or future delete run should produce a report.
- Reports should include environment, bucket, candidate type, reason, and action taken.

### Rollback Limitations

- Storage deletion may not be reversible.
- Rollback should be treated as prevention through review, not recovery after delete.

## Required Permissions And Secrets

Manual Option B:

- No frontend service role key.
- No new `.env.example` values.
- No app secrets added.
- Operators use Supabase Dashboard and read-only monitoring outputs.

Future Edge Function options:

- May require a server-side service role key to list and delete private bucket objects.
- The service role key must never be placed in frontend code.
- The service role key must never be placed in `VITE_*`.
- The service role key must not be added to `.env.example`.
- Secrets must be stored in the server-side Supabase/Edge Function secret store.
- Function logs must not print secrets, object signed URLs, user emails, tokens, or full credentials.

18E adds no secrets and does not change secret storage.

## Candidate Detection Approach

### Read-Only SQL Role

18B read-only SQL is used to identify:

- rejected retention candidates
- orphan candidates
- unexpected path patterns
- near-limit image sizes
- suspicious legacy `image_url` values
- approved image rows with missing Storage objects
- manual smoke/test row candidates

The SQL output is a candidate list only. It does not authorize deletion.

### Storage Listing Role

Supabase Dashboard Storage listing or operator-level `storage.objects` visibility is needed to inspect:

- object path
- bucket id
- size
- created time
- MIME metadata
- whether the object exists outside DB references

### DB/Object Matching

The matching rule is:

```text
storage.objects.bucket_id = observation-images
storage.objects.name = public.observations.image_path
```

If an object path appears in a DB row, the row status controls cleanup eligibility.

If an object path does not appear in any DB row, it is an orphan candidate and still requires review.

### Rejected Retention Candidates

Detection signals:

- row status is `rejected`
- row has `image_path`
- `updated_at` is older than the approved retention window

Delete eligibility requires manual approval.

### Orphan Candidates

Detection signals:

- object exists in `observation-images`
- object name is not referenced by any observation row
- object age is older than a short grace period

Delete eligibility requires manual approval.

### Smoke/Test Candidates

Detection signals:

- row name, location, or description matches known smoke/test patterns
- object was created during a known manual verification window

These are weak signals and must be reviewed manually.

### Unexpected Path Candidates

Detection signals:

- `image_path` or object path does not match approved path patterns
- object is outside expected image extensions
- metadata does not match DB metadata

Unexpected paths should trigger investigation before cleanup.

### Limitations And False Positives

- SQL Editor may show rows that the public app cannot read.
- Storage Dashboard listing may require elevated operator access.
- `pending/` prefix does not mean the observation is pending.
- Approved rows can reference `pending/` paths.
- Object age does not prove cleanup eligibility.
- Near-limit size does not prove abuse.
- Missing object metadata may reflect dashboard/API metadata differences.

## Dry-Run Report Format

Use this structure for Option B exports and any future Option C dry-run output:

```text
generated_at:
environment:
bucket:
report_mode: manual-export | scheduled-dry-run

candidate_type:
object_path:
linked_observation_id:
observation_status:
observation_updated_at:
object_created_at:
age:
size_bytes:
mime_type:
path_matches_expected_pattern:
db_match_found:
reason:
recommended_action: keep | review | cleanup-approval-request | ignore

reviewed_by:
reviewed_at:
approved_for_delete: no
approval_reference:
notes:

secret_exposure_check:
- .env.local not printed:
- keys/tokens/passwords/emails not included:
- signed URLs not included:
```

Dry-run reports must not contain actual credentials or full signed URLs.

## 18F Or Later Cleanup Implementation Preconditions

Before any cleanup implementation phase starts, confirm:

- cleanup thresholds are approved
- rejected image retention policy is approved
- orphan grace period is approved
- candidate export/review process is approved
- delete approval workflow is approved
- service role handling is approved if an Edge Function is used
- service role is isolated server-side and absent from frontend code
- `.env.example` does not include service role placeholders
- dry-run reports have been tested and reviewed
- max-delete-per-run guard is defined for any future delete mode
- audit report format is approved
- rollback limitations are accepted
- public approved-only visibility is re-tested
- pending/rejected public non-exposure is re-tested
- signed/public/blob/data URL DB non-persistence is re-tested

Phase numbering note:

- 18D already uses 18F as a possible CAPTCHA/rate-limit design phase.
- If cleanup implementation is approved next, confirm the phase label before starting.
- Regardless of phase label, cleanup implementation must satisfy the preconditions above.

## Explicit Non-Scope

- No real Storage delete.
- No Edge Function implementation.
- No scheduled function.
- No admin cleanup UI.
- No SQL, policy, RLS, or grant application.
- No service role key addition.
- No `.env.example` service role placeholder.
- No app code change.
- No package addition.
- No Kakao Map change.
- No Auth/Admin/public visibility change.
- No public exposure of pending or rejected observations.
- No signed, public, blob, preview, or data URL persistence in the database.

## Decision Summary

18E recommends:

- Continue manual cleanup operations while volume is low.
- Add semi-manual candidate export/review as the MVP cleanup process.
- Reconsider scheduled dry-run reporting only after manual reporting becomes repetitive or thresholds are exceeded.
- Defer automatic delete until dry-run reports and review workflows are proven.
- Keep all Storage, RLS, public visibility, app code, package, and secret-handling rules unchanged.
