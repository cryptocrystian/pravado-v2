# EDITOR_FOCUS_LAYOUT_CANON

> **STATUS: SUPERSEDED by /docs/canon/work/WORK_SURFACE_CONTRACT.md**

**Status:** Superseded
**Applies to:** Manual mode editor surfaces across pillars (Content first)
**Last Updated:** 2026-02-04

## Related Canons
- `EDITOR_IDENTITY_CANON.md`
- `INFORMATION_DENSITY_HIERARCHY_CANON.md`
- `ACTION_GRAVITY_CTA_CANON.md`
- `CONTENT_MODE_UX_THESIS.md`

---

## 1. Problem Statement

Manual mode is "I am creating." If the editor is not visually dominant, the surface feels like a stitched-together dashboard, increases cognitive load, and fails enterprise expectations.

This canon defines a deterministic "Focus" layout behavior that activates when the user enters an editing state.

---

## 2. Definitions

- **Editor Surface:** A surface where the primary task is writing/editing a content asset or issue fix.
- **Focus State:** A mode-specific layout posture used only when `isEditing === true` (or equivalent).

---

## 3. Core Invariants (MUST)

### 3.1 Editor Dominance

When Focus State is active:
- The editor must receive the majority of width and height budget.
- **Target:** Editor region occupies >= 70% of the center workspace width (excluding left rail if present).
- The editor must not appear "boxed inside a box" (no nested card-within-card that reduces perceived space).

### 3.2 CTA Persistence (No-Scroll Actions)

- Primary CTA(s) for the editor MUST be visible without page scroll.
- Editor actions must live in a fixed action bar attached to the editor region.
- The editor body scrolls; actions do not.

### 3.3 Rail Suppression During Focus

When Focus State is active:
- Right Context rail collapses by default (may auto-expand only on hard blockers).
- Left queue rail compresses (reduced width or compact rows), but remains navigable.

### 3.4 Chrome Compression

When Focus State is active:
- Non-essential page chrome must compress to reclaim vertical space.
- The KPI band/header must not consume disproportionate space relative to the editor.
- **Target:** Above-the-editor chrome <= 20% of viewport height on 1440×900.

### 3.5 Dead Space Ceiling (Focus State)

- Above the editor fold, unused space (unoccupied by editor content or critical controls) must be <= 25%.
- Full-width panels must justify their size or collapse.

---

## 4. Context Rail Rules (MUST)

### 4.1 When Context Is Needed

Context rail auto-expands ONLY if:
- A hard blocker exists (e.g., "CiteMind: blocking issue", validation error, missing required fields), OR
- The user explicitly opens it, OR
- The system enters a "Review Required" gate.

### 4.2 When Context Is Not Needed

If no blockers:
- Keep rail collapsed (tab only), show subtle indicator count (e.g., "2" badge).

---

## 5. Left Queue Progressive Disclosure (MUST)

The queue rail must present:
- Dense baseline rows (type + title).
- Additional metadata revealed only on hover/selection:
  - confidence, due, impact, quick status
- Selected row shows the expanded metadata by default.

**Goal:** Reduce visual noise while improving scan-ability and enterprise feel.

---

## 6. Reference Implementation Pattern (Recommended)

Focus State layout:
- **App Shell:** 3-column (LeftQueue | Editor | ContextRail)
- **Focus State toggles:**
  - ContextRail → collapsed
  - LeftQueue → compact
  - Editor → expands, reduces padding, removes nested container

---

## 7. Validation Checklist

On 1440×900 and 1920×1080:

- [ ] Enter edit → editor grows (perceived working area increases immediately)
- [ ] CTAs remain visible without scrolling
- [ ] No page-level scroll caused by editor actions
- [ ] Context rail collapsed unless blocker exists
- [ ] Left queue shows progressive disclosure on hover/selected
- [ ] Above-editor chrome <= 20% viewport height

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial canon |
