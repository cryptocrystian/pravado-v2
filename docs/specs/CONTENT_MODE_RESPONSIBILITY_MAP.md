# Content Mode Responsibility Map

**Status:** Working Spec (Not Canon)
**Version:** 0.1
**Created:** 2026-01-29

---

## 1. Purpose

This document defines **WHAT** each automation mode is responsible for in the Content pillar.

It establishes the semantic relationship between Content surfaces and automation modes, answering:
- Which surfaces are central to each mode?
- Which surfaces are accessible but secondary?
- Which surfaces should be suppressed or hidden?

This is a **structural definition**, not a visual design. It does not prescribe:
- How surfaces are arranged
- What components are used
- How dense or sparse the layout is

This document serves as the **foundation** for a full Content UX redesign, ensuring that layout decisions are informed by clear mode semantics.

---

## 2. Core Content Surfaces (Inventory)

The following conceptual surfaces exist within the Content pillar. These are functional domains, not UI panels.

| Surface | Description |
|---------|-------------|
| **Work Queue** | Prioritized list of actionable content items (briefs, drafts, issues) |
| **Editor** | Writing and editing surface for content creation and refinement |
| **Brief Builder** | Structured brief creation with keyword targeting, audience, constraints |
| **Plan / Proposal** | AI-generated plans, queue reasoning, execution proposals |
| **Entity & Constraints** | Target keywords, topics, clusters, authority targets |
| **CiteMind / Governance** | Quality gates, ingestibility checks, citation eligibility |
| **Pipeline Status** | Content lifecycle stages (draft → review → approved → published) |
| **Audit / History** | Execution logs, auto-handled actions, change history |
| **Context Panel** | Cross-pillar impact, deadlines, calendar, related PR/SEO hooks |
| **Quick Actions** | One-click actions: generate brief, import content, fix issues |

---

## 3. Mode Responsibility Matrix

This matrix defines the **visibility and prominence** of each surface per mode.

| Visibility | Definition |
|------------|------------|
| **PRIMARY** | Must be visible and central; user's primary focus |
| **SECONDARY** | Accessible but not dominant; available on demand |
| **READ-ONLY** | Visible for reference but not interactive |
| **HIDDEN** | Not present; would create noise or confusion |

### Responsibility Matrix

| Surface | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| **Work Queue** | PRIMARY | PRIMARY | PRIMARY (exceptions only) |
| **Editor** | PRIMARY | SECONDARY | HIDDEN |
| **Brief Builder** | PRIMARY | SECONDARY | HIDDEN |
| **Plan / Proposal** | HIDDEN | PRIMARY | READ-ONLY |
| **Entity & Constraints** | SECONDARY | SECONDARY | HIDDEN |
| **CiteMind / Governance** | SECONDARY | SECONDARY | PRIMARY (violations only) |
| **Pipeline Status** | SECONDARY | SECONDARY | SECONDARY |
| **Audit / History** | SECONDARY | SECONDARY | PRIMARY |
| **Context Panel** | SECONDARY | SECONDARY | SECONDARY |
| **Quick Actions** | PRIMARY | SECONDARY | HIDDEN |

### Matrix Rationale

**Manual Mode:**
- Work Queue, Editor, Brief Builder, and Quick Actions are PRIMARY because the user is actively creating and deciding.
- Plan/Proposal is HIDDEN because AI is not proactively planning in Manual.

**Copilot Mode:**
- Plan/Proposal becomes PRIMARY because AI has prepared recommendations.
- Work Queue remains PRIMARY but is AI-ordered, not user-ordered.
- Editor becomes SECONDARY because editing happens after plan approval.

**Autopilot Mode:**
- Work Queue shows only exceptions (filtered to issues requiring attention).
- Audit/History becomes PRIMARY to show what AI has handled.
- Creation surfaces (Editor, Brief Builder, Quick Actions) are HIDDEN.
- CiteMind surfaces only violations that need resolution.

---

## 4. Mode Character Summary

### Manual — Workbench

