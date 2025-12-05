# Pravado API: Render Staging Setup Guide (S80)

This guide walks you through deploying the Pravado API to Render for staging. Render is recommended for its simplicity and generous free tier.

**Time Required:** 20-30 minutes

**Alternative Platforms:** Fly.io, Railway (see appendix)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Render account - https://render.com (free tier available)
- [ ] Access to the Pravado GitHub repository
- [ ] Supabase project with migrations applied
- [ ] Anthropic or OpenAI API key (optional, can use stub mode)

---

## Part 1: Create Render Web Service

### Step 1.1: Connect to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** button
3. Select **"Web Service"**

### Step 1.2: Connect GitHub Repository

1. Click **"Connect a repository"**
2. If not connected, authorize Render to access your GitHub
3. Find and select `pravado-v2` repository
4. Click **"Connect"**

### Step 1.3: Configure Service Settings

Fill in the following:

| Setting | Value |
|---------|-------|
| **Name** | `pravado-api-staging` |
| **Region** | Choose closest to your users (e.g., Oregon) |
| **Branch** | `main` |
| **Root Directory** | Leave empty (monorepo handling below) |
| **Runtime** | Node |

### Step 1.4: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Build Command** | `pnpm install && pnpm --filter @pravado/types build && pnpm --filter @pravado/validators build && pnpm --filter @pravado/utils build && pnpm --filter @pravado/feature-flags build && pnpm --filter @pravado/api build` |
| **Start Command** | `node apps/api/dist/index.js` |

### Step 1.5: Select Instance Type

For staging:
- **Free** tier is fine for testing
- **Starter** ($7/month) for better performance

---

## Part 2: Configure Environment Variables

### Step 2.1: Add Required Variables

Click **"Advanced"** and add these environment variables:

**Required:**

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `API_HOST` | `0.0.0.0` | Required for Render |
| `API_PORT` | `3001` | Or use Render's default |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase dashboard |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase dashboard |
| `CORS_ORIGIN` | `https://your-dashboard.vercel.app` | Your Vercel dashboard URL |
| `COOKIE_SECRET` | `<random-32-chars>` | Generate a secure random string |
| `DASHBOARD_URL` | `https://your-dashboard.vercel.app` | For email links |

**LLM Configuration (choose one):**

Option A - Anthropic (Recommended):
| Key | Value |
|-----|-------|
| `LLM_PROVIDER` | `anthropic` |
| `LLM_ANTHROPIC_API_KEY` | `sk-ant-...` |

Option B - OpenAI:
| Key | Value |
|-----|-------|
| `LLM_PROVIDER` | `openai` |
| `LLM_OPENAI_API_KEY` | `sk-...` |

Option C - Stub Mode (for testing):
| Key | Value |
|-----|-------|
| `LLM_PROVIDER` | `stub` |

### Step 2.2: Generate Cookie Secret

Generate a secure random string:

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use: https://generate-secret.vercel.app/32
```

---

## Part 3: Deploy

### Step 3.1: Create Service

1. Click **"Create Web Service"**
2. Wait for the build (5-10 minutes first time)
3. Watch the build logs for any errors

### Step 3.2: Note Your Service URL

Once deployed, Render provides a URL like:
```
https://pravado-api-staging.onrender.com
```

Save this - you'll need it for:
- `NEXT_PUBLIC_API_URL` in Vercel
- Health check verification

### Step 3.3: Verify Health Endpoints

```bash
# Replace with your Render URL
curl https://pravado-api-staging.onrender.com/health/live
# Expected: {"alive":true}

curl https://pravado-api-staging.onrender.com/health/ready
# Expected: {"ready":true,"version":"1.0.0-rc1",...}

curl https://pravado-api-staging.onrender.com/health/info
# Expected: Full app info
```

---

## Part 4: Enable Auto-Deploy Webhook

### Step 4.1: Get Deploy Hook URL

1. In Render dashboard, go to your service
2. Click **"Settings"** tab
3. Scroll to **"Deploy Hook"**
4. Click **"Create Deploy Hook"**
5. Name it: `github-actions`
6. Copy the URL (looks like `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`)

### Step 4.2: Add to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - Name: `RENDER_DEPLOY_HOOK_STAGING`
   - Value: The deploy hook URL from step 4.1

### Step 4.3: Update GitHub Workflow

The deploy-api.yml workflow needs to be updated to use the Render deploy hook. The workflow already has a placeholder - you just need to uncomment it.

---

## Part 5: Update Dashboard Configuration

### Step 5.1: Update Vercel Environment Variable

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Update or add:
   - `NEXT_PUBLIC_API_URL` = `https://pravado-api-staging.onrender.com`
