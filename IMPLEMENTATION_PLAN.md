# PRAVADO v2 — IMPLEMENTATION PLAN
**Version:** 1.0  
**Owner:** Christian  
**Authored:** 2026-02-19  
**Status:** ACTIVE — Use this as the session primer for all Claude Code sprints  

> This document supersedes all prior sprint planning. It reflects the true current build state and defines the complete path to GA. Every sprint has explicit acceptance criteria. Claude Code must not begin any task without reading the relevant canon contracts listed per sprint.

---

## GUIDING PRINCIPLES (Read Before Every Sprint)

### 1. Three Products, One Shell
Manual, Copilot, and Autopilot are **three distinct UI environments** that share a navigation shell, DS tokens, Impact Strip, and ModeSwitcher. They are NOT one view with toggled badges. Each mode gets its own component tree with its own information hierarchy, primary actions, and rendered elements.

**The named failure modes to avoid (from `CONTENT_WORK_SURFACE_RECONSTRUCTION.md` §6.1):**
- Swiss Army Knife syndrome — single layout serving all three modes
- Mode decoration — badge changes but interface is identical
- Hybrid creep — Copilot view accumulates editing tools until it resembles Manual

### 2. Rip and Replace Is Allowed
Existing components that violate the three-product principle are to be replaced wholesale — not patched. If a component is a Swiss Army Knife, delete it and build three focused replacements. The canon contracts define what to build. The design skill defines how it should look. Neither constrains architectural decisions about how to structure components.

### 3. Canon Is the Spec
Before writing a single line of UI code, Claude Code must read the canon contracts listed for that sprint. The contracts define frozen behavior. The design skill defines visual expression. Everything else is implementation judgment.

**Mandatory reading before ANY UI work:**
1. `docs/skills/PRAVADO_DESIGN_SKILL.md` — DS token reference + component patterns
2. `docs/canon/DS_v3_COMPLIANCE_CHECKLIST.md` — banned tokens + pre-commit checklist

### 4. Mock Data Is Fine for Now
Unless a sprint explicitly says "wire real data," use realistic mock data. The UI must be convincing and complete. Real API wiring is a separate pass after surfaces are visually solid.

### 5. Build Order Rationale
Command Center → PR → Content → SEO → Calendar → Analytics  
Rationale: CC is the hub users land on, so it sets the quality bar. PR is mostly built and needs least work. Content is the most complex build. SEO is a full build from scratch. Calendar and Analytics come last because they have no data dependencies from other surfaces.

---

## CURRENT STATE SNAPSHOT

| Surface | Route | State | Mode Trees |
|---------|-------|-------|-----------|
| Command Center | `/app/command-center` | Built, needs second pass | Single layout (wrong) |
| PR Work Surface | `/app/pr` | Built, needs UI polish | Partial |
| Content Work Surface | `/app/content` | Shell exists, major rebuild needed | Swiss Army Knife (wrong) |
| SEO / AEO | `/app/seo` | Stub only | Not built |
| Orchestration Calendar | `/app/calendar` | Not built | Not built |
| Analytics | `/app/analytics` | Stub only | Not built — spec needed first |
| Onboarding | `/app/onboarding/ai-intro` | Exists, tabled | — |

---

## SPRINT 1 — COMMAND CENTER SECOND PASS
**Estimated scope:** Large  
**Canon contracts required:**
- `docs/canon/COMMAND_CENTER_CONTRACT.md`
- `docs/canon/COMMAND_CENTER_GOLDEN_FLOW.md`
- `docs/canon/MODE_UX_ARCHITECTURE.md` (§5C)
- `docs/audit/COMMAND_CENTER_AUDIT_2026-02.md` (gap list)
- `docs/skills/PRAVADO_DESIGN_SKILL.md`

### Context
The Command Center is the first thing users see. It currently renders a mobile tab layout (Action / Intelligence / Strategy tabs) even at 1440px desktop width. The tri-pane is not rendering. This is the most critical visual bug in the product.

The surface also has 17 documented gaps from the audit: 6 critical DS token violations, missing Impact Strip, incomplete mode badges, Strategy Panel width deviation, and unverified components.

### 1.1 Fix Desktop Tri-Pane Layout (P0)
**Problem:** At 1440px, the tri-pane renders mobile tab navigation instead of the three-column layout.  
**File:** `apps/dashboard/src/app/app/command-center/TriPaneShell.tsx`  

**Contract spec:**
- Left pane (Action Stream): `flex-1` — fills remaining space
- Center pane (Intelligence Canvas): fixed `w-[480px]` at `lg:` breakpoint
- Right pane (Strategy Panel): fixed `w-[320px]` at `lg:` breakpoint (currently `w-[300px] xl:w-[340px]` — wrong)
- All three panes render side-by-side at `lg:` (1024px+), never stacked
- Mobile tab navigation only renders below `lg:`

**Acceptance criteria:**
- [ ] At 1440px: three panes visible side by side
- [ ] At 1280px: three panes visible side by side  
- [ ] At 1023px: tab navigation renders (mobile)
- [ ] Strategy Panel width is exactly `w-[320px]` at all desktop breakpoints
- [ ] `text-white` on pane headers replaced with `text-white/90`

