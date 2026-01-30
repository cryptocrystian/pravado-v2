# CONTENT SURFACE ARCHITECTURE MAP

> **Status:** WORKING SPEC
> **Classification:** Design Architecture — NOT CANONICAL (do not add to index)
> **Purpose:** Define surface composition rules for Content pillar redesign
> **Depends On:** Step 1 working spec (`CONTENT_MODE_RESPONSIBILITY_MAP.md`)
> **Last Updated:** 2026-01-29

---

## 1. Purpose

This document defines the **surface architecture** (not layout) of the Content pillar. It declares what "surfaces" exist, their purpose, and how they compose by automation mode across Content routes.

This document explicitly does **NOT** mandate:
- Column counts or page templates
- Fixed grid layouts or pixel dimensions
- Specific component placements

Instead, it establishes **surface co-residency rules** and **mode-driven composition** that enable mode-expressive UX while preserving implementer flexibility on layout.

---

## 2. Surface Inventory

A "surface" is a coherent unit of user attention with a clear role, inputs, and outputs. Content pillar requires the following surfaces:

### 2.1 Core Surfaces

| # | Surface | Purpose | Primary Users | Inputs | Outputs | Canon Reference |
|---|---------|---------|---------------|--------|---------|-----------------|
| S1 | **Work Queue Surface** | Selection, triage, and prioritization of content actions | Operator (Manual), Reviewer (Copilot), Supervisor (Autopilot) | Content actions, briefs, deadlines | Selected action for execution | `AUTOMATION_MODE_CONTRACTS_CANON.md` §3 |
| S2 | **Plan Surface** | Display AI plan/reasoning; approval gate in Copilot | Reviewer | AI proposal, confidence, reasoning | Plan approval/rejection | `AUTOMATION_MODE_CONTRACTS_CANON.md` §3 (Copilot) |
| S3 | **Exception Surface** | Display blocked items, guardrail violations, escalations | Supervisor | Exception queue, guardrails, CiteMind blocks | Intervention decision | `AUTOMATION_MODE_CONTRACTS_CANON.md` §3 (Autopilot) |
| S4 | **Editor Surface** | Direct content creation and structured editing | Operator | Brief, outline, entity constraints | Draft content | `CONTENT_WORK_SURFACE_CONTRACT.md` §5.4 |
| S5 | **Context Surface** | Entity associations, constraints, CiteMind gating | All | Asset/brief context, entity map | Constraint awareness | `CITEMIND_SYSTEM.md` §1.2 |
| S6 | **Explainability Surface** | 3-level explanation (summary, technical, causal) | All | Action context | Understanding | `AUTOMATE_EXECUTION_MODEL.md` §7.2 |
| S7 | **Audit Surface** | Auto-handled ledger, provenance, execution history | Supervisor | Execution records | Trust verification | `AUTOMATE_EXECUTION_MODEL.md` §7.1 |
| S8 | **Cross-Pillar Impact Surface** | PR/SEO hooks and downstream effects | All | Derivatives, cross-pillar deps | Coordination awareness | `UX_CONTINUITY_CANON.md` §7 |
| S9 | **Temporal Surface** | Deadlines, freshness indicators, urgency calibration | All | Timestamps, deadlines | Time-pressure awareness | `AI_VISUAL_COMMUNICATION_CANON.md` §4 |
| S10 | **AI State Surface** | Ambient and local AI state indicators | All | AI perceptual state | System status awareness | `AI_VISUAL_COMMUNICATION_CANON.md` §2 |

### 2.2 Surface Detail Cards

#### S1: Work Queue Surface
- **Purpose:** Central selection and triage interface for content actions
- **Manifestation per mode:**
  - **Manual:** Full queue with direct manipulation controls (re-rank, pin, batch select)
  - **Copilot:** AI-prioritized queue with reasoning badges; user may override
  - **Autopilot:** Exception-only list; routine items filtered out
- **Key affordances:** Item cards, priority indicators, selection states, batch actions
- **Canon link:** `AUTOMATION_MODE_CONTRACTS_CANON.md` Section 3 (mode definitions)

#### S2: Plan Surface
- **Purpose:** Display AI's reasoning and plan structure for user approval
- **Manifestation per mode:**
  - **Manual:** SUPPRESSED (user is authority)
  - **Copilot:** DOMINANT; shows step-numbered reasoning; requires approval
  - **Autopilot:** ALLOWED for exception context only
