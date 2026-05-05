# SESSION PRIMER — Pravado v2
> Single source of truth for cross-session continuity.
> Last Updated: 2026-05-05 — Migration 94 applied to deployed Supabase (D027 audit_sessions persistence fix)

---

## UPDATE 2026-05-05 — Migration 94 applied + migration-apply convention gap flagged

**Issue:** Phase 1E live testing surfaced that audit_sessions inserts have been silently failing in production since Phase 1A. The route returned `audit_id: null` with no log line because the catch block was theatrical — Supabase JS returns `{ data, error }` on Postgres-level errors rather than throwing, so the swallowed error never reached the network-throw catch.

**Diagnosis (commit `5235808`):** Surfaced the Supabase errors at all five audit_sessions / orgs call sites in `apps/api/src/routes/siloTaxAudit/index.ts` with sanitized logging (code/message/details/hint only — never the full error object, never the insert payload). Live test scan after the deploy emitted:

```
{
  "level": "error",
  "context": "audit-scorecard",
  "message": "Could not find the 'ai_band' column of 'audit_sessions' in the schema cache",
  "code": "PGRST204"
}
```

**Root cause:** Migration `94_audit_sessions_three_pillar.sql` (committed with Phase 1A at `f66a1ca`) was never applied to the deployed Supabase. The API code that depends on its columns (`ai_band`, `pr_band`, `entry_path`, etc.) shipped to production at the same time the migration file landed in the repo, violating the documented hard rule in `docs/RUNBOOK.md:72`: *"Always apply migrations BEFORE deploying API code that depends on them. Never the reverse."* This invalidates the Phase 1A anomaly #4 hypothesis (FK pointing at `organizations` instead of `orgs`) — that's a separate latent issue but isn't what blocked the inserts. PostgREST rejected the writes at the column-cache layer before FK validation.

**Fix:** Applied migration 94 directly via psql against the Supabase pooler (`aws-0-us-west-2.pooler.supabase.com:6543`) using the full file contents. All 8 `ALTER TABLE` statements + the `CREATE INDEX` succeeded; the single `NOTICE` was the IF-EXISTS pattern doing its job on a fresh apply. Followed with `NOTIFY pgrst, 'reload schema'` to refresh PostgREST's schema cache.

**Verification:**
- Pre-apply: 0 of 15 expected migration-94 columns present, 7 legacy Silo Tax rows in `audit_sessions`
- Post-apply: all 15 columns present, CHECK constraint installed, schema cache reloaded
- Live test scan returned `audit_id: 1c8d7cbe-8651-45d2-976b-c86779b39b5d` (non-null), full three-pillar payload persisted to DB (pr=92, content=88, ai=85, entry_path=pr, stage=account_created)
- Render logs in the post-apply window show zero PGRST204 errors

**Bonus finding (latent):** `public.organizations` table does not exist in the deployed schema (only `orgs`). Migration 92 declares `org_id uuid REFERENCES public.organizations(id)`. The FK isn't enforced today because its target doesn't exist, so it's not blocking inserts — but the declared schema lies about its referential integrity. Worth a small follow-up migration to drop the broken FK and recreate it against `orgs(id)`. Not done in this commit.

**Convention gap surfaced:**

The miss was a process failure, not a tooling failure. `docs/RUNBOOK.md` already documents the manual `supabase db push` workflow and the BEFORE-deploy ordering rule. Both are clear. What's missing is enforcement — there's no CI check that blocks API deploys carrying an un-applied migration, no PR-time reminder, no record of which migrations have been applied to which environment. The hard rule lives in a runbook one human is expected to remember.

Flagged as P1 in OUTSTANDING ISSUES below. Convention fix is out of scope for this commit (the work order scoped this commit to fixing the specific miss + flagging the gap). Recommended follow-up sprint scope is at the bottom of the OUTSTANDING ISSUES section.

---

