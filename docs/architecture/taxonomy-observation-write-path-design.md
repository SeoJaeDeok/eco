# Taxonomy Observation Write Path Design

Phase: 24E-1 - Taxonomy-Linked Observation Write Path Design And Migration Candidate

Status: migration candidate prepared. No remote SQL was applied. No Upload UI
integration was implemented.

## Goal

Design the safe path for creating future observations with verified taxonomy
linkage after the user explicitly resolves a scientific name.

한국어 요약: 이 단계는 업로드 화면을 바꾸지 않고, 나중에 검증된 학명 결과를 관찰 기록에 안전하게 붙이기 위한 DB/RPC 설계와 migration 후보를 준비합니다.

## Current DB And Resolver State

Already applied and verified:

- `0007_create_taxonomy_schema.sql`
  - creates `public.taxa`
  - creates `public.taxonomy_name_resolutions`
  - adds nullable taxonomy columns to `public.observations`
- `0008_grant_taxonomy_service_role_access.sql`
  - grants trusted service-role SELECT/INSERT/UPDATE on taxonomy cache tables
- `0009_revoke_taxonomy_service_role_delete.sql`
  - removes unnecessary service-role DELETE and is replay-safe
- `resolve-taxonomy` is deployed and authenticated live smoke passed.

Current invariant:

- Browser clients can read accepted taxa from `public.taxa` through the
  column-level SELECT grants and `"Public can read accepted taxa"` RLS policy
  created by `0007`.
- Browser clients cannot write `public.taxa`.
- Browser clients cannot read or write `public.taxonomy_name_resolutions`.
- Browser clients cannot directly insert or update observation taxonomy columns.
- Existing observations remain valid with null taxonomy linkage.

## Current Create Audit

Current public signed-in creation path:

1. `UploadMockPage` builds a `CreateObservationInput`.
2. In Supabase mode, `supabaseObservationRepository.createObservation` requires a signed-in user.
3. The repository loads the user's profile display name.
4. If an image exists, Storage upload happens before DB insert.
5. The mapper builds a direct `public.observations` insert payload.
6. The insert sets:
   - `name`
   - `scientific_name`
   - `taxon`
   - `location`
   - `observed_date`
   - `description`
   - `latitude`
   - `longitude`
   - optional `image_path`, `image_mime_type`, `image_size_bytes`
   - `status = 'approved'`
   - `observer_id = auth user id`
   - optional safe `observer_display_name`
7. The current mapper omits:
   - `taxon_id`
   - `taxonomy_match_type`
   - `taxonomy_confidence`
   - `taxonomy_verified_at`

Current DB policy after `0007` allows authenticated direct creates only when
all observation taxonomy linkage fields remain null. Existing create therefore
still works for legacy rows.

Image order:

- The image is uploaded before the observation row is inserted.
- If the DB insert fails, an orphan Storage object can remain.
- This is an existing MVP risk and remains relevant for the taxonomy-linked
  create path.

## Current Edit Audit

Current owner/admin edit UI exposes:

- `name`
- `scientificName`
- `taxon`
- `location`
- `date`
- `description`
- `coords`

Current owner/admin update mappers send only content/location fields and omit
status, observer fields, image fields, `image_url`, timestamps, and taxonomy
metadata.

After `0007`, `public.guard_observation_edit_fields()` additionally blocks:

- direct changes to `taxon_id`
- direct changes to `taxonomy_match_type`
- direct changes to `taxonomy_confidence`
- direct changes to `taxonomy_verified_at`
- direct `scientific_name` changes when `old.taxon_id is not null`

Result:

- Legacy rows with `taxon_id is null` can continue current owner/admin content
  edits, including scientific-name edits.
- Taxonomy-linked rows can still edit other content fields.
- Taxonomy-linked rows cannot change `scientific_name` through the direct edit
  path, preventing stale taxonomy linkage.

## Option Comparison

| Option | Summary | Security | Fit |
| --- | --- | --- | --- |
| A. Loosen browser policies | Let authenticated clients send non-null taxonomy columns directly. | Weak. A malicious browser could forge `taxon_id`, match type, confidence, or timestamp unless policies become very complex. | Not recommended. |
| B. SECURITY DEFINER RPC | Browser calls a narrow Postgres function that verifies cached taxonomy and inserts the row. | Stronger. The browser cannot write taxonomy columns directly; the function verifies trusted cache rows and sets metadata itself. | Recommended MVP. |
| C. New Edge Function | Browser calls a new trusted server function that writes the observation through service-role. | Strong, but adds deployment/secrets/logging surface and another function before UI integration. | Viable later, more complex than needed now. |
| D. Attach taxonomy later | Keep direct create unchanged, then a trusted step attaches taxonomy afterward. | Safer than direct browser writes, but creates partial-state and orphan/rollback complexity. | Defer. |

Why not Option A:

- Supabase uses shared `anon` and `authenticated` API roles for browser traffic.
- Column grants and RLS would have to prove that a client-supplied taxonomy
  payload exactly matches a trusted resolver result.
