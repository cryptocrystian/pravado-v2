# AI VISUAL COMMUNICATION CANON

> **Status:** CANONICAL
> **Authority:** This document defines how AI state, intent, and confidence are visually communicated across Pravado.
> **Classification:** Design Principles Specification
> **Last Updated:** 2026-01-28

---

## 1. Design Philosophy

### 1.1 Motion Is Communication

Visual behavior in Pravado is not decoration. It is information.

Every motion must answer at least one of these questions:
- What is the AI doing?
- How certain is it?
- Is this action reversible?
- Does this require my attention?
- Is the system progressing or blocked?

If a motion answers none of these questions, it should not exist.

### 1.2 AI as Visible Partner

Users must always know when AI is involved in an operation. The system must never:
- Perform AI operations invisibly
- Obscure the boundary between human and AI actions
- Present AI outputs as if they appeared instantaneously without process

AI involvement must be perceptible through visual behavior alone, without requiring labels or explanations.

### 1.3 Legibility Over Aesthetics

When visual appeal conflicts with legibility of system state, legibility wins.

A user glancing at the interface for one second should be able to determine:
- Whether the system is idle or working
- Whether attention is required
- Whether an operation is progressing normally

---

## 2. AI Perceptual States

The following semantic states must be visually distinguishable. These are not UI component states—they are perceptual categories that users must be able to identify without reading text.

### 2.1 State Definitions

| State | Semantic Meaning | User Perception |
|-------|------------------|-----------------|
| **Idle** | No AI activity in progress | System is waiting for input |
| **Evaluating** | AI is analyzing, but no output yet | System is working; outcome unknown |
| **Ready** | AI has reached a conclusion with confidence | System has a recommendation |
| **Executing** | AI is performing an approved action | Irreversible change in progress |
| **Blocked** | AI cannot proceed without intervention | User action required |
| **Escalating** | Urgency has increased; window is closing | Immediate attention warranted |

### 2.2 State Transition Rules

- Transitions between states must be perceptible. Instantaneous state changes are prohibited.
- The visual distinction between Evaluating and Executing must be unambiguous.
- Blocked and Escalating must be visually distinct from each other. Blocked is static; Escalating implies time pressure.
- Idle must be the absence of activity indicators, not a distinct animation.

### 2.3 State Hierarchy

When multiple AI operations occur simultaneously, the most urgent state takes visual precedence:

```
Escalating > Blocked > Executing > Evaluating > Ready > Idle
```

---

## 3. Confidence & Trust Signaling

### 3.1 Confidence Levels

AI confidence must be communicated through visual behavior, not just numeric scores. The following confidence tiers must be visually distinguishable:

| Level | Meaning | Visual Implication |
|-------|---------|-------------------|
| **High** | AI is certain; user can trust the recommendation | Stable, settled presentation |
| **Moderate** | AI has a recommendation but acknowledges uncertainty | Indicates room for user judgment |
| **Low** | AI is uncertain; user review is essential | Signals that human input is critical |

### 3.2 Reversibility Signaling

Users must be able to perceive whether an action is reversible before committing.

| Action Type | Visual Behavior Principle |
|-------------|--------------------------|
| **Reversible** | Lower visual weight; can proceed quickly |
| **Irreversible** | Higher visual weight; must pause before commitment |

The system must never allow irreversible actions to feel casual.

### 3.3 Safety Gradient

Risk must be perceptible through visual intensity:

- Low-risk operations present with minimal visual emphasis
- High-risk operations demand visual acknowledgment before proceeding
- The escalation in visual intensity must be proportional to actual risk

---

## 4. Temporal Awareness

### 4.1 Freshness

Data and recommendations have a temporal validity. Visual behavior must communicate:

| Freshness | Meaning |
|-----------|---------|
| **Current** | Data is recent and reliable |
| **Stale** | Data may no longer reflect reality |
| **Expired** | Data should not be trusted without refresh |

Stale and expired states must be visually distinct without requiring the user to check timestamps.

### 4.2 Urgency Without Anxiety

Time-sensitive actions must communicate urgency through visual behavior. However:

- Urgency must be proportional to actual consequence
- The system must never manufacture false urgency
- Visual urgency must decrease when the user engages with the item

### 4.3 Progress Indication

For operations with duration:

- Progress must be visible and continuous
- Indeterminate progress (unknown duration) must be visually distinct from determinate progress (known duration)
- Stalled progress must be visually distinct from active progress

---

## 5. Mode Expression Through Motion

### 5.1 Mode Differentiation Principle

Manual, Copilot, and Autopilot modes must feel different through visual behavior alone.

Users should be able to identify the active mode by observing how the interface responds, not by reading mode labels.

### 5.2 Mode Characteristics

