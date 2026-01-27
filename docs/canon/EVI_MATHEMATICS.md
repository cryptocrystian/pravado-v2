# EVI MATHEMATICS

> **Status:** CANONICAL
> **Authority:** This document defines the mathematical foundations of the Earned Visibility Index.
> **Classification:** Defensible IP (Trade Secret + Patent Eligible)
> **Dependency:** Extends `/docs/canon/EARNED_VISIBILITY_INDEX.md`
> **Last Updated:** 2026-01-13

---

## 1. Mathematical Foundation

### 1.1 EVI as a Time-Series Function

EVI is not a static score. It is a **time-series function** that evolves based on inputs, decay, reinforcement, and external events.

```
EVI(t) = f(V(t), A(t), M(t), E(t), D(t), R(t), S(t))

Where:
- V(t) = Visibility component at time t
- A(t) = Authority component at time t
- M(t) = Momentum component at time t
- E(t) = Environmental factors at time t
- D(t) = Decay function at time t
- R(t) = Reinforcement function at time t
- S(t) = Shock events at time t
```

### 1.2 Base Formula (Static Snapshot)

At any point in time t, the snapshot EVI is:

```
EVI(t) = (V(t) × 0.40) + (A(t) × 0.35) + (M(t) × 0.25)
```

This is the **observation formula**—it tells you the current state but not the trajectory.

### 1.3 Dynamic Formula (Time-Evolved)

The full dynamic formula incorporates temporal effects:

```
EVI(t) = EVI(t-1) × D(Δt) + ΔV(t) × 0.40 + ΔA(t) × 0.35 + ΔM(t) × 0.25 + S(t)

Where:
- D(Δt) = Decay multiplier over time interval Δt
- ΔV(t) = Change in Visibility from actions/events
- ΔA(t) = Change in Authority from actions/events
- ΔM(t) = Change in Momentum (derived from velocity)
- S(t) = Shock event contribution (positive or negative)
```

---

## 2. Component Formulas

### 2.1 Visibility (V) — 40% Weight

Visibility measures current earned presence across decision-making surfaces.

```
V(t) = Σᵢ (Surfaceᵢ × Weightᵢ)

Where i ∈ {AI, SERP, Press, Snippets}
```

**Sub-Component Formulas:**

| Component | Formula | Weight |
|-----------|---------|--------|
| AI Presence | `AI = (cited_queries / relevant_queries) × 100` | 0.35 |
| Press Coverage | `PC = Σ(mentions × tier_weight)` normalized to 0-100 | 0.25 |
| SERP Coverage | `SC = (top10_keywords / tracked_keywords) × 100` | 0.25 |
| Snippets | `SN = (owned_snippets / available_snippets) × 100` | 0.15 |

**Visibility Calculation:**
```
V(t) = (AI × 0.35) + (PC × 0.25) + (SC × 0.25) + (SN × 0.15)
```

**Tier Weights for Press:**
| Tier | Weight | Examples |
|------|--------|----------|
| T1 | 3.0 | WSJ, NYT, TechCrunch, Forbes |
| T2 | 2.0 | VentureBeat, The Verge, Wired |
| T3 | 1.0 | Industry publications, blogs |

### 2.2 Authority (A) — 35% Weight

Authority measures why the brand should be trusted based on citation quality and credibility signals.

```
A(t) = Σⱼ (Signalⱼ × Weightⱼ)

Where j ∈ {Citation, Domain, Journalist, Schema, EEAT}
```

**Sub-Component Formulas:**

| Component | Formula | Weight |
|-----------|---------|--------|
| Citation Quality | `CQ = avg(citing_source_authority)` | 0.30 |
| Domain Authority | `DA = weighted_avg(referring_domain_scores)` | 0.25 |
| Journalist Match | `JM = avg(relevance_score)` for covering journalists | 0.20 |
| Schema Coverage | `SC = (valid_schema_pages / total_pages) × 100` | 0.15 |
| E-E-A-T Density | `EE = presence_score(EEAT_markers)` | 0.10 |

