# Anonymous Upload Abuse Mitigation Decision

## Purpose And Scope

This document records the phase 18D decision for anonymous upload abuse mitigation.

18D is decision and design only:

- compare abuse mitigation options for the existing public upload flow
- decide an MVP operating direction
- connect thresholds to the phase 18B monitoring checklist
- define escalation rules before heavier controls are implemented
- hand off implementation candidates to later phases

18D does not:

- implement CAPTCHA
- implement rate limiting
- implement Edge Functions
- switch upload to authenticated-only
- apply SQL, Storage policy, RLS, or grant changes
- change app code
- change package files
- delete Storage objects
- change Kakao Map, Auth, admin, or public visibility behavior

## Current Anonymous Upload Structure

The current public reporting flow keeps no-login submissions available:

- Public upload creates a `pending` observation.
- Public reads expose only `approved` observations.
- `pending` and `rejected` observations are not shown in public list or public detail.
- Selected images upload to the private `observation-images` bucket before the pending row insert.
- Storage upload is insert-only and app code uses `upsert: false`.
- Object paths follow `pending/{client_generated_id}/{random_id}.{ext}`.
- The DB stores only:
  - `image_path`
  - `image_mime_type`
  - `image_size_bytes`
- The DB must not store signed, public, blob, preview, or data URLs.
- Runtime signed URLs are generated only for display.
- Admin review approves or rejects pending rows.

Current mitigations:

- private bucket
- insert-only upload policy
- no upsert
- random constrained object paths
- 5 MB file size limit
- MIME restrictions to `image/jpeg`, `image/png`, and `image/webp`
- approved-only public reads
- pending/rejected public non-exposure
- signed URLs are not stored in DB rows
- admin moderation before public visibility

These controls protect public visibility and overwrite risk. They do not stop repeated anonymous submissions from consuming Storage capacity or admin review time.

## Abuse Scenarios

Likely abuse or operational stress scenarios:

- High-volume pending row creation.
- High-volume image object creation.
- Repeated near-5 MB image uploads.
- Orphan object growth from upload success followed by DB insert failure.
- False observations or spam text.
- Admin review queue growth.
- Storage quota or cost increase.
- Attempts to manipulate local filenames or object paths.
- Repeated manual smoke/test rows left behind after verification.
- Public exposure stays blocked, but private operational burden increases.

Important boundary:

- Abuse mitigation must not make public reads include `pending` or `rejected` rows.
- Abuse mitigation must not let public inserts create `approved` observations.
- Abuse mitigation must not store display URLs in database rows.

## Option Comparison

### Option A: Monitoring-Only

Summary:

- Keep the current anonymous upload flow.
- Use the phase 18B checklist for weekly/monthly review.
- Escalate only when thresholds are exceeded.

Security effect:

- Low preventive effect.
- Good detection if operators run checks consistently.

UX impact:

- Lowest friction.
- Preserves public biodiversity reporting.

Implementation difficulty:

- Low.
- Documentation and operator discipline only.

Operational burden:

- Medium.
- Requires weekly/monthly monitoring and follow-up ownership.

Cost and quota impact:

- Risk remains until a spike is detected.

Privacy and accessibility:

- No new third-party challenge or login requirement.
- No added accessibility friction.

Architecture fit:

- Strong fit with the current frontend-plus-Supabase MVP.
- No new backend surface.

Follow-up phase:

- 18B monitoring continues.
- 18E cleanup automation can be designed later.
- 18F CAPTCHA/rate-limit can be started only if needed.

### Option B: CAPTCHA

Summary:

- Add a challenge before public upload submit.
- Keep no-login public reporting but block basic automated abuse.

Security effect:

- Medium against commodity bots.
- Weak against manual spam or CAPTCHA-solving services.

UX impact:

- Adds submit friction.
- Can reduce reports from legitimate users.
- May affect accessibility depending on provider.

Implementation difficulty:

- Medium.
- Requires provider choice, key management, frontend integration, and likely backend verification for strong enforcement.

Operational burden:

- Medium.
- Requires provider monitoring, domain settings, and accessibility fallback decisions.

Cost and quota impact:

- Can reduce automated Storage growth.
- May add external service limits or costs.

Privacy and accessibility:

- Potential third-party tracking and accessibility impact.
- Needs provider-specific privacy review.

Architecture fit:

- Partial fit.
- Frontend-only CAPTCHA is weaker; robust verification likely needs an Edge Function or server-side gate.

Follow-up phase:

- 18F if monitoring shows abuse or launch risk justifies the friction.

### Option C: Rate Limit

Summary:

- Limit upload frequency by IP, user, session, or another server-observed signal.

Security effect:

