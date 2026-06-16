# Phase 9 - Provider ADRs And Supabase Planning

## Status

Design completed.

**한국어:** 설계 문서화가 완료된 phase입니다.

## Goal

Record architecture decisions for persistence and map providers before backend or real map implementation work.

**한국어:** backend와 실제 지도 구현 전에 persistence와 map provider 아키텍처 결정을 기록했습니다.

## Main Work

- Documented the Storage/data provider ADR.
- Documented the map provider ADR.
- Planned Supabase schema and RLS direction.
- Kept the active app mock/static while provider plans were finalized.

**한국어:** Storage/data provider ADR, map provider ADR, Supabase schema/RLS 방향을 문서화하고 앱은 mock/static 상태로 유지했습니다.

## Key Files

- `docs/adr/0001-storage-provider.md`
- `docs/adr/0002-map-provider.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`

**한국어:** ADR과 Supabase schema/setup 설계 문서가 핵심입니다.

## Verification

- Documentation review is implied by subsequent implementation.
- No phase-specific typecheck/build output is explicitly recorded.

**한국어:** 이후 구현으로 문서 검토가 이어졌지만, 이 phase 자체의 typecheck/build 출력은 기록되어 있지 않습니다.

## Remaining Risks / Follow-ups

- Supabase schema, repository integration, admin authorization, Storage policy, and real map implementation were deferred to later phases.

**한국어:** Supabase schema 적용, repository 연결, admin authorization, Storage policy, 실제 지도 구현은 이후 phase로 미뤘습니다.

## Linked Docs

- `docs/adr/0001-storage-provider.md`
- `docs/adr/0002-map-provider.md`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`

**한국어:** provider ADR과 Supabase 설계 문서를 함께 참고합니다.

## Notes

- Commit history includes `9a3ab39 docs: document design-only architecture decisions` and `b24e67a docs: document architecture decisions and Supabase schema plan`.

**한국어:** 관련 설계 문서 커밋들이 commit history에 남아 있습니다.
