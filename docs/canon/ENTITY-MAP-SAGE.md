# ENTITY MAP (SAGE-Native)

Version: v2.0 (Canon)
Status: Canonical Specification

## Overview

The Entity Map is a SAGE-native visualization that renders the strategic relationship graph within the Command Center. It displays entities (journalists, outlets, topics, competitors, brand nodes) and their relationships as a stable, deterministic graph that responds to Action Stream interactions.

## Purpose

The Entity Map provides:
1. **Visual context** for AI proposals in the Action Stream
2. **Relationship topology** showing how entities connect
3. **Impact preview** when hovering/selecting actions
4. **Execution feedback** via pulse animations on affected nodes/edges

## SAGE Integration

Entity Map is a direct materialization of SAGE signals:

| SAGE Component | Entity Map Manifestation |
|----------------|--------------------------|
| **S (Signal)** | Journalist nodes, outlet nodes, topic nodes |
| **A (Authority)** | Brand node, competitor nodes, edge strength |
| **G (Growth)** | Topic nodes, relationship edges |
| **E (Exposure)** | Node glow intensity, edge thickness |

## Zone-Based Layout (SAGE-Native)

The graph uses a deterministic zone-based layout:

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHORITY ZONE                        │
│                   (Brand at center)                      │
│                        [●]                               │
│                                                          │
│   SIGNAL ZONE                        GROWTH ZONE         │
│   (Journalists/                      (Topics/            │
│    Outlets)                          Distribution)       │
│   [●] [●]                                 [●] [●]        │
│      [●]                                  [●]            │
│                                                          │
│                   EXPOSURE ZONE                          │
│                   (Competitors)                          │
│                    [●] [●] [●]                           │
└─────────────────────────────────────────────────────────┘
```

### Zone Definitions

| Zone | Purpose | Node Types | Position |
|------|---------|------------|----------|
| **Authority** | Brand anchor point | `brand` | Center |
| **Signal** | Media intelligence | `journalist`, `outlet` | Left hemisphere |
| **Growth** | Distribution network | `topic`, `ai_model` | Right hemisphere |
| **Exposure** | Competitive context | `competitor` | Bottom |

## Node Types

```typescript
type NodeKind =
  | 'brand'      // Central brand entity (always one)
  | 'journalist' // Media contacts
  | 'outlet'     // Publications
  | 'topic'      // Content/SEO topics
  | 'ai_model'   // AI platforms (ChatGPT, Perplexity, etc.)
  | 'competitor' // Competitive brands
```

## Edge Types

```typescript
type EdgeRel =
  | 'covers'      // journalist → topic/brand
  | 'writes_for'  // journalist → outlet
  | 'competes'    // competitor → brand
  | 'cites'       // ai_model → brand/topic
  | 'relates_to'  // topic → topic
```

## Layout Rules

### Deterministic Positioning (REQUIRED)
- **Layout seed**: Hash of node IDs provides stable positioning
- **No reflow on interaction**: Positions locked after initial render
- **Only animation**: Highlight/pulse effects, not position changes

### Top-20 Constraint
- Default: Show only top-20 most relevant nodes
- Relevance: Calculated from edge strength + recent action impact
- Expansion: "Show more" reveals additional nodes without reflow

### Pillar Styling
Nodes and edges follow pillar accent system:

| Pillar | Node Color | Edge Color |
|--------|------------|------------|
| PR | `brand-magenta` | `brand-magenta/50` |
| Content | `brand-iris` | `brand-iris/50` |
| SEO | `brand-cyan` | `brand-cyan/50` |

## Action Stream Integration

### Hover Highlighting
When user hovers an Action Stream card:
1. Map identifies impacted nodes via `action.entity_impact`
2. Impacted nodes receive pillar glow
3. Impacted edges receive increased opacity + glow
4. Non-impacted nodes dim to 40% opacity

### Execute Pulse Animation
When user executes an action:
1. Affected nodes pulse with pillar glow (300ms ease-out)
2. Affected edges pulse with increased stroke width
3. Animation propagates outward from driver node
4. Duration: 800ms total, staggered 100ms per hop

### Impact Mapping

Actions declare their entity impact:

```typescript
interface ActionImpactMap {
  /** Primary driver node (where animation starts) */
  driver_node: string;
  /** All impacted nodes (receive highlight/pulse) */
  impacted_nodes: string[];
  /** All impacted edges (receive highlight/pulse) */
  impacted_edges: string[];
}
```

Example:
```json
{
  "driver_node": "n_journalist_sarah_chen",
  "impacted_nodes": [
    "n_journalist_sarah_chen",
    "n_outlet_techcrunch",
    "n_brand_acme"
  ],
  "impacted_edges": [
    "e_sarah_techcrunch",
    "e_sarah_acme"
  ]
}
```

## Contract Structure

### EntityMapPayload

```typescript
interface EntityMapPayload {
  generated_at: string;
  layout_seed: string;
  nodes: EntityNode[];
  edges: EntityEdge[];
}

