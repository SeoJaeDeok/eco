# Phase 4 - Provider-Neutral Static Map Layer

## Status

Completed.

**한국어:** 완료된 phase입니다.

## Goal

Split static map behavior into provider-neutral map types and static UI components so a real provider could be added later.

**한국어:** 이후 실제 지도 provider를 붙일 수 있도록 static map을 provider-neutral 타입과 static UI 컴포넌트로 분리했습니다.

## Main Work

- Added provider-neutral map types and projection helpers.
- Split static map UI into dedicated map components.
- Kept `DesignMap` as a compatibility wrapper.
- Preserved the static fallback map surface.

**한국어:** map 타입/좌표 projection helper를 분리하고 static map 컴포넌트를 정리했으며, `DesignMap` wrapper와 static fallback을 유지했습니다.

## Key Files

- `src/features/map/mapTypes.ts`
- `src/features/map/mapProjection.ts`
- `src/features/map/mapProvider.ts`
- `src/components/map/StaticEcoMap.tsx`
- `src/components/map/StaticLocationPicker.tsx`
- `src/components/map/StaticPositionPreview.tsx`
- `src/components/DesignMap.tsx`

**한국어:** map provider-neutral 타입, projection helper, static map UI, compatibility wrapper가 핵심입니다.

## Verification

- Verification commands are not explicitly recorded for this phase.
- Static fallback behavior was later verified during Kakao Map fallback/regression phases.

**한국어:** 이 phase 자체의 명령 출력은 없지만, static fallback은 Phase 17 Kakao regression에서 다시 검증되었습니다.

## Remaining Risks / Follow-ups

- Real map provider implementation was deferred until Phase 17.

**한국어:** 실제 지도 provider 구현은 Phase 17까지 보류했습니다.

## Linked Docs

- `docs/adr/0002-map-provider.md`
- `docs/architecture/kakao-map-provider-design.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** map provider ADR과 Kakao provider 설계 문서를 함께 참고합니다.

## Notes

- The static fallback remains intentional and should not be removed casually.

**한국어:** static fallback은 의도된 안전망이므로 가볍게 제거하면 안 됩니다.
