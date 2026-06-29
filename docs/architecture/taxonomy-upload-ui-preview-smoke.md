# Taxonomy Upload UI Preview Smoke

Phase: 24F-2 - Vercel Preview Deployment And Upload Taxonomy Smoke

Date: 2026-06-29

Status: PASS for Vercel Preview deployment, Preview browser smoke, and
read-only DB verification.

Push status: feature branch pushed. Main was not pushed.

## Scope

This smoke verified the Upload UI taxonomy flow from:

```text
feature/phase-24f1-upload-taxonomy-smoke
```

Verified branch head before this closeout:

```text
2e8f5ea docs: record taxonomy upload ui smoke
```

The Vercel deployment was a Preview deployment from the feature branch. No
Preview URL, Production URL, Supabase URL, project ref, credential, token,
source taxon key, UUID, object path, or raw row is recorded.

## Preview Deployment

| Check | Result |
| --- | --- |
| Feature branch pushed to origin | PASS |
| Vercel Preview deployment created | PASS |
| Preview build succeeded | PASS |
| Preview environment used | PASS |
| Production deployment intentionally triggered | PASS, no |
| Build log secret review | PARTIAL, not explicitly recorded by operator |

Official Vercel behavior used for this phase:

- non-production branch pushes create Preview deployments
- Preview environment variables apply to Preview deployments
- environment variable changes require a new deployment or redeploy

## Preview Environment Variables

Required names only:

```text
VITE_OBSERVATION_REPOSITORY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_STORAGE_BUCKET
VITE_KAKAO_MAP_JAVASCRIPT_KEY
```

Result: PASS. The operator confirmed Preview environment variables were ready
and Preview login worked after they were fixed.

No values were printed or recorded. No service-role value belongs in a
browser-exposed `VITE_*` variable.

## Preview Browser Smoke

The operator confirmed these Preview browser checks:

| Case | Result |
| --- | --- |
| Basic Preview site loads | PASS |
| Preview login works | PASS |
| Submit blocked before `hakmyeong check` flow | PASS |
| Explicit taxonomy verification button flow | PASS |
| Exact plant create with `Taraxacum officinale` | PASS |
| Dirty state after scientific-name edit | PASS |
| Synonym confirmation with `Felis concolor` | PASS |
| Variant confirmation with `Homo sapines` | PASS |
| Higher-rank input `Homo` blocked | PASS |
| No-match input `Xyzabc nonexistentii` blocked | PASS |
| Public list/detail compatibility | PASS |
| Owner edit and anonymous edit-hidden behavior | PASS |

Approved Preview smoke observation name:

```text
Phase24F Preview upload taxonomy smoke exact plant
```

No image was attached for this smoke.

## Read-Only DB Verification

The shared Supabase DB was checked with read-only SQL returning booleans and
counts only.

| Check | Result |
| --- | --- |
| observation found | PASS |
| matching observation count | PASS, 1 |
| observation status is approved | PASS |
| observer profile matches | PASS |
| scientific name matches reported name | PASS |
| broad taxon is plant | PASS |
| `taxon_id` is non-null | PASS |
| taxonomy match type is non-null | PASS |
| taxonomy verified timestamp is non-null | PASS |
| accepted taxon row exists | PASS |
| accepted scientific name corresponds to `Taraxacum officinale` | PASS |
| species name matches `Taraxacum officinale` | PASS |
| no `image_url` persisted | PASS |
| no URL-like observation image value persisted | PASS |
| owner edit description persisted | PASS |
| scientific name still `Taraxacum officinale` | PASS |
| legacy null-taxonomy rows remain compatible | PASS |
| public approved-only policy exists | PASS |
| owner update policy exists | PASS |
| admin update policy exists | PASS |
| direct taxonomy table writes denied | PASS |
| resolution cache remains server-only | PASS |

The accepted scientific-name check allowed a safe accepted-name correspondence
because the stored accepted name can include non-secret authorship text while
the canonical species name still matches.

## Boundaries

Changed live data:

- one operator-approved no-image Preview smoke observation was created through
  the Upload UI and trusted RPC path
- the same observation received the operator-confirmed owner description edit

Not changed:

- main branch
- Production deployment
- migration SQL
- RLS policies
- Edge Function deployment
- Storage settings
- Auth settings
- Admin behavior
- Kakao settings
- Vercel Production settings
- package files

## Remaining Risks

- Build logs were not explicitly recorded as reviewed for secrets, so that
  check remains PARTIAL.
- Production deployment smoke has not been run for Phase 24.
- Rich public detail taxonomy display remains deferred.
- Phase 24 history archive remains open until Production smoke passes.

## Next Step

```text
Phase 24F-3 - merge feature branch into main, push, run Production deployment smoke, and close Phase 24
```
