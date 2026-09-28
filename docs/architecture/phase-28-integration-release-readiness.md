# Phase 28 Integration And Release Readiness

## Decision And Evidence Scope

- Review date: 2026-09-28 (Asia/Seoul), documentation-only review.
- **NOT READY for release:** confirmed default-mock public-data/year-option
  contract mismatch (B1 below), plus outstanding browser and live read checks.
- No new user manual PASS was supplied. All 16 requested 28B checks are NOT_RUN.
  The blank-screen correction is implemented, not operator-confirmed resolved.
- Code/tests/packages/settings are unchanged in this review. No merge, push,
  Preview/Production deployment, promotion, SQL or data write was performed.
- Prior Phase 26/27 Production or Preview authorization is not reusable here.
  Phase 28 remains open; this document is not deployment approval.

**한국어:** 구현은 브랜치에 있지만 배포 준비 완료는 아닙니다. 기본 mock 앱의
연도 선택 연결 문제를 확인했고, 사용자 화면 확인 16개와 Supabase 실조회도
남아 있습니다. 이번에는 문서만 정리하며 코드나 설정을 바꾸지 않았습니다.

## Verified Git Snapshot

- Branch: `feature/phase-28b-observation-month-filter`, clean on entry.
- BASE_MAIN: local main and freshly fetched origin/main both `a3887a7`.
- Reviewed candidate: `6a52cd3`, range `a3887a7..6a52cd3`.
- Actual pre-record range: 11 commits, 31 files (17 source, 11 test/fixture,
  3 documentation). No unrelated changes found in this range.
- This review adds a documentation commit; its actual hash belongs in the final
  Git report, not in its own document. Re-derive the candidate/range after any fix.
- Preserved: Phase 28A branch `dea0ad2`, Phase 27C branch `258daaa`, Phase 26 fix
  branch `d7d5e27`, `backup/before-phase-26-kakao-production` at `813a819`,
  and `backup/before-phase-27-production` at `2059adb`.
- Phase 27 Production visual evidence stays tied to `258daaa`; the docs-only
  `a3887a7` deployment status is still unobserved, not inferred from Git.

Reviewed commits, oldest first:

```text
6088059 feat: paginate public observations in pages of twenty
8cdd850 docs: record phase 28a observation pagination
9bc55d7 feat: reuse page transitions for observation pagination
04063eb docs: record observation pagination transitions
02db6ec fix: prevent scroll jumps during observation pagination
dea0ad2 docs: record phase 28a pagination verification
cc908f5 feat: filter eco map observations by month
e5d5798 docs: record phase 28b observation month filtering
420689f fix: restore map date filter fixture rendering
48bd5c4 feat: add year selection to eco map date filters
6a52cd3 docs: record year and month filter verification
```

Complete file scope of that snapshot:

```text
docs/architecture/eco-map-observation-month-filter.md
docs/architecture/next-session-handoff.md
docs/architecture/observation-list-pagination.md
src/App.tsx
src/components/AppRoutes.tsx
src/components/MapPage.tsx
src/components/Navbar.tsx
src/components/ObservationListPage.tsx
src/components/observations/ObservationListHeader.tsx
src/components/observations/ObservationPagination.tsx
src/components/observations/ObservationTaxonFilter.tsx
src/repositories/mockObservationRepository.ts
src/repositories/observationRepository.ts
src/repositories/observationRepositoryProvider.ts
src/repositories/supabase/observationPageQuery.ts
src/repositories/supabase/supabaseObservationRepository.ts
src/utils/observationFilters.ts
src/utils/observationMonth.ts
src/utils/observationPagination.ts
src/utils/pageTransition.ts
tests/fixtures/map-month-filter-browser.mjs
tests/fixtures/map-month-filter.html
tests/fixtures/map-month-filter.mjs
tests/fixtures/observation-pagination-browser.mjs
tests/fixtures/observation-pagination.html
tests/fixtures/observation-pagination.mjs
tests/map-filter-layout.test.mjs
tests/map-month-fixture.test.mjs
tests/observation-month-filter.test.mjs
tests/observation-pagination-ui.test.mjs
tests/observation-pagination.test.mjs
```

