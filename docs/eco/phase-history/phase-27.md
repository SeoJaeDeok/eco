# Phase 27 - Eco Map Filter UX, Auth Refresh, And Related Resource Links

## Status

- Status: Verified, closed for the core Phase 27 requirements.
- Source basis: actual Git/code records, local and Preview evidence, release
  checks, and operator-reported Production browser smoke on `258daaa`.
- All 15 requested core Production checks PASS. Both signup live paths, mail and
  blocked-storage browser fallback remain NOT_RUN; build-log review is PARTIAL.
  Verified does not mean all devices or every authentication exception was tested.

**한국어:** 핵심 요구사항은 운영자 Production 확인까지 통과해 종료합니다.
가입·메일·저장소 차단 등 미실행 항목은 남기며, 모든 기기·예외 경로 검증을 뜻하지 않습니다.

## Goal

- Make Eco Map filters collapsible and deep taxonomy browsing usable at narrow widths.
- Reload once after successful explicit public auth actions, preserving safe
  notices/public-screen return, and add three official biodiversity resource links.

**한국어:** 지도 필터·분류 트리 배치를 개선하고, 인증 성공 후 새로고침과 소개의
공식 생물 정보 사이트 연결을 구현했습니다.

## Main Work

### Phase 27A: Filter And Tree Layout

- One outer disclosure controls search/species/broad-taxon/tree controls plus
  result counts and the compact map observation list. The unfiltered collapsed
  `전체 관찰` summary and its empty margin are omitted; header/reopen/reset remain.
- Mounted state retains selections, expanded branches and loaded-child cache.
  Filtered map/list observations remain aligned; collapse is not a reset/refetch.
- Removed cumulative ancestor indentation, capped total row indentation at 1.5rem,
  and wrapped long names while retaining rank labels, counts and separate actions.
- Native disclosure buttons, aria-expanded/controls, visible focus and hidden
  focus exclusion preserve keyboard use. The standalone list is unchanged.
- Phase 26 map provider, dot anchor, camera preservation and resize handling are
  unchanged; no direct SDK workaround, taxonomy identity/count or repository change.

**한국어:** 필터와 작은 결과 목록을 함께 접되 선택·트리 상태는 보존합니다.
깊은 분류의 누적 여백을 없애고 이름을 줄바꿈하며, 기존 지도 정렬 코드를 유지했습니다.

### Phase 27B: Public Auth Refresh

- App callbacks await repository success before one guarded real page reload.
  Duplicate submissions are blocked; failure permits retry without reload.
- Initial session restoration, token events, StrictMode and tab return do not
  trigger this user-action completion path. Admin flow and logout scope stay intact.
- A dedicated short-lived sessionStorage record restores only an allowlisted
  public page and notice code. It stores no account input, tokens or observation
  data, grants no authorization, and does not replace SDK session persistence.
- Email-confirmation-required remains signed out with a safe notice. Storage
  failure retains the notice/current screen and offers manual refresh. Signup
  and blocked-storage results are automated evidence, not live verification.
- A full auth reload resets transient UI; preserving filters within a mounted
  disclosure is not whole-page filter/photo/draft persistence.

**한국어:** 명시적인 인증 성공 뒤 한 번만 새로고침합니다. 실패나 탭 복귀에는
반복 실행하지 않습니다. 안내 복원과 실제 로그인 세션은 구분하며 가입 live는 미검증입니다.

### Phase 27C: Introduction Resources

- Added `생물 정보 찾아보기` to the existing introduction with 국립생물자원관,
  한반도의 생물다양성 and GBIF. Existing content/navigation remains.
- Three static official HTTPS anchors use new-tab notices, safe rel attributes,
  keyboard focus and wrapping responsive items; no extra page/Navbar entry.
- No API, resolver, scraping, remote image/favicon, tracking or return-tab reload.
  Historical GBIF tool 403 remains distinct from operator browser access PASS.

**한국어:** 소개 하단에서 공식 사이트 세 곳을 새 탭으로 열 수 있습니다.
API·추적 요청은 추가하지 않았으며 도구 접속 오류와 실제 사용자 확인을 구분합니다.

