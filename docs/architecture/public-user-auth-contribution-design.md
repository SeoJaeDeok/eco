# Public User Auth, Direct Contribution, Observer Display, And Owner Edit Design

## Purpose And Scope

This document records the phase 20B design for public user login, direct authenticated contribution, observer display, and owner/admin edit permissions.

20B is design-only:

- no app code implementation
- no Supabase SQL, RLS, policy, or migration application
- no package changes
- no new dependencies
- no change to Storage, Kakao Map, or hidden admin routing

Implementation should start no earlier than 20C, and any database or RLS migration must be reviewed and approved separately before it is applied.

The hidden `/#admin` route stays hidden from `Navbar`. Client-side routing remains a convenience layer only; Supabase Auth and RLS must remain the authority for privileged operations.

## Current Structure Summary

The current app already has separate public and admin repository boundaries:

- Public observation reads go through `ObservationRepository`.
- Admin review actions go through `AdminObservationRepository`.
- Auth/session checks go through `AuthRepository`.
- UI components do not call Supabase directly.

Current auth/admin state:

- Admin sign-in uses Supabase email/password auth through `supabaseAuthRepository`.
- Admin authorization uses `public.profiles.role = 'admin'`.
- The implemented `AuthRepository` can return the current user, profile, full session state, admin status, and password sign-in/sign-out.
- `/#admin` is implemented as a hidden route and is not exposed in `Navbar`.

Current public observation state:

- Public list/detail reads only approved observations.
- Public create currently inserts pending observations.
- Pending and rejected observations remain hidden from public list/detail.
- Supabase mode stores only `image_path`, `image_mime_type`, and `image_size_bytes` for Storage images.
- Signed URLs are generated at runtime through repository/helper code and are not stored in the DB.
- Phase 19 public list filtering/searching is client-side and operates only on observations already returned by the approved-only public repository.

Current Storage state:

- The `observation-images` bucket is private.
- Public/admin image display uses runtime signed URLs.
- Existing Storage operations docs keep rejected/orphan cleanup, anonymous upload abuse controls, and cleanup automation as separately approved operational phases.

## Requirements

20B designs support for these product requirements:

- Logged-in public users can create observations.
- Anonymous users can view home, guide, public observation list, map, and public detail screens.
- Anonymous users cannot submit new observations.
- If an anonymous user enters the upload page, the UI should show a login-required path instead of allowing submit.
- Logged-in users can create observations that bypass admin review and become approved directly.
- Public observation cards and detail views show who observed the record.
- Observation editing is allowed only for the owner and admins.
- Existing admin approve/reject behavior must remain available for pending rows from the legacy or fallback workflow.
- Pending and rejected rows must remain hidden from public list/detail.

## Major Decisions

### A. Sign-Up Policy

#### Option A1: Open Self Sign-Up

Anyone can create an account and immediately contribute.

Pros:

- Lowest participation barrier.
- Matches a public citizen-science style workflow.
- Reduces admin account provisioning work.

Cons:

- Direct approved contribution creates spam and data-quality risk.
- Requires stronger abuse monitoring, rate limits, CAPTCHA, or moderation fallback earlier.
- Needs clear display-name and account-abuse handling.

Fit:

- Good later if abuse controls and moderation capacity are ready.
- Risky as the first direct-approved MVP.

#### Option A2: Invite/Admin-Created Accounts

Admins create or invite contributor accounts outside the public UI.

Pros:

- Lower abuse risk while still supporting non-admin contributors.
- Fits the current hidden admin and Supabase Auth model.
- Allows direct approved contribution with a known contributor set.

Cons:

- Higher operational burden.
- Not fully open public contribution.
- Requires a manual account provisioning procedure.

Fit:

- Best MVP fit for direct approved observations without adding CAPTCHA/rate-limit immediately.

#### Option A3: Login Only, No In-App Sign-Up

The app exposes login/logout for existing accounts only; account creation happens outside the frontend.

Pros:

- Smallest frontend scope.
- Keeps sign-up policy separate from public UI work.
- Reuses the existing password auth path.

Cons:

- Users need an external account creation process.
- UX needs clear copy for how to request access.

Fit:

- Recommended for the first implementation sequence.

MVP recommendation: start with login-only for existing non-admin contributor accounts, with account creation/invitation handled operationally. Revisit open self-sign-up only after abuse thresholds, account policy, and moderation expectations are approved.

### B. Login Method

#### Option B1: Supabase Email/Password

Pros:

- Existing admin auth already uses this method.
- No new dependency.
- Works with the current `AuthRepository` shape.

Cons:

- Password reset and account lifecycle copy need later UX work.
- Users must manage passwords.

#### Option B2: Magic Link

Pros:

- Better passwordless UX.
- Reduces password handling friction.

Cons:

- Requires email deliverability and redirect flow verification.
- Adds more browser/session edge cases.

