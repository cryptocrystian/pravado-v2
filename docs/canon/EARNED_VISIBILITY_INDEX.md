# Earned Visibility Index (EVI)

> **Status:** CANONICAL
> **Authority:** This document defines the single North Star KPI for the Pravado Command Center.
> **Last Updated:** 2026-01-11

---

## 1. Definition

### What EVI Measures

The **Earned Visibility Index (EVI)** is a composite score (0–100) that quantifies how effectively a brand is earning organic visibility across AI systems, search engines, and media coverage.

EVI answers one question:

> **"How visible is this brand in the places where decisions are made?"**

Unlike traditional metrics that measure owned or paid exposure, EVI specifically tracks *earned* presence—visibility that cannot be directly purchased and must be built through authority, relevance, and strategic action.

### What EVI Is NOT

- **NOT a traffic metric** — Page views and sessions are outcomes, not inputs
- **NOT an engagement score** — Likes, shares, and comments are vanity signals
- **NOT a brand sentiment score** — Sentiment is qualitative context, not visibility
- **NOT a "health score"** — EVI is directional and actionable, not a vague status
- **NOT a duplicate of any pillar metric** — EVI synthesizes across PR, Content, and SEO

---

## 2. Formula

```
EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
```

Each component is normalized to a 0–100 scale before weighting.

| Component   | Weight | Purpose |
|-------------|--------|---------|
| Visibility  | 40%    | Measures current earned presence |
| Authority   | 35%    | Measures trust signals and citation quality |
| Momentum    | 25%    | Measures trajectory and competitive velocity |

---

## 3. Component Definitions

### 3.1 Visibility (40%)

Visibility measures **where the brand currently appears** in AI answers, search results, and media coverage.

| Metric | Description | Why It Matters | Direction |
|--------|-------------|----------------|-----------|
| **AI Answer Presence %** | Percentage of relevant AI queries where the brand is cited | AI systems are becoming primary decision surfaces | ↑ Good |
| **Press Mention Coverage** | Count of media mentions, weighted by outlet tier (T1: 3x, T2: 2x, T3: 1x) | Third-party validation creates trust and reach | ↑ Good |
| **Topic SERP Coverage %** | Percentage of target topic keywords where brand ranks in top 10 | SERP presence drives discovery and credibility | ↑ Good |
| **Featured Snippet Ownership** | Count of featured snippets held for target queries | Position zero captures disproportionate attention | ↑ Good |

**Visibility Score Calculation:**
```
Visibility = (AI_Presence × 0.35) + (Press_Coverage × 0.25) + (SERP_Coverage × 0.25) + (Snippets × 0.15)
```

---

### 3.2 Authority (35%)

Authority measures **why the brand should be trusted** based on citation quality, domain strength, and structured credibility signals.

| Metric | Description | Why It Matters | Direction |
|--------|-------------|----------------|-----------|
| **Citation Quality Score** | Average authority of sources citing the brand (0–100) | High-authority citations transfer trust | ↑ Good |
| **Referring Domain Authority** | Weighted average Domain Authority of backlink sources | Strong referring domains signal credibility | ↑ Good |
| **Journalist/Entity Match Strength** | Relevance score of journalists covering the brand (0–100) | Contextually relevant coverage drives authority | ↑ Good |
| **Structured Data Coverage %** | Percentage of pages with valid schema markup | Structured data improves AI comprehension | ↑ Good |
| **E-E-A-T Signal Density** | Presence of Experience, Expertise, Authority, Trust markers | Google's quality framework impacts rankings | ↑ Good |

**Authority Score Calculation:**
```
Authority = (Citation_Quality × 0.30) + (Domain_Authority × 0.25) + (Journalist_Match × 0.20) + (Structured_Data × 0.15) + (EEAT × 0.10)
```

---

### 3.3 Momentum (25%)

Momentum measures **trajectory and competitive velocity**—whether earned visibility is growing, stable, or declining.

| Metric | Description | Why It Matters | Direction |
|--------|-------------|----------------|-----------|
| **Citation Velocity (WoW)** | Week-over-week change in AI/media citations | Growth rate indicates strategic effectiveness | ↑ Good |
| **Share of Voice Change** | Delta in SOV vs. competitors over 30 days | Relative position matters more than absolute | ↑ Good |
| **Content Velocity vs Competitors** | Ratio of brand content output to competitor average | Consistent output drives cumulative visibility | ↑ Good |
| **Topic Growth Rate** | Velocity of coverage in emerging topic clusters | Early presence in growing topics compounds | ↑ Good |
| **Ranking Trajectory** | Average position change across tracked keywords | Upward movement signals algorithmic favor | ↑ Good |

**Momentum Score Calculation:**
```
Momentum = (Citation_Velocity × 0.30) + (SOV_Change × 0.25) + (Content_Velocity × 0.20) + (Topic_Growth × 0.15) + (Ranking_Trajectory × 0.10)
```

---

## 4. Scoring Bands

