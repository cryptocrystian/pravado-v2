# ENTITY MAP (SAGE-Native)

Version: v3.0 (Canon)
Status: Canonical Specification
Supersedes: v2.0 (2026-02-23) — concentric ring architecture adopted per D012

---

## Overview

The Entity Map is a SAGE-native visualization that renders the brand's position in the AI knowledge graph within the Command Center. It uses a **concentric ring architecture** (Owned / Earned / Perceived) that encodes the causal flow of AEO authority as its primary structural metaphor.

See `ENTITY_MAP_CONTRACT.md` v2.0 for the full interaction, animation, and coherence contract. This document defines the SAGE integration model, data contract, and TypeScript types.

---

## Purpose

The Entity Map provides:
1. **Causal territory visualization** — shows how brand authority flows from owned content through earned media to AI perception
2. **Gap identification** — makes missing or weak relationships structurally visible as dashed edges
3. **Cross-pillar chain illumination** — reveals the causal chain connecting Ring 1 → Ring 2 → Ring 3 on node interaction
4. **SAGE proposal grounding** — every node and gap edge is anchored to a SAGE proposal / Action Stream record
5. **Execution feedback** — dashed-to-solid transition and citation particle animation show when actions produce results

---

## SAGE Integration

The Entity Map is a direct materialization of SAGE's knowledge graph model:

| SAGE Component | Entity Map Manifestation |
|----------------|--------------------------|
| **S (Signal)** | Ring 2 journalist and publication nodes; dashed edges represent signal gaps |
| **A (Authority)** | Ring 1 topic cluster nodes; node size encodes schema coverage and content authority |
| **G (Growth)** | Ring 3 AI engine nodes; edge state shows whether Ring 1+2 work has reached perceivers |
| **E (Exposure)** | Edge glow intensity and solid/dashed state; the measurable outcome of the full Owned → Earned → Perceived chain |

---

## Ring-Based Layout (SAGE-Native)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   RING 3 ─ PERCEIVED AUTHORITY (AEO Pillar)                         │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │   RING 2 ─ EARNED AUTHORITY (PR Pillar)                      │  │
│   │   ┌──────────────────────────────────────────────────────┐   │  │
│   │   │   RING 1 ─ OWNED AUTHORITY (SEO/Content Pillar)      │   │  │
│   │   │   ┌──────────────────────────────────────────────┐   │   │  │
│   │   │   │          RING 0 ─ BRAND CORE                  │   │   │  │
│   │   │   │                  [●]                          │   │   │  │
│   │   │   └──────────────────────────────────────────────┘   │   │  │
│   │   └──────────────────────────────────────────────────────┘   │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Ring Definitions

| Ring | Label | Pillar | Node Types | Causal Role |
|------|-------|--------|------------|-------------|
| **0** | Brand Core | — | `brand` | Anchor. Always one. Always centered. |
| **1** | Owned Authority | SEO/Content | `topic_cluster` | Foundation. Brand controls directly. Schema + structured data. |
| **2** | Earned Authority | PR | `journalist`, `publication` | Influence layer. Brand earns through outreach and content. |
| **3** | Perceived Authority | AEO | `ai_engine` | Outcome layer. Cannot be directly controlled. Reflects Rings 1+2. |

---

## Node Types

```typescript
type NodeKind =
  | 'brand'          // Ring 0 — central brand entity, always one
  | 'topic_cluster'  // Ring 1 — aggregated content + schema for a semantic topic area
  | 'journalist'     // Ring 2 — individual media contacts
  | 'publication'    // Ring 2 — media organizations and outlets
  | 'ai_engine'      // Ring 3 — AI systems (Perplexity, ChatGPT, Gemini, Claude, Bing)
```

### Topic Cluster (Ring 1) Definition

Ring 1 nodes are **topic clusters**, not individual content pieces.

Each topic cluster:
- Aggregates all content pieces targeting a given semantic topic
- `authority_weight` = aggregate schema coverage score across all content in cluster
- `affinity_score` = weighted average affinity score of contained content pieces
- Progressive disclosure shows: list of individual content pieces with schema and indexing status

---

## Edge Types

```typescript
type EdgeRel =
  | 'topic_to_brand'       // Ring 1 → Ring 0: topic cluster authority connection
  | 'earned_from_topic'    // Ring 1 → Ring 2: content cluster driving earned media
  | 'journalist_covers'    // Ring 2 → Ring 0: journalist/publication mentions brand
  | 'cites_brand'          // Ring 3 → Ring 0: AI engine cites brand content
  | 'journalist_to_ai'     // Ring 2 → Ring 3: journalist's content cited by AI engine (cross-ring synergy)
  | 'topic_to_ai'          // Ring 1 → Ring 3: content directly cited by AI (no journalist intermediary)
```

