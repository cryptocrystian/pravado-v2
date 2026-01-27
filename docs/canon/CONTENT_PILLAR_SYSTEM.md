# Pravado — Content Pillar System Canon

**Status:** CANONICAL · IMPLEMENTATION-BINDING

**Precedence:**
- **Above:** Sprint docs, feature PRDs, UI tickets
- **Below:** CONTENT_PILLAR_CANON.md, PR_PILLAR_CANON.md

**Purpose:**
This document defines the operational system model for the Content pillar: objects, views, agents, playbooks, and cross-pillar bindings required to implement the Content work surface without drift.

> This document does not redefine strategy.
> It operationalizes the canon already defined in CONTENT_PILLAR_CANON.md.

---

## 0. Canon Inheritance (Non-Negotiable)

This system inherits all constraints from:

- `CONTENT_PILLAR_CANON.md`
- CiteMind governance rules
- SAGE strategic guidance
- AUTOMATE execution modes
- Pravado Design System v2

**If any implementation detail below conflicts with CONTENT_PILLAR_CANON.md, the canon wins.**

---

## 1. Content Pillar Mental Model (System-Level)

The Content pillar is not a feature set.
**It is a governed authority production system.**

Content exists to:
- Reinforce entities
- Enable citations
- Increase AI-readable authority
- Compound across PR + AEO

Therefore:

> Every object, view, agent, and playbook must answer:
> **"How does this increase durable authority?"**

---

## 2. Core System Objects (Authoritative)

These are the only first-class objects in the Content pillar.

### 2.1 Content Asset (Primary Object)

Represents a canonical authority artifact.

**Required properties:**
- Primary format (article, guide, landing page, etc.)
- Entity associations (brand, product, person, concept)
- Authority intent (what authority it reinforces)
- Lifecycle state: `Draft → Review → Approved → Published`
- CiteMind qualification state
- Cross-pillar linkages (PR, AEO)

**Rules:**
- No Content Asset exists without an authority intent
- Publishing is blocked unless CiteMind passes
- Assets are evaluated as authority infrastructure, not traffic units

### 2.2 Content Brief

Represents strategic intent translated into constraints.

**Required properties:**
- Strategic objective (SAGE-derived)
- Target entities + claims
- Allowed assertions
- Required citations
- Structural outline
- Downstream derivative map

**Rules:**
- All drafts must originate from a Brief
- AI may not draft outside Brief constraints
- Briefs are versioned and auditable

### 2.3 Derivative Surface (Structural, Not Copied)

Represents structural reuse, not duplication.

**Examples:**
- PR pitch excerpts
- AEO snippets
- AI-ready summaries
- Social fragments

**Rules:**
- Derivatives are linked to the parent Content Asset
- Editing a parent invalidates dependent derivatives
- No free-form derivative creation

### 2.4 Content Calendar Entry

Represents timing + authority sequencing, not just scheduling.

**Required properties:**
- Campaign / theme
- Primary asset reference
- Cross-pillar dependencies
- Authority timing signal
- Automation eligibility state

### 2.5 Authority Signal Record

Represents measured impact, not vanity metrics.

**Tracked signals:**
- Authority Contribution Score
- Citation Eligibility
- AI Ingestion Likelihood
- Cross-pillar lift (PR + AEO)
- Competitive Authority Delta

---

## 3. Content Work Surface Views (Locked)

Only the following views are permitted.

### 3.1 Content Overview

- Authority contribution (primary)
- Active themes
- AI ingestion readiness
- Cross-pillar hooks surfaced inline

### 3.2 Content Calendar

- Multi-format lanes
- Campaign grouping
- PR + AEO visibility
- AUTOMATE mode indicators

### 3.3 Content Editor

- Structured sections (not freeform chat)
- Inline CiteMind qualification feedback
- Entity grounding indicators
- Revision history visible

### 3.4 Content Library

- Filter by entity, theme, pillar
- Lifecycle state
- Authority state
- Derivative visibility

### 3.5 Optimization & Insights

- Authority deltas
- Citation readiness gaps
- Competitive authority gaps
- Repurposing efficiency

**Explicitly excluded:**
- Social scheduler clones
- Keyword stuffing views
- AI chat-style writing canvases

---

## 4. Content Agents (Minimal, Canon-Bound)

No speculative agents.
Only agents that map directly to system objects.

### 4.1 Content Strategy Agent

- Derives briefs from SAGE signals
- Identifies authority gaps
- Proposes calendar entries

### 4.2 Content Draft Agent

- Drafts only within approved Briefs
- Never invents facts
- Never bypasses CiteMind

### 4.3 CiteMind Qualification Agent

- Validates claims and assertions
- Scores citation readiness
- Blocks unsafe automation paths

### 4.4 Derivative Generation Agent

- Produces multi-surface derivatives
- Maintains structural linkage
- Optimizes per surface without re-authoring

### 4.5 Content Optimization Agent

- Identifies authority lift opportunities
- Suggests revisions only
- Feeds PR + AEO amplification signals

**Rules:**
- No agent publishes autonomously
- No agent overrides governance
- All agent output is explainable

---

## 5. Canonical Content Playbooks

Each playbook aligns to AUTOMATE modes and mirrors PR discipline.

### 5.1 Authority-Driven Content Brief Creation

- **Input:** SAGE signals + authority gaps
- **Output:** Brief + derivative map
- **Modes:** Recommend / Simulate

### 5.2 CiteMind-Governed Draft Production

- **Input:** Approved Brief
- **Output:** Draft + qualification report
- **Modes:** Copilot only

### 5.3 Multi-Surface Derivative Generation

- **Input:** Approved Content Asset
- **Output:** PR excerpts, AEO snippets, social fragments
- **Modes:** Recommend / Copilot

### 5.4 Authority Optimization Loop

- **Input:** Published asset + signals
- **Output:** Revision recommendations
- **Modes:** Recommend / Simulate

### 5.5 Cross-Pillar Amplification Trigger

- **Input:** Authority spike or gap
- **Output:** PR hooks + AEO updates
- **Modes:** Recommend

---

## 6. Cross-Pillar Binding Rules

### With PR

- Content feeds pitch angles
- Coverage reinforces content authority
- Mentions loop back into optimization

### With AEO / SEO

- Content structured for AI answers
- Snippets extracted automatically
- Authority scores shared bidirectionally

### With Command Center

- Content actions surface as strategic levers
- Authority movement tracked globally

---

## 7. Metrics Doctrine (Non-Vanity)

### Primary

- Authority Contribution Score
- Citation Eligibility
- AI Ingestion Likelihood
- Cross-Pillar Impact
- Competitive Authority Delta

### Secondary

- Engagement (supporting signal only)
- Distribution performance
- Repurposing efficiency

> Word count, posting frequency, and "output volume" are explicitly non-goals.

---

## 8. Drift Guardrails (Hard Locks)

The Content pillar will **never** become:

- A social scheduler clone
- A keyword-stuffing engine
- A viral content generator
- A generic AI writer

**Any proposal that violates this section is canon-invalid.**

---

## 9. Implementation Contract

Engineering, UX, and AI systems must:

- Enforce CiteMind constraints at generation time
- Prevent bypass of governance
- Ensure all authority changes are traceable
- Support rollback for all automation

---

## 10. Final Canon Statement

Pravado Content is best-in-class because:

1. It matches incumbents where required
2. Exceeds them where it matters
3. Compounds authority across pillars
4. Aligns with the future of AI discovery

**This document, together with CONTENT_PILLAR_CANON.md, is the complete and sufficient authority for implementing the Content pillar without drift.**
