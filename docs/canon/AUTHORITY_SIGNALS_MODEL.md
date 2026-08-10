# AUTHORITY SIGNALS MODEL

**Layer:** Model Canon
**Status:** Canonical
**Governs / Subordinate-to:** Governs the content Authority Signals model; subordinate to the EVI model (`EVI_MATHEMATICS.md`) and CiteMind (`CITEMIND_SYSTEM.md`)
**Supersedes:** none

> **Authority:** This document defines the computation of the five content-level Authority Signals (`content_authority_signals`, CONTENT_WORK_SURFACE_CONTRACT §4.5). Ratified per **D038**.
> **Charter note:** Authority is a **35% sub-component of EVI** (a Foundational Model, D033). These formulas feed EVI → SAGE → proposals. Every formula below is traced to a canonical anchor; none is invented freely.

---

## 1. Purpose

CONTENT_WORK_SURFACE_CONTRACT §4.5 and CONTENT_PILLAR_SYSTEM §2.5 name five per-asset authority signals and frame two in "EVI points," but define no computation. This document ratifies the formulas. Each signal is 0–100 unless noted; `competitive_authority_delta` is [-100, 100].

**Anti-gaming compliance (EVI_MATHEMATICS §8):** every formula is quality-weighted — low-CiteMind / gate-blocked content contributes little or nothing, so authority cannot be inflated by volume. This satisfies §8.3 ("keyword stuffing → reduce Authority contribution").

---

## 2. The five signals

### 2.1 Citation Eligibility

```
citation_eligibility = citemind_scores.overall_score
```

- **Anchor:** CONTENT_REBUILD_BRIEF §56 equates "CiteMind score (citation eligibility)." No new math.
- **Source:** `citemind_scores.overall_score` (weighted 6-factor CiteMind composite).

### 2.2 AI Ingestion Likelihood

```
ai_ingestion_likelihood = mean(schema_markup_score, structural_clarity_score, entity_density_score)
```

- **Anchor:** SAGE_OPERATING_MODEL §Engine-1 — "AI Ingestion: schema generation strengthens entity recognition; indexing accelerates AI comprehension." These three CiteMind factors are the canonical mechanism of machine parseability/ingestion.
- **Weighting:** equal-weight mean — no sub-weight is invented (D038).
- **Source:** `citemind_scores.{schema_markup_score, structural_clarity_score, entity_density_score}`.

### 2.3 Authority Contribution Score

```
authority_contribution = overall_score × gate_factor
  where gate_factor = 1.0 if gate_status = 'passed'
                      0.5 if gate_status = 'warning'
                      0.0 if gate_status = 'blocked'
                      0.0 if gate_status IN ('pending','analyzing')  // not yet scored
```

- **Anchor:** EVI_MATHEMATICS §2.2 — a content asset contributes to org Authority chiefly via Citation Quality (0.30) and Schema Coverage (0.15). Anti-gaming §8.3 requires blocked/low-quality content to contribute ~0; the `gate_factor` enforces this.
- **Source:** `citemind_scores.{overall_score, gate_status}`, where `gate_status ∈ {pending, analyzing, passed, warning, blocked}` (migration 82 CHECK constraint; the scorer emits `passed`/`warning`/`blocked`). Not-yet-scored states (`pending`, `analyzing`) contribute 0.

### 2.4 Cross-Pillar Impact (EVI points)

```
cross_pillar_impact_EVI = (authority_contribution / 100) × 0.35 × (1 + 0.45 + 0.70)
```

- **Anchors (coefficients verbatim canon):** EVI_MATHEMATICS §7.5 (`EVI_points = authority_lift × 0.35`) + SAGE_OPERATING_MODEL §3.3 reinforcement matrix (Content→PR **0.45**, Content→SEO **0.70**). The asset's direct EVI-authority contribution plus its reinforced lift into the PR and SEO pillars.
- **Note:** this replaces the illustrative hardcoded "+2.1 EVI pts" (removed as fabrication) with a computed value. `0.35`, `0.45`, `0.70` are canon-verbatim; the aggregation form is ratified per D038.
- **Unit:** EVI points (not 0–100).

### 2.5 Competitive Authority Delta — DATA-GATED

```
competitive_authority_delta = our_topic_authority − competitor_topic_authority
```

- **Anchor:** EVI_MATHEMATICS §8.1 "Competitive Relativity"; CONTENT_WORK_SURFACE_CONTRACT §902 (EVI-pt framing).
- **Status:** requires competitor authority data (competitor CiteMind / SERP / backlinks), sourced from **DataForSEO** (not yet provisioned). Until then this signal is **null / "not available"** — never estimated or faked.

---

## 3. Persistence & cadence

- Computed on content scoring and on the nightly EVI recalculation; persisted to `content_authority_signals` (org-scoped, RLS per migration 105).
- `competitive_authority_delta` column stays null until DataForSEO is provisioned.
- Insights surface renders each signal from `content_authority_signals`; the data-gated signal renders an explicit "not available" state.

---

## 4. Provenance summary

| Signal                      | Provenance                                                                    | Ships         |
| --------------------------- | ----------------------------------------------------------------------------- | ------------- |
| Citation Eligibility        | Canonical equivalence (CiteMind ≡ citation eligibility)                       | now           |
| AI Ingestion Likelihood     | Derived from canonical Engine-1 ingestion factors                             | now           |
| Authority Contribution      | Newly-defined (D038), grounded in EVI §2.2 + anti-gaming §8.3                 | now           |
| Cross-Pillar Impact         | Newly-defined aggregation (D038); coefficients verbatim (EVI §7.5, SAGE §3.3) | now           |
| Competitive Authority Delta | Newly-defined (D038), grounded in EVI §8.1                                    | on DataForSEO |
