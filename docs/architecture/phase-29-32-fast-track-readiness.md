# Phase 29 And 32 Fast-Track Readiness

## Candidate

- Date: 2026-10-05. Branch: `feature/phase-29-32-observation-delete-comments-fast-track`.
- Base: Phase 28 `2b2ce5a`, main/origin/main `a3887a7`. This is a **stacked candidate**
  containing Phase 28 + 29 + 32; it did not restart from main.
- Initial implementation: `4e4f9eb`; prior documentation: `77a394e`.
  Final approved-only code/migration correction: `62c57c0`.
  The earlier readiness commit is `23d634a`. The current follow-up adds only 0014,
  its two catalog checks and readiness/handoff documentation; 0001~0013 and all
  existing checks are unchanged from `23d634a`. No application/test/package edits.
- State: **0012-pre FAIL** on the operator's target; limited 0014 correction
  prepared, not yet applied. **Not Verified, not released**. 0014/0012/0013 are
  all remote **NOT_APPLIED**, live smoke **NOT_RUN**.
- Existing Phase 28/backup branches are preserved. No push, merge or deployment.
- Phase 30/31 skipped intentionally; no Phase history archive or new feature.
- Phase 28 API/Preview evidence remains historical and is not a live PASS for
  this newly modified application. Its coverage/date diversity/Kakao/log limits
  remain recorded in [Phase 28 readiness](phase-28-integration-release-readiness.md).

## 0014 Helper Permission Prerequisite

### Evidence And Cause

The operator ran the original 0012 precheck and reported only
`admin_helper_not_public=false`. Follow-up read-only diagnostics found the reviewed
zero-argument boolean `public.is_admin()`, no PUBLIC EXECUTE, direct/effective anon
EXECUTE, authenticated EXECUTE, no inherited anon EXECUTE and no anon ownership.
The operator subsequently reported booleans true and review counts zero: no helper
reference in the examined anon policy qual/with_check or catalog dependencies, no
other policy function/public callable function/readable view requiring review, and
`owner_default_grants_anon_execute=true`. This is **operator-reported catalog
evidence**, not a Codex remote query, browser smoke or newly executed result file.

Local 0001 creates the helper, revokes PUBLIC and grants authenticated, but does not
explicitly revoke anon. With the reported creator/default-permission conditions,
new function creation can assign a direct anon grant that PUBLIC revoke does not
remove. This is a reproducibility gap, not evidence of when/how the current grant
originally appeared: **grant origin = unknown**. Defaults do not continuously regrant
permissions to an existing function. The inference about fresh creation follows
[PostgreSQL default privileges](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html);
an existing function's permissions are preserved by
[CREATE OR REPLACE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html).
No fresh database replay or remote modification was performed to test this inference.

### Exact Correction And Limits

The complete [0014_revoke_anon_is_admin_execute.sql](../../supabase/migrations/0014_revoke_anon_is_admin_execute.sql)
contains **one statement only**: revoke EXECUTE on `public.is_admin()` from `anon`.
It relies on the existing 0001 helper and anon role, not on 0012/0013 policies or
comments schema. It is not a Phase 29 feature expansion. It leaves authenticated
admin functionality, PUBLIC rights, table grants, roles, RLS and public observation/
image read definitions unchanged. No CASCADE, other function change, data write,
global default change or `ALTER DEFAULT PRIVILEGES` is included.

After the entire canonical replay finishes, this helper's direct anon EXECUTE is
explicitly removed. Effective denial also requires the checked lack of PUBLIC,
ownership/bypass or inherited execution routes. A different environment with such
routes needs review; 0014 does not silently remove other roles' grants.
The known owner default anon grant remains unchanged and is **not a blocker or a
false-required gate** in the new checks. Neither 0014 nor this decision fixes default
EXECUTE on every future new function.

Future security/helper-function migrations must explicitly review per-function
PUBLIC/anon/authenticated EXECUTE. Retain authenticated only when required, and
explicitly revoke anon when not required. Do not infer safety from a PUBLIC revoke
alone. No other existing function is bulk-hardened in this task.

### Pre/Post Read-Only Checks

- [0014 pre-apply](sql-checks/0014-pre-apply.sql): expect all true. It checks the
  exact signature/no overload, reviewed SQL/STABLE/SECURITY DEFINER/search_path/body,
  PUBLIC denial, direct and effective anon grant, authenticated direct/effective
  grant, no role bypass, anon ownership/inherited/grant-chain exceptions, actual
  anon policy expressions and function dependencies, and the reviewed observation/
  image public/admin SELECT structures and read grants.
- [0014 post-apply](sql-checks/0014-post-apply.sql): expect all true. The only
  intended changed checks are anon **direct ACL absent** and **effective EXECUTE
  absent**. All helper/role/policy/read-grant checks repeat the precheck. The known
  default privilege is deliberately omitted from pass gates, not changed or ignored
  as a future-function risk.
- Comparisons use actual qual/with_check and catalog references, not names alone.
  Public observation/image predicates are compared with the reviewed 0001/0002
  definitions. Post is not a stored pre-run snapshot: equality means the same
  reviewed baseline passed both runs. Deparser differences, custom functions/views,
  additional policies or grant chains cause a stop for review, not an automatic fix.
  Conservative function/view checks cover the known application public paths;
  absence of catalog references alone cannot prove absence of arbitrary dynamic SQL.
- Only booleans are returned. No function is invoked, no raw ACL/body/application
  rows/identities/configuration are returned, and no grants are modified. These two
  new files are **not yet run against PostgreSQL**; local review is STATIC only.

### Link Back To The Original 0012 Precheck

