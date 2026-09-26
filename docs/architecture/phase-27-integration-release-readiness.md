# Phase 27D-1 - Integrated Verification And Release Preparation

## Decision And Scope

- Review date: 2026-09-26 (Asia/Seoul).
- Status: implementation and available automated checks PASS; local operator
  evidence recorded. **Conditional release preparation, not deployment approval
  or completion of Phase 27.** No confirmed application bug was found in this review.
- Continue on `feature/phase-27c-intro-resource-links`; no new review branch.
- Review started at clean `553d6ba`. After `git fetch origin`, both local main
  and origin/main are `2059adb`, an ancestor of the candidate.
- Phase 27A/27B/27C implementation is included. This step changes documentation
  only; the application/test/package tree remains identical to `553d6ba`.
- No push, merge, deployment, promotion, rollback or account/observation action.

한국어: 세 작업을 함께 점검했고 자동 검사는 통과했습니다. 사용자 수동 확인 범위도
기록했습니다. 다만 가입·저장소 차단·실지도 등 미확인 항목과 배포 승인 절차가 남아
있으므로 모든 검증 완료나 운영 배포 승인으로 표현하지 않습니다.

## Reviewed Commit Range

Application review range: `2059adb..553d6ba`, nine commits in oldest-first order:

| Commit | Change |
| --- | --- |
| c203f7a | feat: add collapsible map filters and responsive taxonomy tree |
| 3d58aad | docs: record phase 27a map filter layout |
| 6aa6631 | fix: collapse map results with filter panel |
| a95d2b7 | fix: hide unfiltered summary when map filters collapse |
| af7c854 | feat: refresh page after successful public auth actions |
| c4231a7 | docs: record phase 27b auth refresh |
| c2d592f | docs: record phase 27b auth refresh smoke |
| e22b4d1 | feat: add related biodiversity sites to intro page |
| 553d6ba | docs: record phase 27c related site links |

The D-1 documentation commit adds to that history without changing the reviewed
application. Identify its actual hash through Git; do not amend a self-reference.
Any later deployment must record the exact then-reviewed HEAD and freshly fetched
main baseline, rather than blindly treating `553d6ba` as the final release HEAD.

The reviewed 17-file range consists of eight application files, five tests/fixtures
and four documents. This new readiness document makes the prepared range 18 files:

```text
src/App.tsx
src/main.tsx
src/features/auth/publicAuthRefresh.ts
src/components/MapPage.tsx
src/components/map/TaxonomyTreePanel.tsx
src/components/IntroPage.tsx
src/components/intro/IntroRelatedSites.tsx
src/constants/biodiversitySites.ts
tests/map-filter-layout.test.mjs
tests/fixtures/map-filter-layout.html
tests/fixtures/map-filter-layout.mjs
tests/public-auth-refresh.test.mjs
tests/intro-related-sites.test.mjs
docs/architecture/eco-map-filter-collapse-tree-layout.md
docs/architecture/auth-success-page-refresh.md
docs/architecture/intro-related-sites.md
docs/architecture/next-session-handoff.md
docs/architecture/phase-27-integration-release-readiness.md
```

No unrelated feature, package, migration/RPC/RLS, backend, repository or deployment
configuration changes were found. Byte-equivalent Git comparisons confirmed:

- Phase 27A map/tree and layout tests/fixtures unchanged since `a95d2b7`.
- Phase 27B App/entry point/helper/auth tests unchanged since `c2d592f`.
- Phase 27C IntroPage/component/data/tests unchanged since `e22b4d1`.
- Phase 26 map-provider code, marker tests and package files unchanged from main.
  The lockfile retains PostCSS 8.5.28 and nanoid 3.3.19; no dependency update here.
- Main, Phase 26 fix branch, Phase 27A/27B branches and the old backup are preserved.
  The old backup at `813a819` is not a Phase 27 recovery target: it predates Phase 26.

## Interaction Review

### Filters And Map

MapPage uses one `areFiltersExpanded` state and two mounted native-hidden regions
for controls and results. Counts, compact list and empty feedback hide together.
The unfiltered collapsed summary is omitted, while the title, reopen button,
active summary/chip and existing reset remain usable. The map is outside the
hidden regions; both map and list still receive the same filtered collection.
Disclosure does not reset selection, unmount the tree/map or refetch taxonomy.
Selected observations remain App-owned. Hidden results use current incoming data.

