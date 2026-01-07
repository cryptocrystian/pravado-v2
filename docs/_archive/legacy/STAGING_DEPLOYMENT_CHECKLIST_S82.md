# Staging Deployment Checklist (S82)

**Version:** 1.0.0-rc1 | **Platform Status:** PLATFORM_FREEZE available | **Updated:** S82

Single-page, copy-pasteable checklist for deploying Pravado to staging (Render API + Vercel Dashboard).

---

## Pre-Deployment Prerequisites

- [ ] Supabase project created with 77 migrations applied (0-76)
- [ ] Local `.env` file has all secrets (Supabase, LLM keys, etc.)
- [ ] All packages typecheck with 0 errors (`pnpm typecheck`)
- [ ] You have accounts for: Render, Vercel, GitHub

---

## RENDER CONFIG SUMMARY (API)

### Service Settings

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | `pravado-api-staging` |
| **Region** | Oregon (US West) or closest to your users |
| **Branch** | `main` |
| **Root Directory** | _(leave empty - monorepo root)_ |
| **Runtime** | Node |
| **Node Version** | 20.x |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `node --import tsx apps/api/dist/index.js` |
| **Health Check Path** | `/health/live` |

### Required Environment Variables (Render)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NODE_ENV` | Set to `production` | Literal value |
| `API_HOST` | Set to `0.0.0.0` | Literal value |
| `API_PORT` | Set to `10000` | Render default port |
| `SUPABASE_URL` | Supabase project URL | Local `.env` or Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Local `.env` or Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (SECRET) | Local `.env` or Supabase Dashboard > Settings > API |
| `CORS_ORIGIN` | Dashboard URL for CORS | Your Vercel staging URL (e.g., `https://pravado-staging.vercel.app`) |
| `DASHBOARD_URL` | Same as CORS_ORIGIN | Your Vercel staging URL |
| `COOKIE_SECRET` | Random 32-char string | Generate: `openssl rand -base64 24` |

### Recommended Environment Variables (Render)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `LLM_PROVIDER` | `anthropic` or `openai` | Your preference |
| `LLM_ANTHROPIC_API_KEY` | Anthropic API key (if using) | Local `.env` |
| `LLM_OPENAI_API_KEY` | OpenAI API key (if using) | Local `.env` |
| `LOG_LEVEL` | `info` | Literal value |
| `PLATFORM_FREEZE` | `false` (or `true` to block writes) | Literal value |

### Optional Environment Variables (Render)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | For billing features |
| `STRIPE_WEBHOOK_SECRET` | For Stripe webhooks |
| `MAILGUN_API_KEY` | For email delivery |
| `MAILGUN_DOMAIN` | For email delivery |

---

## VERCEL CONFIG SUMMARY (Dashboard)

### Project Settings

| Setting | Value |
|---------|-------|
| **Framework** | Next.js (auto-detected) |
| **Root Directory** | `apps/dashboard` |
| **Build Command** | _(leave default / `pnpm build`)_ |
| **Output Directory** | `.next` (default) |
| **Install Command** | `pnpm install` |
| **Node.js Version** | 20.x |

### Required Environment Variables (Vercel)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Local `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Local `.env` |
| `NEXT_PUBLIC_API_URL` | Render API URL | After Render deploy: `https://pravado-api-staging.onrender.com` |

### Optional Environment Variables (Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_DASHBOARD_URL` | Your Vercel staging URL (for links) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For billing UI |

---

## Deployment Order

**Deploy in this order to get correct URLs:**

### Step 1: Deploy API to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New > Web Service**
3. Connect to your `pravado-v2` GitHub repo
4. Configure settings per table above
5. Add all **Required** env vars (use placeholder for `CORS_ORIGIN` initially: `https://placeholder.vercel.app`)
6. Click **Create Web Service**
7. Wait for build and deploy (~3-5 minutes)
8. Note the deployed URL: `https://pravado-api-staging.onrender.com`

**Verify API:**
```bash
curl -s "https://pravado-api-staging.onrender.com/health/ready" | jq
# Expected: {"ready":true,"version":"1.0.0-rc1",...}
```

### Step 2: Deploy Dashboard to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New > Project**
3. Import your `pravado-v2` repo
4. Set **Root Directory** to `apps/dashboard`
5. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → your Render URL from Step 1
6. Click **Deploy**
7. Wait for build (~2-3 minutes)
8. Note the deployed URL: `https://pravado-staging.vercel.app` (or your custom domain)

### Step 3: Update Render CORS

1. Go back to Render Dashboard > your API service
2. Click **Environment**
3. Update `CORS_ORIGIN` and `DASHBOARD_URL` to your actual Vercel URL
4. Save changes (triggers redeploy)

---

## SEED DEMO ORG CHECKLIST

### Prerequisites

- [ ] Staging Supabase database is accessible
- [ ] You have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for staging

### Seed Command

Run this **locally** (not in Render):

```bash
# Set staging credentials (copy from your .env or Supabase Dashboard)
export SUPABASE_URL="https://your-staging-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ...your-service-role-key"

# Run the seed script
pnpm --filter @pravado/api seed:demo
```

