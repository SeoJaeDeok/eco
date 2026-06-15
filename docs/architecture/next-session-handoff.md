# Next Session Handoff

## Purpose

This document helps a new ChatGPT/Codex session quickly understand the current project state before starting phase 16.

Read this together with:

- `AGENTS.md`
- `README.md`
- `docs/architecture/supabase-setup.md`
- `docs/architecture/admin-approval-flow.md`

## Current Completed Phases

- Design-only starter cleanup
- `App.tsx` thinning and page routing cleanup
- `Taxon`, taxon constants, and `TaxonBadge` cleanup
- Observation repository contract and mock repository
- Async-ready repository flow
- Provider-neutral static map layer
- Upload form types, helpers, and mock submit flow
- Supabase DB row types and mappers
- Supabase public observation repository
- Supabase schema/RLS SQL draft
- Environment placeholder policy
- Public approved observation read through Supabase
- Public pending observation insert through Supabase
- Manual pending-to-approved smoke tests
- `AdminObservationRepository` contract
- Supabase admin observation repository
- `AuthRepository` contract
- Supabase auth repository
- Hidden `/#admin` login page
- Admin pending approve/reject UI
- 15D admin permission and public-flow regression verification
- 15E admin documentation update

## Verified Current State

- Public flow is normal:
  - Home
  - Biodiversity guide
  - Observation list
  - Observation detail modal
  - Upload screen
  - Static map
- `/#admin` while signed out shows the login form.
- Pending list is hidden while signed out.
- Admin login succeeds with a configured Supabase Auth user.
- Admin pending area is accessible after admin login.
- Sign out returns to the login form.
- Sign out hides the admin session panel and pending list.
- 15C approve/reject smoke test passed.
- 15D had zero pending rows, so approve/reject was not re-tested there.
- No console/runtime errors were observed in 15D.

## Core Architecture

### Public Observation Repository

`ObservationRepository` is the public observation contract.

The active repository is selected in:

```text
src/repositories/observationRepositoryProvider.ts
```

Default behavior is `mock`. Supabase is selected only when:

```text
VITE_OBSERVATION_REPOSITORY=supabase
```

Supabase public repository:

```text
src/repositories/supabase/supabaseObservationRepository.ts
```

Public Supabase behavior:

- Reads only `approved` observations.
- Inserts public submissions as `pending`.
- Does not upload images yet.
- Does not expose pending/rejected rows in public lists.

### Admin Observation Repository

Admin contract:

```text
src/repositories/adminObservationRepository.ts
```

Supabase implementation:

```text
src/repositories/supabase/supabaseAdminObservationRepository.ts
```

Admin repository methods:

- `listPendingObservations()`
- `listAllObservations()`
- `approveObservation(id)`
- `rejectObservation(id)`

Admin access depends on Supabase Auth plus RLS policies using `public.profiles.role = 'admin'`.

### Auth Repository

Auth contract:

```text
src/repositories/authRepository.ts
```

Supabase implementation:

```text
src/repositories/supabase/supabaseAuthRepository.ts
```

Auth repository methods:

- `getCurrentUser()`
- `getCurrentProfile()`
- `getSessionState()`
- `isCurrentUserAdmin()`
- `signInWithPassword(email, password)`
- `signOut()`

### Admin Hidden Hash Route

Admin UI is accessed at:

```text
/#admin
```

The route is intentionally hidden from `Navbar`.

This hidden route is not a security boundary. Supabase Auth, RLS, and `profiles.role = 'admin'` are the actual protection.

### Static Map Provider

The current map is still static and design-only.

Key file:

```text
src/features/map/mapProvider.ts
```

Kakao Map is not implemented yet. The static map provider remains the default map experience.

## Important Files

```text
src/repositories/observationRepositoryProvider.ts
src/repositories/supabase/supabaseObservationRepository.ts
src/repositories/supabase/supabaseAdminObservationRepository.ts
src/repositories/supabase/supabaseAuthRepository.ts
src/components/admin/AdminPage.tsx
src/components/admin/AdminPendingList.tsx
src/components/admin/AdminObservationReviewPanel.tsx
src/features/map/mapProvider.ts
supabase/migrations/0001_create_observation_schema.sql
docs/architecture/supabase-setup.md
docs/architecture/admin-approval-flow.md
docs/architecture/admin-ui-routing-plan.md
```

## Security Rules For The Next Session

- Do not print `.env.local`.
- Do not print Supabase URL, anon key, tokens, email, or password.
- Do not use or add a Supabase service role key in frontend code.
- Do not commit `.env.local`, `.env`, `dist`, or `node_modules`.
- Keep RLS enabled.
- Remember that hidden `/#admin` routing is not security.
- Admin permissions must continue to rely on Supabase Auth + RLS + `public.profiles.role = 'admin'`.

## New Session Start Prompt

Use this exact prompt to start the next session:

```text
AGENTS.md를 먼저 읽고, README.md와 docs/architecture/next-session-handoff.md를 읽어 현재 상태를 요약해 주세요. 아직 코드는 수정하지 마세요. 다음 작업은 16A Supabase Storage 이미지 업로드 설계입니다.
```

## Recommended Phase 16 Direction

### 16A: Supabase Storage Image Upload Design

Create a design document before code.

Decisions to make:

- Public bucket vs private bucket
- Upload-before-insert vs insert-before-upload
- Pending image visibility
- Approved image display path
- Rejected image cleanup
- File size limit
- Allowed MIME types/extensions
- Client-side compression timing

### 16B: Storage Bucket/Policy SQL Or Setup Document

Prepare Storage bucket and policy docs or SQL draft.

Do not apply policies automatically unless explicitly asked.

### 16C: Connect Upload Image Flow

Only after the Storage design is approved:

- Add upload helper.
- Upload image to Storage.
- Save the resulting storage path or public URL safely.
- Keep pending approval behavior.
- Avoid storing preview/blob URLs as DB `image_url`.

### 16D: Image Display Verification

Verify:

- Upload page preview still works.
- Admin review can show submitted images.
- Approved public detail can show images.
- Rejected rows stay hidden publicly.
- No secrets are logged.

## Missing Features

- Image upload
- Supabase Storage policy
- Kakao Map real provider
- Naver Map, Leaflet, or MapLibre provider
- Reject note
- Audit log
- Bulk approval
- Admin menu in `Navbar`
- User account management UI
- Spam/rate-limit/CAPTCHA protection
- PWA/app packaging

## Verification Commands

Use Windows-safe npm commands:

```bash
npm.cmd run typecheck
npm.cmd run build
```

When dependencies change:

```bash
npm.cmd audit --audit-level=high
```
