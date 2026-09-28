# Phase 27D-3/D-4 - Production Smoke And Documentation Closeout

## Status And Evidence

- Record date: 2026-09-28 (Asia/Seoul).
- Environment: Production. Visually tested release: `258daaa`.
- Evidence: **operator-reported manual browser smoke**, not a Codex browser run.
  The operator confirmed Production, matching deployment commit and build PASS,
  then explicitly confirmed all 15 requested core checks and no new regression.
- Phase 27 core requirements are Verified and closed through the linked archive.
  This does not establish every authentication exception, device or browser.
- Build-log review remains PARTIAL. Both signup live branches, confirmation mail
  and actual blocked-storage fallback remain NOT_RUN, as detailed below.

**한국어:** 운영자가 Production `258daaa` 화면에서 핵심 15개 항목을 직접 확인해
PASS로 보고했습니다. Codex의 브라우저 검증이 아니며, 미실행 가입 경로 등은 별도로 남깁니다.

## Release And Recovery Record

| Checkpoint | Recorded result |
| --- | --- |
| Pre-Phase-27 main | `2059adb` |
| Actual Preview visual smoke | `acf6cb7`, operator PASS within its recorded scope |
| Reviewed and deployed Production candidate | `258daaa` |
| Release range | `2059adb..258daaa`: 11 commits, 19 files, verified from Git |
| Difference after Preview-tested commit | Only three documentation files; all non-document files identical |
| Separate Production approval | Release, usable rollback target and immediate testing explicitly confirmed |
| Integration | `git merge --ff-only feature/phase-27c-intro-resource-links`; no merge commit |
| Release push | One normal main push; local main/origin/main matched `258daaa`, clean worktree |
| Deployment | Production, matching candidate, build PASS by operator confirmation |
| Production visual result | The operator checked the Production site and confirmed the 15 checks below |
| Feature branch | Preserved at `258daaa` |
| Local safety branch | `backup/before-phase-27-production` preserved at `2059adb`, not pushed |
| Rollback / git revert | Neither executed by Codex nor reported as performed |

Phase 26 authorization was not reused. The earlier Phase 26 fix and backup
branches remain preserved. The old backup at `813a819` predates Phase 26 fixes
and was not used as the Phase 27 recovery baseline. Recovery was prepared only:
an eligible working Vercel deployment for operational recovery, and separately
approved new revert commits derived from the actual Phase 27 release range for
Git reconciliation. No database rollback or SQL action was part of that plan.

## Operator Production Results

The operator's completion report was clarified to cover all 15 checks, including
real Kakao, and no raw email/secret exposure or new errors. No numeric pixel error,
exact viewport dimensions, device list or all-mobile coverage was reported.

| # | Production check | Result |
| --- | --- | --- |
| 1 | Filter controls, result count and compact map observation list collapse together | PASS |
| 2 | Default `전체 관찰` summary is hidden in the unfiltered collapsed state | PASS |
| 3 | Filter selections and expanded tree branches survive collapse/reopen | PASS |
| 4 | Deep taxonomy names, counts and controls remain usable at narrow width | PASS |
| 5 | Tab does not enter hidden filter/result controls | PASS |
| 6 | Real Kakao map loads | PASS |
| 7 | Map resize and filter changes preserve camera and alignment | PASS |
| 8 | Repeated zoom, pan and zoom-out preserve geographic marker alignment | PASS |
| 9 | Marker clicks open the correct observation detail | PASS |
| 10 | Successful login reloads once and restores session/public screen | PASS |
| 11 | Successful logout reloads once and restores the signed-out upload gate | PASS |
| 12 | Failed login does not reload; error and normal retry work | PASS |
| 13 | Tab return/waiting does not cause unnecessary repeated reloads | PASS |
| 14 | Authentication started from introduction restores introduction | PASS |
| 15 | Introduction related-site links, layout, new tabs and keyboard behavior | PASS |

| Additional operator report | Result |
| --- | --- |
| Public raw email exposure | None reported |
| Secret-like console output/exposure | None reported |
| New errors or regressions | None reported |
| Build-log secret review | PARTIAL; not explicitly reviewed |

The reported no-exposure result is scoped to the operator's smoke, not an
independent security audit or a review of raw logs by Codex. Existing Preview
Kakao PARTIAL remains historical evidence in [the Preview record](phase-27-preview-smoke.md).
Production real-map PASS is subsequent evidence, not a rewrite of that result.
The historical GBIF tool 403 is likewise separate from successful operator
browser link checks; no automated destination-access rerun is claimed here.

