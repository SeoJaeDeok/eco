# Phase 28 Preview Read Verification

## Consolidated API And Operator Preview Result (2026-09-30)

**한국어:** `8435383` Preview의 연결 확인과 남은 화면 점검을 한 번에 요청한 뒤,
사용자가 `전부 검증했고 에러는 없어`라고 답했습니다. 요청한 범위의 사용자 수동
확인 PASS로 기록합니다. 실제 API 검사는 앞서 실행한 결과를 보존하며 반복하지
않았습니다. Codex가 보호된 Preview 설정이나 화면을 직접 검사한 결과는 아닙니다.

### Target And Reporting Scope

- Actual operator Preview target: `8435383`, previously confirmed Preview/build
  success; its app source matches summary correction `d6c34ca` (four docs differ).
- `preview_target_match=confirmed_by_operator`: the collective completion reply
  covers the combined request to compare the deployment-used Supabase mode,
  shared project, image bucket and absence of a conflicting branch override on
  the operator's own screen. This is not `confirmed_by_tool`, not an inference
  from matching counts/names, and not a comparison of today's settings alone.
  No values were requested or supplied; no individual configuration fields were
  returned separately. The API run's original unknown target provenance remains
  in its historical record below; this later operator confirmation supplies the link.
- The seven UI rows below record completion of the six-step guided flow, not
  separately instrumented test runs. The operator supplied no new numeric counts,
  device inventory, pixel measurements, map input total or console/log transcript.
  `data_changed_since_api_check=unknown`; do not label the earlier API counts as
  current UI measurements. No repeat of the earlier common-summary PASS was asked.
- Evidence labels: `STATIC` is source review; `LIVE_API_FROM_LOCAL_PUBLIC_CONFIG`
  is the preserved real public API run; `OPERATOR_PREVIEW_UI` is the user's manual
  Preview report; `NOT_RUN` means that specific check was not performed/reported.

### Consolidated Evidence Matrix

| Check | Status | Evidence | Boundary |
| --- | --- | --- | --- |
| Public Supabase connection | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG; operator target confirmation above | Dedicated public client without user session; local general app remains mock |
| First page range/count | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | At run time: approved count 22, range 0-19, 20 rows; exact count-only crosscheck |
| Second/final page | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | Range 20-39, 2 rows; no page overlap in the checked interval, not a snapshot guarantee |
| Global search and filtered count | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | Page-two record found by new search; independently checked result/count 6 |
| Registered-photo filter | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | Reference present 6 / absent 16; raw-field comparison, not image loading success |
| Detail and image access | PASS | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | Linked and legacy detail; one signed image HEAD succeeds, not browser rendering evidence |
| Actual date fields/options | PASS within loaded metadata | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | 22/22 metadata rows; independent calendar-date check, one year/month only |
| Public list pages/count display | PASS, guided flow | OPERATOR_PREVIEW_UI | Operator completed page/range/card check; no fresh per-page numbers supplied |
| Search and photo UI | PASS, guided flow | OPERATOR_PREVIEW_UI | Search/filter result and page-one reset check; API counts retain their original timestamp |
| Detail/image display and page preservation | PASS, guided flow | OPERATOR_PREVIEW_UI | Requested existing-image and linked/legacy detail flow; no all-images guarantee |
| Fade and no automatic top scroll | PASS, guided flow | OPERATOR_PREVIEW_UI | No measured scroll tolerance; shorter last-page document may still clamp its maximum scroll |
| Year/month selection and independent clears | PASS for available data, guided flow | OPERATOR_PREVIEW_UI | Includes collapse/selection/tree retention; unavailable multi-year/month cases remain PARTIAL |
| List/map data separation | PASS, guided flow; source confirmed | OPERATOR_PREVIEW_UI; STATIC | Page two does not replace the map source; not a browser request trace or complete map-row comparison |
| Narrow layout and keyboard | PASS, guided flow | OPERATOR_PREVIEW_UI | No claim about every mobile device or exhaustive accessibility audit |
| Diverse dates and observed/created contrast | PARTIAL | LIVE_API_FROM_LOCAL_PUBLIC_CONFIG | Actual dataset has only one year/month and no differing observed/created date example |
| Map collection coverage | PARTIAL; map_coverage=unknown | STATIC; NOT_RUN for exact Preview input comparison | No actual unfiltered map total supplied; metadata completeness does not prove map collection completeness |
| Real Kakao camera/marker/resize | PARTIAL | NOT_RUN for a specific new real-map report | Guided instructions allowed fallback; collective completion does not establish real Kakao availability |
| Build-log secret review | PARTIAL | NOT_RUN for a specific log review report | Build success/no reported errors is not a secret audit |
| Raw email / console secret-like output | unknown | NOT_RUN for explicit absence confirmation | No errors reported; no separate no/yes/unknown answers supplied |

