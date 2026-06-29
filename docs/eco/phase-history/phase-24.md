# Phase 24 - Scientific Name Taxonomy Resolution And Verified Observation Create

## Status

- Status: Verified
- Source basis: project docs, Git history, operator-reported local/Preview/Production smoke, and read-only DB verification

**한국어 요약:** Phase 24는 학명 확인, GBIF 기반 taxonomy resolver, Supabase taxonomy schema/cache, trusted RPC create path, Upload UI `학명 확인` 흐름, local/Preview/Production smoke까지 완료되어 Verified로 닫았습니다.

## Goal

- Add scientific-name verification before new observation creation.
- Create new observations with trusted taxonomy linkage without weakening browser RLS or breaking legacy observations.

**한국어 요약:** 사용자가 관찰 기록을 등록하기 전에 학명을 명시적으로 확인하고, 확인된 taxonomy 정보만 신뢰된 서버 경로로 관찰 기록에 연결하는 것이 목표였습니다.

## Main Work

- Phase 24A validated the GBIF Species Match API behavior and selected an explicit `학명 확인` button flow.
- Phase 24B prepared the taxonomy schema/RLS migration candidate.
- Phase 24C manually applied and verified the taxonomy schema in the Supabase project shared with Production.
- Phase 24D implemented `TaxonomyRepository`, mock and Supabase repositories, the `resolve-taxonomy` Edge Function, local resolver smoke, live resolver smoke, and service-role cache permission corrections.
- Phase 24E designed and applied the trusted observation create RPC path, repaired RPC runtime expressions through migration 0011, verified trusted RPC create smoke, and connected Upload UI to taxonomy verification and trusted RPC create.
- Phase 24F verified Upload UI taxonomy flow locally, in Vercel Preview, and in Production, then closed the phase.

**한국어 요약:** API 검증부터 DB schema, Edge Function, trusted RPC, Upload UI, local/Preview/Production smoke까지 작은 단계로 진행했습니다. 기존 관찰 기록은 그대로 유효하게 유지했습니다.

## Key Files

- `supabase/migrations/0007_create_taxonomy_schema.sql`
- `supabase/migrations/0008_grant_taxonomy_service_role_access.sql`
- `supabase/migrations/0009_revoke_taxonomy_service_role_delete.sql`
- `supabase/migrations/0010_create_taxonomy_observation_write_path.sql`
- `supabase/migrations/0011_repair_taxonomy_observation_rpc_runtime_expressions.sql`
- `supabase/functions/resolve-taxonomy/index.ts`
- `supabase/functions/resolve-taxonomy/gbif_mapper.ts`
- `supabase/functions/resolve-taxonomy/taxonomy_core.ts`
- `src/repositories/taxonomyRepository.ts`
- `src/repositories/supabase/supabaseTaxonomyRepository.ts`
- `src/repositories/supabase/supabaseObservationRepository.ts`
- `src/components/UploadMockPage.tsx`
- `src/components/upload/UploadTaxonomyVerificationPanel.tsx`
- `src/features/upload/uploadTaxonomyVerification.ts`
- `docs/architecture/taxonomy-api-resolution-plan.md`
- `docs/architecture/taxonomy-resolver-live-smoke.md`
- `docs/architecture/taxonomy-observation-write-path-live-smoke.md`
- `docs/architecture/taxonomy-upload-ui-integration.md`
- `docs/architecture/taxonomy-upload-ui-smoke.md`
- `docs/architecture/taxonomy-upload-ui-preview-smoke.md`
- `docs/architecture/taxonomy-upload-ui-production-smoke.md`

**한국어 요약:** 핵심 파일은 taxonomy migration, resolver Edge Function, taxonomy repository, Upload UI, trusted RPC create path, smoke 문서입니다.

## Verification

- `npm.cmd run typecheck`: PASS before main push and before closeout docs commit.
- Node tests: PASS, 21 tests.
- `npm.cmd run build`: PASS before main push and before closeout docs commit.
- Deno format/lint/check/test for `resolve-taxonomy`: PASS.
- Local Upload UI smoke: PASS.
- Vercel Preview Upload UI smoke: PASS.
- Production Upload UI smoke: PASS.
- Production read-only DB verification: PASS.
- `git diff --check`: PASS.
- Forbidden tracked-path check: PASS.
- Secret-like diff scan without reading `.env.local`: PASS.
- Direct UI taxonomy table write scan: PASS.
- Frontend service-role scan: PASS.

**한국어 요약:** 자동 검증, local smoke, Preview smoke, Production smoke, DB 읽기 전용 검증이 모두 핵심 경로에서 통과했습니다. build log secret review는 명시 확인이 없어서 일부 문서에서 PARTIAL로 남겼습니다.

