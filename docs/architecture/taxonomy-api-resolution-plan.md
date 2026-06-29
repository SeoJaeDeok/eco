# Taxonomy API Resolution Plan

## Phase And Scope

Original phase: 24A - Scientific Name Resolution API Validation And Taxonomy Integration Design

Phase 24A status: design-only. No app code, package file, Supabase migration, RLS policy, Storage behavior, Auth behavior, Kakao behavior, Admin behavior, Vercel configuration, deployment, merge, or push was part of that phase.

Phase 24B update: a local migration candidate and apply-readiness documentation were prepared. Codex did not apply SQL remotely and did not change application code in Phase 24B.

Phase 24C update: migration `0007_create_taxonomy_schema.sql` was manually applied by the operator to the Supabase project shared with Production and verified. No app code, package file, Edge Function, Vercel setting, Storage setting, Auth setting, Kakao setting, Admin app code, merge, push, or new Production UI deployment occurred.

Phase 24D-1 update: local `TaxonomyRepository`, deterministic mock repository, Supabase function-invoking repository, and `resolve-taxonomy` Edge Function source now exist. The Edge Function was not deployed, upload/edit UI was not integrated, and observation taxonomy linkage is still not written.

한국어 요약: Phase 24D-1에서 학명 확인용 repository와 Edge Function 소스를 로컬에 추가했습니다. 아직 화면에 연결하지 않았고, Edge Function 배포나 Vercel 배포는 하지 않았습니다.

Phase 24D-2 update: local Supabase CLI/Deno/Docker tooling was verified. Local migrations `0001` through `0009` replayed from scratch, including the replay-safe `0009` service-role DELETE revoke. A direct Deno handler harness verified authenticated resolver behavior against the local Supabase stack and real GBIF: exact lookup, cache hit, synonym confirmation, wrong-confirmation conflict, variant confirmation requirement, higher-rank block, and no-match block. Official `supabase functions serve resolve-taxonomy` remains PARTIAL on this Windows machine because it exits with `ENAMETOOLONG`; remote deployment is still deferred to Phase 24D-3.

Phase 24D-3 update: `resolve-taxonomy` was deployed to the Supabase project shared with Production and authenticated live smoke passed. The live smoke confirmed no-token HTTP 401, exact lookup, cache hit, synonym confirmation, wrong-confirmation conflict, variant confirmation requirement, higher-rank block, no-match block, remote cache writes, and RLS/permission boundaries. Hosted log review remains PARTIAL because the available repository-local Supabase CLI surface did not expose hosted function logs. Upload UI integration, observation taxonomy linkage, Vercel deployment, and Production UI changes remain deferred.

Phase 24E-1 update: the selected observation write-path architecture is a narrow authenticated SECURITY DEFINER RPC, not broad browser taxonomy column grants. Migration candidate `0010_create_taxonomy_observation_write_path.sql` creates `public.create_observation_with_verified_taxonomy(...)`, which verifies the signed-in user, trusted cached taxonomy identity, and optional owner image path before inserting an approved observation with taxonomy linkage. Upload UI integration and remote SQL apply remain deferred to Phase 24E-2 or later.

Phase 24E-2B/2C update: migration 0011 repaired the trusted RPC runtime
expressions after 0010 failed with SQLSTATE `42883`. The operator manually
applied 0011 and post-apply checks passed. A live trusted RPC smoke then
created one approved taxonomy-linked observation for `Taraxacum officinale`.
DB verification, owner content edit, scientific-name edit protection,
anonymous RPC denial, and taxonomy permission checks passed. Browser visual UI
smoke remains PARTIAL, and Upload UI integration remains deferred to Phase
24E-3.

Phase 24E-3 update: Upload UI taxonomy verification is implemented locally on
`feature/phase-24e3-upload-taxonomy-ui`. The Upload UI now uses an explicit
`학명 확인` button, requires a `resolved` taxonomy state before submit, displays
accepted classification and lineage, supports explicit synonym/variant
confirmation, and creates new records through the trusted RPC repository path.
The browser does not call GBIF directly and does not write taxonomy columns
directly. Browser visual smoke is PARTIAL because the in-app browser connector
was unavailable in this Codex session. No migration, remote SQL, Edge Function,
Vercel, or Production UI change was made.