- It is easier and safer to keep browser taxonomy column grants revoked.

Why Option B:

- It matches Supabase's RPC capability.
- It does not require a new remote Edge Function deployment.
- It keeps UI components Supabase-free by adding a repository method later.
- It keeps service-role secrets out of the browser.
- It can verify `taxa` and `taxonomy_name_resolutions` from inside the database.

Official Supabase references used:

- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Securing your API: https://supabase.com/docs/guides/api/securing-your-api
- Database Functions: https://supabase.com/docs/guides/database/functions
- JavaScript RPC: https://supabase.com/docs/reference/javascript/rpc
- Edge Function auth and secrets remain relevant for the existing resolver:
  https://supabase.com/docs/guides/functions/auth and
  https://supabase.com/docs/guides/functions/secrets

## Selected MVP Architecture

Use a narrow authenticated SECURITY DEFINER RPC:

```text
public.create_observation_with_verified_taxonomy(...)
```

The Upload UI later passes only normal observation fields plus:

- reported scientific name
- accepted `taxonId` returned by `TaxonomyRepository`

The client must not send:

- arbitrary lineage
- accepted scientific name as authority
- match type as authority
- confidence as authority
- verified timestamp
- observer id
- status
- role/admin fields
- taxonomy cache rows

The RPC verifies:

- the user is signed in through `auth.uid()`
- the user's profile exists
- the accepted taxon exists in trusted `public.taxa`
- the reported scientific name has a successful server-only
  `taxonomy_name_resolutions` row for that `taxon_id`
- optional image path belongs to the authenticated user's Storage path
- browser roles still do not have direct taxonomy column write privileges

The RPC sets:

- `status = 'approved'`
- `observer_id = auth.uid()`
- safe observer display snapshot from `public.profiles`
- `scientific_name = reported scientific name`
- `taxon = derived broad project taxon` from accepted lineage
- `taxon_id = trusted taxa.id`
- `taxonomy_match_type = trusted cache match type`
- `taxonomy_confidence = trusted cache confidence`
- `taxonomy_verified_at = now()`

## Scientific Name Storage Decision

Keep `public.observations.scientific_name` as the user-entered/reported
scientific name.

Do not add new observation columns in Phase 24E-1.

Reason:

- `0007` already documented this field as the reported scientific name.
- `public.taxa.accepted_scientific_name` stores the accepted identity.
- The foreign key from observations to taxa provides the accepted taxonomy link.
- Adding another reported-name column would duplicate current meaning.

## Broad Taxon Decision

The RPC derives the existing broad `observations.taxon` value from trusted
accepted lineage:

1. class `Insecta` -> `곤충`
2. class `Aves` -> `조류`
3. class `Mammalia` -> `포유류`
4. class `Amphibia` or `Reptilia` -> `양서/파충류`
5. kingdom `Plantae` -> `식물`
6. kingdom `Fungi` -> `균류`
7. otherwise -> `기타`

The browser should not be allowed to override the broad taxon for a
taxonomy-linked create. This keeps broad filters consistent with accepted
taxonomy.

## Image Upload Interaction

The current implementation uploads Storage first, then inserts the DB row.

For Phase 24E MVP:

- Keep this order initially to avoid broad Storage redesign.
- The future Supabase repository method should upload the image first, then call
  the RPC with `image_path`, `image_mime_type`, and `image_size_bytes`.
- The RPC validates that the path matches the authenticated user-owned
  `observations/{auth.uid()}/...` pattern.
- If the RPC fails after upload, an orphan image can remain.

Mitigation:

- Keep the existing manual orphan cleanup runbook.
- Preserve `upsert: false`.
- Keep DB rows storing paths only, never signed/public/blob/data URLs.
- Consider a later server-side create/upload orchestration only if orphan volume
  becomes a real operational problem.

## Owner/Admin Edit Contract

MVP recommendation:

- Support create-time taxonomy linkage first.
- Do not implement edit-time taxonomy relinking in Phase 24E-1.
- If `taxon_id is null`, legacy owner/admin edits continue as today.
- If `taxon_id is not null`, direct scientific-name changes remain blocked by
  `guard_observation_edit_fields()`.
- Other content edits may continue if they do not change the linked scientific
  name or taxonomy metadata.

Future UI behavior:

- For taxonomy-linked rows, disable or hide scientific-name editing until a
  re-resolution edit flow exists.
- Admin should follow the same consistency rule unless a separate trusted admin
  taxonomy relink path is designed.

## Repository Plan For Later Phases

Add later, not in Phase 24E-1:

```ts
createObservationWithVerifiedTaxonomy(input): Promise<Observation>
```

Suggested input shape:

- normal observation fields
- image file
- resolved taxonomy result containing `taxonId`
- reported scientific name from the resolver result

Do not pass:

- arbitrary lineage
- accepted source taxon key as a write authority
- match type
- confidence
- verified timestamp

Mock repository:

- can simulate verified taxonomy by accepting a deterministic resolved fixture.
- should return a taxonomy-linked mock `Observation` shape only after app domain
  types are extended.
