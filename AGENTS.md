# AGENTS.md

## Project Identity

This repository is the design-only starter for a biodiversity monitoring and eco-map web app for Kyungpook National University Daegu Campus.

The current app is intentionally a static/mock front-end reference. It has no real map provider, no real database, no server, no authentication, no persistence, and no real upload pipeline. Preserving the existing visual design and Korean UI copy is the first priority until the user explicitly chooses an implementation phase.

Do not reintroduce Kakao Map, Naver Map, Leaflet, MapLibre, Firebase, Supabase, Express, server APIs, local persistence, upload APIs, image storage, or auth unless the user explicitly requests that phase.

## Current Stack

- Runtime/build: Vite + React + TypeScript
- Styling: Tailwind CSS v4 through `@tailwindcss/vite`
- Animation: `motion/react`
- Icons: `lucide-react`
- Current data source: static sample data in `src/data/sampleObservations.ts`
- Current map: static design-only components through `src/components/DesignMap.tsx`, `src/components/MapPreview.tsx`, `src/components/map/*`, and `src/features/map/*`
- Current repository: mock observation repository in `src/repositories/mockObservationRepository.ts`
- No real map SDK/provider
- No real DB
- No server code in the active app
- No real file upload or image storage

## Setup And Verification

Use npm unless the user explicitly asks to migrate package managers.

On Windows PowerShell, prefer `npm.cmd` because `npm.ps1` may be blocked by execution policy.

```bash
npm.cmd ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
```

The dev server is configured for:

```text
http://localhost:3000
```

Run these after code changes:

```bash
npm.cmd run typecheck
npm.cmd run build
```

Run `npm audit --audit-level=high` only when dependencies change.

## Non-Negotiable Boundaries

1. Do not add Kakao Map SDK before explicit user approval.
2. Do not add Naver Map SDK before explicit user approval.
3. Do not add Leaflet or MapLibre before explicit user approval.
4. Do not add Firebase, Supabase, Express, server APIs, or backend code before explicit user approval.
5. Do not add `localStorage`, IndexedDB, or other persistence before explicit user approval.
6. Do not add real file upload, image storage, media APIs, or storage buckets before explicit user approval.
7. Do not add authentication or authorization before explicit user approval.
8. Do not add new dependencies unless the user explicitly approves the dependency change.
9. Do not hardcode API keys, tokens, service-role keys, database URLs, or private configuration.
10. Do not create or commit `.env`, `.env.local`, `.env.production`, or other secret-bearing files.
11. If environment variables become necessary, add only `.env.example` with placeholder values.
12. Do not change UI design, Korean copy, colors, spacing, layout, animations, or behavior unless the user explicitly asks.
13. Do not replace the static design-only map with a real map provider until the provider decision has been made.
14. Do not mix feature work with refactoring. Keep changes small and reviewable.
15. Do not make large folder moves, framework migrations, or barrel `index.ts` sweeps without explicit approval.
16. Do not modify `package.json` or `package-lock.json` unless there is a clear, user-approved reason.

## Current Source Structure

