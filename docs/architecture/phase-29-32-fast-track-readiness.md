# Phase 29 And 32 Fast-Track Readiness

## Candidate

- Updated: 2026-10-09. Branch: `feature/phase-29-32-observation-delete-comments-fast-track`.
- Base: Phase 28 `2b2ce5a`, main/origin/main `a3887a7`. This is a **stacked candidate**
  containing Phase 28 + 29 + 32; it did not restart from main.
- Initial implementation: `4e4f9eb`; prior documentation: `77a394e`.
  Final approved-only code/migration correction: `62c57c0`.
  Earlier readiness: `23d634a`; helper correction and actual smoke code: `74fba30`.
  Live-smoke documentation commit: `db37ba1`. Security correction: `e7703f8`,
  normally pushed and deployed to Preview. Preview UI record `00d05aa` was later
  pushed; it is the local/remote entry HEAD and code basis for the final admin
  deletion smoke below. That result was committed as `0f2fdae`; a separately
  authorized documentation-only feature push has now succeeded at that commit.
  The current read-only history follow-up also adds an evidence document and
  diagnostic SQL files; app/package/migration files remain unchanged.
- State: **0014/0012/0013 remote APPLIED + post PASS**, operator-reported SQL Editor
  execution. Phase 29 core owner smoke and Phase 32 limited comment smoke passed
  with the evidence/limitations below. **No Verified closure or Production release**.
- The `db37ba1` audit hold is resolved by the separately authorized minimal
  `source-map-js` correction below. Audit at `e7703f8`: **zero vulnerabilities**.
  The feature push and automatic Preview succeeded. The `00d05aa` deployment is
  reported successful; `0f2fdae` Preview also has matching non-Production success
  metadata after the authorized push. Actual Preview UI evidence remains at
  `e7703f8`, not a new screen check of a documentation deployment. The current
  history-result edits are preserved in the local-only reconciliation audit commit;
  remote feature remains `0f2fdae`, with no further push performed. No main
  merge/push or Production deployment/promotion is authorized.
  Existing Phase 28/backup branches are preserved.
- Phase 30/31 skipped intentionally; no Phase history archive or new feature.
- Phase 28 API/Preview evidence remains historical and is not a live PASS for
  this newly modified application. Its coverage/date diversity/Kakao/log limits
  remain recorded in [Phase 28 readiness](phase-28-integration-release-readiness.md).

## Migration Evidence Reconciliation In Progress

2026-10-09, READ ONLY follow-up from entry local/remote `0f2fdae`. The pre-existing
uncommitted history-diagnosis edits below are preserved in this local-only audit.
All 14 migration bodies were reviewed; no migration, app, test or package file changed.

- [Migration evidence inventory](migration-reconciliation-evidence.md) records every
  filename, retained effect, superseding change, previous evidence and missing check.
  Provisional whole-migration statuses: **MATCH 11 / MISMATCH 2 / UNVERIFIABLE 1 /
  SUPERSEDED 0**. Individual superseded effects are separately listed; a mixed
  migration is not wholly superseded. MATCH 0012/0013/0014 reuses exact existing
  operator post-check results. Two operator metadata runs now support retained
  structural/privilege effects of 0001/0003-0009; descriptive COMMENT text is outside
  that scope. 0002 differs in bucket configuration; 0011 has an invalid combined
  amphibian/reptile return literal, while 0010's final RPC assessment remains blocked.
  None proves historical full-file execution.
- The [single read-only bundle](sql-checks/0001-0014-reconciliation-read-only.sql)
  has now been executed by the operator: **28 false gates** (12 CHECK, 12 partial
  indexes, four function definitions); all other supplied gates true. The index
  comparison omitted case normalization; CHECKs assumed btrim instead of
  TRIM(BOTH FROM) rendering. The operator's [second diagnosis](sql-checks/0001-0014-reconciliation-diagnose-false.sql)
  now confirms all 24 CHECK/index diagnostics and three function token comparisons.
  All four functions' security/signature/language/search-path/volatility checks match.
  Only the create RPC body-token comparison remains false; original results are
  preserved, not overwritten. This is not yet a proven runtime/security defect.
- **Third OPERATOR_SQL result:** the [RPC section diagnosis](sql-checks/0011-reconciliation-diagnose-rpc-body.sql)
  matches seven whole sections and every string-masked section. Only category string
  literals differ. Reviewed token fingerprint and all anchor/lexer guards match.
  The raw reviewed-text hash is false, but that alone does not establish corruption;
  external formatting can alter that hash without changing token content.
  Exact differing values/cause/runtime impact remain unconfirmed. No create was run.
- **Fourth OPERATOR_SQL result:** the [category-literal SELECT](sql-checks/0011-reconciliation-diagnose-category-literals.sql)
  has run. Function/structure/count guards and all six exact conditions match.
  Six return values match; only `amphibia_reptilia` differs. Its NFC comparison and
  the all-returns-in-reviewed-set check are false. Expected local value is `양서/파충류`.
  Prior validated `observations_taxon_check` evidence uses that same label set.
  An affected taxonomy-linked create can fail that CHECK (**STATIC inference**);
  no create request or new live failure was run. The actual remote literal and its
  origin are unknown, not printed or requested. No new query is needed to isolate it.
- A documented replay gap needs separate treatment: 0002 configures a 5 MiB bucket;
  Phase 22C reports a manual 20 MB bucket increase. 0006 changes only the DB CHECK.
  Operator metadata now confirms **20 MiB**, private bucket and expected MIME types.
  This is a confirmed manual configuration/replay difference, not an application
  failure. No setting is changed or lowered.
- `migration_history=missing_schema` remains operator-confirmed. Canonical order
  `0001...0012 -> 0013 -> 0014` and actual recent manual order
  `0014 -> 0012 -> 0013` remain distinct. No all-version applied marking is ready.
- CLI 2.108.0 source confirms history repair initializes schema/table and stores
  version/name/statements; it is a write, not a migration replay or read-only check.
  The connection path can also create a login role. No remote CLI is executed.
- Current decision: confirmed single return-literal mismatch plus configuration drift;
  history reconciliation and Production clearance held. Next decision is separate
  approval for a new minimal RPC correction candidate and exact pre/post checks,
  followed by a separate manual-application decision. Preserve all other function
  logic/signature/ACLs and the taxon CHECK; no applied-file edit or old migration replay.
  History initialization/repair, schema correction and operating-mode transition
  need separate approval; **exact rollback SQL: not documented**.
- Non-owner server DELETE stays PARTIAL, image cleanup NOT_TESTED/best-effort,
  actual Kakao deletion marker PARTIAL. Earlier live and Preview evidence is unchanged.
  Historical 213-test/typecheck/build/audit results are not rerun; this is docs/check
  SQL only, under the working guide's documentation-only verification exception.
  New document/SQL checks PASS. The authorized local evidence commit records a
  blocker, not readiness completion; no push/merge/deployment or remote DB change.

## Migration History And Remaining Permission Gate

Historical checkpoint before the four-query evidence audit above. Its two pending
documentation edits are now preserved in the local-only audit commit; references
below to uncommitted work/no new commit describe that earlier checkpoint.

2026-10-09, after the authorized `0f2fdae` feature push. Local/remote HEAD match,
main/origin/main remain `a3887a7`. The pushed range contains exactly three Markdown
documents; app/tests/assets/packages/migrations/deployment inputs are unchanged
from the UI-tested `e7703f8`. Read-only public GitHub metadata confirms matching
commit, Preview/non-Production and success. New Preview rendering is **NOT_RUN**.
The two documentation edits for the following result are not yet committed/pushed.

