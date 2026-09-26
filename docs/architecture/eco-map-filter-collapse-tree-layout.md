# Phase 27A - Collapsible Eco Map Filters And Responsive Taxonomy Tree Layout

## Status And Scope

- Baseline: clean `main` at `2059adb`.
- Working branch: `feature/phase-27a-map-filter-layout`.
- Implementation commit: `c203f7a feat: add collapsible map filters and responsive taxonomy tree`.
- Initial documentation: `3d58aad`. The follow-up continues on the same branch:
  the operator changed the disclosure scope to include result feedback and the
  compact map-side observation list. This supersedes the original always-visible
  result requirement; it is not a new phase.
- Implemented locally; automated checks PASS. Responsive/browser verification
  remains PARTIAL because browser tooling failed before page inspection.
- Phase 27 remains in progress. No completed Phase 27 archive, merge, push,
  Preview deployment or Production deployment is part of this work.
- Only two approved requirements: collapse the whole filter/result area and
  prevent deep taxonomy rows from losing horizontal space.

한국어 요약: 사용자 요청에 따라 결과 건수와 지도 안의 작은 관찰목록도 함께 접힙니다.
필터 전체 접기와 깊은 분류 트리 배치만 구현했습니다. 자동 검사는
통과했지만 실제 화면 확인은 남아 있으므로 완전한 시각 검증이나 배포 준비 완료로
표현하지 않습니다.

## Subsequent Operator Verification

At Phase 27B start, the operator reported completing manual verification of
filter collapse/reopen, combined result-area collapse, hidden default `전체 관찰`
summary and deep taxonomy tree layout: **operator-confirmed manual PASS**.
This supplements the earlier unavailable-tool browser record below. It does not
establish all device/viewport coverage, measured geometry, keyboard behavior or
real Kakao zoom/pan verification. Phase 27A code remains unchanged during 27B.

한국어: 요청한 필터·결과 접기와 분류 트리 배치는 사용자 수동 확인 완료로 기록합니다.
실제 Kakao 확대·축소나 모든 기기를 확인했다는 뜻은 아닙니다.

## Audited Cause

The existing overlay combined search/species, broad taxa, taxonomy browsing,
result feedback and the compact observation list. Search/filter selections were
owned by `MapPage`; inner disclosure, expanded keys and child cache were owned
by `TaxonomyTreePanel`.

Previously each expanded ancestor added `ml-8 pl-2` and a left border, while each
row also added `depth * 0.75rem`. At species depth 6 this meant six inherited
2.5rem offsets plus 4.5rem of row padding, before borders and buttons. Long
unbroken names had no forced wrapping. The outer scroll container constrained
the visible width. This is a code-supported cause, not a measured browser offset.

The fix removes indentation from ancestor wrappers. Only the row indents by
`min(depth, 3) * 0.5rem`, a total maximum of 1.5rem at every deeper rank.
Nested lists retain logical ancestry, existing labels show all seven ranks,
and source identity, counts and missing-rank rules are unchanged.

한국어 요약: 부모마다 쌓이는 여백과 행의 추가 여백이 함께 폭을 줄이고 있었습니다.
부모 여백을 없애고 행 들여쓰기의 총량을 제한했습니다. 분류 단계 자체는 생략하지 않습니다.

## Filter Disclosure And State

- Initially expanded. The always-visible button switches between `필터 접기`
  and `필터 열기` on both mobile and desktop, without viewport-driven resets.
- `areFiltersExpanded` lives in the mounted `MapPage`; no persistent storage.
- Search/species, broad taxa and tree controls are inside one native `hidden`
  region. The tree remains mounted; expanded keys, loaded children, pending
  requests and inner disclosure state survive closing/reopening.
- The same boolean also hides a second mounted region containing `표시 중`,
  the compact list title/buttons and its empty-result feedback. One toggle's
  `aria-controls` references both regions. Native hiding removes their layout
  space and focusable descendants; no separate list toggle or state was added.
- Collapse does not call repository methods, select observations, clear filters
  or change the filtered collection. `filteredObservations` still drives both
  `MapPreview` and the compact result list.
- Incoming observation props continue to recompute current results while hidden.
  Reopening reveals those results, not a stored snapshot. Observation selection
  remains owned outside MapPage; hiding does not invoke its selection callback.
- A collapsed summary shows the actual search, selected species and broad taxa,
  not an invented combined filter count. Long summary/suggestion text wraps.
- A small follow-up after `6aa6631` removes the collapsed summary's `전체 관찰`
  fallback. Without active filters, MapPage omits that entire summary wrapper,
  including its margin. The title/reopen button, active summaries, taxonomy chip
  and `전체 보기` reset behavior are unchanged; expanded rendering is unchanged.
