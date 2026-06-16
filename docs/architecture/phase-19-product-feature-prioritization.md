# Phase 19 Product Feature Prioritization

## Purpose And Scope

This document records the phase 19A product-feature prioritization decision.

19A is planning-only:

- compare likely next product features
- evaluate user value, implementation difficulty, regression risk, and architecture impact
- recommend one small 19B implementation target
- keep app code unchanged
- keep package files unchanged
- keep Supabase policy, RLS, Storage, and migration state unchanged

Implementation starts no earlier than 19B.

## Current Completed State

The project is now past the original design-only starter:

- Public observations can be read from either mock data or Supabase.
- Supabase public reads expose only approved observations.
- Public creates produce pending observations.
- Pending and rejected observations remain hidden from public list/detail.
- Hidden `/#admin` supports Supabase Auth login, admin role checks, pending review, approve, and reject.
- Supabase Storage image upload is implemented for Supabase mode.
- Storage uses a private `observation-images` bucket.
- The DB stores `image_path`, `image_mime_type`, and `image_size_bytes`.
- Signed, public, blob, preview, and data URLs are not stored in DB rows.
- Public and admin image display use runtime signed URLs.
- Public detail modal open refreshes the selected observation through the active repository, giving Supabase mode a fresh signed URL.
- Kakao Map provider is implemented behind the map provider boundary.
- Static map fallback remains available for missing key or SDK failure.
- Kakao normal-key, no-key, invalid-key, mock-mode, Supabase-mode, responsive, and logging regressions have passed.
- Storage operations documents cover monitoring, abuse thresholds, and cleanup automation design.

## Feature Candidates

### Candidate A: Observation List Filter And Search UX

Potential scope:

- Add date filters.
- Add location filter or location quick filter.
- Add image-present filter.
- Add sort improvements beyond latest/oldest.
- Keep taxon and text search behavior.

Why it matters:

- This improves the main public browsing workflow.
- It requires no schema change if filters use existing loaded observation fields.
- It can work identically in mock and Supabase modes because public repository output is already approved-only.

### Candidate B: Map And Observation List Coordination

Potential scope:

- Marker click selects list/detail.
- List hover or selection emphasizes marker.
- Optional map bounds filter candidate.

Why it matters:

- The Kakao provider is now real and verified.
- Connecting map and list would make spatial browsing more useful.

Boundary:

- Marker click already opens the observation detail flow from the map page.
- List-to-marker emphasis and bounds filtering require shared selection/bounds state and careful static/Kakao fallback regression checks.

### Candidate C: Upload UX Improvements

Potential scope:

- Clear image validation guidance.
- Clear location selection guidance.
- Submit progress state.
- Better storage/upload failure copy.
- Keep repository create and Storage helper boundaries unchanged.

Why it matters:

- Public upload is the main contribution path.
- The current flow works, but user-facing states are still minimal.

Boundary:

- Must not change public create from pending.
- Must not store preview/blob/data URLs in the DB.
- Must not call Supabase directly from UI components.

### Candidate D: Admin Review UX Improvements

Potential scope:

- Pending queue filters.
- Image-present indicator.
- Approve/reject confirmation.
- Review age indicator.

Why it matters:

- Admin review controls public data quality.
- Queue age and image presence help moderators triage.

Boundary:

- Must not add reject notes, audit logs, bulk approval, or user management unless that phase is explicitly approved.
- Must not weaken admin Auth/RLS boundaries.

### Candidate E: Reject Note And Audit Log Design

Potential scope:

- Design admin action history.
- Design rejected reason handling.
- Preserve public non-exposure for rejected rows.

Why it matters:

- It improves moderation accountability.

Boundary:

- This is a schema and policy design topic before implementation.
- It is not a small UI-only feature.

### Candidate F: Biodiversity Guide Content Expansion

Potential scope:

- Campus species sections.
- Taxon education content.
- Static content expansion only.

Why it matters:

- It improves educational value without touching Supabase, Storage, Auth, or Kakao logic.

Boundary:

- Requires content decisions and copy review.
- Product value depends on available campus biodiversity content.

### Candidate G: Storage Operations Next Step

Potential scope:

- Dry-run report refinement.
- Cleanup runbook refinement.
- Monitoring output template improvements.
- No delete automation yet.

Why it matters:

- It keeps operations safe as anonymous upload volume grows.

Boundary:

- It is operational hardening, not a public product feature.
- 18A through 18E already document the immediate MVP operating path.

## Candidate Comparison

