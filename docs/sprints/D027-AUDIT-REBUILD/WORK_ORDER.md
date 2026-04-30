# WORK ORDER — D027 Phase 1: Three-Path EVI Scorecard Audit Rebuild

**Issued:** 2026-04-28
**Reference:** D027 in `docs/canon/DECISIONS_LOG.md`
**Priority:** P0 (beta-blocking — current `/audit` ships Silo Tax framing which contradicts strategic positioning)
**Estimated time:** 28-41 hours of Claude Code execution time across six phases. **This work order is NOT a single Claude Code session.** Each phase is a separate Claude Code session with its own commit and architect checkpoint.

---

## Required Reading Before Starting Any Phase

Per CLAUDE.md Required Boot Sequence:
1. `/ARCHITECT_BRIEFING.md`
2. `/SESSION_PRIMER.md`
3. `/docs/canon/DECISIONS_LOG.md` — especially D027 (the decision driving this work order) and D025/D026 for canon hygiene context
4. `/docs/canon/EARNED_VISIBILITY_INDEX.md` — canonical EVI bands and methodology
5. `/docs/canon/CITEMIND_SYSTEM.md` — for AI Citation Authority pillar measurement
6. `/docs/canon/SAGE_v2.md` and `/docs/canon/CRAFT_v2.md` — for orchestration narrative
7. `/docs/skills/PRAVADO_DESIGN_SKILL.md` — UI standards, icon library, DS v3.1 tokens

---

## Settled Context (Do Not Re-Open)

These are decided per D027. Do not ask the architect to revisit:

- Silo Tax framing is replaced. All "Silo Tax" / "monthly cash loss" / "risk premium" / "authority leakage" / "PPC replacement" / "hallucination overhead" customer-facing copy is removed. Internal field names in the database may reference Silo Tax for one migration cycle for backward compatibility, but customer surfaces show none of it.
- EVI is the headline metric. `Earned Visibility Index` per canon. No "Entity Visibility Index" expansion anywhere.
- No dollar figures in the free audit. No monthly tax, no odometer, no projected loss. CTAs are "Book a call" and "Save to dashboard" — never an upgrade pitch with a number.
- Three-pillar decomposition is non-negotiable. PR Authority, Content Authority, AI Citation Authority. Top-line EVI is the composite. Variance across pillars is the orchestration story.
- Three entry paths, one audit. `/audit/pr`, `/audit/content`, `/audit/ai` are entry-pillar-specific landing pages. `/audit` is the neutral generic. All four submit to the same backend endpoint and produce the same scan; the results page templating differs only in pillar order and narrative framing.
- PR pillar is the halo investment. `/audit/pr` ships to production-quality bar first. `/audit/content` and `/audit/ai` ship with shared template but lower polish budget. `/audit` (generic) is functional but not the marketing centerpiece.
- Icon library is `@phosphor-icons/react` per design skill (matches commit `c8fcaf7`).
- Salvaged from `c8fcaf7`: funnel mechanics (email upfront, rate limit 1/email/24h, server-side validation, single-transaction scan-and-claim, removed blur gate, EVI 4-band canonical thresholds, Phosphor icons, email template Outlook table layout). All this stays. What gets undone is the Silo Tax framing and the single-pillar AEO-only scoring.

---

## Phase Decomposition

| Phase | Scope | Files | Est. time |
|-------|-------|-------|-----------|
| 1A | Backend: three-pillar audit scoring API + schema | `apps/api/src/routes/siloTaxAudit/index.ts` (rewrite), new Supabase migration | 6-8 hr |
| 1B | Frontend: rebuild `/audit` results renderer for three-pillar output | `apps/dashboard/src/app/(marketing)/audit/page.tsx` | 6-8 hr |
| 1C | Frontend: PR entry path `/audit/pr` (production-quality bar) + shared component extraction | new `/audit/pr/page.tsx`, new `EVIScorecardResults.tsx`, new `AuditForm.tsx` | 8-12 hr |
| 1D | Frontend: Content + AI entry paths (shared template polish) | new `/audit/content/page.tsx`, new `/audit/ai/page.tsx` | 4-6 hr |
| 1E | Email template: three-pillar EVI rebuild | `apps/api/src/routes/siloTaxAudit/index.ts` (`buildAuditClaimEmailHtml` only) | 2-3 hr |
| 1F | Marketing surfaces cleanup: remove Silo Tax references from homepage, nav badge, About, Pricing | `apps/dashboard/src/app/(marketing)/page.tsx`, layout, pricing | 2-4 hr |

