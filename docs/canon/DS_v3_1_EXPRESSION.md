# PRAVADO v2 — DS v3.1 EXPRESSION
Version: v2.0 (Canon — expanded from stub)
Last Updated: 2026-02-24

---

## Background Palette Tokens

| Token | CSS Variable | Tailwind Class | Hex | Use |
|-------|-------------|---------------|-----|-----|
| Page background | `--slate-0` / `--page-bg` | `bg-page` / `bg-slate-0` | `#0A0A0F` | The void. Page root. |
| Subtle elevation | `--slate-1` | `bg-slate-1` | `#0E0E14` | Headers, sub-panels, sidebar. |
| Card / Panel | `--slate-2` / `--panel-bg` | `bg-panel` / `bg-slate-2` | `#13131A` | Standard card and panel background. |
| Panel elevated | `--slate-3` | `bg-slate-3` | `#19191F` | Inputs, elevated panels. |
| Border / Active | `--slate-4` / `--dark-border` | `bg-slate-4` | `#1F1F28` | Active/hover states, default borders. |
| Border hover | `--slate-5` | `bg-slate-5` | `#2A2A35` | Hover borders, pressed states. |
| Muted surface | `--slate-6` | `bg-slate-6` | `#3D3D4A` | Muted surfaces, disabled states. |

**Stacking rule:** Never jump more than two steps between parent and child. Never use values between these steps (phantom values). Never go darker than `bg-page` except for the Entity Map canvas (dedicated `--canvas-bg: #050505` token).

---

## Brand Accent Tokens

| Token | CSS Variable | Tailwind | Hex | Pillar |
|-------|-------------|----------|-----|--------|
| Iris / Purple | `--brand-iris` | `brand-iris` | `#A855F7` | Content |
| Cyan | `--brand-cyan` | `brand-cyan` | `#00D9FF` | SEO / AEO |
| Magenta | `--brand-magenta` | `brand-magenta` | `#D946EF` | PR |
| Teal | `--brand-teal` | `brand-teal` | `#14B8A6` | Secondary accent |
| Amber | `--brand-amber` | `brand-amber` | `#F59E0B` | Warning-adjacent |

**Pillar law:** Iris is Content. Cyan is SEO/AEO. Magenta is PR. Never use a pillar color on a different pillar's elements.

---

## Semantic Colors

| Token | Hex | Use |
|-------|-----|-----|
| `semantic-success` | `#22C55E` | Success states — always with `/10` bg, `/20` border |
| `semantic-warning` | `#EAB308` | Warning states — always with `/10` bg, `/20` border |
| `semantic-danger` | `#EF4444` | Error/danger states — always with `/10` bg, `/20` border |
| `semantic-info` | `#00D9FF` | Info — same as brand-cyan |

---

## Typography Scale (Authoritative)

**Fixed in v2.0:** The v1.0 canon used `text-lg` (18px) as the maximum heading size with `text-sm` (14px) body, creating a 4px gap invisible at normal viewing distances. The corrected scale ensures a 10px minimum gap between page titles and body text.

| Level | Size | Tailwind | Weight | Opacity | Context |
|-------|------|----------|--------|---------|---------|
| Surface Title | 24px | `text-2xl` | 700 | `/95` | h1, one per route/surface |
| Section Heading | 20px | `text-xl` | 600 | `/95` | Major content sections |
| Pane / Panel Title | 18px | `text-lg` | 600 | `/90` | Tri-pane headers, modal headers |
| Sub-section | 16px | `text-base` | 600 | `/90` | Card group labels, sub-sections |
| Card Title | 15px | `text-[15px]` | 600 | `/90` | Individual card headings |
| Body Primary | 14px | `text-sm` | 400 | `/85` | Main readable content |
| Body Secondary | 13px | `text-[13px]` | 400 | `/70` | Supporting text |
| Metadata | 12px | `text-xs` | 500 | `/55` | Must use uppercase + tracking-wide |
| Badge / Micro | 11px | `text-[11px]` | 700 | varies | Badge labels only — uppercase required |

### Hard Rules

1. `text-2xl font-bold` is the **only** acceptable Surface Title. Never `text-xl` for an h1.
2. `text-xs` (12px) is **only** permitted with `uppercase tracking-wide`. Never for prose.
3. `text-[11px]` is **only** for badge labels with `uppercase tracking-wider font-bold`. Never for readable text.
4. `text-[10px]` — **never, anywhere.**
5. Card titles and body text may be the same pixel size (14–15px) — they must be distinguished by `font-semibold` vs `font-normal` AND opacity (`/90` vs `/85`).

