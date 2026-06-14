# AGENTS.md

## Project identity

This repository is the design-only starting point for a biodiversity monitoring and eco-map web app for Kyungpook National University Daegu Campus.

The current project is intentionally a front-end design reference. It must preserve the visual language while the real service is rebuilt from a clean architecture.

The user wants to start from a blank implementation path while reusing the existing design. Do not reintroduce Kakao Map, Firebase, Firestore, Express, upload APIs, or any backend dependency unless the user explicitly asks for that step.

## Current stack

- Runtime: Vite + React + TypeScript
- Styling: Tailwind CSS v4 through `@tailwindcss/vite`
- Animation: `motion/react`
- Icons: `lucide-react`
- Current data source: static sample data in `src/data/sampleObservations.ts`
- Current map: static design-only components in `src/components/DesignMap.tsx` and `src/components/MapPreview.tsx`

## Setup commands

Use npm unless the user asks to migrate package managers.

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm audit --audit-level=high
```

The dev server is configured for:

```text
http://localhost:3000
```

## Non-negotiable boundaries

1. Do not add Kakao Map SDK, Naver Map SDK, Leaflet, MapLibre, Firebase, Supabase, Express, or server code until the user chooses that implementation phase.
2. Do not hardcode API keys, tokens, service-role keys, database URLs, or private configuration.
3. Do not create or commit `.env`, `.env.local`, `.env.production`, or other secret-bearing files.
4. If environment variables become necessary, add only `.env.example` with placeholder values.
5. Keep the existing design tone: minimal, academic, white/zinc palette, serif Korean headings, small uppercase metadata, subtle borders, calm motion.
6. Keep Korean UI copy unless the user asks for another language.
7. Avoid large rewrites. Prefer small, reviewable changes with a short explanation of what changed and why.
8. Before modifying code, inspect the relevant files and state the intended change plan.
9. After modifying code, run `npm run typecheck` and `npm run build`. Run `npm audit --audit-level=high` when dependencies change.
10. Do not replace the design-only map with a real map provider until the map-provider decision has been made.

## Repository structure

```text
src/App.tsx
  Current top-level page state and modal state. This file should become thinner over time.

src/types.ts
  Shared domain types. Expand this before adding persistence or API code.

src/index.css
  Global font imports, Tailwind import, theme font tokens, base styles.

src/components/Navbar.tsx
  Main navigation and project status counts.

src/components/Hero.tsx
  Landing hero design.

src/components/IntroPage.tsx
  Biodiversity guide/species overview design.

src/components/ObservationListPage.tsx
  Observation list, search, taxon filter, and sort design.

src/components/ObservationDetail.tsx
  Full-screen observation detail modal.

src/components/UploadMockPage.tsx
  Design-only upload form and image preview.

src/components/DesignMap.tsx
  Static visual map, marker projection, static location preview, design-only location picker.

src/components/MapPreview.tsx
  Full map-page composition around the static map design.

src/data/sampleObservations.ts
  Temporary design data. Keep as seed/mock data until a real data source is selected.

