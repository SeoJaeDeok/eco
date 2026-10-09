# Observation Comments And Identification Discussion: Phase 32

## Status And Meaning

2026-10-09: implemented on the Phase 28 + 29 + 32 stacked branch, smoke code
`74fba30`. 0013 is unchanged and remote **APPLIED**, with operator-reported
pre/apply/post PASS after 0014 and 0012. Two explicitly authorized live test
comments were created through the ordinary local Supabase app and then removed
by their author. No account was created and their existing approved parent was
not edited/deleted. These results are not a Preview/Production release or closure.
Phase 29 now deletes only approved observations; its pending/rejected owner scope
is deferred, without changing the comments permission model.

`comment` is a general comment; `identification` is a reference opinion, not an
official identification. Neither changes reported_scientific_name, taxon_id,
taxonomy_verified_at, taxonomy confidence/match type or taxonomy itself.
No resolver/GBIF/cache access was added. Replies, edits,
likes, notifications, attachments, voting, reports, search and realtime are out
of scope. Phase 30/31 are not implemented.

## Data And Permissions

New `observation_comments`: UUID id, observation FK with **ON DELETE CASCADE**,
author FK to the existing profiles model, kind, plain-text body, created timestamp
and safe display-name snapshot. The author defaults to `auth.uid()` and remains
nullable only for profile deletion (`ON DELETE SET NULL`); anonymous insert fails.
Index `(observation_id, created_at DESC, id DESC)` serves stable 20-row pages;
an author index supports ownership lookups. Equal timestamps have an ID tie-breaker.

- Public SELECT exposes comments whose parent is approved.
- Authenticated INSERT is column-granted only for observation_id/kind/body.
  RLS checks own author and approved parent; a trigger rejects spoofed author and
  captures the caller's safe profile nickname. No public profiles directory join.
- Body is trimmed with the JavaScript whitespace set; DB rejects empty/whitespace
  and more than 1000 characters. Kind has a DB CHECK. UI uses matching code-point
  length validation and renders through React text nodes, never HTML injection.
- Owner/admin DELETE, no anonymous INSERT/DELETE and no UPDATE privilege/policy.
- Admin-only SELECT supports administrative deletion even after parent moderation;
  the **public repository** additionally filters the parent to approved, including
  admin sessions. Non-public comment browsing is not added to public detail.
- If a parent later becomes pending/rejected, normal authors cannot read or delete
  its hidden comments through current public SELECT. No policy was widened to show
  non-public parents/comments; this is a documented moderation edge-case boundary.
- Author IDs are internal permission fields, not displayed. Names containing email
  syntax are suppressed by the existing safe display helper; fallback is
  `등록 관찰자`. The DB additionally rejects any `@` in its nickname snapshot.
  Snapshot names do not automatically track subsequent profile renames.

## Repository And UI

`CommentRepository` separates list/create/delete from UI. Supabase uses approved
parent inner join, exact count, deterministic order and range; null/inconsistent
count is an error, not zero. Insert payload excludes caller-provided identity,
timestamp and nickname. Existing session is required; no login API is introduced.
Delete checks a returned ID so no-op denial is not reported as success.

Public detail renders `ObservationComments` below existing content. Signed-out
users read comments with a login hint; signed-in users choose a kind and submit.
Own/admin delete requires confirmation. Successful writes refresh only comments,
not the entire observation collection. Failed writes preserve the draft; failed
reads have their own retry and do not fail/close observation detail. A failed
refresh after a successful write is not retried as a duplicate write.

More loads 20 at a time; changed count or duplicate page IDs prompts a clean
refresh. Offset pagination is not a snapshot: concurrent changes can move rows;
not all equal-count replacements are detectable. No infinite fetch loop or realtime.
Abort/request identity and observation/session scope prevent late reads or writes
from overwriting a different detail. App keys detail by observation ID and closes
it after deletion. DB FK/cascade, not frontend per-comment loops, handles deletion.
If the parent disappears before insert, FK/RLS failure yields a safe error.

Default mock repository has no bundled fake public comments. Tests/isolated browser
fixture inject 27 comments (both kinds). Mock create/delete derives permissions
from its supplied session; observation tombstone events cascade comments in memory.
The standalone fixture injects its own repository into the **actual detail UI**;
it never uses real Auth, Supabase writes or Kakao. Its role selector is test-only.

## Migration 0013

**Full executable candidate:** [0013_observation_comments.sql](../../supabase/migrations/0013_observation_comments.sql).
The linked file contains the complete transaction, table, indices, trigger,
explicit grants and policies. The operator already applied it after 0012; do not
rerun it. The retained references describe fresh-environment checks, not a request
to repeat migration. SQL Editor success does not prove migration-tool ledger state.
It does not alter existing observations/Storage/taxonomy policies or existing rows.

### Pre-Apply Read-Only SQL (Operator PASS)