### History Result: Schema Absent

Installed project CLI **2.108.0** was checked with its existing executable's version
flag only. Local migrations are 14 unique numeric prefixes `0001` through `0014`;
their names match this version's numeric-prefix parser. No renumbering is required
by that parser. See the [versioned file parser](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/pkg/migration/file.go).
This filename check does not establish remote application or ledger agreement.

Linked-project marker files exist; their contents were not printed. No DB password
or CLI token was present in the checked process variables. The reviewed
[CLI connection path](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/internal/utils/flags/db_url.go)
can create a temporary login role when a password is absent, with a pooler retry
path that can alter network bans. Therefore no linked remote CLI connection/list
was run, and no keychain credentials were retrieved to bypass that restriction.

The operator executed the supplied catalog-only SELECT in SQL Editor and reported
**all six booleans false**. It queried system metadata, never the possibly absent
history relation itself, and did not return identities, configuration or SQL bodies.

| Catalog result | Operator-reported value |
| --- | --- |
| history_schema_exists | false |
| history_schema_readable | false |
| history_table_exists | false |
| history_version_column_valid | false |
| history_select_allowed | false |
| history_rls_disabled | false |

**migration_history=missing_schema, OPERATOR_SQL**, replacing the prior unknown
for the database where this check ran. In particular, schema existence was false;
the other false values follow from the absent objects and are not evidence that
application observation privileges or RLS broke. The configured default history
table and its version entries cannot exist inside that absent schema. No follow-up
query against the missing table is needed or issued. Duplicate-row testing is
**NOT_APPLICABLE (table absent)**, not an executed PASS; per-version application
equivalence has not been reconstructed. No independent Codex remote SQL or target
configuration comparison is claimed.

**0014/0012/0013 APPLIED + post PASS remain intact.** Working schema/policy changes
and CLI bookkeeping are different evidence. The missing ledger does not prove
manual application failed, nor when or why the ledger was absent. The CLI's
[history implementation](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/pkg/migration/history.go)
uses `supabase_migrations.schema_migrations` and a text version primary key; the
operator result shows that standard ledger is absent here. Do not run migrations
again to populate it or silently mark unreviewed versions as applied.

