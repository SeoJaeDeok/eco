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

The reviewed draft SQL file is:

```text
docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql
```

The 20E-prep apply-ready migration candidate is:

```text
supabase/migrations/0003_public_user_contribution.sql
```

Neither file has been applied to Supabase by Codex. The migration candidate must be explicitly approved for a manual apply/test window before any Supabase project applies it.

20C.5 review update:

- The SQL draft was moved out of `supabase/migrations/` and into `docs/architecture/sql-drafts/`.
- Reason: Supabase migration tooling can apply `.sql` files in `supabase/migrations/` regardless of draft warning comments.
- The draft was not promoted during 20C.5.

20E-prep update:

- The reviewed draft was promoted to `supabase/migrations/0003_public_user_contribution.sql` as an apply-ready migration candidate.
- The migration has not been applied to Supabase.
- Do not run migration tooling or paste this SQL into Supabase SQL Editor until the manual checklist below is approved and the 20E repository create changes are ready to test in the same window.

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

## 20C.5 Application Readiness Review

Status after 20C.5: not apply-ready as an automatic migration.

The SQL draft is close to an apply candidate, but it should not be applied while the app still uses the anonymous upload/create UI and existing Supabase create flow.

### Placement Decision

Decision: keep the draft outside `supabase/migrations/` until it is approved for application.

Reasons:

- The draft revokes and re-grants table permissions.
- The draft drops the existing anonymous pending insert policy.
- The draft adds authenticated direct approved insert.
- The draft changes Storage upload policy candidates.
- Supabase CLI or other migration tooling can execute files in `supabase/migrations/` even if the file comments say "draft only".

Recommended placement:

```text
docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql
```

Promotion rule:

- Keep the historical draft in `docs/architecture/sql-drafts/` for review history.
- Use `supabase/migrations/0003_public_user_contribution.sql` as the apply-ready migration candidate created during 20E-prep.
- Do not apply that migration until 20E repository create changes are ready and the user explicitly approves applying DB/RLS changes.
- Re-run the safety checklist before applying.

## 20E-prep Apply-Ready Migration Candidate

20E-prep created:

```text
supabase/migrations/0003_public_user_contribution.sql
```

The file is an apply-ready candidate, not an applied change. Codex did not apply it to Supabase.

Promotion rationale:

- 20D login UI and signed-out upload gate are implemented.
- 20E needs the DB columns and RLS policies before authenticated direct approved create can pass.
- Keeping an apply-ready migration in `supabase/migrations/` gives the next implementation session a concrete reviewed SQL target.

Apply timing:

- Apply only in an explicitly approved DB/RLS apply/test window.
- Apply together with 20E repository create changes, not as a standalone production change.
- Do not apply before the real login/logout smoke from 20D.5 is accepted.
- Do not apply if contributor account provisioning and `observer_display_name` snapshot policy are still unresolved for the target environment.

Important consequence:

- This migration removes the anonymous pending insert policy and replaces it with authenticated own approved insert.
- If applied before 20E code is ready, signed-in upload submit can fail because the current repository create path still uses the older pending-create behavior.

### Confirmed DB/RLS Decisions

- `profiles.display_name` remains nullable.
- `observations.observer_id` remains nullable for existing rows.
- `observer_id` references `public.profiles(id)` with `on delete set null`.
- `observations.observer_display_name` is a nullable public display snapshot candidate.
- Existing `updated_at` triggers from 0001 remain sufficient.
- Existing rows should not be backfilled from email or admin accounts.
- Public anon/authenticated reads remain approved-only.
- Authenticated own non-approved read is not included in the MVP.
- Authenticated direct approved insert requires `observer_id = auth.uid()`.
- Owner update is limited by policy and grants to content/location metadata, with repository narrowing still required later.
- Status changes remain admin-only in product design.
- Admin all-read/all-update remains based on `public.is_admin()`.
- Email public display remains prohibited.
- Image replacement remains out of scope.

