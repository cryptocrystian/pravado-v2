# EVI — Earned Visibility Index: Formula Reference
**Version:** 1.0  
**Status:** CANONICAL — reflects production implementation as of Sprint S-INT-01  
**Implementation:** `apps/api/src/services/evi/`

---

## What EVI Measures

EVI is a single 0–100 score that represents how visible, authoritative, and growing a brand is across all owned, earned, and perceived channels. It replaces siloed metrics (DR, DA, open rate, keyword rankings) with a unified signal that SAGE uses to prioritize actions and measure the impact of every campaign decision.

A brand with EVI 70 is significantly more visible than one at EVI 40 — and the delta between periods is the most actionable signal of all.

---

## The Formula

```
EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
```

Each sub-score is normalized to 0–100 before weighting.

---

## Sub-Score Definitions

### Visibility (40% weight)
*"Are people finding and engaging with this brand?"*

Visibility aggregates active signals that indicate real-world reach and engagement right now.

| Signal | Source Table | Contribution |
|--------|-------------|--------------|
| Pitch open rate | `pr_pitches` + `pr_outreach_events` | Opens / Sent (last 30 days) |
| Pitch reply rate | `pr_pitches` + `pr_outreach_events` | Replies / Sent (last 30 days) |
| Journalist reach | `journalist_profiles` (DA field) | Avg DA of journalists pitched |
| AI citation rate | `citation_summaries` (mention_rate) | Brand mentions / total queries (last 30 days) |

**Normalization:** Each signal is normalized to 0–100 individually, then averaged. Missing signals (no pitches sent, no citation monitoring yet) score 0 for that component — they don't invalidate the sub-score, they suppress it until data exists.

**Citation rate contribution (added S-INT-05):** The `citation_summaries.mention_rate` for the org contributes 25% of the Visibility sub-score. A mention_rate of 0.20 (20% of queries result in a citation) maps to 80/100 for that component.

---

### Authority (35% weight)
*"Does this brand have lasting credibility in its domain?"*

Authority measures structural signals that persist over time — content quality, link equity, and keyword position.

| Signal | Source Table | Contribution |
|--------|-------------|--------------|
| Content quality | `content_quality_scores` (avg overall_score) | Avg CiteMind score of published content |
| Backlink authority | `seo_backlinks` | Count of backlinks with DA > 40 (capped at 200) |
| Keyword positions | `seo_keyword_metrics` | Avg position score (position 1 = 100, position 50 = 0) |

**Normalization:** Content quality is already 0–100. Backlink count is scaled: 0 links = 0, 200+ links = 100. Keyword position score: `max(0, 100 - (avg_position - 1) × 2)`.

---

### Momentum (25% weight)
*"Is this brand getting better or worse?"*

Momentum is a rate-of-change signal. It compares the current period's Visibility + Authority signals against the prior period of equal length.

```
Momentum = ((Current_Period_Score - Prior_Period_Score) / Prior_Period_Score) × 100
           clamped to range [-100, +100], then normalized to [0, 100]
```

A brand growing 10% period-over-period scores ~60/100 on Momentum. Flat scores 50. Declining scores below 50.

**Edge case:** If no prior period data exists (new org), Momentum defaults to 50 (neutral) until the second snapshot is calculated.

---

## Calculation Cadence

| Trigger | Behavior |
|---------|----------|
| Nightly BullMQ job (`evi:recalculate`) | Full recalculation for all orgs with data |
| Manual trigger via `POST /api/v1/evi/recalculate` | On-demand, used during onboarding activation |
| After GSC sync | `gsc:sync` worker enqueues `evi:recalculate` after data import |
| After SAGE signal scan | Not triggered automatically — nightly cadence is sufficient |

---

## Storage

Every EVI calculation is persisted as an immutable snapshot:

```sql
-- Table: evi_snapshots
id                uuid        -- primary key
org_id            uuid        -- foreign key → orgs
evi_score         numeric     -- final weighted score
visibility_score  numeric     -- sub-score
authority_score   numeric     -- sub-score
momentum_score    -- sub-score
signal_breakdown  jsonb       -- full audit trail of every input signal and its value
calculated_at     timestamptz -- when this snapshot was taken
period_days       integer     -- lookback window (default 30)
```

The `signal_breakdown` field is non-negotiable — it stores every input signal, its raw value, normalized value, and weight contribution. Every EVI score is fully reproducible from this record.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/evi/current` | Latest calculated EVI score + delta vs prior period |
| `GET /api/evi/history?days=90` | Array of historical snapshots for trend charts |

---

## Display Rules

- **EVI Score:** Display as integer (round to nearest whole number). "68" not "67.8"
- **Delta:** Display as `+3.2` or `-1.4` with directional color (green/red)
- **Sub-scores:** Display in the Strategy Panel breakdown as labeled bars
- **Stale data:** If `calculated_at` is > 48 hours old, show a "Stale" indicator next to the score
- **New org:** If no snapshots exist yet, show "—" not "0" — 0 would be misleading

---

## Interpretation Guide

| EVI Range | Interpretation |
|-----------|---------------|
| 0–25 | Early stage — limited signals, low visibility |
| 26–45 | Building — some activity, inconsistent presence |
| 46–65 | Established — consistent visibility, room to grow |
| 66–80 | Strong — high authority and active engagement |
| 81–100 | Market leader — top-tier visibility across all channels |

---

## Known Limitations (v1.0)

1. **Visibility sub-score is suppressed for new orgs** until at least one pitch is sent and citation monitoring has run one cycle. This is intentional — the score reflects reality.
2. **Backlink data requires GSC or manual import** — not yet populated from a live crawl tool.
3. **Momentum is unreliable in the first 14 days** — there's no prior period to compare against.
4. **Citation rate is averaged across all engines** — ChatGPT, Perplexity, and Claude are weighted equally even though their relative traffic differs significantly. A future v2 will weight by engine reach.

---

*This is the authoritative formula reference for EVI. If the implementation in `eviCalculationService.ts` deviates from this document, the document is correct and the code should be updated.*