Phase 24F-1 update: local manual Upload UI smoke passed on
`feature/phase-24f1-upload-taxonomy-smoke`. The operator verified submit
blocking before taxonomy verification, exact plant creation with
`Taraxacum officinale`, dirty-state invalidation, synonym and variant
confirmation, higher-rank and no-match blocking, public list/detail
compatibility, and owner/anonymous regression. Read-only DB verification passed
for the created no-image taxonomy-linked observation. No Preview/Production
deployment, migration, Edge Function redeploy, Vercel change, or push was
performed.

Phase 24F-2 update: the feature branch was pushed, Vercel Preview deployment
succeeded, Preview Upload UI taxonomy smoke passed, and read-only DB
verification passed for the Preview-created no-image taxonomy-linked
observation. Production deployment was not performed in Phase 24F-2.

Phase 24F-3 update: the verified Phase 24 history was fast-forwarded into
`main`, pushed normally, and deployed to Vercel Production. Production Upload
UI taxonomy smoke passed for `Taraxacum officinale`, including submit blocking
before `학명 확인`, exact plant create, dirty-state invalidation,
synonym/variant confirmation, higher-rank/no-match blocking, public
list/detail compatibility, owner edit, anonymous edit-hidden behavior, and
read-only DB taxonomy linkage verification. Phase 24 is archived as Verified
in `docs/eco/phase-history/phase-24.md`.

Phase 25A update: stored taxonomy data now becomes the source for taxonomy tree
browsing design. Public browsing must use `public.taxa` joined with approved
`public.observations` only. GBIF is not called during browsing, map rendering,
public list rendering, detail modal rendering, search, or taxonomy-tree
expansion. `public.taxonomy_name_resolutions` remains server-only and is not a
public browsing data source.

## Phase 24B Schema Update

Phase 24B prepared the schema/RLS migration candidate in:

```text
supabase/migrations/0007_create_taxonomy_schema.sql
```

Apply-readiness notes live in:

```text
docs/architecture/taxonomy-schema-rls-apply-readiness.md
```

Final Phase 24B database decisions:

- Keep existing `observations.scientific_name` as the user-entered/reported scientific name.
- Do not add a separate `reported_scientific_name` observation column in the MVP.
- Add `public.taxa` as the accepted terminal taxonomy cache with flattened lineage columns.
- Add `public.taxonomy_name_resolutions` as a server-only successful query-resolution cache.
- Add nullable `observations.taxon_id`, `taxonomy_match_type`, `taxonomy_confidence`, and `taxonomy_verified_at`.
- Keep existing observations valid when these fields are `NULL`.
- Keep `observations.taxon` and current broad filters unchanged.
- Allow public reads of accepted `taxa` rows.
- Deny browser writes to authoritative taxonomy cache data.
- Deny direct browser edits to observation taxonomy linkage fields.
- Defer the trusted Supabase Edge Function/RPC write path to Phase 24D.

This Phase 24B migration was later manually applied by the operator in Phase 24C. Codex did not run remote SQL.

## Phase 24C Live Schema State

Confirmed after manual apply:

- `public.taxa` is available as the accepted terminal taxonomy cache table.
- `public.taxonomy_name_resolutions` is available as the server-only successful resolution cache.
- Nullable observation taxonomy columns are available: `taxon_id`, `taxonomy_match_type`, `taxonomy_confidence`, and `taxonomy_verified_at`.
- Existing observations remained valid and retained null taxonomy linkage.
- Public authoritative taxonomy read through `public.taxa` is available.
- Browser writes to authoritative taxonomy/cache tables are denied.
- The existing approved-only public observation policy remained present.
- Existing owner/admin edit protection remained present.
- The original foreign-key verification query had a false negative due brittle text matching; the corrected relational metadata query confirmed the actual `observations.taxon_id -> taxa.id` foreign key exists.
- The trusted write path is still required in Phase 24D.
- No taxonomy resolver, Supabase Edge Function, upload UI integration, or observation taxonomy requirement exists yet.

## Phase 24D-1 Resolver Foundation State

Local implementation now includes:

- `TaxonomyRepository` contract.
- Scientific-name normalization helper with a 200 code point limit.
- Deterministic broad taxon mapper from accepted lineage to the existing project groups.
- Deterministic mock taxonomy repository fixtures.
- Supabase taxonomy repository that invokes `resolve-taxonomy`.
- Trusted Edge Function source under `supabase/functions/resolve-taxonomy/`.
- GBIF response mapper for exact accepted, synonym, variant, higher-rank-only, no-match, and malformed cases.
- Local cache lookup before GBIF.
- Trusted upsert path for `taxa` and successful `taxonomy_name_resolutions` rows inside the function.
- Node pure tests and Deno test source.

Still not done:

- Official local Supabase gateway serve remains PARTIAL on Windows due an `ENAMETOOLONG` error; the exported request handler passed a direct local Deno authenticated smoke.
- No upload/create/edit UI integration.
- No observation `taxon_id` writes.
- No taxonomy requirement on new observation creation.
- No remote apply of the Phase 24E-1 observation write-path RPC candidate.

## Current Project Findings

- `Observation.scientificName` is currently a required string in the app domain model, but create/update inputs allow `scientificName?: string`.
- The upload form currently shows `학명 (선택사항)` and submits `undefined` when the field is blank.
- `validateObservationInput()` currently requires only `name`, `taxon`, `location`, `date`, and `coords`.
- Supabase stores `observations.scientific_name` as nullable text.
- Existing broad `Taxon` values are exactly:
  - `식물`
  - `포유류`
  - `조류`
  - `곤충`
  - `양서/파충류`
  - `균류`
  - `기타`
- Public Supabase reads use `ObservationRepository` and filter `status = 'approved'`.
- New Supabase creates are authenticated direct-approved creates and set owner/profile/image fields through repository mappers.
- Owner/admin edits currently allow content/date/location/coordinate/description plus `scientificName` and broad `taxon`.
- Owner/admin update payload mappers intentionally exclude protected fields such as status for owners, observer fields, image fields, `image_url`, and timestamps.
- There are no taxonomy tables, `taxon_id` observation relation, taxonomy migrations, taxonomy RLS policies, taxonomy repository, Supabase Edge Functions, or Vercel serverless endpoints in the current repository.
- The `supabase/` directory currently contains only `migrations/`; no `supabase/functions/` or Supabase CLI config was found.

한국어 요약: 지금 학명은 선택 입력이고, broad 분류군은 한국어 7개 값입니다. taxonomy 전용 DB/서버/저장소는 아직 없습니다.

## Locked Interaction Decision

Use an explicit `학명 확인` button.

Rules:

- Do not call GBIF automatically while the user types.
- Do not use debounced/background taxonomy lookup.
- Pressing Enter may later trigger the same action as `학명 확인`, but only as an explicit equivalent.
- Editing the scientific-name text after a resolution immediately invalidates the previous result.
- Never silently reuse a result for different input text.
- Do not erase the user's other upload/edit fields after lookup failure.
- Do not submit while resolution is pending.

한국어 요약: 사용자가 버튼을 누를 때만 학명을 확인합니다. 입력 중 자동 조회는 하지 않습니다.

## Official API Decision

Primary source:

- GBIF technical documentation: `https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation`
- GBIF API reference: `https://techdocs.gbif.org/en/openapi/`

Selected API:

```text
GET https://api.gbif.org/v2/species/match
```

Selected checklist:

```text
7ddf754f-d193-4cc9-b351-99906754a03b
```

Checklist meaning:

- Catalogue of Life eXtended Release, documented by GBIF as the primary GBIF backbone source for the new API.

Request shape:

- `scientificName`
- `checklistKey`

Response areas to use:

- `usage`
- `acceptedUsage`, when present
- `classification`
- `diagnostics.matchType`
- `diagnostics.confidence`
- `synonym`
- `issues`, when present
- `usage.rank`
- `usage.status`
- source taxon key fields such as `usage.key` and `acceptedUsage.key`

Important validated behavior from Phase 24A probes:

- Accepted exact species return `usage.status = ACCEPTED`, `usage.rank = SPECIES`, `diagnostics.matchType = EXACT`, `synonym = false`.
- A misspelled `Homo sapines` returned `diagnostics.matchType = VARIANT`, not a field named `fuzzy`.
- A genus-only input returned a valid `GENUS` usage but no `SPECIES` rank in `classification`.
- A no-match input returned HTTP 200 with `diagnostics.matchType = NONE` and no `usage`.
- A synonym input returned `synonym = true`, `usage.status = SYNONYM`, and an `acceptedUsage`.

