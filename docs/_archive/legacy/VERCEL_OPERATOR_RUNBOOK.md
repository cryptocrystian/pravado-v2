# Vercel Dashboard Deployment Runbook

**Version:** 1.0.0-rc1 | **Updated:** S81

Quick-reference operator guide for deploying Pravado Dashboard to Vercel.

---

## Prerequisites Checklist

- [ ] Vercel account with access to organization
- [ ] GitHub repo access
- [ ] Supabase project URL and anon key
- [ ] API deployed and accessible (get URL from Render)

---

## Required Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Project Settings > API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API | Yes |
| `NEXT_PUBLIC_API_URL` | Your Render API URL (e.g., `https://pravado-api.onrender.com`) | Yes |

---

## Deployment Steps

### Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New... > Project**
3. Select **Import Git Repository**
4. Choose `pravado-v2` repository
5. Click **Import**

### Step 2: Configure Project

In the configuration screen:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `apps/dashboard` |
| **Build Command** | `pnpm build` (default) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `pnpm install` (default) |
| **Node.js Version** | 20.x |

### Step 3: Add Environment Variables

1. Expand **Environment Variables** section
2. Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...your-anon-key
NEXT_PUBLIC_API_URL = https://pravado-api-staging.onrender.com
```

3. Select environments: **Production**, **Preview**, **Development**

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build (~2-3 minutes)
3. Once complete, click **Visit** to open your site

---

## Verification

### Manual Checks

| Check | URL | Expected |
|-------|-----|----------|
| Landing page | `/` | Page loads without errors |
| Login page | `/login` | Auth UI renders |
| App redirect | `/app` | Redirects to login if not authenticated |

### Browser DevTools Checks

1. Open DevTools (F12)
2. Go to **Console** tab
3. Verify no red errors
4. Go to **Network** tab
5. Check API requests go to correct URL

### API Integration Check

1. Log in to the app
2. Navigate to any data page (e.g., `/app/playbooks`)
3. Verify data loads without errors
4. Check Network tab shows successful API responses

---

## Troubleshooting

### Build Fails

| Error | Solution |
|-------|----------|
| `pnpm: command not found` | Ensure Node.js 20.x is selected |
| `Cannot find package` | Root directory must be `apps/dashboard` |
| `TypeScript errors` | Check workspace packages are configured in `transpilePackages` |
| `ESLint errors` | Build should continue (lint is disabled during build) |

### Runtime Errors

| Error | Solution |
|-------|----------|
| Blank page | Check browser console for errors |
| "Failed to fetch" | Verify `NEXT_PUBLIC_API_URL` is correct |
| CORS errors | API needs to allow dashboard domain |
| Auth issues | Verify Supabase URL and anon key |

### Environment Variable Issues

| Symptom | Check |
|---------|-------|
| API calls fail | Verify `NEXT_PUBLIC_API_URL` includes protocol (`https://`) |
| Auth doesn't work | Verify `NEXT_PUBLIC_SUPABASE_URL` is correct |
| Variables undefined | Ensure variable names start with `NEXT_PUBLIC_` |

---

## Post-Deployment Configuration

### Configure Custom Domain (Optional)

1. Go to project **Settings > Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. SSL is automatic

### Enable Analytics (Optional)

1. Go to project **Settings > Analytics**
2. Enable Web Analytics
3. No code changes needed

### Set Up Preview Deployments

1. Each PR gets automatic preview URL
2. Preview URLs use same environment variables
3. Consider using different Supabase project for previews

---

## Rollback

To rollback to a previous deployment:

1. Go to Vercel Dashboard > Your Project
2. Click **Deployments** tab
3. Find the previous working deployment
4. Click **...** menu > **Promote to Production**

---

## GitHub Actions Integration

To enable automatic deployments via GitHub Actions:

### Required Secrets

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Dashboard > Settings > General |
| `VERCEL_PROJECT_ID` | Project Settings > General > Project ID |

### Workflow Trigger

Deployments trigger automatically on:
- Push to `main` branch
- Pull request updates (preview deployment)

---

## Related

- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md)
- [Vercel Staging Setup](VERCEL_STAGING_SETUP_S80.md)
- [Staging Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md)