- **Key affordances:** Reasoning chips, confidence display, approve/reject gate
- **Post-approval behavior:** Reasoning archived and collapsed (never removed)
- **Canon link:** `CONTENT_MODE_RESPONSIBILITY_MAP.md` Section 3 (reasoning persistence resolved)

#### S3: Exception Surface
- **Purpose:** Highlight items requiring human intervention despite automation
- **Manifestation per mode:**
  - **Manual:** SUPPRESSED (all items shown anyway)
  - **Copilot:** ALLOWED for low-confidence fallback items
  - **Autopilot:** DOMINANT; primary content of the view
- **Key affordances:** Exception cards, guardrail indicators, escalation badges
- **Canon link:** `AUTOMATION_MODE_CONTRACTS_CANON.md` Section 4 (guardrails)

#### S4: Editor Surface
- **Purpose:** Structured content editing with section-based organization
- **Manifestation per mode:**
  - **Manual:** DOMINANT; full editing controls embedded
  - **Copilot:** ALLOWED; contextual/staged editing after approval
  - **Autopilot:** SUPPRESSED; no dense creation interfaces
- **Key affordances:** Section editor, inline CiteMind feedback, entity grounding
- **Critical constraint:** Structured sections only, NO chat-style AI canvas
- **Canon link:** `CONTENT_WORK_SURFACE_CONTRACT.md` Section 5.4

#### S5: Context Surface
- **Purpose:** Display entity associations, constraints, and CiteMind gating status
- **Manifestation per mode:**
  - **Manual:** REQUIRED; full checklist with constraint satisfaction
  - **Copilot:** REQUIRED; review-focused constraint display
  - **Autopilot:** ALLOWED; violations surface only
- **Key affordances:** Entity checklist, constraint satisfaction indicators, CiteMind gate
- **Canon link:** `CITEMIND_SYSTEM.md` Section 1.2

#### S6: Explainability Surface
- **Purpose:** Answer "why?" at three levels of detail
- **Levels:**
  - Level 1: User summary ("This action [verb] because [signal]")
  - Level 2: Technical detail (confidence, risk, mode ceiling)
  - Level 3: Causal chain (trigger → proposal → approval → execution → outcome)
- **Manifestation per mode:**
  - **Manual:** ALLOWED on demand
  - **Copilot:** REQUIRED; Level 1-2 visible, Level 3 on drill-down
  - **Autopilot:** REQUIRED; Level 3 prominently for causal understanding
- **Reachability rule:** Must be accessible within 1 interaction from any action-bearing surface
- **Canon link:** `AUTOMATE_EXECUTION_MODEL.md` Section 7.2

#### S7: Audit Surface
- **Purpose:** Show "auto-handled" ledger and execution provenance
- **Manifestation per mode:**
  - **Manual:** ALLOWED; optional history view
  - **Copilot:** ALLOWED; post-approval reasoning archive
  - **Autopilot:** REQUIRED; prominent proof-of-work indicator
- **Key affordances:** Execution ledger, timestamps, actor attribution
- **Supervised items count:** Displayed as ambient indicator even when exceptions=0
- **Canon link:** `AUTOMATE_EXECUTION_MODEL.md` Section 7.1

#### S8: Cross-Pillar Impact Surface
- **Purpose:** Show how content actions affect PR and SEO pillars
- **Manifestation per mode:**
  - **Manual:** REQUIRED; full hooks with action affordances
  - **Copilot:** REQUIRED; hooks with approval context
  - **Autopilot:** READ-ONLY; compact summary, collapsed by default
- **Key affordances:** Cross-pillar badges, derivative indicators, impact preview
- **Canon link:** `UX_CONTINUITY_CANON.md` Section 7

#### S9: Temporal Surface
- **Purpose:** Communicate time-sensitive context without manufactured urgency
- **Key elements:**
  - Deadline indicators (proportional to actual urgency)
  - Freshness states (current, stale, expired)
  - Urgency calibration (decreases when user engages)
- **Anti-pattern:** Pulsing indicators on non-deadline items (§7.4 violation)
- **Canon link:** `AI_VISUAL_COMMUNICATION_CANON.md` Section 4

#### S10: AI State Surface
- **Purpose:** Communicate AI perceptual state through visual behavior
- **States:** Idle, Evaluating, Ready, Executing, Blocked, Escalating
- **Components:**
  - Ambient indicator (header-level, persistent)
  - Local indicator (near affected object)
  - State ring (wrapper for cards/panels)
  - Progress indicator (determinate vs indeterminate)
