# Supabase Storage Monitoring Checklist

## Purpose And Scope

This document is the phase 18B read-only monitoring checklist for Supabase Storage observation images.

18B is limited to:

- turning the 18A operations runbook into a repeatable operator checklist
- providing read-only SQL drafts for monitoring
- defining draft thresholds that need operational approval
- documenting how to record results and escalate anomalies

18B does not:

- delete Storage objects
- clean up rows or objects
- apply SQL in Supabase
- change policies or RLS
- change app code
- change package files
- change Kakao Map behavior
- implement Edge Functions, CAPTCHA, rate limits, or admin cleanup UI

Follow-up phases remain separate:

- 18C: signed URL refresh UX design or implementation candidate
- 18D: anonymous upload abuse mitigation decision
- 18E: optional cleanup automation design

## Pre-Run Safety Checklist

Before running any query:

1. Confirm the target Supabase project and environment.
2. Confirm the operator is in the intended project, not production by accident.
3. Run read-only queries only.
4. Do not run destructive SQL.
5. Do not change RLS, Storage policies, bucket settings, or table grants.
6. Do not delete Storage objects during monitoring.
7. Do not print or export `.env.local` contents.
8. Do not print Supabase URL, anon key, token, email, password, or Kakao key.
9. Do not use a frontend service role key.
10. A service role key is not needed for this checklist.
11. Treat exported query results as operational data.
12. Redact personal or sensitive notes before sharing reports outside the operator group.

If a query needs elevated Dashboard/SQL Editor access, record that it is an operator-only diagnostic. It does not prove what the public anon client can read unless separately verified through the app or anon client.

## Current Storage And Observation Invariants

These invariants must remain true:

- Public observation reads expose only `approved` rows.
- Public creates produce only `pending` rows.
- `pending` and `rejected` rows are not visible in public lists or public detail.
- Storage bucket `observation-images` is private.
- Public image uploads use the approved insert-only/no-upsert flow.
- DB rows store only:
  - `image_path`
  - `image_mime_type`
  - `image_size_bytes`
- DB rows must not store signed, public, blob, preview, or data URLs.
- `image_url` remains a legacy compatibility field and must not receive new Storage display URLs.
- Runtime signed URLs are generated only for display.
- Signed URLs are not written back to `public.observations`.
- UI components do not call Supabase Storage directly.

## Weekly Monitoring Checklist

Run weekly while anonymous image upload is enabled.

Record:

- Pending observation count.
- Old pending observation count.
- Oldest pending observation age.
- Rejected observation count.
- Rows with `image_path` but missing `image_mime_type` or `image_size_bytes`.
- Rows with suspicious `image_url` values.
- Public visibility invariant result for pending/rejected rows.
- Approved rows with `image_path`.
- Pending rows with `image_path`.
- Rejected rows with `image_path`.
- Admin review queue age.
- Recent daily Storage object count.
- Recent daily Storage bytes.
- Upload or image display failures reported by users/admins.

Recommended weekly outcome:

- No public exposure of pending/rejected rows.
- No signed/public/blob/data URLs stored in DB rows.
- No image metadata completeness gaps.
- Pending queue age stays below the approved threshold.
- Recent upload volume is explainable.

## Monthly Cleanup Review Checklist

Run monthly while volume remains low.

Review:

- Rejected rows older than the approved retention window.
- Orphan candidates from Storage object paths not referenced by DB rows.
- Bucket object count and total size.
- Daily upload volume for possible anonymous upload spikes.
- Manual smoke/test row candidates.
- Large image candidates near the 5 MB limit.
- Approved image rows whose Storage objects may be missing.
- Storage objects with metadata that does not match DB metadata.

Deletion review principles:

- Monitoring does not authorize deletion.
- Export candidate lists before requesting cleanup approval.
- Never infer cleanup eligibility from the `pending/` prefix alone.
- Never remove objects referenced by approved rows unless approved as media removal.
- Do not remove objects referenced by pending rows during active moderation.
- Rejected image cleanup requires retention approval.
- Actual cleanup belongs to a separately approved manual maintenance step or later automation phase.

## Read-Only SQL Drafts

All SQL in this section is intended for read-only monitoring. Do not add destructive statements to this checklist.

### Public Visibility Invariant Check

This simulates the repository predicate. It does not replace an app or anon-client RLS smoke test.

