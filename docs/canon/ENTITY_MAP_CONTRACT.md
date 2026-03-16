# ENTITY MAP CONTRACT

> **Status:** CANONICAL — v2.0
> **Supersedes:** v1.0 (2026-01-13) — retired per Decision D012 (2026-02-23)
> **Authority:** This document defines the semantic contract for the Entity Map component.
> **Classification:** Active — Changes require formal change control per CHANGE_CONTROL.md
> **Last Updated:** 2026-02-23

---

## 1. Prime Directive

The Entity Map answers ONE question:

> **"Where does my brand stand in the AI knowledge graph right now, and where are the structural gaps that are preventing authority from reaching AI perceivers?"**

Every visual element, every interaction, every state change serves this question. If an element does not help answer this question, it does not belong. A user must be able to read the strategic state of brand authority in under 5 seconds without clicking anything. If that is not achievable, the design has failed.

---

## 2. Architecture: Concentric Ring Model

The Entity Map uses a **concentric ring architecture** with **affinity-based angular positioning within each ring**. This is not hub-and-spoke (which implies equivalence between all nodes) and not a free-form layout (which lacks structural stability for a daily-use command surface).

### Why Concentric Rings

Ring position encodes **causal role** — the most important attribute in the AEO model. This directionality is the core thesis of the product and the visualization expresses it structurally:

- Ring 1 (Owned) **causes** Ring 2 (Earned)
- Ring 2 (Earned) **enables** Ring 3 (Perceived)

The brand cannot directly control Ring 3. It can only strengthen Rings 1 and 2 until Ring 3 reflects the work. The map makes this causal dependency architecturally visible.

### The Three Rings

#### Ring 0 — Brand Core (Center)
The customer's brand entity. Single node, always centered, always present. Constant low-pulse animation indicates the system is live.

#### Ring 1 — Owned Authority (SEO/Content Pillar)
Topic clusters representing the semantic territory the brand controls directly. Nodes aggregate all content and schema targeting a given topic. Ring 1 is the foundation — without solid Ring 1, Rings 2 and 3 cannot be reliably built.

**Label examples:** "AEO Strategy," "Citation Intelligence," "Entity SEO"

#### Ring 2 — Earned Authority (PR Pillar)
Journalists and publications who create verified edges through mentions and citations. These entities are not controlled by the brand but are influenced through PR and content strategy.

#### Ring 3 — Perceived Authority (AEO Pillar)
AI engine nodes (Perplexity, ChatGPT, Gemini, Claude, Bing Copilot). These perceivers synthesize Rings 1 and 2 into citation behavior and knowledge graph salience. Ring 3 is the **outcome ring** — it reflects the quality of work in Rings 1 and 2.

### Angular Positioning Within Rings

Nodes within each ring are positioned by **affinity score**:

- **Top of ring** = highest affinity / most recently active / strongest verified connection
- **Bottom of ring** = lowest affinity / stale / weakest connection

Positions are stable within a session. Top of the map is always where the brand's strongest connections live; bottom is where the gaps are. Spatial memory is intentional and must be preserved.

---

## 3. Node Taxonomy

### 3.1 Node Types (CANONICAL)

| Node Type | Ring | Description |
|-----------|------|-------------|
| **Brand Core** | 0 | The user's brand entity. Always one, always centered. |
| **Topic Cluster** | 1 | Aggregated content + schema for a semantic topic area. |
| **Journalist** | 2 | Individual media contacts who cover the brand's space. |
| **Publication** | 2 | Media organizations and outlets. |
| **AI Engine** | 3 | AI systems that cite and surface brand content (Perplexity, ChatGPT, Gemini, Claude, Bing Copilot). |

### 3.2 Cluster Nodes (Overflow)

When a ring exceeds **8 nodes**, overflow entities are collapsed into a **cluster node**:

- Label: entity type + count (e.g., "12 Journalists")
- Size: aggregate authority weight of contained entities
- Angular position: weighted average affinity score of contained entities
- Expand/collapse: clicking expands ring in place without layout reflow (300ms animation)
- Clusters are never created for Ring 0 (Brand Core — always one node)

### 3.3 Node Visual Properties

| Property | Encoding |
|----------|----------|
| **Size** | Authority weight (publication reach, schema coverage score, citation rate) |
| **Glow** | Activity state — verified/solid nodes glow, gap nodes do not |
| **Label** | Entity name below node |
| **Type indicator** | Icon within node encodes type |

**Node size is not decorative.** A publication with 10M reach must render visibly larger than a niche blog. Perplexity with a high brand citation rate must render larger than an AI engine with low brand salience.

---

## 4. Edge Semantics

