# Content Work Surface Reconstruction

**Version:** 1.0
**Status:** Canonical Derivation
**Last Updated:** 2026-02-02
**Authority:** Derived exclusively from canon documents

---

## Canonical Sources

This document derives its conclusions exclusively from:

| Canon | Authority Scope |
|-------|-----------------|
| `CONTENT_MODE_UX_THESIS.md` | Mode mental models, primary activities |
| `EDITOR_IDENTITY_CANON.md` | Editor vs. non-editor surface identity |
| `INFORMATION_DENSITY_HIERARCHY_CANON.md` | Density standards, typography, spatial discipline |
| `ACTION_GRAVITY_CTA_CANON.md` | CTA placement, gravity rules, forbidden patterns |
| `AUTOMATION_MODE_CONTRACTS_CANON.md` | Mode behavioral contracts, authority boundaries |
| `UX_CONTINUITY_CANON.md` | Platform-wide experience invariants |
| `AI_VISUAL_COMMUNICATION_CANON.md` | AI state perception, mode expression |

Any statement in this document that cannot be traced to these sources is invalid.

---

## 1. Surface Purpose Declaration

### 1.1 Single Reason This Surface Exists

**The Content Work Surface exists to enable the user to act on content items according to their current automation mode.**

The operative word is **act**. This surface is not for browsing, reporting, or configuration. It is where the user:
- Creates and edits content (Manual mode)
- Reviews and approves AI-prepared content (Copilot mode)
- Handles content exceptions requiring human judgment (Autopilot mode)

**Canon Justification:** CONTENT_MODE_UX_THESIS.md §3 states that every Content surface must pass the 3-second test: "What am I doing here, and what kind of activity does this surface expect from me?"

### 1.2 Actions That Must Not Occur On This Surface

The following activities belong elsewhere and must not occur on the Content Work Surface:

| Forbidden Activity | Reason (Canon Reference) |
|--------------------|--------------------------|
| **Global analytics review** | This is a dashboard concern, not a work surface concern (UX_CONTINUITY_CANON.md §9) |
| **System configuration** | Settings and guardrail configuration are administrative, not operational |
| **Cross-pillar orchestration** | Command Center responsibility; the Content Work Surface is pillar-scoped (UX_CONTINUITY_CANON.md §10) |
| **Audit log exploration** | Audit is discoverable but not the primary activity (AUTOMATION_MODE_CONTRACTS_CANON.md §3) |
| **Bulk campaign planning** | Calendar surface responsibility; the Work Surface is for executing, not strategic planning |

### 1.3 Cognitive State Upon Landing

**The user must arrive in a state of operational clarity.**

They must immediately know:
1. **What mode they are in** — perceivable through visual behavior, not just labels (AI_VISUAL_COMMUNICATION_CANON.md §5.1)
2. **What activity the surface expects** — create, review, or monitor (CONTENT_MODE_UX_THESIS.md §4)
3. **What requires their attention** — prioritized and surfaced, not buried (UX_CONTINUITY_CANON.md §4)

**The user must NOT arrive:**
- Wondering what to do next
- Searching for their work
- Confused about whether they are editing or viewing
- Uncertain whether AI is active or waiting

**Canon Justification:** UX_CONTINUITY_CANON.md §4 Entry Point Invariant: "Every session begins with clarity about what needs attention."

---

## 2. Mode-by-Mode Cognitive Contract

### 2.1 Manual Mode — "I Am Creating"

#### A. User Mental Model

| Dimension | User Expectation (from CONTENT_MODE_UX_THESIS.md §4) |
|-----------|-----------------------------------------------------|
| **Belief** | "This is my workspace. I am the author, editor, and decision-maker." |
| **Responsibility** | Total. The user owns every decision about what to work on, when, and how. |
| **What would feel wrong** | AI panels or plans dominating visual attention when the user expects to be creating. Automatic reordering of their queue. AI acting without being summoned. |

