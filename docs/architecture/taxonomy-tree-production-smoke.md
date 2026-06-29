# Taxonomy Tree Production Smoke

Phase: 25D-2 - Production Taxonomy Tree Smoke And Phase 25 Closeout

Status: Production smoke PASS and Phase 25 closeout ready on `main`.

## Scope

Phase 25D-2 fast-forwarded `main` to the verified Phase 25 feature branch,
pushed `main` normally, and verified the taxonomy tree browsing MVP in
Production.

No force push, rebase, squash, migration, migration 0012, remote mutation SQL,
`supabase db push`, Edge Function redeploy, Supabase Auth/Storage/Kakao/Admin
setting change, Vercel config change, or new public observation creation was
performed.

## Deployment

- Main commit before closeout documentation: `7301f49`.
- Production deployment commit: `7301f49`.
- Deployment environment: Production.
- Build status: PASS.
- Build log secret review: PARTIAL.
- Production URL and project identifiers are intentionally not recorded.

## Corrected Public Taxa Read Verification

Phase 25D-1 used a table-level SELECT privilege check for `public.taxa`. That
check was too strict for the applied Phase 24 schema because `public.taxa` uses
column-level SELECT grants plus the `"Public can read accepted taxa"` RLS
policy.

Corrected read-only verification result after the Phase 25D-2 pre-merge check:

| Check | Result |
| --- | --- |
| Approved taxonomy-linked observation count > 0 | PASS |
| Approved taxonomy root count > 0 | PASS |
| Plantae or expected root exists | PASS |
| `Taraxacum officinale` species count at least 1 | PASS |
| `taxonomy_name_resolutions` remains server-only | PASS |
| `public.taxa` any-column read for public roles | PASS |
| `"Public can read accepted taxa"` policy exists | PASS |
| Direct taxonomy table writes denied | PASS |
| Pending/rejected taxonomy count not used | PASS |
| Legacy null-taxonomy count safe | PASS |

The original table-level `public.taxa` SELECT result is recorded as a
verification-query mismatch, not a Production blocker.

## Production Browser Smoke

Operator-reported result:

| Check | Result |
| --- | --- |
| HTTPS page loads | PASS |
| Refresh does not produce 404 | PASS |
| Navbar loads | PASS |
| Public observation list loads | PASS |
| Existing detail opens | PASS |
| Existing image loads if present | PASS |
| Raw email appears | PASS, none seen |
| Secret-like console output | PASS, none seen |
| Kakao map or static fallback | PASS |
| `분류 탐색` panel | PASS |
| Root nodes or empty state | PASS |
| Node counts | PASS |
| Expand/collapse | PASS |
| Children lazy-load | PASS |
| Expanding does not filter automatically | PASS |
| Node selection | PASS |
| Active taxonomy filter chip | PASS |
| Map/list filtering | PASS |
| Clear taxonomy filter | PASS |
| Existing broad taxon filter | PASS |
| Search + taxonomy AND semantics | PASS |
| Legacy excluded while taxonomy filter active | PASS |
| Legacy visible after clear | PASS |
| Detail lineage | PASS |
| Reported scientific name | PASS |
| Accepted scientific name | PASS |
| Rank labels | PASS |
| Source attribution | PASS |
| Raw UUID/source key/raw JSON appears | PASS, none seen |
| Safe nickname | PASS |
| Legacy detail | PASS |
| GBIF request during browsing | PARTIAL, network check unknown |
| Direct `taxonomy_name_resolutions` exposure | PASS by static scan |

## Production DB Verification

Operator reported the corrected read-only Production DB verification as
`all_true=yes` after smoke.

No row data, UUIDs, source keys, credentials, URLs, object paths, or user data
were recorded.

## Security And Boundary Notes

- Public reads remain approved-only by repository code and RLS design.
- Pending/rejected observations remain excluded from tree counts and public
  filter results.
- Tree/detail/map/list code does not call GBIF or the resolver Edge Function.
- Public UI does not access `taxonomy_name_resolutions`.
- Frontend code does not use service-role credentials.
- No direct UI writes to taxonomy tables were added.
- No migration or live DB mutation was performed in Phase 25.

## Remaining Follow-ups

- GBIF network absence during Production browsing was not fully proven by a
  browser network panel review, though static scans confirm tree/map/detail
  paths do not call GBIF or the resolver.
- Build log secret review remains PARTIAL.
- The public observation list page does not yet have its own taxonomy tree
  panel.
- Server-side read-only RPC/view/materialized cache remains a future scale
  option if client-side filtering becomes slow.
- Legacy taxonomy backfill/admin relink workflow remains a separate future
  design task.
- A dedicated taxonomy browsing page remains deferred unless later requested.