Sequencing: 1A first. 1B after 1A merges. 1C after 1B merges (architect checkpoint). 1D, 1E, 1F can run in parallel after 1C merges.

---

## Phase 1A — Backend: Three-Pillar Audit Scoring API + Schema

### Goal

Replace single-pillar Silo Tax scoring with three-pillar EVI decomposition. Same `/api/v1/audit/scan` endpoint surface (do not break URL contract). Same single-transaction flow (scan → user → org → audit_session → magic link → email). Different scoring methodology, different response schema, different database columns.

### Response schema

The API returns a `ScanResult` with: top-line `evi_score` (0-100) and `evi_band` (At Risk / Emerging / Competitive / Dominant); a `pillars` object containing `pr`, `content`, and `ai`, each shaped as a `PillarScore` with fields `score` (0-100), `band` (canonical 4-band), `signals` (JSONB key-value evidence map), and `gaps` (array of `{title, description, severity, remediation}`); a `variance` object with `spread` (high minus low pillar score), `leading_pillar`, `lagging_pillar`, and `orchestration_opportunity` (2-3 sentence narrative); a `benchmark` object with `category_quartile` (1-4 or null) and `category_label` (string or null); `scan_metadata` (brand_url, competitor_urls, scanned_at ISO timestamp, engines_consulted array); and `magic_link_sent` (boolean).

Define the TypeScript interfaces in the route file. Validate server-side; if LLM returns malformed JSON, retry once, then 502 with friendly error.

### Composite EVI formula

evi_score = (pr.score * 0.40) + (content.score * 0.35) + (ai.score * 0.25)

Weights match canonical V/A/M weighting in EVI_MATHEMATICS.md (40/35/25). Document the parallelism in code comment so future readers understand: in-product EVI uses V/A/M from CiteMind/CRAFT signals; audit EVI uses pillar weighting from one-time scan signals. Same scale, same bands, same weights.

### LLM prompting

Replace existing Silo Tax system prompt. Claude Haiku produces structured JSON for three pillars. The prompt:

1. Analyzes brand URL and competitor URLs.
2. PR Authority: estimates domain authority of likely citing sites, infers earned media frequency from homepage content (press mentions, awards, named-journalist quotes), scores 0-100 with 3-5 specific gaps.
3. Content Authority: assesses topical coverage breadth, schema completeness, content freshness signals, scores 0-100 with 3-5 specific gaps.
4. AI Citation Authority: simulates 5-10 representative buyer-intent queries for the brand's category, predicts citation rates across 5 major engines (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot), assesses entity disambiguation risk vs competitors, scores 0-100 with 3-5 specific gaps.
5. Each gap pairs with a "remediation" string describing what Pravado's CRAFT layer would do (e.g., "Generate weekly press release distributing through the 283K-profile media database with named-journalist matching").
6. Computes composite EVI per the formula above.
7. Identifies variance, leading pillar, lagging pillar.
8. Generates orchestration_opportunity narrative — 2-3 sentences explaining why the variance matters, in buyer's language.

The prompt must explicitly forbid:
- Dollar figures
- "Silo Tax" terminology
- Time-bounded loss claims ("you're losing $X per month")
- Scareware framing

Output format: strict JSON matching `ScanResult` schema.

### Schema migration

New file: `apps/api/supabase/migrations/94_audit_sessions_three_pillar.sql` (use the next available migration number if 94 is already taken).

