# Phase 26 Dependency Audit And Minimal Patch

## Status And Preserved Baseline

- Dependency diagnosis recorded on 2026-09-25 on
  `fix/phase-26-kakao-marker-zoom-alignment`; detailed evidence below is historical.
- Dependency commit: `69300fd fix: patch vulnerable transitive dependencies`.
- Original marker commits remain `7345326` and `7793928`; application and test
  files were unchanged by the dependency correction.
- Remediation was included in Production release `d7d5e27`, later fast-forwarded
  into main and pushed normally after final checks and operator readiness.
  Vercel reported success. The operator confirmed the original marker defect
  resolved on the Production site; Phase 26 is now closed for that defect.
- Chain and patch: `vite -> postcss -> nanoid`; PostCSS `8.5.15 -> 8.5.28`,
  nanoid `3.3.12 -> 3.3.19`. Only the lockfile changed, not `package.json`.
  Both affected versions existed at baseline `813a819`, before the marker fix.
- During the dependency-only checkpoint main/origin/main remained `813a819`
  and deployment was prohibited. Later release authorization superseded that
  temporary pause. The fix branch is preserved at `d7d5e27` and local safety
  branch `backup/before-phase-26-kakao-production` remains at `813a819`.
- Recorded pre-release full audit including dev: all severities zero. Clean
  installation, typecheck, 51 tests, build and CSS comparison passed as detailed
  below; these are checkpoint results, not a permanent security guarantee.
- Docs-only closeout reran typecheck, 51 tests, build and full audit including
  dev once: PASS, zero audit findings. It did not rerun clean installation or
  CSS comparison, update dependencies or change app code. No rollback was
  performed by Codex or reported by the operator.
- Localhost/Preview real-Kakao checks and individually unreported Production
  cases remain PARTIAL. The docs-only closeout deployment is separate from the
  visually tested `d7d5e27`; its status is checked after push, not assumed here.

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

## Release And Recovery Outcome

After the dependency-only pause, the separately authorized controlled release
reviewed the complete four-commit range from `813a819` to `d7d5e27`. The operator
confirmed rollback-target access and immediate-test readiness before normal
main integration/push. Vercel success and the subsequent operator-confirmed
Production resolution are recorded in the marker document and Phase 26 archive.

The old plan introduced only `7345326` and `7793928`; the deployed release also
includes `69300fd` and `d7d5e27`. Its old two-commit revert is **not a complete
rollback of this expanded release**. The reviewed preferred Git recovery would
reverse only marker commit `7345326` while retaining the dependency patch. A
reverse-patch check passed without changing the worktree. No actual revert or
deployment rollback was executed by Codex or reported by the operator.

`813a819` is the previous **operational baseline**, not a vulnerability-free
dependency baseline: fully restoring its dependencies restores the findings.
Any future recovery needs a newly reviewed range and explicit approval, must
preserve unrelated later work and historical docs, and must not blindly revert
HEAD or all release commits. No recovery is part of documentation closeout.

No DB records/coordinates, migrations, RLS, Auth, Storage, taxonomy rules,
Kakao settings or Vercel configuration changed during this phase. The closeout
changes documentation only; no additional dependency remediation was performed.
See [Phase 26 archive](../eco/phase-history/phase-26.md) for the qualified Verified
status and remaining device/browser checks. Wait for the operator's next task.
