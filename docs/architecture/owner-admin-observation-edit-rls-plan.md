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

- Edit UI started in 20J after repository update methods were accepted.
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

## 20H.5 Apply-Readiness Review

Status: completed.

20H.5 reviewed the 0004 draft and accepted the hybrid field-protection strategy as the apply-ready candidate for dev/local manual testing:

- repository payload whitelist
- column-level `UPDATE` grants
- owner update RLS
- admin update RLS using `public.is_admin()`
- protected-field trigger guard
- RPC kept as a fallback, not the first implementation path

The reviewed apply-ready migration candidate is:

- `supabase/migrations/0004_owner_admin_observation_edit.sql`

Codex did not apply this SQL to Supabase.

### Trigger/RPC/Column-Grant Decision

Decision: use the hybrid trigger/RLS/grant model first.

Rationale:

- Repository whitelist alone is not enough because clients can bypass UI code.
- Column grants prevent writes to observer/image fields but cannot distinguish owner/admin app roles because Supabase uses the shared `authenticated` database role.
- RLS provides row-level owner/admin boundaries.
- The trigger provides old/new field invariants for status, observer fields, image fields, `image_url`, and `created_at`.
- RPC is more restrictive but introduces a new function API and potential `security definer` review burden; keep it as fallback if 20K smoke shows the hybrid model is too hard to validate.

### Apply-Ready Migration Notes

The apply-ready candidate differs from the draft in these ways:

- It lives in `supabase/migrations/0004_owner_admin_observation_edit.sql`.
- Its header says manual apply is required and this session did not apply it.
- It keeps rollback notes out of the migration body and leaves rollback as a separately reviewed operation.
- It revokes direct execution on `public.guard_observation_edit_fields()` from `public`; the function is intended to run as a trigger, not as a frontend-callable function.

## 20H.6 Manual Dev/Local Apply Result

Status: documented from user-reported manual checks.

Environment:

- dev/local Supabase: 0004 was manually applied by the user.
- production Supabase: not applied.
- Codex did not run or apply SQL in this phase.
- Apply errors: none reported.
- Rollback needed: no.
- Unexpected behavior from the provided screenshots/checks: none reported.

Schema/function result:

- `observations.updated_at` is present.
- `observations.updated_at` data type is `timestamp with time zone`.
- `observations.updated_at` is `not null`.
- Protected-field function is present.
  - Observed function name: `guard_observation_edit_fields`.
- `updated_at` function is present.
  - Observed function name: `set_updated_at`.
- Protected-field trigger presence was not checked in the provided screenshot set.
- `updated_at` trigger presence was not checked in the provided screenshot set.

Policy result:

- Public approved-only select policy retained: pass.
- Owner update policy present: yes.
- Owner update `observer_id = auth.uid()` guard present: yes.
- Owner update `status = 'approved'` guard present: yes.
- Admin update policy remains `public.is_admin()` based: yes.
- Admin read policy remains `public.is_admin()` based: yes.
- Admin delete policy remains `public.is_admin()` based: yes.
- Authenticated own approved insert policy remains present: yes.
- Pending/rejected public exposure policy added: no visible policy found from the provided policy result.
- Status/image/observer protected-field behavior is not yet proven by update attempts; the function exists, but repository/UI update flows are not implemented yet.

Public visibility note:

- Total DB row status counts reported from the screenshot set:
  - approved: 13
  - pending: 3
  - rejected: 2
- These are total DB row counts, not a public visibility verification.
- Pending visible in public UI/query: not checked in this 20H.6 screenshot set.
- Rejected visible in public UI/query: not checked in this 20H.6 screenshot set.

Test account readiness:

- Owner A ready: yes, using the existing non-admin general account created earlier.
- Owner A has an approved row: yes, based on the earlier 20E non-admin create smoke.
- Non-owner B ready: not checked / not yet prepared unless later confirmed.
- Admin ready: yes, using the existing hidden-admin account.

Trigger verification TODO:

The following read-only query should be run by the user in Supabase SQL Editor before treating trigger presence as verified:

```sql
select
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'observations'
order by trigger_name;
```

Expected trigger names include the protected-field guard trigger and the `updated_at` trigger for `public.observations`.

Remaining apply validation:

- Actual owner allowed-field update has not been tested.
- Actual owner protected-field update denial has not been tested.
- Actual non-owner update denial has not been tested.
- Actual anonymous update denial has not been tested.
- Actual admin update has not been tested.
- Full public pending/rejected invisibility was not rerun in this 20H.6 screenshot set.
- 20I repository update methods and 20J edit UI are still required before full owner/admin edit smoke can run through the app.

