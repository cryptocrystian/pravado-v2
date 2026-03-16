# MODE UX ARCHITECTURE
**Version:** 1.0  
**Canon Status:** ACTIVE  
**Authority:** Extends `AUTOMATION_MODE_CONTRACTS_CANON.md` (behavioral semantics) and `AUTOMATION_MODES_UX.md` (UX patterns)  
**Scope:** Governance system, component implementation contracts, layout-switching logic, ModeSwitcher spec  
**Last Updated:** 2026-02-18

> This document does NOT redefine mode semantics — those are owned by `AUTOMATION_MODE_CONTRACTS_CANON.md`. This document defines **how modes are governed, implemented in components, and enforced across the UI**.

---

## 1. The Critical Misunderstanding to Prevent

**Modes are not badge swaps.**

The most common implementation failure is treating mode as a label that changes the header pill while leaving the rest of the UI identical. This is wrong and will produce a broken product.

Mode defines a fundamentally different **user mental model** and therefore a different **UI environment**:

| Mode | Mental Model | UI Environment |
|------|-------------|----------------|
| Manual | "I am in full control" | Dense professional tool — creation surfaces, full queue, direct manipulation, AI invisible unless asked |
| Copilot | "AI prepared this, I review and authorize" | Proposal-first — AI reasoning prominent, review/approve affordances dominant, creation surfaces secondary |
| Autopilot | "AI is working, show me only what needs me" | Monitoring surface — sparse, exception-focused, audit trail accessible, creation surfaces hidden |

These are **three different products** sharing the same navigation shell. They require conditionally rendered content, different information hierarchies, and different primary actions — not just different badge colors.

---

## 2. Governance Architecture

### 2A. The Policy Model

Mode is controlled at two levels:

```
┌─────────────────────────────────────────────┐
│  ORGANIZATION POLICY (Admin layer)          │
│  Sets: floor, ceiling per pillar            │
│  Who: Workspace admin / Enterprise admin    │
│  Persists: org-wide, overrides user prefs   │
├─────────────────────────────────────────────┤
│  USER PREFERENCE (within policy bounds)     │
│  Sets: current mode per pillar              │
│  Who: Any authenticated user                │
│  Persists: per-user, per-pillar             │
└─────────────────────────────────────────────┘
```

**Floor** = minimum allowed mode. Enterprise compliance use case. A PR floor of `manual` means users cannot enable Copilot or Autopilot for PR — all PR actions require direct human execution.

**Ceiling** = maximum allowed mode. Risk management use case. A Content ceiling of `copilot` means the system will never autonomously publish content regardless of user preference.

### 2B. Policy Enforcement Table

| Floor | Ceiling | Valid User Modes |
|-------|---------|----------------|
| `manual` | `manual` | Manual only |
| `manual` | `copilot` | Manual, Copilot |
| `manual` | `autopilot` | Manual, Copilot, Autopilot (full freedom) |
| `copilot` | `copilot` | Copilot only |
| `copilot` | `autopilot` | Copilot, Autopilot |
| `autopilot` | `autopilot` | Autopilot only |

**Rule:** Floor ≤ current mode ≤ Ceiling. If a user's saved preference violates the policy, clamp to the nearest valid mode.

### 2C. Content Pillar V1 Hardcoded Ceilings

Per `CONTENT_WORK_SURFACE_CONTRACT.md`, these are non-negotiable for V1:

| Action Type | Ceiling |
|-------------|---------|
| Publishing content | `manual` — Autopilot can NEVER publish |
| Draft creation | `copilot` — Autopilot can never draft without approval |
| Quality analysis (CiteMind) | `autopilot` — Safe to run autonomously |
| Derivative generation | `copilot` — Requires approval before generating |
| Brief creation | `copilot` |
| Scheduling | `copilot` |

These ceilings apply regardless of pillar-level mode setting. A user on Autopilot mode for Content will still be prompted to approve before publishing.

### 2D. Plan-Tier Defaults

