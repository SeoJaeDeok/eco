# Phase 27C - Introduction Related Biodiversity Sites

## Status And Scope

- Base: `c2d592f` on Phase 27B, including all Phase 27A work.
- Branch: `feature/phase-27c-intro-resource-links`; main stays `2059adb`.
- Code/test commit: `e22b4d1 feat: add related biodiversity sites to intro page`.
- Implemented locally with automated checks PASS. Actual responsive layout,
  keyboard navigation and outbound clicks remain PARTIAL.
- No main merge, push, Preview/Production deployment or completed Phase 27 archive.

한국어: 기존 소개 화면 아래에 공식 생물 정보 사이트 세 곳을 추가했습니다.
자동 검사는 통과했지만 실제 화면·링크 클릭 확인은 남아 있습니다. 아직 배포하지 않았습니다.

## Placement And UI

`src/components/IntroPage.tsx`, reached through the existing public `intro`
AppRoutes branch, renders `IntroRelatedSites` after SpeciesGrid. Existing heading,
search, taxon selection, species cards and the map-navigation button are unchanged.
The new section is independent of observation/search results and requires no login.
There is no new Navbar entry, independent page, repository or API layer.

The section title is `생물 정보 찾아보기`, followed by a short external-resource
description. Three simple bordered items follow the existing white/zinc/serif
style. A one-column mobile list becomes three columns at the existing large
breakpoint. Shrinkable items and wrapping names/descriptions avoid fixed heights,
ellipsis-only copy and horizontal hiding. The section itself is unframed.

Static data lives in `src/constants/biodiversitySites.ts`, with only id, name,
description and href. There are exactly three entries:

| Name | Static official destination | Korean description |
| --- | --- | --- |
| 국립생물자원관 | https://www.nibr.go.kr/ | 생물자원 연구와 전시·교육 정보를 확인할 수 있습니다. |
| 한반도의 생물다양성 | https://species.nibr.go.kr/ | 국명·학명으로 우리나라 생물의 형태·생태·분포 정보를 찾아볼 수 있습니다. |
| GBIF | https://www.gbif.org/ | 전 세계 생물종과 관찰·표본 기록 등 생물다양성 데이터를 찾아볼 수 있습니다. |

No affiliation, partnership or endorsement claim is made. No institutional
logo/photo was downloaded or added; the only new icon is the existing lucide
ExternalLink component.

## Official Source And Connection Evidence

Checked on **2026-09-26 (Asia/Seoul)**. Official-source verification, tool access
and actual app clicks are different evidence categories. No external-site
availability is required by the automated tests.

| Destination | Official source / description | Tool access | Actual app click |
| --- | --- | --- | --- |
| 국립생물자원관 | PASS: official homepage includes biological research and exhibition/education sections | PASS: homepage content retrieved | PARTIAL: not performed |
| 한반도의 생물다양성 | PASS: NIBR's official site directory links this hostname and describes Korean/scientific-name search and morphology/ecology/distribution | PARTIAL: root returned title metadata but no extracted body; full usable page not verified | PARTIAL: not performed |
| GBIF | PASS: official GBIF training/technical documentation confirms worldwide biodiversity, species, specimen and observation data | PARTIAL: root access returned 403; supplied about page had a tool fetch error | PARTIAL: not performed |

Sources actually consulted:

