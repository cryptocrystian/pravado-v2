# Pravado Dashboard: Vercel Staging Setup Guide (S80)

This guide walks you through deploying the Pravado Dashboard to Vercel for the first time. No prior Vercel experience required.

**Time Required:** 15-20 minutes

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Vercel account (free tier is fine) - https://vercel.com/signup
- [ ] Access to the Pravado GitHub repository
- [ ] Supabase project credentials (see [Environment Matrix](ENVIRONMENT_MATRIX_S80.md))
- [ ] (Optional) Anthropic or OpenAI API key for AI features

---

## Part 1: Connect Repository to Vercel

### Step 1.1: Import Git Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** button (top right)
3. Select **"Project"**
4. You'll see "Import Git Repository"

### Step 1.2: Connect to GitHub (if not already)

1. Click **"Continue with GitHub"**
2. Authorize Vercel to access your GitHub account
3. Grant access to the `pravado-v2` repository (or "All repositories")

### Step 1.3: Select Repository

1. Find `pravado-v2` in the list
2. Click **"Import"** next to it

---

## Part 2: Configure Project Settings

### Step 2.1: Configure Root Directory

This is **critical** for monorepo setup:

1. In the "Configure Project" screen, find **"Root Directory"**
2. Click **"Edit"** (pencil icon)
3. Navigate to and select: `apps/dashboard`
4. Click **"Continue"**

The path should now show: `apps/dashboard`

### Step 2.2: Verify Framework Detection

Vercel should auto-detect:

| Setting | Expected Value |
|---------|----------------|
| Framework Preset | Next.js |
| Build Command | `next build` (auto) |
| Output Directory | `.next` (auto) |
| Install Command | `pnpm install` (auto) |

If these aren't auto-detected, set them manually.

### Step 2.3: Override Build Command (Important!)

Because this is a monorepo, override the build command:

1. Find **"Build and Output Settings"**
2. Toggle ON the override for **"Build Command"**
3. Enter:
   ```
   cd ../.. && pnpm install && pnpm --filter @pravado/types build && pnpm --filter @pravado/validators build && pnpm --filter @pravado/utils build && pnpm --filter @pravado/feature-flags build && pnpm --filter @pravado/dashboard build
   ```

**Alternative (shorter):** If Vercel times out with the above, use:
```
cd ../.. && pnpm install && pnpm build
```

### Step 2.4: Set Node.js Version

1. Scroll to **"Node.js Version"**
2. Select **20.x** (required for this project)

---

## Part 3: Configure Environment Variables

### Step 3.1: Add Required Variables

In the "Environment Variables" section, add each variable:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJ...` | All |
| `NEXT_PUBLIC_API_URL` | `https://api-staging.pravado.com` | Preview |
| `NEXT_PUBLIC_DASHBOARD_URL` | (leave blank for now) | Preview |

**How to add each variable:**

1. Enter the variable name in "Name" field
2. Enter the value in "Value" field
3. For **"Environments"**, select:
   - **All** for Supabase variables (same for all environments)
   - **Preview** for API_URL (staging) or **Production** for production
4. Click **"Add"**

### Step 3.2: Get Your Supabase Credentials

If you don't have these yet:

1. Go to https://supabase.com/dashboard
2. Select your project (or create one)
3. Go to **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Part 4: Deploy

### Step 4.1: Initial Deployment

1. Click **"Deploy"** button
2. Wait for the build to complete (3-5 minutes for first build)
3. Watch the build logs for any errors

### Step 4.2: Verify Deployment

Once complete:

1. Click the preview URL (e.g., `pravado-dashboard-xxxxx.vercel.app`)
2. You should see the Pravado login page
3. If you see errors, check the build logs

### Step 4.3: Note Your Deployment URL

Copy the deployment URL. You'll need it for:
- `NEXT_PUBLIC_DASHBOARD_URL` environment variable
- API CORS configuration

---

## Part 5: Post-Deployment Configuration

### Step 5.1: Update Dashboard URL

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add a new variable:
   - Name: `NEXT_PUBLIC_DASHBOARD_URL`
   - Value: Your deployment URL (e.g., `https://pravado-dashboard.vercel.app`)
   - Environments: **Preview**
3. Click **"Add"**

### Step 5.2: Trigger Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu → **"Redeploy"**
4. Confirm the redeploy

### Step 5.3: Configure Custom Domain (Optional)

To use a custom domain like `staging.pravado.com`:

1. Go to **Settings** → **Domains**
2. Enter your domain: `staging.pravado.com`
3. Click **"Add"**
4. Follow the DNS configuration instructions
5. Update `NEXT_PUBLIC_DASHBOARD_URL` to match

