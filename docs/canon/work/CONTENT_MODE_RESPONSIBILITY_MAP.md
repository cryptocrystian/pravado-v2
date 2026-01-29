# CONTENT MODE RESPONSIBILITY MAP

> **Status:** WORKING SPEC
> **Classification:** Design Foundation — NOT CANONICAL (do not add to index)
> **Purpose:** Drive redesign decisions for Content pillar surfaces
> **Last Updated:** 2026-01-29

---

## 1. Purpose

This map defines what MUST be visible, editable, hidden, and primary-action per automation mode (Manual, Copilot, Autopilot) for the Content pillar. It establishes semantic and UX responsibilities that drive design decisions without prescribing layout, column count, or visual arrangement. The goal is to ensure each mode delivers a distinct operational posture—Workbench (operator), Plan Review (decision gate), or Exception Console (supervisor)—while honoring the behavioral contracts defined in `AUTOMATION_MODE_CONTRACTS_CANON.md` and the explainability requirements of `AUTOMATE_EXECUTION_MODEL.md`.

---

## 2. Mode Quick Contract

| Mode | Posture | User Mental Model | Primary Activity |
|------|---------|-------------------|------------------|
| **Manual** | Workbench (operator) | "I am in control. AI assists when I ask." | Direct content creation, manual prioritization, full editing |
| **Copilot** | Plan Review (decision gate) | "AI prepared this. I review and approve." | Brief review, AI draft approval, staged editing, plan inspection |
| **Autopilot** | Exception Console (supervisor) | "AI is working. I only see what needs my attention." | Quality issues, deadline alerts, execution failures, blocked items |

**Source:** `AUTOMATION_MODE_CONTRACTS_CANON.md` Section 3

---

## 3. Responsibility Matrix

**Legend:**
- **REQUIRED** = Must exist and be prominent
- **ALLOWED** = May exist but not dominant
- **SUPPRESSED** = Must not appear
- **READ-ONLY** = Visible but not editable

| UX Responsibility | Manual | Copilot | Autopilot | Notes |
|-------------------|--------|---------|-----------|-------|
| **Queue ordering control** (re-rank/pin/batch) | REQUIRED | ALLOWED | SUPPRESSED | Per `AUTOMATION_MODE_CONTRACTS_CANON.md`: Manual = user controls ordering; Copilot = AI orders, user may override; Autopilot = only exceptions surface |
| **Plan reasoning + step structure** | SUPPRESSED | REQUIRED | ALLOWED | Copilot must show AI reasoning prominently; Autopilot may show reasoning for exceptions only |
| **Plan reasoning persistence** (after approval) | SUPPRESSED | REQUIRED (archived, collapsed) | ALLOWED | **RESOLVED:** After Copilot approval, reasoning is archived and collapsed (never removed); attached to action history/execution record |
| **Approval gate / confirmation moments** | SUPPRESSED | REQUIRED | REQUIRED (for escalations) | Copilot requires explicit approval; Autopilot escalates high-risk actions |
| **Inline editor (full editing)** | REQUIRED | ALLOWED | SUPPRESSED | Manual is editor-forward; Copilot editing is contextual/staged; Autopilot has no dense creation interfaces |
| **Preview-only content view** | ALLOWED | REQUIRED | REQUIRED | Copilot/Autopilot show content as preview; user reviews rather than drafts |
| **CiteMind gating visibility** | REQUIRED | REQUIRED | REQUIRED | Per `CITEMIND_SYSTEM.md`: CiteMind gates are universal regardless of mode |
| **CiteMind gating consequences** (blocked/warning states) | REQUIRED | REQUIRED | REQUIRED | Must always show why publishing is blocked or warned |
| **Entity checklist + constraint satisfaction view** | REQUIRED | REQUIRED | ALLOWED | Brief constraints and entity associations visible for review; Autopilot surfaces only violations |
| **Confidence + risk + reversibility signaling** | ALLOWED | REQUIRED | REQUIRED | Per `AI_VISUAL_COMMUNICATION_CANON.md`: users must perceive confidence and reversibility before action |
| **Low-confidence fallback gate** (confidence < 0.70) | N/A | REQUIRED | N/A | **RESOLVED:** If Copilot confidence < 0.70, item auto-falls back to Manual-required posture. Treated as behavioral gate equivalent to mode ceiling. |
| **Explainability access (Level 1: User Summary)** | ALLOWED | REQUIRED | REQUIRED | Per `AUTOMATE_EXECUTION_MODEL.md` Section 7.2: always available on demand |
| **Explainability access (Level 2: Technical Detail)** | ALLOWED | ALLOWED | ALLOWED | Available on drill-down for all modes |
| **Explainability access (Level 3: Causal Chain)** | SUPPRESSED | ALLOWED | REQUIRED | Autopilot users need causal understanding of automated actions |
| **Audit log / "auto-handled" ledger** | ALLOWED | ALLOWED | REQUIRED | Autopilot must show audit trail prominently |
| **Supervised items count** (proof-of-work) | SUPPRESSED | SUPPRESSED | REQUIRED (ambient) | **RESOLVED:** Quiet count shown even when exceptions=0; ambient system feedback (no CTA, no urgency, no pulse) |
| **Cross-pillar impact visibility** (PR/SEO hooks) | REQUIRED | REQUIRED | READ-ONLY (collapsed) | **RESOLVED:** Per `UX_CONTINUITY_CANON.md` Section 7; Autopilot shows as compact summary, collapsed by default, expandable |
| **Temporal urgency / deadlines** | REQUIRED | REQUIRED | REQUIRED | Time-sensitive actions must communicate urgency proportionally |
| **Progress indication** (evaluating/executing states) | ALLOWED | REQUIRED | REQUIRED | Per `AI_VISUAL_COMMUNICATION_CANON.md`: AI states must be visually distinguishable |
| **Mode ceiling enforcement** (Manual-only actions) | N/A | REQUIRED | REQUIRED | **RESOLVED:** Inline lock + one-interaction explanation + "Switch to Manual to continue". No blocking modal. |