한국어 요약: 공식 GBIF v2 species match API와 COL XR checklist를 기준으로 삼습니다. 실제 응답에서는 오탈자가 `VARIANT`로 돌아올 수 있습니다.

## UX State Machine

| State | Meaning | Button | Submit | Display behavior |
| --- | --- | --- | --- | --- |
| `empty` | No scientific name text | Disabled | Blocked | Ask for a scientific name |
| `dirty` | User entered or changed text; old resolution invalid | Enabled | Blocked | Show that confirmation is needed |
| `resolving` | One lookup request is in progress | Disabled | Blocked | Keep every form field and show checking copy |
| `resolved` | Accepted result confirmed | Enabled for recheck | Allowed | Show normalized classification |
| `needsConfirmation` | Synonym or variant candidate needs user confirmation | Confirmation controls | Blocked until confirmed | Show entered name and accepted/candidate name |
| `blocked` | Higher-rank-only, no match, ambiguous, or unusable result | Enabled for retry after edits | Blocked | Explain what must change |
| `error` | Timeout, HTTP error, malformed response, or rate limit | `다시 확인` enabled | Blocked | Preserve every form field |

Proposed Korean copy:

| Situation | Korean copy |
| --- | --- |
| Empty input | `학명을 입력해 주세요.` |
| Dirty input | `학명 확인 후 등록할 수 있습니다.` |
| Checking | `학명을 확인하고 있습니다.` |
| Exact accepted result | `{acceptedName}로 확인되었습니다.` |
| Synonym result | `입력한 학명은 동의어로 보입니다. 현재 인정명은 {acceptedName}입니다. 이 이름으로 연결할까요?` |
| Variant/fuzzy suggestion | `철자가 다른 후보를 찾았습니다: {candidateName}. 이 학명이 맞나요?` |
| Higher-rank-only match | `종 단위까지 확인되지 않았습니다. 속이나 과가 아니라 종 학명을 입력해 주세요.` |
| No match | `일치하는 학명을 찾지 못했습니다. 철자와 표기를 확인해 주세요.` |
| Incomplete lineage | `일부 분류 단계는 정보가 없습니다. 없는 단계는 '정보 없음'으로 표시됩니다.` |
| API timeout | `확인 시간이 초과되었습니다. 입력 내용은 그대로 유지됩니다.` |
| HTTP 429 | `요청이 잠시 많아 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.` |
| Retry | `다시 확인` |
| Confirm candidate | `이 학명으로 연결` |
| Reject candidate | `다시 입력` |

한국어 요약: 실패해도 사용자가 입력한 다른 관찰 정보와 이미지는 지우지 않습니다.

## Match Acceptance Policy

The policy must use actual GBIF fields, not a guessed confidence threshold.

| Case | GBIF field pattern | MVP decision | Storage result |
| --- | --- | --- | --- |
| Exact accepted species | `usage.rank = SPECIES`, `usage.status = ACCEPTED`, `diagnostics.matchType = EXACT`, `synonym = false`, species lineage exists | Auto-mark `resolved` after explicit button click | Store accepted taxon; set observation taxonomy metadata |
| Exact accepted infraspecific taxon | Terminal rank such as `SUBSPECIES`, `VARIETY`, or `FORM`, accepted status, species ancestor exists | Allow after exact accepted match; show terminal rank and species ancestor | Store terminal accepted key and species ancestor fields |
| Exact synonym | `synonym = true` or `usage.status = SYNONYM` or `acceptedUsage` exists | `needsConfirmation`; do not silently replace | Save reported name on observation and accepted name/key on `taxa` |
| Variant/fuzzy species candidate | Species-level accepted candidate, full enough lineage, `diagnostics.matchType = VARIANT` or another non-exact candidate type | `needsConfirmation`; no auto-confirm. Safer MVP: allow only explicit confirmation for a single species-level candidate; otherwise block | Store reported text plus confirmed accepted taxon |
| Higher-rank match | `usage.rank` is genus/family/order/class/phylum/kingdom and no species rank | `blocked` | No new observation submit |
| Multiple or ambiguous candidates | Issue flags or response shape indicates ambiguity | `blocked` for MVP unless a later admin/user picker is designed | No new observation submit |
| No match | No `usage` and match type such as `NONE` | `blocked` | No new observation submit |
| Incomplete classification | Accepted species/infraspecies but some standard lineage ranks are missing | Accept if terminal species/infraspecies is valid; never invent missing ranks; display `정보 없음` for missing ranks | Store null missing rank fields and raw compact classification JSON |
| Missing species ancestor for infraspecific result | Infraspecific terminal rank without usable species ancestor | `blocked` | No new observation submit |
| Malformed response | Required response fields cannot be validated | `error` | No write |
| Timeout | Request exceeds configured timeout | `error` | No write |
| HTTP 429 | Rate limited | `error` with specific Korean copy | No write |
| GBIF 5xx | Upstream failure | `error` | No write |