3. Redeploy the dashboard

### Step 5.2: Verify CORS

Make a test request from your dashboard:

1. Open your Vercel dashboard URL
2. Open browser DevTools (F12) → Console
3. Check for CORS errors
4. If you see CORS errors, verify `CORS_ORIGIN` on Render matches your Vercel URL

---

## Part 6: Configure Health Checks

### Step 6.1: Set Up Render Health Check

1. In Render service settings
2. Find **"Health Check Path"**
3. Enter: `/health/live`
4. Save

This ensures Render restarts the service if it becomes unhealthy.

### Step 6.2: Configure Zero Downtime Deploys

1. In Render service settings
2. Enable **"Zero Downtime Deploys"** (if available on your plan)

---

## Part 7: Verify Full Integration

### Step 7.1: End-to-End Test

1. Open your Vercel dashboard URL
2. Open browser DevTools → Network tab
3. Navigate to a page that calls the API
4. Verify API calls succeed (200 responses)

### Step 7.2: Test Authentication

1. Go to the login page
2. Sign in with a test user
3. Verify the session persists
4. Navigate to `/app` - should see the dashboard

### Step 7.3: Test LLM (if configured)

1. Navigate to Playbooks
2. Try to create or run a playbook
3. Verify AI-generated content appears (not just stub responses)

---

## Troubleshooting

### Build Fails: "pnpm: command not found"

**Fix:** Add Node.js version file:

1. Create `.node-version` in repo root:
   ```
   20
   ```
2. Or set `NODE_VERSION` env var to `20` in Render

### Build Fails: "Cannot find module"

**Fix:** Ensure build command builds packages in order:
```
pnpm install && pnpm --filter @pravado/types build && pnpm --filter @pravado/validators build && pnpm --filter @pravado/utils build && pnpm --filter @pravado/feature-flags build && pnpm --filter @pravado/api build
```

### API Starts But Crashes Immediately

**Check logs for:**
- Missing environment variables
- Invalid Supabase credentials
- Port binding issues

**Fix:** Ensure `API_HOST=0.0.0.0` (not `localhost`)

### CORS Errors from Dashboard

**Fix:**
1. Verify `CORS_ORIGIN` exactly matches your Vercel URL
2. Include the protocol: `https://your-dashboard.vercel.app`
3. No trailing slash

### Database Connection Errors

**Fix:**
1. Verify Supabase credentials are correct
2. Check Supabase project is not paused
3. Verify migrations are applied

### Cold Start Slowness (Free Tier)

**Issue:** Render free tier spins down after inactivity.

**Fix:**
- Upgrade to Starter tier ($7/month)
- Or accept 30-60 second cold starts

---

## GitHub Actions Integration

### Enable Automated Deployments

After adding `RENDER_DEPLOY_HOOK_STAGING` to GitHub Secrets, the workflow will automatically deploy when changes are pushed to `main`.

### Manual Deployment

1. Go to GitHub → Actions → "Deploy API"
2. Click "Run workflow"
3. Select `staging` environment
4. Click "Run workflow"

---

## Quick Reference Card

### Render Service Settings

| Setting | Value |
|---------|-------|
| Name | `pravado-api-staging` |
| Branch | `main` |
| Build Command | See Part 1.4 |
| Start Command | `node apps/api/dist/index.js` |
| Health Check | `/health/live` |

### Required Environment Variables

| Variable | Source |
|----------|--------|
| `NODE_ENV` | `production` |
| `API_HOST` | `0.0.0.0` |
| `SUPABASE_URL` | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Supabase Dashboard |
| `CORS_ORIGIN` | Your Vercel URL |
| `COOKIE_SECRET` | Generate random |

### Verification URLs

| Endpoint | Purpose |
|----------|---------|
| `/health/live` | Liveness check |
| `/health/ready` | Readiness check |
| `/health/info` | Full app info |

---

## Appendix: Alternative Platforms

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create pravado-api-staging

# Set secrets
fly secrets set SUPABASE_URL=... -a pravado-api-staging

# Deploy
fly deploy
```

### Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `pravado-v2`
4. Set root directory to `apps/api`
5. Add environment variables
6. Deploy

---

## Related Documents

- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md)
- [Vercel Staging Setup](VERCEL_STAGING_SETUP_S80.md)
- [Staging Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
