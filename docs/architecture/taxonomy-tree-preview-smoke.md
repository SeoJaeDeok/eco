# Taxonomy Tree Preview Smoke

Phase: 25D-1 - Vercel Preview Smoke For Taxonomy Tree Map Filtering

Status: Preview smoke documented on
`feature/phase-25c-taxonomy-tree-map-filter`.

## Scope

Phase 25D-1 pushed the Phase 25 feature branch for Vercel Preview and verified
the taxonomy tree browsing MVP before any merge to `main`.

This phase did not merge `main`, push `main`, change migrations, run remote SQL,
run `supabase db push`, redeploy Edge Functions, change Vercel Production
settings, change Supabase Auth/Storage/Kakao settings, create observations, or
deploy Production.

## Preview Environment

The operator confirmed Preview frontend environment variables were ready.

Required names only:

- `VITE_OBSERVATION_REPOSITORY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`
- `VITE_KAKAO_MAP_JAVASCRIPT_KEY`

No variable values, URLs, keys, tokens, passwords, emails, UUIDs, object paths,
or project identifiers were recorded.

## Deployment Result

- Feature branch push: PASS.
- Vercel status check for the branch commit: PASS.
- Preview HTTP response: PASS, HTTP 200.
- Preview environment: Preview branch deployment, not an intentional
  Production deployment.
- Build log secret review: PARTIAL, because the operator did not report a full
  line-by-line build-log review.

## Preview Browser Smoke

Operator-reported result:

| Check | Result |
| --- | --- |
| Basic site loads | PASS |
| `분류 탐색` panel | PASS |
| Expand/collapse | PASS |
| Node selection | PASS |
| Active taxonomy filter chip | PASS |
| Clear taxonomy filter | PASS |
| Map/list filtering | PASS |
| Search + broad taxon + taxonomy filter combination | PASS |
| Detail lineage | PASS |
| Legacy detail | PASS |
| Secret-like console output | PASS, none seen |
| GBIF request during tree browsing | PARTIAL, not observed/unknown |

No new public observation was created during this smoke.

## Read-Only DB Verification

Operator-reported boolean result:

| Check | Result |
| --- | --- |
| Approved taxonomy-linked observation count > 0 | PASS |
| Approved taxonomy root count > 0 | PASS |
| Plantae or expected root exists | PASS |
| Pending/rejected taxonomy count not used | PASS |
| Legacy null-taxonomy count safe | PASS |
| `taxonomy_name_resolutions` server-only | PASS |
| Direct taxonomy table writes denied | PASS |
| Plantae count at least 1 | PASS |
| `Taraxacum officinale` species count at least 1 | PASS |
| `public.taxa` public read ready | PARTIAL/RISK |

Follow-up split check:

| Privilege check | Result |
| --- | --- |
| `anon` can SELECT `public.observations` | true |
| `authenticated` can SELECT `public.observations` | true |
| `anon` can SELECT `public.taxa` | false |
| `authenticated` can SELECT `public.taxa` | false |

Interpretation:

- Preview UI smoke passed, so the deployed app path was usable in the tested
  scenario.
- The direct table privilege check for `public.taxa` did not pass for `anon` or
  `authenticated`.
- Before merging Phase 25 to `main`, Phase 25D-2 should confirm whether this
  privilege result is expected under the current RLS/grant model or requires an
  explicitly approved SQL/RLS correction.
- Phase 25D-1 did not change grants, policies, migrations, or live data.

## Security Notes

- No GBIF call was added or intentionally triggered by tree/map/list/detail
  code.
- Public UI does not access `taxonomy_name_resolutions`.
- Frontend code does not use a service-role key.
- The Preview smoke did not expose raw emails, internal UUIDs, source taxonomy
  keys, raw JSON, credentials, or function URLs.
- Tree counts remain intended to be based on approved taxonomy-linked
  observations only.

## Remaining Risks

- GBIF network absence was not fully proven by browser network inspection and
  remains PARTIAL for Preview.
- Build log secret review remains PARTIAL.
- `public.taxa` direct SELECT privilege checks returned false for both `anon`
  and `authenticated`; this needs review before Production merge/closeout.
- Production has not changed and has not been smoked for the Phase 25 tree UI.

## Next Step

```text
Phase 25D-2 - merge into main, run Production taxonomy tree smoke, create Phase 25 archive, and close Phase 25
```