### Coverage, Checks And Next Decision

- Static map input review: `listObservations()` selects approved observations,
  orders by observed date and uses the existing un-ranged collection query. There
  is no date/taxonomy/coordinate exclusion in that repository read; the configured
  server cap remains. Kakao separately skips non-finite coordinates. Map result
  count, marker count, linked taxonomy counts and filtered list counts are not
  interchangeable. Neither a 22-row metadata projection nor the operator's
  separation PASS establishes the exact Preview map input or large-data coverage.
- No confirmed core read failure or target mismatch remains in the collected
  evidence. **Production 배포 승인 검토 가능**, with these limits disclosed; this is
  not Production release approval, deployment completion or all-exception PASS.
  Review map coverage, real Kakao and build-log follow-up in the separate release
  decision. Do not create observations/accounts or change settings to fill gaps.
- This consolidation preserves the three intentionally dirty documents and the
  earlier run identity/results. No new API run, recreated result file or TEMP
  cleanup; the automatic harness is preserved. Source/tests/assets/package/lock/
  deployment configuration are unchanged. No observation/account/settings writes.
- Historical 174 Node tests/typecheck/build remain prior results. For this docs-only
  consolidation, application checks are skipped under the working guide. Fresh
  diff/Markdown/table/whitespace/EOF, forbidden-file, secret-like and docs-only scope
  checks PASS. Fresh `npm.cmd audit --include=dev --audit-level=high --json` exits 0,
  with zero vulnerabilities at this run; no package update or audit fix.
- One consolidation commit/push is authorized on the existing feature branch.
  Main/origin/main remain `a3887a7`; no Production promotion, archive or next feature.
  A resulting documentation Preview is unobserved at writing and is not visually
  reverified. Report its actual commit/deployment state after push without repeating
  documentation commits. Identical source does not prove identical built assets
  or build-time environment. Actual manual visual PASS belongs to `8435383`.

## Automatic Public Read Follow-Up (2026-09-30)

This section preserves the API run before the later operator confirmation above.
Its then-unknown target/UI state is historical, not the current consolidated state.

**한국어:** 사용자의 주소·키 입력 없이 실제 공개 API 검사를 실행했습니다.
공개 관찰 22건이 20건과 2건으로 나뉘며, 검색 6건과 사진 등록 6건/미등록
16건을 확인했습니다. 단, 설정은 로컬 앱의 공개 모듈에서 확보했습니다.
Preview와 같은 프로젝트인지 확인하지 못했으므로 Preview 전체 검증 완료는 아닙니다.

### Target And Configuration Provenance

- Reviewed code: `8435383`, feature local/remote unchanged; main/origin/main
  `a3887a7`. `d6c34ca..8435383` changes four documents only. Source, tests,
  public assets, package files and deployment configuration remain the reviewed code.
- Operator answered `preview yes pass` for the `8435383` environment/commit/build
  question. Public GitHub deployment metadata independently identified that SHA
  as Preview, non-Production, with a successful deployment status. The deployment
  ref is the matching SHA, not a branch-name string. This is deployment evidence,
  not database or browser-render evidence.
- The matching Preview HTML request returned HTTP 302 to Vercel access protection.
  No redirect/protection bypass, new login/CLI installation or setting change.
  Existing browser tooling could not connect; no authenticated browser inspection.
- Existing local Vite listeners 3000/3002/3003/3004/3005 serve this workspace's
  current App, but all report **mock** mode. Their public Supabase initialization
  modules also expose a connection pair. Port 3000 supplied the pair; client,
  repository-provider and Storage module values were compared in memory. Only the
  four requested public variables were extracted using a syntax parser, not eval.
- The dedicated harness explicitly uses the actual Supabase repository with a
  separate public client; **the local general app remains mock**. No env value or
  running app mode was changed. Source category: `LOCAL_VITE_PUBLIC_MODULES`;
  `preview_target_match=unknown`. API results below are **local-config LIVE_API**,
  not evidence that Preview uses the same project or displays the same data.
- Public-key type was checked before any Data API request; secret/service-role and
  user-token inputs are rejected. Decoding an anon payload is a type screen, not
  signature verification. No credentials, URLs, headers, object paths or rows were
  printed or saved. No `.env.local` or other secret environment file was read.

