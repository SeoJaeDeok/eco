# Taxonomy Resolver Local Smoke

Phase: 24D-2 - Local Edge Function Tooling And Authenticated Taxonomy Resolver Smoke

Date: 2026-06-28

Status: PASS with one tooling limitation.

## Scope

This smoke verified the local-only trusted taxonomy resolver path after
migrations `0001` through `0009` could replay from scratch.

No remote Supabase SQL was run. No Edge Function was deployed. No upload,
owner-edit, admin-edit, Vercel, Storage, Auth, Kakao, or Production UI behavior
was changed.

## Tooling

Verified local tools:

| Tool | Version | Result |
| --- | --- | --- |
| Node | v24.14.1 | PASS |
| npm | 11.11.0 | PASS |
| Docker Desktop | 4.79.0 | PASS |
| Docker Client/Server | 29.5.3 | PASS |
| Deno | 2.8.3 | PASS |
| Supabase CLI | 2.108.0, repository-local dev dependency | PASS |

`supabase/config.toml` is local-only. It contains no remote project ref, remote
DB URL, linked-project section, or credentials.

## Deno And App Checks

| Check | Result |
| --- | --- |
| Deno format check | PASS |
| Deno lint | PASS |
| Deno static/type check | PASS |
| Focused Deno tests | PASS |
| Existing Node taxonomy tests | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS |
| `git diff --check` | PASS, line-ending warnings only |

The Deno tests also cover the direct handler export and the HTTP 409 response
for a mismatched confirmation candidate.

## Local Migration Replay

`supabase db reset --local` applied migrations `0001` through `0009` from
scratch on the local Docker stack.

Safe local schema checks:

| Check | Result |
| --- | --- |
| `public.profiles` exists | PASS |
| `public.observations` exists | PASS |
| `public.taxa` exists | PASS |
| `public.taxonomy_name_resolutions` exists | PASS |
| observation taxonomy columns exist | PASS |
| taxonomy RLS enabled | PASS |
| `observations.taxon_id` foreign key exists | PASS |
| `service_role` SELECT/INSERT/UPDATE on taxonomy tables | PASS |
| `service_role` DELETE on taxonomy tables | PASS, false |
| anon/authenticated taxonomy writes denied | PASS |

## Function Serve

Official command attempted:

```text
supabase functions serve resolve-taxonomy
```

Result: PARTIAL.

The official local gateway process still exits on this Windows environment with
an `ENAMETOOLONG` spawn error. Because of that, the smoke did not claim official
Supabase gateway serve as PASS.

The same exported request handler was exercised through a direct local Deno
harness with local Supabase Auth, local PostgREST, local database tables, and
real GBIF requests. Gateway behavior still needs one live deployment smoke in
Phase 24D-3.

## Authenticated Resolver Matrix

All requests used local-only Supabase Auth and local-only JWT/session data. No
Production user, key, token, URL, or project ref was used or recorded.

| Case | Expected behavior | Result |
| --- | --- | --- |
| No token | HTTP 401, no cache write | PASS |
| Disposable local user/session | local user created and session obtained | PASS |
| First `Homo sapiens` lookup | `resolved`, species, broad taxon mammal, cache miss | PASS |
| Second `Homo sapiens` lookup | `resolved`, cache hit, no duplicate rows | PASS |
| `Felis concolor` lookup | `needsConfirmation`, candidate `Puma concolor` | PASS |
| Unconfirmed synonym | no successful input-name mapping persisted | PASS |
| Synonym confirmation | `resolved`, confirmed mapping cached | PASS |
| Wrong confirmation key | HTTP 409, no incorrect cache write | PASS |
| `Homo sapines` lookup | `needsConfirmation`, candidate `Homo sapiens` | PASS |
| `Homo` lookup | `blocked`, higher-rank-only | PASS |
| `Xyzabc nonexistentii` lookup | `blocked`, no match | PASS |

GBIF returned normal responses during this bounded smoke. No timeout, HTTP 429,
or GBIF 5xx was observed.

## Local Cache And DB Checks

Safe count/boolean checks after the smoke:

| Check | Result |
| --- | --- |
| exact accepted `Homo sapiens` taxon exists once | PASS |
| exact `homo sapiens` resolution exists once | PASS |
| repeated exact lookup created no duplicates | PASS |
| synonym accepted `Puma concolor` taxon exists once | PASS |
| synonym input mapping exists only after confirmation | PASS |
| wrong confirmation created no mapping | PASS |
| variant input mapping absent because it was not confirmed | PASS |
| higher-rank input created no successful mapping | PASS |
| no-match input created no successful mapping | PASS |
| compact classification JSON shape is normalized and safe | PASS |
| observations received no taxonomy linkage | PASS |

The local smoke created two accepted taxonomy cache rows and two successful
resolution-cache rows. It did not create or update observation taxonomy fields.

## RLS And Access

Local public/server-only access checks:

| Check | Result |
| --- | --- |
| anon can read `public.taxa` | PASS |
| authenticated can read `public.taxa` | PASS |
| anon cannot read `public.taxonomy_name_resolutions` | PASS |
| authenticated cannot read `public.taxonomy_name_resolutions` | PASS |
| anon/authenticated cannot insert/update/delete taxonomy cache tables | PASS |
| no fake write-test row remains | PASS |

## Cleanup

- Temporary local Auth users were deleted.
- Temporary local smoke scripts and logs were removed.
- The local Supabase stack was stopped.
- No secret file remained.
- No remote resource was cleaned or modified.

## Boundaries

Not changed:

- Upload UI
- Owner/admin edit UI
- Observation create/update behavior
- Migration `0007`
- Migration `0008`
- Migration `0009`
- Remote Supabase database after the already confirmed manual `0009` apply
- Remote Edge Function deployment
- Vercel configuration
- Storage, Auth Production behavior, Admin app behavior, Kakao, or Production UI

## Next Step

```text
Phase 24D-3 - deploy resolve-taxonomy to the shared Supabase project and run authenticated live resolver smoke without upload UI integration
```
