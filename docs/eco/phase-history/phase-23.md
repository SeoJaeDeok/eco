# Phase 23 - Vercel Deployment And Production Smoke

## Status

Verified for the first Vercel production deployment scope. Custom-domain connection and several deeper production regression paths remain partial or optional.

**한국어 요약:** Phase 23은 첫 Vercel 운영 배포와 기본 공개 화면 smoke 범위에서 Verified입니다. 별도 커스텀 도메인 연결, 운영 로그인/관리자/업로드/Kakao 실제 지도 렌더는 명시적으로 확인된 범위가 아니므로 PARTIAL로 남깁니다.

## Goal

- Prepare and deploy the Vite SPA through Vercel.
- Verify the first HTTPS production deployment and core public read/detail/image flow.

**한국어 요약:** Vercel로 Vite SPA를 배포하고, HTTPS 운영 페이지에서 공개 목록, 상세, 이미지, 새로고침 동작이 정상인지 확인하는 것이 목표였습니다.

## Main Work

- Phase 23A audited deployment and custom-domain readiness.
- Phase 23A documented build command, output directory, SPA fallback needs, environment variable names, Supabase checklist, Kakao checklist, hosting requirements, DNS checklist, and production smoke plan.
- Phase 23B selected Vercel as the first hosting provider.
- Added `vercel.json` with a SPA rewrite to `/index.html`.
- Verified the release candidate with typecheck, build, JSON validation, diff checks, and secret-like scans.
- Fast-forwarded the verified release candidate into `main`.
- Pushed `main` normally to `origin/main` without force push, rebase, squash, amend, or reset.
- The operator imported the GitHub repository into Vercel.
- Vercel was configured as a Vite project.
- Required production `VITE_*` variables were entered privately in Vercel.
- Vercel Production deployment from `main` succeeded.
- The operator confirmed the first production smoke subset.

**한국어 요약:** 배포 준비 문서를 만들고, Vercel SPA rewrite를 추가한 뒤, 검증된 브랜치를 `main`에 fast-forward로 통합하고 일반 push했습니다. 이후 운영자가 Vercel에서 저장소를 연결하고 환경 변수를 비공개로 입력했으며, 첫 Production 배포와 기본 공개 화면 smoke가 통과했습니다.

## Key Files

- `vercel.json`
- `docs/architecture/deployment-domain-readiness.md`
- `docs/architecture/next-session-handoff.md`
- `docs/eco/phase-history/phase-23.md`
- `docs/eco/phase-history/index.md`

**한국어 요약:** Vercel SPA 설정, 배포 준비 문서, handoff, Phase 23 archive, phase index가 핵심 파일입니다.

## Verification

- `npm.cmd run typecheck` before release push: PASS.
- `npm.cmd run build` before release push: PASS.
- `git diff --check` before release push: PASS.
- `vercel.json` JSON validation: PASS.
- Forbidden tracked paths check for `.env`, `.env.local`, `.env.production`, `dist`, and `node_modules`: PASS.
- Secret-like scan before release push: PASS; no actual secret values were recorded.
- Normal non-force push to `origin/main`: PASS.
- Vercel repository import: PASS, operator-confirmed.
- Vercel Production deployment from `main`: PASS, operator-confirmed.
- HTTPS deployment page load: PASS, operator-confirmed.
- Public observation list load: PASS, operator-confirmed.
- Existing observation detail open: PASS, operator-confirmed.
- Existing observation image display: PASS, operator-confirmed.
- Browser refresh without 404: PASS, operator-confirmed.
- Supabase production URL/redirect configuration review: PASS, operator-confirmed.
- Kakao production web-domain configuration review: PASS, operator-confirmed.
- Production login/logout: PARTIAL / not explicitly recorded.
- Production signup/email confirmation: PARTIAL / not explicitly recorded.
- Production owner edit: PARTIAL / not explicitly recorded.
- Production admin smoke: PARTIAL / not explicitly recorded.
- Production image upload: PARTIAL / not explicitly recorded.
- Real Kakao production map render: PARTIAL / not explicitly recorded.
- Custom-domain/DNS smoke: PARTIAL / not connected.

**한국어 요약:** 첫 Vercel 운영 배포, HTTPS 로드, 공개 목록, 상세, 기존 이미지, 새로고침은 PASS입니다. 운영 로그인/회원가입, owner edit, admin, 운영 이미지 업로드, 실제 Kakao 운영 지도 렌더, 커스텀 도메인은 명시적으로 검증되지 않아 PARTIAL입니다.

## Remaining Risks / Follow-ups

- Separate custom `.com` or other custom-domain connection remains optional follow-up.
- DNS/custom-domain smoke remains untested because no separate custom domain was connected.
- Automatic compensating Storage cleanup for future DB-insert failures remains deferred.
- Forced expired signed URL retry remains optional hardening.
- Near-20 MB upload remains untested unless later verified.
- Optional production owner/non-owner/admin regression may be rerun after significant Auth/RLS changes.
- Production login/logout/signup and admin paths should be tested before relying on them for launch-critical workflows.

**한국어 요약:** 커스텀 도메인, 자동 Storage orphan cleanup, 만료 signed URL 재시도, 20MB 근접 업로드, 운영 auth/admin regression은 후속 선택 작업입니다.

## Linked Docs

- `docs/architecture/deployment-domain-readiness.md`
- `docs/architecture/next-session-handoff.md`
- `docs/eco/phase-history/index.md`
- `docs/eco/project-working-guide.md`

**한국어 요약:** 배포 준비 문서, 최신 handoff, phase index, 작업 방식 가이드를 함께 참고합니다.

## Commit References

- `aeb57d9 docs: prepare deployment and domain readiness`
- `3362bd2 chore: configure vercel spa deployment`
- Final closeout commit: `docs: close phase 23 deployment` (hash is recorded in the final session report)

**한국어 요약:** Phase 23A 문서 커밋, Phase 23B Vercel 설정 커밋, 그리고 최종 closeout 문서 커밋을 기준으로 합니다.

## Notes

- No actual Vercel URL, Supabase URL, redirect URL, domain name, environment value, key, token, email, password, or `.env.local` content is recorded.
- Production environment values are managed in Vercel, not Git.
- Production deploys are connected to pushes on `main`.
- `vercel.json` keeps SPA refresh/direct path fallback routed to `/index.html`.
- The hidden admin route remains hash-based as `/#admin` and is not exposed in `Navbar`.
- Phase 24 is not assigned yet. The next feature or bug must be selected explicitly by the operator.

**한국어 요약:** 실제 URL이나 비밀 값은 기록하지 않았습니다. 운영 환경 변수는 Git이 아니라 Vercel에서 관리합니다. 다음 Phase 24 주제는 아직 정하지 않았고, 운영자가 다음 기능이나 버그를 선택해야 합니다.
