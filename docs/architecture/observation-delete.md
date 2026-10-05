# Observation Deletion: Phase 29

## Status And Scope

2026-10-05: local implementation and automated contracts, **not live-verified**.
Stacked on Phase 28 `2b2ce5a`, not on main (`a3887a7`). No remote SQL, real
observation deletion, Storage mutation, push or deployment was performed.

**Phase 29 MVP deletion scope = approved observations visible through
the current public observation path**

The user confirmed this scope after `77a394e`. Owners may delete their own approved
observations; admins may delete any approved observation. Anonymous and authenticated
non-owner users cannot delete. Owner pending/rejected deletion is **deferred, not a
bug or an unresolved blocker**: private owner SELECT and its UI need a later design.
No private owner list, broader public SELECT or trusted delete RPC is introduced.

The existing hidden admin all-status review can still read/moderate records, but
only approved records expose deletion. Its deletion delegates to
`AdminObservationRepository.deleteObservationAsAdmin`; no new Navbar/admin route.

## Final Authorization And Candidate Correction

- Existing owner identity: `observations.observer_id`, referencing `profiles.id`.
- Existing admin authority: `public.is_admin()`, backed by `profiles.role`.
- `0001` contains an all-status admin DELETE policy; `0003/0004` revoke the table
  grant. Restoring the grant in the original 0012 would enable all-status admin
  deletion, which conflicts with the newly confirmed MVP. This is a real scope/
  authorization mismatch, not a stylistic migration rewrite.
- The **unapplied 0012 candidate is revised in `62c57c0`, after `77a394e`**: owner policy now
  explicitly requires approved; `ALTER POLICY` narrows the existing admin DELETE
  policy to approved using the same `public.is_admin()`. SELECT/UPDATE stay intact.
  No 0014, new RPC, admin helper, Storage grant or permission expansion.
- Supabase DELETE additionally filters `status=approved`; mock rejects other
  statuses and public/admin deletion controls follow the same condition.
- 0013 and 0001~0011 are byte-for-byte unchanged. Use the current final 0012 file,
  not its earlier `4e4f9eb`/`77a394e` revision. Anonymous DELETE remains ungranted;
  the only DELETE policies are approved owner and approved admin, protecting non-owners.

