# Phase 19 - Public Observation List Filter/Search UX

## Status

- Status: Verified
- Source basis: project docs, handoff notes, and commit history

**한국어:** Phase 19는 기능 우선순위 결정, public observation list 필터/검색 UX 구현, 회귀 검증까지 완료된 verified phase입니다.

## Goal

- Improve the public approved observation list with small client-side filter, search, sort, count, and empty-state UX improvements.
- Preserve approved-only public reads, pending/rejected public non-exposure, and existing Supabase/Storage/Kakao boundaries.

**한국어:** public approved observation list에서 이미 로드된 관찰 데이터만 대상으로 검색, 필터, 정렬, 결과 수, empty state를 개선했습니다. pending/rejected public 미노출과 기존 Supabase/Storage/Kakao 경계는 유지했습니다.

## Main Work

- 19A compared next product feature candidates and selected public observation list filter/search UX as the 19B target.
- 19B implemented client-side text search over observation name, scientific name, location, and description.
- 19B preserved the existing taxon filter and taxon badge/color behavior.
- 19B added image-present filtering for all, with-image, and without-image states.
- 19B added newest, oldest, and observation-name sorting.
- 19B added result count and Korean empty-state copy for no matching public observations.
- 19B moved public list filter/sort behavior into pure helper logic.
- 19C verified mock and Supabase mode regression behavior after the 19B implementation.

**한국어:** 19A에서는 다음 제품 기능 후보를 비교해 public observation list 필터/검색 UX를 19B 대상으로 정했습니다. 19B에서는 텍스트 검색, taxon filter 유지, 이미지 있음/없음 필터, 최신순/오래된순/관찰명순 정렬, 결과 수, empty state, helper 분리를 구현했습니다. 19C에서는 mock mode와 Supabase mode에서 회귀 검증을 완료했습니다.

## Key Files

- `src/utils/observationFilters.ts`
- `src/components/ObservationListPage.tsx`
- `src/components/observations/ObservationListHeader.tsx`
- `src/components/observations/ObservationGrid.tsx`
- `docs/architecture/phase-19-product-feature-prioritization.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** 핵심 변경 파일은 public list 필터/정렬 helper와 observation list UI 컴포넌트이며, 설계와 검증 결과는 Phase 19 우선순위 문서와 handoff 문서에 기록되어 있습니다.

## Verification

- `npm.cmd run typecheck`: pass
- `npm.cmd run build`: pass
- `git diff --check`: pass
- Mock/no-key browser smoke: pass
- Supabase/no-key browser smoke: pass
- Supabase read-only public invariant check: pass
- Detail modal regression: pass
- Static map fallback regression: pass
- Mobile-width layout check: pass
- Secret-like browser console/log pattern check: pass

Recorded 19C details:

- Mock/no-key browser smoke passed for default newest ordering, result count, text search over name/scientific name/location/description, case/space-tolerant search, taxon filtering, image-present filtering, newest/oldest/name sorting, combined filters, empty state, detail modal, static map fallback, mobile width, runtime console errors, and secret-like console/log patterns.
- Supabase read-only check saw 11 approved rows, 1 approved row with `image_path`, 0 URL-like `image_url` values, 0 pending/rejected rows visible, and no query errors.
- Supabase/no-key browser smoke passed for approved public list render, result count, name search, empty state, image-present filtering, detail modal image display, static map fallback, mobile width, runtime console errors, and secret-like console/log patterns.
- Browser resource logs contained one non-secret resource load error during each mock/Supabase run, but no runtime console errors and no secret-like patterns.
- No app code, package files, Supabase migration/policy files, Kakao provider files, Storage/Auth/Admin flows, or public visibility rules were changed during 19C.

**한국어:** 19C에서 typecheck, build, diff check가 통과했고, mock/no-key와 Supabase/no-key 브라우저 smoke가 통과했습니다. Supabase read-only 확인에서는 approved row만 보였고 pending/rejected row는 public에서 보이지 않았으며, URL-like `image_url` 값도 없었습니다. detail modal, static fallback, mobile layout, console/log secret-like 패턴 검증도 통과했습니다.

## Remaining Risks / Follow-ups

- Continue watching combined filter regressions when future observation fields or UI controls are added.
- Re-run Supabase approved-only visibility checks after repository or query changes.
- Map/list synchronization remains a later candidate, not part of Phase 19.
- Upload UX and admin review UX remain leading follow-up product candidates.
- Server-side filtering, date range pickers, map bounds filtering, and location-radius filtering remain out of scope unless approved in a later phase.

**한국어:** 향후 observation field나 filter control이 늘어나면 조합 필터 회귀를 다시 확인해야 합니다. repository/query가 바뀌면 approved-only visibility 검증을 다시 수행해야 합니다. 지도-목록 연동, upload UX, admin review UX는 후속 후보이며, server-side filtering과 고급 위치/date filter는 별도 승인 전까지 비범위입니다.

## Linked Docs

- `docs/architecture/phase-19-product-feature-prioritization.md`
- `docs/architecture/next-session-handoff.md`
- `docs/eco/phase-history/index.md`

**한국어:** Phase 19의 설계, 구현 결과, 검증 결과는 product feature prioritization 문서와 handoff 문서에 연결되어 있습니다.

## Commit References

- `7692bfd docs: prioritize next product feature`
- `072a92e feat: improve observation list filters`
- `3f1d9cc docs: record observation list filter regression results`

**한국어:** Phase 19는 우선순위 문서화, 필터 UX 구현, 회귀 검증 기록 커밋으로 나뉘어 관리되었습니다.

## Notes

- Filtering and sorting are client-side only.
- Public filtering operates only on observations already returned by the active public repository.
- Supabase public reads remain approved-only.
- Pending and rejected observations remain hidden from public list/detail.
- Signed, public, blob, preview, and data URLs are not stored in DB rows.
- No package, dependency, Supabase migration, RLS, Storage policy, Kakao provider, Auth, admin, or public visibility change was part of Phase 19.

**한국어:** Phase 19의 필터/정렬은 client-side only이며 active public repository가 반환한 approved observations에만 적용됩니다. pending/rejected public 미노출, signed/public/blob/preview/data URL DB 미저장, package/Supabase/Kakao/Auth/Admin 경계는 유지되었습니다.
