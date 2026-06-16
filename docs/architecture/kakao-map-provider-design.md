# Kakao Map Provider Design

## Purpose And Scope

This document is the phase 17A design for adding a real Kakao Map provider to the KNU Eco Map app.

17A is design-only:

- Do not implement a Kakao SDK loader in this phase.
- Do not add a Kakao provider implementation in this phase.
- Do not connect real map UI in this phase.
- Do not change app code, package files, Storage, Auth, admin, or public visibility flows.

Follow-up phases:

- 17B: Implement Kakao SDK loader and provider behind the existing provider-neutral map boundary.
- 17C: Connect UI usage and run manual verification.
- 17D: Run fallback and regression verification.
- 17E, if needed: Map UX hardening.

The static map fallback must remain available after Kakao Map is added.

## Current Map Structure

Provider-neutral map files:

```text
src/features/map/mapTypes.ts
src/features/map/mapProvider.ts
src/features/map/mapProjection.ts
```

Current provider state:

- `mapTypes.ts` defines `Coordinates`, `MapBounds`, `MapMarker`, `EcoMapProps`, `EcoLocationPickerProps`, and `MapProviderAdapter`.
- `mapProvider.ts` currently hardcodes `ACTIVE_MAP_PROVIDER` to `static`.
- `mapProjection.ts` contains static map bounds, the default campus center, coordinate-to-percent projection helpers, and percent-to-coordinate conversion for the static picker.

Static map UI files:

```text
src/components/map/StaticEcoMap.tsx
src/components/map/StaticLocationPicker.tsx
src/components/map/StaticPositionPreview.tsx
src/components/map/StaticMapDecor.tsx
src/components/map/MapLegend.tsx
src/components/map/MapNoticePanel.tsx
```

Compatibility wrapper:

```text
src/components/DesignMap.tsx
```

`DesignMap.tsx` keeps older imports stable:

- `DesignMap` renders `StaticEcoMap`.
- `StaticDesignMap` renders `StaticPositionPreview`.
- `DesignMarkerPicker` renders `StaticLocationPicker`.

Current map usage:

- `MapPage` and `MapPreview` render the full static overview map with observation markers and a legend.
- `ObservationDetailLocation` renders `StaticDesignMap` as a read-only location preview.
- `UploadLocationSection` renders `DesignMarkerPicker`; map click selection flows into `CreateObservationFormValues.coords`.
- Supabase maps DB `latitude` and `longitude` into domain `Observation.coords.lat` and `Observation.coords.lng`.

Marker styling:

- Marker colors are taxon-based through `TaxonBadge` and `getTaxonColor`.
- Kakao markers should preserve this visual meaning through custom overlays or marker content, not by inventing a separate color palette.

Coordinate model:

- App domain uses `{ lat: number; lng: number }`.
- Supabase uses `latitude` and `longitude` columns.
- Kakao `LatLng` creation should use latitude first and longitude second.

## Kakao Map Design Decisions

### Environment Key

Use this frontend environment variable:

```text
VITE_KAKAO_MAP_JAVASCRIPT_KEY=
```

Policy:

- `.env.local` values must never be printed.
- `.env.example` may contain only the placeholder name.
- `VITE_*` values are browser-exposed and must not be treated as secrets.
- Do not write real Kakao keys or registered domain values into docs or source.

### Missing Or Invalid Env

If `VITE_KAKAO_MAP_JAVASCRIPT_KEY` is absent, empty, invalid, or not authorized for the current domain, the app should use the static provider.

The fallback should be silent in normal UI and non-sensitive in logs. Do not print keys.

### SDK Loading

Use a dedicated loader helper in 17B. Kakao's official guide loads the JavaScript SDK with an `appkey` query parameter, and its documentation describes dynamic loading with `autoload=false` plus `kakao.maps.load(callback)`.

Recommended loader behavior:

- Create one script element for the Kakao Maps SDK.
- Use `autoload=false`.
- Reuse an in-flight load promise to prevent duplicate script tags.
- Resolve only after `kakao.maps.load` completes.
- Reject on script load failure, timeout, missing global, or missing `kakao.maps`.
- Never log the full script URL because it contains the app key.