## Public Date And Status Contract: B1

**Confirmed compatibility blocker, not a reported live Supabase failure.**

| Layer inspected | Actual contract / behavior |
| --- | --- |
| `src/types.ts:46` | `Observation.status` exists but is optional; the type alone does not guarantee approved-only content |
| `observationDbTypes.ts` | DB row status is required; `observed_date` is a string representing the schema's date column |
| `supabaseObservationRepository.ts:161` | Map collection read selects observation columns and explicitly filters `status = approved`; no date/status omission |
| `observationMappers.ts:101` and `:116` | `observed_date` becomes `date`, and `row.status` becomes `status` unchanged |
| `mockObservationRepository.ts:32` | Returns the existing local sample collection without adding status; no DB or mapper path |
| `sampleObservations.ts` | Six records, all with valid 2026 dates and no status property |
| `observationFilters.ts:120` | Existing map compatibility admits undefined/sample/approved, and rejects pending/rejected |
| `observationMonth.ts:40` | Year options require explicit approved, excluding all six displayed default mock records |
| Month fixture and current tests | Synthetic public records explicitly carry approved; fixture-only success does not cover the default mock contract |

Fresh **local read-only diagnostic**, not the full test suite or browser smoke:
called actual `mockObservationRepository.listObservations()`, then existing date,
map and year helpers. Returned 6, displayed 6, valid dates 6, missing status 6,
date years `[2026]`, extracted year options `[]`. Only aggregate values were
printed, not observation bodies/coordinates. A separate synthetic mapper probe
confirmed that an approved row keeps its date/status and contributes a year.
No Supabase client/request or mutation was used by these probes.

Conclusion: an empty year list is **not explained by absent/invalid dates** in
the default mock app. Its public display and new year-option rules disagree.
The earlier note that mock years may be absent is now a confirmed mismatch,
not an accepted harmless limitation. Fixture records with approved status avoid
this path; existing passing tests leave an integration coverage gap.

Supabase is different: repository filtering plus existing RLS own approved-only
access, the mapper retains status, and the year helper adds a local check. No
status-dropping mapper defect was found. This source/probe result does not prove
live records, RLS or deployed queries work; those remain NOT_RUN.

Minimum separately approved correction proposal:

1. Make the reviewed local mock public samples' status contract explicit at their
   public read boundary (or explicitly classify those known samples), keeping
   original sample data immutable. Review list/detail/map consistency together.
2. Do **not** globally treat unknown/undefined status as approved, relax the year
   guard for arbitrary input, expose pending/rejected, or change Supabase/RLS.
3. Add a regression through the actual default mock repository into year extraction
   and MapPage, not only the approved synthetic fixture. Keep hidden/unknown-status
   negative tests and mapped approved/legacy positive tests.
4. Re-run affected tests and final checks after that separate code change, then
   reconsider Preview readiness. No fix or test edit is made by this document.

**한국어:** 일반 mock 화면은 날짜가 있는 6개 기록을 보여주지만 승인 상태 표시가
없어서 연도 선택지만 비어 있습니다. Supabase 쪽은 승인 상태가 정상 전달됩니다.
모든 빈 상태를 승인으로 간주하는 우회 대신, 검토된 로컬 샘플의 공개 읽기 계약과
회귀 테스트를 좁게 수정하는 별도 작업이 필요합니다.

## Integration Boundary Review

Source and existing tests were inspected in this session; historical automated
PASS is not a newly executed or live PASS.

