# Taxonomy Resolver Implementation Readiness

Phase: 24D-1 - TaxonomyRepository And Trusted GBIF Resolver Implementation

Status: implementation prepared locally. The Edge Function was not deployed, and no live Supabase setting was changed.

## Goal

Phase 24D-1 adds the trusted taxonomy resolution foundation without connecting it to the upload or edit UI.

Implemented locally:

- `TaxonomyRepository` contract.
- Deterministic mock taxonomy repository.
- Supabase taxonomy repository that invokes one trusted Edge Function.
- `resolve-taxonomy` Supabase Edge Function source.
- Scientific-name normalization.
- Deterministic broad project-taxon derivation.
- GBIF Species Match API v2 mapper.
- Local taxonomy cache lookup and trusted cache writes inside the Edge Function.
- Confirmation protocol for synonym and variant results.
- Pure unit tests.

Not implemented in this phase:

- No upload form integration.
- No owner/admin edit integration.
- No observation `taxon_id` writes.
- No taxonomy requirement on observation creation.
- No taxonomy tree.
- No Edge Function deployment.
- No migration, RLS, Storage, Auth, Kakao, Vercel, or live DB setting change.

한국어 요약: 이번 단계는 학명 확인 기능의 기반 코드만 준비했습니다. 아직 화면에 연결하지 않았고, Supabase Edge Function도 배포하지 않았습니다.

## Official Sources Rechecked

Supabase:

- Securing Edge Functions: `https://supabase.com/docs/guides/functions/auth`
- Authorization headers: `https://supabase.com/docs/guides/functions/auth-headers`
- Function dependencies and function-specific `deno.json`: `https://supabase.com/docs/guides/functions/dependencies`
- Edge Function tests with Deno: `https://supabase.com/docs/guides/functions/unit-test`
- JavaScript `functions.invoke`: `https://supabase.com/docs/reference/javascript/functions-invoke`

GBIF:

- Taxonomy interpretation and Species Match API v2: `https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation`
- API reference entry point: `https://techdocs.gbif.org/en/openapi/`

Implementation decisions from the official docs:

- Browser code calls `supabase.functions.invoke('resolve-taxonomy')`.
- The function expects a signed-in user's JWT in the `Authorization` header.
- The function validates the user before creating the admin Supabase client.
- Authoritative writes to `taxa` and `taxonomy_name_resolutions` happen only inside the trusted function.
- The function has its own `deno.json`.
- GBIF lookup uses `GET https://api.gbif.org/v2/species/match` with `scientificName` and the COL XR `checklistKey`.

The current Supabase docs also show a newer `withSupabase` wrapper. This implementation uses the official `supabase-js` Edge Function pattern instead because the repository has no existing Edge Function tooling, no Deno installation, and no safe local way to verify or pin the wrapper package in this phase. The function still validates the caller with `auth.getUser()` before any admin/cache write.

## Implemented Files

Client/app repository foundation:

- `src/features/taxonomy/taxonomyCore.ts`
- `src/repositories/taxonomyRepository.ts`
- `src/repositories/taxonomyRepositoryProvider.ts`
- `src/repositories/mockTaxonomyRepository.ts`
- `src/repositories/supabase/supabaseTaxonomyRepository.ts`

Trusted Edge Function source:

- `supabase/functions/resolve-taxonomy/deno.json`
- `supabase/functions/resolve-taxonomy/index.ts`
- `supabase/functions/resolve-taxonomy/taxonomy_core.ts`
- `supabase/functions/resolve-taxonomy/gbif_mapper.ts`
- `supabase/functions/tests/resolve-taxonomy-test.ts`

Local tests:

- `tests/taxonomy-core.test.mjs`
- `tests/mock-taxonomy-repository.test.mjs`
- `tests/gbif-mapper.test.mjs`
- `tests/ts-extension-loader.mjs`

## Repository Contract

The new contract is:

```text
TaxonomyRepository.resolveScientificName({ scientificName })
TaxonomyRepository.confirmScientificName({ scientificName, acceptedSourceTaxonKey })
```

Result states:

- `resolved`
- `needsConfirmation`
- `blocked`
- `error`

The client never sends arbitrary accepted names, lineage fields, taxonomy IDs, or observation taxonomy metadata as authority.

## Normalization Rules

The resolver uses a named maximum:

```text
SCIENTIFIC_NAME_MAX_LENGTH = 200
```

Rules:

- Input must be a string.
- Normalize Unicode with NFC.
- Trim leading/trailing whitespace.
- Collapse repeated internal whitespace.
- Reject empty input.
- Reject control characters.
- Reject values longer than 200 Unicode code points.
- Keep reported scientific-name casing and authorship punctuation.
- Use a separate lowercased `normalizedInput` only for cache lookup.

## Broad Taxon Mapping

The deterministic helper maps taxonomy lineage to the existing broad groups:

| Rule | Broad taxon |
| --- | --- |
| class `Insecta` | `곤충` |
| class `Aves` | `조류` |
| class `Mammalia` | `포유류` |
| class `Amphibia` or `Reptilia` | `양서/파충류` |
| kingdom `Plantae` | `식물` |
| kingdom `Fungi` | `균류` |
| no match | `기타` |

The mapper does not use common names, Korean names, or LLM inference.

## Mock Repository Fixtures

The mock repository is deterministic and makes no network request.

Fixtures:

- Exact accepted: `Homo sapiens`
- Exact accepted insect: `Apis mellifera`
- Exact accepted plant: `Taraxacum officinale`
- Exact accepted fungus: `Amanita muscaria`
- Synonym requiring confirmation: `Felis concolor` -> `Puma concolor`
- Variant requiring confirmation: `Homo sapines` -> `Homo sapiens`
- Higher rank blocked: `Homo`
- No match blocked: `Xyzabc nonexistentii`
- Controlled retryable error: `Timeout test`

Confirmation verifies the expected accepted source taxon key. A mismatched key returns `invalid_confirmation`.

## Supabase Repository Behavior

`supabaseTaxonomyRepository` calls only:

```text
resolve-taxonomy
```

Supported action bodies:

```json
{ "action": "resolve", "scientificName": "Homo sapiens" }
```

```json
{
  "action": "confirm",
  "scientificName": "Felis concolor",
  "acceptedSourceTaxonKey": "4QHKG"
}
```

Rules:

- UI components do not call the function directly.
- Browser code does not write `taxa`.
- Browser code does not write `taxonomy_name_resolutions`.
- Browser code does not write observation taxonomy fields.
- Function transport errors become safe repository-domain errors.
- Returned JSON is validated before being trusted.

The provider uses the existing repository-mode convention through `VITE_OBSERVATION_REPOSITORY`. No new `VITE_*` variable was added.

## Edge Function Behavior

HTTP/auth:

- Handles `OPTIONS` for CORS.
- Accepts `POST`.
- Rejects unsupported methods.
- Requires a signed-in Supabase user.
- Validates the user through `auth.getUser()` before creating the admin client.
- Returns safe JSON only.
- Does not log email, JWT, keys, or raw DB errors.

Cache and GBIF flow:

1. Normalize scientific name.
2. Check `taxonomy_name_resolutions` by source/checklist/normalized input.
3. If cache exists and confirmation is still required, return `needsConfirmation` without GBIF.
4. If cache exists and no confirmation is required, return `resolved` without GBIF.
5. Check accepted `taxa` by accepted/canonical name before GBIF.
6. If no local cache applies, call GBIF with a 9 second timeout.
7. Map exact accepted species/infraspecific taxa to `resolved`.
8. Map synonym and variant candidates to `needsConfirmation`.
9. Block higher-rank-only, no-match, unsupported, ambiguous, and malformed responses.
10. Upsert accepted taxa and successful resolution cache rows through the admin client only.

