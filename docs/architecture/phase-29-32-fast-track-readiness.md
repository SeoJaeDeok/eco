# Phase 29 And 32 Fast-Track Readiness

## Candidate

- Date: 2026-10-05. Branch: `feature/phase-29-32-observation-delete-comments-fast-track`.
- Base: Phase 28 `2b2ce5a`, main/origin/main `a3887a7`. This is a **stacked candidate**
  containing Phase 28 + 29 + 32; it did not restart from main.
- Initial implementation: `4e4f9eb`; prior documentation: `77a394e`.
  Final approved-only code/migration correction: `62c57c0`.
  This readiness follow-up revises the unapplied 0012 and matching deletion guards
  to the user's newly confirmed approved-only scope. Use the current files, not
  the earlier 0012 revision. 0013 and 0001~0011 remain unchanged.
- State: manual application preparation complete, subject to target prechecks;
  **not Verified, not released**. Both migrations are remote **NOT_APPLIED**.
- Existing Phase 28/backup branches are preserved. No push, merge or deployment.
- Phase 30/31 skipped intentionally; no Phase history archive or new feature.
- Phase 28 API/Preview evidence remains historical and is not a live PASS for
  this newly modified application. Its coverage/date diversity/Kakao/log limits
  remain recorded in [Phase 28 readiness](phase-28-integration-release-readiness.md).

## Implemented Scope

| Area | Local implementation | Boundary |
| --- | --- | --- |
| Observation delete | Owner own approved / admin any approved; confirmation and RLS-backed delete | Non-owner/anon denied; pending/rejected deletion deferred |
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

## Confirmed MVP Boundary

**Phase 29 MVP deletion scope = approved observations visible through
the current public observation path**

The user resolved the earlier scope question: owner pending/rejected deletion is
**deferred, not a bug or a readiness blocker**. Private owner SELECT and its UI need
a later design. No public/owner SELECT expansion, delete RPC or own-record page.
Admin all-status review is preserved, but observation deletion is approved-only.

Review found the original 0012 restored DELETE while reusing the all-status admin
policy from 0001. That would authorize more deletion than the confirmed scope.
The final unapplied 0012 explicitly requires approved for both owner and admin,
reuses `public.is_admin()` and preserves existing SELECT/UPDATE policies. Minimal
matching guards are in the Supabase/mock repositories and public/admin buttons.
This is a real authorization-scope correction after `77a394e`, not a style rewrite.
0013 is not revised and no 0014 is added.

Accepted image boundary: owner/admin approved observation row deletion is supported;
image cleanup is **best-effort** after DB success, from the trusted returned path.
Missing Storage permission may leave an orphan; it does not reverse observation
deletion or block this MVP's migration preparation. Full Storage cleanup authorization
is a later operational hardening task. No Storage RLS, Edge Function or privileged
frontend key is added. Use Storage API, never SQL metadata deletion, for actual files.

Phase 32 remains unchanged. Identification is reference text, not a change to
reported_scientific_name, taxon_id, taxonomy_verified_at, match/confidence or verified
taxonomy, and does not invoke a resolver. Comments on a subsequently hidden parent
remain outside the public author's read/delete UI; admin policy permits administrative
access. Observation deletion cascades comments in DB, not a frontend delete loop.

## Fresh Checks (2026-10-05)

| Check | Result | Meaning |
| --- | --- | --- |
| TypeScript `npm.cmd run typecheck` | PASS | Actual current run |
| `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs` | 213 PASS, 0 failed | Current full run; previous 208/174 are historical |
| `npm.cmd run build` | PASS | Vite application entry, not fixture entry |
| `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/` | PASS, 0 vulnerabilities | This audit time only; no auto fix |
| SQL policy/privilege/cascade shape and pre/post files | PASS, STATIC | Candidate review and read-only/digest contracts, not a PostgreSQL parser/runtime run |
| Mock/repository/UI contracts | PASS | Fake SDK transport and component hook harness, not browser DOM |
| Local fixture HTML/entry/TSX/CSS | Historical serving PASS | Checked in the preceding implementation session, not rerun here |
| Direct browser rendering | PARTIAL, inherited | Previous browser initialization failed: missing sandboxPolicy; not rerun here |
| Real Supabase roles/SQL/cascade | NOT_RUN | No remote SQL or actual writes authorized |
| Real image removal | NOT_RUN | Existing policy risk retained |
| Real Kakao | PARTIAL, inherited | Provider unchanged; regression tests pass, no live map action |

Previous 208 tests/typecheck/build/audit belong to the implementation session;
they are not substituted for this run. Current build reports a non-fatal mixed
static/dynamic auth-provider import warning and plugin timing notice, not a failure.
The dynamic auth import in mock deletion delays lookup and is not claimed as a
separate bundle optimization. No dependency/config change to suppress warnings.

The suite covers owner/admin/non-owner/anon deletion transports, mock tombstones,
confirmation/double-click guards, cleanup validation/failure, actual App list/map/
summary refresh, last-page correction/search retention, admin delegation, tree
refresh/retry, comment 0/1/19/20/21/40/41 boundaries, same-time ordering, safe names,
plain text, invalid body/kind, self identity, hidden-parent rejection, mock cascade,
independent retry and late response/write guards. Existing Phase 26/27/28 regression
tests remain included. Fake RLS responses do not prove deployed role enforcement.
New cases verify owner/admin rejection of pending/rejected in actual mock/query
paths, approved-only admin controls, read-only catalog check files and the exact
0013 trigger-body fingerprint. No SQL, PostgreSQL instance or remote role test was run.

## Local Manual Fixture

