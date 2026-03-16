# Sprint S-INT-09: Billing Activation + Beta Invite Flow

**Status:** COMPLETE
**Date:** 2026-03-10
**Phase:** 5 — Production Hardening

---

## Summary

Activated the existing Stripe billing system with plan-specific resource limits, and built a beta invite flow to gate access during launch. The planLimitsService enforces per-plan quotas on SAGE proposals, CiteMind scoring, content documents, seats, contacts, and competitors. The beta system provides a public request page, admin approval with invite code generation, and invite-gated signup.

---

## Part A — Billing Activation + Plan Limits

### planLimitsService

**File:** `apps/api/src/services/billing/planLimitsService.ts`

Defines resource limits for three pricing tiers:

| Resource | Starter ($99) | Pro ($299) | Growth ($799) |
|----------|--------------|-----------|---------------|
| Seats | 3 | 10 | 25 |
| Content docs/mo | 25 | 100 | 500 |
| SAGE proposals/mo | 50 | 200 | 1,000 |
| CiteMind scores/mo | 100 | 500 | 2,000 |
| LLM tokens/mo | 500K | 2M | 10M |
| Journalist contacts | 200 | 1,000 | 5,000 |
| Competitors | 5 | 20 | 50 |
| Advanced analytics | No | Yes | Yes |
| API integrations | No | Yes | Yes |
| Autopilot mode | No | No | Yes |

**Key exports:**
- `PLAN_LIMITS` — Static limits per plan slug
- `getPlanLimits(planSlug)` — Get limits for a plan (falls back to starter)
- `checkPlanLimit(supabase, orgId, resource)` — Non-throwing check
- `enforcePlanLimit(supabase, orgId, resource)` — Throws `PlanLimitExceededError`
- `enforceFeatureAccess(supabase, orgId, feature)` — Boolean feature check
- `PlanLimitExceededError` — Error class with resource, current, limit, planSlug

### Plan Limit Enforcement Wired

- **SAGE `/generate-proposals`** — `enforcePlanLimit(supabase, orgId, 'sageProposalsPerMonth')` before LLM call
- **CiteMind `/score/:contentItemId`** — `enforcePlanLimit(supabase, orgId, 'citemindScoresPerMonth')` before scoring

Both return `403 PLAN_LIMIT_EXCEEDED` with resource details when limit is hit.

### Existing Stripe Infrastructure (Verified)

The following already existed from S28-S34 and requires NO changes:
- `POST /billing/org/create-checkout` — Creates Stripe checkout session
- `POST /billing/stripe/webhook` — Handles Stripe webhook events
- `POST /billing/org/cancel` / `/resume` — Subscription lifecycle
- `GET /billing/org/summary` — Billing summary with plan details
- `GET /billing/org/overages` — Overage calculation
- Billing settings UI at `/app/billing/`
- `billingApi.ts` client library

---

## Part B — Beta Invite Flow

### Migration 86

**File:** `apps/api/supabase/migrations/86_beta_requests.sql`

```sql
beta_requests (
  id UUID PK,
  email TEXT NOT NULL,
  company_name TEXT,
  company_size TEXT,
  use_case TEXT,
  referral_source TEXT,
  status TEXT DEFAULT 'pending' CHECK (pending|approved|rejected|invited),
  invite_code TEXT UNIQUE,
  invited_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

No RLS — admin-only table accessed via service role key.

### Beta API Routes

**File:** `apps/api/src/routes/beta/index.ts`
**Prefix:** `/api/v1/beta`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/request` | Public | Submit beta access request |
| GET | `/requests` | Admin | List all beta requests (filterable by status) |
| POST | `/approve/:id` | Admin | Approve request + generate `PRAVADO-XXXXXXXX` invite code |
| POST | `/validate-invite` | Public | Validate an invite code for signup |
| POST | `/mark-used` | Public | Mark invite code as used after signup |

### Public Beta Request Page

