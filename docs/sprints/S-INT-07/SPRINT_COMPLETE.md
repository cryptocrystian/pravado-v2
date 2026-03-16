# Sprint S-INT-07: Onboarding Rebuild (Activation-Critical)

**Status:** COMPLETE
**Date:** 2026-03-10
**Phase:** 4 — User Activation

---

## Summary

Rebuilt the onboarding flow so new users reach their first real EVI score and first real SAGE proposals within 10 minutes. The old onboarding created a mock competitive snapshot and mock plan — this new flow seeds real data into every pillar and triggers the real SAGE pipeline.

**7-step activation wizard:**
1. **Brand Setup** — Company name, domain, industry, company_size → creates/updates org
2. **Connect GSC** — Google Search Console OAuth (optional, skip allowed)
3. **Add Competitors** — 1–5 competitor domains → `org_competitors` table
4. **Add Journalists** — Name, email, publication, beat → `journalists` table
5. **Add Content** — Paste URLs → `content_items` table
6. **SAGE Activation** — Progress screen polling EVI + SAGE signal scan
7. **First Proposals** — Show real SAGE proposals → enter dashboard

---

## Database

### Migration: `apps/api/supabase/migrations/85_onboarding_activation.sql`
- `org_competitors` table (id, org_id, domain, name, added_at) with RLS
- UNIQUE(org_id, domain) — prevents duplicate competitors
- ALTER TABLE orgs adding: domain, industry, company_size, completed_onboarding_at, onboarding_step, onboarding_skips, metadata

---

## Backend Routes (`/api/v1/onboarding/`)

### `apps/api/src/routes/onboarding/index.ts`
- `POST /brand` — Create or update org with brand profile (step 1)
  - Creates org + membership for new users
  - Updates existing org for returning users
- `GET /status` — Onboarding progress with entity counts
  - Returns: has_org, onboarding_step, completed, counts (competitors, journalists, content)
- `POST /step` — Update current step (with skip tracking)
- `POST /competitors` — Upsert competitor list (conflict on org_id+domain)
- `GET /competitors` — Get saved competitors
- `DELETE /competitors/:id` — Remove a competitor
- `POST /journalists` — Save journalists with auto media outlet creation
- `POST /content` — Save content URLs as content_items
- `POST /complete` — Mark onboarding complete + trigger EVI + SAGE
- `POST /activate` — Trigger SAGE activation (EVI snapshot + signal scan)

---

## Middleware

### `apps/dashboard/src/middleware.ts`
- Added onboarding redirect logic for `/app` paths
- Checks `org_members.orgs.completed_onboarding_at` via Supabase join
- If no org or incomplete onboarding → redirects to `/onboarding/ai-intro`
- Updated matcher to include `/onboarding/:path*`

---

## Dashboard Proxy Routes

Created 8 proxy route files:
- `/api/onboarding/brand` → POST
- `/api/onboarding/status` → GET
- `/api/onboarding/step` → POST
- `/api/onboarding/competitors` → GET/POST
- `/api/onboarding/journalists` → POST
- `/api/onboarding/content` → POST
- `/api/onboarding/complete` → POST
- `/api/onboarding/activate` → POST

---

## Onboarding Page

### `apps/dashboard/src/app/onboarding/ai-intro/page.tsx`
Complete rewrite (v3) with:
- **Progress persistence** — Fetches `/api/onboarding/status` on mount, resumes at saved step
- **Step tracking** — Every step advances `onboarding_step` via POST `/step`
- **Skip tracking** — Skippable steps (GSC, competitors, journalists, content) record skips in `onboarding_skips` JSONB
- **Real data seeding** — Every step saves real data to production tables
- **SAGE activation** — Step 6 triggers `enqueueEVIRecalculate` + `enqueueSageSignalScan`
- **EVI polling** — Polls `/api/evi/current` every 2s for up to 24s
- **Proposal display** — Fetches real SAGE proposals from `/api/command-center/action-stream`
- **DS v3.1 compliant** — All styling uses brand tokens, no phantom hex values

---

## Feature Flags

### `packages/feature-flags/src/flags.ts`
- `ENABLE_ONBOARDING_V3: true` — S-INT-07

---

## Exit Criteria Verification

| Criterion | Status |
|-----------|--------|
| Fresh org completes all 7 steps | ✅ Sequential wizard with progress persistence |
| Each step saves real data to production tables | ✅ brand→orgs, competitors→org_competitors, journalists→journalists, content→content_items |
| GSC connect works (reuses S-INT-06 OAuth) | ✅ Links to /api/integrations/gsc/auth-url |
| SAGE activation triggers EVI + signal scan | ✅ enqueueEVIRecalculate + enqueueSageSignalScan |
| First real EVI score displayed | ✅ Polls /api/evi/current, shows baseline score |
| First real SAGE proposals displayed | ✅ Fetches /api/command-center/action-stream |
| Progress persists on page refresh | ✅ GET /status resumes at saved step |
| Skip tracking works | ✅ onboarding_skips JSONB records skipped steps |
| Middleware redirects incomplete onboarding | ✅ Checks completed_onboarding_at via org_members join |
| Zero TypeScript errors (S-INT-07 code) | ✅ API clean, dashboard clean (pre-existing errors in other files) |
| SPRINT_COMPLETE.md | ✅ This document |

---

## Files Created

```
apps/api/supabase/migrations/85_onboarding_activation.sql
apps/api/src/routes/onboarding/index.ts
apps/dashboard/src/app/api/onboarding/brand/route.ts
apps/dashboard/src/app/api/onboarding/status/route.ts
apps/dashboard/src/app/api/onboarding/step/route.ts
apps/dashboard/src/app/api/onboarding/competitors/route.ts
apps/dashboard/src/app/api/onboarding/journalists/route.ts
apps/dashboard/src/app/api/onboarding/content/route.ts
apps/dashboard/src/app/api/onboarding/complete/route.ts
apps/dashboard/src/app/api/onboarding/activate/route.ts
docs/sprints/S-INT-07/SPRINT_COMPLETE.md
```

## Files Modified

```
apps/api/src/server.ts                               — +1 route registration (onboarding)
apps/dashboard/src/middleware.ts                      — +onboarding redirect logic, updated matcher
apps/dashboard/src/app/onboarding/ai-intro/page.tsx   — Complete rewrite (v3 activation flow)
packages/feature-flags/src/flags.ts                   — +1 flag (ENABLE_ONBOARDING_V3)
```

---

## Activation Pipeline

```
Step 1 (Brand)   → org created with domain, industry, company_size
Step 2 (GSC)     → Optional: GSC OAuth → seo_keywords + seo_keyword_metrics
Step 3 (Comps)   → org_competitors seeded
Step 4 (Journos) → journalists + media_outlets seeded
Step 5 (Content) → content_items seeded
Step 6 (SAGE)    → enqueueEVIRecalculate(orgId) → EVI snapshot
                 → enqueueSageSignalScan(orgId) → signals → proposals
Step 7 (Enter)   → User sees real EVI score + real SAGE proposals
                 → completed_onboarding_at = now()
                 → Middleware allows /app access
```