interface EntityNode {
  id: string;
  kind: NodeKind;
  label: string;
  zone: 'authority' | 'signal' | 'growth' | 'exposure';
  pillar: Pillar;
  meta: {
    [key: string]: string | number | boolean | null;
  };
}

interface EntityEdge {
  id: string;
  from: string;
  to: string;
  rel: EdgeRel;
  strength: number; // 0-1
  pillar: Pillar;
}
```

## Interaction Contract

### REQUIRED Behaviors
1. **Stable layout**: Node positions do not change during session
2. **Single focus**: Only one set of nodes highlighted at a time
3. **Hover coordination**: Uses same coordination as Action Stream (single active)
4. **Accessibility**: Keyboard navigation + screen reader labels

### FORBIDDEN Behaviors
1. **Full reflow**: Never recalculate positions during interaction
2. **Multiple highlights**: Never highlight from multiple sources simultaneously
3. **Auto-zoom**: Never auto-zoom/pan without user input
4. **Position drift**: Nodes must not shift position after initial render

## Animation Specifications

### Hover Highlight
```css
/* Affected nodes */
transition: opacity 150ms ease-out, box-shadow 150ms ease-out;
box-shadow: 0 0 12px var(--pillar-glow);

/* Non-affected nodes */
opacity: 0.4;
transition: opacity 150ms ease-out;
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

### Edge Pulse
```css
@keyframes edge-pulse {
  0% { stroke-width: var(--base-width); stroke-opacity: 0.5; }
  50% { stroke-width: calc(var(--base-width) * 2); stroke-opacity: 1; }
  100% { stroke-width: var(--base-width); stroke-opacity: 0.7; }
}
animation: edge-pulse 600ms ease-out;
```

## CI Guardrails

File: `scripts/check-entity-map-spec.mjs`

### Required Patterns
| File | Pattern | Description |
|------|---------|-------------|
| `EntityMap.tsx` | `entity-map-v2` | Version marker |
| `EntityMap.tsx` | `layout_seed` | Deterministic seed usage |
| `EntityMap.tsx` | `zone:` | Zone-based positioning |
| `EntityMap.tsx` | `hoveredActionId` | Action Stream coordination |
| `EntityMap.tsx` | `entity-pulse` | Pulse animation class |
| `types.ts` | `EntityNode` | Node type definition |
| `types.ts` | `EntityEdge` | Edge type definition |
| `types.ts` | `ActionImpactMap` | Impact mapping type |

### Forbidden Patterns
| File | Pattern | Reason |
|------|---------|--------|
| `EntityMap.tsx` | `forceSimulation` | No physics-based layout |
| `EntityMap.tsx` | `useLayoutEffect.*position` | No position recalculation |
| `EntityMap.tsx` | `zoom.*auto` | No auto-zoom |

## Compliance Checklist

- [ ] Layout uses deterministic seed, not physics simulation
- [ ] Nodes positioned by zone, not random/force-directed
- [ ] Top-20 constraint enforced by default
- [ ] Hover highlights impacted nodes/edges only
- [ ] Execute triggers pulse animation
- [ ] No position changes during interaction
- [ ] Pillar styling consistent with DS v3.1
- [ ] Keyboard accessible
- [ ] CI guardrail passes
