# Phase 0.5 / Plan 06c — `@types/node` for `@pravado/validators`

**Sprint:** Phase 0.5 Observability
**Closes:** Phase 1 issue #15 (`deploy-dashboard.yml` validators typecheck fails)
**Status:** in flight
**Date opened:** 2026-06-09

## Why this exists

The `deploy-dashboard.yml` Validate stage fails on every main push because `pnpm --filter @pravado/validators exec tsc --noEmit` (invoked directly, bypassing turbo's per-package tsconfig context) can't resolve `process` (line 105) and `console` (line 111) in `packages/validators/src/env.ts`. The `CI` workflow passes because it runs through turbo. Root cause documented in issue #15.

## Scope

Three files. Single PR.

| File | Action |
|---|---|
| `packages/validators/tsconfig.json` | add `"types": ["node"]` to compilerOptions |
| `packages/validators/package.json` | add `"@types/node": "^20"` to devDependencies (matches root pin) |
| `pnpm-lock.yaml` | regenerated |

## Verification

- [ ] `pnpm --filter @pravado/validators exec tsc --noEmit` passes locally
- [ ] `pnpm typecheck` (turbo) continues to pass
- [ ] Plan 06d API startup smoke test continues to pass
- [ ] All 16 CI checks green
- [ ] After merge: `deploy-dashboard.yml` Validate stage on next main push passes (verify in the Actions tab)
- [ ] Issue #15 closes referencing the merge SHA

## Risks

- **`@types/node` version drift between packages.** Pinned to `^20` (matches root). Won't bump in this PR.

## Out of scope

- Migrating other packages to similar protective tsconfig hygiene — Phase 1 if needed.

## Coordination

Independent of all other Plan 0.5 PRs. Can merge in any order.

## DECISIONS_LOG entries

- DECISION (Plan 06c — validators picks up @types/node + tsconfig types: ["node"])
- VERIFIED (Plan 06c — deploy-dashboard.yml Validate stage passes after merge)