### Open Decisions Before Apply

- Confirm contributor accounts are invite/admin-created for MVP.
- Confirm the `observer_display_name` snapshot approach.
- Confirm whether 20D needs display-name setup or fallback-only behavior.
- Confirm whether authenticated Storage upload paths switch to `observations/{auth.uid()}/...`.
- Confirm whether owner/admin edit should use table update policies only or a later RPC for stricter field/status separation.
- Confirm whether a "my observations" view needs owner read for non-approved rows.

### Rollout Sequence

Recommended sequence:

1. Keep the current live DB/RLS unchanged until a user-approved apply/test window.
2. Finish the 20D.5 login/logout smoke retry with a configured non-admin test account.
3. Confirm contributor account provisioning and display-name fallback policy for the target environment.
4. Prepare 20E repository create changes to set `observer_id`, optional `observer_display_name`, and `status = 'approved'`.
5. Apply `supabase/migrations/0003_public_user_contribution.sql` in dev/local Supabase first.
6. Immediately smoke the 20E create path after the migration applies.
7. Disable anonymous pending insert as part of that coordinated apply/test window.
8. Implement observer display after the data columns are available.
9. Defer owner/admin edit until the create/display flow has passed regression verification.

### Manual Apply Checklist

Before applying:

- Confirm target project/environment in Supabase Dashboard.
- Confirm no `.env.local` or secret values are copied into docs or SQL comments.
- Export or snapshot current `public.profiles` and `public.observations` metadata as appropriate for the environment.
- Record current observation status counts.
- Record current pending/rejected public visibility checks.
- Confirm 20D.5 real login/logout smoke has passed with a configured non-admin test account.
- Confirm 20E repository create changes are ready for immediate smoke testing.
- Confirm contributor account provisioning policy.
- Confirm `observer_display_name` snapshot policy.
- Confirm whether authenticated Storage uploads switch to `observations/{auth.uid()}/...` at the same time.
- Confirm rollback owner.

Manual SQL Editor apply:

1. Use `supabase/migrations/0003_public_user_contribution.sql` as the reviewed migration source, or paste that exact reviewed SQL into Supabase SQL Editor.
2. Apply first in a local/dev Supabase project.
3. Verify new columns on `public.profiles` and `public.observations`.
4. Verify RLS is still enabled on both tables.
5. Verify policy list includes approved-only public select, authenticated own approved insert, owner update, and admin read/update.
6. Verify Storage upload policy changes only if the app upload path has also changed.
7. Run the 20E authenticated create smoke immediately after dev apply.
8. Repeat in production only after dev checks pass.

Post-apply verification:

- Anonymous approved read succeeds.
- Anonymous pending/rejected read returns no rows.
- Anonymous insert is denied after the transition.
- Authenticated own approved insert succeeds with `observer_id = auth.uid()`.
- Authenticated insert with mismatched `observer_id` is denied.
- Authenticated insert with non-approved status is denied.
- Authenticated owner update of allowed content fields succeeds.
- Authenticated owner update that changes status is denied.
- Authenticated non-owner update is denied.
- Admin can still read all observations.
- Admin can still approve/reject legacy pending rows.
- New DB rows keep `image_url` null for Storage-backed images.
- No public UI exposes email addresses.

Rollback checklist:

- Do not drop columns until attribution loss is accepted.
- Restore anonymous pending insert only if product policy explicitly chooses it.
- Restore previous grants/policies only after confirming public read remains approved-only.
- Re-run pending/rejected public invisibility checks after rollback.

## 20D/20E/20F Implementation Sequence

### 20D: Public Login UI And Auth State

Status: implemented in phase 20D.

- Extended the auth boundary with a provider/fallback and `displayName?: string` profile shape.
- Added public login/logout UI without exposing the admin route.
- Added signed-out upload guidance.
- Kept direct approved create disabled until RLS and repository changes are ready.

### 20E: Authenticated Direct Create

Status: implemented in app/repository code.