## UPDATE 2026-04-29 — Phase 1A Architect Checkpoint Passed

**Phase 1A** (commit f66a1ca) and **Phase 1A.1** (commit 1d40535) shipped the backend three-pillar EVI scoring API + schema migration per `docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md`. Architect checkpoint per work order Phase Sequencing section completed 2026-04-29.

**Validation outcome:**
- Architect-review harness ran 7 brand scans (B2B SaaS, D2C, agency, niche)
- 7/7 valid LLM output, 0 retries needed, 0 forbidden-pattern violations (no dollar figures, no "Silo Tax" leakage, no scareware framing)
- EVI calibration spans the full band range: Dominant (Stripe 88, HubSpot 83), Competitive (Figma 78, Notion 73, Allbirds 68, Muck Rack 68), Emerging (Wellstead 45)
- Sample narrative quality met the bar: real outlets named (Wall Street Journal, Bloomberg, American Banker, Pymnts, Fast Company), real people named (Patrick Collison, Evan Sharp), real competitors named (Square, PayPal, Adobe, Canva), operationally concrete remediations with timelines and counts

**Latency:** 19-26 seconds per scan. Phase 1B scanning-step UX must mask this with progress indicators / staged messaging.

**Phase 1B (frontend results renderer rebuild) is cleared to start in a fresh Claude Code session.**

---

## UPDATE 2026-04-28 — Security Hardening, Tier Calibration, Boot Sequence

Work landed since the 2026-04-21 sprint primer. P0 outstanding issues
documented further down (Supabase Site URL fix, etc.) remain valid — this
section is additive context, not a replacement.

### Git history was rewritten on 2026-04-24

A surgical history purge removed 5 credential patterns from the Pravado v2
git history. SHAs prior to `0805e75` no longer exist in this repo.

- **Pre-purge backup:** `/home/saipienlabs/projects/pravado-v2-backup-2026-04-24`
  (full clone of repo state immediately before the purge — keep until rotation
  audit is signed off).
- **Post-purge HEAD anchor:** `0805e75` (the working-tree security remediation
  commit; this same change existed pre-purge as SHA `9144f05`).
- **Implication:** any external reference (PR comments, deploy logs, ops notes)
  to commit SHAs older than `0805e75` will not resolve in `origin/main`. Use the
  backup clone if archaeological lookup is needed.

### Commits landed since 2026-04-21 primer

| SHA | Subject | Notes |
|-----|---------|-------|
| `0805e75` | security(secrets): untrack .env.production, sanitize docs, fix hardcoded key | Post-purge HEAD anchor. Untracks `.env.production`, removes mobile hardcoded JWT, sanitizes docs. Pre-purge SHA was `9144f05`. |
| `e929dc2` | feat(billing): Starter tier calibration — 2.5M tokens, 10 CRAFT/mo | CRAFT pieces 25→10 (code aligned DOWN to Stripe-advertised copy). LLM tokens 500K→2.5M (5x increase). Stripe bootstrap copy: "individuals" → "small teams getting started". Pre-beta calibration window. |
| `4cb9fdc` | docs(claude): add mandatory boot sequence to CLAUDE.md | New "Required Boot Sequence" section in `CLAUDE.md` requiring future sessions to read `/ARCHITECT_BRIEFING.md` and `/SESSION_PRIMER.md` (this file) before `/docs/canon/README.md`. Structural fix for cross-session orientation drift. |

### Credential rotations completed (Christian)

Following the history purge, the following secrets were rotated. Render env
vars and any other consumers should reflect the new values.

- **PostHog** — rotated.
- **Sentry** — rotated.
- **Cloudflare** — rotated AND split per venture (separate keys per Saipien
  property; no longer a single shared key).

### Known follow-ups queued

