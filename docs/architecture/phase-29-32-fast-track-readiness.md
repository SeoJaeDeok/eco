# Phase 29 And 32 Fast-Track Readiness

## Candidate

- Date: 2026-10-05. Branch: `feature/phase-29-32-observation-delete-comments-fast-track`.
- Base: Phase 28 `2b2ce5a`, main/origin/main `a3887a7`. This is a **stacked candidate**
  containing Phase 28 + 29 + 32; it did not restart from main.
- Code/test/migration commit: `4e4f9eb feat: add observation deletion and identification comments`.
  The subsequent documentation commit has identical application code.
- State: locally implemented with documented gaps; **not Verified, not released**.
- Existing Phase 28/backup branches are preserved. No push, merge or deployment.
- Phase 30/31 skipped intentionally; no Phase history archive or new feature.
- Phase 28 API/Preview evidence remains historical and is not a live PASS for
  this newly modified application. Its coverage/date diversity/Kakao/log limits
  remain recorded in [Phase 28 readiness](phase-28-integration-release-readiness.md).

## Implemented Scope

| Area | Local implementation | Boundary |
| --- | --- | --- |
| Observation delete | Owner/admin confirmation; RLS-backed repository delete; admin all-status access | Normal owner public path reaches approved only |
| Refresh | Close detail, refresh paginated list/map/summary/tree, preserve filters, last-page correction | No browser reload or new map camera behavior |
| Image cleanup | DB-first, trusted returned path, validated best-effort remove | Existing Storage DELETE unavailable; orphan risk for owner/admin |
| Comments | Public approved-parent read, authenticated create, own/admin confirmed delete | No edit, thread, vote, attachment, realtime or reports |
| Identification | Distinct plain-text kind and disclaimer | No observation/taxonomy mutation or resolver |
| Comment paging | Exact count, 20 rows, newest timestamp/id, more and retry | Offset concurrency is not a snapshot |
| Cascade | Observation FK ON DELETE CASCADE; mock tombstone listener | Real DB cascade NOT_RUN |
| Privacy | Safe nickname snapshot/fallback; plain React text; internal author ID only | Free-text user content is not an automated moderation system |

Details and full migration links:
[observation deletion](observation-delete.md),
[comments and identification](observation-comments-identification.md).

## Permission Decision Still Needed

The request includes owner deletion, but also preserves existing observation
SELECT policies and permits only minimal DELETE additions. Existing RLS hides
owner pending/rejected records from the normal public path. A DELETE grant/policy
does not solve that visibility requirement. Implemented owner deletion is for
approved public details; admin deletion can reach all statuses.

A scoped question was raised about accepting that boundary or approving a narrow
DB function for hidden owner records. No response was received during implementation;
no function or wider SELECT was silently introduced. Do not claim the broader
all-status owner requirement is complete. Settle this before database application.
Similarly, author comments on a subsequently hidden parent are not publicly readable
or deletable through the public UI; admin policy allows administrative access.

## Fresh Checks (2026-10-05)

| Check | Result | Meaning |
| --- | --- | --- |
| TypeScript `npm.cmd run typecheck` | PASS | Actual current run |
| `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs` | 208 PASS, 0 failed | Current full run, not prior 174 |
| `npm.cmd run build` | PASS | Vite application entry, not fixture entry |
| `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/` | PASS, 0 vulnerabilities | This audit time only; no auto fix |
| SQL policy/privilege/cascade shape | PASS, STATIC | Candidate text and repository contracts, not a PostgreSQL run |
| Mock/repository/UI contracts | PASS | Fake SDK transport and component hook harness, not browser DOM |
| Local fixture HTML/entry/TSX/CSS | PASS for HTTP/module serving | Distinct fixture title/root and Vite HTML proxy entry checked |
| Direct browser rendering | PARTIAL | Browser tool initialization failed: missing sandboxPolicy |
| Real Supabase roles/SQL/cascade | NOT_RUN | No remote SQL or actual writes authorized |
| Real image removal | NOT_RUN | Existing policy risk retained |
| Real Kakao | PARTIAL, inherited | Provider unchanged; regression tests pass, no live map action |

Sandbox initially blocked Node child processes and Vite dependency loading with
EPERM; approved execution succeeded. Build reports a non-fatal mixed static/dynamic
auth-provider import warning and plugin timing notice, not a runtime failure.
The dynamic auth import in mock deletion delays lookup and is not claimed as a
separate bundle optimization. No dependency/config change to suppress warnings.

