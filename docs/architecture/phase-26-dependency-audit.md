# Phase 26 Dependency Audit And Minimal Patch

## Status And Preserved Baseline

- Checked on 2026-09-25, on `fix/phase-26-kakao-marker-zoom-alignment`.
- Dependency commit: `69300fd fix: patch vulnerable transitive dependencies`.
- Original marker commits remain `7345326` and `7793928`; application and test
  files are unchanged by this dependency task.
- Local `main`, local `origin/main`, and the unpushed safety branch
  `backup/before-phase-26-kakao-production` remain at `813a819`.
- The latest operator instruction supersedes the queued deployment continuation:
  no merge, push, deployment, or rollback is authorized in this step, even if
  earlier rollback-target/immediate-test confirmations arrive.
- Dependency verification passed locally. Phase 26 remains open; real Kakao
  visual smoke is still PARTIAL. No Production change occurred.

## Original Audit Evidence

The installed Node `v24.14.1`, npm `11.11.0`, and configured public npm registry
were retained. No registry tokens, credentials, or secret file contents were
read or printed; the registry address was not logged. `npm.cmd audit --json`
returned a vulnerability report, not a
network/authentication error. `npm.cmd ls postcss nanoid --all` exited 0;
`npm.cmd explain postcss` and `npm.cmd explain nanoid` confirmed this chain:

```text
vite@8.0.16 -> postcss@8.5.15 -> nanoid@3.3.12
```

There was one installed copy of each affected package. Vite is a direct
dependency; PostCSS and nanoid are transitive. Both audit entries contain
advisories about that package itself, not additional ancestor/meta-vulnerability
entries. Vite was not a separate vulnerability entry. npm reported
`fixAvailable: true` for both, without requiring a top-level/major upgrade.

The original summary was high 2, total 2, all other summary severities 0.
That counts affected package entries at their highest severity. It does **not**
mean exactly two independent flaws: the entries contain four advisories,
including one moderate advisory within the high-classified PostCSS entry.