```sql
with public_repository_result as (
  select
    id,
    status,
    image_path
  from public.observations
  where status = 'approved'
)
select
  count(*) as public_predicate_row_count,
  count(*) filter (where status = 'approved') as approved_rows,
  count(*) filter (where status in ('pending', 'rejected')) as non_public_rows
from public_repository_result;
```

Expected:

- `non_public_rows = 0`

Operator inventory for non-public rows:

```sql
select
  status,
  count(*) as row_count,
  count(*) filter (where image_path is not null) as image_row_count
from public.observations
where status in ('pending', 'rejected')
group by status
order by status;
```

These rows may exist in the table, but they must not appear through public app reads.

### Status Count Summary

```sql
select
  status,
  count(*) as row_count,
  count(*) filter (where image_path is not null) as image_row_count,
  min(created_at) as oldest_created_at,
  max(created_at) as newest_created_at
from public.observations
group by status
order by status;
```

### Pending Queue Age

```sql
select
  count(*) as pending_count,
  count(*) filter (where created_at < now() - interval '7 days') as pending_older_than_7_days,
  count(*) filter (where created_at < now() - interval '14 days') as pending_older_than_14_days,
  min(created_at) as oldest_pending_created_at,
  max(created_at) as newest_pending_created_at
from public.observations
where status = 'pending';
```

Detailed pending queue:

```sql
select
  id,
  name,
  taxon,
  location,
  image_path,
  image_mime_type,
  image_size_bytes,
  created_at,
  now() - created_at as pending_age
from public.observations
where status = 'pending'
order by created_at asc
limit 100;
```

### Rejected Retention Candidates

Draft retention threshold: 30 days. This query only lists candidates for review.

```sql
select
  id,
  name,
  taxon,
  location,
  image_path,
  image_mime_type,
  image_size_bytes,
  created_at,
  updated_at,
  now() - updated_at as rejected_age
from public.observations
where status = 'rejected'
  and image_path is not null
  and updated_at < now() - interval '30 days'
order by updated_at asc
limit 200;
```

Rejected image summary:

```sql
select
  count(*) as rejected_image_count,
  count(*) filter (where updated_at < now() - interval '30 days') as rejected_images_older_than_30_days,
  coalesce(sum(image_size_bytes), 0) as rejected_image_size_bytes
from public.observations
where status = 'rejected'
  and image_path is not null;
```

### Image Metadata Completeness

Expected result: zero rows.

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
  and (
    image_mime_type is null
    or image_size_bytes is null
  )
order by created_at desc;
```

Metadata value summary:

```sql
select
  image_mime_type,
  count(*) as row_count,
  coalesce(sum(image_size_bytes), 0) as total_size_bytes,
  max(image_size_bytes) as max_size_bytes
from public.observations
where image_path is not null
group by image_mime_type
order by row_count desc;
```

### Suspicious Image URL Values

Expected result for new Storage uploads: zero rows.

```sql
select
  id,
  status,
  image_url,
  image_path,
  created_at,
  updated_at
from public.observations
where image_url ~* '^(https?:|blob:|data:)'
order by created_at desc;
```

Legacy non-empty `image_url` inventory:

```sql
select
  id,
  status,
  image_url,
  image_path,
  created_at,
  updated_at
from public.observations
where image_url is not null
  and char_length(trim(image_url)) > 0
order by created_at desc
limit 100;
```

### Approved Images Count

```sql
select
  count(*) as approved_row_count,
  count(*) filter (where image_path is not null) as approved_image_count,
  coalesce(sum(image_size_bytes) filter (where image_path is not null), 0) as approved_image_size_bytes
from public.observations
where status = 'approved';
```

### Pending Images Count

```sql
select
  count(*) as pending_row_count,
  count(*) filter (where image_path is not null) as pending_image_count,
  coalesce(sum(image_size_bytes) filter (where image_path is not null), 0) as pending_image_size_bytes
from public.observations
where status = 'pending';
```

### Rejected Images Count

```sql
select
  count(*) as rejected_row_count,
  count(*) filter (where image_path is not null) as rejected_image_count,
  coalesce(sum(image_size_bytes) filter (where image_path is not null), 0) as rejected_image_size_bytes
from public.observations
where status = 'rejected';
```

### Unexpected Image Path Pattern

Expected result: zero rows.

```sql
select
  id,
  status,
  image_path,
  created_at,
  updated_at