**Characteristic Verbs:** Write, edit, organize, publish, prioritize, tag

#### B. Primary Object of Attention

**The user's attention must be on the content item they are actively working on.**

- If no item is selected: the queue/list of items awaiting work
- If an item is selected for preview: the content preview
- If an item is being edited: the editor

**What must never compete with it:**
- AI reasoning panels that were not summoned
- Mode indicators that consume primary attention real estate
- Secondary metadata that visually overwhelms content

**Canon Justification:** CONTENT_MODE_UX_THESIS.md §5 Invariant 3: "The visually dominant element of any Content surface MUST support the mode's primary activity." For Manual mode, that is "Editor, creation tools, or content list."

#### C. Editor Presence

| Question | Answer |
|----------|--------|
| **Is an editor present?** | Yes, but conditionally |
| **Editor state** | Active only when explicitly entered |
| **Entry mechanism** | Explicit user action: "Edit" button, click into designated area, or navigation to editor route (EDITOR_IDENTITY_CANON.md §5 Invariant 1) |
| **Exit mechanism** | Explicit: Save, Publish, Cancel, or Close. Exit must be protected when unsaved changes exist (EDITOR_IDENTITY_CANON.md §5 Invariant 3) |
| **Boundary visibility** | The editing area must be visually distinct. The user must be able to answer: "What part of this screen is my editor?" (EDITOR_IDENTITY_CANON.md §5 Invariant 2) |

**Workbench Behavior:** If a workbench panel exists, it is NOT automatically an editor. It shows read-only preview until the user explicitly enters edit state. (EDITOR_IDENTITY_CANON.md §6)

#### D. Dominant Action

| Dimension | Specification |
|-----------|---------------|
| **Primary CTA** | Context-dependent: "Create New" when no selection; "Edit" when item selected for preview; "Save/Publish" when in editor |
| **CTA Position** | Within or adjacent to the content it affects (ACTION_GRAVITY_CTA_CANON.md §5 Pattern 1: Inline CTA) |
| **Secondary Actions** | Delete, Archive, Duplicate, Tag — visually subordinate, contextually placed |
| **Forbidden CTA Patterns** | Docked footers for non-editor views (ACTION_GRAVITY_CTA_CANON.md §9); Approval-style buttons when user is creating, not reviewing (CONTENT_MODE_UX_THESIS.md §5 Invariant 4) |

---

### 2.2 Copilot Mode — "I Am Reviewing AI Work"

#### A. User Mental Model

| Dimension | User Expectation (from CONTENT_MODE_UX_THESIS.md §4) |
|-----------|-----------------------------------------------------|
| **Belief** | "AI has prepared something for me. My job is to review, approve, or refine." |
| **Responsibility** | Judgment and authorization. The user evaluates AI work, not creates from scratch. |
| **What would feel wrong** | Dense editing surfaces that imply the user should be creating from scratch. Missing AI reasoning. Feeling like they are starting over rather than reviewing. |

**Characteristic Verbs:** Review, approve, reject, modify, compare, verify

#### B. Primary Object of Attention

**The user's attention must be on the AI proposal awaiting their judgment.**

This includes:
- The AI-generated plan or recommendation
- The AI-prepared draft or content
- The AI's reasoning for its proposal

**What must never compete with it:**
- Full creation toolbars that imply authorship rather than review
- Dense queue management controls
- Editing affordances that overwhelm approval affordances

**Canon Justification:** CONTENT_MODE_UX_THESIS.md §5 Invariant 3: For Copilot mode, what MUST dominate is "AI plan, approval controls, or comparison view."

#### C. Editor Presence

| Question | Answer |
|----------|--------|
| **Is an editor present?** | Conditionally — gated behind explicit action |
| **Editor state** | Read-only preview is default; editing is secondary, not primary |
| **Entry mechanism** | Explicit "Edit" or "Modify" action after reviewing AI output (EDITOR_IDENTITY_CANON.md §8) |
| **Exit mechanism** | Standard: Save changes or cancel |
| **Role distinction** | The user is refining AI output, not creating from blank. The mental model is "adjust" not "author." |

