# DS v3.1 Compliance Checklist
**Canon Status:** ACTIVE — Use before committing any UI component  
**Authority:** `DS_v3_PRINCIPLES.md` + `DS_v3_1_EXPRESSION.md`  
**Last Updated:** 2026-02-18

> Claude Code: Before writing or reviewing ANY component, run through this checklist mentally. Before submitting a sprint, verify each section passes. Flag violations inline with `// DS-VIOLATION:` comments rather than silently fixing — let the human decide on remediation strategy.

---

## Section 1 — BANNED VALUES (Automatic Fail)

If any of these appear in component code, the component **fails** compliance. No exceptions.

### 1A — Phantom Hex Values
These hex values do not exist in DS v3.1. They are drift artifacts from previous sessions.

```
BANNED HEX VALUES:
#050508   →  Use bg-page (bg-slate-0, #0A0A0F)
#0D0D12   →  Use bg-slate-1 (#0E0E14)
#111116   →  Use bg-slate-2 (#13131A)
#111118   →  Use bg-slate-2 (#13131A)
#16161E   →  Use bg-slate-2 or bg-slate-3
#1A1A24   →  Use border-border-subtle (or border-slate-4, #1F1F28)
#2A2A36   →  Use border-slate-5 (#2A2A35) — note: off by 1 digit
#3A3A48   →  Use border-slate-5 or border-slate-6
#0D0D12   →  Use bg-slate-1 (repeated — very common violation)
```

### 1B — Legacy Tailwind Color Classes
Any Tailwind color class NOT in the approved list below is banned:

```
BANNED CLASS PREFIXES:
bg-gray-*       →  Use bg-slate-* or bg-page/bg-panel
bg-zinc-*       →  Use bg-slate-* tokens
bg-neutral-*    →  Use bg-slate-* tokens
bg-white        →  Only allowed as bg-white/X (opacity scale). bg-white alone = banned.
bg-black        →  Use bg-page/X with opacity. bg-black alone = banned.
text-gray-*     →  Use text-white/X opacity scale
text-zinc-*     →  Use text-white/X opacity scale
text-neutral-*  →  Use text-white/X opacity scale
text-white      →  MUST have opacity modifier: text-white/90, text-white/70, etc.
                   Plain text-white (#FFFFFF) is brighter than DS intent (--white-0: #E8E8ED)
border-gray-*   →  Use border-border-subtle or border-slate-*
border-zinc-*   →  Use border-border-subtle or border-slate-*
```

### 1C — Invalid Tailwind Opacity Syntax
Tailwind does NOT support chained opacity modifiers. These compile silently to nothing:

```
INVALID (silently broken):
bg-white/20/50     →  Use bg-white/10 or bg-white/15
bg-white/30/10     →  Use bg-white/5
any-class/X/Y      →  Pick ONE opacity step
```

### 1D — Banned JS Token Objects
Do NOT define surface values as JavaScript constant objects. This bypasses Tailwind entirely:

```typescript
// BANNED — Do not create these objects:
const surfaceTokens = { page: '#0A0A0F', card: '#13131A', ... }
const cardClasses = { base: 'bg-[#13131A] ...', ... }

// Use Tailwind classes directly in JSX/TSX instead.
// Exception: pillar accent style maps (bg, text, border as Tailwind classes) are OK.
```

---

## Section 2 — APPROVED TOKEN REFERENCE

Always use these. Never guess, never hardcode adjacent values.

### 2A — Background Hierarchy

| Intent | Tailwind Class | Hex | CSS Var |
|--------|---------------|-----|---------|
| Page background (darkest) | `bg-page` or `bg-slate-0` | `#0A0A0F` | `--page-bg` / `--slate-0` |
| Subtle elevation | `bg-slate-1` | `#0E0E14` | `--slate-1` |
| Card / Panel default | `bg-panel` or `bg-slate-2` | `#13131A` | `--panel-bg` / `--slate-2` |
| Panel elevated | `bg-slate-3` | `#19191F` | `--slate-3` |
| Interactive hover bg | `bg-slate-4` | `#1F1F28` | `--slate-4` |
| Pressed / active bg | `bg-slate-5` | `#2A2A35` | `--slate-5` |
| Muted surface | `bg-slate-6` | `#3D3D4A` | `--slate-6` |

### 2B — Border Hierarchy

| Intent | Tailwind Class | Hex |
|--------|---------------|-----|
| Default border | `border-border-subtle` | `#1F1F28` |
| Subtle border | `border-slate-4` | `#1F1F28` (same) |
| Hover border | `border-slate-5` | `#2A2A35` |
| Active border | `border-slate-6` | `#3D3D4A` |

### 2C — Text / Content Colors

| Intent | Tailwind Class | Opacity / Hex |
|--------|---------------|--------------|
| Primary text | `text-text` or `text-white-0` | `#E8E8ED` |
| High emphasis | `text-white/90` | 90% white |
| Body / reading | `text-white/85` | 85% white |
| Secondary | `text-white/70` | 70% white |
| Tertiary | `text-white/55` | 55% white |
| Muted / metadata | `text-white/50` | 50% white |
| Disabled / hint | `text-white/40` | 40% white |
| Muted semantic | `text-muted` | `--muted` (`#3D3D4A`) |

