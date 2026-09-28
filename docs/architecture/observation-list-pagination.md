# Public Observation List Pagination

## Scope And Decisions

- Phase 28A, implementation on `feature/phase-28a-observation-list-pagination`.
- Baseline: main/origin/main `a3887a7`, fetched and clean before branching.
  Phase 27 Production visual evidence remains `258daaa`; the docs-only baseline
  deployment is still unobserved. No new deployment result is inferred.
- Twenty **observation records**, not twenty distinct species, per page.
- Operator approved registered-photo metadata as the photo-filter criterion.
  Display/signing success is not a registration test.
- Operator approved omitting whole-array species/taxon statistics **on the list
  screen only**, including its Navbar statistics. Taxon selection remains.
  Exact matching observation count, visible range and page navigation replace
  those supplementary statistics. Server aggregates could restore them later;
  they are deferred for scope, not technically impossible.
- No monthly map filter, deletion, new auth flow, migration/RPC/RLS, package,
  settings, observation mutation, merge, push or deployment in this phase.
- Code/test commit: `6088059 feat: paginate public observations in pages of twenty`.
  Original documentation: `8cdd850 docs: record phase 28a observation pagination`.
  The subsequent user-approved transition follow-up changes UI code/tests as well
  as documentation. It is not a docs-only verification or a new phase/branch.
  Follow-up code/tests: `9bc55d7 feat: reuse page transitions for observation pagination`.
  Its separate documentation commit is identified by Git, not a self-referential hash.

## Changed Files

- App wiring: `src/App.tsx`, `src/components/AppRoutes.tsx`,
  `src/components/Navbar.tsx` (list-only statistics visibility).
- List UI: `src/components/ObservationListPage.tsx`,
  `src/components/observations/ObservationListHeader.tsx`,
  `ObservationTaxonFilter.tsx`, `ObservationPagination.tsx` in the same directory.
- Read contract/provider/mock: `src/repositories/observationRepository.ts`,
  `observationRepositoryProvider.ts`, `mockObservationRepository.ts`.
- Server read: `src/repositories/supabase/supabaseObservationRepository.ts`,
  `src/repositories/supabase/observationPageQuery.ts`.
- Pure page/photo helpers: `src/utils/observationPagination.ts`.
- Tests: `tests/observation-pagination.test.mjs`,
  `tests/observation-pagination-ui.test.mjs` and isolated
  `tests/fixtures/observation-pagination.mjs`, `observation-pagination.html`,
  `observation-pagination-browser.mjs`.
- Documentation: this file and `docs/architecture/next-session-handoff.md`.
- Transition follow-up additionally shares `src/utils/pageTransition.ts` between
  AppRoutes and the real list; updates the list, pagination controls, UI tests,
  browser fixture script/title and these two documents. Repository, query, card,
  detail, App state, Navbar, map and image helpers are unchanged in this follow-up.

## Previous Flow And Separation

Previously App mounted a full `listObservations()` read plus
`countUniqueSpecies()`, which in Supabase made another full list read. Both
resolved image URLs. The list filtered/sorted that shared array on the client.
Cards already represented individual observations. Detail had a separate
approved-only `getObservationById()` refresh.

Now `ObservationListPage` owns its query/result and calls
`ObservationRepository.listPublicObservationsPage(query, signal)` through the
existing provider. `AppRoutes` passes a read revision, not the shared array.
List entry/restoration, page changes and detail selection do not request the
full collection or species-count method. The actual App/route tests cover this.

Home (existing Navbar statistics), introduction and Eco Map still use the
existing full-collection path. App derives their species count from its single
returned array instead of downloading it twice. That collection is cached by
read revision. Entering home before the list can therefore already have made a
full read for home; this is not represented as a page-only home experience.
The list never replaces map/intro observations with its twenty items.
TaxonomyTreeRepository retains its separate approved linked-observation read.
No map provider, tree identity/count/filter or auth-refresh implementation changed.

The existing map/intro full read and tree-summary read are still single API
queries subject to the server's configured row limit. Its live value was not
inspected. This phase does not claim complete large-dataset map/tree support.

