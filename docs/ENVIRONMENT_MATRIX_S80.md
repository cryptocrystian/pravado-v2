# Pravado Environment Variable Matrix (S80)

This document provides a comprehensive matrix of all environment variables needed to deploy Pravado to staging and production environments.

---

## Quick Reference

| Environment | API Host | Dashboard Host |
|-------------|----------|----------------|
| Local Dev | `http://localhost:3001` | `http://localhost:3000` |
| Staging | `https://api-staging.pravado.com` | `https://staging.pravado.com` |
| Production | `https://api.pravado.com` | `https://app.pravado.com` |

---

## 1. API Environment Variables (@pravado/api)

### 1.1 Required Variables

| Variable | Description | Example (Staging) | Where to Set |
|----------|-------------|-------------------|--------------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` | GitHub Secrets, Render/Fly/Railway |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (SECRET) | `eyJ...` | GitHub Secrets, Render/Fly/Railway |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJ...` | GitHub Secrets, Render/Fly/Railway |

### 1.2 Server Configuration

| Variable | Description | Default | Staging Value | Where to Set |
|----------|-------------|---------|---------------|--------------|
| `NODE_ENV` | Environment mode | `development` | `production` | Platform env |
| `API_PORT` | Server port | `3001` | `3001` (or platform default) | Platform env |
| `API_HOST` | Server host | `localhost` | `0.0.0.0` | Platform env |
| `LOG_LEVEL` | Logging verbosity | `info` | `info` | Platform env |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | `https://staging.pravado.com` | Platform env |
| `COOKIE_SECRET` | Cookie encryption | `pravado-cookie-secret` | `<random-32-chars>` | Platform env (SECRET) |
| `DASHBOARD_URL` | Dashboard URL for emails | `http://localhost:3000` | `https://staging.pravado.com` | Platform env |

### 1.3 LLM Configuration

| Variable | Description | Default | Staging Value | Where to Set |
|----------|-------------|---------|---------------|--------------|
| `LLM_PROVIDER` | LLM provider | `stub` | `anthropic` or `openai` | Platform env |
| `LLM_OPENAI_API_KEY` | OpenAI API key | - | `sk-...` | Platform env (SECRET) |
| `LLM_OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` | `gpt-4o-mini` | Platform env |
| `LLM_ANTHROPIC_API_KEY` | Anthropic API key | - | `sk-ant-...` | Platform env (SECRET) |
| `LLM_ANTHROPIC_MODEL` | Anthropic model | `claude-3-5-sonnet-20241022` | `claude-3-5-sonnet-20241022` | Platform env |
| `LLM_TIMEOUT_MS` | LLM request timeout | `20000` | `20000` | Platform env |
| `LLM_MAX_TOKENS` | Max tokens per request | `2048` | `2048` | Platform env |

### 1.4 Optional Integrations

| Variable | Description | Default | Required For | Where to Set |
|----------|-------------|---------|--------------|--------------|
| `MAILGUN_API_KEY` | Mailgun API key | - | Email delivery | Platform env (SECRET) |
| `MAILGUN_DOMAIN` | Mailgun domain | - | Email delivery | Platform env |
| `MAILGUN_FROM_EMAIL` | From email address | - | Email delivery | Platform env |
| `STRIPE_SECRET_KEY` | Stripe secret key | - | Billing | Platform env (SECRET) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | - | Billing | Platform env (SECRET) |
| `STRIPE_PRICE_STARTER` | Stripe price ID | - | Billing | Platform env |
| `STRIPE_PRICE_GROWTH` | Stripe price ID | - | Billing | Platform env |
| `STRIPE_PRICE_ENTERPRISE` | Stripe price ID | - | Billing | Platform env |
| `BILLING_DEFAULT_PLAN_SLUG` | Default plan | `internal-dev` | Billing | Platform env |
| `BILLING_PORTAL_RETURN_URL` | Billing portal return URL | - | Billing | Platform env |
| `AUDIT_EXPORT_STORAGE_DIR` | Audit export path | `/tmp/audit_exports` | Audit exports | Platform env |
| `PLATFORM_FREEZE` | Read-only mode | `false` | Maintenance | Platform env |

### 1.5 Optional Database/Cache

| Variable | Description | Default | Where to Set |
|----------|-------------|---------|--------------|
| `DATABASE_URL` | Direct PostgreSQL URL | - | Platform env |
| `REDIS_URL` | Redis connection URL | - | Platform env |

---

## 2. Dashboard Environment Variables (@pravado/dashboard)

### 2.1 Required Variables

| Variable | Description | Example (Staging) | Where to Set |
|----------|-------------|-------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (public) | `https://xxxxx.supabase.co` | Vercel, GitHub Secrets |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | `eyJ...` | Vercel, GitHub Secrets |

### 2.2 API & URLs

| Variable | Description | Default | Staging Value | Where to Set |
|----------|-------------|---------|---------------|--------------|
| `NODE_ENV` | Environment mode | `development` | `production` | Vercel |
| `NEXT_PUBLIC_API_URL` | API server URL | `http://localhost:3001` | `https://api-staging.pravado.com` | Vercel |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard URL | `http://localhost:3000` | `https://staging.pravado.com` | Vercel |

