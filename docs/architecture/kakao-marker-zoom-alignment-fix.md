# Phase 26A - Kakao Marker Zoom Alignment Fix

## Status And Scope

- Base: clean `main` and local `origin/main` at `813a819`.
- Branch: `fix/phase-26-kakao-marker-zoom-alignment`.
- Code/test commit: `7345326 fix: keep kakao observation markers aligned during zoom`.
- Status: implemented locally; automated checks PASS; real Kakao visual smoke
  PARTIAL. Phase 26 remains open. No completed phase archive was created.
- No push, merge, deployment, database mutation, coordinate edit, migration,
  RLS, Storage, Auth, taxonomy, package, app-key, allowed-domain, or Vercel
  setting change. No new observation was created.
- Play Store, PWA, TWA, clustering, and provider replacement are out of scope.

**한국어:** 로컬 코드 수정과 자동 검증을 진행했습니다. 실제 카카오 지도 확대·축소
검증이 남아 있어 완료 단계로 기록하지 않으며, 운영 사이트는 바뀌지 않았습니다.

## Symptom And Evidence

The operator reported observation markers moving away from their geographic
locations during Kakao map zoom. Source inspection established a visual-anchor
defect, plus related camera/layout issues:

1. Observation markers already use SDK-managed `CustomOverlay` instances with
   immutable observation coordinates. No manual screen projection is used.
2. The old overlay content was a flex button containing both the dot and its
   variable-width name label. The invisible label still occupied layout space.
   `xAnchor: 0.5` centered that combined box, not the dot. Negative margins
   further complicated the box alignment. This is a confirmed code-level
   anchor defect; a pixel offset corresponds to different geographic distances
   at different zoom levels.
3. The old camera effect derived its center from the first filtered observation
   and reset both center and zoom whenever that center changed. Equivalent
   coordinate objects could also reset user zoom. Deterministic tests reproduced
   those resets without using the real SDK.
4. Only uncancelled initialization timers called `relayout()`. Element-only
   resize and hidden-to-visible transitions had no dedicated handling. Kakao
   documents automatic window resize handling, so this does not establish a
   defect for every ordinary browser resize.

Real zoom-time drift, cumulative error, and its complete relationship to these
defects were **not visually reproduced** in this session. There is no measured
pixel error/tolerance and no claim that SDK animation alignment was verified.
The available in-app browser tool failed before connecting on both attempts.
No new browser dependency was installed.

Git history shows the affected provider predates Phase 25 (its last changes were
`b5fc8f3` and `bb074c4`). There is no evidence that Phase 25 introduced the anchor
defect. Taxonomy panel open/close uses an absolutely positioned panel and need
not resize the underlying map; real dimension changes determine relayout.

**한국어:** 이름표까지 포함한 상자의 가운데를 지도 좌표에 맞추던 문제를 확인했습니다.
점 자체의 중심과 좌표가 달라질 수 있습니다. 다만 실제 화면에서 보고된 모든 현상이
이 원인만으로 설명되는지는 수동 확대·축소 검증이 필요합니다.

## Coordinate And Anchor Decisions

The read path remains:

```text
observations.latitude / longitude
  -> observationMappers: coords.lat / coords.lng
  -> App -> MapPage filteredObservations -> MapPreview -> DesignMap
  -> KakaoEcoMap -> LatLng(lat, lng) -> CustomOverlay(position)
  -> fixed button center -> circle center
```

- Public reads remain approved-only; map filters retain the same collection for
  markers and the map-side list. No repository or filter logic changed.
- The marker's intentional anchor is its circle center, not a pin tip or label.
- Content is a fixed 36 by 36 pixel button with no margins or padding. Flex
  centering places both the normal 18 pixel dot and selected 22 pixel dot at the
  same anchor. The label is absolutely positioned outside normal flow.
- Only the inner dot scales on hover/focus, around its own center. The SDK
  positioning element and button do not receive decorative transforms.
- `CustomOverlay` still owns projection during pan and zoom, including animation.
  No second projection, pixel delta accumulation, zoom offsets, marker hiding,
  camera fit, or zoom/pan disabling was added.
- Static percentage projection remains confined to static fallback components.
  Neither `pointFromCoords` nor `containerPointFromCoords` is needed here. A
  future browser measurement against the map container must use the latter,
  adjusting for the container's current screen origin, not pre-zoom pixels.

## Implementation And Compatibility

Files changed:

- `src/features/map/kakaoMapProvider.tsx`: fixed anchor layout; separate effects
  for explicit center/zoom changes; coordinate-value dependencies for picker and
  preview; shared relayout subscription and cleanup.
- `src/features/map/kakaoMapLayout.ts`: observe actual element size changes,
  coalesce work with one animation frame, skip invalid/zero sizes, remember hidden
  sizes, disconnect/cancel on unmount. Never recenter or change zoom on resize.
- `tests/kakao-map-alignment.test.mjs`: dependency-free test harness using the
  existing TypeScript compiler, fake effects/DOM/SDK, and synthetic local records.
- This document and `docs/architecture/next-session-handoff.md`.

The overview's automatic center is now initialization-only: explicit center,
otherwise the first valid observation available at initialization, otherwise
the existing campus default. Later data arrival, filter/clear, and unrelated
rerenders preserve the camera. Explicit changed center or zoom props still work
independently. No bounds fitting was added.

Overlay rebuilding remains the existing small-map strategy. Old overlays and
button listeners are removed before replacement; each callback closes over its
actual observation, never an array index. Selection is still based on observation
ID. The selected marker keeps the same anchor.

