# PRAVADO — Model Integrity Charter

**Layer:** Model Canon (governs canon itself)
**Status:** Canonical — tier-1, companion to `PRODUCT_CONSTITUTION.md`
**Version:** 1.0
**Ratified:** 2026-08-05 (D033). Article I ratified by founder; Definition + Articles II–V and the C1/C2 applications decided under delegated PM authority.
**Supersedes:** none (new). **Governs:** all canon documents.

---

## Why this exists (the failure it prevents)

The scoped models were never the problem. The conflicts found in canon — two definitions of SAGE, three EVI band sets, duplicate decision IDs — share **one mechanism**: _implementation notes were allowed to enter canon wearing a "CANONICAL" badge and redefine a model to match whatever got built._ `SAGE_ARCHITECTURE.md` ("reflects production implementation") re-expanded SAGE's acronym and competed with the vision docs; `EVI_FORMULA.md` documented the shipped proxy and named the code file. Canon drifted for the same reason code did: **nothing gated what entered canon, and no rule forced a new doc to declare itself subordinate to the model it describes.** This Charter makes that structurally impossible.

---

## Definition — what "Foundational Model" means

A **Foundational Model** is a named **engine or formal model** that passes **all three** tests:

1. **Mechanism** — it has an internal computational/behavioral mechanism (a mesh, pipeline, formula, graph), not merely a principle or a policy.
2. **Cross-cutting** — it spans more than one pillar or surface; it is not local to a single screen.
3. **Redefinition-catastrophe** — if silently redefined, _what the product is or computes_ changes.

**Protected, but NOT Foundational Models** (they fail the _Mechanism_ test) — each protected under its own category:

| Not a model                      | What it is                             | Protected as                                      |
| -------------------------------- | -------------------------------------- | ------------------------------------------------- |
| 3-Pillar compounding thesis      | positioning _principle_                | Non-Negotiable Truth in `PRODUCT_CONSTITUTION.md` |
| Modes (Manual/Copilot/Autopilot) | _policy / UX contract_ governing CRAFT | `AUTOMATION_MODE_CONTRACTS_CANON.md`              |
| Pillars, Surfaces, Design System | structure & expression                 | UX_SURFACES / DS v3                               |

"Constitution-level protection" is broader than the model list; the Charter simply refuses to _conflate_ an engine with a principle or a policy.

---

## Article I — Canon has two layers, and they never cross

| Layer                          | Answers                      | Authority                    | May it redefine a model? |
| ------------------------------ | ---------------------------- | ---------------------------- | ------------------------ |
| **Model Canon**                | _What the product IS_        | Highest — constitution-level | —                        |
| **Implementation-Status Docs** | _What is built, which phase_ | Subordinate                  | **No. Never.**           |

- An Implementation-Status doc may only **report gap-to-vision** (current phase, known limitations). If it **contradicts** a Model, it is **auto-invalid** — not a "conflict to reconcile."
- **Tiebreaker (makes the authority order total):** within any authority tier, **Model Canon outranks Implementation-Status.** Same-tier collisions like `SAGE_v2.md` vs `SAGE_ARCHITECTURE.md` resolve deterministically without a per-case human ruling.

## Article II — The Foundational Models

They change **only** by named human ratification; **no agent, session, or sprint doc may alter or re-scope them within a run.**

| Model                 | Canonical defining doc(s)                          | Mechanism                   | Invariant                                                                                |
| --------------------- | -------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| **SAGE**              | `SAGE_v2.md`, `SAGE_OPERATING_MODEL.md`            | feedback mesh               | Signal·Authority·Growth·Exposure **feedback mesh** — cross-pillar, causal. Not a scorer. |
| **CRAFT** (execution) | `AUTOMATE_v2.md` / CRAFT canon (D031 rename)       | governed execution pipeline | Turns SAGE proposals into governed, mode-aware, traceable tasks. No silent automation.   |
| **CiteMind**          | CiteMind canon                                     | citation-tracking pipeline  | Qualifies content, tracks AI citations, measures brand authority in LLM answers.         |
| **EVI**               | `EARNED_VISIBILITY_INDEX.md`, `EVI_MATHEMATICS.md` | scoring formula             | EVI = Visibility·0.40 + Authority·0.35 + Momentum·0.25, canonical sub-math.              |
| **Entity Map**        | `ENTITY_MAP_SPEC.md`, `ENTITY-MAP-SAGE.md`         | knowledge graph             | The entity/relationship graph SAGE reasons over; zone model per D012.                    |

## Article III — Supersession discipline (no silent peers)

Every canon doc carries a header block:

```
Layer: Model | Implementation-Status
Status: Canonical | Phase-N Implementation | Superseded
Governs / Subordinate-to: <Model name or doc>
Supersedes: <doc(s) or "none">
```

A doc that does not declare its layer and its relationship to existing docs is **rejected by `canon-gates`**. This extends the existing strikethrough / `docs/_archive/canon-superseded/` convention to _every_ doc (at ratification, only 12 of 57 top-level docs declared status).

## Article IV — Conformance is gap-to-vision, not pass/fail

- Code is measured against the **Model**, reported as **"Phase N of M,"** never "done/broken."
- An Implementation-Status doc **records the current phase; it may never redefine "done" downward.** The gap between model and code is the **roadmap**, kept visible on purpose.

## Article V — Amendment & enforcement

1. Foundational Models change only by a named human decision entry in `DECISIONS_LOG.md`.
2. The authority order is **total**: category rank → Article-I layer tiebreaker → latest ratified decision ID.
3. `canon-gates` enforces: unique decision IDs, declared headers (Article III), no Implementation-Status doc contradicting a Model.
4. This Charter is amendable only by the same named-ratification path.

---

_First applications of this Charter are recorded as D033 (this Charter), D034 (SAGE identity), D035 (EVI bands), and the D025/D026 → D031/D032 decision-ID deduplication. See `DECISIONS_LOG.md`._