The migration adds these nullable columns to `audit_sessions`: `pr_score INTEGER`, `pr_band TEXT`, `pr_signals JSONB`, `pr_gaps JSONB`, the same four columns for `content_*` and `ai_*`, plus `variance_spread INTEGER`, `leading_pillar TEXT`, `lagging_pillar TEXT`, `orchestration_opportunity TEXT`, `category_quartile INTEGER`, `category_label TEXT`, and `entry_path TEXT`.

Add a CHECK constraint: `entry_path IN ('pr', 'content', 'ai', 'generic') OR entry_path IS NULL`.

Add an index on `entry_path` for funnel analytics: `CREATE INDEX IF NOT EXISTS idx_audit_sessions_entry_path ON audit_sessions(entry_path)`.

Legacy Silo Tax columns (`silo_tax_monthly`, `monthly_cash_loss`, `risk_premium`, `authority_leakage`, `ppc_replacement`, `hallucination_overhead`) stay nullable for now. A subsequent janitorial migration drops them after a deprecation window.

### ScanBody update

Add `entry_path` field to `ScanBody`, optional, default `'generic'`. Frontend passes it based on which sub-page submitted. Server validates against enum.

### Acceptance criteria

- All Silo Tax math removed from API route
- Three-pillar scoring implemented with structured LLM output validation
- Composite EVI formula uses canonical 40/35/25 weighting, code comment documents parallel to V/A/M
- LLM prompt explicitly forbids dollar figures and Silo Tax terminology
- New Supabase migration adds three-pillar columns + entry_path with CHECK constraint
- Existing rate-limit, single-transaction, magic-link mechanics from c8fcaf7 preserved unchanged
- `pnpm --filter @pravado/api typecheck` passes (no new errors in modified file)
- Single commit, push

### Stop conditions

- If LLM cannot produce reliable structured three-pillar output after prompt iteration, stop and report — may need to switch to Sonnet for this scan or use function-calling instead of JSON mode
- If existing audit_sessions rows would be broken by the migration, stop — design a backfill before applying

---

## Phase 1B — Frontend: Audit Results Renderer

### Goal

Rebuild the results step of `/audit/page.tsx` to render three-pillar output. Strip all Silo Tax UI. Preserve input and scanning steps from c8fcaf7.

### Removed

- All Silo Tax UI (dollar odometer, "X critical gaps" bar, monthly cash loss display, component tiles)
- All "Silo Tax" / "monthly cash loss" / "$X/month" / loss-aversion framing copy
- The `total_authority_void` narrative paragraph

### Added

- Top-line EVI score with canonical band badge (use `eviBand()` helper already in file from c8fcaf7)
- Three pillar score cards (PR / Content / AI) — each shows score, band, top 2-3 gaps with severity badges and remediation preview
- Variance visualization — horizontal bar showing spread between leading and lagging pillar, orchestration_opportunity narrative below
- Category benchmark line — only render when `benchmark.category_quartile` is non-null
- "Book a call" primary CTA + "Save to dashboard" secondary CTA. No upgrade pitch with dollar figure.

### Pillar order

Read `entry_path` from URL or scan submission:
- `'pr'` → PR first, then Content, then AI
- `'content'` → Content first, then PR, then AI
- `'ai'` → AI first, then PR, then Content
- `'generic'` or unspecified → PR, Content, AI (default)

Variance section appears AFTER all three pillars regardless of order.

### Acceptance criteria

- All Silo Tax UI removed from results step
- Three pillar cards render with score, band, gaps, remediation
- Top-line EVI prominent with canonical band
- Variance section with orchestration_opportunity narrative
- Category benchmark renders only when data present
- CTAs are "Book a call" + "Save to dashboard" — no dollar figures
- Pillar ordering responds to entry_path
- Existing input + scanning steps unchanged
- DS v3.1 token compliance, Phosphor icons
- Build passes
- Single commit, push

---

## Phase 1C — Frontend: PR Entry Path (Halo Pillar)

### Goal

Build `/audit/pr` to production-quality bar. Highest creative bar of the sprint. Architect checkpoint required before Phase 1D begins.

### Page structure