Tree indentation is capped at 1.5rem total; ancestors add no accumulating padding.
Long names wrap, rank/count/action columns remain distinct, and expansion does
not select a node. Loaded children and errors stay in the existing component.
The standalone observation list and Kakao provider were not modified by Phase 27.
Actual resize/camera behavior still needs real-map verification despite passing mocks.

### Explicit Auth Success Versus Passive Events

Public Navbar/UploadLoginGate callbacks reach App, which awaits AuthRepository
success before calling the guarded refresh helper. Pending duplicates are blocked;
failure releases the guard and does not reload. Successful sign-out still uses
the existing repository/SDK call without changing its documented global scope.
Admin callbacks, role checks and the hidden route are unchanged.

SDK session restoration supplies authentication state. The separate five-minute
sessionStorage record supplies only an allowlisted public page and notice code,
version and timestamp. It does not grant a session/role, copy credentials or store
filters/photos/drafts. Entry-point consumption before StrictMode is one-time.
Email-confirmation-required stays signed out; blocked storage keeps the notice
and manual-refresh option rather than losing the notice to an automatic reload.

There is no app-level onAuthStateChange subscription, focus/storage/visibility
reload handler or timer-triggered reload. Initial session/SDK token events are not
connected to the completion helper. Existing SDK internals remain untouched.

### Introduction Links And Auth Return

IntroPage renders related sites without an auth gate, below existing species
content. Links are fixed HTTPS anchors with new-tab notices and safe rel attributes.
No click handler, external API, resolver, iframe, remote image/favicon, tracking
or return-tab reload was introduced. Existing internal map navigation remains.

An additional in-memory check reused the actual App test harness to exercise
login, logout, signup-with-session and signup-confirmation starting from `intro`.
All four stored `intro`, requested one reload after success and restored `intro`
on the simulated next mount. Restored authentication came from the mocked
repository, not metadata; confirmation stayed signed out with its notice.
Simulated passive events did not cause another reload. This is mock evidence,
not a new live signup/login or browser navigation result. No test file was changed.

Filter state survives collapse within the mounted page, not a full document
reload or page unmount. Auth reload intentionally resets transient UI state while
restoring the public section. No new filter/draft/photo persistence was added.

## Combined Verification Matrix

Historical operator checks are reused because their relevant source files did
not change. The D-1 automated results are fresh; operator checks were not rerun by
Codex. The operator explicitly clarified that all ten Phase 27C checks are PASS.

| Confirmed implementation | Fresh automated evidence | Operator manual evidence | Remaining PARTIAL / NOT_RUN | Before deployment |
| --- | --- | --- | --- | --- |
| 27A controls/results disclosure, default-summary hiding | 9 layout tests PASS, state/cache/result IDs preserved | Prior requested layout behavior PASS | Exact viewport/device and hidden-focus coverage not individually recorded | Recheck deployed build, especially narrow layout and hidden Tab targets |
| 27A seven-rank layout and separate expansion/selection | Bounded indentation, full labels/counts, pending children/retry PASS | Prior deep-tree layout PASS | No pixel measurements or all-device claim | Narrow/wide deployment spot check |
| 27B login/logout, one reload, failure/retry, upload restoration | 18 auth tests PASS including awaited callbacks/guards | Prior basic 11 local-app checks PASS | No claim of every auth path/device | Existing approved account smoke on chosen deployment; no new account needed |
| 27B signup with immediate session | Mock success and one reload PASS | No live result | NOT_RUN | Review residual risk or separately authorize a live test; do not create accounts now |
| 27B signup requiring email confirmation | Mock notice persistence, signed-out restoration PASS | No live result | Signup/mail NOT_RUN | Same explicit risk/test decision; do not change Auth settings |
| 27B blocked-storage fallback | Mock errors/manual refresh/own-key-only handling PASS | No browser result | NOT_RUN | Record risk or test non-mutating fallback separately; mocks do not prove SDK persistence |
| 27C three links, layout, keyboard, new tabs and returning tab | 7 tests PASS, actual IntroPage server rendering | Current local-app 10 checks PASS | Screen-reader/all-device coverage not reported; earlier automated destination access partial | Recheck deployment; tool 403 alone is not a link-implementation blocker |
| Intro auth return and passive events | 4 supplemental mock scenarios PASS, separate from suite count | Intro-specific auth return not separately reported | Live intro-auth round trip NOT_RUN | Include one existing-account round trip in chosen deployment smoke |
| Phase 26 map alignment/camera/picker/static fallback retained | All 6 existing Kakao regressions PASS; provider unchanged | Phase 26 historical Production defect PASS, not Phase 27 smoke | Current real Kakao zoom/pan PARTIAL | Approved-origin verification or explicit risk decision; local restriction is not UI failure |

