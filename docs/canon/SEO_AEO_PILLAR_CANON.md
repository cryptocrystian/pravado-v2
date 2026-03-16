# SEO / AEO PILLAR CANON
**Version:** 1.1  
**Canon Status:** ACTIVE — Full pillar specification  
**Authority:** Extends `SEO_AEO_CONTINUITY_ADDENDUM.md` (invariants) and `CITEMIND_SYSTEM.md`  
**Supersedes:** Nothing — first full spec for this pillar  
**Last Updated:** 2026-02-19
**Changes in v1.1:** Added Section 6.5 — Mode Layout Contracts. Defines three distinct UI environments (Manual/Copilot/Autopilot) with full component trees, tab sets, information hierarchies, and render conditions for each mode.

> **Reading order:** `SEO_AEO_CONTINUITY_ADDENDUM.md` defines what is forbidden and what invariants must hold. This document defines what to build. Both are required reading before any SEO/AEO implementation.

---

## 1. The Three-Layer Model

The SEO/AEO pillar is not a keyword tool with an AI tab bolted on. It is a **three-layer authority system** where each layer builds on the one below it.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: SHARE OF MODEL                                    │
│  "Brand is impossible to ignore in AI answers"              │
│  Metrics: AI citation rate, entity strength, Share of Voice │
│  Timeframe: 90–365 days                                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: AEO — Answer Engine Optimization (Main Event)     │
│  "Content is citation-worthy by design"                     │
│  Metrics: CiteMind score, ingestion readiness, AEO ranking  │
│  Timeframe: 30–90 days                                      │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: TRADITIONAL SEO (Foundation Bridge)               │
│  "Technical health and search visibility maintained"        │
│  Metrics: rankings, crawl health, Core Web Vitals, backlinks│
│  Timeframe: Ongoing / maintenance                           │
└─────────────────────────────────────────────────────────────┘
```

### Why All Three Matter

**Layer 1 alone** is what Semrush and Ahrefs do. Maintenance work. Necessary but not a competitive moat.

**Layer 2 alone** is what most "AEO" tools offer — monitoring where you appear in AI answers, after the fact. Measurement, not building.

**Layer 3 alone** is unmeasurable without Layers 1 and 2 doing the underlying work.

**Pravado's position:** The only platform that builds all three simultaneously, using the same content as the feedstock for traditional rankings, AI citation eligibility, and entity authority — through CiteMind.

---

## 2. Layer 1 — Traditional SEO (Foundation Bridge)

### 2A. Purpose

Layer 1 is maintenance infrastructure, not Pravado's primary value. It must be:
- **Competent** — Users should not need another tool for technical SEO
- **Connected** — Every Layer 1 action must show its Layer 2/3 impact
- **Automated** — Routine technical checks should run on Autopilot

### 2B. Core Capabilities

| Capability | Description | Mode Ceiling | CiteMind Engine |
|------------|-------------|--------------|----------------|
| Technical site audit | Crawl errors, broken links, redirect chains, 4xx/5xx | Autopilot | — |
| Core Web Vitals monitoring | LCP, CLS, FID/INP tracking | Autopilot | — |
| Keyword rank tracking | Position tracking for target keyword set | Autopilot | — |
| Backlink monitoring | New/lost backlinks, referring domain authority | Autopilot | Engine 3 |
| Schema validation | Detect invalid or missing structured data | Autopilot | Engine 1 |
| Internal link analysis | Orphan pages, link equity distribution | Copilot | — |
| On-page optimization | Meta titles, descriptions, heading structure | Copilot | Engine 1 |
| Canonical URL management | Duplicate content, canonical conflicts | Manual | — |
| Robots.txt / sitemap | Crawl directives, indexation control | Manual | Engine 1 |
| Redirect management | 301/302 chains, link equity preservation | Manual | — |

### 2C. The Bridge Requirement

Every Layer 1 metric must bridge to Layer 2. This is what differentiates Pravado from pure SEO tools:

| Layer 1 Finding | Layer 2 Bridge | Display |
|----------------|---------------|---------|
| Missing schema markup | "This page's CiteMind score is limited by missing FAQ schema. Fix would increase AI citation eligibility by est. +18%" | Shown inline with the technical finding |
| Low page authority | "Weak authority signal reduces citation likelihood. 3 PR opportunities identified that could close this gap" | Routes to PR pitch pipeline |
| Thin content detected | "Content depth below CiteMind Engine 1 threshold. Brief suggested to expand topical coverage" | Routes to Content pillar with pre-filled brief |
| Broken internal links | "Link equity not reaching 4 high-citation-potential pages" | Shows impacted CiteMind scores |

**Rule:** A Layer 1 finding with no Layer 2 implication is displayed at secondary priority. Layer 1 findings with Layer 2 impact are surfaced at primary priority.

### 2D. What Layer 1 Is NOT

- Not a replacement for Screaming Frog for enterprise technical crawls
- Not a full backlink analysis tool for SEO agencies
- Not a keyword research platform for content discovery
- Not the primary reason a customer buys Pravado

Layer 1 is the foundation that makes Layers 2 and 3 possible. It should feel complete, not flagship.

---

## 3. Layer 2 — AEO: Answer Engine Optimization (Main Event)

### 3A. The AEO Mental Shift

Traditional SEO asks: "Does this content rank for this keyword?"  
AEO asks: "Will an AI system cite this content when answering a question in this domain?"

These are different questions with different success conditions:

| Dimension | Traditional SEO | AEO |
|-----------|----------------|-----|
| Audience | Search engine algorithm | LLM training data + retrieval |
| Success condition | Top 10 ranking | Direct citation in AI answer |
| Content format | Optimized for keywords + CTR | Optimized for entity clarity + citability |
| Trust signal | Backlinks | Entity authority + structured data |
| Decay model | Algorithm updates | Training data refresh cycles |
| Measurement lag | Days to weeks | Weeks to months |

### 3B. CiteMind Governs AEO

AEO is not a separate system — it is the output of CiteMind Engine 1 applied to content. Every AEO capability flows through CiteMind:

```
Content Asset
     │
     ▼
