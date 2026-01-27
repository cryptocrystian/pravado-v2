# Pravado v2 — UX Continuity Canon (v0.1)

> **Status**: CANONICAL
> **Authority**: Platform-wide UX invariants
> **Version**: 0.1
> **Last Updated**: 2026-01-27

---

## 1. Purpose

This document defines **experience-level invariants** that ensure Pravado feels like a single integrated orchestration platform, not a collection of siloed tools.

These invariants govern:
- How users perceive and navigate the platform
- How AI systems (SAGE, AUTOMATE, CiteMind) manifest in the experience
- How pillars relate to each other visually and behaviorally
- How progress, feedback, and explainability are communicated

This canon is **authoritative over individual surface implementations**. Pillar-specific contracts (PR, Content, SEO) must align with these invariants.

---

## 2. Non-Goals (Explicit)

This canon does NOT:

- **Prescribe layouts**: It does not mandate specific component arrangements, grid systems, or screen structures
- **Lock in current implementations**: Command Center, PR Work Surface, and Content Work Surface are NOT designated as reference implementations
- **Require retroactive refactors**: Existing surfaces may diverge; this canon is a north star, not a mandate for immediate remediation
- **Define visual design tokens**: Those belong to DS_v3_PRINCIPLES.md and DS_v3_1_EXPRESSION.md
- **Specify API contracts or data models**: Those belong to pillar-specific contracts

Partial compliance is **explicitly allowed**. Surfaces evolve incrementally toward these invariants.

---

## 3. Core Mental Model Invariant

**The user operates a unified orchestration system, not separate tools.**

Requirements:
- At any point in the platform, the user must be able to answer: "What is Pravado doing for me right now?"
- Navigation between pillars must feel like moving within a single workspace, not switching applications
- The platform's AI presence (SAGE) must be perceivable as a consistent entity across all surfaces
- Cross-pillar effects of actions must be visible or discoverable without leaving the current context

Violation indicators:
- User must "start over" mentally when switching pillars
- AI behavior feels inconsistent or disconnected between surfaces
- Actions in one pillar have invisible effects on another

---

## 4. Entry Point Invariant

**Every session begins with clarity about what needs attention.**

Requirements:
- The platform must surface prioritized actions within the first interaction
- Entry points must communicate: (1) what's urgent, (2) what's progressing, (3) what's blocked
- Users must not be required to navigate to discover what needs their attention
- SAGE proposals and AUTOMATE suggestions must be immediately visible on entry

Violation indicators:
- User lands on an empty or static dashboard
- Urgent items are buried in navigation
- User must click through multiple levels to find actionable work

---

## 5. Mode-Driven Experience Invariant

**The automation mode (Manual, Copilot, Autopilot) visibly shapes the experience.**

Requirements:
- The current automation mode must be visible and comprehensible at all times
- UI behavior must change perceptibly based on mode:
  - **Manual**: All actions require explicit user initiation
  - **Copilot**: SAGE proposes, user approves
  - **Autopilot**: SAGE executes within guardrails, user monitors
- Mode transitions must be intentional and confirmed
- Mode ceiling per surface/action must be discoverable (some actions may not support Autopilot)

Violation indicators:
- User is unaware of current mode
- Mode has no visible effect on the interface
- Autopilot actions occur without any monitoring mechanism

---

## 6. Explainability Invariant

**Every AI action, proposal, or recommendation must be explainable on demand.**

Requirements:
- SAGE proposals must include: (1) what it proposes, (2) why, (3) expected impact
- Executed actions must be auditable: what happened, when, why it was triggered
- CiteMind assessments must show reasoning, not just scores
- "Why?" must be answerable within one interaction (not requiring navigation away)
- Causal chains linking actions to outcomes must be traceable

Violation indicators:
- AI produces outputs without justification
- User cannot understand why something was recommended
- Audit trail is incomplete or inaccessible

---

## 7. Cross-Pillar Awareness Invariant

**Actions in one pillar visibly affect related pillars.**

Requirements:
- When an action impacts another pillar, that impact must be surfaced:
  - At minimum: an indicator or badge
  - Ideally: a preview or summary of the cross-pillar effect
- Cross-pillar hooks must be bidirectional and discoverable
- EVI (Earned Visibility Index) contributions must be attributable across pillars
- AUTOMATE orchestration across pillars must be visible (e.g., content feeding PR pitches)

Violation indicators:
- User is surprised by changes in another pillar
- Cross-pillar relationships are only visible in reports, not real-time
- Actions appear isolated when they have dependencies

---

## 8. Progress Feedback Invariant

**The user always knows whether something is happening, completed, or blocked.**

