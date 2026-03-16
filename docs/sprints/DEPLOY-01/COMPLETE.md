# DEPLOY-01 — Production Deployment Sprint

**Date**: 2026-03-16
**Scope**: Configure Render production service, prepare Vercel env vars, create deployment docs

---

## Task 1 — render.yaml updated

**File**: `render.yaml`
- Changed service name from `pravado-api-staging` to `pravado-api`
- Updated `healthCheckPath` from `/health/live` to `/health`
- Updated `buildCommand` to use `--frozen-lockfile` and `--filter @pravado/api build`

## Task 2 — Render production service created

**Created via Render MCP tool** (not the script — script had API payload issues, MCP tool succeeded).

| Property | Value |
|----------|-------|
| Service ID | `srv-d6s8gpchg0os73f2e8dg` |
| Service Name | `pravado-api` |
| URL | https://pravado-api.onrender.com |
| Dashboard | https://dashboard.render.com/web/srv-d6s8gpchg0os73f2e8dg |
| Region | Oregon |
| Plan | Starter |
| Runtime | Node 20 |
| Auto-deploy | Yes (on commit to main) |

**Environment variables configured**: 36 env vars set including all Supabase, Redis, Stripe, AI, OAuth, monitoring, and CORS settings.

**Script also created**: `apps/api/src/scripts/configureRenderProduction.ts` for future env var updates.

## Task 3 — First deploy triggered

| Property | Value |
|----------|-------|
| Deploy ID | `dep-d6s8gpshg0os73f2e93g` |
| Status | `build_failed` |
| Reason | Local changes not yet pushed to GitHub `main` branch |

**Next step**: Commit all changes and push to `main`. Render auto-deploy will trigger a fresh build.

## Task 4 — Vercel environment variables

**Created**: `docs/deployment/VERCEL_ENV_VARS.md`
- Lists all 11 `NEXT_PUBLIC_*` variables with actual values
- Ready to paste into Vercel Dashboard

**Created**: `apps/dashboard/.env.production`
- `NEXT_PUBLIC_API_URL=https://pravado-api.onrender.com`
- `NEXT_PUBLIC_APP_URL=https://pravado-dashboard.vercel.app`
- `NODE_ENV=production`

## Task 5 — Google OAuth checklist

**Created**: `docs/deployment/GOOGLE_OAUTH_CHECKLIST.md`
- Steps to add production URLs to Google OAuth client
- Includes Supabase redirect URL configuration

---

## Service URLs

| Service | URL | Status |
|---------|-----|--------|
| API (Render) | https://pravado-api.onrender.com | Configured, awaiting code push |
| Dashboard (Vercel) | https://pravado-dashboard.vercel.app | Env vars need setting |
| Health check | https://pravado-api.onrender.com/health | Will work after deploy |

## Pre-Launch Checklist

Before the services are fully live:

1. **Commit and push** all local changes to `main` — triggers Render auto-deploy
2. **Set Vercel env vars** per `docs/deployment/VERCEL_ENV_VARS.md`
3. **Update Google OAuth** per `docs/deployment/GOOGLE_OAUTH_CHECKLIST.md`
4. **Update Supabase Auth** redirect URLs to include production domain
5. **Verify** health check at https://pravado-api.onrender.com/health
6. **Verify** dashboard loads at https://pravado-dashboard.vercel.app

## Exit Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | render.yaml updated for "pravado-api" | Done |
| 2 | configureRenderProduction.ts created, service configured | Done (via MCP) |
| 3 | Deploy triggered, deploy ID logged | Done — `dep-d6s8gpshg0os73f2e93g` (awaiting code push) |
| 4 | VERCEL_ENV_VARS.md created with values | Done |
| 5 | .env.production created | Done |
| 6 | GOOGLE_OAUTH_CHECKLIST.md created | Done |
| 7 | Sprint summary written | This file |
