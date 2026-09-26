# Phase 27D-2 - Preview Deployment And Integrated UI Smoke

## Status And Evidence Scope

- Recorded on 2026-09-26 (Asia/Seoul).
- Branch: `feature/phase-27c-intro-resource-links`.
- Preview-tested application commit: `acf6cb7`.
- Main and freshly fetched origin/main remain `2059adb`.
- Status: Preview build and core 27A/27B/27C smoke PASS by operator confirmation.
  This is not Production verification or completion of Phase 27.
- The operator confirmed the deployment environment, matching commit and build,
  then reported that all checks passed after receiving the Preview checklist.
  This report is scoped to that checklist's basic UI/auth/link checks. Previously
  excluded signup/storage and real-map checks are not promoted to PASS.
- Agent browser connection failed before any page inspection. No automated
  browser, fixture screenshot, HTTP response or prior local manual result is
  presented as this Preview's visual evidence.

한국어: `acf6cb7` Preview에서 필터·인증·소개 링크의 기본 검증을 사용자가 통과했다고
확인했습니다. 실제 Kakao와 빌드 로그 검토는 PARTIAL, 가입·메일·저장소 차단은
NOT_RUN으로 남깁니다. 운영 사이트에 반영하거나 Phase 27을 종료하지 않았습니다.

## Environment And Git Deployment

The operator confirmed the following before the feature-branch push:

| Setting | Confirmed scope |
| --- | --- |
| Production branch | main |
| Current feature branch environment | Preview |
| Preview variables | all_preview |
| Unexpected branch-specific override | no |
| Existing Supabase connection/auth readiness | yes |

