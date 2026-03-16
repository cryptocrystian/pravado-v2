# ENTITY_MAP_SPEC.md
## Pravado v2 — Intelligence Canvas: Entity Map
**Version:** 2.0
**Status:** Canonical
**Owner:** Product
**Last Updated:** 2026-02-23
**Decisions:** D012, D013, D014, D015, D016, D017
**See Also:** `ENTITY_MAP_CONTRACT.md` v2.0, `ENTITY-MAP-SAGE.md` v3.0

---

## 1. Purpose & Strategic Role

The Entity Map is the primary visual intelligence instrument of the Command Center. It is not a reporting chart. It is a live, interactive representation of the brand's **knowledge graph positioning** — how the brand is perceived, connected to, and cited by the entities that determine AI-engine authority.

### The Core Question It Answers
> "Where does my brand stand in the AI knowledge graph right now, and where are the structural gaps preventing authority from reaching AI perceivers?"

This question cannot be answered by a ranked list or a score. It requires spatial, relational, and directional visualization. The map provides that. A user should be able to read the strategic state of their brand's authority in under 5 seconds without clicking anything. If that's not achievable, the design has failed.

### Why This Is Differentiated
Competitors show **scores** — abstract numbers that tell you where you are but not why or what to do. Pravado shows **territory** — a knowledge graph that makes authority gaps structurally visible and connects them directly to executable actions. The goal for the user is to colonize the map: converting dashed (gap) edges to solid glowing connections across all three rings.

### Relationship to SAGE, AUTOMATE, and CiteMind
- **SAGE** generates the proposals that explain what to do about each node relationship. Proposals surface in the Action Stream and as the `entity_insight` field in node-level progressive disclosure.
- **AUTOMATE** executes actions and materializes Action Stream records. When SAGE detects a new gap node, AUTOMATE creates the corresponding Action Stream record and writes `linked_action_id` back to the entity node — this is the coherence enforcement mechanism.
- **CiteMind** runs daily citation scans and emits `SessionCitationEvent` objects when new citations are detected. The map animates these on session load — not as a continuous live stream.
- The Entity Map is the **visual proof** that SAGE, AUTOMATE, and CiteMind are working together. It shows the outcomes of the full orchestration loop.

---

## 2. Structural Model: Concentric Rings

The Entity Map uses a **concentric ring architecture** with **affinity-based angular positioning within each ring**.

### Why Concentric Rings
Ring position encodes **causal role** — the most important attribute in the AEO model. Ring 1 causes Ring 2. Ring 2 enables Ring 3. This directionality is the core thesis of the product and the visualization expresses it structurally. The zone-based model (previously canonical in ENTITY_MAP_CONTRACT v1.0) treated all nodes as equivalently related to the brand center, which misrepresented the causal thesis. The concentric ring model supersedes it (D012).

### The Three Rings

#### Ring 0 — Brand Core (Center)
The customer's brand entity. Single node, always centered, always present. Constant low-pulse animation indicates the system is live.

#### Ring 1 — Owned Authority (SEO/Content Pillar)
**Topic clusters** — not individual content pieces. Each cluster node aggregates all content and schema markup targeting a given semantic topic area. Ring 1 is the foundation. Without solid Ring 1, Rings 2 and 3 cannot be reliably built.

**Why topic clusters, not individual content pieces (D017):** An active account publishes hundreds of content pieces quickly. Individual-piece nodes would overflow into meaningless cluster nodes before the map provides strategic value. Topic clusters represent the authority territory the brand is building — the correct unit of analysis for Ring 1. SAGE builds authority around topics, not URLs. Individual content pieces are accessible via progressive disclosure.

**Topic cluster node properties:**
- `authority_weight` = aggregate schema coverage score across all content in cluster
- `affinity_score` = weighted average affinity score of contained content pieces
- Label = topic cluster name (e.g., "AEO Strategy," "Citation Intelligence," "Entity SEO")
- Progressive disclosure lists individual content pieces with schema and indexing status

#### Ring 2 — Earned Authority (PR Pillar)
Journalists and publications who create verified edges through mentions and citations. The brand influences these entities through PR and content strategy but does not control them.

#### Ring 3 — Perceived Authority (AEO Pillar)
AI engine nodes — Perplexity, ChatGPT, Gemini, Claude, Bing Copilot. These perceivers synthesize Rings 1 and 2 into citation behavior and knowledge graph salience. The brand cannot directly control Ring 3; it can only strengthen Rings 1 and 2 until Ring 3 reflects the work.

