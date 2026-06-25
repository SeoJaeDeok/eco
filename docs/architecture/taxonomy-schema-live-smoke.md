# Taxonomy Schema Live Smoke

Phase: 24C - Taxonomy Schema Manual Apply And Compatibility Verification

Status: PASS. Migration `0007_create_taxonomy_schema.sql` was manually applied and verified. Phase 24 remains open.

## Goal

Verify that the Phase 24B taxonomy schema/RLS migration can be applied to the active Supabase database without breaking existing observation browsing, image display, authenticated legacy create, owner edit, approved-only public visibility, or taxonomy security boundaries.

한국어 요약: taxonomy DB 구조를 실제 DB에 적용한 뒤 기존 사이트 기능이 그대로 동작하는지 확인했습니다.

## Target Database

- Target DB category: shared with Vercel Production.
- Browser smoke origin: not explicitly recorded.
- No new Production UI deployment occurred.
- No app code change was required.
- No push was performed.

## Applied Migration

- Migration file: `supabase/migrations/0007_create_taxonomy_schema.sql`.
- Apply method: operator manually applied SQL in Supabase SQL Editor.
- Migration `0007` is now immutable.
- Do not edit, rerun, or replace `0007`.
- Future DB corrections require a separately reviewed new migration.
- Rollback SQL was not run.

## Manual Apply Result

| Check | Result |
| --- | --- |
| Preflight passed | PASS |
| Migration apply succeeded | PASS |
| Post-apply schema checks passed | PASS |
| Observation count remained unchanged | PASS |
| Existing taxonomy linkage remained null | PASS |
| `taxa` public SELECT readiness | PASS |
| Browser taxonomy write-denial metadata checks | PASS |
| Approved-only observation policy remained present | PASS |
| Owner/admin protection objects remained present | PASS |

## Schema Verification

| Check | Result |
| --- | --- |
| `public.taxa` exists | PASS |
| `public.taxonomy_name_resolutions` exists | PASS |
| Observation taxonomy columns exist and remain nullable | PASS |
| Existing observations retained null taxonomy linkage | PASS |
| Public read from `public.taxa` succeeds | PASS |
| Public read from `public.taxonomy_name_resolutions` is denied | PASS |
| Browser taxonomy writes are denied by metadata/policy checks | PASS |
| Existing approved-only policy remains present | PASS |
| Existing owner/admin update protection remains present | PASS |

## Foreign-Key Verification

The original FK verification query returned `false` because it used brittle text matching against the rendered constraint definition.

A corrected relational metadata query using `information_schema.table_constraints`, `key_column_usage`, and `constraint_column_usage` returned:

```text
observation_taxon_id_fk_exists_corrected = true
```

Interpretation:

- The original result was a verification-query false negative.
- The actual foreign key from `public.observations.taxon_id` to `public.taxa.id` exists and is valid.

## Automated Public Regression

| Check | Result |
| --- | --- |
| Working tree clean | PASS |
| Migration `0007` unchanged | PASS |
| Forbidden tracked paths absent | PASS |
| `git diff --check` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS |
| Public observation list | PASS |
| Existing detail | PASS |
| Existing image loading | PASS |
| Approved observations visible | PASS |
| Pending/rejected public exposure absent | PASS |
| Public SELECT from `public.taxa` | PASS |
| Public SELECT from `taxonomy_name_resolutions` denied | PASS |
| Admin route hidden from Navbar | PASS |
| Anonymous edit control hidden | PASS |
| Signed-out upload gate | PASS |
| Public email exposure absent | PASS |
| Secret-like console output absent | PASS |

## Legacy Create And Edit Smoke

| Check | Result |
| --- | --- |
| Existing public list/detail/image flow | PASS |
| Legacy observation create after migration | PASS |
| New observation appeared publicly | PASS |
| Safe nickname display | PASS |
| Raw email not displayed | PASS |
| Owner edit | PASS |
| Scientific-name edit from the test value to the edited test value | PASS |
| Edited description persisted | PASS |
| Anonymous edit button hidden | PASS |
| Signed-out upload gate visible | PASS |

The smoke used a clearly marked Phase 24C compatibility test observation. Do not treat this as taxonomy resolution implementation; no taxonomy resolver or GBIF lookup exists yet.

## Read-Only SQL Result

| Safe check | Result |
| --- | --- |
| `observation_found = true` | PASS |
| `matching_observation_count = 1` | PASS |
| `observation_status_is_approved = true` | PASS |
| `observer_profile_matches = true` | PASS |
| `taxon_id_is_null = true` | PASS |
| `taxonomy_match_type_is_null = true` | PASS |
| `taxonomy_confidence_is_null = true` | PASS |
| `taxonomy_verified_at_is_null = true` | PASS |
| `scientific_name_matches_expected_edit = true` | PASS |
| `public_approved_policy_exists = true` | PASS |
| `owner_update_policy_exists = true` | PASS |
| `admin_update_policy_exists = true` | PASS |
| `taxonomy_guard_trigger_exists = true` | PASS |
| `observation_taxon_fk_exists_corrected = true` | PASS |

## Boundary Result

- App code changed: no.
- Package files changed: no.
- Migration SQL changed after apply: no.
- Storage settings changed: no.
- Auth settings changed: no.
- Admin app code changed: no.
- Kakao settings changed: no.
- Vercel settings changed: no.
- DNS changed: no.
- GBIF called: no.
- Taxonomy rows created by Codex: no.
- Supabase Edge Function created: no.
- Commit/push during live apply: no.

## Remaining Work

Phase 24D should implement the trusted resolver path:

- Create `TaxonomyRepository`.
- Add deterministic mock taxonomy fixtures.
- Add a trusted Supabase Edge Function.
- Check local taxonomy cache before GBIF.
- Normalize and validate GBIF responses.
- Upsert `taxa` and successful resolution-cache rows through the trusted server boundary.
- Return safe normalized resolution results.

Phase 24D should not integrate upload UI yet and should not require taxonomy on observation creation yet.