**Key Constraint:** Editing in Copilot must be contextual and secondary. The primary affordance remains approval/review. (CONTENT_MODE_UX_THESIS.md §7 "Hybrid Creep" failure mode)

#### D. Dominant Action

| Dimension | Specification |
|-----------|---------------|
| **Primary CTA** | "Approve Plan" or "Approve Draft" — the authorization action |
| **CTA Position** | Adjacent to the proposal being approved. Never separated by scroll or significant distance. (ACTION_GRAVITY_CTA_CANON.md §4 Copilot, §6 Invariant 3) |
| **Secondary Actions** | Reject, Modify, Compare, Request Revision — visually subordinate |
| **Forbidden CTA Patterns** | Approve button disconnected from proposal (ACTION_GRAVITY_CTA_CANON.md §9); Prominent "Create New" buttons that contradict review mode (CONTENT_MODE_UX_THESIS.md §5 Invariant 4) |

**AI Reasoning Requirement:** AI reasoning MUST be visible and explainable, not hidden behind clicks. (AUTOMATION_MODE_CONTRACTS_CANON.md §3 Copilot; UX_CONTINUITY_CANON.md §6)

---

### 2.3 Autopilot Mode — "I Am Supervising Automation"

#### A. User Mental Model

| Dimension | User Expectation (from CONTENT_MODE_UX_THESIS.md §4) |
|-----------|-----------------------------------------------------|
| **Belief** | "AI is handling routine work. I only need to act on exceptions." |
| **Responsibility** | Oversight and exception handling. The user monitors, not directs. |
| **What would feel wrong** | Full work queues that imply manual work exists. Dense editing interfaces. Feeling like they should be doing the work themselves. |

**Characteristic Verbs:** Monitor, acknowledge, escalate, configure, audit

#### B. Primary Object of Attention

**The user's attention must be on exceptions, violations, or the "all clear" state.**

- If exceptions exist: the exception list or detail
- If no exceptions: a clear "all systems normal" state
- Never: a full queue of routine items

**What must never compete with it:**
- Dense creation interfaces
- Full content queues showing all items
- Editing toolbars

**Canon Justification:** CONTENT_MODE_UX_THESIS.md §5 Invariant 3: For Autopilot mode, what MUST dominate is "Exception list, status dashboard, or 'all clear' state."

#### C. Editor Presence

| Question | Answer |
|----------|--------|
| **Is an editor present?** | Rarely — only for exception resolution |
| **Editor state** | Absent by default; appears only when an exception requires content modification |
| **Entry mechanism** | Escalation path: User acknowledges exception → chooses to edit → enters editor |
| **Exit mechanism** | Standard editor exit; resolving the exception |
| **Frequency expectation** | Editing should be rare and exceptional (EDITOR_IDENTITY_CANON.md §8) |

#### D. Dominant Action

| Dimension | Specification |
|-----------|---------------|
| **Primary CTA** | "Acknowledge" or "Escalate" — exception resolution actions |
| **CTA Position** | Within the exception detail (ACTION_GRAVITY_CTA_CANON.md §4 Autopilot) |
| **When no exceptions** | Primary CTA may be minimal or absent. This is correct. (ACTION_GRAVITY_CTA_CANON.md §4: "No persistent CTAs waiting for work that doesn't exist.") |
| **Secondary Actions** | Configure guardrails, View audit log, Pause automation |
| **Forbidden CTA Patterns** | Persistent CTAs when there are no exceptions; Full action bars implying work exists when it doesn't (ACTION_GRAVITY_CTA_CANON.md §9) |

**"All Clear" State:** An empty exception list with a visible "all systems normal" indicator is the expected successful state. This is NOT a failure condition. (CONTENT_MODE_UX_THESIS.md §4 Autopilot)