### 2.3 Optional Features

| Variable | Description | Required For | Where to Set |
|----------|-------------|--------------|--------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Billing UI | Vercel |

---

## 3. GitHub Secrets Configuration

### 3.1 Repository Secrets

These secrets are used by GitHub Actions workflows:

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `VERCEL_TOKEN` | Dashboard deploy | Vercel API token |
| `VERCEL_ORG_ID` | Dashboard deploy | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Dashboard deploy | Vercel project ID |
| `SUPABASE_URL` | API tests, API deploy | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | API tests, API deploy | Supabase service key |
| `SUPABASE_ANON_KEY` | API tests, API deploy | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard build | Supabase URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard build | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Dashboard build | API URL |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard build | Dashboard URL |

### 3.2 Staging-Specific Secrets

| Secret Name | Description |
|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL_STAGING` | Staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` | Staging Supabase anon key |
| `NEXT_PUBLIC_API_URL_STAGING` | Staging API URL |
| `NEXT_PUBLIC_DASHBOARD_URL_STAGING` | Staging dashboard URL |

### 3.3 Environment Variables (vars)

These are non-secret variables in GitHub Actions:

| Variable Name | Description |
|---------------|-------------|
| `STAGING_API_URL` | Staging API URL for health checks |
| `PRODUCTION_API_URL` | Production API URL for health checks |
| `PRODUCTION_DASHBOARD_URL` | Production dashboard URL |

---

## 4. Vercel Configuration

### 4.1 Project Settings

| Setting | Value |
|---------|-------|
| Root Directory | `apps/dashboard` |
| Build Command | (auto-detected by Vercel) |
| Output Directory | `.next` |
| Install Command | `pnpm install` |
| Node.js Version | `20.x` |

### 4.2 Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

**All Environments (Production + Preview + Development):**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

**Preview Environment Only (Staging):**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-staging.pravado.com` |
| `NEXT_PUBLIC_DASHBOARD_URL` | Vercel preview URL or staging domain |

**Production Environment Only:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pravado.com` |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://app.pravado.com` |

---

## 5. Minimum Staging Configuration

### 5.1 For Dashboard on Vercel (Required)

```bash
# Vercel Project Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://api-staging.pravado.com
NEXT_PUBLIC_DASHBOARD_URL=https://staging.pravado.com
```

### 5.2 For API on Render/Fly/Railway (Required)

```bash
# Platform Environment Variables
NODE_ENV=production
API_HOST=0.0.0.0
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
CORS_ORIGIN=https://staging.pravado.com
COOKIE_SECRET=<generate-random-32-char-string>
DASHBOARD_URL=https://staging.pravado.com

# LLM (choose one)
LLM_PROVIDER=anthropic
LLM_ANTHROPIC_API_KEY=sk-ant-...

# or
LLM_PROVIDER=openai
LLM_OPENAI_API_KEY=sk-...
```

---

## 6. Variable Categories by Priority

### 6.1 Must Have (App Won't Start Without)

| Variable | App |
|----------|-----|
| `SUPABASE_URL` | API |
| `SUPABASE_SERVICE_ROLE_KEY` | API |
| `SUPABASE_ANON_KEY` | API |
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard |

### 6.2 Should Have (Core Features Need)

| Variable | Feature |
|----------|---------|
| `LLM_PROVIDER` + `LLM_*_API_KEY` | AI features |
| `CORS_ORIGIN` | Cross-origin API calls |
| `NEXT_PUBLIC_API_URL` | Dashboard-API communication |
| `COOKIE_SECRET` | Secure session handling |

### 6.3 Nice to Have (Optional Features)

| Variable | Feature |
|----------|---------|
| `MAILGUN_*` | Email delivery |
| `STRIPE_*` | Billing/payments |
| `PLATFORM_FREEZE` | Maintenance mode |

---

## 7. Security Notes

### 7.1 Never Expose

These variables must NEVER appear in client-side code or logs:

- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_OPENAI_API_KEY`
- `LLM_ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MAILGUN_API_KEY`
- `COOKIE_SECRET`

### 7.2 Safe for Client (NEXT_PUBLIC_*)

These are intentionally exposed to the browser:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 8. Obtaining Credentials

### 8.1 Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 8.2 Vercel

1. Go to https://vercel.com/account/tokens
2. Create a new token → `VERCEL_TOKEN`
3. Go to https://vercel.com/account → General → Your ID → `VERCEL_ORG_ID`
4. Go to Project Settings → General → Project ID → `VERCEL_PROJECT_ID`

### 8.3 Anthropic (LLM)

1. Go to https://console.anthropic.com/settings/keys
2. Create new API key → `LLM_ANTHROPIC_API_KEY`

### 8.4 OpenAI (LLM)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key → `LLM_OPENAI_API_KEY`

---

## Related Documents

- [Vercel Staging Setup Guide](VERCEL_STAGING_SETUP_S80.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [RC1 Operations Guide](RC1_OPERATIONS_GUIDE.md)
- [Staging Validation Run](STAGING_VALIDATION_RUN_S78.md)