public/observations/*
  Static sample images used by the design.
```

## Target architecture blueprint

The long-term goal is a modular eco-map application. Build it in layers.

### Layer 1: Presentation

Purpose: preserve and improve the existing visual design.

Target folders:

```text
src/components/layout/
src/components/ui/
src/features/observations/components/
src/features/map/components/
src/features/upload/components/
```

Guidelines:

- Extract repeated UI patterns only when there is real repetition.
- Good candidates: `TaxonBadge`, `SearchInput`, `ObservationCard`, `PageShell`, `SectionHeader`, `EmptyState`, `ImageFrame`, `PrimaryButton`, `SecondaryButton`.
- Keep Tailwind utility classes close to components unless a token or primitive is used broadly.
- Do not introduce a component library unless the user requests it.

### Layer 2: Domain model

Purpose: define stable data contracts before APIs are added.

Start by evolving `src/types.ts` into explicit domain types.

Suggested shape:

```ts
export type Taxon = '식물' | '포유류' | '조류' | '곤충' | '양서/파충류' | '균류' | '기타';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Observation {
  id: string;
  name: string;
  scientificName?: string;
  taxon: Taxon;
  locationName: string;
  observedAt: string;
  description?: string;
  coords: Coordinates;
  imageUrl?: string;
  status: 'sample' | 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}
```

Migration note: the current `location` and `date` fields can remain temporarily, but new implementation work should move toward `locationName` and `observedAt`.

### Layer 3: Data access

Purpose: make the UI independent from the eventual database.

Target folder:

```text
src/features/observations/api/
```

Start with a mock repository:

```ts
export interface ObservationRepository {
  listObservations(): Promise<Observation[]>;
  getObservation(id: string): Promise<Observation | null>;
  createObservation(input: CreateObservationInput): Promise<Observation>;
}
```

Initial implementation:

```text
mockObservationRepository.ts
```

Future implementations may be:

```text
supabaseObservationRepository.ts
firebaseObservationRepository.ts
localJsonObservationRepository.ts
```

Do not add those future implementations until the user chooses the backend.

### Layer 4: Map provider abstraction

Purpose: avoid locking the project to Kakao Map or any other provider too early.

Target folder:

```text
src/features/map/
```

Recommended structure:

```text
src/features/map/components/EcoMap.tsx
src/features/map/components/StaticEcoMap.tsx
src/features/map/components/LocationPicker.tsx
src/features/map/mapTypes.ts
src/features/map/mapProvider.ts
```

Keep the current static design as the default provider:

```text
StaticEcoMap = current DesignMap behavior
```

Only when the user chooses a real provider, add one implementation:

```text
KakaoEcoMap.tsx
NaverEcoMap.tsx
LeafletEcoMap.tsx
MapLibreEcoMap.tsx
```

Real map-provider rules:

- Load SDKs from a single map-provider module.
- Store public client keys in environment variables only.
- Add `.env.example` with placeholder names.
- Show graceful error states when the map script fails.
- Keep a static fallback map for development, testing, and API-key-free demos.

### Layer 5: Routing and page state

Current `App.tsx` uses string page state. That is acceptable for the design-only phase.

Before production, choose one:

1. Keep simple state routing for a small presentation/demo project.
2. Add React Router if the app needs shareable page URLs.
3. Move to Next.js only if server rendering, file routing, metadata, or deployment needs justify the migration.

Do not migrate frameworks without explicit user approval.

### Layer 6: Submissions and admin

Do not implement this until the data source is chosen.

Target concepts:

```text
Observation submission
Admin approval queue
Edit/delete observation
Media upload
Status transitions
```

Suggested status flow:

```text
draft -> pending -> approved -> rejected
```

Public users should not be able to delete or modify approved data unless authentication and authorization exist.

### Layer 7: App expansion

Default route: web first, then PWA, then Capacitor only if native features are needed.

App-readiness checks:

- Mobile navigation
- Bottom-sheet detail panel for map markers
- Safe-area spacing
- Touch target size
- Image compression before upload
- Location permission UX
- Offline fallback for sample/map data

Do not create a separate React Native app unless the user explicitly chooses that direction.

## Recommended implementation phases

### Phase 0: Design preservation

Goal: keep the uploaded design safe and API-free.

Tasks:

- Keep static data in `sampleObservations.ts`.
- Keep map as static design.
- Confirm `npm run typecheck` and `npm run build`.

### Phase 1: Project structure cleanup

Goal: make the code easier to grow without changing behavior.

Tasks:

- Split `App.tsx` into a small shell and page components.
- Move page-specific logic into feature folders.
- Extract safe reusable UI primitives.
- Keep visual output nearly identical.

### Phase 2: Domain model cleanup

Goal: prepare for real data without adding real data storage.

Tasks:

- Normalize observation fields.
- Add `Taxon`, `Coordinates`, `ObservationStatus`, and create-input types.
- Add mock repository functions.
- Keep seed data compatible.

### Phase 3: Map abstraction

Goal: make the map provider swappable.

Tasks:

- Rename static map components into map feature components.
- Define provider-neutral marker and picker props.
- Keep the static map as the default.

### Phase 4: Backend decision

Goal: choose one persistence path.

Options to present to the user:

- Supabase/Postgres for structured spatial data and admin workflows.
- Firebase for quick student-project deployment and simple auth/storage.
- Local JSON/static build for presentation-only use.

Do not implement any option before the user chooses.

### Phase 5: Production MVP

Goal: real map, real data, safe submission flow.

Tasks:

- Add selected map provider.
- Add selected data repository.
- Add media storage.
- Add submission form persistence.
- Add admin approval flow.
- Add validation and error states.

### Phase 6: PWA/app packaging

Goal: mobile-friendly app experience.

Tasks:

- Add manifest and service worker if PWA is chosen.
- Add offline fallback if useful.
- Add Capacitor only after PWA behavior is stable.

## Coding style

- Use TypeScript strict mode.
- Prefer explicit prop interfaces for exported components.
- Keep domain types in `src/types.ts` until the feature folders justify splitting them.
- Prefer `useMemo` only for non-trivial derived data or expensive calculations.
- Avoid `any`; use `unknown` plus narrowing when necessary.
- Use semantic HTML where possible.
- Buttons that perform UI actions must use `type="button"`.
- Images must have meaningful `alt` text or an empty alt if purely decorative.
- Keep Korean labels natural and concise.
- Avoid adding global CSS except for fonts, theme tokens, and true base styles.

## Visual design rules

- Preserve the calm academic mood.
- Prefer white, zinc, black, muted emerald, blue, purple, amber, teal, and orange accents.
- Keep large serif Korean headings.
- Keep small uppercase English metadata for scientific/catalog feeling.
- Prefer subtle borders and light shadows over heavy cards.
- Preserve spacious layouts on desktop.
- On mobile, prioritize readability and touch comfort over dense information.

## Map design rules

- Static map components are not fake failures; they are intentional design placeholders.
- Do not remove the `No Map API`/design-only messaging unless a real provider is implemented.
- Marker colors should remain taxon-based.
- If the map becomes real, keep the same marker, legend, and detail-panel visual language.
- If provider loading fails, show a graceful fallback rather than an alert.

## Data and privacy rules

- Treat submitted observation data as potentially public.
- Do not store private contact information unless the user explicitly defines a privacy policy and purpose.
- Do not store original large base64 images in database documents.
- Future image uploads should use object storage and save only URLs/metadata in the database.
- Strip or avoid unnecessary EXIF/location metadata unless the user explicitly wants it.

## Accessibility checklist

Before finishing UI work, check:

- Keyboard access for navigation, modal close, marker buttons, filters, and forms.
- Visible focus states.
- Meaningful button labels and `aria-label` where text is not visible.
- Modal close behavior.
- Sufficient color contrast for small labels.
- Mobile tap targets around filters, nav buttons, and map markers.

## Review checklist before final response

For every code-changing task, report:

- Files changed.
- What behavior changed.
- Commands run and whether they passed.
- Any remaining risks or TODOs.

Minimum verification after code changes:

```bash
npm run typecheck
npm run build
```

When dependency changes are made:

```bash
npm audit --audit-level=high
```

## Useful Codex prompts for this project

### Architecture review only

```text
이 프로젝트는 생태지도 웹앱의 디자인 레퍼런스입니다. Kakao Map, Firebase, Express 서버, 실제 업로드 API는 의도적으로 제거되어 있습니다.
코드를 수정하지 말고 현재 구조를 분석한 뒤, 디자인을 유지하면서 실제 구현으로 확장하기 위한 작은 단계의 계획을 제안해 주세요.
```

### Safe refactor

```text
디자인과 동작을 최대한 유지하면서 App.tsx를 얇게 만들고, 페이지 단위 컴포넌트와 공통 UI 후보를 정리해 주세요.
외부 지도 SDK, Firebase, Supabase, Express, 서버 코드는 추가하지 마세요.
수정 후 npm run typecheck와 npm run build를 실행해 주세요.
```

### Data model cleanup

```text
현재 Observation 타입과 sampleObservations를 실제 구현에 맞게 정리해 주세요.
아직 DB/API는 추가하지 말고, mock repository와 타입만 준비해 주세요.
기존 화면 디자인은 깨지지 않게 호환 레이어를 유지해 주세요.
```

### Map abstraction without real API

```text
현재 DesignMap/MapPreview를 실제 지도 SDK를 나중에 붙이기 쉬운 구조로 정리해 주세요.
단, 지금은 API 키 없이 동작하는 static map provider만 유지하세요.
```
