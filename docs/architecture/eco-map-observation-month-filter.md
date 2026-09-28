# Eco Map Observation Month Filter

## Status And Scope

- Phase 28B, implemented locally on `feature/phase-28b-observation-month-filter`.
- Started from clean Phase 28A `dea0ad2`, not main. Main remains `a3887a7`;
  previous feature/backup branches and all Phase 28A work are preserved.
- Record date: 2026-09-28 (Asia/Seoul). No merge, push or deployment.
- Code/test commit: `cc908f5 feat: filter eco map observations by month`.
- Adds observation-month selection only to the existing Eco Map controls.
  No year/range selector, graph, new server query, data write or next feature.
- Phase 28A local automatic-scroll correction remains operator-confirmed PASS.
  Its actual Supabase range/count/search/photo/detail/image checks remain NOT_RUN.
  The historical Phase 27 tested Production release is `258daaa`; the docs-only
  `a3887a7` deployment is still unobserved, not upgraded to PASS by this task.

**한국어:** 기존 Phase 28A를 포함한 브랜치에 월별 지도 필터를 추가했습니다.
아직 로컬 구현이며, 이번 자동 검사가 실제 Supabase나 운영 화면 확인을 대신하지는 않습니다.

## Actual Date Contract

Inspected `0001_create_observation_schema.sql`: `observations.observed_date`
is `date not null`, distinct from the `created_at`/`updated_at` timestamps.
`ObservationDbRow.observed_date` is a string and `observationMappers.ts` already
passes it unchanged to `Observation.date`. Existing mock dates also use
`YYYY-MM-DD`. No additional field, mapper change or create/update change is needed.

`src/utils/observationMonth.ts` validates exactly ten characters in `YYYY-MM-DD`,
positive four-digit year, month 1..12, day range and Gregorian leap-year rules.
It extracts the calendar month with numeric components, without constructing a
JavaScript Date, applying a timezone or accepting a normalized impossible day.
Timestamp/locale strings, missing values and invalid dates return no month.
Neither creation time, current date nor EXIF supplies a fallback.