- **Plans Reconciliation work order** — `planLimitsService.ts` and
  `bootstrapStripeBilling.ts` still disagree on Starter dimensions (seats,
  SAGE quotas, CiteMind frequency, journalist contacts). The Starter tokens +
  CRAFT calibration in `e929dc2` was scoped intentionally; the remaining
  dimensions need a single canonical reconciliation pass before beta launch.
- **Pre-beta = no active customers**, so plan-limit drift is non-blocking but
  must close before paid signups are enabled.

---

## CURRENT STATE: MARKETING SITE + ACQUISITION FUNNEL LIVE

Both `pravado.io` (marketing) and `app.pravado.io` (dashboard) are live and
separated. The Silo Tax Audit acquisition funnel is functional end-to-end with
real Claude Haiku analysis, Supabase persistence, and Resend email delivery.
The magic link in the email is currently broken (Supabase Site URL wrong) —
fix is documented below and must be first action in next session.

---

## INFRASTRUCTURE — CONFIRMED WORKING

| Service | URL | Status |
|---------|-----|--------|
| Marketing site | https://pravado.io | ✅ Live |
| Dashboard | https://app.pravado.io | ✅ Live |
| API | https://pravado-api.onrender.com | ✅ Live (b85e9ff) |
| Supabase | kroexsdyyqmlxfpbwajv | ✅ Live |
| Email | Resend / hello@pravado.io | ✅ Live |
| Vercel | pravado-dashboard project | ✅ Both domains |

**Render:** Pro plan. Pipeline minutes are METERED ($5/1K) — not hard-capped.
Heavy sprint burned significant minutes. Builds are working.

**DNS (Namecheap — NOT Cloudflare):**
- A record @ → 216.150.1.1 (Vercel)
- CNAME www → 9f1f38c7c596ca86.vercel-dns-017.com (Vercel specific)
- Resend DKIM TXT: resend._domainkey → [key]
- Resend SPF TXT: send → v=spf1 include:amazonses.com ~all
- Resend MX: send → feedback-smtp.us-east-1.amazonses.com (priority 10)

**Render Environment Variables (confirmed set):**
- ANTHROPIC_API_KEY — Claude Haiku for audit scans
- RESEND_API_KEY — Resend email delivery
- RESEND_FROM_EMAIL — hello@pravado.io
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- MAILGUN_* — legacy, can be removed (ignored by mailer)

---

## WHAT WAS BUILT THIS SESSION

### 1. Marketing Site — 5 pages live at pravado.io

**Pages:** `/` `/platform` `/models` `/pricing` `/about`