---

## 3. Region Definition (Abstract)

These are functional regions, not visual layouts. Each region has a purpose, visibility conditions, and constraints.

### 3.1 Primary Work Region

| Attribute | Definition |
|-----------|------------|
| **Purpose** | The space where the user's primary activity occurs |
| **Manual mode content** | Editor (when active) or content list/queue |
| **Copilot mode content** | AI proposal/plan display with approval controls |
| **Autopilot mode content** | Exception list or "all clear" state |
| **Visibility** | Always present; content changes by mode |
| **Allowed** | The mode's primary activity affordances; content display; primary CTA |
| **Forbidden** | Secondary tools that compete with primary focus; AI panels when not relevant to current mode |

### 3.2 Selection/Navigation Region

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Allows user to select which item to work on or view |
| **Manual mode content** | Full queue with user-controlled ordering |
| **Copilot mode content** | AI-prioritized queue with visible reasoning |
| **Autopilot mode content** | Exception-filtered queue (routine items hidden) |
| **Visibility** | Present when multiple items exist; may collapse when single item is in focus |
| **Allowed** | Item selection; status indicators; quick actions (status toggle, tags) |
| **Forbidden** | Rich text editing (EDITOR_IDENTITY_CANON.md §7); inline title editing; structural modifications |

### 3.3 Contextual Intelligence Region

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Displays AI reasoning, suggestions, or related context |
| **Manual mode content** | Optional; appears only when user summons AI assistance |
| **Copilot mode content** | AI reasoning for current proposal; must be visible, not hidden (AUTOMATION_MODE_CONTRACTS_CANON.md §3) |
| **Autopilot mode content** | Exception reasoning; audit log access |
| **Visibility** | Mode-dependent; prominent in Copilot, optional in Manual, exception-focused in Autopilot |
| **Allowed** | AI explanations; confidence indicators; alternative suggestions |
| **Forbidden** | Primary CTAs (those belong in Primary Work Region); editing affordances |

### 3.4 Guardrails/Oversight Region

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Displays mode indicator, escalations, and system status |
| **Content** | Current mode indicator; guardrail violations; system health |
| **Visibility** | Persistent but minimal; escalates visually when attention needed |
| **Allowed** | Mode indicator; mode transition control; escalation alerts |
| **Forbidden** | Primary workflow content; this is oversight, not the work itself |

**Canon Justification:** UX_CONTINUITY_CANON.md §5: "The current automation mode must be visible and comprehensible at all times." AI_VISUAL_COMMUNICATION_CANON.md §5.1: "Users should be able to identify the active mode by observing how the interface responds."

---

## 4. Information Density Budget

### 4.1 Above-the-Fold Requirements

The following MUST be visible without scrolling on a standard viewport (1920x1080 or 1440x900):

| Element | Mode Applicability | Canon Reference |
|---------|--------------------|-----------------|
| **Mode indicator** | All modes | UX_CONTINUITY_CANON.md §5 |
| **Primary CTA** | All modes | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 1 |
| **Primary object of attention** | All modes | CONTENT_MODE_UX_THESIS.md §5 Invariant 3 |
| **At least one actionable item** | All modes | UX_CONTINUITY_CANON.md §4 |

### 4.2 What May Scroll

| Element | Condition |
|---------|-----------|
| **Queue items beyond first visible set** | After initial items are visible |
| **AI reasoning details** | After summary is visible; expand on demand |
| **Audit log entries** | After current context is established |
| **Long-form content in editor** | With sticky save controls (INFORMATION_DENSITY_HIERARCHY_CANON.md §5) |

### 4.3 What Must Never Appear Simultaneously

