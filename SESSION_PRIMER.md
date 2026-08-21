# SESSION PRIMER — Pravado v2

> Single source of truth for cross-session continuity.
> **Last Updated: 2026-08-21** — full rewrite to current reality (post Growth→Scale
> rename + billing/margin close-out + surface-liveness verification). Supersedes
> the prior primer, which had drifted to its 2026-05-05 state.

> **How to use this file:** this is the _current-state_ orientation doc named in the
> CLAUDE.md boot sequence. Read it after `ARCHITECT_BRIEFING.md` and before
> `docs/canon/README.md`. It records program state and durable ops facts, NOT
> product spec — canon wins on all product questions. Deep historical incident logs
> live in `docs/canon/DECISIONS_LOG.md` and git history, not here.

---

## TL;DR — launch-readiness verdict (2026-08-21)

**The engine and the monetization are ready; the remaining gaps are surface polish + GTM funnel finish, not foundational build.**

- ✅ **Intelligence core** — SAGE (mesh: decay + reinforcement), CRAFT (governed proposal→execution→immutable audit loop), EVI (real 0.40/0.35/0.25 math), CiteMind (semantic citation detection), Entity Map (Ring 0–3). Structurally complete + governed.
- ✅ **Autopilot safety floor** — built, **INERT** by design (`AUTONOMOUS_AUTOPILOT_ENABLED=false`).
- ✅ **PR outreach closed loop** — LIVE on **Resend** (outbound + inbound reply capture). SendGrid fully retired (#175). Human review-gate arms with the provider.
- ✅ **Monetization** — plan tiers reconciled + enforced; LLM cost router live (margins fixed); Growth→Scale rename shipped end-to-end (code/Stripe/DB/Render/canon); live Stripe repriced to the ratified **$1,199**. Paid signups can be turned on.
- ⚠️ **Pillar surfaces** — mostly real/honest-empty, but **4 verified mock-data gaps remain** (see Launch Gaps). The SEO pillar's _landing page_ is the biggest.
- ⚠️ **Acquisition funnel** — restructured well (email upfront, rate-limited, no blur gate), but the **audit→dashboard welcome handoff is not built**.

---

## Infrastructure — confirmed working

| Service        | URL / ID                                                                      | Status                                      |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| Marketing site | https://pravado.io                                                            | ✅ Live                                     |
| Dashboard      | https://app.pravado.io                                                        | ✅ Live (Vercel)                            |
| API            | https://pravado-api.onrender.com                                              | ✅ Live (Render `srv-d6s8gpchg0os73f2e8dg`) |
| API (staging)  | pravado-api-staging                                                           | ✅ Live (Render `srv-d4ov97m3jp1c73docvpg`) |
| Database       | Supabase `kroexsdyyqmlxfpbwajv`                                               | ✅ Live                                     |
| Email          | **Resend** (`hello@pravado.io` transactional; `outreach@pravado.io` outreach) | ✅ Live                                     |

- **Render:** Pro plan; pipeline minutes metered ($5/1K). CI slimmed to conserve (see `ci-cost-model` memory).
- **DNS:** Namecheap (BasicDNS), NOT Cloudflare. Vercel A/CNAME for the sites; **Resend** DKIM/SPF/MX for `pravado.io` + inbound `reply.pravado.io`. Both Cloudflare API tokens in local env are INVALID. (Full email-infra detail: `resend-email-infra` memory.)
- **Prod Redis is plaintext `redis://` BY DESIGN** — verified; never flip to `rediss://` (breaks prod). BullMQ/scheduler connect over it.

### Durable ops facts (don't relearn these)

- **Migrations apply BEFORE deploying dependent API code** (`docs/RUNBOOK.md`). This has bitten prod before (mig-94, mig-105/115). There is still **no CI enforcement** — a human must run the apply. Prod schema has drifted from the tracker; treat the tracker as unreliable and verify against live (`prod-schema-drift` memory).
- **Prod SQL / DDL, non-interactively:** Supabase Management API `POST https://api.supabase.com/v1/projects/kroexsdyyqmlxfpbwajv/database/query` with `Authorization: Bearer <sbp_ token>` — **must use curl** (python urllib UA → Cloudflare 1010). The `supabase` CLI `migration list --linked` hangs (needs a DB password not in any env). PostgREST with the service-role key also works for row DML (bypasses RLS).
- **Render env read/write:** REST API with the `rnd_` token in `pravado-v2/.env.local` (`GET/PUT /v1/services/{id}/env-vars/{KEY}`). Env-var PUTs do **not** auto-trigger a deploy — a redeploy is separate.
- **The Claude auto-mode classifier blocks some prod-write bash** — notably handling the **live** Stripe key pulled from Render, and Render **deploy-trigger** POSTs. Read-only variants pass. When blocked, hand the founder the dashboard step; don't work around it.
- **Live Stripe secret** lives only in Render prod env (`.env.local` has a **test** key). **DataForSEO** creds + Resend key are in `pravado-v2/.env.local` and Render prod.
- `dig` is NOT installed (WSL) — use DoH (`curl https://cloudflare-dns.com/dns-query`) for DNS checks.

---

## Billing / pricing — current truth (D040)

Ratified ladder, **all plans include all pillars**; tiers scale by depth (usage/seats/mode/coverage), never by which pillars you get. **No unbundling.**

| Tier       | Monthly    | Annual | Seats  | Notes                                                                    |
| ---------- | ---------- | ------ | ------ | ------------------------------------------------------------------------ |
| Starter    | $199       | $159   | 1      | Manual + Copilot                                                         |
| Pro ★      | $599       | $479   | 5      | + Autopilot; "most popular" anchor                                       |
| **Scale**  | **$1,199** | $959   | 15     | Top self-serve; renamed from "Growth" 2026-08-20, repositioned ABOVE Pro |
| Enterprise | Custom     | —      | Custom | Sales-led; **post-launch** (SOC 2 + case-studies gated, D037)            |

- **Live Stripe (prod) IS repriced to $1,199** — product `prod_U89udkEFakBC7E` = "Pravado Scale", price `price_1U6dK5HoFSOg4ICloZuNJNIl` active, old $799 archived; Render `STRIPE_PRICE_SCALE` points at it; prod redeployed. (0 orgs, clean.)
- Backward-compat kept: legacy `growth` slug + `STRIPE_PRICE_GROWTH` still resolve to Scale (remove after Render env fully cut over).
- **Margins:** the LLM cost router (#177, canon `LLM_COST_ROUTER.md`) routes task→least-cost model (Haiku/Sonnet/Opus tiers); Scale margin ~57%→~76% at full util, all tiers clear the 70% floor. Follow-ups: assign `taskType` across remaining callsites; set `LLM_MODEL_*` in Render; prompt caching + batch. (Full detail: `pricing-gtm-decisions` memory.)
- Enforcement authority = `planLimitsService.ts` (seats 1/5/15, tokens 2.5M/5M/50M, monotonic caps). `bootstrapStripeBilling.ts` marketing_features text still overstates Pro/Scale seats (15/50) — cosmetic Stripe display only, not enforced; fix opportunistically.

---

## Launch-readiness gaps (VERIFIED 2026-08-21 against `main`)

### 🔴 Surfaces rendering fabricated mock as their PRIMARY live data

1. **SEO Overview `/app/seo` (all 3 modes) — the SEO pillar's default landing page.** Renders `MOCK_SHARE_OF_MODEL`, `MOCK_COMPETITORS`, `MOCK_LAYER_HEALTH`, `MOCK_ACTION_QUEUE`, `MOCK_SEO_ASSETS`, `MOCK_TECHNICAL_FINDINGS`, `MOCK_CITATION_ACTIVITY`, `MOCK_TOPIC_CLUSTERS` from `seo/mock-data.ts`. **Only the GSC connection card is real.** Ungated and reachable; the flag file even mislabels it "exemplary." **Largest launch risk** — the SEO _sub_-surfaces (Citations/Competitors/Topics/Recommendations) were wired, but the SEO _home_ was not.
2. **`/app/content/asset/[id]`** — `MOCK_ASSET` (reachable from a Calendar row click). Ungated.
3. **`/app/content/brief/[id]`** — `MOCK_BRIEF` + `MOCK_CITEMIND_PREVIEW`. Ungated.
4. **`/app/content/orchestrate/[actionId]`** — `MOCK_TRIGGER_ACTIONS` et al. Ungated.

Everything else routed is real-API/honest-empty, behind an intentional OFF-flag `ComingSoonGate` (PR Pitches, Content editor routes, Analytics Content/Reports, some Settings), or **dead unmounted code** (`pr-work-surface/views/*`, `cc-mock-data` consumers, `AnalyticsDashboard`, `TemplateLibrary`). Content Overview tab is a benign _zeroed_ honest-empty stub (real SAGE queue + empty constants). Content Derivatives (LLM generation) remains deferred as expected.

### 🟡 Funnel

5. **Audit→dashboard first-session welcome — NOT built.** Audit EVI + top gaps are persisted to `audit_sessions`, but **nothing on the dashboard reads them back**: a magic-link user lands in a generic Command Center showing EVI `0`/Critical (it reads the in-product EVI endpoint, not the audit). Real first-impression hole for the primary acquisition path. (Funnel itself is otherwise good: email required upfront + server-validated, 1-scan/email/24h rate limit, blur gate removed, Resend email — the only funnel caveats are cosmetic email branding + rate-limit fails-open/TOCTOU.)

### 🟢 Fast-follow / non-gating

6. **Annual billing** — advertised ($959) but no Stripe annual price / annual checkout support yet (net-new build).
7. **80% usage-warning emails** — `isApproachingLimit()` exists; cron not built.
8. **Migration-apply CI guard** — process gap (has bitten prod before).
9. **Held canon reconciliation (D040)** — `CRAFT_EXECUTION_MODEL` + `CITEMIND_SYSTEM` plan-tier tables still order `Starter→Growth→Pro` (retired); banners flag them; column reorder + per-tier Scale CiteMind cap values await founder review. Add the Scale tier to `PLANS_LIMITS_ENTITLEMENTS.md` (still lists only Starter/Pro/Enterprise).
10. **Minor cleanups:** `configureRenderProduction.ts` still provisions a `SENDGRID_API_KEY` (post-retirement leftover); `SendGridEmailProvider` class still selectable (unused).

---

## Founder-decision gates

- **Autopilot** (`AUTONOMOUS_AUTOPILOT_ENABLED`): **OFF** for launch (chosen). Do NOT flip autonomously.
- **Outreach provider**: **OPEN** — Resend live in prod; the human review-gate is armed. Real journalist sends work (gated by per-pitch approval, fail-closed). Staging is on `EMAIL_PROVIDER=stub` (simulates).

---

## Recent program history (this arc, newest first)

| PR       | What                                                                    |
| -------- | ----------------------------------------------------------------------- |
| #180     | fix(billing): settings-page prices + `getOrgTier` org→plan lookup       |
| #179     | refactor(billing): Growth→Scale rename (top self-serve tier, above Pro) |
| #178     | fix(billing): Scale tier caps must exceed Pro (resolve inversion)       |
| #177     | feat(llm): cost router — task→least-cost-model tiers (+ canon)          |
| #176     | chore(canon): AUTOMATE→CRAFT in always-loaded boot files                |
| #172–175 | Resend outbound + inbound reply capture; SendGrid retired               |
| #162–169 | PR Journalists (identity-only) + closed-loop reply capture live         |
| #128–158 | Wave-2 surface wiring across SEO / PR / Content / Command Center        |

Prior Wave-2 detail: `launch-readiness-status` memory (note: written Aug 9–13, predates this arc). GTM/pricing rationale: `pricing-gtm-decisions` memory. Canon-vs-boot drift: `canon-drift-register` memory.

---

## Brand architecture — LOCKED

```
SAGE™     = Signal · Authority · Growth · Exposure   (the "Growth" here is a SAGE
            dimension — NOT the retired plan name; do not "fix" it)
CRAFT™    = Coordinated Response & Action Flow Technology   (renamed from AUTOMATE)
CiteMind™ = AI citation intelligence engine (compound word, not acronym)
EVI™      = Earned Visibility Index (0–100)
```

**Loop:** `SAGE™ → CRAFT™ → CiteMind™ → EVI™ → SAGE™`
**System statement:** SAGE identifies the gap. CRAFT closes it. CiteMind confirms it happened. EVI tells you if it's working.

> ⚠️ Naming drift watch: the always-loaded CLAUDE.md / `.claude/rules` were fixed to CRAFT in #176, but re-verify each session — this pair has re-seeded "AUTOMATE" drift before (`canon-drift-register`).

---

## Repo / file quick reference

```
apps/dashboard/src/
  app/(marketing)/            ← pravado.io: /, /platform, /models, /pricing, /about, /audit
  app/app/                    ← app.pravado.io product surfaces
    command-center/           ← 3 panes: ActionStream | IntelligenceCanvas | StrategyPanel (all real)
    seo/                      ← Overview (MOCK — gap #1) + citations/competitors/topics/recommendations (real)
    pr/                       ← action-queue + journalists + outreach (real); pitches gated
    content/                  ← library/calendar/insights (real); asset|brief|orchestrate [id] (MOCK — gaps #2–4)
    analytics/                ← EVI/PR/SEO real; content/reports gated
  components/                 ← surface components (see gaps for mock hotspots)
apps/api/src/
  services/billing/           ← planLimitsService (authority), priceIdMap, bootstrapStripeBilling
  services/mode/modeService   ← resolveOrgPlanSlug (org→plan via org_billing_state)
  services/governanceGateways ← send-cap tiering (getOrgTier, fixed #180)
  services/outreachDeliverabilityService ← Resend provider + chokepoint
  routes/siloTaxAudit/        ← audit scan+claim+email (email upfront, rate-limited, Resend)
packages/
  feature-flags/src/flags.ts  ← *_WIRED surface gates
  validators/src/env.ts       ← env schema (STRIPE_PRICE_SCALE, EMAIL_PROVIDER, LLM_MODEL_*)
  utils/src/llmRouter.ts       ← task→model cost router
```

---

## MCP / tooling notes

- **Supabase MCP** and **exa** require interactive auth — unavailable in headless/non-interactive sessions. Use the Supabase Management API (curl) for prod SQL instead.
- **Render MCP** available; or use the REST API directly with the `rnd_` token.
- Chrome MCP drops in long sessions — use Claude Code for edits, MCP for visual verification only.
- Verify locally before pushing (CI is slimmed): `pnpm --filter <pkg> typecheck` + targeted `vitest`. `pino-pretty` fails to load under vitest — run API tests with `NODE_ENV=production`. Rebuild `@pravado/feature-flags` before trusting dashboard typecheck on new `*_WIRED` flags.

---

_Update this file at the end of any session that changes program state, before closing._
