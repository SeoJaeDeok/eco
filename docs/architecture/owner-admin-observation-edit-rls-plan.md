# Owner/Admin Observation Edit RLS Plan

## Purpose And Scope

Phase 20H defines the DB/RLS and field-protection plan for owner/admin observation editing before implementation.

Scope:

- DB/RLS/update-permission design only.
- SQL draft only, stored under `docs/architecture/sql-drafts/`.
- No SQL is applied to Supabase in this phase.
- No edit UI implementation.
- No repository update method implementation.
- No package changes.
- No image replacement.

Implementation boundaries:

- Edit UI starts no earlier than 20J.
- Repository update methods start no earlier than 20I.
- Apply-ready migration promotion and manual Supabase application require separate approval.
- Public reads must remain approved-only.
- Pending and rejected observations must remain hidden from public list/detail.
- The hidden admin route must stay out of the public Navbar.

## 20G Decision Summary

Phase 20G chose a conservative owner/admin edit MVP:

- Owners can edit only their own observations where `observer_id = auth.uid()`.
- Admins can edit observations through the existing hidden admin boundary and `public.is_admin()`.
- Anonymous users cannot edit.
- Authenticated non-owners cannot edit.
- Owner edit is limited to text, classification, date, location, coordinates, and description.
- Status remains admin-only.
- `observer_id` and `observer_display_name` are not editable in the MVP.
- Image fields are not editable in the MVP.
- `image_url` must not receive signed, public, blob, or data URLs.
- Image replacement is explicitly excluded from the MVP.

## Editable Field Matrix

### Role Matrix

| Role | Read public approved rows | Edit allowed content fields | Edit status | Edit protected fields | Notes |
| --- | --- | --- | --- | --- | --- |
| `anon` | yes | no | no | no | Public list/detail remain approved-only. |
| authenticated owner | yes | yes, own approved rows only | no | no | Guarded by `observer_id = auth.uid()`. |
| authenticated non-owner | yes | no | no | no | RLS must deny direct update attempts. |
| admin | yes, plus admin all-read | yes | yes | no for image/observer fields in MVP | Admin operations stay behind `/#admin`. |

### Field Matrix

| Field | Owner | Non-owner authenticated | Admin | Recommendation |
| --- | --- | --- | --- | --- |
| common name/title (`name`) | update | no | update | Owner/admin editable. |
| scientific name (`scientific_name`) | update | no | update | Owner/admin editable. |
| taxon (`taxon`) | update | no | update | Owner/admin editable with app validation. |
| observed date (`observed_date`) | update | no | update | Owner/admin editable. |
| location name (`location`) | update | no | update | Owner/admin editable. |
| latitude/longitude (`latitude`, `longitude`) | update | no | update | Owner/admin editable. |
| description (`description`) | update | no | update | Owner/admin editable. |
| status (`status`) | no | no | update | Admin-only. |
| observer id (`observer_id`) | no | no | no | Ownership transfer is out of scope. |
| observer display (`observer_display_name`) | no | no | no | Avoid attribution rewrites in MVP. |
| image path (`image_path`) | no | no | no | Image replacement is out of scope. |
| image MIME (`image_mime_type`) | no | no | no | Image replacement is out of scope. |
| image size (`image_size_bytes`) | no | no | no | Image replacement is out of scope. |
| legacy image URL (`image_url`) | no | no | no | Must remain null for Storage-backed rows. |
| created timestamp (`created_at`) | no | no | no | Immutable audit-ish metadata. |
| updated timestamp (`updated_at`) | automatic | automatic | automatic | Existing trigger updates this. |

## Field-Level Protection Options

### Option A: Repository Payload Whitelist Only

Repository code sends only owner-editable fields.

Advantages:

- Simple TypeScript implementation.
- Easy to reason about in the UI/repository layer.
- Avoids more SQL surface.

Disadvantages:

- Not sufficient as DB security.
- A malicious client could bypass UI code and call PostgREST directly if table grants/RLS allow more.

Assessment: required as a defense-in-depth layer, but insufficient alone.