The relayout helper is used by overview, upload location picker, and detail
position preview. If `ResizeObserver` is unavailable, initial relayout still runs
and SDK window-resize behavior remains; element-only resize observation requires
browser support. Upload changes still occur only through existing location-click
selection; zoom/pan/resize do not invoke its `onChange`. Missing-key and failed-SDK
paths still render their original static components.

## Verification

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Before-fix focused regressions | 4 FAIL, 2 PASS | Anchor geometry contract, camera preservation twice, and size lifecycle failed on old source |
| After-fix focused regressions | PASS, 6 tests | Same tests pass; no real layout engine or SDK |
| Full existing plus new Node tests | PASS, 51 tests | Includes taxonomy AND filters, legacy rows, approved-only helpers and detail lineage |
| Typecheck | PASS | `npm.cmd run typecheck` |
| Build | PASS | `npm.cmd run build` |
| Local server | PASS | HTTP 200; not proof that the real map is active |
| Real SDK activation | PARTIAL | Browser connection unavailable |
| Real wheel/control/pan/repeated cycles | PARTIAL | No visual reproduction or anchor measurement |
| Real resize/panel/filter/detail interactions | PARTIAL | Manual browser checks remain |
| Mobile pinch | PARTIAL | No touch-device smoke performed |
| Missing key / failed SDK fallback | PASS, mocked | All three provider surfaces; real browser fallback smoke remains PARTIAL |
| Picker coordinate stability | PASS, mocked | Movement/resize do not select; map click does |
| ID/callback/cleanup regression | PASS, mocked | Three synthetic observations, reorder/filter/clear, correct callback, detached old markers/listeners |
| Diff, whitespace, EOF, secret-like scan | PASS | Intended source/tests/docs only; no secret file read |
| Forbidden tracked paths | PASS | No environment/generated files tracked |

Focused tests check fixed anchor geometry/styles, name length, selected/focus
states, immutable overlay positions through simulated zoom events, camera
preservation, explicit camera updates, size deduplication, hidden-to-visible
relayout, scheduled-work cancellation, and fallback component selection.
Mocked SDK/effect tests cannot establish real React timing, CSS layout or Kakao
visual correctness. Existing Node loader/build timing notices are non-failing.
Deno/Docker/Supabase checks are not applicable to this frontend-only fix.

Commands:

```text
node --test tests/kakao-map-alignment.test.mjs
node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs
npm.cmd run typecheck
npm.cmd run build
git diff --check
git ls-files -- .env .env.local .env.production dist node_modules
```

## Remaining Manual Smoke (No Save/Submit)

1. 로컬 앱의 생태지도를 열고 실제 카카오 지도가 표시되는지 확인합니다. 정적
   대체 지도라면 카카오 줌 검증으로 인정하지 않습니다. 기존 관찰 중 가운데,
   가장자리, 다른 위치의 점을 가능하면 세 개 고릅니다.
2. 휠·트랙패드로 여러 단계 확대·축소하고 지도를 끈 뒤 다시 확대합니다. 원래
   화면으로 여러 번 돌아와 점이 같은 지점을 가리키는지 봅니다. 확대 버튼이
   실제로 있는 환경에서는 버튼도, 터치 기기가 있으면 두 손가락 확대도 확인합니다.
3. 창 크기를 바꾸고 분류 탐색을 열고 닫습니다. 점과 지도가 어긋나거나 화면
   중심·줌이 갑자기 초기화되지 않는지 확인합니다.
4. 검색·분류군·분류 트리 필터를 적용하고 해제합니다. 지도와 옆 목록이 일치하고,
   마커를 눌렀을 때 같은 관찰 상세가 열리는지 확인합니다. 올리기·키보드 포커스
   및 선택 상태가 표시되는 곳에서도 점 중심이 바뀌지 않아야 합니다.
5. 상세 위치 지도를 다시 열어 확인합니다. 업로드 위치 선택기를 사용할 수 있으면
   저장하지 않고 위치만 고른 뒤 확대·이동합니다. 지도를 실제로 클릭하기 전에는
   선택 좌표가 바뀌면 안 됩니다.
6. 로컬 개발자 도구에서 SDK 요청만 차단하고 새로고침해 정적 대체 지도를 확인한
   뒤 차단을 해제합니다. 결과는 PASS/PARTIAL/FAIL만 전달하고 키·요청 주소·좌표·
   계정 정보는 공유하지 않습니다. 운영 키나 허용 도메인은 바꾸지 않습니다.

For developer-assisted measurement later, compare the rendered circle center
against an independent SDK-managed reference at the same geographic coordinate
or the current container projection after interactions settle. Never report
unchanged `getPosition()` alone as visual proof. Animation-time and settled
alignment must be observed separately before closing Phase 26A.

## Official References

- [Kakao Maps API documentation](https://apis.map.kakao.com/web/documentation/):
  `CustomOverlay` position/anchors, `relayout`, projection coordinate spaces.
- [Custom overlay example](https://apis.map.kakao.com/web/sample/customOverlay1/):
  geographic position attached to an SDK overlay.
- [Zoom event example](https://apis.map.kakao.com/web/sample/addMapZoomChangedEvent/):
  documented `zoom_changed` event; no custom zoom-positioning listener needed.

Read during this task. No live observations, private coordinates, SDK request
URLs, environment values, or credentials are recorded here.