The original [0012-pre-apply.sql](sql-checks/0012-pre-apply.sql) is byte-for-byte
unchanged in Git. Its `admin_helper_not_public` is the negation of anon's effective
EXECUTE. A successful 0014 postcheck explicitly proves that effective privilege is
absent, so this predicate should become true. The helper, authenticated permission,
role flags, table/column metadata and all observation SELECT/DELETE grant/policy
preconditions are untouched by the single function REVOKE. They were reported true
previously, but must be rechecked for intervening drift. Do not infer a fresh complete
0012-pre PASS from 0014-post alone or weaken the old check.

### Two Different Orders

**Canonical repository replay:** `0001 -> ... -> 0012 -> 0013 -> 0014`.
Four-digit numbering and all existing names/content/order remain intact. Pre/post
files under docs are manual gates, not automatically interleaved migration bodies.
The anon grant may exist until 0014 in a fresh replay with these defaults; do not
expose an incomplete replay as the hardened final state.

**One-time current-target manual order**, to unblock the stopped 0012-pre:

1. 0014 pre-apply; every boolean true.
2. Entire single-statement 0014; operator reports execution success.
3. 0014 post-apply; every boolean true.
4. Original 0012 pre-apply, from the beginning; every boolean true.
5. Resume the existing steps below: 0012 apply -> 0012 post -> 0013 pre ->
   0013 apply -> 0013 post, waiting for the operator after each step.

This exception is possible because 0014 only touches the already-existing helper
ACL and has no 0012/0013 schema dependency. Do not rename/reorder files or execute
the whole pending batch to work around the gate. Manual SQL Editor application may
not update the migration tool's ledger; record the operator result separately and
review actual metadata/ledger before any future CLI operation. No history-repair or
CLI command is authorized here.

On false/null/error, stop and diagnose read-only. Do not repeat the migration or
add a compensating GRANT. **exact rollback SQL: not documented**. Restoring anon
EXECUTE is not an approved rollback: no evidence establishes that it was intended.
The present task prepares files only; no instruction to execute them immediately,
no remote SQL, no accounts/observations/comments/images touched, and no push/deploy.

### Current Preparation Checks

Local checks **PASS** for the one-statement target/role, read-only catalog SQL structure,
reviewed helper/policy definitions, consistent pre/post predicates, unchanged
0012-pre and 0001~0013, unique next migration number/order, Markdown/SQL whitespace/
EOF/links, forbidden tracked files and secret-like changes. No PostgreSQL parser,
server execution or full replay is claimed. Existing focused command
`node --test tests/migration-readiness.test.mjs`: **3 PASS, 0 failed**. These existing
tests protect 0012/0013 contracts; the new 0014 structure/definition comparisons were
checked separately by a local read-only Node checker. This is not a full-suite run.
The first old-file comparison failed because the checker stripped an existing UTF-8
BOM in 0010; preserving it in the checker made the equality check pass. No existing
migration was edited to satisfy the comparison, and no DB failure was involved.
The prior **213 tests, typecheck/build PASS and audit 0** belong to `23d634a`'s
readiness session. They are not rerun for this SQL/check/docs-only change: app and
dependency inputs are unchanged, no push/release is taking place. Deno/Docker/WSL/
Supabase local stack are not needed or started. These fresh local results do not
replace the pending operator execution of 0014 pre/post or actual role/live tests.

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
0013 was not revised. That scope correction did not add 0014; the later separately
authorized 0014 above is only helper EXECUTE hardening, not deletion-scope expansion.

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

## Previous Checks At 23d634a (2026-10-05)

| Check | Result | Meaning |
| --- | --- | --- |
| TypeScript `npm.cmd run typecheck` | Historical PASS | Previous 23d634a readiness run |
| `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs` | Historical 213 PASS, 0 failed | Previous 23d634a full run, not rerun for 0014 |
| `npm.cmd run build` | Historical PASS | Previous Vite application build, not fixture entry |
| `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/` | Historical PASS, 0 vulnerabilities | That audit time only; no auto fix or new audit |
| SQL policy/privilege/cascade shape and pre/post files | PASS, STATIC | Candidate review and read-only/digest contracts, not a PostgreSQL parser/runtime run |
| Mock/repository/UI contracts | PASS | Fake SDK transport and component hook harness, not browser DOM |
| Local fixture HTML/entry/TSX/CSS | Historical serving PASS | Checked in the preceding implementation session, not rerun here |
| Direct browser rendering | PARTIAL, inherited | Previous browser initialization failed: missing sandboxPolicy; not rerun here |
| Real Supabase roles/SQL/cascade | NOT_RUN | No remote SQL or actual writes authorized |
| Real image removal | NOT_RUN | Existing policy risk retained |
| Real Kakao | PARTIAL, inherited | Provider unchanged; regression tests pass, no live map action |

Previous 208 tests/typecheck/build/audit belong to the implementation session;
the 213-test readiness session followed it. That readiness build reported a non-fatal mixed
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

**Current target is paused before this sequence. First follow the one-time 0014
order above, then return here.** The 0014 file is the single REVOKE statement;
unlike 0012/0013, it does not add transaction wrapper commands.

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

## Previous Change Boundary At 23d634a

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

**한국어:** 현재는 0012 사전 검사에서 멈춘 상태입니다. 기본 권한에 따른 재발을 막기
위해 0014에 함수 하나의 anon 권한 회수만 남겼습니다. 전체 설치 순서는 0012, 0013,
0014지만, 현재 DB에서는 0014 검사·수동 보정·재검사 후 기존 0012 사전 검사로 돌아갑니다.
아직 어느 migration도 원격 적용하지 않았으며, 앱 코드나 전역 기본 권한도 바꾸지 않았습니다.