### 2D — Brand Accent Colors (Pillar Identity)

| Pillar | Token | Tailwind | Hex |
|--------|-------|---------|-----|
| Content | Iris | `brand-iris` | `#A855F7` |
| SEO/AEO | Cyan | `brand-cyan` | `#00D9FF` |
| PR | Magenta | `brand-magenta` | `#D946EF` |
| — | Teal | `brand-teal` | `#14B8A6` |
| — | Amber | `brand-amber` | `#F59E0B` |

### 2E — Semantic Colors

| State | Tailwind | Hex |
|-------|---------|-----|
| Success | `semantic-success` | `#22C55E` |
| Warning | `semantic-warning` | `#EAB308` |
| Danger | `semantic-danger` | `#EF4444` |
| Info | `semantic-info` | `#00D9FF` (same as brand-cyan) |

**Semantic background pattern** (always use 10-20% opacity):
```
bg-semantic-success/10  border-semantic-success/20  text-semantic-success
bg-semantic-warning/10  border-semantic-warning/20  text-semantic-warning
bg-semantic-danger/10   border-semantic-danger/20   text-semantic-danger
```

### 2F — Shadows / Elevation

| Level | Class | Use |
|-------|-------|-----|
| None | `shadow-elev-0` | Flat elements |
| Subtle | `shadow-elev-1` | Cards at rest |
| Raised | `shadow-elev-2` | Hover states, dropdowns |
| Floating | `shadow-elev-3` | Modals, drawers |
| Panel | `shadow-panel` | Side panels, right rails |

### 2G — Allowed Opacity Steps for Brand Colors

Only use standard Tailwind opacity steps with brand colors:
```
/5  /10  /15  /20  /25  /30  /40  /50  /60  /70  /80  /90
```
NOT: `/8`, `/12`, `/18`, `/22`, `/35`, or any other non-standard step.

---

## Section 3 — TYPOGRAPHY RULES

### 3A — Minimum Font Sizes

| Context | Min Size | Class |
|---------|---------|-------|
| Body / reading text | 14px | `text-sm` or `text-body` |
| Metadata / timestamps | 13px | `text-[13px]` |
| Uppercase labels only | 11px | `text-[11px]` — MUST have `uppercase tracking-wider font-bold` |
| Smallest possible | 10px | `text-[10px]` — ONLY for uppercase badge labels |

**Rule:** `text-xs` (12px) is ONLY permitted with `uppercase tracking-wider`. Never use for regular readable content.

### 3B — Required Typographic Patterns

```tsx
// Section label (small, uppercase)
<span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
  Label Text
</span>

// Metadata / timestamp
<span className="text-[13px] text-white/50">2h ago</span>

// Body text
<p className="text-sm text-white/70 leading-relaxed">Content</p>

// Card title
<h3 className="text-sm font-semibold text-white/90">Title</h3>

// Stat / number display
<span className="text-2xl font-bold text-white tabular-nums">42</span>
```

### 3C — Font Weight Rules

- **Labels, badges, section headers:** `font-bold` or `font-semibold`
- **Body text:** `font-normal` (400) — do NOT bold body copy
- **Button text:** `font-semibold` for primary, `font-medium` for secondary
- **Numbers / stats:** `font-bold` with `tabular-nums` feature

---

## Section 4 — COMPONENT PATTERNS

### 4A — Card Anatomy

Every card must follow this structure:

```tsx
// Standard card
<div className="bg-slate-2 border border-border-subtle rounded-xl shadow-elev-1 transition-all duration-150 hover:border-slate-5 hover:shadow-elev-2">
  {/* content */}
</div>

// Interactive card (clickable)
<div className="bg-slate-1 border border-border-subtle rounded-xl shadow-elev-1 cursor-pointer transition-all duration-150 hover:bg-slate-2 hover:border-slate-5 hover:shadow-elev-2">
  {/* content */}
</div>

// Pillar-accented card (left border stripe)
<div className="bg-slate-1 border border-border-subtle border-l-4 border-l-brand-iris rounded-xl">
  {/* content */}
</div>
```

### 4B — Pillar Accent Pattern

Always define pillar accent maps as Tailwind class strings (not hex):

```typescript
// CORRECT
const pillarAccents = {
  content: {
    bg: 'bg-brand-iris/10',
    bgHover: 'bg-brand-iris/20',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    borderHover: 'border-brand-iris/50',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.15)]',
    solidBg: 'bg-brand-iris',
  },
  // ...
}
```

### 4C — Mode Badge Pattern

```tsx
// Manual mode
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/70 border-white/20">
  Manual
</span>

// Copilot mode
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-iris/10 text-brand-iris border-brand-iris/30">
  Copilot
</span>

// Autopilot mode
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30">
  Autopilot
</span>
```

### 4D — Button Hierarchy

