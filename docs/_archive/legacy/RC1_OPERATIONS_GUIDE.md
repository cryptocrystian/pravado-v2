# Pravado RC1 Operations Guide

This guide covers operational procedures for running Pravado v1.0.0-rc1 in staging and production environments.

---

## Table of Contents

1. [Platform Freeze Mode](#platform-freeze-mode)
2. [Running Migrations](#running-migrations)
3. [CI/CD Pipeline Deployment](#cicd-pipeline-deployment)
4. [Rollback Procedure](#rollback-procedure)
5. [SeedDemoOrg Usage](#seeddemoorg-usage)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Platform Freeze Mode

The Platform Freeze mechanism allows Pravado to run in read-only mode, blocking all write operations to core intelligence domains while keeping read operations and health checks functional.

### Enabling Platform Freeze

```bash
# Set environment variable
PLATFORM_FREEZE=true

# Or in .env file
echo "PLATFORM_FREEZE=true" >> .env

# Restart the API
pnpm --filter @pravado/api start
```

### Disabling Platform Freeze

```bash
# Remove or set to false
PLATFORM_FREEZE=false

# Or unset
unset PLATFORM_FREEZE

# Restart the API
pnpm --filter @pravado/api start
```

### Verifying Freeze Status

```bash
# Check via health endpoint
curl http://localhost:3001/health/info | jq '.environment'

# Expected output when frozen:
# {
#   "nodeEnv": "production",
#   "platformFreeze": true,
#   ...
# }
```

### Freeze Behavior

| Operation | Frozen Routes | Result |
|-----------|---------------|--------|
| GET / HEAD | All | Normal 200 response |
| POST / PUT / PATCH / DELETE | Core domains (S38-S76) | 503 + PLATFORM_FROZEN error |
| Any | /health/* | Always works |
| Any | /api/v1/auth/* | Always works |
| Any | /api/v1/logs/* | Always works |

### When to Use Freeze Mode

- **Staging validation**: Enable during UAT to prevent test data corruption
- **Production maintenance**: Enable during database migrations
- **Incident response**: Enable to prevent further data changes during investigation
- **Read-only replicas**: Enable for read-only API instances

---

## Running Migrations

### Pre-Migration Checklist

- [ ] Backup database (Supabase dashboard or pg_dump)
- [ ] Enable platform freeze mode
- [ ] Notify team of maintenance window
- [ ] Verify migration files are in order (00-76)

### Applying Migrations

#### Option 1: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Verify migrations
supabase db status
```

#### Option 2: SQL Editor

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Paste migration content
4. Execute in order (00, 01, 02, ...)
5. Verify each migration completes

#### Option 3: Direct psql

```bash
# Connect to database
psql "postgresql://postgres:password@db.project.supabase.co:5432/postgres"

# Apply migration
\i apps/api/supabase/migrations/XX_migration_name.sql

# Verify
\dt  # List tables
```

### Post-Migration Verification

```bash
# Check migration count
SELECT COUNT(*) FROM supabase_migrations;
# Expected: 77

# Verify latest migration
SELECT * FROM supabase_migrations ORDER BY version DESC LIMIT 5;

# Test API health
curl http://localhost:3001/health/ready
```

---

## CI/CD Pipeline Deployment

### Pipeline Overview

```
Push to main → Validate → Test → Build → Deploy Staging → Deploy Production
```

### GitHub Actions Workflows

#### API Deployment

**File:** `.github/workflows/deploy-api.yml`

**Triggers:**
- Push to `main` (auto-deploy to staging)
- Manual dispatch (select staging or production)

**Manual Production Deployment:**

1. Go to GitHub → Actions → "Deploy API"
2. Click "Run workflow"
3. Select branch: `main`
4. Select environment: `production`
5. Click "Run workflow"

#### Dashboard Deployment

**File:** `.github/workflows/deploy-dashboard.yml`

**Triggers:**
- Push to `main` (auto-deploy preview)
- Manual dispatch (select staging or production)

**Manual Production Deployment:**

1. Go to GitHub → Actions → "Deploy Dashboard"
2. Click "Run workflow"
3. Select branch: `main`
4. Select environment: `production`
5. Click "Run workflow"

### Required Secrets

Configure these in GitHub → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_ANON_KEY` | Anon/public key |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `NEXT_PUBLIC_*` | Dashboard env vars |

### Deployment Verification

After deployment, verify:

```bash
# API health
curl https://api.your-domain.com/health/ready

# Dashboard access
open https://your-domain.com

# Run smoke tests
# - Login flow
# - Dashboard navigation
# - API connectivity
```

---

## Rollback Procedure

### API Rollback

#### Option 1: Redeploy Previous Version

```bash
# Find previous good commit
git log --oneline -10

# Checkout and push
git checkout <good-commit>
git push origin main --force
# (or create hotfix branch)
```

#### Option 2: Platform Rollback (Render/Fly/Railway)

1. Go to platform dashboard
2. Navigate to Deployments
3. Click "Rollback" on previous successful deploy
4. Verify health endpoints

### Dashboard Rollback

#### Vercel Rollback

1. Go to Vercel Dashboard
2. Select project
3. Navigate to Deployments
4. Click "..." on previous deployment
5. Select "Promote to Production"

### Database Rollback

**WARNING: Database rollbacks are destructive. Always backup first.**

```bash
# Restore from backup
# (Use Supabase dashboard or pg_restore)

# Or manually revert migration
psql "..." -c "DROP TABLE new_table_from_migration;"
```

---

## SeedDemoOrg Usage

The SeedDemoOrg script creates a complete demo organization with sample data across all domains.

### Running the Seed Script

```bash
# Ensure environment is configured
source .env

# Run seed script
pnpm --filter @pravado/api seed:demo
```

### Expected Output

```
═══════════════════════════════════════════════════════════
  PRAVADO DEMO ORGANIZATION SEED SCRIPT (S77)
═══════════════════════════════════════════════════════════

🏢 Seeding organization...
   ✓ Created org: abc-123...
👥 Seeding users...
   ✓ Created user: demo-exec@demo.local
   ✓ Created user: demo-analyst@demo.local
📰 Seeding PR & Media data...
   ✓ Created 3 media sources
   ✓ Created 3 earned mentions
   ✓ Created 2 press releases
...
```

### Demo Credentials

| User | Email | Role |
|------|-------|------|
| Executive | demo-exec@demo.local | Owner |
| Analyst | demo-analyst@demo.local | Member |

### Re-Running Seed

The seed script is idempotent:
- Existing org is reused
- Existing users are linked
- New data is appended

To start fresh:
1. Delete demo org from database
2. Run seed script again

```sql
-- Delete demo org (cascades to related data)
DELETE FROM orgs WHERE slug = 'demo-org';
```

---

## Monitoring & Health Checks

### Health Endpoints

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `/health/live` | Liveness probe | `{"alive":true}` |
| `/health/ready` | Readiness probe | `{"ready":true,"version":"1.0.0-rc1"}` |
| `/health/info` | App info | Full config (safe fields) |

### Recommended Monitoring

1. **Uptime Monitoring**
   - Ping `/health/live` every 30s
   - Alert if 3 consecutive failures

2. **Readiness Monitoring**
   - Check `/health/ready` every 60s
   - Alert if returns not-ready

3. **Error Rate Monitoring**
   - Track 5xx responses
   - Alert if > 1% error rate

4. **Client Error Logs**
   - Check `/api/v1/logs/client/health`
   - Review buffer periodically

### Log Analysis

```bash
# Tail API logs
docker logs -f pravado-api

# Filter for errors
docker logs pravado-api 2>&1 | grep -i error

# Check client errors
curl http://localhost:3001/api/v1/logs/client/health
```

---

## Troubleshooting

### Common Issues

#### API Won't Start

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify database connection
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"

# Check for port conflicts
lsof -i :3001
```

#### Dashboard 500 Errors

```bash
# Check API connectivity
curl $NEXT_PUBLIC_API_URL/health/ready

# Verify environment variables
grep NEXT_PUBLIC .env

# Clear Next.js cache
rm -rf apps/dashboard/.next
pnpm --filter @pravado/dashboard build
```

#### Database Connection Issues

```bash
# Test direct connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check Supabase status
open https://supabase.com/dashboard/project/your-project

# Verify RLS policies
# (Check Supabase dashboard → Auth → Policies)
```

#### Platform Freeze Not Working

```bash
# Verify environment variable
echo $PLATFORM_FREEZE

# Check /health/info
curl http://localhost:3001/health/info | jq '.environment.platformFreeze'

# Restart API
pnpm --filter @pravado/api start
```

### Emergency Contacts

- **On-Call**: [Your team contact]
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support

---

## Related Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Release Notes RC1](RELEASE_NOTES_RC1.md)
- [Release Tagging Guide](RELEASE_TAGGING_GUIDE.md)
- [Platform Freeze Snapshot](PLATFORM_FREEZE_SNAPSHOT_S78.md)
