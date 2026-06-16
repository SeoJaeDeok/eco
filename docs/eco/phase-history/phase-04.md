# Phase 4 - Provider-Neutral Static Map Layer

## Status

Completed.

## Goal

Split static map behavior into provider-neutral map types and static UI components so a real provider could be added later.

## Main Work

- Added provider-neutral map types and projection helpers.
- Split static map UI into dedicated map components.
- Kept `DesignMap` as a compatibility wrapper.
- Preserved the static fallback map surface.

## Key Files

- `src/features/map/mapTypes.ts`
- `src/features/map/mapProjection.ts`
- `src/features/map/mapProvider.ts`
- `src/components/map/StaticEcoMap.tsx`
- `src/components/map/StaticLocationPicker.tsx`
- `src/components/map/StaticPositionPreview.tsx`
- `src/components/DesignMap.tsx`

## Verification

- Verification commands are not explicitly recorded for this phase.
- Static fallback behavior was later verified during Kakao Map fallback/regression phases.

## Remaining Risks / Follow-ups

- Real map provider implementation was deferred until Phase 17.

## Linked Docs

- `docs/adr/0002-map-provider.md`
- `docs/architecture/kakao-map-provider-design.md`
- `docs/architecture/next-session-handoff.md`

## Notes

- The static fallback remains intentional and should not be removed casually.
