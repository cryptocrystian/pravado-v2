# ENTITY MAP CONTRACT

> **Status:** CANONICAL — FROZEN
> **Authority:** This document defines the semantic contract for the Entity Map component.
> **Classification:** V1 Lock — Changes require formal change control
> **Last Updated:** 2026-01-13

---

## 1. Prime Directive

The Entity Map answers ONE question:

> **"What influence gap is preventing my EVI from increasing, and how does this action close it?"**

Every visual element, every interaction, every state change serves this question. If an element does not help answer this question, it does not belong.

---

## 2. What the Entity Map IS

| Attribute | Definition |
|-----------|------------|
| **Causal Influence Visualization** | Shows how actions propagate influence through the visibility ecosystem |
| **Gap Identifier** | Reveals which relationships are weak, missing, or need reinforcement |
| **Action Impact Preview** | Shows what WILL change before an action executes |
| **EVI Driver Map** | Visualizes how Visibility, Authority, and Momentum connect to entities |
| **SAGE Zone Layout** | Organizes entities by their strategic function (Signal, Authority, Growth, Exposure) |

### 2.1 Core Behaviors (FROZEN)

| Behavior | Specification |
|----------|---------------|
| **Hover Highlighting** | When hovering an action in the Action Stream, affected entities highlight |
| **Execute Pulse** | When an action executes, a ripple pulse propagates from the driver entity |
| **Zone Containment** | Entities stay within their assigned SAGE zones |
| **Stable Layout** | Same seed produces same positions — no random drift |
| **Gap Visualization** | Weak/missing relationships shown as dashed or absent edges |

---

## 3. What the Entity Map IS NOT

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| **NOT a Social Graph** | We don't visualize all connections — only influence relationships |
| **NOT a Network Diagram** | Nodes aren't arranged by connectivity — they're arranged by SAGE zone |
| **NOT Decorative** | Every visual element encodes operational information |
| **NOT Interactive for Navigation** | Clicking entities opens details — doesn't navigate away |
| **NOT a CRM View** | We don't show contact details or communication history |
| **NOT User-Draggable** | Layout is deterministic — users cannot reposition nodes |

---

## 4. Node Taxonomy

### 4.1 Node Types (FROZEN)

| Node Type | Zone | Base Mass | Description |
|-----------|------|-----------|-------------|
| **Brand** | Authority (center) | 10.0 | The user's organization — always present, always central |
| **Journalist** | Signal (left) | 3.0 | Media contacts who cover the brand's space |
| **Outlet** | Signal (left) | 5.0 | Publications and media organizations |
| **Topic** | Growth (right) | 2.0 | Keywords, themes, and subject areas |
| **AI Model** | Growth (right) | 4.0 | AI systems that may cite/reference the brand |
| **Competitor** | Exposure (bottom) | 4.0 | Competing organizations in visibility landscape |

### 4.2 Node Visual Properties

| Property | Encoding |
|----------|----------|
| **Size** | Base size × activity multiplier (1.0× to 1.5×) |
| **Glow** | Activity state (none/soft/intense/pulse) |
| **Ring** | Selection or targeting state |
| **Icon** | Node type identifier |
| **Label** | Entity name (abbreviated at zoom-out) |

---

## 5. Entity States

### 5.1 State Progression (FROZEN)

Entities progress through visibility states that map directly to influence strength:

| State | EVI Contribution | Visual Indicator | Description |
|-------|------------------|------------------|-------------|
| **Invisible** | 0% | Ghost node (20% opacity) | Entity exists but has no relationship to brand |
| **Emerging** | 25% | Faint glow | First contact or weak relationship |
| **Established** | 50% | Solid node, soft glow | Regular interaction, proven relationship |
| **Competitive** | 75% | Strong glow | Strong relationship, consistent reinforcement |
| **Dominant** | 100% | Intense glow + crown indicator | Market-leading relationship strength |

### 5.2 State Transitions

