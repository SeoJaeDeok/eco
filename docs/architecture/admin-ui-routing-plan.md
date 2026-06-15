# Admin UI Routing Plan

## Goal

Define the implementation plan for the first admin UI without changing the public app flow.

The admin MVP should support:

- admin login
- admin role verification
- pending observation review
- approve and reject actions
- clear separation from the normal public user screens
- no admin menu in `Navbar` for the first implementation

This document started as the implementation plan for the admin route. It now also records the implemented 15B/15C/15D status.

## Current Routing Structure

The current app does not use React Router. `App.tsx` owns a `PageId` state and passes it to `AppRoutes`.

Current public pages are selected with state:

```text
home
intro
observations
map
upload
```

`Navbar` calls `onNavigate(page)` and does not know about URLs. `AppRoutes` renders the matching page component from `currentPage`.

Admin UI should not disturb this public routing flow. The first admin route should be reachable directly, but it should not add a visible navigation item yet.

## Routing Decision

Recommended MVP route:

```text
/#admin
```

Rationale:

- keeps the current simple state-routing model
- avoids adding React Router or another dependency
- allows direct access to the admin page during testing
- avoids server or hosting rewrite configuration
- keeps admin access unlisted from the public navigation
- can later migrate to `/admin` or React Router if shareable nested routes become necessary

### Options Considered

#### Add `admin` To Existing `PageId`

Pros:

- smallest conceptual change to the current app
- works with current `AppRoutes`
- no new dependency

Cons:

- no direct URL unless extra hash handling is added
- admin access would still be state-driven only
- browser refresh would lose the admin page unless hash syncing is added

Decision: use internally if needed, but pair it with `/#admin` hash handling.

#### Hash Route `/#admin`

Pros:

- direct admin URL without React Router
- no dependency or server configuration
- compatible with static hosting
- easy to keep hidden from `Navbar`
- low-risk bridge from current state routing to future routing

Cons:

- less structured than a real router
- nested admin routes like `/#admin/pending` need small custom parsing if added
- not ideal if the app later needs many deep links

Decision: recommended for MVP.

#### Real Path `/admin`

Pros:

- cleaner URL shape
- closer to production routing expectations

Cons:

- needs hosting fallback configuration for Vite SPA
- current app has no router
- likely requires broader routing changes than the admin MVP needs

Decision: defer.

#### Add React Router

Pros:

- proper nested routes
- browser history and route params
- cleaner long-term admin routing

Cons:

- new dependency
- broader app routing migration
- unnecessary for a small first admin MVP

Decision: defer until route complexity justifies it.

## Current Implementation Status

Implemented:

- `/#admin` hidden route.
- No admin menu item in `Navbar`.
- Email/password login form.
- Supabase Auth session check.
- `profiles.role = 'admin'` admin check.
- Sign out.
- Pending observation list.
- Pending observation detail panel.
- Approve action.
- Reject action.
- Refresh pending list after approve/reject.

Verified:

- Signed-out `/#admin` shows login form.
- Signed-out `/#admin` hides the pending list.
- Admin login succeeds.
- Admin pending list is visible after login.
- Sign out returns to login form and hides admin data.
- Public home, guide, observation list, detail modal, upload page, and static map still work.
- 15C approve/reject smoke test passed with seeded pending rows.
- 15D regression test passed; approve/reject was skipped in 15D because there were no pending rows.
- No console/runtime errors were observed.

Not implemented:

- Image upload and Storage.
- Reject note.
- Audit log.
- Bulk approval.
- Admin menu in `Navbar`.
- User account management UI.
- Spam protection, rate limiting, or CAPTCHA.
- Real map API integration.
- PWA/app packaging.

## Implementation Stages

### 15B: Admin Shell And Auth Gate

Status: implemented.

Scope:

- add `AdminPage` shell
- handle direct `/#admin` access
- add email/password login form
- call `supabaseAuthRepository.signInWithPassword`
- call `getSessionState` to check `user`, `profile`, and `isAdmin`
- show a minimal unauthorized state when the signed-in user is not admin
- add sign out button
- do not implement pending list yet
- do not add an admin menu item to `Navbar`

Recommended files:

```text
src/components/admin/AdminPage.tsx
src/components/admin/AdminLoginForm.tsx
src/components/admin/AdminSessionPanel.tsx
```

Possible routing touch points:

```text
src/App.tsx
src/components/AppRoutes.tsx
src/types.ts
```

Implementation note:

- Keep the public `PageId` flow unchanged for normal navigation.
- Add only the minimal hash handling needed for `/#admin`.
- Do not show admin navigation in `Navbar` yet.
- Keep `supabaseAuthRepository` usage isolated to the admin screen.

### 15C: Pending Review And Approve/Reject

Status: implemented.

Scope:

- call `supabaseAdminObservationRepository.listPendingObservations`
- render pending observation cards
- add selected pending detail panel or modal
- call `approveObservation(id)`
- call `rejectObservation(id)`
- refresh pending list after approve/reject
- keep rejected rows out of public lists
- keep delete, audit logs, reject notes, and bulk actions out of MVP

Recommended additional files:

```text
src/components/admin/AdminPendingList.tsx
src/components/admin/AdminReviewPanel.tsx
src/components/admin/AdminObservationCard.tsx
```

Repository use:

```text
supabaseAdminObservationRepository.listPendingObservations()
supabaseAdminObservationRepository.approveObservation(id)
supabaseAdminObservationRepository.rejectObservation(id)
```

### 15D: Smoke Test

Status: completed. The full approve/reject smoke test passed in 15C. The 15D regression pass found zero pending rows, so approve/reject was not repeated in that pass.

Test flow:

1. Confirm `.env.local` remains untracked and not printed.
2. Run `npm.cmd run typecheck`.
3. Run `npm.cmd run build`.
4. Open `/#admin`.
5. Sign in with an admin Auth user.
6. Confirm `isAdmin === true`.
7. Confirm sign out works.
8. Create a pending observation from the public upload flow or SQL seed.
9. Confirm the pending observation appears in the admin pending list.
10. Approve the pending observation.
11. Confirm it appears in the public observation list.
12. Create or select another pending observation.
13. Reject it.
14. Confirm rejected data does not appear in the public observation list.
15. Confirm non-admin users cannot list pending rows or approve/reject.
16. Confirm no runtime console errors.

## Component Candidates

Admin-specific UI should live under:

```text
src/components/admin/
```

Candidate components:

- `AdminPage.tsx`
- `AdminLoginForm.tsx`
- `AdminSessionPanel.tsx`
- `AdminPendingList.tsx`
- `AdminReviewPanel.tsx`
- `AdminObservationCard.tsx`

Recommended 15B implementation:

- `AdminPage`
- `AdminLoginForm`
- `AdminSessionPanel`

Recommended 15C implementation:

- `AdminPendingList`
- `AdminReviewPanel`
- `AdminObservationCard`

Avoid creating broad shared UI abstractions during 15B/15C unless there is obvious duplication and no visual risk.

## State Management

Use local state inside `AdminPage` for the first implementation.

Initial state candidates:

```text
sessionState
isCheckingSession
authError
isSigningIn
pendingObservations
selectedObservation
isLoadingPending
pendingError
activeActionObservationId
actionError
```

Do not add a global auth context for 15B. If the admin area grows, consider a dedicated `useAdminSession` hook later.

## Repository Usage Plan

15B should use only:

```text
supabaseAuthRepository
```

Required calls:

```text
getSessionState()
signInWithPassword(email, password)
signOut()
```

15C should add:

```text
supabaseAdminObservationRepository
```

Required calls:

```text
listPendingObservations()
approveObservation(id)
rejectObservation(id)
```

Rules:

- Never use a Supabase service role key in the frontend.
- Use only the normal browser Supabase client.
- Let Supabase Auth, RLS, and `profiles.role = 'admin'` enforce privileged access.
- Client-side admin checks are only UX guards, not the security boundary.

## Security Notes

- Do not print `.env.local`.
- Do not print Supabase URL, anon key, access token, refresh token, or admin credentials.
- Do not create or commit `.env` or `.env.local`.
- The hidden `/#admin` route is not a security boundary.
- Real protection comes from Supabase Auth, RLS, and `profiles.role = 'admin'`.
- Non-admin users should fail to load pending rows or approve/reject rows.
- Missing profiles should be treated as non-admin.
- The frontend must never use the service role key.

## Admin Setup For Testing

1. Create a Supabase Auth user.
2. Add the same user id to `public.profiles`.
3. Set `role = 'admin'`.
4. Configure `.env.local` with Supabase client values.
5. Set `VITE_OBSERVATION_REPOSITORY=supabase`.

Do not commit `.env.local`. Do not use or expose the service role key in the frontend.

If there are no pending rows, create one in Supabase SQL Editor. Omit `status` so the database default creates a pending row.

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

## UI Principles

- Preserve the existing calm academic design tone.
- Keep admin UI minimal at first.
- Do not add an admin menu item to `Navbar` in 15B.
- Do not alter the public home, guide, observation list, map, upload, or detail modal flows.
- Use existing UI primitives only when they preserve the design.
- Keep form copy concise and Korean in the actual UI implementation.
- Keep loading and error states small and unobtrusive.

## Test Plan

15B tests:

- `.env.local` is ignored by git.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.
- `/#admin` opens the admin shell.
- no session shows login form.
- valid admin login returns `isAdmin === true`.
- sign out clears the session.
- non-admin login shows unauthorized state.
- invalid login shows a safe error without secrets.
- public pages still work.

15C tests:

- admin can load pending observations.
- non-admin cannot load pending observations.
- approve moves a pending row to approved.
- approved row appears in the public observation list.
- reject moves a pending row to rejected.
- rejected row does not appear in the public observation list.
- approve/reject refreshes the pending list.
- repeated clicks are prevented while an action is in progress.

## Open Questions

- When should the admin menu become visible in `Navbar`?
- Should the admin route remain hidden after MVP?
- How many admin accounts should be supported initially?
- Should non-admin sign-in automatically sign out after showing unauthorized?
- Should reject require a reason?
- When should audit logging be added?
- When should spam protection for public pending submissions be added?
- Should admins be able to edit observation content before approval?
- Should approved/rejected history be visible in the first admin UI?
