# Eco Map Observation Year And Month Filter

## Status And Scope

- Phase 28B, implemented locally on `feature/phase-28b-observation-month-filter`.
- Started from clean Phase 28A `dea0ad2`, not main. Main remains `a3887a7`;
  previous feature/backup branches and all Phase 28A work are preserved.
- Implementation record: 2026-09-28; operator-result review: 2026-09-29
  (Asia/Seoul). No merge, push or deployment.
- Original code/test commit: `cc908f5 feat: filter eco map observations by month`;
  original documentation: `e5d5798`.
- The user's follow-up explicitly approves year selection, superseding the initial
  no-year scope. Adds one year or all years above the existing multi-month controls.
  No range selector, graph, new server query, data write or next feature.
- Follow-up commits: `420689f fix: restore map date filter fixture rendering` and
  `48bd5c4 feat: add year selection to eco map date filters`.
- The documentation-only integration review recorded at `bacecae` identified B1
  in candidate `6a52cd3`. The approved follow-up now resolves that mismatch in
  code and automated tests by explicitly approving only six public mock samples.
  The earlier 16-item checklist is retained as historical NOT_RUN evidence, not
  upgraded as a batch. The new 15-item operator PASS is recorded separately below;
  actual Supabase and deployment approval remain outstanding. See
  [Phase 28 integration readiness](phase-28-integration-release-readiness.md).
- Phase 28A local automatic-scroll correction remains operator-confirmed PASS.
  Its actual Supabase range/count/search/photo/detail/image checks remain NOT_RUN.
  The historical Phase 27 tested Production release is `258daaa`; the docs-only
  `a3887a7` deployment is still unobserved, not upgraded to PASS by this task.

**한국어:** 기본 mock의 연도 선택 문제는 코드·기존 자동 검사와 사용자 화면 확인으로
해결을 확인했습니다. 이번 15개 항목만 사용자 확인 PASS로 기록합니다. 이전 16개
확인표와 Supabase·Kakao까지 일괄 PASS로 바꾸지 않으며, Production 준비 완료는 아닙니다.

## Operator Follow-Up After Mock Correction (2026-09-29)

- Reviewed branch HEAD: `5af0ce5`, including correction `419f654`. Only documents
  differ between those commits; no later application change was found on entry.
- Evidence source: **operator-reported local manual verification**, not Codex
  browser inspection. After the original template's NOT_RUN entries, the operator
  reported completion and explicitly clarified: `네, 이번 15개 모두 PASS이고 제외 항목은 기존 상태 유지`.
- The following 15 PASS results use that clarification, not an inference from the
  completion wording alone. Actual Supabase stays NOT_RUN and real Kakao PARTIAL.
  The earlier 16-item checklist is not converted into an all-PASS checklist.

| Environment | Confirmed check | Operator result |
| --- | --- | --- |
| General mock app | Map and existing observations displayed | PASS |
| General mock app | Six default observations and 2026 year option | PASS |
| General mock app | 2026 / May: six observations | PASS |
| General mock app | 2026 / April only: zero observations | PASS |
| General mock app | All months retains year and restores six | PASS |
| General mock app | Collapse/reopen retains date and tree state | PASS |
| Synthetic date fixture | Actual MapPage displays without blank screen | PASS |
| Synthetic date fixture | All years/all months: 33 | PASS |
| Synthetic date fixture | All years/May: 27 | PASS |
| Synthetic date fixture | Year/month combinations and independent clears | PASS |
| Synthetic date fixture | Narrow window and keyboard operation | PASS |
| Synthetic pagination fixture | Page sizes 20 / 20 / 7 | PASS |
| Synthetic pagination fixture | Card opacity transition retained | PASS |
| Synthetic pagination fixture | No automatic top scroll for page 1 / 2 navigation | PASS |
| Synthetic pagination fixture | Closing detail retains the current page | PASS |

The counts belong only to the specified mock/fixture datasets, never the live DB.
The blank error field is not an explicit no-error claim. No pixel measurements,
all-device coverage, new live request, or independent Codex rendering PASS is added.
No request to repeat these tests is made; the report's grading is now confirmed.
The prior 28A operator PASS for the original scroll defect remains valid history.