Requirements:
- Long-running operations must show progress indicators
- Completed actions must confirm success and summarize outcomes
- Blocked or failed actions must explain why and offer remediation paths
- Background AI activity (AUTOMATE) must be observable without interrupting flow
- State changes must be acknowledged visually within 200ms

Violation indicators:
- User clicks and nothing visibly happens
- Completion is silent or ambiguous
- Errors disappear without explanation

---

## 9. Density & Focus Invariant

**Information density adapts to context; focus is preserved during execution.**

Requirements:
- Surfaces must adapt density based on content volume and user intent
- During action execution (reviewing proposals, editing content), distractions must be minimized
- Overview surfaces may be denser; execution surfaces must be focused
- Density preferences (comfortable, standard, compact) must persist per user/context
- Visual hierarchy must ensure the most important element is immediately apparent

Violation indicators:
- Critical information competes with secondary details
- User loses context during multi-step flows
- Density is fixed regardless of content volume

---

## 10. Pillar Autonomy + Platform Unity Invariant

**Pillars may have unique workflows, but must share platform-level patterns.**

Requirements:
- Each pillar may define specialized views, actions, and workflows
- Shared patterns must be consistent across pillars:
  - Navigation behavior
  - Mode indicators
  - Progress feedback
  - Error handling
  - Explain/help mechanisms
- Pillar-specific branding (accent colors) must coexist with platform identity
- A user proficient in one pillar should recognize patterns in another

Violation indicators:
- Same action behaves differently across pillars without justification
- Visual language diverges in ways that confuse users
- Pillar feels like a different product

---

## 11. Canon Relationships

This canon operates in relationship with other canonical documents:

| Document | Relationship |
|----------|-------------|
| `DS_v3_PRINCIPLES.md` | Design tokens, color system, typography. UX Continuity Canon governs behavior; DS_v3 governs appearance. |
| `DS_v3_1_EXPRESSION.md` | Visual expression guidelines. UX Continuity Canon is agnostic to specific visual treatments. |
| `AUTOMATION_MODES_UX.md` | Detailed mode behavior. UX Continuity Canon defines the invariant; AUTOMATION_MODES_UX defines implementation. |
| `AUTOMATE_EXECUTION_MODEL.md` | Technical execution model. UX Continuity Canon governs how execution is surfaced to users. |
| `CONTENT_WORK_SURFACE_CONTRACT.md` | Content pillar contract. Must comply with UX Continuity Canon invariants. |
| `PR_WORK_SURFACE_CONTRACT.md` | PR pillar contract. Must comply with UX Continuity Canon invariants. |
| `COMMAND-CENTER-UI.md` | Command Center contract. Must comply with UX Continuity Canon invariants. |

**Conflict Resolution**:
- If there is conflict between a pillar implementation and this canon, **the canon wins**
- However, remediation is **discretionary and planned**, not automatic
- Violations should be **flagged**, not auto-fixed
- Pillar contracts may define compliant alternatives to achieve invariant requirements

---

## 12. Continuity Enforcement (Process)

### Flagging Violations

When reviewing or generating UX work:
1. Identify which invariant applies
2. Assess compliance: **Compliant**, **Partial**, or **Violation**
3. If Partial or Violation: flag explicitly with invariant reference
4. Do NOT auto-correct unless explicitly requested

### Compliance Levels

- **Compliant**: Fully satisfies the invariant
- **Partial**: Satisfies intent but with gaps; acceptable for incremental work
- **Violation**: Contradicts the invariant; requires explicit acknowledgment

### Remediation

- Violations do not block work
- Remediation is planned during sprint planning, not ad-hoc
- Partial compliance is acceptable as a waypoint toward full compliance

---

## 13. Versioning

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-27 | Initial canon creation |

This canon is **v0.1** and will evolve based on:
- Pillar implementation learnings
- User research findings
- Platform expansion (SEO/AEO, Ads, CiteMind surfaces)

Changes to invariants require explicit versioning and stakeholder review.

---

## Appendix: Invariant Quick Reference

| # | Invariant | Core Requirement |
|---|-----------|------------------|
| 3 | Core Mental Model | User operates unified orchestration, not separate tools |
| 4 | Entry Point | Session begins with clarity about what needs attention |
| 5 | Mode-Driven | Automation mode visibly shapes the experience |
| 6 | Explainability | Every AI action explainable on demand |
| 7 | Cross-Pillar Awareness | Actions in one pillar visibly affect related pillars |
| 8 | Progress Feedback | User always knows if something is happening, done, or blocked |
| 9 | Density & Focus | Information density adapts; focus preserved during execution |
| 10 | Pillar Autonomy + Unity | Unique workflows, shared platform patterns |
