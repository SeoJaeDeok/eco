# Owner/Admin Observation Edit Design

## Purpose And Scope

Phase 20G designs owner/admin observation edit behavior before implementation.

This phase is design-only:

- no edit UI implementation
- no repository update implementation
- no Supabase SQL, RLS, policy, or migration application
- no package changes
- no Storage object changes
- no Kakao Map changes

Implementation should start in later phases after the DB/RLS and repository contract are reviewed. This document keeps existing public visibility, Auth, Storage, and admin route principles intact.

Image replacement is not recommended for the first edit MVP. It should be handled as a later dedicated phase because it changes Storage permissions, orphan cleanup risk, and signed URL refresh behavior.

## Current State Summary

Current implemented state:

- 20D public login/logout UI, public auth state, and signed-out upload gate are complete.
- 20E authenticated direct approved create is complete.
- Signed-in Supabase contributors create approved observations with `observer_id = auth.uid()`.
- Safe `observer_display_name` snapshots are stored only when a non-email display name is available.
- 20F observer display is complete in public observation cards and detail modal.
- Public list/detail reads remain approved-only.
- Pending and rejected observations remain hidden from public list/detail.
- Hidden `/#admin` remains the admin entry point and is not exposed in `Navbar`.
- Owner/admin edit is not implemented.

Relevant current contracts:

- `ObservationRepository` supports list, approved detail read, count, and create.
- `AdminObservationRepository` supports pending/all list and approve/reject.
- `AuthRepository` exposes current user, profile, session, admin status, sign-in, and sign-out.
- Supabase public reads still filter `status = 'approved'`.
- Supabase Storage-backed rows store object path and metadata only; runtime signed URLs are display-only.

## User Requirements

Requested behavior:

- Observation records should be editable.
- Only the original observer and administrators can edit.
- Anonymous users cannot edit.
- Signed-in non-owners cannot edit other users' records.
- Administrators can edit any observation through admin-authorized paths.

The edit feature must not expose pending/rejected rows publicly, reveal email addresses, store URL-like image values, or expose the hidden admin route in the public Navbar.

## Editable Field Candidates

| Field | Owner edit MVP | Admin edit MVP | Recommendation |
| --- | --- | --- | --- |
| Common name / title (`name`) | yes | yes | Editable with non-empty validation. |
| Scientific name (`scientific_name`) | yes | yes | Editable and nullable/blank-safe. |
| Taxon (`taxon`) | yes | yes | Editable with existing `Taxon` constraints. |
| Observed date (`observed_date`) | yes | yes | Editable as existing date-only value. |
| Location name (`location`) | yes | yes | Editable with non-empty validation. |
| Coordinates (`latitude`, `longitude`) | yes | yes | Editable through existing map/picker UX, with range validation. |
| Description (`description`) | yes | yes | Editable and nullable/blank-safe. |
| Image replacement | no | no for MVP | Exclude from MVP; design separately later. |
| Status (`status`) | no | yes | Admin-only review/status field. Owner must not change it. |
| Observer id (`observer_id`) | no | no by default | Ownership transfer is not an MVP workflow. |
| Observer display snapshot (`observer_display_name`) | no | no by default | Avoid retroactive attribution edits in MVP. |
| Image path/metadata (`image_path`, `image_mime_type`, `image_size_bytes`) | no | no | Image replacement is out of scope. |
| Legacy image URL (`image_url`) | no | no | Must remain null for Storage-backed rows and must never contain signed/public/blob/data URLs. |

MVP recommendation:

- Allow text, classification, date, location, coordinates, and description edits.
- Keep status admin-only.
- Do not allow owner or normal admin edit flows to change observer fields.
- Do not allow image replacement.
- Do not allow `image_url` writes.

## Permission Model

Roles and conditions:

- Owner: `observations.observer_id = auth.uid()`.
- Admin: `public.is_admin()` is true through the existing profile role model.
- Anonymous: no edit access.
- Authenticated non-owner: no edit access.
- Legacy row with `observer_id is null`: not owner-editable.
- Admin can edit legacy rows because admin authorization is independent of ownership.
- Owner cannot claim or edit a legacy row unless a separately approved ownership backfill sets `observer_id`.

Recommended visibility:

- Public detail can show an edit affordance only to the signed-in owner.
- Admin edit should start in the hidden `/#admin` route, not by exposing admin navigation in the public Navbar.
- A later phase can decide whether signed-in admins also see edit affordances in public detail, but that should not be required for the MVP.

## RLS/DB Design Considerations

RLS can determine which rows a user may update. It is weaker at expressing a complete field-level edit contract by itself.

### Field Protection Options

