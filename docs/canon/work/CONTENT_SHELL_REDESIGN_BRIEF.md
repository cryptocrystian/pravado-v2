# CONTENT SHELL REDESIGN BRIEF
Status: ACTIVE — For Claude Code execution  
Date: 2026-03-03  
File: apps/dashboard/src/components/content/ContentWorkSurfaceShell.tsx ONLY  
Do not touch: Any view file, any page file, ImpactStrip component, types, mock data

---

## THE PROBLEM IN NUMBERS

Current chrome stack before first data pixel:
- Global topbar: 44px
- Header block (icon + h1 + subtitle + buttons): ~72px  
- Tab bar: ~44px  
- ImpactStrip (separate row): ~30px  
- Total: ~190px = 24% of a 778px viewport consumed by chrome before any data

Target: ~92px total (global topbar 44px + single unified bar 48px).
The PR surface achieves this. Content must match.

---

## THE REFERENCE: WHAT PR DOES RIGHT

Navigate to /app/pr and observe:
- Global topbar (44px)
- Tab bar immediately below — no surface title block, no subtitle, no icon billboard
- Data starts at ~88px

The global topbar already tells the user they are on the Content surface (nav item highlighted). A large h1 with subtitle is marketing copy in a UI. Remove it entirely.

---

## THE FIX: ONE UNIFIED CHROME BAR

Replace the current 3-row chrome stack (header block + tab row + ImpactStrip) with a single unified bar, 48px tall (h-12), containing everything left-to-right in a single flex row.

Visual layout:
[small iris icon] [Content Hub text-sm] [divider] [Content tab][Library tab][Calendar tab][Insights tab] [flex-1 spacer] [SAGE tag] [divider] [EVI score] [divider] [Mode badge+caret] [Info icon btn] [Create btn+caret]

### Left cluster
- Pillar icon: w-5 h-5 text-brand-iris, inline, NO surrounding box/ring/glow/padding
- Surface title: text-sm font-semibold text-white/80 — NOT an h1, NOT text-2xl
- Vertical divider: w-px h-4 bg-white/10 mx-3
- Tabs: same active/inactive styling as current (iris underline active, text-white/50 inactive), px-3 py-0, items-center

### Right cluster (flex row, items-center gap-2)
- SAGE tag: Lightning icon w-3.5 h-3.5 text-brand-iris + text-[11px] font-bold uppercase tracking-wider text-brand-iris, max-w-[200px] truncate
- Divider: w-px h-4 bg-white/10
- EVI indicator: "EVI" text-[11px] font-bold uppercase tracking-wider text-white/40 mr-1 + score text-sm font-bold tabular-nums text-brand-cyan + delta text-xs text-semantic-success (up arrow + number)
- Divider: w-px h-4 bg-white/10
- Mode switcher badge (see full spec below)
- Explain: icon-only ghost button — Info icon w-4 h-4, p-1.5, rounded, hover:bg-white/5, text-white/50 hover:text-white/80. NO text label.
- Create: filled iris button, same as current — Plus icon + "Create" text + CaretDown

### Bar container
  <div className="flex items-center h-12 px-4 border-b border-border-subtle bg-slate-1 shrink-0 relative z-10">

h-12 = 48px fixed. px-4. bg-slate-1. border-b border-border-subtle. shrink-0 so it never collapses. relative z-10 so dropdowns stack correctly. NO gradient, NO pt-6, NO mb-6, NO pb-0.

---

## MODE SWITCHER SPEC

The mode switcher badge is a button in the right cluster. It shows the current mode and opens a dropdown on click.

Badge button:
  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors {mode-specific tokens}">
    <ModeIcon /> {label} <CaretDown className="w-3 h-3" />
  </button>

Mode-specific tokens (from existing modeTokens object — do not hardcode):
- manual: bg-white/5 text-white/70 border-white/20
- copilot: bg-brand-iris/10 text-brand-iris border-brand-iris/30  
- autopilot: bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30

CRITICAL FIX — Dropdown opens LEFTWARD to prevent viewport clipping:
  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-2 border border-slate-4 rounded-lg shadow-elev-3 py-1 z-[200]">

