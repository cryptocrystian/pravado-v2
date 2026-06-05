# Phase 0.5 / Plan 06d — Render Deploy Unblock

**Track owner:** Architect-directed
**Severity:** P0 — production API has not received any code update since 2026-05-15
**Closes:** Phase 1 issue #N (api Render deploys silently failing since 2026-05-23)
**Bundles:** Plan 06a (delete redundant `deploy-api.yml`)
**Date:** 2026-06-05

---

## Why this exists

Track 0D shipped a `fastify-raw-body` plugin (Group 1 B1 — SendGrid webhook silent-drop fix) that requires Fastify `^5.x`. The repo is on Fastify `4.29.1`. `fastify-plugin`'s peer-version check is **runtime-only**, so:

- `pnpm install` accepted the dep (no peer-dep enforcement)
- `pnpm typecheck` passed (no runtime instantiation)
- `pnpm test` passed (no boot path exercised end-to-end)
- Track 0D's 13/13 CI green satisfied the Phase 0 exit gate
- Every Render deploy since 2026-05-23 (commit `6c27359c`) has crashed at startup with `FST_ERR_PLUGIN_VERSION_MISMATCH`

Render's auto-deploy keeps the previous instance alive when the new one fails to bind a port, so `/health` returns 200 and nothing externally signals "API stuck on stale code." Last successful deploy SHA: `b62b43f` (2026-05-15). Track 0D's API fixes — including the SendGrid raw-body fix itself, the `auth.ts` `updatedAt` typo fix, and the `renderFetch<T>` generic narrowing — **are not live in production**.

## Fix shape (architect-approved: option A)

1. **Replace `fastify-raw-body` with a hand-rolled per-route raw-body capture.** The plugin is only used for one route (`POST /api/v1/pr-outreach-deliverability/webhooks/:provider`). A scoped `preParsing` hook captures the raw stream into a `Buffer`, decorates `request.rawBody`, then re-streams the buffer back to Fastify's body parser. Byte-exact preservation for HMAC.
2. **Loud-error on capture failure.** If the hook fails (stream error, etc.), `request.rawBody` stays `undefined` and the existing route handler returns 500 with structured log — exactly the Track 0D B1 hardening principle. **Never silently fall back to `JSON.stringify(request.body)`.**
3. **Remove `fastify-raw-body` from `apps/api/package.json`** and the plugin registration from `apps/api/src/server.ts`. Keep the `FastifyRequest.rawBody` module augmentation — the type still needs to exist for the route handler.
4. **Update `pnpm-lock.yaml`** to drop the dep.

## Structural fix — CI startup smoke test

The class of failure that bit Track 0D is "typecheck + test pass while runtime plugin chain crashes at startup." The structural fix is to add a CI step that boots `apps/api`, waits 5 seconds, and fails the build if the process exited. ~10 lines of YAML.

Env vars needed for boot are the required Supabase fields from `apiEnvSchema` (URL + service-role key + anon key), provided as test placeholders in the CI step.

A richer smoke test (hits `/health`, verifies dep status, etc.) is filed as a Phase 1 follow-up — see issue listed below.

## Bundled (Plan 06a)

`.github/workflows/deploy-api.yml` deleted. Render auto-deploys on commit per service config; the GH Actions workflow has been failing on YAML parse error and was generating noise without serving any purpose.

## Acceptance criteria

- [ ] `fastify-raw-body` removed from `package.json` + `pnpm-lock.yaml`
- [ ] `import rawBody from 'fastify-raw-body'` + `await server.register(rawBody, ...)` removed from `apps/api/src/server.ts`
- [ ] New `apps/api/src/lib/captureRawBody.ts` exports the `preParsing` hook
- [ ] SendGrid webhook route uses `preParsing: captureRawBody` instead of `config: { rawBody: true }`
- [ ] `.github/workflows/ci.yml` gains an `API startup smoke test` step in the Test job
- [ ] `.github/workflows/deploy-api.yml` deleted (Plan 06a)
- [ ] DECISIONS_LOG entries appended under 2026-06-05
- [ ] All 13 CI checks green
- [ ] After merge: Render deploys the new SHA successfully on `pravado-api` (verified via Render API)
- [ ] After deploy: `/health` returns 200 from the new SHA (deploy event becomes `live`)
- [ ] Phase 1 issue #N for the P0 deploy bug closes referencing the merge SHA

## Phase 1 issues filed alongside this PR

- `[P0] api Render deploys silently failing since 2026-05-23` — meta issue, closes when 06d merges + Render deploy verified
- `[P1] api Sentry DSN on Render is invalid format` — folds into Plan 01
- `[P2] api Redis SSL config drift` — non-blocking, BullMQ degrades gracefully
- `[P2] api.pravado.io custom domain not pointing anywhere` — DNS config, architect-managed
- `[P3] CI startup smoke test extension` — richer smoke test (/health + dep status verification)

## Out of scope

- Bumping Fastify to v5 (option B from 06b proposal) — defer until there's a deliberate reason
- Re-introducing a raw-body plugin if more routes need it — until then, the per-route hook stays
- Fixing the Sentry DSN format on Render — Plan 01 handles
- Custom domain DNS — architect-managed, separate issue
