# Action Gravity CTA Canon

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2026-02-02

---

## 1. Purpose

This canon defines where primary actions (CTAs) should appear, when docked positions are acceptable, and how to prevent CTA-related UX failures.

This canon governs **action placement and gravity**, not button styling or microcopy.

It exists to answer: "Where should the main action be, and how does the user reach it?"

---

## 2. The Core Problems

### Problem 1: CTA Below the Fold

When the primary action requires scrolling:

- Users may not realize the action exists
- Completion rates drop
- Users feel "lost" or uncertain what to do next

### Problem 2: CTA Disconnected from Context

When the action button is far from the content it affects:

- Users must visually travel between content and action
- Confidence decreases ("Am I approving the right thing?")
- Mental model breaks ("Where did that action go?")

### Problem 3: CTA Redundancy

When multiple buttons do the same thing:

- Users hesitate ("Which one is the real action?")
- Interface feels cluttered
- Maintenance burden increases

**Action gravity canon** solves these by establishing placement rules and anti-patterns.

---

## 3. CTA Classification

### Primary CTA

The **primary CTA** is the single most important action for the current context.

| Characteristic | Requirement |
|----------------|-------------|
| **Uniqueness** | Only ONE primary CTA per context |
| **Visibility** | MUST be visible without scrolling |
| **Prominence** | MUST be visually dominant over secondary actions |
| **Clarity** | Label MUST clearly indicate what happens |

### Secondary CTA

**Secondary CTAs** are alternative actions that are less common or lower priority.

| Characteristic | Requirement |
|----------------|-------------|
| **Visual Weight** | MUST be visually subordinate to primary |
| **Placement** | May be near primary or contextually placed |
| **Count** | Minimize (2-3 max per context) |

### Tertiary Actions

**Tertiary actions** are infrequent or administrative operations.

| Characteristic | Requirement |
|----------------|-------------|
| **Visual Weight** | Subtle (text links, icon buttons, menus) |
| **Placement** | Contextual or in overflow menus |
| **Discoverability** | May require exploration |

---

## 4. Action Gravity by Mode

### Manual Mode: Content-Proximate CTAs

In Manual mode, the user is creating and editing.

**Primary CTA Placement:**

| Context | CTA Location | Rationale |
|---------|--------------|-----------|
| **Editor** | Within or adjacent to editor area | Action relates to content being edited |
| **Triage View** | Inline with selected item OR header bar | Action relates to selection |
| **Library** | Header bar or selection-dependent | Batch actions or item-specific |

**Gravity Rule:** CTAs should gravitate toward the content they affect.

### Copilot Mode: Approval-Proximate CTAs

In Copilot mode, the user is reviewing AI proposals.

**Primary CTA Placement:**

| Context | CTA Location | Rationale |
|---------|--------------|-----------|
| **Plan Review** | Adjacent to plan display | Approval/rejection relates to visible plan |
| **Draft Review** | Adjacent to draft preview | Action relates to specific draft |
| **Batch Approval** | Header or selection bar | Action relates to selected items |

**Gravity Rule:** Approval actions must be adjacent to what is being approved. Never separate the "Approve" button from the proposal by scroll or significant distance.

### Autopilot Mode: Exception-Proximate CTAs

In Autopilot mode, the user handles exceptions.

**Primary CTA Placement:**

| Context | CTA Location | Rationale |
|---------|--------------|-----------|
| **Exception Card** | Within exception detail | Action resolves specific exception |
| **All Clear State** | Minimal or absent | No action needed |
| **Guardrail Alert** | Adjacent to alert | Action addresses the alert |

**Gravity Rule:** Actions appear only where exceptions surface. No persistent CTAs waiting for work that doesn't exist.

---

## 5. Placement Patterns

### Pattern 1: Inline CTA

**When to Use:**
- Action relates to a specific selected item
- Context is narrow (detail panel, card, row action)
- User's eye is already on the content

**Implementation:**
- Button appears within or immediately adjacent to content
- Often in header bar of detail panel or card footer
- No sticky positioning required

**Example:** Edit button in asset detail preview, Approve button in plan panel header.

### Pattern 2: Sticky Header CTA

**When to Use:**
- Action relates to the overall view, not a specific item
- Long scrollable content below
- User may scroll but should always see action

**Implementation:**
- Fixed to top of content area (not browser viewport)
- Remains visible during scroll
- Content scrolls beneath

**Example:** Create New button in library view, Apply Filters in triage.

### Pattern 3: Sticky Footer CTA (Restricted)

**When to Use:**
- ONLY for long-form editors where content exceeds viewport
- ONLY when content is actively being edited
- NEVER for triage, approval, or dashboard views

**Implementation:**
- Fixed to bottom of viewport or container
- Clear visual separation from content
- Should not obscure content user needs to see

