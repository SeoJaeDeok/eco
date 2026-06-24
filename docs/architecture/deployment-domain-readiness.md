# Deployment And Custom Domain Readiness

한국어 요약: 이 문서는 KNU Eco Map을 배포하고 커스텀 도메인을 연결하기 전에 확인할 항목을 정리한 운영 체크리스트입니다. 이 단계에서는 배포, 도메인 연결, DNS 변경, Supabase/Kakao 설정 변경을 하지 않았습니다.

## Scope

English:

- Phase 23A is a readiness and checklist phase only.
- Phase 23B selected Vercel as the first hosting provider and added the repository-side SPA rewrite configuration.
- No hosting project was created.
- No deployment, merge, push, DNS change, Supabase Auth setting change, Kakao domain setting change, migration, RLS, Storage policy, package, or app-code change was performed.
- Automatic compensating Storage cleanup remains deferred as a post-deployment operations-hardening task.

한국어:

- Phase 23A는 배포 전 준비 문서 단계입니다.
- 아직 호스팅 프로젝트를 만들지 않았고, 배포도 하지 않았습니다.
- DNS, Supabase Auth, Kakao 도메인, 마이그레이션, RLS, Storage 정책, 앱 코드, 패키지 파일은 변경하지 않았습니다.
- Storage 업로드 성공 후 DB 저장 실패 시 자동 정리하는 기능은 아직 구현하지 않았고, 배포 이후 운영 하드닝 후보로 남깁니다.

## Release Candidate

English:

- Source branch before this readiness work: `feature/phase-22c-image-size-live-smoke`.
- Source commit: `9eb3394 docs: record image size alignment smoke`.
- Readiness branch: `feature/phase-23-deployment-domain-readiness`.
- Vercel configuration branch: `feature/phase-23b-vercel-first-deployment`.
- Push status: not pushed.
- Deployment status: not deployed.

한국어:

- 이번 배포 후보의 출발점은 `feature/phase-22c-image-size-live-smoke`의 `9eb3394`입니다.
- 현재 준비 브랜치는 `feature/phase-23-deployment-domain-readiness`입니다.
- 아직 GitHub push, main 병합, 실제 배포는 하지 않았습니다.

## Build And App Audit

English:

| Item | Finding |
| --- | --- |
| Framework | Vite + React + TypeScript |
| Package manager | npm, with `package-lock.json` |
| Production build command | `npm.cmd run build` |
| Build output directory | `dist` |
| Local preview command | `npm.cmd run preview` |
| Static app | Yes, this is a client-rendered static SPA |
| Base path | No custom Vite `base` is configured; deploy at the domain root unless this changes |
| SPA fallback | Configure unknown routes to serve `index.html` |
| Admin route | `/#admin` is hash-based and does not need a separate server route |
| Hard-coded localhost URLs | None found in production app code |
| Hosting provider config | `vercel.json` added in Phase 23B for SPA fallback |

한국어:

- 빌드는 `npm.cmd run build`로 실행하고 결과물은 `dist` 폴더에 생깁니다.
- 이 앱은 정적 SPA이므로, 호스팅에서 새로고침이나 직접 접근이 `index.html`로 돌아오도록 설정해야 합니다.
- 관리자 경로는 `/#admin` 해시 경로라 별도 서버 라우트가 필요하지 않습니다.
- 현재 앱 코드는 배포용으로 고정된 `localhost` URL을 사용하지 않습니다.

## Environment Variable Inventory

Do not copy values from `.env.local`. Record names only.

한국어: `.env.local` 값은 절대 복사하지 말고, 아래 변수 이름만 호스팅 업체 환경 변수 설정 화면에 입력해야 합니다.

| Variable | Required For Production? | Browser-Exposed? | Purpose | If Missing |
| --- | --- | --- | --- | --- |
| `VITE_OBSERVATION_REPOSITORY` | Required for real Supabase production mode | Yes | Selects `mock` or `supabase` observation repository | Defaults to mock data, so real production data will not be used |
| `VITE_SUPABASE_URL` | Required for Supabase auth/data mode | Yes | Supabase browser client project configuration | Public auth and Supabase repository paths are unavailable or fail |
| `VITE_SUPABASE_ANON_KEY` | Required for Supabase auth/data mode | Yes | Supabase browser anon client configuration | Public auth and Supabase repository paths are unavailable or fail |
| `VITE_SUPABASE_STORAGE_BUCKET` | Optional if the default bucket name is used | Yes | Selects the observation image Storage bucket | Defaults to the app's configured observation image bucket; wrong values break image upload/display |
| `VITE_KAKAO_MAP_JAVASCRIPT_KEY` | Optional for static fallback, required for real Kakao map | Yes | Enables the Kakao map provider in the browser | The static map fallback remains available |

