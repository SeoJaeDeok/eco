# Phase 27B - Public Auth Success Page Refresh

## Status And Scope

- Based on `a95d2b7`, preserving the complete Phase 27A branch history.
- Branch: `feature/phase-27b-auth-success-refresh`.
- Code/test commit: `af7c854 feat: refresh page after successful public auth actions`.
- Local implementation and automated verification complete; real browser/auth
  smoke remains PARTIAL. No main merge, push or deployment.
- Public login, logout and signup success now request one real page reload.
  No provider, database, auth setting, dependency or admin-flow redesign.

한국어: 인증 요청이 성공한 뒤 페이지를 한 번 새로고침합니다. 자동 테스트는 통과했지만
실제 계정과 브라우저에서 세션이 유지되는지 확인하는 작업은 아직 남아 있습니다.

## Audited Auth Path

- Navbar and UploadLoginGate use PublicLoginPanel, whose callbacks reach App.
  App alone orchestrates public actions through the existing AuthRepository.
- Login awaits the repository and requires a returned user. Signup distinguishes
  signed-in, confirmation-required and profile-setup-required results; unusable
  results and thrown errors do not refresh. Logout awaits the existing void
  success contract, then clears public user state before requesting reload.
- Supabase JS and auth-js are locked at 2.108.1. The cached client uses SDK
  defaults, including persistSession/autoRefreshToken. Installed SDK source awaits
  session saving during sign-in/signup before returning. SDK session restoration
  and App's getSessionState startup read are unchanged.
- The current source has no app-level onAuthStateChange subscription. This phase
  does not introduce one, nor add focus/storage event reload handlers. Existing
  SDK internal events and session persistence are untouched. Cross-tab public UI
  synchronization is not newly implemented by this task.
- Logout still calls auth.signOut() without options: existing default global
  scope is preserved. No local/global scope change.
- AdminPage has separate callbacks but shares AuthRepository/client. Neither is
  modified. The public completion path skips refresh on the admin route; stored
  public return data cannot select an admin page or grant authorization.
- There is no persistent mock-auth session implementation: unconfigured auth
  remains unavailable. Tests inject synthetic repositories, not a fake live login.

## Success Coordination

`src/features/auth/publicAuthRefresh.ts` is an application helper, not a repository.
App creates one instance per mount. Its synchronous begin guard prevents repeated
click/Enter or simultaneous public actions from starting duplicate requests before
React rerenders. Failure releases the guard for retry. A requested reload latches
the guard until document navigation; finally blocks only reset UI loading flags.

App calls finishPublicAuth only after awaited repository success classification.
The helper's browser adapter calls window.location.reload(), without a timer.
Initial session loading, token refresh, SDK SIGNED_IN events, tab activation and
StrictMode effects never call this completion path. Signup does not issue another
login or resend request. Failure retains existing safe Korean errors and form
behavior, including clearing password fields rather than persisting them.

Refresh/storage failure is separate from authentication failure: a successful
login is not relabeled as bad credentials because navigation failed. Logout
failure keeps the current user and now has a visible public alert even when the
login panel is closed. No repository error details are printed.

## One-Time Return And Notice

Public navigation is React state, except the existing admin hash. The dedicated
sessionStorage key `eco.public-auth-return.v1` carries only:

- version: 1;
- page: home, intro, observations, map or upload;
- notice: null, signed-in, confirmation-required or profile-setup-required;
- createdAt: numeric timestamp, valid for five minutes, rejecting future values.

No input values, account identifiers, tokens, session copies, observation drafts,
photos, coordinates, filters or URLs are saved. The helper never manages SDK
storage. It reads/removes only its own key, rejects malformed/extra fields,
unknown codes, oversized entries and expired data, and never calls storage.clear().

main.tsx consumes the record once before mounting StrictMode, passing a validated
snapshot into App. Double state initialization/effect replay cannot consume it
twice or erase the notice. A subsequent document load finds no record. Reading
the record only chooses public presentation; repository session state remains
the sole UI authentication/owner-control input. The admin hash takes precedence.

The initiating public page is restored, including upload. Notice strings reuse
the previous Korean messages. Confirmation-required remains signed out and the
notice is visible outside the closed Navbar form after reload. It does not claim
that a particular address received mail or that a new account was definitely
created. No email is displayed in this notice.

한국어: 기록하기에서 인증하면 새로고침 후 기록하기로 돌아옵니다. 이메일 확인이 필요한
가입은 로그인 완료로 표시하지 않고 기존 안내를 다시 보여줍니다. 안내 기록에는 계정이나
비밀번호가 없으며, 안내가 있다고 로그인된 것으로 판단하지 않습니다.

## Storage And Navigation Fallback

- Storage getter, read, write and removal exceptions are caught. A write/readback
  failure avoids automatic reload so the notice and public-page context are not
  silently lost. This conservative fallback applies to all public auth successes.
- App keeps the actual repository result and displays the current notice plus an
  explicit refresh button. Its click retries only storage/navigation, not auth.
  The user may knowingly refresh even if storage remains blocked; in that case
  page/notice restoration is unavailable and normal startup defaults apply.