#### Option B3: Social Login

Pros:

- Familiar login path for many users.

Cons:

- Provider setup, privacy review, callback domains, and user identity mapping increase scope.
- Not needed for the MVP.

MVP recommendation: use Supabase email/password through the existing `AuthRepository`, then consider magic link after direct contribution is stable. Social login is out of scope for the 20C-20I sequence.

### C. Display Name Policy

#### Option C1: `profiles.display_name`

Use a profile display name for public observer labels.

Pros:

- Avoids exposing email addresses.
- Keeps display data separate from Auth provider internals.
- Can support Korean names, department names, or contributor aliases.

Cons:

- Requires a profile column and profile-edit policy decision.
- Needs fallback behavior when missing.

#### Option C2: Email-Based Display

Show email or email local part.

Pros:

- No extra profile field required.

Cons:

- Privacy risk.
- Publicly exposes personally identifying account data.

Not recommended.

#### Option C3: Static Fallback Only

Always show a generic label such as "registered observer".

Pros:

- Safest privacy posture.
- Minimal DB change.

Cons:

- Does not satisfy the "who observed it" requirement well.
- Reduces contributor recognition.

MVP recommendation: add `profiles.display_name`, never show email publicly, and fall back to a generic Korean label such as "등록 관찰자" if the display name is missing. Consider storing an optional observation-level display-name snapshot only after deciding whether historical names should remain stable.

### D. Observation Ownership

#### Option D1: `observations.observer_id = auth.uid()`

Pros:

- Standard RLS ownership model.
- Owner edit checks can be enforced by DB policies.
- Works for direct contribution and future "my observations" views.

Cons:

- Existing rows need a nullable fallback.
- Mock data and domain types need optional observer fields.

MVP recommendation: add nullable `observer_id` for new authenticated rows. Existing rows remain valid with `observer_id = null` and display a fallback observer label.

### E. Logged-In Create Status

#### Option E1: Authenticated Insert Creates `approved`

Pros:

- Directly matches the requested "no admin review" contribution flow.
- Simpler UI: a logged-in submit immediately appears in public approved list.
- No server-side auto-approve function required.

Cons:

- Abuse or mistakes become public immediately.
- Requires careful RLS so only authenticated owners can insert their own approved rows.
- Needs operational monitoring and a later edit/delete governance path.

#### Option E2: Authenticated Insert Creates `pending`, Then Auto-Approve Function

Pros:

- Centralizes status transition logic.
- Could later add contributor scoring or policy checks.

Cons:

- Requires server-side function/trigger design.
- More moving parts for the first MVP.

#### Option E3: Separate Contributor Role

Only profiles with a `contributor` or approved role can insert approved rows.

Pros:

- Better access control than any authenticated account.
- Supports open sign-up without immediate direct approval.

Cons:

- Requires role model changes and contributor provisioning.
- More RLS branches.

MVP recommendation: if account creation is invite/admin-managed, authenticated contributor inserts may create `approved` rows directly with `observer_id = auth.uid()`. If open self-sign-up is later allowed, introduce a contributor role or abuse gate before keeping direct approved insert.

### F. Edit Scope

#### Option F1: Owner/Admin Edit Text And Metadata Only

Editable fields:

- name
- scientific name
- taxon
- location
- observed date
- description
- coordinates

Pros:

- Covers most correction needs.
- Avoids Storage replacement complexity.
- Easier RLS and repository scope.

Cons:

- Users cannot correct images without a later replacement flow.

#### Option F2: Include Image Replacement

Pros:

- Complete correction workflow.

Cons:

- Requires Storage upload/delete/orphan handling.
- Higher abuse and cleanup risk.
- Larger UI and repository scope.

#### Option F3: Add Edit Audit Immediately

Pros:

- Strong accountability.

Cons:

- Requires schema and admin UI planning.
- Better handled as a separate governance phase.

MVP recommendation: owner/admin edit should start with text, taxon, date, location, description, and coordinates only. Image replacement, edit audit log, and edit history should remain out of scope until separately approved.

## DB/RLS Design Draft

20C should create a reviewed migration draft before anything is applied.

20C follow-up:

- `docs/architecture/public-user-contribution-rls-plan.md` records the DB/RLS plan.
- `docs/architecture/sql-drafts/0003_public_user_contribution_draft.sql` records a draft SQL candidate.
- The SQL draft is not applied automatically and requires separate approval before use.
- The draft keeps public reads approved-only, keeps email out of public display, and treats anonymous pending insert removal as a transition that must wait for login UI and repository changes.
- 20C.5 moved the draft out of `supabase/migrations/` to prevent accidental migration-tool application before approval.

Candidate columns:

```text
public.profiles.display_name text null
public.observations.observer_id uuid null references public.profiles(id)
public.observations.observer_display_name text null
public.observations.updated_at timestamptz not null default now()
```

