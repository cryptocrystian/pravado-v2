# Information Density Hierarchy Canon

> **STATUS: SUPERSEDED by /docs/canon/work/WORK_SURFACE_CONTRACT.md**

**Version:** 1.0
**Status:** Superseded
**Last Updated:** 2026-02-02

---

## 1. Purpose

This canon defines information density standards, typography minimums, and spatial discipline for all Pravado surfaces. It establishes guardrails that prevent both information overload and wasteful dead space.

This canon governs **density and spatial allocation**, not layouts or components.

It exists to answer: "How much information is appropriate for this surface, and what are the minimum standards for readability?"

---

## 2. The Core Problems

### Problem 1: Over-Density

When too much information is packed into a space:

- Typography shrinks below readable thresholds
- Spacing collapses, creating visual noise
- Users experience cognitive overload
- Scanning becomes inefficient

### Problem 2: Under-Density

When space is used inefficiently:

- Content requires excessive scrolling
- Primary CTAs are pushed below the fold
- Dead space dominates viewport
- Information feels sparse and disconnected

**Information density canon** solves both by establishing minimum and maximum standards.

---

## 3. Typography Minimums (Absolute)

### The 12px Rule

**Body text and interactive labels MUST be 12px (text-xs) or larger.**

This is a physiological readability requirement, not a stylistic preference.

| Category | Minimum Size | Tailwind Class | Violations |
|----------|-------------|----------------|------------|
| **Body Text** | 12px | `text-xs` minimum | Paragraphs, descriptions |
| **Interactive Labels** | 12px | `text-xs` minimum | Buttons, links, form labels |
| **List Items** | 12px | `text-xs` minimum | Queue rows, library items |
| **Data Values** | 12px | `text-xs` minimum | Scores, dates, metrics |

### Micro-Label Exception

The ONLY text permitted below 12px:

| Category | Allowed Size | Tailwind Class | Examples |
|----------|-------------|----------------|----------|
| **Micro-Labels** | 10px | `text-[10px]` | Axis labels on charts, tooltips, badge modifiers |
| **Decorative** | 10px | `text-[10px]` | "Beta" tags, version numbers |

**Micro-labels MUST:**

- Be supplementary, not primary information
- Never be the only way to convey critical information
- Never be interactive (not clickable)

### Forbidden Patterns

The following are **canonically forbidden**:

- Body text at `text-[9px]` or smaller
- Interactive elements (buttons, links) below 12px
- Critical status indicators below 12px
- Timestamps or dates in critical paths below 12px

---

## 4. Density Ceilings by Surface Type

### Density Classification

| Density Level | Definition | Use Cases |
|---------------|------------|-----------|
| **High** | Maximum information per viewport | Dashboards, analytics, data tables |
| **Medium** | Balanced information and breathing room | Work queues, libraries, calendars |
| **Low** | Generous space, focused attention | Editors, approval flows, empty states |

### Surface Density Assignments

| Surface Type | Density Level | Rationale |
|--------------|---------------|-----------|
| **Command Center Dashboard** | High | Overview requires data density |
| **Work Queue (Triage)** | Medium | Scanning efficiency balanced with readability |
| **Library (Browse)** | Medium | Card-based browsing needs visual room |
| **Calendar** | Medium | Time-based layout has inherent structure |
| **Editor** | Low | Focus on single content item |
| **Approval Flow (Copilot)** | Low | Decision-making needs space to think |
| **Exception Console (Autopilot)** | Low | Sparse by design; exceptions only |
| **Insights/Analytics** | High | Data visualization density acceptable |

---

## 5. Spatial Discipline

### Dead Space Definition

**Dead space** is viewport area that contains neither:

- Content (text, images, data)
- Interactive affordances (buttons, links, controls)
- Meaningful whitespace (visual grouping, breathing room)

Dead space is WASTED space.

### The 50% Rule for Primary Surfaces

For any primary work surface (not settings, not modals):

**No more than 50% of the viewport may be dead space.**

Calculation:
- Measure viewport area above the fold
- Subtract meaningful content area (text, controls, structured whitespace)
- Remaining "empty" area must be ≤50%

### Full-Width Panel Anti-Pattern

**A panel that spans 100% width but contains content in only 20-30% creates 70-80% dead space.**

This is canonically forbidden for:

- Primary action bars
- Status headers
- Approval panels

**Resolution:** Panels should either:

- Be width-constrained to their content
- Be inline with other content
- Contain sufficient information to justify their width

### Scroll Discipline

**Primary CTAs MUST be visible without scrolling on a standard viewport (1080p).**

A "Primary CTA" includes:

- The main action for the current view (Create, Approve, Save)
- Mode-specific primary action (Run Plan, Acknowledge Exception)
- Navigation to the user's likely next step

**Exception:** Long-form editors may have CTAs below the fold, but MUST have sticky save controls.

---

## 6. Spacing Standards

### Minimum Spacing

Components MUST have sufficient spacing to:

- Be visually distinct from neighbors
- Be clickable without mis-tap risk (44px touch target minimum)
- Group related items and separate unrelated items

### Spaceless Stacking Forbidden

**Components MUST NOT stack with zero spacing.**

| Context | Minimum Gap | Tailwind Class |
|---------|-------------|----------------|
| **List Items** | 4px | `gap-1` or `space-y-1` |
| **Card Grid** | 12px | `gap-3` |
| **Form Fields** | 8px | `gap-2` or `space-y-2` |
| **Section Separators** | 16px | `gap-4` or `mb-4` |

### Maximum Spacing

Spacing should not be so generous that:

- Related items appear unrelated
- Primary content is pushed below the fold
- Viewport feels empty despite having content

---

## 7. Mode-Specific Density

### Manual Mode Density

- **Acceptable:** Medium to High density in triage views
- **Acceptable:** Low density in editor views
- **Forbidden:** Over-density that sacrifices typography minimums

### Copilot Mode Density

- **Acceptable:** Low to Medium density
- **Acceptable:** Generous space for decision-making
- **Forbidden:** Dense interfaces that rush approval decisions

### Autopilot Mode Density

- **Expected:** Low density (few exceptions shown)
- **Acceptable:** "All clear" empty states
- **Forbidden:** Dense queues that contradict the mode's promise

---

## 8. Invariants (Must Always Be True)

### Invariant 1: Typography Minimum

Body text and interactive labels MUST be 12px (text-xs) or larger, except for explicit micro-labels.

### Invariant 2: Dead Space Ceiling

Primary work surfaces MUST NOT exceed 50% dead space above the fold.

### Invariant 3: CTA Visibility

Primary CTAs MUST be visible without scrolling on standard viewports.

### Invariant 4: Spacing Presence

Components MUST have non-zero spacing from neighbors.

### Invariant 5: Full-Width Justification

Full-width elements MUST justify their width with content, not empty space.

---

## 9. Explicit Non-Goals

This canon does NOT prescribe:

- **Specific Layouts:** Column counts, grid systems
- **Component Design:** Card shapes, button styles
- **Color Usage:** Theming, contrast ratios (covered elsewhere)
- **Responsive Breakpoints:** Mobile vs desktop density

These decisions belong to design system implementation.

---

## 10. Common Failure Modes

### Failure: "Newspaper Print" Syndrome

**Symptom:** Typography shrinks to 9-10px to fit more content.

**Why It Fails:** Users cannot read comfortably; scanning becomes inefficient.

**Resolution:** Maintain 12px minimum; if content doesn't fit, reconsider what content is necessary.

### Failure: "Spacious Emptiness"

**Symptom:** Large headers, generous padding, CTAs below the fold.

**Why It Fails:** Users must scroll to act; dead space wastes attention.

**Resolution:** Apply 50% dead space ceiling; ensure CTAs are above the fold.

### Failure: "Infinite Scroll Avoidance"

**Symptom:** So much content above fold that spacing collapses.

**Why It Fails:** Visual noise; grouping unclear; reading difficult.

**Resolution:** Prioritize content; accept that some items may be below fold.

---

## 11. Relationship to Other Canons

### Superior Canons (override this canon if conflict)

- `PRODUCT_CONSTITUTION.md` — Core mission and philosophy
- `DS_v3_PRINCIPLES.md` — Design system foundation

### Peer Canons (coordinate with this canon)

- `CONTENT_MODE_UX_THESIS.md` — Mode mental models
- `EDITOR_IDENTITY_CANON.md` — Editor vs non-editor surfaces
- `ACTION_GRAVITY_CTA_CANON.md` — CTA placement and visibility

### Subordinate Canons (must comply with this canon)

- Surface-specific density implementations
- Component-level spacing decisions

---

## 12. Validation Checklist

For any Pravado surface, verify:

- [ ] Body text is 12px (text-xs) or larger
- [ ] Interactive labels are 12px (text-xs) or larger
- [ ] Micro-labels (if any) are supplementary and non-interactive
- [ ] Dead space is ≤50% above the fold
- [ ] Primary CTAs are visible without scrolling
- [ ] Components have non-zero spacing from neighbors
- [ ] Full-width elements justify their width with content

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial canonical version |
