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
  Transition documentation: `04063eb docs: record observation pagination transitions`.
  Latest implementation: `02db6ec fix: prevent scroll jumps during observation pagination`.

## Local Verification Status After 02db6ec

- Evidence: **operator-reported manual verification** of the local pagination
  correction at `02db6ec`. The operator reports completing the supplied manual
  checks and explicitly confirms that the original automatic result-heading
  scroll is resolved: **PASS**.
- This is not Codex browser verification. No scroll-position measurement, pixel
  tolerance, complete device matrix or item-by-item exception results were supplied.
  The checklist completion report is retained as a whole, not expanded into
  separate PASS claims for every delay/error, keyboard or reduced-motion case.
  The same manual checks are not requested again in this documentation task.
- The local fixture uses real list/detail components and isolated records. That
  evidence is separate from actual Supabase requests, which remain **NOT_RUN**.
  No Preview/Production deployment or Production verification has occurred for
  Phase 28A. The earlier Codex browser-tool limitation remains historical.

| Implemented capability | Code and historical automated evidence | Manual / live evidence |
| --- | --- | --- |
| Twenty observation records per server page | Repository range contract and injected SDK transport tests | Actual Supabase NOT_RUN |
| Whole-public-data search/filter before paging | Shared data/count predicates; approved-only and deterministic ordering tests | Actual Supabase NOT_RUN |
| Matching total count and visible range | Exact count, page bounds, zero/final-page tests | No separate item-level result supplied |
| Registered-reference photo filter | Shared mock/server photo patterns and count consistency tests | Actual Supabase photo/legacy compatibility NOT_RUN |
| Search/filter reset to page one; detail close preserves page | Actual App/list callback harness | Guided-check completion reported as a whole |
| Existing menu-style card fade and reduced motion | Shared opacity targets, transition and no-completion-required tests | No separate exception/device results supplied |
| No unwanted automatic result-heading scroll | Scroll effect/flag removal in 02db6ec; callback and scroll-spy regressions | Original defect PASS, operator-reported |
| Delayed, failed and out-of-order requests | Abort/identity guards, stale-transition rejection and retry tests | No separate exception results supplied |
| List page does not limit map/tree to twenty | Separate list read; App/map separation regression and unchanged tree path | Live data separation NOT_RUN |

The previous implementation session passed 129 Node tests, typecheck, build and
a dev-inclusive audit with zero vulnerabilities at that time. These are historical
results, not rerun results or a permanent security guarantee. This record-only
session runs diff, Markdown, whitespace/EOF, forbidden-path and secret-like diff
checks. App checks and audit are not rerun because only documentation changes;
the project working guide explicitly permits skipping typecheck/build for docs-only work.

The short-page limit is unchanged: switching from twenty to seven cards can reduce
the maximum document scroll range, so native bottom clamping is possible. That is
not the removed `scrollIntoView()` call. No large permanent spacer was added, and
absolute viewport coordinates are not guaranteed across all document lengths.

For a later approved integration/Preview check, retain actual Supabase range,
count, search and photo predicates; real-data detail/image compatibility; and
separation of map data from list page data. No known blocker to the next local
implementation is established by the current evidence, but this is not release
approval or full live-environment verification. Phase 28B, observation-date monthly
Eco Map filtering, remains planned only and requires a separate request.

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
- Page navigation no longer calls scroll or focus APIs for pointer or keyboard
  activation. Controls remain mounted; no click-time position is captured or
  restored after a delayed response. The user's subsequent scroll is not undone.
  Normal menu navigation is unchanged. The original automatic-scroll defect now
  has an operator-reported local PASS; unreported device/geometry cases remain
  unverified. A shorter final document may constrain the available scroll range.
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

### Transition Verification Before Scroll Correction

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

## Scroll-Jump Correction (2026-09-28)

The user reported an upward move after switching from page one to page two and
requested keeping the current viewport while retaining the card fade. This
supersedes the earlier pointer-only automatic result-region scroll requirement.
Started clean on the same Phase 28A branch at `04063eb`; no new branch or reset.

### Confirmed Code Cause And Small Fix

- Before correction, `ObservationPagination` passed `event.detail !== 0` as a
  `scrollToResults` flag. `ObservationListPage` saved it in
  `scrollAfterPageChange`, then its response effect called
  `resultRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })`.
  The result region also has a scroll margin. This is an explicit result-start
  scroll, not an opacity-animation requirement.
- Inspected ancestors (`App` root, main, AppRoutes and list containers) have no
  separate scrolling panel: the document/viewport is the scrolling surface in
  this layout. This was established from code, not a live `scrollY` measurement.
- Removed only that effect, its two refs and the flag through the page callback.
  No replacement scroll/focus call, delayed correction, position snapshot, body
  lock, global anchoring override or permanent padding was added.
- The existing App menu/hash navigation scroll remains untouched. Pagination
  uses real `type="button"` controls, not anchors or form submission, and does
  not invoke App navigation. No result `focus()` or `autoFocus` is introduced.
- The same mounted grid retains old cards while requesting/fading; there is no
  intentional empty exit gap or page-key remount. Card image `aspect-square`
  reservations and ID keys are unchanged. Native scroll anchoring, text-height
  variation and exact browser geometry were not measured or asserted as causes.
- `PAGE_FADE`, reduced-motion handling, request identity/abort guards, error/retry,
  filter/search/page state, detail selection, page-only image handling and server
  query semantics remain unchanged. The existing fixture uses these actual list
  components without any fixture-only scroll compensation.

### Short Final Page And Verification Limits