**한국어:** 필터·인증·소개 링크와 실제 Kakao의 크기 변경·확대·이동·상세 연결이
사용자 확인 PASS입니다. 좁은 창 검증을 모든 모바일 기기 검증으로 확대하지 않습니다.

## Remaining PARTIAL / NOT_RUN

| Item | Status | Evidence boundary |
| --- | --- | --- |
| Signup with immediate session | NOT_RUN live | Existing automated success/reload tests only |
| Signup requiring email confirmation | NOT_RUN live | Existing automated notice and signed-out restoration tests only |
| New account creation / actual confirmation-mail delivery | NOT_RUN | Not part of this smoke authorization |
| Blocked-storage fallback in an actual browser | NOT_RUN | Mock storage exceptions/manual fallback tested, not a live browser check |
| Build-log secret review | PARTIAL | Console report is not build-log inspection |
| Exhaustive device/browser, mobile pinch and screen-reader coverage | Not explicitly recorded | Narrow width and keyboard PASS do not establish all-device coverage |
| Separate upload-picker or detailed marker-label hover/focus combinations | Not explicitly recorded in this smoke | Do not extend the 15-item confirmation to other checklists |

Basic login/logout PASS does not mean every authentication path is live-verified.
No settings change, account creation or mail action is authorized by these gaps.

## Automated Evidence Versus Browser Evidence

Historical D-3 pre-release checks on the unchanged `258daaa` candidate passed:
typecheck, 85 Node tests (0 failed/skipped), build, dev-inclusive audit with zero
findings at that checkpoint, and diff/format/privacy/boundary checks. The tests
include six preserved Phase 26 Kakao regressions, nine filter-layout tests,
eighteen auth tests and seven related-site tests. Mocks and server rendering are
not browser or real SDK evidence. D-1's four supplemental intro-auth mock cases
are historical and are not added to the 85-test suite or claimed as rerun here.

### D-4 Closeout Checks

The following are separate from the earlier release checks and operator smoke:

| Executed closeout check | Result |
| --- | --- |
| Typecheck | PASS, executed once on 2026-09-28 |
| Full Node suite | PASS, exit 0; this run's numerical summary was not retained |
| Build | PASS, 2191 modules transformed; local build only |
| Full audit including development dependencies | Zero findings at every severity on 2026-09-28; no registry error |
| Diff / Markdown / whitespace / EOF / forbidden paths / secret-like scan | PASS; eight intended documents, no secret-file read |
| Non-document tree equivalence to `258daaa` | PASS; source/tests/assets/packages/backend/config unchanged |

Commands: `npm.cmd run typecheck`,
`node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`,
`npm.cmd run build`, `npm.cmd audit --include=dev --audit-level=high --json`,
and `git diff --check`. Each app/test/audit command ran once. The test output
collector retained the successful exit status but missed the count-summary
format. The suite was not rerun solely to recover that count, and the historical
85 is not presented as a newly captured total. No new browser test was performed.

No dependency installation/update, Docker, WSL, local Supabase stack, remote SQL
or account/browser action is needed for the documentation closeout.

## Auth, Data And Settings Boundary

- The operator used an existing approved test account in shared Supabase Auth.
  Normal login/logout session creation and cleanup occurred; it would be false
  to describe the smoke as having no Auth-service interaction.
- The existing default global logout scope was retained. Credentials were entered
  privately in the browser; no cookie/storage/token dump was requested or made.
- No new account, confirmation email, observation create/update/delete or saved
  coordinate change was part of the smoke or closeout.
- No DB schema, migration, RPC, RLS, Edge Function, Auth/Storage/Kakao/Vercel
  configuration or package changes. Approved-only public reads, server-only
  resolution cache, stored-data-only taxonomy browsing and safe display remain.
- Closeout edits documentation only. Application, tests, public assets, lockfile
  and deployment configuration stay identical to the Production-tested release.

## Documentation Deployment And Next Step

Closeout message: `docs: close phase 27 map auth and resource improvements`.
Its actual hash and normal main push result belong in Git and the final report;
the document is not amended to insert its own hash.

A docs-only main push may start another Production deployment. Its status is
not observed at document preparation; check it separately after push. The
visual PASS remains tied to `258daaa`, not to an untested closeout deployment.
Source equivalence is not a comparison of deployed build artifacts or environment
values. Do not make another commit just to update a transient deployment status.
No connected Vercel/GitHub status tool or installed Vercel/GitHub CLI was available
at closeout; an unobserved status is not a build failure or a claim of success.

See [Phase 27 archive](../eco/phase-history/phase-27.md) and
[current handoff](next-session-handoff.md). Wait for the user's next task choice.
The previously planned Phase 28 candidates are 20-item observation-list pagination
and monthly map filtering by observation date; neither is started by closeout.
