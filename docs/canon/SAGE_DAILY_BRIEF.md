# SAGE DAILY BRIEF

**Layer:** Model Canon
**Status:** Canonical
**Governs / Subordinate-to:** Governs the SAGE Daily Brief; subordinate to the SAGE model (`SAGE_v2.md`, `SAGE_OPERATING_MODEL.md`)
**Supersedes:** none

> **Authority:** Defines the SAGE Daily Brief — the org-level daily cross-pillar narrative on the Command Center. Ratified per **D039**.
> **Charter note:** A SAGE output (SAGE is a Foundational Model, D033). The brief summarizes real SAGE signals; it never fabricates. This doc exists because the feature drifted once (backend never built, card left permanently empty) — canon anchors it.

---

## 1. Definition

The SAGE Daily Brief is the **org-level, daily, cross-pillar** narrative at the top of the Command Center (and mobile Today tab): **"what changed, what's emerging, and your single highest-leverage move today."** It is a 2–4 sentence orientation grounded in real SAGE signals, with the top action surfaced — the product's heartbeat, not a report.

- **Cadence: DAILY.** (Canonical. Any "weekly" framing on existing surfaces is drift to be corrected.)
- **Scope: org-level.** Per-user / persona / role-targeted variants are OUT of scope until user personas are canonized (§5).

---

## 2. Inputs (real, structured — the brief summarizes, never invents)

| Input                                 | Source                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| Prioritized opportunities / proposals | `sage_proposals` / `sage_signals`                      |
| Top action(s) today                   | SAGE action-stream (`sage_proposals`, pillar-agnostic) |
| EVI movement                          | `evi_snapshots` — current vs prior-period delta        |
| Citation movement                     | `citation_summaries` / `citation_monitor_results`      |

Every input is a real row. The generator renders them into prose; it does not introduce facts, numbers, or trends absent from the inputs.

---

## 3. Output

- Populates the existing Command Center field `daily_brief?: string | null` (served by the SAGE action-stream endpoint), rendered by the Situation Brief card (iris accent) and mirrored on the mobile Today tab.
- **Phase 1:** a 2–4 sentence narrative string + the single top action.
- **Phase 2 (optional, later):** structured highlights (`changed[] / emerging[] / topAction`) — additive.

---

## 4. Honesty rule (mirrors the shipped SAGE proposal generator)

1. **Grounded-only.** Every claim traces to a real input row. No invented content.
2. **LLM-primary with deterministic stub fallback** — same pattern as `sageProposalGenerator`: Primary = LLM renders real signals into prose; Fallback = deterministic template assembled from the same real signals. Fallback triggers: LLM unavailable, monthly token budget exceeded, or parse failure. Honest in both modes (both consume only real signals).
3. **Honest empty state.** When real signals are insufficient (new org, no proposals/snapshots), the brief renders the empty state ("SAGE is analyzing your signals…") — never a back-filled narrative.
4. **Budget discipline.** The brief shares the per-org monthly LLM budget with SAGE proposal generation; on exhaustion it degrades to the deterministic stub and must not starve proposal generation below a reserve.
5. **Traceability.** The generated brief records the signal ids / snapshot it summarized (SAGE reasoning-audit discipline).

---

## 5. Out of scope (deferred)

- **Persona / role-targeted briefs** (e.g. CEO / Board / Investor). These require a canonized user-persona model, which does **not** exist (no `USER_PERSONAS.md`; the "12+ personas" figure was never canonized). Canonize personas first if desired.
- **Executive Digest / Media Briefing** (weekly/monthly, multi-recipient) — separate, heavier artifacts; not the daily brief.
- **Multi-brand (agency) briefs** — single-brand-per-org today.

---

## 6. Delivery & drift reconciliation

- **Cadence:** nightly generation (after EVI recalc + the SAGE signal scan), persisted per org and served all day; on-demand regeneration permitted (e.g. onboarding activation). Fulfills the onboarding promise of a first brief.
- **Canonical home:** the Command Center Situation Brief card. Any separate "weekly intelligence briefing" surface is drift and is reconciled to (or retired in favor of) this daily brief.

---

## 7. Provenance

| Element                                                | Basis                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Daily, org-level cross-pillar narrative                | SAGE model (`SAGE_v2.md`; `SAGE_OPERATING_MODEL.md` daily-batch cadence) |
| Inputs                                                 | Shipped SAGE/EVI/CiteMind tables (§2)                                    |
| Honesty rule (LLM + deterministic stub, grounded-only) | Existing `sageProposalGenerator` pattern                                 |
| Persona/role variants deferred                         | No canonized persona model (D039 scope note)                             |