```text
src/App.tsx
  Small app shell: page state, selected observation modal state, repository read, Navbar, routes.

src/components/AppRoutes.tsx
  Simple state-based route switch. No React Router yet.

src/components/Hero.tsx
  Landing/hero section. Treat as a distinct design surface, not a generic PageHeader.

src/components/Navbar.tsx
  Main navigation and mobile menu. Not yet split; refactor only as a dedicated step.

src/components/IntroPage.tsx
  Biodiversity guide page state and species grouping/filtering composition.

src/components/ObservationListPage.tsx
  Observation list state, filtering/sorting composition, and card selection wiring.

src/components/ObservationDetail.tsx
  Full-screen observation detail modal wrapper and detail component composition.

src/components/UploadMockPage.tsx
  Design-only upload form state and mock submit alert. No persistence.

src/components/DesignMap.tsx
  Compatibility wrapper for static map, static position preview, and static location picker.

src/components/MapPreview.tsx
  Full map-page composition around the static map design and design-only messaging.

src/components/ui/
  Small reusable UI primitives only:
  Button, ImageFrame, PageHeader, SearchInput, TaxonFilterButton.

src/components/intro/
  IntroPage-only UI:
  IntroPageHeader, IntroToolbar, IntroTaxonFilter, SpeciesCard, SpeciesGrid.

src/components/observations/
  Observation list UI:
  ObservationCard, ObservationGrid, ObservationListHeader, ObservationTaxonFilter.

src/components/observations/detail/
  Observation detail modal UI:
  ObservationDetailHeader, ObservationDetailImage, ObservationDetailInfo, ObservationDetailLocation.

src/components/upload/
  Upload mock page UI:
  UploadFormActions, UploadImagePicker, UploadLocationSection, UploadObservationFields.

src/components/map/
  Static design-only map UI:
  StaticEcoMap, StaticLocationPicker, StaticPositionPreview, MapLegend, MapNoticePanel, StaticMapDecor.

src/features/map/
  Provider-neutral map types and static projection logic:
  mapTypes, mapProjection, mapProvider.
  Only the static provider is allowed in the current phase.

src/features/upload/
  Upload mock form helpers:
  default form values, image preview helper, form-to-create-input conversion.

src/repositories/
  Data access layer:
  ObservationRepository interface and mockObservationRepository.
  Future real implementations must be added only after backend selection.

src/utils/
  UI-independent helpers:
  observationFilters, observationStats, observationValidation.

src/constants/
  Shared constants:
  taxon list, taxon filter values, taxon style/color mapping.

src/data/
  Static sample data only:
  sampleObservations.ts.

src/types.ts
  Shared domain types:
  Taxon, Coordinates, Observation, ObservationStatus, CreateObservationInput,
  CreateObservationFormValues, PageId.

public/observations/
  Static sample images used by the design.

before/
  Legacy/reference material only. It may contain old Firebase/Kakao/server artifacts.
  Do not copy patterns from this folder into the active app without explicit user approval.
```

## Domain And Data Rules

- Keep `Taxon`, `Coordinates`, and shared observation contracts in `src/types.ts` unless a dedicated domain split is explicitly planned.
- Keep taxon lists and taxon color/style mapping in `src/constants/taxon.ts`.
- Keep current `Observation.location` and `Observation.date` fields until a dedicated migration step. The future direction may be `locationName` and `observedAt`, but do not rename them casually.
- `Observation.isFixed` and sample/mock compatibility fields should not be removed without a dedicated cleanup step.
- Keep sample observations in `src/data/sampleObservations.ts`.
- UI should read observation data through the mock repository or existing selectors/helpers, not from a new API.
- Do not mutate sample observations for mock create behavior unless the user asks for a persistence simulation.
- Treat submitted observation data as potentially public. Do not store private contact information without a defined privacy policy and purpose.
- Future image uploads should use object storage and save only URLs/metadata in a database. Do not store large base64 images in database documents.

## Map Rules

- Static map components are intentional design placeholders, not errors.
- Keep `No Map API` / design-only messaging until a real provider is implemented.
- Marker colors must remain taxon-based.
- Keep the static fallback design available even after a future real provider is selected.
- Provider-neutral types and projection logic belong in `src/features/map/`.
- Static map UI belongs in `src/components/map/`.
- `src/components/DesignMap.tsx` is a compatibility wrapper. Do not remove it casually.
- Do not add SDK loaders, API keys, script tags, environment variables, or provider implementation files until the user chooses a provider.

## UI And Design Rules