Official references read on the record date:
[PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)
describes the date type as a calendar date without time of day;
[MDN Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
documents UTC interpretation for date-only input and inconsistent handling of
nonstandard/impossible dates. The implementation avoids that parsing path.

## Filter Rules

- Initial empty selection means all months. Never default to the current month.
- Multiple months are OR, across **all years**. There is no year condition.
- Normalize to unique chronological months. Invalid numeric values are discarded;
  all twelve normalize to the same empty/all state. Toggle the last month off
  to return to all. `ObservationMonth` restricts normal UI callers to 1..12.
- The existing `filterMapObservations` adds months to its existing conditions:
  public-status guard AND existing text/species semantics AND broad taxa AND
  taxonomy node IDs AND observation month. No change to species/search precedence.
- With no month condition, invalid/missing dates retain existing public visibility.
  With selected months they are excluded, without modifying stored data.
- A legacy unlinked observation with a valid matching date remains eligible.
  An active taxonomy filter still excludes it under the existing rules.
- Pending/rejected remain excluded. Supabase approved-only repository reads,
  RLS and mock/sample compatibility are unchanged.

**한국어:** 4월과 5월을 고르면 모든 연도의 4월 또는 5월 관찰을 포함합니다.
검색·종·분류 조건은 함께 만족해야 합니다. 잘못되거나 없는 날짜는 월을 골랐을
때만 제외하며, 등록일로 대신 판단하지 않습니다.

## UI And State

`MapPage.tsx` owns `selectedMonths` next to the existing filter state. Twelve
native `type="button"` toggles have `aria-pressed`, a named fieldset, visible
focus styles and a check icon in addition to selected colors. Decorative icons
are hidden from assistive technology. Four/six-column grid tracks wrap months
without a new horizontal scroller. Native buttons provide Enter/Space behavior.
Actual focus painting and narrow-screen geometry still require browser checks.

- The controls live inside the existing mounted `hidden` region. Collapse keeps
  selections/results while removing controls and compact results from layout/Tab.
- The collapsed summary lists selected months in calendar order. Its labelled
  X clears only months. The expanded `전체 월` action also clears only months.
- `전체 보기` clears months and all previously reset filters. Taxonomy-chip clear
  changes taxonomy only. Neither operation resets tree branches or cached children.
- No active filter means no unnecessary `전체 관찰` summary. No persistent storage.
- Receiving updated observation props recalculates the current combination while
  preserving month selection. Observation detail selection remains owned by App.

## Map, List And Tree Boundaries

One `filteredObservations` array still feeds `MapPreview`, the compact map list
and visible result count. The unchanged map provider retains its coordinate
eligibility rules, so a marker count is not promised to equal the record count.
No map remount, camera command, SDK call or duplicate size observer was added.
Phase 26 dot-centered overlays, explicit camera changes and resize cleanup remain.

App still supplies its independent map collection, not the standalone list's
twenty-row page. Phase 28A requests, exact count, registered-photo rules, detail,
fade, reduced motion and automatic-scroll removal are unchanged. The original
47-record pagination fixture is unchanged.

The taxonomy repository retains its separate cached approved linked-observation
summary and lazy child loading. Its counts do not shrink with selected months,
search or other map conditions. `분류 옆 숫자는 전체 기록 기준` distinguishes
those counts from current results. Month changes neither refetch taxonomy IDs
nor alter the selected node; the existing stale-response guard remains active.
No GBIF/resolver request or public resolution-cache access was introduced.

**Existing limit:** map `listObservations()` and taxonomy summaries each make
their existing single API read, subject to the configured server row limit.
This live limit was not inspected. Monthly results cover the collection delivered
to MapPage, not a guarantee of complete database-wide monthly search at scale.
No pagination aggregation loop, RPC or server aggregate was added. Existing
map image-signing/prefetch behavior is unchanged; month toggles add no image I/O.

## Verification

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

## Isolated Manual Screen

`tests/fixtures/map-month-filter.html` imports the real MapPage, stylesheet and
static provider. Only this test page replaces the taxonomy repository with a
local fixture, guarded to require mock/static mode. No duplicated filter UI.
It has 35 synthetic records: 33 public plus pending/rejected exclusion examples,
different years, leap/invalid/missing dates, legacy and broad-taxon variations.
The tree uses real aggregation helpers; no invented monthly counts.
Selection is shown as local text, not the production App detail modal.

A separate hidden local mock/static dev server was started at port 3005; existing
servers were left intact. HTTP serving is not proof of successful visual rendering.

1. Open `http://127.0.0.1:3005/tests/fixtures/map-month-filter.html`; check all-month
   default and 33 visible public records. Synthetic pending/rejected rows must stay hidden.
2. Select May, then April too: expect 27, then 28 results. Choose March alone for
   the empty state. These are fixture counts, not shared database counts.
3. Combine May with 식물 and Plantae: expect 25 linked records. Expand through
   species; tree counts remain global. Search should narrow the existing result.
4. Collapse/reopen: verify sorted month summary, hidden results/keyboard targets,
   retained selections and expanded branches. Month X clears months only;
   taxonomy X clears taxonomy only; 전체 보기 restores all filters.
5. Check narrow/wide windows and Tab/Enter/Space, checkmarks, focus and wrapping.
   The fixture's selection text should match a clicked observation.
6. In the ordinary local app, check map filtering and existing standalone list
   paging/detail/fade without automatic top scrolling. Do not create/save records.
   Actual Supabase and real Kakao outcomes must be recorded separately if tested.

**한국어:** 자동 143개·타입·빌드·보안 검사는 통과했습니다. 실제 화면 확인은
PARTIAL, Supabase 실조회는 NOT_RUN입니다. 위 로컬 화면은 실제 지도 컴포넌트를
사용하지만 합성 자료이며, 운영 DB나 관찰을 만들지 않습니다.

## Unchanged Boundaries And Next Step

Only MapPage, its pure filtering helpers, isolated tests/fixture and documentation
change. No package, DB/migration/RLS/RPC/Edge Function, Auth/Storage/Kakao/Vercel
configuration, observation write, new account, email, or deployment action.
No Docker, WSL, Supabase reset or SQL execution. Existing data/backup branches
are preserved. The documentation commit hash is reported from Git;
no self-hash amendment or Phase 28 completion archive.

Next: operator local month-filter checks, then a separately requested Phase 28
integration/verification plan. Do not start another feature or deployment automatically.