### Phase 27D: Integration And Release

- D-1 reviewed the combined changes and planned Preview-first verification.
- D-2 feature-only push and operator Preview checks passed on `acf6cb7`; real
  Kakao remained PARTIAL there. `258daaa` added only Preview documentation.
- D-3 rechecked the full range and automation, prepared the local backup and
  recovery plan, and obtained separate release/rollback-target/immediate-test
  approval. Main fast-forwarded from `2059adb` to `258daaa` and was pushed normally.
- The operator confirmed Production build/commit and all 15 core browser checks,
  including real Kakao resize/camera/zoom/pan/detail regression. No new errors or
  public email/console secret exposure were reported. No rollback was performed.
- D-4 records these results and closes the phase through documentation only.

**한국어:** Preview 확인 뒤 별도 승인을 받아 운영에 반영했습니다. 실제 Kakao까지
핵심 15개가 사용자 확인 PASS이며, 종료 단계는 문서만 변경합니다.

## Key Files

- `src/components/MapPage.tsx`, `src/components/map/TaxonomyTreePanel.tsx`
- `src/App.tsx`, `src/main.tsx`, `src/features/auth/publicAuthRefresh.ts`
- `src/components/IntroPage.tsx`, `src/components/intro/IntroRelatedSites.tsx`
- `src/constants/biodiversitySites.ts`
- `tests/map-filter-layout.test.mjs`, `tests/fixtures/map-filter-layout.html`,
  `tests/fixtures/map-filter-layout.mjs`
- `tests/public-auth-refresh.test.mjs`, `tests/intro-related-sites.test.mjs`

The deployed range `2059adb..258daaa` contains 11 commits and 19 files: eight
application files, five tests/fixtures and six documents. The closeout adds or
updates only the eight documentation files listed in its final report, not code.

**한국어:** 실제 배포 범위는 Git 기준 11개 커밋·19개 파일입니다. 종료 작업은
운영에서 확인한 코드·테스트·패키지를 그대로 두고 문서 여덟 개만 정리합니다.

## Verification

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Local 27A layout and 27B basic auth | PASS | Prior operator confirmation; B covers 11 basic checks, not signup live |
| Local 27C introduction | 10 PASS | Prior operator actual-app confirmation, not a fixture |
| D-3 pre-release typecheck / full Node tests / build | PASS / 85 PASS / PASS | Historical candidate checks, including six preserved Kakao regressions |
| D-3 dev-inclusive audit | Zero findings | Historical checkpoint, not a permanent security guarantee |
| Actual Preview `acf6cb7` | Core checks PASS; real Kakao PARTIAL | Operator report, preserved in the Preview record |
| Production deployment `258daaa` | PASS | Operator confirmed Production, commit match and build success |
| Production core features | 15 PASS | Operator manual smoke; Codex did not run a browser |
| Real Kakao resize/filter camera, zoom/pan alignment and detail | PASS | Production operator evidence, not inferred from mocks |
| Raw email / console secrets / new regressions | None reported | Scoped operator report, no raw-log audit claim |
| D-4 typecheck / full Node tests / build | PASS / PASS (exit 0) / PASS | Executed once on 2026-09-28; new test-count summary not retained |
| D-4 dev-inclusive audit | Zero findings at every severity | Fresh 2026-09-28 check; no registry error |
| D-4 docs/privacy/equivalence checks | PASS | Eight docs only; non-document tree identical to `258daaa` |

Signup, storage and admin/event tests use mocks/injected orchestration; passing
them does not make excluded live checks PASS. D-1's four supplemental intro-auth
mock cases are not added to the suite total or claimed as rerun during closeout.
The D-4 output collector missed the Node test count-summary format; the successful
exit is recorded, but historical 85 is not substituted as a new captured total.
The actual Production PASS applies to `258daaa`. A docs-only closeout deployment
has a separate status; no new visual test is implied by unchanged source.

