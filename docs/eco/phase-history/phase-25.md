# Phase 25 - Taxonomy Tree Browsing And Eco Map Filtering

## Status

- Status: Verified
- Source basis: project docs, Git history, operator-reported Preview/Production smoke, read-only DB verification, and local automated checks

**한국어 요약:** Phase 25는 생태지도 안에 `분류 탐색` 트리를 추가하고, 선택한 분류 노드로 지도와 관찰 목록을 함께 필터링하는 기능을 Production까지 검증한 단계입니다.

## Goal

- Let users browse approved taxonomy-linked observations by taxonomy hierarchy inside `생태지도`.
- Show stored taxonomy lineage in public observation detail without calling GBIF during browsing, map/list rendering, search, or detail display.

**한국어 요약:** 사용자가 `계 → 문 → 강 → 목 → 과 → 속 → 종` 구조로 관찰 기록을 살펴보고, 분류를 누르면 지도와 목록이 같이 줄어들도록 만드는 것이 목표였습니다.

## Main Work

- Phase 25A designed the taxonomy tree placement, node model, count semantics, query architecture, missing-rank handling, and map/list filter behavior.
- Phase 25B added taxonomy tree domain types, pure aggregation helpers, `TaxonomyTreeRepository`, mock and Supabase repositories, and public detail taxonomy lineage display.
- Phase 25C added the collapsible `분류 탐색` panel to `생태지도`, lazy-loaded tree children, active filter chip, clear behavior, and taxonomy filtering for map markers plus the compact map-side list.
- Phase 25D pushed the feature branch for Vercel Preview, verified Preview smoke, fast-forwarded `main`, verified Production smoke, and documented closeout.
- The corrected `public.taxa` readiness check uses column-level SELECT privileges plus the `"Public can read accepted taxa"` policy, resolving the Phase 25D-1 table-level verification ambiguity.

**한국어 요약:** 설계, 저장소, 상세 분류 표시, 생태지도 패널, 지도/목록 필터링, Preview/Production smoke까지 작은 단계로 진행했습니다. DB 권한 확인은 table-level이 아니라 column-level 기준으로 확인해 정상으로 정리했습니다.

## Key Files

- `src/components/MapPage.tsx`
- `src/components/map/TaxonomyTreePanel.tsx`
- `src/features/taxonomy/taxonomyTree.ts`
- `src/repositories/taxonomyTreeRepository.ts`
- `src/repositories/taxonomyTreeRepositoryProvider.ts`
- `src/repositories/mockTaxonomyTreeRepository.ts`
- `src/repositories/supabase/supabaseTaxonomyTreeRepository.ts`
- `src/components/observations/detail/ObservationTaxonomyLineage.tsx`
- `src/repositories/supabase/observationMappers.ts`
- `src/utils/observationFilters.ts`
- `tests/taxonomy-tree-aggregation.test.mjs`
- `tests/mock-taxonomy-tree-repository.test.mjs`
- `tests/supabase-taxonomy-tree-repository.test.mjs`
- `tests/map-taxonomy-filter.test.mjs`
- `tests/observation-detail-taxonomy-lineage.test.mjs`
- `docs/architecture/taxonomy-tree-browsing-design.md`
- `docs/architecture/taxonomy-tree-query-prototypes.md`
- `docs/architecture/taxonomy-tree-repository-detail-lineage.md`
- `docs/architecture/taxonomy-tree-map-filter-implementation.md`
- `docs/architecture/taxonomy-tree-preview-smoke.md`
- `docs/architecture/taxonomy-tree-production-smoke.md`

**한국어 요약:** 핵심 파일은 생태지도 화면, 분류 트리 패널, taxonomy tree repository, 상세 분류 표시, 필터 helper, 관련 테스트와 architecture 문서입니다.

## Verification

- `npm.cmd run typecheck`: PASS before feature branch push, before main push, and before closeout commit.
- Node tests: PASS, 45 tests.
- `npm.cmd run build`: PASS before feature branch push, before main push, and before closeout commit.
- Deno format/lint/check for `resolve-taxonomy`: PASS.
- Deno test: no test modules found in the function folder.
- Vercel Preview smoke: PASS for the taxonomy tree MVP.
- Production deployment: PASS at commit `7301f49`.
- Production taxonomy tree smoke: PASS for core tree panel, expand/select, active chip, map/list filtering, detail lineage, and legacy detail behavior.
- Corrected Production read-only DB verification: PASS, all expected booleans true.
- `git diff --check`: PASS.
- Forbidden tracked-path check: PASS.
- Secret-like diff/tracked scan without reading `.env.local`: PASS.
- Frontend service-role scan: PASS.
- Public UI `taxonomy_name_resolutions` access scan: PASS.
- Static tree/map/detail GBIF/resolver call scan: PASS.