| Forbidden Combination | Reason (Canon Reference) |
|-----------------------|--------------------------|
| Full editing affordances AND prominent AI plan approval | No hybrid confusion (CONTENT_MODE_UX_THESIS.md §5 Invariant 2) |
| Dense creation tools AND exception-only filtering | Mode cognitive conflict (CONTENT_MODE_UX_THESIS.md §5 Invariant 2) |
| Approval workflows AND autonomous execution status equally prominent | Mode identity violation (CONTENT_MODE_UX_THESIS.md §5 Invariant 2) |
| Multiple primary CTAs | Single primary CTA rule (ACTION_GRAVITY_CTA_CANON.md §6 Invariant 2) |

### 4.4 Typography Standards

| Requirement | Standard | Canon Reference |
|-------------|----------|-----------------|
| **Body text minimum** | 12px (text-xs) | INFORMATION_DENSITY_HIERARCHY_CANON.md §3 |
| **Interactive label minimum** | 12px (text-xs) | INFORMATION_DENSITY_HIERARCHY_CANON.md §3 |
| **Queue item text minimum** | 12px (text-xs) | INFORMATION_DENSITY_HIERARCHY_CANON.md §3 |
| **Micro-label exception** | 10px only for supplementary, non-interactive labels | INFORMATION_DENSITY_HIERARCHY_CANON.md §3 |

### 4.5 Dead Space Ceiling

**No more than 50% of the viewport may be dead space.** (INFORMATION_DENSITY_HIERARCHY_CANON.md §5)

**Dead space definition:** Viewport area containing neither content, interactive affordances, nor meaningful whitespace (visual grouping).

**Full-width panels that contain content in only 20-30% are forbidden.** (INFORMATION_DENSITY_HIERARCHY_CANON.md §5)

### 4.6 Density by Surface Context

| Context | Density Level | Rationale (Canon Reference) |
|---------|---------------|----------------------------|
| **Queue/triage view** | Medium | Scanning efficiency balanced with readability (INFORMATION_DENSITY_HIERARCHY_CANON.md §4) |
| **Editor view** | Low | Focus on single content item (INFORMATION_DENSITY_HIERARCHY_CANON.md §4) |
| **Approval flow (Copilot)** | Low | Decision-making needs space (INFORMATION_DENSITY_HIERARCHY_CANON.md §4) |
| **Exception console (Autopilot)** | Low | Sparse by design; exceptions only (INFORMATION_DENSITY_HIERARCHY_CANON.md §4) |

---

## 5. CTA Gravity Enforcement

### 5.1 Primary CTA by Mode

| Mode | Primary CTA | Position Rule |
|------|-------------|---------------|
| **Manual (no selection)** | Create New | Header bar or prominent entry point |
| **Manual (item selected)** | Edit | Adjacent to selected item preview |
| **Manual (in editor)** | Save / Publish | Within or adjacent to editor area |
| **Copilot** | Approve Plan / Approve Draft | Adjacent to proposal being approved |
| **Autopilot (exception present)** | Acknowledge / Escalate | Within exception detail |
| **Autopilot (no exceptions)** | Minimal or absent | No persistent CTA for non-existent work |

### 5.2 CTA Proximity Rules

| Rule | Specification | Canon Reference |
|------|---------------|-----------------|
| **Proximity** | CTA must be visually proximate to the content it affects | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 3 |
| **Single glance test** | User must see both CTA and relevant content in one eye fixation or minimal glance | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 3 |
| **Width justification** | CTA bar's width must be justified by its content | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 4 |

### 5.3 Forbidden CTA Patterns

| Pattern | Description | Why Forbidden | Canon Reference |
|---------|-------------|---------------|-----------------|
| **Runway Footer** | Full-width sticky footer with single centered CTA creating 70-80% dead space | Wastes viewport; disconnects action from content | ACTION_GRAVITY_CTA_CANON.md §8 |
| **Scroll to Act** | Primary CTA requires scrolling past content to reach | Reduces completion; users may not find it | ACTION_GRAVITY_CTA_CANON.md §8 |
| **Duplicate Insurance** | Same CTA appears in header AND footer | Creates confusion; wastes space | ACTION_GRAVITY_CTA_CANON.md §8 |
| **Floating Orphan** | CTA docked to viewport corner, disconnected from content | Users unsure what action affects | ACTION_GRAVITY_CTA_CANON.md §8 |
| **Competing Primaries** | Two or more visually equivalent primary actions | Violates single primary rule | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 2 |
| **Mode-Inappropriate CTA** | "Create New" prominent in Copilot; "Approve" prominent in Manual | Contradicts mode mental model | ACTION_GRAVITY_CTA_CANON.md §9 |