- **Invariant:** Mode transition must be visually perceptible
- **Canon link:** `AI_VISUAL_COMMUNICATION_CANON.md` Section 2

---

## 3. Mode Composition Matrix

This matrix defines which surfaces co-exist by mode for each Content route.

### Legend
- **Dominant (D):** Primary user attention; max 2 per route/mode
- **Supporting (S):** Secondary attention; max 3 per route/mode
- **Suppressed (-):** Must not appear
- **Read-Only (RO):** Visible but not interactive

### 3.1 Work Queue (`/app/content`)

| Surface | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| S1 Work Queue | **D** | S | S |
| S2 Plan | - | **D** | S (exceptions only) |
| S3 Exception | - | S (low-confidence) | **D** |
| S4 Editor | - | - | - |
| S5 Context | S | S | - |
| S6 Explainability | S | S | S |
| S7 Audit | - | - | **D** |
| S8 Cross-Pillar | S | S | RO (collapsed) |
| S9 Temporal | S | S | S |
| S10 AI State | S | S | S |

**Summary:**
- **Manual:** Work Queue dominant, full manipulation controls
- **Copilot:** Plan dominant (approval gate), Work Queue supporting
- **Autopilot:** Exception + Audit dominant, Work Queue filtered to exceptions

### 3.2 Orchestration Editor (`/app/content/orchestrate/[actionId]`)

| Surface | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| S1 Work Queue | - | - | - |
| S2 Plan | - | **D** | RO |
| S3 Exception | - | - | **D** |
| S4 Editor | **D** | S (staged) | - |
| S5 Context | **D** | S | S (violations only) |
| S6 Explainability | S | S | S |
| S7 Audit | - | S (archived reasoning) | S |
| S8 Cross-Pillar | S | S | RO |
| S9 Temporal | S | S | S |
| S10 AI State | S | S | S |

**Summary:**
- **Manual:** Editor + Context dominant (full editing workbench)
- **Copilot:** Plan dominant with staged Editor supporting
- **Autopilot:** Exception dominant; read-only execution trace

### 3.3 Asset Work Surface (`/app/content/asset/[id]`)

| Surface | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| S1 Work Queue | - | - | - |
| S2 Plan | - | S | - |
| S3 Exception | - | - | **D** |
| S4 Editor | **D** | S (preview-forward) | - |
| S5 Context | **D** | S | S (violations) |
| S6 Explainability | S | S | S |
| S7 Audit | S | S | **D** |
| S8 Cross-Pillar | S | S | RO |
| S9 Temporal | S | S | S |
| S10 AI State | S | S | S |

**Summary:**
- **Manual:** Editor + Context dominant (structured section editing)
- **Copilot:** Editor preview-forward with approval workflow
- **Autopilot:** Exception + Audit dominant; read-only preview

### 3.4 Brief Work Surface (`/app/content/brief/[id]`)

| Surface | Manual | Copilot | Autopilot |
|---------|--------|---------|-----------|
| S1 Work Queue | - | - | - |
| S2 Plan | - | **D** | - |
| S3 Exception | - | - | **D** |
| S4 Editor | **D** | S (review-forward) | - |
| S5 Context | **D** | S | S (violations) |
| S6 Explainability | S | S | S |
| S7 Audit | - | S | S |
| S8 Cross-Pillar | S | S | RO |
| S9 Temporal | S | S | S |
| S10 AI State | S | S | S |

**Summary:**
- **Manual:** Editor + Context dominant (brief editing, constraint definition)
- **Copilot:** Plan dominant (AI-generated brief review), Editor for modifications
- **Autopilot:** Exception dominant; brief status overview only

---

## 4. Co-Residency Rules

These rules govern which surfaces may appear together, independent of layout.

### 4.1 Universal Rules

