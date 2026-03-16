# SAGE Protocol — Architecture Reference
**Version:** 1.0  
**Status:** CANONICAL — reflects production implementation as of Sprints S-INT-02 and S-INT-03  
**Implementation:** `apps/api/src/services/sage/`

---

## What SAGE Is

SAGE (Strategy and Action Generation Engine) is Pravado's intelligence core. It observes signals across all three pillars — PR, Content, and SEO — scores each signal by its potential to improve EVI, and generates prioritized, human-readable proposals that tell the user exactly what to do next.

SAGE is what makes Pravado a Visibility Operating System rather than three separate tools. Without SAGE, there is no cross-pillar strategy. With it, a user opens the Command Center and knows their highest-leverage action within seconds.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SAGE Pipeline                          │
│                                                             │
│  Signal Ingestors ──► Opportunity Scorer ──► Proposal Gen  │
│       (3 pillar)          (composite)        (LLM + stub)  │
│                                ↓                            │
│                     sage_signals table                      │
│                                ↓                            │
│                     sage_proposals table                    │
│                                ↓                            │
│              Action Stream API + Strategy Panel             │
└─────────────────────────────────────────────────────────────┘
```

---

## Signal Ingestors

Each pillar has a dedicated ingestor that reads from that pillar's tables and emits normalized `SageSignal` objects.

### PR Signal Ingestor (`sagePRSignalIngestor.ts`)

| Signal Type | Source | Trigger Condition |
|-------------|--------|-------------------|
| `pr_stale_followup` | `pr_pitches` + `pr_outreach_events` | Pitch sent > 5 days ago, no reply in events |
| `pr_high_value_unpitched` | `journalist_profiles` | Journalist DA > 70, never pitched by this org |
| `pr_pitch_window` | `journalist_timeline_events` | Recent coverage event creates a relevant pitch window |

### Content Signal Ingestor (`sageContentSignalIngestor.ts`)

| Signal Type | Source | Trigger Condition |
|-------------|--------|-------------------|
| `content_stale_draft` | `content_items` | Draft not updated in > 14 days |
| `content_low_quality` | `content_quality_scores` | Published item with CiteMind overall_score < 60 |
| `content_coverage_gap` | `content_topics` + `content_items` | Topic cluster with no published item in last 90 days |
| `content_low_citemind` | `citemind_scores` | Published item with citemind gate_status = 'blocked' |
| `content_low_citation_rate` | `citation_summaries` | Org mention_rate < 5% across monitored engines |

### SEO Signal Ingestor (`sageSEOSignalIngestor.ts`)

| Signal Type | Source | Trigger Condition |
|-------------|--------|-------------------|
| `seo_position_drop` | `seo_keyword_metrics` | Keyword position declined vs prior period |
| `seo_opportunity_keyword` | `seo_keyword_metrics` | Keyword in positions 5–15 (low-hanging fruit) |
| `seo_content_gap` | `seo_keywords` | High-volume keyword with no linked `content_item` |
| `competitor_citation_gap` | `citation_monitor_results` | Competitor cited in 3+ responses where brand was absent |

---

## Signal Schema

All signals are stored in `sage_signals` with this structure:

```typescript
{
  id: uuid
  org_id: uuid
  signal_type: string           // one of the signal types above
  pillar: 'PR' | 'Content' | 'SEO'
  source_table: string          // which table the signal came from
  source_id: uuid               // the specific row (journalist_id, content_item_id, etc.)
  signal_data: jsonb            // raw data relevant to the signal
  evi_impact_estimate: number   // projected EVI delta if acted on (see Scoring below)
  confidence: number            // 0.0–1.0
  priority: 'critical' | 'high' | 'medium' | 'low'
  scored_at: timestamptz
  expires_at: timestamptz       // signals are not permanently valid
}
```

---

## Opportunity Scorer (`sageOpportunityScorer.ts`)

The scorer assigns `evi_impact_estimate`, `confidence`, and `priority` to each signal using a composite formula.

### EVI Impact Heuristics

| Signal Type | EVI Impact Estimate |
|-------------|-------------------|
| High-DA journalist pitched and replied | +3–5 |
| Coverage gap filled (new content published in cluster) | +1–3 |
| Position 5–15 keyword captured (moved to top 3) | +0.5–2 |
| Stale pitch followed up → reply received | +1–2 |
| Low-CiteMind content corrected → passed gate | +0.5–1.5 |
| Citation rate improved from <5% to >15% | +2–4 |

These are estimates used to rank proposals — not guarantees. The actual EVI delta is calculated retrospectively by the nightly `evi:recalculate` job.

### Priority Thresholds

| Priority | EVI Impact |
|----------|-----------|
| `critical` | > 5 |
| `high` | 3–5 |
| `medium` | 1–3 |
| `low` | < 1 |

### Signal TTL (expires_at)

| Signal Type | TTL |
|-------------|-----|
| PR pitch windows | 7 days |
| SEO opportunity keywords | 14 days |
| Content coverage gaps | 30 days |
| All others | 14 days |

After `expires_at`, signals are not displayed in the Action Stream even if no proposal was acted on.

---

## Proposal Generator (`sageProposalGenerator.ts`)

The generator takes scored signals from `sage_signals` and creates human-readable `sage_proposals`.

### LLM Strategy

**Primary:** Claude (Anthropic) — `claude-sonnet-4-20250514`  
**Fallback:** Stub generator — deterministic templates for all 9 core signal types  
**Trigger for fallback:** LLM unavailable, monthly budget exceeded, or LLM parse failure

Every call to the LLM:
1. Checks `llm_usage_ledger` for org's monthly token consumption
2. Enforces plan limit: Starter 500K tokens/month, Pro 5M, Growth 20M
3. Uses JSON mode — system prompt explicitly requires `{ title, rationale, suggested_action }` JSON
4. On parse failure: falls back to stub (never surfaces raw LLM text to the user)
5. Logs to `llm_usage_ledger`: model, prompt_tokens, completion_tokens, cost_usd

**Max proposals per scan cycle:** 10, sorted by `evi_impact_estimate DESC`. This prevents LLM cost runaway and ensures only the highest-leverage proposals surface.

### Prompt Strategy

The system prompt is org-aware:
- Org name and industry from `orgs` table
- Brand voice: professional, specific, action-oriented
- Required output: strict JSON schema (no prose outside the JSON)

The user prompt provides:
- Signal type and description
- Signal data (journalist name/DA, keyword position, content title/score, etc.)
- EVI impact estimate and confidence
- Instruction to generate a title (< 10 words), rationale (2–3 sentences), and suggested_action

### Proposal Schema

```typescript
{
  id: uuid
  org_id: uuid
  signal_id: uuid               // traceable to source signal
  signal_type: string
  pillar: 'PR' | 'Content' | 'SEO'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string                 // LLM-generated, < 10 words
  rationale: string             // LLM-generated, 2–3 sentences
  suggested_action: string      // LLM-generated, 1 sentence
  evi_impact_estimate: number
  confidence: number
  mode: 'manual' | 'copilot'   // determined by org's pillar mode preference
  deep_link: { href: string, label: string }  // routes into relevant surface
  status: 'active' | 'dismissed' | 'executed' | 'expired'
  reasoning_trace: jsonb        // full audit: signal data, prompt, raw LLM response
  expires_at: timestamptz
}
```

The `reasoning_trace` field is non-negotiable audit infrastructure. It stores the complete chain of reasoning: the input signal data, the exact prompt sent to the LLM, and the raw response before parsing.

---

## Action Stream Service (`sageActionStreamService.ts`)

Maps `sage_proposals` to the `ActionItem` contract consumed by the dashboard.

Key mappings:
- DB pillar `'PR'` → frontend `'pr'`, `'Content'` → `'content'`, `'SEO'` → `'seo'`
- Signal type → EVI driver: PR signals → `'visibility'`, Content → `'authority'`, SEO → `'authority'`/`'momentum'`
- Signal type → action type: proposals → `'proposal'`, alerts → `'alert'`
- Rationale split on `\n\nRecommended: ` → `summary` and `recommended_next_step`

The `ActionItem` type contract is defined in `@pravado/types` and must not be changed without versioning.

---

## Background Job

**Worker:** `sageSignalScanWorker.ts`  
**Job name:** `sage:signal-scan`  
**Schedule:** Every 4 hours per org  
**Sequence:**
1. `sageSignalIngestor.ingestAll(orgId)` — runs all 3 pillar ingestors, deduplicates against existing unprocessed signals, batch inserts new signals
2. `sageOpportunityScorer.scoreAll(orgId, signals)` — scores and saves to `sage_signals`
3. `sageProposalGenerator.generateProposals(supabase, orgId)` — generates up to 10 proposals from top unprocessed signals

**Deduplication:** Before inserting a new signal, checks for an existing signal with the same `source_id` + `signal_type` that hasn't expired. Skips if duplicate.

---

## Feature Flags

| Flag | Default | Controls |
|------|---------|---------|
| `ENABLE_SAGE_SIGNALS` | `true` | Signal ingestion and scoring |
| `SAGE_PROPOSALS_ENABLED` | `true` | Proposal generation and Action Stream |

When `SAGE_PROPOSALS_ENABLED` is false, the Action Stream returns an empty array. The frontend shows the "Setup needed" empty state.

---

## Minimum Data Thresholds

SAGE produces poor proposals if given too little data. Before the signal scan runs, it checks:

- At least 3 `content_items` for the org, OR
- At least 3 `journalist_profiles` for the org

If neither threshold is met, the scan is skipped and a log message is written. The onboarding flow (S-INT-07) is specifically designed to collect enough data to cross these thresholds before the activation screen fires.

---

## Strategy Panel (Command Center)

The Strategy Panel is the aggregated SAGE view in the Command Center. It combines:
- Current EVI score + delta (from `eviCalculationService`)
- Top 3 active proposals by priority + evi_impact_estimate
- EVI driver breakdown (which sub-score is pulling EVI up or down)

This is served by `GET /api/v1/sage/strategy-panel` → proxied through the Next.js dashboard.

---

## Known Limitations (v1.0)

1. **No user feedback loop** — dismissed or executed proposals do not yet train the scorer. A future version will downweight signal types the user consistently ignores.
2. **No cross-pillar proposal weighting** — a signal that affects multiple pillars (e.g., a journalist who also writes about a topic cluster the brand hasn't covered) generates separate proposals. Future: cross-pillar synthesis.
3. **LLM proposal quality degrades with sparse data** — the stub fallback is used when data is thin. It produces useful but less personalized proposals.
4. **Mode filtering is read-only** — proposals respect `copilot`/`manual` mode preferences in their labeling but AUTOMATE execution (autopilot mode) is not yet wired.

---

*This is the authoritative architecture reference for the SAGE Protocol. Code is the implementation; this document is the specification. Discrepancies are bugs.*