**File:** `apps/dashboard/src/app/(marketing)/beta/page.tsx`

- Accessible at `/beta` (no auth required, marketing route group)
- Collects: email (required), company name, team size, use case, referral source
- DS v3.1 dark theme, purple gradient CTA
- Shows success state with confirmation message
- Handles duplicate requests gracefully

### Invite-Gated Signup

**Login page updated:** `apps/dashboard/src/app/login/page.tsx`

When `NEXT_PUBLIC_BETA_INVITE_REQUIRED=true`:
- Signup form shows an "Invite code" field
- Code is validated against `/api/beta/validate-invite` before `signUp()`
- On successful signup, `/api/beta/mark-used` marks the code as consumed
- "Don't have a code?" links to `/beta` request page
- Sign-in flow is unchanged (existing users not affected)

### Feature Flag

`BETA_INVITE_REQUIRED: true` added to `packages/feature-flags/src/flags.ts`

Client-side toggle via `NEXT_PUBLIC_BETA_INVITE_REQUIRED` env var.

### Dashboard Proxy Routes

- `apps/dashboard/src/app/api/beta/request/route.ts` — Public proxy to backend
- `apps/dashboard/src/app/api/beta/validate-invite/route.ts` — Public proxy
- `apps/dashboard/src/app/api/beta/mark-used/route.ts` — Public proxy

---

## Environment Variables

### New
- `NEXT_PUBLIC_BETA_INVITE_REQUIRED` — Set to `'true'` to enable invite gating on signup

### Existing (Verified)
- `STRIPE_SECRET_KEY` — Stripe API key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `STRIPE_PRICE_STARTER` — Stripe price ID for Starter plan
- `STRIPE_PRICE_GROWTH` — Stripe price ID for Growth plan
- `STRIPE_PRICE_ENTERPRISE` — Stripe price ID for Enterprise plan

---

## Exit Criteria Verification

| Criterion | Status |
|-----------|--------|
| planLimitsService defines 3 tiers with countable + boolean limits | PASS |
| enforcePlanLimit wired into SAGE generate-proposals | PASS |
| enforcePlanLimit wired into CiteMind score endpoint | PASS |
| Exceeding limit returns 403 PLAN_LIMIT_EXCEEDED | PASS |
| Existing Stripe checkout/webhook/portal flows verified present | PASS |
| Migration 86 creates beta_requests table | PASS |
| Public POST /beta/request stores request | PASS |
| Admin POST /beta/approve/:id generates PRAVADO-XXXXXXXX invite code | PASS |
| POST /beta/validate-invite validates code | PASS |
| Signup form shows invite code field when BETA_INVITE_REQUIRED=true | PASS |
| /beta public page collects waitlist requests | PASS |
| BETA_INVITE_REQUIRED flag added | PASS |
| Zero new TypeScript errors (11 pre-existing in PR/SEO files) | PASS |
| SPRINT_COMPLETE.md | PASS |

---

## Files Created

```
apps/api/src/services/billing/planLimitsService.ts
apps/api/src/routes/beta/index.ts
apps/api/supabase/migrations/86_beta_requests.sql
apps/dashboard/src/app/(marketing)/beta/page.tsx
apps/dashboard/src/app/api/beta/request/route.ts
apps/dashboard/src/app/api/beta/validate-invite/route.ts
apps/dashboard/src/app/api/beta/mark-used/route.ts
docs/sprints/S-INT-09/SPRINT_COMPLETE.md
```

## Files Modified

```
apps/api/src/server.ts                    — +betaRoutes import + registration at /api/v1/beta
apps/api/src/routes/sage/index.ts         — +enforcePlanLimit before generate-proposals
apps/api/src/routes/citeMind/index.ts     — +enforcePlanLimit before score endpoint
apps/dashboard/src/app/login/page.tsx     — +invite code field, validation, mark-used flow
packages/feature-flags/src/flags.ts       — +BETA_INVITE_REQUIRED flag
```