- Supabase create mapping sets `observer_id`, optional safe `observer_display_name`, and `status = 'approved'`.
- Storage upload uses the owner path `observations/{auth.uid()}/...`, matching the 0003 Storage policy candidate.
- Anonymous users remain blocked before submit by the 20D upload gate.
- Codex did not apply SQL/RLS during 20E; the implementation assumes the operator-applied 0003 migration is active in the target Supabase environment.
- 20E.6 user-reported schema check confirmed `profiles.display_name`, `observations.observer_id`, and `observations.observer_display_name` are present.
- 20E.6 user-reported admin-authenticated smoke confirmed login, signed-out gate, logged-in form access, approved row creation, `observer_id`, safe non-email `observer_display_name`, image metadata, no URL-like `image_url`, public list display, pending/rejected public invisibility, logout gate return, and no console/log secret exposure.
- 20F.5 user-reported non-admin contributor smoke documented a `role = 'user'` account with a profile row, `display_name`, and normal upload/create operation. Field-by-field DB checks for that non-admin row were not itemized in the prompt, so launch readiness can still recheck `status`, `observer_id`, safe `observer_display_name`, image metadata, and URL-like `image_url` if needed.

### 20F: Observer Display

Status: implemented in app/UI code.

- `Observation` has optional `observerDisplayName`.
- Supabase mappers map `observer_display_name` from approved rows after safe normalization.
- Public list cards and detail modal show observer display.
- Rows without observer display data fall back to `등록 관찰자`.
- Email-like observer display values are not shown publicly.
- No RLS/policy/migration change was made in 20F.

20F.5 documentation result:

- Observer display regression was checked at code/static level.
- The shared helper rejects empty and email-like observer display values.
- Supabase public reads still filter `status = 'approved'`.
- Owner/admin edit remains unimplemented and belongs to 20G/20H.

### Later Edit Phases

- 20G: owner/admin edit design finalization, completed in `docs/architecture/owner-admin-observation-edit-design.md`.
- 20H: owner/admin edit DB/RLS implementation plan or migration candidate.
- 20I: repository update methods.
- 20J: edit UI implementation.
- 20K: full regression verification.

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

## Remaining Decisions Before 20I

- Decide whether owner updates can be protected safely with column grants plus RLS, or whether an owner-update RPC is required.
- Decide whether the current 0003 `status` update grant needs to be split before owner edit ships.
- Decide whether admin content edit starts only in hidden `/#admin` or also appears in public detail for signed-in admins later.
- Decide whether launch readiness needs field-by-field confirmation for the 20F.5 non-admin contributor row before edit implementation.
- Decide whether a "my observations" view is needed before owner edit.
- Keep `observer_display_name` snapshot editing, image replacement, and ownership transfer out of the first edit MVP unless separately approved.

## 20H Owner/Admin Edit RLS Plan Link

Phase 20H moved the owner/admin edit RLS discussion into:

- `docs/architecture/owner-admin-observation-edit-rls-plan.md`
- `docs/architecture/sql-drafts/0004_owner_admin_observation_edit_draft.sql`

The 20H recommendation is a hybrid field-protection model: repository payload whitelist plus column-level update grants, owner/admin RLS, and a protected-field trigger. The 20H draft stayed in `docs/architecture/sql-drafts/` until the 20H.5 apply-readiness review.

20H.5 result:

- The hybrid strategy was accepted as the initial apply-ready direction.
- `supabase/migrations/0004_owner_admin_observation_edit.sql` was added as an apply-ready migration candidate.
- The SQL was not applied to Supabase by Codex.
- RPC remains a fallback if the trigger/RLS/grant model is not sufficient after manual apply/smoke testing.

Remaining before 20I:

- Manually apply and verify `supabase/migrations/0004_owner_admin_observation_edit.sql` in dev/local Supabase after approval.
- Decide whether edit permission data is exposed as internal `observerId` or repository-level `canEdit` metadata.