**한국어 요약:** 타입체크, 테스트, 빌드, Preview, Production, DB 읽기 전용 검증이 통과했습니다. GBIF 네트워크 미호출은 정적 코드 검사 기준 PASS이고, Production 브라우저 네트워크 패널 확인은 unknown으로 남았습니다.

## Boundary Report

- Map tree UI changed in Phase 25C.
- Map/list filtering inside `생태지도` changed in Phase 25C.
- Detail UI changed in Phase 25B to show taxonomy lineage when available.
- Observation create/update behavior did not change in Phase 25.
- Package files did not change in Phase 25.
- Migration SQL did not change and migration 0012 was not created.
- No remote mutation SQL was run by Codex.
- No `supabase db push` was run.
- No live DB data was changed by Phase 25.
- No RLS/policy change was made by Phase 25.
- No Edge Function was redeployed by Phase 25.
- Storage, Auth, Admin, Kakao, DNS, and Vercel config were not changed.
- Production UI now includes the Phase 25 taxonomy tree browsing MVP after `main` deployment.

**한국어 요약:** 이번 단계는 앱 기능과 문서 중심이었고, DB 구조나 정책, Edge Function, 패키지, Vercel 설정은 바꾸지 않았습니다.

## Remaining Risks / Follow-ups

- Build log secret review remains PARTIAL unless an operator later performs a full line-by-line review.
- GBIF network absence during Production browsing was not fully proven by browser network inspection, although static code scans confirm tree/map/detail paths do not call GBIF or the resolver.
- The separate public `관찰목록` page does not yet have its own taxonomy tree panel.
- Server-side read-only RPC/view/materialized cache may be useful later if approved observation volume makes client-side id filtering slow.
- Legacy observation taxonomy backfill or admin relink workflow remains deferred.
- A separate richer public taxonomy browsing page remains deferred unless later requested.

**한국어 요약:** 남은 일은 더 큰 데이터에 대비한 서버쪽 필터/RPC, legacy 기록 연결, 별도 분류 페이지 같은 후속 개선입니다. 지금 MVP는 Production에서 검증되었습니다.

## Linked Docs

- `docs/architecture/taxonomy-tree-browsing-design.md`
- `docs/architecture/taxonomy-tree-query-prototypes.md`
- `docs/architecture/taxonomy-tree-repository-detail-lineage.md`
- `docs/architecture/taxonomy-tree-map-filter-implementation.md`
- `docs/architecture/taxonomy-tree-preview-smoke.md`
- `docs/architecture/taxonomy-tree-production-smoke.md`
- `docs/architecture/taxonomy-api-resolution-plan.md`
- `docs/architecture/next-session-handoff.md`

**한국어 요약:** 자세한 설계와 smoke 결과는 architecture 문서들에 나누어 기록되어 있습니다.

## Commit References

- `7ceb868 docs: design taxonomy tree browsing`
- `a9b7ecf feat: add taxonomy tree repository and detail lineage`
- `55321fa docs: record taxonomy tree repository detail work`
- `5ff536d feat: add taxonomy tree panel to eco map`
- `e8a1054 docs: record taxonomy tree map filtering`
- `84d1198 docs: record taxonomy tree preview smoke`
- `7301f49 docs: refine taxonomy tree preview smoke notes`
- Closeout commit: `docs: close phase 25 taxonomy tree browsing`

**한국어 요약:** 위 커밋들이 Phase 25의 설계, 구현, Preview smoke, Production closeout 흐름을 구성합니다.

## Notes

- No `.env.local` contents, URLs, project refs, keys, JWTs, tokens, emails, passwords, source taxon keys, UUIDs, object paths, function URLs, or raw database rows are recorded.
- Phase 25 uses stored `public.taxa` plus approved `public.observations`; tree browsing does not call GBIF.
- Phase 25 is closed after Production smoke and corrected read-only DB verification.

**한국어 요약:** 민감값은 기록하지 않았고, 분류 탐색은 저장된 DB 데이터만 사용합니다. Phase 25는 Production 검증 후 종료되었습니다.
