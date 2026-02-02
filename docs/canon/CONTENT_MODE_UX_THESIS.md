# Content Mode UX Thesis

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2026-02-02

---

## 1. Purpose

This canon defines the **user mental model** for each automation mode within the Content pillar. It establishes what the user *believes* they are doing, what activity dominates their attention, and what constitutes a coherent versus incoherent experience.

This canon governs **user intent and perception**, not layouts or components.

It exists to prevent "mode ambiguity" — interfaces where the user cannot immediately answer: *"What am I doing here?"*

---

## 2. Scope

This canon applies to:

- All Content pillar work surfaces
- All Content pillar views (Work Queue, Library, Calendar, Insights)
- Any future Content-specific surfaces

This canon does NOT apply to:

- Cross-pillar surfaces (Command Center)
- Other pillar work surfaces (PR, SEO)
- Administrative or settings surfaces

---

## 3. The Core Question

Every Content surface must pass this test:

> **A user landing on any Content surface should be able to answer within 3 seconds:**
> "What am I doing here, and what kind of activity does this surface expect from me?"

If the answer is unclear, the surface is in violation.

---

## 4. Mode Mental Models (Authoritative)

### Manual Mode — "I Am Creating"

**User Belief:** "This is my workspace. I am the author, editor, and decision-maker."

| Dimension | User Expectation |
|-----------|------------------|
| **Primary Activity** | Creating, editing, organizing content |
| **AI Presence** | Available when summoned; not directing |
| **Queue/List Behavior** | Shows everything; I control order |
| **Dominant Affordance** | Editor, rich text, direct manipulation |
| **Decision Authority** | I decide what to work on and when |
| **Success Feeling** | "I built this" |

**Characteristic Verbs:** Write, edit, organize, publish, prioritize, tag

**Anti-Pattern:** AI panels or plans that dominate visual attention when the user expects to be creating.

---

### Copilot Mode — "I Am Reviewing AI Work"

**User Belief:** "AI has prepared something for me. My job is to review, approve, or refine."

| Dimension | User Expectation |
|-----------|------------------|
| **Primary Activity** | Reviewing plans, approving drafts, validating AI decisions |
| **AI Presence** | Prominent; AI has done work that awaits judgment |
| **Queue/List Behavior** | AI-prioritized; shows reasoning for order |
| **Dominant Affordance** | Approve/Reject, Compare, Preview |
| **Decision Authority** | AI proposes; I approve or modify |
| **Success Feeling** | "AI saved me time; I kept quality high" |

**Characteristic Verbs:** Review, approve, reject, modify, compare, verify

**Anti-Pattern:** Dense editing surfaces that imply the user should be creating from scratch when AI has already prepared content.

---

### Autopilot Mode — "I Am Supervising Automation"

**User Belief:** "AI is handling routine work. I only need to act on exceptions."

| Dimension | User Expectation |
|-----------|------------------|
| **Primary Activity** | Exception handling, guardrail review, audit |
| **AI Presence** | Invisible for successes; visible only for exceptions |
| **Queue/List Behavior** | Filtered to exceptions and violations |
| **Dominant Affordance** | Acknowledge, Escalate, Configure guardrails |
| **Decision Authority** | AI acts autonomously; I handle edge cases |
| **Success Feeling** | "Everything is running; nothing needs me" |

**Characteristic Verbs:** Monitor, acknowledge, escalate, configure, audit

**Anti-Pattern:** Full work queues or editing interfaces that imply manual work when the system is supposed to be autonomous.

---

## 5. Invariants (Must Always Be True)

### Invariant 1: Mode Declares Intent

Every Content surface MUST clearly communicate which mode it serves.

- Visual indicators MUST be present and unambiguous
- The dominant affordance MUST match the mode's primary activity
- Users MUST NOT need to guess which mode they are in

### Invariant 2: No Hybrid Confusion

A single view MUST NOT simultaneously present:

- Full editing affordances (Manual) AND prominent AI plan approval (Copilot)
- Dense creation tools (Manual) AND exception-only filtering (Autopilot)
- Approval workflows (Copilot) AND autonomous execution status (Autopilot)