| Mode | User Control | AI Involvement | Visual Character |
|------|--------------|----------------|------------------|
| **Manual** | Full | None | Direct, immediate response to user input |
| **Copilot** | Approval required | Preparation and suggestion | AI activity visible; actions await user confirmation |
| **Autopilot** | Exception-based | Autonomous execution | AI activity visible; user monitors rather than directs |

### 5.3 Mode Invariants

- In Manual mode, AI activity indicators must never appear for user-initiated actions
- In Copilot mode, the distinction between "AI suggestion" and "user-approved action" must be visually clear
- In Autopilot mode, autonomous actions must be visually attributable to the system, not ambiguous

### 5.4 Mode Transition

When mode changes:
- The interface must visually acknowledge the transition
- The new mode's visual character must apply immediately to subsequent actions
- In-flight operations retain the visual character of the mode under which they started

---

## 6. Cross-Pillar Consistency Rules

### 6.1 Invariants

The following principles must hold across all pillars (Content, PR, SEO, Command Center, CiteMind, Ads):

| Principle | Requirement |
|-----------|-------------|
| **State legibility** | The six perceptual states must be recognizable in any context |
| **Confidence signaling** | High/Moderate/Low confidence must use consistent visual language |
| **Mode expression** | Manual/Copilot/Autopilot must feel consistent regardless of pillar |
| **Urgency calibration** | Equivalent urgency levels must produce equivalent visual intensity |
| **Reversibility signaling** | Reversible and irreversible actions must be distinguishable everywhere |

### 6.2 Pillar-Specific Adaptation

Pillars may adapt visual behavior for context-specific needs, provided:

- The adaptation does not contradict the invariants above
- The adaptation is documented as a pillar-specific extension
- Cross-pillar surfaces (Command Center, cross-pillar hooks) use only invariant behaviors

### 6.3 Accent Color Independence

AI visual communication must not depend on pillar accent colors for semantic meaning. Accent colors indicate pillar identity, not AI state.

---

## 7. Anti-Patterns

The following patterns are explicitly forbidden.

### 7.1 Decorative Motion

Motion that exists for visual interest but communicates no system state.

**Violation:** Animation that plays on load but conveys nothing about readiness or activity.

### 7.2 Theatrical Animation

Motion that is dramatic, surprising, or attention-seeking beyond what the semantic state requires.

**Violation:** Celebratory animations for routine completions.

### 7.3 Mode-Specific Animation Themes

Distinct animation styles per mode that create inconsistency rather than clarity.

**Violation:** Copilot mode uses bouncy animations while Autopilot uses sharp animations.

### 7.4 Manufactured Urgency

Visual urgency applied to situations that are not time-sensitive.

**Violation:** Pulsing indicators on items with no deadline.

### 7.5 Hidden Uncertainty

Visual presentation that implies confidence when the system is uncertain.

**Violation:** Displaying AI recommendations with high-confidence styling when confidence is actually low.

### 7.6 Instantaneous State Changes

State transitions that occur without perceptible visual change.

**Violation:** Switching from Evaluating to Ready with no transition.

### 7.7 Ambiguous AI Attribution

Visual presentation that obscures whether an action was performed by the user or the AI.

**Violation:** AI-generated content appearing identically to user-entered content.

### 7.8 Progress Without Information

Progress indicators that move but do not reflect actual progress.

**Violation:** A progress bar that animates continuously regardless of operation state.

---

## 8. Compliance Evaluation

### 8.1 Compliance Levels

When evaluating UI/UX changes against this canon:

| Level | Definition |
|-------|------------|
| **Compliant** | All applicable principles are satisfied |
| **Partial Compliance** | Some principles satisfied; violations are minor or in transition |
| **Violation** | Core principles are contradicted |

### 8.2 Evaluation Criteria

For each UI element involving AI:

1. Can the user identify the AI perceptual state without reading labels?
2. Is confidence level visually communicated?
3. Is reversibility apparent before action?
4. Does urgency match actual time sensitivity?
5. Is the active mode perceptible through visual behavior?
6. Are cross-pillar invariants preserved?

### 8.3 Incremental Adoption

This canon permits incremental adoption. Existing implementations may be partially compliant during transition periods. New implementations must target full compliance.

---

## 9. Governance

### 9.1 Canon Authority

This document is authoritative for AI visual communication. When conflicts arise with other specifications, this canon takes precedence for AI-related visual behavior.

### 9.2 Amendment Process

To modify this canon:
1. Create PR with proposed changes
2. Tag as `canon-amendment`
3. Require product and design review
4. Update revision history

### 9.3 Implementation Guidance

This canon defines principles only. Implementation details (timing, easing, specific animations) are defined in:
- `DS_v3_1_EXPRESSION.md` (motion tokens)
- Pillar-specific work surface contracts (component behavior)

---

## 10. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-28 | 1.0 | Initial AI Visual Communication Canon |
