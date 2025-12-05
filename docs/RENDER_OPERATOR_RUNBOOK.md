# Render API Deployment Runbook

**Version:** 1.0.0-rc1 | **Updated:** S81

Quick-reference operator guide for deploying Pravado API to Render.

---

## Prerequisites Checklist

- [ ] Render account with access to organization
- [ ] GitHub repo connected to Render
- [ ] Supabase project with migrations applied (77 migrations: 0-76)
- [ ] Environment variables ready (see below)

---

## Required Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `SUPABASE_URL` | Supabase Dashboard > Project Settings > API | Yes |
| `SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API | Yes |
| `API_HOST` | Set to `0.0.0.0` | Yes |
| `API_PORT` | Set to `10000` (Render default) | Yes |
| `NODE_ENV` | Set to `staging` or `production` | Yes |

### Optional but Recommended

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | LLM provider for AI features |
| `OPENAI_API_KEY` | Alternative LLM provider |
| `STRIPE_SECRET_KEY` | Billing features |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook validation |
| `MAILGUN_API_KEY` | Email notifications |
| `MAILGUN_DOMAIN` | Email sender domain |

---

## Deployment Steps

### Step 1: Create Web Service

1. Go to Render Dashboard
2. Click **New > Web Service**
3. Connect to `pravado-v2` repository
4. Configure:
   - **Name:** `pravado-api-staging` (or `pravado-api-production`)
   - **Region:** Select closest to users
   - **Branch:** `main`
   - **Root Directory:** Leave empty (monorepo)
   - **Runtime:** Node
   - **Build Command:**
     ```
     pnpm install && pnpm build
     ```
   - **Start Command:**
     ```
     node --import tsx apps/api/dist/index.js
     ```

### Step 2: Configure Environment

1. Go to service **Environment** tab
2. Add all required variables from table above
3. Add optional variables as needed
4. Click **Save Changes**

### Step 3: Deploy

1. Click **Manual Deploy > Deploy latest commit**
2. Wait for build to complete (~2-3 minutes)
3. Watch logs for startup confirmation

---

## Verification

### Health Checks

Run these against your deployed URL:

```bash
# Set your API URL
API_URL="https://your-service.onrender.com"

# Liveness (should return immediately)
curl -s "$API_URL/health/live" | jq
# Expected: {"alive":true,"timestamp":"..."}

# Readiness (checks all dependencies)
curl -s "$API_URL/health/ready" | jq
# Expected: {"ready":true,"version":"1.0.0-rc1","timestamp":"..."}

# Full info (environment and config)
curl -s "$API_URL/health/info" | jq '.version, .environment, .database'
```

### Expected Startup Logs

```
Starting Pravado API...
Server started successfully {"url":"http://0.0.0.0:10000"}
```

---

## Troubleshooting

### Build Fails

| Error | Solution |
|-------|----------|
| `pnpm: command not found` | Set Node version to 20.x in Render settings |
| `Cannot find module` | Ensure build command includes `pnpm install` |
| `TypeScript errors` | Check that workspace packages build first |

### Server Fails to Start

| Error | Solution |
|-------|----------|
| `Missing env variables` | Verify all required vars are set |
| `EADDRINUSE` | Ensure API_PORT matches Render port |
| `Database connection failed` | Verify SUPABASE_URL is correct |

### Health Check Fails

| Issue | Check |
|-------|-------|
| `/health/live` timeout | Service didn't start, check logs |
| `/health/ready` returns false | Database connection issue |
| 401/403 errors | Likely CORS or auth misconfiguration |

---

## Rollback

To rollback to a previous deployment:

1. Go to Render Dashboard > Your Service
2. Click **Deploys** tab
3. Find the previous working deploy
4. Click **Redeploy**

---

## Related

- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md)
- [API Staging Setup](API_STAGING_SETUP_S80.md)
- [Staging Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md)