**Exception:** Transitions between modes may briefly show mixed states while recalculating, but this MUST be indicated as a transition state.

### Invariant 3: Primary Activity Dominates

The visually dominant element of any Content surface MUST support the mode's primary activity:

| Mode | What MUST Dominate |
|------|-------------------|
| Manual | Editor, creation tools, or content list |
| Copilot | AI plan, approval controls, or comparison view |
| Autopilot | Exception list, status dashboard, or "all clear" state |

### Invariant 4: Affordances Match Expectations

Users in Copilot mode should NOT see prominent "Create New" buttons.
Users in Manual mode should NOT see prominent "Approve AI Plan" buttons unless they summoned AI.
Users in Autopilot mode should NOT see dense editing interfaces.

---

## 6. Explicit Non-Goals

This canon explicitly does NOT prescribe:

- **Layouts:** Number of columns, pane arrangements, or grid systems
- **Components:** Specific buttons, cards, or UI primitives
- **Visual Density:** How much content appears in a given space
- **Color Schemes:** Mode-specific theming (covered by AI_VISUAL_COMMUNICATION_CANON)
- **Animation:** Transitions or motion patterns

These decisions belong to pillar-specific design and may vary by surface.

---

## 7. Common Failure Modes

### Failure: "Swiss Army Knife" Syndrome

**Symptom:** A single view tries to serve all three modes with the same layout.

**Why It Fails:** Users cannot identify their primary activity; cognitive load is high; mode-specific optimizations are impossible.

**Resolution:** Design mode-aware views that adapt their dominant affordance to the active mode.

### Failure: "Hybrid Creep"

**Symptom:** A Copilot view adds more and more editing tools until it resembles Manual mode.

**Why It Fails:** Users lose the "AI prepared this for me" mental model; they start to feel they should be creating, not reviewing.

**Resolution:** Keep editing in Copilot contextual and secondary; primary affordance remains approval/review.

### Failure: "Empty Autopilot"

**Symptom:** Autopilot mode shows the same full queue as Manual mode, just with "AI is working" labels.

**Why It Fails:** Users don't experience the mode's promise (reduced cognitive load); they still see everything.

**Resolution:** Autopilot MUST filter to exceptions. "All clear" is a valid and expected state.

### Failure: "Mode Decoration"

**Symptom:** Mode indicators exist but don't change the interface's behavior or affordances.

**Why It Fails:** Mode becomes meaningless; users cannot predict what will happen.

**Resolution:** Mode MUST change what users see and what they are expected to do.

---

## 8. Relationship to Other Canons

### Superior Canons (override this canon if conflict)

- `PRODUCT_CONSTITUTION.md` — Core mission and philosophy
- `AUTOMATION_MODE_CONTRACTS_CANON.md` — Behavioral contracts and authority boundaries

### Peer Canons (coordinate with this canon)

- `AI_VISUAL_COMMUNICATION_CANON.md` — How AI state is communicated visually
- `CONTENT_WORK_SURFACE_CONTRACT.md` — Content V1 surface specifications
- `EDITOR_IDENTITY_CANON.md` — What constitutes editing context

### Subordinate Canons (must comply with this canon)

- Surface-specific implementation decisions
- Component-level design choices

### Conflict Resolution

In case of conflict:

1. **User mental model clarity wins** over visual efficiency
2. **Mode integrity wins** over feature density
3. **Explicit declaration wins** over implicit inference
4. **AUTOMATION_MODE_CONTRACTS_CANON behavioral contracts win** over this thesis

---

## 9. Validation Checklist

For any Content surface, verify:

- [ ] Mode indicator is visible and unambiguous
- [ ] Primary activity matches mode expectation (create/review/monitor)
- [ ] Dominant visual element supports the mode's characteristic verbs
- [ ] No hybrid confusion exists (creation + approval not equally prominent)
- [ ] Affordances match user expectations for the mode
- [ ] User can answer "What am I doing here?" within 3 seconds

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial canonical version |