- Navigation exceptions likewise show the manual option without converting a
  completed authentication into an authentication error.
- No app-level beforeunload/unsaved-draft guard was found. Existing cancel/close
  actions do not initiate auth or reload; closing a form is not SDK cancellation
  of an already submitted request. Successful auth reload discards transient
  filter/selection/draft state. No new persistence of drafts/photos was added.
- If the SDK itself cannot persist a real session because browser storage is
  blocked, this helper cannot repair that; real-browser behavior remains PARTIAL.

## Verification

| Check | Result | Evidence scope |
| --- | --- | --- |
| New auth tests | 18 PASS | Safe-record parsing, guard, actual App callbacks with injected repository/navigation |
| Full Node suite | 78 PASS | Prior 60 plus 18; Phase 27A and six Kakao regressions retained |
| Login/logout pending, success, failure and retry | PASS | Request completion ordering, one reload, safe failure UI, duplicate/cross-action guard |
| All three signup success classifications | PASS | Safe notice written before reload, no extra login, duplicate signup suppressed |
| Signup failure/unusable result | PASS | No notice write or reload |
| Startup/StrictMode/events | PASS | Simulated double initialization/effects; no auth-event subscription or event-triggered reload |
| Return data and blocked storage | PASS | TTL/schema/allowlist, own key only, no authorization from notice, explicit manual fallback |
| Navigation failure | PASS | Login remains successful; manual retry does not repeat auth |
| Admin/unconfigured auth | PASS | Admin route ignored by public refresh; no invented mock signup |
| Typecheck / build | PASS | Existing npm commands; no package modification |
| Full audit including dev | 0 vulnerabilities | All severities zero at this check; not a permanent security guarantee |
| Diff / formatting / forbidden files / secret scan | PASS | Intended changes only; no secret files read |
| Local app resource | HTTP 200 | Existing loopback server on port 3003; not proof of rendered UI or authentication |
| Actual browser reload/session retention | PARTIAL | Browser connection failed before inspection; no live account input performed |
| Actual signup/mail delivery paths | PARTIAL / not run | No new account or mail action approved/performed |
| Real Kakao local regression | PARTIAL | Existing domain limitation; provider untouched |

Commands: `npm.cmd run typecheck`,
`node --loader ./tests/ts-extension-loader.mjs --test tests/*.test.mjs`,
`npm.cmd run build`, `npm.cmd audit --include=dev --audit-level=high`, and
`git diff --check`. Focused auth test file also passes independently.
Tests exercise real App source with shallow UI boundaries, not a browser/SDK.
No Docker, WSL, local Supabase stack or remote SQL was used.

## Manual Follow-up

1. 로컬 앱에서 기존 승인된 테스트 계정을 직접 입력합니다. 채팅으로 계정 정보를
   보내지 않습니다. 기록하기에서 로그인 후 새로고침이 한 번 일어나고 로그인 상태와
   기록하기 화면이 유지되는지 확인합니다. 관찰은 저장하지 않습니다.
2. 로그아웃 후 한 번 새로고침되고 기록하기 로그인 안내와 비로그인 상태가 보이는지
   확인합니다. 기존 global scope이므로 다른 기기 세션에도 영향이 있을 수 있습니다.
3. 잘못된 로그인에서는 새로고침 없이 기존 오류 안내가 보이는지 확인합니다.
4. 가입은 별도 승인을 받은 경우에만 확인합니다. 즉시 세션 경로는 로그인 유지,
   확인 필요 경로는 안내 유지와 비로그인 상태를 확인합니다. 설정은 바꾸지 않습니다.
5. 잠시 기다리거나 탭을 왕복해도 반복 새로고침이 없는지 확인합니다. 저장소가 차단된
   경우 안내를 읽은 후 수동 새로고침 버튼을 사용하고 결과만 보고합니다.
6. 생태지도에서 Phase 27A 접기/펼치기와 트리 배치를 다시 확인합니다. 인증 후 전체
   reload와 필터 패널만 접는 동작은 다릅니다. 실제 Kakao 확대/축소 PASS로 대신하지 않습니다.

## Boundaries And Next Step

No package/lockfile, repository, migration/RLS, Edge Function, observation data,
Auth/Storage/Kakao/Vercel setting changes. Phase 26 and Phase 27A code stays intact.
The operator confirmed Phase 27A manual layout behavior separately; exact device
coverage and Kakao camera checks were not reported. No completed Phase 27 archive.
Next planned task: Phase 27C introduction-page related-site links, only after a
separate operator request. Do not start it automatically.

## Official References Checked

- [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
  and [signup](https://supabase.com/docs/reference/javascript/auth-signup): awaited
  result/error handling; do not infer account existence from a generic response.
- [Supabase sign-out](https://supabase.com/docs/reference/javascript/auth-signout):
  global is the default scope; this phase retains it.
- [Supabase auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange):
  event notifications are distinct from explicit user action completion. No new
  callback or async SDK call from such a callback is introduced here.
- [MDN Location.reload](https://developer.mozilla.org/en-US/docs/Web/API/Location/reload):
  reload the current document, with no forced-cache parameter.
- [MDN sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage):
  per-tab page-session data survives reload; browser policy can block storage.