right-0 (not left-0). z-[200] ensures it renders above all view content. The dropdown ref and click-outside handler already exist in the shell — keep them, just fix right-0 and z-[200].

Add onModeChange prop to shell interface:
  onModeChange?: (mode: AutomationMode) => void;

Call onModeChange?.(selectedMode) when a mode option is clicked, then close the dropdown.

---

## THINGS TO DELETE ENTIRELY FROM THE SHELL

1. The outer header div: <div className="border-b border-border-subtle bg-gradient-to-b from-slate-1 to-transparent">
2. The inner padding div: <div className="px-6 pt-6 pb-0">
3. The title row: <div className="flex items-start justify-between mb-6">
4. The large icon block: <div className="p-3 rounded-xl bg-brand-iris/10 ring-1 ..."><FileText w-6 h-6 /></div>
5. The h1: <h1 className="text-2xl font-bold ...">Content Hub</h1>
6. The subtitle: <p className="text-[13px] text-white/55 ...">Authority-building content orchestration</p>
7. The old Explain button (text version) — replaced by icon-only in unified bar
8. The old Create button location — moved to unified bar right cluster
9. The separate <ImpactStrip ... /> render — do NOT modify ImpactStrip component, just remove the render

---

## WHAT STAYS COMPLETELY UNCHANGED

- All tab filtering logic (Autopilot hides Library/Insights, shows Activity Log)
- All tab click handlers and isTabActive logic
- ExplainDrawer component and its full content
- Create content dropdown menu items and handleCreateContent logic
- Right rail logic (showRightRail, rightRailCollapsed, CaretLeft/Right buttons)
- All DS tokens on existing preserved elements
- modeTokens import and usage

---

## CONTENT AREA — ZERO PADDING VERIFICATION

The content area wrapper must be:
  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
    {children}
  </div>

No px-*, no py-*, no mx-* on this wrapper. Views own 100% of their internal spacing.

---

## BEFORE / AFTER PIXEL COUNT

Layer            | Before  | After
Global topbar    | 44px    | 44px
Header block     | ~72px   | eliminated
Tab row          | ~44px   | merged into unified bar
ImpactStrip row  | ~30px   | merged into unified bar
Unified bar      | —       | 48px
TOTAL            | ~190px  | ~92px
Viewport for data| 76%     | 88%

---

## DS COMPLIANCE

- Zero phantom hex values
- bg-slate-1 for bar background (not raw hex, not bg-slate-0)
- border-border-subtle for bar bottom border
- text-brand-iris for Content pillar accent elements
- All text-[11px] must have font-bold uppercase tracking-wider
- Mode tokens from existing modeTokens — no new color values introduced

---

## ACCEPTANCE CRITERIA

- [ ] ~92px total from viewport top to first data pixel (measure it)
- [ ] No h1 anywhere in the shell
- [ ] No subtitle anywhere in the shell  
- [ ] No large icon box anywhere in the shell
- [ ] Surface title is text-sm (never text-xl, never text-2xl)
- [ ] Single 48px bar contains: icon, title, divider, tabs, spacer, SAGE, EVI, mode, explain, create
- [ ] Mode dropdown opens leftward (right-0 positioning)
- [ ] Mode dropdown has z-[200]
- [ ] Mode dropdown does not clip at viewport right edge
- [ ] onModeChange prop exists on shell and fires when mode selected
- [ ] ImpactStrip component NOT rendered anywhere in shell JSX
- [ ] Content area wrapper has zero padding
- [ ] Explain button is icon-only (no text label)
- [ ] Create button is in right cluster, adjacent to mode switcher
- [ ] All Autopilot tab logic preserved
- [ ] ExplainDrawer still opens correctly
- [ ] TypeScript compiles clean, zero errors
- [ ] DS compliance passes (run checklist)
- [ ] ONLY ContentWorkSurfaceShell.tsx modified — no other files

---

## WHEN DONE

Confirm:
1. Exact pixel measurement: how many px from viewport top to first data pixel
2. Every acceptance criterion checked with pass/fail
3. DS violations flagged if any exist
4. Confirmation that no other files were modified