Cross-ring synergy edges (`journalist_to_ai`, `topic_to_ai`) are **not rendered on the main view**. They are revealed only during chain illumination on node interaction.

---

## TypeScript Data Contract

```typescript
interface EntityMapPayload {
  generated_at: string;
  layout_version: 'v3';
  nodes: EntityNode[];
  edges: EntityEdge[];
  session_events: SessionCitationEvent[]; // New citations since last session load
}

interface EntityNode {
  id: string;
  kind: NodeKind;
  label: string;
  ring: 0 | 1 | 2 | 3;
  pillar: 'PR' | 'SEO' | 'AEO' | null;  // null for Brand Core
  affinity_score: number;        // 0–100. Drives angular position within ring.
  authority_weight: number;      // 0–100. Drives node size.
  connection_status: EdgeState;  // Current status of this node's primary radial edge
  linked_action_id: string;      // FK to Action Stream record. Required. Null = system error.
  entity_insight: string;        // SAGE entity_insight field. Max 160 chars. Required for gap nodes.
  impact_pillars: string[];      // All pillars this node's actions affect
  last_updated: string;          // ISO timestamp
  meta: Record<string, string | number | boolean | null>;
}

interface EntityEdge {
  id: string;
  from: string;
  to: string;
  rel: EdgeRel;
  state: EdgeState;
  strength: number;     // 0–100. Drives stroke weight.
  pillar: 'PR' | 'SEO' | 'AEO';
  verified_at: string | null;  // ISO timestamp when edge became verified
}

type EdgeState = 'verified_solid' | 'verified_pending' | 'gap' | 'in_progress';

interface SessionCitationEvent {
  // CiteMind citation events detected since last session load.
  // Used to trigger session-load citation particle animations.
  // Animations are NOT continuous — they fire once on load for each new event.
  entity_id_source: string;    // Ring 2 journalist or publication node
  entity_id_perceiver: string; // Ring 3 AI engine node
  detected_at: string;
  citation_type: 'direct' | 'paraphrase';
  confidence: number;          // 0–1
}

interface ActionImpactMap {
  driver_node: string;
  impacted_nodes: string[];
  impacted_edges: string[];
}
```

---

## SAGE Output Requirements

Per Decision D015, SAGE proposals that generate Entity Map nodes must include:

```typescript
interface SAGEProposalEntityExtension {
  entity_id: string;           // Maps to EntityNode.id
  ring: 1 | 2 | 3;
  entity_insight: string;      // REQUIRED. Max 160 chars. Must reference the specific
                                // entity and at least one measurable signal.
                                // e.g., "This journalist covers AI infrastructure at a
                                // frequency correlating with your target topics at 3.2×."
                                // Generic text = SAGE output quality failure.
  impact_pillars: string[];    // All pillars this proposal's actions affect
}
```

---

## AUTOMATE Integration

Per Decision D016, AUTOMATE is responsible for:

1. Subscribing to SAGE `gap_node_detected` events
2. Creating Action Stream records from SAGE proposals
3. Setting `linked_entity_id` on the Action Stream record
4. Writing `linked_action_id` back to the EntityNode record
5. Setting initial status: `Priority` if SAGE confidence ≥ 0.7, `Pending` otherwise

This is the enforcement mechanism for the coherence invariant: every Entity Map node has a corresponding Action Stream record.

---

## Action Stream Integration

### Hover Highlighting
When user hovers an Action Stream card:
1. Map identifies impacted nodes via `action.entity_impact.impacted_nodes`
2. Impacted nodes receive pillar glow
3. Non-impacted nodes dim to 40% opacity
4. Impacted edges illuminate

### Chain Illumination (Node Click)
When user clicks a node on the Entity Map:
1. Map dims all non-connected nodes to 20% opacity (200ms)
2. Clicked node scales to 1.3× (200ms ease-out)
3. Causal chain illuminates with 80ms stagger per hop outward from brand core
4. Cross-ring synergy edges appear for the illuminated chain
5. Progressive disclosure panel slides in (250ms ease-out)

### Execute Pulse Animation
When an action executes via AUTOMATE:
1. Driver node pulses with pillar glow (300ms ease-out)
2. Ripple propagates through affected edges
3. Each affected node pulses as wave reaches it (100ms stagger per hop)
4. Total duration: 800ms

