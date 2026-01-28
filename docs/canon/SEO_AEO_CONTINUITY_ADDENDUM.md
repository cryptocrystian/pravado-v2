# SEO/AEO Continuity Addendum

> **Version:** 0.1
> **Status:** Canonical / Foundational / Invariants-Only
> **Last Updated:** 2026-01-27
> **Authority:** UX_CONTINUITY_CANON.md (primary), AUTOMATE_EXECUTION_MODEL.md, SAGE_OPERATING_MODEL.md

---

## 1. Purpose

This document is **NOT** a full SEO/AEO Work Surface PRD. It is a **continuity enforcement addendum** that establishes foundational invariants BEFORE implementation begins.

**Goals:**
- Prevent siloed SEO tools that violate platform mental model
- Ensure SEO/AEO work surfaces inherit platform-wide UX patterns
- Define integration constraints that enforce cross-pillar visibility
- Establish mode system compliance requirements

**Non-Goal:**
- This document does not specify wireframes, component hierarchies, or API contracts. Those belong in future versions (v0.2 Work Surface Contract, v1.0 Full Specification).

---

## 2. Relationship to Canon

This addendum inherits from and extends the following canonical documents:

| Document | Relationship |
|----------|--------------|
| `UX_CONTINUITY_CANON.md` | **Primary authority** — all 10 invariants apply to SEO/AEO |
| `AUTOMATE_EXECUTION_MODEL.md` | Mode governance for SEO actions |
| `AUTOMATION_MODES_UX.md` | Mode definitions (Manual/Copilot/Autopilot) |
| `SAGE_OPERATING_MODEL.md` | Cross-pillar reinforcement coefficients |
| `CITEMIND_SYSTEM.md` | AI ingestion/citation quality enforcement |
| `CORE_UX_FLOWS.md` | Flow 5 (SEO Workflow) definition |
| `UX_SURFACES.md` | SEO Work Surface canonical definition |

**Conflict Resolution:** If any invariant in this addendum conflicts with the documents above, the parent canon document wins. This addendum adds SEO/AEO-specific constraints; it does not override platform-wide invariants.

---

## 3. SEO/AEO Mental Model Invariant

### Core Principle

> **SEO/AEO = "Ingestion Readiness" + "Authority Signal Optimization"**
>
> The user optimizes content for AI discovery and citation potential, NOT for keyword density manipulation.

### Mental Model Components

| Component | Definition | Anti-Pattern |
|-----------|------------|--------------|
| **Ingestion Readiness** | Content structured for AI crawlers to extract, index, and cite | Keyword stuffing, hidden text, schema spam |
| **Authority Signal Optimization** | Building topical authority through semantic depth and cross-pillar reinforcement | Vanity metrics, isolated keyword rankings |
| **Citation Eligibility** | Content meeting CiteMind Engine 1 thresholds for AI citation potential | Gaming citation without substantive authority |

### SAGE Integration

Per SAGE_OPERATING_MODEL.md, SEO/AEO actions affect the Signal-Authority-Growth-Exposure mesh:

- **Signal → Authority:** SEO improvements increase Authority score via `reinforcement_coefficient: 0.3`
- **Authority → Exposure:** Higher Authority increases AI ingestion likelihood
- **Cross-pillar decay:** SEO signals decay at `λ = 0.05/day` without reinforcing PR/Content activity

**Invariant:** SEO metrics MUST display their SAGE mesh position. Users see how SEO actions affect Authority, not just keyword rankings.

---

## 4. Entry Point Invariants

Per UX_CONTINUITY_CANON.md Invariant 2 (Entry Point Invariant):

> **"Context-required entry points. No blank-page-first."**

### Forbidden Entry Patterns

| Pattern | Violation | Required Alternative |
|---------|-----------|---------------------|
| Blank keyword explorer | Violates context-first | Enter via content gap, competitor analysis, or Command Center action |
| Standalone rank tracker | Violates Invariant 1 (unified orchestration) | Rankings shown in context of content assets and authority goals |
| Isolated backlink dashboard | Siloed tool, no execution gravity | Backlinks surfaced as Authority signals tied to specific content |

### Required Entry Patterns

SEO/AEO surfaces MUST support these context-first entry points:

1. **From Command Center Action Stream:** SEO-related actions (e.g., "Fix technical blockers on /pricing") open SEO surface with asset pre-selected
2. **From Content Library:** Asset-level SEO view shows ingestibility, keyword coverage, citation eligibility
3. **From Strategy Panel:** SEO recommendations appear as orchestrated work items, not isolated suggestions
4. **From Orchestration Calendar:** Scheduled SEO tasks (crawl fixes, content refresh) visible alongside PR/Content

**Invariant:** A user MUST NOT encounter a blank keyword input field as their first interaction. SEO surfaces always open with context (selected asset, active gap, or pending action).

