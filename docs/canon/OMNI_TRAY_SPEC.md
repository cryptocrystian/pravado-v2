# PRAVADO v2 — OMNI-TRAY SPECIFICATION
Version: 1.0 (Canon)
Decision authority: Christian (product lead)
Status: Approved for implementation

---

## 1. Concept

The Omni-Tray is a persistent AI interface available at all times from any surface. Users access it by moving their cursor toward any of three screen edges (left, right, bottom). The system meets users where they are — no default side, no hierarchy between edges. Proximity triggers the tray; the user's natural mouse position determines which edge they use.

This replaces the "Ask Pravado..." pill in the topbar entirely. Once the Omni-Tray is built, the topbar pill is removed.

---

## 2. Trigger Edges

Three active edges: **left, right, bottom**.

The **top edge is excluded** — the topbar occupies it and users mouse there constantly for navigation. Triggering AI on top-edge approach would cause constant accidental opens.

---

## 3. Proximity + Glow Mechanics

### Distance zones (from edge, in CSS pixels):

| Zone | Distance | Behavior |
|------|----------|----------|
| Dead | > 80px | No reaction. Tab visible at resting glow only. |
| Approach | 80px → 40px | Edge tab begins glowing. Intensity scales linearly with proximity. |
| Intent | 40px → 20px | Glow brightens significantly. Tab pulses once to signal imminent open. |
| Open | < 20px + 300ms dwell | Tray opens with slide animation. |

### Velocity gate
Fast cursor movement past an edge (velocity > 800px/s) does **not** trigger the tray. Only slow, intentional approach triggers it. This prevents accidental opens when users move quickly across the screen toward scrollbars, window chrome, or other targets.

### Dwell requirement
Cursor must remain within the 20px open zone for **300ms continuously** before the tray opens. This is long enough to filter accidents, short enough to feel instant when intentional.

---

## 4. Glow Color

All three edges use **brand-cyan** (`var(--brand-cyan)`, `#00D9FF`).

Rationale: brand-cyan is already the system's AI identity color — AI Active indicator in the topbar, EVI trend lines, system pulse animations throughout. Using it here makes the tray feel like part of the same AI nervous system rather than a new element. Consistent with Pravado's visual language for "the system is active and aware."

### Glow states:
- **Resting:** Very low intensity glow on tab only (`box-shadow: 0 0 8px rgba(0, 217, 255, 0.15)`)
- **Approach:** Glow expands to edge strip (`0 0 20px rgba(0, 217, 255, 0.35)`)
- **Intent:** Full brightness pulse (`0 0 40px rgba(0, 217, 255, 0.65)`)
- **Open:** Glow on tray border edge (`0 0 24px rgba(0, 217, 255, 0.4)`)

---

## 5. Tab Indicator

A persistent tab sits flush with each active edge at all times. Gives users a visible click target as an alternative to hover gesture. Both hover-to-edge and click-on-tab open the tray.

### Tab design:
- **Left/right edges:** Vertical pill, 40px wide × 80px tall, centered vertically on the edge
- **Bottom edge:** Horizontal pill, 80px wide × 40px tall, centered horizontally on the edge
- **Icon:** Small AI spark icon (Phosphor `Sparkle` weight `regular`), centered in pill
- **Background:** `bg-slate-2/90 backdrop-blur-sm`
- **Border:** `border border-brand-cyan/20`
- **Resting glow:** Low intensity brand-cyan shadow (see above)
- **No text label** — icon only. Universally understood as "AI is here."

### Tab behavior:
- Visible at all times (not hidden until hover)
- Glows in sync with proximity detection
- Click opens tray immediately (no dwell required for direct click)

---

## 6. Tray Dimensions

### Left / Right edge trays:
- **Width:** 420px
- **Height:** Full viewport height minus topbar (`calc(100vh - 80px)`)
- **Position:** Fixed, top: 80px (below topbar), left: 0 or right: 0
- **Slide animation:** Translates in from edge over 280ms, `cubic-bezier(0.16, 1, 0.3, 1)`

### Bottom edge tray:
- **Width:** Full viewport width
- **Height:** 440px
- **Position:** Fixed, bottom: 0
- **Slide animation:** Translates up from bottom over 280ms, same easing

---

## 7. Tray Contents

### Structure (top to bottom for side trays, left to right for bottom tray):

```
┌─────────────────────────────────┐
│ HEADER                          │
│ [Sparkle icon] Ask Pravado  [X] │
│ Surface context label           │
├─────────────────────────────────┤
│ CONTEXT CHIPS (Phase 1: static) │
│ [Chip 1] [Chip 2] [Chip 3]      │
│ (Phase 2: dynamic from surface) │
├─────────────────────────────────┤
│ CHAT AREA                       │
│ (scrollable message history)    │
│                                 │
│                                 │
├─────────────────────────────────┤
│ INPUT BAR                       │
│ [Type a message...      ] [↑]   │
└─────────────────────────────────┘
```

### Header:
- `bg-slate-1` background
- Sparkle icon in `text-brand-cyan`
- Title: "Ask Pravado" — `text-base font-semibold text-white/90`
- Surface context label below title: `text-xs text-white/50` — shows current surface name (e.g. "PR Intelligence", "Analytics", "Content")
- X close button: top-right, `p-2 text-white/50 hover:text-white hover:bg-slate-3 rounded-lg`

