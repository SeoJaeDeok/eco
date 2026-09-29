# Phase 28 Preview Read Verification

## Current Result And Evidence Boundary

- Record date: 2026-09-29 (Asia/Seoul).
- Branch: `feature/phase-28b-observation-month-filter`. Main/origin/main remain
  `a3887a7`; no Phase 28 Production integration or promotion.
- First pushed Preview: `e81327e`. Operator explicitly confirmed environment
  Preview, matching deployment commit and build PASS. This is deployment evidence,
  not a completed live Supabase matrix.
- During that check the operator reported the Navbar species/records group
  disappearing on the public list. Corrected and normally pushed as `d6c34ca`
  (`fix: preserve public summary across observation pages`).
- **Targeted common-summary smoke: PASS, operator-reported manual verification.**
  In response to the `d6c34ca` Preview follow-up, the operator said
  `에러 없고 검증 완료했어`. Record completion of the requested flow and no reported
  errors in that scope. This is not Codex browser verification or an independent
  audit of numeric accuracy, requests, credentials/logs or all Phase 28 features.
- The follow-up covered common summary across intro/list/map (page two where data
  permits), independence from list search/photo conditions, reload and narrow-header
  layout. Results were reported collectively, not as separate per-case measurements.
  Actual record count, availability of a second page and device coverage were not
  supplied. Do not infer multi-page data sufficiency or all-mobile-device PASS.
- The requested target was the new `d6c34ca` Preview/Ready deployment. The response
  is kept as contextual completion evidence; no separate new structured Dashboard
  environment/commit/build fields or tool-observed status were supplied. The earlier
  explicit `e81327e` deployment fields are not copied to the new commit.

## Environment And Actions

- Operator Dashboard configuration confirmation for this branch: Production branch
  main; feature environment Preview; all-Preview variable scope; no unexpected
  override; repository mode Supabase; shared connection ready. Reuse this already
  confirmed configuration; no values or keys were requested, read or recorded.
- Current deployed runtime mode was not independently inspected through a browser
  or network trace. `정적 디자인 시안` is static UI copy, not a repository-mode signal.
  There is no reported mode mismatch, but mock/fixture evidence is not live evidence.
- Existing Git-linked feature deployment only. No main merge/push, Production
  deployment, Preview promotion or changes to Vercel/Auth/Storage/Kakao settings.
- Verification instructions use existing signed-out public records and normal
  runtime image reads/signing, with no anonymous-auth account creation. No account,
  observation create/update/delete, upload/delete, SQL, migration, RLS/RPC or Edge
  action was performed by Codex. Normal reads may create service traffic/logs;
  this record does not claim zero interaction with remote services.

## Implementation And Evidence Matrix

| Area | Evidence available | Remaining live status |
| --- | --- | --- |
| Common Navbar omission | Confirmed App hide condition removed; actual App/Navbar tests; targeted operator completion after d6c34ca | Defect resolution PASS at guided-flow level; no independent numeric/network audit |
| Common summary semantics | Existing distinct nonempty trimmed names, exact approved record count; independent repository/App state; legacy included | Live numeric comparison and narrow-read request evidence NOT_RUN/unreported |
| List server pagination | Existing actual SDK transport tests: twenty rows, exact count, approved/search/photo/taxon predicates and stable order | Live range/count/request evidence NOT_RUN/unreported; multi-page data sufficiency unknown |
| List result vs common summary | Operator completed targeted filter/summary flow; separate automated page/search counts | Not a complete live search/photo/count accuracy matrix |
| Detail/images/page retention | Existing automated/isolated coverage and earlier local reports | Actual Supabase detail/image/legacy coverage NOT_RUN/unreported |
| Fade/no automatic top scroll | Prior local user PASS and regression tests preserved | No separate Preview result supplied in this summary-only reply |
| Map year/month/options/clears | Earlier local mock/fixture PASS; strict observed-date helpers and MapPage tests | Actual Supabase date comparison/combination matrix NOT_RUN/unreported |
| List/map/tree separation | App source/tests keep independent map collection; tree global linked counts | Actual network/data coverage NOT_RUN/unreported |
| Real Kakao camera/markers/resize | Prior Phase 27 Production history is separate | Phase 28 PARTIAL; fallback UI does not establish real-map PASS |
| Secrets/email/build logs | Safe local diff checks; no raw data requested | No new specific UI/console absence report; build-log review PARTIAL |