## Query Contract

`src/utils/observationPagination.ts` defines the fixed page size and types:

- Input: positive integer `page`, `searchQuery`, `selectedTaxon`, `imageFilter`,
  and `sortKey`. Page maximum 50,000 is a defensive offset guard (one million
  addressable records), not a performance guarantee. Invalid values fail before I/O.
- Output: `items`, actual `page`, `pageSize: 20`, `totalCount`.
- Supabase range is inclusive: `(page - 1) * 20` through that offset + 19.
- Explicit `status = approved` even with an admin session. No taxonomy join:
  legacy null taxonomy records remain visible without duplicate joined rows.
- Narrow named public observation columns; no `select('*')` in the page path,
  no full classification JSON, resolution cache, GBIF or resolver request.
- One GET with `count: 'exact'` applies the same predicates to data and count.
  Missing/invalid count and partial/invalid rows are errors, not zero results.
- Existing observation-date newest/oldest and name sort choices remain.
  `id DESC` breaks ties deterministically. Name ordering uses database collation
  in Supabase and existing Korean `localeCompare` in mock; locale-sensitive edge
  ordering can differ. No claim of identical collation across engines.

## Search And Registered Photos

Search preserves case-insensitive phrase-substring matching across name,
scientific name, location and description. Input is trimmed and whitespace runs
are treated equivalently. The server uses fixed `imatch` fields/operators with
literal regex escaping plus PostgREST quoted-value escaping. Commas, parentheses,
quotes, backslashes, percent/underscore and regex characters cannot become filter
syntax or wildcards. Korean is not blocked. Count-only recovery reuses the exact
same builder. PostgreSQL locale/case rules remain a live compatibility check;
the unit transport evaluator is not a real PostgreSQL execution engine.

Photo registration follows the existing schema and compatibility mapper:

- `image_path` matches migration 0002's case-insensitive stored-object format:
  pending/observation owner directories, two schema-shaped identifier segments,
  and JPG/JPEG/PNG/WebP suffix. No path values are recorded here.
- Existing `image_url` remains a read-only legacy fallback: a nonblank HTTP(S)
  address or root-relative asset reference. Normal legacy query parameters are
  retained. New writes still do not populate this URL field.
- Blank/whitespace paths, non-path URLs, blob/data previews, signed-object paths,
  common temporary signing query parameters and placeholder/no-photo/default-image
  asset markers do not count. MIME/size alone never count.
- No Storage list/existence checks or image downloads to calculate the filter.
  A valid registered reference is not proof that the remote file still exists.
  Unrecognised legacy content cannot be classified by file contents without such
  checks; no live legacy inventory was inspected or altered.
- Both server predicates and mock registration matching share the same patterns.
  Negative matching explicitly includes SQL nulls. A registration remains in
  the photo result even when signed URL generation or rendering fails.
- Only returned page rows (maximum twenty) receive runtime signing, then page
  prefetch. Detail retains its existing independent image refresh/retry/placeholder.
  The shared image helper, create/update rules and DB image values are unchanged.

Schema review: 0001/0003 public observation SELECT, 0002 image constraints,
0003+ authenticated `image_url IS NULL` write rules, and current Storage mapper.
Taxa column-level grants are not widened or bypassed; no taxa join is needed here.

## UI, Async State And Updates

- Search/filter/sort changes atomically return to page one. No storage persistence
  and no browser reload for page changes. Existing controls remain in place.
- UI shows matching count and actual visible range. Zero results have no invalid
  `1 / 0` or `1-0` display. Page controls disappear for zero/one page.
- Wide controls show up to five numbered buttons and labelled previous/next icons.
  Narrow controls show previous/next and current/total page. Buttons have explicit
  type, disabled boundaries, focus styles and current-page semantics.