### Expected Output

```
═══════════════════════════════════════════════════════════
  PRAVADO DEMO ORGANIZATION SEED SCRIPT (S77)
═══════════════════════════════════════════════════════════

🏢 Seeding organization...
   ✓ Created org: <uuid>
👥 Seeding users...
   ✓ Created user: demo-exec@demo.local
   ✓ Created user: demo-analyst@demo.local
📰 Seeding PR & Media data...
   ✓ Created 3 media sources
   ✓ Created 3 earned mentions
   ✓ Created 2 press releases
...
Seed completed successfully!
```

### Verify Seeding

1. Login to staging dashboard
2. Navigate to `/app/playbooks` - should see 3+ playbooks
3. Navigate to `/app/exec/digests` - should see at least 1 digest
4. Navigate to `/app/pr` - should see media mentions

---

## STAGING VALIDATION – 15 MIN FLOW

### 1. API Health Check (2 min)

```bash
API_URL="https://pravado-api-staging.onrender.com"

# Liveness
curl -s "$API_URL/health/live" | jq
# Expected: {"alive":true,"timestamp":"..."}

# Readiness
curl -s "$API_URL/health/ready" | jq
# Expected: {"ready":true,"version":"1.0.0-rc1","timestamp":"..."}

# Full info
curl -s "$API_URL/health/info" | jq '.version, .environment'
# Expected: "1.0.0-rc1", "production"
```

- [ ] All 3 health endpoints return expected responses

### 2. Dashboard Access (2 min)

| Check | URL | Pass |
|-------|-----|------|
| Landing loads | `/` | [ ] |
| Login page renders | `/login` | [ ] |
| No red console errors | DevTools > Console | [ ] |

### 3. Authentication Flow (3 min)

| Step | Expected | Pass |
|------|----------|------|
| Click login | Auth form appears | [ ] |
| Enter valid credentials | Redirects to `/app` | [ ] |
| Refresh page | Still logged in | [ ] |
| Click logout | Redirects to `/login` | [ ] |

### 4. Core Navigation (3 min)

| Route | Expected | Pass |
|-------|----------|------|
| `/app` | Dashboard home loads | [ ] |
| `/app/playbooks` | Playbooks list (3+ if seeded) | [ ] |
| `/app/content` | Content section loads | [ ] |
| `/app/pr` | PR section with mentions | [ ] |
| `/app/exec` | Executive command center | [ ] |

### 5. Executive Intelligence (2 min)

| Route | Expected | Pass |
|-------|----------|------|
| `/app/exec/digests` | Digest list (1+ if seeded) | [ ] |
| `/app/exec/board-reports` | Board reports list | [ ] |
| `/app/unified-narratives` | Unified narratives page | [ ] |

### 6. Advanced Features (2 min)

| Route | Expected | Pass |
|-------|----------|------|
| `/app/scenarios` | Scenarios list | [ ] |
| `/app/reality-maps` | Reality maps visualization | [ ] |
| `/app/insight-conflicts` | Insight conflicts list | [ ] |

### 7. API Integration Check (1 min)

Open DevTools > Network tab while navigating:

- [ ] API requests go to `pravado-api-staging.onrender.com` (not localhost)
- [ ] Responses are 200 OK (not 4xx/5xx)
- [ ] `Authorization: Bearer ...` header present on API calls

---

## Quick Result Summary

| Check | Status |
|-------|--------|
| API Health | [ ] PASS / [ ] FAIL |
| Dashboard Access | [ ] PASS / [ ] FAIL |
| Authentication | [ ] PASS / [ ] FAIL |
| Navigation | [ ] PASS / [ ] FAIL |
| Executive Views | [ ] PASS / [ ] FAIL |
| Advanced Features | [ ] PASS / [ ] FAIL |
| API Integration | [ ] PASS / [ ] FAIL |

**Overall:** [ ] STAGING READY / [ ] NEEDS FIXES

---

## Troubleshooting Quick Reference

| Issue | Check |
|-------|-------|
| API returns 500 | Render logs, env vars |
| Dashboard blank | Vercel function logs, browser console |
| CORS errors | `CORS_ORIGIN` in Render matches Vercel URL |
| Auth not working | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| No data | Run seed script |
| API timeout | Render may be sleeping (free tier); wait 30s |

---

## Important Notes

1. **Platform is at RC1** - no product feature changes should be made
2. **PLATFORM_FREEZE** can be set to `true` to block all write operations
3. **Migrations** - Supabase must have all 77 migrations (0-76) applied
4. **LLM Features** - AI features require `LLM_PROVIDER` + API key to be set

---

## Related Documents

- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md) - Full env var reference
- [Render Operator Runbook](RENDER_OPERATOR_RUNBOOK.md) - Detailed API deployment
- [Vercel Operator Runbook](VERCEL_OPERATOR_RUNBOOK.md) - Detailed Dashboard deployment
- [Staging Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md) - Comprehensive testing
- [UAT Checklist](UAT_CHECKLIST_V1.md) - User acceptance testing