## Boundary Report

- Upload UI changed during Phase 24E-3 to require explicit `학명 확인`.
- Observation create path changed during Phase 24E-3 to use the trusted RPC when taxonomy is verified.
- Package files changed to add the repository-local Supabase CLI dependency and lockfile state used during Phase 24 tooling.
- Migration SQL 0007 through 0011 was added and manually applied in approved steps.
- Live DB data changed only through approved smoke observations/cache writes and manual migrations.
- RLS/policies were changed only through reviewed migrations.
- Edge Function `resolve-taxonomy` was deployed during Phase 24D-3 and not redeployed during Phase 24F closeout.
- Storage, Auth, Admin, Kakao, Vercel config, and DNS settings were not changed during Phase 24F closeout.
- Production UI now includes the Phase 24 taxonomy upload flow after `main` deployment.

**한국어 요약:** Phase 24의 변경은 taxonomy 확인과 trusted create 경로에 집중했습니다. Phase 24F closeout에서는 앱 코드나 migration을 새로 바꾸지 않고 문서만 닫았습니다.

## Remaining Risks / Follow-ups

- Rich taxonomy display in public observation detail remains deferred.
- Taxonomy tree browsing and richer public taxonomy exploration remain deferred.
- Legacy observation taxonomy backfill remains optional and should be designed separately.
- Production admin regression was not rerun in the Phase 24 closeout unless separately recorded.
- Build log secret review remains PARTIAL where not explicitly confirmed.
- Public smoke test observations can be reviewed or cleaned later through a deliberate admin/operations process if desired.
- Custom domain remains an optional follow-up if not already connected.

**한국어 요약:** 다음에는 public detail에서 taxonomy를 더 잘 보여주거나 taxonomy tree 탐색을 만들 수 있습니다. 기존 관찰 기록 backfill은 별도 설계가 필요합니다.

## Linked Docs

- `docs/architecture/taxonomy-api-resolution-plan.md`
- `docs/architecture/taxonomy-resolver-live-smoke.md`
- `docs/architecture/taxonomy-observation-write-path-design.md`
- `docs/architecture/taxonomy-observation-write-path-live-smoke.md`
- `docs/architecture/taxonomy-upload-ui-integration.md`
- `docs/architecture/taxonomy-upload-ui-smoke.md`
- `docs/architecture/taxonomy-upload-ui-preview-smoke.md`
- `docs/architecture/taxonomy-upload-ui-production-smoke.md`
- `docs/architecture/next-session-handoff.md`

**한국어 요약:** 자세한 설계와 smoke 결과는 architecture 문서들에 나뉘어 기록되어 있습니다.

## Commit References

- `b74ca3a docs: validate taxonomy API integration plan`
- `428a684 docs: prepare taxonomy schema migration`
- `8b9ac3b docs: record taxonomy schema live apply`
- `0d046e3 feat: add taxonomy resolver foundation`
- `b1e9407 fix: grant taxonomy cache access to service role`
- `7e14540 fix: revoke taxonomy service-role delete grants`
- `b182d76 fix: make taxonomy service-role revoke replay safe`
- `8b9d289 docs: record taxonomy resolver local smoke`
- `8d6f8b8 docs: record taxonomy resolver live smoke`
- `5192bd3 docs: prepare taxonomy observation write path`
- `26db865 fix: restrict taxonomy create rpc execution`
- `7ad786a fix: repair taxonomy observation rpc runtime expressions`
- `277088b docs: record taxonomy observation write path smoke`
- `373f95d feat: connect upload form to taxonomy verification`
- `c8a5f05 fix: harden taxonomy upload ui smoke`
- `2e8f5ea docs: record taxonomy upload ui smoke`
- `47a3cab docs: record taxonomy preview smoke`
- Closeout commit: `docs: close phase 24 taxonomy integration`

**한국어 요약:** 위 커밋들이 Phase 24의 설계, DB, resolver, RPC, Upload UI, smoke, closeout 흐름을 구성합니다.

## Notes

- No `.env.local` contents, URLs, project refs, keys, JWTs, tokens, emails, passwords, source taxon keys, UUIDs, object paths, function URLs, or raw database rows are recorded.
- Supabase migration application was performed manually in approved steps; Codex did not run `supabase db push`.
- Phase 24 is closed after Production smoke and DB verification.

**한국어 요약:** 민감한 값은 기록하지 않았고, remote DB 변경은 승인된 수동 migration과 smoke 경로로만 이루어졌습니다.
