# Phase 26A - Kakao Marker Zoom Alignment Fix

## Status And Scope

- Previous operational baseline: `813a819`.
- Implementation branch: `fix/phase-26-kakao-marker-zoom-alignment`, preserved.
- Production-tested application release: `d7d5e27`, fast-forwarded into `main`
  and pushed normally after pre-release checks and operator readiness.
- Code/test commit: `7345326 fix: keep kakao observation markers aligned during zoom`.
- Status: Verified and closed for the reported zoom-alignment defect, based on
  operator-confirmed Production visual PASS. Individual unreported browser/device
  checks remain PARTIAL. See [Phase 26 archive](../eco/phase-history/phase-26.md).
- No database mutation, saved-coordinate edit, migration, RLS, Storage, Auth,
  taxonomy, app-key, allowed-domain, or Vercel setting change was required.
  No observation was created or edited for verification. The original marker
  fix changed no packages; the separate dependency patch was included in release.
- No rollback was reported as performed. The fix branch and local
  `backup/before-phase-26-kakao-production` at `813a819` are preserved.
- Closeout changes documentation only; application, tests and package files
  remain identical to `d7d5e27`. The closeout commit is not the visually tested
  release and its own deployment status must be checked separately.
- Play Store, PWA, TWA, clustering, and provider replacement are out of scope.

**한국어:** 운영자가 Production에서 원래 확대·축소 시 마커 위치 문제의 해결을
확인했습니다. 이 결함은 검증 완료로 종료합니다. 개별 기기와 추가 조합 테스트까지
모두 통과했다는 뜻은 아니며, 이번 종료 작업에서는 문서만 변경합니다.

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

During local implementation, real zoom-time drift and cumulative error were
**not visually reproduced**: the in-app browser failed before connecting, and
no browser dependency was installed. Localhost/Preview real-Kakao verification
also remained unavailable under the operator's domain/configuration limitation.
The later operator-confirmed Production result below resolves the original
reported defect. No numerical pixel error/tolerance was measured, and detailed
animation-time, repeated-cycle or device-specific behavior is not inferred.

Git history shows the affected provider predates Phase 25 (its last changes were
`b5fc8f3` and `bb074c4`). There is no evidence that Phase 25 introduced the anchor
defect. Taxonomy panel open/close uses an absolutely positioned panel and need
not resize the underlying map; real dimension changes determine relayout.

**한국어:** 이름표까지 포함한 상자의 가운데를 지도 좌표에 맞추던 코드 문제를
확인했습니다. 수정 후 원래 증상이 해결됐다는 운영자 확인을 받았지만, 모든 기기의
세부 동작이나 픽셀 단위 오차까지 측정한 것은 아닙니다.

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

### Dependency Audit Follow-Up

Historically, the queued controlled Production release was stopped before integration when
the full npm audit reported two high-severity package entries. The operator then
authorized only a narrow dependency repair, explicitly suspending merge/push/
deployment during that dependency-only step. A later separate authorization
resumed the controlled release after verification and readiness confirmation.

- `813a819` and marker candidate `7793928` had identical package files:
  `vite@8.0.16 -> postcss@8.5.15 -> nanoid@3.3.12`, one copy each.
- The two package entries contain four actual advisories, not two independent
  flaws. See [the dependency audit](phase-26-dependency-audit.md) for exact IDs,
  patched ranges, primary references and the execution-path assessment.
- `69300fd` changes only `package-lock.json`: PostCSS `8.5.28`, nanoid `3.3.19`,
  within existing supported ranges. No direct dependency or major upgrade;
  `package.json`, marker/layout code, tests and settings are unchanged.
- Historical clean installation, full audit including dev (all severities 0),
  typecheck, 51 Node tests, build and diff/security checks passed. Generated CSS
  matched the pre-update build; that comparison was not browser verification.
- The known domain restriction prevents real Kakao localhost/Preview testing.
  The operator chose controlled Production verification, now confirmed for the
  original defect. Localhost/Preview checks remain PARTIAL, not retroactive PASS.
- Release `d7d5e27` included the marker and dependency patches. Main was
  fast-forwarded from `813a819` and pushed normally; Vercel reported success.
  No rollback was executed by Codex or reported by the operator. The safety
  branch remains `813a819`.
- The old two-commit revert plan for `7345326` and `7793928` is incomplete for
  the expanded dependency-patched release. Recovery was re-reviewed before
  release, preferring a separately approved reversal of `7345326` while keeping
  `69300fd`. This was preparation only. `813a819` is an operational baseline,
  not a vulnerability-free dependency baseline.

