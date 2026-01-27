# INFLUENCE FIELD VISUALIZATION

> **Status:** CANONICAL
> **Authority:** This document defines the physics-based visualization model for SAGE and EVI.
> **Classification:** Defensible IP (Trade Secret + Patent Eligible)
> **Dependency:** Extends `/docs/canon/ENTITY-MAP-SAGE.md`, `/docs/canon/SAGE_OPERATING_MODEL.md`
> **Last Updated:** 2026-01-13

---

## 1. Foundational Principle

### 1.1 Visualization as Causal Map

The Influence Field is NOT:
- A decorative graph
- A vanity visualization
- A relationship diagram
- An org chart for entities

The Influence Field IS:
- A **causal map** showing how actions propagate through the visibility ecosystem
- A **physics simulation** where forces, fields, and waves model real influence dynamics
- A **predictive surface** where future effects of actions are visible before execution
- An **operational interface** where selecting an action reveals its influence footprint

### 1.2 Design Philosophy

> **Every visual element encodes operational information.**
>
> If an element cannot be tied to SAGE state, EVI dynamics, or action consequences, it does not belong.

---

## 2. Physics Model

### 2.1 Field Theory Foundation

The visualization treats visibility as a **field** with the following properties:

| Property | Mapping | Visual Representation |
|----------|---------|----------------------|
| **Field Strength** | EVI score | Background intensity |
| **Gradient** | EVI delta direction | Color flow direction |
| **Potential** | Authority level | Node elevation (z-axis or glow intensity) |
| **Flux** | Momentum | Particle flow animation |

### 2.2 Node Physics

Each entity (brand, journalist, outlet, topic, competitor) is a **node** with mass:

```
Node_Mass = f(Authority, Relevance, Connection_Count)
```

| Node Type | Base Mass | Mass Modifiers |
|-----------|-----------|----------------|
| **Brand** (central) | 10.0 | +2.0 per Authority tier |
| **Journalist** | 3.0 | ×outlet_tier (T1=3, T2=2, T3=1) |
| **Outlet** | 5.0 | ×tier_weight |
| **Topic** | 2.0 | ×search_volume_log |
| **Competitor** | 4.0 | ×relative_evi |
| **AI Model** | 4.0 | ×citation_frequency |

Higher mass = more influence, harder to move, attracts more connections.

### 2.3 Edge Physics

Relationships between nodes are **springs** with:

```
Spring_Constant = f(Relationship_Strength, Recency, Activity)
```

| Relationship | Base Spring K | Decay Rate |
|--------------|---------------|------------|
| **covers** (journalist → topic) | 0.8 | 10%/week |
| **writes_for** (journalist → outlet) | 0.9 | 5%/week |
| **competes** (competitor → brand) | 0.6 | 2%/week |
| **cites** (AI → brand) | 0.7 | 8%/week |
| **relates_to** (topic → topic) | 0.5 | 15%/week |

Stiffer springs (higher K) = closer visual proximity, stronger transmission of effects.

### 2.4 Force Types

**Attractive Forces:**
- Connection springs pull related nodes together
- SAGE zone gravity pulls nodes toward their assigned zones
- Activity attraction: recent actions create temporary pull

**Repulsive Forces:**
- Node collision avoidance
- Zone boundary forces
- Competitor repulsion from brand center

**Damping Forces:**
- Energy dissipation prevents perpetual motion
- Stabilizes layout after perturbation

---

## 3. Zone Topology

### 3.1 SAGE Zone Mapping

The visualization space is divided into four zones, each corresponding to a SAGE dimension:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                      AUTHORITY ZONE (A)                        │
│                         [BRAND]                                │
│                    ↑ High Potential ↑                          │
│                                                                │
│     SIGNAL ZONE (S)              │           GROWTH ZONE (G)   │
│     ← Left Field                 │             Right Field →   │
│     Journalists                  │              Topics         │
│     Outlets                      │              AI Models      │
│                                  │              Distribution   │
│                                  │                             │
│                      EXPOSURE ZONE (E)                         │
│                         Competitors                            │
│                    ↓ Low Potential ↓                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Zone Characteristics

| Zone | SAGE Component | Visual Properties | Node Types |
|------|----------------|-------------------|------------|
| **Authority** | A | Central, elevated, stable | Brand |
| **Signal** | S | Left hemisphere, dynamic, fluctuating | Journalists, Outlets |
| **Growth** | G | Right hemisphere, expansive, flowing | Topics, AI Models |
| **Exposure** | E | Bottom, competitive, adversarial | Competitors |

### 3.3 Zone Boundaries

Zones are not rigid walls but **force gradients**:

```
Zone_Force(node, zone) = k × (1 - exp(-d²/2σ²))

Where:
- d = distance from zone center
- σ = zone spread parameter
- k = zone attraction strength
```

Nodes experience increasing force as they drift from their assigned zone, creating soft containment.

---

## 4. Action Ripples

### 4.1 Ripple Mechanics

When an action is taken, it creates a **ripple** that propagates through the field:

```
Ripple(t, r) = A₀ × e^(-λt) × (1/r) × cos(ωt - kr)

Where:
- A₀ = initial amplitude (action impact magnitude)
- λ = temporal decay rate
- r = distance from epicenter
- ω = ripple frequency
- k = spatial frequency
```

### 4.2 Ripple Visualization

**Immediate Effect (0-500ms):**
- Epicenter node pulses with pillar color
- Radial wave expands outward
- Affected nodes glow as wave passes

**Short-term Effect (500ms-2s):**
- Edge connections illuminate in sequence
- Secondary nodes receive attenuated pulse
- Field intensity shifts toward action zone

**Sustained Effect (2s-5s):**
- New equilibrium position calculation
- Nodes drift toward new positions
- Field gradient updates

### 4.3 Cross-Pillar Ripple Propagation

Actions in one pillar create ripples that cross zone boundaries:

| Origin Zone | Propagation | Attenuation |
|-------------|-------------|-------------|
| Signal → Growth | Medium (30%) | -40% per hop |
| Signal → Authority | Strong (50%) | -20% per hop |
| Growth → Signal | Medium (25%) | -50% per hop |
| Growth → Authority | Strong (45%) | -25% per hop |
| Authority → All | Very Strong (70%) | -15% per hop |
| Exposure → Authority | Weak (15%) | -60% per hop |

### 4.4 Ripple Collision

When multiple actions create simultaneous ripples:

**Constructive Interference:**
- Same pillar, same target: Amplitude adds
- Cross-pillar reinforcement: Amplitude multiplies by 1.3×

**Destructive Interference:**
- Conflicting actions (rare): Amplitudes subtract
- System prevents scheduling of directly conflicting actions

---

## 5. Node State Visualization

### 5.1 Node Glow States

Node visual state encodes operational information:

| State | Glow | Meaning |
|-------|------|---------|
| **Inactive** | None | No recent activity, baseline state |
| **Active** | Soft pillar glow | Recent activity in past 7 days |
| **Hot** | Intense pillar glow + pulse | High activity, multiple actions |
| **Targeted** | Arrow indicator + ring | Selected as action target |
| **Affected** | Ripple glow | Receiving effect from action |
| **Critical** | Red pulse | Requires attention (crisis, opportunity) |

### 5.2 Node Size Dynamics

Node size reflects operational weight:

```
Visual_Size = Base_Size × (1 + 0.2 × log(1 + activity_score))
```

| Activity Level | Size Multiplier |
|----------------|-----------------|
| Inactive (0) | 1.0× |
| Low (1-5 actions/week) | 1.1× |
| Medium (6-15 actions/week) | 1.3× |
| High (16+ actions/week) | 1.5× |

### 5.3 Node Connectivity Visualization

Connection importance is shown through edge thickness:

```
Edge_Thickness = Base × (strength × recency_weight)
```

| Strength | Recency | Thickness |
|----------|---------|-----------|
| Strong (>0.7) | Fresh (<7d) | 3px |
| Strong (>0.7) | Aging (7-30d) | 2px |
| Medium (0.4-0.7) | Fresh | 2px |
| Medium (0.4-0.7) | Aging | 1px |
| Weak (<0.4) | Any | 0.5px (dashed) |

---

## 6. Action Preview Mode

### 6.1 Preview Principle

Before executing an action, users see its **influence footprint**:

> When hovering an action in the Action Stream, the Influence Field shows what WILL change if the action executes.

### 6.2 Preview Visualization

**Hovered Action State:**
1. Non-affected nodes dim to 40% opacity
2. Affected nodes highlight with pillar glow
3. Affected edges illuminate
4. Driver node receives special "origin" indicator
5. Predicted ripple path shown as faded wave

**Preview Information Overlay:**
| Element | Shows |
|---------|-------|
| Driver node badge | "This action starts here" |
| Affected node badges | Expected impact magnitude |
| Edge highlights | Relationship that will transmit effect |
| Zone indicators | Which SAGE dimensions affected |

### 6.3 Impact Prediction Display

On hover, each affected node shows predicted change:

```
┌─────────────┐
│ Sarah Chen  │
│ [Journalist]│
│             │
│ Impact: +12%│
│ Via: Pitch  │
└─────────────┘
```

---

## 7. Execution Animation

### 7.1 Execution Sequence

When an action executes, the Influence Field animates:

**Phase 1: Ignition (0-300ms)**
- Driver node contracts slightly then expands
- Pillar-colored pulse ring emits
- "Executing" label appears

**Phase 2: Propagation (300ms-1s)**
- Ripple wave travels outward
- Each affected node pulses as wave passes
- Edges flash in sequence based on transmission delay

**Phase 3: Settling (1s-2s)**
- Nodes drift to new equilibrium positions (if any)
- Field intensity updates
- Affected nodes settle into new glow states

**Phase 4: Confirmation (2s-2.5s)**
- Success checkmark on driver node
- Permanent glow state update
- Edge strength updates become visible

### 7.2 Failure Animation

If action fails:

- Driver node flashes red
- Ripple wave turns red and dissipates
- Affected nodes return to pre-action state
- Error indicator appears