Confidence policy:

- Do not invent an arbitrary numeric cutoff in Phase 24A.
- Use confidence as a displayed/admin diagnostic and stored observation metadata.
- Exact accepted species can resolve even if confidence differs by taxon, as seen with `Amanita muscaria` returning confidence 97 while other exact species returned 99.
- Non-exact candidate types such as `VARIANT` require explicit confirmation or blocking regardless of high confidence.

한국어 요약: 숫자 점수만 보고 자동 승인하지 않습니다. 정확한 accepted species만 바로 해결 상태로 두고, 동의어나 오탈자 후보는 사용자가 확인해야 합니다.

## Architecture Options

| Option | Evaluation |
| --- | --- |
| A. Browser UI directly calls GBIF | Lowest implementation effort, but weakest data integrity. The browser could forge taxonomy fields, duplicate calls are hard to control, local DB cache writes are awkward, and provider changes leak into UI. CORS may work for public API use, but browser CORS was not validated in this phase. Not recommended for writes. |
| B. `TaxonomyRepository -> Supabase Edge Function -> local DB cache -> GBIF` | Best fit with current Supabase-centered data/Auth/RLS model. The server boundary can normalize input, check cache, call GBIF, validate response, upsert `taxa`, return a compact result, and keep UI behind `TaxonomyRepository`. Auth session forwarding can use the user's Supabase JWT. No GBIF credential is currently required. This repo does not yet contain Edge Function tooling, so Phase 24D must add and verify that setup explicitly. Recommended. |
| C. `TaxonomyRepository -> Vercel serverless endpoint -> local DB cache -> GBIF` | Fits the current production host, including Preview deployments, but adds a second backend surface outside Supabase. DB cache writes would require server-side Supabase credentials in Vercel and careful environment management. A push to `main` can trigger production deployment, so operational blast radius is higher. Keep as fallback if Supabase Edge Functions are rejected. |

Recommended direction:

```text
TaxonomyRepository -> Supabase Edge Function -> local DB cache -> GBIF
```

Reason:

- It preserves the repository boundary already used for observations and auth.
- It lets the server, not the browser, decide which taxonomy fields are trusted.
- It keeps future provider changes behind a single resolver boundary.
- It can later add Korean-name enrichment without changing upload/detail components.
- It can check Supabase Auth/RLS context and avoid trusting client role/admin claims.
- It keeps API calls away from public list/detail/map/tree rendering.

Required setup later:

- Add `supabase/functions/resolve-taxonomy` or equivalent in Phase 24D.
- Add local Edge Function run/deploy instructions.
- Decide whether the function uses user JWT plus RLS-only writes or a narrowly scoped server-side role. Service-role use must never enter frontend code.
- Add timeout, validation, and safe logging in the function.
- Add mock repository fixtures for local/default `mock` mode.

한국어 요약: 추천 구조는 Supabase Edge Function입니다. 다만 현재 저장소에는 Edge Function 폴더가 없으므로, 실제 구현 phase에서 별도 설정이 필요합니다.

## Cache And Performance Rules

Hard rules:

1. No GBIF request during public list loading.
2. No GBIF request while opening the detail modal.
3. No GBIF request during map rendering.
4. No GBIF request during public search/filtering.
5. No GBIF request while browsing the future taxonomy tree.
6. A lookup occurs only after explicit `학명 확인`.
7. The resolver checks local cache before calling GBIF.
8. The same accepted source taxon is stored once and reused.
9. Observation rows reference a taxon record instead of duplicating the complete classification.
10. Public list queries fetch only card-level fields; full classification is for detail or taxonomy-specific UI.
11. Raw API responses are not included in every public list row.
12. Future taxonomy tree nodes use stored data only and load/aggregate lazily.

