# Migration Reconciliation Evidence

## 0015 Correction Candidate: Not Applied

2026-10-09, entry local `88cd663`, remote `0f2fdae`, clean worktree. The separate
approval now permits a local correction candidate, read-only checks, regression
tests and a local commit only. Remote SQL, push and deployment remain prohibited.
The diagnostic record below is preserved, not a new remote verification.

### Exact Scope And Evidence

- Function: `public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)`.
  Returns `public.observations`; PL/pgSQL, SECURITY DEFINER, empty `search_path`,
  VOLATILE, called on null input, authenticated EXECUTE; PUBLIC/anon EXECUTE absent.
  Previous operator catalog checks confirmed the reviewed contract, not an owner
  name or complete raw ACL. Those are captured internally by 0015, never printed.
- The remote wrong return's **exact spelling remains unknown**. The fourth operator
  result proves only the `amphibia`/`reptilia` return differs from `양서/파충류`, is
  not an NFC-only difference and lies outside the validated seven-category CHECK.
  All six conditions and other six labels matched. Its origin is unknown.
- Local immutable **0011 already contains the correct label**. Do not modify/replay
  it. The existing authenticated repository's `createObservationWithVerifiedTaxonomy`
  invokes this RPC with eleven named arguments; the function derives the broad
  group from the trusted taxon, not a caller-selected classification. Returning the
  invalid group can fail `observations_taxon_check` during insert (STATIC inference).
  **Actual failing registration NOT_REPRODUCED**; no observation or comment created.

### Candidate And Preservation Guards

- [0015 candidate](../../supabase/migrations/0015_fix_observation_taxon_group_label.sql)
  is one atomic DO statement. It validates the exact signature, parameter defaults,
  attributes, access contract, validated CHECK and entire reviewed body. A restricted
  lexer admits only the previously reviewed syntax; unfamiliar escapes, dollar
  strings or block comments stop the candidate instead of guessing equivalence.
- It compares all 773 meaningful tokens with unchanged 0011, excluding **only token
  604**, the one combined-category return literal. The local regression recalculates
  both comparison fingerprints from 0011. This is a bounded source-equivalence
  guard, not a claim that MD5 authenticates untrusted input.
- If that token is an invalid ordinary string, change precisely its character span
  to `양서/파충류`. No global string replacement, other branch/label change, taxonomy
  re-resolution, data UPDATE, extra overload, new helper or dependency on 0012-0014.
  Existing comments/formatting outside the literal are preserved. SQL files use
  ASCII Unicode escapes to avoid relying on clipboard Korean encoding.
- The existing `pg_get_functiondef` CREATE OR REPLACE wrapper is reused, replacing
  its single full source-body occurrence. This preserves signature, return type,
  language, security, search path, volatility and other existing options. The
  migration compares before/after OID, owner, complete ACL and every `pg_proc` field
  except source/default parse text. Argument default expressions are compared via
  `pg_get_expr` because parser source locations can change without changing defaults.
  Any mismatch raises a safe error and rolls back the DO statement. Do not perform
  concurrent function DDL during application.