The SELECT dependency follows the [Supabase delete reference](https://supabase.com/docs/reference/javascript/delete).
RLS grants/policies remain subject to actual database verification after manual application.

## Repository, Images And UI

`ObservationRepository.deleteObservation(id)` returns only
`imageCleanup = not-needed / removed / unconfirmed`. Supabase requires an existing
user session, deletes one approved ID, and requests only `id,image_path,observer_id` from
the deleted row. Missing/denied rows do not trigger Storage cleanup. No new login.

After DB success, `cleanupDeletedObservationImage` accepts only the returned
trusted path, and checks generated owner/legacy path structure. Owner path must
match the deleted row's owner. No UI path, URL, traversal or arbitrary bucket is
accepted. Existing configured bucket and Storage API are reused. Only a non-error
response containing one removed object is treated as removal; hidden/empty
responses are not a success. Legacy `image_url` is not a deletion target.

**Storage risk:** checked-in policies contain no object DELETE permission for
either owners or admins. Deleting the observation may also remove the reference
used by Storage SELECT. Thus cleanup can remain unconfirmed for both roles;
do not promise file erasure. DB success is preserved, a safe UI notice and category
warning are emitted, and no path/signed URL/raw response is printed. No permission
widening, service-role client, Edge Function or automatic orphan retry was added.
Previously issued signed URLs can remain usable until expiry. Operators need a
separately reviewed orphan cleanup process; do not retain sensitive paths in logs.

Accepted operational boundary (not a blocker for this MVP migration readiness):
- owner/admin observation row deletion: supported for the approved MVP;
- image cleanup: best-effort;
- cleanup permission failure can leave an orphan object;
- observation deletion remains successful;
- full Storage cleanup authorization is a later operational hardening task.

File deletion must use Storage API, not direct SQL deletion of `storage.objects`
metadata. No such SQL or new cleanup permission is included, consistent with the
[Supabase Storage deletion guidance](https://supabase.com/docs/guides/storage/management/delete-objects).

`DeleteConfirmation` requires a second click, guards duplicate submissions and
offers safe error retry. App closes the deleted detail, removes the record from
the loaded collection and increments its existing observation revision. This
refreshes current list conditions, map data and independent public summary without
reload. Existing list reconciliation moves an invalid last page back once.
Search/filter state and fade/no-auto-scroll behavior are preserved.

Taxonomy cache invalidation rejects stale cache writes. Map/tree revisions reread
the selected IDs and already loaded branches, preserving date selection, expanded
branches and map instance. Retry after a failed tree refresh includes children.
The old server row-cap limitation is unchanged. Mock uses session-only tombstones
without mutating bundled samples; listeners cascade its in-memory comments.

## Migration Candidate 0012

**Full executable candidate:** [0012_observation_owner_delete.sql](../../supabase/migrations/0012_observation_owner_delete.sql).
Read the entire linked file; it is the sole migration body, not an excerpt.
0012 is remote **NOT_APPLIED**; only this unapplied candidate was corrected.
Existing 0001~0011 and the comments candidate 0013 are unchanged. Check the actual
target's boolean preconditions and preserve recovery information before applying.

### Pre-Apply Read-Only SQL (Not Run)

Execute the entire [0012-pre-apply.sql](sql-checks/0012-pre-apply.sql). It checks
table/RLS, role bypass flags, the reviewed admin helper body/privilege, exact public
SELECT and baseline admin DELETE definitions, absence of extra SELECT/DELETE/ALL
policies, owner-policy name availability and the revoked DELETE baseline. These
objects/grants indicate the candidate has not already been applied; SQL Editor
manual application is not inferred from a migration-history filename alone.
All booleans must be `true`; false/null/error means stop, not retry the migration.

### Post-Apply Read-Only SQL (Not Run)

Execute [0012-post-apply.sql](sql-checks/0012-post-apply.sql). Expect all `true`:
authenticated DELETE, anon denial, exact approved-and-owner/admin expressions,
no third DELETE/ALL policy, unchanged approved public SELECT and owner/admin UPDATE.
This checks non-owner protection structurally, not by deleting a real row.
Expression comparisons normalize deparser whitespace/parentheses/text casts; any
unexpected definition fails closed. A formatting/version false result needs review,
not automatic policy alteration. Catalog checks are **not** live role-session tests.

### Rollback Concept

**exact rollback SQL not documented**. Concepts only: disable the newly restored
DELETE grant, remove the new owner policy and review restoration of the previous
admin DELETE definition. None restores deleted observations, comments or objects.
Preserve baseline privileges/policies and recovery data. No executable rollback
is invented or run. The user accepts this documented limitation for readiness;
it alone does not block manual application preparation. Rollback execution would
still require an exact reviewed plan and separate approval.

## Verification

See [combined readiness](phase-29-32-fast-track-readiness.md). Tests cover actual
repository query construction with simulated responses, mock permissions,
confirmation/double-click behavior, App revision wiring, last-page correction,
search retention, admin repository delegation, safe cleanup and tree refresh.
SQL is checked as a candidate, not executed against PostgreSQL. Shared DB deletion,
real Storage removal and real browser interaction remain NOT_RUN/PARTIAL.

**한국어:** 이번 삭제 범위는 승인된 공개 관찰로 확정됐습니다. 작성자의 비공개
기록 삭제는 후속 기능이며 버그가 아닙니다. 관리자도 이번에는 approved만 삭제하도록
0012와 버튼/조회 조건을 제한했습니다. 파일 정리 실패가 관찰 삭제 성공을 취소하지
않습니다. 실제 DB 적용과 삭제 실험은 하지 않았습니다.
