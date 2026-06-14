# ADR 0001: Storage Provider

## Status

Proposed.

## Context

The project is currently a design-only biodiversity monitoring and eco-map starter. It uses static sample observations and a mock observation repository. There is no real database, persistence, server API, authentication, file upload pipeline, or image storage.

The current domain model already points toward structured observation records:

- `ObservationRepository` separates UI code from data access.
- `Observation.status` can support review states.
- `CreateObservationInput` represents the submission payload before persistence exists.
- `coords`, `taxon`, `date`, and `location` fit naturally into table columns.

The next storage decision should support public submissions, admin review, public approved observations, and future media storage without forcing a large UI rewrite.

## Decision

Use Supabase as the first-choice storage path for the production MVP, with Postgres for observation records, Supabase Storage for uploaded images, and Row Level Security for public/admin access rules.

The intended review flow is:

```text
pending -> approved
pending -> rejected
```

Public users should be able to create only `pending` observations. Public reads should return only `approved` observations. Admin approve/reject actions should be allowed only for authenticated admin users.

This is a design decision only. Do not add Supabase dependencies, clients, environment files, schema files, or implementation code until the implementation phase is explicitly approved.

## Options Considered

### Supabase

Pros:

- Fits the existing repository pattern and table-shaped observation data.
- Postgres is a good match for `coords`, `taxon`, `status`, timestamps, and future admin queries.
- Storage can keep image files separate from database rows.
- Row Level Security can express public read, public pending create, and admin-only approval policies.
- SQL schema and migrations make the data model explicit before UI integration.

Cons:

- Requires schema design, RLS policy design, bucket policy design, and environment setup.
- Admin flows need authentication and role modeling before production use.
- The frontend must never receive service-role credentials.

### Firebase

Pros:

- Good for quick prototypes with auth, Firestore, and Storage.
- Client SDKs are mature and deployment paths are familiar for student MVPs.
- Realtime features are easy to add later if needed.

Cons:

- Firestore document modeling is less natural for relational admin review queries.
- Security rules must be carefully written and tested.
- Query shapes and indexes need planning as filters grow.
- The current repository and status/table direction fit Supabase more naturally.

### Local JSON

Pros:

- Very simple for demos and static design references.
- No backend account, keys, or billing.
- Good fallback for public portfolio/demo builds.

Cons:

- No real user submissions.
- No admin approval workflow.
- No image storage.
- Requires rebuilds or manual file edits to change data.

### localStorage / IndexedDB

Pros:

- Works offline and requires no backend.
- Useful for temporary drafts or local-only prototypes.

Cons:

- Data is per device/browser and not shared.
- Not suitable for public observation records.
- No central approval workflow.
- Privacy and data loss risks are easy to overlook.

### Custom Server API

Pros:

- Maximum control over validation, authorization, and integrations.
- Can hide service credentials completely behind server endpoints.

Cons:

- Requires server hosting, API design, database integration, and operations.
- Adds more moving parts than needed for the first MVP.
- Express/server code is explicitly out of scope for the current design-only phase.

## Consequences

- The active app stays mock/static until the Supabase implementation phase is approved.
- The current `ObservationRepository` interface remains the integration boundary.
- Future UI code should call repository methods rather than Supabase directly.
- A future `supabaseObservationRepository.ts` can replace or sit beside `mockObservationRepository.ts`.
- The schema and RLS policies must be designed before any client integration.
- Media uploads should use object storage and store only URLs/metadata in observation rows.

## Security Notes

- Never put a Supabase service role key in frontend code.
- Do not commit `.env`, `.env.local`, `.env.production`, or real secrets.
- Add only `.env.example` with placeholder values when implementation begins.
- Public reads should be constrained to approved rows.
- Public creates should force or validate `status = 'pending'`.
- Admin approve/reject must require authenticated admin authorization.
- Storage bucket policies must match the observation visibility model.
- Submitted observation data should be treated as potentially public.

## Environment Variables

When implementation begins, the likely frontend variables are:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_STORAGE_BUCKET=
```

These names should appear only as placeholders in `.env.example`. Real values must remain in local or deployment environment configuration.

## Files Likely To Change

- `src/repositories/observationRepository.ts`
- `src/repositories/supabaseObservationRepository.ts`
- `src/App.tsx`
- `src/components/UploadMockPage.tsx`
- `src/types.ts`
- `.env.example`

Schema and RLS policy files may be added later if the project adopts migration files or SQL documentation.

## Open Questions

- What exact table schema should be used for observations?
- Should `location` and `date` be migrated to `locationName` and `observedAt` before persistence?
- How should admin identity be represented?
- Should rejected observations remain visible to the submitter?
- Should image uploads be required or optional?
- What metadata should be stored for uploaded images?
- Is a public moderation queue acceptable, or should submissions require login?

## Next Steps

1. Draft the observation table schema.
2. Draft RLS policies for approved reads, pending creates, and admin updates.
3. Decide whether authentication is required for public submissions.
4. Decide the image bucket name and visibility policy.
5. Add `.env.example` placeholders only after implementation is approved.
6. Implement `supabaseObservationRepository.ts` behind the existing repository interface.