The suite covers owner/admin/non-owner/anon deletion transports, mock tombstones,
confirmation/double-click guards, cleanup validation/failure, actual App list/map/
summary refresh, last-page correction/search retention, admin delegation, tree
refresh/retry, comment 0/1/19/20/21/40/41 boundaries, same-time ordering, safe names,
plain text, invalid body/kind, self identity, hidden-parent rejection, mock cascade,
independent retry and late response/write guards. Existing Phase 26/27/28 regression
tests remain included. Fake RLS responses do not prove deployed role enforcement.

## Local Manual Fixture

Server confirmed for this workspace at `http://127.0.0.1:3000`.
Use `http://127.0.0.1:3000/tests/fixtures/observation-community.html` only for isolated
memory testing. The HTML's Vite proxy, fixture module, real detail/comments modules
and stylesheet respond correctly, not index fallback. HTTP success is not visual PASS.
No Supabase/Auth/Kakao request is required by this fixture; role data is injected,
not an actual login. Its 27 synthetic comments are not production default data.

1. In 비로그인, read the first 20 comments and 댓글 더 보기 to reach 27; no write/delete controls.
2. Choose 작성자, submit each kind, and delete an own comment after confirmation.
   Empty/overlong input is blocked; a different author's delete control is hidden.
3. Choose 관리자 to see other-comment deletion; choose 다른 사용자 to check ownership.
   Narrow the window and use keyboard controls; no account creation is needed.
4. Choose 작성자/관리자 and confirm 관찰 삭제. Detail closes and fixture comments
   cascade in memory. Refresh only this fixture to restore isolated initial data.

Do not perform deletion/comment writes in the ordinary connected app or shared DB
as part of this task. The existing pagination/month fixtures remain unchanged.

## Migration And Release Gates

1. Review the unresolved owner-hidden-row scope and Storage orphan risk. Review
   0012/0013 preconditions, full candidates, post-apply booleans and exact rollback
   plan against the actual target, preserving existing policy/grant definitions.
2. With separate approval, an operator manually applies the new candidates in
   order. No `supabase db push`, Docker/local reset or remote SQL was run here.
3. Separately authorize live smoke with suitable non-production data and sessions;
   check allowed/denied roles, author spoof rejection, body/kind constraints,
   observation/comment cascade, cleanup warning and last-page refresh. Do not
   delete existing shared records merely to prove a test.
4. Then request feature push/Preview integration. No inherited Phase 28 release
   approval covers these schema/writing changes; Production is a later decision.

Rollback concepts are in each feature document. Exact executable rollback remains
review-required, not invented or executed. Dropping comments or disabling grants
cannot recover hard-deleted observations/files. Deployment before migrations would
produce controlled comment/delete errors and is not an acceptable release plan.

## Change Boundary

Changed app/repository/admin/detail/tree refresh code, isolated tests/fixtures,
two new migration candidates and four documentation files. Existing migrations,
packages/lockfile, Edge Functions, map provider/camera code, Auth implementation,
Storage policies, settings and remote data are unchanged. Cleanup code uses the
existing bucket/API but does not grant new Storage capability. No SQL executed.
Final checks PASS: `git diff --check`, changed-file whitespace/EOF/UTF-8,
Markdown fences/tables, four active JSON files and tsconfig parsing, existing TOML
syntax, forbidden tracked paths, secret-like content and new raw-email display
scan. No forbidden tracked file, new frontend privileged key/HTML injection, or
restricted package/settings/old-migration change was found. No claim that a pattern
scan proves every possible secret absence. Edge Functions are unchanged, so Deno
fmt/lint/check/test was not rerun. Docker/WSL/Supabase local stack was not started.

Deletion, cascade and detail/comment wiring share contracts, so code/tests/new
migrations are kept in one coherent local feature commit; docs use a second commit.
Exact hashes are reported after creation, without self-hash edits or amend.

**한국어:** 로컬 구현과 자동 검사는 진행했지만 운영 준비 완료는 아닙니다. 먼저
작성자의 비공개 기록 삭제 범위와 이미지 잔여 파일 위험을 확정하고, migration을
검토·수동 적용한 뒤 실제 권한 검사와 Preview 통합 검증이 필요합니다.