### Angular Positioning Within Rings
Within each ring, angular position encodes affinity score:
- **Top of ring** = highest affinity / most recently active / strongest verified connection
- **Bottom of ring** = lowest affinity / stale / weakest connection

Positions are stable within a session. Users develop spatial memory — top of the map is always where the strongest connections live; bottom is where the gaps are.

---

## 3. Node Taxonomy

### Node Types

| Type | Ring | Size Encoding | Label Example |
|------|------|---------------|---------------|
| Brand Core | 0 | Fixed (88px) | "Pravado" |
| Topic Cluster | 1 | Aggregate schema coverage | "AEO Strategy" |
| Journalist | 2 | Reach × Affinity | "Sarah Chen" |
| Publication | 2 | Domain Authority | "The Verge" |
| AI Engine | 3 | Citation rate for brand | "Perplexity" |

**Node size is not decorative.** The Verge must render visibly larger than a niche blog. Perplexity with a high brand citation rate must render larger than an AI engine with low salience. These differences must be readable at default zoom.

### Cluster Nodes (Overflow at >8 per ring) — D014

When a ring exceeds 8 nodes, overflow entities collapse into a cluster node:
- **Label:** entity type + count (e.g., "12 Journalists")
- **Size:** aggregate authority weight of contained entities
- **Angular position:** weighted average affinity score of contained entities
- **Expand/collapse:** clicking expands ring in place without layout reflow (300ms animation)
- Clusters communicate "good problem to have" — density is a signal, not clutter
- Never created for Ring 0 (always one node)

---

## 4. Edge Semantics

Every edge represents a specific, data-backed relationship. If the data doesn't support the edge, the edge is not drawn.

### Edge States

| State | Visual | Condition |
|-------|--------|-----------|
| **Verified — solid** | Solid line, pillar color, 0.6 opacity | Confirmed, indexed, structured relationship |
| **Verified — pending** | Solid line, pillar color, 0.25 opacity | Verified on authority side, not yet confirmed by a perceiver |
| **Gap** | Dashed line (5px dash, 4px gap), dark gray | SAGE identified this connection should exist but doesn't |
| **In-progress** | Dashed line, pillar color, traveling dash | Action executed, awaiting AUTOMATE confirmation |

### Dashed Line Directional Meaning
Each gap edge tells a different story:
- **Within Ring 1 → Core:** Content gap — topic cluster has insufficient schema coverage
- **Ring 1 → Ring 2:** Content exists but is not attracting earned media
- **Ring 2 → Ring 3:** Journalist writes in the brand's space but AI engines aren't connecting them to the brand ("Silo Tax")

### Edge Weight
- 0.5px — weak or speculative
- 1px — standard verified connection
- 2px — high-affinity verified (affinity ≥ 85)

### Cross-Ring Edges
Synergy edges (journalist → AI engine, topic cluster → AI engine) are **not shown on the main view**. They are revealed only during chain illumination on node interaction.

---

## 5. Main View: What Is Always Visible

### Always Visible
- Three ring structures with boundary labels: "OWNED" / "EARNED" / "PERCEIVED"
- Brand Core node with live pulse
- All active nodes: dot + label
- Radial edge state for each node (solid vs. dashed)
- Node size encoding (authority weight)
- Angular position encoding (affinity rank within ring)

### Never Visible Without Interaction
- Cross-ring synergy edges
- Intelligence brief text
- Affinity scores or numeric data
- Action Stream items
- Citation details

### The 5-Second Test
A user must be able to answer within 5 seconds, without clicking:
1. Is the brand strongly connected to AI engines? (Ring 3 edge states)
2. Where are the biggest gaps? (Density and position of dashed edges)
3. Which ring is structurally weakest? (Relative solid vs. dashed density per ring)

---

## 6. Interaction Model

### Node Click: Chain Illumination
1. All non-connected nodes dim to 20% opacity (200ms)
2. Clicked node scales to 1.3×, label turns white (200ms ease-out)
3. Its radial edge to Brand Core illuminates at full brightness
4. All Ring 1 topic clusters that contributed to this node's connection illuminate (80ms stagger per hop outward)
5. All Ring 3 nodes this node feeds into illuminate
6. Cross-ring synergy edges between the illuminated chain appear
7. Progressive disclosure panel slides in from right (250ms ease-out)

Clicking the same node again dismisses and closes. Clicking a different node while one is selected transitions directly.

### Progressive Disclosure Panel

Fixed width 280px. Slides in from right on node click.