| Package | Advisory and official title | Severity | Affected versions | Documented patch |
| --- | --- | --- | --- | --- |
| nanoid | [GHSA-28wg-ghj8-5hjv: nanoid: non-secure generators can loop indefinitely with negative size](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | High | `<3.3.16`; `>=4.0.0 <5.1.16` | `3.3.16` / `5.1.16` |
| nanoid | [GHSA-2v37-7h3g-55p8: nanoid: custom generators can loop indefinitely when size is zero](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | High | `<3.3.18`; `>=4.0.0 <5.1.6` | `3.3.18` / `5.1.6` |
| postcss | [GHSA-r28c-9q8g-f849: PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure](https://github.com/advisories/GHSA-r28c-9q8g-f849) | High | `<=8.5.17` | `8.5.18` |
| postcss | [GHSA-fxqj-rqcc-2cmp: PostCSS: incomplete fix of GHSA-6g55-p6wh-862q - attacker-controlled sourceMappingURL reads arbitrary .map files when from is unset](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | Moderate | `<=8.5.22` | `8.5.23` |

The audit's aggregate affected ranges were `nanoid <=3.3.17` and
`postcss <=8.5.22`. Both original installed versions are confirmed affected.
`package.json` and `package-lock.json` have no Git difference between `813a819`
and `7793928`: the marker fix did not introduce these versions.

## Execution-Path Assessment

- **Build/development:** `vite.config.ts` uses React and Tailwind plugins.
  Vite's CSS processing can invoke PostCSS for imports, URLs and plugins. Its
  inspected `runPostCSS` caller supplies `from`/`to`; the missing-`from`
  advisory's specific condition was not found on that caller. The older
  traversal issue is not dismissed merely because `from` is supplied.
- **PostCSS conditions:** attacker-influenced CSS containing a malicious
  `sourceMappingURL` must reach Node-side processing, with a readable `.map`
  file and an output/disclosure path. The old `previous-map.js` contains the
  affected file-loading operation. No route from public observation text,
  taxonomy results or uploaded images to build-time CSS processing was found.
  Untrusted repository CSS/plugins/build inputs remain a potential tooling
  exposure; a live exploit was not demonstrated.
- **nanoid conditions:** the inspected PostCSS `input.js` uses
  `nanoid/non-secure` with the fixed positive size `6`, not user-controlled
  negative/zero sizes. No application custom-generator call was found.
  Reachability of the advisory's vulnerable input is not established.
- **Browser/server:** current npm scripts build a static React SPA. There is
  no configured Node SSR/application server in this deployment path; the
  archived starter server is not a current script. Application and separate
  Supabase function source contain no PostCSS/nanoid imports. Browser
  observation data is not fed back into Vite's build pipeline.
- The dev server binds all interfaces by default. Neither that fact alone nor
  an audit count proves exploitability. Equally, tooling/devDependency status
  is not evidence of safety. The full dependency tree was audited without
  omitting development dependencies.

## Minimal Remedy

| Package | Before | After | Compatibility |
| --- | --- | --- | --- |
| postcss | `8.5.15` | `8.5.28` | Within Vite's existing `^8.5.15` range; above both documented patches |
| nanoid | `3.3.12` | `3.3.19` | Same major; within original `^3.3.12` and updated PostCSS `^3.3.18` ranges |

Only these two lockfile package entries changed. Their registry version,
resolved tarball and integrity metadata were generated by npm. PostCSS's
nanoid requirement changed to `^3.3.18`; its other dependencies are unchanged.
The lock still contains the same 104 package entries including the root.
Vite, Tailwind, React and all other packages stayed at their locked versions.
`package.json` has no Git diff: no direct dependency, override or new package
was added, and no configuration/application/test file was edited.

The targeted command follows [npm update's semver-constrained behavior](https://docs.npmjs.com/cli/v11/commands/npm-update/):

```text
npm.cmd update postcss nanoid --package-lock-only --ignore-scripts --save --json
npm.cmd ci --include=dev
```

The first command only rewrote the lockfile; the clean installation then used
normal lifecycle behavior. No unrestricted `audit fix`, force flag, advisory
suppression, threshold increase or lockfile regeneration was used.
[PostCSS 8.5.28 release notes](https://github.com/postcss/postcss/releases/tag/8.5.28)
record a type regression correction;
[nanoid 3.3.19 release notes](https://github.com/ai/nanoid/releases/tag/3.3.19)
record additional input-size hardening. Patch updates can still regress build
or CSS behavior, so installation, build and application regressions were checked.

## Verification

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Clean lockfile installation | PASS | `npm.cmd ci --include=dev`; initial Windows `EPERM` cleared after stopping the task's previous local Vite server, then successful retry |
| Installed copies / consistency | PASS | `npm.cmd ls postcss nanoid --all`; one copy each, expected versions, no invalid dependency tree |
| Full audit including dev | PASS | `npm.cmd audit --include=dev --audit-level=high --json`; info/low/moderate/high/critical/total all 0 |
| Typecheck | PASS | `npm.cmd run typecheck` |
| Node tests | PASS | 51 tests, including all six Kakao alignment/identity/camera/resize/picker/fallback regressions |
| Production build | PASS | `npm.cmd run build`; unchanged Vite version |
| CSS artifact comparison | PASS | Generated 47,941-byte CSS is byte-identical by SHA-256 to the existing pre-update build; not visual proof |
| Ordinary local browser/fallback rendering | PARTIAL | Browser connection failed before page inspection; no new browser dependency installed |
| Real Kakao localhost/Preview smoke | PARTIAL | Operator-reported domain restriction; no claim that dependency checks verify marker alignment |
| Diff, UTF-8, whitespace, EOF, Markdown, JSON, secret-like scan | PASS | Intended files only; no secret values printed |
| Forbidden tracked files | PASS | No environment/generated files tracked; local secret env file remains ignored |
| Marker application/test preservation | PASS | No `src` or `tests` diff from `7793928` |
| Deno, Docker, Supabase operations | Not run | Unchanged and outside this frontend dependency task |

Full test command:

```text
node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs
```

Zero findings describes this registry audit at this checkpoint, not a guarantee
of no unknown vulnerabilities. No low/moderate findings remain in this report.

## Release And Recovery Must Be Reviewed Again

The dependency blocker is resolved locally, so controlled-release preparation
can resume in a separately authorized step. This step does not merge, push,
deploy, execute a rollback, or close Phase 26. No DB records/coordinates,
migrations, RLS, Auth, Storage, taxonomy rules, Kakao settings, packages outside
the two transitive patches, or Vercel configuration changed.

The old plan introduced only `7345326` and `7793928`. The candidate now also
includes `69300fd` and the dependency-audit documentation commit. The old
two-commit revert command is **not a complete rollback of this expanded release**.
Before deployment, re-inspect actual main/origin state, exact candidate, ordered
release range, operator-accessible working deployment, and recovery target.
Preserve later unrelated work and the fix/backup branches; do not blindly revert
HEAD or execute the previous plan. Keeping the security patch during a marker-only
rollback would be a distinct, explicitly reviewed recovery choice.

`813a819` is the previous **operational baseline**, not a vulnerability-free
dependency baseline: fully restoring its dependencies restores the findings.
Earlier rollback-target/test-readiness replies do not authorize deployment in
this step. Reconfirm the recovery path and immediate Production test readiness
when release work is authorized again. Local/Preview real-Kakao PASS is not a
precondition under the operator's domain-limited testing decision; those checks
stay PARTIAL. Real Production visual checks and any mobile gaps remain pending.