New account creation, confirmation-mail delivery and both signup live branches
remain NOT_RUN. No account/mail action was authorized or performed. These are
explicit follow-up risks, not a reason to alter settings or overwrite the existing
basic-auth PASS. Do not describe all authentication as live-verified.

### Phase 27C Operator Record

Environment: local actual introduction page. Evidence: operator-confirmed manual
verification, not a fixture or agent browser run. The ten results are recorded in
`intro-related-sites.md`: signed-out display, narrow layout, wide layout, each of
the three official destinations, new tabs, Tab/Enter/focus, returning without
reload, and retained original content/buttons. All PASS; no error was reported.
No exact device models, pixel widths, measurements or screen-reader run were reported.

Historical GBIF automated access returned 403; the operator now reports successful
browser access. Both records remain valid within their different contexts. No link
was replaced and no security check was bypassed. External downtime on a correct
destination should be distinguished from a wrong href, blocked click or lost app tab.

## Fresh D-1 Checks

| Executed check | Result |
| --- | --- |
| npm.cmd run typecheck | PASS |
| node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs | 85 PASS, 0 failed/skipped |
| Supplemental actual-App mock script | 4 intro-auth scenarios PASS; not added to the 85-test count |
| npm.cmd run build | PASS; local artifact only |
| npm.cmd audit --include=dev --audit-level=high | 0 findings at all severities, including dev |
| git diff --check and git diff --check main...HEAD | PASS |
| Full Phase 27 diff secret-like scan and forbidden tracked paths | PASS; official public links permitted |
| UTF-8 / whitespace / EOF / Markdown fences and tables | PASS |
| Frontend forbidden-call scan and preserved-boundary Git comparisons | PASS |

The first supplemental-script attempt could not resolve TypeScript from an
in-memory module and did not execute assertions. Correcting only that temporary
runner's import resolution allowed all four checks to run successfully. This was
a runner error, not an app defect; no application/package/test file was patched.
The existing Node loader emits its experimental-loader warning; it is not a test
failure. No new browser run, live account operation, network link recheck or clean
dependency installation is claimed here. The zero-finding audit is time-specific.

## Deployment Options: Plan Only

### A. Feature-Branch Preview First (Recommended)