**Anti-Pattern Warning:** Sticky footer CTAs are overused. They create dead space and disconnect action from content.

### Pattern 4: Contextual CTA

**When to Use:**
- Action appears in response to user action (selection, hover)
- Temporary affordance that reduces clutter when not needed

**Implementation:**
- Appears near the triggering element
- Disappears when context changes
- Should not cause layout shift

**Example:** Bulk action bar on multi-select, Quick edit on hover.

---

## 6. Invariants (Must Always Be True)

### Invariant 1: Primary CTA Above Fold

The primary CTA for any view MUST be visible on a standard viewport (1920x1080 or 1440x900) without scrolling.

**Violation:** A "Create Brief" button that requires scrolling past a header panel to reach.

### Invariant 2: Single Primary CTA

Each context MUST have exactly ONE primary CTA.

**Violation:** Two "Approve Plan" buttons in the same view (one in header, one in footer).

**Exception:** Different contexts within a split view may each have their own primary CTA (e.g., list view primary vs. detail view primary).

### Invariant 3: Proximity Rule

The primary CTA MUST be visually proximate to the content it affects.

**Violation:** Approve button docked to browser bottom while the plan is at the top of a panel.

**Test:** Can the user see both the CTA and the relevant content in a single eye fixation or minimal glance?

### Invariant 4: Width Justification

A CTA bar's width MUST be justified by its content.

**Violation:** Full-width sticky footer with one centered button (80% dead space).

**Resolution:** Inline the button with content, or constrain the bar width.

### Invariant 5: No Redundant CTAs

The same action MUST NOT appear multiple times in the same view.

**Violation:** "Save" in toolbar AND "Save" in footer AND "Save" floating.

**Exception:** Keyboard shortcuts are not considered redundant CTAs.

---

## 7. Explicit Non-Goals

This canon does NOT prescribe:

- **Button Styling:** Colors, sizes, shapes
- **Microcopy:** Label text, tooltip content
- **Animation:** Hover states, click feedback
- **Keyboard Shortcuts:** Which keys trigger actions

These decisions belong to design system and microcopy guidelines.

---

## 8. Common Failure Modes

### Failure: "Runway Footer" Pattern

**Symptom:** Full-width sticky footer with excessive padding, single centered CTA, creating a runway of dead space.

**Why It Fails:** Wastes viewport; pushes content up; feels like an afterthought.

**Resolution:** Inline the CTA with related content or use constrained-width bar.

### Failure: "Scroll to Act" Pattern

**Symptom:** User must scroll past informational content to find the primary action.

**Why It Fails:** Completion rates drop; users may abandon flow.

**Resolution:** Move CTA above fold; use sticky positioning if content is long.

### Failure: "Duplicate Insurance" Pattern

**Symptom:** Same CTA appears in header AND footer "just in case."

**Why It Fails:** Creates confusion ("Which one?"); wastes space; maintenance burden.

**Resolution:** Choose ONE optimal location based on content relationship.

### Failure: "Floating Orphan" Pattern

**Symptom:** CTA docked to viewport corner, disconnected from any content.

**Why It Fails:** Users unsure what the action affects; mental model breaks.

**Resolution:** Attach CTA to the content it governs.

---

## 9. Mode-Specific Forbidden Patterns

### Manual Mode Forbidden

- CTAs that imply approval (when user is creating, not reviewing)
- Docked footers for non-editor triage views

### Copilot Mode Forbidden

- Approve buttons separated from the proposal being approved
- Dense editing CTAs that contradict the "review" mental model

### Autopilot Mode Forbidden

- Persistent CTAs when there are no exceptions
- Full action bars implying work exists when it doesn't

---

## 10. Relationship to Other Canons

### Superior Canons (override this canon if conflict)

- `PRODUCT_CONSTITUTION.md` — Core mission and philosophy
- `AUTOMATION_MODE_CONTRACTS_CANON.md` — Mode behavioral contracts

### Peer Canons (coordinate with this canon)

- `CONTENT_MODE_UX_THESIS.md` — Mode mental models
- `INFORMATION_DENSITY_HIERARCHY_CANON.md` — Spatial discipline
- `AI_VISUAL_COMMUNICATION_CANON.md` — AI state communication

### Subordinate Canons (must comply with this canon)

- Component-level button patterns
- Surface-specific action implementations

---

## 11. Validation Checklist

For any Pravado surface, verify:

- [ ] Primary CTA is identifiable (only one)
- [ ] Primary CTA is visible without scrolling
- [ ] Primary CTA is proximate to content it affects
- [ ] CTA width is justified (no 80% dead space bars)
- [ ] No redundant CTAs in same view
- [ ] Secondary CTAs are visually subordinate
- [ ] Docked footers are used only for long-form editors

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial canonical version |
