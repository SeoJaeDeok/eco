# Phase XX - Phase Title

## Status

- Status: Completed / Verified / Design-only / Operations-docs / Partially complete
- Source basis: project docs, handoff notes, and commit history

## Goal

- State the phase goal in one or two bullets.

## Main Work

- Bullet the core work performed.
- Keep this concise.
- Do not include speculative work or future ideas unless they are explicitly recorded as follow-ups.

## Key Files

- `path/to/file.ts`
- `docs/architecture/example.md`

Only list files that exist or are explicitly referenced by project docs.

## Verification

- `npm.cmd run typecheck`: pass / not explicitly recorded
- `npm.cmd run build`: pass / not explicitly recorded
- Manual smoke or browser verification: pass / not explicitly recorded

Do not overstate verification. If a check is not recorded, say `not explicitly recorded`.

## Remaining Risks / Follow-ups

- List unresolved risks and follow-up work.
- If none are recorded, say `No phase-specific follow-up is explicitly recorded`.

## Linked Docs

- `docs/architecture/example.md`
- `docs/adr/example.md`

## Commit References

- `shortsha commit subject`, if available
- `not explicitly recorded`, if not known

## Notes

- Add context only when it clarifies the phase.
- Keep secrets out of the archive.

## Writing Rules

- Do not include `.env.local` contents.
- Do not include actual Supabase URLs, anon keys, tokens, emails, passwords, Kakao keys, or full SDK URLs.
- Treat `VITE_*` values as browser-exposed configuration names, not secret values.
- State facts only.
- Do not claim a phase is verified unless the verification is recorded in project docs or commit notes.
- Prefer `not explicitly recorded` over guessing.

## Procedure When A Phase Ends

1. Copy this file to `phase-XX.md`.
2. Replace the title, status, and sections with phase-specific facts.
3. Cross-check `AGENTS.md`, `README.md`, `docs/architecture/next-session-handoff.md`, relevant docs, and `git log`.
4. Update `index.md` with the new phase row.
5. Keep the entry concise enough to scan quickly.
6. Run `git diff --check` and a trailing-whitespace check.
7. Run a secret-like diff review without reading or printing `.env.local`.