- PostgreSQL specifies that replacement of an existing function preserves ownership
  and permissions, but unspecified attributes can reset. Reusing the complete
  decompiled wrapper plus the transaction comparison avoids silently relying on
  defaults. No GRANT/REVOKE, owner/default-privilege change or DROP is included.
  Sources: [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html),
  [pg_get_functiondef](https://www.postgresql.org/docs/current/functions-info.html).
- Canonical replay is `0001 -> ... -> 0011 -> 0012 -> 0013 -> 0014 -> 0015`.
  With canonical 0011's already-correct body, 0015 validates the same guards then
  makes no change. Remote recent execution remains `0014 -> 0012 -> 0013`;
  **0015 remote NOT_APPLIED**. This is not migration-history initialization.

### Manual Readiness, Not Execution

1. After **separate remote approval**, run the full [0015 pre-check](sql-checks/0015-pre-apply.sql).
   Every boolean must be true. It specifically requires the current incorrect
   target literal; an already-correct body stops this manual correction path.
2. Only after PASS, execute the complete candidate once. A false/null/error or an
   unexpected function definition means stop; do not force application or loosen
   the checks. Never rerun 0011 or use guessed GRANT/rollback statements.
3. Then run the full [0015 post-check](sql-checks/0015-post-apply.sql). It checks the
   complete corrected body, the precise return slot, all other conditions/literals,
   function metadata, CHECK and client privileges. All booleans must be true.
   Standalone post checks do not reconstruct a historical owner/ACL snapshot;
   exact preservation is enforced in the migration transaction itself.
4. Record operator results before reassessing the remote 0011 final-state mismatch.
   A real registration smoke needs separate data-write approval. **Exact rollback
   SQL: not documented**; reintroducing an invalid label is not an approved rollback.

### Local Verification And Remaining Gates

- New focused file `tests/observation-taxon-label-migration.test.mjs`: **8 PASS**.
  Tests cover both classes and other ranks/fallback, the CHECK label set, corrected
  replay no-op, preservation outside the target, rejection of changes at all 772
  other token positions, unsupported syntax, complete guard copies and SELECT-only
  pre/post checks. The restricted CASE evaluator is a local model, **not PostgreSQL**.
- Full `node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`:
  **221 PASS**, 0 failed/skipped/cancelled. This run includes existing Phase 28
  pagination/date/summary, Phase 29 deletion, Phase 32 comments and migration tests.
  The prior 213 PASS remains historical, not copied as this run's result.
- `npm.cmd run typecheck` and `npm.cmd run build`: PASS. Build retains the existing
  mixed static/dynamic auth-provider import warning and plugin timing advisory;
  no build error. `npm.cmd audit --include=dev --audit-level=high` against the npm
  public registry: 0 vulnerabilities. No package changes.
- Current diff/SQL/Markdown whitespace/EOF, Markdown links/fences, secret-like and
  forbidden tracked-file checks PASS. SQL lexical/delimiter review PASS (STATIC).
  Unique sequential 0001-0015 numbering confirmed; 0001-0014 and existing checks,
  app/package/deployment files unchanged. Only the candidate, two new checks,
  focused test and three existing documents are intended for the local commit.
- SQL review is **STATIC**. No installed PostgreSQL engine/parser was used and no
  remote function/pre/post SQL was executed. App/UI behavior has not been freshly
  live-tested or changed; no real data was created, updated or deleted.
- Remote inventory remains **MATCH 11 / MISMATCH 2 / UNVERIFIABLE 1 / SUPERSEDED 0**
  for 0001-0014. A fifteenth local candidate does not reclassify 0011 or 0010.
  0002 bucket MISMATCH, CLI history `missing_schema`, non-owner actual DELETE
  PARTIAL, best-effort image cleanup NOT_TESTED and Kakao deletion PARTIAL remain.
  0012/0013/0014 previous APPLIED + post PASS evidence is unchanged.
- No Production clearance, history repair, archive or Verified closeout.

## Historical Scope And Decision (88cd663)

2026-10-09, branch `feature/phase-29-32-observation-delete-comments-fast-track`,
entry local/remote `0f2fdae`, main/origin/main `a3887a7`. READ ONLY diagnosis, not a
history repair, schema correction, deployment or Phase closeout. The pre-existing
uncommitted readiness/handoff history diagnosis is preserved.

**OPERATOR_SQL already established `history_schema_exists=false`.** Therefore
`migration_history=missing_schema`, not an application migration failure. No ledger
query, initialization, version insertion or repair has been executed by Codex.
The origin/time of the missing ledger is unknown. Application state and bookkeeping
must be assessed separately. Working UI/live features alone cannot establish all
14 migration effects or prove the files' historical execution.

This inventory reads the active SQL of every local file, including pre/post blocks,
not just filenames. Commented upload candidates in 0002 are not active migration
statements. All 0001-0014 migration files and their existing SQL checks are unchanged
from `74fba30` through this follow-up. Existing 0012/0013/0014 post-check files
therefore retain their previous operator PASS evidence; they were not rerun here.

## Status Definitions

- **MATCH:** final-state evidence matches the reviewed effects within the stated
  evidence scope/time. This is not historical proof every statement ran.
- **MISMATCH:** a confirmed schema/privilege/configuration difference. A deparser
  formatting difference alone must be diagnosed before assigning this status.
- **UNVERIFIABLE:** current evidence is insufficient for a complete migration-level
  conclusion. Historical successful features are supporting evidence, not a shortcut.
- **SUPERSEDED:** an earlier effect was deliberately replaced by a later migration.
  For mixed migrations, retain the migration-level evidence status and explicitly
  identify superseded effects instead of classifying the entire file as obsolete.

**Current provisional tally: MATCH 11, MISMATCH 2, UNVERIFIABLE 1,
SUPERSEDED 0 (14 total).** The first and second operator metadata results now support
the retained structural/privilege effects of 0001/0003-0009. 0012/0013/0014 retain
previous post-check evidence. Descriptive COMMENT text and historical execution are
outside these MATCH scopes. The 0002 MISMATCH is the documented bucket configuration
difference. The fourth result isolates 0011's mismatch to the amphibian/reptile
return value, outside the reviewed allowed category set; no failing create was run.
0010's complete final RPC assessment remains blocked by this 0011 discrepancy.
Individual superseded effects remain
separate. No all-applied ledger proposal is ready; MATCH does not mean a complete
history baseline.

## First Operator Result And Focused Diagnosis

**OPERATOR_SQL:** the operator returned the first bundle's named boolean table.
There are **28 false gate results**: 12 CHECK comparisons, 12 partial indexes and
four function-definition conjunctions. All other supplied gate results are true.
This is operator execution evidence, not a Codex remote SQL run.

- Columns/defaults, PK/FKs, RLS, tested policy conditions/inventories, effective
  client/server privileges, trigger associations/inventories and RPC parameters
  matched. Non-owner actual DELETE remains PARTIAL: no mutation was tested here.
- The history schema is still absent. Bucket private/name/MIME checks matched;
  its size is **20971520 bytes (20 MiB)**, not 0002's 5242880 bytes or decimal
  20000000 bytes. This confirms the documented manual Phase 22C configuration.
  Do not lower it or rerun 0002. The replay/configuration exception must be resolved
  explicitly in any future baseline decision, not hidden by an all-MATCH label.
- **STATIC diagnostic defect found:** the first partial-index predicate comparison
  did not lowercase deparsed `IS NOT NULL`, but expected lowercase text. All 12
  failing indexes are partial indexes. The second operator result below confirms
  both their remaining structure and case-normalized predicates match.
- **STATIC diagnostic assumption found:** every failing CHECK includes trim; the
  expected strings assumed `btrim(...)`, while PostgreSQL can render the original
  SQL-standard form as `TRIM(BOTH FROM ...)`. The new check recognizes only that
  exact simple-identifier spelling, preserving the remaining predicates/limits.
  The second operator result confirms these limited rendering comparisons match.
  See [PostgreSQL deparser implementation](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/backend/utils/adt/ruleutils.c)
  (`get_func_sql_syntax`, `T_NullTest`). This source review does not claim the remote
  PostgreSQL version was determined.
- Initially unresolved function comparisons, not presumed harmless formatting:
  `guard_observation_edit_fields`, `provision_public_profile_for_new_auth_user`,
  `normalize_taxonomy_input_key`, `create_observation_with_verified_taxonomy`.
  Split signature/language/security/volatility/strict/search-path from body checks.
  Preserve exact-body comparison and add outer-whitespace and lexical diagnostics.

The [focused read-only diagnosis](sql-checks/0001-0014-reconciliation-diagnose-false.sql)
has now been **executed by the operator**. The original SQL/result is preserved;
no gate is silently rewritten as PASS. This second SELECT reads only catalogs and
returns booleans. Its function
lexer preserves string literals, quoted identifiers, punctuation and operator order;
only external whitespace/line comments and unquoted case are normalized. Unsupported
escape/dollar/block-comment syntax fails closed. Token agreement is a diagnostic,
not a substitute for matching security attributes or proof of arbitrary equivalence.
No function is executed, no raw body is returned, and no ACL/setting is changed.

### Second Operator Result: One RPC Comparison Unresolved

- All 12 CHECK presence/validation and trim-rendering comparisons are true.
  All 12 partial-index structure and case-normalized predicate comparisons are true.
  These explain the 24 original failures within the stated deparser-comparison scope.
- All four functions' signature, language, security, search path, volatility/strict
  and supported-lexer checks are true. Body-token comparisons are true for the guard,
  profile-provisioning trigger and internal normalizer. The exact/outer-whitespace
  hashes remain false; preserve them as text differences, not new functional failures.
- Only `diag.function_body_tokens.create_observation_with_verified_taxonomy` is
  false among the second query's diagnostic checks. Do not call this harmless
  formatting or claim a runtime/security failure before locating the difference.
- Thus 27 of the original 28 failing gates have a supported diagnostic explanation;
  one body comparison is still unresolved. The separate bucket configuration
  mismatch and missing history schema are not resolved by these results.

The [RPC body diagnosis](sql-checks/0011-reconciliation-diagnose-rpc-body.sql) has now
been **executed by the operator**. It compares inert reviewed 0011 body text with `pg_proc.prosrc`, using
the same PostgreSQL lexer for both. This avoids relying solely on a cross-runtime
Node fingerprint; PostgreSQL has [longest-match regex rules](https://www.postgresql.org/docs/current/functions-matching.html#POSIX-MATCHING-RULES).
That is a diagnostic precaution, not an established cause of the current failure.
Eight uniquely anchored sections cover declarations/auth, input/image checks,
safe profile display, trusted taxon/resolution, category mapping and insert/return.
Missing/duplicate/out-of-order anchors fail closed. The embedded local body is
quoted data, never executed; only `pg_proc` is read and only named booleans returned.
String-only and string-masked comparisons locate differences and are **not safety
gates**. Whole tokens and security metadata must not be replaced by a masked PASS.
The source/token fingerprints distinguish exact text from lexical content; a raw
hash false alone cannot diagnose clipboard encoding damage. No remote source text,
token values or hashes are requested, and no business RPC is invoked.

### Third Operator Result: Category String-Literal Discrepancy

- Function presence, both lexer guards, both unique ordered anchor guards and equal
  token counts are true. Seven of eight section token comparisons match completely.
  Only `category_mapping` differs, and its string-literal comparison is false.
- Every string-masked section and the whole string-masked body match. This narrows
  the discrepancy to category literals, not the authentication/input/image checks,
  safe profile display, trusted cache lookup or observation insert/return sections.
  A masked match is not proof that differing category values are harmless.
- `info.reviewed_tokens_match_prior_local_fingerprint=true`: the reviewed token
  stream still matches the unchanged local 0011 reference, including its strings.
  `info.reviewed_literal_matches_local_0011_md5=false`: the raw quoted reference text
  differs. A local LF-to-CRLF example reproduced raw-hash inequality with token-hash
  equality. This demonstrates a possible text-only cause, **not the remote cause**.
  Do not label the query corrupted or discard its token evidence on that basis.
- 0011 is now **MISMATCH at category string-literal definition level**. The exact
  changed literal(s), normalization/encoding cause, provenance and runtime impact
  remain unconfirmed. In particular, do not claim the Korean return labels rather
  than the English conditions are already proven wrong. No live create was run.
- Prior 0014/0012/0013 APPLIED + post PASS, history schema absence and earlier live
  results remain intact. This finding does not authorize replay or history repair.

The [category literal diagnosis](sql-checks/0011-reconciliation-diagnose-category-literals.sql)
has now been **executed by the operator**. This catalog-only SELECT compares the 20 local category literals by guarded
position, reporting six condition groups and seven return values as booleans. The
reviewed values come from unchanged 0011; the file is ASCII-only and encodes Korean
references with [Unicode string escapes](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-STRINGS-UESCAPE).
Unique anchors, the complete non-string category structure and literal count must
match before value comparisons can pass. Doubled SQL quotes are decoded as data;
no expression/function body is evaluated. Exact byte-sensitive comparisons remain
the criterion. Case-folded conditions, [NFC equivalence](https://www.postgresql.org/docs/current/functions-string.html)
and the known return-label set are diagnostic alternatives, not changes to data or
permission to ignore a mismatch. Only names/booleans are returned; no raw values,
function definitions, user rows or ACLs. Neither the prior query nor a migration
needs to be repeated. History reconciliation remains on hold.

### Fourth Operator Result: One Invalid Category Return Value

**OPERATOR_SQL, not Codex remote execution:** function presence and the guarded
category structure/20-literal count are true. All six exact condition groups and
their case-folded alternatives are true. Six exact return values match (insecta,
aves, mammalia, plantae, fungi and fallback); only the `amphibia_reptilia` return
is false. Its NFC comparison is also false. `info.all_returns_in_reviewed_taxon_set`
is false. Together with the previous full-token diagnostics this isolates the
reviewed-body discrepancy to that single return literal, not a changed branch
condition or a Unicode composition-only presentation difference.

Expected local value: `양서/파충류`, from unchanged 0011's combined amphibian/reptile
branch. The same seven-label set is enforced by `observations_taxon_check` in 0001;
the first operator result already matched that validated constraint. The remote
literal itself was neither returned nor requested. Its exact spelling, origin and
time of introduction remain unknown; do not guess an encoding accident or operator
error. The prior raw reviewed-body hash false does not negate the matching reviewed
token fingerprint or this ASCII-only reference comparison.

**STATIC inference / release blocker:** for a taxonomy-linked create that resolves
to class `amphibia` or `reptilia`, this RPC can insert an out-of-set `taxon` value
and fail the observation CHECK. Authentication, trusted cache resolution and other
inputs must first pass. The insert/return section otherwise matched. No actual
create, failing request or row inspection was performed; do not report a new live
failure, existing data corruption or a Phase 29/32 permission regression. Existing
DELETE/comment/Preview PASS evidence and cleanup records remain intact.

**Stop here:** no more read-only SQL is needed to establish this mismatch. Suspend
history initialization/reconciliation and Production clearance. Do not reapply
0010/0011, edit applied migrations, relax the taxon CHECK/RLS, map the case silently
to a fallback, or mark all versions applied. No correction SQL is prepared/executed
in this diagnostic task. The 0002 manual bucket difference remains a separate
baseline/configuration decision; do not lower the bucket limit.

### Minimum Separate Correction Decision

1. Request separate approval to prepare one new sequential migration candidate
   (next available number currently 0015; recheck at that time) for this RPC's
   amphibian/reptile return literal only. Use the reviewed full function definition
   where replacement syntax requires it, but preserve signature, other statements,
   SECURITY DEFINER, locked search path, EXECUTE ACLs and all table/RLS/Storage rules.
   The semantic difference must be limited to returning `양서/파충류` in that branch.
2. Before any future application, verify the remote definition still differs only
   there, prepare exact metadata pre/post checks and review rollback/recovery needs.
   Existing exact rollback SQL remains **not documented**. This is candidate
   preparation, not permission to apply SQL or generate test observations.
3. Obtain a separate manual-application decision, then check the complete RPC's
   token/security/ACL contract and all seven category values after application.
   Only afterwards reconsider history-baseline exceptions and explicit version
   scope. Do not turn a proposed fix or metadata result into live create PASS.

## Per-Migration Evidence

All filenames below are under `supabase/migrations/`.

| Version / Actual Filename | Active Changes And Expected Retained Final State | Existing Evidence | Superseding Effects | Further Remote Evidence / Status |
| --- | --- | --- | --- | --- |
| 0001 `0001_create_observation_schema.sql` | `pgcrypto`; profiles/observations with IDs, timestamps, text/date/coordinate/status checks; profile-to-auth cascade FK; observation indexes; timestamp helper/triggers; SQL stable security-definer `is_admin()` with public search path; RLS and role/column grants | First operator metadata plus second CHECK rendering results; previous helper/policy post-checks | Grants and insert/update policies replaced by 0003/0004/0007; admin DELETE narrowed by 0012; helper anon privilege explicitly removed by 0014 | **MATCH: retained structural/privilege effects**, not historical execution |
| 0002 `0002_create_observation_storage.sql` | Three image columns; path/MIME/size/completeness checks; partial path index; private bucket configuration upsert (5 MiB, three MIME types); approved public/admin Storage SELECT policies | Historical Storage smoke and recent 0014 image-policy PASS; operator private/MIME, CHECK and partial-index agreement; 20 MiB bucket | DB image-size CHECK replaced by 0006. Bucket change was **manual configuration**, not 0006. Commented INSERT candidates/grants are not active SQL | **MISMATCH: canonical bucket configuration versus documented manual 20 MiB**. CHECK/index text discrepancies diagnosed; not evidence 0002 never ran |
| 0003 `0003_public_user_contribution.sql` | Profile display name; nullable observer/profile FK SET NULL and display snapshot; nonblank checks and two partial owner indexes; column grants; own-profile read/update; authenticated own approved insert; approved public/admin reads; owner/admin update; authenticated owner-path Storage INSERT | First operator columns/grants/FK/policy agreement plus second CHECK/index comparisons; historical 20E/20K smoke | 0004 reasserts update grants/policies; 0007 tightens insert taxonomy nulls; 0012 restores authenticated DELETE | **MATCH: retained schema, ACL/RLS and Storage upload conditions** |
| 0004 `0004_owner_admin_observation_edit.sql` | Content/status-only authenticated column UPDATE; revoke table UPDATE and DELETE; protected-field trigger/function; approved public read and owner/admin update policies | Operator grants/trigger linkage and second guard token/security matches; existing 0012 preservation checks | Guard body extended by 0007; DELETE regranted only under 0012 approved policies | **MATCH: retained effects evaluated against final 0007 guard**, not the superseded 0004 body |
| 0005 `0005_public_signup_profile_provisioning.sql` | Security-definer profile-provisioning trigger function with empty search path, safe display name and fixed user role; PUBLIC EXECUTE revoked; AFTER INSERT auth.users trigger; no existing-user backfill | Operator trigger/ACL agreement and second body-token/security matches; Phase 22B historical apply/smoke | None; initial rejected candidate is not application evidence | **MATCH: retained trigger/helper contract**. Exact body text differs; no new signup or historical backfill proof |
| 0006 `0006_raise_observation_image_size_limit.sql` | Only observation image-size CHECK raised to 20 MiB, nullable and nonnegative | Phase 22C historical apply/smoke plus new operator `observations_image_size_bytes_check=true` and valid constraint inventory | Replaces 0002 DB 5 MiB CHECK only; does not update bucket | **MATCH: retained CHECK effect**, not historical preflight branch proof |
| 0007 `0007_create_taxonomy_schema.sql` | `taxa` accepted cache and server-only `taxonomy_name_resolutions`; PK/unique/CHECK constraints, RESTRICT FK, lookup indexes, timestamp triggers; observation taxonomy columns/RESTRICT FK/checks/index; column SELECT for public taxa, no browser cache writes; extended edit guard and taxonomy-null legacy INSERT policy | First operator schema/grants/RLS agreement plus second CHECK/index/guard diagnostics; historical Phase 24C evidence | 0008 adds server-role read/upsert privileges; 0009 removes server DELETE; 0010/0011 introduce a separate authenticated create RPC without relaxing direct-table grants | **MATCH: retained structural/privilege effects and guard tokens/security**; descriptive comments outside scope |
| 0008 `0008_grant_taxonomy_service_role_access.sql` | Server role public-schema USAGE and SELECT/INSERT/UPDATE on both taxonomy caches; table comments updated; no DELETE grant in this file | First operator schema usage/cache privilege/browser separation gates true; historical Phase 24C.1 | 0009 removes an independently present DELETE grant; not a reversal of this file's three grants | **MATCH: retained privilege effects only**; descriptive comments unverified, no service-role client |
| 0009 `0009_revoke_taxonomy_service_role_delete.sql` | Revoke only server-role DELETE on both caches; pre/post preservation guards; no data writes | New operator server grants, browser cache restrictions, RLS/policy results true; historical replay-safe preflight revision retained | No later migration restores DELETE | **MATCH: retained privilege effects**. Does not prove which historical preflight text ran |
| 0010 `0010_create_taxonomy_observation_write_path.sql` | Internal immutable/strict normalizer, authenticated-only security-definer create RPC; EXECUTE restrictions; comments and transactional temporary before/after count checks | Normalizer tokens/security and RPC arguments/security/grants match; final 0011 combined amphibian/reptile return is outside the reviewed label set | RPC body/comment replaced by 0011. Internal normalizer persists. Temporary count table and historical count comparison cannot be reconstructed now | **UNVERIFIABLE: complete final RPC assessment blocked by 0011 mismatch**, not a requirement to retain the superseded broken body |
| 0011 `0011_repair_taxonomy_observation_rpc_runtime_expressions.sql` | Replace same RPC body using unqualified NULLIF/COALESCE; retain security-definer/empty search path/authenticated-only EXECUTE, internal-helper denial; temporary count preservation checks | Historical apply/post/live PASS; current arguments/security/grants, seven body sections, all category conditions and six return values match; combined amphibian/reptile return differs and is outside the reviewed label set | Supersedes 0010 RPC body, not the normalizer | **MISMATCH: amphibian/reptile return value**; expected `양서/파충류`. CHECK-failure risk inferred, no live create run; cause unknown and correction not authorized |
| 0012 `0012_observation_owner_delete.sql` | Revoke anon DELETE; authenticated table DELETE; own approved DELETE policy; existing admin policy narrowed to approved; SELECT/UPDATE unchanged | **OPERATOR_SQL apply + exact 0012 post PASS**; owner/admin/anon live results retained | Replaces earlier DELETE grant state and all-status admin policy | No duplicate post request now; non-owner actual request remains PARTIAL; **MATCH (recorded post-check scope)** |
| 0013 `0013_observation_comments.sql` | Seven-column comments table; observation CASCADE FK, nullable profile author SET NULL FK/default; kind/body CHECKs, 20-item ordering indexes; safe-author/trim trigger; approved public read, admin read, self insert, self/admin delete; narrow grants and no UPDATE | **OPERATOR_SQL apply + exact 0013 post PASS**; two-kind create/own cleanup/taxonomy-invariant live smoke | None | Existing post checks columns, defaults, checks, indexes, FKs, trigger body hash, policy expressions/roles/count and privileges; no rerun claimed; **MATCH (recorded post-check scope)** |
| 0014 `0014_revoke_anon_is_admin_execute.sql` | Only explicit anon EXECUTE revoke on zero-argument `public.is_admin()`; authenticated preserved; no default privilege change | **OPERATOR_SQL apply + exact 0014 post PASS**, direct/effective ACL and public-policy checks | Hardens 0001 helper; no helper body/policy change | Existing exact reviewed helper and ACL checks preserved; grant origin remains unknown; **MATCH (recorded post-check scope)** |

### Replacement Map And Unrecoverable History

- 0001 anonymous pending INSERT and initial grants: SUPERSEDED by 0003.
- 0002 DB 5 MiB CHECK: SUPERSEDED by 0006. Bucket configuration is not superseded
  by any migration in this set; Phase 22C records a separate manual increase.
- 0004 guard body: SUPERSEDED by 0007; its trigger/payload protections remain.
- 0003 INSERT taxonomy allowance: tightened by 0007; separate trusted RPC is not
  a direct-table permission expansion.
- 0010 RPC implementation: SUPERSEDED by 0011. Do not compare the old invalid
  qualified conditional expressions as a required live state.
- Earlier DELETE grant/policy states: SUPERSEDED by 0012. anon helper grant is
  explicitly removed by 0014; global default privileges remain unchanged.
- Failed attempts, preflight branches, temporary counts, original chronological
  execution and absence of historical backfills cannot be proven by today's
  metadata. A future reconciled baseline must say **inferred final-state baseline**,
  not fabricate execution dates or claim every original statement executed.
- The files include COMMENT statements describing cache/RPC purpose. The first
  metadata bundle does not compare these non-executable descriptions; exact
  descriptive-comment agreement remains outside its PASS scope.

## One Remote Read-Only Bundle

File: [0001-0014-reconciliation-read-only.sql](sql-checks/0001-0014-reconciliation-read-only.sql).

**Executed by the operator; result recorded above. Do not repeat this whole bundle.**
All three follow-up diagnosis files were also executed by the operator. Their
results are recorded above. Stop further queries now; the mismatch is isolated.
The next step is a separate minimal-correction decision, not a migration/CLI command.
No identities, original rows, ACLs, SQL bodies or configuration values are requested.
Even all matching diagnostic results would not authorize history initialization.

The bundle reads catalogs/privilege metadata plus exactly one bucket's configuration.
It never reads observations, profiles, comments, auth users or Storage object rows.
The guarded `query_to_xml` contains a fixed SELECT returning only bucket booleans;
no externally supplied query or application function is executed. Missing object
OIDs are handled through catalog lookups/`to_regclass`/`to_regprocedure`, not direct
references to nonexistent application tables. Absent bucket metadata is guarded.

Coverage: retained columns/types/nullability/defaults; RLS; PK/FK/delete actions and
unique keys; named CHECK rules; named index keys/predicates; six final function
bodies (CRLF-normalized hashes computed from local files), language/security/search
path; triggers; remaining profile/legacy-create/taxa/Storage-upload policy conditions;
column/effective grants and taxonomy cache server restrictions. Prior 0012/0013/0014
post checks cover the recently verified deletion/comment/helper/read policies.

Interpretation limits:

- CHECK/policy/index expression comparison uses compact PostgreSQL deparser text,
  following the existing checks. It is a drift screen, not an arbitrary SQL
  equivalence theorem. Whitespace/cast/parenthesis presentation can require a focused
  read-only follow-up; do not automatically classify every false as unsafe schema.
- Function hashes compare the complete body, including comments/indentation except
  CRLF. A false hash can reflect a text-only difference; it still prevents claiming
  exact reviewed body agreement until diagnosed without exposing raw definitions.
- Metadata PASS is not a new authenticated non-owner DELETE, resolver invocation,
  signup, image operation or data-invariant smoke.
- `info.history_schema_still_absent=true` is the known bookkeeping condition.
- `info.bucket_limit_matches_0002_five_mib` versus the 20 MiB/decimal 20 MB flags
  are **alternative observations, not all-true gates**. A current 20 MB bucket can
  agree with documented operations while differing from a fresh migration replay.
  No bucket setting should be lowered or changed to make a diagnostic pass.

Historical limits in [handoff](next-session-handoff.md#phase-22c-current-session-result)
and [image-limit readiness](observation-image-size-db-alignment-apply-readiness.md)
explain the now-confirmed bucket/replay difference. That is an explicit
configuration gap to decide, not evidence 0002 never ran and not a new live failure.

## Order And Replay Safety

Canonical repository order is `0001 -> ... -> 0012 -> 0013 -> 0014`.
The recent manual sequence was **0014 -> 0012 -> 0013**, each with operator post PASS.
0014 depends only on the existing zero-argument helper, not deletion/comment schema;
0012/0013 do not restore its anon grant. Their intended final privileges can converge
despite different execution order. A version ledger does not encode that chronology.

Do not replay to fill the missing ledger: create-table/policy operations and
0007 preflight are deliberately not universally idempotent; 0002 would upsert the
old bucket limit. No database reset/pull/push/link/list/repair was run here.

## CLI 2.108.0 Review

The installed binary was checked with **version only: 2.108.0**. No connection
credentials or local environment secrets were read. Source review is pinned to
the same release, not assumed from a newer CLI.

- [File parser](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/pkg/migration/file.go):
  numeric-prefix filenames are accepted; the prefix is retained as text. The
  current 14 unique four-digit prefixes fit; preserve `0012`, not `12`, and do not
  renumber files. The suffix becomes name and the file is split into statements.
- [Repair implementation](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/internal/migration/repair/repair.go):
  repair initializes history before parsing selected local files. Applied entries
  upsert version/name/statements from the local file; the migration statements are
  stored, not executed. Missing local versions error. With no explicit versions,
  the whole-history branch can truncate bookkeeping; that broad path is not a
  candidate here. Even a later file-parse failure can follow history initialization.
- [History implementation](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/pkg/migration/history.go):
  initialization creates the history schema/table with text primary-key version and
  adds name/text-array statements columns. An applied-version conflict updates name
  and statements. These are real remote writes, not read-only diagnostics.
- [Pending selection](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/pkg/migration/apply.go):
  matching versions are skipped; missing/out-of-order histories can error. Without
  recorded versions, existing SQL files can be considered pending. This is version
  comparison, not schema-equivalence or content-checksum verification. A partial
  ledger alone is not clearance for db push.
- [Connection implementation](https://github.com/supabase/cli/blob/v2.108.0/apps/cli-go/internal/utils/flags/db_url.go):
  linked initialization without a DB password can create a login role; the pooler
  retry path can also alter network-ban state. No supposedly read-only remote CLI
  command is used to bypass the current no-side-effects rule.

Official overview: [database migrations](https://supabase.com/docs/guides/deployment/database-migrations).
Catalog interpretation: [PostgreSQL information/privilege functions](https://www.postgresql.org/docs/current/functions-info.html).

## Reconciliation Decision And Future Management

**Current case C (RPC definition mismatch), with unknown provenance and a documented
configuration exception:** the combined amphibian/reptile return literal differs
and is outside the reviewed seven-label set in the final RPC;
bucket metadata also confirms a manual exception to canonical replay. Suspend
history-reconciliation readiness. Do not infer an RLS bypass or automatically change
schema/settings. No blanket applied marking. The mismatch is sufficiently isolated
for a separate minimal-function-correction proposal, not for history writes or
Production clearance. Do not replay 0010/0011 or overwrite applied migrations.

1. Preserve all four operator result tables and the identified single-literal mismatch.
   Compare retained effects together with exact existing post checks and recorded
   manual changes. Classify superseded objects separately.
2. If a real schema/policy mismatch is confirmed, suspend ledger-reconciliation
   readiness and propose only a separately approved correction. Do not replay old
   migrations. An intended manual configuration difference needs an explicit
   management decision, not a hidden false MATCH or automatic reversal.
3. If retained effects are sufficiently established, prepare an explicit version
   allowlist with source hashes, evidence scope, unresolved historical limitations
   and approved baseline semantics. Schema equivalence is not execution provenance.
4. Only after a backup/recovery plan and separate approval may an exact history-only
   initialization/reconciliation procedure be prepared/executed. Review connection
   side effects too. No executable repair/initialization or speculative rollback
   SQL is supplied here; **exact rollback SQL: not documented**.
5. Re-read the ledger and final-state metadata after any future approved correction.
   Do not enable db push while old local files remain spuriously pending or unknown.

| Future Mode | Benefits | Required Safeguards / Tradeoffs |
| --- | --- | --- |
| Continue manual SQL Editor application | No CLI ledger is required by the running app; preserves the existing operator-controlled process | Maintain a reviewed external application register: file/version/hash, target category, operator date, post-check result, manual exceptions and execution order. Freeze applied files; preflight every new file; prohibit blind CLI push/replay. Manual record discipline remains essential. |
| Adopt CLI migration management later | Explicit version accounting and consistent pending-file selection | Complete baseline evidence and discrepancy decisions first; backup and exact recovery procedure; explicit version list and write/connection approval; validate local/remote agreement before any later push. Never treat repair as executing SQL or proof an old file ran. |

## Historical Audit Verification (88cd663)

- `non_owner_actual_delete=PARTIAL`; no new DELETE or test data in this task.
- Owner/admin/anon deletion, Phase 32 smoke and cleanup evidence are preserved.
- Image cleanup remains NOT_TESTED/best-effort with orphan risk; actual Kakao
  deletion marker PARTIAL; pending/rejected deletion deferred.
- App/package/test code and migrations are unchanged. Historical 213 tests,
  typecheck/build and audit remain historical, not rerun results. The working guide's
  documentation-only verification exception applies; only docs/check SQL changed.
- Current local checks **PASS**: `git diff --check`; seven changed/new files'
  whitespace/EOF; Markdown fence balance and introduced local links;
  secret-like additions and forbidden tracked paths; unique ordered 0001-0014
  filenames; unchanged migrations/existing post-checks versus `74fba30`; unchanged
  app/tests/packages/settings versus HEAD. The two incoming document edits remain.
- SQL static/lexical review **PASS**: balanced quotes/parentheses, one outer SELECT
  per file, no mutation tokens outside literals/comments, no application-row read
  or business-function invocation. The first bundle's only dynamic query is the
  fixed bucket metadata SELECT; the focused file has no dynamic query. Six complete
  body hashes were previously recalculated. Four focused token fingerprints/counts
  were recalculated from unchanged migrations; local cases preserve outer whitespace
  and line comments but detect changed literal values (four cases each).
  No installed local PostgreSQL parser/engine was used. All four files ran in the
  operator's SQL Editor; the final result is a mismatch, not an all-PASS result.
  The third diagnostic's embedded UTF-8 body matches local 0011; section anchors cover
  its full token stream. Local comparison cases cover formatting-only agreement and
  detection of changed literals/code, missing/duplicate anchors and absent function.
  The fourth file's 20 expected literals/structure are checked against local 0011;
  it is ASCII-only. Twelve local cases separate changed conditions/return values, Unicode
  normalization, allowed-but-wrong labels and missing/duplicate/changed structure.
  These local diagnostic checks are not the historical 213 app tests or remote SQL.
- Sufficient new read-only results now exist to preserve the diagnosis in the
  authorized local documentation/check-SQL commit. This records a blocker; it does
  not certify migration-history consistency. No push, main merge, Production
  deployment, archive or Verified closeout. No correction migration was created.

**한국어:** 기존 적용 성공 기록은 보존했습니다. 실제 차이는 등록 RPC의 양서류·파충류
반환 문자열 하나로 좁혀졌고, 정상 값은 `양서/파충류`입니다. 해당 분기의 등록은 DB
제약에 걸릴 수 있지만, 실패를 만들기 위한 실제 등록은 하지 않았습니다. 이번에는
진단만 기록하고 중단합니다. 다음은 최소 수정 후보 준비의 별도 승인입니다. 기존
migration 재실행, 이력 보정, bucket 변경, 배포는 하지 않습니다.