Important notes:

- All `VITE_*` values are browser-exposed.
- These are not server secrets.
- A Supabase service-role key is not required and must not be used in frontend deployment settings.
- Production values must be entered only in the hosting provider's environment settings, not committed to Git.

## Supabase Production-Domain Checklist

English:

After the final HTTPS production origin is known, review these settings in the Supabase Dashboard. Do not change them until the deployment target is chosen.

1. Open the intended Supabase project.
2. Review Auth Site URL.
3. Review allowed redirect URLs.
4. Include the final HTTPS production origin.
5. Keep localhost redirect entries only if they are still needed for local development.
6. Check signup email-confirmation redirect behavior.
7. Confirm frontend deployment uses only the browser anon configuration.
8. Confirm no service-role key is needed in the hosting provider.
9. Remember that profile provisioning triggers and migrations are database-side.
10. Remember that approved-only public visibility is enforced by repository queries and Supabase RLS, not by the hosting provider.

한국어:

1. 실제 배포 도메인이 정해진 뒤 Supabase Dashboard를 엽니다.
2. Auth Site URL과 Redirect URL 목록을 확인합니다.
3. 최종 HTTPS 주소를 등록해야 할 수 있습니다.
4. 로컬 테스트가 계속 필요하면 localhost 항목은 유지할 수 있습니다.
5. 프론트엔드 배포에는 anon/browser 설정만 필요합니다.
6. service role key는 절대 프론트엔드나 호스팅 환경 변수에 넣지 않습니다.

## Kakao Production-Domain Checklist

English:

The Kakao map can load only when the final HTTPS production origin is allowed in Kakao Developers. Do not change this until the final domain is known.

1. Open the Kakao Developers console.
2. Find the app used for this project.
3. Add the final HTTPS production origin as an allowed JavaScript/web domain.
4. Do not commit or print the Kakao JavaScript key.
5. Re-run the Kakao normal-domain render smoke after deployment.
6. Re-run the no-key or failed-SDK fallback smoke after deployment.

Architecture confirmations:

- UI components do not call the Kakao SDK directly.
- Kakao loading remains behind the map provider boundary.
- Static fallback remains available when the key is missing, invalid, or not allowed for the domain.

한국어:

- 실제 도메인을 정한 뒤 Kakao Developers에서 그 HTTPS 주소를 JavaScript/web domain으로 등록해야 합니다.
- Kakao key 값은 코드나 문서에 쓰지 않습니다.
- 배포 후에는 Kakao 지도가 정상 표시되는지와, 실패 시 정적 fallback이 보이는지를 다시 확인합니다.

## Provider-Neutral Hosting Requirements

Phase 23B selected Vercel as the first hosting provider. The general requirements below still apply as a sanity checklist.

Required:

- Static Vite build support.
- HTTPS support.
- Environment variable settings.
- SPA fallback/rewrite to `index.html`.
- Git-based deployment or manual static upload support.
- Custom-domain support.
- Deployment logs.

Useful if available:

- Preview deployments.
- Rollback to a previous deployment.

한국어:

- 아직 호스팅 업체는 정하지 않았습니다.
- 업체를 고를 때는 Vite 정적 빌드, HTTPS, 환경 변수 설정, SPA fallback, 커스텀 도메인, 로그 확인, rollback 가능 여부를 확인합니다.
- 가격이나 마케팅 문구는 이 문서에서 판단하지 않습니다. 운영자가 업체를 선택해야 합니다.

## Custom Domain And DNS Checklist

English:

1. The operator must own or control the domain.
2. Choose whether the main public address will use the root/apex domain or `www`.
3. Choose whether root redirects to `www`, or `www` redirects to root.
4. Wait for the hosting provider to give exact DNS records.
5. Do not guess A, CNAME, or other records.
6. Add only the records supplied by the hosting provider.
7. Wait for DNS propagation and HTTPS certificate activation.
8. Use the final HTTPS origin in Supabase and Kakao settings.
9. Run production smoke only after DNS and HTTPS are active.

