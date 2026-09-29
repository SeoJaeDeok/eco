# Phase 28 Integration And Release Readiness

## Decision And Evidence Scope

- Latest record review: 2026-09-29 (Asia/Seoul), documentation only.
- **Preview integration verification preparation is possible:** no confirmed
  code blocker remains after B1's six-sample correction. This is **not Production
  deployment readiness**; actual Supabase reads and real Kakao remain unverified.
- The operator explicitly confirms the new **15 items PASS**: general mock app six,
  synthetic date fixture five, synthetic pagination fixture four. This supersedes
  their initial NOT_RUN template only for those items. The old 16-item checklist
  is not upgraded as a batch. No Codex browser or live Supabase PASS is claimed.
- Current review candidate: `5af0ce5`, with correction `419f654`; the intervening
  change is documentation only. No app/test/package or settings change this session.
  No merge/push/deployment, SQL, accounts or observation writes.
- Prior Phase 26/27 Production or Preview authorization is not reusable here.
  Phase 28 remains open; this document is not deployment approval.

**한국어:** 확인된 코드 blocker는 없어 Preview 통합 검증 준비가 가능합니다.
이번 15개 항목은 사용자 수동 확인 PASS이며, 기본 mock 연결 문제도 화면에서 해결됐습니다.
실제 Supabase 조회는 미검증이므로 Production 준비 완료는 아닙니다.

## Current Record And Candidate (2026-09-29)

- Clean existing Phase 28B branch at `5af0ce5`; local main and cached origin/main
  both `a3887a7`. No fetch/remote operation in this documentation task.
- Actual range `a3887a7..5af0ce5`: **14 commits, 34 files**. Both 28A and 28B,
  fixture initialization and the public mock status correction are included.
  Relative to the correction snapshot below, `5af0ce5` updates only three docs.
  The new record-only commit's actual hash is reported after commit, not self-amended.
- Fresh source review confirms: same approved/search/taxon/registered-photo query
  builds items and exact count before 20-row range; stable order; selected detail,
  page-only image handling, card-only fade and no pagination scroll/focus call.
- AppRoutes passes the standalone list a revision, not map observations. App's
  collection read is for home/intro/map. Map date parsing uses observed_date via
  the mapper; one year AND OR-months AND existing filters. Options use unfiltered
  loaded observations, and map/compact list/count share one final filtered array.
  Independent date clears/global reset and mounted tree state remain intact.
- Tree queries retain separate approved-linked global summaries/cache; map/tree
  single reads remain subject to the existing, unmeasured server row cap. Neither
  receives the list's current twenty items. No complete-DB date coverage claim.
- Phase 26 provider/layout, Phase 27 auth/intro behavior, Supabase mapper and
  package/migration/deployment settings remain unchanged by this correction/review.

| Evidence | Current disposition |
| --- | --- |
| B1 correction | Resolved by 419f654 and operator general mock app PASS; six public sample statuses only, no unknown-to-approved fallback or pending/rejected relaxation |
| Operator general mock app | Six items PASS, including six records/year 2026, May six/April zero, month clear and collapse state |
| Operator synthetic date fixture | Five items PASS, including visible actual MapPage, 33/all and 27/May, date combinations/clears, narrow-window keyboard |
| Operator synthetic pagination fixture | Four items PASS: 20/20/7, opacity transition, no automatic top scroll for 1 / 2, detail-close page retention |
| Original 16-item checklist | Preserved as historical NOT_RUN; not converted to all PASS |
| Automated regression | Historical: five focused failures before correction, 26 PASS after, full 162 PASS on 2026-09-28; not rerun |
| Typecheck / build / security audit | Historical PASS / PASS / zero vulnerabilities on 2026-09-28; not rerun |
| Current documentation checks | Diff, Markdown, whitespace/EOF, forbidden tracked paths and secret-like diff checked before commit |
| Codex browser / server checks | Not performed this session; earlier tool/HTTP evidence is historical |
| Actual Supabase 28A and 28B | NOT_RUN, explicitly excluded from the user's completion report |
| Actual Kakao | PARTIAL, separate from mock/static checks |

