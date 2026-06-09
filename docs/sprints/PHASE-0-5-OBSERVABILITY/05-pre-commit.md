# Phase 0.5 / Plan 05 — Pre-commit Hooks

**Sprint:** Phase 0.5 Observability
**Status:** in flight
**Date opened:** 2026-06-09

## Why this exists

CI is the authoritative gate but provides feedback minutes-to-hours after a push. Pre-commit hooks give developers seconds-after-`git commit` feedback on lint/format/dirty-monitored-dir issues. They're a quality-of-life layer, not a security gate.

## Scope

### File changes

| File                                | Action                                                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` (root)               | add `husky` (v9+) + `lint-staged` to `devDependencies`; `prepare` script to register husky                                                                                                                                                                          |
| `.husky/pre-commit`                 | NEW — runs `pnpm exec lint-staged`, then `node scripts/check-monitored-dirs.mjs`, then `node scripts/check-zone-identifier.mjs`                                                                                                                                     |
| `.lintstagedrc.json`                | NEW — `{"*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{js,jsx,json,md,yml,yaml}": ["prettier --write"]}`                                                                                                                                                   |
| `scripts/check-monitored-dirs.mjs`  | NEW — checks `git status --porcelain` for unstaged-but-existing files in `apps/api/src/routes/`, `apps/dashboard/src/app/app/`, `packages/feature-flags/src/`. If found, prints them + exit non-zero. Prevents the "untracked agency routes" pattern from Track 0D. |
| `scripts/check-zone-identifier.mjs` | NEW — rejects commits containing files matching `*:Zone.Identifier` or similar Windows artifacts                                                                                                                                                                    |
| `.gitignore`                        | append `*:Zone.Identifier` if missing                                                                                                                                                                                                                               |
| `docs/DEVELOPMENT.md`               | document hooks + `--no-verify` emergency escape                                                                                                                                                                                                                     |

### Husky v9 specifics

v9 deprecated the install lifecycle approach. Use `husky` command with no args + add `prepare` to root `package.json` per https://typicode.github.io/husky/get-started.html. Will pin to `^9.0.0`.

## Architect-approved refinement

- `--no-verify` backstop: **soft refinement — include if mechanically simple given Husky v9, otherwise defer**. With v9 there's no v8-style global hook config, so opinionated enforcement would require a `commit-msg` hook with parsing. Deferring to Phase 1.

## Verification

- [ ] `corepack pnpm install` triggers husky setup automatically (verified by `.husky/_/` directory creation)
- [ ] Make a deliberate lint error → `git commit` rejects
- [ ] Create a `test:Zone.Identifier` file → `git commit -A` rejects
- [ ] Leave an unstaged file in `apps/api/src/routes/` → commit rejects with the monitored-dir message
- [ ] All 16 CI checks green
- [ ] Hooks correctly skipped on `git commit --no-verify` (with manual confirmation this is for emergencies only)

## Risks

- **CI runners don't run pre-commit hooks** — by design. The hooks are a dev-feedback layer; CI stays authoritative.
- **WSL ↔ Windows line endings** can trip prettier — add `.gitattributes` if needed.

## Out of scope

- `commit-msg` hook enforcing Conventional Commits — Phase 1 (adds friction)
- `pre-push` hook running full typecheck — Phase 1 (slower)
- Branch-naming enforcement — Phase 1

## Coordination

All other Plan 0.5 PRs independent.

## DECISIONS_LOG entries

- DECISION (Plan 05 — husky v9 + lint-staged + monitored-dir clean-check + Zone.Identifier reject)
