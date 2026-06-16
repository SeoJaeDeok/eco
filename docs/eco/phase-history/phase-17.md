# Phase 17 - Kakao Map Provider

## Status

Verified.

**한국어:** 검증 완료로 기록된 phase입니다.

## Goal

Add a real Kakao Map provider behind the provider-neutral map boundary while preserving the static fallback.

**한국어:** provider-neutral map 경계 뒤에 실제 Kakao Map provider를 추가하면서 static fallback을 유지했습니다.

## Main Work

- Phase 17A documented the Kakao Map provider design.
- Phase 17B implemented the Kakao SDK loader and provider module.
- Phase 17C verified real Kakao rendering after the JavaScript key was corrected.
- Phase 17D verified normal-key, no-key, invalid-key, mock-mode, Supabase-mode, responsive, and logging regression paths.
- Phase 17E added small UX hardening for loading notices, marker hit area/accessibility, and fallback copy.

**한국어:** Kakao provider 설계, SDK loader/provider 구현, 실제 render 검증, fallback/regression 검증, loading/marker/fallback copy UX hardening을 완료했습니다.

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

**한국어:** Kakao loader/provider, provider selection, DesignMap/MapPreview, static fallback map/picker/preview가 핵심 파일입니다.

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

**한국어:** 정상 key, no-key, invalid-key/domain mismatch, mock/Supabase mode, responsive, logging/security 경로가 검증되었고 17E에서도 typecheck/build/diff 및 smoke 검증이 통과했습니다.

## Remaining Risks / Follow-ups

- Re-run fallback/regression checks after future map provider, layout, Kakao app/domain, or repository visibility changes.
- Marker clustering, advanced map search, reverse geocoding, and route/direction features remain out of scope.

**한국어:** map provider, layout, Kakao app/domain, repository visibility가 바뀌면 fallback/regression을 다시 검증해야 합니다. clustering, 고급 검색, reverse geocoding, route/direction은 여전히 비범위입니다.

## Linked Docs

- `docs/architecture/kakao-map-provider-design.md`
- `docs/adr/0002-map-provider.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** Kakao provider 설계 문서, map provider ADR, handoff를 함께 참고합니다.

## Notes

- UI components should not call Kakao SDK APIs directly.
- Static fallback remains available when the key is missing or SDK loading fails.

**한국어:** 일반 UI 컴포넌트는 Kakao SDK를 직접 호출하지 않으며, key가 없거나 SDK loading이 실패하면 static fallback이 유지됩니다.