## 20H.7 Trigger And Public Visibility Confirmation

Status: PARTIAL, with pending visibility still requiring clarification.

Codex did not run SQL or apply additional RLS changes in 20H.7. This section records user-reported checks only.

Trigger confirmation:

- Protected-field trigger connected to `public.observations`: yes.
  - Trigger name: `observations_guard_edit_fields`.
  - Event: `UPDATE`.
  - Table: `observations`.
  - Timing: `BEFORE`.
- `updated_at` trigger connected to `public.observations`: yes.
  - Trigger name: `observations_set_updated_at`.
  - Event: `UPDATE`.
  - Table: `observations`.
  - Timing: `BEFORE`.

Public visibility confirmation:

- Public approved list loads: pass.
- Pending visible in public list/detail: reported `yes`.
- Rejected visible in public list/detail: corrected to `no`.
- Console/log secret exposure: pass.

Interpretation:

- The trigger connection check passed.
- The rejected visibility correction satisfies the rejected-row public visibility check.
- The pending visibility report still needs clarification because pending rows may exist in the database but must not be visible in public list/detail UI or public repository reads.
- Because pending was reported as visible in public list/detail and was not corrected in the 20I prompt, 20H.7 public visibility remains PARTIAL, not PASS.

Remaining validation:

- Recheck whether pending `yes` means "check performed" or "actually visible".
- If pending rows are actually visible, run a focused public visibility investigation before edit UI implementation.
- Confirm the public repository still queries only `status = 'approved'`.
- Confirm no public detail path can load pending rows by id.
- Actual owner allowed-field update has not been tested.
- Actual owner protected-field update denial has not been tested.
- Actual non-owner update denial has not been tested.
- Actual anonymous update denial has not been tested.
- Actual admin update has not been tested.

## Manual Apply Checklist

Apply only in a dev/local Supabase project first.

Before applying:

- Prepare owner A as a non-admin authenticated user.
- Prepare non-owner B as a non-admin authenticated user.
- Prepare an admin authenticated user.
- Confirm owner A has an approved row created through the 20E path.
- Record current observation status counts.
- Confirm public approved-only baseline.
- Confirm pending visible count is 0 for public reads.
- Confirm rejected visible count is 0 for public reads.
- Confirm there are no unexpected non-null or URL-like `image_url` values that would block admin updates under the `image_url is null` guard.
- Confirm no `supabase/migrations/0004...` has already been applied in the target environment.

After applying:

- Confirm policy list includes public approved-only select, owner update, and admin update.
- Confirm trigger `observations_guard_edit_fields` exists.
- Confirm function `public.guard_observation_edit_fields()` exists.
- Owner A can update allowed fields on their approved row.
- Owner A cannot update `status`.
- Owner A cannot update `image_path`.
- Owner A cannot update `image_mime_type`.
- Owner A cannot update `image_size_bytes`.
- Owner A cannot update `image_url`.
- Owner A cannot update `observer_id`.
- Owner A cannot update `observer_display_name`.
- Non-owner B cannot update owner A's row.
- Anonymous users cannot update observations.
- Admin can update allowed content fields.
- Admin can update `status` through the admin path.
- Updated approved row remains approved and visible in public list/detail.
- Pending/rejected observations remain hidden from public list/detail.
- No email, token, key, or password appears in UI or console logs.

Rollback considerations:

- Do not run ad hoc rollback during the 20H.5 review.
- If rollback is needed after a future manual apply, draft a separate reviewed rollback migration.
- At minimum rollback review must cover dropping `observations_guard_edit_fields`, dropping `public.guard_observation_edit_fields()`, restoring previous grants/policies, and re-running public visibility checks.

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

## 20I Repository Update Method Result

Status: implemented.

Repository contract changes:

- Added `OwnerObservationUpdateInput` with only content/location fields:
  - `name`
  - `scientificName`
  - `taxon`
  - `location`
  - `date`
  - `description`
  - `coords`
- Added `AdminObservationUpdateInput` as the admin content-update contract using the same allowed field shape.
- Added `ObservationRepository.updateOwnObservation(id, input)`.
- Added `AdminObservationRepository.updateObservationAsAdmin(id, input)`.

Supabase public repository behavior:

- `updateOwnObservation` requires a signed-in Supabase user.
- The update payload is created through a whitelist mapper.
- The owner update payload includes only:
  - `name`
  - `scientific_name`
  - `taxon`
  - `location`
  - `observed_date`
  - `description`
  - `latitude`
  - `longitude`