### 5.4 Impossibility of Multiple Dominant CTAs

**There is exactly ONE primary CTA per context.** (ACTION_GRAVITY_CTA_CANON.md §6 Invariant 2)

If multiple actions appear equally important, the surface has failed to establish mode-appropriate hierarchy. Resolution:
- Identify which action aligns with the mode's primary activity
- Demote other actions to secondary visual weight
- Different contexts (e.g., list view vs. detail view in a split interface) may each have their own primary CTA, but within a single context, only one primary exists

---

## 6. Failure Modes & UX Smells

The following patterns indicate the surface has drifted from canon compliance:

### 6.1 Mode Identity Failures

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 1 | **Ambiguous mode state** | User must read labels to know which mode they are in | AI_VISUAL_COMMUNICATION_CANON.md §5.1 |
| 2 | **Mode decoration** | Mode indicator exists but interface behavior is identical across modes | CONTENT_MODE_UX_THESIS.md §7 |
| 3 | **Swiss Army Knife syndrome** | Single view tries to serve all three modes with same layout | CONTENT_MODE_UX_THESIS.md §7 |
| 4 | **Hybrid creep** | Copilot view has accumulated so many editing tools it resembles Manual | CONTENT_MODE_UX_THESIS.md §7 |

### 6.2 Editor Identity Failures

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 5 | **Ambiguous editor state** | User cannot answer "Am I in an editor right now?" | EDITOR_IDENTITY_CANON.md §5 Invariant 2 |
| 6 | **Accidental edit entry** | User entered edit context without explicit action | EDITOR_IDENTITY_CANON.md §5 Invariant 1 |
| 7 | **Unprotected exit** | User can navigate away from unsaved changes without confirmation | EDITOR_IDENTITY_CANON.md §5 Invariant 3 |
| 8 | **Ubiquitous inline editing** | Rich text editing appears in triage/list views | EDITOR_IDENTITY_CANON.md §4 |

### 6.3 Density Failures

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 9 | **Dead space dominance** | More than 50% of viewport is empty space above the fold | INFORMATION_DENSITY_HIERARCHY_CANON.md §5 |
| 10 | **Scroll to act** | Primary CTA is below the fold on standard viewport | INFORMATION_DENSITY_HIERARCHY_CANON.md §5 |
| 11 | **Newspaper print** | Text has shrunk below 12px to fit more content | INFORMATION_DENSITY_HIERARCHY_CANON.md §3 |
| 12 | **Full-width runway** | Panel spans full width but content occupies only 20-30% | INFORMATION_DENSITY_HIERARCHY_CANON.md §5 |

### 6.4 CTA Gravity Failures

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 13 | **CTA orphan** | Primary action is visually disconnected from content it affects | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 3 |
| 14 | **Competing primaries** | Multiple buttons have equivalent visual weight and prominence | ACTION_GRAVITY_CTA_CANON.md §6 Invariant 2 |
| 15 | **Persistent Autopilot CTA** | Full action bars visible when no exceptions exist | ACTION_GRAVITY_CTA_CANON.md §9 |