1. Hero — eyebrow "FOR PR LEADERS", headline speaking PR-specific pain, subhead naming structural problem (placement counts that don't translate to authority that doesn't compound). Primary CTA: form (URL + email + name + company), submits with `entry_path='pr'`.

2. Problem statement (Layer 1) — names the structural problem in PR vocabulary. ~80 words.

3. Why this is structural (Layer 2) — Cision shows mentions, Muck Rack shows journalists, neither knows what content the PR work drove or whether AI engines associate the brand with those topics. Silos baked into tool stack.

4. The reveal (Layer 3) — three pillars credentialed. PR pillar gets longest treatment (Pravado standalone vs Cision/Muck Rack). Content and AI briefer. Orchestration mechanism (SAGE/CRAFT/CiteMind) named as a class of capability impossible without shared schema.

5. Audit form repeat — sticky on scroll or repeated mid-page, with `entry_path='pr'`.

6. Social proof / category positioning — comparison points to Cision/Muck Rack. 283K-profile database advantage. Placeholder section if no real testimonials yet.

7. FAQ — 4-6 Q&As specific to PR buyers ("How is this different from Cision?", "Will this replace my media database?", "What's an Earned Visibility Index?").

8. Footer CTA — form one more time or "Book a call" direct contact.

### Shared component extraction

Extract from `/audit/page.tsx`:
- `apps/dashboard/src/components/marketing/EVIScorecardResults.tsx` — takes `scanResult` and `entryPath` props, renders results identically across all four entry paths
- `apps/dashboard/src/components/marketing/AuditForm.tsx` — takes `entryPath` and optional `compact` prop

Refactor `/audit/page.tsx` and `/audit/pr/page.tsx` to use both shared components.

### Acceptance criteria

- `/audit/pr` exists and renders correctly
- Form submission includes `entry_path: 'pr'`
- Shared `EVIScorecardResults` and `AuditForm` extracted, used by `/audit` and `/audit/pr`
- Page follows layered messaging architecture (problem → structural → reveal → social proof)
- Hero speaks PR-buyer vocabulary specifically; no AEO leakage
- DS v3.1 compliance, Phosphor icons, mobile responsive
- Build passes
- Single commit, push

### Stop conditions

- If hero/problem statement copy can't reach the bar of "PR-buyer recognizes their lived experience in 30 seconds" — flag for architect copy review before shipping
- If shared component extraction would require destructuring patterns that introduce new TypeScript errors, stop and refactor

---

## Phase 1D — Frontend: Content + AI Entry Paths

### Goal

Build `/audit/content` and `/audit/ai` using shared template extracted in 1C. Polish bar: "good and shippable" — not the production-quality bar of `/audit/pr`.

### `/audit/content/page.tsx`

Adapt 1C structure with content-buyer vocabulary:
- Hero speaks to HubSpot/Contently refugees — content authority, why content isn't compounding
- Problem statement names structural content silo
- Reveal gives Content pillar longest treatment, PR and AI briefer
- FAQ specific to content buyers

### `/audit/ai/page.tsx`

Adapt for AEO/SEO buyers (Semrush/Profound/Search Atlas refugees):
- Hero reframes AEO as a symptom, not a strategy
- Problem statement: AI visibility is what shows up; AI citation authority is what causes it
- Reveal gives AI pillar longest treatment, but pivots to cross-pillar dependency
- FAQ specific to AEO buyers, including direct comparison to Semrush AI Visibility Score

Both reuse `AuditForm` and `EVIScorecardResults` from 1C.

### Acceptance criteria

- Both pages exist, render correctly, submit with correct `entry_path`
- Both reuse shared components from 1C
- Content speaks content-buyer vocabulary; AI speaks AEO-buyer vocabulary
- No cross-leakage of pillar-specific framing between pages
- AI page reframes AEO as symptom-not-strategy
- DS v3.1 compliance, build passes
- Single commit, push

---

## Phase 1E — Email Template: Three-Pillar EVI

### Goal