- The owner update query keeps `status = 'approved'` and `observer_id = current auth user` as row filters.
- The method returns the updated row mapped through the existing signed-image runtime mapping path.
- Public list/detail reads still filter `status = 'approved'`.

Supabase admin repository behavior:

- `updateObservationAsAdmin` uses the same content-only whitelist mapper.
- Existing `approveObservation` and `rejectObservation` remain the status-specific admin methods.
- Admin content update does not include status, image, observer, `image_url`, `created_at`, or `updated_at` fields.

Mock repository behavior:

- `updateOwnObservation` is implemented with an in-memory overlay.
- `sampleObservations` is not mutated.
- Mock updates persist only for the current app session.

Protected fields excluded from 20I update inputs and payloads:

- `status`
- `observer_id`
- `observer_display_name`
- `image_url`
- `image_path`
- `image_mime_type`
- `image_size_bytes`
- `created_at`
- `updated_at`

Not implemented in 20I:

- edit buttons
- edit form UI
- image replacement
- owner/admin live update smoke
- additional Supabase SQL/RLS

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

Because the current public domain model does not expose `observer_id`, 20J must decide whether to add internal permission metadata such as `canEdit` or a non-rendered owner identifier. The value must never be shown as public UI copy.

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
2. 20H.5: SQL draft apply-readiness review and apply-ready migration candidate.
3. 20H.6: manual dev/local apply result documentation.
4. 20H.7: trigger confirmation and public visibility check documentation.
5. Recheck/fix public pending/rejected visibility if the reported `yes` means the rows were actually visible.
6. 20I: repository update methods and mapper/type changes.
7. 20J: edit UI implementation.
8. 20K: owner/admin edit smoke and regression, including pending/rejected public invisibility.
9. 20L: optional image replacement design, only if separately needed.

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

## Remaining Decisions Before 20K

- Recheck pending/rejected public invisibility during 20K smoke.
- Owner/non-owner/admin update attempts remain for 20K UI/regression.
- 20J chose internal `observerId` for permission checks only; do not render it as public UI copy.
- Keep RPC as fallback only if repository/update smoke shows the hybrid trigger/RLS/grant model is not sufficient.

## 20J Edit UI Implementation Result

Status: implemented; live owner/non-owner/admin smoke remains for 20K.

20J chose the pragmatic internal-owner-id approach:

- `Observation.observerId` is mapped from `observer_id`.
- `observerId` is used only for permission checks.
- `observerId` is not rendered as public UI copy.

Edit affordance and update paths:

- Public detail modal shows edit only for the signed-in owner or signed-in admin.
- Owner update calls `ObservationRepository.updateOwnObservation`.
- Admin update calls `AdminObservationRepository.updateObservationAsAdmin`.
- The admin update path is reached through a lazy repository provider and does not expose Supabase client calls in UI components.

Field-level UI boundary:

- The edit form exposes only `name`, `scientificName`, `taxon`, `location`, `date`, `description`, and `coords`.
- The edit form does not expose `status`, observer fields, image fields, `image_url`, or timestamp fields.
- Image replacement remains out of scope.

20K verification must still prove:

- owner allowed-field update works
- owner protected-field update remains impossible through UI/payload
- non-owner and anonymous users cannot edit
- admin content update works
- pending/rejected rows remain hidden from public list/detail
- no signed/public/blob/data URL is stored by update paths

## 20K Smoke/Regression Preflight

Status: PARTIAL.

20K static/build preflight completed:

- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed, with line-ending warnings only.
- Local root HTTP check returned 200 at `http://localhost:3000/`.
- Static edit UI check found no protected fields in the detail edit form/header path.
- Static mapper check confirmed owner/admin content update payloads exclude `status`, observer fields, image fields, `image_url`, `created_at`, and `updated_at`.
- Static UI boundary check found no Supabase client calls from `src/components` or `src/App.tsx`.
- Static Navbar check found no admin route exposure.
- Package files and Supabase migrations were not changed.

20K live checks remain pending because Codex did not have login credentials and in-app browser automation was unavailable:

- owner A allowed-field edit
- owner A DB row invariant checks after save
- non-owner B edit affordance/update denial
- anonymous no-edit affordance in a browser
- admin content edit
- malicious protected-field update attempts
- public pending/rejected invisibility through the live UI/query
- console/log secret check during browser interaction

Precondition state for the remaining live smoke:

- owner A ordinary account ready: yes, user-reported.
- owner A approved row: yes, user-reported.
- non-owner B ordinary account ready: not confirmed.
- admin account ready: yes, user-reported.
- 0004 dev/local apply: yes, user-reported.
- production apply: no.