┌─────────────────────────────────┐
│  CiteMind Engine 1              │
│  AI Ingestion & Citation        │
│                                 │
│  • Schema generation            │
│  • Entity extraction            │
│  • Ingestion readiness score    │
│  • Citation eligibility score   │
│  • Structured data injection    │
│  • IndexNow / Google API ping   │
└──────────────┬──────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
 AEO Score          EVI Update
 (0–100)            (Visibility +
                     Authority)
```

### 3C. AEO Score Definition

The AEO Score is a per-asset composite score (0–100) measuring citation eligibility:

```
AEO Score = (Entity Clarity × 0.30) + (Schema Coverage × 0.25) + 
            (Semantic Depth × 0.25) + (Authority Signal × 0.20)
```

| Component | Definition | How to Improve |
|-----------|------------|---------------|
| **Entity Clarity** | How clearly the content establishes who/what/when/where for AI extraction | Add structured entity mentions, avoid ambiguous pronouns |
| **Schema Coverage** | Percentage of applicable schema types present and valid | CiteMind Engine 1 auto-generates; user approves |
| **Semantic Depth** | Breadth and depth of topical coverage relative to authoritative sources | Content brief expansion via Content pillar |
| **Authority Signal** | Referring domain authority + internal link equity + entity recognition | PR coverage + internal linking strategy |

**AEO Score Bands:**

| Range | Status | Meaning |
|-------|--------|---------|
| 0–40 | Not Eligible | AI systems are unlikely to cite this content |
| 41–60 | Partially Eligible | Cited occasionally; inconsistent |
| 61–80 | Citation-Ready | Regularly cited; competitive position |
| 81–100 | Citation-Dominant | Category authority; cited by default |

### 3D. AEO Capabilities

| Capability | Description | Mode Ceiling | Auto-trigger |
|------------|-------------|--------------|-------------|
| AEO Score calculation | Per-asset CiteMind Engine 1 run | Autopilot | On publish |
| Schema auto-generation | NewsArticle, FAQ, HowTo, Organization JSON-LD | Autopilot | On publish |
| Entity map validation | Verify entity relationships are correctly structured | Copilot | Weekly |
| Citation eligibility report | Gap analysis vs. top-cited competitors | Copilot | Monthly |
| Ingestion readiness check | Pre-publish AEO gate | Copilot | On draft complete |
| AEO brief generation | Content brief focused on citation eligibility | Copilot | On gap detection |
| IndexNow / Google API | Instant indexation signal post-publish | Autopilot | On publish |

### 3E. Pre-Publish AEO Gate

Before content is published, CiteMind Engine 1 runs an ingestion readiness check. This is non-optional:

```
Draft Complete → CiteMind Engine 1 Check → AEO Score Returned
                                                │
                           ┌────────────────────┴────────────────────┐
                           ▼                                         ▼
                    Score ≥ 41                               Score < 41
                    (Eligible)                               (Not Eligible)
                           │                                         │
                    Allow publish              Block publish with explanation:
                    (with score               "This content is unlikely to be
                     displayed)               cited by AI systems. [View gaps]
                                              [Publish anyway — bypass]"
```

**Bypass is always permitted** — users can publish below-threshold content. The gate is advisory, not a hard block. But the score and explanation must be shown.

### 3F. The AEO ↔ Content Pillar Loop

AEO is not self-contained. It feeds a continuous improvement loop with the Content pillar:

```
CiteMind Engine 1 → Low AEO Score on Asset
         │
         ▼