```tsx
// Primary (pillar-colored)
<button className="px-4 py-2.5 text-sm font-semibold bg-brand-iris text-white rounded-lg hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-150">

// Secondary (ghost)
<button className="px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150">

// Tertiary (text-only)
<button className="px-3 py-2 text-sm font-medium text-white/50 hover:text-white/80 hover:bg-slate-4/50 rounded-lg transition-colors">

// Success state
<button className="px-4 py-2.5 text-sm font-semibold bg-semantic-success text-white rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150">
```

### 4E — AI Presence Indicators

```tsx
// Idle dot
<span className="w-2 h-2 rounded-full bg-slate-6" />

// Analyzing (cyan pulse)
<span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />

// Generating (iris)
<span className="w-2 h-2 rounded-full bg-brand-iris shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
```

### 4F — Drawer / Overlay Backdrop

```tsx
// Correct backdrop (no bg-black)
<div className="fixed inset-0 bg-page/70 backdrop-blur-sm z-40" onClick={onClose} />
```

### 4G — Scrollbar Style

Always include this scrollbar pattern in pane containers:

```tsx
<style jsx global>{`
  .prave-scroll::-webkit-scrollbar { width: 4px; }
  .prave-scroll::-webkit-scrollbar-track { background: transparent; }
  .prave-scroll::-webkit-scrollbar-thumb { background: #1F1F28; border-radius: 2px; }
  .prave-scroll::-webkit-scrollbar-thumb:hover { background: #2A2A35; }
`}</style>
```

---

## Section 5 — IMPACT STRIP REQUIREMENTS

Every work surface shell MUST include the Impact Strip — a persistent header bar present on all 7 canonical surfaces. This is non-negotiable per `PRODUCT_CONSTITUTION.md`.

```tsx
// Impact Strip anatomy (below surface title, above tab nav)
<div className="flex items-center gap-4 px-6 py-2 border-b border-border-subtle bg-slate-1/50">
  {/* SAGE Tag — explains WHY this surface is showing this state */}
  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
    <span className="w-1.5 h-1.5 rounded-full bg-brand-iris" />
    SAGE
    <span className="font-normal normal-case text-white/40">Authority gap: AI citations</span>
  </div>

  {/* EVI Score — always visible */}
  <div className="flex items-center gap-1.5">
    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">EVI</span>
    <span className="text-sm font-bold text-brand-cyan tabular-nums">72</span>
    <span className="text-[11px] text-semantic-success">↑3</span>
  </div>

  {/* Mode badge — current automation mode for this pillar */}
  <span className="ml-auto px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-iris/10 text-brand-iris border-brand-iris/30">
    Copilot
  </span>
</div>
```

**Note:** ContentWorkSurfaceShell currently does NOT have an Impact Strip. This is a V1 gap to fix.

---

## Section 6 — PRE-COMMIT SELF-CHECK

Before completing any UI component, answer YES to all:

```
[ ] No phantom hex values present (see Section 1A banned list)
[ ] No bg-gray-*, bg-zinc-*, text-gray-* classes
[ ] No plain text-white or bg-white (must have opacity modifier)
[ ] No bg-black (use bg-page/X instead)
[ ] No invalid opacity chains (no /X/Y patterns)
[ ] No JS surfaceTokens constant objects
[ ] All brand color opacities use standard steps (/5 /10 /15 /20 /25 /30 /40 /50 /60 /70 /80 /90)
[ ] All text smaller than text-sm (14px) has uppercase + tracking-wider
[ ] Cards use bg-slate-1 or bg-slate-2, not phantom values
[ ] Borders use border-border-subtle or border-slate-*, not border-[#1A1A24]
[ ] Hover states use bg-slate-2 or bg-slate-3, not #111116 or #111118
[ ] Impact Strip present (or noted as deliberate deferral with // TODO: IMPACT-STRIP)
[ ] Mode badge visible for the surface's current pillar mode
[ ] AI presence dot color matches state (cyan=analyzing, iris=generating, slate-6=idle)
```

---

## Section 7 — QUICK FIXES FOR COMMON VIOLATIONS

Copy-paste replacements for the most common drift patterns:

```
bg-[#050508]   →  bg-page
bg-[#0A0A0F]   →  bg-page
bg-[#0D0D12]   →  bg-slate-1
bg-[#13131A]   →  bg-panel  (or bg-slate-2)
bg-[#111116]   →  bg-slate-2
bg-[#111118]   →  bg-slate-2
bg-[#16161E]   →  bg-slate-2
border-[#1A1A24]  →  border-border-subtle
border-[#1F1F28]  →  border-border-subtle
border-[#2A2A36]  →  border-slate-5
bg-gradient-to-r from-[#0A0A0F] to-[#0D0D12]  →  bg-gradient-to-r from-page to-slate-1
fill-[#1A1A24]    →  fill-slate-4  (for SVG fills)
bg-white/20/50    →  bg-white/10
bg-white/30/10    →  bg-white/5
hover:bg-brand-iris/8   →  hover:bg-brand-iris/10
hover:bg-brand-cyan/8   →  hover:bg-brand-cyan/10
hover:bg-brand-magenta/8  →  hover:bg-brand-magenta/10
text-white (plain)  →  text-white/90  (or text-text)
bg-black/50  →  bg-page/70 backdrop-blur-sm
```