---

## Animation Specifications

### Brand Core Pulse
```css
@keyframes brand-core-pulse {
  0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.15); }
  70% { box-shadow: 0 0 0 12px rgba(168, 85, 247, 0); }
  100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
}
animation: brand-core-pulse 3s ease-out infinite;
```

### Chain Illumination
```css
/* Affected nodes */
transition: opacity 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out;
transform: scale(1.3);
box-shadow: 0 0 16px var(--pillar-glow);

/* Non-affected nodes */
opacity: 0.2;
transition: opacity 200ms ease-out;
```

### Dashed-to-Solid Transition
```css
@keyframes edge-solidify {
  0% { stroke-dasharray: 5 4; stroke-opacity: 0.4; stroke: var(--gap-color); }
  50% { stroke-dasharray: 3 2; stroke-opacity: 0.6; stroke: var(--pillar-color); }
  100% { stroke-dasharray: none; stroke-opacity: 0.6; stroke: var(--pillar-color); }
}
animation: edge-solidify 2.5s ease-in-out forwards;
```

### Execute Pulse
```css
@keyframes entity-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(var(--pillar-rgb), 0); }
  50% { transform: scale(1.15); box-shadow: 0 0 20px rgba(var(--pillar-rgb), 0.6); }
  100% { transform: scale(1); box-shadow: 0 0 12px rgba(var(--pillar-rgb), 0.3); }
}
animation: entity-pulse 800ms ease-out;
```

---

## CI Guardrail

File: `scripts/check-entity-map-spec.mjs`

### Required Patterns
| File | Pattern | Description |
|------|---------|-------------|
| `EntityMap.tsx` | `entity-map-v3` | Version marker |
| `EntityMap.tsx` | `ring_position` | Ring-based node placement |
| `EntityMap.tsx` | `affinity_score` | Affinity-based angular positioning |
| `EntityMap.tsx` | `chain_illumination` | Chain illumination on node click |
| `EntityMap.tsx` | `cluster_node` | Cluster node overflow handling |
| `EntityMap.tsx` | `session_events` | Session-load citation event processing |
| `EntityMap.tsx` | `entity-pulse` | Execute pulse animation class |
| `types.ts` | `EntityNode` | Node type definition |
| `types.ts` | `EntityEdge` | Edge type definition |
| `types.ts` | `ActionImpactMap` | Impact mapping type |
| `types.ts` | `SessionCitationEvent` | Session citation event type |
| `types.ts` | `linked_action_id` | Action Stream coherence field |
| `types.ts` | `entity_insight` | SAGE intelligence brief field |

### Forbidden Patterns
| File | Pattern | Reason |
|------|---------|--------|
| `EntityMap.tsx` | `useLayoutEffect.*position` | No position recalculation during interaction |
| `EntityMap.tsx` | `zoom.*auto` | No auto-zoom without user input |
| `EntityMap.tsx` | `setInterval.*particle` | No continuous particle animation — events only |

---

## Compliance Checklist

- [ ] Concentric ring structure with three rings (Owned / Earned / Perceived)
- [ ] Ring 1 nodes are topic clusters with aggregated authority weight
- [ ] Angular position within ring computed from `affinity_score`
- [ ] Node size computed from `authority_weight`
- [ ] Cluster nodes created at >8 nodes per ring
- [ ] All gap nodes have `linked_action_id` (null = system error)
- [ ] All gap nodes have `entity_insight` from SAGE (generic = quality failure)
- [ ] Chain illumination fires on node click with 80ms stagger
- [ ] Cross-ring synergy edges revealed only during chain illumination
- [ ] Citation particle animation fires on `session_events`, not as continuous stream
- [ ] Dashed-to-solid transition fires on AUTOMATE confirmation event
- [ ] Brand Core pulse is the only continuous animation
- [ ] No position recalculation during interaction
- [ ] Hover highlighting coordinates with Action Stream
- [ ] CI guardrail passes

---

## Revision History

| Date | Version | Change |
|------|---------|--------|
| (prior) | 1.0 | Initial SAGE zone-based spec |
| (prior) | 2.0 | TypeScript contract and CI guardrail additions |
| 2026-02-23 | 3.0 | Concentric ring architecture (D012). Event-driven animation (D013). Cluster nodes (D014). SAGE entity_insight field (D015). AUTOMATE record creation (D016). Topic cluster Ring 1 (D017). |