Gap Analysis: "Entity clarity gap — competitor content scores 78 vs your 42"
         │
         ▼
Content Brief Generated → Sent to Content Pillar Work Queue
         │
         ▼
Content Revised → Re-evaluated by CiteMind → AEO Score Increases
         │
         ▼
EVI Authority component updated → SAGE recalculates recommendations
```

This loop is the core product motion for AEO. It must be visible to users, not happening silently.

---

## 4. Layer 3 — Share of Model (The Moat)

### 4A. Definition

**Share of Model** measures what percentage of AI-generated answers in a brand's target topic domain include a citation to or mention of that brand.

```
Share of Model = (Brand AI Citations) / (Total AI Citations in Topic Domain) × 100
```

This is the closest AI equivalent to traditional "Share of Voice" in media — but for the emerging category of AI answer surfaces (ChatGPT, Claude, Perplexity, Gemini, Bing Copilot).

### 4B. Why It's the Moat

Share of Model is hard to game and slow to build. It depends on:
1. **Content volume and quality** (Content pillar)
2. **Entity authority** (PR coverage creating citation signals)
3. **Technical ingestion readiness** (AEO / CiteMind)
4. **Time** — LLM training cycles mean improvements take weeks to months to register

Once a brand achieves dominant Share of Model in a topic cluster, the compounding effect makes it extremely difficult for competitors to displace them — because LLMs preferentially cite already-cited sources.

### 4C. Share of Model Measurement

CiteMind Engine 3 powers Share of Model tracking:

| Measurement | Method | Cadence | Confidence |
|-------------|--------|---------|------------|
| Brand citation rate | Query sampling across topic clusters | Daily | 80–90% |
| Competitor citation rate | Same methodology, competitor entities | Daily | 80–90% |
| Topic Share of Model | Brand / (Brand + Competitors) | Weekly | 85% |
| Citation sentiment | Context analysis of citations | Weekly | 75% |
| Citation placement | Position in AI answer (primary vs. footnote) | Weekly | 70% |

**Topic cluster methodology:** Pravado maintains a query set for each defined topic cluster. Engine 3 samples these queries daily across monitored AI surfaces, records citations, and aggregates Share of Model.

### 4D. Share of Model Visualization

Share of Model is displayed in the Intelligence Canvas (Command Center) as the primary cross-pillar metric:

```
Topic: "AI Marketing Automation"

Your Share of Model: 23% ↑4% MoM
───────────────────────────────────────────────
████████████░░░░░░░░░░░░░░░░░░░░░░  You: 23%
██████████░░░░░░░░░░░░░░░░░░░░░░░░  Competitor A: 19%
████████████████░░░░░░░░░░░░░░░░░░  Competitor B: 31%
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Others: 27%