Only after all 0012 post-checks pass, execute the entire
[0013-pre-apply.sql](sql-checks/0013-pre-apply.sql). It checks observations/profiles
RLS and keys, the existing auth.users/profile relationship, auth.uid, UUID default,
nickname column/admin helper, previous 0012 metadata and comments table/type/function/
index name availability. All booleans must be `true`. Already-present objects,
false/null or an error mean stop and inspect; do not overwrite or rerun migration.

### Post-Apply Read-Only SQL (Operator PASS)

Execute the entire [0013-post-apply.sql](sql-checks/0013-post-apply.sql). Expected
all `true`: seven columns/types/nullability/defaults, FKs and delete actions, exact
kind/body CHECKs, valid ordered indexes, exact roles/expressions of all four
policies, no UPDATE/ALL/extra policies, effective and direct table/column privileges,
identity-spoof exclusion and the actual enabled author/trim/nickname trigger body.
The trigger-body digest is derived from current 0013 with CRLF normalized to LF;
it detects definition drift, not cryptographic authenticity. Do not reformat the
migration body before applying. No function definition or row data is returned.

These are catalog/grant comparisons, not live RLS/cascade execution. PostgreSQL
deparser differences or target drift can produce false results; report only the
boolean name/result or safe error code. Do not modify policies to make checks green.
The limited separately authorized live smoke below supplements these catalog
checks. Other roles, malicious payloads and cascade are not inferred to pass.

### Rollback Concept

Stop comment writes/UI before changing schema. Preserve any comments and existing
privileges first. Removing the new table/trigger/function would destroy comments;
disabling application UI alone does not remove data. **exact rollback SQL not
documented**; no executable rollback is invented or run. This disclosed absence
does not itself block the user's requested application preparation. Actual rollback
execution requires a separately reviewed exact plan. Hard-delete cascade cannot
be undone without recovery data.

## Evidence And Remaining Work

See [combined readiness](phase-29-32-fast-track-readiness.md). Isolated tests execute
real repository query builders with fake responses and actual component functions
with the project's hook-contract harness. They do not execute live RLS or measure
browser layout. Real React fixture modules are served successfully; rendering is
PARTIAL because the browser tool failed before opening a page. The isolated fixture
is not the following ordinary-app/live-data evidence.

### Current Live Smoke

| Item | Result | Evidence |
| --- | --- | --- |
| Environment | local_supabase, code 74fba30 | Current served source matched local files; no Preview claim |
| Target | Approved existing parent designated by operator | Public detail read; ownership operator-reported, no identity disclosure |
| Anonymous comments | PASS | Actual comment repository executed with a stateless public client; operator checked signed-out UI |
| General comment | PASS | Operator UI create; public API observed one comment kind |
| Identification comment | PASS | Operator UI create; public API observed one identification kind |
| Taxonomy unchanged | PASS | Same-target fingerprints before, with both comments present, and after cleanup |
| Raw email exposed | no | Operator screen confirmation; mapped public display fields had no email-like value while comments existed |
| Non-owner deletion | PARTIAL | Existing second regular account: hidden button PASS; actual authenticated DELETE request NOT_RUN |
| Own deletion | PASS | Operator deleted both; public repository count and result returned to baseline zero |
| Admin deletion | NOT_RUN | No extra comment created for it |
| Cleanup | PASS | 0 -> 2 -> 0 comments; original approved parent and compared fields unchanged |
| Observation modified | no | Parent/detail and taxonomy fingerprints unchanged; no observation write by the harness |

The taxonomy comparison uses the actual observation fields `scientific_name`
(reported scientific name in this schema), `taxon_id`, `taxonomy_match_type`,
`taxonomy_confidence`, `taxonomy_verified_at` and returned public lineage. It does
not read the separate resolver cache. No raw field values, identities, object paths,
keys or session tokens were retained in results or printed.

An initial cleanup report was not accepted as API PASS: the read still found two
comments. The operator then explicitly removed them, and a fresh read confirmed
zero. Only that later result closes cleanup; no duplicate comments were generated.
No live admin deletion, spoofed-author payload, hidden-parent attack, 20+ comment
paging or FK cascade was performed. Earlier automated and manual catalog evidence
for those contracts remains separate. See
[combined readiness](phase-29-32-fast-track-readiness.md#current-live-smoke-evidence).

**한국어:** 댓글과 동정 의견을 읽고 작성·삭제하는 화면과 저장소 연결을 구현했습니다.
동정 의견은 참고 글이며 공식 분류를 바꾸지 않습니다. 익명 사용자는 읽기만 가능하고,
댓글 작성자와 관리자가 삭제하도록 구현했습니다. 사용자가 migration을 적용한 뒤
실제 일반 댓글과 동정 의견을 각 1개 작성하고 본인 삭제로 정리했습니다. 공개 API로
댓글 0개 복귀와 원래 관찰의 분류 불변을 확인했으며, 관리자 삭제 등은 별도 미확인입니다.