### Option B: Column-Level UPDATE Grants

Grant `UPDATE` only on the allowed content/location columns plus `status` for admin status workflows.

Advantages:

- Native Postgres field-level permission.
- Prevents direct writes to observer and image columns from the public API role.
- Fits Supabase/PostgREST table access.

Disadvantages:

- Supabase clients use the shared `authenticated` database role, so owner and admin column grants cannot be separated by app role alone.
- If `status` is granted for admin updates, non-admin owners need an additional DB guard to prevent status changes.

Assessment: useful, but should be paired with RLS and a protected-field trigger.

### Option C: Trigger-Based Protected Field Guard

Add a `before update` trigger that rejects protected field changes.

Advantages:

- DB-enforced old/new invariant.
- Can block owner writes to `status`, observer fields, and image fields even if a future grant is too broad.
- Keeps repository implementation smaller than an RPC-first design.

Disadvantages:

- More SQL to test.
- Trigger ordering must avoid conflict with the existing `updated_at` trigger.
- Rollback/debugging is more complex than grants alone.

Assessment: recommended for 20H draft as a DB-level guard paired with grants and RLS.

### Option D: RPC/Function-Based Owner Update

Expose an `update_observation_as_owner` function that accepts only owner-editable fields.

Advantages:

- Strong API contract for owner edits.
- Can avoid broad direct table update access if implemented carefully.
- Easier to give the frontend one narrow update path.

Disadvantages:

- `security definer` functions require careful `search_path`, ownership, and privilege review.
- RLS interactions must be tested carefully.
- Adds a new API contract before the table/RLS model has been smoke-tested.

Assessment: keep as fallback if column grants plus trigger/RLS cannot cleanly protect status/admin separation.

### Option E: Hybrid

Use repository payload whitelist plus DB-level grants/RLS plus a protected-field trigger.

Advantages:

- Preserves repository boundary.
- Adds DB enforcement for protected fields.
- Avoids `security definer` RPC risk for the first MVP.
- Lets admin status updates remain in existing admin repository flow.

Disadvantages:

- Still requires manual RLS tests for owner, non-owner, anon, and admin paths.
- If admin status editing and owner content editing conflict through the shared `authenticated` role, RPC may still be needed later.

Assessment: recommended MVP strategy.

## Recommended DB/RLS Direction

Use Option E for 20H:

1. Repository payload whitelist in 20I.
2. Column-level update grants that exclude observer fields, image fields, `image_url`, `created_at`, and `updated_at`.
3. Owner update RLS guarded by `observer_id = auth.uid()` and `status = 'approved'`.
4. Admin update RLS continues to rely on `public.is_admin()`.
5. A protected-field trigger rejects:
   - image field changes
   - observer field changes
   - `created_at` changes
   - non-admin `status` changes
   - non-owner updates
6. Public select remains `status = 'approved'`.
7. No owner read policy for pending/rejected rows is added in this phase.

This keeps owner edit narrow while preserving the hidden admin review/update boundary.

## SQL Draft

Draft file:

- `docs/architecture/sql-drafts/0004_owner_admin_observation_edit_draft.sql`

The draft is not an apply-ready migration and must not be run without a separate 20H.5 apply-readiness review.

The draft includes:

- reuse of the existing `updated_at` trigger from 0001
- `UPDATE` grant tightening for authenticated users
- owner update policy candidate
- admin update policy preservation candidate
- trigger-based protected-field guard candidate
- admin-only status change guard
- image/observer field change guard
- rollback notes

No `supabase/migrations/0004...` file is created in 20H.

## Legacy Rows

Existing rows with `observer_id is null`:

- are not owner-editable
- remain public if `status = 'approved'`
- keep existing safe observer display fallback behavior
- can be edited by admins only if admin RLS/grants allow the chosen fields
- are not backfilled in 20H

Ownership backfill is out of scope and should require a separate approved phase because it changes authorization semantics.

## Repository Implementation Plan

20I should add repository update contracts without changing UI first.

Candidate owner input type:

```ts
export interface UpdateObservationInput {
  name: string;
  scientificName?: string;
  taxon: Taxon;
  location: string;
  date: string;
  description?: string;
  coords: Coordinates;
}
```

Candidate repository methods:

```ts
updateObservation(id: string, input: UpdateObservationInput): Promise<Observation>;
```

Admin repository can either reuse the content input or define a separate admin input:

```ts
updateObservationAsAdmin(id: string, input: UpdateObservationInput): Promise<Observation>;
updateObservationStatusAsAdmin(id: string, status: AdminObservationStatusUpdate): Promise<Observation>;
```

20I implementation requirements:

- UI components must not call Supabase directly.
- Supabase repository payload must include only allowed content/location fields.
- Owner update payload must exclude `status`, observer fields, image fields, `image_url`, `created_at`, and `updated_at`.
- Admin content update payload should use a separate admin repository path.
- Existing approve/reject methods should remain until a later refactor is explicitly approved.
- Mock repository should either return an updated in-memory copy for the current session or clearly document non-persistence.
- After update, refresh through repository reads so signed image URLs stay runtime-only.

## UI Implementation Plan

20J should add edit affordances only after 20I repository behavior is accepted.

Recommended UI direction:

- Add an edit action inside the detail modal, not on cards.
- Show owner edit only when current auth user matches the observation owner.
- Show admin edit first inside hidden `/#admin`, not in public Navbar.
- Hide edit affordance from anonymous users and non-owners.
- Use a compact edit modal or detail-modal inline edit.
- Do not reuse the upload page wholesale if it risks image replacement or submit-flow confusion.
- Korean copy should stay calm and operational, for example:
  - edit
  - save changes
  - cancel
  - changes saved
  - changes could not be saved
- Mobile layout must keep action buttons visible and avoid modal overflow.

Because the current public domain model does not expose `observer_id`, 20I/20J must decide whether to add an internal `observerId?: string` field or a repository-provided `canEdit`/permission field. The value must never be shown as public UI copy.

## Verification Plan

Minimum 20K verification:

- owner can update allowed content fields
- owner cannot update `status`
- owner cannot update `observer_id`
- owner cannot update `observer_display_name`
- owner cannot update `image_path`
- owner cannot update `image_mime_type`
- owner cannot update `image_size_bytes`
- owner cannot update `image_url`
- owner cannot edit another user's row
- owner cannot edit legacy rows where `observer_id is null`
- anonymous users cannot edit
- authenticated non-owners cannot edit
- admin can edit allowed content fields
- admin can update status through admin path
- admin approve/reject still works for legacy pending rows
- updated approved row remains visible in public list/detail
- pending/rejected rows remain hidden from public list/detail
- signed/public/blob/data URLs are not stored in the DB
- no email/token/key/password appears in UI or logs
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Rollout Sequence

1. 20H: DB/RLS plan and SQL draft only.
2. 20H.5: SQL draft apply-readiness review.
3. 20I: repository update methods and mapper/type changes.
4. 20J: edit UI implementation.
5. 20K: owner/admin edit smoke and regression.
6. 20L: optional image replacement design, only if separately needed.

## Explicit Non-Scope

20H does not include:

- actual Supabase SQL application
- apply-ready `supabase/migrations/0004...` migration
- edit UI implementation
- repository update implementation
- image replacement
- Storage object delete/update
- audit log
- reject note
- bulk approval
- user management
- package changes
- new dependencies
- admin route exposure in `Navbar`
- public exposure of pending/rejected observations

## Remaining Decisions Before 20H.5/20I

- Confirm whether the trigger-guard approach is accepted, or whether owner edit should use an RPC from the start.
- Decide whether admin status updates can continue through direct table update with trigger/RLS guards.
- Decide whether the domain model should expose internal `observerId` or use repository-level permission metadata for edit buttons.
- Decide mock repository update behavior for local UX testing.
- Decide whether 20H.5 should promote the SQL draft to `supabase/migrations/0004_owner_admin_observation_edit.sql`.
