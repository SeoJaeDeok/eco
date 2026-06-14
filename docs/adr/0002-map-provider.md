# ADR 0002: Map Provider

## Status

Proposed.

## Context

The project currently uses a static design-only map. There is no real map SDK, provider loader, API key, script tag, geocoding, clustering, or provider-specific implementation.

The current map structure already separates static map UI from provider-neutral map concepts:

- `src/features/map/mapTypes.ts` contains map-related types.
- `src/features/map/mapProjection.ts` contains static projection helpers.
- `src/features/map/mapProvider.ts` currently selects only the static provider.
- `src/components/map/*` contains static map UI.
- `src/components/DesignMap.tsx` is a compatibility wrapper for existing imports.

The future real provider should support observation markers, category/taxon styling, marker selection, and map-click location picking while preserving the existing visual language and static fallback.

## Decision

Use Kakao Map as the first-choice real map provider for the production MVP.

Use Naver Map as the second-choice provider if Kakao account, domain, quota, or project constraints make Kakao unsuitable.

Keep Leaflet and MapLibre as alternatives, but do not choose them first because tile/style provider selection and Korea-specific map quality would become separate project decisions.

For the first MVP, implement only:

- Coordinate-based observation markers.
- Marker click selection.
- Map click location picking for submissions.
- Static fallback when the provider cannot load or is not configured.

Defer address search, reverse geocoding, clustering, directions, and advanced spatial features.

This is a design decision only. Do not add Kakao/Naver/Leaflet/MapLibre dependencies, SDK loaders, environment files, script tags, or implementation code until the implementation phase is explicitly approved.

## Options Considered

### Kakao Map

Pros:

- Strong Korea map quality and familiar local ecosystem.
- Good fit for Kyungpook National University Daegu Campus context.
- Coordinates can map directly to observation markers.
- Custom marker and overlay patterns can preserve the current taxon marker visual language.
- Future expansion can include place/address search if needed.

Cons:

- Requires Kakao Developers app setup, JavaScript key management, and registered domains.
- Local and deployed domains must be configured correctly.
- Quotas and billing behavior must be understood before public deployment.
- SDK loading and failure states must be handled carefully.

### Naver Map

Pros:

- Strong Korea map quality.
- Good second choice for coordinate markers and campus-scale maps.
- Naver Cloud console can make usage and service URL configuration explicit.
- Suitable for future web/PWA expansion.

Cons:

- Requires Naver Cloud setup, Maps subscription, client key configuration, and service URL registration.
- Operational setup may be heavier than needed for the first student MVP.
- Provider-specific APIs still need an adapter layer.

### Leaflet

Pros:

- Lightweight open-source library.
- Good for simple markers, popups, and map-click interactions.
- Provider-agnostic and easy to wrap behind an adapter.

Cons:

- Requires a tile provider decision for real map tiles.
- Korea map detail and campus context depend on the selected tile source.
- Tile usage policy, attribution, and production limits must be handled separately.

### MapLibre

Pros:

- Open-source WebGL map library.
- Strong for vector tiles, custom styles, and larger geospatial datasets.
- Can support future app/native directions through related ecosystem tools.

Cons:

- Requires a style and tile provider decision.
- More complex than needed for the first MVP.
- Korea map quality depends on the chosen data source.
- Styling and tile operations can become a separate infrastructure project.

## Consequences

- The active app remains static until a real map implementation phase is approved.
- The first implementation should define provider-neutral props before writing Kakao-specific code.
- `StaticEcoMap` and the `No Map API` design-only flow should remain available as fallback.
- Provider-specific SDK loading should live behind a single map provider module.
- UI components should depend on neutral map props, not directly on Kakao or Naver globals.
- Address search, reverse geocoding, and clustering are intentionally out of the first MVP.

## Security Notes

- Manage API keys only through environment variables.
- Do not hardcode map keys in source files.
- Do not commit `.env`, `.env.local`, `.env.production`, or real secrets.
- Add only `.env.example` placeholders when implementation begins.
- Restrict map keys to approved local and deployed domains when the provider supports it.
- Keep a static fallback for API-key-free demos and provider loading failures.

## Environment Variables

When Kakao implementation begins, the likely frontend variable is:

```text
VITE_KAKAO_MAP_JAVASCRIPT_KEY=
```

If Naver is chosen instead, add the Naver client key variables only after that decision is made.

These names should appear only as placeholders in `.env.example`. Real values must remain in local or deployment environment configuration.

## Files Likely To Change

- `src/features/map/mapTypes.ts`
- `src/features/map/mapProvider.ts`
- `src/components/map/StaticEcoMap.tsx`
- `src/components/DesignMap.tsx`
- `src/components/MapPreview.tsx`
- `src/components/MapPage.tsx`
- `src/components/upload/UploadLocationSection.tsx`
- `.env.example`

Provider-specific files may be added later only after the implementation phase is approved.

## Open Questions

- Should Kakao Map be confirmed as the provider before schema work starts?
- Which local and deployed domains will be registered for the API key?
- Should the first real map support only campus bounds?
- Should map click coordinates be enough, or should address/reverse geocoding be added later?
- How many markers are expected before clustering becomes necessary?
- Should marker selection open the existing modal or a map-specific detail panel?
- Should a PWA build require offline static map fallback?

## Next Steps

1. Confirm Kakao Map as the first real provider.
2. Define provider-neutral `EcoMapProps` and `EcoLocationPickerProps`.
3. Keep `StaticEcoMap` working against the same neutral props.
4. Add `.env.example` placeholders only after implementation is approved.
5. Add a single Kakao SDK loader module.
6. Add a Kakao map component for coordinate markers and marker selection.
7. Add a Kakao location picker for map-click coordinate selection.
8. Preserve static fallback for missing keys or SDK load failures.