| Plan | Default Mode | Min Mode | Max Mode |
|------|-------------|---------|---------|
| SMB / Starter | Autopilot | Manual | Autopilot |
| Mid-Market / Pro | Copilot | Manual | Autopilot |
| Enterprise | Manual | Configurable | Configurable |

Enterprise plan enables admin policy controls. Other plans have full mode freedom but different defaults.

---

## 3. Mode Data Model

The mode system requires the following data to be tracked and accessible:

```typescript
// Per-pillar mode preference (stored in user profile / org policy)
interface PillarModeConfig {
  pillar: 'pr' | 'content' | 'seo';
  currentMode: AutomationMode;       // User's active mode
  floor: AutomationMode;             // Admin minimum (default: 'manual')
  ceiling: AutomationMode;           // Admin maximum (default: 'autopilot')
  lockedByAdmin: boolean;            // True if floor === ceiling
}

type AutomationMode = 'manual' | 'copilot' | 'autopilot';

// Action-level ceiling (defined per action type, not pillar)
interface ActionModeCeiling {
  actionType: string;
  ceiling: AutomationMode;
  reason: string;                    // Displayed to user when blocked
}
```

---

## 4. ModeSwitcher Component Contract

The `ModeSwitcher` is the single component responsible for displaying and changing a pillar's mode. It must be present in every work surface header.

### 4A. Required Props

```typescript
interface ModeSwitcherProps {
  pillar: 'pr' | 'content' | 'seo';
  // Current mode — read from store/context, not local state
  // Ceiling for the current view (optional — overrides pillar ceiling if more restrictive)
  ceiling?: AutomationMode;
}
```

### 4B. Visual States

**When floor === ceiling (admin-locked):**
```
[🔒 Manual]   ← static badge, no click, tooltip: "Locked by admin policy"
```

**When multiple modes are available:**
```
[Manual ▾]   ← dropdown trigger showing current mode
```

On click, dropdown shows only modes between floor and ceiling:
```
┌─────────────────────────────────┐
│ ◉ Manual      Full control      │
│ ○ Copilot     AI assists        │
│ ○ Autopilot   AI executes       │
└─────────────────────────────────┘
```

Modes outside the floor–ceiling range are not shown (not grayed, not shown).

**When action ceiling is more restrictive than pillar mode:**  
Show a contextual indicator on the specific action, not on the ModeSwitcher. The ModeSwitcher always reflects the pillar-level mode.

### 4C. Mode Badge Colors

```
Manual:    bg-white/5  text-white/70  border-white/20    (neutral, no urgency)
Copilot:   bg-brand-iris/10  text-brand-iris  border-brand-iris/30
Autopilot: bg-brand-cyan/10  text-brand-cyan  border-brand-cyan/30
Locked:    (same as current mode) + lock icon prefix
```

### 4D. Mode Change Behavior

Mode change is NOT instant UI swap. It must:

1. Optimistically update the badge
2. Persist the preference (API call or local storage with sync)
3. Trigger re-evaluation of the queue/view with `evaluating` AI state
4. After evaluation resolves, re-render the mode-appropriate layout
5. Show a brief transition indicator (AI dot animating during recalculation)

**Do NOT:** Instantly swap between Manual dense layout and Autopilot sparse layout with no transition. The recalculation step is real latency — show it.

---

## 5. Mode-Aware Layout Contracts

This section defines what must change in each work surface when mode changes. These are **minimum requirements** — pillar teams may add more differentiation.

### 5A. Universal Mode Indicators (All Surfaces)

Every work surface must always show:
1. **Mode badge** in the Impact Strip (via ModeSwitcher in the surface header)
2. **AI state dot** that reflects the current automation activity
3. **SAGE tag** explaining why the current state exists

These three are non-negotiable and never conditionally hidden.

### 5B. Content Work Surface — Mode Layout Contracts

