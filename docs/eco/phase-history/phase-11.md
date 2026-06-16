# Phase 11 - Supabase Public Repository Selection

## Status

Completed.

## Goal

Add a real Supabase public observation repository while preserving mock mode as the default.

## Main Work

- Implemented Supabase public observation repository.
- Added repository provider selection policy.
- Kept `mock` as the default repository unless local env explicitly selects Supabase.
- Added environment placeholder policy for Supabase mode.

## Key Files

- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/repositories/supabase/supabaseClient.ts`
- `src/repositories/observationRepositoryProvider.ts`
- `.env.example`
- `README.md`

## Verification

- Phase-specific verification output is not explicitly recorded.
- Supabase public approved read and pending insert were verified in later phases.

## Remaining Risks / Follow-ups

- Schema/RLS application and smoke verification were still required after repository implementation.

## Linked Docs

- `docs/architecture/supabase-setup.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/next-session-handoff.md`

## Notes

- Public UI should continue using `ObservationRepository` rather than calling Supabase directly.