| Rule | Statement | Rationale |
|------|-----------|-----------|
| CR-1 | Editor Surface may co-reside with Work Queue Surface in Manual mode only | Manual=Workbench posture allows embedded editing |
| CR-2 | Plan Surface must NOT co-reside as dominant with Editor Surface before approval | Plan must be approved before editing proceeds |
| CR-3 | Audit Surface appears as dominant only in Autopilot mode | Autopilot requires proof-of-work visibility |
| CR-4 | Explainability Surface must be reachable within 1 interaction from any action-bearing surface | Per `UX_CONTINUITY_CANON.md` §6: "Why?" answerable without navigation |
| CR-5 | CiteMind gating (part of Context Surface) must be visible wherever Publish/Generate is possible | Publishing gates are universal regardless of mode |
| CR-6 | Cross-Pillar Surface appears as READ-ONLY and collapsed in Autopilot | Per Step 1 resolution: reduces noise in exception console |
| CR-7 | Exception Surface and full Work Queue Surface may NOT co-reside as dual-dominant | Cognitive load constraint; one attention anchor at a time |
| CR-8 | AI State Surface (ambient indicator) must persist across all modes and routes | Per `AI_VISUAL_COMMUNICATION_CANON.md` §2.1: AI state always perceivable |

### 4.2 Mode-Specific Rules

**Manual Mode:**
- M-1: Work Queue Surface may show full item list with direct manipulation
- M-2: AI reasoning surfaces (Plan, Audit) must be suppressed or available only on explicit request
- M-3: Editor Surface may be embedded or inline (layout decision, not architecture)

**Copilot Mode:**
- C-1: Plan Surface must appear ABOVE or BEFORE action execution affordances
- C-2: Low-confidence items (<0.70) must display Manual-required gate (fallback per Step 1)
- C-3: After approval, Plan reasoning is archived and collapsed, never removed
- C-4: Editor Surface operates in staged/review mode, not freeform

**Autopilot Mode:**
- A-1: Only exceptions, guardrail violations, and escalations surface by default
- A-2: "Supervised items" count must be displayed even when exceptions=0 (ambient proof-of-work)
- A-3: Mode ceiling violations display inline lock + one-interaction explanation
- A-4: Audit Surface shows auto-handled ledger with timestamps and actor attribution

---

## 5. Transition Rules

### 5.1 Mode Transitions

| Transition | Expected Behavior | Surface Impact |
|------------|-------------------|----------------|
| Any → Manual | Full queue restored; AI assistance optional | Plan→suppressed, Exception→suppressed, Queue→full |
| Any → Copilot | AI evaluates and prepares plan; awaits approval | Plan→dominant, Queue→filtered, AI state→evaluating |
| Any → Autopilot | Routine items filter out; exceptions surface | Exception→dominant, Audit→dominant, Queue→filtered |

**State Reset Requirements:**
- Plan approval state resets on mode change
- Queue reasoning updates for new mode context
- AI state indicator reflects transition (`evaluating` during recalculation)
- Visual acknowledgment of mode change (per `AI_VISUAL_COMMUNICATION_CANON.md` §5.4)

### 5.2 Low-Confidence Fallback

| Condition | Behavior |
|-----------|----------|
| Copilot confidence < 0.70 | Item displays Manual-required gate |
| User cannot proceed in Copilot | Must switch to Manual mode for that item |
| Gate displayed as | Inline indicator (not blocking modal) |

**Canon reference:** `CONTENT_MODE_RESPONSIBILITY_MAP.md` Section 7.1 (Resolved Decisions)

### 5.3 CiteMind Blocked State

| State | Surface Behavior |
|-------|------------------|
| `blocked` | Publish/Generate actions disabled; Context Surface shows gate |
| `warning` | Actions enabled with warning; Context Surface shows issues |
| `passed` | Actions enabled; Context Surface shows green status |

**Explainability requirement:** When CiteMind blocks, Level 1 explanation must be immediately visible.

### 5.4 AI State Transitions

| State | Visual Behavior | User Perception |
|-------|-----------------|-----------------|
| Idle → Evaluating | Subtle pulse begins | "System is thinking" |
| Evaluating → Ready | One-time scale transition | "System has conclusion" |
| Ready → Executing | Shimmer effect begins | "Action in progress" |
| Any → Blocked | Motion stops; red tint | "Intervention needed" |
| Any → Escalating | Bounded pulse; warning tint | "Urgent attention" |

**Canon reference:** `AI_VISUAL_COMMUNICATION_CANON.md` Section 2.2

---

## 6. Structured Audit Against Current Implementation

### 6.1 Work Queue (`/app/content`)

**Implementation file:** `ContentWorkQueueView.tsx`