### Context chips (Phase 1 — static per surface):

| Surface | Chip 1 | Chip 2 | Chip 3 |
|---------|--------|--------|--------|
| Command Center | "Summarize my week" | "What needs attention?" | "EVI status" |
| PR | "Draft a follow-up" | "Find journalists for my topic" | "Explain coverage gap" |
| Content | "Generate a brief" | "Improve CiteMind score" | "Find content gaps" |
| SEO | "Explain EVI drop" | "Find entity gaps" | "Schema opportunities" |
| Analytics | "Interpret this trend" | "Compare to last period" | "What drove EVI change?" |
| Calendar | "What's due this week?" | "Reschedule suggestions" | "Dependency conflicts" |

Chip style: `px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-3 border border-border-subtle text-white/70 hover:text-white hover:border-brand-cyan/30 hover:bg-slate-4 transition-all`

### Chat area:
- Scrollable, `flex-1 overflow-y-auto`
- Empty state: subtle centered message — "Ask me anything about your visibility strategy." in `text-sm text-white/40`
- Message bubbles: user messages right-aligned `bg-brand-iris/20 text-white/90`, AI messages left-aligned `bg-slate-3 text-white/85`

### Input bar:
- `bg-slate-2 border-t border-border-subtle`
- Textarea, auto-resize up to 3 lines
- Send button: `bg-brand-cyan text-slate-0 rounded-lg` when active, `bg-slate-4 text-white/30` when empty
- Placeholder: "Ask Pravado anything..."

---

## 8. Close Mechanics

Three ways to close — all must work:
1. **X button** in tray header
2. **Click anywhere outside** the tray (backdrop click)
3. **Esc key**

On close: tray slides back out to originating edge over 200ms. Tab returns to resting glow state.

No backdrop overlay/dimming — the tray sits above content without obscuring context. The user should be able to see the surface behind the tray to reference data while chatting.

---

## 9. Discoverability — First-Run Onboarding

On first authenticated session only, a one-time choreography plays after the page loads (2 second delay):

1. Left tab pulses (glow brightens and fades over 600ms)
2. Right tab pulses (same, 200ms after left)
3. Bottom tab pulses (same, 200ms after right)
4. A single tooltip appears near the right tab for 3 seconds: *"AI is always one move away"* — then fades out

This runs once and never again. Stored in localStorage: `pravado_omnitray_intro_shown = true`.

No forced tutorial, no modal, no blocking. Just a single ambient signal that teaches the pattern.

---

## 10. Implementation Notes

### Component architecture:
- `OmniTrayProvider` — wraps the app layout, manages proximity detection via `mousemove` listener on `window`
- `OmniTrayTab` — the persistent edge tab (rendered three times, one per edge)
- `OmniTray` — the tray panel itself (conditionally rendered when open)
- `useOmniTray` hook — exposes `{ open, close, activeEdge, proximityLevel }`

### Proximity detection:
```typescript
// Runs on every mousemove, throttled to 16ms (60fps)
function getProximityLevel(x: number, y: number, edge: 'left' | 'right' | 'bottom'): number {
  // Returns 0 (dead) to 1 (open threshold)
  const topbarHeight = 80;
  if (edge === 'left') return Math.max(0, 1 - (x / 80));
  if (edge === 'right') return Math.max(0, 1 - ((window.innerWidth - x) / 80));
  if (edge === 'bottom') return Math.max(0, 1 - ((window.innerHeight - y) / 80));
  return 0;
}
```

### Velocity gate:
```typescript
// Track last two mouse positions + timestamps
// If distance/time > 800px/s, suppress trigger
const velocity = distance / deltaTime; // px per ms
if (velocity > 0.8) return; // suppress
```

### Z-index:
- Tab: `z-40` (above content, below modals)
- Tray: `z-50` (above everything except toast notifications)

---

## 11. Topbar Pill Removal

Once OmniTray is implemented and deployed, remove the "Ask Pravado..." omni-tray trigger pill from `CommandCenterTopbar.tsx`. The freed space in the topbar center-right should be left as flex space — do not fill it with other elements.

---

## 12. What Omni-Tray Is NOT

- Not a primary execution surface — users don't complete workflows inside it
- Not a notification center — that's the bell icon
- Not a search bar — it's a conversational AI interface
- Not a modal — it doesn't block the page or require dismissal to continue working
- Not surface-specific — it's available identically on every surface (contents adapt, mechanism does not)

---

## 13. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Active edges | Left, right, bottom (not top) | Top occupied by topbar — accidental triggers constant |
| No default/preferred edge | All edges equal | Concept is meeting users where they are |
| Glow color | brand-cyan only | Consistent with system AI identity color |
| Dwell requirement | 300ms | Filters accidents, feels instant when intentional |
| Velocity gate | 800px/s threshold | Prevents scrollbar/window chrome accidental triggers |
| Tab design | Icon-only pill, always visible | Discoverable without being intrusive |
| Context chips | Static Phase 1, dynamic Phase 2 | Reduces activation gap without requiring full AI integration on day 1 |
| No backdrop dim | Tray over content, no overlay | User needs to see surface data while chatting |
| Onboarding | One-time ambient pulse sequence | Teaches without blocking |
| Topbar pill | Remove on Omni-Tray launch | Redundant once edge-trigger exists |