Every edge must represent a **specific, data-backed relationship** — never decorative. If the data doesn't support the edge, the edge is not drawn.

### 4.1 Edge States (CANONICAL)

| State | Visual | Condition |
|-------|--------|-----------|
| **Verified — solid** | Solid line, pillar color, 0.6 opacity | Confirmed, indexed, structured relationship |
| **Verified — pending** | Solid line, pillar color, 0.25 opacity | Verified on authority side, not yet confirmed by a perceiver |
| **Gap** | Dashed line (5px dash, 4px gap), dark gray | SAGE identified this connection should exist but doesn't |
| **In-progress** | Dashed line, pillar color, traveling dash animation | Action executed, awaiting confirmation |

### 4.2 Dashed Line Directional Meaning

Each gap edge tells a different story depending on which ring boundary it spans:

- **Dashed within Ring 1 → Brand Core:** Content gap — topic cluster has insufficient schema coverage
- **Dashed Ring 1 → Ring 2:** Content exists but is not attracting earned media
- **Dashed Ring 2 → Ring 3:** Journalist writes in the brand's space but AI engines are not connecting them to the brand

### 4.3 Edge Weight

Stroke weight encodes relationship strength:
- 0.5px — weak or speculative
- 1px — standard verified connection
- 2px — high-affinity verified connection (affinity score ≥ 85)

### 4.4 Cross-Ring Edges

Cross-ring synergy edges (e.g., journalist → AI engine) are **not shown on the main view**. They are revealed only during **chain illumination** on node interaction. See Section 6.

---

## 5. Main View Contract

The main view (default zoom, no node selected) must be immediately readable. Information shown at this level is strictly limited.

### 5.1 Always Visible

- Three ring structures with boundary labels: "OWNED" / "EARNED" / "PERCEIVED"
- Brand Core node with live pulse
- All active nodes: dot + label
- Radial edge state for each node (solid vs. dashed)
- Node size encoding
- Angular position encoding (affinity rank within ring)

### 5.2 Never Visible Without Interaction

- Cross-ring synergy edges
- Intelligence brief text
- Affinity scores or numeric data
- SAGE recommendations
- Action Stream items
- Citation details
- Reach / authority numbers

### 5.3 The 5-Second Test

A user must be able to answer within 5 seconds:
1. Is the brand strongly connected to AI engines? (Ring 3 edge states)
2. Where are the biggest gaps? (Dashed edge density and position)
3. Which ring is structurally weakest? (Relative solid vs. dashed per ring)

If the answer to any of these requires clicking or reading labels, the layout or sizing has failed.

---

## 6. Interaction Contract

### 6.1 Chain Illumination (Node Click) — CANONICAL

Clicking any satellite node triggers chain illumination:

1. All non-connected nodes dim to 20% opacity (200ms)
2. Clicked node scales to 1.3×, label turns white (200ms ease-out)
3. Its radial edge to the Brand Core illuminates at full brightness
4. All Ring 1 topic cluster nodes that contributed to this node's connection illuminate (80ms stagger per hop)
5. All Ring 3 nodes that this node feeds into illuminate
6. Cross-ring synergy edges between the illuminated chain appear as bright connections
7. Progressive disclosure panel slides in from the right (250ms ease-out)

Clicking the same node again dismisses illumination and closes the panel. Clicking a different node while one is selected transitions directly.

### 6.2 Progressive Disclosure Panel — CANONICAL

Slides in from the right edge of the canvas on node click. Fixed width: 280px.

```
[NODE TYPE BADGE]  [NODE NAME]              [✕ CLOSE]

REACH              AFFINITY SCORE
[value]            [value — JetBrains Mono]

CONNECTION STATUS
[Edge state description — specific, not generic]

INTELLIGENCE BRIEF
[SAGE entity_insight field — one sentence, entity-specific,
must reference at least one measurable signal. Max 160 chars.
Generic text is a SAGE output quality failure.]

PILLAR IMPACT
[PR → AEO]  [One-line causal explanation]

RELATED ACTION
[→ Action Stream item title]    [OPEN ACTION]

[TARGET NODE — CTA]
```

**Coherence requirement:** The RELATED ACTION field must always link to an existing Action Stream record. Every node on the map has a corresponding Action Stream record. This is enforced by AUTOMATE (see Section 8). A node with no linked Action Stream record is a system error, not an acceptable state.

### 6.3 Hover State

Scale to 1.1×, label brightens, tooltip shows node type and affinity score only. No panel, no illumination. 150ms ease-out.

### 6.4 Zoom Levels

| Level | Zoom | Content |
|-------|------|---------|
| **Overview (default)** | 1× | All rings, 8–15 nodes, ring labels |
| **Sector** | 1.5–2× | One or two rings, secondary nodes visible |
| **Node** | 3× | Node neighborhood, connections within 2 hops |