Replace Silo Tax email content with three-pillar EVI scorecard. Preserve all Outlook compatibility, footer, CiteMind, subject line improvements from c8fcaf7.

### Email body changes

Remove:
- "Your Silo Tax: $X/month" framing
- Dollar-loss numbers
- Component breakdown (risk premium / authority leakage / etc.)

Add:
- Top-line EVI score with canonical band
- Three pillar mini-cards (table-based, Outlook-safe layout from c8fcaf7) — pillar name, score, band
- Top 1 gap per pillar with remediation preview
- Variance summary (1-2 sentences from `orchestration_opportunity`)
- Magic link CTA: "Open your full scorecard"

Subject line drops "Silo Tax" reference: "Your EVI score and earned visibility breakdown — ${name}"

### Acceptance criteria

- Email body shows EVI + three pillars, not Silo Tax
- Outlook-safe table layout preserved
- Footer ("Authority Orchestration Platform") and CiteMind notice unchanged from c8fcaf7
- Subject line drops "Silo Tax" reference
- Magic link CTA action-oriented
- No dollar figures anywhere
- API typecheck clean
- Single commit, push

---

## Phase 1F — Marketing Surfaces Cleanup

### Goal

Remove all Silo Tax references from marketing surfaces outside the audit pages. Minimum cleanup needed for D027 Phase 1; broader homepage/Platform/Models/Pricing rebalance is Phase 2 (separate work order).

### Files

- `apps/dashboard/src/app/(marketing)/page.tsx` — remove "FREE Silo Tax Audit" badge, update audit CTAs to point to correct paths, replace "Silo Tax" copy with "earned visibility scorecard" or similar
- `apps/dashboard/src/app/(marketing)/layout.tsx` (or wherever marketing nav lives) — remove Silo Tax badge
- `apps/dashboard/src/app/(marketing)/pricing/page.tsx` — audit and replace any Silo Tax references
- About / Models / Platform — search for "Silo Tax" / "monthly cash loss" / "loss" — replace contextually. Do NOT do full positioning rewrite (that's Phase 2).

### Acceptance criteria

- Zero "Silo Tax" references in customer-facing marketing copy (verified by grep)
- "FREE Silo Tax Audit" badge removed from nav
- All audit CTAs point to correct paths
- Build passes
- Single commit, push

### Stop conditions

- If grep finds Silo Tax references in places not listed above (legal pages, terms of service), flag for architect review
- If audit-CTA targeting decision (which sub-page does homepage hero point to?) is not obvious, ask architect

---

## Phase Sequencing and Architect Checkpoints

- After Phase 1A: Architect reviews API response schema and LLM output quality on test scans before Phase 1B starts.
- After Phase 1C: Architect reviews `/audit/pr` page in production. Highest polish bar — copy and visual approval before Phase 1D.
- After all phases: Architect runs end-to-end test: visit each entry path, submit a real scan, verify email, verify magic link, verify dashboard handoff.

---

## Rollback Plan

Each phase commits independently. If any phase introduces regressions, that phase's commit can be reverted without unwinding earlier phases. Legacy Silo Tax database columns kept nullable through Phase 1 — safety net for API rollback. Pre-D027 audit (commit `c8fcaf7`) remains in git history.

---

## Out of Scope

- Marketing site rebalance beyond Silo Tax cleanup (homepage hero, Platform, Models, Pricing copy passes) — Phase 2, separate work order, post-acquisition-data
- AI Visibility ROI Projector (paid-tier, user-input-driven) — Phase 3, post-beta
- Sales sequence personalization based on entry_path — sales operations work
- Category-relative benchmark calibration data collection — separate work
- Sapient Digital `/audit/agency` entry path — parked, post-beta consideration

---

## Final Report (per phase)

Each phase reports:
1. Commit SHA
2. Files modified (list with line counts)
3. Migration filename if created
4. TypeScript validation result
5. Build validation result
6. Push confirmation
7. Acceptance criteria checklist (each item ✅ or noted)
8. Anomalies surfaced
9. Recommended architect review focus areas before next phase

---

*End of work order.*