---

## 5. Execution Gravity Invariant

Per UX_CONTINUITY_CANON.md Invariant 1 (Core Mental Model):

> **"User operates a unified orchestration system, not separate tools."**

### Execution Binding Requirements

Every SEO insight MUST bind to:

| Binding Target | Example |
|----------------|---------|
| **Content Asset** | "This page needs schema markup" → linked to specific asset |
| **Calendar Slot** | "Recommended refresh date: Feb 15" → schedulable action |
| **Authority Goal** | "Improving this increases topical authority by +4%" → SAGE impact visible |
| **PR Opportunity** | "High-authority backlink opportunity" → routes to PR pitch pipeline |

### Anti-Gravity Violations

The following patterns violate execution gravity:

- **Floating metrics:** Rankings displayed without tied improvement actions
- **Orphan recommendations:** "Add more internal links" without specifying source/target
- **Dashboard-only views:** Pages showing SEO data without next-step affordances

**Invariant:** No SEO data exists in isolation. Every metric, recommendation, or insight has execution binding to a real object (asset, action, calendar slot, or authority goal).

---

## 6. Mode System Invariant

Per AUTOMATE_EXECUTION_MODEL.md and AUTOMATION_MODES_UX.md:

> **Reuse existing Manual/Copilot/Autopilot modes. Do NOT reinvent mode vocabulary.**

### Mode Application to SEO Actions

| SEO Action Type | Risk Level | Mode Ceiling | Rationale |
|-----------------|------------|--------------|-----------|
| Technical audit (read-only scan) | Low | Autopilot | Non-destructive, reversible |
| Schema markup suggestion | Low | Autopilot | Proposal only, no auto-publish |
| Meta description rewrite | Medium | Copilot | User approval before publish |
| Canonical URL change | High | Manual | SEO-critical, potential de-index risk |
| Robots.txt modification | Critical | Manual | Site-wide crawl impact |
| Redirect implementation | High | Manual | Link equity preservation required |

### Mode Inheritance

SEO surfaces inherit the organization's pillar-level mode configuration:

```
Organization Mode Settings
└── SEO Pillar Mode (default: Copilot)
    ├── Technical Audits: Autopilot (overridable)
    ├── On-Page Optimization: Copilot
    └── Structural Changes: Manual (ceiling)
```

**Invariant:** SEO actions MUST use the AUTOMATE mode vocabulary. No "SEO-specific automation levels" or custom mode names. Mode ceiling enforcement per AUTOMATE_EXECUTION_MODEL.md risk classification.

---

## 7. Explainability & Governance Invariants

Per AUTOMATE_EXECUTION_MODEL.md Section 4 (Explainability Framework):

### 3-Level Explainability Requirements

Every AI-generated SEO recommendation MUST support:

| Level | Content | Example |
|-------|---------|---------|
| **User Summary** | Plain-language outcome | "This change improves AI citation likelihood by 12%" |
| **Technical Detail** | Factors and weights | "Based on: semantic density (0.4), schema completeness (0.3), authority signals (0.3)" |
| **Causal Chain** | Full decision trace | "Triggered by: low CiteMind Engine 1 score → analyzed competitor schemas → identified missing FAQ markup" |

### CiteMind Gating

Per CITEMIND_SYSTEM.md, SEO recommendations affecting AI visibility MUST pass CiteMind validation:

| CiteMind Engine | SEO Gate |
|-----------------|----------|
| **Engine 1 (AI Ingestion & Citation)** | Required for any "citation eligibility" claim |
| **Engine 2 (Audio Transformation)** | Required for voice search optimization recommendations |
| **Engine 3 (Intelligence & Monitoring)** | Provides competitive intelligence for gap analysis |

**Invariant:** SEO recommendations claiming AI/AEO impact MUST cite their CiteMind engine source. No "black box" AI visibility claims.

### Audit Trail Requirements

Per AUTOMATE_EXECUTION_MODEL.md Section 6:

- All SEO changes logged with: timestamp, actor (user/AI), mode, before/after state
- Rollback capability for Copilot/Autopilot actions
- 90-day audit retention minimum

---

## 8. Cross-Pillar Visibility Invariants

Per UX_CONTINUITY_CANON.md Invariant 5 (Cross-Pillar Awareness):

> **"Single source of truth. User sees one reality across all pillars."**

### SEO Effects Visibility Matrix

| SEO Action | Visible In | Display Format |
|------------|------------|----------------|
| Keyword gap identified | Content Work Surface | "Content opportunity: [keyword]" with brief generation CTA |
| Technical fix completed | Command Center Action Stream | Completed action with impact metric |
| Authority score change | Strategy Panel | SAGE mesh visualization update |
| Citation eligibility improvement | Content Library asset detail | CiteMind badge status change |
| Backlink opportunity | PR Work Surface | Pitch suggestion with authority context |