After separate approval, confirm the existing project's Git production branch and
Preview branch/environment-variable scope, then normally push the selected feature
branch. Verify the actual deployment environment and exact commit. Preview can test
layout, existing-account auth and links without changing Production; a shared DB
would still be a real shared service, so no observation/signup writes are implied.
Kakao restrictions leave only real-map behavior PARTIAL, not the whole Preview smoke.
Branch-specific Preview variables must be checked later; no values/settings were
inspected or changed in D-1. This follows the distinction in
[Vercel environments](https://vercel.com/docs/deployments/environments).

### B. Controlled Production Real-Map Verification

Only with a separate Phase 27 Production approval, after other checks and residual
risk decisions, use an inspected candidate and safe fast-forward integration if
history permits. Before any main push, verify the working Production deployment,
eligible recovery target, operator access and immediate test window. Local/Preview
domain limits can justify that controlled map test, not an unreviewed release.
Phase 26 authorization is expired for this purpose and cannot be reused.

Recommendation: A first, then B only for remaining real-map verification if needed.
No deployment path, environment-variable readiness, rollback eligibility or operator
test window has been approved/confirmed by the current manual-PASS message.

### Pre-Release Checklist (Future Authorized Step)

1. Re-fetch; confirm main and candidate, clean tree, ancestor relationship and
   exact introduced commit/file range, including this documentation commit.
2. Reconfirm unchanged packages/provider/backend and rerun release checks as needed.
   A new audit finding or registry failure holds readiness for a separate decision;
   do not update or suppress dependencies automatically.
3. Confirm Preview environment/branch scope and shared-data boundary privately.
   Recheck 27A, 27B basic auth and intro-auth return, and 27C on that actual build.
4. Before Production, explicitly resolve or accept the signup/storage/device gaps;
   confirm a current eligible recovery deployment preserving Phase 26, immediate
   testing availability and separate Production authorization.

### Post-Deployment Checklist (Not Executed)

1. Verify environment, exact commit, successful build and the actual served build;
   HTTP 200 alone is not functional verification. Record log review separately.
2. Confirm filter/results hiding, reopen state/cache, long tree labels and map/list
   agreement; original observation-list page and detail selection remain usable.
3. With an existing approved account, check one login/logout reload, failure/retry,
   upload and intro return, safe display and no tab-return loop. No signup/mail or
   observation save unless separately authorized.
4. Check three links, keyboard, new tabs and original content on narrow/wide views.
5. On an approved Kakao origin, check zoom/pan, label anchors, filter/panel/resize
   camera preservation, marker/detail identity and picker without form submission.
   Mobile pinch remains PARTIAL if not tested. Stop on regression; do not patch live
   repeatedly or treat an optional PARTIAL as automatic rollback authorization.

## Recovery Draft: No Execution

**Operational recovery:** identify an actually available, previously working
Production deployment before release. `2059adb` is the Git baseline and preserves
Phase 26, but a Git hash does not prove the matching deployment is available in
the account. The old `813a819` backup predates Phase 26 and must not be reused as
the default target. If no suitable target exists, obtain explicit acceptance of
the slower new-Git-commit/rebuild recovery route before any Production release.

Vercel rollback eligibility is account/plan-dependent and applies to deployments
that previously served Production. Instant Rollback redirects domains to an old
build; it does not reconcile Git. After rollback, production-domain auto-assignment
is disabled, so a subsequent push alone does not necessarily replace the restored
site. Inspect that state and select a verified safe recovery build when restoring
normal assignment, never the known-faulty candidate. See
[Vercel Instant Rollback](https://vercel.com/docs/instant-rollback) and
[promotion behavior](https://vercel.com/docs/deployments/promoting-a-deployment),
checked 2026-09-26. No Dashboard action was taken in this review.

**Git recovery:** after explicit recovery approval, inspect the then-deployed range
and subsequent work. Use new revert commit(s), not reset/rebase/force push. The
currently reviewed implementation groups are C (`e22b4d1`), B (`af7c854`) and A
(`a95d2b7`, `6aa6631`, `c203f7a` in reverse order). Prefer the smallest confirmed
faulty group. A follow-up commits also contain documentation and may conflict with
later notes; review those conflicts rather than discarding history. This is not
a blindly executable revert list or a claim of a conflict-free dry run.

A full Phase 27 source recovery would be derived from the complete introduced
range above plus any later release commits, with unrelated later work preserved.
Never blindly revert HEAD (often docs), use the old Phase 26 marker revert, or
revert `7345326` / `69300fd`. Confirm recovered application behavior and unchanged
Phase 26 provider/package files against `2059adb`, run typecheck/tests/build/audit,
add a recovery note and normally push only under new authorization. Git revert
records new history rather than replacing it: [official Git reference](https://git-scm.com/docs/git-revert).
There is no database rollback or SQL action in this plan.

## Boundaries And Next Decision

This D-1 commit contains only this readiness note, the related-sites operator
record and the handoff. Application code/tests/packages are unchanged. No DB,
observation, migration, RPC, RLS, Edge Function, Auth, Storage, Kakao or Vercel
setting operation; no Docker/WSL/local stack/reset. Phase 27 remains open.

Next single operator decision: choose whether to proceed with **feature-branch
Preview first** in a separately authorized step. Do not treat this document or
the manual PASS report as merge/push/Production approval.