| Area | Confirmed implementation / existing automated coverage | Manual or live evidence | Readiness implication |
| --- | --- | --- | --- |
| 28A page query | Page size 20, positive bounded page, approved predicate and search/taxon/photo predicates before inclusive range; exact matching count and ID tie-break order | Supabase NOT_RUN | Required Preview read check |
| 28A search/photo semantics | Fixed columns and escaped quoted patterns; registered image references, not signing success; same builder for data/count and range recovery | Real regex/collation/legacy photos NOT_RUN | SDK transport tests use injected fetch, not PostgreSQL |
| 28A detail/images | Selected ID refresh; page state outside detail; signing/prefetch for returned page rows, selected-image retry retained | Real detail/images NOT_RUN | Do not use fixture as live evidence |
| 28A fade/no auto-scroll | Card-only shared opacity targets, reduced motion, stale-response/transition guards; pagination calls no scroll/focus API | Original scroll defect operator PASS after 02db6ec; new checklist repeat NOT_RUN | Preserve original PASS, do not expand device/exception coverage |
| App list/map separation | App full-read effect only for home/intro/map; list owns page query, receives revision not collection; map receives independent observations | Live separation NOT_RUN | Home may already read full collection before list entry; distinguish that from a new list-triggered download |
| 28B calendar/filtering | Strict observed-date year/month parsing, no timezone/creation-date substitution; one year AND OR-months AND existing conditions | All new operator items NOT_RUN | UI/live evidence remains outstanding |
| 28B options/reset | Years from unfiltered map source; missing selection retained; independent date/taxonomy clears and all-filter reset | Default-mock diagnostic exposes B1 | Confirmed blocker, not only untested behavior |
| 28B result/tree boundaries | Same filtered array for map/compact list/count; tree keeps separate global approved-linked summaries, lazy branches/cache; date change not an effect dependency for taxonomy requests | Supabase/tree/date integration NOT_RUN | Do not interpret tree counts as current date-filter counts |
| Phase 26 map behavior | Provider/resize/layout files unchanged against main; no new camera commands or SDK calls | Actual Kakao PARTIAL | Real-domain verification later, separate from static fixture |
| Fixture initialization | Explicit local repository/static renderer into actual MapPage; module/init/render error categories | Blank-screen correction operator NOT_RUN | Historical HTTP/module checks do not prove browser rendering |

Map `listObservations()` and tree summary reads remain single API requests subject
to the configured server row cap, whose live value was not checked. The list's
20-row range does not propagate to either. “All years in May” describes filtering
the loaded collection, **not completeness of all DB observations/years**. No new
RPC, page-aggregation loop, map pagination or count redesign is proposed here.
Short final list pages may reduce document scroll range; no pixel-position or
fixed-height guarantee is introduced.

## User Report And Verification Ledger

