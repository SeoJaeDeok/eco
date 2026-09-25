# Phase 26 - Kakao Marker Zoom Alignment And Dependency Security Patch

## Status

- Status: Verified, closed for the originally reported marker-zoom defect.
- Source basis: reviewed code/history, recorded regression and release checks,
  Vercel success for `d7d5e27`, and the operator's Production visual confirmation.
- Verified does not mean every browser/device or individual checklist item was
  tested. Unreported interaction checks remain PARTIAL below.

**한국어:** 운영자가 Production에서 원래 마커 위치 문제의 해결을 확인해 종료합니다.
모든 기기나 세부 조합을 검증했다는 뜻은 아니며, 미확인 항목은 별도로 남깁니다.

## Goal

- Keep observation marker dots anchored to their unchanged geographic locations
  through Kakao map zoom, preserving the provider boundary and static fallback.
- Resolve the pre-release dependency audit blocker with a compatible, minimal
  patch before the controlled Production release.

**한국어:** 확대·축소 시 관찰 마커가 원래 지도 지점을 가리키도록 수정하고,
배포 전 발견된 기존 의존성 보안 문제를 최소한의 패치로 해결했습니다.

## Main Work

- Code review confirmed that the previous `CustomOverlay` anchor centered the
  combined dot-and-label box. Label dimensions, including the hidden label's
  layout space, could displace the dot from the intended coordinate anchor.
- A fixed click area now centers the dot; the label is positioned separately.
  Decorative dot scaling does not replace SDK positioning. Kakao `CustomOverlay`
  still owns geographic projection, without manual pixel offsets.
- Automatic overview centering is initialization-only. Filtering and equivalent
  coordinate props no longer unnecessarily reset the camera; explicit camera
  changes still work. Container-size observation, relayout scheduling and cleanup
  cover overview, location picker and position preview.
- Existing marker identity/click callbacks, approved-only reads, filters and
  static fallback were preserved. No saved coordinates were changed.
- The audit blocker already existed at baseline `813a819`, not introduced by the
  marker fix. The chain was `vite -> postcss -> nanoid`; two affected package
  entries contained four advisories, not simply two independent flaws.
- `69300fd` changed only `package-lock.json`: PostCSS `8.5.15 -> 8.5.28`, nanoid
  `3.3.12 -> 3.3.19`, within supported ranges. `package.json` was unchanged; no
  major upgrade, override, new dependency or marker-code change was needed.
- Because localhost/Preview real-Kakao checks were blocked by domain/configuration
  limits, the operator authorized controlled Production verification. Rollback
  target and immediate-test readiness were confirmed before fast-forwarding main
  and pushing normally. Vercel reported success for release `d7d5e27`.
- The operator subsequently confirmed that the original zoom-related marker
  position problem was resolved on the Production site. No rollback was executed
  by Codex or reported by the operator.

**한국어:** 점과 이름표의 배치를 분리하고 지도 화면이 불필요하게 초기화되지 않도록
수정했습니다. 기존 보안 문제는 잠금 파일의 두 패키지만 갱신해 해결했습니다.
로컬·Preview 제약 때문에 사전 동의를 받아 Production에서 원래 증상의 해결을 확인했습니다.

## Key Files

- `src/features/map/kakaoMapProvider.tsx`
- `src/features/map/kakaoMapLayout.ts`
- `tests/kakao-map-alignment.test.mjs`
- `package-lock.json`
- `docs/architecture/kakao-marker-zoom-alignment-fix.md`
- `docs/architecture/phase-26-dependency-audit.md`
- `docs/architecture/next-session-handoff.md`

**한국어:** 위 코드·테스트·잠금 파일은 배포된 수정의 주요 파일입니다.
이번 종료 작업 자체는 문서 다섯 개만 변경하며 배포 코드는 수정하지 않습니다.

## Verification

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Historical before/after regressions | 4 FAIL / 2 PASS before; all 6 PASS after | Mocked SDK/DOM/effects; not visual proof |
| Pre-release typecheck / Node tests / build | PASS / 51 PASS / PASS | Recorded release validation |
| Dependency clean install / CSS comparison | PASS, historical | Lockfile install succeeded; generated CSS was byte-identical; not rerun during closeout |
| Pre-release full audit including dev | Zero findings | Recorded checkpoint result, not a permanent security guarantee |
| Production deployment `d7d5e27` | PASS | Vercel success and Production-labelled status; operator checked the Production site |
| Original zoom-alignment defect | PASS, operator-confirmed Production visual result | No numerical pixel-error measurement; no blanket checklist PASS |
| Localhost / Preview real Kakao | PARTIAL | Domain/configuration limitations |
| Additional Production interactions | PARTIAL | Individual results not explicitly recorded; see follow-ups |
| Docs-only closeout typecheck / Node tests / build | PASS / 51 PASS / PASS | Rerun once, including six Kakao regression tests |
| Docs-only closeout full audit including dev | Zero findings | Rerun once; all severity counts zero at that check |
| Documentation and boundary checks | PASS | Diff, Markdown, whitespace/EOF, forbidden paths, secret-like scan and code/package equivalence |

