# Phase 15 - Hidden Admin Approval UI

## Status

Verified.

**한국어:** 검증 완료로 기록된 phase입니다.

## Goal

Add a hidden admin review workflow for pending observations while keeping public routes and visibility rules unchanged.

**한국어:** public route와 visibility 규칙을 유지하면서 pending observations 검토를 위한 숨겨진 admin workflow를 추가했습니다.

## Main Work

- Phase 15A documented admin routing and UI plan.
- Phase 15B implemented the hidden admin login page at `/#admin`.
- Phase 15C implemented admin pending approval UI.
- Phase 15D completed admin permission and public-flow regression verification.
- Phase 15E updated admin documentation.
- Kept the admin route out of `Navbar`.

**한국어:** admin routing/UI 계획, `/#admin` login, pending approval UI, permission regression, admin 문서 업데이트를 완료하고 Navbar에는 admin route를 노출하지 않았습니다.

## Key Files

- `src/components/admin/AdminPage.tsx`
- `src/components/admin/AdminLoginForm.tsx`
- `src/components/admin/AdminPendingList.tsx`
- `src/components/admin/AdminObservationReviewPanel.tsx`
- `src/components/admin/AdminSessionPanel.tsx`
- `src/components/admin/AdminObservationCard.tsx`
- `src/components/AppRoutes.tsx`
- `docs/architecture/admin-ui-routing-plan.md`
- `docs/architecture/admin-approval-flow.md`

**한국어:** admin UI 컴포넌트와 admin routing/approval 문서가 핵심입니다.

## Verification

- Admin approve/reject smoke test passed in Phase 15C.
- Admin permission/regression verification completed in Phase 15D.
- The handoff records that `/#admin` shows login while signed out and hides the pending list.

**한국어:** approve/reject smoke, admin permission regression, signed-out 상태의 login 표시와 pending list 숨김이 기록되어 있습니다.

## Remaining Risks / Follow-ups

- Reject notes, audit logs, bulk approval, user management, and Storage moderation were intentionally out of scope.
- Image upload and Storage review arrived in Phase 16.

**한국어:** reject note, audit log, bulk approval, user management, Storage moderation은 비범위였고, 이미지/Storage 검토는 Phase 16에서 다뤘습니다.

## Linked Docs

- `docs/architecture/admin-ui-routing-plan.md`
- `docs/architecture/admin-approval-flow.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** admin routing, approval flow, handoff 문서를 함께 참고합니다.

## Notes

- Hidden routing is not a security boundary; Supabase Auth, RLS, and admin role checks remain the real authorization layer.

**한국어:** 숨겨진 route는 보안 경계가 아니며 실제 권한 제어는 Supabase Auth, RLS, admin role check가 담당합니다.