from public.observations
where image_path is not null
  and not (
    image_path ~* '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    or image_path ~* '^observations/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  )
order by created_at desc;
```

### Recent Upload Volume By Day

This query uses `storage.objects` and may require operator access in Supabase SQL Editor.

```sql
select
  date_trunc('day', created_at) as upload_day,
  count(*) as object_count,
  coalesce(sum((metadata ->> 'size')::bigint), 0) as total_size_bytes
from storage.objects
where bucket_id = 'observation-images'
  and created_at >= now() - interval '30 days'
group by date_trunc('day', created_at)
order by upload_day desc;
```

### Large Image Size Candidates Near 5 MB

Draft near-limit threshold: 4.5 MB, or `4718592` bytes.

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
where image_size_bytes >= 4718592
order by image_size_bytes desc, created_at desc;
```

### Bucket Count And Size

This query uses `storage.objects` and may require operator access in Supabase SQL Editor.

```sql
select
  count(*) as object_count,
  coalesce(sum((metadata ->> 'size')::bigint), 0) as total_size_bytes,
  min(created_at) as oldest_object_created_at,
  max(created_at) as newest_object_created_at
from storage.objects
where bucket_id = 'observation-images';
```

### Bucket Object Metadata Mismatch Candidates

This query compares Storage object metadata to DB row metadata where both are visible to the operator.

```sql
select
  observations.id,
  observations.status,
  observations.image_path,
  observations.image_mime_type as db_mime_type,
  storage_objects.metadata ->> 'mimetype' as storage_mime_type,
  observations.image_size_bytes as db_size_bytes,
  (storage_objects.metadata ->> 'size')::bigint as storage_size_bytes,
  observations.created_at as observation_created_at,
  storage_objects.created_at as object_created_at
from public.observations
join storage.objects as storage_objects
  on storage_objects.bucket_id = 'observation-images'
  and storage_objects.name = observations.image_path
where observations.image_path is not null
  and (
    observations.image_mime_type is distinct from storage_objects.metadata ->> 'mimetype'
    or observations.image_size_bytes is distinct from (storage_objects.metadata ->> 'size')::integer
  )
order by observations.created_at desc;
```

### Orphan Candidate Review

This query lists Storage objects not referenced by any observation row. It is a candidate list only.

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
order by storage_paths.created_at asc
limit 200;
```

### Stale Pending-Prefix Orphan Candidates

The `pending/` prefix is not enough to determine cleanup eligibility. Approved rows may still reference `pending/` paths. This query cross-checks DB references.

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
order by storage_paths.created_at asc
limit 200;
```

### Manual Smoke Or Test Row Candidates

Adjust search terms only if the team has known local smoke-test naming conventions. Do not include secrets or credentials in search terms.

```sql
select
  id,
  status,
  name,
  location,
  image_path,
  image_mime_type,
  image_size_bytes,
  created_at,
  updated_at
from public.observations
where name ilike any (array['%smoke%', '%test%', '%manual%', '%테스트%'])
  or location ilike any (array['%smoke%', '%test%', '%manual%', '%테스트%'])
  or coalesce(description, '') ilike any (array['%smoke%', '%test%', '%manual%', '%테스트%'])
order by created_at desc
limit 100;
```

### Approved Image Rows Without Matching Storage Object

This query can find approved images that may fail display because the referenced object is missing.

```sql
with approved_image_rows as (
  select
    id,
    status,
    image_path,
    created_at,
    updated_at
  from public.observations
  where status = 'approved'
    and image_path is not null
),
storage_paths as (
  select name
  from storage.objects
  where bucket_id = 'observation-images'
)
select
  approved_image_rows.id,
  approved_image_rows.image_path,
  approved_image_rows.created_at,
  approved_image_rows.updated_at
from approved_image_rows
left join storage_paths
  on storage_paths.name = approved_image_rows.image_path
where storage_paths.name is null
order by approved_image_rows.created_at desc;
```

## Orphan Candidate Limitations

SQL-only checks have limits:

- Public app queries cannot list private bucket objects.
- `storage.objects` access in SQL Editor may depend on operator privileges.
- Dashboard Storage listing may be needed to review paths, object ages, sizes, and metadata.
- A DB row can reference an object path that no longer exists.
- A Storage object can exist without a DB row reference.
- A `pending/` prefix does not mean the related observation is pending.
- Current approval keeps object paths in place; approved rows can still reference `pending/...` paths.

