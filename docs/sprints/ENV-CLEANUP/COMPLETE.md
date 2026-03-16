# ENV-CLEANUP Sprint — Complete

**Date:** 2026-03-11
**Scope:** Environment configuration cleanup — no new features, no new files beyond env updates.

---

## Changes Made

### 1. apps/api/.env
- **Fixed OPENAI_API_KEY**: Replaced incorrect `sk-ant-` Anthropic key with correct `sk-proj-` OpenAI key
- **Set PERPLEXITY_API_KEY**: Was blank, now set to production key (`pplx-...`)
- **Added GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET**: Google OAuth credentials for GSC integration
- **Added SENDGRID_API_KEY**: Email delivery for pitch sends and beta invites
- **Uncommented STRIPE_PUBLISHABLE_KEY**: Was commented out, now active
- **Added RENDER_EXTERNAL_URL / RENDER_API_KEY**: Needed by bootstrapStripeBilling.ts for webhook registration
- **Added HUNTER_API_KEY**: Backup enrichment source (fallback for PDL)
- **Fixed duplicate SENTRY_DSN**: Removed blank entry at line 47, kept real DSN at line 70
- **STRIPE_WEBHOOK_SECRET**: Left as placeholder comment (manual action required)

### 2. apps/dashboard/.env.local
- **NEXT_PUBLIC_MSW_ENABLED=false**: Disabled MSW mock interception (all data is real now)
- **Added NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST**: Product analytics
- **Added NEXT_PUBLIC_SENTRY_DSN**: Error monitoring (client-side)
- **Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Stripe checkout UI
- **Added NEXT_PUBLIC_APP_URL**: App base URL for OAuth callbacks
- **Added NEXT_PUBLIC_GOOGLE_CLIENT_ID**: Google OAuth initiation in frontend
- **Added NEXT_PUBLIC_BETA_INVITE_REQUIRED=true**: Beta invite gating

### 3. Root .env.local
- **Reformatted**: Converted malformed markdown bullet points to valid KEY=VALUE syntax
- **Added header comment**: `# ROOT ENV — Reference only. Apps read from apps/api/.env and apps/dashboard/.env.local`
- **Preserved all keys and values**: No data lost, only formatting fixed

### 4. apps/api/src/scripts/bootstrapStripeBilling.ts
- **Updated pricing**: Starter $99/mo, Pro $299/mo, Growth $799/mo (was $10/$50/$500)
- **Aligned plan slugs**: starter/pro/growth (was starter/growth/enterprise)
- **Updated feature lists**: Match production roadmap limits per tier
- **Improved output**: Clear `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_GROWTH` output

### 5. apps/api/src/services/billing/planLimitsService.ts
- **Updated Starter limits**: 1 seat, 150 proposals/mo (~5/day), 50 CiteMind/mo, 500K tokens
- **Updated Pro limits**: 3 seats, 1500 proposals/mo (~50/day), 500 CiteMind/mo, 5M tokens
- **Updated Growth limits**: 10 seats, unlimited proposals, unlimited CiteMind, 20M tokens, AUTOMATE
- **Slugs already matched**: starter/pro/growth (no slug change needed here)

### 6. apps/api/src/services/journalists/hunterEnrichmentService.ts
- **Primary provider: People Data Labs (PDL)**: POST to `https://api.peopledatalabs.com/v5/person/enrich` with `X-Api-Key` header
- **Fallback provider: Hunter.io**: If PDL returns no result AND `HUNTER_API_KEY` is set, falls back to Hunter
- **No function signature changes**: `enrichJournalist()`, `enrichBatch()`, `searchPublication()` unchanged
- **PDL response mapping**: `work_email` → email, `likelihood * 10` → email_confidence, `job_title` → position

---

## Remaining Manual Action

**STRIPE_WEBHOOK_SECRET** must be obtained from the Stripe Dashboard:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create or find the endpoint for `https://pravado-api.onrender.com/api/v1/billing/stripe/webhook`
3. Copy the signing secret (`whsec_...`)
4. Add to `apps/api/.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