---

## 4. Primary Surface per Mode

For each Content surface, define which affordance becomes **dominant** (not layout, just focus):

### 4.1 Work Queue (`/app/content`)

| Mode | Dominant Affordance |
|------|---------------------|
| **Manual** | Full queue with direct manipulation, filter controls, density-adaptive cards, manual prioritization |
| **Copilot** | AI-prioritized queue with reasoning badges, approval actions, plan summary overlay; low-confidence items (<0.70) show Manual-required gate |
| **Autopilot** | Exception-only list (blocked, failed, escalated), "all clear" empty state valid, audit summary, **ambient "supervised items" count** (proof-of-work indicator, no CTA/urgency) |

### 4.2 Orchestration Editor (`/app/content/orchestrate/[actionId]`)

> **Contract Note:** This route is an **allowed execution surface** for the Content pillar. Requires update to `CONTENT_WORK_SURFACE_CONTRACT.md` to formally include the route.

| Mode | Dominant Affordance |
|------|---------------------|
| **Manual** | Step-by-step manual configuration, entity binding controls, derivative target selection |
| **Copilot** | AI-proposed plan with step breakdown, approve/reject per step, reasoning visible per step, archived reasoning attached to execution record |
| **Autopilot** | Read-only execution trace, escalation points highlighted, intervention affordances only at blocks, mode ceiling enforcement via inline lock |

### 4.3 Asset Work Surface (`/app/content/asset/[id]`)

| Mode | Dominant Affordance |
|------|---------------------|
| **Manual** | Structured section editor, inline CiteMind feedback, entity grounding panel, derivative generation controls |
| **Copilot** | Preview-forward with AI-generated draft, diff view against previous, approval gate before finalization |
| **Autopilot** | Read-only preview, exception callouts (quality issues, gating failures), audit of auto-handled steps |

### 4.4 Brief Work Surface (`/app/content/brief/[id]`)

| Mode | Dominant Affordance |
|------|---------------------|
| **Manual** | Full brief editing, constraint definition, assertion checklist management, citation requirements |
| **Copilot** | AI-generated brief for review, strategic objective explanation, approve/modify workflow |
| **Autopilot** | Brief status overview, escalations only (constraint violations, missing inputs), derivative map status |

---

## 5. Mode-Specific User Flows (Golden Path)

### 5.1 Manual Mode Flow

**Flow 1: Create and Publish Content**
1. User navigates to Work Queue → selects "New Asset"
2. AI state: `idle` (awaiting input)
3. User creates structured content in Asset Editor
4. CiteMind runs inline → shows `passed`/`warning`/`blocked` per section
5. User resolves any CiteMind gates
6. User views derivative panel → generates derivatives manually
7. User clicks Publish → explicit confirmation required
8. AI state remains `idle` throughout; AI observes but never acts

**Flow 2: Manual Prioritization**
1. User views full Work Queue
2. User drags items to reorder priority
3. No AI reasoning shown (user is authority)
4. Explainability available on demand (Level 1 via hover)

### 5.2 Copilot Mode Flow

