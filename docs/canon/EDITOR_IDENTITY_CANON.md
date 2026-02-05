# Editor Identity Canon

> **STATUS: SUPERSEDED by /docs/canon/work/WORK_SURFACE_CONTRACT.md**

**Version:** 1.0
**Status:** Superseded
**Last Updated:** 2026-02-02

---

## 1. Purpose

This canon defines what constitutes an "editor" context within Pravado. It establishes clear boundaries between editing surfaces and non-editing surfaces, preventing the anti-pattern of ubiquitous inline editing that creates cognitive confusion.

This canon governs **surface identity**, not implementation details.

It exists to answer: "When is a user in an editor, and when are they not?"

---

## 2. The Core Problem

When editing affordances appear everywhere:

- Users cannot predict where changes are safe
- Every surface becomes mentally expensive (potential edit context)
- Triage and review surfaces lose their "read-mostly" character
- Mode semantics blur (everything feels like Manual mode)

**Editor identity** solves this by creating a clear distinction: some surfaces are for editing, others are not.

---

## 3. Editor Definition

### What Is an Editor?

An **editor** is a surface where the user's primary intent is to modify content.

| Characteristic | Editor | Non-Editor |
|----------------|--------|------------|
| **Primary Intent** | Modify content | View, triage, or approve |
| **Commit Semantics** | Has explicit save/publish | Changes may be immediate or not applicable |
| **Undo Expectation** | Undo/redo available | Undo may be limited or undefined |
| **Focus Model** | Deep focus on single item | Broad view of multiple items |
| **Interruption Cost** | High (unsaved work at risk) | Low (no draft state) |

### What an Editor Requires

For a surface to qualify as an editor:

1. **Dedicated Space:** The editing area is visually distinct and bounded
2. **Clear Entry:** User explicitly entered the editor (navigation, modal open, explicit action)
3. **Clear Exit:** User explicitly exits the editor (close, save, cancel)
4. **Dirty State Awareness:** The system knows when unsaved changes exist
5. **Commit Affordance:** An explicit save, publish, or apply action exists

### What an Editor Does NOT Require

- Full-screen layout (editors may be panels, modals, or split views)
- Rich text capabilities (structured forms can be editors)
- Isolation from context (editors may show related information)

---

## 4. Non-Editor Surfaces

### What Are Non-Editor Surfaces?

Non-editor surfaces are contexts where the user's primary intent is NOT content modification:

| Surface Type | Primary Intent | Example |
|--------------|----------------|---------|
| **Triage** | Review and prioritize items | Work Queue list view |
| **Approval** | Approve or reject proposals | Copilot plan review |
| **Dashboard** | Monitor status | Autopilot exception console |
| **Library** | Browse and select | Content library grid |
| **Calendar** | Schedule and plan | Editorial calendar |

### What Non-Editor Surfaces May Include

- **Quick Actions:** Single-click status changes, tagging, archiving
- **Inline Preview:** Read-only display of content
- **Metadata Display:** Status, dates, scores, signals
- **Selection:** Choosing items to act on

### What Non-Editor Surfaces MUST NOT Include

- **Rich Text Editing:** Full content authoring inline
- **Structural Editing:** Reordering sections, adding blocks inline
- **Ambiguous Edit Affordances:** Text fields that look like they might save on blur

---

## 5. Invariants (Must Always Be True)

### Invariant 1: Editor Entry Is Explicit

A user MUST take an explicit action to enter an editor:

- Click "Edit" button
- Click into a designated editing area
- Navigate to an editor route
- Open an editor modal

A user MUST NOT accidentally enter an editor by:

- Clicking on a list item in a triage view
- Hovering over content
- Scrolling to a section

### Invariant 2: Editor Boundaries Are Visible

When a user is in an editor:

- The editing area MUST be visually distinct from non-editing areas
- The boundary between "editor" and "context" MUST be clear
- The user MUST be able to answer: "What part of this screen is my editor?"

### Invariant 3: Exit Is Protected

When a user has unsaved changes in an editor:

- Attempting to leave MUST prompt confirmation
- Accidental navigation MUST be preventable
- The system MUST NOT silently discard changes