Trend: ↑ Growing (+4% last 30 days)
Primary driver: TechCrunch coverage + blog series
Gap to leader: -8% → SAGE: "3 content gaps identified"
```

### 4E. Share of Model → SAGE Loop

Share of Model data feeds SAGE with the highest-level strategic signal:

| Share of Model Signal | SAGE Trigger | Example Action |
|----------------------|-------------|----------------|
| Declining share (-3% WoW) | Competitive alert | "Competitor B published 4 articles on this topic — brief recommended" |
| Competitor surge detected | Counter-campaign | "Competitor gained 8% share — PR + Content coordinated response drafted" |
| New topic opportunity | Expansion suggestion | "New query cluster emerging — brand unrepresented — first-mover opportunity" |
| Share gap closing | Positive reinforcement | "Share increased 4% — content series driving result — continue cadence" |

---

## 5. Competitive Landscape

### 5A. Category Map

The competitive landscape divides into four categories, each with a structural ceiling that Pravado's architecture is designed to exceed:

| Category | Representatives | Ceiling |
|----------|----------------|--------|
| **Legacy SEO tools** | Semrush, Ahrefs, Moz | Strong Layer 1, no Layer 2 or 3. Bolting AI features onto keyword tools as defensive moves. No PR pillar. |
| **Enterprise content/SEO platforms** | Brightedge, Conductor | Content + SEO unified, but no AEO scoring, no CiteMind-equivalent, no PR pillar, no Share of Model. Compete on "content drives SEO" without extending to AI citation. |
| **Pure AEO monitoring tools** | Search Atlas (LLM Visibility), Profound, Goodie | Measure citation share after the fact. No pre-publication governance. No PR pillar. No cross-pillar attribution. |
| **PR platforms** | Cision, Meltwater, Muck Rack | Strong on PR execution, no SEO/AEO connection. Don't close the PR coverage → citation authority loop. |

**The shared structural gap across all four categories:** No current competitor has all three layers working together in a single system, and none can show the causal chain across PR → Content → AEO → Share of Model. That attribution capability requires all three pillars to be instrumented in the same platform.

---

### 5B. Legacy SEO Tools (Semrush, Ahrefs, Moz)

**Where they're strong:** Layer 1 is their entire product. Keyword research, rank tracking, backlink analysis, and technical audits are mature and deeply trusted.

**Structural ceiling:**
- No AEO scoring or citation eligibility framework
- No AI citation tracking (Share of Model is invisible to them)
- No PR pillar — backlinks are treated as a technical metric, not an earned media signal
- AI features are defensive bolt-ons (Semrush's AI Writing Assistant, etc.) not architectural
- No SAGE-equivalent connecting actions across domains

**Pravado's advantage:** The entire Layer 2 and Layer 3 stack doesn't exist for them. A customer using Ahrefs + a separate PR tool + a separate AEO monitoring tool is paying for three disconnected systems with no shared intelligence layer.

---

### 5C. Enterprise Content/SEO Platforms (Brightedge, Conductor)

**Where they're strong:** Strongest structural overlap with Pravado. Content recommendations tied to SEO performance, enterprise-grade workflow and approval chains, deep analytics.

**Structural ceiling:**
- Content is optimized for keyword rankings, not AI citation eligibility
- No CiteMind-equivalent pre-publication AEO gate
- No Share of Model measurement
- No PR pillar — earned media is invisible to content/SEO loop
- Automation is workflow management, not SAGE-style cross-pillar strategic orchestration

**Pravado's advantage:** They've solved the Content ↔ SEO connection but stopped at traditional search. The AEO layer — governing content creation for citation-worthiness before publish — is entirely absent. Share of Model as a north star metric doesn't exist in their frameworks.

---

### 5D. Pure AEO Monitoring Tools (Search Atlas, Profound, Goodie)

This is the most directly positioned category — they use the same language (AEO, AI visibility, citation tracking) and target the same awareness. Search Atlas is the most fully built example.

**Search Atlas specifically:**
- **OTTO SEO:** 1-click technical SEO via pixel deployment
- **LLM Visibility:** Citation tracking across ChatGPT, Gemini, Perplexity
- **Atlas Brain:** Conversational agent across 60+ tools
- **Positioning:** "Agentic SEO and AI Visibility Start Here"
- **Target:** SEO agencies and mid-market brands
- **Pricing:** $99–$399/month

**Where this category is credible:** Sharp messaging on AI visibility, functional LLM monitoring dashboards, good positioning against legacy tools.

**The category's shared structural blindspot — measure vs. build:**  
Every tool in this category monitors AI citation share *after the fact*. They show you where you appear today. None of them govern content creation to be citation-worthy *before* publishing. There is no CiteMind Engine 1 equivalent — no pre-publication AEO gate — anywhere in this category. They sell dashboards. Pravado builds the authority.

**Additional structural gaps (applies to most tools in this category):**
- No PR pillar. "PR" features, where they exist, mean press release distribution or link building — not journalist intelligence, relationship modeling, or coverage → citation attribution.
- No cross-pillar attribution. Insights exist in separate modules. There is no SAGE layer connecting them. A user cannot see "This TechCrunch article increased our ChatGPT citation rate 18% for this query cluster."
- Automation is tactical maintenance (technical SEO fixes), not strategic command layer (AUTOMATE with approval chains, mode governance, outcome tracing).
- Agency-first architecture, not enterprise-ready. No per-pillar mode governance, no compliance-aware approval chains, no policy-based ceilings for brands with legal review requirements or multi-stakeholder workflows.

---

### 5E. PR Platforms (Cision, Meltwater, Muck Rack)

**Where they're strong:** Journalist database depth, media monitoring, coverage tracking, and distribution at scale.

**Structural ceiling:**
- Completely disconnected from SEO/AEO loop
- Coverage is tracked as a PR metric (impressions, mentions, AVE), not as an authority signal feeding AEO eligibility
- No mechanism to show how earned media coverage affects AI citation rate
- No content or SEO pillar — the PR → citation authority loop is invisible

**Pravado's advantage:** PR coverage is the #1 driver of AI citation credibility — LLMs disproportionately cite sources that authoritative media has already cited. PR platforms can't show this because they have no AEO layer. Pravado closes this loop natively.

---

### 5F. Pravado's Three Leapfrog Dimensions

These apply regardless of which competitive category a prospect is coming from:

**Dimension 1 — Causality, not correlation**  
Not just "your Share of Model dropped 3%." Also: "Share dropped because Competitor B published 4 articles that grounded entity authority better on this topic cluster. Here is the specific CiteMind action to close the gap." No competitor can show this causal chain because no competitor has all three pillars instrumented.

**Dimension 2 — Pre-publication governance**  
CiteMind Engine 1 scores content *before* it goes live, making it citation-worthy by design. Every competitor in the AEO monitoring category is reactive. Pravado is the only proactive system.

**Dimension 3 — Cross-pillar attribution**  
"This TechCrunch coverage increased ChatGPT citation rate 18% for this query cluster over 30 days." The full causal chain across PR → Content → AEO → Share of Model, visible to users in a single platform. This requires all three pillars to be in the same system — which no competitor currently is.

---

### 5G. Positioning Statement

> Every other tool tells you where you stand in AI.  
> **Pravado makes you impossible to ignore.**

The distinction holds across all four competitive categories: they are all, in different ways, measurement tools or single-pillar execution tools. Pravado is the only authority-building operating system that spans PR, Content, and SEO/AEO in a unified platform with shared intelligence.

---

## 6. Work Surface Definition

### 6A. Surface Identity

| Property | Value |
|----------|-------|
| Route | `/app/seo` |
| Pillar color | `brand-cyan` (`#00D9FF`) |
| Surface label | "SEO / AEO" |
| Current status | Stub exists — not built |
| Priority in build order | After Content completion, after Command Center second pass |