Cache approach:

- Primary cache table: `taxa`, unique by source/checklist/source accepted taxon key.
- Resolver first checks exact local accepted/canonical-name matches when the input is already an accepted name.
- Phase 24B adds `taxonomy_name_resolutions`, a server-only successful query-resolution cache keyed by normalized reported input text, source, and checklist.
- The resolution cache points to accepted `taxa.id` and avoids repeated GBIF calls for exact accepted names, synonyms, and user-confirmed variants.
- Do not cache no-match, timeout, HTTP 429, GBIF 5xx, or malformed response results.
- Stale cache refresh should happen only during explicit lookup, never during public render. Candidate stale window: 180 days, with a manual "refresh taxonomy" path later if needed.

Performance risks:

- Loading many observations client-side.
- `select('*')` on public list queries.
- Joining full taxonomy/classification JSON into every card row.
- Missing indexes on lineage keys and `observations.taxon_id`.
- Repeated API calls for synonyms or variants if aliases are not cached.
- Full expansion of the future tree at once.

Future trigger point:

- Do not implement pagination/server-side search in Phase 24A.
- Revisit pagination, server-side filtering, or RPC count endpoints when approved observation volume makes list/map render time or payload size visibly slow, or when taxonomy tree expansion needs counts beyond a few hundred records.

한국어 요약: GBIF는 버튼 클릭 때만 호출하고, 목록/상세/지도/트리는 저장된 DB 데이터만 사용합니다.

## Database Model Audit And Recommendation

### Model A - One Accepted Terminal Taxon Row With Flattened Lineage

Pros:

- Simple migration and simple Supabase queries.
- One accepted taxon row can be reused by many observations.
- Easy to keep existing `observations.taxon` broad group working.
- Easy public list joins can avoid raw JSON.
- Future tree can aggregate by indexed lineage columns.

Cons:

- Repeats lineage names across accepted terminal taxa.
- Parent-child taxonomy updates are less normalized.
- A fully canonical taxonomy tree may need a later node table or materialized view.

### Model B - One Row Per Taxonomy Node With `parent_id`

Pros:

- Better normalized tree structure.
- Natural parent-child traversal.
- Less lineage duplication.

Cons:

- Higher migration and mapper complexity.
- More upserts per lookup.
- More recursive queries or views needed.
- Larger risk while existing observations and broad filters must remain stable.

Recommended MVP:

Use Model A for Phase 24. Keep a future Model B or materialized tree view as a Phase 25/scale option.

Candidate `taxa` fields:

```text
id uuid primary key
source text not null
source_checklist_key text not null
source_taxon_key text not null
accepted_scientific_name text not null
canonical_name text
terminal_rank text not null
taxonomic_status text not null
kingdom_key text
kingdom_name text
phylum_key text
phylum_name text
class_key text
class_name text
order_key text
order_name text
family_key text
family_name text
genus_key text
genus_name text
species_key text
species_name text
classification_json jsonb
resolved_at timestamptz not null
updated_at timestamptz not null
```

Candidate `observations` additions:

```text
taxon_id uuid null references public.taxa(id)
taxonomy_match_type text
taxonomy_confidence integer
taxonomy_verified_at timestamptz
```

Compatibility note:

- Keep existing `observations.scientific_name` as the user-entered/reported scientific name.
- Do not add `reported_scientific_name` in the MVP because it duplicates current schema/code meaning.
- Store the accepted name and source identity in `taxa`, linked from observations through nullable `taxon_id`.
- Do not rewrite historical `scientific_name` values in Phase 24.
- Direct scientific-name edits remain compatible for legacy rows with `taxon_id = null`.
- Once an observation has `taxon_id`, direct scientific-name edits are blocked until a trusted resolver-backed edit flow is implemented.

Key type decision:

- Store all source taxon keys as `text`, not numeric.
- Phase 24A probes returned keys such as `N`, `CH2`, `6MB3T`, `FN46`, and `4QHKG`, so numeric-only columns would be wrong.

Recommended uniqueness:

```text
unique (source, source_checklist_key, source_taxon_key)
```

Likely indexes:

- `taxa (source, source_checklist_key, source_taxon_key)`
- `taxa (accepted_scientific_name)`
- `taxa (canonical_name)`
- `taxa (kingdom_key)`
- `taxa (phylum_key)`
- `taxa (class_key)`
- `taxa (order_key)`
- `taxa (family_key)`
- `taxa (genus_key)`
- `taxa (species_key)`
- `observations (taxon_id)`
- `observations (status, taxon_id, observed_date desc)` if list/detail/tree reads need it later

Staged rollout:

1. Add nullable taxonomy schema and RLS migration candidate.
2. Manually review and apply the migration in Phase 24C.
3. Implement the trusted resolver/cache path in Phase 24D.
4. Integrate upload/create and owner/admin edit UI in Phase 24E.
5. Smoke locally, in Preview, and then production in Phase 24F after explicit approval.
6. Add later server-side enforcement for new creates.
7. Optional legacy backfill as a separate reviewed phase.

Enforcement without breaking old rows:

- Do not make `observations.taxon_id` globally `NOT NULL` immediately.
- Keep old observations valid with `taxon_id = null`.
- Enforce taxonomy only on new create/update flows through repository/server validation and later insert/update constraints or triggers that apply to new rows or changed scientific names.
- Phase 24B blocks ordinary browser clients from forging taxonomy fields; Phase 24D must add the trusted server write boundary that can upsert cache rows and attach taxonomy metadata.

한국어 요약: MVP는 `taxa` 한 행에 accepted taxon과 표준 lineage를 납작하게 저장하는 방식이 가장 안전합니다. 기존 관찰 기록은 taxonomy 연결이 없어도 계속 유효해야 합니다.

## Broad Taxon Group Integration

Existing broad `Taxon` groups must keep working.

Recommended deterministic mapping:

| Resolved lineage rule | Broad `Taxon` |
| --- | --- |
| `class_name = Insecta` | `곤충` |
| `class_name = Aves` | `조류` |
| `class_name = Mammalia` | `포유류` |
| `class_name = Amphibia` or `class_name = Reptilia` | `양서/파충류` |
| `kingdom_name = Plantae` | `식물` |
| `kingdom_name = Fungi` | `균류` |
| No explicit match | `기타` |

Rules:

- Use an explicit mapping table.
- Prefer the most specific reliable rank first, especially class-level animal groups.
- Do not infer from the Korean/common name.
- Do not use an LLM.
- Do not silently force unknown accepted taxa into an incorrect group.
- Use `기타` as the safe fallback because it already exists in the current `Taxon` type.

Future upload/edit UI recommendation:

- Once taxonomy resolution is required, the manual broad-taxon selector should become a derived read-only preview after a successful lookup.
- It should not remain independently editable after resolution, because that can create mismatch between accepted taxonomy and broad filters.
- In Phase 24A, do not change current filter behavior.

한국어 요약: 학명에서 broad 분류군을 자동 산출하되, 모르면 `기타`로 둡니다. 이름으로 추측하지 않습니다.

## Create And Edit Compatibility

New observation creation:

- Verified scientific name is required.
- Submission stays blocked in `empty`, `dirty`, `resolving`, `needsConfirmation`, `blocked`, or `error`.
- Create input should carry a server-issued or repository-issued taxonomy resolution token/id, not raw client-trusted taxonomy columns.

Owner edit:

- Editing scientific name invalidates the old taxonomy resolution.
- Saving a changed scientific name requires a new successful lookup.
- Editing only non-taxonomy fields can keep the existing `taxon_id`.

Admin edit:

- Admin uses the same taxonomy integrity rules.
- Admin role must not silently bypass scientific-name consistency.
- If a future admin override exists, it must be explicit, audited, and separately approved.

Existing observations:

- Continue displaying normally.
- Keep legacy `scientific_name`.
- Show `분류 정보 미연결` only in places where taxonomy-specific context is expected.
- Do not block public detail or list rendering.

Mock repository mode:

- Use deterministic taxonomy fixtures.
- Do not call GBIF for every mock interaction.
- Include at least one exact species, one synonym confirmation fixture, one variant fixture, and one blocked/no-match fixture for future UI smoke tests.

한국어 요약: 새 기록은 확인된 학명이 필요하지만, 기존 기록은 그대로 보여줍니다. 수정할 때 학명을 바꾸면 다시 확인해야 합니다.