- Each request carries query, revision, retry and repository identity. Abort plus
  effect cleanup prevents stale/unmounted results, errors and prefetch effects.
  The transition follow-up retains the previous page's cards during explicit page
  requests with a loading/previous-page notice. They are inert and hidden from
  assistive navigation, not relabelled as the requested page. New conditions hide
  unrelated old results. Final cards/count/range/page commit together.
- Pointer page navigation keeps the existing instant result-region scroll on
  success, without transferring keyboard focus. Keyboard page navigation keeps
  focus/viewport at the mounted controls. No new global or smooth scroll is added.
  Search/filter controls do not move focus. Browser focus/layout remains PARTIAL.
- A safe Korean error and same-condition retry distinguish failure from empty.
  The page query disables SDK automatic retries; the retry button is explicit.
- Successful out-of-range response with exact count corrects to the last page
  once. A `416 / PGRST103` gets a same-filter HEAD count, then at most one corrected
  GET. Zero normalises to page one; a second invalid range becomes an error.
  UI accepts the corrected page without launching another automatic request.
- Detail opens by the selected record identity and refreshes that ID only.
  Closing detail leaves the mounted list/query/page intact.
- Existing owner/admin update calls are unchanged. Their successful callback
  increments the read revision so the current list count/filter/page is reread;
  a record leaving the filter is removed from the result. No write was tested live.

## Original Verification (2026-09-28, Before Transition Follow-up)

| Check | Result | Evidence / limit |
| --- | --- | --- |
| TypeScript | PASS | `npm.cmd run typecheck` |
| Full Node suite | PASS | 114 tests, 0 failures; 29 new pagination tests plus 85 existing tests |
| Build | PASS | `npm.cmd run build`; local artifact only |
| Full dev-inclusive audit | PASS | All severities 0 at this run; not a permanent guarantee |
| Diff/format/privacy boundaries | PASS | Whitespace/EOF/Markdown, forbidden paths and secret-like diff scan |
| Mock boundaries | PASS | 0/1/19/20/21/40/41/47, repeated species/dates, legacy, status filters |
| Actual SDK query transport | PASS | Supabase/PostgREST 2.108.1; injected fetch, no live DB |
| Photo/search/count consistency | PASS | Metadata-only, failed signing, legacy, special characters, four fields |
| Actual App/list callbacks | PASS | Page-only reads, map/intro full data, detail identity, edit reread, stale/retry/correction |
| Phase 26/27 regressions | PASS | Existing Kakao/map-filter/auth-refresh/intro tests unchanged |
| Local serving/transform | PASS | Root and real component fixture HTTP 200; not click-through evidence |
| Browser layout/keyboard/detail | PARTIAL | Browser connection failed before inspection; no new tool installed |
| Live Supabase paging/search/images | NOT_RUN | No shared DB reads/writes or test records created by this work |
| Real Kakao and live auth | PARTIAL | Not reverified; earlier domain restriction/evidence unchanged |

Node command: `node --loader ./tests/ts-extension-loader.mjs --test --test-reporter=tap tests/*.test.mjs`.
New transport tests compile the real repository/query builder with the installed
SDK and an in-memory response evaluator. UI tests execute actual App, routes,
list/header/pagination components with a hook harness, not a browser renderer.
No mock result proves live RLS, database regex/collation, CSS geometry or sessions.
Deno/server code is unchanged; no Docker, WSL or Supabase reset was needed or run.

## Pagination Transition Follow-up (2026-09-28)

The user requested the same effect as the introduction/list/map menu transition,
not a directional slide or a page-turn effect. Before this follow-up, AppRoutes
used `AnimatePresence mode="wait"` with `initial={{ opacity: 0 }}`,
`animate={{ opacity: 1 }}` and `exit={{ opacity: 0 }}` for every route. No transform,
duration or easing override was supplied. The installed Motion family is 12.40.0
(declared `motion` range remains `^12.23.24`). Its opacity default in
`motion-dom`'s `animation/utils/default-transitions.mjs` is 0.3 seconds per leg
with easing `[0.25, 0.1, 0.35, 1]`. These are inspected defaults, not measured timing.