### Actual Execution And Evidence

- Successful run ID: `1790730570782`; start `2026-09-30T01:09:30.782Z`
  (10:09:30.782 Asia/Seoul); process exit **0**, matching completion ID, no FAIL
  in its result. Codex ran the noninteractive process and read `result.json` itself.
  Earlier automatic discovery attempts exited 1 before Data API access; they are
  superseded by this run, not hidden app failures or earlier PASS reuse.
- Actual repository/query-builder/mapper code was loaded from the unchanged local
  candidate with the installed SDK. Only the client and bulk image-signing boundary
  were injected. List queries are real requests, not a copied lookalike query.
- The image boundary skips bulk signing during repeated page checks. A selected
  detail uses the real Storage helper once; one signed-image HEAD follows. This is
  not a test of every card's image work, prefetch or actual browser rendering.
- Observed traffic: 18 observation GET/HEAD requests, one signed-URL POST and one
  image HEAD. Explicit approved predicates; no Auth/login, RPC, resolver, writes,
  uploads/deletes or settings operations. Reads/signing can create remote logs.
- Budgets: at most 32 guarded SDK requests, 15-second request timeout, 4 MiB
  cumulative SDK response budget, one signing operation; metadata projection at
  most 200 rows. Deep final-page checks above 2,000 records are skipped. No full
  observation download was introduced into the app or used to compute count.

| Check | Status / evidence | Observed scope or limitation |
| --- | --- | --- |
| Public connection and count | PASS / LIVE_API | Exact count-only approved read: 22; dedicated client has no user session |
| First page | PASS / LIVE_API | Actual range 0-19, 20 rows, Content-Range 0-19/22; SDK count 22 and separate same-condition HEAD agree |
| Second/final page | PASS / LIVE_API | Range 20-39, 2 rows, Content-Range 20-21/22; no overlap with first page in this run |
| Ordering and public predicate | PASS / LIVE_API | observed_date DESC, id DESC; request and returned row order/status checked; not a separate RLS attack test |
| Whole-public search | PASS / LIVE_API | A page-two record appears in page-one search; count/result 6; server condition present and original fields independently compared across the already-read 22 records |
| Broad taxon filter | PASS / LIVE_API, limited diversity | Server predicate/HEAD/result agree, 22 matching rows; no different-taxon exclusion case in this dataset |
| Registered-photo filter | PASS / LIVE_API | With reference 6, without 16; same-condition count; independent raw-reference predicate agrees across 22 records; not based on signing/display success |
| Detail and legacy detail | PASS / LIVE_API | One linked detail with lineage and one unlinked detail mapped correctly; identifiers/dates compared only in memory |
| Image access | PASS / LIVE_API; visual NOT_RUN | One runtime signing succeeds and image HEAD returns 200/image type; no body download or browser decode claim |
| Observed-date options | PASS / LIVE_API metadata scope | Separate capped metadata query returns 22/22, one valid year; mapper/date helper agrees with independent calendar-date parsing |
| Year/month combinations | PASS within available data / LIVE_API | Five helper invocations on live metadata agree with independent original-field filtering; only one year/month exists, so several conditions coincide |
| Multiple years/months, observed vs created date contrast | PARTIAL / LIVE_API data limitation | No multiple-year/month comparison or differing observed/created calendar-date example; previous synthetic tests remain separate |
| Date clears, empty-result UI, animation, scroll, keyboard | NOT_RUN for new Preview UI | API results do not establish rendered controls, interaction/state retention or image display |
| List/map/summary separation | STATIC confirmed; Preview network NOT_RUN | Actual App keeps separate reads/states; no list-triggered full read restored; harness is not a browser request trace |
| Map data coverage | PARTIAL / NOT_RUN actual map request | Narrow metadata projection covers this run's 22 approved rows; actual MapPage collection/server row-cap impact remains unknown |
| Common summary UI | Existing OPERATOR_UI PASS | Preserve d6c34ca guided-flow report; no repeat requested and no new aggregate/network audit claimed |
| Kakao regression / build-log review | PARTIAL / NOT_RUN this follow-up | No new real-map or log inspection |

Exact approved count was stable at the start/end and during relevant checks. This
does not establish a snapshot or rule out equal-count concurrent edits. Numeric
results belong only to the automatically acquired local public connection, not
mock samples, fixtures or an assumed Preview/Production project.

### Temporary Tool, Checks And Remaining Gate

