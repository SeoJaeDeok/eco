# Taxonomy Upload UI Smoke

Phase: 24F-1 - Upload Taxonomy UI Local Smoke And Regression Verification

Date: 2026-06-29

Status: PASS for local manual Upload UI smoke and read-only DB verification.
Push status: not pushed.

## Scope

This smoke verified the Phase 24E-3 Upload UI taxonomy integration from:

```text
feature/phase-24f1-upload-taxonomy-smoke
```

Base commit:

```text
5d8090e docs: record taxonomy upload integration
```

The local app was served from:

```text
http://127.0.0.1:3002
```

The operator approved one public no-image smoke observation:

```text
Phase24F upload UI taxonomy smoke exact plant
```

No migration, Edge Function deployment, Vercel setting, Storage/Auth/Kakao
setting, main merge, push, or Production UI deployment was performed.

## Automated Preparation

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| Node tests | PASS, 20 tests |
| `npm.cmd run build` | PASS |
| Deno format check | PASS |
| Deno lint | PASS |
| Deno static check | PASS |
| Deno resolver tests | PASS, 4 tests |
| `git diff --check` | PASS |
| forbidden tracked-path check | PASS |
| migration/package/Vercel diff check | PASS, no changes |

Browser automation was unavailable in Codex, so the browser smoke was completed
manually by the operator.

## Manual Browser Smoke

| Case | Result |
| --- | --- |
| Public test observation approved by operator | PASS |
| Submit blocked before scientific-name verification | PASS |
| Exact plant create with `Taraxacum officinale` | PASS |
| Dirty state after scientific-name edit | PASS |
| Synonym confirmation with `Felis concolor` | PASS |
| Variant confirmation with `Homo sapines` | PASS |
| Higher-rank input `Homo` blocked | PASS |
| No-match input `Xyzabc nonexistentii` blocked | PASS |
| Public list/detail compatibility | PASS |
| Owner/anonymous regression | PASS |
| Reported manual smoke errors | PASS, none reported |

## Read-Only DB Verification

The shared Supabase DB was checked with read-only SQL returning booleans and
counts only.

| Check | Result |
| --- | --- |
| observation found | PASS |
| matching observation count | PASS, 1 |
| observation status is approved | PASS |
| observer profile exists | PASS |
| scientific name remains reported name | PASS |
| broad taxon is plant | PASS |
| `taxon_id` is non-null | PASS |
| taxonomy match type is non-null | PASS |
| taxonomy verified timestamp is non-null | PASS |
| accepted taxon row exists | PASS |
| accepted scientific name matches | PASS |
| species name matches | PASS |
| no `image_url` persisted | PASS |
| no URL-like image value persisted | PASS |
| owner description edit persisted | PASS |
| scientific name still `Taraxacum officinale` | PASS |
| legacy null-taxonomy rows remain compatible | PASS |
| public approved-only policy exists | PASS |
| owner update policy exists | PASS |
| admin update policy exists | PASS |
| direct taxonomy table writes denied | PASS |
| resolution cache remains server-only | PASS |

No UUIDs, source keys, row contents, user details, credentials, URLs, object
paths, or raw rows are recorded.

## Image Cleanup Verification

Automated tests cover the image cleanup path added in Phase 24E-3:

- cleanup is attempted when image upload succeeds but trusted RPC create fails
- cleanup is scoped to the just-uploaded repository-owned object path
- direct broad Storage delete behavior was not added
- cleanup failure does not replace the original create error category

No live forced image/RPC failure was run in this phase.

## Owner/Admin Compatibility

Confirmed by manual smoke, read-only DB verification, and existing automated
tests:

- legacy rows with `taxon_id IS NULL` remain compatible
- taxonomy-linked rows keep scientific-name linkage intact
- owner content edit works
- anonymous edit controls remain hidden by manual smoke
- owner/admin payload protections remain unchanged
- no raw email display was reported

## Boundaries

Changed live data:

- one approved no-image public smoke observation was created through the new
  Upload UI and trusted RPC path
- the same observation description was edited by the owner during smoke

Not changed:

- migration SQL
- RLS policies
- Edge Function deployment
- Storage settings
- Auth settings
- Admin app behavior
- Kakao settings
- Vercel configuration
- Production UI deployment
- package files

## Remaining Risks

- Preview smoke has not been run yet.
- Production deployment has not happened from this feature branch.
- Rich taxonomy display in public detail remains deferred.
- Existing legacy observations remain intentionally unlinked.

## Next Step

```text
Phase 24F-2 - push feature branch for Vercel Preview and run Preview smoke
```
