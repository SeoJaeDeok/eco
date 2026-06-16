# Public User Contribution DB/RLS Plan

## Purpose And Scope

This document records the phase 20C DB/RLS migration draft for public user login, direct contribution, observer display, and owner/admin edit support.

20C is a design and draft phase:

- no SQL was applied to Supabase
- no RLS or policy was changed in a live project
- no app code was implemented
- no package files were changed
- no Storage object was deleted
- no Kakao Map, Auth UI, admin UI, or repository behavior was changed

The companion SQL file is a candidate only:

```text
supabase/migrations/0003_public_user_contribution_draft.sql
```

It must be reviewed and explicitly approved before any Supabase project applies it.

## 20B Design Conclusion Summary

Phase 20B recommended a conservative MVP:

- Public users are Supabase Auth users with `profiles.role = 'user'`.
- Initial contributor account creation is handled outside the public frontend.
- Login uses the existing Supabase email/password path behind `AuthRepository`.
- Anonymous users can browse public approved observations but cannot submit.
- Authenticated contributors may create approved observations directly after reviewed DB/RLS work.
- `profiles.display_name` is used as the source for observer display.
- Email addresses are never shown publicly.
- `observations.observer_id` is the owner authorization field.
- Owner/admin edit starts with text and metadata fields only.
- Image replacement, audit log, reject note, and account management remain out of scope.
- The hidden `/#admin` route remains hidden from `Navbar`.

## DB Column Proposal

### `public.profiles.display_name`

Recommendation:

- Add `display_name text null`.
- Keep it optional for MVP to avoid blocking existing admin/user profiles.
- Add a non-blank check when the value is present.
- Do not show email addresses as public fallback.
- Use a UI fallback label equivalent to "registered observer" when no display name exists.

Rationale:

- Existing profiles only have `id`, `role`, `created_at`, and `updated_at`.
- Adding a nullable field is backward-compatible with existing admin profiles.
- A nullable field allows 20D login UI and 20F observer display to ship without requiring a profile-edit UI first.

### `public.observations.observer_id`

Recommendation:

- Add `observer_id uuid null`.
- Reference `public.profiles(id)` with `on delete set null`.
- Treat the value as internal authorization state, not public UI copy.
- Keep it nullable so existing approved/mock/imported rows remain valid.

Why reference `public.profiles(id)` instead of `auth.users(id)`:

- The app already treats `profiles` as the local authorization and role table.
- A profile reference ensures direct contributors have a profile row.
- `profiles.id` already references `auth.users(id)`, so IDs still align with `auth.uid()`.
- `on delete set null` preserves historical observations if an account/profile is removed.

### `public.observations.observer_display_name`

Recommendation:

- Add `observer_display_name text null` as an optional snapshot.
- Keep it nullable.
- Add a non-blank check when present.
- Allow public approved reads to display this value from the observation row without exposing profile rows or email addresses.

Rationale:

- Public anonymous users need to see observer labels on approved rows.
- Exposing `profiles` publicly is broader than needed.
- A snapshot prevents public UI from needing public profile reads.

Guard:

- Authenticated insert should require `observer_display_name` to be either null or equal to the current user's `profiles.display_name`.
- Owner update should not include `observer_display_name` as an editable field in the MVP.

### `updated_at`

No new update trigger is needed in 20C because `0001_create_observation_schema.sql` already defines `public.set_updated_at()` and attaches it to `public.profiles` and `public.observations`.

## RLS Policy Proposal

### Public Read

Keep public list/detail approved-only:

- `anon` can select only rows where `status = 'approved'`.
- `authenticated` can select only rows where `status = 'approved'`.
- Admin all-read remains separate through `public.is_admin()`.

Recommendation:

- Do not add owner reads for non-approved rows in the first direct-approved MVP.
- Add a separate "my observations" policy later only if a future owner dashboard needs to show owner pending/rejected rows.

### Authenticated Direct Approved Insert

Recommended MVP:

- Allow authenticated users to insert approved observations only when:
  - `observer_id = auth.uid()`
  - `status = 'approved'`
  - `image_url is null`
  - `observer_display_name` is null or matches the user's profile display name
  - Storage image fields remain path/metadata only

This follows the 20B decision only if accounts are invite/admin-created or otherwise trusted enough for direct approved contribution.

If open self-sign-up is enabled later, add a contributor role or abuse gate before allowing direct approved insert for all authenticated users.

### Anonymous Pending Insert

Target recommendation:

- Disable anonymous observation insert when the login-required upload UI is ready.
- Do not apply this before 20D/20E, because the current app still has an anonymous upload screen.

Transition recommendation:

1. Draft policy/grant changes in 20C.
2. Implement public login and anonymous upload gate in 20D.
3. Implement authenticated direct approved create in 20E.
4. Apply the RLS/grant migration only after UI and repository behavior are ready.
5. Verify anonymous users can still read approved rows but cannot create rows.

### Owner Update

Recommended owner update policy:

- Authenticated owners may update their own approved observations.
- Ownership is `observer_id = auth.uid()`.
- Editable fields are limited through column grants and repository input shape.
- Status change remains admin-only in product design.
- Owner update must not allow:
  - ownership transfer
  - `image_url` writes
  - image replacement
  - Storage metadata edits
  - direct pending/rejected visibility changes

Because PostgreSQL RLS cannot compare every old/new column as cleanly as application validation can, 20C should combine:

- column-level update grants
- RLS owner guards
- repository-level update payload narrowing in 20H

### Admin Read/Update

Admin policies remain based on:

```text
public.is_admin()
```

Admin all-read and status update behavior must remain intact for the hidden admin review UI.

Admin update can share the same table-level grant as owner update, but admin RLS must remain separate and explicit.

## Role Matrix

| Capability | anon | authenticated owner | authenticated non-owner | admin |
| --- | --- | --- | --- | --- |
| Read approved public rows | yes | yes | yes | yes |
| Read pending/rejected public rows | no | no in MVP | no | yes |
| Insert anonymous pending row | no after transition | n/a | n/a | n/a |
| Insert own approved row | no | yes | yes for own row only | yes, through admin/owner-safe paths |
| Update own content fields | no | yes | no | yes |
| Update status | no | no | no | yes |
| Update `observer_id` | no | no | no | not by default workflow |
| Update `image_url` | no | no | no | no MVP workflow |
| Replace image | no | no | no | no MVP workflow |
| Read hidden admin route data | no | no | no | yes |

Notes:

- "authenticated non-owner" can create its own row, but cannot update another user's row.
- Admin may be an owner too, but admin powers must still rely on `public.is_admin()`.

## Authenticated Direct Approved Insert Risk Analysis

Benefits:

- Matches the desired logged-in contributor workflow.
- Avoids admin queue overhead for trusted contributors.
- Lets observations appear immediately in public list/map/detail after repository refresh.

Risks:

- Any compromised or low-quality contributor account can publish public data immediately.
- If self-sign-up is opened, spam can become public without review.
- Direct approved image upload can increase Storage cost if abused.
- Owner edit can become a data-integrity risk if update fields are too broad.

Current mitigations that still apply:

- Private Storage bucket.
- Runtime signed URLs only.
- DB stores object paths and metadata, not signed/public/blob/data URLs.
- 5 MB image size limit and MIME restrictions.
- 18B monitoring checklist.
- 18D abuse thresholds and escalation workflow.

Required 20E/20I checks:

- Anonymous insert denied after transition.
- Authenticated insert requires `observer_id = auth.uid()`.
- Inserted rows have `status = 'approved'`.
- Pending/rejected public reads still return no public rows.
- `image_url` remains null for new Supabase rows.
- `observer_display_name` never contains an email value.

## Anonymous Pending Insert Transition Plan

Current state:

- Anonymous/public create inserts pending observations.
- Anonymous Storage upload has been used for the phase 16 MVP public-report flow.

Target state for public user contribution:

- Anonymous users can browse approved observations.
- Anonymous users cannot submit.
- Authenticated users submit approved observations.

Recommended transition:

1. Keep current live policies unchanged until login UI and repository changes are ready.
2. Use the 20C SQL draft as the final target policy set, not an immediate apply script.
3. In 20D, add login/logout UI and signed-out upload guidance.
4. In 20E, update repository create behavior for authenticated approved insert.
5. Apply the reviewed DB/RLS migration after 20D/20E are ready together.
6. Run regression:
   - anonymous approved read works
   - anonymous insert fails
   - authenticated approved insert works
   - pending/rejected public read fails
   - admin pending/all review still works for legacy pending rows

## Owner/Admin Edit Field Matrix

| Field | Owner edit MVP | Admin edit MVP | Notes |
| --- | --- | --- | --- |
| `name` | yes | yes | Common/title name. |
| `scientific_name` | yes | yes | Optional but non-blank when present. |
| `taxon` | yes | yes | Must keep existing taxon check. |
| `location` | yes | yes | Required non-empty. |
| `observed_date` | yes | yes | Keep date-only model. |
| `description` | yes | yes | Optional but non-blank when present. |
| `latitude` | yes | yes | Existing latitude range check remains. |
| `longitude` | yes | yes | Existing longitude range check remains. |
| `status` | no | yes | Admin review/status only. |
| `observer_id` | no | no by default | Ownership transfer is not an MVP workflow. |
| `observer_display_name` | no | no by default | Snapshot should not be a normal edit field. |
| `image_url` | no | no | Signed/public/blob/data URLs must not be stored. |
| `image_path` | no | no in MVP | Image replacement is out of scope. |
| `image_mime_type` | no | no in MVP | Image replacement is out of scope. |
| `image_size_bytes` | no | no in MVP | Image replacement is out of scope. |