### Forbidden Isolation Patterns

SEO surfaces MUST NOT:

- Display metrics invisible to other pillars
- Create SEO-only "wins" without SAGE mesh impact
- Generate recommendations that bypass Content/PR pipelines

**Invariant:** Every SEO insight of significance appears in at least one other pillar surface. SEO never operates as a closed loop.

### SAGE Reinforcement Coefficients

Per SAGE_OPERATING_MODEL.md, SEO actions propagate through the mesh:

| From SEO | To Pillar | Coefficient | Latency |
|----------|-----------|-------------|---------|
| Technical fix | Content Authority | 0.2 | Immediate |
| Ranking improvement | PR Signal value | 0.15 | 24-48h |
| Citation eligibility gain | Content CiteMind score | 0.4 | Immediate |
| Backlink acquisition | Authority (all pillars) | 0.35 | 24-48h |

---

## 9. Non-Goals / Anti-Patterns

This section explicitly forbids patterns that would violate platform continuity.

### Forbidden Patterns

| Anti-Pattern | Violation | Why Forbidden |
|--------------|-----------|---------------|
| **Siloed SEO dashboard** | Invariant 1 (unified orchestration) | Creates mental model fragmentation |
| **Vanity metric displays** | Execution gravity | Rankings without action binding are noise |
| **Keyword stuffing suggestions** | Mental model (authority, not manipulation) | Violates "Ingestion Readiness" principle |
| **Standalone rank tracker** | Entry point invariant | Blank-page-first, no context |
| **SEO-only automation mode** | Mode system invariant | Must use platform AUTOMATE modes |
| **Black-box AI recommendations** | Explainability invariant | Must support 3-level explainability |
| **Competitor-only views** | Cross-pillar visibility | Must tie to own authority/content gaps |
| **Bulk action without approval** | Mode ceiling (High/Critical actions) | Violates AUTOMATE governance |

### Non-Goals for v0.1

This addendum intentionally does NOT specify:

- Component hierarchies or wireframes
- API route definitions
- Database schema for SEO entities
- Specific UI density or visual treatments
- Integration with external SEO tools (Ahrefs, SEMrush, etc.)

These belong in v0.2 (Work Surface Contract) and v1.0 (Full Specification).

---

## 10. Versioning

| Version | Scope | Status |
|---------|-------|--------|
| **v0.1** | Invariants-only (this document) | Current |
| **v0.2** | Work Surface Contract (entry points, data model, API sketch) | Planned |
| **v1.0** | Full Specification (wireframes, component spec, integration details) | Planned |

### Version Transition Rules

- **v0.1 → v0.2:** Requires invariant compliance verification
- **v0.2 → v1.0:** Requires UX review against UX_CONTINUITY_CANON.md
- **Any version:** Must pass canon conflict check before merge

---

## 11. Canon Terms Glossary

Terms used in this document as defined in parent canon:

| Term | Source | Definition |
|------|--------|------------|
| **Ingestion Readiness** | This document (new) | Content optimization for AI crawler extraction and indexing |
| **Authority Signal Optimization** | SAGE_OPERATING_MODEL.md | Building topical authority through SAGE mesh |
| **Citation Eligibility** | CITEMIND_SYSTEM.md | Content meeting Engine 1 thresholds for AI citation |
| **Execution Gravity** | UX_CONTINUITY_CANON.md | Work tied to real objects/outcomes |
| **Mode Ceiling** | AUTOMATE_EXECUTION_MODEL.md | Maximum automation level for action risk class |
| **SAGE Mesh** | SAGE_OPERATING_MODEL.md | Signal-Authority-Growth-Exposure reinforcement network |
| **3-Level Explainability** | AUTOMATE_EXECUTION_MODEL.md | User Summary / Technical Detail / Causal Chain |
| **Context-First Entry** | UX_CONTINUITY_CANON.md | No blank-page-first interaction patterns |

---

## Appendix A: Invariant Checklist for Implementation

Future implementers MUST verify these invariants before SEO/AEO work surface development:

- [ ] Entry points require context (no blank keyword explorer)
- [ ] All metrics bind to execution targets (assets, actions, calendar slots)
- [ ] Mode system uses AUTOMATE vocabulary (Manual/Copilot/Autopilot)
- [ ] Mode ceilings enforced per risk classification
- [ ] 3-level explainability implemented for AI recommendations
- [ ] CiteMind gating for AI visibility claims
- [ ] Cross-pillar visibility for significant SEO events
- [ ] SAGE mesh impact displayed for authority-affecting actions
- [ ] Audit trail for all Copilot/Autopilot actions
- [ ] No siloed dashboards or vanity metrics

---

*This document is part of the PRAVADO v2 canon. Changes require canon review process per CHANGE_CONTROL.md.*