- Preserve the calm academic visual language.
- Preserve Korean UI copy unless the user asks for another language.
- Preserve serif Korean headings, small uppercase metadata, subtle borders, light shadows, white/zinc palette, and muted accent colors.
- Do not change spacing, layout, color, typography, button labels, placeholder text, or animation timing during refactors.
- Keep Tailwind utility classes close to the component unless a pattern is genuinely reusable.
- Use existing reusable primitives in `src/components/ui/` only when they preserve visual output.
- Do not over-abstract. Extract repeated UI only when it reduces real duplication without changing behavior.
- Do not add a component library unless the user asks.

## Working Style

- Before modifying code, inspect relevant files and state a short plan with expected files.
- Work in small, reviewable steps.
- Keep refactors separate from feature work.
- Preserve existing import compatibility where wrappers already exist.
- Avoid large rewrites and broad folder moves.
- Avoid adding barrel files unless the user asks for that cleanup.
- Use TypeScript strict mode and explicit prop interfaces for exported components.
- Avoid `any`; prefer concrete types or `unknown` plus narrowing.
- Buttons that perform UI actions must use `type="button"` unless they are intentionally submit/reset buttons.
- Images must have meaningful `alt` text or empty alt if purely decorative.
- Add comments sparingly, only when they clarify non-obvious code.
- Use `rg`/`rg --files` for searches when available.

## Git And Lockfile Hygiene

- The checkpoint for the design-only refactor through 8A is:

```text
bd83cec chore: checkpoint design-only refactor through 8A
tag: design-only-refactor-8A
```

- Do not commit `node_modules`, `dist`, `.env`, `.env.local`, or secret-bearing files.
- `package-lock.json` should resolve public packages through `https://registry.npmjs.org/`.
- If `npm ci` fails with `EPERM` on Windows, check for a running dev server or locked native module before editing the lockfile.
- Do not change dependency versions or `lockfileVersion` unless the user explicitly approves and the reason is documented.

## Completed Refactor Phases

- Phase 1: `App.tsx` thinned and page routing/page state moved into `AppRoutes`/page components.
- Phase 2: `Taxon`, taxon constants/style mapping, and `TaxonBadge` organized.
- Phase 3: Observation repository interface and mock repository structure added.
- Phase 4: Static map layer split into provider-neutral map types/projection and static map components.
- Phase 5: `CreateObservationInput`, upload form values, upload helpers, and validation helper prepared.
- Phase 6A: `UploadMockPage` split into upload-specific components.
- Phase 6B: `ObservationListPage` split into observation list components.
- Phase 6C: `ObservationDetail` modal split into detail components.
- Phase 6D: `IntroPage` biodiversity guide split into intro components.
- Phase 7A: `SearchInput` common UI component added and minimally applied.
- Phase 7B: `ImageFrame` common UI component added and minimally applied.
- Phase 7C: `Button` common UI component added and minimally applied to simple CTA buttons.
- Phase 7D: `TaxonFilterButton` common UI component added and minimally applied.
- Phase 7E: `PageHeader` common UI component added and minimally applied.
- Phase 8A: Structure check, lockfile registry check, `npm ci`, `typecheck`, and `build` baseline completed.

## Recommended Next Steps

- Update `README.md` to match the design-only architecture and current commands.
- Write an architecture decision note before choosing a backend.
- Write an architecture decision note before choosing a real map provider.
- Review whether `Navbar.tsx` should be split in a dedicated navigation refactor.
- Review whether `Hero.tsx` should remain a standalone landing section or be split into smaller presentation pieces.
- Decide on backend path only when ready:
  Supabase/Postgres, Firebase, or static/local JSON.
- Decide on map provider only when ready:
  Kakao, Naver, Leaflet, MapLibre, or continued static-only.
- Do not implement production submission/admin/media/auth flows until the data source and privacy model are chosen.

## Review Checklist Before Final Response

For every code-changing task, report:

- Files changed
- What changed and why
- Whether UI behavior changed
- Commands run and pass/fail results
- Any remaining risks or TODOs

For documentation-only tasks, report:

- Files changed
- Main sections updated
- Whether app code or package files changed
- Whether verification commands were run