## Existing Data Migration And Backfill Considerations

Existing rows:

- Keep `observer_id` null.
- Keep `observer_display_name` null unless a manual backfill decision is made.
- Display fallback copy in the UI for rows without observer display data.
- Do not infer observers from email, admin accounts, or test notes.

Existing profiles:

- Existing admin profiles get `display_name = null`.
- The UI should use a fallback display label until an admin/user display-name flow exists.

Existing Storage rows:

- Keep `image_path`, `image_mime_type`, and `image_size_bytes` unchanged.
- Keep `image_url` null for Storage-backed rows.
- Do not move or delete Storage objects in 20C.

Existing pending rows:

- Keep admin approve/reject support.
- Do not expose pending rows publicly.
- Decide later whether legacy pending rows remain part of admin workflow after anonymous create is disabled.

## Rollback Considerations

This phase does not apply SQL, so no rollback was executed.

If a future approved migration based on this draft is applied, rollback planning should cover:

- removing or ignoring `display_name`
- removing or ignoring `observer_id`
- removing or ignoring `observer_display_name`
- restoring anonymous pending insert only if product policy chooses it
- restoring previous grants/policies only after verifying public visibility remains approved-only

Rollback caution:

- Dropping owner columns can lose attribution data.
- Re-enabling anonymous insert reopens abuse risk documented in 18D.
- Any rollback must re-run public visibility checks for pending/rejected rows.

## SQL Draft Summary

The companion SQL draft includes:

- nullable `profiles.display_name`
- nullable `observations.observer_id`
- nullable `observations.observer_display_name`
- indexes for observer lookups
- non-blank display-name checks
- approved-only public select policy
- authenticated own approved insert policy candidate
- owner content update policy candidate
- admin read/update policy preservation
- grant changes that remove anonymous insert in the target state
- optional authenticated Storage upload policy candidate for own approved observation images

It intentionally does not:

- apply to Supabase automatically
- use a service role key
- expose pending/rejected rows publicly
- grant public email reads
- store signed/public/blob/data URLs
- implement image replacement
- delete Storage objects

## 20D/20E/20F Implementation Sequence

### 20D: Public Login UI And Auth State

- Extend `AuthRepository`/profile mapping with display name.
- Add public login/logout UI without exposing the admin route.
- Add signed-out upload guidance.
- Keep direct approved create disabled until RLS and repository changes are ready.

### 20E: Authenticated Direct Create

- Apply reviewed DB/RLS migration only after approval.
- Update Supabase create mapping to set `observer_id`, `observer_display_name`, and `status = 'approved'`.
- Update Storage upload path/policy if using `observations/{auth.uid()}/...`.
- Verify anonymous insert denial and authenticated direct approved insert.

### 20F: Observer Display

- Extend `Observation` domain type with optional observer display fields.
- Map `observer_display_name` from Supabase rows.
- Show observer display in list cards and detail modal.
- Keep email hidden and fallback display copy for old rows.

### Later Edit Phases

- 20G: owner/admin edit design finalization.
- 20H: owner/admin edit implementation.
- 20I: full regression verification.

## Explicit Non-Scope

20C does not:

- apply SQL to Supabase
- implement public login UI
- implement public sign-up
- implement direct approved create in app code
- implement observer display in app code
- implement owner/admin edit UI
- add a contributor role to the live database
- expose admin route in `Navbar`
- expose pending/rejected rows publicly
- store signed/public/blob/data URLs in DB
- implement image replacement
- change Storage objects
- implement CAPTCHA/rate-limit
- add dependencies
- change Kakao Map code

## Remaining Decisions Before 20D

- Confirm whether contributor accounts are invite/admin-created for the MVP.
- Decide if `observer_display_name` snapshot is accepted for public display.
- Decide whether the 20D login UI should include a display-name setup flow or use fallback copy.
- Decide whether 20E applies the 0003 draft before or together with repository create changes.
- Decide whether authenticated Storage uploads should use `observations/{auth.uid()}/...` paths or keep the existing pending path during transition.
- Decide whether a "my observations" view is needed before owner edit.