Official references:

- https://apis.map.kakao.com/web/guide/
- https://apis.map.kakao.com/web/documentation/

### Map Container Lifecycle

Kakao map instances should be created only after:

- the SDK promise resolves
- the map container element exists
- the container has stable dimensions

React lifecycle rules:

- Initialize in an effect after mount.
- Keep map, marker, and listener handles in refs.
- On prop changes, update center, markers, and selection without recreating the whole map when possible.
- On unmount, detach event listeners and remove marker/overlay references.
- Call a relayout-equivalent step when the container is shown after layout changes, if needed.

### Marker Rendering

For MVP marker rendering, prefer custom overlays or marker content that can preserve current taxon colors and labels.

MVP behavior:

- Render one marker per approved observation in public map views.
- Marker click calls `onSelectObservation`.
- Selected marker should remain visually distinct if `selectedObservationId` is provided.
- Marker label should preserve the current hover/focus information pattern where feasible.

Clustering:

- Defer clustering for 17B unless marker count becomes high enough to cause usability or performance issues.
- Kakao's clusterer library can be considered later with the same provider boundary.

### Upload Location Selection

Upload map click behavior must keep the existing form contract:

```ts
onChange({ lat, lng })
onLocationSelect(lat, lng)
```

Kakao click events should be converted into the app's `Coordinates` shape immediately. Do not store provider-specific objects in form state.

### Detail And Overview Maps

Read-only detail:

- Show a non-interactive or minimally interactive map centered on the observation coordinates.
- Keep the coordinate text display below the map.
- Keep static preview fallback when Kakao is unavailable.

Overview:

- Show all approved observations already supplied by the public repository.
- Do not change public repository visibility rules.
- Pending and rejected rows must remain hidden because data access stays behind approved-only repository reads.

### Responsive Behavior And Accessibility

Keep existing containers and layout dimensions. The Kakao map should fill the existing map surfaces instead of changing layout.

Fallback/accessibility:

- Retain static map fallback and existing no-map copy until Kakao is loaded.
- Keep coordinate text visible in detail and upload flows.
- Use button/label equivalents for marker interactions where possible.
- Do not rely on color alone; labels and titles should still identify observations.

### Quota And Operational Limits

Before public deployment:

- Confirm Kakao Developers app setup.
- Confirm local and deployed domains are registered.
- Confirm expected quota and billing behavior.
- Keep static fallback for quota or domain misconfiguration failures.

### Kakao SDK Type Handling

Do not add a new dependency for Kakao types in the MVP unless explicitly approved.

17B should use a small local type declaration or `unknown` plus narrowing for the minimal SDK surface:

- `kakao.maps.Map`
- `kakao.maps.LatLng`
- marker/custom overlay APIs selected in implementation
- event listener add/remove APIs
- `kakao.maps.load`

Avoid broad `any`.

## Options

### Option A: Lightweight Inline SDK Loader In `mapProvider.ts`

Description:

- Add env reading, script injection, and Kakao provider branching directly in `mapProvider.ts`.

Pros:

- Smallest number of files.
- Fastest first implementation.
- Easy to inspect in a narrow diff.

Cons:

- Mixes provider selection, SDK loading, and provider-specific behavior.
- Harder to test loader edge cases.
- Harder to keep UI and SDK concerns separate as features grow.

Implementation difficulty:

- Low initially.

Fallback stability:

- Acceptable if carefully written, but failure paths can become tangled.

TypeScript complexity:

- Low at first, but grows inside a shared provider file.

Future Naver/Leaflet expansion:

- Weak. Additional providers would make `mapProvider.ts` too broad.

Existing UI impact:

- Low if only `DesignMap` continues to render the selected provider.

### Option B: Dedicated Kakao Provider Module And SDK Loader Helper

Description:

- Add a small Kakao SDK loader helper and a provider-specific Kakao module behind the neutral map interface.
- Keep `mapProvider.ts` focused on provider selection and fallback policy.

Pros:

- Keeps SDK loading isolated.
- Keeps UI components independent of Kakao globals.
- Makes missing-env and load-failure fallback easy to reason about.
- Fits the existing provider-neutral structure and ADR 0002.
- Allows 17B to be implemented without broad UI rewrites.

Cons:

- Adds more files than Option A.
- Requires careful local typing for the Kakao SDK surface.
- Requires explicit lifecycle cleanup in provider components.

Implementation difficulty:

- Medium.

Fallback stability:

- Strong. Static fallback can remain the default path and the error path.

TypeScript complexity:

- Medium, contained in Kakao-specific files.

Future Naver/Leaflet expansion:

- Good. Other providers can follow the same module pattern later.

Existing UI impact:

- Low. Most UI can continue calling `DesignMap`, `StaticDesignMap`, and `DesignMarkerPicker` until wrappers are redirected.

### Option C: Expanded Map Abstraction For Kakao, Naver, Leaflet, And MapLibre

Description:

- Broaden the map abstraction now to model multiple future providers, capabilities, feature flags, and provider-specific fallbacks.

Pros:

- Strongest long-term extensibility.
- Can model provider capabilities explicitly.
- Useful if Naver/Leaflet/MapLibre implementation is imminent.

Cons:

- More abstraction than the MVP needs.
- Higher risk of redesigning existing map flows before the first real provider is proven.
- More TypeScript and lifecycle complexity.
- Slower path to a working Kakao MVP.

Implementation difficulty:

- High.

Fallback stability:

- Potentially strong, but only after more code is written and verified.

TypeScript complexity:

- High.

Future Naver/Leaflet expansion:

- Strongest, but premature for current scope.

Existing UI impact:

- Medium to high because existing wrappers and props may need broader changes.

## Recommendation

Use Option B: dedicated Kakao provider module plus SDK loader helper.

Rationale:

- The project already has provider-neutral map types and static components.
- Static fallback is a first-class requirement, not a temporary hack.
- Kakao SDK globals should stay behind `src/features/map/` and provider components.
- UI components should not call Kakao SDK APIs directly.
- Browser script loading avoids new package dependencies.
- Loader failure, missing env, invalid domain, and quota issues can all fall back to static map behavior.
- Existing taxon marker colors and calm academic map UI can be preserved with custom marker content.
- Option B leaves room for Naver or Leaflet later without designing a large abstraction now.

Recommended 17B shape:

- Keep `static` as the default and fallback provider.
- Enable Kakao only when `VITE_KAKAO_MAP_JAVASCRIPT_KEY` is present.
- If SDK loading fails, render static map surfaces.
- Keep current wrappers stable while routing through provider selection where practical.

## Expected 17B Implementation Files

Do not create these files in 17A. This is the expected 17B work list.

```text
src/features/map/kakaoMapLoader.ts
```

- Loads the Kakao Maps SDK script once.
- Uses `VITE_KAKAO_MAP_JAVASCRIPT_KEY`.
- Uses `autoload=false` and `kakao.maps.load`.
- Returns a promise for a minimal typed Kakao map namespace.
- Hides script URL/key from logs and errors.

```text
src/features/map/kakaoMapProvider.tsx
```

- Exports Kakao map components or an adapter matching `MapProviderAdapter`.
- Converts app `Coordinates` to Kakao `LatLng`.
- Handles map creation, markers, click events, and cleanup.

```text
src/features/map/mapProvider.ts
```

- Adds provider selection and fallback policy.
- Keeps static as default when env is absent or Kakao loading fails.

```text
src/features/map/mapTypes.ts
```

- Add only minimal capability or status types if needed.
- Avoid provider-specific Kakao types in shared app-facing props.

```text
src/components/map/KakaoMapCanvas.tsx
```

- Add only if the Kakao map needs a React component separate from provider module internals.
- Owns the container ref and lifecycle effect.

```text
src/components/DesignMap.tsx
```

- Update only if wrappers should route through the active provider.
- Preserve existing exports for compatibility.

```text
.env.example
```