| Candidate | User value | Difficulty | Regression risk | Data/RLS impact | UI change size | Verification difficulty | Phase fit | 19B ready |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: List filters/search | High for public browsing | Low to medium | Low | None if client-side | Small to medium | Low | Strong | Yes |
| B: Map/list coordination | High for spatial browsing | Medium | Medium | None if client-side | Medium | Medium | Strong, but touches recent map work | Yes, with narrow scope |
| C: Upload UX | High for contributors | Low to medium | Medium because submit flow is sensitive | None if display-only | Small | Medium | Strong | Yes |
| D: Admin review UX | High for moderators | Medium | Medium | None for UI-only indicators | Medium | Medium | Good | Yes, with strict scope |
| E: Reject note/audit log | Medium to high for governance | High | High | Likely schema/RLS changes | Medium | High | Design-first only | No for implementation |
| F: Guide content | Medium | Low | Low | None | Medium content work | Low | Depends on content availability | Yes, if content is ready |
| G: Storage ops next step | Operational value | Low to medium | Low | None if docs-only | None | Low | Not product-first | Not recommended now |

## Recommended Priority

### Priority 1: Candidate A, Observation List Filter And Search UX

Reasons:

- It improves the most common public browsing surface.
- It can be implemented using already-loaded approved observations.
- It does not require DB, RLS, Storage, Auth, or Kakao provider changes.
- It has a narrow rollback surface.
- It gives both mock and Supabase modes the same visible improvement.

### Priority 2: Candidate C, Upload UX Improvements

Reasons:

- Upload is the main contribution workflow.
- Better progress, validation, and failure copy would reduce confusion.
- It is valuable, but submit/storage behavior is security-sensitive, so it should follow after a lower-risk public browsing improvement.

### Priority 3: Candidate D, Admin Review UX Improvements

Reasons:

- Moderation quality matters for approved public data.
- Image-present and review-age indicators are useful without schema changes.
- It should remain narrower than reject notes, audit logs, bulk approval, or user management.

Candidate B remains a strong later option, but it should be split carefully because list-to-map state and map bounds filtering can increase regression risk across Kakao and static fallback surfaces.

## Recommended 19B Scope

Recommended 19B feature: Candidate A, public observation list filter/search UX improvement.

Minimum implementation scope:

- Add an image-present filter using `Observation.imageUrl`.
- Add a simple date sort option such as name/species alphabetical or location alphabetical, depending on the existing UI fit.
- Add a location filter or location search refinement only if it can reuse the current search/filter helper cleanly.
- Keep existing taxon filter and text search.
- Keep filtering client-side against the approved observations already returned by the active public repository.
- Preserve current card grid, Korean copy tone, spacing, and visual style.

Expected 19B files:

```text
src/utils/observationFilters.ts
```

- Extend filter and sort helpers with the approved 19B filter/sort fields.

```text
src/components/ObservationListPage.tsx
```

- Hold the new filter state and pass it to header/filter controls.

```text
src/components/observations/ObservationListHeader.tsx
```

- Add compact controls for the chosen filter/sort additions.

```text
src/components/observations/ObservationGrid.tsx
```

- Add an empty-state message only if needed.

```text
docs/architecture/next-session-handoff.md
README.md
AGENTS.md
```

- Update completion status after 19B if implementation proceeds.

Explicit 19B non-scope:

- No Supabase schema, RLS, policy, grant, or Storage changes.
- No pending/rejected public visibility changes.
- No admin UI changes.
- No map provider changes.
- No package additions.
- No large redesign.
- No server APIs.
- No reject note, audit log, bulk approval, CAPTCHA, rate limit, or cleanup automation.

19B verification plan:

- `npm.cmd run typecheck`
- `npm.cmd run build`
- `git diff --check`
- Mock mode public list filter/sort smoke.
- Supabase mode read-only smoke if local env is available.
- Confirm pending/rejected remain hidden publicly.
- Confirm no secret-like values are logged or committed.

## Risks And Boundaries

Preserve these boundaries in 19B and later phases:

- Public list/detail must remain approved-only.
- Public create must remain pending-only.
- Signed/public/blob/preview/data URLs must not be stored in DB rows.
- UI components must not call Supabase directly.
- Kakao provider and static fallback must remain stable.
- Admin route must stay hidden from `Navbar`.
- No package additions unless explicitly approved.
- Avoid broad refactors or layout redesign.

## Next Steps

1. Use 19B to implement a narrow public observation list filter/search UX improvement.
2. Use 19C to verify mock and Supabase modes, document the result, and decide whether map/list coordination or upload UX should follow.
3. Revisit Candidate C or D after 19B if no Storage cleanup or abuse thresholds are exceeded.
4. Start Candidate E only as a schema/RLS/admin-flow design phase, not as a quick UI change.