**Flow 1: AI-Assisted Content Creation**
1. User enters Copilot mode for Content pillar
2. AI state: `evaluating` → scans briefs, deadlines, entity context
3. AI state: `ready` → presents prioritized queue with reasoning badges
4. **Low-confidence gate:** Items with confidence < 0.70 show Manual-required indicator; user must switch to Manual to proceed with those items
5. User selects eligible item → AI proposes plan (brief → draft → review → derivatives)
6. Plan reasoning shown: "Recommended because: [signal], Confidence: 0.87, Risk: Low"
7. User reviews plan steps → approves or modifies
8. AI state: `executing` → generates draft
9. AI state: `ready` → presents draft for approval
10. User reviews draft in preview-forward view
11. CiteMind gating visible → shows `passed` or escalates issues
12. User approves final → **reasoning archived and collapsed** (attached to execution record) → AI generates derivatives
13. **Mode ceiling enforcement:** Publishing shows inline lock + "Switch to Manual to continue" (no modal)

**Flow 2: Brief Review**
1. AI generates brief from strategy inputs
2. AI state: `ready` → presents brief with reasoning
3. User reviews strategic objective, allowed assertions, required citations
4. Explainability Level 2 available: confidence scores per recommendation
5. User approves → **reasoning archived and collapsed** in action history
6. User requests regeneration if needed

**Flow 3: Low-Confidence Fallback**
1. AI evaluates item → confidence = 0.65 (below 0.70 threshold)
2. Item displays Manual-required gate (behavioral gate equivalent to mode ceiling)
3. User cannot approve in Copilot; must switch to Manual mode
4. Reasoning shows: "Confidence below threshold. Manual review required."

### 5.3 Autopilot Mode Flow

**Flow 1: Routine Monitoring**
1. User enters Autopilot mode for Content pillar
2. AI state: `executing` (background operations)
3. **Supervised items count** displayed as ambient indicator: "12 items supervised" (no CTA, no urgency, no pulse)
4. Work Queue shows only: exceptions, failures, escalations
5. "All clear" empty state is valid and expected; supervised count provides proof-of-work
6. **Cross-pillar hooks** shown as READ-ONLY compact summary, collapsed by default; expandable for detail
7. Quality analysis runs automatically → results surface only if issues found
8. Optimization suggestions generated → user sees recommendation cards
9. Audit log shows "auto-handled" ledger with timestamps

**Flow 2: Exception Handling**
1. AI state: `blocked` → CiteMind gate failure detected on scheduled content
2. Exception surfaces in queue with `blocked` state
3. Explainability Level 3 (Causal Chain) shown: "Signal → Analysis → Block reason"
4. User reviews issue → resolves in Manual mode or delegates
5. After resolution, item returns to autopilot flow

**Flow 3: Mode Ceiling Encounter**
1. User attempts Manual-only action (e.g., Publish) while in Autopilot
2. **Inline lock** displayed on action affordance
3. **One-interaction explanation:** "Publishing requires Manual mode for explicit approval"
4. **Call-to-action:** "Switch to Manual to continue"
5. No blocking modal; user retains context and can switch modes in place

**Note:** Per `CONTENT_WORK_SURFACE_CONTRACT.md` Section 7.4, only quality analysis and optimization suggestions are Autopilot-eligible. Draft creation, brief generation, derivative generation, and publishing have lower mode ceilings.

---

## 6. UX Risks if Violated

