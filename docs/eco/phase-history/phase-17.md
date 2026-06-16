# Phase 17 - Kakao Map Provider

## Status

Verified.

## Goal

Add a real Kakao Map provider behind the provider-neutral map boundary while preserving the static fallback.

## Main Work

- Phase 17A documented the Kakao Map provider design.
- Phase 17B implemented the Kakao SDK loader and provider module.
- Phase 17C verified real Kakao rendering after the JavaScript key was corrected.
- Phase 17D verified normal-key, no-key, invalid-key, mock-mode, Supabase-mode, responsive, and logging regression paths.
- Phase 17E added small UX hardening for loading notices, marker hit area/accessibility, and fallback copy.

## Key Files

- `docs/architecture/kakao-map-provider-design.md`
- `src/features/map/kakaoMapLoader.ts`
- `src/features/map/kakaoMapProvider.tsx`
- `src/features/map/mapProvider.ts`
- `src/features/map/mapTypes.ts`
- `src/components/DesignMap.tsx`
- `src/components/MapPreview.tsx`
- `src/components/map/StaticEcoMap.tsx`
- `src/components/map/StaticLocationPicker.tsx`
- `src/components/map/StaticPositionPreview.tsx`

## Verification

- Phase 17C manual verification passed for a configured local Kakao JavaScript key and registered local origin.
- Phase 17D fallback/regression verification passed:
  - normal key Kakao regression
  - no-key fallback
  - invalid-key/domain mismatch fallback
  - mock repository regression
  - Supabase repository regression
  - responsive regression
  - security/logging regression
- Phase 17E verification recorded typecheck/build, diff check, normal/no-key smoke, Supabase read-only public visibility check, and secret checks as passed.

## Remaining Risks / Follow-ups

- Re-run fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
- Marker clustering, advanced map search, reverse geocoding, and route/direction features remain out of scope.

## Linked Docs

- `docs/architecture/kakao-map-provider-design.md`
- `docs/adr/0002-map-provider.md`
- `docs/architecture/next-session-handoff.md`

## Notes

- UI components should not call Kakao SDK APIs directly.
- Static fallback remains available when the key is missing or SDK loading fails.
