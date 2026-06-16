# Phase 6 - Page Component Splits

## Status

Completed.

**한국어:** 완료된 phase입니다.

## Goal

Split large page components into smaller feature-specific components while preserving the existing UI.

**한국어:** 큰 page 컴포넌트를 기능별 작은 컴포넌트로 나누면서 기존 UI를 유지했습니다.

## Main Work

- Phase 6A split `UploadMockPage` into upload-specific components.
- Phase 6B split `ObservationListPage` into observation list components.
- Phase 6C split `ObservationDetail` modal into detail components.
- Phase 6D split `IntroPage` biodiversity guide into intro components.

**한국어:** 업로드, 관찰 목록, 관찰 상세 modal, 생물다양성 guide 화면을 각각 전용 하위 컴포넌트로 분리했습니다.

## Key Files

- `src/components/UploadMockPage.tsx`
- `src/components/upload/UploadFormActions.tsx`
- `src/components/upload/UploadImagePicker.tsx`
- `src/components/upload/UploadLocationSection.tsx`
- `src/components/upload/UploadObservationFields.tsx`
- `src/components/ObservationListPage.tsx`
- `src/components/observations/ObservationCard.tsx`
- `src/components/observations/ObservationGrid.tsx`
- `src/components/observations/ObservationListHeader.tsx`
- `src/components/observations/ObservationTaxonFilter.tsx`
- `src/components/ObservationDetail.tsx`
- `src/components/observations/detail/ObservationDetailHeader.tsx`
- `src/components/observations/detail/ObservationDetailImage.tsx`
- `src/components/observations/detail/ObservationDetailInfo.tsx`
- `src/components/observations/detail/ObservationDetailLocation.tsx`
- `src/components/IntroPage.tsx`
- `src/components/intro/IntroPageHeader.tsx`
- `src/components/intro/IntroTaxonFilter.tsx`
- `src/components/intro/IntroToolbar.tsx`
- `src/components/intro/SpeciesCard.tsx`
- `src/components/intro/SpeciesGrid.tsx`

**한국어:** upload, observations, observations/detail, intro 하위 컴포넌트들이 핵심 변경 파일입니다.

## Verification

- Verification commands are not explicitly recorded for this phase.
- Later public-flow and build checks passed in subsequent phases.

**한국어:** 이 phase 자체의 검증 명령은 기록되어 있지 않지만, 이후 public flow와 build 검증이 통과했습니다.

## Remaining Risks / Follow-ups

- No phase-specific follow-up is explicitly recorded.

**한국어:** 이 phase에 특화된 후속 작업은 기록되어 있지 않습니다.

## Linked Docs

- `AGENTS.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** 현재 요약은 AGENTS와 handoff 문서를 근거로 합니다.

## Notes

- The phase was a refactor phase and should be interpreted as behavior-preserving unless later docs say otherwise.

**한국어:** 이 phase는 동작 보존 refactor로 해석해야 하며, 이후 문서가 별도로 언급하지 않는 한 기능 변경 phase가 아닙니다.
