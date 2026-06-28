# Taxonomy Resolver Live Smoke

Phase: 24D-3 - Deploy resolve-taxonomy Edge Function And Run Authenticated Live Resolver Smoke

Date: 2026-06-29

Status: PASS with one log-review limitation.

## Scope

This smoke deployed only the existing `resolve-taxonomy` Supabase Edge
Function to the Supabase project shared with Production and tested it through a
signed-in approved test account.

No upload UI integration was added. No `학명 확인` button was added. No
observation taxonomy metadata was written. No migration SQL, Vercel setting,
Storage setting, Auth setting, Kakao setting, Admin app behavior, or Production
UI was changed.

## Deployment

| Check | Result |
| --- | --- |
| Target category | shared Supabase project |
| Function name | `resolve-taxonomy` |
| Function deployment | PASS |
| `--no-verify-jwt` avoided | PASS |
| `supabase db push` avoided | PASS |
| Remote migration SQL avoided in this phase | PASS |

The deployed function URL and project reference are intentionally not recorded.

## Runtime Configuration

Required environment names from the function source:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Secret values were not printed, stored in documentation, or added to frontend
`VITE_*` variables.

## Authentication

| Check | Result |
| --- | --- |
| No-token request returns HTTP 401 | PASS |
| No-token request wrote no target cache row | PASS |
| Approved email/password test session obtained | PASS |
| JWT/access token printed or stored | PASS, no |
| Service-role credential used as user substitute | PASS, no |

The initial login retry failed when the script selected a legacy masked key.
The live smoke succeeded after selecting the current publishable project key in
memory. No key value was printed or stored.

## Live Resolver Matrix

| Case | Expected behavior | Result |
| --- | --- | --- |
| First `Homo sapiens` lookup | `resolved`, accepted species, mammal lineage | PASS |
| Second `Homo sapiens` lookup | `resolved`, cache hit | PASS |
| `Felis concolor` lookup | confirmation or already cached accepted `Puma concolor` result | PASS |
| Synonym confirmation | `resolved`, accepted `Puma concolor` identity | PASS |
| Wrong confirmation key | HTTP 409 / safe conflict | PASS |
| `Homo sapines` lookup | `needsConfirmation`, candidate `Homo sapiens` | PASS |
| `Homo` lookup | `blocked` higher-rank behavior | PASS |
| `Xyzabc nonexistentii` lookup | `blocked` no-match behavior | PASS |

GBIF returned usable responses during this bounded smoke. No timeout, HTTP 429,
or GBIF 5xx was observed.

## Remote Cache And DB Verification

Read-only checks against the shared Supabase DB returned safe counts/booleans
only.

| Check | Result |
| --- | --- |
| total taxonomy accepted rows after smoke | 2 |
| total successful resolution rows after smoke | 2 |
| `Homo sapiens` accepted taxon exists once | PASS |
| `homo sapiens` resolution exists once | PASS |
| repeated exact lookup created no duplicates | PASS |
| `Puma concolor` accepted taxon exists once | PASS |
| `felis concolor` resolution exists once after confirmation | PASS |
| unconfirmed `homo sapines` resolution absent | PASS |
| higher-rank `homo` resolution absent | PASS |
| no-match resolution absent | PASS |
| observation taxonomy linkage count | 0 |
| no observation received `taxon_id` or taxonomy metadata | PASS |

Row IDs, source taxon keys, Auth details, raw classification JSON, and row
contents are intentionally not recorded.

## RLS And Permissions

| Check | Result |
| --- | --- |
| `service_role` has schema `public` USAGE | PASS |
| `service_role` SELECT/INSERT/UPDATE on `public.taxa` | PASS |
| `service_role` DELETE on `public.taxa` | PASS, false |
| `service_role` SELECT/INSERT/UPDATE on `public.taxonomy_name_resolutions` | PASS |
| `service_role` DELETE on `public.taxonomy_name_resolutions` | PASS, false |
| anon taxonomy writes denied | PASS |
| authenticated taxonomy writes denied | PASS |
| anon access to resolution cache denied | PASS |
| authenticated access to resolution cache denied | PASS |
| `public.taxa` public SELECT policy exists | PASS |
| resolution-cache public policy count | PASS, 0 |
| taxonomy table RLS enabled | PASS |

## Log And Privacy Review

Result: PARTIAL.

The repository-local Supabase CLI exposes function list/deploy commands, but no
hosted Edge Function log retrieval command was available in this CLI surface.
Therefore hosted runtime logs were not directly reviewed by Codex.

Privacy checks that were completed:

- The function source contains no `console.log` calls.
- Temporary smoke scripts wrote only booleans/counts and were deleted.
- Smoke output did not include JWTs, access tokens, emails, passwords, keys,
  source taxon keys, row IDs, project refs, function URLs, or raw GBIF
  responses.

Manual Dashboard log review remains optional before Phase 24E if stricter
operations evidence is required.

## Boundaries

Not changed:

- Upload UI
- Observation create/update behavior
- Owner/admin edit UI
- Migration SQL
- RLS policies
- Storage settings
- Auth settings
- Admin app code
- Kakao settings
- Vercel configuration
- Production UI

Changed remotely:

- `resolve-taxonomy` Edge Function deployment.
- Taxonomy cache data was written by the trusted function during smoke.

## Remaining Risks

- Hosted function logs were not directly reviewed because the available CLI did
  not expose a log retrieval command.
- The upload UI still does not call `TaxonomyRepository`; Phase 24E must add the
  explicit `학명 확인` button and state handling.
- Existing legacy observations intentionally remain unlinked to taxonomy.

## Next Step

```text
Phase 24E - connect Upload UI to TaxonomyRepository with explicit 학명 확인 button, without changing existing legacy observations
```
