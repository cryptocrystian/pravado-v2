# EVI Baseline Protocol

## Purpose

Establish an EVI baseline at org creation and measure delta at 2-week intervals. This protocol defines what constitutes a "meaningful" score change and when the formula may need recalibration.

## EVI Formula Reference

```
EVI = (Visibility x 0.40) + (Authority x 0.35) + (Momentum x 0.25)
```

Each sub-score is 0-100. Overall EVI is 0-100.

## Baseline Establishment

### When to Capture

A baseline snapshot is automatically captured when:
1. Onboarding completes (step 6: "Your starting EVI is X")
2. The `evi-recalculate` job first runs for a new org

### What to Record

The baseline snapshot (`evi_snapshots` table) must include:
- `evi_score` — overall EVI
- `visibility_score` — Visibility sub-score
- `authority_score` — Authority sub-score
- `momentum_score` — Momentum sub-score (typically 0 at baseline, since there's no prior period)
- `signal_breakdown` — full JSON audit trail of all input signals
- `period_days` — 30 (default measurement window)

### Expected Baseline Ranges

| Org Profile | Expected Baseline EVI | Rationale |
|-------------|----------------------|-----------|
| New brand, no existing content | 5-15 | Minimal signals across all pillars |
| Existing blog, no PR | 15-30 | Some Authority from content, low Visibility |
| Active PR + content, no SEO focus | 25-45 | Visibility from PR, Authority from content, but gaps in organic |
| Mature marketing org | 40-65 | Signals across all pillars, but room for AI citation optimization |

If a baseline falls outside these ranges, verify signal sources are connected correctly before proceeding.

## Measurement Cadence

| Interval | Measurement | Purpose |
|----------|-------------|---------|
| Day 0 | Baseline | Starting point |
| Week 2 | First delta | Early signal — are actions having any effect? |
| Week 4 | Second delta | Trend confirmation — is delta consistent? |
| Week 6+ | Ongoing bi-weekly | Steady-state tracking |

Deltas are calculated as: `current_evi - previous_evi` (absolute points, not percentage).

## Meaningful Change Thresholds

| Delta (absolute points) | Classification | Interpretation |
|------------------------|----------------|----------------|
| < 2 | Noise | Within measurement variance. No action needed. |
| 2 - 5 | Minor movement | Likely reflects a single action (one pitch sent, one article published). Expected during early use. |
| 5 - 10 | Meaningful change | Multiple actions compounding. Indicates the system is working. This is the target range for a 2-week period. |
| 10 - 20 | Significant shift | Major event (viral coverage, high-DA backlink, bulk content publish). Verify signals are real. |
| > 20 | Anomalous | Almost certainly a data issue, formula bug, or extraordinary event. Investigate immediately. |

### Per-Sub-Score Thresholds

| Sub-Score | Noise (< X) | Meaningful (X - Y) | Investigate (> Y) |
|-----------|-------------|--------------------|--------------------|
| Visibility | < 3 | 3 - 12 | > 12 |
| Authority | < 2 | 2 - 8 | > 8 |
| Momentum | < 3 | 3 - 15 | > 15 |

Momentum is naturally more volatile since it measures rate-of-change.

## Recalibration Triggers

The EVI formula may need recalibration if any of these conditions persist over 3+ measurement periods:

### 1. Score Ceiling
- **Symptom**: Orgs consistently score > 85 with room for obvious improvement
- **Cause**: Sub-score normalization is too generous
- **Fix**: Tighten normalization curves, raise the ceiling for max sub-scores

### 2. Score Floor
- **Symptom**: Active orgs with real engagement stuck below 20
- **Cause**: Signal thresholds are too high or signal sources aren't connected
- **Fix**: Verify signal ingestion, lower minimum thresholds for sub-score contribution

### 3. Momentum Dominance
- **Symptom**: EVI swings wildly between periods despite steady Visibility/Authority
- **Cause**: Momentum weight (0.25) is too high, or Momentum calculation is too sensitive
- **Fix**: Reduce Momentum weight or smooth the delta calculation over a longer window

### 4. Pillar Insensitivity
- **Symptom**: Major PR wins (e.g., Tier-1 coverage) don't move the needle
- **Cause**: Visibility signals from PR are under-weighted relative to other sources
- **Fix**: Adjust signal weights within the Visibility sub-score

### 5. Cross-Org Incomparability
- **Symptom**: Two orgs with objectively different visibility have similar EVIs
- **Cause**: Normalization is relative to each org's own history instead of absolute benchmarks
- **Fix**: Introduce industry-relative percentile bands

## Recalibration Process

1. Document the trigger condition and evidence in a GitHub issue
2. Propose specific weight or threshold changes
3. Run the CiteMind benchmark suite to ensure content scoring isn't affected
4. Apply changes behind `EVI_FORMULA_V2` feature flag
5. Run both formulas in parallel for 2 measurement periods
6. Compare results, choose the better calibration
7. Retire the old formula

## Reporting Template

```
## EVI Delta Report — [Org Name] — [Date]

**Period**: [Start Date] to [End Date] (14 days)
**Previous EVI**: XX.X
**Current EVI**: XX.X
**Delta**: +/- X.X points

### Sub-Score Breakdown
| Sub-Score | Previous | Current | Delta | Classification |
|-----------|----------|---------|-------|----------------|
| Visibility | | | | |
| Authority | | | | |
| Momentum | | | | |

### Key Actions During Period
- [List significant user actions: pitches sent, content published, etc.]

### Assessment
- [ ] Delta is within expected range
- [ ] No recalibration triggers observed
- [ ] Anomalies investigated (if any)
```