The documentation closeout commit is separate from the Production-tested
application release. Its deployment had not been observed at document preparation;
the post-push report records the actual status. Its unchanged app and lockfile do
not establish a new visual test. No extra commit is made for transient build status.

**한국어:** 원래 증상은 운영자 확인으로 PASS입니다. 자동 테스트 51개, 타입 검사,
빌드와 전체 보안 감사도 종료 작업에서 다시 통과했습니다. 과거의 새 설치·CSS 비교와
이번 검사를 구분하며, 종료 문서 배포 자체를 새 시각 테스트로 간주하지 않습니다.

## Remaining Risks / Follow-ups

- Mobile pinch and device/browser coverage remain PARTIAL.
- Upload picker zoom/pan, resize/panel/filter-camera combinations, label
  hover/focus/selected states, detail identity after filtering, browser fallback,
  and individual wheel/control/pan/animation cases are not explicitly recorded.
  Relevant mocks pass but cannot replace individual real-browser evidence.
- Full build-log secret review remains PARTIAL; the local secret-like diff scan
  is separate. No numerical alignment measurement was performed.
- The pre-release backup is an operational recovery target, not a security-clean
  dependency baseline. Prepared targeted recovery would retain the dependency
  patch where possible; no revert or deployment rollback was performed here.
- Wait for the operator to choose the next feature or operations task. Do not
  start Phase 27 automatically or make another marker patch from this closeout.

**한국어:** 모바일, 위치 선택기, 필터·크기 변경 등 개별 확인이 없는 항목은 PARTIAL로
남깁니다. 백업에는 보안 패치 전 의존성이 있으므로 복구가 필요하면 다시 검토해야 합니다.
다음 작업은 운영자가 선택할 때까지 기다립니다.

## Linked Docs

- [Marker fix and Production verification](../../architecture/kakao-marker-zoom-alignment-fix.md)
- [Dependency diagnosis and patch evidence](../../architecture/phase-26-dependency-audit.md)
- [Current handoff](../../architecture/next-session-handoff.md)
- [Previous Phase 25 archive](phase-25.md)

**한국어:** 상세 수정 근거, 보안 권고 식별자, 검증 한계와 최신 상태는 위 문서에 있습니다.

## Commit References

- Previous operational baseline: `813a819 docs: close phase 25 taxonomy tree browsing`.
- Marker implementation: `7345326 fix: keep kakao observation markers aligned during zoom`.
- Marker verification record: `7793928 docs: record kakao marker zoom regression checks`.
- Dependency patch: `69300fd fix: patch vulnerable transitive dependencies`.
- Deployed and operator-tested release: `d7d5e27 docs: record phase 26 dependency audit`.
- Separate closeout: `docs: close phase 26 kakao marker alignment`; its actual
  hash is recorded in Git and the final report, without self-amending this file.

**한국어:** 코드 수정, 보안 패치, 실제 확인한 배포와 종료 문서 커밋은 구분합니다.
종료 커밋의 실제 해시는 커밋 생성 후 최종 보고에 기록합니다.

## Notes

- The fix branch is preserved at `d7d5e27`; the local
  `backup/before-phase-26-kakao-production` is preserved at `813a819`.
- No DB records, saved coordinates, observation mutations, migrations, RLS,
  Storage policies, Auth, taxonomy rules, Kakao keys/domains, Vercel configuration
  or Supabase Edge Functions changed in this phase.
- Closeout changes documentation only: app, tests, dependency files and settings
  remain identical to `d7d5e27`. A normal docs-only main push may trigger another
  Vercel deployment; that is not another application fix.

**한국어:** 수정 브랜치와 배포 전 백업을 보존했습니다. DB·좌표·설정은 변경하지
않았고, 종료 작업은 문서만 변경합니다. 문서 push로 추가 배포가 발생할 수 있습니다.
