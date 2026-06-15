# Admin Approval Flow Design

## Goal

Define the first admin approval flow for submitted biodiversity observations before implementing Auth UI, admin pages, or additional Supabase code.

The MVP should let admins review `pending` observations and move them to `approved` or `rejected` while keeping public users limited to:

- reading only `approved` observations
- creating only `pending` observations
- never updating, deleting, approving, or rejecting observations

This document started as a planning note. It now also records the implemented admin approval MVP status and remaining gaps.

## Current State

- Public approved read is working through the Supabase observation repository.
- Public pending insert is working through the upload submit flow.
- Pending rows are intentionally hidden from the public observation list because public select is limited to `status = 'approved'`.
- A manually approved row becomes visible in the app list after `status` is updated to `approved`.
- Admin authorization is designed around Supabase Auth plus `public.profiles.role = 'admin'`.
- The frontend must never use a Supabase service role key.
- `/#admin` is implemented as a hidden admin route.
- Signed-out users see the admin login form and do not see the pending list.
- Admin users can sign in with email/password, load pending observations, review details, approve, reject, and sign out.
- After sign out, the admin session panel and pending list are hidden.
- Approved rows appear in the public observation list.
- Rejected rows stay hidden from the public observation list.
- Image upload, Storage, reject notes, audit logs, bulk approval, and admin user-management UI are not implemented yet.

## Admin MVP Scope

The current admin MVP includes:

- Admin sign-in.
- Admin session detection.
- Admin role check using `profiles.role = 'admin'`.
- Pending observation list.
- Pending observation detail view.
- Approve action.
- Reject action.
- Basic loading and error states.

The current admin MVP does not include:

- Delete as a default workflow.
- Bulk approval.
- Image upload or Storage moderation.
- Audit logs.
- Admin account management UI.
- Complex role hierarchy.
- Public user ownership or edit requests.

Delete can remain a later admin-only operation for abusive or invalid data after the retention policy is defined.

## Repository Methods

The existing `ObservationRepository` is public-facing. Admin behavior should be added carefully so public flows do not gain privileged methods accidentally.

Recommended approach:

- Keep `ObservationRepository` for public app screens.
- Add a separate `AdminObservationRepository` for admin-only flows.

Candidate interface:

```ts
export interface AdminObservationRepository {
  listPendingObservations(): Promise<Observation[]>;
  listAllObservations(): Promise<Observation[]>;
  approveObservation(id: string): Promise<Observation>;
  rejectObservation(id: string): Promise<Observation>;
}
```

Possible later additions:

```ts
export interface AdminObservationRepository {
  getObservationForReview(id: string): Promise<Observation | null>;
  deleteObservation(id: string): Promise<void>;
}
```

Avoid putting admin methods on the public repository until the app has a clear boundary between public and admin routes.

## Supabase Query Candidates

Pending list:

```ts
supabase
  .from('observations')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: true });
```

All observations for admin review:

```ts
supabase
  .from('observations')
  .select('*')
  .order('created_at', { ascending: false });
```

Approve:

```ts
supabase
  .from('observations')
  .update({ status: 'approved' })
  .eq('id', id)
  .select('*')
  .single();
```

Reject:

```ts
supabase
  .from('observations')
  .update({ status: 'rejected' })
  .eq('id', id)
  .select('*')
  .single();
```

Delete candidate, later only:

```ts
supabase
  .from('observations')
  .delete()
  .eq('id', id);
```

The approve/reject queries require an authenticated admin session. They should fail for anonymous users and non-admin authenticated users under the current RLS model.

## RLS And Authorization Flow

Expected RLS behavior:

- `anon` and non-admin users can select only approved observations.
- `anon` and authenticated public users can insert observations that become pending.
- Public users cannot update or delete observations.
- Authenticated admins can select all observations.
- Authenticated admins can update observations.
- Authenticated admins can delete observations if the candidate delete policy remains enabled.

Recommended app flow:

1. User opens the admin route.
2. App checks for a Supabase Auth session.
3. If no session exists, show the sign-in UI.
4. If a session exists, fetch the user's profile.
5. If `profile.role !== 'admin'`, show an unauthorized state.
6. If the user is admin, load pending observations.
7. Admin opens a pending observation detail panel.
8. Admin clicks approve or reject.
9. Repository updates the row status.
10. UI removes the row from the pending list or refreshes the pending list.

Do not rely only on client-side role checks. Client checks are for UX. RLS remains the authority.

## Admin Route Candidates

Current implemented route:

```text
/#admin
```

The route is intentionally not shown in `Navbar`. This is only a hidden entry point for convenience and is not a security boundary.

With the current state-based routing model, add these page ids only when implementation begins:

```text
admin
adminPending
```

If React Router is adopted later, route candidates are:

```text
/admin
/admin/pending
```

For the current app, a minimal state-based route plus hash handling is enough for the first admin MVP. Do not migrate routing frameworks just for this feature.

## UI Composition

Suggested admin page composition:

```text
AdminPage
  AdminAuthGate
  AdminPendingPage
    AdminObservationList
      AdminPendingCard
    AdminObservationReviewPanel
      AdminObservationDetail
      Approve/Reject actions
```