**Design rules (MUST maintain):**
- 100% inline styles — NO Tailwind color utilities
- Technical grid background: #0A0A0F with 1px rgba(255,255,255,0.025) lines
- ALL sections have explicit solid backgrounds (alternating #0A0A0F / #0D0D14)
- Section padding: `80-100px 5%` with `maxWidth: 1400, margin: '0 auto'` inner wrapper
- Body copy constrained to maxWidth 640-680px inside sections
- Never transparent/rgba section backgrounds — caused invisible content bug

**Nav:** Platform | Models | Pricing | About | [FREE Silo Tax Audit pill] | Sign In | Get Early Access

### 2. Layered Architecture Diagram (homepage + platform)

SVG, 600×520 viewBox. Three orbital ellipses at different altitudes showing:
- Left side: STRATEGY / EXECUTION / INTELLIGENCE / OUTPUT layer labels
- SAGE™ (iris #A855F7) on STRATEGY orbital
- CRAFT™ (cyan #00D9FF) on EXECUTION orbital
- CiteMind™ (magenta #E879F9) on INTELLIGENCE orbital
- Vertical flow arrows: "dispatches action" → "generates signals" → "citation data"
- EVI™ 74.2 (green #22C55E) at convergence bottom
- Green dashed feedback loop on left: "re-analysis loop" EVI→SAGE
- Right column (2-col layout): "Three layers. One direction." + loop statement

### 3. Models Page (/models)

Three anchored sections (#sage #craft #citemind) with per-engine process diagrams:
- SAGE™: Radial input SVG — 7 signal sources flowing inward, output arrow → CRAFT™
- CRAFT™: Horizontal 5-stage pipeline SVG with feedback loop + 3 execution type cards
- CiteMind™: Circular scanning SVG — 4 AI engine nodes, citation type legend, mock feed
- Intro section with 3 quick-nav cards linking to anchors

### 4. Pricing (Canonical — all files updated)

| Plan | Monthly | Annual | Key limits |
|------|---------|--------|-----------|
| Starter | $199 | $159 | 3 seats, 300 SAGE/mo, 100 CiteMind scans |
| Pro ★ | $599 | $479 | 5 seats, 1500 SAGE/mo, 1000 CiteMind scans |
| Growth | $1,199 | $959 | 15 seats, 10K SAGE/mo, 5000 CiteMind scans |
| Enterprise | Custom | Custom | Unlimited |

Annual/monthly toggle with "Save 20%" badge. Pro has "Most Popular" badge.
"Replaces" comparison: Muck Rack + Profound + Semrush = $1,632/mo

Files updated: `planLimitsService.ts`, `bootstrapStripeBilling.ts`,
`(marketing)/pricing/page.tsx`, `(marketing)/page.tsx`

Trial tier added: 1 seat, 2 CiteMind engines (ChatGPT+Perplexity), 10 SAGE
proposals, 500K tokens, 1 CRAFT execution.

### 5. Silo Tax Audit — Primary Acquisition Flow

**URL:** pravado.io/audit  
**Model:** claude-haiku-4-5-20251001 (~$0.002/audit — confirmed, NOT $0.30)  
**At scale:** 10K audits/month = ~$20 in LLM costs

**4-step state machine:** input → scanning → teaser (gated) → results

**Silo Tax Formula:**
```
Authority Leakage    = unlinked_mentions × $18 CPM
PPC Replacement      = citation_gap_queries × $2.40 × 120
Hallucination Overhead = (1200 × entity_collision_risk%) × $1.20
Monthly Cash Loss    = Authority Leakage + PPC Replacement
Compounding Risk     = Hallucination Overhead (grows 10× if uncorrected)
Silo Tax Total       = All three combined
```

**Files:**
- Frontend: `apps/dashboard/src/app/(marketing)/audit/page.tsx`
- API scan: `apps/api/src/routes/siloTaxAudit/index.ts`
- Proxy scan: `apps/dashboard/src/app/api/audit/scan/route.ts`
- Proxy claim: `apps/dashboard/src/app/api/audit/claim/route.ts`
- Supabase table: `audit_sessions` (live, RLS, references `orgs` not `organizations`)

**Claim route flow:**
1. `listUsers({ perPage: 1000 })` to check existing user
2. Creates Supabase auth user + org
3. Links audit_session to org, sets `trial_expires_at = now() + 72 hours`
4. Generates magic link → `https://app.pravado.io/app/command-center`
5. Sends Resend email with EVI card + Silo Tax + CTA button

**Key bugs fixed:**
- `listUsers({ perPage: 1 })` → `perPage: 1000` (user lookup was always failing)
- `organizations` → `orgs` (correct Supabase table name)
- `brand_url`/`competitors` → `brandUrl`/`competitorUrls` (field name mismatch)
- agencyRoutes import commented out in server.ts (was crashing Render on every deploy)
- Null safety on result display (toLocaleString crash)

### 6. Email Infrastructure

- Provider: Resend (replacing Mailgun)
- From: hello@pravado.io
- Mailer plugin: reads `process.env.RESEND_API_KEY` directly (bypasses validateEnv
  Zod schema which was stripping the key)
- Priority order: Resend → Mailgun (legacy) → Console (dev fallback)
- `createMailer()` in `packages/utils/src/mailer.ts` — uses fetch to Resend API
- Email template: EVI score card + Silo Tax + magic link CTA + CiteMind 72H notice

**Email strategy decision:**
- Transactional: Resend (confirmed working)
- Business inboxes: Zoho Mail recommended ($1/user/mo, unlimited domains) — NOT YET SET UP
- Decision: Don't use single provider for both — keep them separate

### 7. Domain Separation

- `apps/dashboard/middleware.ts` — hostname routing middleware
- `apps/dashboard/src/lib/domains.ts` — DOMAINS helper
- Vercel env vars: NEXT_PUBLIC_MARKETING_URL, NEXT_PUBLIC_APP_URL

---

## OUTSTANDING ISSUES — PRIORITIZED FOR NEXT SESSION

### 🔴 P0 — Do First (blocks magic link / funnel conversion)

**1. Supabase Site URL is wrong**
- Current: Site URL = `https://agency.sapientdigital.io` (set during agency-os work)
- This causes magic links to redirect to agency domain (no DNS → broken link)
- Fix (30 seconds, manual in Supabase dashboard):
  - URL: supabase.com/dashboard/project/kroexsdyyqmlxfpbwajv/auth/url-configuration
  - Site URL → `https://app.pravado.io`
  - Redirect URLs → ensure these are in allowlist:
    - `https://app.pravado.io/**`
    - `https://pravado.io/**`
    - `https://agency.sapientdigital.io/**` (keep for future)
  - Click Save

**2. Audit funnel UX restructure**

Current flow problems identified by Christian:
  a) Email captured AFTER scan — no bot protection, competitors can abuse
  b) Results shown immediately on screen after account creation — email CTA redundant
  c) Visual design unreviewed — "on the border between good and gimmicky"
  d) No email validation (format not checked server-side)

Agreed redesign:
```
NEW FLOW:
Step 1: URL input + email REQUIRED upfront
         Rate limit: 1 scan per email per 24 hours (prevent abuse)
         Simple email format validation
Step 2: Scanning animation (Haiku runs in background)
Step 3: Full results shown directly — NO blur gate (email already captured)
Step 4: "Save to dashboard" CTA → name + company → creates full account
         Resend sends magic link for ongoing access
```

Benefits: Captures lead before spending $0.002, stops bot abuse, less gimmicky.

**3. Visual design assessment of audit flow**
- Haven't done full eyes-on review of complete flow
- Christian says "pretty good but on the border between good and gimmicky"
- Need to screenshot/record each step and assess:
  - Input page (confirmed good)
  - Scanning animation (confirmed good)
  - Teaser gate (confirmed working — blurred EVI + Silo Tax + form)
  - Full results: EVI score, odometer, formula reveal, gap cards, CiteMind panel
  - Transitions between steps
  - Whether Silo Tax numbers feel credible or inflated

**4. Email template branding**
- Email delivered successfully ✅
- Christian says branding "needs work"
- Template in `buildAuditClaimEmailHtml()` in `siloTaxAudit/index.ts`
- Assess: logo treatment, typography, color usage vs DS v3 brand standards

### 🟡 P1 — Important

**5. Dashboard first-session UX for audit users**
- Users who click magic link land in Command Center cold
- No connection between their audit data and what they see
- `audit_sessions.org_id` is set — data exists, just not surfaced
- Need: "Welcome" state that shows their EVI score and top gaps from audit

**6. Pre-existing Render API errors (non-blocking)**
- Redis SSL error: `ssl3_get_record:wrong version number`
  → BullMQ queues disabled, jobs run on-demand. Pre-existing, low priority.
- Scheduler tick error every 60s: EVI scheduler skipped due to no Redis
  → Pre-existing. Not affecting any user-facing functionality.
- 47 TypeScript errors in apps/api: ALL in `routes/agency/**` (uncommitted)
  → Not imported, not compiled. Safe to ignore until agency sprint.
- Sentry DSN not configured → just a warning, doesn't affect operation

**7. Wellstead external dependencies**
- Stripe, RevenueCat, Google Maps API, FusionPBX — blocking App Store submission
- Separate dedicated sprint required

**8. Migration-apply convention has no enforcement**
- Surfaced 2026-05-05 by the migration-94 miss (full incident log in the dated UPDATE block at the top of this file)
- `docs/RUNBOOK.md:62-77` documents the rule clearly: migrations are manual via `supabase db push`, must apply BEFORE deploying API code that depends on them. The rule is correct. What's missing is enforcement.
- The miss happened because Phase 1A merged the migration file + the API code that depends on it in the same commit, and only the API code path is automated (Render auto-deploys on push to main; migrations require a human to remember to run `supabase db push`).
- Recommended follow-up sprint scope (not this commit):
  1. **CI guard:** add a workflow that fails the API deploy if any new migration file in `apps/api/supabase/migrations/` has been merged to `main` since the last successful production migration apply. Tracking-state could live in a `production_migrations_applied` table in the DB itself, or a JSON file in the repo updated by the apply tooling.
  2. **Apply tooling that records state:** wrap `supabase db push` in a script (`scripts/apply-migrations.sh`?) that records the applied filename + timestamp + SHA somewhere durable so the CI guard has a source of truth.
  3. **PR template checkbox:** "If this PR adds a migration, has it been applied to staging?" — soft enforcement, but cheap.
  4. **Latent FK to fix while in this neighborhood:** `audit_sessions.org_id` references `public.organizations(id)` per migration 92 line 3, but the deployed table is `orgs` and `organizations` does not exist. The FK isn't enforced (target table missing) so it's not blocking writes today, but the declared schema is lying. Drop + recreate against `orgs(id)` in a small follow-up migration.

### 🟢 P2 — Future Sprints

**8. Annual billing in Stripe**
- Annual price IDs not yet created (only monthly exists in bootstrapStripeBilling.ts)
- Toggle UI exists on pricing page, but Stripe doesn't have annual prices yet

**9. 80% usage warning emails**
- `isApproachingLimit()` utility added to planLimitsService
- Cron job to send warning emails not built yet

**10. Agency OS (DO NOT COMMIT without planning)**
- `apps/agency-os/**` — entire app, untracked
- `apps/api/src/routes/agency/**` — routes, untracked
- server.ts import is COMMENTED OUT — safe
- Requires its own planned sprint + Work Order

---

## BRAND ARCHITECTURE — LOCKED

```
SAGE™    = Signal · Authority · Growth · Exposure
CRAFT™   = Coordinated Response & Action Flow Technology
CiteMind™ = AI citation intelligence engine (compound word, not acronym)
EVI™     = Earned Visibility Index (0-100)
```

**Loop statement:** `SAGE™ → CRAFT™ → CiteMind™ → EVI™ → SAGE™`

**System statement:**
`SAGE™ identifies the gap. CRAFT™ closes it. CiteMind™ confirms it happened.
EVI™ tells you if it's working.`

**TM rules:** Use ™ (unregistered claim). File USPTO Class 42+35 before ®.

**Telemetry panel (canonical):**
```
● SAGE™      Active — 3 recommendations queued
● CRAFT™     Running — 2 campaigns in flight
● CiteMind™  Monitoring — 4 new citations detected
```

---

## COMPETITIVE CONTEXT (for audit copy)

**Pravado replaces:**
- Muck Rack: ~$833/mo (mid-market avg $12,874/yr)
- Profound (AEO): $399/mo Growth
- Semrush: $400/mo
- BuzzSumo: $300/mo
- **Total current stack: ~$1,632–1,932/mo**

**Growth plan at $1,199/mo = ~$700/mo savings + unified platform**

---

## GIT STATE

**Latest commits (main branch):**
```
b85e9ff fix(api): rewrite mailerPlugin — reads process.env directly
bd91d70 fix: listUsers perPage 1→1000
3d479f1 feat: magic link email after audit claim
b6a2a1c fix(api): add Silo Tax audit routes to Render API
601e4c5 feat: Silo Tax Audit — primary acquisition flow
1070a9d fix(marketing): replace &check; with Unicode checkmark
e01b58b fix(marketing): solid backgrounds on all sections
79faaf3 feat: layered diagram + models page + margin fixes
83bf7a4 feat: marketing site persona cards + orbital diagram
0047520 fix(middleware): remove unused SHARED_PATHS variable
0309d92 feat: AUTOMATE→CRAFT™ rename across 30 files
```

**Untracked — DO NOT COMMIT without planning:**
```
apps/agency-os/**           ← Agency OS (separate venture sprint)
apps/api/src/routes/agency/ ← Agency OS API routes
apps/api/.env.agency
AGENCY_OS_SESSION_2.md
E2E_AUDIT_REPORT.md
mobile-audit/
scripts/reclassify-journalist-beats.sql
vercel.agency-os.json
docs/canon/AGENCY_OS_SPEC.md
docs/canon/VIDEO_PIPELINE_AMENDMENT.md
```

---

## REPO / FILE QUICK REFERENCE

```
apps/dashboard/
  middleware.ts                          ← Domain separation (pravado.io vs app.)
  src/lib/domains.ts                     ← DOMAINS helper
  src/app/(marketing)/
    page.tsx                             ← Homepage
    layout.tsx                           ← Marketing nav (Platform|Models|Pricing|About|Audit pill)
    audit/page.tsx                       ← Silo Tax Audit (4-step state machine)
    platform/page.tsx                    ← Architecture deep-dive
    models/page.tsx                      ← Three engine deep-dives
    pricing/page.tsx                     ← Pricing with toggle
    about/page.tsx                       ← Mission + company
  src/app/api/audit/
    scan/route.ts                        ← Proxy → /api/v1/silo-tax/scan
    claim/route.ts                       ← Proxy → /api/v1/silo-tax/claim

apps/api/src/
  server.ts                              ← Route registration (agency COMMENTED OUT)
  plugins/mailer.ts                      ← Resend via process.env (no validateEnv)
  routes/siloTaxAudit/index.ts          ← Scan + claim handlers + email template
  services/billing/planLimitsService.ts ← Trial + paid tier limits

packages/
  utils/src/mailer.ts                   ← createMailer() Resend>Mailgun>Console
  validators/src/env.ts                 ← RESEND_API_KEY optional in schema
```

---

## SKILLS AVAILABLE (read before writing code)

```
/mnt/skills/user/pravado-design/SKILL.md  ← DS v3 tokens, cyber-industrial rules
/mnt/skills/user/pravado-copy/SKILL.md    ← Brand voice, TM rules, copy patterns
/mnt/skills/public/frontend-design/SKILL.md
/mnt/skills/public/docx/SKILL.md
/mnt/skills/public/pdf/SKILL.md
```

---

## NEXT SESSION — DO IN THIS ORDER

1. **Read this file completely** before touching any code
2. **Fix Supabase Site URL** (P0, 30 seconds, manual) — unblocks magic link
3. **Visual inspection** of full audit flow (screenshot each step, assess)
4. **Email template** branding assessment + fix
5. **Audit funnel restructure** — email upfront, remove blur gate
6. **Dashboard first-session UX** for users arriving from magic link
7. Address Wellstead or other venture priority per Christian

---

## MCP STABILITY NOTES

Chrome MCP (`Claude in Chrome`) drops frequently in long sessions.
- Start new session if MCP drops more than 2-3 times
- Use Claude Code for all file edits — more reliable
- Use MCP only for visual verification / browser automation
- Filesystem MCP is more stable than Chrome MCP
- When MCP is down, use Render Web Shell for server-side fixes

---
*Update this file at the end of every session before closing.*