### Font Families

- **Primary:** `Inter` — all UI text
- **Monospace:** `JetBrains Mono` — code, data values, numeric displays where tabular alignment matters

---

## Border Radius System

**Updated in v2.0:** Default radius reduced from 16px to 8px for enterprise authority.

| Token | CSS Variable | Value | Use |
|-------|-------------|-------|-----|
| `rounded-xs` | `--radius-xs` | 4px | Tight elements: badges, chips |
| `rounded-sm` | `--radius-sm` | 6px | Small buttons, compact elements |
| `rounded-md` | `--radius-md` | 8px | **Default.** Cards, inputs, panels. |
| `rounded-lg` | `--radius-lg` | 12px | Larger panels, drawers |
| `rounded-2xl` | `--radius-2xl` | 16px | Modals, large overlays |

**Rule:** `rounded-md` (8px) is the default for all cards, inputs, buttons, and panels. 8px reads as professional precision tool. 16px reads as consumer app. Use 12px+ only for modals and large overlay containers.

---

## Opacity Scale (Standard Steps Only)

The standard Tailwind opacity steps for all brand/semantic colors:

```
/5  /10  /15  /20  /25  /30  /40  /50  /60  /70  /80  /90
```

Non-standard steps (`/8`, `/12`, `/22`, etc.) are **banned**. Tailwind may not generate them in JIT mode. Always use the nearest standard step.

---

## Elevation / Shadow System

| Token | CSS Variable | Use |
|-------|-------------|-----|
| `shadow-elev-0` | `--elev-0` | Flat, no shadow |
| `shadow-elev-1` | `--elev-1` | Standard card elevation |
| `shadow-elev-2` | `--elev-2` | Hover state elevation |
| `shadow-elev-3` | `--elev-3` | Drawers, modals |
| `shadow-panel` | `--shadow-panel` | Fixed side panels |

---

## Motion System

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — emphatic, spring-like. Maps to `ease-emphatic`.
- **Standard ease:** `cubic-bezier(0.4, 0, 0.2, 1)` — smooth. Maps to `ease-standard`.
- **Duration scale:** xs (100ms) → sm (150ms) → md (200ms) → lg (300ms)
- **Principle:** All animations encode state change. No decorative motion.

---

## Interaction Hover Model

Preferred hover model is **edge glow**, not physical lift:

```
// ✅ Preferred: edge glow
hover:shadow-[0_0_0_1px_rgba(0,217,255,0.3),0_0_12px_rgba(0,217,255,0.15)]

// ✅ Also acceptable: border shift + bg elevation
hover:border-slate-5 hover:bg-panel

// ❌ Deprecated: physical lift
hover:transform hover:-translate-y-1 hover:shadow-lg
```

Physical lift (`translateY(-1px)`) implies a physical object metaphor — inconsistent with an AI-native tool. Edge glow implies activation and intelligence.

---

## Omni-Tray

Permitted as the single AI-first command interface in the topbar. Rules:

- Accidental triggers prevented by velocity + dwell gating
- Rendered as rounded-full pill, not a rectangle input
- Always shows ⌘K hint
- Opens as a centered modal overlay (not an inline expansion)
- Contains AI chat interface, not a text search input
- Never duplicated — only one Omni-Tray trigger per topbar

---

## Banned Phantom Values

These hex values do not exist in DS v3.1 and must never appear in component code:

```
#050508   →  bg-page
#0D0D12   →  bg-slate-1
#111116   →  bg-panel
#111118   →  bg-panel
#16161E   →  bg-slate-2 or bg-slate-3
#1A1A24   →  border-border-subtle
#2A2A36   →  border-slate-5 (correct is #2A2A35 — off by 1)
#3A3A48   →  border-slate-5 or border-slate-6
```

Any of these in component code is a DS compliance violation.

---

## Compliance Checklist

- [ ] Accent colors map to their pillar (iris=Content, magenta=PR, cyan=SEO)
- [ ] No opacity steps outside the standard scale
- [ ] Motion is state-encoding, not decorative
- [ ] Omni-Tray never causes accidental actions
- [ ] Typography hierarchy is legible at 14px minimum for body text
- [ ] Surface titles use text-2xl minimum
- [ ] Default border radius is rounded-md (8px)
- [ ] No phantom hex values anywhere in component code
- [ ] JetBrains Mono used for data/numeric displays where alignment matters
