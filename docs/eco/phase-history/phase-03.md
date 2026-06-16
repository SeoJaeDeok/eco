# Phase 3 - Observation Repository Contract

## Status

Completed.

**한국어:** 완료된 phase입니다.

## Goal

Introduce a data-access boundary for public observations before connecting any real backend.

**한국어:** 실제 backend를 연결하기 전에 public observation 데이터 접근 경계를 만들었습니다.

## Main Work

- Added the public `ObservationRepository` interface.
- Added mock repository structure.
- Kept public UI decoupled from persistence details.

**한국어:** public `ObservationRepository` 인터페이스와 mock repository 구조를 추가하고, UI가 저장소 세부 구현에 직접 의존하지 않도록 했습니다.

## Key Files

- `src/repositories/observationRepository.ts`
- `src/repositories/mockObservationRepository.ts`
- `src/data/sampleObservations.ts`

**한국어:** public repository 계약, mock 구현, 샘플 데이터가 핵심 파일입니다.

## Verification

- Verification commands are not explicitly recorded for this phase.
- Later repository and build checks passed in subsequent phases.

**한국어:** 이 phase 자체의 검증 명령은 기록되어 있지 않지만, 이후 repository와 build 검증이 통과했습니다.

## Remaining Risks / Follow-ups

- Real persistence was intentionally deferred to later Supabase phases.

**한국어:** 실제 영속성 구현은 이후 Supabase phase로 의도적으로 미뤘습니다.

## Linked Docs

- `AGENTS.md`
- `docs/adr/0001-storage-provider.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** repository 경계와 provider 결정 문서를 함께 참고합니다.

## Notes

- The repository boundary remains a core architecture rule.

**한국어:** UI가 저장소를 직접 호출하지 않는 규칙은 이후에도 핵심 아키텍처 원칙으로 유지됩니다.
