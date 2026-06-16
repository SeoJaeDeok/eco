# Phase 12 - Supabase Schema And RLS Draft

## Status

Design completed.

**한국어:** 설계/초안 문서화가 완료된 phase입니다.

## Goal

Draft and harden the Supabase schema and RLS rules for public approved reads, pending public inserts, and admin-only moderation.

**한국어:** approved-only public read, pending public insert, admin-only moderation을 위한 Supabase schema/RLS 초안을 만들고 hardening 방향을 정리했습니다.

## Main Work

- Added Supabase schema/RLS SQL draft.
- Documented setup and hardening notes.
- Hardened insert mapping and schema planning.
- Preserved the rule that public inserts cannot create approved observations.

**한국어:** schema/RLS SQL draft와 setup/hardening notes를 작성하고, public insert가 approved를 만들 수 없다는 원칙을 유지했습니다.

## Key Files

- `supabase/migrations/0001_create_observation_schema.sql`
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`
- `src/repositories/supabase/observationMappers.ts`

**한국어:** migration draft, Supabase schema/setup 문서, mapper가 핵심 파일입니다.

## Verification

- Phase-specific verification output is not explicitly recorded.
- Supabase connection, approved read, and pending insert were verified in Phase 13.

**한국어:** 이 phase 자체 검증 출력은 없지만 Supabase 연결, approved read, pending insert는 Phase 13에서 검증되었습니다.

## Remaining Risks / Follow-ups

- Actual project application and smoke verification were required after the draft.

**한국어:** draft 이후 실제 프로젝트 적용과 smoke 검증이 필요했습니다.

## Linked Docs

- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-setup.md`
- `docs/adr/0001-storage-provider.md`

**한국어:** Supabase schema/setup 문서와 storage provider ADR을 함께 참고합니다.

## Notes

- This phase is treated as a schema/RLS planning and draft phase, not proof that a remote Supabase project was already configured.

**한국어:** 이 phase는 원격 Supabase 프로젝트 설정 완료 증명이 아니라 schema/RLS 계획과 초안 작성 phase입니다.
