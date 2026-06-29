# Taxonomy Upload UI Integration

Phase: 24E-3 - Upload UI Taxonomy Verification And Trusted RPC Create Integration

Status: implemented locally on `feature/phase-24e3-upload-taxonomy-ui`.
No push has been performed.

## Summary

The Upload UI now requires explicit scientific-name verification before submit.
The browser does not call GBIF directly and does not write taxonomy columns
directly. The UI calls `TaxonomyRepository`; the Supabase observation
repository calls the trusted PostgreSQL RPC
`create_observation_with_verified_taxonomy(...)`.

Existing legacy observations remain valid. Existing deployed Production UI is
unchanged until this branch is merged and deployed.

## UI State Machine

The Upload UI uses these states:

| State | Meaning | Submit |
| --- | --- | --- |
| `empty` | No scientific name input | blocked |
| `dirty` | Scientific name was entered or changed | blocked |
| `resolving` | Repository lookup is in progress | blocked |
| `resolved` | Accepted taxonomy is verified | allowed |
| `needsConfirmation` | Synonym or variant candidate needs explicit confirmation | blocked |
| `blocked` | Higher-rank, no-match, or unusable result | blocked |
| `error` | Timeout, rate-limit, upstream, malformed, or invalid result | blocked |

Rules:

- Lookup happens only when the user clicks `학명 확인` or presses Enter in the
  scientific-name input.
- Editing the scientific-name input after a successful result immediately
  invalidates the old result.
- Other form values and the selected image remain intact when lookup fails.
- The submit button is disabled until the state is `resolved`.
- Raw backend errors are not shown to the user.

## Displayed Classification

When resolved, the Upload UI displays:

- accepted scientific name
- reported scientific name when different
- broad project taxon
- match type
- source name
- lineage ranks: 계, 문, 강, 목, 과, 속, 종

Missing lineage ranks are shown as `정보 없음`. The UI does not invent Korean
taxonomy names and does not display source taxon keys.

## Confirmation Flow

For `needsConfirmation`, the UI shows the entered name and accepted candidate.
The user must explicitly click `이 학명으로 연결`.

The confirmation path calls:

```text
TaxonomyRepository.confirmScientificName(...)
```

The candidate key is used only in memory for the confirmation request and is
not shown in UI copy or documentation.

## Broad Taxon Behavior

Before verification, the existing broad taxon selector remains visible.

After verification:

- the broad taxon is derived from the taxonomy result
- the visible selector updates to the derived broad taxon
- the selector is locked to prevent conflict with the trusted result

If the scientific name changes, the taxonomy state returns to `dirty` and the
broad taxon must be recomputed by another explicit check.

## Repository And RPC Path

The repository contract now has:

```text
createObservationWithVerifiedTaxonomy(input)
```

Supabase mode:

- uploads the image first, if present
- calls `create_observation_with_verified_taxonomy(...)`
- passes only form content, the trusted `taxonId`, and image metadata
- does not pass observer id, status, role, verified timestamp, confidence, or
  arbitrary lineage from the browser
- maps the returned row through the existing observation mapper

Mock mode:

- creates a deterministic approved mock observation with taxonomy linkage
- does not call GBIF
- keeps tests independent of live services

Legacy `createObservation(input)` remains available for existing compatibility
but the Phase 24E-3 Upload UI uses the verified taxonomy path.

## Image Cleanup

The Supabase repository still uploads the image before the DB/RPC create step.

If the image upload succeeds but the trusted RPC create fails:

- the repository attempts to remove only the just-uploaded object
- cleanup is limited to repository-created `observations/<user>/<uuid>.<ext>`
  paths
- arbitrary user-supplied paths are not deleted
- cleanup failure does not hide the original create failure
- only safe log categories are used

This follows the Supabase Storage guidance that object deletion should use the
Storage API rather than SQL.

## Owner/Admin Edit Compatibility

Taxonomy re-resolution during edit is not implemented in this phase.

For taxonomy-linked observations:

- direct scientific-name edit is disabled
- direct broad-taxon edit is disabled
- other content edits remain available

Legacy observations with `taxon_id IS NULL` keep the existing edit behavior.
Admin edit uses the same consistency rule and does not silently bypass taxonomy
linkage.

## Tests And Verification

Automated coverage added:

- taxonomy UI state machine
- submit allowed only after `resolved`
- confirmation and blocked states prevent submit
- mock trusted taxonomy create stores deterministic linkage
- Supabase taxonomy create uses RPC, not direct table insert
- Supabase taxonomy create includes image cleanup on RPC failure
- taxonomy-linked edit locks scientific name and broad taxon

Browser automation was attempted but was unavailable in this Codex session due
to the in-app browser connector failing during setup. Local browser UI smoke is
therefore PARTIAL.

## Boundaries

Changed:

- Upload UI
- observation repository contract and implementations
- Supabase observation create path for verified taxonomy
- mock repository fixtures
- owner/admin edit form protection
- tests
- documentation

Not changed:

- migrations 0007 through 0011
- live DB schema
- RLS policies
- Edge Function source or deployment
- Storage policies
- Auth settings
- Admin routes
- Kakao settings
- Vercel configuration
- Production UI

## Manual Smoke Plan

After this branch is deployed to a safe Preview or tested locally with
Supabase configuration:

1. Sign in with an approved test user.
2. Open Upload.
3. Enter `Taraxacum officinale`.
4. Click `학명 확인`.
5. Confirm the result is resolved as `식물`.
6. Submit a no-image observation first.
7. Confirm public list/detail compatibility.
8. Try `Felis concolor` and confirm the synonym confirmation UI appears.
9. Try `Homo sapines` and confirm silent acceptance does not happen.
10. Try `Homo` and confirm submit remains blocked.
11. Change a verified scientific name and confirm submit becomes blocked until
    recheck.
12. Test a small image only after operator approval.

Do not create multiple public live smoke rows without approval.

## Remaining Risks

- Browser visual smoke is PARTIAL in this Codex session.
- Live Supabase upload through the new UI path still needs Preview/local
  authenticated smoke.
- Rich taxonomy display in public detail remains deferred.
- Legacy observations remain intentionally unlinked.

## Next Recommendation

```text
Phase 24F - Preview/Production smoke, public detail taxonomy display, and Phase 24 closeout
```

