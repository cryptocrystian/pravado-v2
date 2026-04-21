# SESSION PRIMER — Pravado v2
> Single source of truth for cross-session continuity.
> Last Updated: 2026-04-21 — Marketing Site + Silo Tax Audit Sprint

---

## CURRENT STATE: MARKETING SITE + ACQUISITION FUNNEL LIVE

Both `pravado.io` (marketing) and `app.pravado.io` (dashboard) are live and
separated. The Silo Tax Audit acquisition funnel is functional end-to-end with
real Claude Haiku analysis, Supabase persistence, and Resend email delivery.

---

## INFRASTRUCTURE — CONFIRMED WORKING

| Service | URL | Status |
|---------|-----|--------|
| Marketing site | https://pravado.io | ✅ Live |
| Dashboard | https://app.pravado.io | ✅ Live |
| API | https://pravado-api.onrender.com | ✅ Live |
| Supabase | kroexsdyyqmlxfpbwajv | ✅ Live |
| Email | Resend / hello@pravado.io | ✅ Live |

**Render:** Pro plan, pipeline minutes are metered ($5/1K) not hard-capped.
**Vercel:** Both pravado.io and app.pravado.io pointed to pravado-dashboard project.
**DNS:** Namecheap (NOT Cloudflare) — A record @ → 216.150.1.1, CNAME www → Vercel.
**Email DNS:** Resend DKIM/SPF/MX verified on pravado.io at Namecheap.

---

## WHAT WAS BUILT THIS SESSION

### 1. Marketing Site — 5 pages live at pravado.io
- `/` — Homepage: hero, persona pain cards, EVI section, layered architecture
  diagram, How It Works, pricing preview
- `/platform` — Architecture deep-dive with second orbital diagram
- `/models` — Three engine deep-dives (SAGE™/CRAFT™/CiteMind™) with per-engine
  process SVG diagrams
- `/pricing` — $199/$599/$1,199/Custom with annual/monthly toggle, "Most
  Popular" badge on Pro, "Replaces" comparison line
- `/about` — Mission, problem stats, company

