# Observation Deletion: Phase 29

## Status And Scope

2026-10-09 final permission follow-up at `00d05aa`: **administrator observation
deletion PASS within the public repository contract**, using one newly authorized
image-free approved observation. User-operated admin role/cancel/delete and public
API after-state are separate evidence; non-owner actual DELETE remains **PARTIAL**.
See [final permission smoke](phase-29-32-fast-track-readiness.md#final-observation-permission-smoke-at-00d05aa).
Migration CLI history remains **unknown** despite operator application/post PASS.
This follow-up changes documentation only, with no push or Production deployment.

Earlier owner-smoke record (preserved):

2026-10-09: **core owner-delete live smoke PASS** for code `74fba30`, using the
ordinary local Supabase app and exactly one newly authorized image-free observation.
The operator created/deleted that record through the app; Codex performed public
reads and one explicitly authorized anonymous DELETE-denial probe on that new record.
No existing user observation was deleted. Stacked on Phase 28 `2b2ce5a`, not main
(`a3887a7`). Manual 0014/0012/0013 application and post-checks are operator-reported
PASS. App Preview/Production integration is separate; no release/Verified closure.
At `db37ba1`, feature push was held by a High dependency advisory, not a deletion
failure. See the subsequent [dependency correction](phase-29-32-fast-track-readiness.md#dependency-security-correction)
and preserved [live evidence](phase-29-32-fast-track-readiness.md#current-live-smoke-evidence).

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
- The **then-unapplied 0012 candidate was revised in `62c57c0`, after `77a394e`**: owner policy now
  explicitly requires approved; `ALTER POLICY` narrows the existing admin DELETE
  policy to approved using the same `public.is_admin()`. SELECT/UPDATE stay intact.
  That scope correction added no 0014, RPC, admin helper or Storage grant. Later
  0014 only removed anon EXECUTE from the existing helper; it did not expand deletion.
- Supabase DELETE additionally filters `status=approved`; mock rejects other
  statuses and public/admin deletion controls follow the same condition.
- 0013 and 0001~0011 are byte-for-byte unchanged. Use the current final 0012 file,
  not its earlier `4e4f9eb`/`77a394e` revision. Anonymous DELETE remains ungranted;
  the only DELETE policies are approved owner and approved admin, protecting non-owners.

The SELECT dependency follows the [Supabase delete reference](https://supabase.com/docs/reference/javascript/delete).
Operator catalog checks and the limited live role evidence below are distinct.

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

## Migration 0012

**Full executable candidate:** [0012_observation_owner_delete.sql](../../supabase/migrations/0012_observation_owner_delete.sql).
Read the entire linked file; it is the sole migration body, not an excerpt.
0012 is remote **APPLIED**, with pre/apply/post PASS reported by the operator after
0014 pre/apply/post. Codex did not run SQL or populate migration-tool history.
Existing SQL files are unchanged during this smoke. Do not rerun already-applied
migrations; the references below describe the retained fresh-environment procedure.

### Pre-Apply Read-Only SQL (Operator PASS)

Execute the entire [0012-pre-apply.sql](sql-checks/0012-pre-apply.sql). It checks
table/RLS, role bypass flags, the reviewed admin helper body/privilege, exact public
SELECT and baseline admin DELETE definitions, absence of extra SELECT/DELETE/ALL
policies, owner-policy name availability and the revoked DELETE baseline. These
objects/grants indicate the candidate has not already been applied; SQL Editor
manual application is not inferred from a migration-history filename alone.
All booleans must be `true`; false/null/error means stop, not retry the migration.

### Post-Apply Read-Only SQL (Operator PASS)

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
Those automated results remain historical; no full-suite rerun occurred during
this app-code-unchanged smoke. The operator applied SQL and exercised the ordinary
local app; Codex did not automate its browser or use privileged DB reads.

### Final Admin Permission Smoke

- The operator used the ordinary writer account for one new image-free approved
  observation, then a separate ordinary account (delete button hidden), then the
  administrator. Existing admin UI confirmed the role; this is **OPERATOR_UI**, not
  extracted authentication/session evidence or an independently compared owner ID.
- Admin cancel preserved the target; subsequent confirmed deletion, detail closing,
  list card removal and common-summary refresh passed by explicit user report.
- **LIVE_API:** newly measured records/species **105/91 -> 106/92 -> 105/91**. The
  marker was in name, so the temporary additional species follows existing grouping.
  Unique target creation time, approved state, empty image metadata and comparison
  hashes were checked. Post-delete marker/detail queries returned zero and the
  original identity was absent from all 105 approved narrow summary rows.
- Admin-server PASS is scoped to normal UI success + the repository's returned-ID
  requirement + public disappearance. Public reads alone cannot inspect hidden or
  physically deleted rows; no privileged SQL or captured administrator request is
  claimed. No authenticated non-owner DELETE was sent because browser automation
  was unavailable. A separate regular account exists; **PARTIAL is not due to lack
  of an account**. The UI PASS does not close the server-denial gap.
- Cleanup **PASS** for this one new target under that contract scope. No test
  comments/images, changes to existing observations, account/configuration changes
  or Codex write requests were made. Existing-row field invariance was not audited
  across the whole database; record it as unknown rather than inferring it from counts.
- This admin run's small-map-list UI was not separately confirmed (**PARTIAL**); the
  operator reported unavailable local Kakao integration/no markers, so actual marker
  removal stays **PARTIAL**. Earlier owner small-list PASS is preserved,
  not copied to this run. Image cleanup **NOT_TESTED**, live comment cascade **NOT_RUN**,
  pending/rejected deletion deferred, best-effort orphan risk unchanged.
- 0014/0012/0013 remain **APPLIED + post PASS**, operator-reported. CLI history is
  **unknown**; do not replay/repair migrations. Exact rollback SQL not documented.
  Existing 213 tests/typecheck/build/audit-0 evidence is historical, not rerun here.

### Earlier Owner Live Evidence

Historical `74fba30` smoke below. Its admin NOT_RUN status is superseded only for
observation deletion by the separate follow-up above; Phase 32 evidence is unchanged.

- **OPERATOR_UI PASS:** creation, non-owner delete button hidden, owner confirmation
  cancel preserves the record, subsequent confirmed deletion closes detail, removes
  the list card and refreshes summary without manual reload. Search/filter state and
  small map list removal were confirmed in the operator's final three-item reply.
- **LIVE_API_FROM_LOCAL_PUBLIC_CONFIG PASS:** unique new approved image-free target,
  public visibility, records `105 -> 106 -> 105`, species `91 -> 92 -> 91`. The test
  marker was entered in name instead of description, so the temporary extra species
  was expected under the existing name-based summary definition. No rename was made.
- The first exact-description lookup stopped without a DELETE. A bounded read of
  new approved rows identified exactly one image-free record containing the marker
  in name. Creation time and a target fingerprint bound subsequent checks to it.
- The single anonymous DELETE returned HTTP `401`, safe code `42501`. A following
  read confirmed the same approved record and unchanged fields: anon denial **PASS**.
  No login/session/service-role or Storage request was used by the probe.
- Owner server deletion **PASS within the public repository contract**: operator
  confirmed UI success; the actual repository rejects deletion without a returned
  matching row ID. Subsequent approved metadata enumeration and marker/count queries
  found no target and restored baseline totals. Public absence alone is not an
  independent privileged physical-row inspection; no admin SQL was used.
- Cleanup **PASS** for the one authorized new observation. No comments were created
  on it. No image was attached: `image_cleanup_case=not_applicable_no_image`, live
  Storage cleanup **NOT_TESTED**. The previously approved Phase 32 comments had
  separately returned to zero on their preserved parent.
- Non-owner actual authenticated DELETE request **PARTIAL**: a second regular
  account exists and button hiding passed, but no request was issued from that
  account. Account absence is not the reason. Admin live delete **NOT_RUN**;
  actual Kakao marker removal **PARTIAL**, live comment cascade **NOT_RUN**.
- Invalid-last-page reconciliation and duplicate-click protection retain automated
  evidence; the current `105/106` totals did not exercise a disappearing last page.
  Tree count refresh and large-data map completeness are not new live PASS claims.

Safe execution evidence and current push blocker are in the
[combined readiness record](phase-29-32-fast-track-readiness.md#current-live-smoke-evidence).

**한국어 (이전 작성자 검증):** 당시 삭제 범위는 승인된 공개 관찰로 확정됐습니다. 작성자의 비공개
기록 삭제는 후속 기능이며 버그가 아닙니다. 관리자도 이번에는 approved만 삭제하도록
0012와 버튼/조회 조건을 제한했습니다. 파일 정리 실패가 관찰 삭제 성공을 취소하지
않습니다. 사용자가 migration을 적용했고, 별도로 승인한 이미지 없는 새 관찰 1건의
작성자 삭제와 정리를 확인했습니다. 비작성자의 실제 삭제 요청, 관리자 삭제 및
이미지 정리는 이번 검증에서 확인하지 않았습니다.