Twenty-card to twenty-card moves no longer request vertical or horizontal scroll.
If twenty cards become seven and the previous position exceeds the new document's
maximum scroll range, the browser may clamp it to the new bottom. This is distinct
from sending the reader to the result heading. No oversized permanent blank area
is introduced to conceal that constraint. Exact before/during/after positions,
native anchoring and behavior on narrow screens still require real browser checks.

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Regression before/after | PASS (mocked) | Four changed/new tests failed on the old scroll call, then passed after removal |
| Focused actual App/list harness | PASS | 25 tests; scroll/focus spies, delayed response, user movement, retry, menu distinction |
| Full Node suite | PASS | At implementation time: 129 tests, 0 failures; not rerun for the manual-result record |
| Typecheck / build | PASS | Rerun after this code change |
| Full dev-inclusive audit | PASS | Fresh audit: all severities 0; no dependency changes |
| Diff/format/secret/path checks | PASS | Only two list UI files, one test and two documents changed |
| Local serving | PASS | Root, 47-record fixture and changed component transforms responded successfully |
| Codex browser inspection at implementation time | PARTIAL | Connection failed before inspection; no scroll or pixel measurements; later operator result is recorded above |
| Live Supabase / real Kakao | NOT_RUN / PARTIAL | Not reverified by this change |

Tests exercise real App/list callback wiring with mocked Motion and scroll APIs,
not CSS layout. Their synthetic positions are not browser measurements. The original
problem report alone was not post-fix evidence; the subsequent explicit operator
confirmation above establishes PASS for that defect. No account,
observation, SQL, package, DB, Auth/Storage/Kakao/Vercel setting or provider change;
no merge/push/deployment. Local implementation commit:
`02db6ec fix: prevent scroll jumps during observation pagination`.

## Local Manual Check

The following is the previously supplied checklist, retained for reference.
The operator reports completing it after `02db6ec`; it is not a new request to
repeat it, nor a set of separately graded results. The local mock/static server
was available at `http://127.0.0.1:3000` in the implementation session; this docs-only
session did not recheck its availability. No environment file or deployed settings
were edited. The standard app
uses unchanged sample data. The isolated fixture mounts the **real list and detail
components** with 47 injected records, not a duplicate HTML implementation. It does
not exercise real App routing, repository networking or live authentication.
It is not a Vite production build entry or public default dataset.

Fixture-only query options `?delay=800` and `?delay=800&failPage=2` simulate an
800ms read delay and one failure on page two. Retry succeeds without modifying
data. Aborted fixture timers/listeners are cleaned up. Animation is exclusively
the actual list implementation, not a fixture recreation.

1. In the fixture near the bottom, use next/previous and number buttons for
   `1 -> 2 -> 1`; check 20/20 cards, the same fade and no jump to the result heading.
2. Move to the seven-card page and back. Distinguish a shorter document's bottom
   clamp from an extra heading jump; do not expect identical maximum scroll ranges.
3. In the delayed fixture, scroll manually while waiting or fading. Ready data
   must not pull you to the heading or a previously saved click-time position.
4. In the failure fixture, retry page two. Error and retry must not programmatically
   move the viewport; a changing error-message height is not a measured guarantee.
5. At narrow/wide widths use Tab/Enter, reduced motion and page-two detail open/close.
   Keep page/filter state and normal user-driven focus scrolling usable.
6. In the normal app compare menu fades/navigation, search/filter behavior and
   independent map/tree data. Do not save observations, create accounts or send mail.

## Limits And Follow-up

Exact count and literal regex over four fields can be expensive; deep offsets
also need measurement on real data. No speed improvement is claimed without
measurement. A unique tie-breaker stabilises a fixed dataset, not concurrent
insertions/removals: offset pages can shift and repeat/skip records between reads.
No snapshot, cursor, index, RPC or migration is introduced.

Live public read/regex/legacy-image compatibility and any unreported device-specific
cases remain for later integration/release checks. The resolved automatic-scroll
defect does not require the same local check to be repeated for this record.
Home/map/intro and tree scalability remain
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
- [MDN scrollIntoView and scroll margins](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
- [MDN focus and preventScroll](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
- [MDN scroll anchoring overview](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_anchoring/Overview)

**한국어:** 목록만 서버에서 조건에 맞는 관찰 20개와 정확한 건수를 받습니다.
사진 필터는 표시 성공이 아닌 등록 정보 기준이며, 종 수 등의 보조 통계는 이번
목록 화면에서만 생략했습니다. 지도·소개·분류 트리는 20개로 제한하지 않습니다.
기존 자동 검사는 통과했고 실제 Supabase 조회는 아직 NOT_RUN입니다.
후속 수정으로 기존 메뉴와 같은 투명도 전환을 카드 영역에 추가했습니다.
새 데이터가 준비된 뒤에만 교체하며 검색·필터·페이지 버튼과 상세 상태는 유지합니다.
추가 요청에 따라 페이지 변경 후 결과 상단으로 이동시키던 호출도 제거했습니다.
02db6ec 이후 사용자가 안내된 수동 검증을 완료했고, 원래 자동 상단 이동 문제가
해결됐다고 확인했습니다. 이 항목은 사용자 확인 PASS이며 Codex 직접 검증은 아닙니다.
129개 테스트·타입 검사·빌드·감사 결과는 이전 구현 세션 기록으로, 이번에는 문서만
검사했습니다. 개별 결과가 없는 예외 상황이나 모든 기기를 PASS로 확대하지 않습니다.
마지막 7개 페이지에서 문서가 짧아지면 브라우저가 가능한 범위로 보정할 수 있습니다.
DB·패키지·설정을 바꾸지 않았고 운영 반영이나 push는 하지 않습니다.