The previous 15-item general-mock/date-fixture/pagination-fixture PASS remains
historical evidence. The older 16-item checklist is also preserved as its own
record, not upgraded by this short completion report. Fixture counts 6/33/47 are
not live expected counts.

## Read Budgets And Coverage

- Shared summary reads approved `id,name` only, at most 500 per request and at most
  20 requests / 10,000 records per refresh. It checks exact count, progress, duplicate
  IDs and completion; errors or limits show failure/retry instead of partial totals.
  No image signing/prefetch or full-row collection reads are added for the summary.
  Equal-count concurrent edits may escape these guards: no transactional snapshot.
- List page reads remain twenty records, with same-condition count; no collection
  read is restored on list entry. Home may have already read the map/intro collection
  before navigation, and this must be distinguished from a list-triggered full read.
- Map/tree still make their existing separate reads subject to the configured
  server row cap, whose live value/impact remains unmeasured. Year/date filtering
  describes the loaded collection, not guaranteed completeness of all DB records.
- Summary records, filtered list totals, current map results and linked tree totals
  have different scopes. Do not assume they must all match. No live observation
  total, truncation amount, multi-year coverage or performance measurement was provided.

## Checks And Document Push

- Before `e81327e` feature push: 162 Node tests, typecheck/build PASS, dev-inclusive
  audit zero at that run. Not inherited from the earlier implementation run.
- Before `d6c34ca` correction push: **174 Node tests PASS**, typecheck/build PASS,
  dev-inclusive audit zero. Includes twelve new component/transport tests; no live
  Supabase or browser CSS evidence. This is the prior correction session, not rerun
  by this document update.
- Current document update: diff/Markdown/whitespace/EOF, forbidden tracked/staged
  paths and secret-like additions checked before commit. Fresh dev-inclusive audit:
  zero vulnerabilities. App tests/typecheck/build skipped because only docs change,
  under the working guide's docs-only exception. No package updates or audit fix.
- The documentation commit is normally pushed only to the same feature branch,
  as already authorized. Its source/tests/assets/packages/deployment configuration
  must match `d6c34ca`. New Preview deployment status is unobserved at writing, and
  no visual re-verification of that documentation commit is claimed. Report its
  actual hash/status after push; do not loop status-only commits or amend.

## Next Verification Gate

No repeat of the just-completed common-summary flow is requested. Continue only
the already authorized read-only integration checks that lack evidence:

1. Actual Supabase page range/limit/count/order and server search/photo/taxon filters;
   distinguish narrow summary reads from full observation/image downloads.
2. Existing real detail/images and observed-date/year/month combinations, independent
   clears and list/map data source separation. Mark unsupported data cases PARTIAL.
3. Actual map coverage and Kakao limitations; review logs locally without copying
   keys, headers, full responses, HAR, accounts or coordinates into chat.

Use existing public records, never create test data/accounts or modify settings.
There is no remaining confirmed common-summary defect from the operator report,
but **Production readiness is not established** while the live matrix is incomplete.
Any future Production release needs a separate decision and authorization.

**한국어:** 공통 요약 수정은 사용자에게서 검증 완료·오류 없음 보고를 받았습니다.
다만 서버가 실제로 20개 범위와 전체 count를 보내는지, 실데이터 날짜 필터가 맞는지
등의 별도 확인은 아직 남았습니다. 화면 완료 보고를 전체 실조회 완료로 확대하지 않습니다.