---

## Part 6: Verify Everything Works

### Step 6.1: Basic Load Test

Visit these pages on your deployment:

| URL Path | Expected |
|----------|----------|
| `/` | Landing page loads |
| `/login` | Login page with Supabase auth |
| `/onboarding` | Redirects to login if not authed |

### Step 6.2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the page
4. Check for errors

**Common issues:**

| Error | Solution |
|-------|----------|
| "Invalid Supabase URL" | Check `NEXT_PUBLIC_SUPABASE_URL` is correct |
| CORS errors | API needs `CORS_ORIGIN` set to your dashboard URL |
| 500 errors | Check build logs, verify env vars |

### Step 6.3: Test Authentication Flow

1. Click "Sign In" or "Get Started"
2. You should be redirected to Supabase Auth
3. If you see Supabase's login UI, the integration is working

---

## Part 7: GitHub Actions Integration

### Step 7.1: Get Vercel Credentials for CI/CD

To enable automated deployments via GitHub Actions:

1. **Get Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click **"Create"**
   - Name: `pravado-github-actions`
   - Scope: Full Access
   - Click **"Create Token"**
   - **Copy and save this token** (you won't see it again)

2. **Get Organization ID:**
   - Go to https://vercel.com/account
   - Scroll to **"General"**
   - Find **"Your ID"** (starts with `team_` for teams or is your user ID)
   - Copy this value

3. **Get Project ID:**
   - Go to your Vercel project dashboard
   - Click **Settings** → **General**
   - Find **"Project ID"**
   - Copy this value

### Step 7.2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | The token from step 7.1 |
| `VERCEL_ORG_ID` | The organization ID |
| `VERCEL_PROJECT_ID` | The project ID |
| `NEXT_PUBLIC_SUPABASE_URL_STAGING` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` | Your Supabase anon key |
| `NEXT_PUBLIC_API_URL_STAGING` | Your staging API URL |
| `NEXT_PUBLIC_DASHBOARD_URL_STAGING` | Your Vercel deployment URL |

### Step 7.3: Test GitHub Actions Deployment

1. Make a small change to any file in `apps/dashboard/`
2. Commit and push to `main` branch
3. Go to GitHub → **Actions** tab
4. Watch the "Deploy Dashboard" workflow
5. Verify it deploys successfully

---

## Troubleshooting

### Build Fails: "Cannot find module @pravado/types"

**Cause:** Shared packages not built before dashboard.

**Fix:** Update build command to:
```
cd ../.. && pnpm install && pnpm --filter @pravado/types build && pnpm --filter @pravado/validators build && pnpm --filter @pravado/utils build && pnpm --filter @pravado/feature-flags build && pnpm --filter @pravado/dashboard build
```

### Build Fails: "pnpm: command not found"

**Cause:** Vercel not detecting pnpm.

**Fix:**
1. Ensure `pnpm-lock.yaml` exists in repo root
2. Or add build command: `corepack enable && pnpm install && ...`

### Runtime Error: "Invalid environment configuration"

**Cause:** Missing required environment variables.

**Fix:** Verify these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Login Redirects to Wrong URL

**Cause:** Supabase redirect URL not configured.

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to **Redirect URLs**:
   - `https://your-project.vercel.app/**`
   - `https://staging.pravado.com/**` (if using custom domain)

### API Calls Fail with CORS Error

**Cause:** API not allowing requests from dashboard domain.

**Fix:** Set `CORS_ORIGIN` on your API to include your Vercel URL:
```
CORS_ORIGIN=https://your-project.vercel.app
```

---

## Quick Reference Card

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| Root Directory | `apps/dashboard` |
| Framework | Next.js |
| Node Version | 20.x |
| Build Command | `cd ../.. && pnpm install && pnpm build` |

### Minimum Environment Variables

| Variable | Where to Get |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_API_URL` | Your API deployment URL |

### GitHub Secrets (for CI/CD)

| Secret | Where to Get |
|--------|--------------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account → General |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General |

---

## Next Steps

After deploying the dashboard:

1. **Deploy the API** - See [API Deployment Guide](API_STAGING_SETUP_S80.md)
2. **Run Golden Path** - See [Staging Golden Path Checklist](STAGING_GOLDEN_PATH_EXECUTION_S80.md)
3. **Apply Migrations** - See [RC1 Operations Guide](RC1_OPERATIONS_GUIDE.md)

---

## Related Documents

- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md)
- [API Staging Setup](API_STAGING_SETUP_S80.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [RC1 Operations Guide](RC1_OPERATIONS_GUIDE.md)