**Authority Calculation:**
```
A(t) = (CQ × 0.30) + (DA × 0.25) + (JM × 0.20) + (SC × 0.15) + (EE × 0.10)
```

### 2.3 Momentum (M) — 25% Weight

Momentum measures trajectory and competitive velocity—whether earned visibility is growing, stable, or declining.

```
M(t) = Σₖ (Velocityₖ × Weightₖ)

Where k ∈ {Citation, SOV, Content, Topic, Ranking}
```

**Sub-Component Formulas:**

| Component | Formula | Weight |
|-----------|---------|--------|
| Citation Velocity | `CV = (citations(t) - citations(t-7)) / citations(t-7) × 100` | 0.30 |
| SOV Change | `ΔSoV = SoV(t) - SoV(t-30)` normalized | 0.25 |
| Content Velocity | `CoV = content_published / competitor_avg` | 0.20 |
| Topic Growth | `TG = Σ(coverage_in_emerging_topics)` normalized | 0.15 |
| Ranking Trajectory | `RT = avg(position_change)` inverted and normalized | 0.10 |

**Momentum Calculation:**
```
M(t) = (CV × 0.30) + (ΔSoV × 0.25) + (CoV × 0.20) + (TG × 0.15) + (RT × 0.10)
```

---

## 3. Decay Functions

### 3.1 Decay Principle

Without reinforcing activity, all EVI components decay over time. This models real-world dynamics where:
- AI models retrain on newer content
- Search rankings erode without fresh signals
- Media relationships cool without engagement
- Competitor activity fills vacuum

### 3.2 Component Decay Rates

Each component decays at different rates:

```
Component(t) = Component(t₀) × e^(-λ × Δt)
```

| Component | λ (decay constant) | Half-Life | Interpretation |
|-----------|-------------------|-----------|----------------|
| **Visibility.AI** | 0.025/week | 28 weeks | AI systems retrain slowly |
| **Visibility.Press** | 0.10/week | 7 weeks | News cycle moves fast |
| **Visibility.SERP** | 0.05/week | 14 weeks | Rankings erode moderately |
| **Authority.Citation** | 0.015/week | 46 weeks | Citations persist |
| **Authority.Domain** | 0.008/week | 87 weeks | DA changes slowly |
| **Momentum.All** | 0.20/week | 3.5 weeks | Velocity requires activity |

### 3.3 Aggregate EVI Decay

When no activity occurs, EVI decays as:

```
EVI_decay(t) = EVI(t₀) × [
  0.40 × e^(-0.06 × weeks) +   // Visibility weighted average decay
  0.35 × e^(-0.02 × weeks) +   // Authority weighted average decay
  0.25 × e^(-0.20 × weeks)     // Momentum decay (fastest)
]
```

**Decay Scenarios (no activity):**

| Weeks | Visibility | Authority | Momentum | **Total EVI** |
|-------|------------|-----------|----------|---------------|
| 0 | 100% | 100% | 100% | 100% |
| 2 | 89% | 96% | 67% | 87% |
| 4 | 79% | 92% | 45% | 75% |
| 8 | 62% | 85% | 20% | 60% |
| 12 | 49% | 79% | 9% | 49% |
| 26 | 21% | 60% | 0.5% | 29% |

### 3.4 Decay Protection

Certain actions "reset" decay timers:

| Action | Resets Decay For |
|--------|------------------|
| PR placement (T1/T2) | Visibility.Press, Authority.Citation |
| Content publication | Visibility.SERP, Authority.Domain |
| SEO implementation | Visibility.SERP, Authority.Schema |
| AI citation detected | Visibility.AI |

---

## 4. Reinforcement Curves

### 4.1 Reinforcement Principle

Consistent activity doesn't just prevent decay—it creates compounding gains. Reinforcement follows a logarithmic curve with diminishing returns.