| Aspect | Spec Requirement | Current State | Assessment |
|--------|------------------|---------------|------------|
| Mode-aware queue filtering | Required | Implemented via `filterActionsByMode()` | COMPLIANT |
| Plan Surface (Copilot) | Dominant | Implemented via `PlanPanel` component | COMPLIANT |
| Exception Surface (Autopilot) | Dominant | Implemented via empty state + exception filtering | PARTIAL - empty state exists but not a dedicated surface |
| Queue Controls (Manual) | Required | Implemented via `QueueControlsBand` | COMPLIANT |
| AI State Indicator | Required | Implemented via `AmbientAIIndicator` | COMPLIANT |
| Audit Surface (Autopilot) | Dominant | Implemented via `recentlyHandled` array | PARTIAL - basic array, not full ledger |
| Supervised items count | Required (ambient) | NOT IMPLEMENTED | MISSING |
| Explainability access | 1-interaction | Implemented via `ExplainabilityDrawer` | COMPLIANT |
| Cross-Pillar (Autopilot) | READ-ONLY collapsed | NOT ENFORCED - hooks remain actionable | VIOLATION |
| Low-confidence fallback | Required for <0.70 | NOT IMPLEMENTED in UI | MISSING |

**Key Mismatches:**
1. Supervised items count not displayed in Autopilot (violates proof-of-work requirement)
2. Cross-pillar hooks remain actionable in Autopilot (should be READ-ONLY collapsed)
3. Low-confidence fallback gate not visually implemented
4. Audit Surface is basic array, needs proper ledger format

### 6.2 Orchestration Editor (`/app/content/orchestrate/[actionId]`)

**Implementation file:** `OrchestrationEditorShell.tsx`

| Aspect | Spec Requirement | Current State | Assessment |
|--------|------------------|---------------|------------|
| 3-pane layout | Specified | Implemented (Strategic Anchor, Living Canvas, AEO Audit) | COMPLIANT |
| Plan Surface (Copilot) | Dominant | `ModeBehaviorBanner` present but Plan not fully separated | PARTIAL |
| Context Surface | Dominant (Manual) | Implemented via `EntityChecklist`, `TriggerCard` | COMPLIANT |
| Editor Surface | Dominant (Manual) | Living Canvas area implemented | COMPLIANT |
| AI State Indicator | Required | Implemented via `AmbientAIIndicator` | COMPLIANT |
| Mode Selector | Required | Implemented via `ModeSelector` component | COMPLIANT |
| CiteMind Status | Required | Implemented via `CiteMindStatusPanel` | COMPLIANT |
| Explainability access | 1-interaction | Implemented via drawer toggle | COMPLIANT |
| Mode ceiling enforcement | Required | Implemented but needs inline lock UX | PARTIAL |

**Key Mismatches:**
1. Mode ceiling enforcement shows selector but not inline lock + explanation pattern
2. Plan Surface not clearly separated from Editor in Copilot (visual dominance unclear)

### 6.3 Asset Work Surface (`/app/content/asset/[id]`)

**Implementation:** NOT FOUND (route does not exist)

| Aspect | Spec Requirement | Current State | Assessment |
|--------|------------------|---------------|------------|
| Route existence | Required | NO ROUTE IMPLEMENTED | MISSING |
| Structured Editor | Required | N/A | N/A |
| Inline CiteMind | Required | N/A | N/A |
| Derivatives Panel | Required | N/A | N/A |

**Critical Gap:** This entire route needs implementation per `CONTENT_WORK_SURFACE_CONTRACT.md` Section 5.4.

### 6.4 Brief Work Surface (`/app/content/brief/[id]`)

**Implementation:** NOT FOUND (route does not exist)

| Aspect | Spec Requirement | Current State | Assessment |
|--------|------------------|---------------|------------|
| Route existence | Required | NO ROUTE IMPLEMENTED | MISSING |
| Brief Sections Editor | Required | N/A | N/A |
| Assertion Checklist | Required | N/A | N/A |
| Citation Checklist | Required | N/A | N/A |
| Derivative Map | Required | N/A | N/A |

**Critical Gap:** This entire route needs implementation per `CONTENT_WORK_SURFACE_CONTRACT.md` Section 5.5.

### 6.5 Supporting Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `AIStateIndicator.tsx` | `components/content/components/` | COMPLIANT | Implements all 6 perceptual states |
| `ExplainabilityDrawer.tsx` | `components/content/orchestration/` | COMPLIANT | 3-level explanation implemented |
| `CrossPillarHooksPanel.tsx` | `components/content/components/` | PARTIAL | Full causal chain, but mode ceiling not enforced |
| `CiteMindStatusIndicator.tsx` | `components/content/components/` | COMPLIANT | Gate states implemented |
| `ContentEmptyState.tsx` | `components/content/components/` | COMPLIANT | Mode-aware empty states |