- Existing TEMP `eco-phase28-read-verification-20260930/verify.cjs` was extended
  with an automatic configuration entry. Its temporary `public-config.cjs` loader
  was consolidated into that existing script after execution and removed. The
  documented safe result was identity-checked and removed after reading; no other
  TEMP files were touched. The existing self-contained script remains outside Git.
  The interactive route was not used or requested again. No config file was created.
- The result allowlist was checked before reading: only run/time/commit, source
  categories, booleans, counts/ranges and safe status/error codes. No raw rows,
  UUIDs, coordinates, paths, URLs, keys or stack traces. The fresh run/completion
  identity was checked; self-tests do not overwrite live results.
- Temporary harness syntax and zero/47-record/negative-response self-checks pass
  with fake transport. These are not new application Node tests or live data.
  The historical 174 application tests/typecheck/build/audit results remain dated
  prior results; not rerun because tracked changes are documents only and no push
  or package change is performed. Document format/security/scope checks run here.
- **No core query failure was observed for this local connection.** The remaining
  verification blocker is access to the protected Preview through a working,
  authorized browser, so its target identity and UI/network behavior can be checked.
  Do not disable protection, collect credentials, change local modes or promote to
  Production to obtain that evidence. No repeated manual key-entry instructions.
- This follow-up changes only these verification documents and temporary tools.
  No app/tests/packages/DB/observations/accounts/settings changes; no new commit,
  push, merge, deployment, phase archive or next feature. Production readiness is
  still withheld. Keep the historical records below rather than upgrading them.

## Previous Result And Evidence Boundary (2026-09-29)

- Record date: 2026-09-29 (Asia/Seoul).
- Branch: `feature/phase-28b-observation-month-filter`. Main/origin/main remain
  `a3887a7`; no Phase 28 Production integration or promotion.
- First pushed Preview: `e81327e`. Operator explicitly confirmed environment
  Preview, matching deployment commit and build PASS. This is deployment evidence,
  not a completed live Supabase matrix.
- During that check the operator reported the Navbar species/records group
  disappearing on the public list. Corrected and normally pushed as `d6c34ca`
  (`fix: preserve public summary across observation pages`).
- **Targeted common-summary smoke: PASS, operator-reported manual verification.**
  In response to the `d6c34ca` Preview follow-up, the operator said
  `에러 없고 검증 완료했어`. Record completion of the requested flow and no reported
  errors in that scope. This is not Codex browser verification or an independent
  audit of numeric accuracy, requests, credentials/logs or all Phase 28 features.
- The follow-up covered common summary across intro/list/map (page two where data
  permits), independence from list search/photo conditions, reload and narrow-header
  layout. Results were reported collectively, not as separate per-case measurements.
  Actual record count, availability of a second page and device coverage were not
  supplied. Do not infer multi-page data sufficiency or all-mobile-device PASS.
- The requested target was the new `d6c34ca` Preview/Ready deployment. The response
  is kept as contextual completion evidence; no separate new structured Dashboard
  environment/commit/build fields or tool-observed status were supplied. The earlier
  explicit `e81327e` deployment fields are not copied to the new commit.

## Environment And Actions

- Operator Dashboard configuration confirmation for this branch: Production branch
  main; feature environment Preview; all-Preview variable scope; no unexpected
  override; repository mode Supabase; shared connection ready. Reuse this already
  confirmed configuration; no values or keys were requested, read or recorded.
- Current deployed runtime mode was not independently inspected through a browser
  or network trace. `정적 디자인 시안` is static UI copy, not a repository-mode signal.
  There is no reported mode mismatch, but mock/fixture evidence is not live evidence.
- Existing Git-linked feature deployment only. No main merge/push, Production
  deployment, Preview promotion or changes to Vercel/Auth/Storage/Kakao settings.
- Verification instructions use existing signed-out public records and normal
  runtime image reads/signing, with no anonymous-auth account creation. No account,
  observation create/update/delete, upload/delete, SQL, migration, RLS/RPC or Edge
  action was performed by Codex. Normal reads may create service traffic/logs;
  this record does not claim zero interaction with remote services.

## Implementation And Evidence Matrix