B1 is resolved in code, historical regression tests and the operator's general
mock app check. The date fixture's original blank screen is also operator PASS.
Generic combination PASS does not assert separate outcomes for every older
13/12/0 case, exception, device or prior checklist item. Narrow-window PASS is
not an all-mobile-device claim. Supabase records were not part of this report.
Actual Supabase 28A/28B reads stay **NOT_RUN**; real Kakao stays **PARTIAL**.
No confirmed code blocker to preparing Preview integration verification was found.
This is not Production readiness or permission to push/deploy.

This documentation-only session rereads the relevant source/commits and checks
diff, Markdown fences/tables, whitespace/EOF, forbidden tracked paths and secret-like
additions. It does not rerun Node tests, typecheck, build or audit, following the
working guide's docs-only exception. The 26-test before/after result, full 162 PASS,
typecheck/build PASS and zero-vulnerability audit are the 2026-09-28 implementation
results below. Server availability/browser rendering are not rechecked this time.

## Default Mock Contract Correction (2026-09-28)

Historical authorized code/test follow-up from `bacecae`, not the current docs-only task.
Code/test commit: `419f654 fix: align public mock observations with approval status`.
`src/data/sampleObservations.ts` supplies the ordinary app through
`mockObservationRepository` -> App's collection read -> AppRoutes -> MapPage.
All six intended public samples had valid dates in May 2026 but lacked status.
Existing mock display admitted them; the strict approved-only year extractor did
not. The correction adds exactly six `status: 'approved'` properties at source.
IDs, names, dates, coordinates, images and taxonomy links are unchanged.

The collection, page and detail reads share these samples; home/intro also use
the public repository. Admin's provider loads the Supabase admin repository, not
this array. Mock taxonomy summaries are separate fixtures and retain their own
approved/pending/rejected cases and global counts. No runtime status fallback,
repository/mapper/filter change, status type expansion or real data write is made.
Unknown/sample compatibility in existing mock map/page reads is not broadened and
does not promote a record to approved; unknown/sample still cannot add year options.
Pending/rejected remain excluded from map/page results and year options.

Five new contract tests read the actual default source/repository, check page/detail
consistency, independently enumerated dates, legacy records, negative statuses and
unchanged private taxonomy fixtures. One new actual-MapPage harness test feeds that
repository's six records and real mock taxonomy repository through year/month,
empty result, collapse, branch retention, independent clears, search and full reset.
The harness replaces React DOM/effects/map rendering; it is not browser geometry.

| Historical correction check | Result and evidence |
| --- | --- |
| Before source correction | Focused 26 tests: 21 PASS, 5 FAIL; new failures reproduce absent status and empty default/legacy/MapPage year options |
| After source correction | Same focused 26 tests: all PASS, with no test expectation changed to hide the failures |
| Full Node suite | 162 PASS, 0 failed, 0 skipped; includes prior 156 and six new tests |
| Typecheck / build | PASS, newly executed once after correction |
| Dev-inclusive dependency audit | PASS, all severities 0 at this run; no package update |
| Diff / Markdown / whitespace / EOF / secret-like / forbidden paths | PASS before local commits; existing sample fields verified unchanged apart from status |
| General app serving | Port 3005 rechecked; served MapPage embeds this workspace path, served sample source matches current file, provider confirms mock mode via boolean-only check |
| Fixture serving | Exact HTML/root and Vite module proxy, static fixture entry and pagination entry respond; not app-index fallback |
| Direct browser | PARTIAL: browser connection fails before inspection; HTTP/transform checks are not rendering PASS |
| Operator 16-item checklist | NOT_RUN, no new user result supplied |
| Actual Supabase / real Kakao | NOT_RUN / PARTIAL, unchanged |

Existing synthetic date fixture expectations (33/27/28/13/12/0) and 47-record
pagination fixture are unchanged and distinct from ordinary mock expectations:

| Ordinary mock condition | Expected observations |
| --- | --- |
| All years/all months | 6 |
| 2026/all months or May | 6 |
| All years/May or April + May | 6 |
| 2026/April only | 0, year/month remain selected |
| Valid year options | 2026 only, once |