Pending card should show:

- species/common name
- scientific name
- taxon
- location
- observed date
- submitted timestamp
- short description preview
- status

Detail panel or modal should show:

- all observation fields
- static map position preview
- image placeholder or image preview when Storage exists later
- approve button
- reject button
- loading state for the active action
- compact error message when the action fails

Approve/reject buttons should:

- use `type="button"`
- be disabled while the mutation is in progress
- not change public UI copy or existing public page layout
- keep destructive styling reserved for reject/delete decisions

## Error Handling

Handle these cases explicitly:

- Missing Supabase env values while repository mode is `supabase`.
- No Auth session.
- Auth session exists but profile is missing.
- Profile exists but `role` is not `admin`.
- RLS blocks pending list select.
- RLS blocks approve/reject update.
- Observation was already approved/rejected by another admin.
- Network request fails.
- Update succeeds but returned row cannot be selected due to policy or query shape.

For approve/reject, the UI can refresh the pending list after success instead of depending on optimistic updates.

## Risks

- Admin role missing from `profiles` means a real admin cannot load pending rows.
- Misconfigured RLS can expose pending rows publicly.
- Misconfigured RLS can let public users approve their own submissions.
- Granting `admin` to the wrong user exposes moderation powers.
- Service role key exposure would bypass RLS and is not acceptable in frontend code.
- Anonymous public insert can create spam and abusive content.
- Rejected rows may need retention, deletion, or audit policy before production.
- If Storage is added later, pending images may need stricter privacy than approved observations.

## Security Notes

- Never put the Supabase service role key in Vite env variables.
- Never rely on user-editable metadata for authorization.
- Prefer `profiles.role = 'admin'` or non-user-editable app metadata.
- Keep RLS enabled for `observations` and `profiles`.
- Treat `/#admin` as convenience UI only; RLS must enforce all privileged operations.
- Keep `.env.local` out of git.
- Do not log keys, access tokens, refresh tokens, or full Supabase URLs in app logs.

## Admin Setup

1. Create a Supabase Auth user in the Supabase Dashboard.
2. Insert or update the same user id in `public.profiles` with `role = 'admin'`.
3. Set Supabase values in `.env.local`.
4. Set `VITE_OBSERVATION_REPOSITORY=supabase`.

Rules:

- Do not commit `.env.local`.
- Do not put the service role key in frontend code or Vite env variables.
- Do not document real URLs, keys, tokens, emails, or passwords.

## Pending Test Row

If the admin queue is empty during testing, insert a pending row in Supabase SQL Editor. Do not include the `status` column; the database default should set `pending`.

```sql
insert into public.observations (
  name,
  scientific_name,
  taxon,
  location,
  observed_date,
  description,
  latitude,
  longitude
) values (
  'admin-review-test',
  'Admin review species',
  '식물',
  '경북대학교 대구캠퍼스',
  current_date,
  '관리자 승인 검증용 pending 기록',
  35.8897,
  128.6104
);
```

## Verification Checklist

- Run `npm.cmd run typecheck`.
- Run `npm.cmd run build`.
- Open `/#admin` while signed out.
- Confirm the login form is visible.
- Confirm the pending list is hidden while signed out.
- Sign in with an admin Auth user.
- Confirm the pending list is visible.
- Approve a pending row.
- Confirm the row is removed from the pending list and appears in the public list.
- Reject a pending row.
- Confirm the row is removed from the pending list and remains hidden from the public list.
- Sign out.
- Confirm the admin session panel and pending list are hidden.
- Check public home, guide, observation list, detail modal, upload page, and static map.
- Confirm no console/runtime errors.

## Implementation Plan

1. Add a small Auth design note if sign-in provider details are unclear.
2. Add an `AdminObservationRepository` interface.
3. Add Supabase admin repository methods without wiring the public app to admin routes.
4. Add a session/profile helper that can determine admin status.
5. Add minimal state route ids for admin pages.
6. Add `AdminAuthGate`.
7. Add pending list UI using existing design primitives where safe.
8. Add review detail panel/modal with static map preview.
9. Add approve/reject actions.
10. Verify non-admin users cannot list pending rows.
11. Verify admins can list pending rows.
12. Verify approve moves the row to the public list.
13. Verify reject keeps the row hidden from the public list.
14. Keep delete, Storage moderation, and audit logs for later steps.

## Open Questions

- Which Auth provider should the MVP use: email/password, magic link, or university SSO later?
- Should admin access be hidden behind an unlinked route or visible in the navigation after sign-in?
- Should rejected rows be retained indefinitely, soft-deleted, or hard-deleted later?
- Should approve/reject require an admin note?
- Should admin updates be limited to `status` only, or can admins edit content fields too?
- Should the first admin UI show only pending rows or also approved/rejected history?
- Should there be an audit table for status transitions?
- Should anonymous public insert remain enabled before spam protection exists?
- How will Storage images be reviewed when image upload is added?
- Should multiple admins be supported immediately, and how will role assignment be managed?