**한국어:** 과거 자동 검사와 실제 사용자 확인, 이번 종료 검사는 구분합니다.
운영 PASS는 `258daaa`에 해당하며, 새 문서 커밋의 화면까지 다시 확인한 것은 아닙니다.

## Remaining Risks / Follow-ups

- Both signup live paths, new account/confirmation mail and actual blocked-storage
  fallback: NOT_RUN. Build-log secret review: PARTIAL.
- Exact device/browser coverage, mobile pinch, screen-reader output and measured
  pixel accuracy are not established. Narrow-screen PASS is not all-mobile PASS.
- Older localhost/Preview Kakao limits remain historical; subsequent Production
  PASS does not assert those domains now support Kakao.
- Closeout deployment status must be checked separately; source equality does
  not prove identical deployed artifacts or environment values.
- Wait for the user to choose the next task. Previously planned Phase 28 candidates
  are 20-item observation-list pagination and monthly map filtering by observation
  date. Neither is implemented or started by this archive.

**한국어:** 가입·메일·저장소 차단과 빌드 로그 검토는 남습니다. 사용자가 다음 작업을
선택한 뒤 시작하며, 이전 Phase 28 후보는 관찰목록 20개 페이지네이션과 관찰 날짜 기준
월별 지도 필터입니다.

## Linked Docs

- [Production results and closeout checks](../../architecture/phase-27-production-smoke.md)
- [Preview historical record](../../architecture/phase-27-preview-smoke.md)
- [Integration and recovery preparation](../../architecture/phase-27-integration-release-readiness.md)
- [Filter and tree layout](../../architecture/eco-map-filter-collapse-tree-layout.md)
- [Auth refresh](../../architecture/auth-success-page-refresh.md)
- [Related biodiversity sites](../../architecture/intro-related-sites.md)
- [Current handoff](../../architecture/next-session-handoff.md)

**한국어:** 상세 구현과 환경별 검증 근거는 위 문서에서 확인합니다.

## Commit References

- Previous main: `2059adb docs: close phase 26 kakao marker alignment`.
- `c203f7a feat: add collapsible map filters and responsive taxonomy tree`
- `3d58aad docs: record phase 27a map filter layout`
- `6aa6631 fix: collapse map results with filter panel`
- `a95d2b7 fix: hide unfiltered summary when map filters collapse`
- `af7c854 feat: refresh page after successful public auth actions`
- `c4231a7 docs: record phase 27b auth refresh`
- `c2d592f docs: record phase 27b auth refresh smoke`
- `e22b4d1 feat: add related biodiversity sites to intro page`
- `553d6ba docs: record phase 27c related site links`
- Preview-tested: `acf6cb7 docs: prepare phase 27 integrated release`.
- Production-tested: `258daaa docs: record phase 27 preview smoke`.
- Closeout: `docs: close phase 27 map auth and resource improvements`; obtain its
  actual hash from Git/final report, without amending a self-reference.

**한국어:** 구현·Preview·운영 검증·종료 커밋을 구분합니다. 종료 해시는 생성 후 보고합니다.

## Notes

- Feature branch remains `feature/phase-27c-intro-resource-links` at `258daaa`;
  local `backup/before-phase-27-production` remains `2059adb`. Phase 26 fix/backup
  and Phase 27A/27B branches remain intact. No reset/force/rebase/amend/revert.
- Existing test-account Auth session creation/cleanup was used in manual smoke.
  No new account/mail, observation create/update/delete or coordinate write.
- No package, migration/RPC/RLS/Edge Function, DB schema/data, Auth/Storage/Kakao/
  Vercel setting change. Observation write rules and Phase 26 map/security patches
  are preserved. A frontend auth refresh is not an Auth-service configuration edit.
- Deletion, pagination/monthly filters, photo/EXIF/camera/cropping, unidentified
  observations, Korean-name scientific-name search and comments remain outside
  this phase. No Phase 28 work starts automatically.

**한국어:** 테스트 계정의 로그인·로그아웃 외 계정·관찰 데이터 쓰기는 없었습니다.
DB·설정·패키지는 그대로이며, 종료 작업에서 코드도 변경하지 않았습니다.