#### Manual Mode Layout
```
┌─────────────────────────────────────────────────────┐
│ HEADER: Content Hub  [Manual]  [Explain]  [Create]  │
│ IMPACT STRIP: SAGE tag | EVI | [Manual] badge       │
│ TABS: Content | Library | Calendar | Insights       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WORK QUEUE VIEW (default in Manual)                │
│  Full item list, no AI filtering                    │
│  Direct edit access on each item                   │
│  AI suggestions collapsed / on-demand only          │
│  Create button prominent                            │
│  Drag-to-reorder enabled                           │
│  No "AI proposes next step" banner                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**What renders that doesn't in other modes:**
- Drag-to-reorder handles on queue items
- Full item list without AI priority filtering
- Inline edit affordances visible on hover
- Create button at full prominence

**What does NOT render in Manual:**
- AI proposal banners ("SAGE suggests...")
- "Approve plan" affordances
- Autopilot execution status panels

---

#### Copilot Mode Layout
```
┌─────────────────────────────────────────────────────┐
│ HEADER: Content Hub  [Copilot]  [Explain]  [Create] │
│ IMPACT STRIP: SAGE tag | EVI | [Copilot] badge      │
│ TABS: Content | Library | Calendar | Insights       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  COPILOT PROPOSAL BANNER (top of work queue)        │
│  "SAGE identified 3 priority actions"               │
│  [Review Plan] CTA                                 │
│                                                     │
│  WORK QUEUE — AI-sorted by priority                 │
│  Each item shows:                                   │
│   • SAGE reasoning chip ("Fills authority gap")     │
│   • Confidence indicator                           │
│   • Approve / Reject quick actions                 │
│  Create button secondary (not primary focus)        │
│  AI reasoning visible inline, not behind click      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**What renders only in Copilot:**
- SAGE proposal banner at top of queue
- AI reasoning chips on each queue item
- Confidence indicators
- Approve / Reject inline affordances
- AI priority sort (queue order differs from Manual)

**What is NOT in Copilot:**
- Drag-to-reorder (AI controls order)
- Autopilot execution logs
- "All clear" empty state

---