- Already contains `VITE_KAKAO_MAP_JAVASCRIPT_KEY=`.
- Update only if the placeholder needs comments or naming changes.

```text
README.md
docs/architecture/next-session-handoff.md
```

- Document setup and next-session status after implementation.

## 17B Implementation Result

17B followed the Option B recommendation:

- Added `src/features/map/kakaoMapLoader.ts`.
- Added `src/features/map/kakaoMapProvider.tsx`.
- Connected provider selection in `src/features/map/mapProvider.ts`.
- Kept existing `DesignMap`, `StaticDesignMap`, and `DesignMarkerPicker` exports stable.
- Kept static fallback for missing `VITE_KAKAO_MAP_JAVASCRIPT_KEY` and SDK load failure.
- Did not add package dependencies.
- Did not call Kakao SDK APIs directly from general UI components.

Manual Kakao UI verification remains for 17C.

## Env And Config Policy

- Do not print `.env.local`.
- Do not commit `.env`, `.env.local`, `.env.production`, or real keys.
- `.env.example` may include `VITE_KAKAO_MAP_JAVASCRIPT_KEY=` only as a blank placeholder.
- `VITE_KAKAO_MAP_JAVASCRIPT_KEY` is browser-exposed and should be domain-restricted in Kakao Developers.
- Missing key means static fallback.
- Invalid key, unauthorized domain, load timeout, or SDK load failure means static fallback.
- Do not write real Kakao keys, registered domains, Supabase URLs, tokens, emails, or passwords into docs or source.

## Verification Plan For 17B/17C

Required scenarios:

- No Kakao env key: static fallback renders.
- Kakao env key present: SDK script loads and Kakao map renders.
- SDK load failure: static fallback renders without crashing.
- Observation markers render for approved observations.
- Taxon marker colors match existing `TaxonBadge`/`getTaxonColor` semantics.
- Marker click opens or selects the same observation flow as the static overview.
- Observation detail map renders read-only location.
- Upload location selection still writes `{ lat, lng }` into form state.
- Mobile width does not break map container layout.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.
- Console/log output does not expose Kakao keys, Supabase keys, tokens, emails, passwords, or `.env.local` contents.
- Static fallback remains available for API-key-free demos.

## Risks And Mitigations

Kakao SDK global type risk:

- Use a narrow local declaration or `unknown` plus narrowing.
- Keep provider-specific types out of shared app props.

Duplicate script loading:

- Use a module-level promise and script id.
- Reuse in-flight or completed loads.

Map container size and lifecycle:

- Initialize only after mount.
- Keep stable dimensions through existing containers.
- Trigger relayout when the map surface becomes visible after layout changes.

Latitude/longitude order:

- Keep app state as `{ lat, lng }`.
- Convert to Kakao `LatLng(lat, lng)` in one helper.
- Do not pass raw arrays around.

SDK load failure:

- Catch loader failure and render static fallback.
- Keep error messages non-sensitive.

Domain/referrer restriction:

- Document that local and deployed domains must be registered in Kakao Developers.
- Treat restriction failures as fallback conditions.

Quota/rate limit:

- Keep static fallback for outages or quota failures.
- Avoid loading optional libraries like clusterer until needed.

Accessibility/fallback:

- Keep coordinate text and labels.
- Preserve static fallback copy.
- Avoid requiring only visual map interaction for critical data review.

## Explicit Non-Scope

For 17A:

- Do not implement the Kakao SDK loader.
- Do not add script tags.
- Do not add Kakao provider files.
- Do not implement Naver, Leaflet, or MapLibre.
- Do not add dependencies.
- Do not change app UI layout, color, spacing, Korean copy, or design tone.
- Do not change Storage, Auth, admin, or repository visibility rules.
- Do not expose the admin route in `Navbar`.
- Do not add reject notes, audit logs, bulk approval, user management, spam/rate-limit/CAPTCHA, PWA, or app packaging.

## Next Steps

1. 17C: Run Kakao UI connection and manual verification.
2. 17D: Verify static fallback and public/admin/storage regressions.
3. 17E, if needed: Harden map UX, signed fallback states, and map operational checks.