### Invariant 4: Non-Editors Are Read-Mostly

Non-editor surfaces:

- MUST NOT have inline rich text editing
- MUST NOT have ambiguous save semantics
- MAY have quick actions (status, tags) with immediate effect
- MUST feel safe to browse without risk of accidental modification

---

## 6. The Workbench Exception

### Manual Mode Workbench

In Manual mode, the Content Work Queue may include a "workbench" panel that shows detail for a selected item. This panel is NOT automatically an editor.

**Workbench Identity:**

| Scenario | Workbench Role |
|----------|----------------|
| User selected an item to preview | Read-only preview |
| User clicked "Edit" on the item | Editor context (explicit entry) |
| Copilot mode shows AI plan | Approval context (not editor) |

**Rule:** The workbench MUST clearly communicate its current role. If editing is not active, editing affordances should be absent or inactive.

### Avoiding Workbench Ambiguity

Common failure: A workbench that always shows text fields, leading users to wonder: "Am I editing?"

**Resolution:**

- In preview/triage state: Show content as rendered text, not as editable fields
- In edit state: Show clear editor boundary, save button, editing toolbar
- Transition between states MUST be explicit (user action required)

---

## 7. Inline Editing: When Allowed

Inline editing (editing directly in a list or grid) is highly restricted:

### Allowed Inline Edits

| Edit Type | Example | Why Allowed |
|-----------|---------|-------------|
| **Status Toggle** | Draft → Review | Single-value, immediate, reversible |
| **Quick Tag** | Add/remove tag | Metadata, not content |
| **Date Picker** | Set deadline | Single-value, clear affordance |
| **Checkbox** | Select for bulk action | Not a content edit |

### Forbidden Inline Edits

| Edit Type | Example | Why Forbidden |
|-----------|---------|---------------|
| **Title Edit** | Rename in list | Creates ambiguous save semantics |
| **Body Edit** | Edit description in card | Blurs editor identity |
| **Rich Text** | Format text in list | Full editor required |
| **Structural** | Reorder sections inline | Full editor required |

### The Test

Ask: "If the user walks away right now, would they be confused about what was saved?"

- If yes → Requires explicit editor
- If no → May be inline

---

## 8. Mode-Specific Application

### Manual Mode

- Editor surfaces are expected and prominent
- Workbench may transition to editor with explicit action
- User expects to create and modify content

### Copilot Mode

- Approval is primary; editing is secondary
- Editing should be contextual (refine AI output) not primary
- Full editor access may require explicit "Edit" action

### Autopilot Mode

- Editing should be rare and exceptional
- Exception items may require escalation to editor
- Inline editing is minimized or absent

---

## 9. Explicit Non-Goals

This canon does NOT prescribe:

- **Editor Layout:** How an editor is visually designed
- **Editor Features:** What tools an editor provides
- **Editor Location:** Whether editing is in a modal, route, or panel
- **Quick Action Design:** Specific inline action patterns

These decisions belong to surface-specific design.

---

## 10. Relationship to Other Canons

### Superior Canons (override this canon if conflict)

- `PRODUCT_CONSTITUTION.md` — Core mission and philosophy
- `AUTOMATION_MODE_CONTRACTS_CANON.md` — Mode behavioral contracts

### Peer Canons (coordinate with this canon)

- `CONTENT_MODE_UX_THESIS.md` — Mode mental models
- `INFORMATION_DENSITY_HIERARCHY_CANON.md` — Density and space allocation
- `CONTENT_WORK_SURFACE_CONTRACT.md` — Content surface specifications

### Subordinate Canons (must comply with this canon)

- Component-level editing patterns
- Surface-specific editor implementations

---

## 11. Validation Checklist

For any Content surface, verify:

- [ ] Editor entry is explicit (requires user action)
- [ ] Editor boundaries are visually clear
- [ ] Exit is protected when unsaved changes exist
- [ ] Non-editor areas do not have rich text editing
- [ ] Inline edits are limited to quick actions with clear semantics
- [ ] Workbench role (preview vs. edit) is unambiguous

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial canonical version |