**What the user is doing:**
- Directly creating and editing content
- Manually prioritizing the work queue
- Making all decisions about what to work on next

**What the AI is allowed to do:**
- Provide suggestions when asked
- Annotate items with scoring and recommendations
- Run quality checks in the background

**What must feel fast, dense, and direct:**
- Access to editor and brief builder
- Queue manipulation (reorder, pin, batch)
- One-click actions for common tasks

**User mindset:** "I'm in control. Show me my tools."

---

### Copilot — Plan Review

**What the AI produces:**
- A prioritized queue with reasoning
- Draft briefs or content proposals
- Execution plans with confidence scores

**What the user approves:**
- Queue ordering and priority
- AI-generated drafts before sending/publishing
- Execution steps before they run

**What should be deferred until approval:**
- Auto-execution of any content action
- Reordering without user consent
- Publishing or external actions

**User mindset:** "AI prepared this. Let me review before we proceed."

---

### Autopilot — Exception Console

**What the system handles autonomously:**
- Routine brief execution (low-risk, high-confidence)
- Derivative content generation
- Scheduled publishing
- Quality checks that pass

**What the user only sees when something breaks:**
- CiteMind violations (quality issues)
- Low-confidence items requiring judgment
- Deadline-critical items needing confirmation
- Guardrail triggers (mode ceiling violations)

**What must be suppressed to reduce noise:**
- Successfully auto-handled items (show in audit log only)
- Routine scheduling and execution
- Quality checks that pass

**User mindset:** "Everything is running. Only show me what needs attention."

---

## 5. Non-Goals (Explicit)

This document does **NOT** decide:

| Category | Not Decided |
|----------|-------------|
| **Layout** | Column counts, pane arrangements, responsive breakpoints |
| **Visual Density** | Compact vs. spacious, information hierarchy |
| **Styling** | Colors, typography, spacing, animations |
| **Components** | Which UI components implement each surface |
| **Interactions** | Modal vs. inline, drawer vs. panel, hover states |
| **Navigation** | Tab structure, URL routing, breadcrumbs |
| **Consistency** | Whether to match PR pillar patterns or diverge |

These decisions belong to the **Content UX Design** phase, which uses this responsibility map as input.

---

## 6. Design Implications (No Decisions)

The following are **implications** of the responsibility matrix, not design decisions.

### Manual Mode Implications
- User likely needs persistent editing access (not behind navigation)
- Queue manipulation controls likely need to be prominent
- Creation actions likely need to be one-click accessible
- AI presence should feel optional and unobtrusive

### Copilot Mode Implications
- AI reasoning likely needs prominent real estate
- Approval workflows likely benefit from clear staging
- Comparison and diffing may be valuable for reviewing AI proposals
- Step indicators may help users track plan → review → execute flow

### Autopilot Mode Implications
- Creation surfaces likely collapse or disappear entirely
- Exception list is likely sparse (this is success, not failure)
- Audit log access is likely important for trust
- Guardrails visibility likely helps users understand boundaries

### Cross-Mode Implications
- Mode switching likely causes significant surface reconfiguration
- Users may need orientation cues when mode changes
- Some surfaces (Work Queue, Context) persist across modes with different behaviors

---

## 7. Open Questions

These questions should be answered during design, not in this spec:

1. **Editor Integration:** Should Manual mode embed editing inline, or use a dedicated editor view?
2. **Plan Granularity:** In Copilot, how much of the plan is shown at once?
3. **Exception Threshold:** In Autopilot, what defines an "exception" vs. routine?
4. **Mode Memory:** Should the system remember surface states per mode?
5. **Transition Animation:** How does the UI communicate mode changes?

---

## 8. Relationship to Canon

This spec is informed by but does not modify:

- `AUTOMATION_MODE_CONTRACTS_CANON.md` — Defines mode semantics
- `CONTENT_PILLAR_CANON.md` — Defines Content pillar scope
- `AUTOMATION_MODES_UX.md` — Defines mode UX patterns

When this spec is validated through design and implementation, relevant portions may be elevated to canon status.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-29 | Initial working spec |
