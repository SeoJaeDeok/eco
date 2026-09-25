# Phase 27A - Collapsible Eco Map Filters And Responsive Taxonomy Tree Layout

## Status And Scope

- Baseline: clean `main` at `2059adb`.
- Working branch: `feature/phase-27a-map-filter-layout`.
- Implementation commit: `c203f7a feat: add collapsible map filters and responsive taxonomy tree`.
- Implemented locally; automated checks PASS. Responsive/browser verification
  remains PARTIAL because browser tooling failed before page inspection.
- Phase 27 remains in progress. No completed Phase 27 archive, merge, push,
  Preview deployment or Production deployment is part of this work.
- Only two approved requirements: collapse the whole filter control area and
  prevent deep taxonomy rows from losing horizontal space.

한국어 요약: 필터 전체 접기와 깊은 분류 트리 배치만 구현했습니다. 자동 검사는
통과했지만 실제 화면 확인은 남아 있으므로 완전한 시각 검증이나 배포 준비 완료로
표현하지 않습니다.

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
- Collapse does not call repository methods, select observations, clear filters
  or change the filtered collection. `filteredObservations` still drives both
  `MapPreview` and the compact result list.
- A collapsed summary shows the actual search, selected species and broad taxa,
  not an invented combined filter count. Long summary/suggestion text wraps.
- `TaxonomyFilterStatus` was extracted within the existing tree module and is
  rendered outside the hidden region. The taxonomy chip, loading/error feedback,
  chip clear button, global reset, result count and result list remain available.
- Chip clear removes taxonomy only. `전체 보기` retains existing full-reset
  semantics; neither action resets the expanded branches or outer visibility.
- Root errors now stop automatic retries until the existing `다시` button is
  used. The previous effect could repeat failed root requests without input;
  a deterministic failure test confirms one attempt until explicit retry.

한국어 요약: 접기는 초기화가 아닙니다. 선택값과 펼친 트리를 보존하고, 접힌 상태에서도
분류 필터 해제·전체 보기·결과 목록을 사용할 수 있습니다.

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
| New component contract tests | 7 PASS | Filter/tree/cache preservation, collapsed clear/reset, seven ranks and wrapping contracts, separate actions, hidden-region linkage, pending children, retry/empty state |
| Full Node suite | 58 PASS | Existing 51 plus 7, including all six unchanged Phase 26 marker/layout tests |
| Typecheck / production build | PASS | Existing commands; no dependency/tool installation |
| Full npm audit including dev | Zero findings | All severity counts zero at this check; no update performed |
| Local HTTP resources | PASS | App/fixture/changed modules returned 200; not rendered-layout proof |
| 320 / 390 / 768 / 1280 CSS pixel viewports | PARTIAL | Browser tooling unavailable before inspection; geometry and screenshots not captured |
| Actual keyboard / long-label / overlap / page-overflow checks | PARTIAL | Contract assertions do not measure CSS layout |
| Real Kakao camera/alignment | PARTIAL | Existing localhost/Preview domain restriction; no approved-origin smoke or deployment in this step |
| Diff / whitespace / EOF / forbidden paths / secret scan | PASS | Intended files only, no secret file read or values printed |

Commands: `npm.cmd run typecheck`,
`node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`,
`npm.cmd run build`, `npm.cmd audit --include=dev --audit-level=high`,
and `git diff --check`. Deno/Docker/Supabase checks were not needed for unchanged
backend code. Mocks establish behavior contracts, not actual React DOM layout.

## Local Fixture And Manual Follow-up

`tests/fixtures/map-filter-layout.html` mounts the real MapPage with a local-only
repository fixture. It requires mock/static mode, uses synthetic observations,
includes all seven ranks, siblings, long/unbroken names, missing-rank and legacy
examples, and deliberately exaggerated five-digit counts for layout stress.
Those are not real taxonomy counts or shared DB rows. The fixture replaces the
repository only within that test page; production data and entry points are
unchanged. The production bundle does not include this fixture.

The local server was started on port 3002, bound to loopback. To restart it later
on a free port, use process-only settings (do not edit environment files):

```powershell
$env:VITE_OBSERVATION_REPOSITORY = 'mock'
$env:VITE_KAKAO_MAP_JAVASCRIPT_KEY = ' '
npm.cmd run dev -- --host 127.0.0.1 --port 3002 --strictPort
```

The deliberate whitespace value disables the trimmed key without PowerShell
removing an empty override. No real key value is needed or changed.

1. 로컬 서버의 `/tests/fixtures/map-filter-layout.html`을 엽니다. 합성 자료와 정적
   지도용 화면이며 로그인이나 관찰 저장은 하지 않습니다.
2. 개발자 도구 화면 폭을 320, 390, 768, 1280px로 바꾸고 `분류 탐색`에서
   Plantae부터 Taraxacum 아래 종까지 화살표를 펼칩니다.
3. 긴 이름이 줄바꿈되고 단계·12345 건수·버튼이 잘리거나 겹치지 않는지 확인합니다.
   패널과 페이지에 불필요한 가로 스크롤이 없어야 합니다.
4. 검색·종 선택·식물 필터·분류 선택 후 `필터 접기`와 `필터 열기`를 누릅니다.
   선택값·결과·열었던 가지가 유지되고 지도·목록이 계속 보여야 합니다.
5. 접힌 상태에서 분류 칩 해제와 `전체 보기`를 각각 확인합니다. 분류 해제는 다른
   조건을 유지하고, 전체 보기는 조건을 초기화합니다. 목록 선택은 같은 관찰을 가리켜야 합니다.
6. Tab과 Enter/Space로 접기·펼치기·선택·해제를 확인합니다. 숨긴 컨트롤로 초점이
   들어가면 안 됩니다. 결과는 PASS/PARTIAL/FAIL로만 공유하고 계정·키·좌표는 보내지 않습니다.

Real Kakao camera/alignment checks remain deferred to a separately approved
origin verification. Next: manual layout verification, then choose the next
approved Phase 27 subtask. Do not infer Production readiness or deploy automatically.
