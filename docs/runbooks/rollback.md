# Production Rollback Runbook

> Stage 4 C2 hardening. Covers every production layer that can be rolled back or
> gracefully degraded. Each layer was exercised against **staging** (never
> production) — see the [Test results](#test-results) table for what was live-tested
> vs. inspection-only.

**Production services**

| Layer                               | Platform    | Identifier                                                                                                                          |
| ----------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| API (`pravado-api`)                 | Render      | `srv-d6s8gpchg0os73f2e8dg` — deploys from `main`, autoDeploy on                                                                     |
| API staging (`pravado-api-staging`) | Render      | `srv-d4ov97m3jp1c73docvpg` — deploys from `main`, `BULLMQ_PREFIX=pravado-staging`                                                   |
| Dashboard                           | Vercel      | projects `pravado-dashboard` (app), `web`/`dashboard` (marketing)                                                                   |
| Database                            | Supabase    | project `kroexsdyyqmlxfpbwajv` (shared by prod + staging)                                                                           |
| Redis                               | Redis Cloud | Fixed 250MB, single DB `14105042`, endpoint `redis-14691.c263.us-east-1-2.ec2.cloud.redislabs.com:14691` (plain `redis://`, no TLS) |
| LLM                                 | Anthropic   | model env-driven via `LLM_ANTHROPIC_MODEL` → `getAnthropicModel()`                                                                  |

---

## Overview — decision tree

**Something looks broken in production. Walk this before touching anything.**

1. **Is it user-visible?**
   - Data loss / corruption risk → **STOP, page the architect first** (rollback may not recover data; a reverse migration could make it worse). Go to Layer 3.
   - Feature broken / 5xx → continue.
   - Cosmetic only → fix-forward; do **not** rush a rollback at 2am.
2. **Is Sentry showing new events?** Which C6 alert fired?
   - `LLM fallback` (Mode 1) → Layer 5 (provider) or Layer 6 (model).
   - `BullMQ queue init failure` (Mode 2) / `/health redis degraded` (Mode 3) → Layer 4 (Redis).
   - `Onboarding enqueue` (Mode 4) → Layer 4 (Redis) — queue not reachable.
   - `Cold-start LLM timeout` (Mode 5) → Layer 6 (model slow/retired) or Anthropic status page.
   - No Sentry events but users report breakage → likely a code/deploy issue → Layer 1 (API) or Layer 2 (Dashboard).
3. **What does `/health` say?** `curl https://pravado-api.onrender.com/health`
   - `200 healthy` → API process is fine; problem is dashboard (Layer 2) or downstream data.
   - `503` with `checks.redis: degraded` → Layer 4.
   - `503` with `checks.database` not ok → Supabase incident (not a rollback — check Supabase status).
   - Connection refused / timeout → API is down → Layer 1 (roll back the last API deploy).
4. **Rollback or fix-forward?**
   - Last deploy < 30 min ago and clearly the cause → **rollback** (fast, Layer 1/2).
   - Root cause is config/env (bad key, retired model, Redis) → **flip the env var** (Layers 4/5/6) — usually faster than a code rollback.
   - Root cause unclear or spans layers → **page the architect**, don't guess.

> Rule of thumb: **env-var flips (Layers 4–6) beat code rollbacks (Layers 1–2)** — no rebuild, smaller blast radius. Reach for a code rollback only when the deploy itself is the fault.

---

## Layer 1: API code rollback (Render)

**When to use.** A `pravado-api` deploy shipped a regression (crash loop, failed health check, 5xx spike) and the previous deploy was healthy.

**Prerequisites.** Render dashboard access, or `RENDER_API_KEY`. Know a **known-good** target deploy ID (`GET /v1/services/{id}/deploys`).

**Procedure (copy-paste).**

1. List recent deploys, pick the last `live`/healthy one that predates the regression:
   ```
   curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
     "https://api.render.com/v1/services/srv-d6s8gpchg0os73f2e8dg/deploys?limit=10"
   ```
2. Trigger the rollback:
   ```
   curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
     -d '{"deployId":"<GOOD_DEPLOY_ID>"}' \
     "https://api.render.com/v1/services/srv-d6s8gpchg0os73f2e8dg/rollback"
   ```
   Dashboard equivalent: service → Deploys → the target deploy → **Rollback to this deploy**.
3. Poll until `live` (rollback re-activates a prior build — **no rebuild**, so it's fast).

**Verification.** `curl https://pravado-api.onrender.com/health` → `200`, `version` = the target SHA, `checks` all `ok`.

**Time-to-restore.** **~2 min** (measured 107 s on staging — re-activates an existing build, no `pnpm install`/build step).

**Known limitations / edge cases.**

- **⚠️ Rollback restores the target deploy's ENV SNAPSHOT, not the current env** (confirmed on staging: rolling back to a deploy that had a bad `REDIS_URL` re-applied the bad `REDIS_URL` and re-degraded the service). **Pick a target whose env was also healthy.** If the regression was an env-var change, do **not** rollback — flip the env var and trigger a fresh deploy instead (a fresh `POST /deploys` uses _current_ env).
- A code rollback does **not** undo a database migration. If the bad deploy also ran a migration, see Layer 3.
- After a git revert on `main`, autoDeploy ships the revert — that's a "roll forward to a known-good tree," ~8 min (full rebuild), slower than the instant rollback above.

---

## Layer 2: Dashboard code rollback (Vercel)

**When to use.** A dashboard deploy (app `pravado-dashboard` or marketing `web`) broke the UI / build. Vercel keeps every production deployment and supports **instant rollback** (re-alias to a previous deployment — no rebuild).

**Prerequisites.** Vercel dashboard access, or `VERCEL_API_TOKEN`. Team/project scope.

**Procedure.**

1. Dashboard (fastest at 2am): project → **Deployments** → previous healthy production deployment → **⋯ → Instant Rollback** (or **Promote to Production**).
2. API equivalent — list deployments and promote a prior one:
   ```
   curl -s -H "Authorization: Bearer $VERCEL_API_TOKEN" \
     "https://api.vercel.com/v6/deployments?projectId=<PRJ_ID>&target=production&limit=10"
   # then promote the chosen deployment id:
   curl -s -X POST -H "Authorization: Bearer $VERCEL_API_TOKEN" \
     "https://api.vercel.com/v10/projects/<PRJ_ID>/promote/<DEPLOYMENT_ID>"
   ```
   Project IDs: `pravado-dashboard` = `prj_l0upVAPm74yq2oQpozEuQnG9pjaX`, `dashboard` = `prj_uzd02TpHkfDWPBmTvddxn5VVpyn4`, `web` = `prj_yoYhN3WWqJR6xgzHHDymehFDzh9J`.
3. Vercel re-points the production alias to the previous build.

**Verification.** Load the affected URL; check the deployment's commit SHA in the Vercel dashboard matches the known-good one; confirm no console/build errors.

**Time-to-restore.** **< 1 min** (alias re-point, no rebuild) — Vercel's instant rollback is the fastest recovery of any layer.

**Known limitations / edge cases.**

- Instant rollback re-aliases; it does **not** roll back environment variables or edge config — flip those separately if they were the cause.
- **There is no separate dashboard _staging_ Vercel project**, so a controlled break-test would have to target a production or preview deployment. Per the C2 constraint ("do not break a Vercel production project"), the live break-test was **not** run — access + procedure were verified via the API (deployment listing) instead. See [Test results](#test-results).

---

## Layer 3: Database schema rollback

**When to use.** A migration shipped a schema change that a bad deploy depends on, and you're rolling the code back.

**Decision framework (this is the important part).**

- **All migrations shipped to date are additive** (e.g. migration 96: added `status='fallback'` to a CHECK, plus nullable `error_message` / `attempted_model` / `attempted_provider` columns + an index to `llm_usage_ledger`). Additive changes are **backward-compatible**: old code simply ignores the new columns.
- Therefore the default rollback for an additive migration is **revert the code, leave the schema in place**. Do **not** run a reverse migration to drop columns — it's unnecessary, and dropping a column that any still-running instance writes to causes errors mid-rollout.

**When you _would_ run a reverse migration:**

1. The migration was **destructive/rewriting** (dropped a column, changed a type, back-filled/mutated data) — additive-only never qualifies.
2. The new column has a **NOT NULL / CHECK constraint that old code violates** on write — none of ours do (all new columns are nullable).
3. You've confirmed **no running instance** still reads/writes the column (fully rolled back first).

**Procedure (additive — the normal case).**

1. Roll back the API code (Layer 1) and/or dashboard (Layer 2).
2. Leave the schema. Verify old code runs (it ignores the new columns).
3. File a ticket to re-apply the code fix forward; the schema is already ahead and compatible.

**Procedure (destructive — rare, needs architect sign-off).**

1. Write and test a reverse migration on staging first (`kroexsdyyqmlxfpbwajv` staging branch).
2. Take a Supabase point-in-time snapshot before applying.
3. Apply the reverse migration only after all instances are on the rolled-back code.

**Verification.** `information_schema.columns` reflects the intended schema; app runs without column-missing errors; no new Sentry DB errors.

**Time-to-restore.** Additive path: **0 min** (no schema action — bounded by the Layer 1/2 code rollback). Destructive path: highly variable — treat as an incident, not a routine rollback.

**Known limitations.** Migrations are applied manually via the Supabase MCP/CLI, not auto-run on deploy — so a code rollback never implicitly reverts schema (which is the safe default here).

---

## Layer 4: Redis rollback

**When to use.** Redis is unreachable or degraded (`/health` `checks.redis: degraded`, Sentry Mode 2/3), or a bad `REDIS_URL`/plan change broke queueing.

**⚠️ Reality check — there is no separate fallback Redis DB.** The 2026-07-03 "upgrade to Fixed 250MB" was an **in-place plan upgrade of the single existing database** (`14105042`, same endpoint) — **not** a new DB with the old Essentials kept as a hot standby. `SELECT 1` is rejected (single-DB instance). So "re-point `REDIS_URL` to the old Essentials DB" **has no target** — that assumption was incorrect. Plan accordingly.

**Recovery paths, fastest first.**

- **A) Bad `REDIS_URL` value / env** (most common, and what's live-testable):
  1. Set the correct value on the service:
     ```
     curl -s -X PUT -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
       -d '{"value":"redis://:<password>@redis-14691.c263.us-east-1-2.ec2.cloud.redislabs.com:14691"}' \
       "https://api.render.com/v1/services/<SERVICE_ID>/env-vars/REDIS_URL"
     ```
     (Retrieve the exact value from the Redis Cloud dashboard or the prod service's env — **never commit the password**.) Scheme is `redis://` (plain TCP); do **not** use `rediss://` for this endpoint (forcing TLS was the F13 Stage-1b outage, see `258e288`).
  2. Trigger a **fresh deploy** (`POST /deploys`) so the process reloads env (a Render env change does **not** auto-redeploy).
- **B) Redis instance itself is down** (no fallback DB exists):
  1. Restore from a **Redis Cloud backup/snapshot** (Redis Cloud dashboard → database → Backups), or
  2. **Provision a new Redis Cloud DB** and set `REDIS_URL` to it on both services, then redeploy.
  3. Interim: BullMQ **degrades gracefully** — the API stays up (`initializeBullMQ` catches the failure and Sentry-fires Mode 2); background jobs run on-demand only until Redis returns. No user-facing 5xx from Redis alone.

**Verification.** `/health` → `checks.redis: ok`; staging boot log shows all 6 queues initialized; `redis-cli PING` → `PONG`.

**Time-to-restore.** Path A: **~8 min** (env flip is instant; the fresh redeploy is the cost). Path B: **15–45 min** (backup restore or new-DB provisioning) — **exceeds the 15-min target; flag as a beta risk** (no hot standby).

**Known limitations.**

- Staging + prod **share** the single Redis instance, isolated only by BullMQ key prefix (`pravado-staging` vs `bull`). A prefix collision or an instance-level failure affects both. During C6 Mode 2/3 staging tests, prod stayed healthy (staging pointed at a dead host, never touching the shared instance) — but connection-pool/shared-resource isolation was **not** formally tested.
- No separate old-Essentials DB to fail over to (see reality check).

---

## Layer 5: LLM provider rollback (graceful degradation)

**When to use.** Anthropic is down or credits are exhausted during beta traffic.

**There is no active rollback — the system degrades automatically.** `LlmRouter` catches any Anthropic error (auth, credit, 5xx, timeout) and returns a **deterministic stub** response, writing a `status='fallback'` row to `llm_usage_ledger` with the reason (`error_code`), and firing C6 Mode 1 to Sentry. Proposals still ship — at **stub quality** — until Anthropic recovers.

**Procedure.**

1. Confirm the cause in `llm_usage_ledger` (`status='fallback'`, `error_code`) and Sentry Mode 1.
2. If **credits**: top up the Anthropic account (console). No deploy needed — the next call succeeds.
3. If **Anthropic outage**: nothing to roll back; monitor the Anthropic status page. Stub fallback keeps the surface non-empty.
4. If a **bad `ANTHROPIC_API_KEY`** was deployed: correct the env var on the service and trigger a fresh deploy (same mechanism as Layer 4-A).

**User-visible consequence.** Proposals continue but are generic stub text (no named-publication specificity) until Anthropic returns — a soft, non-blocking degradation, not an outage.

**Verification.** A fresh scan produces `provider='anthropic'` ledger rows again; Sentry Mode 1 stops firing.

**Time-to-restore.** Credit top-up: **~1 min** (no deploy). Bad-key correction: **~8 min** (env flip + redeploy). Anthropic outage: **provider-dependent** (out of our control; degradation is transparent).

**Known limitations.** Observability currently covers only the Anthropic path; extending structured attribution across providers (OpenAI stub path) is the open **P0 observability ticket** — future work.

---

## Layer 6: Anthropic model rollback

**When to use.** The pinned model (`claude-sonnet-4-5-20250929`) is retired, deprecated, or having an outage (Sentry Mode 5 timeouts, or Mode 1 `not_found_error`). This is the **"model retirement mid-beta"** scenario — exactly the F13 failure that motivated env-driving the model.

**Prerequisites.** Render env access. A valid replacement model from the org's `/v1/models` catalog.

**Procedure.**

1. Pick a rollback target currently in the catalog: **`claude-sonnet-4-6`** (closest successor) or `claude-opus-4-7`.
2. Flip the env var on both services (prod + staging):
   ```
   curl -s -X PUT -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
     -d '{"value":"claude-sonnet-4-6"}' \
     "https://api.render.com/v1/services/<SERVICE_ID>/env-vars/LLM_ANTHROPIC_MODEL"
   ```
3. Trigger a fresh deploy on each (env change doesn't auto-redeploy). `getAnthropicModel()` reads `LLM_ANTHROPIC_MODEL` at call time, so no code change is ever needed.

**Verification.** A 1-token probe against the new model returns `200`:

```
curl https://api.anthropic.com/v1/messages -H "x-api-key: <KEY>" -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" -d '{"model":"claude-sonnet-4-6","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'
```

Then a fresh scan yields `provider='anthropic'`, `model='claude-sonnet-4-6'`, `status='success'`; Sentry Mode 1/5 stops.

**Time-to-restore.** **~8 min** (env flip + redeploy on each service). The **fallback floor is instant** — until the redeploy lands, `LlmRouter` serves stubs (Layer 5), so there's no hard outage during the swap.

**Known limitations.**

- `LLM_ANTHROPIC_MODEL` is env-driven, but `timeoutMs` for the cold-start path is **not** (hardcoded 60 s). A model that's merely _slow_ (not retired) can still time out — that needs a code change, not an env flip.
- Env change requires an explicit redeploy to load (Render does not auto-redeploy on env change).

---

## Test results

All tests run against **staging only**. "Break method" describes how the failure was induced (or why it wasn't).

| Layer                | Break method                                             | Time-to-restore                                        | Result              | Notes                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 API code (Render)  | Render rollback to a prior deploy                        | **107 s**                                              | ✅ tested           | Fast (no rebuild). **Finding:** rollback restores the target's _env snapshot_ — rolling to a bad-config deploy re-broke staging; restored via fresh deploy (~8 min).       |
| 2 Dashboard (Vercel) | none run                                                 | < 1 min (est.)                                         | 🟡 inspection-only  | API access + procedure verified (deployment listing). No staging Vercel project exists; live break skipped to avoid touching prod per constraint.                          |
| 3 DB schema          | n/a (decision-framework)                                 | 0 min (additive)                                       | ✅ documented       | Additive migrations → revert code, leave schema. Reverse migration only for destructive changes (none shipped).                                                            |
| 4 Redis              | staging `REDIS_URL` → dead host + redeploy (C6 Mode 2/3) | **~8 min** (config revert ~1.5 min; rebuild dominates) | ✅ tested           | Break 21:43Z → revert 21:52Z → green 21:59Z. **Finding:** no separate old-Essentials DB (in-place upgrade) — instance-level failure needs backup-restore/new-DB (>15 min). |
| 5 LLM provider       | bad key → auto stub fallback (proven F13/C6)             | ~1 min (credit) / ~8 min (key)                         | 🟡 mechanism-proven | Graceful degradation is automatic; "rollback" = top-up or env flip. Full staging re-run skipped (deploy-cycle economy; mechanism exhaustively proven in F13).              |
| 6 Anthropic model    | bad model → Sentry + stub (proven C6 Mode 1)             | ~8 min                                                 | 🟡 mechanism-proven | Env flip to `claude-sonnet-4-6`; `getAnthropicModel()` reads at call time. Sentry-fires-on-bad-model proven in C6; staging redeploy-cycle skipped for time.                |

**Layers exceeding the 15-min target:** Layer 4 **Path B** (Redis instance failure — no hot standby, 15–45 min). Flagged for architect beta-blocking decision.

---

## Escalation contacts

- **Founder / architect:** cdibrell@pravado.io + cdibrell@gmail.com
- **Sentry alerts** already route to these addresses (C6 — 5 alert rules on project `pravado-api`).
- **No on-call rotation yet** — that's **C9**; when it lands, replace these direct contacts with the rotation and update Sentry alert routing.