### 6.5 Perception Failures

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 16 | **Hidden AI activity** | AI is working but no visual indication exists | AI_VISUAL_COMMUNICATION_CANON.md §1.2 |
| 17 | **Instantaneous state change** | AI state transitions without perceptible visual change | AI_VISUAL_COMMUNICATION_CANON.md §7.6 |
| 18 | **Ambiguous AI attribution** | User cannot tell if content was created by them or AI | AI_VISUAL_COMMUNICATION_CANON.md §7.7 |
| 19 | **Hidden uncertainty** | AI recommendations display with high-confidence styling when confidence is actually low | AI_VISUAL_COMMUNICATION_CANON.md §7.5 |

### 6.6 Structural Smell

| # | Failure Pattern | Detection Signal | Canon Violated |
|---|-----------------|------------------|----------------|
| 20 | **Assembled feel** | Layout feels like components were placed arbitrarily; lacks inevitability | Violates underlying intent of all canons; structure should flow from purpose |

---

## 7. Explicit Non-Goals

This document explicitly does NOT define and must not be used to justify:

### 7.1 Layout Decisions

- Number of columns or panes
- Grid systems or breakpoint definitions
- Pixel widths or percentages
- Panel arrangements or split ratios
- Responsive behavior specifications

### 7.2 Component Decisions

- Button shapes, sizes, or colors
- Card designs or list item structures
- Input field styling
- Icon specifications
- Animation timings or easing curves

### 7.3 Visual Styling

- Color palettes or tokens
- Shadow depths or border radii
- Font families or specific type scales
- Spacing tokens beyond minimum constraints

### 7.4 Implementation Guidance

- React component architecture
- CSS/Tailwind class specifications
- State management patterns
- API integration patterns

### 7.5 Why These Are Non-Goals

These decisions belong to:
- `DS_v3_PRINCIPLES.md` and `DS_v3_1_EXPRESSION.md` for visual tokens
- Surface-specific implementation documents for component architecture
- Design process for layout optimization

This document defines **what must be true** about the surface, not **how to build it**.

---

## Canonical Traceability

Every normative statement in this document can be traced to its canonical source:

| Section | Primary Canon Sources |
|---------|----------------------|
| §1 Surface Purpose | CONTENT_MODE_UX_THESIS.md §3, UX_CONTINUITY_CANON.md §4, §9 |
| §2 Mode Contracts | CONTENT_MODE_UX_THESIS.md §4, §5; AUTOMATION_MODE_CONTRACTS_CANON.md §3; EDITOR_IDENTITY_CANON.md §5, §6, §8 |
| §3 Region Definition | CONTENT_MODE_UX_THESIS.md §5; UX_CONTINUITY_CANON.md §5, §6; AUTOMATION_MODE_CONTRACTS_CANON.md §3 |
| §4 Density Budget | INFORMATION_DENSITY_HIERARCHY_CANON.md §3, §4, §5; ACTION_GRAVITY_CTA_CANON.md §6 |
| §5 CTA Gravity | ACTION_GRAVITY_CTA_CANON.md §3, §4, §5, §6, §8, §9 |
| §6 Failure Modes | All source canons (specific references in table) |
| §7 Non-Goals | AUTOMATION_MODE_CONTRACTS_CANON.md §2; UX_CONTINUITY_CANON.md §2 |

---

## 8. Implementation Status (2026-02-04)

### 8.1 Completed: Manual Mode Editor Architecture + Focus State

The `ManualWorkbench.tsx` component has been refactored to comply with:
- `EDITOR_ACTION_PERSISTENCE_CANON.md`
- `EDITOR_FOCUS_LAYOUT_CANON.md`

**Architectural Pattern Implemented:**