```
[NODE TYPE BADGE]  [NODE NAME]              [✕ CLOSE]

REACH              AFFINITY SCORE
[value]            [value — JetBrains Mono]

CONNECTION STATUS
[Specific edge state description]

INTELLIGENCE BRIEF
[SAGE entity_insight — one sentence, entity-specific,
must reference the entity + at least one measurable
signal. Max 160 chars. Required field (D015).]

PILLAR IMPACT
[PR → AEO]  [One-line causal explanation]

RELATED ACTION
[→ Action Stream item title]    [OPEN ACTION]

[TARGET NODE — CTA]
```

Every node on the map has a linked Action Stream record. If RELATED ACTION has no record, it is a system error.

### Hover State
Scale 1.1×, label brightens, tooltip shows node type and affinity score. 150ms ease-out. No panel, no illumination.

### Zoom Levels

| Level | Zoom | Content |
|-------|------|---------|
| Overview (default) | 1× | All rings, 8–15 nodes, ring labels |
| Sector | 1.5–2× | One or two rings fill canvas, secondary nodes visible |
| Node | 3× | Node neighborhood, connections within 2 hops |

---

## 7. Animation Rules

### The Governing Principle — D013
Animation is **event-driven and surgical**. CiteMind runs daily citation scans with 1–24 hour latency depending on AI engine. Animations that imply real-time data would be dishonest. All citation-event animations fire on session load (for new events since last session) and on manual refresh. They do not fire continuously.

### Permitted Animations

**Brand Core pulse:** 3s cycle, opacity 0.15 → 0, inward ring expansion. Subtle enough to register subconsciously. The only continuous animation in the product.

**Session-load citation particle (D013):** When CiteMind has detected new citations since the last session, a particle travels from the Ring 2 source node toward the Ring 3 perceiver node (1.5s), then a second particle from Ring 3 toward the Brand Core (1.5s). Total: 3s per event. Fires once per new citation event on session load. Also fires on manual refresh from map toolbar. Correctly communicates "here's what changed since you were last here."

**Dashed-to-solid transition:** When AUTOMATE confirms a verified connection, the edge animates dashed → solid over 2.5s. Color intensifies, opacity rises, gaps fill progressively from Brand Core outward. The payoff moment of the orchestration loop — must feel earned.

**In-progress traveling dash:** Continuous 2s loop dash in pillar color on in-progress edges. Stops the instant AUTOMATE confirmation fires.

**Chain illumination reveal:** 200ms dim / 300ms chain with 80ms stagger / 250ms panel ease-out.

**Node selection scale:** 200ms ease-out. No bounce. No spring.

### Prohibited Animations
- Ambient motion on satellite nodes (floating, bobbing, breathing)
- Continuous particle effects not tied to a `SessionCitationEvent`
- Color cycling or gradient shifting
- Multiple elements animating continuously at the same time (except Brand Core pulse)
- User-initiated transitions longer than 500ms
- Any animation that implies real-time data when CiteMind data is not real-time

---

## 8. Tab Structure: Intelligence Canvas

Three tabs. Three is the ceiling.

| Tab | Pillar Color | Job |
|-----|-------------|-----|
| **ENTITY_MAP** | Electric-purple | Concentric ring territory visualization. Default. |
| **ORCHESTRATION_EDITOR** | Brand-cyan | Distraction-free editor with ghost text and entity checklist. |
| **SYNERGY_FLOW** | Cyan→Purple gradient | Cross-pillar Sankey flow. **V2 — "Coming Soon" in V1.** |

SYNERGY_FLOW must not show stub UI or static data in V1. Label only.

---

## 9. Action Stream Coherence

### Single Source of Truth
One SAGE proposal → one AUTOMATE Action Stream record → identical everywhere it appears. Title, priority score, and status are the same in CC Action Stream, surface Action Streams, and Entity Map progressive disclosure. Any discrepancy is a critical bug.

### AUTOMATE as Record Creator — D016
Trigger chain:
1. SAGE detects gap → emits `gap_node_detected` (`entity_id`, `ring`, `pillar`, `proposal_id`)
2. AUTOMATE creates Action Stream record
3. Status: `Priority` if confidence ≥ 0.7, `Pending` otherwise
4. AUTOMATE writes `linked_action_id` back to entity node record

### Cross-Surface Coherence Test
At any moment, a user must be able to:
1. See a recommendation in the CC Action Stream
2. Find the linked node on the Entity Map
3. Click the node and see the same action in progressive disclosure
4. Navigate to the pillar surface and find the same item in the surface Action Stream

Any broken step is a system error.

---

## 10. Surface Relationships