- [NIBR homepage](https://www.nibr.go.kr/): research and exhibition/education.
- [NIBR official site directory](https://www.nibr.go.kr/cmn/sym/mnu/mpm/115040000/htmlMenuView.do):
  identity and services of [한반도의 생물다양성](https://species.nibr.go.kr/).
- [GBIF about page](https://www.gbif.org/what-is-gbif): attempted, content not
  retrieved by the tool; not counted as successful direct access.
- [GBIF official training introduction](https://training.gbif.org/en/intro-to-gbif/about-gbif)
  and [GBIF dataset classes](https://techdocs.gbif.org/en/data-publishing/dataset-classes):
  successfully retrieved official alternatives supporting the description.
- [MDN anchor element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a):
  native link semantics, new-window warning and target/rel attributes.

403/tool errors do not establish a closed site or HTTP 404. No certificate checks
were disabled and no access restriction was bypassed. Destinations remain the
three approved homepage URLs, not substitutes from search results. Runtime code
does not perform these verification requests.

## Link Behavior, Accessibility And Privacy

- Each item is one native anchor with a fixed HTTPS href, target `_blank` and
  rel `noopener noreferrer`. There are no nested buttons/links or window.open calls.
- Visible `새 탭에서 열기` text accompanies the icon. aria-labelledby combines
  the site's visible heading and that warning; aria-describedby associates the
  description. The decorative icon is aria-hidden.
- Native Tab/Enter semantics are retained; focus-visible provides an outline.
  Actual focus painting, Tab traversal and screen-reader output are not proven
  by server rendering and remain manual checks.
- No query string, personal/observation data, auth state or arbitrary return URL
  is appended. No new fetch, iframe, remote favicon/image, OG preview, prefetch,
  analytics, resolver or automatic link-health request is introduced.
- Returning from another tab does not invoke new reload logic. Phase 27B's public
  auth coordinator and all Phase 27A/26 map/filter/provider code are unchanged.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Focused related-site tests | 7 PASS | Exact data, unique IDs, HTTPS host allowlist, native link/accessibility props, layout classes, actual IntroPage server rendering, no automatic requests |
| Full Node tests | 85 PASS | Previous 78 plus 7; auth, map/filter and Kakao regressions preserved |
| Typecheck | PASS | npm.cmd run typecheck |
| Production build | PASS | npm.cmd run build; local artifact only, not a deployment |
| Full dependency audit including dev | 0 vulnerabilities | All severities zero at this check; not a permanent guarantee |
| Diff / Markdown / whitespace / EOF / forbidden paths / secret-like changes | PASS | Intended files only; no secret files read |
| Local normal app | HTTP 200 | Loopback port 3004, mock/static mode; not browser proof |
| Actual responsive layout / keyboard / three outbound clicks / returning tab | PARTIAL | Browser tool connection failed before any page inspection |

Commands:

```text
npm.cmd run typecheck
node --loader ./tests/ts-extension-loader.mjs --test tests/intro-related-sites.test.mjs
node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs
npm.cmd run build
npm.cmd audit --include=dev --audit-level=high
git diff --check
```

The new tests execute the real IntroPage and its components using the installed
React server renderer. They are not a separately copied fixture. HTML output and
component props establish wiring/contracts, not browser layout or external-site
availability. No new test tooling/dependency was installed.

## Manual Follow-up

The local mock/static app runs at `http://127.0.0.1:3004/`. Existing servers were
left alone. No credentials, account creation or observations are needed.

1. 로그인하지 않고 로컬 앱의 `소개`를 엽니다. 기존 검색·생물 목록·`생태지도 보기`와
   하단 `생물 정보 찾아보기`의 세 사이트가 모두 있는지 확인합니다.
2. 화면 폭을 320 또는 390px와 1280px로 바꿔 이름·설명이 잘리지 않고 가로로 넘치지
   않는지 확인합니다. 좁은 화면은 한 열, 넓은 화면은 세 열이어야 합니다.
3. Tab으로 링크에 이동해 초점 테두리와 `새 탭에서 열기` 안내를 확인하고 Enter로
   엽니다. 세 링크가 각각 의도한 공식 사이트로 열리는지 확인합니다.
4. 원래 앱 탭이 남아 있고 돌아왔을 때 불필요한 새로고침이나 검색 초기화가 없는지
   확인합니다. 오류가 있으면 사이트 이름과 안전한 증상만 공유합니다.

## Preserved Evidence And Boundaries

- Phase 27A operator-confirmed layout behavior and Phase 27B's 11 basic local-app
  operator PASS results remain intact; this task does not reclassify prior evidence.
- New account creation, confirmation mail, both signup live paths and actual
  blocked-storage fallback remain NOT_RUN. Real Kakao zoom/pan remains PARTIAL.
- App shell/auth, map/filter/provider, observation workflows/repositories,
  package.json/lockfile, DB data, migrations/RLS/Edge Functions, Auth/Storage,
  Kakao and Vercel configuration are unchanged. No SQL, Docker or local DB reset.
- No push/deployment. Next: decide Phase 27 integration verification and release
  plan separately; do not reuse the earlier Phase 26 Production authorization.