Standard pan behavior when zoomed in. Node positions remain relative to ring structure.

---

## 7. Animation Contract

Animation is **event-driven and surgical**. Every animation communicates a specific state change or system event. No ambient animation except the Brand Core pulse.

### 7.1 Permitted Animations (CANONICAL)

**Brand Core pulse:** Constant, 3s cycle, opacity 0.15 → 0, inward ring expansion. Communicates system-live. Must be subtle enough to register subconsciously without drawing the eye on any given look at the map.

**Session-load citation event particle:** When CiteMind has detected new citations since the last session, a particle travels from the relevant Ring 2 node toward the relevant Ring 3 node (1.5s), then a second particle travels from Ring 3 toward the Brand Core (1.5s). Total: 3s. Fires once per new citation event on session load. Also fires on manual refresh trigger in the map toolbar. Does NOT fire as a continuous live stream — CiteMind scan latency is 1–24 hours and the animation must be honest about data freshness.

**Dashed-to-solid transition:** When AUTOMATE confirms an action has produced a verified connection, the edge animates from dashed to solid over 2.5s. Color intensifies, opacity rises, dash gaps fill in progressively from the Brand Core outward. This is the payoff moment of the orchestration loop.

**In-progress traveling dash:** For in-progress edge state, a dash travels along the edge path continuously (2s loop, pillar color). Stops immediately when confirmation fires and triggers dashed-to-solid transition.

**Chain illumination reveal:** 200ms dim for non-connected nodes. 300ms for synergy chain with 80ms stagger per hop. Panel slides in 250ms ease-out.

**Node selection scale:** 200ms ease-out. Never use bounce or spring physics.

### 7.2 Prohibited Animations (CANONICAL)

- Ambient floating, bobbing, or breathing on any node except Brand Core
- Continuous particle effects not tied to a real CiteMind event
- Color cycling or gradient shifting on any node
- Multiple elements animating continuously simultaneously (except Brand Core pulse)
- Any user-initiated interaction transition longer than 500ms
- Animations implying real-time data when CiteMind operates on a daily scan cycle

---

## 8. Action Stream Coherence Contract

### 8.1 Single Source of Truth

SAGE produces one proposal object per insight. AUTOMATE materializes it as one Action Stream record. That record is the canonical item that appears in all contexts:

| Context | Behavior |
|---------|----------|
| Command Center Action Stream | Unfiltered. All pillars. Sorted by `priority_score` descending. |
| Surface Action Streams (PR, Content, SEO) | Same records, filtered to `pillar`. Same title, same score. |
| Entity Map Progressive Disclosure | Same record surfaced via `linked_entity_id`. Same title, same score. |

The title, priority score, and status of an Action Stream record must be **identical** everywhere it appears. Any discrepancy is a critical bug.

### 8.2 AUTOMATE as Record Creator

Trigger chain:
1. SAGE detects gap → emits `gap_node_detected` event (`entity_id`, `ring`, `pillar`, `proposal_id`)
2. AUTOMATE subscribes → creates Action Stream record
3. Status: `Priority` if SAGE confidence ≥ 0.7, `Pending` otherwise
4. AUTOMATE writes `linked_entity_id` back to entity node record

There are no "map-only" recommendations. Every gap node on the map has a corresponding Action Stream record. This is an architectural invariant, not a UX preference.

### 8.3 Cross-Pillar Impact Metadata

Every Action Stream record carries `impact_pillars: string[]` — the full array of pillars impacted beyond the primary pillar. This enables:

- Pillar impact badges in the Action Stream ("SEO → AEO")
- SAGE cross-pillar attribution in Analytics
- Entity Map progressive disclosure "PILLAR IMPACT" row

This metadata must be present in the data model from V1 even if not all consumers use it immediately.

---

## 9. Tab Structure: Intelligence Canvas

The center canvas has three tabs. Three is the maximum.

| Tab | Owner | Job |
|-----|-------|-----|
| **ENTITY_MAP** | AEO pillar | Concentric ring territory visualization. Default. |
| **ORCHESTRATION_EDITOR** | Content pillar | Distraction-free editor with ghost text and entity checklist. |
| **SYNERGY_FLOW** | Cross-pillar | Sankey-style cross-pillar authority flow. V2. |

SYNERGY_FLOW is a V2 tab. It must not show fake or static data in V1. Label: "Coming Soon" with no stub UI.

---

## 10. Surface Relationships

The Entity Map is the connective tissue across all surfaces. Each surface sees the map filtered to its pillar context.