| Area | Evidence available | Remaining live status |
| --- | --- | --- |
| Common Navbar omission | Confirmed App hide condition removed; actual App/Navbar tests; targeted operator completion after d6c34ca | Defect resolution PASS at guided-flow level; no independent numeric/network audit |
| Common summary semantics | Existing distinct nonempty trimmed names, exact approved record count; independent repository/App state; legacy included | Live numeric comparison and narrow-read request evidence NOT_RUN/unreported |
| List server pagination | Existing actual SDK transport tests: twenty rows, exact count, approved/search/photo/taxon predicates and stable order | Live range/count/request evidence NOT_RUN/unreported; multi-page data sufficiency unknown |
| List result vs common summary | Operator completed targeted filter/summary flow; separate automated page/search counts | Not a complete live search/photo/count accuracy matrix |
| Detail/images/page retention | Existing automated/isolated coverage and earlier local reports | Actual Supabase detail/image/legacy coverage NOT_RUN/unreported |
| Fade/no automatic top scroll | Prior local user PASS and regression tests preserved | No separate Preview result supplied in this summary-only reply |
| Map year/month/options/clears | Earlier local mock/fixture PASS; strict observed-date helpers and MapPage tests | Actual Supabase date comparison/combination matrix NOT_RUN/unreported |
| List/map/tree separation | App source/tests keep independent map collection; tree global linked counts | Actual network/data coverage NOT_RUN/unreported |
| Real Kakao camera/markers/resize | Prior Phase 27 Production history is separate | Phase 28 PARTIAL; fallback UI does not establish real-map PASS |
| Secrets/email/build logs | Safe local diff checks; no raw data requested | No new specific UI/console absence report; build-log review PARTIAL |

The previous 15-item general-mock/date-fixture/pagination-fixture PASS remains
historical evidence. The older 16-item checklist is also preserved as its own
record, not upgraded by this short completion report. Fixture counts 6/33/47 are
not live expected counts.

## Read Budgets And Coverage

- Shared summary reads approved `id,name` only, at most 500 per request and at most
  20 requests / 10,000 records per refresh. It checks exact count, progress, duplicate
  IDs and completion; errors or limits show failure/retry instead of partial totals.
  No image signing/prefetch or full-row collection reads are added for the summary.
  Equal-count concurrent edits may escape these guards: no transactional snapshot.
- List page reads remain twenty records, with same-condition count; no collection
  read is restored on list entry. Home may have already read the map/intro collection
  before navigation, and this must be distinguished from a list-triggered full read.
- Map/tree still make their existing separate reads subject to the configured
  server row cap, whose live value/impact remains unmeasured. Year/date filtering
  describes the loaded collection, not guaranteed completeness of all DB records.
- Summary records, filtered list totals, current map results and linked tree totals
  have different scopes. Do not assume they must all match. No live observation
  total, truncation amount, multi-year coverage or performance measurement was provided.

## Checks And Document Push

- Before `e81327e` feature push: 162 Node tests, typecheck/build PASS, dev-inclusive
  audit zero at that run. Not inherited from the earlier implementation run.
- Before `d6c34ca` correction push: **174 Node tests PASS**, typecheck/build PASS,
  dev-inclusive audit zero. Includes twelve new component/transport tests; no live
  Supabase or browser CSS evidence. This is the prior correction session, not rerun
  by this document update.
- Current document update: diff/Markdown/whitespace/EOF, forbidden tracked/staged
  paths and secret-like additions checked before commit. Fresh dev-inclusive audit:
  zero vulnerabilities. App tests/typecheck/build skipped because only docs change,
  under the working guide's docs-only exception. No package updates or audit fix.
- The documentation commit is normally pushed only to the same feature branch,
  as already authorized. Its source/tests/assets/packages/deployment configuration
  must match `d6c34ca`. New Preview deployment status is unobserved at writing, and
  no visual re-verification of that documentation commit is claimed. Report its
  actual hash/status after push; do not loop status-only commits or amend.

## Next Verification Gate

No repeat of the just-completed common-summary flow is requested. Continue only
the already authorized read-only integration checks that lack evidence:

1. Actual Supabase page range/limit/count/order and server search/photo/taxon filters;
   distinguish narrow summary reads from full observation/image downloads.
2. Existing real detail/images and observed-date/year/month combinations, independent
   clears and list/map data source separation. Mark unsupported data cases PARTIAL.
3. Actual map coverage and Kakao limitations; review logs locally without copying
   keys, headers, full responses, HAR, accounts or coordinates into chat.

Use existing public records, never create test data/accounts or modify settings.
There is no remaining confirmed common-summary defect from the operator report,
but **Production readiness is not established** while the live matrix is incomplete.
Any future Production release needs a separate decision and authorization.

**한국어:** 공통 요약 수정은 사용자에게서 검증 완료·오류 없음 보고를 받았습니다.
다만 서버가 실제로 20개 범위와 전체 count를 보내는지, 실데이터 날짜 필터가 맞는지
등의 별도 확인은 아직 남았습니다. 화면 완료 보고를 전체 실조회 완료로 확대하지 않습니다.