Notes:

- `observer_id` is the authorization field.
- `observer_display_name` is optional. It is useful as a display snapshot, but it can become stale if users rename themselves.
- If no snapshot is used, public display can join or hydrate from `profiles.display_name` through repository code or a controlled view/RPC later.
- Existing observations should remain valid with nullable observer fields.
- Email addresses must not be written to public observation display fields.

RLS direction:

- Anonymous users can read approved observations only.
- Authenticated users can read approved observations only by default.
- A separate "my observations" read path may allow owners to read their own non-public rows if a future workflow creates pending/rejected owner rows.
- Authenticated direct create can insert approved rows only when:
  - `observer_id = auth.uid()`
  - `status = 'approved'`
  - image fields remain path/metadata only
  - signed/public/blob/data URLs are not stored
- Anonymous insert should be removed or blocked once anonymous submit is no longer allowed.
- Admin users keep all-read and all-update review permissions.
- Owner update policy should allow updates only when `observer_id = auth.uid()`.
- Owner update policy must not allow status escalation, ownership transfer, or public URL persistence.
- Admin update policy should remain separate and continue to rely on `public.is_admin()`.

Important migration sequencing:

1. Add nullable ownership/display columns and profile display name support.
2. Add repository/domain support while preserving existing anonymous pending flow.
3. Add public login UI.
4. Gate upload UI for anonymous users.
5. Switch authenticated create to approved after RLS tests pass.
6. Disable anonymous insert only when the UI and fallback copy are ready.

Risk of authenticated direct approved insert:

- If all authenticated users can self-register, spam becomes public immediately.
- If account provisioning is invite/admin-managed, the risk is lower but still requires monitoring.
- 20C should explicitly choose whether "authenticated" means any Auth user or only users with an approved contributor profile.

## Repository Design

### AuthRepository

Existing methods already cover the admin login path:

- `getCurrentUser`
- `getCurrentProfile`
- `getSessionState`
- `isCurrentUserAdmin`
- `signInWithPassword`
- `signOut`

Candidate additions for public auth:

- `getCurrentDisplayProfile(): Promise<UserProfile | null>` after adding `displayName`
- optional `signUpWithPassword` only if self-sign-up is approved
- optional session change subscription wrapper if the app needs reactive login/logout UI

Recommended 20D approach:

- Reuse `signInWithPassword` and `signOut`.
- Extend `UserProfile` with `displayName?: string`.
- Keep admin checks derived from profile role.

20D implementation result:

- Public login/logout UI and auth state now use the `AuthRepository` boundary.
- A safe auth provider fallback keeps mock/no-Supabase-env mode from crashing.
- `Navbar` shows public login/logout state without showing email addresses or exposing the hidden admin route.
- Signed-out users who open the upload page see login guidance instead of the upload form.
- Signed-in users can open the existing upload form.
- Direct approved create, observer display, owner edit, admin edit, signup, display-name setup, and live DB/RLS changes remain out of scope.

### ObservationRepository

Candidate additions:

- `createObservation(input)` keeps the public create method but changes behavior based on authenticated state only behind the repository.
- `updateObservation(id, input)` for owner/admin edit, introduced no earlier than edit implementation.
- `getMyObservations()` only if the UI needs a private owner dashboard.
- `getObservationById(id)` remains approved-only for public detail.

Repository rules:

- UI must not call Supabase directly.
- Signed URL generation stays in `supabaseObservationImageStorage` or repository code.
- DB insert/update rows must never store signed/public/blob/data URLs.
- Mock repository should keep sample behavior with optional observer fields.

### AdminObservationRepository

Admin review methods can remain unchanged for pending approve/reject.

Future admin edit may add a separate method such as:

```text
updateObservationAsAdmin(id, input)
```

This should remain in `AdminObservationRepository`, not the public repository, unless a shared update contract is explicitly designed.

## UI Design

### Navbar

Candidate public controls:

- Show login when signed out.
- Show a compact display name and logout when signed in.
- Keep admin route hidden from `Navbar`.
- Do not show email addresses in the public Navbar.

### Login UI

Options:

- Public login page in the existing page-state router.
- Login modal opened from Navbar or upload page.
- Reuse the admin login form styles but keep copy and route separate from `/#admin`.

MVP recommendation:

- Add a small public login page or panel, not a modal-heavy flow.
- Use existing calm academic styling.
- Keep admin login at `/#admin` separate.

### Upload Page

Signed-out behavior:

- Show a login-required message and login action.
- Do not allow submit.
- Keep existing public browsing unaffected.

Signed-in behavior:

- Show the existing upload form.
- Submit through `ObservationRepository.createObservation`.
- Supabase mode creates approved rows after the RLS/migration phase is approved.
- Mock mode can keep local sample behavior.

### Observation Card And Detail