```
DEFAULT STATE (Preview):
┌─────────────────────────────────────────────────────────────────────┐
│  TASK LIST (260px)  │    EDITOR CANVAS (flex-1)     │ CONTEXT (240px)│
│  ┌─────────────────┐│  ┌───────────────────────────┐ │ ┌────────────┐│
│  │ Header (shrink-0)││  │ HEADER (shrink-0)         │ │ │ (collapsed)││
│  ├─────────────────┤│  ├───────────────────────────┤ │ │            ││
│  │ List (flex-1)   ││  │ BODY (flex-1, scroll)     │ │ │ or         ││
│  │ overflow-y-auto ││  │ overflow-y-auto           │ │ │ expanded   ││
│  ├─────────────────┤│  ├───────────────────────────┤ │ │            ││
│  │ Footer (shrink-0)││  │ ACTION BAR (shrink-0)     │ │ └────────────┘│
│  └─────────────────┘│  └───────────────────────────┘ │               │
└─────────────────────────────────────────────────────────────────────┘

FOCUS STATE (Editing) - per EDITOR_FOCUS_LAYOUT_CANON §3:
┌─────────────────────────────────────────────────────────────────────┐
│  LIST (220px)  │         EDITOR (flex-1, dominant)        │ CTX(40px)│
│  compressed    │  reduced chrome, no nested boxes         │ collapsed│
└─────────────────────────────────────────────────────────────────────┘
```

**Key Fixes:**
1. **`h-full` Instead of `calc()`**: Eliminated brittle viewport calculations
2. **Three-Region Editor Pattern**: Header, Body, Action Bar with proper `shrink-0`
3. **Focus State Lifting**: `isEditing` state lifted to parent for layout coordination
4. **Dynamic Rail Widths**: Task list compresses 260px → 220px when editing
5. **Context Rail Suppression**: Auto-collapses when editing unless hard blockers exist
6. **Issue Count Badge**: Shows badge on collapsed rail when issues present

### 8.2 Canon Compliance Verification

| Canon | Status | Implementation Notes |
|-------|--------|---------------------|
| EDITOR_ACTION_PERSISTENCE_CANON | ✓ Compliant | Action Bar uses `shrink-0`, never scrolls |
| EDITOR_FOCUS_LAYOUT_CANON | ✓ Compliant | Focus State layout, rail suppression, editor dominance |
| CONTENT_MODE_UX_THESIS | ✓ Compliant | Editor dominates center pane |
| EDITOR_IDENTITY_CANON | ✓ Compliant | Explicit edit entry, visual state distinction |
| INFORMATION_DENSITY_HIERARCHY_CANON | ✓ Compliant | 12px min, dense task list |
| ACTION_GRAVITY_CTA_CANON | ✓ Compliant | Single primary CTA, proximate |
| AI_VISUAL_COMMUNICATION_CANON | ✓ Compliant | No decorative motion |

### 8.3 Files Modified

| File | Changes |
|------|---------|
| `apps/dashboard/src/components/content/work-queue/ManualWorkbench.tsx` | Focus State implementation, lifted `isEditing` state |
| `apps/dashboard/src/components/content/work-queue/QueueRow.tsx` | Updated docstring |
| `docs/canon/work/EDITOR_FOCUS_LAYOUT_CANON.md` | New canon document |
| `docs/canon/README.md` | Added Work Surfaces subsection, updated to v1.7 |

### 8.4 Focus State Behavior Summary

| Component | Default State | Focus State (isEditing) |
|-----------|---------------|-------------------------|
| Task List | 260px width | 220px width (compressed) |
| Editor | Standard | Dominant (reduced chrome) |
| Context Rail | 240px or collapsed | 40px collapsed (unless hard blocker) |
| Issue Badge | Hidden | Visible when issues > 0 |

### 8.5 Intentionally Unchanged

1. Copilot/Autopilot modes (existing 3-pane layout retained)
2. Typography scale (at or above canon minimums)
3. Cross-pillar layouts (PR, SEO unmodified)
4. Color palette (no design system changes)
5. Standalone QueueList, ContextRail, WorkbenchCanvas components

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-02-04 | Added EDITOR_FOCUS_LAYOUT_CANON implementation status |
| 1.1 | 2026-02-03 | Added implementation status for Manual mode EDITOR_ACTION_PERSISTENCE_CANON compliance |
| 1.0 | 2026-02-02 | Initial reconstruction from canon sources |