### 4.2 Reinforcement Formula

```
Reinforcement(activity) = k × ln(1 + activity × s)

Where:
- k = scaling constant (varies by component)
- activity = normalized activity level (0-1 scale)
- s = sensitivity factor
```

### 4.3 Activity Impact Curves

**Visibility Reinforcement:**
```
ΔV = 2.5 × ln(1 + (PR_actions × 0.4 + Content_actions × 0.3 + SEO_actions × 0.3))
```

| Weekly Actions | ΔV Gain | Cumulative (12 weeks) |
|----------------|---------|----------------------|
| 1 | +0.84 | +10.1 |
| 3 | +1.73 | +20.8 |
| 5 | +2.24 | +26.9 |
| 10 | +2.89 | +34.7 |
| 20 | +3.53 | +42.4 |

**Diminishing returns**: Doubling activity from 10→20/week only adds 22% more gain.

### 4.4 Cross-Pillar Reinforcement Bonus

Actions that span multiple pillars receive reinforcement bonuses:

```
Cross_Bonus = Base_Effect × (1 + 0.15 × pillars_touched)
```

| Pillars Touched | Bonus Multiplier |
|-----------------|------------------|
| 1 | 1.00 (no bonus) |
| 2 | 1.15 |
| 3 | 1.30 |

Example: A PR placement (pillar 1) that generates a backlink (pillar 2) and triggers content (pillar 3) receives 1.30× the base EVI impact.

### 4.5 Consistency Multiplier

Regular activity over time earns a consistency multiplier:

```
Consistency_Mult = 1 + 0.1 × min(streak_weeks, 12)
```

| Consistent Weeks | Multiplier |
|------------------|------------|
| 0 | 1.00 |
| 4 | 1.40 |
| 8 | 1.80 |
| 12+ | 2.20 (max) |

Breaking the streak resets the multiplier to 1.00.

---

## 5. Negative Momentum

### 5.1 Negative Momentum Definition

Negative momentum occurs when EVI is declining at an accelerating rate. It's not just "going down"—it's going down faster over time.

### 5.2 Negative Momentum Detection

```
Neg_Momentum = True if:
  (EVI(t) - EVI(t-7)) < 0 AND
  (EVI(t-7) - EVI(t-14)) < 0 AND
  |EVI(t) - EVI(t-7)| > |EVI(t-7) - EVI(t-14)|
```

In words: Three consecutive down periods where each decline is larger than the previous.

### 5.3 Negative Momentum Effects

When negative momentum is detected:

| Effect | Magnitude | Duration |
|--------|-----------|----------|
| Decay rate increases | +50% | Until momentum reverses |
| Visibility recovery harder | 1.5× effort required | 2 weeks after reversal |
| Authority erosion risk | +25% decay if crisis-triggered | Until crisis resolved |

### 5.4 Negative Momentum Reversal

Reversing negative momentum requires:

```
Reversal_Effort = Normal_Effort × (1 + 0.2 × weeks_in_decline)
```

| Weeks in Decline | Effort Multiplier | Typical Recovery Time |
|------------------|-------------------|----------------------|
| 2 | 1.4× | 1-2 weeks |
| 4 | 1.8× | 3-4 weeks |
| 8 | 2.6× | 6-8 weeks |
| 12 | 3.4× | 10-14 weeks |

---

## 6. Shock Events

### 6.1 Shock Event Definition

Shock events are discrete occurrences that cause immediate, significant EVI changes outside normal activity-based dynamics.

### 6.2 Shock Event Categories

| Category | Direction | Typical Magnitude | Decay Behavior |
|----------|-----------|-------------------|----------------|
| **T1 Media Win** | Positive | +3 to +8 points | Slow decay (10 weeks) |
| **Viral Coverage** | Positive | +5 to +15 points | Fast decay (3 weeks) |
| **AI Citation Breakout** | Positive | +2 to +6 points | Very slow decay (20 weeks) |
| **Crisis Event** | Negative | -5 to -25 points | Fast impact, slow recovery |
| **Algorithm Update** | Variable | ±2 to ±15 points | Permanent shift |
| **Competitor Move** | Negative | -1 to -8 points | Gradual if unaddressed |