| From | To | Trigger |
|------|-----|---------|
| Invisible | Emerging | First successful action targeting entity |
| Emerging | Established | 3+ successful actions over 30 days |
| Established | Competitive | 10+ successful actions, high response rate |
| Competitive | Dominant | Industry-leading metrics for relationship type |
| Any | -1 State | 90 days without reinforcing activity (decay) |

### 5.3 State and Gap Relationship

The **gap** that prevents EVI increase is the difference between current state and target state:

```
Gap = Target_State - Current_State

If Gap > 0: Entity needs reinforcement
If Gap = 0: Entity is at target
If Gap < 0: Entity exceeds target (rare, may reallocate effort)
```

---

## 6. Relationship Types

### 6.1 Edge Classification (FROZEN)

| Relationship | Visual | Meaning |
|--------------|--------|---------|
| **Verified** | Solid line, full opacity | Confirmed relationship with attribution data |
| **Potential** | Dashed line, 50% opacity | Inferred or targeted relationship |
| **Competitive** | Red-tinted line | Competitor relationship (threat/opportunity) |
| **Decaying** | Fading animation | Relationship losing strength over time |

### 6.2 Edge Properties

| Property | Encoding |
|----------|----------|
| **Thickness** | Relationship strength (0.5px to 3px) |
| **Color** | Relationship type + SAGE zone color |
| **Opacity** | Recency (100% fresh → 50% aging → fade out) |
| **Animation** | Active (pulse during hover/execute), Static (default) |

---

## 7. EVI Driver Mapping

### 7.1 Visual Representation of EVI Components

| EVI Driver | Weight | Zone Mapping | Visual Indicator |
|------------|--------|--------------|------------------|
| **Visibility** | 40% | Signal + Growth zones | Node presence and glow intensity |
| **Authority** | 35% | Authority zone (brand) | Central node size and connection count |
| **Momentum** | 25% | Edge activity | Edge pulse rate and thickness changes |

### 7.2 How Actions Affect Visualization

| Action Type | Visual Effect | EVI Driver Affected |
|-------------|---------------|---------------------|
| **PR Outreach** | Signal zone nodes activate | Visibility |
| **Content Publish** | Growth zone nodes activate | Visibility + Authority |
| **SEO Optimization** | Topic nodes strengthen | Authority |
| **Coverage Earned** | Journalist→Brand edge thickens | Visibility + Authority |
| **AI Citation** | AI Model→Brand edge appears | Authority + Momentum |

---

## 8. Action Stream Integration

### 8.1 Hover Behavior (FROZEN)

When an action in the Action Stream is hovered:

1. **Affected entities highlight** — Nodes receiving impact show pillar-colored glow
2. **Non-affected entities dim** — Opacity reduces to 40%
3. **Affected edges illuminate** — Relationships in impact path highlight
4. **Driver entity marked** — Origin node shows "action starts here" indicator
5. **Impact badges appear** — Each affected node shows expected change magnitude

### 8.2 Execute Behavior (FROZEN)

When an action in the Action Stream executes:

1. **Driver node pulses** — 300ms contraction then expansion
2. **Ripple propagates** — Wave travels outward through affected edges
3. **Affected nodes pulse** — Each node pulses as wave reaches it
4. **Edge strengths update** — Thickness changes reflect new relationship state
5. **Glow states settle** — Nodes transition to post-execution glow levels

### 8.3 Timing Contract

| Phase | Duration | Visual State |
|-------|----------|--------------|
| **Ignition** | 0-300ms | Driver node pulses |
| **Propagation** | 300ms-1s | Ripple travels through graph |
| **Settling** | 1s-2s | Nodes drift to new equilibrium |
| **Confirmation** | 2s-2.5s | Success indicator, final state |

---

## 9. Zone Layout Contract