The names checked were `VITE_OBSERVATION_REPOSITORY`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET` and
`VITE_KAKAO_MAP_JAVASCRIPT_KEY`. No values, credentials, project addresses or
environment files were requested, read or printed. Frontend variables must not
contain service-role/server secrets; no settings were changed by this work.

Repository inspection found no GitHub deployment workflow, active pre-push hook
or package build script that deploys the database. `vercel.json` retains only the
existing SPA rewrite. External platform automation was not independently audited.
The current Git diff preserves Phase 26 map/provider code and dependency fixes.

After fresh checks and the environment confirmation:

```text
git push -u origin feature/phase-27c-intro-resource-links
```

The normal push succeeded. A subsequent fetch confirmed local and remote feature
HEAD both `acf6cb7`, upstream tracking and clean worktree; main/origin/main remained
`2059adb`. No force push, main checkout/merge/push or deployment promotion occurred.
The ten-commit candidate `2059adb..acf6cb7` contains 27A/27B/27C and preparation docs.

| Actual deployment check | Result | Evidence |
| --- | --- | --- |
| Environment | Preview | Operator Dashboard confirmation |
| Deployment commit matches acf6cb7 | yes | Operator confirmation for the named branch/candidate |
| Build | PASS | Operator Dashboard confirmation, not inferred from push |
| Build-log secret review | PARTIAL | No explicit report of log inspection |
| Production deployment/promotion | Not performed | Feature-only push; main preserved |

Official references checked during D-2: [Vercel Git deployments](https://vercel.com/docs/git)
and [environment-variable scope](https://vercel.com/docs/environment-variables).
Preview variables may be global or branch-specific; branch-specific values take
precedence. Changed variables apply to a subsequent deployment. These general
rules do not replace the operator's project-specific confirmation above.

## Operator Preview Smoke

Evidence: the operator's all-checks-passed reply to the actual Preview checklist,
after confirming the deployment. No exact viewport dimensions, device models,
pixel measurements or screen-reader test were reported. Safe error summary:
none reported. The basic results below are not copied from the earlier local PASS.

| Preview check | Result |
| --- | --- |
| filter_collapse | PASS |
| results_hidden_when_collapsed | PASS |
| unfiltered_summary_hidden | PASS |
| filter_tree_state_preserved | PASS |
| deep_tree_narrow_layout | PASS |
| keyboard_hidden_controls | PASS |
| login_reload_once_session_retained | PASS |
| logout_reload_once_gate | PASS |
| failed_login_no_reload_retry | PASS |
| no_reload_loop_on_tab_return | PASS |
| intro_auth_screen_restored | PASS |
| intro_three_links_new_tabs | PASS |
| intro_layout_keyboard | PASS |
| raw_email_seen | no, within the operator's basic smoke report |
| secret_like_console_output_seen | no, within the operator's basic smoke report |
| build_log_secret_review | PARTIAL; not explicitly inspected/reported |
| real_kakao_regression | PARTIAL; previously excluded, no separate real-map result |

The supplied checklist covered retained headers/reopen/reset controls, current
filter results and expanded branches, narrow seven-rank layout, hidden Tab targets,
the standalone list's unchanged role, signed-out introduction, retained original
content/buttons and all three official destinations in new tabs. Its auth checks
included an existing-account upload login round trip, logout gate, one failed
password attempt followed by a valid retry, intro return and passive tab switching.
Reload counts were part of the requested check, not inferred from signed-in UI alone.

The agent did not inspect console/log contents or use account credentials.
The console/no-email results are scoped operator reports, not independent security
audits. Historical GBIF tool access returned 403; the Preview operator reports
successful actual browser link checks. Neither result erases the other context.

No separate report establishes whether real Kakao or fallback supplied the map
surface. The layout PASS therefore does not establish camera/marker alignment.
Existing static fallback remains available; a Kakao domain restriction does not
invalidate filter/auth/link smoke or prove a Supabase connection failure.

## Auth And Shared-Data Boundary

- Scope was existing approved test-account login/logout in the configured shared
  Supabase Auth service, with credentials entered privately by the operator.
- Normal Auth session creation/cleanup is the only authorized service-side effect.
  The existing SDK `signOut()` call and default global scope were unchanged.
  Before testing, the operator was warned about effects on that same account's
  other test sessions. No account/profile/observation changes were part of smoke.
- No new accounts, confirmation emails, observation creates/edits/deletes, SQL,
  database reset or configuration changes were performed by Codex or requested.
- SDK session restoration remains separate from the safe one-time page/notice
  record. No cookie/localStorage/session token extraction or dump was performed.
- Admin auth/authorization, repositories, approved-only public reads, taxonomy
  resolution and safe observer display were not modified.

## Remaining Checks

| Item | Status and consequence |
| --- | --- |
| New account creation / confirmation mail | NOT_RUN; excluded from this authorization |
| Signup with immediate session | NOT_RUN live; existing mock tests PASS only |
| Signup requiring email confirmation | NOT_RUN live; existing notice/restore mock tests PASS only |
| Browser storage-blocked fallback | NOT_RUN; existing mocks do not prove real-browser behavior |
| Real Kakao camera/marker/picker regression | PARTIAL; a separately approved origin/test is needed |
| Build-log secret review | PARTIAL; console smoke is not build-log inspection |
| Exhaustive device/screen-reader coverage | Not explicitly recorded |
| Production smoke | NOT_RUN; no Production release authorized in D-2 |

Basic authentication PASS does not mean every signup/storage/device path is
live-verified. Do not change Auth/Kakao settings or create accounts to close these
gaps without separate approval. No failure was reported that requires a code patch.

## Automated Verification

Fresh D-2 pre-push checks used the existing tools and unchanged dependencies:

| Executed check | Result |
| --- | --- |
| npm.cmd run typecheck | PASS |
| node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs | 85 PASS, 0 failed/skipped |
| npm.cmd run build | PASS; local build artifact only |
| npm.cmd audit --include=dev --audit-level=high | 0 findings at all severities at that check |
| git diff --check and full candidate diff check | PASS |
| Full Phase 27 diff/commit-addition secret-like scan | PASS; approved public institution links are allowed |
| Forbidden tracked files / UTF-8 / whitespace / EOF / Markdown | PASS |
| Phase 26 provider/tests/packages and backend/config comparisons | Unchanged from main |

The 85 tests include six Kakao regression tests, nine filter-layout tests, eighteen
auth tests and seven related-site tests. They are mocks/server-rendering/contracts,
not real Preview browser tests. D-1's four supplemental intro-auth mock scenarios
remain historical and are not added to 85 or claimed as rerun in D-2.

The documentation follow-up reran typecheck, the same 85-test suite, build and
dev-inclusive audit, plus documentation/security checks: PASS, zero audit findings
at that later check as well. No application, test or dependency file changed.
The existing experimental-loader warning is not a test failure. No new tooling,
dependency installation, Docker, WSL or Supabase local stack was used.

## Documentation Follow-up And Next Decision

Only this note, `phase-27-integration-release-readiness.md` and
`next-session-handoff.md` are changed for the smoke record. Commit message:
`docs: record phase 27 preview smoke`. Its actual hash is obtained from Git/final
report rather than amending a self-reference. The authorized publishing action is
a normal push of this same feature branch only, after final checks.

That documentation push may trigger another Preview deployment. Its deployment
status has not yet been observed in this record; do not infer success from Git.
The application/test/package-lock tree is identical to Preview-tested `acf6cb7`.
No new visual PASS is claimed for the documentation commit. Check its status
separately without repeatedly committing transient build states.

Main, Phase 26 fix/backup and Phase 27A/27B branches are preserved. No migration,
RPC, RLS, Edge Function, Auth/Storage/Kakao/Vercel setting or Production frontend
change. Phase 27 is still open; no completion archive was created.

Next: operator decision on a separately authorized Production release and the
remaining real-map checks. Re-fetch the baseline/candidate, review the full range,
remaining signup/storage/log risks and an eligible recovery deployment, and
confirm immediate testing before any main integration/push. The old Phase 26
Production approval and pre-Phase-26 backup are not reused.