- Medium to high if enforced server-side.
- Low if implemented only in client state.

UX impact:

- Low for normal users if thresholds are generous.
- Can block legitimate shared-network users during spikes.

Implementation difficulty:

- Medium to high.
- Requires Edge Function, server API, or proxy-level gate for meaningful enforcement.

Operational burden:

- Medium.
- Needs threshold tuning, logs, and false-positive review.

Cost and quota impact:

- Stronger control over Storage growth than monitoring-only.

Privacy and accessibility:

- IP/session tracking can raise privacy considerations.
- Usually less accessibility friction than CAPTCHA.

Architecture fit:

- Not a clean fit with the current direct Supabase Storage upload model.
- Strong enforcement likely requires changing the upload path.

Follow-up phase:

- 18F implementation design if thresholds are exceeded or public launch requires preventive controls.

### Option D: Authenticated-Only Upload

Summary:

- Require users to sign in before uploading images.
- Optionally keep text-only public reports open.

Security effect:

- Medium.
- Improves attribution and discourages casual abuse.

UX impact:

- High.
- Adds a participation barrier to public biodiversity reports.

Implementation difficulty:

- Medium.
- Requires product flow, auth UI decisions, policy/grant changes, and contributor-role handling.

Operational burden:

- Medium.
- Needs account support and abuse handling for registered users.

Cost and quota impact:

- Likely reduces anonymous Storage growth.
- Does not stop abuse from created accounts.

Privacy and accessibility:

- Requires user account data.
- Changes the privacy profile of public reporting.

Architecture fit:

- Possible because Supabase Auth already exists for admin, but contributor auth is a separate product surface.
- Should not be treated as a small Storage policy tweak.

Follow-up phase:

- 18G authenticated contributor mode design if no-login public image reporting becomes unacceptable.

### Option E: Hybrid Approach

Summary:

- Keep monitoring-only as the default MVP behavior.
- Define operating thresholds.
- Escalate to CAPTCHA or rate limit only when abuse is observed or launch risk requires it.
- Consider authenticated contributor mode as a later product decision.

Security effect:

- Better than unstructured monitoring because it defines action thresholds.
- Preventive controls remain deferred until justified.

UX impact:

- Preserves no-login reporting today.
- Allows targeted friction later.

Implementation difficulty:

- Low for 18D.
- Later controls remain scoped to separate approved phases.

Operational burden:

- Medium.
- Requires monitoring cadence and escalation discipline.

Cost and quota impact:

- Accepts some risk while volume is low.
- Provides clear triggers before cost grows unchecked.

Privacy and accessibility:

- Avoids immediate third-party challenge or account requirement.
- Keeps later privacy/accessibility review explicit.

Architecture fit:

- Strongest fit for the current MVP.
- Keeps direct Supabase Storage upload unchanged until data shows a need.

Follow-up phase:

- 18E cleanup automation design if cleanup workload grows.
- 18F CAPTCHA/rate-limit design if thresholds are exceeded.
- 18G authenticated contributor mode design if the product chooses account-based contribution.

## MVP Recommendation

Recommended direction: Option E, hybrid monitoring-first.

For the current MVP:

- Keep anonymous public upload enabled.
- Keep the private bucket, insert-only policy, no-upsert upload, 5 MB limit, MIME restrictions, approved-only public read, and admin review queue.
- Use the 18B monitoring checklist as the operational source of truth.
- Add explicit thresholds and escalation steps so monitoring is actionable.
- Do not add CAPTCHA, rate limit, Edge Function gates, or authenticated-only upload until thresholds are exceeded or public-launch risk changes.

Rationale:

- The app is a campus biodiversity reporting tool, so public participation matters.
- Current controls already prevent public exposure of pending/rejected submissions.
- The main remaining risk is operational cost and review load, not public data leakage.
- Heavy controls would add UX and accessibility friction before abuse is demonstrated.
- Later mitigations need product, privacy, and architecture review.

This recommendation does not weaken any Storage, RLS, or public visibility rule.

## Threshold Proposal

These thresholds are draft operating values and need project-owner approval.

### Daily Upload Count

- Watch: more than 25 Storage objects in one day.
- Escalate: more than 50 Storage objects in one day.
- Action:
  - run the 18B recent upload volume check
  - review pending rows for spam pattern
  - decide whether to start 18F CAPTCHA/rate-limit design

### Daily Pending Count

- Watch: more than 10 new pending rows in one day.
- Escalate: more than 25 new pending rows in one day.
- Action:
  - review admin queue
  - sample recent submissions
  - consider temporary upload guidance text in a later approved UI phase

### Near-5 MB Upload Count

