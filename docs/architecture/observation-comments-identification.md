# Observation Comments And Identification Discussion: Phase 32

## Status And Meaning

2026-10-05: implemented locally on the Phase 28 + 29 + 32 stacked branch.
Migration candidate only; no shared DB comments or accounts created.

`comment` is a general comment; `identification` is a reference opinion, not an
official identification. Neither changes scientific name, taxon_id, confidence,
match type or taxonomy. No resolver/GBIF/cache access was added. Replies, edits,
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

## Migration Candidate 0013

**Full executable candidate:** [0013_observation_comments.sql](../../supabase/migrations/0013_observation_comments.sql).
The linked file contains the complete transaction, table, indices, trigger,
explicit grants and policies. Apply only after 0012 and separate manual review.
It does not alter existing observations/Storage/taxonomy policies or existing rows.

### Pre-Apply Read-Only SQL (Not Run)

Expected all `true`; inspect drift instead of overwriting objects if false.

```sql
select
  to_regclass('public.observation_comments') is null as new_table_absent,
  to_regprocedure('public.prepare_observation_comment()') is null as new_trigger_function_absent,
  to_regclass('public.observations') is not null as observations_exist,
  to_regclass('public.profiles') is not null as profiles_exist,
  to_regprocedure('public.is_admin()') is not null as existing_admin_helper,
  exists (select 1 from information_schema.columns where table_schema = 'public'
          and table_name = 'profiles' and column_name = 'display_name') as nickname_column_exists;
```

### Post-Apply Read-Only SQL (Not Run)

Expected all `true`. These prove catalog/grant shape, not end-to-end RLS behavior.

```sql
select
  exists (select 1 from pg_class where oid = 'public.observation_comments'::regclass
          and relrowsecurity) as rls_enabled,
  has_table_privilege('anon', 'public.observation_comments', 'SELECT') as public_select_granted,
  not has_table_privilege('anon', 'public.observation_comments', 'INSERT') as anon_insert_denied,
  not has_table_privilege('anon', 'public.observation_comments', 'DELETE') as anon_delete_denied,
  not has_table_privilege('authenticated', 'public.observation_comments', 'UPDATE') as update_denied,
  has_column_privilege('authenticated', 'public.observation_comments', 'body', 'INSERT') as body_insert_granted,
  not has_column_privilege('authenticated', 'public.observation_comments', 'author_id', 'INSERT') as author_spoof_ungranted,
  not has_column_privilege('authenticated', 'public.observation_comments', 'author_display_name', 'INSERT') as name_spoof_ungranted,
  has_table_privilege('authenticated', 'public.observation_comments', 'DELETE') as delete_granted,
  exists (select 1 from pg_constraint where conrelid = 'public.observation_comments'::regclass
          and confrelid = 'public.observations'::regclass and contype = 'f'
          and confdeltype = 'c') as observation_cascade,
  exists (select 1 from pg_constraint where conrelid = 'public.observation_comments'::regclass
          and confrelid = 'public.profiles'::regclass and contype = 'f'
          and confdeltype = 'n') as removed_author_nullable,
  exists (select 1 from pg_trigger where tgrelid = 'public.observation_comments'::regclass
          and tgname = 'observation_comments_prepare' and not tgisinternal
          and tgenabled <> 'D') as author_guard_enabled,
  to_regclass('public.observation_comments_observation_created_id_idx') is not null as page_index_exists;
```

Review all four policy definitions and both CHECK constraints before application;
do not infer their correctness from a policy name alone. In a separately approved
test environment, verify actual owner/non-owner/anon/admin sessions, denied spoof
payloads, blank/overlong/kind rejection, approved-only reads and cascade. No such
database writes were executed in this task.

### Rollback Concept

Stop comment writes/UI before changing schema. Preserve any comments and existing
privileges first. Removing the new table/trigger/function would destroy comments;
disabling application UI alone does not remove data. A reviewed exact rollback and
backup/restore plan is still required; no automatic rollback SQL or execution here.
Observation hard-delete cascade cannot be undone without recovery data.

## Evidence And Remaining Work

See [combined readiness](phase-29-32-fast-track-readiness.md). Isolated tests execute
real repository query builders with fake responses and actual component functions
with the project's hook-contract harness. They do not execute live RLS or measure
browser layout. Real React fixture modules are served successfully; rendering is
PARTIAL because the browser tool failed before opening a page. Live Supabase is
NOT_RUN, including trigger SQL runtime, all role policies, cascade and Storage.

**한국어:** 댓글과 동정 의견을 읽고 작성·삭제하는 화면과 저장소 연결을 구현했습니다.
동정 의견은 참고 글이며 공식 분류를 바꾸지 않습니다. 익명 사용자는 읽기만 가능하고,
댓글 작성자와 관리자가 삭제할 수 있도록 DB 후보를 준비했습니다. 아직 실제 DB에
적용하거나 실제 댓글을 만들지는 않았습니다.
