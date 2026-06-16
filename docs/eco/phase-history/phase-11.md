# Phase 11 - Supabase Public Repository Selection

## Status

Completed.

**한국어:** 완료된 phase입니다.

## Goal

Add a real Supabase public observation repository while preserving mock mode as the default.

**한국어:** mock mode를 기본값으로 유지하면서 실제 Supabase public observation repository를 추가했습니다.

## Main Work

- Implemented Supabase public observation repository.
- Added repository provider selection policy.
- Kept `mock` as the default repository unless local env explicitly selects Supabase.
- Added environment placeholder policy for Supabase mode.

**한국어:** Supabase public repository와 provider selection 정책을 구현하고, 명시적 env 설정이 없으면 `mock`을 유지했습니다.

## Key Files

- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/repositories/supabase/supabaseClient.ts`
- `src/repositories/observationRepositoryProvider.ts`
- `.env.example`
- `README.md`

**한국어:** Supabase repository/client, provider selection, env placeholder, README가 핵심입니다.

## Verification

- Phase-specific verification output is not explicitly recorded.
- Supabase public approved read and pending insert were verified in later phases.

**한국어:** 이 phase 자체의 검증 출력은 없지만 approved read와 pending insert는 이후 phase에서 검증되었습니다.

## Remaining Risks / Follow-ups

- Schema/RLS application and smoke verification were still required after repository implementation.

**한국어:** repository 구현 이후에도 schema/RLS 적용과 smoke 검증이 필요했습니다.

## Linked Docs

- `docs/architecture/supabase-setup.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** Supabase setup/schema 문서와 handoff를 함께 참고합니다.

## Notes

- Public UI should continue using `ObservationRepository` rather than calling Supabase directly.

**한국어:** public UI는 Supabase를 직접 호출하지 않고 계속 `ObservationRepository` 뒤에 있어야 합니다.