`PAGE_FADE` extracts the same three targets with no timing override. AppRoutes
retains its keys, wait mode and original behavior. The list uses those targets
in a stable `motion.div` around **only ObservationGrid**, sequentially fading old
cards out and ready cards in. The list does not need a second AnimatePresence or
page key: keeping one grid avoids overlapping old/new interactive lists and
unmounting the search form, controls or App-owned detail modal.

- Explicit previous/next/number navigation requests immediately. The last
  successful page remains visible while waiting, preserving its natural height.
  Buttons are temporarily `aria-disabled` with guarded handlers; synchronous
  duplicate activation is also locked before React's next render.
- Only a successful response for a different actual page starts the exit fade.
  The response waits locally for that exit, then data/count/range/page change
  together before entry. Runtime image prefetch does not gate the transition.
  The last seven-card page takes its natural height; no twenty-card fixed height
  or global overflow hiding is introduced.
- Each pending fade carries the same request identity and its own exit target.
  Search/filter changes, cleanup and unmount invalidate the pending reference.
  An obsolete completion cannot commit a later page or undo a newer search.
  Completed page intent is cleared, including before later edit-driven rereads.
- Loading/previous-page status and safe failure/retry stay outside the fade.
  Failure retains the old labelled, inert page without confirming the failed
  page number. Retry uses the same request conditions. Old cards cannot be
  activated by pointer/Tab and are `aria-hidden`; no second grid is mounted.
- `initial={false}` and zero-duration non-page replacements avoid a second entry
  animation inside the menu transition. Current/disabled-page activation, detail
  open/close, image completion, ordinary rerenders and search typing do not replay
  the fade. No page reload, timer-delayed query or persistence is introduced.
- `useReducedMotion` skips the fade and commits ready results without waiting for
  completion. A changed reduced-motion value can also finish a pending response
  immediately. Actual OS preference/DOM behavior still needs browser verification.
- `aria-disabled` plus guards replaces native arrow disabling so reaching a
  boundary does not discard focus. All controls remain mounted during page reads;
  current-page semantics and visible focus styles remain. A zero/one-page result
  still hides unnecessary navigation. No automatic search-input focus change.

### Follow-up Verification

| Check | Result | Evidence / limit |
| --- | --- | --- |
| TypeScript / build | PASS | Rerun after final code changes |
| Full Node suite | PASS | 126 tests, 0 failures; not copied from the original 114 |
| Actual App/list orchestration | PASS (mocked Motion/I/O) | 22 UI tests, including 12 added transition cases |
| Shared route fade / first entry | PASS (mocked) | Original wait/opacity props; nested initial fade disabled |
| Data/transition agreement | PASS (mocked) | Next/number/previous, 20/20/7, range/count/page commit, request not delayed |
| Cancellation / failure / retry | PASS (mocked) | Delayed/reordered read, condition change during exit, stale completion, unmount |
| Reduced motion / focus policy | PASS (mocked) | No callback required when reduced; mounted controls, guarded boundaries, no focus call |
| Existing pagination and Phase 26/27 suite | PASS | Server query transport/photo/count, details, images, map separation and prior regressions |
| Full dev-inclusive audit | PASS | All severities 0 in this follow-up run; not a future guarantee |
| Diff/whitespace/EOF/Markdown/privacy | PASS | Intended paths only; no package, DB or setting edits |
| Local HTTP/transform | PASS | Root, real fixture and changed modules respond successfully on port 3000 |
| Actual animation feel/responsive DOM/keyboard | PARTIAL | Browser connection failed before inspection; no browser/tool dependency installed |
| Live Supabase / real Kakao / live auth | NOT_RUN / PARTIAL / PARTIAL | Not exercised by this follow-up; no new live PASS |

The UI harness executes actual App, AppRoutes and list callbacks but substitutes
Motion completion and leaf DOM. It does not render CSS, measure focus/geometry,
or prove animation timing/feel. HTTP serving is not a visual smoke. No operator
statement is expanded into unreported detailed live verification.

## Local Manual Check