These expectations come from six source dates (May 6, 8, 10, 11, 12 and 13), not
from using the filter under test to generate expected counts. Two unlinked records
remain eligible for date filters; taxonomy selection retains its existing rules.

Previously supplied local confirmation steps, retained for reference, not a
request to repeat the reported checks. Port availability was verified only in
that implementation session:

1. Open `http://127.0.0.1:3005/`, enter 생태지도: six results and the 2026 option.
2. Select 2026 and May: six; switch May off and April on: zero with choices retained.
3. Collapse/reopen; clear only month to restore six while retaining 2026; then use
   전체 연도 or 전체 보기 and check independent/full reset and retained tree branches.
4. Check the unchanged date fixture at `/tests/fixtures/map-month-filter.html`
   (33 total, May 27) and pagination fixture at `/tests/fixtures/observation-pagination.html`
   (20/20/7); these use synthetic data, not Supabase.

## Operator Checklist At Integration Review

Recorded on 2026-09-28 for reviewed candidate `6a52cd3`. The supplied environment
is the local fixture using actual MapPage with synthetic data; the ordinary-app
and pagination checks are separately labelled below. No item was supplied as
PASS or FAIL. The error summary was blank, meaning **not supplied**, not a verified
absence of errors. No additional manual result is inferred from the task title.

| Supplied check | Operator result |
| --- | --- |
| Blank screen resolved; filters and results displayed | NOT_RUN |
| All years/all months: expected 33 | NOT_RUN |
| All years/May: expected 27 | NOT_RUN |
| All years/April + May: expected 28 | NOT_RUN |
| 2025/May: expected 13 | NOT_RUN |
| 2024/May: expected 12 | NOT_RUN |
| 2026/May: expected 0 with conditions retained | NOT_RUN |
| Changing year retains selected months | NOT_RUN |
| Search, broad taxa and taxonomy combine correctly | NOT_RUN |
| Collapse/reopen retains year, months and tree | NOT_RUN |
| All years clears only year | NOT_RUN |
| All months clears only months | NOT_RUN |
| Full reset clears all conditions | NOT_RUN |
| Narrow window and keyboard behavior | NOT_RUN |
| Year/month controls in the ordinary local app | NOT_RUN |
| Existing pagination/fade/scroll retention | NOT_RUN |

The numbers are fixture expectations only, not newly observed results or real
Supabase counts. No Codex browser was opened in that documentation review. Earlier browser-tool
limitations remain PARTIAL; neither fixture nor ordinary-app visual PASS is added.
No all-mobile-device or measured pixel claim is made. The prior 28A operator PASS
for the original automatic-scroll defect after `02db6ec` remains historical and
is not revoked or converted into a new item-by-item check by this NOT_RUN table.

That documentation review ran document/Git checks and a local read-only contract diagnostic,
not the full Node suite, typecheck, build or audit. The recorded 156-test PASS and
zero-vulnerability audit belong to the previous implementation session.

## Actual Date Contract

Inspected `0001_create_observation_schema.sql`: `observations.observed_date`
is `date not null`, distinct from the `created_at`/`updated_at` timestamps.
`ObservationDbRow.observed_date` is a string and `observationMappers.ts` already
passes it unchanged to `Observation.date`. Existing mock dates also use
`YYYY-MM-DD`. No additional field, mapper change or create/update change is needed.

`src/utils/observationMonth.ts` validates exactly ten characters in `YYYY-MM-DD`,
positive four-digit year, month 1..12, day range and Gregorian leap-year rules.
`getObservationDateParts` extracts year and month together with numeric components, without constructing a
JavaScript Date, applying a timezone or accepting a normalized impossible day.
Timestamp/locale strings, missing values and invalid dates return no date parts.
The existing `getObservationMonth` delegates to the same parser; no duplicate parser.
Neither creation time, current date nor EXIF supplies a fallback.