### 6.3 Shock Event Formulas

**Positive Shock:**
```
EVI_shock(t) = EVI_base(t) + S_magnitude × e^(-λₛ × days_since_shock)

Where:
- S_magnitude = initial shock value
- λₛ = shock decay rate (varies by type)
```

**Negative Shock (Crisis):**
```
EVI_shock(t) = EVI_base(t) - S_magnitude × (1 - recovery_rate)^days

Where:
- recovery_rate = rate at which crisis effects diminish (requires active response)
- Without response: recovery_rate ≈ 0.02 (very slow)
- With active response: recovery_rate ≈ 0.10-0.25
```

### 6.4 Shock Event Examples

**Example 1: TechCrunch Feature (Positive)**
```
Initial Impact: +6.2 points to Visibility
  Day 1: EVI increases from 67 → 73.2
  Week 1: Decay to +5.8 (73.0)
  Week 4: Decay to +4.2 (71.4)
  Week 10: Decay to +2.1 (69.3)
  Week 20: Residual effect ≈ +0.5 (67.7)
```

**Example 2: Data Breach Crisis (Negative)**
```
Initial Impact: -15 points to Authority
  Day 1: EVI drops from 67 → 52
  Without response:
    Week 4: Still at 50 (minimal recovery)
    Week 12: 54 (slow natural recovery)
  With active response:
    Week 1: Recovery begins, 52 → 54
    Week 4: 58 (accelerated recovery)
    Week 12: 64 (near-full recovery)
```

---

## 7. Forecasting Logic

### 7.1 Forecasting Model

EVI forecasting projects future scores based on:
1. Current EVI and component values
2. Planned activities in the pipeline
3. Historical patterns
4. Competitive environment

### 7.2 Baseline Forecast (No New Activity)

```
EVI_forecast_base(t + n) = EVI(t) × D_aggregate(n)

Where D_aggregate(n) = decay function over n periods
```

This produces the "do nothing" trajectory.

### 7.3 Activity-Adjusted Forecast

```
EVI_forecast_adjusted(t + n) = EVI_forecast_base(t + n) + Σ(planned_action_impacts)
```

Each planned action contributes:

```
Action_Impact = Expected_Effect × Confidence × P(Execution)
```

### 7.4 Scenario Modeling

The system generates three forecast bands:

| Band | Assumptions | Use Case |
|------|-------------|----------|
| **Conservative (Low)** | Only confirmed activities, high decay | Risk planning |
| **Expected** | Planned activities at historical success rates | Default forecast |
| **Optimistic (High)** | All opportunities convert, minimal decay | Opportunity sizing |

```
EVI_low(t+30) = EVI(t) × 0.85 + Σ(confirmed_actions × 0.7)
EVI_expected(t+30) = EVI(t) × 0.92 + Σ(planned_actions × success_rate)
EVI_high(t+30) = EVI(t) × 0.98 + Σ(opportunities × 1.2)
```

### 7.5 Scenario Impact Calculation

For individual scenario evaluation:

```
Scenario_Impact = Σⱼ (Actionⱼ × Driver_Weightⱼ × Success_Probⱼ)
```

Example: "Deploy schema on 12 pages"
```
Action: Schema deployment
Driver: Authority (weight 0.35)
Expected lift: +3.2 Authority points
EVI Impact: 3.2 × 0.35 = +1.12 EVI points
With 90% confidence: +1.01 expected EVI
```

---

## 8. Anti-Gaming Mechanisms

### 8.1 Why EVI Resists Gaming

EVI is designed to resist manipulation through:

| Mechanism | How It Works |
|-----------|--------------|
| **Multi-Source Verification** | Each component requires multiple independent signals |
| **Temporal Requirements** | Benefits require sustained activity, not spikes |
| **Quality Weights** | Low-quality inputs are weighted proportionally lower |
| **Competitive Relativity** | Many metrics are relative to competitors, not absolute |
| **Decay Reality** | Artificial inflation decays quickly without real support |

### 8.2 Gaming Resistance by Component

**Visibility:**
- AI Presence requires actual citations (not controllable)
- Press Coverage requires verified publications (not self-published)
- SERP Coverage requires ranking (not indexing)

**Authority:**
- Citation Quality weights source authority (low-quality links = low impact)
- Domain Authority changes slowly and requires genuine backlinks
- E-E-A-T signals must be verified (not just claimed)

**Momentum:**
- Velocity metrics compare to baselines (spiking is detected)
- SOV is competitive (gaming requires outpacing competitors)
- Consistency requirements penalize sporadic activity

### 8.3 Anomaly Detection

The system flags potential gaming attempts:

| Pattern | Detection | Response |
|---------|-----------|----------|
| Sudden backlink spike | >200% increase in 7 days | Quarantine links, manual review |
| Press mention surge | >300% without corresponding event | Verify sources |
| Keyword stuffing | Content quality score drops | Reduce Authority contribution |
| Citation manipulation | Source diversity drops | Apply diversity penalty |

### 8.4 Gaming Penalty

Confirmed gaming attempts result in:

```
EVI_penalized = EVI_calculated × (1 - penalty_rate)

Where penalty_rate = 0.1 to 0.5 based on severity
```

Penalties persist for 90 days and require clean activity to lift.

---

## 9. Implementation Constants

### 9.1 Canonical Weights

```typescript
export const EVI_WEIGHTS = {
  visibility: 0.40,
  authority: 0.35,
  momentum: 0.25,
} as const;

export const VISIBILITY_WEIGHTS = {
  ai_presence: 0.35,
  press_coverage: 0.25,
  serp_coverage: 0.25,
  snippets: 0.15,
} as const;

export const AUTHORITY_WEIGHTS = {
  citation_quality: 0.30,
  domain_authority: 0.25,
  journalist_match: 0.20,
  schema_coverage: 0.15,
  eeat_density: 0.10,
} as const;

export const MOMENTUM_WEIGHTS = {
  citation_velocity: 0.30,
  sov_change: 0.25,
  content_velocity: 0.20,
  topic_growth: 0.15,
  ranking_trajectory: 0.10,
} as const;
```

### 9.2 Decay Constants

```typescript
export const DECAY_CONSTANTS = {
  visibility_ai: 0.025,       // per week
  visibility_press: 0.10,     // per week
  visibility_serp: 0.05,      // per week
  authority_citation: 0.015,  // per week
  authority_domain: 0.008,    // per week
  momentum_all: 0.20,         // per week
} as const;
```

### 9.3 Band Thresholds

```typescript
export const EVI_BANDS = {
  at_risk: { min: 0, max: 40, label: 'At Risk', color: 'danger' },
  emerging: { min: 41, max: 60, label: 'Emerging', color: 'warning' },
  competitive: { min: 61, max: 80, label: 'Competitive', color: 'info' },
  dominant: { min: 81, max: 100, label: 'Dominant', color: 'success' },
} as const;
```

---

## 10. Governance

### 10.1 Formula Immutability

The EVI formula and weights are **canonical**. Changes require:
1. Product leadership approval
2. Customer communication (weights affect comparisons)
3. Historical recalculation or versioning decision
4. Legal review for IP implications

### 10.2 Calculation Verification

EVI calculations must be:
- Reproducible given the same inputs
- Auditable with full input logging
- Versioned for backward compatibility

### 10.3 Testing Requirements

Mathematical implementations must pass:
- Unit tests for each component formula
- Integration tests for composite calculation
- Decay tests over simulated time periods
- Gaming detection tests with synthetic patterns

---

## 11. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | Initial mathematical specification |
