# Automation Mode Contracts Canon

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2026-01-29

---

## 1. Purpose

This canon defines the **invariant meaning** of Manual, Copilot, and Autopilot modes across all of Pravado. It establishes behavioral contracts, authority boundaries, and the expected user–AI posture for each mode.

This canon governs **behavior and semantics**, not visual implementation.

It does NOT prescribe layouts, components, or visual structures. Each pillar is responsible for designing optimal UX that honors these contracts.

---

## 2. Non-Goals (Critical)

**This canon does NOT enforce:**

- Column counts or grid layouts
- Page layouts or section arrangements
- Shared templates across pillars
- Visual density standards
- Specific component implementations
- Color schemes or styling beyond semantic meaning

**Each pillar** (PR, Content, SEO/AEO, Ads) is expected to design its own optimal UX while honoring the behavioral contracts defined below.

A pillar may:
- Use different layouts for the same mode
- Implement different interaction patterns
- Prioritize different information hierarchies
- Adapt to pillar-specific workflows

As long as the **semantic contracts** are preserved.

---

## 3. Automation Modes (Authoritative Definitions)

### Manual Mode — "Workbench"

**Core Principle:** User is the primary decision-maker.

| Aspect | Contract |
|--------|----------|
| **Authority** | User has full control over all decisions |
| **AI Role** | May observe, suggest, and annotate — never act |
| **Queue/Priority** | User controls ordering; no automatic reordering |
| **Filtering** | User controls what is visible; no automatic filtering |
| **Execution** | Nothing executes without explicit user action |
| **Editing** | Editing surfaces MAY be embedded directly into primary work views |
| **State** | AI state is typically `idle` or `ready` (awaiting input) |

**User Mental Model:** "I am in control. AI assists when I ask."

**UX Implications:**
- Provide full queue manipulation controls
- Show all items (no hidden filtering)
- Emphasize direct manipulation affordances
- AI suggestions are optional, not prominent

---

### Copilot Mode — "Plan Review"

**Core Principle:** AI proposes, user approves.

| Aspect | Contract |
|--------|----------|
| **Authority** | AI prepares; user authorizes |
| **AI Role** | Proposes structured plans, queues, or drafts |
| **Queue/Priority** | AI orders by recommendation; user may override |
| **Filtering** | AI may prioritize; user sees reasoning |
| **Execution** | User approval required before any execution |
| **Reasoning** | AI reasoning MUST be visible and explainable |
| **State** | AI state cycles through `evaluating` → `ready` |

**User Mental Model:** "AI prepared this. I review and approve."

**UX Implications:**
- Emphasize review, comparison, and approval workflows
- Show AI reasoning prominently (not hidden behind clicks)
- Provide clear approval/rejection affordances
- Editing may be contextual or staged
- Step indicators help users track progress

---

### Autopilot Mode — "Exception Console"

**Core Principle:** AI handles routine; user handles exceptions.

| Aspect | Contract |
|--------|----------|
| **Authority** | AI executes within guardrails; user oversees |
| **AI Role** | Autonomous execution of routine, low-risk actions |
| **Queue/Priority** | Only exceptions, failures, and violations surface |
| **Filtering** | Routine items are hidden by default |
| **Execution** | Automatic for low-risk; escalates for high-risk |
| **Transparency** | Audit logs MUST be available |
| **State** | AI state is typically `executing` or `blocked` |

**User Mental Model:** "AI is working. I only see what needs my attention."

**UX Implications:**
- No dense creation interfaces
- Quiet, sparse, and authoritative presentation
- Guardrail violations are prominent
- Audit logs easily accessible
- "All clear" states are valid and expected

---

## 4. Mode Ceilings & Guardrails

### Mode Ceilings

Actions may define a **maximum allowed automation level** (mode ceiling):

| Ceiling | Meaning |
|---------|---------|
| `manual` | Action can only run in Manual mode |
| `copilot` | Action can run in Manual or Copilot, not Autopilot |
| `autopilot` | Action can run in any mode |

**UX Requirements:**
- Clearly indicate when a mode is capped
- Explain why (e.g., "High-risk action requires approval")
- Never silently downgrade user expectations

### Guardrails

Guardrails are conditions that force escalation even in Autopilot:

- Critical priority items
- High-risk actions (as defined by AUTOMATE_EXECUTION_MODEL)
- Items requiring human judgment (e.g., journalist inquiries)
- Confidence below threshold
- Deadline proximity

**Contract:** Guardrails MUST be configurable and visible to users.

---

## 5. Relationship to Other Canons

This canon operates within a hierarchy of authority:

### Superior Canons (override this canon if conflict)
- `PRODUCT_CONSTITUTION.md` — Core mission and non-negotiables
- `AUTOMATE_EXECUTION_MODEL.md` — Execution authority and risk model

### Peer Canons (coordinate with this canon)
- `AUTOMATION_MODES_UX.md` — UX patterns for mode implementation
- `AI_VISUAL_COMMUNICATION_CANON.md` — Visual state communication
- `UX_CONTINUITY_CANON.md` — Interaction principles

### Subordinate Canons (must comply with this canon)
- Pillar-specific contracts (PR, Content, SEO)
- Surface-specific contracts

### Conflict Resolution

In case of conflict:
1. **Behavioral contracts win** over visual convenience
2. **Safety wins** over automation speed
3. **Canon wins** over implementation convenience
4. **User control wins** in ambiguous cases

---

## 6. Enforcement Philosophy

### Acceptable States
- **Full compliance** — Ideal
- **Partial compliance** — Acceptable during development
- **Documented deviation** — Acceptable with justification

### Unacceptable States
- **Silent violation** — Never acceptable
- **Behavioral contract violation** — Must be fixed
- **Safety contract violation** — Blocker

### Approach
- Violations must be **flagged, not auto-fixed**
- This canon should **guide design decisions**, not replace judgment
- Pillar teams have discretion on **how** to implement, not **whether** to comply

---

## 7. Mode Transition Behavior

When mode changes:

| Transition | Expected Behavior |
|------------|-------------------|
| Any → Manual | Full queue restored; AI assistance optional |
| Any → Copilot | AI evaluates and prepares plan; awaits approval |
| Any → Autopilot | Routine items filter out; exceptions surface |

**State Reset Requirements:**
- Plan approval state resets on mode change
- Queue reasoning updates for new mode context
- AI state indicator reflects transition (`evaluating` during recalculation)

**User Expectation:** Mode change is a meaningful context shift, not just a visual toggle.

---

## Immediate Application: Content Pillar

Content is the **first pillar** to apply this canon comprehensively.

### Content-Specific Expectations

| Mode | Content Posture | Primary Activity |
|------|-----------------|------------------|
| **Manual** | Editor-forward | Direct content creation, manual prioritization |
| **Copilot** | Plan/review-forward | Brief review, AI draft approval, staged editing |
| **Autopilot** | Exception-forward | Quality issues, deadline alerts, execution failures |

### What This Means

- **Manual mode in Content** is expected to emphasize editing and creation tools
- **Copilot mode in Content** is expected to emphasize plan review and approval
- **Autopilot mode in Content** is expected to be sparse, showing only exceptions

### What Remains Open

Layout decisions are **still open** and will be designed specifically for Content's competitive and UX needs. This canon does not prescribe:

- Whether editing is inline or in a modal
- How many columns the layout uses
- Where the AI reasoning panel appears
- The specific visual density of the queue

These decisions belong to the Content pillar design process, guided by user research and competitive analysis.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial canonical version |