The exact 16-item NOT_RUN checklist and blank error summary are recorded in
[the year/month record](eco-map-observation-month-filter.md#operator-checklist-at-integration-review).
Counts 33/27/28/13/12/0 remain fixture expectations, not measured results.

| Evidence | Status in this review |
| --- | --- |
| Blank fixture visibly resolved | Operator NOT_RUN; correction exists in code |
| 28B year/month counts, state, clears, layout and ordinary app controls | Operator NOT_RUN, all supplied items unchanged |
| 28A automatic top-scroll fix | Historical operator-reported local PASS, no new browser run |
| Full Node suite/typecheck/build | Historical 156 PASS / typecheck PASS / build PASS from year implementation recorded at 6a52cd3, not rerun here |
| Dev-inclusive dependency audit | Historical all-severity zero at that implementation check, not a new audit or permanent guarantee |
| Current-session diagnostics | Local mock contract mismatch reproduced; synthetic mapper date/status preserved, no live I/O |
| Current-session document checks | Diff, Markdown fences/tables, whitespace/EOF, secret-like diff and forbidden tracked paths checked before commit |
| Fixture/ordinary app browser | No new Codex browser attempt; previous direct visual evidence remains PARTIAL |
| 28A and 28B actual Supabase | NOT_RUN |
| Kakao local/Preview | PARTIAL; known domain constraints, no setting changes |
| Preview / Production deployment | Not performed or authorized for Phase 28 |

Docs-only typecheck/build skip follows the project working guide's explicit
exception. Full tests/audit were not rerun: no code or package change and no push
or release is being executed. New read-only probes do not change the historical
suite count. No server/address availability was rechecked in this document session.

## Later Approved Preview Plan

Recommended route **after B1 is addressed**: authorize normal feature-branch push
and a Git-linked Preview, verify actual Supabase reads there, and defer only real
Kakao behavior if the Preview domain is restricted. Preview authentication/data
configuration and branch scope must be checked without printing values before
that future push. No setting edits are pre-authorized. UI checks can use the static
fallback, but a mock repository is not evidence of Supabase query success.

Use existing public observations only, without SQL, new records/accounts, mail,
edits or deletes. The operator may inspect DevTools locally; report only safe
PASS/PARTIAL/FAIL, aggregate counts, page/range behavior and error categories.
Do not request raw responses, HAR, headers, account details, keys or coordinates.

| Mandatory live check | Read-only procedure and evidence to retain |
| --- | --- |
| List range and count | Observe page-one/page-two request offsets 0/20 and limit 20 (or corresponding ranges), at most 20 rows, exact condition count and final page range |
| Search before range | Use a known later-page public record and search for its non-sensitive name; it must appear on search page one; exercise Korean and punctuation where existing data permits |
| Taxon/photo conditions | Combine existing broad taxa and registered-photo choices; verify items and total count use identical conditions, including photo reference with display failure when naturally available |
| Legacy/detail/images | Open an existing legacy record and image; close/reopen and check page retention, selected-ID read and runtime image retry without saving |
| No list full download | Inspect requests associated with list entry/paging, distinguish earlier home/map full reads, and confirm image work is limited to page/detail rather than every observation |
| Actual date/year options | Compare safe existing displayed observation dates with available years; year set must be from loaded approved map data before filtering, not creation date or list page |
| Date combinations/clears | Choose an available year and months; verify AND/OR, independent clears, retained empty selection, collapse state, shared map/list/count result |
| Map read range and separation | Confirm map source is not current 20 items; document observed row-cap uncertainty separately and distinguish tree global counts from current results |
| Ordinary UI regressions | Narrow/wide, keyboard, card fade, no pagination top-scroll; retain approval boundaries and test data limitations |

If fewer than 21 real public records or no suitable legacy/photo/date examples
exist, mark those cases PARTIAL, retaining synthetic coverage separately. Do not
manufacture shared data to complete the matrix or infer a configured cap from a
short response alone. Any failure needs safe minimal reproduction and a separately
scoped correction, not automatic RLS/DB/Auth changes.

## Gates And Next Decision

- **Confirmed blocker B1:** default mock displayed-data/year-option inconsistency;
  requires separate narrow code/test correction before ready status.
- **Unverified, not confirmed defects:** supplied operator checklist, live
  Supabase queries/count/search/images/dates/separation, browser layout and Kakao.
- After correcting B1 and reviewing checks, user decides whether to authorize
  feature-branch Preview push and read-only integrated smoke. That authorization
  does not permit main push, Production deployment or promotion.
- Any later Production decision requires a newly reviewed candidate, fresh checks,
  actual recovery target and immediate operator test readiness. Preserve Phase 26
  marker/security fixes; no historical rollback command or approval is reused.
- This record performs no rollback/revert, no deployment, no next feature and no
  Phase 28 completion archive.

**한국어:** 다음 배포 경로는 기능 브랜치 Preview에서 실제 Supabase 읽기를 먼저
확인하는 방식입니다. 다만 현재는 B1 수정이 먼저이며, Preview push·실조회 검증도
별도 승인이 필요합니다. 실제 지도가 도메인 제한으로 안 보이는 경우만 별도 운영
검증 대상으로 남기고, 다른 화면 검증까지 완료로 간주하지 않습니다.