Show observer display in:

- observation list card
- detail modal metadata

Display rules:

- Prefer `observerDisplayName`.
- Fall back to a generic label.
- Never show email addresses publicly.
- Avoid exposing raw `observer_id` in UI copy.

### Edit UI

Owner/admin edit button:

- Show only when the current user is the owner or admin.
- Hide for anonymous users and non-owner public users.
- Keep detail view read-only by default.

MVP edit form:

- name
- scientific name
- taxon
- location
- observed date
- description
- coordinates

Non-scope for MVP:

- image replacement
- edit audit log
- reject notes
- bulk approval
- account management UI

### Admin Edit UX

Admin edit should be treated separately from review approve/reject.

Options:

- Add edit affordance inside the hidden admin review UI.
- Add edit affordance in public detail only when the signed-in user is admin.

MVP recommendation:

- Design owner edit first.
- Add admin edit in the same repository/RLS model only after owner edit has passing regression checks.

## Security And Privacy Risks

- Public email exposure is not acceptable.
- `observer_id` should be treated as an internal authorization value, not public UI copy.
- Direct approved insert can publish spam or low-quality data immediately.
- Owner update can be abused if RLS allows status, ownership, or image URL changes.
- Public login UI must not make hidden admin routing appear in `Navbar`.
- RLS tests are required for anon, authenticated non-owner, owner, and admin paths.
- Existing admin permissions must continue to work.
- Pending/rejected public invisibility must be tested after every RLS change.
- Storage image rules must continue to store only object paths and metadata in DB rows.

## Step-by-Step Implementation Plan

### 20C: DB/RLS Migration Design And Draft

- Draft nullable observer/profile columns.
- Draft RLS policies for anon read, authenticated direct create, owner update, and admin update.
- Decide whether direct approved insert is for any authenticated user or only approved contributor profiles.
- Do not apply SQL until reviewed.

### 20D: Public Login UI

Status: implemented in phase 20D.

- Added public login/logout state behind `AuthRepository`.
- Added Navbar login/logout affordance without exposing admin.
- Added signed-out upload guidance.
- Kept create behavior unchanged until RLS work is ready.

### 20E: Authenticated Direct Create

- Change Supabase create flow so authenticated users create approved rows with `observer_id`.
- Disable anonymous submit path in UI.
- Apply and verify RLS only after approval.

### 20F: Observer Display

- Extend domain types and mappers with observer display fields.
- Show observer display on public cards and detail modal.
- Keep email hidden.

### 20G: Owner/Admin Edit Design

- Finalize editable fields, validation, conflict handling, and RLS tests.
- Decide whether admin edit ships with owner edit or as a separate step.

### 20H: Owner/Admin Edit Implementation

- Add repository update methods.
- Add minimal edit UI.
- Keep image replacement out of scope unless separately approved.

### 20I: Regression Verification

- Verify anonymous read and no-create behavior.
- Verify authenticated create approved behavior.
- Verify owner edit and non-owner denial.
- Verify admin edit/review still works.
- Verify pending/rejected public invisibility.
- Verify Storage signed URL and image metadata invariants.

## Explicit Non-Scope

20B does not implement, and 20D still intentionally does not implement:

- public sign-up UI
- authenticated direct create
- observer display fields
- owner edit UI
- admin edit UI
- social login
- CAPTCHA
- rate limit
- Edge Functions
- audit log
- reject note
- bulk approval
- image replacement
- account management UI
- Supabase SQL/RLS application
- package changes
- Kakao Map changes
- admin route exposure in `Navbar`

## Recommended 20B Decision

Use a conservative MVP:

- Public users are Supabase Auth users with `profiles.role = 'user'`.
- Initial account creation is handled outside the public frontend.
- Login uses Supabase email/password through `AuthRepository`.
- Anonymous users can browse public approved records but cannot submit.
- Authenticated contributors create approved observations directly only after 20C RLS is reviewed and 20E implementation is approved.
- `profiles.display_name` is used for observer display; email is never shown publicly.
- `observations.observer_id` is the owner authorization field.
- Owner/admin edit starts with text and metadata fields only.
- Existing admin approve/reject flow and hidden route remain intact.

## Remaining Decisions After 20C

- Confirm whether public self-sign-up stays out of scope for the MVP and contributor accounts remain invite/admin-created.
- Confirm whether direct approved insert is acceptable for all authenticated MVP contributor accounts, or whether a contributor role is needed before launch.
- Confirm whether the `observer_display_name` snapshot from the 20C draft is accepted for public display.
- Should owners be able to read their own non-approved rows if any workflow still creates pending rows?
- Should anonymous pending insert be disabled immediately when logged-in create is enabled, or kept during a transition period?
- Which exact fields are owner-editable in the first edit implementation?
- Does admin edit ship with owner edit, or as a later admin UX phase?