Confirmation flow:

1. Normalize original input.
2. Check existing successful resolution cache.
3. If cached accepted source key matches, return `resolved`.
4. Otherwise call GBIF again for the original input.
5. Verify the authoritative accepted source key matches the client-provided candidate key.
6. Upsert `taxa`.
7. Upsert successful resolution cache.
8. Return `resolved`.

## Cache Writes

`taxa` row identity:

```text
source + source_checklist_key + source_taxon_key
```

Resolution cache identity:

```text
source + source_checklist_key + normalized_input
```

The function does not cache:

- no match
- timeout
- HTTP 429
- GBIF 5xx
- malformed response
- blocked higher-rank-only results

## Verification

Run locally:

```bash
npm.cmd run typecheck
node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs
npm.cmd run build
```

Deno/Supabase local function checks are expected later:

```bash
deno test --config supabase/functions/resolve-taxonomy/deno.json supabase/functions/tests/resolve-taxonomy-test.ts
supabase functions serve resolve-taxonomy
```

Phase 24D-1 environment note:

- Supabase CLI: not installed.
- Deno: not installed.
- Docker: not installed.
- Edge Function local serve/deploy was NOT RUN.


## Phase 24C.1 / 24D-2 Unblock Update

Status: service-role grant blocker diagnosed and migration candidate prepared.

During the Phase 24D-2 local resolver smoke, authenticated requests reached the function but stopped before GBIF with a safe `database_failure` result. Local PostgREST checks for `public.taxa` and `public.taxonomy_name_resolutions` returned HTTP 403 with SQL reason `42501`.

Diagnosis:

- Admin/service client construction: PASS. The user JWT is used only for caller authentication. The admin client is separate and does not set the user's Authorization header.
- Service-role grants: MISSING after migration 0007. `service_role` had schema usage but did not have SELECT/INSERT/UPDATE on the taxonomy cache tables.

Correction path:

- New migration candidate: `supabase/migrations/0008_grant_taxonomy_service_role_access.sql`.
- It grants `service_role` SELECT, INSERT, and UPDATE on `public.taxa` and `public.taxonomy_name_resolutions`.
- It does not grant DELETE.
- It does not grant new browser write privileges.
- It does not change RLS policies.

Local verification after applying 0008 locally passed for service-role taxonomy table access and preserved browser denial checks.

Resolver smoke remains BLOCKED for the shared Supabase DB until 0008 is manually applied and verified there. No remote SQL was applied in this unblock step.

## Phase 24C.1 Post-0008 DELETE Grant Follow-Up

Status: follow-up correction candidate prepared.

The operator manually applied `0008` to the Supabase project shared with
Production. The intended SELECT/INSERT/UPDATE grants for `service_role` were
confirmed.

Additional read-only diagnostics found:

- Admin/service client construction remains PASS.
- `service_role` DELETE on the taxonomy cache tables is a direct grant.
- anon/authenticated taxonomy writes remain denied.
- `public.taxa` public SELECT policy exists and is correctly named.
- `public.taxonomy_name_resolutions` remains server-only.

Correction path:

```text
supabase/migrations/0009_revoke_taxonomy_service_role_delete.sql
```

`0009` revokes only DELETE from `service_role` on:

- `public.taxa`
- `public.taxonomy_name_resolutions`

It preserves `service_role` SELECT/INSERT/UPDATE, changes no RLS policies, and
does not change observations, Storage, Auth, Admin, Kakao, Vercel, or app UI.

Resolver smoke remains BLOCKED until `0009` is manually applied and verified.

## Phase 24C.1 / 24D-2 Replayability Update

Status: local replayability repair prepared.

The operator manually applied `0009` to the shared Supabase database and
confirmed the intended final grant state:

- `service_role` SELECT/INSERT/UPDATE on both taxonomy cache tables remain
  available.