#### Autopilot Mode Layout
```
┌─────────────────────────────────────────────────────┐
│ HEADER: Content Hub  [Autopilot]  [Explain]  [+]    │
│ IMPACT STRIP: SAGE tag | EVI | [Autopilot] badge    │
│ TABS: Exceptions | Activity Log | Calendar          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  EXCEPTION QUEUE (replaces Work Queue)              │
│  Only items requiring human intervention            │
│  Empty state: "All clear — 12 items executing"      │
│                                                     │
│  ACTIVITY PANEL (below exceptions)                  │
│  Execution log: completed, in progress, queued      │
│  Guardrail violations highlighted                   │
│  Kill switch accessible                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**What renders only in Autopilot:**
- Exception queue (not the full work queue)
- Activity log / execution status panel
- Kill switch / pause control
- "All clear" empty state
- Guardrail violation alerts

**What does NOT render in Autopilot:**
- Full work queue (routine items hidden)
- Create button (secondary, not prominent)
- Drag-to-reorder
- AI proposal banners (AI is already executing)
- Copilot approval affordances

**Note:** Tabs change in Autopilot. The "Content" tab becomes "Exceptions". A new "Activity Log" tab appears. This is deliberate — the information architecture shifts.

---

### 5C. Command Center (Tri-Pane) — Mode Contracts

The Command Center aggregates all three pillars. Each pillar's mode is shown independently.

**Action Stream Pane behavior per action's mode:**
- `mode: 'manual'` — Full card, direct CTA visible, no AI reasoning shown
- `mode: 'copilot'` — Full card, SAGE reasoning chip visible, Approve/Review CTAs
- `mode: 'autopilot'` — Collapsed by default, only surfaces if exception

**Strategy Panel (SAGE):** Always visible regardless of mode. SAGE reasoning is always available.

**Intelligence Canvas:** Always visible regardless of mode. Data display is mode-agnostic.

---

### 5D. PR Work Surface — Mode Contracts

| Element | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| Outreach queue | Full list, manual sort | AI-sorted, reasoning visible | Exceptions only |
| Draft composer | Immediately accessible | Accessible after approval | Hidden |
| Journalist intelligence | Always visible | Always visible | Always visible |
| AI proposal banner | Hidden | Visible | Hidden (AI executing) |
| Approve/reject actions | N/A | Present on each item | Escalations only |
| Execution log | Not shown | Not shown | Visible |

---

## 6. Cross-Pillar Mode Consistency Requirements

These apply to ALL pillars — not optional:

### 6A. Required in Every Mode on Every Surface
- ModeSwitcher in header (shows current mode, allows change if not locked)
- Impact Strip with mode badge visible
- AI state dot reflecting current automation state
- Mode change triggers re-evaluation, not instant layout swap

### 6B. Mode Badge Typography Contract
Mode badges must always use:
```
text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border
```
Never use text larger than `text-xs` for mode badges. They are metadata, not headings.

### 6C. Mode Change Confirmation (When Required)
If switching FROM Autopilot while executions are in progress:
```
"AI is currently executing 4 actions.
Switching to Manual will pause these. Continue?"
[Cancel] [Switch to Manual]
```
No confirmation required for other transitions.

### 6D. Mode Explanation (Explain Drawer)
The Explain Drawer in each surface must include a mode section:
- Current mode name and description
- What AI can do in this mode
- What requires user approval
- How to change mode (if not locked)
- If locked: who locked it and why (org policy)

---

## 7. The Governance Feature (Enterprise)

Enterprise plan provides an admin interface to set mode floors and ceilings per pillar. This is a separate admin surface, not documented here, but the implications for work surfaces are:

**When a pillar is locked to a single mode by admin:**
- ModeSwitcher shows lock icon + current mode (non-interactive)
- Tooltip: "Mode locked by [Admin Name] — Contact your workspace admin to change"
- No dropdown on click
- Mode badge uses same color as unlocked mode but with 🔒 prefix

**When a floor is set but ceiling allows range:**
- ModeSwitcher dropdown shows valid range only
- No disabled states — simply don't show options below floor

**Audit trail:** Every mode change (user or admin) must be loggable. The data model must include `changedBy`, `changedAt`, `previousMode`, `newMode`, `reason` (optional).

---

## 8. Implementation Checklist

Before shipping any work surface, confirm:

```
[ ] ModeSwitcher present in surface header
[ ] ModeSwitcher reads from pillar policy (floor/ceiling), not hardcoded
[ ] Mode badge in Impact Strip matches ModeSwitcher
[ ] Layout changes between modes (not just badge swap)
[ ] Manual mode: full queue, direct manipulation, AI invisible
[ ] Copilot mode: AI reasoning visible inline, approve/reject affordances present
[ ] Autopilot mode: exception-only queue, activity log, kill switch accessible
[ ] Mode change triggers re-evaluation state (AI dot animating)
[ ] Mode change confirmation dialog when switching from active Autopilot
[ ] Explain Drawer includes mode section
[ ] Admin-locked mode shows lock icon and tooltip
[ ] Tabs change in Autopilot (where applicable)
[ ] Action-level ceilings enforced independently of pillar mode
[ ] No create-forward UI in Autopilot mode
[ ] Content pillar: Publishing never executes without explicit manual approval
```

---

## 9. Relationship to Other Canon

| Canon | Relationship |
|-------|-------------|
| `AUTOMATION_MODE_CONTRACTS_CANON.md` | Defines behavioral semantics — this doc implements them |
| `AUTOMATION_MODES_UX.md` | Thin summary — this doc supersedes for implementation detail |
| `CONTENT_WORK_SURFACE_CONTRACT.md` | Defines V1 Content mode ceilings — takes precedence over this doc for Content specifics |
| `DS_v3_COMPLIANCE_CHECKLIST.md` | Mode badge styling must comply with DS checklist |
| `PRODUCT_CONSTITUTION.md` | Core principle: every action explainable, labeled, interruptible — modes must honor this |

**Conflict rule:** If `CONTENT_WORK_SURFACE_CONTRACT.md` specifies a Content-specific mode behavior that differs from this doc, the Contract wins for Content. This doc governs cross-pillar consistency and governance — it does not override per-surface contracts.