| EVI Range | Status | Interpretation |
|-----------|--------|----------------|
| **0–40** | At Risk | Brand is invisible or losing ground. Immediate action required. |
| **41–60** | Emerging | Brand has foundational presence but lacks competitive advantage. |
| **61–80** | Competitive | Brand holds meaningful visibility and can defend position. |
| **81–100** | Dominant | Brand owns earned visibility in its category. Focus on expansion. |

### Status Display Rules

- **At Risk** — Red indicator, urgent narrative
- **Emerging** — Yellow/amber indicator, growth narrative
- **Competitive** — Cyan indicator, maintenance narrative
- **Dominant** — Green indicator, expansion narrative

---

## 5. Anti-Patterns

The following practices are **explicitly prohibited** in EVI-related features:

### 5.1 No Vanity Metrics
- Social followers, likes, and shares are not EVI inputs
- Impressions without attribution are not EVI inputs
- "Reach" without source verification is not EVI input

### 5.2 No Traffic-Only KPIs
- Page views and sessions are outcomes, not inputs
- Bounce rate is a content quality signal, not visibility
- Time on site is engagement, not earned presence

### 5.3 No Engagement Without Attribution
- Comments and reactions require source context
- Shares must be weighted by sharer authority
- Engagement on owned channels is not earned visibility

### 5.4 No Duplicate Health Scores
- There is ONE North Star: EVI
- "AEO Health Score" is deprecated and must not appear
- Pillar-specific scores (PR Score, SEO Score) are inputs, not peers

### 5.5 No Unattributed Metrics
- Every metric in the Strategy Panel must map to an EVI component
- If a metric cannot explain EVI movement, it does not belong
- "Nice to know" metrics belong in pillar work surfaces, not Command Center

---

## 6. Command Center Integration

### Strategy Panel Role
The Strategy Panel exists to **explain EVI state**. It is diagnostic, not operational.

- Primary display: EVI score + delta + status band
- Driver breakdown: Visibility, Authority, Momentum (expandable)
- Supporting metrics: Only those that explain EVI movement

### Action Stream Role
The Action Stream exists to **remove EVI friction**. Every action should:
- Increase one or more EVI component scores
- Be traceable to an EVI driver
- Show expected EVI impact when available

### Intelligence Canvas Role
The Intelligence Canvas exists to **explain Authority and Visibility**:
- Shows citation relationships
- Maps journalist/outlet connections
- Visualizes competitor positioning

### Calendar Role
The Orchestration Calendar exists to **enforce Momentum**:
- Ensures consistent content velocity
- Prevents gaps in earned visibility activity
- Coordinates cross-pillar execution

---

## 7. Governance

### Change Control
Any modification to EVI formula, weights, or component definitions requires:
1. Update to this canonical document
2. Corresponding update to `contracts/schemas/strategy-panel.json`
3. CI guardrail update in `scripts/check-command-center-kpis.mjs`
4. Product review sign-off

### Drift Prevention
The following patterns will fail CI:
- Reference to "AEO Health Score" anywhere in codebase
- Introduction of a second top-level KPI in Strategy Panel
- Metrics in Strategy Panel not mapped to EVI components
- EVI formula implementation that differs from this specification

---

## 8. Implementation Reference

### 8.1 Code Locations

| Component | Path | Purpose |
|-----------|------|---------|
| **Types** | `apps/dashboard/src/lib/evi/types.ts` | Canonical type definitions |
| **Compute** | `apps/dashboard/src/lib/evi/compute.ts` | EVI formula implementation |
| **Providers** | `apps/dashboard/src/lib/evi/providers.ts` | Data source mapping stubs |
| **Tests** | `apps/dashboard/src/lib/evi/__tests__/compute.test.ts` | Formula validation tests |
| **UI Types** | `apps/dashboard/src/components/command-center/types.ts` | Response types |
| **Contract** | `contracts/examples/strategy-panel.json` | Data contract example |

### 8.2 Key Constants

```typescript
// Canonical weights - MUST sum to 1.0
export const EVI_WEIGHTS = {
  visibility: 0.40,
  authority: 0.35,
  momentum: 0.25,
} as const;

// Canonical bands - MUST be contiguous 0-100
export const EVI_BANDS = {
  at_risk: { min: 0, max: 40, label: 'At Risk' },
  emerging: { min: 41, max: 60, label: 'Emerging' },
  competitive: { min: 61, max: 80, label: 'Competitive' },
  dominant: { min: 81, max: 100, label: 'Dominant' },
} as const;
```

### 8.3 Feature Components

| Feature | Component | Description |
|---------|-----------|-------------|
| **EVI Hero** | `StrategyPanelPane` | Displays score, delta, status, sparkline |
| **Driver Rows** | `StrategyPanelPane` | Expandable driver breakdown with filtering |
| **Top Movers** | `StrategyPanelPane` | Attribution items explaining EVI change |
| **EVI Filtering** | `ActionStreamPane` | Filter actions by EVI driver |
| **Forecast** | `EVIForecastPanel` | 30-day projection with scenarios |
| **Explainer** | `EVIExplainerModal` | Customer-facing EVI education |

---

## 9. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-12 | 1.1 | Added implementation reference, code locations, feature components |
| 2026-01-11 | 1.0 | Initial canonical specification |