- `service_role` DELETE on both taxonomy cache tables is false.
- anon/authenticated taxonomy writes remain denied.
- `public.taxa` public read remains ready.
- `public.taxonomy_name_resolutions` remains server-only.

When Phase 24D-2 resumed locally, `supabase db reset --local` failed while
applying `0009` because the original preflight required DELETE to exist before
the revoke. A clean local replay after `0008` can already have DELETE absent,
which is safe and matches the intended final state.

Correction:

- `0009` was made replay-safe without changing its final intended database
  state.
- It now accepts either starting state: DELETE present or DELETE already absent.
- It still requires SELECT/INSERT/UPDATE, browser write denial, the public
  `taxa` SELECT policy, no public resolution-cache policy, and RLS to remain in
  place.
- No remote SQL was run for the replayability repair.
- No resolver smoke was run in this repair step.

Phase 24D-2 later resumed after the replay-safe `0009` correction. Local
`supabase db reset --local` applied migrations `0001` through `0009` from
scratch, and the authenticated resolver smoke passed through the direct Deno
handler harness.

## Phase 24D-2 Local Smoke Result

Status: PASS with one tooling limitation.

Resolved since Phase 24D-1:

- Supabase CLI is available as a repository-local dev dependency.
- Deno is available and Deno format/lint/check/tests pass.
- Docker Desktop is available and the local Supabase stack starts.
- Local migrations `0001` through `0009` replay from scratch.
- Local Auth user/session creation works for disposable test users.
- Authenticated resolver calls reach GBIF, write cache rows, and return safe
  normalized results.
- Duplicate exact lookup reuses the local cache.
- Synonym confirmation caches only after explicit confirmation.
- Wrong confirmation returns HTTP 409.
- Higher-rank and no-match inputs remain blocked and are not cached.
- `public.taxa` remains publicly readable.
- `public.taxonomy_name_resolutions` remains server-only.
- No observation taxonomy linkage was written.

Tooling limitation:

- `supabase functions serve resolve-taxonomy` still exits in this Windows
  environment with an `ENAMETOOLONG` spawn error.
- The direct Deno harness exercised the same exported request handler against
  local Supabase Auth/PostgREST/DB and real GBIF, but official gateway behavior
  must still be verified in Phase 24D-3 after deployment.

## Deployment Readiness

Before deploying the Edge Function in a later phase:

1. Install/verify Supabase CLI.
2. Install/verify Deno.
3. Confirm the target Supabase project and environment privately.
4. Confirm `0007` is applied in the target DB.
5. Confirm the function runtime has server-side Supabase env values available.
6. Run Deno tests.
7. Serve the function locally.
8. Test authenticated resolve/confirm with a disposable approved test account.
9. Verify no secret-like logs.
10. Deploy only after explicit approval.

Do not put service-role values in frontend code, `VITE_*` variables, docs, or logs.

## Remaining Risks

- Official local `supabase functions serve` remains PARTIAL on this Windows
  machine because of the `ENAMETOOLONG` runtime error.
- The trusted function has not been deployed remotely.
- Live authenticated invocation against the shared Supabase project has not been
  tested.
- The newer `@supabase/server` wrapper was not adopted in this phase; reassess once Edge Function tooling is installed.
- Upload/create/edit UI is not integrated yet.
- No observation taxonomy linkage is written yet.
- Phase 24E must decide the exact UI state wiring for `학명 확인`.

## Next Recommended Phase

```text
Phase 24D-3 - Deploy Resolve-Taxonomy And Run Live Resolver Smoke
```

Recommended scope:

- Manually confirm target Supabase project and required function secrets.
- Deploy only the `resolve-taxonomy` Edge Function after explicit approval.
- Use an authenticated test session against the shared Supabase project.
- Run exact, cache-hit, synonym, confirmation, wrong-confirmation, higher-rank,
  and no-match smoke without upload UI integration.
- Verify remote cache writes and RLS boundaries with safe read-only checks.
- Do not integrate upload UI yet.