In the preceding implementation session, the server was confirmed for this workspace
at `http://127.0.0.1:3000`; it was not rechecked in this readiness-only workflow.
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

## Manual Dashboard Apply Order

Codex has not executed any of these SQL files. Select the intended project in
Supabase Dashboard SQL Editor yourself. Use each whole linked file without editing
the migration body. The pre/post files read only system catalogs and return booleans;
they do not return observations, comments, identities, connection values or paths.
Migration files contain their own transaction; verification files are separate reads.

1. Run [0012 pre-apply](sql-checks/0012-pre-apply.sql).
2. Confirm **every result is true**. It checks table/RLS, reviewed admin helper,
   exact approved public SELECT and baseline admin DELETE, revoked DELETE grant,
   role bypass flags and absence of owner-policy/extra-policy conflicts.
3. Run the **entire current [0012 migration](../../supabase/migrations/0012_observation_owner_delete.sql)**.
4. Run [0012 post-apply](sql-checks/0012-post-apply.sql); confirm all true:
   grant, anon denial, approved owner/admin conditions, no extra DELETE/ALL policy,
   and preserved public SELECT/owner/admin UPDATE definitions.
5. Only then run [0013 pre-apply](sql-checks/0013-pre-apply.sql).
6. Confirm **every result is true**: observations/profiles/auth prerequisites,
   prior 0012 metadata, and no comments table/type/function/index/policy conflicts.
7. Run the **entire [0013 migration](../../supabase/migrations/0013_observation_comments.sql)**.
8. Run [0013 post-apply](sql-checks/0013-post-apply.sql); confirm all true:
   table/RLS, columns/defaults, FK cascade/author FK, CHECKs, indexes, exact policies,
   no client UPDATE, insert identity protection, direct/effective grants and trigger.

**Stop on any false, null or error. If 0012 fails, do not apply 0013.** Do not
repeat a migration or invent/run rollback. Report only the boolean column name and
result, or a safe SQL error code. Do not send UUIDs, email, URLs, keys, observation/
comment text or raw error output. A deparser/version difference needs review, not
automatic policy relaxation. These catalog checks are not live role/cascade proof.
The prechecks identify unapplied object/grant state; a SQL Editor application is not
assumed to populate migration-tool history. Already-applied or partial state stops
this clean-apply sequence and needs inspection.

**exact rollback SQL not documented** for either candidate. Concepts are linked in
the feature documents; no executable rollback was invented. This disclosed absence
alone does not block this user-requested readiness. Preserve baseline definitions
and recovery information; any actual rollback still needs a separately reviewed
exact plan. Revoking permissions/dropping schema cannot restore deleted rows/files.

## Later Live Smoke Plan (Not Run)

Run only after both migrations and all postchecks succeed, under separate explicit
approval for actual writes. Existing real user observations must never be test
deletion targets. A suitable dedicated approved smoke record may be used; creating
one or any additional admin-delete record requires separate user approval first.

- Phase 29 starts with an **image-free**, dedicated approved record. Test owner
  deletion, authenticated non-owner denial and anonymous denial using appropriate
  separate sessions; test admin deletion only on a separately authorized target.
  Verify list/detail disappearance, species/records update, map/list/tree refresh,
  last-page correction and retained search/filter state without reload.
- Image cleanup is not a gate for the first smoke. Live image deletion requires
  separate explicit approval; record any best-effort warning/orphan risk without
  exposing internal paths. Do not grant new Storage permission to make a test pass.
- Phase 32 uses an approved dedicated smoke parent: anonymous read, one general
  comment and one identification comment, non-owner deletion denial, own deletion,
  and admin deletion only if its target/write has been separately approved. Check
  no raw email display, safe empty/length/kind errors and unchanged official taxonomy
  metadata. Do not use real user comments as disposable fixtures.
- Verify comment cascade only on a separately authorized disposable observation
  deletion, after preparing its comments with approval. No frontend per-comment
  deletion, no comment count gate, and no ghost/late detail after parent deletion.
- Public pending/rejected visibility remains denied. Owner deletion of those rows
  is deferred, not a smoke requirement; comments on non-approved parents remain
  protected. Any denied-role test must not modify someone else's real record.

No smoke observation, comment or account is created in this readiness task. After
authorized live smoke, request Preview integration separately. No push/deployment
or old Phase 28 approval is reused for these schema/write changes. Deployment before
migrations would produce comment/delete errors and is not an acceptable release plan.

## Change Boundary

This follow-up changes only unapplied 0012, four matching deletion guards, focused
tests, four read-only SQL check files and four readiness documents. The initial
feature implementation remains in the stacked branch. 0001~0011, 0013, packages/
lockfile, Edge Functions, map provider/camera, Auth, Storage cleanup/policies,
settings and all remote data are unchanged. No new function/permission feature.
Final format/security/scope checks PASS: `git diff --check`, Markdown/SQL whitespace/
EOF, fences/tables/local links, forbidden tracked files and secret-like changes. Pattern scans
are not a guarantee against every possible secret. No JSON/TOML settings or Deno
code changed; no additional parser/Deno rerun is needed. Docker/WSL/Supabase local
stack was not started. Local normal commits only, no amend or self-hash edits.

**한국어:** 삭제 범위와 이미지 정리 한계를 확정했고 수동 적용 준비를 마쳤습니다.
0012의 관리자 권한도 승인된 관찰로 제한했습니다. 위 8단계에서 검사 결과를 하나씩
확인하세요. 실제 DB는 그대로이며, 적용 후 별도 승인한 테스트 기록으로 권한·댓글을
검증해야 합니다. 실제 이미지 삭제, push와 배포는 이번 작업에서 하지 않습니다.