## Security And Integrity Requirements

Preserve existing invariants:

- Public reads remain approved-only.
- Pending/rejected rows remain hidden from public list/detail.
- UI components do not call Supabase directly.
- Public observation operations remain behind `ObservationRepository`.
- Taxonomy access must remain behind `TaxonomyRepository`.
- Auth remains behind `AuthRepository`.
- Admin remains behind `AdminObservationRepository`.
- Storage remains behind repository/helper code.
- Kakao remains behind the map provider.
- No service-role key in frontend code.
- No email public display.
- Admin route remains hidden from `Navbar`.
- No signed/public/blob/data URL in observation rows.

Additional taxonomy requirements:

- Server-side resolver is the normalization boundary.
- Maximum scientific-name input length: 200 Unicode code points after trim/collapse whitespace.
- Normalize Unicode to NFC.
- Collapse repeated whitespace to one space.
- Reject or strip control characters before lookup.
- Request timeout: 8-10 seconds for the GBIF call.
- Prevent duplicate requests through UI `resolving` state and server-side idempotent cache upsert.
- Log only status/category/provider timing; avoid raw stack traces and avoid logging credentials or session tokens.
- Validate API response shape before writing taxonomy rows.
- Store source attribution: `GBIF Species Match API`, checklist key, source taxon key, and `resolved_at`.
- Stale cache refresh happens only after explicit `학명 확인`, not during public rendering.
- Do not trust client role/admin data for taxonomy writes or overrides.

한국어 요약: 분류 정규화와 저장 판단은 서버 쪽에서 해야 합니다. 사용자가 보낸 taxonomy 값을 그대로 믿으면 안 됩니다.

## Failure Handling

- Timeout: stay in `error`, preserve form, show timeout copy, allow retry.
- HTTP 429: stay in `error`, preserve form, show rate-limit copy, allow later retry.
- GBIF 5xx/network error: stay in `error`, preserve form, show calm generic retry copy.
- Malformed response: stay in `error`, do not write cache/taxon rows.
- No match: `blocked`, no submit.
- Higher-rank match: `blocked`, ask for species-level name.
- Synonym/variant: `needsConfirmation`, no submit until confirmed.
- Cache hit: return the stored normalized result without GBIF.

한국어 요약: 실패는 저장 차단이지만, 사용자가 입력한 다른 관찰 정보는 보존합니다.

## Recommended Phase 24 Sequence

Phase 24B:

- Taxonomy schema and RLS migration candidate.
- No remote apply.
- Include nullable `taxa` and observation taxonomy columns.
- Decide whether to include an alias/resolution-cache table in the first migration candidate.

Phase 24C:

- Manual Supabase apply and compatibility verification completed.
- Migration `0007` is now immutable.
- No Codex remote SQL application, app code change, or Production UI deployment occurred.

Phase 24D:

- `TaxonomyRepository`.
- Supabase Edge Function resolver.
- GBIF mapper and response validation.
- Local cache lookup/upsert.
- Mock fixtures.
- Do not integrate upload UI yet.
- Do not require taxonomy on observation creation yet.

Phase 24E:

- Upload and owner/admin edit UI integration.
- Explicit `학명 확인` button.
- Required verified taxonomy for new records.
- Edit invalidation when scientific name changes.

Phase 24F:

- Public detail/search compatibility.
- Existing-data compatibility.
- Local, Preview, and Production smoke.
- Phase 24 archive and deployment decision.

Phase 25:

- Collapsible kingdom to species taxonomy tree using stored taxonomy data only.
- Tree counts come from approved taxonomy-linked observations, not standalone
  taxa rows.
- Legacy observations with `taxon_id IS NULL` remain visible when no taxonomy
  filter is active, but are excluded while a taxonomy tree filter is active.
- Phase 25A design documents:
  `docs/architecture/taxonomy-tree-browsing-design.md` and
  `docs/architecture/taxonomy-tree-query-prototypes.md`.

한국어 요약: Phase 24는 `학명 확인` 업로드 흐름과 신뢰된 taxonomy 연결 생성까지 완료되었습니다. Phase 25에서는 저장된 `taxa`와 승인된 관찰 기록만 사용해 생태지도 안에서 분류 트리를 탐색합니다.