- `TaxonomyFilterStatus` was extracted within the existing tree module and is
  rendered outside both hidden regions. The taxonomy chip, filter loading/error
  feedback, chip clear button, header summary and global reset remain available.
  The compact list has no separate loading/error/footer controls in this version;
  its existing empty-result feedback is included in the hidden results region.
- The map itself stays visible and mounted. The standalone observation-list page,
  App routes and observation detail ownership are unchanged by this follow-up.
- Chip clear removes taxonomy only. `전체 보기` retains existing full-reset
  semantics; neither action resets the expanded branches or outer visibility.
- Root errors now stop automatic retries until the existing `다시` button is
  used. The previous effect could repeat failed root requests without input;
  a deterministic failure test confirms one attempt until explicit retry.

한국어 요약: 접기는 초기화가 아닙니다. 선택값과 펼친 트리를 보존합니다. 접힌 동안
결과 건수·작은 목록·빈 결과 안내는 숨기고 지도·필터 요약·분류 해제·전체 보기는
유지합니다. 다시 열면 현재 데이터에 맞는 결과가 보입니다. 별도 관찰목록 페이지는
바뀌지 않습니다.

## Tree Layout And Accessibility

- No ancestor margin/padding accumulation, horizontal hiding workaround, scaling,
  smaller font workaround or horizontal navigation requirement was introduced.
- Shrinkable rows/names use `min-width: 0`. Selection uses separate grid columns
  for rank, `minmax(0, 1fr)` name, and count. Names use `overflow-wrap: anywhere`
  rather than ellipsis-only display; counts and expand controls keep their space.
- Expand and select remain separate buttons. Node selection uses `aria-pressed`.
- Outer, inner and node disclosures use real `type="button"` buttons,
  `aria-expanded`, and `aria-controls` referencing mounted regions.
- Generated DOM ids use `useId` plus traversal positions, not source keys or
  observation identifiers. React node identity remains the existing composite key.
- Toggle handlers focus the visible toggle before hiding descendants. Native
  hidden regions remove their controls from focus/accessibility navigation.
- Visible focus styles, 44px-high action targets, nested list semantics and
  reduced-motion-aware loading icons are present. No `role="tree"`, custom
  arrow-key tree behavior or new animation library was added.
- Enter/Space follow native button behavior. Actual keyboard traversal, focus
  painting and screen-reader output still require browser verification.