### 9.1 Zone Positions (FROZEN)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                      AUTHORITY ZONE (A)                        │
│                         [BRAND]                                │
│                    Top-Center Region                           │
│                                                                │
│     SIGNAL ZONE (S)              │           GROWTH ZONE (G)   │
│     Left Hemisphere              │           Right Hemisphere  │
│     • Journalists                │           • Topics          │
│     • Outlets                    │           • AI Models       │
│                                  │           • Distribution    │
│                                  │                             │
│                      EXPOSURE ZONE (E)                         │
│                         Competitors                            │
│                    Bottom Region                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Zone Force Model

Nodes experience soft zone containment through gradient forces:

- Nodes are attracted to their assigned zone center
- Force increases as nodes drift from zone
- Zone boundaries are soft (gradient), not hard walls

---

## 10. Gap Identification Contract

### 10.1 What Constitutes a Gap

A **gap** is a missing or weak relationship that, if strengthened, would increase EVI:

| Gap Type | Visual Indicator | Resolution Action |
|----------|------------------|-------------------|
| **Missing Entity** | Ghost node in potential position | Create relationship |
| **Weak Relationship** | Thin/dashed edge | Strengthen through action |
| **Decaying Relationship** | Fading edge | Reinforce before loss |
| **Competitive Threat** | Red competitor edge thickening | Counter-position |
| **Untapped AI Model** | AI node with no brand edge | Optimize for citation |

### 10.2 Gap-to-Action Mapping

When the Entity Map shows a gap, the Action Stream should contain proposals that close it:

```
Gap Detected → SAGE Generates Proposal → Action Appears in Stream →
Hover Shows Impact on Gap → Execute Closes Gap → Entity State Improves
```

---

## 11. Performance Contract

### 11.1 Node Limits (FROZEN)

| Constraint | Limit | Rationale |
|------------|-------|-----------|
| **Default visible nodes** | 20 | Cognitive load, performance |
| **Maximum visible nodes** | 50 | WebGL/Canvas performance |
| **Active animations** | 5 concurrent | GPU constraints |

### 11.2 Rendering Tiers

| Node Count | Render Mode | Animation Level |
|------------|-------------|-----------------|
| ≤20 | Full physics | Smooth |
| 21-50 | Simplified physics | Reduced |
| >50 | Static layout | Minimal |

---

## 12. Accessibility Contract

### 12.1 Requirements (FROZEN)

| Requirement | Implementation |
|-------------|----------------|
| **Screen Reader** | All nodes have ARIA labels with name, type, and state |
| **Keyboard Navigation** | Arrow keys navigate nodes, Enter selects, 1-4 jump to zones |
| **Color Independence** | States have shape/icon indicators, not just color |
| **Reduced Motion** | Respects `prefers-reduced-motion`, uses instant transitions |

---

## 13. What MUST NOT Change

The following are FROZEN for V1:

1. **Zone layout** — SAGE zones are fixed in position and meaning
2. **Node types** — The 6 node types are complete for V1
3. **Entity states** — The 5-state progression is complete for V1
4. **Hover/execute animations** — Timing and visual contract is locked
5. **Action Stream integration** — Highlighting and pulse behavior is locked
6. **The Prime Directive question** — The map answers ONE question only

---

## 14. Change Control

### 14.1 Modification Requirements

Any change to this contract requires:

1. Product review documenting necessity
2. Impact analysis on dependent systems
3. Canon update through formal process
4. CI gate verification

### 14.2 Allowed Extensions

V2 may extend (not modify):

- Additional node types (must assign to existing zones)
- Additional relationship types (must follow edge visual contract)
- Enhanced animations (must not break timing contract)
- Additional accessibility features (must not reduce current support)

---

## 15. Compliance Checklist

Implementations MUST satisfy:

- [ ] Entities are assigned to correct SAGE zones
- [ ] Hover highlighting activates on Action Stream interaction
- [ ] Execute pulse propagates from driver entity
- [ ] Entity states are visually distinguishable
- [ ] Relationship types use correct visual encoding
- [ ] Performance limits are enforced
- [ ] Accessibility requirements are met
- [ ] Layout is deterministic (same seed = same positions)
- [ ] No navigation occurs on entity click (detail panel only)

---

## 16. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | V1 semantic lock — frozen for release |