---

## 7. Recommendations

These recommendations are spec-level guidance, not code prescriptions.

### 7.1 Manual Mode = Workbench

| # | Recommendation | Rationale |
|---|----------------|-----------|
| R1 | To satisfy Manual=Workbench, the Editor Surface must be directly accessible without navigation gates | Manual posture is operator-driven; friction violates mode contract |
| R2 | Work Queue Surface must provide queue manipulation controls (re-rank, pin, batch) when Editor is not active | Workbench metaphor requires direct control |
| R3 | AI reasoning surfaces (Plan, Audit) must be suppressed by default in Manual mode | User is authority; AI surfaces compete for attention |

### 7.2 Copilot Mode = Plan Review

| # | Recommendation | Rationale |
|---|----------------|-----------|
| R4 | To satisfy Copilot=Plan Review, the Plan Surface must visually dominate before approval | Copilot is a decision gate; plan must be seen before action |
| R5 | Plan reasoning must persist as archived/collapsed after approval, never removed | Auditability requirement per Step 1 resolution |
| R6 | Low-confidence items (<0.70) must display a visual fallback gate, not just fail silently | User must understand why item requires Manual mode |
| R7 | Editor Surface must operate in "staged" mode until plan approval completes | No freeform editing before decision gate passed |

### 7.3 Autopilot Mode = Exception Console

| # | Recommendation | Rationale |
|---|----------------|-----------|
| R8 | To satisfy Autopilot=Exception Console, the Exception Surface must be the primary content | Autopilot user sees only what needs attention |
| R9 | Supervised items count must be displayed even when exceptions=0 | Proof-of-work prevents "is it working?" anxiety |
| R10 | Cross-pillar hooks must be READ-ONLY and collapsed by default in Autopilot | Reduces cognitive load; preserves awareness without distraction |
| R11 | Audit Surface must show timestamped ledger, not just recent items array | Full provenance for trust and compliance |

### 7.4 Route Implementation

| # | Recommendation | Rationale |
|---|----------------|-----------|
| R12 | Asset Work Surface (`/app/content/asset/[id]`) must be implemented as specified | Required by `CONTENT_WORK_SURFACE_CONTRACT.md` |
| R13 | Brief Work Surface (`/app/content/brief/[id]`) must be implemented as specified | Required by `CONTENT_WORK_SURFACE_CONTRACT.md` |
| R14 | Orchestration Editor should be formally added to route contract | Per Step 1 open question: route is allowed but not in contract |

---

## 8. Open Questions

| # | Question | Impact if Unresolved |
|---|----------|---------------------|
| 1 | **What is the specific UX for "supervised items" count?** | Implementation detail: where on screen, what icon, exact phrasing. Does not affect architecture. |
| 2 | **Should Asset and Brief routes share a shell or have distinct shells?** | Layout/implementation decision. Both must honor same surface composition rules regardless. |
| 3 | **How should stale data be visually differentiated from fresh data on Temporal Surface?** | Affects visual design, not architecture. Canon specifies they must be distinguishable (§4.1). |
| 4 | **Should Explainability Surface be a drawer or inline expandable?** | Implementation pattern decision. Must satisfy 1-interaction reachability rule regardless. |

---

## 9. Canon References

| Document | Key Contributions to This Spec |
|----------|-------------------------------|
| `AUTOMATION_MODE_CONTRACTS_CANON.md` | Mode definitions, behavioral contracts, postures |
| `AUTOMATION_MODES_UX.md` | Mode safety requirements, UX per item |
| `UX_CONTINUITY_CANON.md` | Cross-pillar awareness, explainability, progress feedback invariants |
| `AI_VISUAL_COMMUNICATION_CANON.md` | Perceptual states, confidence signaling, mode expression |
| `CONTENT_WORK_SURFACE_CONTRACT.md` | Content routes, CiteMind gates, mode ceilings, component inventory |
| `CITEMIND_SYSTEM.md` | Engine governance, gating requirements |
| `AUTOMATE_EXECUTION_MODEL.md` | Explainability levels, risk classification, audit requirements |
| `CONTENT_MODE_RESPONSIBILITY_MAP.md` | Working spec from Step 1; resolved decisions on proof-of-work, fallback, cross-pillar |

---

## 10. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-29 | 0.1 | Initial surface architecture map |