### 1.2 DS Token Cleanup (P1)
All phantom hex values and banned tokens must be eliminated. Execute in one commit using the audit gap list as the exact fix guide.

**Files and fixes (from `COMMAND_CENTER_AUDIT_2026-02.md`):**

`pillar-accents.ts`:
- Delete `surfaceTokens` object entirely (GAP-001, GAP-015, GAP-016, GAP-017)
- Find all consumers of `surfaceTokens.*` in the codebase and replace with DS Tailwind classes
- Fix `modeStyles.manual.bg: 'bg-white/20/50'` → `'bg-white/5'` (GAP-002)

`ActionStreamPane.tsx`:
- `bg-[#0D0D12]` → `bg-slate-1`
- `bg-[#0A0A0F]` → `bg-page`
- `bg-[#1A1A24]` → `bg-slate-3`
- `border-[#1A1A24]` → `border-border-subtle`
- `bg-semantic-danger/8` → `bg-semantic-danger/10`
- `bg-semantic-warning/8` → `bg-semantic-warning/10`
- `bg-brand-cyan/8` → `bg-brand-cyan/10`

`StrategyPanelPane.tsx`:
- Same phantom hex replacements as ActionStreamPane
- Same `/8` → `/10` fixes on semantic/brand backgrounds

`ActionCard.tsx`:
- `border-[#2A2A36]` → `border-slate-5` (GAP-005)
- `border-brand-cyan/25` → `border-brand-cyan/30` (GAP-012)

**Acceptance criteria:**
- [ ] Zero results for `grep -r 'bg-\[#\|border-\[#' src/components/command-center/`
- [ ] Zero results for `grep -r 'surfaceTokens' src/`
- [ ] Zero results for `grep -r '/8"' src/components/command-center/` (semantic bg opacity)
- [ ] Build passes

### 1.3 Mode Badges — All Three Modes (P1)
**File:** `apps/dashboard/src/components/command-center/ActionCard.tsx`

Replace single autopilot-only badge with all three mode badges:

```tsx
// Correct implementation — all three modes
<span className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
  action.mode === 'autopilot' 
    ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
    : action.mode === 'copilot'
    ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30'
    : 'bg-white/5 text-white/70 border-white/20'
}`}>
  {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
</span>
```

**Acceptance criteria:**
- [ ] Manual actions show neutral badge
- [ ] Copilot actions show iris badge
- [ ] Autopilot actions show cyan badge
- [ ] All badges use `text-[11px] font-bold uppercase tracking-wider`

### 1.4 Impact Strip — Build and Wire (P1)
The Impact Strip is required on every work surface per `MODE_UX_ARCHITECTURE.md` §6A. It is currently absent from the Command Center.

**Build new component:** `apps/dashboard/src/components/shared/ImpactStrip.tsx`

```
IMPACT STRIP ANATOMY:
┌─────────────────────────────────────────────────────────────────────┐
│  ✦ [SAGE tag text]          EVI 67.4 ↑4.1    [Copilot ▾]  [Explain]│
└─────────────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface ImpactStripProps {
  sageTag: string;           // SAGE strategic priority text
  eviScore: number | null;   // Current EVI score
  eviDelta: number | null;   // 7-day delta
  pillar: 'command-center' | 'pr' | 'content' | 'seo';
  // ModeSwitcher is embedded — reads from pillar mode config
}
```

**Design tokens:**
- Container: `bg-slate-2 border-b border-border-subtle px-6 py-2`
- SAGE tag: `text-[13px] text-white/70` with `✦` prefix in `text-brand-iris`
- EVI score: `text-[13px] font-semibold text-white/90`
- EVI delta: positive = `text-semantic-success`, negative = `text-semantic-danger`
- ModeSwitcher embedded right side

**Wire into Command Center:** Place between page header and `<TriPaneShell>` in `page.tsx`

**Acceptance criteria:**
- [ ] ImpactStrip renders above tri-pane on Command Center
- [ ] SAGE tag visible with `✦` prefix
- [ ] EVI score + delta displayed
- [ ] Mode badge visible and matches pillar mode
- [ ] Component is reusable (will be used on PR, Content, SEO surfaces)

### 1.5 Spot-Check Unread Components (P2)
These components were not read during the audit. Verify DS compliance before closing Sprint 1.

**Files to spot-check:**
- `CalendarPeek.tsx` — verify `h-[280px]` container (contract invariant)
- `EntityMap.tsx` — verify zone layout, no-navigation on entity click
- `ActionModal.tsx` — verify DS tokens
- `ActionHoverBrief.tsx` — verify DS tokens
- `IntelligenceCanvasPane.tsx` — verify DS tokens

**Method:** Read each file, grep for phantom hex + bare `text-white` + sub-13px typography. Fix any violations found using the same token map from Sprint 1.2.

**Acceptance criteria:**
- [ ] All five files confirmed DS v3.1 compliant
- [ ] CalendarPeek container confirmed `h-[280px]`
- [ ] EntityMap click behavior confirmed non-navigating

### 1.6 Upgrade Hook Decision (P3)
The `UpgradeHookCard` in `StrategyPanelPane.tsx` contains a button — potentially violating the Strategy Panel "no action buttons" contract invariant. This requires a product decision before closing Sprint 1.

**Resolution options:**
- A) Accept as-is — upgrade hook navigation is not a "work action" and is exempt. Log in `DECISIONS_LOG.md`.
- B) Move upgrade hooks to a modal/drawer triggered from outside the Strategy Panel.

**Acceptance criteria:**
- [ ] Decision documented in `DECISIONS_LOG.md` with rationale
- [ ] Implementation matches decision

---

## SPRINT 2 — PR WORK SURFACE SECOND PASS
**Estimated scope:** Medium  
**Canon contracts required:**
- `docs/canon/PR_WORK_SURFACE_CONTRACT.md`
- `docs/canon/PR_INBOX_CONTRACT.md`
- `docs/canon/PR_PITCH_PIPELINE_CONTRACT.md`
- `docs/canon/PR_CONTACT_LEDGER_CONTRACT.md`
- `docs/canon/MODE_UX_ARCHITECTURE.md` (§5D)
- `docs/audit/PR_WORK_SURFACE_AUDIT_2026-02.md` (47-gap list)
- `docs/skills/PRAVADO_DESIGN_SKILL.md`

### Context
PR is the most complete work surface. DS compliance has been addressed in a prior pass. The remaining work is two things: (1) fix the P0 contract violation and P1 forbidden tokens from the audit, and (2) apply the ImpactStrip built in Sprint 1, and (3) evaluate whether the three-mode product principle is implemented correctly or if the surface is a Swiss Army Knife.

### 2.1 Fix P0 Contract Violation
**File:** `apps/dashboard/src/components/pr-work-surface/views/PRSettings.tsx`

```tsx
// Fix follow-up limit — must match PR_PITCH_PIPELINE_CONTRACT V1.1 §4.2
// DEFAULT_GUARDRAILS
followUpLimitPerWeek: 2,  // was: 3

// RangeSlider max
max={2}  // was: max={5}
```

**Acceptance criteria:**
- [ ] Default follow-up limit is 2, not 3
- [ ] Slider maximum is 2, not 5

### 2.2 Fix P1 Forbidden Tokens
**File:** `apps/dashboard/src/components/pr-work-surface/components/ContactFormModal.tsx`

Replace all `text-red-400` (4 instances on error message paragraphs) → `text-semantic-danger`

**Run verification after:**
```bash
grep -r 'text-red-400\|semantic-error' src/components/pr-work-surface/ --include="*.tsx"
# Must return zero results
```

**Acceptance criteria:**
- [ ] Zero `text-red-400` in PR components
- [ ] Zero `semantic-error` in PR components

### 2.3 Mode Architecture Audit — Three Products Check
**Action:** Read the following PR surface files and answer: Does mode change produce a fundamentally different UI, or just badge changes?

Files to read:
- The main PR page component
- Whatever view is shown in each mode

**If Swiss Army Knife pattern is found:**
- Identify which sections should be conditionally rendered per mode
- Apply the mode layout contract from `MODE_UX_ARCHITECTURE.md` §5D:
  - Manual: full outreach queue, manual sort, draft composer immediately accessible, no AI proposal banner
  - Copilot: AI-sorted queue, SAGE reasoning chips, approve/reject on each item, draft composer accessible after approval
  - Autopilot: exception-only queue, execution log, journalist intelligence always visible, escalations only

**Acceptance criteria:**
- [ ] Mode change produces visually and functionally distinct UI environments
- [ ] Manual mode: no SAGE proposal banner, direct action CTAs
- [ ] Copilot mode: SAGE banner, AI reasoning chips, approve/reject affordances
- [ ] Autopilot mode: exception queue only, execution log visible
- [ ] Mode change does not produce instant layout swap — re-evaluation state shown (AI dot animating)

### 2.4 Wire ImpactStrip
Use the shared `ImpactStrip` component built in Sprint 1. Wire into the PR work surface header.

**PR pillar color:** `text-brand-pr` (check `pillar-accents.ts` for the PR accent — it is NOT cyan or iris)

**Acceptance criteria:**
- [ ] ImpactStrip renders on PR surface
- [ ] Pillar color is correct for PR
- [ ] SAGE tag, EVI, and mode badge all display

### 2.5 P2 Typography Pass
The audit identified a typography floor epidemic across all PR views — sub-13px semantic content. These were identified but may not have been fixed in prior passes.

**Run verification:**
```bash
grep -r 'text-\[7px\]\|text-\[8px\]\|text-\[9px\]\|text-\[10px\]\|text-\[11px\]\|text-\[12px\]' \
  src/components/pr-work-surface/ --include="*.tsx"
```

Any `text-[7px]`, `text-[8px]`, `text-[9px]` = violation → raise to `text-[10px]` minimum  
Any `text-[10px]` not paired with `uppercase tracking-wider` = violation → raise to `text-xs`  
Any `text-[11px]` not paired with `font-bold uppercase tracking-wider` = violation → raise to `text-xs`  
`text-[12px]` = same as `text-xs`, acceptable  

**Acceptance criteria:**
- [ ] Zero `text-[7px]`, `text-[8px]`, `text-[9px]` in PR components
- [ ] All `text-[10px]` instances paired with `uppercase tracking-wider`
- [ ] Build passes

---

## SPRINT 3 — CONTENT WORK SURFACE REBUILD
**Estimated scope:** Very Large (largest sprint in the plan)  
**Canon contracts required:**
- `docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md`
- `docs/canon/work/WORK_SURFACE_CONTRACT.md`
- `docs/canon/work/CONTENT_WORK_SURFACE_RECONSTRUCTION.md`
- `docs/canon/MODE_UX_ARCHITECTURE.md` (§5B — full mode layout contracts)
- `docs/canon/CITEMIND_SYSTEM.md` (for CiteMind gate behavior)
- `docs/skills/PRAVADO_DESIGN_SKILL.md`

### Context
The Content surface is the most complex build. Components exist but were built as a Swiss Army Knife — one view trying to serve all three modes, causing the canon confusion that derailed Claude Code previously.

The rebuild approach: **delete the view-level component that tries to serve all modes and build three separate view trees.** Keep low-level components (editor, card primitives, etc.) that are mode-agnostic. Replace the orchestration layer.

### 3.0 Pre-Sprint: Verify DS Fixes
Before building anything, verify the DS v3.1 fixes from the prior audit pass were applied.

```bash
cd apps/dashboard
grep -r 'bg-\[#' src/components/content/ --include="*.tsx"
grep -r 'border-\[#' src/components/content/ --include="*.tsx"
grep -r 'text-\[7px\]\|text-\[8px\]\|text-\[9px\]' src/components/content/ --include="*.tsx"
```

If any results: apply fixes from `SESSION_PRIMER.md` Section 4.3 before proceeding.

### 3.1 Three-Mode Architecture — Build Separate View Trees

**Current structure (wrong):**
```
ContentWorkSurfaceShell
  └── ContentWorkQueueView (tries to serve all modes)
```

**Target structure (correct):**
```
ContentWorkSurfaceShell
  ├── reads: currentMode from pillar config
  └── renders one of:
      ├── ManualModeView       (full queue, direct manipulation, editor dominant)
      ├── CopilotModeView      (SAGE proposal banner, AI-sorted queue, approve/reject)
      └── AutopilotModeView    (exception queue, activity log, all-clear state)
```

**ManualModeView** — "I Am Creating"
Per `CONTENT_WORK_SURFACE_RECONSTRUCTION.md` §2.1 and `MODE_UX_ARCHITECTURE.md` §5B:
- Full work queue visible, user-controlled order (drag-to-reorder enabled)
- No SAGE proposal banner
- No AI reasoning chips
- No approve/reject affordances
- Create button prominent in header
- Editor accessible immediately on item click
- Focus state: editor dominates (≥70% of center workspace), context rail collapses
- Action bar pinned — never scrolls (`shrink-0`)
- Right context rail: collapsed by default, expands only on CiteMind hard blocker

**CopilotModeView** — "I Am Reviewing AI Work"
Per `CONTENT_WORK_SURFACE_RECONSTRUCTION.md` §2.2 and `MODE_UX_ARCHITECTURE.md` §5B:
- SAGE proposal banner at top: "SAGE identified N priority actions — [Review Plan]"
- Queue is AI-sorted by priority (not user-controlled — drag-to-reorder hidden)
- Each queue item shows: SAGE reasoning chip + confidence indicator + [Approve] [Reject]
- Editor is read-only preview by default; editing requires explicit "Modify" action
- Create button secondary (not primary focus — reviewing is the primary activity)
- AI reasoning must be visible inline, not behind a click

**AutopilotModeView** — "I Am Supervising Automation"
Per `CONTENT_WORK_SURFACE_RECONSTRUCTION.md` §2.3 and `MODE_UX_ARCHITECTURE.md` §5B:
- Exception queue ONLY — routine items hidden
- "All clear — N items executing" empty state is the SUCCESS state, not an error
- Activity panel: execution log, completed/in-progress/queued, guardrail violations highlighted
- Kill switch accessible
- Tabs change: "Content" → "Exceptions", new "Activity Log" tab
- Full work queue NOT shown
- Create button: secondary, not prominent
- Publishing NEVER executes automatically (Content V1 hardcoded ceiling = Manual for publish)

**Acceptance criteria:**
- [ ] Mode switch renders a visually and functionally distinct UI (three products)
- [ ] ManualModeView: drag-to-reorder visible, no AI banners, editor immediately accessible
- [ ] CopilotModeView: SAGE banner at top, AI reasoning chips inline, no drag handles
- [ ] AutopilotModeView: exception queue only, all-clear state present, kill switch visible
- [ ] Mode re-evaluation shown (AI dot animating) on mode change, not instant swap
- [ ] Publishing never executes in Copilot or Autopilot without explicit Manual approval step

### 3.2 Impact Strip — Wire to Content Surface
Use the shared `ImpactStrip` component from Sprint 1. Content pillar color is `brand-iris`.

**Acceptance criteria:**
- [ ] ImpactStrip renders on Content surface with iris accent
- [ ] SAGE tag, EVI, mode badge all display correctly

### 3.3 Brief Editor Page — Build
**File to create:** `apps/dashboard/src/app/app/content/brief/[id]/page.tsx`

This page is specified in `CONTENT_WORK_SURFACE_CONTRACT.md` but was never built.

**Structure:**
- Uses `ContentWorkSurfaceShell` wrapper
- Brief-specific view with structured brief fields (NOT freeform TipTap)
- Fields: Goal, Target Audience, Topic/Angle, Key Points, SEO Keywords, AEO Score target, Word Count target, Related Assets
- Save + Send to Writer CTAs
- CiteMind AEO pre-check shown as advisory (score + gaps) before sending

**Acceptance criteria:**
- [ ] Route `/app/content/brief/[id]` renders without error
- [ ] Brief fields present and editable
- [ ] CiteMind advisory AEO score visible
- [ ] Save CTA functional (saves to mock data)

### 3.4 CiteMind Gate — Enforce Publish Block
Per `CONTENT_WORK_SURFACE_CONTRACT.md` and `SEO_AEO_PILLAR_CANON.md` §3E:

When a content item is ready to publish and its AEO Score < 41:
- Block publish with explanation: "This content is unlikely to be cited by AI systems."
- Show [View Gaps] and [Publish Anyway — bypass] options
- Bypass is always permitted but must be shown

**Acceptance criteria:**
- [ ] Publish button triggers CiteMind check (mock AEO score returned)
- [ ] Score < 41: block message shown with view gaps + bypass options
- [ ] Score ≥ 41: publish proceeds with score displayed
- [ ] Bypass works — below-threshold content can still publish

### 3.5 DS Verification Pass
After all Content changes:

```bash
grep -r 'bg-\[#\|border-\[#' src/components/content/ --include="*.tsx"
grep -r 'text-\[7px\]\|text-\[8px\]\|text-\[9px\]' src/components/content/ --include="*.tsx"
grep -r 'text-white"' src/components/content/ --include="*.tsx"
```

All must return zero results.

---

## SPRINT 4 — SEO / AEO WORK SURFACE — FULL BUILD
**Estimated scope:** Very Large  
**Canon contracts required:**
- `docs/canon/SEO_AEO_PILLAR_CANON.md` (all sections, especially §6 and §6.5)
- `docs/canon/SEO_AEO_CONTINUITY_ADDENDUM.md` (invariants — forbidden patterns)
- `docs/canon/MODE_UX_ARCHITECTURE.md` (§5 — mode governance)
- `docs/canon/CITEMIND_SYSTEM.md` (Engine 1, 2, 3)
- `docs/skills/PRAVADO_DESIGN_SKILL.md`

### Context
The SEO surface is a stub. This is a full build from scratch — the largest greenfield sprint. The three-mode architecture is defined in `SEO_AEO_PILLAR_CANON.md` §6.5. Build three separate view trees from day one. No Swiss Army Knife.

**Pillar color:** `brand-cyan` (`#00D9FF`) — all SEO accents use cyan

### 4.1 Surface Shell and Routing
**File:** `apps/dashboard/src/app/app/seo/page.tsx` (replace existing stub)  
**Components dir:** `apps/dashboard/src/components/seo/`

Shell structure:
```
SEOWorkSurfaceShell
  ├── ImpactStrip (cyan accent, SAGE tag + EVI + mode badge)
  ├── reads: currentMode from pillar config
  └── renders one of:
      ├── SEOManualView
      ├── SEOCopilotView
      └── SEOAutopilotView
```

### 4.2 SEOManualView — Build
Per `SEO_AEO_PILLAR_CANON.md` §6.5 Manual Mode spec:

**Tabs:** Overview · AEO · Technical · Intelligence

**Overview tab:**
- Share of Model as primary metric (top of page)
- Topic cluster selector dropdown
- Competitive bar chart (brand vs. named competitors)
- Three Layer Health cards (SEO Health / AEO Readiness / Share of Model) — each links to its tab
- Action Queue: severity-sorted findings, each with AEO bridge impact and direct action CTA
- No SAGE proposal banner
- No AI reasoning chips
- User-controlled sort and filter on Action Queue

**AEO tab:**
- Full asset table, user-sorted
- Columns: Asset URL · AEO Score (0–100 with band color) · Schema status · Entity status · Cited By (AI surfaces) · Actions
- Direct action buttons per row: [Fix Schema] [Improve Entity] [Generate Brief] — no approval step
- Pre-publish queue section: drafts awaiting AEO check with scores + bypass option
- Citation Activity feed: Engine 3 data, read-only

**Technical tab:**
- Full findings list, severity-sorted
- Each finding: category badge · severity · description · **AEO bridge impact** (required — see §2C bridge table)
- Direct fix affordances — user initiates, no approval step
- High-AEO-impact findings visually elevated (cyan left border or similar)

**Intelligence tab:**
- Competitor Share of Model comparison
- Narrative drift detection
- Engine 3 citation feed with context + sentiment
- Topic cluster health map

**Acceptance criteria:**
- [ ] All 4 tabs render with mock data
- [ ] AEO Score formula displayed correctly (Entity Clarity 30% + Schema 25% + Semantic Depth 25% + Authority 20%)
- [ ] Score bands displayed: 0–40 red / 41–60 amber / 61–80 green / 81–100 cyan
- [ ] Every Technical finding shows its AEO bridge impact
- [ ] Layer Health cards link to correct tabs
- [ ] No AI proposal banner, no approve/reject affordances
- [ ] Direct action CTAs execute without approval step

### 4.3 SEOCopilotView — Build
Per `SEO_AEO_PILLAR_CANON.md` §6.5 Copilot Mode spec:

**Tabs:** Overview · AEO · Technical · Intelligence (same 4, different content)

**Overview tab:**
- SAGE proposal banner at top: "✦ SAGE identified N priority actions — Est. impact: +X AEO pts · +Y% SoM — [Review Plan]"
- Share of Model (same visualization)
- Three Layer Health cards (same)
- SAGE Priority Queue (replaces Action Queue): AI-sorted by impact, each item has SAGE reasoning chip + confidence + estimated AEO/EVI impact + [Approve] [Reject]
- Approved items enter AUTOMATE execution queue immediately
- Rejected items removed from queue (SAGE learns)

**AEO tab (Copilot):**
- AI-sorted asset table (highest improvement potential first)
- Each asset: SAGE reasoning chip ("Schema gap limiting citation rate") + confidence indicator
- Inline Approve/Reject on each proposed fix
- Schema injection proposals: approval required before live page modification
- Meta tag rewrites: approval required

**Technical tab (Copilot):**
- AI-prioritized findings (AEO-impact sorted, not severity)
- Each finding: issue + AEO bridge + "Let AI fix this [Approve]" vs "I'll handle this [Assign]"
- Approving queues action in AUTOMATE with audit trail

**Acceptance criteria:**
- [ ] SAGE proposal banner renders at top of Overview
- [ ] SAGE reasoning chips visible on every actionable item
- [ ] Confidence indicators present
- [ ] Approve/Reject affordances on all actionable items
- [ ] No direct-execute action buttons (everything requires approval)
- [ ] Approved actions show in execution queue / audit trail

### 4.4 SEOAutopilotView — Build
Per `SEO_AEO_PILLAR_CANON.md` §6.5 Autopilot Mode spec:

**Tabs:** Overview · Exceptions (AEO and Technical tabs hidden)

**Overview tab:**
- System status panel (dominant): running count + queue depth + next scheduled action + [View Activity Log] + [⏸ Pause All]
- Share of Model: simplified view (share + trend + competitor delta)
- Layer Health: status indicators only (not action surfaces) — clicking inspects execution log
- Recent Completions: last 5 executed actions with impact deltas
- Pause All / kill switch in header

**Exceptions tab:**
- Exception list: each shows what AUTOMATE tried, why it stopped, what user must decide + [Approve] [Reject] [Escalate]
- All-clear empty state: "✓ All clear — N items executing autonomously · [View Activity Log]"
- All-clear IS the success state

**Acceptance criteria:**
- [ ] Tab set collapses to Overview + Exceptions only
- [ ] System status panel dominates top of Overview
- [ ] All-clear state renders when no exceptions (not an error state)
- [ ] Kill switch visible and accessible
- [ ] AEO and Technical tabs not in primary nav (accessible via "View all" escape hatch only)

### 4.5 Pre-Publish AEO Gate
Wire the advisory gate into the pre-publish flow (connects to Content pillar publish action):

```
Content publish triggered → AEO Score check → 
  Score ≥ 41: allow publish, show score
  Score < 41: show gate modal with score + gaps + [View Gaps] + [Publish Anyway]
```

Mock AEO score calculation using the formula from §3C. Real CiteMind Engine 1 wiring is a future sprint.

**Acceptance criteria:**
- [ ] Publish flow triggers AEO check
- [ ] Gate modal renders with score, band indicator, gaps list
- [ ] View Gaps links to AEO tab
- [ ] Publish Anyway bypasses gate
- [ ] Score ≥ 41 allows publish without gate

### 4.6 SEO Invariants Check (from `SEO_AEO_CONTINUITY_ADDENDUM.md`)
Before closing Sprint 4, verify all invariants from the continuity addendum are satisfied. Read the addendum and checklist against the built surface.

**Acceptance criteria:**
- [ ] No blank-page-first entry points
- [ ] All metrics bind to executable actions
- [ ] Three-layer architecture visible to user
- [ ] Cross-pillar: significant SEO events will be visible in CC Action Stream (wire mock trigger)

---

## SPRINT 5 — ORCHESTRATION CALENDAR V1
**Estimated scope:** Medium  
**Canon contracts required:**
- `docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md` (frozen V1 contract)
- `docs/skills/PRAVADO_DESIGN_SKILL.md`

### Context
The Calendar answers one question: "When will the system act, and when do I need to intervene?" It is not a task planner, not a content calendar, not a scheduling tool. It is AUTOMATE's execution timeline made visible.

The `CalendarPeek` component in the Command Center is the embedded preview. This sprint builds the full `/app/calendar` surface.

### 5.1 Full Calendar Surface
**File:** `apps/dashboard/src/app/app/calendar/page.tsx`  
**Components:** `apps/dashboard/src/components/calendar/`

The Calendar is mode-agnostic at the surface level — it shows AUTOMATE's timeline regardless of mode. Mode is shown on individual items via their `mode` field.

**View modes:** Day · Week · Month (all within fixed container `h-[280px]` per contract)

**Wait — the full Calendar surface is NOT fixed `h-[280px]`.** The `h-[280px]` constraint is ONLY for `CalendarPeek` embedded in the Command Center. The full `/app/calendar` page uses available viewport height.

**Item display per contract (`ORCHESTRATION_CALENDAR_CONTRACT.md` §4):**

Every item requires:
- `id`, `date`, `time`, `pillar`, `title`, `status`, `mode`
- `details.summary`, `details.owner`, `details.risk`, `details.estimated_duration`, `details.dependencies`

**Status visual indicators (§5.1):**
- `planned` — circle outline
- `drafting` — pulsing dot (AI active)
- `awaiting_approval` — amber badge (user action required)
- `scheduled` — solid dot
- `published` — check mark
- `failed` — red X

**Mode badges on items (§6.1):**
- `manual` — outline, neutral
- `copilot` — solid, pillar-tinted
- `autopilot` — solid, cyan glow

**Risk indicators (§7.1):**
- `low` — no indicator
- `med` — amber dot
- `high` — red dot

**Interaction contract (FROZEN §10.1):**
- Calendar item click → Action Modal (NOT navigation, NOT drawer)
- Day cell click → select date, update agenda
- No drag-and-drop
- No inline editing
- No create from calendar

**Action Modal (§11):**
Content: title + pillar badge + mode badge + summary + metadata + dependencies + status-appropriate actions
- `awaiting_approval`: [Approve] [Reject] [Request Changes]
- `scheduled`: [Pause] [Cancel]
- `published`: [View Details only]
- `failed`: [Retry] [Abandon] [Investigate]

### 5.2 Day View
- Large single-day header with prev/next arrows
- Hourly agenda groups: Early Morning / Morning / Midday / Afternoon / Evening
- Full item cards with all badges
- Vertical scroll within container

### 5.3 Week View
- 7-day horizontal strip, selectable days
- Clicking a day updates the agenda list below
- Pillar dots on days with scheduled items

### 5.4 Month View
- 6-row calendar grid
- Day cells show pillar dot indicators (not full items)
- Desktop split view: calendar left, agenda right
- Mobile: "Calendar | Agenda" segmented tabs

**Acceptance criteria:**
- [ ] All three view modes render
- [ ] Item click opens Action Modal (not navigation, not drawer)
- [ ] All 6 status states render correctly
- [ ] All 3 mode badges render on items
- [ ] Risk indicators render correctly
- [ ] No drag-and-drop, no inline editing, no create from calendar
- [ ] Action Modal shows correct actions per item status
- [ ] `CalendarPeek` in Command Center still works and links to this surface via [View Full Calendar]

---

## SPRINT 6 — ANALYTICS V1 (REQUIRES SPEC FIRST)
**Estimated scope:** Medium (after spec is written)

### 6.0 Pre-Sprint Prerequisite — Write Analytics Spec
**This must happen before any code is written.** There is no canon doc for Analytics.

Minimum spec to write before Sprint 6 begins:
- What is the primary question Analytics answers?
- What is the minimum viable V1 content? (EVI over time, pillar breakdowns, Share of Model trend, coverage timeline)
- What does the surface look like? (single tab vs. multi-tab)
- Is Analytics mode-aware? (probably read-only, mode-agnostic)
- What data does it need? (EVI time series, Share of Model snapshots, citation counts)

**File to create:** `docs/canon/ANALYTICS_CONTRACT.md`

Once written, Sprint 6 proceeds against that contract.

### 6.1 EVI Dashboard (Minimum V1)
The minimum viable Analytics surface is an EVI health dashboard:

- EVI over time (30d / 90d / 12m sparkline or chart)
- Driver breakdown: Visibility / Authority / Momentum with delta
- Share of Model trend by topic cluster
- Coverage timeline (PR coverage events correlated with EVI changes)
- Top movers (what drove EVI up or down this period)

This matches the Strategy Panel data in the Command Center but with full historical context and drill-down.

**Acceptance criteria:**
- [ ] `ANALYTICS_CONTRACT.md` written and in canon before code begins
- [ ] Route `/app/analytics` renders without error
- [ ] EVI over time chart displays with mock data
- [ ] Driver breakdown shows Visibility / Authority / Momentum
- [ ] Share of Model trend visible
- [ ] Surface is read-only (no mode switcher needed — Analytics is observational)

---

## SPRINT 7 — CROSS-SURFACE POLISH AND INTEGRATION
**Estimated scope:** Medium  
**This sprint has no new features. It's integration, consistency, and the things that make it feel like one product.**

### 7.1 Navigation — Confirm All Routes Wire Correctly
- `/app` → redirects to `/app/command-center`
- Legacy `/app/dashboard` → redirects to `/app/command-center`
- All 7 surface routes return 200
- Side nav highlights active surface correctly

### 7.2 Cross-Pillar Events
Actions in one surface should surface in others where relevant. Implement mock cross-pillar event wiring:

- Significant SEO event → appears in CC Action Stream
- PR coverage event → appears in CC Intelligence Canvas live feed
- Content publish → triggers AEO score update visible in SEO surface
- Share of Model delta → SAGE generates action in CC Action Stream

This connects the product narrative. Without it, the pillars feel isolated.

### 7.3 Command Center — Action Cards for All Surfaces
The CC Action Stream shows action cards from all three pillars. Verify:
- PR actions route correctly to PR surface when actioned
- Content actions route correctly to Content surface
- SEO actions route correctly to SEO surface
- Pillar color on each action card matches the pillar (PR / Content = iris / SEO = cyan)

### 7.4 ModeSwitcher — Full Policy Enforcement
Implement the floor/ceiling policy model from `MODE_UX_ARCHITECTURE.md` §2:

- Admin-locked mode shows lock icon, non-interactive
- Mode change triggers re-evaluation state (AI dot animating) — not instant swap
- Mode change from active Autopilot shows confirmation dialog ("AI is currently executing N actions. Continue?")
- Mode preference persists per pillar (local storage for now)

### 7.5 Final DS Verification — All Surfaces
Run the full compliance grep suite across all surfaces before declaring sprint complete:

```bash
cd apps/dashboard
grep -r 'bg-\[#' src/ --include="*.tsx"
grep -r 'border-\[#' src/ --include="*.tsx"
grep -r 'text-white"' src/ --include="*.tsx"  # bare text-white without opacity
grep -r 'text-\[7px\]\|text-\[8px\]\|text-\[9px\]' src/ --include="*.tsx"
grep -r 'panel-card\|text-slate-6\|text-muted\|text-white-0' src/ --include="*.tsx"
```

All must return zero results.

---

## ONBOARDING — TABLED
Per `docs/product/ONBOARDING_REDESIGN_BRIEF.md`: **Do not build until explicitly unblocked.** The brief is written and complete. When unblocked, no additional planning session is needed — the brief is the spec.

---

## SESSION HANDOFF PROTOCOL

At the end of each Claude Code sprint session, update the following:

**1. `ARCHITECT_BRIEFING.md` — Session Handoff Notes section:**
```
Session YYYY-MM-DD:
- Sprint N completed tasks: [list]
- In progress: [list]  
- Blockers: [list]
- Next session: continue Sprint N at [specific task]
```

**2. `docs/PRAVADO_V2_STATUS.md` — Update the build state table**

**3. `docs/canon/DECISIONS_LOG.md` — Log any product decisions made during the sprint**

**4. `SESSION_PRIMER.md` — Update "Active Task" section to current sprint/task**

This handoff protocol ensures the next session starts exactly where the last one ended, with no re-discovery time.

---

## ACCEPTANCE CRITERIA — GA READINESS

The product is ready for GA when:

- [ ] Command Center: desktop tri-pane renders, ImpactStrip present, all mode badges correct, DS clean
- [ ] PR Work Surface: three mode trees, ImpactStrip, contract violation fixed, DS clean
- [ ] Content Work Surface: three mode trees, ImpactStrip, Brief Editor, CiteMind gate, DS clean
- [ ] SEO/AEO Work Surface: three mode trees, all 4 tabs (Manual/Copilot), Overview+Exceptions (Autopilot), pre-publish AEO gate
- [ ] Orchestration Calendar: Day/Week/Month views, Action Modal, all status states, correct click behavior
- [ ] Analytics: EVI dashboard with time series (after spec written)
- [ ] Cross-surface: pillar events visible across surfaces, navigation correct, mode persistence
- [ ] DS compliance: zero phantom hex, zero bare `text-white`, zero sub-12px body text, across all surfaces
- [ ] Build passes: `pnpm build` exits 0, no TypeScript errors, no ESLint errors

---

## APPENDIX — QUICK TOKEN REFERENCE

```
Slate scale (backgrounds):
bg-page / bg-slate-0   = #0A0A0F  (page background)
bg-slate-1             = #0D0D12  (elevated panel)
bg-slate-2             = #13131A  (card / panel surface)
bg-slate-3             = #16161E  (hover state)
bg-slate-4             = #1A1A24  (interactive element)
border-slate-4         = #1F1F28  (default border)
border-slate-5         = #2A2A36  (hover border)

Text:
text-white/90  = primary headings
text-white/70  = body text
text-white/50  = secondary / muted
text-white/40  = disabled / placeholder

Pillar accents:
brand-cyan    = #00D9FF  (SEO)
brand-iris    = #A855F7  (Content)
[PR accent: check pillar-accents.ts — not cyan or iris]

Semantic:
semantic-success = #22C55E
semantic-danger  = #EF4444
semantic-warning = #EAB308

Typography floor:
text-xs (12px)    = minimum for body text and interactive labels
text-[10px]       = allowed ONLY with uppercase + tracking-wider (decorative labels)
text-[11px]       = mode badges ONLY, with font-bold uppercase tracking-wider
text-[7-9px]      = ALWAYS a violation

Mode badge pattern:
text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border
```

---

*This plan is the single source of truth for build sequencing. When in doubt, follow canon. When canon conflicts, follow the authority chain in `CLAUDE.md`. When the canon is silent, make the simplest decision that doesn't contradict any canon, log it in `DECISIONS_LOG.md`, and proceed.*