Use this matching rule:

```text
storage.objects.name = public.observations.image_path
```

Use this bucket rule:

```text
storage.objects.bucket_id = observation-images
```

Candidate review workflow:

1. Run the orphan candidate SQL.
2. Cross-check candidates in the Supabase Dashboard Storage view.
3. Confirm no `public.observations.image_path` references the object path.
4. Export the candidate list.
5. Request explicit cleanup approval.
6. Leave actual cleanup to a separately approved maintenance step or 18E automation design.

## Threshold Recommendations

These are draft operating thresholds. They need project-owner approval before they become policy.

### Weekly Pending Count

- Watch: more than 20 pending rows.
- Escalate: more than 50 pending rows.
- Reason: review queue growth can hide abuse or delay moderation.

### Old Pending Age

- Watch: any pending row older than 7 days.
- Escalate: any pending row older than 14 days.
- Reason: old queue items increase stale signed URL and moderation context risk.

### Rejected Retention

- Draft retention: 30 days after `updated_at`.
- Escalate: rejected image candidates older than 45 days.
- Reason: 30 days balances recovery and private-content retention.

### Anonymous Upload Spike

- Watch: more than 25 Storage objects in one day.
- Escalate: more than 50 Storage objects in one day or more than 150 MB in one day.
- Reason: anonymous upload remains the primary capacity abuse risk.

### Near-Limit Image Size

- Watch: any single image at or above 4.5 MB.
- Escalate: more than 10 near-limit images in a week.
- Reason: near-limit files can increase Storage cost quickly and may indicate repeated uncompressed mobile uploads.

### Bucket Usage

- Watch: bucket total size growth is unexpected week over week.
- Escalate: bucket approaches the plan quota or grows faster than the moderation team can review.
- Reason: Storage usage can grow before public visibility reveals abuse.

## Result Recording Template

Use this template for weekly or monthly checks:

```text
Date:
Operator:
Environment:
Checklist type: weekly | monthly

Counts:
- approved rows:
- pending rows:
- rejected rows:
- approved image rows:
- pending image rows:
- rejected image rows:
- bucket object count:
- bucket total size:

Queue age:
- oldest pending:
- pending older than 7 days:
- pending older than 14 days:

Anomalies:
- public visibility invariant:
- suspicious image_url rows:
- missing image metadata rows:
- unexpected image_path pattern rows:
- orphan candidates:
- rejected retention candidates:
- upload spike:
- near-limit image candidates:

Action needed:
- none | review | escalation | cleanup approval request | follow-up design

Delete candidates, if any:
- candidate list exported: yes | no
- cleanup approval requested: yes | no
- cleanup executed: no

Follow-up owner:
Next review date:
Secret exposure check:
- .env.local not printed:
- keys/tokens/passwords/emails not included in exported notes:
```

## Escalation Rules

Escalate immediately if:

- pending or rejected rows are visible through public app/repository reads
- `image_url` contains signed, public, blob, preview, or data URLs
- `image_path` values do not match the expected path pattern
- rows with `image_path` are missing MIME type or size metadata
- abnormal upload spikes exceed the approved threshold
- bucket usage approaches the project quota
- pending queue age exceeds the approved threshold
- admin review is blocked by signed URL/image display failures
- cleanup requires any SQL or policy change
- cleanup requires service-role credentials

Escalation path:

1. Stop and document the anomaly.
2. Do not apply SQL or change policy as part of monitoring.
3. Re-run only read-only checks needed to confirm the anomaly.
4. File a follow-up task with the relevant phase:
   - public visibility or RLS issue: dedicated security fix
   - signed URL UX issue: 18C
   - abuse spike: 18D
   - cleanup automation need: 18E
5. Get explicit approval before any destructive or policy-changing work.

## Next Steps

- 18C: signed URL refresh UX design or implementation candidate.
- 18D: anonymous upload abuse mitigation decision.
- 18E: optional cleanup automation design.
- Actual cleanup or deletion requires separate approval.
- Any RLS, Storage policy, Edge Function, CAPTCHA, rate-limit, or admin cleanup UI work must be planned as its own approved phase.
