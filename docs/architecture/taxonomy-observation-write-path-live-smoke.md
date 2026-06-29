# Taxonomy Observation Write Path Live Smoke

Phase: 24E-2B - Trusted Taxonomy Observation Create RPC Live Smoke

Date: 2026-06-29

Status: PASS for trusted RPC create, DB verification, owner content edit, and
security checks. Browser visual UI smoke remains PARTIAL.

## Scope

This smoke used the Supabase project shared with Production after migrations
0010 and 0011 were manually applied and verified by the operator.

The test created one clearly named approved observation through the trusted
RPC:

```text
Phase24E taxonomy-linked RPC smoke 0011
```

No Upload UI integration was added. No `학명 확인` button was added. No app
route, repository code, migration SQL, Edge Function, Vercel setting, Storage
setting, Auth setting, Admin behavior, Kakao setting, or Production UI deploy
was changed.

## Preconditions

| Check | Result |
| --- | --- |
| Migration 0011 manually applied | PASS |
| 0011 post-apply checks passed | PASS |
| `resolve-taxonomy` deployed before this phase | PASS |
| Public test observation approved by operator | PASS |
| Existing smoke observation with the same name absent before create | PASS |
| Upload UI still not connected to taxonomy | PASS |

## Harness Notes

Codex could not safely collect the approved test email/password in the
noninteractive shell. A temporary PowerShell harness was generated under the
operator's temp directory. The operator entered credentials locally, not in
chat.

The first harness run failed only because PowerShell decoded the Korean
`broadTaxon` value incorrectly. The harness was regenerated to decode HTTP
responses as UTF-8. The second run created the observation and completed the
core smoke.

The second harness ended with an `unexpected_harness_error` after the core
smoke because its final read-only grant helper failed inside the harness.
Codex reran the same category of read-only grant checks separately through the
linked Supabase CLI, returning safe booleans only, and those checks passed.

No credential, JWT, token, URL, project ref, source taxon key, UUID, object
path, or raw row content was printed or stored.

## Resolver Prerequisite

| Check | Result |
| --- | --- |
| Approved user auth | PASS |
| `Taraxacum officinale` resolver state | PASS, `resolved` |
| Resolver returned a taxon identifier | PASS |
| Accepted species result | PASS |
| Broad project taxon is plant | PASS |
| Cache hit reported | PASS |

## Trusted RPC Create

| Check | Result |
| --- | --- |
| RPC call succeeded | PASS |
| Observation created | PASS |
| Matching observation count | PASS, 1 |
| Status is approved | PASS |
| Observer profile matches signed-in user | PASS |
| Scientific name remains reported name | PASS |
| Broad taxon is plant | PASS |
| `taxon_id` is non-null | PASS |
| Taxonomy metadata is present | PASS |
| Accepted taxon row exists | PASS |
| Accepted scientific name matches | PASS |
| Species name matches | PASS |
| No image URL/path persisted | PASS |

## Owner And Edit Behavior

| Check | Result |
| --- | --- |
| Owner content edit through allowed field | PASS |
| Edited description persisted | PASS |
| Taxonomy linkage remained attached after content edit | PASS |
| Direct scientific-name edit on linked row | PASS, blocked safely |
| Scientific name remained `Taraxacum officinale` | PASS |
| `taxon_id` remained attached | PASS |

Browser edit-control visibility was not visually checked in this Codex run.

## Public Compatibility

| Check | Result |
| --- | --- |
| Anonymous/public read can see the approved smoke row through public API | PASS |
| Safe nickname did not expose raw email-like text | PASS |
| No no-image URL/path placeholder data persisted | PASS |
| Existing legacy null-taxonomy rows remain query-compatible | PASS |

The actual public browser list/detail modal was not visually checked in this
run, so UI compatibility is recorded as PARTIAL. The created row is compatible
with the existing public approved-read shape.

## RLS And Security

| Check | Result |
| --- | --- |
| Anonymous RPC execution denied | PASS |
| `taxonomy_name_resolutions` public read denied | PASS |
| anon/authenticated taxonomy table writes denied | PASS |
| `public.taxa` public column read remains ready | PASS |
| `service_role` DELETE on taxonomy cache tables remains false | PASS |
| No service-role value in frontend or docs | PASS |

## Boundaries

Changed live DB data:

- One approved smoke observation was created through the trusted RPC.
- The resolver reused or confirmed existing trusted taxonomy cache data for
  `Taraxacum officinale`.

Not changed:

- Upload UI
- Observation create/update app code
- Package files
- Migration SQL
- RLS/policies
- Edge Function deployment
- Storage settings
- Auth settings
- Admin app behavior
- Kakao settings
- Vercel configuration
- Production UI deployment

## Remaining Risks

- Browser visual UI smoke for list/detail/edit-control hiding remains PARTIAL.
- The temporary harness is not committed and should be regenerated if needed.
- Phase 24E-3 still needs repository and Upload UI integration with an explicit
  `학명 확인` button.
- Existing legacy observations remain intentionally unlinked unless a separate
  backfill phase is approved.

## Next Step

```text
Phase 24E-3 - connect Upload UI to TaxonomyRepository with explicit 학명 확인 button and trusted RPC create path
```