Official references read on the record date:
[PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)
describes the date type as a calendar date without time of day;
[MDN Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
documents UTC interpretation for date-only input and inconsistent handling of
nonstandard/impossible dates. The implementation avoids that parsing path.

## Filter Rules

- Initial year is `null` (all years) and empty months mean all months. Neither
  defaults to the current date. One year may be selected; months remain multiple.
- Multiple months are OR. All years + May includes May across every loaded year;
  one year + April/May includes only April or May in that year. Changing one date
  condition does not change the other or silently escape an empty result.
- Normalize to unique chronological months. Invalid numeric values are discarded;
  all twelve normalize to the same empty/all state. Toggle the last month off
  to return to all. `ObservationMonth` restricts normal UI callers to 1..12.
- The existing `filterMapObservations` adds year/month to its existing conditions:
  public-status guard AND existing text/species semantics AND broad taxa AND
  taxonomy node IDs AND observation year AND observation month. No change to species/search precedence.
- Only when both date conditions are inactive do invalid/missing dates retain
  existing public visibility. Either active condition excludes them without edits.
- A legacy unlinked observation with a valid matching date remains eligible.
  An active taxonomy filter still excludes it under the existing rules.
- Pending/rejected remain excluded. Supabase approved-only repository reads,
  RLS and mock/sample compatibility are unchanged.

**한국어:** 전체 연도에서 4월과 5월을 고르면 모든 연도의 두 달을 포함합니다.
연도도 고르면 그 연도의 두 달만 포함합니다. 검색·종·분류 조건은 함께 만족해야
합니다. 잘못되거나 없는 날짜는 연도 또는 월을 골랐을
때만 제외하며, 등록일로 대신 판단하지 않습니다.

## Year Options And Data Refresh

`getObservationYears` uses the original `MapPage.observations`, before text,
species, taxa, taxonomy or month filtering. It collects valid dates from explicitly
`approved` records, deduplicates and sorts descending. No hardcoded years and no
list-page input. Valid legacy unlinked records contribute years; pending/rejected
or invalid dates do not. Unknown status does not manufacture an approved year
option. Before the correction above the default mock samples lacked explicit
status, so only all years appeared; the isolated fixture had explicit statuses.
Now the six intended default public samples also explicitly declare approval.

**Historical integration finding B1 (now corrected above):** that difference was not a harmless
mock limitation. An actual local read-only call through `mockObservationRepository`
returned six records, six valid dates in 2026, six absent statuses; existing map
filtering displayed all six, while `getObservationYears` returned no options.
Thus dates are present, but the public display and option contracts disagree.
The approved synthetic fixture bypasses this ordinary-app case and cannot prove
it works. That review made no runtime/sample changes; the later authorized fix
changes only the six reviewed source declarations, not the approval guard.

`Observation.status` is optional (`src/types.ts:46`). Supabase public reads
explicitly filter approved rows, and the unchanged mapper includes both
`date: row.observed_date` and `status: row.status`. A synthetic mapper probe retained
both, so no status-dropping defect is established for Supabase; live reads remain
NOT_RUN. TypeScript optional status is not a substitute for repository/RLS access
control, and undefined must not be globally promoted to approved.

The authorized correction above makes the known samples explicit at source and
covers default-repository-to-MapPage behavior. B1 is resolved at code/test level
and now by operator general mock app confirmation. Remaining live checks and
unreported exception/device cases prevent a claim of full release verification.

With no available years the native select retains all years and an empty-data note.
If a selected year disappears during refresh it stays selected and appears as
`현재 자료 없음`, with a note and the all-year clear action. No loading effect resets
the selection. Fresh props recalculate results for that same year/month. Options
remain based on all loaded public data when other filters change, not on results.

## UI And State

`MapPage.tsx` owns `selectedYear` and `selectedMonths` next to existing filter state.
A labelled native select above months has focus styles, a full-width shrinking
layout and an associated empty/missing-year note. Twelve
native `type="button"` toggles have `aria-pressed`, a named fieldset, visible
focus styles and a check icon in addition to selected colors. Decorative icons
are hidden from assistive technology. Four/six-column grid tracks wrap months
without a new horizontal scroller. Native buttons provide Enter/Space behavior.
The operator's new date-fixture narrow-window/keyboard check is PASS. No measured
geometry, assistive-technology matrix or all-mobile-device result is claimed.

- The controls live inside the existing mounted `hidden` region. Collapse keeps
  selections/results while removing controls and compact results from layout/Tab.
- The collapsed summary shows the year followed by months in calendar order.
  Each labelled X clears only its own condition. Expanded `전체 연도` and `전체 월`
  also clear only their respective date condition.
- `전체 보기` clears year, months and all previously reset filters. Taxonomy-chip
  clear changes taxonomy only. No operation resets tree branches or cached children.
- No active filter means no unnecessary `전체 관찰` summary. No persistent storage.
- Receiving updated observation props recalculates the current combination while
  preserving year/month selection. Observation detail selection remains owned by App.

## Map, List And Tree Boundaries

One `filteredObservations` array still feeds `MapPreview`, the compact map list
and visible result count. Optional fixture-only dependencies now inject a static
renderer and local taxonomy repository; normal app defaults remain `MapPreview`
and `activeTaxonomyTreeRepository`. The unchanged map provider retains its coordinate
eligibility rules, so a marker count is not promised to equal the record count.
No map remount, camera command, SDK call or duplicate size observer was added.
Phase 26 dot-centered overlays, explicit camera changes and resize cleanup remain.

App still supplies its independent map collection, not the standalone list's
twenty-row page. Phase 28A requests, exact count, registered-photo rules, detail,
fade, reduced motion and automatic-scroll removal are unchanged. The original
47-record pagination fixture is unchanged.

The taxonomy repository retains its separate cached approved linked-observation
summary and lazy child loading. Its counts do not shrink with selected year/months,
search or other map conditions. `분류 옆 숫자는 전체 기록 기준` distinguishes
those counts from current results. Year/month changes neither refetch taxonomy IDs
nor alter the selected node; the existing stale-response guard remains active.
No GBIF/resolver request or public resolution-cache access was introduced.

**Existing limit:** map `listObservations()` and taxonomy summaries each make
their existing single API read, subject to the configured server row limit.
This live limit was not inspected. Year options and date results cover the collection
delivered to MapPage, not a guarantee that all database years/results are included.
No pagination aggregation loop, RPC or server aggregate was added. Existing
map image-signing/prefetch behavior is unchanged; month toggles add no image I/O.

## Original Month-Only Verification (Historical)

The following table records the original implementation session before `e5d5798`,
not the new follow-up run. In particular, HTTP/module success did not prove render
success: the user later reported a blank fixture, diagnosed below.

| Check | Result | Evidence and limit |
| --- | --- | --- |
| Typecheck | PASS | Newly executed `npm.cmd run typecheck` |
| Full Node tests | PASS | Newly executed 143 tests, 0 failures; includes existing 129 plus 14 new |
| Calendar/month tests | PASS | Eight tests: strict dates/leap years, three timezone subprocesses, OR/AND, legacy/status, mapper observed-date contract |
| Actual MapPage/state tests | PASS, mocked I/O | Six added tests execute real MapPage/tree handlers; same IDs/count, 27 May results, reset/summary/hidden focus contract, fresh props, stale taxonomy response |
| Existing Phase 26/27/28A regressions | PASS, automated | Included in full suite; no new live or visual PASS inferred |
| Build | PASS | Newly executed `npm.cmd run build` |
| Dev-inclusive audit | PASS | Newly executed full audit, all severities zero at this check; not a future guarantee |
| Diff/Markdown/whitespace/EOF/privacy/forbidden paths | PASS | Intended source/tests/docs only; checked before local commits |
| Local fixture serving/transform | PASS | Port 3005, fixture HTML/proxy and actual MapPage module HTTP 200; imports confirmed |
| Actual browser layout/keyboard/static rendering | PARTIAL | Browser tool failed before inspection; no browser dependency installed |
| Actual Supabase month/date read | NOT_RUN | No live request executed for this verification |
| Phase 28A live pagination/search/photo/detail/images | NOT_RUN | Earlier limitations remain; fixture and injected SDK tests are not live evidence |
| Actual Kakao camera/marker regression | PARTIAL | Local domain limitation and no browser smoke; no keys/domains changed |

The full Node command was:

```text
node --loader ./tests/ts-extension-loader.mjs --test --test-reporter=tap tests/*.test.mjs
```

The UI harness substitutes React effects/DOM and the map provider; it does not
measure CSS geometry, actual Tab traversal, screen reader output or pixels.
The existing deep-tree test selector was narrowed to tree selection buttons
because the new month grid is not a taxonomy row. The first focused run exposed
that broad-selector assumption; the corrected full suite passed.

## Blank Fixture Diagnosis And Correction

On 2026-09-28 the existing port 3005 server was still running and served this
repository's fixture title/root, module proxy, MapPage TSX and CSS, not index.html
fallback. The former fixture threw before `createRoot` whenever repository mode
was not mock or the environment-selected map was not static. Safe boolean-only
checks of the served configuration confirmed mock mode and a configured Kakao
provider, so that gate rejected this server. Only mode/presence booleans were
reported; `.env.local` was not read and configuration values were not printed.
This is a confirmed pre-render failure path, not a missing-key theory.
It explains why the ordinary app could show months while the test entry was blank.

`420689f` removes the configuration gate and global repository mutation. The new
`map-month-filter-browser.mjs` mounts the **actual MapPage** with the local taxonomy
repository and existing `StaticEcoMap` explicitly injected. Normal app callers
retain their default providers. Fixture execution does not call Supabase/Auth,
GBIF/resolver or load a Kakao SDK; no environment or provider file was changed.

HTML now contains visible loading text outside the React root. Dynamic import
failure, synchronous mount failure and React 19 `onUncaughtError` report distinct
safe categories, never raw exceptions. Loading clears on the mounted component's
effect. Module failures and render failures are tested separately. A failure in
the shell itself can still leave the static loading text rather than a detailed
category; this is not a universal browser error handler.

Official references consulted on 2026-09-28:
[Vite guide](https://vite.dev/guide/) for module entry processing and
[React createRoot](https://react.dev/reference/react-dom/client/createRoot) for
the installed React 19 root/error API. Date semantics use the MDN reference above.

Browser tooling failed before connecting (sandbox metadata error). Thus the code
cause and server/module checks are confirmed, but post-fix actual browser rendering
and absence of additional runtime issues remain **PARTIAL**, not visual PASS.

## Follow-Up Verification (2026-09-28, Historical Implementation Run)

Recorded at `6a52cd3`, before the documentation-only integration review. The
following results remain historical. The later correction's fresh checks and
server observations are recorded separately above, without relabelling this run.

| Check | Result | Evidence and limit |
| --- | --- | --- |
| Typecheck / production build | PASS | Rerun after year implementation; no package changes |
| Full Node suite | PASS | 156 tests, 0 failed, 0 skipped; includes earlier 143, five fixture/injection tests and eight year tests |
| Focused fixture/date/MapPage suite | PASS | 36 tests; actual component handlers and entry orchestration with mocked render/effects/I/O |
| Strict year/month semantics | PASS, automated | Independent counts below, approved options, invalid dates, legacy, all-date clears, three timezone subprocesses |
| State and isolation | PASS, automated | Hidden focus contract, stale taxonomy responses, unchanged global tree counts/cache, missing selected year, map mount identity |
| Dev-inclusive audit | PASS | `npm.cmd audit --include=dev --audit-level=high --json`: all severities 0 at this run only |
| Diff / whitespace / EOF / Markdown / secret-like / forbidden-path checks | PASS | Intended code/tests/docs only; generated output not staged |
| Current server and transformed modules | PASS | Rechecked root app, exact fixture HTML/proxy, new entry/data modules, actual MapPage and CSS on 3005; HTTP and expected entry checks only |
| Fixture browser render / narrow layout / keyboard | PARTIAL | Tool could not connect; not measured via a browser |
| Ordinary app year/month visual interaction | PARTIAL | Same MapPage source, but no new direct browser check; user's earlier month-visible report is not year verification |
| Actual Supabase year/month read | NOT_RUN | No live read performed; Phase 28A live checks also remain NOT_RUN |
| Actual Kakao regression | PARTIAL | No live camera/alignment smoke; existing provider tests pass, provider source unchanged |

The full Node command above is unchanged. The test harness is not React DOM or
browser geometry, and HTTP 200 is not render verification. No synthetic count or
mocked result is recorded as real Supabase, Production or measured pixel evidence.

## Isolated Manual Screen

`tests/fixtures/map-month-filter.html` loads the isolated browser entry, real
MapPage, stylesheet and static renderer. No mock/static environment gate remains;
the supplied dependencies isolate this screen without changing normal app settings.
There is no duplicated year/month UI.
It has 35 synthetic records: 33 public plus pending/rejected exclusion examples,
different years, leap/invalid/missing dates, legacy and broad-taxon variations.
The tree uses real aggregation helpers; no invented monthly counts.
Selection is shown as local text, not the production App detail modal.

Existing port 3005 was reused, not killed or reconfigured. The ordinary local app
is `http://127.0.0.1:3005/`; the fixture address is below. Both serve the current
MapPage module. No tool installed or unrelated server stopped.

Independent expected counts, without search/taxon/taxonomy filters:

| Year | All months | May | April + May |
| --- | --- | --- | --- |
| All years | 33 | 27 | 28 |
| 2026 | 2 | 0 | 1 |
| 2025 | 14 | 13 | 13 |
| 2024 | 13 | 12 | 12 |
| 2023 | 1 | 1 | 1 |
| 2022 | 1 | 1 | 1 |

Counts are enumerated from unchanged fixture records, not generated by the filter
under test: 25 May plants alternate 2025 (13) and 2024 (12); 2026 has January/April;
2025 adds December 31, 2024 adds February 29, 2023 has the legacy May record,
2022 has the May bird. Two public invalid/missing dates count only without date
conditions. Pending/rejected remain hidden. Additional test-only future years
check that nonpublic records cannot add year options. The original 33/27/28 and
47-record pagination fixture expectations remain unchanged.

1. Open `http://127.0.0.1:3005/tests/fixtures/map-month-filter.html`; loading should
   become the actual MapPage, all years/all months, 33 public results. Report a
   remaining safe error category if it does not render; this is not already visual PASS.
2. Choose May (27), 2025 (13), then 2024 (12). Add April: still 12 in 2024;
   select 2026: one April record. May alone in 2026 is a normal empty result.
3. Use 전체 연도 with May: 27; 식물: 26; Plantae: 25. Expand tree to species and
   search within results; year options/global tree counts should not shrink.
4. Collapse/reopen and check retained year/month/search/branches. Check year X,
   month X and taxonomy X clear only their own condition; 전체 보기 restores 33.
5. At narrow/wide widths, test native select, Tab/Enter/Space, visible focus,
   wrapped month controls and no hidden controls in Tab order.
6. Open the ordinary local app, choose 생태지도 and check the same date controls;
   also check unchanged list paging/detail/fade/no-auto-scroll. Counts depend on
   that app's data, not the fixture. Do not create accounts, observations or SQL.

**한국어:** 이전 연도 기능 구현 시 자동 검사는 156개 통과했습니다. 3005의 잘못된 초기화 조건은
제거했지만 직접 브라우저 확인은 PARTIAL입니다. 연도는 현재 지도로 읽어온
승인된 자료에서만 구하므로 전체 DB의 연도 목록을 보장하지 않습니다.
합성 화면과 일반 앱, 실제 Supabase 결과는 각각 따로 확인해야 합니다.

## Unchanged Boundaries And Next Step

Across Phase 28B, MapPage, pure helpers, isolated tests/fixture, six default public
sample statuses and documentation change. This correction does not alter MapPage,
helpers, repository queries or providers. No package, DB/migration/RLS/RPC/Edge Function, Auth/Storage/Kakao/Vercel
configuration, observation write, new account, email, or deployment action.
No Docker, WSL, Supabase reset or SQL execution. Existing data/backup branches
are preserved. The documentation commit hash is reported from Git;
no self-hash amendment or Phase 28 completion archive.

Next: B1 is corrected in code/tests; decide whether to authorize feature-branch
Preview deployment and actual Supabase integrated
reads as described in `phase-28-integration-release-readiness.md`. Preserve the
historical 16-item NOT_RUN table separately from the new 15-item operator PASS.
Do not start a fix, feature or deployment
automatically; old Production/Preview approval is not current authorization.
