# Pravado Platform Deployment Guide

This guide covers deploying the Pravado Platform (API + Dashboard) to development and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Structure](#repository-structure)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [First-Time Bring-Up](#first-time-bring-up)
6. [Health Checks & Monitoring](#health-checks--monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >=18.x | LTS recommended |
| pnpm | >=8.x | Package manager |
| Git | Latest | Version control |

### External Services

| Service | Purpose | Required |
|---------|---------|----------|
| **Supabase** | Database & Auth | Yes |
| **OpenAI** or **Anthropic** | LLM Provider | Yes (for AI features) |
| **Mailgun** | Email delivery | No (console fallback) |
| **Stripe** | Billing/Payments | No (disabled by default) |

### Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Note your project credentials:
   - Project URL (`SUPABASE_URL`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) - **Keep secret!**
   - Anon/Public Key (`SUPABASE_ANON_KEY`)

### LLM Provider Setup

Choose one:

**OpenAI:**
- Get API key from https://platform.openai.com
- Set `LLM_PROVIDER=openai`
- Set `LLM_OPENAI_API_KEY=sk-...`

**Anthropic:**
- Get API key from https://console.anthropic.com
- Set `LLM_PROVIDER=anthropic`
- Set `LLM_ANTHROPIC_API_KEY=sk-ant-...`

**Stub Mode (Testing):**
- Set `LLM_PROVIDER=stub` (default)
- No API key required
- LLM calls return placeholder responses

---

## Repository Structure

```
pravado-v2/
├── apps/
│   ├── api/          # @pravado/api - Fastify backend
│   ├── dashboard/    # @pravado/dashboard - Next.js frontend
│   └── mobile/       # @pravado/mobile - React Native (optional)
├── packages/
│   ├── types/        # @pravado/types - Shared TypeScript types
│   ├── validators/   # @pravado/validators - Zod schemas
│   ├── utils/        # @pravado/utils - Shared utilities
│   └── feature-flags/# @pravado/feature-flags - Feature toggles
├── docs/             # Documentation
├── .env.example      # Environment template
└── pnpm-workspace.yaml
```

---

## Local Development

### 1. Clone and Install

```bash
git clone <repo-url> pravado-v2
cd pravado-v2
pnpm install
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Minimum required variables:**

```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Dashboard Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# LLM (optional, defaults to stub)
LLM_PROVIDER=openai
LLM_OPENAI_API_KEY=sk-your-key
```

### 3. Apply Database Migrations

Migrations are in `apps/api/supabase/migrations/`.

**Option A: Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

**Option B: Direct SQL**

Apply migrations 00-76 in order via the Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/_/sql
2. Paste and run each migration file in order

### 4. Build Packages

```bash
# Build shared packages first
pnpm --filter @pravado/types build
pnpm --filter @pravado/validators build
pnpm --filter @pravado/utils build
pnpm --filter @pravado/feature-flags build
```

### 5. Start Development Servers

**Terminal 1 - API:**
```bash
pnpm --filter @pravado/api dev
# Runs on http://localhost:3001
```

**Terminal 2 - Dashboard:**
```bash
pnpm --filter @pravado/dashboard dev
# Runs on http://localhost:3000
```

### 6. Verify Health

```bash
# API health check
curl http://localhost:3001/health/live
# {"alive":true,"timestamp":"..."}

curl http://localhost:3001/health/ready
# {"ready":true,"version":"...","timestamp":"..."}

curl http://localhost:3001/health/info
# {"app":{"name":"Pravado API",...},"environment":{...},"features":{...}}
```

---

## Production Deployment

### API Deployment

The API is a Node.js Fastify application that can be deployed to:
- **Recommended:** Railway, Render, Fly.io, DigitalOcean App Platform
- **Alternative:** AWS ECS, Google Cloud Run, Kubernetes

**Build Command:**
```bash
pnpm --filter @pravado/api build
```

**Start Command:**
```bash
pnpm --filter @pravado/api start
# Or directly: node apps/api/dist/index.js
```

**Environment Variables (Production):**

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | Set to `production` |
| `API_PORT` | No | Default: 3001 |
| `API_HOST` | No | Set to `0.0.0.0` for containers |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (secret!) |
| `SUPABASE_ANON_KEY` | Yes | Anon key |
| `CORS_ORIGIN` | Yes | Dashboard URL |
| `COOKIE_SECRET` | Yes | Random secret (32+ chars) |
| `LLM_PROVIDER` | No | `openai` or `anthropic` |
| `LLM_OPENAI_API_KEY` | Cond. | If using OpenAI |
| `LLM_ANTHROPIC_API_KEY` | Cond. | If using Anthropic |
| `LOG_LEVEL` | No | `info` recommended |

**Health Check Configuration:**

Configure your load balancer/orchestrator with:
- **Liveness:** `GET /health/live` (should return 200)
- **Readiness:** `GET /health/ready` (should return 200)

### Dashboard Deployment

The dashboard is a Next.js application. Deploy to:
- **Recommended:** Vercel (native Next.js support)
- **Alternative:** Netlify, Cloudflare Pages, Docker

**Build Command:**
```bash
pnpm --filter @pravado/dashboard build
```

**Start Command (if self-hosting):**
```bash
pnpm --filter @pravado/dashboard start
```

**Environment Variables:**

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | Set to `production` |
| `NEXT_PUBLIC_API_URL` | Yes | API URL (e.g., https://api.pravado.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_DASHBOARD_URL` | Yes | Dashboard URL for invite links |

**Vercel Deployment:**

1. Import the repository in Vercel
2. Set root directory to `apps/dashboard`
3. Set build command: `cd ../.. && pnpm install && pnpm --filter @pravado/dashboard build`
4. Add environment variables in Vercel dashboard

---

## First-Time Bring-Up

After deploying both API and Dashboard:

### 1. Verify Health Endpoints

```bash
# Replace with your API URL
curl https://api.your-domain.com/health/live
curl https://api.your-domain.com/health/ready
curl https://api.your-domain.com/health/info
```

### 2. Create First Organization

Using the Supabase SQL Editor or your preferred SQL client:

```sql
-- Create first organization
INSERT INTO orgs (id, name, slug, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Acme Corp',
  'acme-corp',
  now(),
  now()
);
```

### 3. Create First User

1. Visit the dashboard login page
2. Sign up with email
3. Verify email via Supabase Auth
4. Associate user with organization via SQL:

```sql
-- Get IDs first
SELECT id FROM orgs WHERE slug = 'acme-corp';
SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Link user to org
INSERT INTO user_orgs (user_id, org_id, role, created_at)
VALUES ('user-uuid', 'org-uuid', 'owner', now());
```

### 4. Verify Dashboard Access

Visit key dashboards:
- `/app` - Main dashboard
- `/app/playbooks` - AI Playbooks
- `/app/content` - Content Intelligence
- `/app/pr` - PR & Media Intelligence

### 5. Test LLM Integration

If LLM is configured:
1. Create a new playbook
2. Run a step that uses AI
3. Verify generation works

---

## Health Checks & Monitoring

### Available Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health/live` | Liveness probe | `{"alive":true}` |
| `GET /health/ready` | Readiness probe | `{"ready":true,"version":"..."}` |
| `GET /health/info` | App info | Environment, features, version |
| `GET /` | Root | App name, version, status |

### Recommended Monitoring

1. **Uptime Monitoring:** Ping `/health/live` every 30s
2. **Performance:** Track response times on `/health/ready`
3. **Logging:** JSON logs to stdout, aggregate with your log platform
4. **Errors:** Monitor 5xx responses, track error rates

### Log Format

All logs are JSON-structured:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "context": "api:server",
  "message": "Request completed",
  "method": "GET",
  "url": "/health/ready",
  "statusCode": 200,
  "requestId": "abc123"
}
```

---

## Troubleshooting

### Common Issues

**"Invalid environment configuration"**
- Check all required env vars are set
- Verify URLs are valid (include https://)
- Check service role key is correct

**Database connection errors**
- Verify `SUPABASE_URL` is correct
- Check service role key has correct permissions
- Ensure migrations are applied

**LLM calls failing**
- Verify API key is valid
- Check LLM_PROVIDER matches your key type
- Review rate limits on your LLM provider

**CORS errors**
- Set `CORS_ORIGIN` to your dashboard URL
- Include protocol (https://)
- Restart API after changes

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
```

### Getting Help

1. Check `/health/info` for current configuration
2. Review logs for error details
3. Verify migrations are applied
4. Test with `LLM_PROVIDER=stub` to isolate LLM issues

---

## Security Checklist

Before going to production:

- [ ] Change `COOKIE_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all URLs
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Configure rate limiting at the load balancer
- [ ] Set appropriate CORS origins
- [ ] Review feature flags for production settings