---

## 8. Temporal Views

### 8.1 Time Slider

The Influence Field supports temporal navigation:

| View | Shows |
|------|-------|
| **Now** | Current field state |
| **Past (1d-30d)** | Historical field states, action effects visible |
| **Future (1d-30d)** | Predicted field states based on scheduled actions |

### 8.2 Replay Mode

Historical actions can be "replayed" to show:
- Original field state
- Action execution animation
- Resulting field change
- Attribution of current state to past actions

### 8.3 Forecast Mode

Future view shows:
- Current field fading
- Scheduled actions as pending ripples
- Predicted equilibrium after all actions
- Uncertainty bands (wider = more uncertain)

---

## 9. Interaction Semantics

### 9.1 Node Interactions

| Interaction | Result |
|-------------|--------|
| **Hover node** | Show node details tooltip, highlight connections |
| **Click node** | Focus mode—filter to connected entities |
| **Right-click node** | Context menu with relevant actions |
| **Drag node** | (Disabled) Layout is deterministic |

### 9.2 Edge Interactions

| Interaction | Result |
|-------------|--------|
| **Hover edge** | Show relationship details |
| **Click edge** | Show history of actions affecting this connection |

### 9.3 Zone Interactions

| Interaction | Result |
|-------------|--------|
| **Click zone label** | Filter Action Stream to that SAGE dimension |
| **Hover zone** | Show zone health metrics |

### 9.4 Keyboard Navigation

| Key | Action |
|-----|--------|
| **Arrow keys** | Navigate between nodes |
| **Enter** | Select/focus node |
| **Escape** | Clear focus |
| **1-4** | Jump to zone (1=Authority, 2=Signal, 3=Growth, 4=Exposure) |
| **Space** | Toggle time slider play/pause (in replay mode) |

---

## 10. Performance Constraints

### 10.1 Node Limits

| Constraint | Limit | Rationale |
|------------|-------|-----------|
| **Default visible nodes** | 20 | Cognitive load, performance |
| **Maximum visible nodes** | 50 | WebGL/SVG performance |
| **Edges per node** | Unlimited | Rendered on demand |
| **Active animations** | 5 concurrent | GPU constraints |

### 10.2 Rendering Strategy

```
if (node_count <= 20) {
  render_mode = "full_physics";
  animation = "smooth";
} else if (node_count <= 50) {
  render_mode = "simplified_physics";
  animation = "reduced";
} else {
  render_mode = "static_layout";
  animation = "minimal";
}
```

### 10.3 Level of Detail (LOD)

| Zoom Level | Detail |
|------------|--------|
| **Overview** | Nodes as dots, no labels, zone colors only |
| **Standard** | Nodes with icons, abbreviated labels |
| **Detail** | Full labels, metadata badges, edge labels |
| **Focus** | Single node + connections, full detail |

---

## 11. Accessibility

### 11.1 Screen Reader Support

- All nodes have ARIA labels with name and type
- Connections described as relationship list
- Action previews announced as state changes
- Zone labels are navigational landmarks

### 11.2 Color Independence

- All glow states have accompanying shape/icon indicators
- Edge types distinguished by pattern (solid/dashed/dotted)
- Pillar colors accompanied by pillar icons
- High contrast mode available

### 11.3 Motion Sensitivity

```
if (prefers_reduced_motion) {
  disable_ripple_animations();
  use_instant_transitions();
  show_static_indicators();
}
```

---

## 12. Why This Visualization Matters

### 12.1 Operational Value

| Without Influence Field | With Influence Field |
|------------------------|---------------------|
| Actions feel isolated | Actions show systemic impact |
| Cross-pillar effects invisible | Reinforcement visible |
| Execution is "fire and forget" | Execution is "see and understand" |
| Strategy is abstract | Strategy is spatial and intuitive |

### 12.2 Decision Support

The Influence Field enables:

1. **Impact Prediction**: See what will change before acting
2. **Resource Prioritization**: Focus on high-influence nodes
3. **Gap Identification**: Spot weak connections visually
4. **Competitor Awareness**: See competitive pressure spatially
5. **Trend Detection**: Watch momentum as field dynamics

### 12.3 Differentiation

This visualization is defensible because:

- It requires SAGE operating model (data)
- It requires EVI mathematics (calculation)
- It requires cross-pillar action tracking (operations)
- It requires causal attribution (system architecture)

**No point tool can produce this visualization** because no point tool has the integrated data model.

---

## 13. Governance

### 13.1 Canon Authority

This document specifies visualization behavior. Implementation must match.

### 13.2 Change Control

Modifications require:
1. UX/product review
2. Engineering feasibility assessment
3. Accessibility review
4. Update to dependent specifications

### 13.3 Compliance

Implementations must demonstrate:
- [ ] Zone layout matches SAGE dimensions
- [ ] Ripple animations propagate correctly
- [ ] Action preview shows accurate impact
- [ ] Accessibility requirements met
- [ ] Performance constraints satisfied

---

## 14. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | Initial visualization specification |
