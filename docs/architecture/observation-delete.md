# Observation Deletion: Phase 29

## Status And Scope

2026-10-05: local implementation and automated contracts, **not live-verified**.
Stacked on Phase 28 `2b2ce5a`, not on main (`a3887a7`). No remote SQL, real
observation deletion, Storage mutation, push or deployment was performed.

Public detail offers confirmation to the signed-in owner or admin. Anonymous
and non-owner users do not receive that control. The hidden admin route can
switch its existing pending list to the existing all-status repository query.
It delegates deletion to `AdminObservationRepository.deleteObservationAsAdmin`.
This does not expose an admin link in Navbar or replace backend authorization.

## Authorization And An Explicit Limit

- Existing owner identity: `observations.observer_id`, referencing `profiles.id`.
- Existing admin authority: `public.is_admin()`, backed by `profiles.role`.
- `0001` already contains an admin DELETE policy; later migrations revoke the
  authenticated table DELETE grant. New `0012` restores that grant and adds
  owner DELETE, without changing existing SELECT/UPDATE policies or columns.
- **Public owner deletion currently reaches approved observations only.**
  Existing SELECT RLS does not expose an owner's pending/rejected rows. Ordinary
  Supabase DELETE is constrained by SELECT visibility; an owner DELETE policy
  alone does not make those hidden rows accessible.
- Admin SELECT already reaches all statuses, so admin deletion is not restricted
  to approved rows. Anonymous DELETE remains ungranted; RLS denies non-owners.
- Supporting owner deletion of hidden rows needs a separately agreed narrow
  database path. No owner SELECT widening or new delete RPC was silently added.
  This scope question remains open, not an implementation PASS for every owner row.

The SELECT dependency follows the [Supabase delete reference](https://supabase.com/docs/reference/javascript/delete).
RLS grants/policies remain subject to actual database verification after manual application.

## Repository, Images And UI

`ObservationRepository.deleteObservation(id)` returns only
`imageCleanup = not-needed / removed / unconfirmed`. Supabase requires an existing
user session, deletes one ID, and requests only `id,image_path,observer_id` from
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
No existing migration was edited. Apply only after separate review/approval,
backup/restore planning and checking the live policy definitions for drift.

### Pre-Apply Read-Only SQL (Not Run)

These checks describe the reviewed baseline. Every boolean should be `true`;
otherwise stop and inspect the difference, rather than replacing existing policy.

```sql
select
  to_regprocedure('public.is_admin()') is not null as admin_helper_exists,
  exists (select 1 from pg_class where oid = 'public.observations'::regclass
          and relrowsecurity) as observation_rls_enabled,
  not has_table_privilege('anon', 'public.observations', 'DELETE') as anon_delete_denied,
  not has_table_privilege('authenticated', 'public.observations', 'DELETE') as baseline_delete_ungranted,
  exists (select 1 from pg_policies where schemaname = 'public'
          and tablename = 'observations' and cmd = 'DELETE'
          and qual like '%is_admin%') as existing_admin_delete_policy,
  not exists (select 1 from pg_policies where schemaname = 'public'
          and tablename = 'observations'
          and policyname = 'Owners can delete own observations') as new_policy_absent;
```

### Post-Apply Read-Only SQL (Not Run)

Expected all `true`. Catalog checks are **not** live owner/non-owner/anon RLS tests.

```sql
select
  has_table_privilege('authenticated', 'public.observations', 'DELETE') as delete_granted,
  not has_table_privilege('anon', 'public.observations', 'DELETE') as anon_still_denied,
  exists (select 1 from pg_class where oid = 'public.observations'::regclass
          and relrowsecurity) as rls_still_enabled,
  exists (select 1 from pg_policies where schemaname = 'public'
          and tablename = 'observations' and cmd = 'DELETE'
          and policyname = 'Owners can delete own observations'
          and qual like '%observer_id%' and qual like '%auth.uid%') as owner_delete_present,
  exists (select 1 from pg_policies where schemaname = 'public'
          and tablename = 'observations' and cmd = 'DELETE'
          and qual like '%is_admin%') as admin_delete_preserved;
```

### Rollback Concept

Revoking the newly restored DELETE grant and removing only the new owner policy
can disable the feature, but cannot restore deleted observations, cascaded comments
or objects. Preserve the pre-apply privilege/policy inventory and backups first.
Exact rollback SQL and data restoration procedures require a separate review;
none was executed or represented as a tested recovery plan.

## Verification

See [combined readiness](phase-29-32-fast-track-readiness.md). Tests cover actual
repository query construction with simulated responses, mock permissions,
confirmation/double-click behavior, App revision wiring, last-page correction,
search retention, admin repository delegation, safe cleanup and tree refresh.
SQL is checked as a candidate, not executed against PostgreSQL. Shared DB deletion,
real Storage removal and real browser interaction remain NOT_RUN/PARTIAL.

**한국어:** 삭제 버튼, 재확인, 목록·지도·요약 갱신을 구현했습니다. 실제 DB 적용과
삭제 실험은 하지 않았습니다. 작성자의 비공개 기록 삭제 범위와 이미지 파일의
실제 정리 권한은 별도 확인이 필요합니다. 관찰 삭제 성공과 파일 삭제 성공은 다릅니다.