A local mock/static dev server is provided at `http://127.0.0.1:3000` during this
session. No environment file or deployed settings were edited. The standard app
uses unchanged sample data. The isolated fixture mounts the **real list and detail
components** with 47 injected records, not a duplicate HTML implementation. It does
not exercise real App routing, repository networking or live authentication.
It is not a Vite production build entry or public default dataset.

Fixture-only query options `?delay=800` and `?delay=800&failPage=2` simulate an
800ms read delay and one failure on page two. Retry succeeds without modifying
data. Aborted fixture timers/listeners are cleaned up. Animation is exclusively
the actual list implementation, not a fixture recreation.

1. Compare the standard app's introduction/list/map menu fade with the fixture's
   `1 -> 2 -> 3 -> 2 -> 1` transitions; check 20/20/7, count/range, no extra slide.
2. Open/close detail on page two; confirm page/filter state and no fade replay.
   Current-page and boundary buttons must not issue an extra request/transition.
3. Sort oldest first and search `수국` from the final page; check page one and no
   typing fade. Exercise photo/taxon filters, an unmatched search and clear.
4. Use the delayed fixture, click pages quickly, and change search while waiting
   or fading. Previous cards must not be interactive or replace newer results.
5. Use the failure fixture; confirm an error without a false new page, then retry.
   At narrow/wide widths check Tab/Enter focus; enable reduced motion and repeat.
6. In the normal app, verify Eco Map/tree and introduction remain independent.
   Do not save observations, create accounts or send mail. Live Supabase paging
   remains separate from this injected fixture.

## Limits And Follow-up

Exact count and literal regex over four fields can be expensive; deep offsets
also need measurement on real data. No speed improvement is claimed without
measurement. A unique tie-breaker stabilises a fixed dataset, not concurrent
insertions/removals: offset pages can shift and repeat/skip records between reads.
No snapshot, cursor, index, RPC or migration is introduced.

Live public read/regex/legacy-image compatibility and real responsive interaction
remain necessary before a later release. Home/map/intro and tree scalability remain
separate follow-ups. Supplementary server statistics can be considered later.
Next planned subtask is Phase 28B observation-date monthly map filtering, only on
separate request. Phase 28 is not closed; no merge/push/deployment.

## Official References

Reviewed on 2026-09-28 alongside installed SDK source:

- [Supabase range](https://supabase.com/docs/reference/javascript/using-modifiers-range)
- [Supabase select/count](https://supabase.com/docs/reference/javascript/select)
- [Supabase order](https://supabase.com/docs/reference/javascript/using-modifiers-order)
- [Supabase raw filters](https://supabase.com/docs/reference/javascript/using-filters-filter)
- [PostgREST filters and regular expressions](https://docs.postgrest.org/en/stable/references/api/tables_views.html)
- [PostgREST pagination/count](https://docs.postgrest.org/en/stable/references/api/pagination_count.html)
- [Motion presence and sequential exits](https://motion.dev/docs/react-animate-presence)
- [Motion reduced-motion accessibility](https://motion.dev/docs/react-accessibility)
- [React state preservation](https://react.dev/learn/preserving-and-resetting-state)

**한국어:** 목록만 서버에서 조건에 맞는 관찰 20개와 정확한 건수를 받습니다.
사진 필터는 표시 성공이 아닌 등록 정보 기준이며, 종 수 등의 보조 통계는 이번
목록 화면에서만 생략했습니다. 지도·소개·분류 트리는 20개로 제한하지 않습니다.
자동 검사는 통과했지만 실제 Supabase와 브라우저 클릭 검증은 남아 있습니다.
후속 수정으로 기존 메뉴와 같은 투명도 전환을 카드 영역에 추가했습니다.
새 데이터가 준비된 뒤에만 교체하며 검색·필터·페이지 버튼과 상세 상태는 유지합니다.
전체 126개 자동 검사는 통과했지만 실제 전환 느낌과 화면 배치는 아직 PARTIAL입니다.
DB·패키지·설정을 바꾸지 않았고 운영 반영이나 push는 하지 않습니다.
