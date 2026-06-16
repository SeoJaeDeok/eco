# Phase XX - Phase Title

## Status

- Status: Completed / Verified / Design-only / Operations-docs / Partially complete
- Source basis: project docs, handoff notes, and commit history

**한국어:** 상태와 근거를 간단히 적습니다. 완료, 검증, 설계 전용, 운영 문서화, 부분 완료 중 실제 기록에 맞는 표현을 사용합니다.

## Goal

- State the phase goal in one or two bullets.

**한국어:** 이 phase의 목표를 1~2개 bullet로 간결하게 적습니다.

## Main Work

- Bullet the core work performed.
- Keep this concise.
- Do not include speculative work or future ideas unless they are explicitly recorded as follow-ups.

**한국어:** 실제 수행한 핵심 작업만 적습니다. 추측이나 미래 아이디어는 명시된 follow-up일 때만 포함합니다.

## Key Files

- `path/to/file.ts`
- `docs/architecture/example.md`

Only list files that exist or are explicitly referenced by project docs.

**한국어:** 실제 존재하거나 프로젝트 문서에서 명시적으로 언급된 파일만 나열합니다.

## Verification

- `npm.cmd run typecheck`: pass / not explicitly recorded
- `npm.cmd run build`: pass / not explicitly recorded
- Manual smoke or browser verification: pass / not explicitly recorded

Do not overstate verification. If a check is not recorded, say `not explicitly recorded`.

**한국어:** 검증 결과를 과장하지 않습니다. 기록이 없으면 `not explicitly recorded`라고 적습니다.

## Remaining Risks / Follow-ups

- List unresolved risks and follow-up work.
- If none are recorded, say `No phase-specific follow-up is explicitly recorded`.

**한국어:** 남은 리스크와 후속 작업을 적습니다. 명시된 항목이 없으면 phase-specific follow-up이 기록되지 않았다고 적습니다.

## Linked Docs

- `docs/architecture/example.md`
- `docs/adr/example.md`

**한국어:** 관련 architecture 문서나 ADR을 링크합니다.

## Commit References

- `shortsha commit subject`, if available
- `not explicitly recorded`, if not known

**한국어:** 확인 가능한 커밋이 있으면 짧은 hash와 제목을 적고, 모르면 `not explicitly recorded`라고 적습니다.

## Notes

- Add context only when it clarifies the phase.
- Keep secrets out of the archive.

**한국어:** phase 이해에 도움이 되는 맥락만 짧게 적고, 비밀값은 절대 포함하지 않습니다.

## Writing Rules

- Do not include `.env.local` contents.
- Do not include actual Supabase URLs, anon keys, tokens, emails, passwords, Kakao keys, or full SDK URLs.
- Treat `VITE_*` values as browser-exposed configuration names, not secret values.
- State facts only.
- Do not claim a phase is verified unless the verification is recorded in project docs or commit notes.
- Prefer `not explicitly recorded` over guessing.

**한국어:** 영어 원문을 유지하고 각 영어 섹션 바로 아래에 `**한국어:**` 형식의 섹션 단위 요약을 추가합니다. 실제 env 값, URL, key, token, email, password는 쓰지 않습니다.

## Procedure When A Phase Ends

1. Copy this file to `phase-XX.md`.
2. Replace the title, status, and sections with phase-specific facts.
3. Cross-check `AGENTS.md`, `README.md`, `docs/architecture/next-session-handoff.md`, relevant docs, and `git log`.
4. Update `index.md` with the new phase row.
5. Keep the entry concise enough to scan quickly.
6. Run `git diff --check` and a trailing-whitespace check.
7. Run a secret-like diff review without reading or printing `.env.local`.

**한국어:** phase 종료 시 template을 복사하고 사실 관계를 확인한 뒤 index를 업데이트합니다. 문서 검증과 secret-like diff 검토를 수행하되 `.env.local`은 읽거나 출력하지 않습니다.