| Option | Summary | Pros | Cons | Recommendation |
| --- | --- | --- | --- | --- |
| Column-level grants plus owner/admin RLS | Grant update only for approved content fields and use RLS guards. | Simple, close to current 0003 draft, no server function required. | Admin status updates need careful grant/policy separation; grants are coarse per role. | Use as the first migration direction, but review status handling carefully. |
| Repository-only payload narrowing | UI/repository sends only allowed fields. | Easy to implement in TypeScript and mock mode. | Not a security boundary by itself. | Required, but only as defense-in-depth. |
| RPC for owner update | Define a Postgres function that accepts only owner-editable fields. | Stronger field boundary and status/image protection. | More SQL design and testing; RPC contract adds maintenance. | Good candidate if column grants cannot safely separate owner/admin status updates. |
| Trigger/check guard | Reject disallowed changes in a trigger. | Enforces old/new field invariants centrally. | More complex rollback/debugging. | Consider only if policy/grant/RPC model is not enough. |
| View-based update | Expose an updatable view with limited columns. | Can narrow public update surface. | RLS and generated columns can be subtle. | Not recommended for MVP unless RPC is rejected. |

### Recommended DB/RLS Direction

For 20H, draft an edit-focused migration or SQL review that:

- keeps anon/authenticated public select approved-only
- preserves admin all-read/all-update authorization through `public.is_admin()`
- allows owner update only when `observer_id = auth.uid()` and current row is approved
- ensures owner updates keep `status = 'approved'`
- prevents owner writes to `observer_id`, `observer_display_name`, `image_url`, `image_path`, `image_mime_type`, and `image_size_bytes`
- prevents image replacement in the MVP
- keeps `image_url is null` for Storage-backed rows
- keeps status changes admin-only
- relies on the existing `public.set_updated_at()` trigger for `updated_at`
- leaves audit log out of scope

Important caveat:

- The current 0003 candidate grants `status` update to authenticated users so admin status updates can continue. Before implementation, 20H should review whether this is safe enough with the owner `with check status = 'approved'` guard or whether owner and admin updates should be split through RPC or stricter grants.

## Repository Design

### Shared Types

Add an edit input type separate from create input:

```ts
interface UpdateObservationContentInput {
  name: string;
  scientificName?: string;
  taxon: Taxon;
  location: string;
  date: string;
  description?: string;
  coords: Coordinates;
}
```

Do not include:

- `status`
- `observerId`
- `observerDisplayName`
- `imageUrl`
- `imageFile`
- `imagePath`
- Storage metadata fields

### Owner Repository Method

Candidate public repository method:

```ts
updateObservation(id: string, input: UpdateObservationContentInput): Promise<Observation>;
```

Rules:

- implemented behind `ObservationRepository`
- Supabase implementation uses the current authenticated user implicitly through RLS, not a user id passed from UI
- no Supabase client usage in UI components
- returns the updated approved observation with runtime image display fields refreshed
- public reads remain approved-only

### Admin Repository Method

Candidate admin repository methods:

```ts
updateObservationAsAdmin(id: string, input: UpdateObservationContentInput): Promise<Observation>;
updateObservationStatusAsAdmin(id: string, status: AdminObservationStatusUpdate): Promise<Observation>;
```

Rules:

- keep admin update methods in `AdminObservationRepository`
- keep approve/reject as existing specialized status methods unless a later refactor intentionally consolidates them
- admin edit can use the same content input as owner edit but should remain under admin RLS and hidden admin UI

### Mock Mode

Mock repository options:

- return the updated observation object without mutating `sampleObservations`
- update only in `App` state after the repository returns
- document that mock persistence resets on reload

Recommendation:

- Keep mock updates in memory only for the active app session if 20J implements UI.
- Do not mutate `sampleObservations`.

### Refresh Strategy

After update:

- replace the matching item in the loaded public observations state
- refresh selected detail with the repository result
- keep signed URL display refresh behavior from 18C
- if an update changes coordinates, map/list surfaces should pick up the updated object after state replacement

## UI Design

### Edit Entry Point

Options:

| Option | Summary | Pros | Cons | Recommendation |
| --- | --- | --- | --- | --- |
| Detail modal only | Show edit action inside `ObservationDetail`. | Low visual noise; avoids cards becoming crowded. | Requires detail open before edit. | Recommended MVP. |
| Card edit button | Add edit action to each card. | Fast access for owners/admins. | More layout risk and accidental taps. | Defer. |
| Dedicated edit route | Separate page state for editing. | Clear workflow. | Larger routing and state changes. | Defer. |

MVP recommendation:

- Add owner edit affordance inside the detail modal only.
- Hide edit affordance from anonymous users and non-owners.
- Keep cards unchanged except they continue to open detail.

### Owner Detection In UI

The domain model currently does not expose `observer_id`.

Options:

- Add `observerId?: string` to `Observation` and use it only for permission checks.
- Add a separate `canEdit?: boolean` or `viewerPermissions` field returned by repository.
- Ask repository for permission by id when detail opens.

Recommendation:

- Prefer `canEdit`/permission metadata rather than rendering raw `observer_id` in UI copy.
- If `observerId` is added for pragmatic reasons, treat it as internal state and never display it.
- The final authority remains RLS; UI visibility is only an affordance.

### Form Shape

Options:

- Inline edit inside detail modal.
- Separate edit modal from detail modal.
- Reuse upload form components.

Recommendation:

- Use a separate edit panel/modal opened from detail, using the same field primitives where they fit.
- Reuse validation helpers where possible, but do not reuse image picker in the MVP.
- Keep Korean copy calm and direct:
  - "기록 수정"
  - "수정 내용을 저장했습니다."
  - "수정 권한이 없거나 저장에 실패했습니다."

### Admin UI Relationship

Options:

- Add admin edit to hidden `/#admin` only.
- Add admin edit affordance to public detail when signed in as admin.
- Add both.

Recommendation:

- Start admin edit in hidden `/#admin` because it keeps admin operations out of public navigation and matches the current admin boundary.
- Public `Navbar` must not expose the admin route.
- Existing approve/reject stays intact.
- Admin status changes remain separate from owner content edit.

## Image Replacement Decision

Decision: exclude image replacement from the 20G/20H/20J MVP.

Reasons:

- Storage object replacement creates orphan cleanup and retention decisions.
- Existing image display depends on `image_path` plus runtime signed URL generation.
- Owner Storage update/delete permissions would significantly expand the RLS/Storage policy surface.
- Image replacement needs UX for preview, upload failure, old-object retention, and rollback.
- 18E cleanup automation is still design-only, so automatic cleanup is not yet in place.

Future image replacement should be a separate 20L or later design phase with:

- Storage path policy review
- orphan cleanup runbook update
- old-image retention decision
- signed URL refresh regression
- owner/admin permission matrix

## Admin Edit Relationship

Existing admin behavior:

- hidden `/#admin` route
- admin login through Supabase Auth
- `profiles.role = 'admin'`
- pending list and approve/reject UI
- admin route not shown in `Navbar`

Admin edit should:

- preserve approve/reject
- allow content/location metadata edits for all rows
- keep status updates admin-only
- keep image replacement out of scope
- avoid public email exposure
- avoid exposing the admin route in public navigation

Recommended MVP:

- Add admin content edit under hidden `/#admin` after owner edit repository/RLS rules are reviewed.
- Use `listAllObservations()` or a filtered admin list only inside admin UI.
- Do not add an admin link to `Navbar`.

## Verification Plan

Required 20K regression checks:

- owner sees edit button on their approved observation
- owner can edit allowed content fields
- owner cannot edit another user's row
- owner cannot edit legacy rows with `observer_id is null`
- authenticated non-owner does not see edit button
- authenticated non-owner update attempt is denied by RLS
- anonymous user does not see edit button
- admin can edit owned, non-owned, and legacy rows through admin UI
- admin approve/reject still works for legacy pending rows
- owner cannot change `status`
- owner cannot change `observer_id`
- owner cannot change `observer_display_name`
- owner cannot write `image_url`
- owner cannot change `image_path`, `image_mime_type`, or `image_size_bytes`
- updated approved row remains visible in public list/detail
- pending/rejected rows remain hidden from public list/detail
- signed image display still uses runtime signed URLs
- email/token/key/password values do not appear in UI logs
- `npm.cmd run typecheck` passes
- `npm.cmd run build` passes
- `git diff --check` passes

## Implementation Step Proposal

Recommended sequence:

1. 20H: owner/admin edit DB/RLS implementation plan or migration candidate.
   - Review whether column grants are sufficient or whether owner edit should use an RPC.
   - Keep SQL application separate and explicitly approved.
2. 20I: repository update methods.
   - Add update input type.
   - Add owner update method to `ObservationRepository`.
   - Add admin update method to `AdminObservationRepository`.
   - Keep UI Supabase-free.
3. 20J: edit UI implementation.
   - Owner edit affordance in public detail.
   - Admin edit affordance in hidden admin UI.
   - No image replacement.
4. 20K: owner/admin edit smoke and regression.
   - Verify owner, non-owner, anon, and admin paths.
   - Verify public visibility invariants.
5. 20L: optional image replacement design, only if needed later.

## Explicit Non-Scope

20G does not include:

- app code implementation
- repository update implementation
- edit UI implementation
- SQL/RLS application
- image replacement implementation
- audit log implementation
- reject note implementation
- bulk approval implementation
- user management implementation
- package changes
- new dependencies
- admin route exposure in `Navbar`
- Storage cleanup automation
- Storage object deletion
- Kakao Map changes
- public exposure of pending/rejected observations
- signed/public/blob/data URL DB storage

## Recommended 20G Decision

Use a conservative owner/admin edit MVP:

- Owner edit: detail-modal entry point, allowed content/location fields only, `observer_id = auth.uid()` guarded by RLS.
- Admin edit: hidden admin route, allowed content/location fields plus separate admin-only status controls.
- Image replacement: excluded.
- Observer fields: not editable.
- URL/image metadata fields: not editable.
- Public reads: approved-only.
- Field-level protection: combine DB grants/RLS with repository payload narrowing; consider RPC in 20H if status/admin separation cannot be made robust with grants alone.