**Reconciliation plan only:** review application evidence and superseding effects
for all 14 local versions, not just 0012/0013/0014, because the entire history schema
is absent. Preserve manual order `0014 -> 0012 -> 0013` separately from canonical
replay `0001 -> ... -> 0014`; version bookkeeping alone does not record that manual
chronology. Only versions with established application evidence can be proposed for
future history-only reconciliation. Review ledger initialization, exact correction
scope, connection side effects and rollback expectations before requesting separate
write approval. No repair command/SQL, ledger creation/update, migration replay or
DB push/reset is executed or supplied as the next runnable step here. See the
[official history repair reference](https://supabase.com/docs/reference/cli/supabase-migration-repair).

### Non-Owner Denial: Static Evidence And Minimum Next Test

- `STATIC`: 0012 grants table DELETE to `authenticated`, revokes it from `anon`,
  and restricts permissive row policies to approved owner
  (`observer_id = auth.uid()`) or approved admin (`public.is_admin()`). The helper
  checks the current user's profile role, not merely authentication. Admin and
  ordinary authenticated sessions must not be treated as interchangeable.
- The existing 0012 post-check verifies the exact two DELETE/ALL policies, RLS,
  grants and preserved SELECT/UPDATE rules; its prior operator PASS is not a new
  live non-owner DELETE. Current authenticated non-owner server denial stays
  **PARTIAL / actual request NOT_RUN**. UI hiding and simulated tests are separate.
- Two ordinary test accounts and an admin account were confirmed in the preceding
  smoke. Do not ask for their credentials or create accounts. The blocker was the
  browser request path, not missing accounts. All prior disposable data is cleaned up.

Minimum future procedure, **not approved for execution in this history task**:

1. First establish a reviewed one-shot request path inside the ordinary account's
   existing signed-in app environment, using the existing SDK without exporting
   cookies/tokens. Verify ordinary/non-admin identity safely before generating data.
   If this path is unavailable, stop with PARTIAL; do not create another leftover target.
2. After separate write approval, the operator creates one new approved image-free
   observation. Bind it by unique marker, creation time and in-memory identity; verify
   the probe account is neither its owner nor an admin. No existing record substitution.
3. Send one DELETE limited to that exact approved ID from the ordinary non-owner
   session; inspect affected-row outcome and confirm the same observation remains.
   HTTP success alone is insufficient. Unexpected removal is CRITICAL FAIL: stop,
   create no replacement, and do not proceed to Production.
4. If retained, the owner/admin performs final UI deletion. Verify public absence,
   counts and cleanup. No images/comments, service-role/SQL impersonation or broad
   DELETE. Admin/owner/anon success is not a substitute for the non-owner request.

### Current Gate And Verification

No new observation/comment/account, remote DELETE, remote CLI/SQL operation by
Codex, schema/RLS/Storage change, or test-data reuse occurred in this preparation.
The operator's read-only metadata check does not change remote state. Image cleanup
NOT_TESTED/best-effort, actual delete-driven Kakao PARTIAL and pending/rejected
deletion deferred remain unchanged. All earlier live/UI results below are preserved.

Push preparation verified the normal ancestry and docs-only scope, diff/whitespace,
forbidden files and secret-like additions. A new dev-inclusive audit in that push
step returned **0 vulnerabilities**, exit 0. The **213 tests/typecheck/build PASS**
remain historical at `e7703f8`; none was rerun or relabeled fresh. History-result
documentation checks **PASS**: two files, 29 local links, diff/Markdown whitespace/EOF,
forbidden tracked paths, secret-like additions and state consistency. Earlier admin
and Phase 32 live evidence is unchanged; no app/package/migration change or staged file.
No new commit, additional push, main merge/push, Production deployment or Verified
closure. Before release approval, the missing ledger requires a reviewed handling
decision and non-owner actual denial still requires verification or an explicit
decision; neither is automatically accepted by successful Preview deployment.

**한국어:** 적용한 DB 구조와 CLI의 적용 이력은 별개입니다. 이번 사용자 조회에서는
이력 스키마 자체가 없었으므로 기존 migration을 다시 실행하면 안 됩니다. 0001부터
0014까지 적용 근거를 대조해 이력만 보정할 범위를 먼저 정해야 합니다. 비작성자의
서버 삭제 차단은 안전한 인증 요청 경로를 확보한 뒤, 별도 승인한 새 전용 관찰로만
검증합니다. 이번에는 자료 생성·삭제나 이력 보정을 하지 않았습니다.

## Final Observation Permission Smoke At 00d05aa

Historical deletion-run record below. Its migration-history unknown and no-push
checkpoint are superseded by the later operator catalog result and authorized push
above; its actual deletion evidence is preserved unchanged.

2026-10-09, **local_supabase**, not a new Preview smoke. Exactly one newly authorized
image-free approved observation was created by the operator through the ordinary
account UI and subsequently deleted through the administrator UI. No existing
observation was substituted; no new account, comment or image was created. The
earlier owner/anon and Phase 32 evidence below is historical and unchanged.

### Evidence And Safe Target Binding

- `OPERATOR_UI`: the operator reported ordinary writer login/create, a distinct
  ordinary account with no delete button, administrator login with the existing
  admin-role confirmation, then cancel followed by confirmed deletion. The final
  reply confirmed detail closing, card removal and summary refresh without manual
  reload. Account switching/ownership are operator-confirmed, not extracted session
  identities. Admin confirmation uses the existing profile-role path (`STATIC`).
- `LIVE_API_FROM_LOCAL_PUBLIC_CONFIG` (`LIVE_API` below): current Vite-served source
  matched `00d05aa` and repository mode was Supabase. Only the browser-exposed public
  connection was read in memory, without reading `.env.local` or browser sessions.
  Read-only clients disabled session persistence, token refresh and URL session
  detection; no login, Storage, SQL, resolver or write request was made by Codex.
- A fresh baseline, not the previous smoke's totals, measured **105 records / 91
  species**. The marker was entered in name instead of description. Exact-description
  lookup therefore stopped; a bounded name/description query found exactly one new
  approved image-free row after baseline. The record was not renamed or replaced.
  Its identity/owner comparison hashes bound later checks without recording raw IDs.
- After creation: **106 records / 92 species**. The original target remained present
  and image-free before admin deletion. After operator deletion, the marker count
  and scoped public-detail result were both **0**. The original target fingerprint
  was absent from all **105** approved `id,name` rows read by the actual bounded
  summary method; independent count-only agreed. Summary returned to **105 / 91**.
  Only narrow summary metadata was enumerated, not all observation/image fields.
- Safe run reference: `phase29-final-permission-20261009-161442`; baseline at
  `2026-10-09T07:15:29.574Z`, bound target at `07:20:39.562Z`, final check at
  `07:27:58.741Z`. Final probe: **4 reads, 0 writes**, exit code 0. These are new
  results, not recreated copies of earlier result files. API traffic can create logs.

| Final permission result | Status | Evidence and limit |
| --- | --- | --- |
| environment | local_supabase | LIVE_API; local served source/config match, not Preview rendering |
| test_observation_created | PASS | OPERATOR_UI + LIVE_API; one new marked row after baseline |
| approved_and_image_free | PASS | LIVE_API; approved, no image reference/metadata |
| non_owner_delete_ui | PASS | OPERATOR_UI; separate ordinary account, delete button hidden |
| non_owner_delete_denied | PARTIAL | Actual authenticated DELETE NOT_RUN; browser connection tool unavailable, not account absence |
| admin_role_confirmed | PASS | OPERATOR_UI admin-role message + STATIC existing profile-role check; no token extraction |
| admin_delete_ui | PASS | OPERATOR_UI; cancel preserved record, subsequent final confirm succeeded |
| admin_delete_server | PASS, public repository contract scope | OPERATOR_UI + LIVE_API + STATIC returned-deleted-ID guard; limitation below |
| public_observation_removed | PASS | LIVE_API; scoped public detail empty, original identity absent from complete summary metadata |
| list_refresh | PASS | OPERATOR_UI; detail closed and card removed without manual reload |
| summary_refresh | PASS | OPERATOR_UI + LIVE_API; 106/92 returned to 105/91 records/species |
| map_data_refresh | PARTIAL | STATIC refresh wiring and public target absence; this admin run's small-list UI was not separately confirmed |
| real_kakao_marker_removal | PARTIAL | OPERATOR_UI reports no local Kakao integration/markers; earlier basic Preview map display is separate |
| image_cleanup | NOT_TESTED | Image-free target; no Storage API request |
| cleanup_complete | PASS, contract scope | Operator deletion and public absence/baseline totals; no additional test data generated |
| existing_observations_unchanged | unknown, whole-DB comparison not performed | No existing row was a test target; unchanged totals do not prove all other fields unchanged |
| errors | None reported in admin flow | Browser automation unavailable; marker lookup mismatch diagnosed without writes |

Public absence alone is not a privileged proof of physical-row deletion. Admin
server PASS combines the user's normal delete success, the reviewed repository's
requirement for a matching returned deleted-row ID, and the public after-state.
No direct authenticated request capture, privileged SQL inspection or independent
admin/owner identity comparison is claimed. Non-owner button hiding is **not**
server denial: the second ordinary account exists, but the browser execution tool
failed before access. No credentials were copied and no alternate-role request was
substituted. Keep that security verification **PARTIAL**.

When asked about map removal, the operator reported that local Kakao integration
was unavailable and markers were not displayed. This does not establish a deletion
regression or a successful marker refresh. Small-map-list removal was not answered
separately, so it also stays PARTIAL for this run; prior owner evidence is preserved.

### Remaining Decisions And Document Gate

- **READY evidence:** prior owner/anon and Phase 32 limited smoke, applied migrations,
  Preview UI, and this admin observation deletion within the stated evidence scope.
- **REQUIRES_DECISION_OR_VERIFICATION:** ordinary non-owner actual DELETE denial and
  **migration_history=unknown**. No history query/repair, ledger write, SQL or migration
  replay ran here. Applied/post PASS does not prove a CLI ledger entry. Do not reapply.
- **Recorded MVP limitations:** image cleanup is best-effort and may leave orphan
  objects; live Storage deletion remains NOT_TESTED. Pending/rejected deletion is
  deferred. Date-diversity/map-row-cap, actual delete-driven Kakao marker removal,
  live cascade and disappearing-last-page limitations are unchanged. No new risk
  acceptance or Production approval is inferred. **exact rollback SQL not documented**.
- App/tests/packages/migrations/settings are unchanged. **213 tests/typecheck/build
  PASS and audit 0** belong to `e7703f8`, not this task. Fresh three-document checks
  **PASS**: diff, Markdown whitespace/EOF and 36 local links, forbidden tracked paths,
  secret-like additions and evidence consistency; Phase 32 history unchanged.
  Only a local documentation commit is allowed;
  no push/merge/deployment, archive or overall Verified closure.

**한국어:** 새로 만든 이미지 없는 관찰 1건을 관리자로 취소 후 삭제했고, 공개 API에서도
사라진 것을 확인했습니다. 공통 요약은 이번 등록 전의 91종·105건으로 돌아왔습니다.
비작성자의 버튼 숨김은 확인했지만 실제 서버 삭제 차단은 도구 연결 문제로 미검증입니다.
계정이 없어서 생긴 제한은 아니며, migration 이력도 아직 확인되지 않았습니다.

## Preview UI Smoke At e7703f8

Historical Preview evidence. Admin observation deletion was then NOT_RUN; the new
local smoke above supersedes that one item without changing this Preview record or
the Phase 32 admin-comment status.

2026-10-09. The operator responded **"전부 검증했고 에러없어"** to the complete
five-step Preview checklist. The table records that aggregate confirmation as
**OPERATOR_PREVIEW_UI**, not an itemized measurement log or Codex browser automation.
No exclusion or failure was reported. No extra test records or comments were requested.

### Target And Evidence

- Target: the current fast-track branch's **e7703f8 Preview**. The previous task's
  read-only GitHub deployment metadata reported environment Preview, matching feature
  HEAD, production=false and deployment/Vercel status success. The deployment ref was
  the commit rather than a branch-name field; feature HEAD agreement was checked
  separately. This metadata proves deployment status, not screen behavior.
- `preview_repository=supabase`; `shared_supabase_match=confirmed_by_operator`,
  covered by the operator's all-items confirmation of the target check. No protected
  configuration values, application session or secrets were extracted. This is not
  a new Codex comparison of Preview connection settings.
- The operator used their browser and existing accounts. This checklist allowed only
  existing-record reads, delete-dialog **cancel**, and unsubmitted comment controls.
  It did not authorize observation/comment creation or deletion, SQL, Storage writes,
  new accounts or settings changes. Codex sent no new Supabase probe in this close-out.

| Preview result | Status | Evidence and boundary |
| --- | --- | --- |
| public_pages | PASS | OPERATOR_PREVIEW_UI; intro/list/map and public detail |
| public_comments_ui | PASS | OPERATOR_PREVIEW_UI; comment area or empty state; no assumed existing comment count |
| anon_controls_hidden | PASS | OPERATOR_PREVIEW_UI; login prompt, no anonymous observation/comment delete controls |
| owner_delete_button | PASS | OPERATOR_PREVIEW_UI; own approved observation |
| delete_confirmation_cancel | PASS | OPERATOR_PREVIEW_UI; dialog and cancel only, no deletion |
| comment_type_selector | PASS | OPERATOR_PREVIEW_UI; comment/identification controls, no submit |
| comment_input_ui | PASS | OPERATOR_PREVIEW_UI; input limit/empty input/button state, no server write |
| non_owner_controls | PASS | OPERATOR_PREVIEW_UI; visibility only, not actual DELETE denial |
| admin_controls | PASS | OPERATOR_PREVIEW_UI; visibility only, not actual admin deletion |
| pagination_regression | PASS | OPERATOR_PREVIEW_UI; pages, fade/no-auto-scroll, search/photo filters, detail-close state |
| map_date_filters | PASS | OPERATOR_PREVIEW_UI; dates, collapse/expand and separation from list page data |
| common_summary | PASS | OPERATOR_PREVIEW_UI; shared species/records display retained |
| real_kakao | PASS, basic display | OPERATOR_PREVIEW_UI; not delete-driven marker removal or full camera/resize regression |
| responsive_keyboard | PASS | OPERATOR_PREVIEW_UI; narrow-window/keyboard checklist, not every mobile device |
| raw_email_exposed | no, operator-reported | Covered by the requested screen checks; no new log/network audit |
| errors | None reported | Operator aggregate confirmation |

No per-record counts, coordinates, screenshots, measured scroll positions or network
captures were supplied or inferred. Existing comment-kind row/API success remains
the earlier local live smoke below; an empty Preview comment panel does not prove
both kinds were present. A visible button does not prove server authorization.

### Remaining Limits And Decision

- Preserve `db37ba1` local UI/LIVE_API evidence and **0014/0012/0013 APPLIED + post PASS**.
  No live DB test was repeated. Previous disposable observation/comments remain
  recorded as cleaned up; no new cleanup or physical-row inspection is claimed.
- Non-owner actual observation/comment DELETE **PARTIAL**; actual admin deletion
  **NOT_RUN**; delete-driven Kakao marker removal **PARTIAL**. Today's basic Kakao
  display PASS does not overwrite those narrower untested actions.
- Image cleanup **NOT_TESTED** and best-effort: Storage permission failure can leave
  an orphan without reversing successful row deletion. Pending/rejected owner deletion
  stays **deferred**; approved-only public-path scope is unchanged.
- Live cascade, disappearing-last-page boundary, full map coverage and detailed
  camera/resize regression retain their previous limits. Build-log secret review is
  not added by this UI report. **exact rollback SQL not documented** remains unchanged.
- No confirmed core Preview UI blocker was reported. Before Production, explicitly
  decide whether to accept the listed residual risks or authorize targeted additional
  checks, and separately approve the release/merge/deployment. No automatic release,
  Phase history archive or overall Verified status follows from this smoke.

### Documentation Verification

This follow-up changes only two Markdown documents. Full **213 tests/typecheck/build
PASS and audit 0** belong to `e7703f8`; they were not rerun or relabeled as fresh here.
Document diff/Markdown whitespace/EOF/links, forbidden files and secret-like checks:
**PASS**, two intended documents only; app/tests/packages/migrations/settings unchanged.
No push/deployment in this follow-up.

## Dependency Security Correction

2026-10-09, after `db37ba1`. This is a dependency-only correction, not another live
smoke or a change to the deletion/comments implementation.

- Reproduced the pre-fix audit failure: `source-map-js@1.2.1`, one High,
  [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
  Both dependency paths are transitive:
  `@tailwindcss/vite@4.3.1 -> @tailwindcss/node@4.3.1 -> source-map-js` and
  `vite@8.0.16 -> postcss@8.5.28 -> source-map-js`. Both parents allow `^1.2.1`.
- Normal targeted npm resolution selected **1.2.2**. `package.json` is unchanged;
  the only package-lock change is one package entry's **version, resolved URL and
  integrity** (three removed/three added lines). No parent, unrelated dependency,
  source registry, install lifecycle, override or audit threshold was changed.
- This is a build-tool dependency, with no direct application import. The project
  declares its parent tools under dependencies, so npm does not mark it dev-only;
  the audit included development dependencies as well.
- Commands: targeted `npm.cmd update source-map-js --package-lock-only --ignore-scripts
  --no-audit --no-fund --registry=https://registry.npmjs.org/`, followed by installation
  with the same script/audit/fund/registry options. npm's generated hidden install
  lock temporarily said 1.2.2 while the actual installed manifest still said 1.2.1.
  Only `node_modules/.package-lock.json` was invalidated; normal installation then
  changed exactly one package. No node_modules tree removal or lockfile regeneration.
- Actual installed manifest, lockfile, `npm ls` and `npm explain` agree on **1.2.2**.
  Registry tarball/integrity metadata was checked. No vulnerable copy remains in
  this dependency graph; no auto audit fix or unrelated update was used.

| Fresh check after installing 1.2.2 | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs` | **213 PASS**, 0 failed/skipped/cancelled |
| `npm.cmd run build` | PASS; normal app entry/assets generated, no source-map error |
| `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/` | **0 total / 0 High / 0 Critical**, advisory absent |
| Diff, Markdown/SQL/JSON whitespace/EOF, forbidden paths, secret-like changes | PASS; 27 files checked, 4 JSON files parsed, no new findings |

The full suite includes Phase 26/27, pagination/fades/no-auto-scroll, date filters,
public summary, approved owner/admin deletion, comments and migration static tests.
The test loader emits its existing experimental-loader warning. Build warnings about
mixed static/dynamic auth imports and plugin timings are non-fatal; they are not
source-map failures. Artifact checks do not claim a new browser render/live PASS.
An additional encoding check found the pre-existing BOM in unchanged migration 0010;
it was compared with HEAD and left intact, not treated as a new dependency defect.

Changed tracked scope: `package-lock.json`, this readiness, `next-session-handoff.md`
and a historical-status link in `observation-delete.md`. App, tests, package.json,
migrations and deployment settings stay unchanged. Existing db37ba1 live evidence
below is preserved, not rerun: no observation/comment/account/Storage/DB changes.
Non-owner actual DELETE remains PARTIAL, admin deletion NOT_RUN, actual Kakao
PARTIAL and image cleanup NOT_TESTED. No phase archive or Verified closure.

At the security commit's pre-push checkpoint, remote feature was absent and fetched
main/origin/main were `a3887a7`; Preview status/UI were then unconfirmed. Subsequently
`e7703f8` was normally pushed with matching local/remote HEAD. Although no deployment
connector or gh/vercel CLI was installed, public GitHub deployment/status metadata
confirmed that commit's Preview success. The operator's later UI report is recorded
above, separately from metadata. Main/Production remain unchanged.

## Current Live Smoke Evidence

Historical owner/anon and Phase 32 evidence from `74fba30`, recorded in `db37ba1`.
The separate final permission section above updates only the later administrator
observation deletion result. Keep this original run and Phase 32 evidence intact.

### Applied Migrations

| Migration | Remote state | Evidence |
| --- | --- | --- |
| 0014 | APPLIED, pre/apply/post PASS | Operator SQL Editor results; anon-only helper EXECUTE correction |
| 0012 | APPLIED, pre/apply/post PASS | Original precheck rerun after 0014; approved-only delete |
| 0013 | APPLIED, pre/apply/post PASS | Operator table/constraint/privilege/RLS checks after 0012 |

The one-time manual order was **0014 -> 0012 -> 0013**. Canonical repository replay
is still `0001 -> ... -> 0012 -> 0013 -> 0014`. Codex did not operate SQL Editor,
run remote SQL/CLI migration commands or modify the reviewed files during smoke.
Do not infer a migration-tool ledger entry, rerun applied migrations or repair
history automatically. **exact rollback SQL not documented** remains in effect.
Current anon grant origin is still unknown; global default privileges were not changed.

### Environment And Evidence Types

- `OPERATOR_UI`: user-operated ordinary local app, not a synthetic fixture or
  Codex browser session. Current Vite modules' source matched local code `74fba30`
  and repository mode was Supabase. Browser automation failed to initialize.
- `LIVE_API_FROM_LOCAL_PUBLIC_CONFIG`: public settings read from browser-served
  Vite modules in memory; `.env.local` was not read. Dedicated public clients had
  no user session, persistence, refresh or login. No service-role/admin SQL.
- `STATIC` and historical automated tests: repository guards, refresh wiring,
  SQL definitions and simulated transports; not substitutes for live role actions.
- Safe temporary harnesses/results live outside the repository. Result artifacts
  contain counts, booleans, safe errors and comparison hashes, not credentials,
  raw observation/comment rows, identities, coordinates or image paths. Public API
  reads and the authorized denial probe generated ordinary remote traffic/logs.

### Phase 32

The user designated an existing own approved parent. Ownership is operator-reported;
the anonymous client did not authenticate as the writer. The operator created exactly
one general and one identification comment through the normal UI, then deleted both.
No observation content/taxonomy, account or image was modified for this test.

| Result | Status | Evidence |
| --- | --- | --- |
| anon_comment_read | PASS | Actual comment repository + public count crosscheck; signed-out UI confirmation |
| general_comment_create | PASS | OPERATOR_UI and one public comment-kind row |
| identification_comment_create | PASS | OPERATOR_UI and one public identification-kind row |
| taxonomy_unchanged | PASS | Before/during/after fingerprints of actual observation fields and public lineage |
| raw_email_exposed | no | Operator screen report; safe mapped display fields while comments were present |
| non_owner_delete | PARTIAL | Second regular account exists; hidden button PASS, actual DELETE request NOT_RUN |
| own_comment_delete | PASS | OPERATOR_UI and public count/items back to zero |
| admin_comment_delete | NOT_RUN | No extra comment or privileged session used |
| cleanup_complete | PASS | 0 -> 2 -> 0; same approved parent/detail unchanged |
| observation_modified | no | Compared fields unchanged; no observation mutation by this harness |

Safe execution references: baseline `1791518017378`, both kinds present
`1791518858287`, final zero-comment cleanup `1791519065367`. The first cleanup
claim was followed by an API read still showing two comments; only after the user
actually deleted them did the later check close cleanup. No failure was hidden.
`scientific_name` is the observation's reported name column; the private resolver
cache was not queried. Admin/non-owner request denial, 20+ live comments, malicious
payloads, hidden-parent cases and live cascade remain outside this smoke result.

### Phase 29

Exactly one newly authorized approved image-free observation was created through
the ordinary app. No existing user observation was a deletion target. Baseline
records/species were **105/91**; after creation **106/92**. The operator put the
test marker in name rather than description, so name-based species increased too.
The first exact-description lookup stopped with **zero DELETE attempts**. A narrow
new-row read found the unique image-free marked name; time/project/target fingerprints
then bound the probe. No record was renamed or silently substituted.

| Result | Status | Evidence |
| --- | --- | --- |
| environment | local_supabase | Served source/config checked, not Preview |
| test_observation_created | PASS | Operator create + one new marked public record |
| approved_and_image_free | PASS | Actual status and both image-reference fields checked |
| public_visibility | PASS | Targeted public read + operator list/detail |
| summary_after_create | PASS | Actual summary method/count-only agreement, 105 -> 106 records |
| anon_delete_denied | PASS | One public-client DELETE: HTTP 401, code 42501; same unchanged target remained |
| non_owner_delete_denied | PARTIAL | Operator confirmed button hidden using second regular account; actual request NOT_RUN |
| owner_delete_ui | PASS | Operator explicitly confirmed cancel, later confirm, close and refresh without manual reload |
| owner_delete_server | PASS, contract scope | Operator success + repository requires returned deleted ID + later public absence |
| list_refresh | PASS | Operator saw card removal and refreshed list |
| summary_refresh | PASS | Operator update + API records/species returned to 105/91 |
| page_state_after_delete | PASS, observed case | Search/filter retention confirmed; disappearing-last-page case NOT_RUN |
| map_data_refresh | PASS, small list | Operator confirmed removal from small map list; no new full-DB coverage claim |
| real_kakao_marker_removal | PARTIAL | Not included in the final three-item confirmation |
| admin_observation_delete | NOT_RUN | No second disposable observation created |
| image_cleanup_case | not_applicable_no_image | Storage cleanup NOT_TESTED; no Storage mutation |
| cleanup_complete | PASS | Authorized target absent, no extra smoke records/comments created on it |
| errors | None in core flow | Expected 42501 denial is success; separate dependency audit failed below |

Safe runs: precreate `1791519411759`, bound target/anon denial `1791520792589`,
post-delete `1791526530750` (2026-10-09 06:15 UTC). The final read found **zero** marker
matches and no target fingerprint among all **105** approved `id,name` metadata rows,
using the actual bounded summary method. Independent count-only result agreed;
species returned to **91**. No entire observation/image download was introduced.
Final probe had four reads and zero writes; the earlier authorized anonymous probe
made exactly one DELETE attempt and did not delete the record.

Public absence alone cannot prove physical deletion rather than hidden status. The
recorded owner-server PASS combines the operator's successful normal delete with the
reviewed repository's returned-ID check and public after-state. No privileged physical
row inspection or owner network capture is claimed. Last-page collapse, double-click,
tree aggregate refresh and live FK cascade retain prior static/automatic evidence,
not newly invented live PASS. The map's original server row-cap limitation remains.

### Historical Checks And Push Hold At db37ba1

The following records the original docs-only close-out. Its audit failure/push hold
is superseded by the fresh dependency correction above, not erased or relabeled PASS.

- Core Phase 29 smoke has no confirmed functional blocker; the two Phase 32 comments
  and the one Phase 29 disposable observation are cleaned up. Original parent stays.
- This close-out changes docs only. **213 Node tests, typecheck/build PASS** remain
  historical at `23d634a`; no full-suite/build rerun and no copied fresh PASS count.
  The 0014-focused three-test run is historical as well.
- Fresh `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/`
  exited **1**: **one High** in installed `source-map-js@1.2.1`. Registry audit
  succeeded; this is not a connectivity error. `npm.cmd ls source-map-js` identifies
  paths through `@tailwindcss/node` and Vite's `postcss`.
- [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) reports
  event-loop denial of service from indexed source-map section offsets; patched
  version is 1.2.2. The package is present in the build toolchain, but application-
  specific exploitability has not been demonstrated or dismissed. No auto audit fix,
  package/lockfile update or weakened audit threshold was performed.
- **Feature push held for this new audit blocker.** Remote feature ref was absent
  after fetch; main/origin/main remained `a3887a7`. Preserve the smoke in the requested
  local docs commit; separately approve minimal dependency remediation/verification
  or explicitly review the risk before a push. No main/Production operation.
- No Vercel/GitHub deployment connector or existing `gh`/`vercel` CLI is available
  here. With no feature push, no new Preview was requested; prior Phase 28 Preview
  status is not this branch's deployment evidence. Do not equate push/build with UI.
- Fresh document gate **PASS**: diff/Markdown whitespace/EOF/links, secret-like changes,
  forbidden tracked paths, unchanged app/package/migration inputs and status consistency.
  Four intended documents checked, no findings. These checks do not override the
  separate failed dependency audit or guarantee against every possible secret.

**한국어:** 실제 댓글 2개와 전용 관찰 1개를 각각 정리했고, 작성자 삭제의 핵심 동작은
통과했습니다. 다른 계정의 실제 삭제 요청, 관리자 삭제, Kakao 마커 및 이미지 정리는
확인하지 않았습니다. 새 High 의존성 문제가 나와 문서는 로컬 커밋하되 push는 보류하며,
패키지 보정은 별도 승인 후 진행해야 합니다. Production 배포나 전체 완료는 아닙니다.

## 0014 Helper Permission Prerequisite

Historical preparation below was recorded at `74fba30`; remote NOT_APPLIED and
precheck-stop descriptions are that earlier state. The current applied/live state
above supersedes them. Do not use the old runbook to repeat application.

### Evidence And Cause

The operator ran the original 0012 precheck and reported only
`admin_helper_not_public=false`. Follow-up read-only diagnostics found the reviewed
zero-argument boolean `public.is_admin()`, no PUBLIC EXECUTE, direct/effective anon
EXECUTE, authenticated EXECUTE, no inherited anon EXECUTE and no anon ownership.
The operator subsequently reported booleans true and review counts zero: no helper
reference in the examined anon policy qual/with_check or catalog dependencies, no
other policy function/public callable function/readable view requiring review, and
`owner_default_grants_anon_execute=true`. This is **operator-reported catalog
evidence**, not a Codex remote query, browser smoke or newly executed result file.

Local 0001 creates the helper, revokes PUBLIC and grants authenticated, but does not
explicitly revoke anon. With the reported creator/default-permission conditions,
new function creation can assign a direct anon grant that PUBLIC revoke does not
remove. This is a reproducibility gap, not evidence of when/how the current grant
originally appeared: **grant origin = unknown**. Defaults do not continuously regrant
permissions to an existing function. The inference about fresh creation follows
[PostgreSQL default privileges](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html);
an existing function's permissions are preserved by
[CREATE OR REPLACE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html).
No fresh database replay or remote modification was performed to test this inference.

### Exact Correction And Limits

The complete [0014_revoke_anon_is_admin_execute.sql](../../supabase/migrations/0014_revoke_anon_is_admin_execute.sql)
contains **one statement only**: revoke EXECUTE on `public.is_admin()` from `anon`.
It relies on the existing 0001 helper and anon role, not on 0012/0013 policies or
comments schema. It is not a Phase 29 feature expansion. It leaves authenticated
admin functionality, PUBLIC rights, table grants, roles, RLS and public observation/
image read definitions unchanged. No CASCADE, other function change, data write,
global default change or `ALTER DEFAULT PRIVILEGES` is included.

After the entire canonical replay finishes, this helper's direct anon EXECUTE is
explicitly removed. Effective denial also requires the checked lack of PUBLIC,
ownership/bypass or inherited execution routes. A different environment with such
routes needs review; 0014 does not silently remove other roles' grants.
The known owner default anon grant remains unchanged and is **not a blocker or a
false-required gate** in the new checks. Neither 0014 nor this decision fixes default
EXECUTE on every future new function.

Future security/helper-function migrations must explicitly review per-function
PUBLIC/anon/authenticated EXECUTE. Retain authenticated only when required, and
explicitly revoke anon when not required. Do not infer safety from a PUBLIC revoke
alone. No other existing function is bulk-hardened in this task.

### Pre/Post Read-Only Checks

- [0014 pre-apply](sql-checks/0014-pre-apply.sql): expect all true. It checks the
  exact signature/no overload, reviewed SQL/STABLE/SECURITY DEFINER/search_path/body,
  PUBLIC denial, direct and effective anon grant, authenticated direct/effective
  grant, no role bypass, anon ownership/inherited/grant-chain exceptions, actual
  anon policy expressions and function dependencies, and the reviewed observation/
  image public/admin SELECT structures and read grants.
- [0014 post-apply](sql-checks/0014-post-apply.sql): expect all true. The only
  intended changed checks are anon **direct ACL absent** and **effective EXECUTE
  absent**. All helper/role/policy/read-grant checks repeat the precheck. The known
  default privilege is deliberately omitted from pass gates, not changed or ignored
  as a future-function risk.
- Comparisons use actual qual/with_check and catalog references, not names alone.
  Public observation/image predicates are compared with the reviewed 0001/0002
  definitions. Post is not a stored pre-run snapshot: equality means the same
  reviewed baseline passed both runs. Deparser differences, custom functions/views,
  additional policies or grant chains cause a stop for review, not an automatic fix.
  Conservative function/view checks cover the known application public paths;
  absence of catalog references alone cannot prove absence of arbitrary dynamic SQL.
- Only booleans are returned. No function is invoked, no raw ACL/body/application
  rows/identities/configuration are returned, and no grants are modified. At
  preparation time these files were not yet run against PostgreSQL. The operator
  subsequently reported both checks PASS as recorded above; Codex did not run SQL.

### Link Back To The Original 0012 Precheck

The original [0012-pre-apply.sql](sql-checks/0012-pre-apply.sql) is byte-for-byte
unchanged in Git. Its `admin_helper_not_public` is the negation of anon's effective
EXECUTE. A successful 0014 postcheck explicitly proves that effective privilege is
absent, so this predicate should become true. The helper, authenticated permission,
role flags, table/column metadata and all observation SELECT/DELETE grant/policy
preconditions are untouched by the single function REVOKE. They were reported true
previously, but must be rechecked for intervening drift. Do not infer a fresh complete
0012-pre PASS from 0014-post alone or weaken the old check.

### Two Different Orders

**Canonical repository replay:** `0001 -> ... -> 0012 -> 0013 -> 0014`.
Four-digit numbering and all existing names/content/order remain intact. Pre/post
files under docs are manual gates, not automatically interleaved migration bodies.
The anon grant may exist until 0014 in a fresh replay with these defaults; do not
expose an incomplete replay as the hardened final state.

**One-time current-target manual order**, to unblock the stopped 0012-pre:

1. 0014 pre-apply; every boolean true.
2. Entire single-statement 0014; operator reports execution success.
3. 0014 post-apply; every boolean true.
4. Original 0012 pre-apply, from the beginning; every boolean true.
5. Resume the existing steps below: 0012 apply -> 0012 post -> 0013 pre ->
   0013 apply -> 0013 post, waiting for the operator after each step.

This exception is possible because 0014 only touches the already-existing helper
ACL and has no 0012/0013 schema dependency. Do not rename/reorder files or execute
the whole pending batch to work around the gate. Manual SQL Editor application may
not update the migration tool's ledger; record the operator result separately and
review actual metadata/ledger before any future CLI operation. No history-repair or
CLI command is authorized here.

On false/null/error, stop and diagnose read-only. Do not repeat the migration or
add a compensating GRANT. **exact rollback SQL: not documented**. Restoring anon
EXECUTE is not an approved rollback: no evidence establishes that it was intended.
The 74fba30 preparation task itself only prepared files and touched no remote data.
The later authorized manual applications and smoke are separately recorded above.

### Historical Preparation Checks At 74fba30

Local checks **PASS** for the one-statement target/role, read-only catalog SQL structure,
reviewed helper/policy definitions, consistent pre/post predicates, unchanged
0012-pre and 0001~0013, unique next migration number/order, Markdown/SQL whitespace/
EOF/links, forbidden tracked files and secret-like changes. No PostgreSQL parser,
server execution or full replay is claimed. Existing focused command
`node --test tests/migration-readiness.test.mjs`: **3 PASS, 0 failed**. These existing
tests protect 0012/0013 contracts; the new 0014 structure/definition comparisons were
checked separately by a local read-only Node checker. This is not a full-suite run.
The first old-file comparison failed because the checker stripped an existing UTF-8
BOM in 0010; preserving it in the checker made the equality check pass. No existing
migration was edited to satisfy the comparison, and no DB failure was involved.
The prior **213 tests, typecheck/build PASS and audit 0** belong to `23d634a`'s
readiness session. They are not rerun for this SQL/check/docs-only change: app and
dependency inputs are unchanged, no push/release is taking place. Deno/Docker/WSL/
Supabase local stack are not needed or started. These fresh local results do not
replace the pending operator execution of 0014 pre/post or actual role/live tests.

## Implemented Scope

| Area | Local implementation | Boundary |
| --- | --- | --- |
| Observation delete | Owner own approved / admin any approved; confirmation and RLS-backed delete | Non-owner/anon denied; pending/rejected deletion deferred |
| Refresh | Close detail, refresh paginated list/map/summary/tree, preserve filters, last-page correction | No browser reload or new map camera behavior |
| Image cleanup | DB-first, trusted returned path, validated best-effort remove | Existing Storage DELETE unavailable; orphan risk for owner/admin |
| Comments | Public approved-parent read, authenticated create, own/admin confirmed delete | No edit, thread, vote, attachment, realtime or reports |
| Identification | Distinct plain-text kind and disclaimer | No observation/taxonomy mutation or resolver |
| Comment paging | Exact count, 20 rows, newest timestamp/id, more and retry | Offset concurrency is not a snapshot |
| Cascade | Observation FK ON DELETE CASCADE; mock tombstone listener | Real DB cascade NOT_RUN |
| Privacy | Safe nickname snapshot/fallback; plain React text; internal author ID only | Free-text user content is not an automated moderation system |

Details and full migration links:
[observation deletion](observation-delete.md),
[comments and identification](observation-comments-identification.md).

## Confirmed MVP Boundary

**Phase 29 MVP deletion scope = approved observations visible through
the current public observation path**

The user resolved the earlier scope question: owner pending/rejected deletion is
**deferred, not a bug or a readiness blocker**. Private owner SELECT and its UI need
a later design. No public/owner SELECT expansion, delete RPC or own-record page.
Admin all-status review is preserved, but observation deletion is approved-only.

Review found the original 0012 restored DELETE while reusing the all-status admin
policy from 0001. That would authorize more deletion than the confirmed scope.
The final unapplied 0012 explicitly requires approved for both owner and admin,
reuses `public.is_admin()` and preserves existing SELECT/UPDATE policies. Minimal
matching guards are in the Supabase/mock repositories and public/admin buttons.
This is a real authorization-scope correction after `77a394e`, not a style rewrite.
0013 was not revised. That scope correction did not add 0014; the later separately
authorized 0014 above is only helper EXECUTE hardening, not deletion-scope expansion.

Accepted image boundary: owner/admin approved observation row deletion is supported;
image cleanup is **best-effort** after DB success, from the trusted returned path.
Missing Storage permission may leave an orphan; it does not reverse observation
deletion or block this MVP's migration preparation. Full Storage cleanup authorization
is a later operational hardening task. No Storage RLS, Edge Function or privileged
frontend key is added. Use Storage API, never SQL metadata deletion, for actual files.

Phase 32 remains unchanged. Identification is reference text, not a change to
reported_scientific_name, taxon_id, taxonomy_verified_at, match/confidence or verified
taxonomy, and does not invoke a resolver. Comments on a subsequently hidden parent
remain outside the public author's read/delete UI; admin policy permits administrative
access. Observation deletion cascades comments in DB, not a frontend delete loop.

## Previous Checks At 23d634a (2026-10-05)

| Check | Result | Meaning |
| --- | --- | --- |
| TypeScript `npm.cmd run typecheck` | Historical PASS | Previous 23d634a readiness run |
| `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs` | Historical 213 PASS, 0 failed | Previous 23d634a full run, not rerun for 0014 |
| `npm.cmd run build` | Historical PASS | Previous Vite application build, not fixture entry |
| `npm.cmd audit --include=dev --audit-level=high --registry=https://registry.npmjs.org/` | Historical PASS, 0 vulnerabilities | That audit time only; no auto fix or new audit |
| SQL policy/privilege/cascade shape and pre/post files | PASS, STATIC | Candidate review and read-only/digest contracts, not a PostgreSQL parser/runtime run |
| Mock/repository/UI contracts | PASS | Fake SDK transport and component hook harness, not browser DOM |
| Local fixture HTML/entry/TSX/CSS | Historical serving PASS | Checked in the preceding implementation session, not rerun here |
| Direct browser rendering | PARTIAL, inherited | Previous browser initialization failed: missing sandboxPolicy; not rerun here |
| Real Supabase roles/SQL/cascade | NOT_RUN | No remote SQL or actual writes authorized |
| Real image removal | NOT_RUN | Existing policy risk retained |
| Real Kakao | PARTIAL, inherited | Provider unchanged; regression tests pass, no live map action |

Previous 208 tests/typecheck/build/audit belong to the implementation session;
the 213-test readiness session followed it. That readiness build reported a non-fatal mixed
static/dynamic auth-provider import warning and plugin timing notice, not a failure.
The dynamic auth import in mock deletion delays lookup and is not claimed as a
separate bundle optimization. No dependency/config change to suppress warnings.

The suite covers owner/admin/non-owner/anon deletion transports, mock tombstones,
confirmation/double-click guards, cleanup validation/failure, actual App list/map/
summary refresh, last-page correction/search retention, admin delegation, tree
refresh/retry, comment 0/1/19/20/21/40/41 boundaries, same-time ordering, safe names,
plain text, invalid body/kind, self identity, hidden-parent rejection, mock cascade,
independent retry and late response/write guards. Existing Phase 26/27/28 regression
tests remain included. Fake RLS responses do not prove deployed role enforcement.
New cases verify owner/admin rejection of pending/rejected in actual mock/query
paths, approved-only admin controls, read-only catalog check files and the exact
0013 trigger-body fingerprint. No SQL, PostgreSQL instance or remote role test was run.

## Local Manual Fixture

In the preceding implementation session, the server was confirmed for this workspace
at `http://127.0.0.1:3000`; it was not rechecked in this readiness-only workflow.
Use `http://127.0.0.1:3000/tests/fixtures/observation-community.html` only for isolated
memory testing. The HTML's Vite proxy, fixture module, real detail/comments modules
and stylesheet respond correctly, not index fallback. HTTP success is not visual PASS.
No Supabase/Auth/Kakao request is required by this fixture; role data is injected,
not an actual login. Its 27 synthetic comments are not production default data.

1. In 비로그인, read the first 20 comments and 댓글 더 보기 to reach 27; no write/delete controls.
2. Choose 작성자, submit each kind, and delete an own comment after confirmation.
   Empty/overlong input is blocked; a different author's delete control is hidden.
3. Choose 관리자 to see other-comment deletion; choose 다른 사용자 to check ownership.
   Narrow the window and use keyboard controls; no account creation is needed.
4. Choose 작성자/관리자 and confirm 관찰 삭제. Detail closes and fixture comments
   cascade in memory. Refresh only this fixture to restore isolated initial data.

Do not perform deletion/comment writes in the ordinary connected app or shared DB
as part of this task. The existing pagination/month fixtures remain unchanged.

## Manual Dashboard Apply Order

Codex has not executed any of these SQL files. Select the intended project in
Supabase Dashboard SQL Editor yourself. Use each whole linked file without editing
the migration body. The pre/post files read only system catalogs and return booleans;
they do not return observations, comments, identities, connection values or paths.
Migration files contain their own transaction; verification files are separate reads.

**Historical procedure: the current target has already completed this sequence.
Do not reapply.** For the one-time order, 0014 preceded 0012/0013. The 0014 file is
the single REVOKE statement;
unlike 0012/0013, it does not add transaction wrapper commands.

1. Run [0012 pre-apply](sql-checks/0012-pre-apply.sql).
2. Confirm **every result is true**. It checks table/RLS, reviewed admin helper,
   exact approved public SELECT and baseline admin DELETE, revoked DELETE grant,
   role bypass flags and absence of owner-policy/extra-policy conflicts.
3. Run the **entire current [0012 migration](../../supabase/migrations/0012_observation_owner_delete.sql)**.
4. Run [0012 post-apply](sql-checks/0012-post-apply.sql); confirm all true:
   grant, anon denial, approved owner/admin conditions, no extra DELETE/ALL policy,
   and preserved public SELECT/owner/admin UPDATE definitions.
5. Only then run [0013 pre-apply](sql-checks/0013-pre-apply.sql).
6. Confirm **every result is true**: observations/profiles/auth prerequisites,
   prior 0012 metadata, and no comments table/type/function/index/policy conflicts.
7. Run the **entire [0013 migration](../../supabase/migrations/0013_observation_comments.sql)**.
8. Run [0013 post-apply](sql-checks/0013-post-apply.sql); confirm all true:
   table/RLS, columns/defaults, FK cascade/author FK, CHECKs, indexes, exact policies,
   no client UPDATE, insert identity protection, direct/effective grants and trigger.

**Stop on any false, null or error. If 0012 fails, do not apply 0013.** Do not
repeat a migration or invent/run rollback. Report only the boolean column name and
result, or a safe SQL error code. Do not send UUIDs, email, URLs, keys, observation/
comment text or raw error output. A deparser/version difference needs review, not
automatic policy relaxation. These catalog checks are not live role/cascade proof.
The prechecks identify unapplied object/grant state; a SQL Editor application is not
assumed to populate migration-tool history. Already-applied or partial state stops
this clean-apply sequence and needs inspection.

**exact rollback SQL not documented** for either candidate. Concepts are linked in
the feature documents; no executable rollback was invented. This disclosed absence
alone does not block this user-requested readiness. Preserve baseline definitions
and recovery information; any actual rollback still needs a separately reviewed
exact plan. Revoking permissions/dropping schema cannot restore deleted rows/files.

## Original Live Smoke Plan And Remaining Cases

This is the retained approval boundary, not a claim that the whole plan is still
NOT_RUN or now fully PASS. The limited completed cases and remaining roles are in
Current Live Smoke Evidence above. Any additional write still needs approval.

Run only after both migrations and all postchecks succeed, under separate explicit
approval for actual writes. Existing real user observations must never be test
deletion targets. A suitable dedicated approved smoke record may be used; creating
one or any additional admin-delete record requires separate user approval first.

- Phase 29 starts with an **image-free**, dedicated approved record. Test owner
  deletion, authenticated non-owner denial and anonymous denial using appropriate
  separate sessions; test admin deletion only on a separately authorized target.
  Verify list/detail disappearance, species/records update, map/list/tree refresh,
  last-page correction and retained search/filter state without reload.
- Image cleanup is not a gate for the first smoke. Live image deletion requires
  separate explicit approval; record any best-effort warning/orphan risk without
  exposing internal paths. Do not grant new Storage permission to make a test pass.
- Phase 32 uses an approved dedicated smoke parent: anonymous read, one general
  comment and one identification comment, non-owner deletion denial, own deletion,
  and admin deletion only if its target/write has been separately approved. Check
  no raw email display, safe empty/length/kind errors and unchanged official taxonomy
  metadata. Do not use real user comments as disposable fixtures.
- Verify comment cascade only on a separately authorized disposable observation
  deletion, after preparing its comments with approval. No frontend per-comment
  deletion, no comment count gate, and no ghost/late detail after parent deletion.
- Public pending/rejected visibility remains denied. Owner deletion of those rows
  is deferred, not a smoke requirement; comments on non-approved parents remain
  protected. Any denied-role test must not modify someone else's real record.

No remote data was created during the earlier readiness-only task. Later smoke
writes used their separate explicit approval. The latest feature-push approval is
conditional on no blocker, and is held by the fresh audit finding. Production still
requires separate approval; older Phase 28 approval does not authorize it.

## Previous Change Boundary At 23d634a

This follow-up changes only unapplied 0012, four matching deletion guards, focused
tests, four read-only SQL check files and four readiness documents. The initial
feature implementation remains in the stacked branch. 0001~0011, 0013, packages/
lockfile, Edge Functions, map provider/camera, Auth, Storage cleanup/policies,
settings and all remote data are unchanged. No new function/permission feature.
Final format/security/scope checks PASS: `git diff --check`, Markdown/SQL whitespace/
EOF, fences/tables/local links, forbidden tracked files and secret-like changes. Pattern scans
are not a guarantee against every possible secret. No JSON/TOML settings or Deno
code changed; no additional parser/Deno rerun is needed. Docker/WSL/Supabase local
stack was not started. Local normal commits only, no amend or self-hash edits.

**한국어(이전 준비 기록):** 0012 사전 검사 중단 당시 0014에 함수 하나의 anon 권한
회수를 준비했습니다. 이후 사용자가 0014, 0012, 0013을 순서대로 적용하고 검증했습니다.
현재 상태와 남은 항목은 이 문서 상단의 실제 smoke 결과를 기준으로 합니다.
