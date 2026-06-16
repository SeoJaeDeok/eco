# Phase 12 - Supabase Schema And RLS Draft

## Status

Design completed.

## Goal

Draft and harden the Supabase schema and RLS rules for public approved reads, pending public inserts, and admin-only moderation.

## Main Work

- Added Supabase schema/RLS SQL draft.
- Documented setup and hardening notes.
- Hardened insert mapping and schema planning.
- Preserved the rule that public inserts cannot create approved observations.

## Key Files

- `supabase/migrations/0001_create_observation_schema.sql`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`
- `src/repositories/supabase/observationMappers.ts`

## Verification

- Phase-specific verification output is not explicitly recorded.
- Supabase connection, approved read, and pending insert were verified in Phase 13.

## Remaining Risks / Follow-ups

- Actual project application and smoke verification were required after the draft.

## Linked Docs

- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`
- `docs/adr/0001-storage-provider.md`

## Notes

- This phase is treated as a schema/RLS planning and draft phase, not proof that a remote Supabase project was already configured.
