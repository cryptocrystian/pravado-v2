# EDITOR_ACTION_PERSISTENCE_CANON.md

> **STATUS: SUPERSEDED by /docs/canon/work/WORK_SURFACE_CONTRACT.md**

**Purpose:**
Guarantee that primary user actions are never hidden, displaced, or subordinated by content growth—especially during creation and review workflows.

---

## 1. Core Principle

**Actions do not scroll. Content does.**

In any surface where the user is expected to decide, approve, execute, or commit, the primary action(s) must remain continuously visible within the viewport.

**Scroll is reserved exclusively for information, never for commitment.**

---

## 2. Applicability Scope

This canon applies to all creation and decision surfaces, including but not limited to:

- Manual mode editors
- Copilot review panels
- Autopilot exception handlers
- Inline approval flows
- Multi-step execution wizards

---

## 3. Required Structural Pattern

Any editor or workbench MUST be composed of two distinct vertical regions:

### 3.1 Editor Body (Scrollable)

Contains:
- Text content
- Rich editor UI
- Inline suggestions
- Comments
- AI annotations

**May scroll independently.**

**Must never contain primary CTAs.**

### 3.2 Action Bar (Fixed)

- Anchored to bottom of the editor region
- Always visible without scrolling

Contains:
- Primary CTA (singular)
- Secondary actions (Save Draft, Cancel, etc.)

**Visually distinct but non-theatrical.**

**Must not be collapsible by default.**

---

## 4. Mode-Specific Requirements

### Manual Mode

- Action bar is always visible
- Primary CTA reflects current editor state:
  - "Save Draft"
  - "Mark Ready"
  - "Execute"
- Unsaved changes must be protected

### Copilot Mode

- Action bar persists during:
  - Plan review
  - Confidence evaluation
  - Approval decisions
- AI reasoning may scroll, actions may not

### Autopilot Mode

- Action bar visible for exceptions only
- Clear "Approve Fix" / "Escalate" affordances

---

## 5. Prohibited Patterns (Hard Violations)

| Pattern | Status |
|---------|--------|
| Primary CTA only visible after scrolling | **VIOLATION** |
| Action buttons embedded inside content scroll area | **VIOLATION** |
| Full-height editors that push actions below fold | **VIOLATION** |
| "Runway" footers that require hunting for actions | **VIOLATION** |
| Mode transitions that change CTA location | **VIOLATION** |

Any of the above constitutes a **Canon Violation**, not a UX preference.

---

## 6. Canon Hierarchy

This canon **overrides**:
- Layout aesthetics
- Visual balance preferences
- Editor dominance heuristics

It is **subordinate only to**:
- `AUTOMATION_MODE_CONTRACTS_CANON.md`
- `ACTION_GRAVITY_CTA_CANON.md` (complementary)

---

## 7. Success Criteria (Verification)

A surface is compliant if:

1. The primary CTA is visible immediately on entry
2. The CTA remains visible during:
   - Editing
   - Long content
   - AI reasoning expansion
3. Browser scrollbar never controls action visibility
