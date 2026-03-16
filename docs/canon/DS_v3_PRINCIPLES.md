# PRAVADO v2 — DS v3 PRINCIPLES
Version: v2.0 (Canon — expanded from stub)
Last Updated: 2026-02-24

---

## Purpose

Define the design philosophy for Pravado v2: an AI-native, premium command center for professional marketers and PR practitioners. Every design decision should be traceable to one of these principles.

---

## Core Design Philosophy

**Bloomberg Terminal meets AI command center.**

The product communicates authority, density, and control. It is not a consumer SaaS with pastel gradients and large rounded cards. It is a professional tool where every pixel earns its place. Users are making consequential decisions about their public narrative, media relationships, and AI visibility — the interface should match the gravity of those decisions.

**Guiding phrase:** "Dead space is always a design failure."

---

## Principles

### 1. Form Follows Function, Then Premium

Components should be built to communicate their purpose first. Visual refinement (glows, gradients, animation) is applied only after the functional hierarchy is correct. A visually stunning component that confuses the user's eye is a failed component.

### 2. Semantic Colors Are Functional, Not Decorative

The pillar accent colors — iris (Content), magenta (PR), cyan (SEO/AEO) — are a communication system. They tell the user which pillar owns an action, element, or signal. Using cyan in a Content context is a semantic error, not a style preference. Violating pillar color semantics breaks the cross-pillar coherence model.

### 3. Typography Hierarchy Is Non-Negotiable

Headings must be visually distinct from body text. The minimum gap between page title and body text is 10px (24px page title, 14px body). Card titles must be disambiguated from body text through weight and opacity when size gaps are small. See `DS_v3_1_EXPRESSION.md` for the canonical scale.

### 4. Information Density Is Calibrated, Not Maximized

The goal is not to display every possible data point — it is to display the right data points at the right weight. Density is tuned for power users, but progressive disclosure hides complexity until it's needed. A cluttered surface is not a dense surface; it is an unedited surface.

### 5. Micro-Interactions Are Meaningful and Restrained

Animations encode state, not aesthetics. A pulsing AI dot means something is computing. A card glow means it is selected or active. A dashed-to-solid edge transition means a citation was verified. If an animation does not communicate state change, remove it.

### 6. Width Is Earned, Not Assumed

Components do not span the full container by default. Width is set by data shape — three stats live in a 3-column grid, not a single wide card. A form input for an email address is 420px maximum, not 100%. Every `w-full` must be justified.

### 7. Tables for Comparison, Cards for Decisions

If the user needs to compare rows of data across multiple attributes, use a table. If the user needs to decide whether to take a single action, use a card. Tabular data masquerading as cards is the single most common layout failure in the codebase.

---

## Layout Canon

### Primary Layout: Tri-Pane Command Center

The Command Center is the canonical surface: Action Stream (left) + Intelligence Canvas (center) + Strategy Panel (right). All other surfaces use this as the visual reference for density, spacing, and information weight.

### Responsive Behavior

- Desktop (1280px+): Full three-pane or surface-with-tabs layout
- Tablet (768–1279px): Two-pane with drawer overlay for third pane
- Mobile (< 768px): Single-pane, stacked sections

### Surface Shell Pattern

Every work surface follows this structure:
1. `CommandCenterTopbar` (global, sticky, h-16)
2. Surface shell header (h1 + pillar icon + quick actions)
3. `ImpactStrip` (SAGE tag + EVI + mode badge)
4. Tab bar
5. Content area

No surface deviates from this order. The topbar is always first, always sticky.

---

## Interaction Canon

- **Drawers** for inspection and detail views ("peek" pattern)
- **Modals** for confirmations and destructive actions
- **Inline affordances** in Copilot mode (Approve/Reject visible without clicks)
- **Clear state transitions**: proposed → queued → running → done
- **Live indicators**: subtle, purposeful, state-accurate (not decorative)
- **Mode-aware surfaces**: the UI environment changes with mode, not just the badge

---

## What Success Looks Like

A completed surface passes these tests:

1. **5-second test:** A new user can identify: (a) what surface they're on, (b) what the most important number is, (c) what the primary action is — within 5 seconds without clicking anything.

2. **Hierarchy test:** Covering all color and hiding all icons, the visual weight of headings, body, and metadata is still clearly distinguishable by size and weight alone.

3. **Width test:** No component spans more width than its content requires. All widths are justified.

4. **Mode test:** Toggling the mode badge changes the visible information, not just the badge color.

5. **Pixel test:** A senior frontend engineer looking at any component can immediately identify what decision the user is meant to make from that component alone.

---

## Compliance Checklist

- [ ] No "amateur dashboard" look — no pastel cards, no soft shadows as primary surface, no full-width cards for small amounts of data
- [ ] Visual hierarchy communicates decision priority — most important action is visually heaviest
- [ ] System feels AI-native — environment, not widgets
- [ ] Typography hierarchy visible without color — size/weight differences alone are legible
- [ ] Every animation encodes real state — no decorative motion
- [ ] Every color is semantically correct — pillar colors on their pillars only
- [ ] Every width is justified — no `w-full` on small data components
