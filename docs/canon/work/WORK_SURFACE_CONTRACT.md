# Work Surface Contract

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2026-02-04

This contract consolidates and supersedes overlapping UX guidance from multiple micro-canons. It is the single authoritative source for work surface implementation.

---

## 1. Scope

Applies to: **Content Manual mode workbench**
Future: PR and SEO work surfaces (when implemented)

---

## 2. Mode Mental Model

### Manual Mode = "I Am Creating"

| Dimension | Requirement |
|-----------|-------------|
| Primary activity | Writing, editing, organizing |
| AI presence | Available when summoned, not directing |
| Dominant affordance | Editor, direct manipulation |
| Success feeling | "I built this" |

User must answer within 3 seconds: "What am I doing here?"

---

## 3. Typography Floor

| Category | Minimum | Tailwind |
|----------|---------|----------|
| Body text | 12px | `text-xs` |
| Interactive labels | 12px | `text-xs` |
| List items | 12px | `text-xs` |

**Exception:** Micro-labels (chart axes, badges) may be 10px but must be supplementary and non-interactive.

**Regression rule:** Typography changes MUST NOT affect Command Center or PR surfaces.

---

## 4. Editor Dominance (Focus State)

When `isEditing === true`:

| Rule | Target |
|------|--------|
| Editor width | >= 70% of center workspace (excluding left queue) |
| No nested boxes | Editor must not appear "boxed inside a box" |
| Reduced padding | Remove excessive margins around editor |
| Full height | Editor body uses available height, scrolls internally |

---

## 5. CTA Persistence

**Actions do not scroll. Content does.**

| Requirement | Implementation |
|-------------|----------------|
| Action bar position | Fixed at bottom of editor region (`shrink-0`) |
| Visibility | Always visible without page scroll |
| Primary CTA | Singular per context |
| Scroll containment | Editor body scrolls; header and action bar are pinned |

---

## 6. Rail Behavior

### Right Context Rail

| State | Behavior |
|-------|----------|
| Default (Focus State) | Collapsed |
| Collapsed width | <= 28px (slim tab/handle) |
| No dead space | Collapsed rail MUST NOT reserve a wide blank column |
| Auto-expand trigger | Hard blocker only (CiteMind error, validation failure, missing required field) |
| Badge indicator | Show issue count when collapsed |

### Left Queue Rail

| State | Behavior |
|-------|----------|
| Default width | 240-280px (adaptive) |
| Focus State | May compress to 220-240px |
| Progressive disclosure | Baseline: type + title only |
| Hover/selected | Reveal confidence, due, impact, status chips |
| Selected row | Always shows expanded metadata |

---

## 7. Dead Space Ceiling

| Viewport | Maximum dead space above fold |
|----------|-------------------------------|
| 1440x900 | <= 50% of editor region |
| 1920x1080 | <= 50% of editor region |

Dead space = viewport area with neither content nor meaningful whitespace.

---

## 8. Empty State

When no item is selected:
- Clear message: "Select an item to edit" or similar
- Optional: "Create New" CTA if applicable
- User must understand what to do within 3 seconds

---

## 9. Prohibited Patterns

| Pattern | Status |
|---------|--------|
| Primary CTA below fold | VIOLATION |
| Actions inside scroll container | VIOLATION |
| Collapsed rail reserving 240px blank space | VIOLATION |
| Nested card-within-card reducing editor | VIOLATION |
| Typography below 12px for body/labels | VIOLATION |
| Full-width footer with single centered button | VIOLATION |

---

## 10. Verification

See: `/docs/canon/work/WORK_SURFACE_QA_GATE.md`

---

## Supersedes

This contract consolidates and supersedes:
- `CONTENT_MODE_UX_THESIS.md` (mode mental model)
- `EDITOR_IDENTITY_CANON.md` (explicit entry/exit)
- `INFORMATION_DENSITY_HIERARCHY_CANON.md` (typography, density)
- `ACTION_GRAVITY_CTA_CANON.md` (CTA placement)
- `EDITOR_FOCUS_LAYOUT_CANON.md` (focus state layout)
- `EDITOR_ACTION_PERSISTENCE_CANON.md` (action persistence)

Those documents remain for historical reference but are marked SUPERSEDED.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial consolidated contract |