Detailed confirmed items and the operator's clarification are recorded in
[the date-filter follow-up](eco-map-observation-month-filter.md#operator-follow-up-after-mock-correction-2026-09-29).
No reported FAIL or new code defect is established, but the blank error field is
not independently verified absence of errors. Docs-only typecheck/build skip is
permitted by the working guide; no code/dependency change or release is performed.
The next action needs **separate feature-branch Preview push/deployment and read-only
verification approval**. No old approval is reused and no deployment starts here.

## Historical Correction And Verification (2026-09-28)

The following results are retained from the implementation session, not rerun
or newly observed by the 2026-09-29 documentation review.

- Continued from `bacecae` on the existing Phase 28B branch. Main and cached
  origin/main remain `a3887a7`; no remote operation is performed in this follow-up.
- Corrected code candidate: `419f654 fix: align public mock observations with approval status`.
  Range `a3887a7..419f654`: 13 commits / 34 files before this documentation commit.
  Since the historical snapshot below, add `bacecae` (integration review) and
  `419f654` (correction). New paths are this readiness document,
  `src/data/sampleObservations.ts` and `tests/mock-observation-public-contract.test.mjs`;
  the other changed paths remain listed below. The next doc-only commit does not
  claim its own hash or a deployed/visually verified candidate.
- `src/data/sampleObservations.ts`: six explicit approved properties, no other
  field changes. This supplies collection/page/detail and App/MapPage. Admin uses
  Supabase's separate admin provider. Separate taxonomy fixtures retain pending/
  rejected states. No general approval fallback or year-filter relaxation.
- New `tests/mock-observation-public-contract.test.mjs` (five tests) and one
  `tests/map-filter-layout.test.mjs` test cover the real default data/repository,
  actual MapPage handlers, legacy dates, page/detail consistency and negative status
  boundaries. Existing tests cover unchanged Supabase approved query/mapper paths.
- Before six source additions: focused 26 tests, 21 PASS / 5 FAIL. After: 26 PASS.
  New full suite: **162 PASS, 0 failed, 0 skipped**. Typecheck/build PASS. Fresh
  `npm.cmd audit --include=dev --audit-level=high --json`: all severities 0.
  Diff/Markdown/whitespace/EOF/secret/forbidden-path checks pass before commits.
- Verified ordinary mock source dates independently: six in May 2026; unique year
  `[2026]`, May/all six, April zero. Legacy dates retained. Synthetic date fixture
  33/27/28/13/12/0 and list fixture 20/20/7 are unchanged, not live results.
- Port 3005 serves current workspace MapPage and matching sample source; mock mode
  checked without printing configuration. Root, fixture HTML/module proxy and
  entry transforms respond. Browser connection fails before inspection, so both
  ordinary-app and fixture visual checks remain **PARTIAL**. HTTP is not render PASS.
- All 16 user checks remain **NOT_RUN**. Actual Supabase is NOT_RUN, Kakao PARTIAL;
  no new operator PASS. Prior 28A scroll-fix manual PASS is retained.
- This closes the code-level B1 blocker only. It does not complete live RLS/query,
  screen, device or release verification. Follow the read-only Preview plan below
  only after separate authorization; no shared test data is to be created.

## Historical Verified Git Snapshot Before Correction

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

## Historical Public Date And Status Contract: B1

**Confirmed at the original review, corrected by the follow-up above.** This was
not a reported live Supabase failure. The table/probe describe the pre-fix source.

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

Original separately approved correction proposal (now implemented at sample source):

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

**한국어:** 이전 진단에서는 날짜가 있는 6개 기록에 승인 상태가 없어 연도 선택지가
비었습니다. 이후 승인된 수정으로 해당 공개 샘플만 명시적으로 approved 처리했고,
이제 실제 기본 자료와 MapPage를 잇는 회귀 검사도 통과합니다. Supabase는 별도입니다.

## Integration Boundary Review

Source review was rechecked on 2026-09-29. The following manual/live column preserves
earlier evidence; see the latest record above for the new operator completion report.
The correction suite is historical, not newly executed or live PASS.

| Area | Confirmed implementation / existing automated coverage | Manual or live evidence | Readiness implication |
| --- | --- | --- | --- |
| 28A page query | Page size 20, positive bounded page, approved predicate and search/taxon/photo predicates before inclusive range; exact matching count and ID tie-break order | Supabase NOT_RUN | Required Preview read check |
| 28A search/photo semantics | Fixed columns and escaped quoted patterns; registered image references, not signing success; same builder for data/count and range recovery | Real regex/collation/legacy photos NOT_RUN | SDK transport tests use injected fetch, not PostgreSQL |
| 28A detail/images | Selected ID refresh; page state outside detail; signing/prefetch for returned page rows, selected-image retry retained | Real detail/images NOT_RUN | Do not use fixture as live evidence |
| 28A fade/no auto-scroll | Card-only shared opacity targets, reduced motion, stale-response/transition guards; pagination calls no scroll/focus API | Original scroll defect operator PASS after 02db6ec; new checklist repeat NOT_RUN | Preserve original PASS, do not expand device/exception coverage |
| App list/map separation | App full-read effect only for home/intro/map; list owns page query, receives revision not collection; map receives independent observations | Live separation NOT_RUN | Home may already read full collection before list entry; distinguish that from a new list-triggered download |
| 28B calendar/filtering | Strict observed-date year/month parsing, no timezone/creation-date substitution; one year AND OR-months AND existing conditions | All new operator items NOT_RUN | UI/live evidence remains outstanding |
| 28B options/reset | Years from unfiltered map source; missing selection retained; independent clears/reset; six source samples now explicit approved | Corrected actual mock/MapPage automated tests PASS; browser NOT_RUN/PARTIAL | B1 closed in code/tests, live results still required |
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

## Historical User Report And Verification Ledger At bacecae

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

Recommended route **after the local B1 correction**: authorize normal feature-branch push
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

- **B1 resolved in code/tests and operator general mock app verification:** six
  public sample declarations and actual mock path coverage; no other confirmed
  code blocker identified in this review.
- Preview integration verification preparation is possible, subject to separate
  authorization and fresh pre-push checks; not Production readiness. The new
  15-item PASS scope is confirmed; do not request those same local tests again.
- **Unverified, not confirmed defects:** live Supabase queries/count/search/images/
  dates/separation, real Kakao, and individually unreported earlier checklist,
  exception/device cases. Do not erase the new 15 local operator PASS results or
  expand them to all cases.
- After reviewing the correction and remaining checks, user decides whether to authorize
  feature-branch Preview push and read-only integrated smoke. That authorization
  does not permit main push, Production deployment or promotion.
- Any later Production decision requires a newly reviewed candidate, fresh checks,
  actual recovery target and immediate operator test readiness. Preserve Phase 26
  marker/security fixes; no historical rollback command or approval is reused.
- This record performs no rollback/revert, no deployment, no next feature and no
  Phase 28 completion archive.

**한국어:** 다음 배포 경로는 기능 브랜치 Preview에서 실제 Supabase 읽기를 먼저
확인하는 방식입니다. B1은 코드상 해결됐지만 Preview push·실조회 검증에는
별도 승인이 필요합니다. 실제 지도가 도메인 제한으로 안 보이는 경우만 별도 운영
검증 대상으로 남기고, 다른 화면 검증까지 완료로 간주하지 않습니다.