**한국어:** 빌드 도구 두 개만 호환되는 보안 패치로 갱신했고, 전체 감사에서 취약점은
0건이었습니다. 보안 패치는 마커 수정과 함께 `d7d5e27`로 배포됐습니다. 원래 문제의
Production 확인은 통과했으며, 준비한 복구 절차를 실행한 것으로 기록하지 않습니다.

### Original Marker Regression Evidence

This table records the original local implementation checks, not the later
Production confirmation or newly executed closeout checks.

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

## Production Verification And Closeout

The operator explicitly confirmed that the original marker-position problem
during Kakao zoom was checked on the Production site and is now resolved.
Record this as **operator-confirmed Production visual PASS for `d7d5e27`**.
It is not an individually completed response to the whole earlier checklist.

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Release deployment `d7d5e27` | PASS | Normal main push; exact-commit Vercel success and Production-labelled deployment status; operator subsequently checked the Production site |
| Original zoom marker-alignment defect | PASS, operator visual confirmation | Reported issue considered resolved; no numerical measurement |
| Mobile pinch / device and browser matrix | PARTIAL | Not explicitly recorded |
| Upload picker zoom/pan selection behavior | PARTIAL, browser | Mocked regression PASS is separate; no individual Production result recorded |
| Resize / taxonomy panel / filter camera combinations | PARTIAL, browser | Not explicitly recorded individually |
| Label hover/focus/selected states | PARTIAL, browser | Not explicitly recorded individually |
| Marker/detail identity after filtering / fallback browser rendering | PARTIAL, browser | Relevant mocks pass; no individual Production result recorded |
| Wheel versus controls / pan cycles / animation-time alignment | PARTIAL for individual cases | General original-defect confirmation does not enumerate these cases |
| Localhost / Preview real Kakao | PARTIAL | Domain/configuration limitation; not a release prerequisite under the operator decision |
| Build log secret review | PARTIAL | No explicit full log review recorded |
| Rollback | Not performed / not reported | Recovery preparation is not execution |

During docs-only closeout, typecheck, all 51 Node tests, build and full npm audit
including dev were rerun once and passed; audit counts were again all zero.
Documentation diff, Markdown, whitespace/EOF, forbidden-path and secret-like
checks passed. Clean installation and CSS equality remain historical evidence,
not newly repeated closeout checks. No code, tests, package files or settings
were changed during closeout. No DB action was taken.

The separate `docs: close phase 26 kakao marker alignment` commit may trigger
another deployment. At document preparation its deployment was not yet observed;
use the actual post-push status/final report, not Git push alone. Source/lockfile
equivalence to `d7d5e27` is not a claim that the docs-only build was visually
tested. Its actual hash is recorded in Git/final report, without self-amending.

**한국어:** 원래 마커 위치 문제는 운영자 확인으로 PASS입니다. 모바일 확대, 업로드
위치 선택기, 필터·크기 변경 조합 등 개별 결과는 기록이 없어 PARTIAL로 남깁니다.
종료 문서 배포와 실제 지도를 확인한 배포는 구분하며, 롤백은 실행하지 않았습니다.

## Optional Follow-up Checks (No Save/Submit)

The original defect is closed. These interaction cases remain an optional
follow-up list where no individual result was recorded; they are not all marked
PASS by the general operator confirmation. Localhost/Preview remains restricted.
Future tests require an appropriate permitted environment; do not create or
submit observations. No new phase or further fix starts automatically.

1. 허용된 테스트 환경의 생태지도를 열고 실제 카카오 지도가 표시되는지 확인합니다. 정적
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
unchanged `getPosition()` alone as visual proof. Separate animation-time and
settled measurements would be additional evidence, not a completed check being
claimed as part of this operator-confirmed closeout.

## Official References

- [Kakao Maps API documentation](https://apis.map.kakao.com/web/documentation/):
  `CustomOverlay` position/anchors, `relayout`, projection coordinate spaces.
- [Custom overlay example](https://apis.map.kakao.com/web/sample/customOverlay1/):
  geographic position attached to an SDK overlay.
- [Zoom event example](https://apis.map.kakao.com/web/sample/addMapZoomChangedEvent/):
  documented `zoom_changed` event; no custom zoom-positioning listener needed.

Read during the implementation task. No live observations, private coordinates, SDK request
URLs, environment values, or credentials are recorded here.