- Watch: any image at or above 4.5 MB.
- Escalate: more than 10 near-limit images in one week.
- Action:
  - inspect whether files are legitimate mobile photos
  - consider client-side resize/compression as a later product phase
  - consider rate-limit design if repeated by suspicious pattern

### Orphan Candidate Count

- Watch: more than 5 orphan candidates in a monthly review.
- Escalate: more than 20 orphan candidates or unexpected growth over two reviews.
- Action:
  - export candidate list
  - do not delete in the monitoring step
  - start 18E cleanup automation or manual cleanup approval

### Old Pending Queue Age

- Watch: any pending row older than 7 days.
- Escalate: any pending row older than 14 days.
- Action:
  - prioritize admin review
  - check whether review capacity is adequate
  - consider abuse controls only if old queue is caused by spam volume

### Repeated Smoke/Test Pattern Cleanup

- Watch: more than 3 obvious smoke/test rows or objects in a monthly review.
- Escalate: smoke/test rows or objects are repeatedly left after verification.
- Action:
  - document cleanup candidates
  - request explicit cleanup approval
  - improve future smoke-test teardown checklist

### Bucket Size Growth

- Watch: unexpected week-over-week growth.
- Escalate: daily upload bytes exceed 150 MB or bucket usage approaches the plan quota.
- Action:
  - compare upload volume, pending count, and orphan candidates
  - decide whether 18F is needed before further public testing

## Escalation Workflow

Use this workflow when a threshold is exceeded:

1. Confirm the target Supabase project and environment.
2. Run only read-only checks from the 18B monitoring checklist.
3. Record counts, dates, and candidate paths without printing credentials or `.env.local`.
4. Inspect the admin review queue for obvious spam patterns.
5. Export suspicious row/object candidates if needed, treating exports as operator data.
6. Check Storage object count and total size.
7. Confirm public reads still expose only approved observations.
8. Confirm `image_url` does not contain signed, public, blob, preview, or data URLs.
9. Decide whether the issue is:
   - review backlog
   - orphan cleanup need
   - anonymous upload abuse
   - ordinary traffic growth
10. If abuse is likely, open a follow-up phase:
   - 18F for CAPTCHA/rate-limit design
   - 18G for authenticated contributor mode design
   - 18E for cleanup automation design
11. Get separate approval before any policy, RLS, grant, Edge Function, package, UI, or cleanup change.

Possible temporary responses, each requiring separate approval:

- strengthen upload instructions or acceptable-use copy
- pause image upload while leaving text-only reports available
- start CAPTCHA/rate-limit implementation design
- move image upload to authenticated contributors
- run manual cleanup using the approved cleanup runbook

## Follow-Up Plan

### 18E: Optional Cleanup Automation Design

Use when orphan or rejected cleanup workload is high enough to justify automation.

Expected scope:

- dry-run candidate reporting
- separate approval before deletion
- service-role isolation outside frontend code
- audit trail expectations
- rollback and recovery notes

18E result:

- documented in `docs/architecture/supabase-storage-cleanup-automation-design.md`
- recommends semi-manual candidate export/review for the MVP
- keeps automatic delete deferred
- connects orphan and cleanup thresholds to manual review before any destructive action

### 18F: CAPTCHA Or Rate-Limit Implementation Design

Use only if monitoring thresholds are exceeded or public launch requires preventive controls.

Expected scope:

- choose CAPTCHA provider or rate-limit architecture
- decide whether an Edge Function/server gate is required
- evaluate accessibility and privacy impact
- avoid frontend-only enforcement for high-risk controls

### 18G: Authenticated Contributor Mode Design

Use only if the project decides no-login image upload is no longer acceptable.

Expected scope:

- contributor auth UX
- public text-only reporting decision
- role model and policy changes
- support and privacy expectations

### 19A: Next Product Feature

If no abuse is observed and cleanup remains manageable, continue to the next product feature instead of adding friction.

## Explicit Non-Scope

- No CAPTCHA implementation.
- No rate-limit implementation.
- No Edge Function implementation.
- No authenticated upload conversion.
- No package addition.
- No SQL, grant, policy, or RLS change.
- No app code change.
- No Storage object deletion.
- No cleanup automation.
- No Kakao Map change.
- No Auth/Admin UI change.
- No public exposure of pending or rejected observations.
- No signed, public, blob, preview, or data URL persistence in the database.

## Decision Summary

18D chooses a monitoring-first hybrid approach:

- Keep anonymous image upload for now.
- Use 18B monitoring thresholds as the trigger point.
- Escalate to CAPTCHA/rate-limit only after observed abuse or a public-launch risk decision.
- Treat authenticated contributor mode as a product decision, not a Storage-only hardening tweak.
- Keep all existing visibility and Storage invariants unchanged.