한국어:

1. 도메인을 직접 소유하거나 관리할 수 있어야 합니다.
2. 루트 도메인을 쓸지, `www`를 쓸지 먼저 정합니다.
3. DNS 레코드는 호스팅 업체가 알려주는 값을 그대로 사용합니다.
4. 임의로 A/CNAME 값을 추측해서 넣지 않습니다.
5. HTTPS 인증서가 활성화된 뒤에만 운영 smoke를 시작합니다.

## Git Integration Plan

Current audit result:

- `main` is an ancestor of the deployment candidate history.
- A later fast-forward integration should be possible if no newer `main` commits appear first.
- No merge or push was performed in Phase 23A.
- Phase 23B is allowed to fast-forward local `main` and push `main` only after all checks pass and the remote branch has no unexpected commits.

Prepared later commands, not run:

```bash
git switch main
git merge --ff-only feature/phase-23b-vercel-first-deployment
git push
```

Rules:

- Do not force push.
- Do not hard reset remote history.
- Do not squash away the preserved phase history unless the operator explicitly asks for a different release process.

한국어:

- 현재 이력은 나중에 `main`으로 fast-forward 병합하기 쉬운 형태입니다.
- 위 명령은 나중을 위한 예시이며, 이번 단계에서는 실행하지 않았습니다.

## Production Smoke Plan

Record each future result as PASS, PARTIAL, or FAIL.

### A. Basic Site

- HTTPS page loads.
- Browser refresh works.
- Navbar routes work.
- Desktop layout renders.
- Mobile layout renders.

### B. Auth

- Signup panel renders.
- Login works.
- Logout works.
- Safe nickname appears.
- Raw email does not appear publicly.
- Signed-out upload gate appears.
- Supabase email-confirmation return path works.

### C. Observations

- Approved list loads.
- Pending rows remain hidden publicly.
- Rejected rows remain hidden publicly.
- Detail modal opens.
- Search works.
- Taxon filters work.
- Species/scientific-name search works.
- Owner edit works.
- Anonymous edit button remains hidden.

### D. Images

- Existing images display.
- New small image upload works.
- One image above the former 5 MB limit can be tested only when explicitly approved.
- URL-like `image_url` is not persisted.
- Do not claim orphan cleanup unless it is tested.

### E. Map

- Kakao map renders on the production domain.
- No-key or failed-SDK fallback renders.
- Marker/detail behavior works.

### F. Admin

- Admin route is not shown in `Navbar`.
- Hidden admin route requires approved credentials.
- Admin review works only for authorized users.
- No public admin exposure appears.

### G. Security And Logging

- No keys, tokens, emails, passwords, or full SDK URLs appear in logs.
- No `.env.local` content appears.
- No service-role credential is present in frontend bundle or hosting configuration.

## Rollback Principles

English:

- Prefer the hosting provider's previous-deployment rollback when possible.
- Keep the previous deployment available until production smoke passes.
- Do not use `git reset --hard` or force push as a normal rollback plan.
- Applied database migrations remain immutable.
- If a production database correction is needed, design a separately reviewed follow-up migration.

한국어:

- 문제가 생기면 먼저 호스팅 업체의 이전 배포 rollback 기능을 사용합니다.
- 이미 적용한 DB 마이그레이션은 고치지 않고, 필요하면 새 마이그레이션을 검토합니다.

## Deferred Cleanup Status

English:

Automatic compensating Storage cleanup is not implemented. The known risk is: Storage upload can succeed and the observation DB insert can fail afterward, leaving an orphan object. Phase 22C manually cleaned the one test orphan, but this was not automated.

Recommended later work:

```text
Future operations-hardening phase - Compensating Storage Cleanup Design
```

If deployment readiness remains the priority, schedule this after the first deployment/domain smoke unless the operator chooses to prioritize cleanup earlier.

한국어:

- 자동 orphan cleanup은 아직 없습니다.
- 배포 준비를 먼저 진행할 수 있지만, 운영 안정화 과제로 계속 기록해야 합니다.

## No-Deployment Status

- Hosting provider selected for the first deployment path: Vercel.
- Hosting project created: no.
- App deployed: no.
- Custom domain connected: no.
- DNS changed: no.
- Supabase Auth production URLs changed: no.
- Kakao production domain changed: no.
- Git merge performed: no.
- Git push performed: no.