### 6B. Primary Views (Tabs)

| Tab | Purpose | Default in Mode |
|-----|---------|----------------|
| **Overview** | EVI + Share of Model + top gaps across layers | All modes |
| **AEO** | CiteMind scores, ingestion readiness, citation tracking per asset | Manual / Copilot |
| **Technical** | Layer 1 audit findings, Core Web Vitals, crawl health | Manual |
| **Intelligence** | Competitor Share of Model, narrative drift, Engine 3 data | All modes |
| **Exceptions** | *(Autopilot only)* Issues requiring human intervention | Autopilot |

**Mode-aware tab behavior:**
- Manual: All 4 tabs visible + full data
- Copilot: All 4 tabs visible; AEO tab leads with AI proposals
- Autopilot: Tabs collapse to Overview + Exceptions only; Technical and AEO hidden unless accessed deliberately

### 6C. Overview Tab Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  SEO / AEO                    [Copilot ▾]  [Explain]         │
│  IMPACT STRIP: SAGE tag | EVI 72 ↑3 | [Copilot] badge       │
│  TABS: Overview | AEO | Technical | Intelligence             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SHARE OF MODEL  (Layer 3 — top of page)                     │
│  "AI Marketing Automation" — 23% ↑4% MoM                    │
│  [Competitive bar chart] [View by topic cluster ▾]           │
│                                                              │
│  LAYER HEALTH  (three cards side by side)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ SEO      │  │ AEO      │  │ Share of │                   │
│  │ Health   │  │ Readiness│  │  Model   │                   │
│  │  82/100  │  │  61/100  │  │   23%    │                   │
│  │  ↑ Stable│  │ ↑ Growing│  │  ↑+4%    │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                              │
│  TOP GAPS  (SAGE-prioritized, executable)                    │
│  [Gap 1: FAQ schema missing on /pricing — +12% AEO est.]    │
│  [Gap 2: Competitor grounding 3 topic clusters we're not]   │
│  [Gap 3: 4 high-authority pages below CiteMind threshold]   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6D. AEO Tab Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  AEO TAB                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ASSET CITATION HEALTH  (table)                              │
│  Asset | AEO Score | Schema | Entity | Cited By | Actions   │
│  ─────────────────────────────────────────────────────────  │
│  /blog/ai-trends | 78 ✓ | ✓ | ✓ | ChatGPT, Perplexity | —  │
│  /pricing | 31 ✗ | ✗ | ~ | — | [Fix schema] [View brief]  │
│  /about-us | 55 ~ | ✓ | ✗ | Perplexity | [Improve entity]  │
│                                                              │
│  CITATION ACTIVITY  (Engine 3 feed)                          │
│  Recent citations + context + AI surface + sentiment         │
│                                                              │
│  PRE-PUBLISH QUEUE  (assets awaiting AEO check)              │
│  [Draft: Q1 Benchmark Report — AEO Score: 42 — Ready ✓]     │
│  [Draft: Competitor Analysis — AEO Score: 28 — Gaps: 3 ↗]   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6E. Impact Strip Requirements

The SEO/AEO surface Impact Strip must show:
- **SAGE tag:** Current SAGE strategic priority for SEO ("Closing authority gap in AI Marketing cluster")
- **EVI:** Current EVI score + delta (feeds from `EARNED_VISIBILITY_INDEX.md`)
- **Mode badge:** Current SEO pillar mode

---

### 6.5 Mode Layout Contracts — Three Distinct UI Environments

> **Critical principle (from `MODE_UX_ARCHITECTURE.md` §1):** Modes are not badge swaps. Manual, Copilot, and Autopilot are three different products sharing the same navigation shell. Each requires a distinct component tree, information hierarchy, and primary action set.

---

#### Manual Mode — "I Am Managing My SEO Program"

**User mental model:** Full control. User decides what to work on, what to fix, and when to act. AI is available on demand but invisible by default.

**Tab set:** Overview · AEO · Technical · Intelligence (all 4 visible, no AI filtering)

**Overview tab in Manual:**
```
┌──────────────────────────────────────────────────────────────┐
│  SEO / AEO              [Manual ▾]  [Explain]                │
│  IMPACT STRIP: SAGE tag | EVI 72 ↑3 | [Manual] badge        │
│  TABS: Overview · AEO · Technical · Intelligence             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SHARE OF MODEL  (primary metric, top of page)               │
│  Topic cluster selector  [AI Marketing Automation ▾]         │
│  Competitive bar chart — your share vs. named competitors    │
│                                                              │
│  LAYER HEALTH  (three equal cards)                           │
│  [ SEO Health 82 ] [ AEO Readiness 61 ] [ Share of Model 23%]│
│  Each card: score + delta + direct link to that tab          │
│                                                              │
│  ACTION QUEUE  (user-controlled, not AI-sorted)              │
│  Gaps and findings listed by severity                        │
│  Each row: finding + AEO bridge impact + direct action CTA   │
│  No "SAGE suggests" framing — just findings and actions      │
│  User can sort / filter / dismiss                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**AEO tab in Manual:**
- Full asset table, user-sorted (not AI-prioritized)
- Each row: asset URL · AEO Score · Schema status · Entity status · Cited By · direct action buttons
- Direct action buttons: [Fix Schema] [Improve Entity] [Generate Brief] — execute immediately, no approval step
- Pre-publish queue: assets awaiting AEO check shown with scores + bypass option
- Citation Activity feed: Engine 3 data, read-only, no AI proposals

**Technical tab in Manual:**
- Full findings list sorted by severity
- Every finding shows: issue description + AEO bridge impact (the Layer 1 → Layer 2 bridge from §2C)
- Direct fix affordances — user initiates fixes themselves
- No "Let AI handle this" CTAs — that's Copilot behavior

**What renders ONLY in Manual:**
- User-controlled sort order on all queues
- Direct action buttons without approval step
- Severity-sorted (not AI-prioritized) findings
- No SAGE proposal banner
- No approve/reject affordances

**What does NOT render in Manual:**
- SAGE proposal banner ("AI identified 3 priority actions")
- Approve/Reject affordances on findings
- Execution status / activity log panels
- Autopilot kill switch

---

#### Copilot Mode — "AI Has Identified What To Do, I Authorize It"

**User mental model:** AI has analyzed the SEO/AEO state and surfaced prioritized recommendations. User's job is to review the AI's reasoning, approve what makes sense, and reject what doesn't. User is not hunting for problems — SAGE surfaces them.

**Tab set:** Overview · AEO · Technical · Intelligence (all 4 visible; AEO leads with AI proposals)

**Overview tab in Copilot:**
```
┌──────────────────────────────────────────────────────────────┐
│  SEO / AEO              [Copilot ▾]  [Explain]               │
│  IMPACT STRIP: SAGE tag | EVI 72 ↑3 | [Copilot] badge       │
│  TABS: Overview · AEO · Technical · Intelligence             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SAGE PROPOSAL BANNER  (top of page — only in Copilot)       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ✦ SAGE identified 3 priority actions this week         │  │
│  │   Est. impact: +8 AEO points · +2% Share of Model     │  │
│  │   [Review Plan]                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  SHARE OF MODEL  (same as Manual)                            │
│                                                              │
│  LAYER HEALTH  (same three cards)                            │
│                                                              │
│  SAGE PRIORITY QUEUE  (AI-sorted, replaces Action Queue)     │
│  Each item: finding + SAGE reasoning chip + confidence       │
│  + estimated AEO/EVI impact + [Approve] [Reject] actions     │
│  Approved items enter execution queue immediately            │
│  Rejected items: SAGE learns, removes from queue             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**AEO tab in Copilot:**
- AI-sorted asset table (highest AEO improvement potential first)
- Each asset shows: SAGE reasoning chip ("Schema gap limiting citation rate")
- Confidence indicator on each AI recommendation
- Approve/Reject inline on each proposed fix — approval triggers execution
- Schema injection proposals require approval before modifying live pages (mode ceiling: Copilot per §8)
- Meta tag rewrites require approval (same ceiling)

**Technical tab in Copilot:**
- AI-prioritized findings (AEO-impact-sorted, not severity-sorted)
- Each finding: issue + AEO bridge + "Let AI fix this" [Approve] vs. "I'll handle this" [Assign to me]
- Approving "Let AI fix" queues the action in AUTOMATE with audit trail

**What renders ONLY in Copilot:**
- SAGE proposal banner at top of Overview
- AI-sorted/prioritized queue (vs. user-controlled in Manual)
- SAGE reasoning chips on every actionable item
- Confidence indicators
- Approve/Reject affordances
- "Let AI fix" CTAs on Technical findings

**What does NOT render in Copilot:**
- Direct action buttons that execute without approval
- User-controlled sort
- Execution status / activity log (AI hasn't executed yet — user is still approving)
- Autopilot kill switch

---

#### Autopilot Mode — "AI Is Executing, Show Me What Needs Me"

**User mental model:** The system is running the SEO/AEO program. User's job is oversight — monitoring health, handling exceptions, and intervening only when the system flags something it cannot resolve autonomously.

**Tab set:** Overview · Exceptions (Technical and AEO tabs hidden — system handles them)

> Note: Technical and AEO tabs remain accessible via a "View all" escape hatch on Overview for users who want to inspect, but they are not primary navigation in Autopilot. Routine work surfaces should not dominate a monitoring interface.

**Overview tab in Autopilot:**
```
┌──────────────────────────────────────────────────────────────┐
│  SEO / AEO              [Autopilot ▾]  [Explain]  [⏸ Pause] │
│  IMPACT STRIP: SAGE tag | EVI 72 ↑3 | [Autopilot] badge     │
│  TABS: Overview · Exceptions (2)                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SYSTEM STATUS  (dominates top — replaces proposal banner)   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ● Running  14 actions in queue · 3 completed today     │  │
│  │ Next: Schema injection on /pricing (est. 2 min)        │  │
│  │ [View Activity Log]               [⏸ Pause All]        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  SHARE OF MODEL  (primary health metric — always visible)    │
│  Simplified view: current share + trend + competitor delta   │
│                                                              │
│  LAYER HEALTH  (status indicators only — not action surfaces)│
│  [ SEO ● Healthy ] [ AEO ● Improving ] [ SoM ↑ Growing ]    │
│  Click → inspects that layer's execution log, not action tab │
│                                                              │
│  RECENT COMPLETIONS  (last 5 executed actions)               │
│  Schema injected on /pricing · AEO +8 · 12 min ago          │
│  Meta updated on /features · CTR est. +3% · 1hr ago         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Exceptions tab in Autopilot:**
```
┌──────────────────────────────────────────────────────────────┐
│  EXCEPTIONS  (items requiring human judgment)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  IF EXCEPTIONS EXIST:                                        │
│  Each exception shows:                                       │
│   • What AUTOMATE was trying to do                           │
│   • Why it stopped (hit ceiling, ambiguous, risk threshold)  │
│   • What the user needs to decide                            │
│   • [Approve] [Reject] [Escalate] actions                    │
│                                                              │
│  IF NO EXCEPTIONS:                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ✓ All clear — no exceptions requiring attention       │  │
│  │  14 items executing autonomously                       │  │
│  │  [View Activity Log]                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│  (This "all clear" state is the successful Autopilot state)  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**What renders ONLY in Autopilot:**
- System status panel (execution count, queue depth, next scheduled action)
- Layer health as status indicators, not action surfaces
- Recent completions log on Overview
- Exceptions tab (replaces AEO + Technical as primary tabs)
- Pause All / Kill switch control in header
- "All clear" empty state on Exceptions
- Activity log accessible from Overview

**What does NOT render in Autopilot:**
- AEO asset table as primary interface
- Technical findings list as primary interface
- SAGE proposal banner (system is already executing, not proposing)
- Approve/Reject affordances on routine items (those execute automatically)
- Direct action buttons (system handles them)
- User-controlled sort

---

#### Mode Comparison Summary

| Element | Manual | Copilot | Autopilot |
|---------|--------|---------|----------|
| **Tab set** | Overview · AEO · Technical · Intelligence | Overview · AEO · Technical · Intelligence | Overview · Exceptions |
| **Queue order** | User-controlled / severity | AI-prioritized by impact | N/A — execution log |
| **Primary CTA** | Direct action buttons | Approve / Reject | Acknowledge exception |
| **SAGE banner** | Hidden | Visible at top | Hidden |
| **AI reasoning chips** | Hidden | Visible on every item | Hidden (executed already) |
| **Execution log** | Hidden | Hidden | Visible (dominant) |
| **Kill switch** | Hidden | Hidden | Visible in header |
| **"All clear" state** | N/A | N/A | Valid success state |
| **Layer health cards** | Action surfaces (click → work tab) | Action surfaces + AI proposals | Status indicators (click → log) |

---

## 7. Data Model (Sketch — Not Final API Contract)

These are the primary entity types needed. Final contracts go in `contracts/` when work surface development begins.

```typescript
// Asset-level AEO data
interface AssetAEOProfile {
  assetId: string;
  url: string;
  aeoScore: number;              // 0–100
  aeoScoreDelta: number;         // WoW change
  entityClarity: number;         // 0–100 component
  schemaCoverage: number;        // 0–100 component
  semanticDepth: number;         // 0–100 component
  authoritySignal: number;       // 0–100 component
  schemaTypes: string[];         // ['NewsArticle', 'FAQPage', ...]
  citedBy: AICitationRecord[];   // Which AI surfaces cite this
  lastCiteMindRun: string;       // ISO timestamp
  ingestibilityStatus: 'eligible' | 'partial' | 'not_eligible';
}

// Organization-level Share of Model
interface ShareOfModelSnapshot {
  topicCluster: string;
  brandShare: number;            // 0–100 percentage
  brandShareDelta: number;       // MoM change
  competitors: CompetitorShare[];
  lastUpdated: string;
  queryCount: number;            // How many queries sampled
  confidenceLevel: number;       // 0–1
}

// Layer 1 technical finding
interface TechnicalFinding {
  findingId: string;
  category: 'crawl' | 'performance' | 'schema' | 'links' | 'indexation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedUrl: string;
  description: string;
  aeoImpact?: string;           // Layer 2 bridge — null if no AEO impact
  suggestedAction: string;
  modeCeiling: AutomationMode;
}
```

---

## 8. Mode Ceilings (SEO-Specific)

Inherits from `MODE_UX_ARCHITECTURE.md` governance model. SEO-specific ceiling table:

| Action | Risk Level | Mode Ceiling | Rationale |
|--------|-----------|--------------|-----------|
| Technical audit (read-only) | Low | Autopilot | Non-destructive |
| AEO score calculation | Low | Autopilot | Internal only |
| Citation monitoring | Low | Autopilot | Read-only |
| Schema generation (suggestion) | Low | Autopilot | Proposal only |
| IndexNow ping | Low | Autopilot | Low impact |
| Schema injection (publish) | Medium | Copilot | Modifies live pages |
| Meta tag rewrite | Medium | Copilot | Affects SERP appearance |
| Internal linking changes | Medium | Copilot | Link equity impact |
| Content brief generation | Low | Copilot | Routes to Content pillar |
| Canonical URL changes | High | Manual | SEO-critical risk |
| Robots.txt modifications | Critical | Manual | Site-wide crawl impact |
| Redirect implementation | High | Manual | Link equity risk |
| Disavow file changes | Critical | Manual | Permanent link equity effect |

---

## 9. Canon Relationships

| Canon | Relationship |
|-------|-------------|
| `SEO_AEO_CONTINUITY_ADDENDUM.md` | **Parent** — Defines forbidden patterns and invariants this doc must honor |
| `CITEMIND_SYSTEM.md` | **Peer** — CiteMind Engine 1, 2, 3 power the AEO layer; read together |
| `EARNED_VISIBILITY_INDEX.md` | **Peer** — EVI formula; SEO/AEO actions feed Visibility and Authority components |
| `SAGE_v2.md` / `SAGE_OPERATING_MODEL.md` | **Peer** — SAGE receives Share of Model signals and generates cross-pillar actions |
| `CONTENT_PILLAR_CANON.md` | **Peer** — AEO brief → Content pillar; tight loop between pillar specs |
| `PR_PILLAR_MODEL.md` | **Peer** — PR coverage is the primary driver of entity authority and AI citation trust |
| `MODE_UX_ARCHITECTURE.md` | **Peer** — Mode governance framework; SEO mode ceilings defined here |
| `DS_v3_COMPLIANCE_CHECKLIST.md` | **Subordinate dependency** — All SEO/AEO UI must pass compliance checklist |
| `PRODUCT_CONSTITUTION.md` | **Superior** — Non-negotiables override anything in this doc |

---

## 10. Implementation Checklist

Before shipping the SEO/AEO work surface:

```
[ ] Three-layer architecture visible to user (Layer 1 / AEO / Share of Model)
[ ] Share of Model displayed as primary overview metric
[ ] AEO Score implemented per Section 3C formula
[ ] Pre-publish AEO gate present (advisory, not hard block)
[ ] AEO Score → Content Brief loop functional (gap detected → brief generated)
[ ] CiteMind Engine 1 runs on publish (schema generation + IndexNow)
[ ] CiteMind Engine 3 running daily citation scans
[ ] Layer 1 findings bridge to Layer 2 impact (see Section 2C bridge table)
[ ] Mode ceilings enforced per Section 8 table
[ ] Impact Strip present with SAGE tag + EVI + mode badge
[ ] Tab structure matches Section 6B (with Autopilot tab collapse)
[ ] No blank-page-first entry points (invariant from addendum)
[ ] All metrics bind to executable actions (invariant from addendum)
[ ] Cross-pillar: significant SEO events visible in other surfaces
[ ] Competitive Share of Model visible in Intelligence tab
[ ] Audit trail for all Copilot/Autopilot actions
[ ] Pilot positioning clear: measure AND build (not just monitoring)
```
