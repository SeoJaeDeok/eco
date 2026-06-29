# Taxonomy Upload UI Production Smoke

Phase: 24F-3 - Production Deployment Smoke And Phase 24 Closeout

Date: 2026-06-29

Status: PASS for Production deployment, Upload UI taxonomy smoke, and read-only
DB verification.

## Goal

Verify that the Phase 24 taxonomy Upload UI flow deployed from `main` works in
Production without changing application behavior after the smoke.

**Korean summary:** Phase 24 taxonomy upload flow가 Production에서 실제로 동작하는지 확인했습니다. 이 문서는 URL, 계정, 토큰, 키, UUID, source key, row data를 기록하지 않습니다.

## Deployment Scope

| Check | Result |
| --- | --- |
| `main` contains Phase 24 feature commits | PASS |
| `main` pushed normally to origin | PASS |
| Vercel Production deployment started from `main` | PASS |
| Production deployment includes `47a3cab` | PASS |
| Production build succeeded | PASS |
| Environment is Production | PASS |
| Build log secret review | PARTIAL, not explicitly confirmed |

No Preview URL, Production URL, Supabase URL, project ref, deployment URL, key,
token, email, password, source taxon key, UUID, object path, or raw database
row is recorded.

## Test Observation

Operator approved one public no-image Production smoke observation:

```text
Phase24F Production upload taxonomy smoke exact plant
```

Input used by the operator:

```text
scientific name: Taraxacum officinale
description: Phase 24F Production upload taxonomy smoke
image: none
```

Owner edit smoke updated the description to:

```text
Phase 24F Production owner edit passed
```

## Production Browser Smoke

| Case | Result |
| --- | --- |
| Basic Production site smoke | PASS |
| Submit blocked before `학명 확인` | PASS |
| Exact plant create with `Taraxacum officinale` | PASS |
| Dirty state after scientific-name edit | PASS |
| Synonym confirmation UI with `Felis concolor` | PASS |
| Variant confirmation UI with `Homo sapines` | PASS |
| Higher-rank input `Homo` blocked | PASS |
| No-match input `Xyzabc nonexistentii` blocked | PASS |
| Public list/detail compatibility | PASS |
| Owner edit and anonymous edit-hidden behavior | PASS |
| Secret-like console output | PASS, operator-confirmed |

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

- one operator-approved no-image Production smoke observation was created
  through the Upload UI and trusted RPC path
- the same observation received the operator-confirmed owner description edit

Not changed during this closeout:

- application code
- migration SQL
- RLS policies
- Edge Function deployment
- Storage settings
- Auth settings
- Admin behavior
- Kakao settings
- Vercel configuration
- package files

## Remaining Partial Items

- Build log secret review was not explicitly confirmed, so it remains PARTIAL.
- Production admin regression was not rerun in this closeout.
- Rich public detail taxonomy display remains deferred.
- Taxonomy tree browsing remains deferred.
- Legacy observation taxonomy backfill remains optional and deferred.
- Custom domain remains an optional follow-up if not already connected.

## Result

Phase 24 taxonomy upload flow is deployed to Production and verified for the
core user path: explicit `학명 확인`, trusted taxonomy-linked create, public
list/detail compatibility, owner edit compatibility, anonymous edit hiding, and
read-only DB taxonomy linkage checks.