References checked during implementation:
[WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
and [Kakao container relayout sample](https://apis.map.kakao.com/web/sample/mapRelayout/).

## Phase 26 And Data Boundaries

- `kakaoMapProvider.tsx`, `kakaoMapLayout.ts` and their six regressions are
  unchanged. Dot-centered SDK overlays, separate labels, explicit-only camera
  changes and layout cleanup remain intact.
- The filter surface is still an absolute overlay. Collapsing changes its
  coverage, not map mounting; real map-container size changes already use the
  existing observer/relayout path. No SDK call, extra observer or camera reset
  was added to UI components.
- Repositories, filtering helpers, production default data, node identities,
  global counts and missing-rank behavior are unchanged. No ranks are invented.
- Approved-only visibility and legacy compatibility remain covered by existing
  tests. No GBIF/resolver or public `taxonomy_name_resolutions` access was added.
- No database/observation action, package change, migration, RPC, RLS, Edge
  Function, Auth, Storage, Kakao setting or Vercel configuration change occurred.
- Deletion, auth-triggered reload, pagination, monthly filters, EXIF/GPS, cropping,
  camera input, unidentified observations, Korean-name scientific-name search,
  comments/identification suggestions and related-site links remain untouched.

## Verification

| Check | Result | Scope |
| --- | --- | --- |
| Before-fix regression check | 2 expected FAIL | New outer-disclosure and bounded-indentation tests against `2059adb` source in memory; no reset/worktree replacement |
| Follow-up regression against `3d58aad` | 3 expected FAIL | Updated disclosure, fresh hidden results and empty-feedback tests against previous source in memory; no reset/worktree replacement |
| Summary regression against `6aa6631` | 2 expected FAIL | Strengthened existing tests cover unfiltered collapse and collapsed reset; corrected source passes both |
| Component contract tests after follow-up | 9 PASS | Filter/tree/cache preservation, hidden counts/list/empty feedback, current incoming props, collapsed clear/reset, seven ranks, hidden-ancestor focus contract, pending children and retry |
| Full Node suite after follow-up | 60 PASS | Existing 51 plus 9, including all six unchanged Phase 26 marker/layout tests |
| Typecheck / production build | PASS | Existing commands; no dependency/tool installation |
| Full npm audit including dev | Historical zero findings | Recorded during initial Phase 27A, not rerun for this follow-up; package files unchanged and no push/release |
| Local HTTP resources | PASS | App/fixture/changed modules returned 200; not rendered-layout proof |
| 320 / 390 / 768 / 1280 CSS pixel viewports | PARTIAL | Browser tooling unavailable before inspection; geometry and screenshots not captured |
| Actual keyboard / long-label / overlap / page-overflow checks | PARTIAL | Fixture and normal app browser inspection unavailable; hidden-ancestor assertions are not actual Tab-order or CSS measurements |
| Real Kakao camera/alignment | PARTIAL | Existing localhost/Preview domain restriction; no approved-origin smoke or deployment in this step |
| Diff / whitespace / EOF / forbidden paths / secret scan | PASS | Intended files only, no secret file read or values printed |

Commands: `npm.cmd run typecheck`,
`node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`,
`npm.cmd run build`, and `git diff --check`. The focused file was also run
separately (9 PASS). The initial audit command was
`npm.cmd audit --include=dev --audit-level=high`; this is historical evidence.
Deno/Docker/Supabase checks were not needed for unchanged backend code. Mocks
establish behavior contracts, not actual React DOM layout. The follow-up browser
attempt failed at tool bootstrap before any page inspection or screenshots.
The summary-only follow-up reran typecheck, all 60 tests (9 focused) and build
successfully. Browser connection again failed before inspection, so both fixture
and normal-app visual checks remain PARTIAL. The unchanged fixture imports the
real MapPage; no copied fixture-only rendering was patched.

## Local Fixture And Manual Follow-up

`tests/fixtures/map-filter-layout.html` mounts the real MapPage with a local-only
repository fixture. It requires mock/static mode, uses synthetic observations,
includes all seven ranks, siblings, long/unbroken names, missing-rank and legacy
examples, and deliberately exaggerated five-digit counts for layout stress.
Those are not real taxonomy counts or shared DB rows. The fixture replaces the
repository only within that test page; production data and entry points are
unchanged. The production bundle does not include this fixture.
The test-only `합성 자료 갱신` button replaces local props, allowing current-result
behavior to be checked while hidden. It never writes through a repository or DB.

The follow-up server was started on port 3003, bound to loopback; an existing
server on port 3002 was left untouched. To restart it later
on a free port, use process-only settings (do not edit environment files):

```powershell
$env:VITE_OBSERVATION_REPOSITORY = 'mock'
$env:VITE_KAKAO_MAP_JAVASCRIPT_KEY = ' '
npm.cmd run dev -- --host 127.0.0.1 --port 3003 --strictPort
```

The deliberate whitespace value disables the trimmed key without PowerShell
removing an empty override. No real key value is needed or changed.

1. 로컬 서버의 `/tests/fixtures/map-filter-layout.html`을 엽니다. 합성 자료와 정적
   지도용 화면이며 로그인이나 관찰 저장은 하지 않습니다.
2. 개발자 도구 화면 폭을 320, 390, 768, 1280px로 바꾸고 `분류 탐색`에서
   Plantae부터 종까지 펼칩니다. 긴 이름·단계·12345 건수·버튼이 겹치거나 잘리지
   않고 불필요한 가로 스크롤이 없는지 확인합니다.
3. 검색·종 선택·식물 필터·분류 선택 후 목록 하나를 선택하고 `필터 접기`를 누릅니다.
   결과 건수와 목록 제목·내용은 사라지고 지도·요약·해제 버튼은 남아야 합니다.
   Tab으로 숨긴 목록에 들어가지 않아야 하며 큰 빈 공간도 없어야 합니다.
4. `필터 열기`를 눌러 선택값·열었던 가지·결과가 유지되는지 확인합니다. 접힌 상태의
   분류 칩 해제는 분류만, `전체 보기`는 전체 조건을 해제해야 합니다.
   조건이 없을 때는 제목과 `필터 열기`만 남고 `전체 관찰` 요약과 그 여백은 없어야 합니다.
5. `전체 보기` 후 검색어 `layout-short`만 입력하고 종 추천은 선택하지 않습니다.
   접은 뒤 `합성 자료 갱신`을 누르고 다시 엽니다. 결과 이름이 `layout-short updated`로
   바뀌어야 합니다. 없는 검색어로 만든 빈 결과 안내도 접기와 함께 숨겨지는지 확인합니다.
6. 일반 앱에서도 접기·펼치기와 상세 선택을 확인하고 별도 관찰목록 페이지는 그대로인지
   확인합니다. Enter/Space도 사용합니다. 결과만 공유하고 계정·키·좌표는 보내지 않습니다.

Real Kakao camera/alignment checks remain deferred to a separately approved
origin verification. Next: manual layout verification, then choose the next
approved Phase 27 subtask. Do not infer Production readiness or deploy automatically.