| Surface | Entity Map View |
|---------|----------------|
| **Command Center** | Full three-ring map. All tabs. Full Action Stream. |
| **PR Surface** | Filtered: Ring 2 (journalists, publications) + Ring 3 connections. |
| **Content Surface** | Filtered: Ring 1 (topic clusters) + Ring 2 pull signals. |
| **SEO Surface** | Filtered: Ring 1 with schema status and structured data coverage. |
| **Analytics** | No map. Same underlying data as trend lines and attribution bars over time. |

---

## 11. Data Model Requirements

### EntityNode
| Field | Type | Notes |
|-------|------|-------|
| `entity_id` | string | Canonical identifier |
| `kind` | NodeKind | `brand` / `topic_cluster` / `journalist` / `publication` / `ai_engine` |
| `ring` | 0–3 | Ring placement |
| `affinity_score` | 0–100 | Drives angular position |
| `authority_weight` | 0–100 | Drives node size |
| `connection_status` | EdgeState | Current radial edge state |
| `pillar` | string | `PR` / `SEO` / `AEO` / null |
| `linked_action_id` | string | FK to Action Stream. Null = system error for gap nodes. |
| `entity_insight` | string | SAGE-generated. Max 160 chars. Entity-specific + measurable signal. Required for gap nodes (D015). |
| `impact_pillars` | string[] | All pillars this node's actions affect |
| `last_updated` | ISO timestamp | |

### EntityEdge
| Field | Type | Notes |
|-------|------|-------|
| `source_entity_id` | string | |
| `target_entity_id` | string | |
| `rel` | EdgeRel | |
| `state` | EdgeState | `verified_solid` / `verified_pending` / `gap` / `in_progress` |
| `strength` | 0–100 | Drives stroke weight |
| `pillar` | string | |
| `verified_at` | ISO timestamp / null | |

### SessionCitationEvent (CiteMind daily scan output — D013)
| Field | Type | Notes |
|-------|------|-------|
| `entity_id_source` | string | Ring 2 journalist or publication |
| `entity_id_perceiver` | string | Ring 3 AI engine |
| `detected_at` | ISO timestamp | |
| `citation_type` | `direct` / `paraphrase` | |
| `confidence` | 0–1 | |

---

## 12. Design System Compliance

**Backgrounds:** `#000000` canvas. `#050505` panel overlays.

**Typography:** JetBrains Mono for all numeric data. Inter for labels and brief text. Node labels: 9px. Panel values: 12px.

**Border radius:** 6px on panels. Nodes are circular.

**Borders:** 1px `#13131A` for panel separation. No drop shadows on canvas.

**Glow:** `0 0 12px [pillar_color]` on verified/active nodes only. Never on gap nodes. Never on panels.

**Interaction:** Opacity shift and scale only on hover. No background fill changes.

**Color budget:** Maximum 2 accent colors on main view (brand-cyan for SEO/PR + electric-purple for AEO).

---

## 13. V1 vs. V2 Scope

### V1 (Launch)
- Full concentric ring architecture
- Topic cluster aggregation for Ring 1 (D017)
- All edge states
- Cluster nodes at >8 per ring (D014)
- Chain illumination on node click
- Progressive disclosure with SAGE `entity_insight` (D015)
- Session-load citation particle (event-driven, D013)
- Dashed-to-solid on AUTOMATE confirmation
- ENTITY_MAP and ORCHESTRATION_EDITOR tabs
- SYNERGY_FLOW tab: "Coming Soon" label only
- AUTOMATE as Action Stream record creator (D016)
- Surface-filtered views on PR, Content, SEO

### V2 (Post-Launch)
- SYNERGY_FLOW tab (Sankey cross-pillar flow)
- Time slider (map evolution over 30/90 days)
- Competitive entity overlay
- CMD+K node navigation
- Mobile/tablet adaptive layout

---

## 14. What This Is Not

- **Not real-time.** CiteMind runs daily scans. Animation fires on session load for new events, not as a continuous stream.
- **Not a free-form canvas.** Users cannot add, remove, or reposition nodes.
- **Not a social graph.** Lateral connections within the same ring are not shown in V1.
- **Not decorative.** Every node has real data. Placeholder nodes, sample data in production, or nodes without `linked_action_id` are bugs.
- **Not the zone model.** The SAGE zone layout (Signal/Authority/Growth/Exposure quadrants) from `ENTITY_MAP_CONTRACT.md` v1.0 is retired per D012.

---

*This document is the canonical product specification for the Intelligence Canvas: Entity Map. All design, engineering, and product decisions must reference this document and the linked contract files. Conflicts resolve in favor of this spec until a versioned update supersedes it.*