- must not mutate `sampleObservations`.

Supabase repository:

- uploads optional image through the existing helper.
- calls `supabase.rpc('create_observation_with_verified_taxonomy', ...)`.
- maps returned row through existing observation mappers.
- keeps form data intact if the RPC fails so the user can retry.

Error mapping:

- unauthenticated -> login required
- invalid taxonomy -> 학명 확인을 다시 해 주세요
- stale/missing cache -> 학명 확인을 다시 실행해 주세요
- image path rejected -> 사진 업로드를 다시 시도해 주세요
- generic DB failure -> 잠시 후 다시 시도해 주세요

## Migration Candidate

Created:

```text
supabase/migrations/0010_create_taxonomy_observation_write_path.sql
```

Objects:

- `public.normalize_taxonomy_input_key(text)`
- `public.create_observation_with_verified_taxonomy(...)`

Security model:

- `authenticated` can execute the RPC.
- `anon` cannot execute the RPC.
- `public` cannot execute the RPC.
- `public`, `anon`, and `authenticated` cannot directly execute the internal
  `normalize_taxonomy_input_key(text)` helper.
- Browser roles still cannot directly write observation taxonomy columns.
- Browser roles still cannot write `public.taxa`.
- Browser roles still cannot read or write `public.taxonomy_name_resolutions`.
- Existing approved-only public read remains unchanged.

No remote SQL was applied in this phase.

Phase 24E-2A correction:

- The first remote apply attempt failed at the migration postcondition because
  `anon` could execute the create RPC through default function execute grants.
- The migration was corrected before successful application.
- `0010` now explicitly revokes function execution from `public`, `anon`, and
  `authenticated`, then grants only the create RPC back to `authenticated`.
- The helper remains internal and is not directly executable by browser roles.

Phase 24E-2C runtime-expression repair:

- The corrected 0010 was manually applied, but the trusted RPC live smoke later
  failed at runtime with SQLSTATE `42883`.
- The selected RPC architecture remains unchanged.
- The failure was caused by `pg_catalog.nullif(...)` and
  `pg_catalog.coalesce(...)` inside the RPC body.
- PostgreSQL treats `NULLIF` and `COALESCE` as SQL conditional expressions, not
  ordinary `pg_catalog` functions.
- Migration candidate
  `0011_repair_taxonomy_observation_rpc_runtime_expressions.sql` redefines the
  same trusted create RPC with runtime-valid `nullif(...)` and `coalesce(...)`,
  and re-applies the same authenticated-only execute model.
- The failed smoke did not create an observation.

Phase 24E-2B smoke after 0011:

- The selected RPC architecture was verified against the shared Supabase DB.
- A signed-in approved test user resolved `Taraxacum officinale` and created
  one approved observation through the trusted RPC.
- The observation has non-null taxonomy linkage and metadata.
- Owner content edit still works, and direct scientific-name edit on the
  taxonomy-linked row is blocked safely.
- Anonymous RPC execution and direct browser taxonomy writes remain denied.
- The browser visual list/detail smoke remains PARTIAL, but public approved API
  compatibility passed.

Phase 24E-3 Upload UI integration:

- The Upload UI now requires explicit taxonomy verification before submit.
- The UI calls `TaxonomyRepository`, not GBIF or Supabase directly.
- Supabase create uses `createObservationWithVerifiedTaxonomy(...)`, which calls
  the trusted RPC instead of direct browser taxonomy-column writes.
- After a resolved result, the broad taxon selector is derived from taxonomy and
  locked against conflicting manual edits.
- Taxonomy-linked owner/admin edits lock scientific-name and broad-taxon fields
  until a future re-resolution edit flow is designed.
- Image upload cleanup is attempted if the upload succeeds but trusted RPC
  create fails.
- Browser visual smoke remains PARTIAL in this Codex session.

## Rollout Plan

1. Phase 24E-2C: manually apply `0011` and verify the RPC runtime repair.
2. Phase 24E-2B: trusted RPC smoke with safe test data. Completed with browser
   visual UI checks still PARTIAL.
3. Phase 24E-3: add repository method, Upload UI `학명 확인` state/button, and
   trusted RPC create integration. Completed locally with browser visual smoke
   still PARTIAL.
4. Require a resolved or confirmed taxonomy result before taxonomy-required
   submission.
5. Verify legacy rows and legacy direct create compatibility.
6. Defer taxonomy-linked scientific-name edit/re-resolution to a later phase.

## Remaining Risks

- The RPC normalizes lookup keys in SQL with trim, whitespace collapse, and
  lowercase. It does not perform full Unicode NFC normalization like the
  TypeScript resolver.
- The upload-before-RPC order can still leave an orphan image if Storage cleanup
  fails after an RPC error, but the repository now attempts scoped cleanup of
  only the just-uploaded object.
- Browser visual smoke for the new Upload UI is PARTIAL in Phase 24E-3.
- Existing public list queries still use broad observation rows; future phases
  should narrow selected columns before taxonomy data usage grows.