| # | Risk | Violation Scenario | Impact |
|---|------|---------------------|--------|
| 1 | **Copilot feels like Manual** | Editor is dominant in Copilot; AI reasoning hidden or secondary | Users treat Copilot as a drafting tool, not a decision gate; approval flows bypassed |
| 2 | **Autopilot feels noisy** | Full queue visible in Autopilot; no filtering to exceptions | Users overwhelmed; Autopilot perceived as useless; mode abandoned |
| 3 | **Trust calibration fails** | Confidence shown as raw number without context; risk not communicated | Users cannot make informed approval decisions; over-trust or under-trust AI |
| 4 | **CiteMind gating invisible** | Gating status buried or only shown at publish time | Users discover blocks late; frustration; workarounds that bypass quality gates |
| 5 | **Cross-pillar impact hidden** | Content action affects PR/SEO but no visibility | Users surprised by downstream effects; coordination failures |
| 6 | **Manual mode loses control** | AI reorders queue or auto-suggests prominently in Manual | User mental model violated; trust in mode semantics eroded |
| 7 | **Explainability inaccessible** | "Why?" requires navigation away from context | User cannot understand AI decisions; learned helplessness |
| 8 | **Audit trail incomplete** | Autopilot actions not logged or ledger hidden | Compliance failures; cannot reconstruct what happened; trust lost |
| 9 | **Mode transition invisible** | Switching modes has no perceptible change | Users unaware of mode; behave inappropriately for context |
| 10 | **Progress states ambiguous** | Evaluating looks like Ready looks like Executing | User cannot tell if AI is working or waiting; premature actions or missed windows |
| 11 | **Reversibility unclear** | Irreversible actions (publish) feel casual | Users execute without understanding consequences; brand damage |
| 12 | **Plan steps not inspectable** | Copilot shows outcome but not the plan structure | Users approve black box; cannot verify reasoning; accountability unclear |
| 13 | **Autopilot feels dead** | Supervised items count missing; no proof-of-work visible | Users distrust Autopilot is actually working; revert to lower modes unnecessarily |
| 14 | **Low-confidence items proceed unchecked** | Confidence <0.70 items proceed in Copilot without fallback gate | Users approve items AI is uncertain about; failure rate increases; trust erodes |
| 15 | **Reasoning lost after approval** | Plan reasoning removed instead of archived | Cannot audit why decisions were made; compliance gap; no learning from history |
| 16 | **Mode ceiling feels like error** | Modal blocks user; no explanation of why action requires different mode | Users frustrated; perceive system as broken rather than governed |
| 17 | **Cross-pillar hooks dominate Autopilot** | Hooks shown prominently, expanded by default in Autopilot | Cognitive load increases; exception console becomes cluttered dashboard |

---

## 7. Open Questions

All prior open questions have been resolved. See Resolved Decisions section below.

| # | Question | Impact if Unresolved |
|---|----------|---------------------|
| 1 | **What is the visual treatment for "supervised items" count?** | Implementation detail: typography, placement, icon choice. Does not affect behavior but needs design spec. |
| 2 | **How should the Orchestration Editor route be added to the contract?** | Route is allowed per this spec; formal addition to `CONTENT_WORK_SURFACE_CONTRACT.md` is a procedural follow-up. |

---

## 7.1 Resolved Decisions

The following questions were resolved with product decisions:

| Original Question | Resolution |
|-------------------|------------|
| Should Autopilot show a "supervised items" count even when queue is empty? | **YES.** Display as ambient proof-of-work indicator. No CTA, no urgency, no pulse. |
| When Copilot AI confidence is below 0.70, should the item fall back to Manual automatically or show a warning in Copilot? | **Auto-fallback.** Item auto-falls back to Manual-required posture. Treated as behavioral gate equivalent to mode ceiling. |
| How should the Orchestration Editor surface per mode? | **Allowed execution surface.** Mark `/app/content/orchestrate/[actionId]` as allowed; requires update to `CONTENT_WORK_SURFACE_CONTRACT.md` to formally include. |
| Should cross-pillar hooks in Autopilot be suppressed or read-only? | **READ-ONLY, collapsed by default.** Visible only as compact summary unless expanded. Preserves cross-pillar awareness without adding noise. |
| What is the UX for mode ceiling enforcement? | **Inline lock + one-interaction explanation.** Show lock on action, explain why, offer "Switch to Manual to continue". No blocking modal. |
| Should plan reasoning persist after approval in Copilot? | **Archived and collapsed (never removed).** Attach to action history/execution record for auditability. |

---

## 8. Canon References

This working spec synthesizes the following canonical documents:

| Document | Key Contributions |
|----------|-------------------|
| `AUTOMATION_MODE_CONTRACTS_CANON.md` | Mode definitions, behavioral contracts, non-goals |
| `AUTOMATION_MODES_UX.md` | Mode safety requirements, UX requirements per item |
| `UX_CONTINUITY_CANON.md` | Cross-pillar awareness, explainability, progress feedback invariants |
| `AI_VISUAL_COMMUNICATION_CANON.md` | Perceptual states (idle/evaluating/ready/executing/blocked/escalating), confidence signaling, reversibility |
| `CONTENT_WORK_SURFACE_CONTRACT.md` | Content routes, CiteMind gates, mode ceilings, governance |
| `CITEMIND_SYSTEM.md` | Engine governance, gating requirements, EVI integration |
| `AUTOMATE_EXECUTION_MODEL.md` | Explainability levels, risk classification, confidence thresholds, audit requirements |

---

## 9. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-29 | 0.1 | Initial working spec |
| 2026-01-29 | 0.2 | Resolved open questions: Autopilot proof-of-work, low-confidence fallback, orchestration route, cross-pillar hooks, mode ceiling UX, reasoning persistence |