**Design rules confirmed:**
- 100% inline styles — NO Tailwind color utilities
- Technical grid background (#0A0A0F + 1px lines)
- Solid backgrounds on ALL sections (alternating #0A0A0F / #0D0D14)
- Cyber-industrial aesthetic

### 2. Architecture Diagram — Layered Perspective (homepage + platform)
Replaced old concentric circles with stacked orbital ellipses showing:
- STRATEGY layer → SAGE™ (iris #A855F7)
- EXECUTION layer → CRAFT™ (cyan #00D9FF)
- INTELLIGENCE layer → CiteMind™ (magenta #E879F9)
- OUTPUT → EVI™ 74.2 (green #22C55E) at convergence point
- Directional flow arrows between each layer
- Green feedback loop on left side "re-analysis loop"
- Right column: "Three layers. One direction." + loop statement in brand colors

### 3. Silo Tax Audit — Primary Acquisition Flow

**Live at: pravado.io/audit**

4-step state machine: input → scanning → teaser → results

**Backend:**
- Route: `apps/api/src/routes/siloTaxAudit/index.ts`
- Registered at: `/api/v1/silo-tax` on Render API
- Model: `claude-haiku-4-5-20251001` (~$0.002/audit confirmed)
- Silo Tax formula:
  - Authority Leakage = unlinked_mentions × $18 CPM
  - PPC Replacement = citation_gap_queries × $2.40 × 120
  - Hallucination Overhead = (1200 × entity_collision_risk%) × $1.20
  - Monthly Cash Loss = Authority Leakage + PPC Replacement
  - Compounding Risk Premium = Hallucination Overhead
- Supabase table: `audit_sessions` (live, RLS enabled)
- Magic link generated via `supabase.auth.admin.generateLink()`
- Email sent via Resend after account creation

**Proxy routes (Next.js → Render):**
- `apps/dashboard/src/app/api/audit/scan/route.ts` → `/api/v1/silo-tax/scan`
- `apps/dashboard/src/app/api/audit/claim/route.ts` → `/api/v1/silo-tax/claim`

**Key fixes applied this session:**
- `listUsers({ perPage: 1000 })` — was 1, caused user lookup to fail
- `organizations` → `orgs` — correct Supabase table name
- agencyRoutes import commented out in server.ts (uncommitted, was crashing Render)
- Field names: `brandUrl`/`competitorUrls` (not `brand_url`/`competitors`)

### 4. Email Infrastructure
- Provider: Resend (re_xxxx key in Render env)
- From: hello@pravado.io
- Domain verified: pravado.io (DKIM + SPF + MX in Namecheap)
- Mailer plugin: `apps/api/src/plugins/mailer.ts`
  - Reads `process.env.RESEND_API_KEY` directly (bypasses validateEnv)
  - Priority: Resend → Mailgun → Console
- `createMailer()` in `packages/utils/src/mailer.ts` supports Resend natively

### 5. Domain Separation
- `apps/dashboard/middleware.ts` — hostname routing
  - `pravado.io` → serves marketing pages, redirects /app/* to app.pravado.io
  - `app.pravado.io` → serves dashboard, redirects marketing routes to pravado.io
- `apps/dashboard/src/lib/domains.ts` — DOMAINS helper, marketingUrl(), appUrl()
- Env vars in Vercel: NEXT_PUBLIC_MARKETING_URL, NEXT_PUBLIC_APP_URL

### 6. Pricing (Canonical — confirmed in planLimitsService + bootstrapStripeBilling)
| Plan | Monthly | Annual |
|------|---------|--------|
| Starter | $199/mo | $159/mo |
| Pro (Most Popular) | $599/mo | $479/mo |
| Growth | $1,199/mo | $959/mo |
| Enterprise | Custom (floor $2,500) | Custom |

Trial tier added: 1 seat, 2 CiteMind engines, 10 SAGE proposals, 500K tokens

---

## OUTSTANDING ISSUES — MUST FIX NEXT SESSION

### 🔴 P0 — Blocking

**1. Supabase Site URL wrong (magic link broken)**
- Current: Site URL = `https://agency.sapientdigital.io` (set during agency-os work)
- Fix: Go to supabase.com/dashboard/project/kroexsdyyqmlxfpbwajv/auth/url-configuration
  - Site URL → `https://app.pravado.io`
  - Redirect URLs → add `https://app.pravado.io/**` and `https://pravado.io/**`
- Status: NOT YET DONE — do this first in next session

**2. Audit funnel UX restructure needed**
Current flow has three problems identified by Christian:
  a) Email captured AFTER scan — no protection against bots/competitors
  b) Results shown immediately after account creation — email CTA is redundant
  c) Visual design needs assessment — "on the border between good marketing
     and gimmicky" — needs eyes-on review before sharing publicly

**Agreed redesign:**
```
NEW FLOW:
Step 1: URL input + email upfront (required, rate-limited 1/email/24h)
Step 2: Scanning animation (Haiku runs)
Step 3: Full results shown directly (no blur gate — email already captured)
Step 4: "Save to dashboard" CTA → name + company → creates full account
         → Resend sends magic link for ongoing access
```

**3. Visual design review needed**
- Haven't done a full visual inspection of the complete audit flow
- Christian says it's "pretty good but on the border between good and gimmicky"
- Need: screenshot or Loom of each step for honest assessment

### 🟡 P1 — Important

**4. Email validation missing**
- No server-side email format validation in the claim route
- Add regex check before Supabase user creation

**5. Dashboard first-session UX**
- Users who click magic link land in Command Center cold
- No context tied to their audit data
- audit_sessions.org_id is set — data is there, just not surfaced

**6. Agency OS uncommitted files**
- `apps/agency-os/` — entire app is untracked, NOT in git
- `apps/api/src/routes/agency/` — routes untracked, NOT in git
- `apps/api/src/routes/agency` is referenced by server.ts but commented out
- DO NOT commit these yet — requires its own planned sprint

### 🟢 P2 — When Pipeline Minutes Allow

**7. Render pipeline minutes**
- Currently metered at $5/1K minutes (not hard-capped)
- Heavy sprint burned significant minutes
- Shell patches made during session are TEMPORARY — will revert on next deploy
- All shell patches ARE committed to git, so next deploy will be correct

**8. Wellstead external dependencies**
- Stripe, RevenueCat, Google Maps API, FusionPBX — blocking App Store submission
- Separate sprint required

---

## BRAND ARCHITECTURE — LOCKED

```
SAGE™    = Signal · Authority · Growth · Exposure (strategic intelligence)
CRAFT™   = Coordinated Response & Action Flow Technology (execution)
CiteMind™ = AI citation intelligence engine
EVI™     = Earned Visibility Index (0-100, unified output metric)
```

**Loop statement (use verbatim):**
`SAGE™ → CRAFT™ → CiteMind™ → EVI™ → SAGE™`

**System statement:**
`SAGE™ identifies the gap. CRAFT™ closes it. CiteMind™ confirms it happened.
EVI™ tells you if it's working.`

**TM rules:** Use ™ (unregistered). File USPTO Class 42+35 before using ®.

---

## GIT STATE — LAST KNOWN COMMITS

```
b85e9ff fix(api): rewrite mailerPlugin — reads process.env directly
bd91d70 fix: listUsers perPage 1→1000
3d479f1 feat: magic link email after audit claim
b6a2a1c fix(api): add Silo Tax audit routes to Render API
601e4c5 feat: Silo Tax Audit — primary acquisition flow
1070a9d fix(marketing): replace &check; with Unicode checkmark
e01b58b fix(marketing): solid backgrounds on all sections
79faaf3 feat: layered diagram + models page
83bf7a4 feat: marketing site persona cards + orbital diagram
```

**Untracked (do NOT commit without planning):**
- `apps/agency-os/**` — Agency OS app (separate venture, separate sprint)
- `apps/api/src/routes/agency/**` — Agency OS API routes
- `apps/api/.env.agency`
- `AGENCY_OS_SESSION_2.md`
- `E2E_AUDIT_REPORT.md`
- `mobile-audit/`

---

## REPO STRUCTURE QUICK REF

```
pravado-v2/
├── apps/
│   ├── dashboard/          ← Next.js (Vercel) — marketing + dashboard
│   │   ├── src/app/(marketing)/  ← pravado.io pages
│   │   │   ├── page.tsx          ← Homepage
│   │   │   ├── audit/page.tsx    ← Silo Tax Audit (acquisition)
│   │   │   ├── platform/page.tsx
│   │   │   ├── models/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── src/app/app/          ← app.pravado.io dashboard
│   │   └── middleware.ts         ← Domain separation routing
│   └── api/                ← Fastify (Render) — backend API
│       └── src/
│           ├── server.ts         ← Route registration
│           ├── routes/
│           │   ├── siloTaxAudit/ ← Silo Tax scan + claim
│           │   └── [others]
│           └── plugins/
│               └── mailer.ts     ← Resend email (process.env direct)
├── packages/
│   ├── utils/src/mailer.ts  ← createMailer() — Resend > Mailgun > Console
│   └── validators/src/env.ts ← RESEND_API_KEY optional in schema
└── supabase/
    └── migrations/          ← audit_sessions table included
```

---

## SKILLS AVAILABLE

```
/mnt/skills/user/pravado-design/SKILL.md  ← DS v3 tokens, cyber-industrial rules
/mnt/skills/user/pravado-copy/SKILL.md    ← Brand voice, TM rules, copy patterns
/mnt/skills/public/frontend-design/SKILL.md
/mnt/skills/public/docx/SKILL.md
/mnt/skills/public/pdf/SKILL.md
```

---

## ENVIRONMENT VARIABLES (Render — production)

Key vars confirmed set:
- `ANTHROPIC_API_KEY` — Claude Haiku for audit scans
- `RESEND_API_KEY` — Email delivery
- `RESEND_FROM_EMAIL` — hello@pravado.io
- `SUPABASE_URL` — kroexsdyyqmlxfpbwajv
- `SUPABASE_SERVICE_ROLE_KEY` — service role
- `STRIPE_SECRET_KEY` — Stripe billing

NOT set (Mailgun legacy — can be removed):
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`

---

## NEXT SESSION CHECKLIST — DO IN ORDER

1. ✅ Read this file completely
2. ✅ Fix Supabase Site URL (P0 — 30 seconds, manual)
3. ✅ Visual audit of audit flow (screenshot each step)
4. ✅ Redesign audit funnel — email upfront, remove blur gate
5. ✅ Assess email template branding
6. ✅ Dashboard first-session UX for audit users
7. Then: Wellstead sprint OR other venture priority per Christian

---

## MCP STABILITY NOTES

Chrome MCP (`Claude in Chrome`) drops frequently during long sessions.
**Mitigation:**
- Use Claude Code for all file edits and code tasks
- Use MCP only for visual verification / browser automation
- Start new session if MCP drops more than 3 times
- Filesystem MCP is more stable than Chrome MCP

---
*This file is the canonical session handoff. Update at end of every session.*