| Surface | Map View |
|---------|----------|
| **Command Center** | Full three-ring map. All tabs available. |
| **PR Surface** | Filtered: Ring 2 (journalists, publications) + Ring 3 connections. |
| **Content Surface** | Filtered: Ring 1 (topic clusters) + Ring 2 pull signals. |
| **SEO Surface** | Filtered: Ring 1 with schema status and structured data coverage. |
| **Analytics** | Does not display the map. Presents same data as trend lines and attribution over time. |

---

## 11. Performance Contract

### 11.1 Node Limits (CANONICAL)

| Constraint | Limit | Behavior at Limit |
|------------|-------|-------------------|
| Nodes per ring before clustering | 8 | Overflow → cluster node |
| Maximum expanded nodes per ring | 20 | Hard cap — pagination if exceeded |
| Active animations simultaneously | 3 | Queue additional animations |

### 11.2 Rendering Requirements

- Layout is **deterministic**: same data produces same angular positions
- No position recalculation during interaction
- No auto-zoom or auto-pan without explicit user input
- Node positions lock after initial render

---

## 12. Accessibility Contract

| Requirement | Implementation |
|-------------|----------------|
| Screen Reader | All nodes have ARIA labels: name, type, ring, and connection state |
| Keyboard Navigation | Arrow keys navigate nodes by ring, Enter selects, Tab advances |
| Color Independence | Connection states have shape/dash indicators, not color alone |
| Reduced Motion | `prefers-reduced-motion` respected: instant transitions, no particles |

---

## 13. What MUST NOT Change Without Change Control

1. **Ring structure** — Three rings with fixed causal meaning (Owned / Earned / Perceived)
2. **Node types** — Five types are complete for V1
3. **Edge states** — Four states with exact conditions are locked
4. **Animation prohibitions** — No ambient animation on satellites
5. **Action Stream coherence invariant** — Every map node has a linked Action Stream record
6. **The Prime Directive question** — The map answers ONE question
7. **Progressive disclosure panel** — Field structure and coherence requirement
8. **5-Second Test** — Main view readability requirement

---

## 14. CI Guardrail Updates Required

File: `scripts/check-entity-map-spec.mjs`

### Remove (no longer prohibited)
- `forceSimulation` — force-directed positioning within rings is now permitted

### Add Required Patterns
| File | Pattern | Description |
|------|---------|-------------|
| `EntityMap.tsx` | `entity-map-v3` | Version marker |
| `EntityMap.tsx` | `ring_position` | Ring-based node placement |
| `EntityMap.tsx` | `affinity_score` | Affinity-based angular positioning |
| `EntityMap.tsx` | `chain_illumination` | Chain illumination interaction |
| `EntityMap.tsx` | `cluster_node` | Cluster node overflow handling |
| `types.ts` | `ring:` | Ring assignment on node type |
| `types.ts` | `affinity_score` | Affinity score field |
| `types.ts` | `linked_action_id` | Action Stream coherence field |
| `types.ts` | `entity_insight` | SAGE intelligence brief field |

### Retain Forbidden Patterns
| File | Pattern | Reason |
|------|---------|--------|
| `EntityMap.tsx` | `useLayoutEffect.*position` | No position recalculation during interaction |
| `EntityMap.tsx` | `zoom.*auto` | No auto-zoom |

---

## 15. Compliance Checklist

Implementations MUST satisfy:

- [ ] Three concentric rings with fixed causal assignment (Owned / Earned / Perceived)
- [ ] Brand Core node always centered with live pulse
- [ ] Node size encodes authority weight
- [ ] Angular position within ring encodes affinity score
- [ ] Ring 1 nodes are topic clusters, not individual content pieces
- [ ] Cluster nodes created at >8 nodes per ring
- [ ] Edge states (verified/pending/gap/in-progress) visually distinguishable
- [ ] Dashed edges present for all gap nodes
- [ ] Chain illumination fires on node click with correct stagger
- [ ] Cross-ring synergy edges revealed only during chain illumination
- [ ] Progressive disclosure panel includes `entity_insight` from SAGE proposal
- [ ] Every node has a `linked_action_id` pointing to an Action Stream record
- [ ] Session-load citation particle animation is event-driven, not continuous
- [ ] No ambient animation on satellite nodes
- [ ] Layout is deterministic — same data produces same positions
- [ ] No position recalculation during interaction
- [ ] 5-Second Test passes for main view
- [ ] Accessibility requirements met
- [ ] CI guardrail passes

---

## 16. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | V1 semantic lock — SAGE zone model, frozen for release |
| 2026-02-23 | 2.0 | Superseded per D012–D017: concentric ring architecture, event-driven animation, cluster nodes, topic cluster Ring 1, AUTOMATE record creation, SAGE entity_insight field |
