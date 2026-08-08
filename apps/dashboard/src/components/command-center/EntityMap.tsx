'use client';

/**
 * EntityMap v3 — Concentric Ring Territory Visualization
 *
 * MARKER: entity-map-v3
 *
 * Canonical concentric-ring architecture (supersedes the retired zone model, D012).
 * Ring 0 (Brand Core, center) → Ring 1 (Owned / topic clusters) → Ring 2 (Earned /
 * journalists+publications) → Ring 3 (Perceived / AI engines) fanning outward.
 *
 * - Ring encodes causal role (Ring 1 causes Ring 2 enables Ring 3).
 * - Angular position within a ring encodes affinity_score (top = highest, bottom =
 *   lowest — canon §2 "Angular Positioning Within Rings").
 * - Node size encodes authority_weight (canon §3 Node Taxonomy).
 * - Progressive disclosure surfaces entity_insight on select (D015).
 * - Gap nodes with a linked_action_id navigate to the Action Stream record (D016).
 * - Event-driven only. NO continuous particle/animation loop (D013). The single
 *   permitted continuous animation is the Brand Core pulse, rendered via CSS
 *   keyframes — there is no requestAnimationFrame / setInterval loop in this file.
 *
 * Pure SVG render. No canvas, no d3-force, no RAF draw loop.
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md v2.0 §2, §6, §7, §9, §11, §12
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import type { EntityNode, EntityEdge, SessionCitationEvent } from './types';

// ── Canon §12 Design System tokens (explicitly named in the spec) ──────────────
// Canvas #000000, panel overlays #050505, panel separators 1px #13131A. These exact
// values are canon-named and are NOT on the banned phantom-hex list.
const CANVAS_BG = '#000000';
const PANEL_BG = '#050505';
const PANEL_BORDER = '#13131A';

// Color budget: max 2 accents (canon §12). brand-cyan for SEO/PR, electric-purple
// (brand-iris) for AEO. Values mirror the DS tokens in globals.css.
const CYAN = '#00D9FF'; // Rings 1 (SEO) + 2 (PR)
const PURPLE = '#A855F7'; // Ring 0 core + Ring 3 (AEO)
const GAP_GRAY = 'rgba(148,163,184,0.28)'; // canon §4 "dashed line, dark gray"

/** Pillar/ring accent color. Honors the 2-accent budget. */
function ringColor(ring: 0 | 1 | 2 | 3): string {
  return ring === 3 || ring === 0 ? PURPLE : CYAN;
}

const RING_LABELS: Record<1 | 2 | 3, string> = {
  1: 'OWNED',
  2: 'EARNED',
  3: 'PERCEIVED',
};

// Brand Core fixed diameter (canon §3 Node Taxonomy: 88px).
const BRAND_DIAMETER = 88;
const NODE_MIN = 16;
const NODE_MAX = 46;
// Maximum angular offset from top (12 o'clock) for the lowest-affinity node.
const MAX_OFFSET_DEG = 168;

export interface PositionedNode {
  node: EntityNode;
  x: number;
  y: number;
  /** Node radius in px (from authority_weight; fixed for brand core). */
  radius: number;
  /** Ring band radius from center (0 for brand core). */
  ringRadius: number;
}

export interface LayoutDims {
  width: number;
  height: number;
}

/**
 * Pure concentric-ring layout. Exported for tests.
 *
 * Ring band radius grows with ring index; angular position within a ring is driven
 * by affinity_score (higher affinity → nearer the top → smaller y). Nodes fan
 * symmetrically left/right so equal-affinity siblings never overlap. Deterministic:
 * same input ⇒ same output (stable within a session, canon §2).
 */
export function computeRingLayout(
  nodes: EntityNode[],
  dims: LayoutDims
): PositionedNode[] {
  const cx = dims.width / 2;
  const cy = dims.height / 2;
  const maxR = Math.max(40, Math.min(dims.width, dims.height) / 2 - 56);
  const ringBand: Record<1 | 2 | 3, number> = {
    1: maxR * 0.42,
    2: maxR * 0.68,
    3: maxR * 0.95,
  };

  const nodeRadius = (n: EntityNode): number => {
    if (n.ring === 0) return BRAND_DIAMETER / 2;
    const w = Math.max(0, Math.min(100, n.authority_weight)) / 100;
    return (NODE_MIN + w * (NODE_MAX - NODE_MIN)) / 2;
  };

  const positioned: PositionedNode[] = [];

  // Ring 0 — Brand Core at exact center.
  for (const n of nodes) {
    if (n.ring === 0) {
      positioned.push({
        node: n,
        x: cx,
        y: cy,
        radius: nodeRadius(n),
        ringRadius: 0,
      });
    }
  }

  // Rings 1–3 — sort by affinity desc, fan out from the top.
  for (const ring of [1, 2, 3] as const) {
    const ringNodes = nodes
      .filter((n) => n.ring === ring)
      .sort((a, b) => b.affinity_score - a.affinity_score);

    ringNodes.forEach((n, rank) => {
      const affinity = Math.max(0, Math.min(100, n.affinity_score));
      const offsetDeg = (1 - affinity / 100) * MAX_OFFSET_DEG;
      // Alternate sign so siblings fan to both sides of the vertical axis.
      const sign = rank % 2 === 0 ? 1 : -1;
      const thetaRad = (sign * offsetDeg * Math.PI) / 180;
      const r = ringBand[ring];
      positioned.push({
        node: n,
        // theta measured from the top (12 o'clock); +theta rotates clockwise.
        x: cx + r * Math.sin(thetaRad),
        y: cy - r * Math.cos(thetaRad),
        radius: nodeRadius(n),
        ringRadius: r,
      });
    });
  }

  return positioned;
}

interface EntityMapProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  sessionEvents?: SessionCitationEvent[];
  /** Cross-pane highlight: brighten nodes linked to this action (Action Stream hover). */
  hoveredActionId?: string | null;
  /** Cross-pane pulse: nodes linked to this action are executing. */
  executingActionId?: string | null;
  /** Fired when a gap node's linked Action Stream record should be opened (D016). */
  onOpenAction?: (actionId: string) => void;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function EntityMap({
  nodes,
  edges,
  sessionEvents = [],
  hoveredActionId = null,
  executingActionId = null,
  onOpenAction,
  onNodeSelect,
}: EntityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<LayoutDims>({ width: 720, height: 520 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Container sizing via ResizeObserver (event-driven, not a render loop).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDims({ width: rect.width, height: rect.height });
    }
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDims({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positioned = useMemo(
    () => computeRingLayout(nodes, dims),
    [nodes, dims]
  );
  const posById = useMemo(() => {
    const m = new Map<string, PositionedNode>();
    for (const p of positioned) m.set(p.node.id, p);
    return m;
  }, [positioned]);

  const ringNodeCount = nodes.filter((n) => n.ring > 0).length;
  const selectedNode = selectedId
    ? (nodes.find((n) => n.id === selectedId) ?? null)
    : null;

  // Chain illumination: nodes directly connected to the selected node stay lit.
  const connectedIds = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    for (const e of edges) {
      if (e.from === selectedId) s.add(e.to);
      if (e.to === selectedId) s.add(e.from);
    }
    return s;
  }, [selectedId, edges]);

  const maxR = Math.max(40, Math.min(dims.width, dims.height) / 2 - 56);
  const ringBoundary: Record<1 | 2 | 3, number> = {
    1: maxR * 0.42,
    2: maxR * 0.68,
    3: maxR * 0.95,
  };
  const cx = dims.width / 2;
  const cy = dims.height / 2;

  function selectNode(id: string) {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    onNodeSelect?.(next);
  }

  function openLinkedAction(actionId: string) {
    onOpenAction?.(actionId);
    // Cross-surface coherence (canon §9): let the Action Stream focus the record
    // even when no callback is wired. Event-driven, no polling.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cc:focus-action', { detail: { actionId } })
      );
    }
  }

  // ── Honest empty state — never fabricate nodes (canon §14) ──
  if (ringNodeCount === 0) {
    return (
      <div
        ref={containerRef}
        className="entity-map-v3 relative h-full w-full flex items-center justify-center"
        style={{ background: CANVAS_BG }}
        data-testid="entity-map-empty"
      >
        <div className="max-w-sm px-6 text-center">
          <p className="text-sm font-semibold text-white/80">
            No entity signals yet
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            {/* typography-allow: micro */}
            SAGE builds your knowledge-graph rings as PR, content, and SEO
            signals are ingested. Topic clusters, journalists, and AI engines
            appear here once real data lands — nothing is shown until then.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="entity-map-v3 relative h-full w-full overflow-hidden"
      style={{ background: CANVAS_BG }}
      data-testid="entity-map-v3"
    >
      <svg
        width={dims.width}
        height={dims.height}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        role="img"
        aria-label="Entity Map concentric ring visualization"
        style={{ display: 'block' }}
      >
        {/* Ring boundary circles + labels (canon §5 Always Visible) */}
        {([1, 2, 3] as const).map((ring) => (
          <g key={`ring-${ring}`} data-testid={`ring-boundary-${ring}`}>
            <circle
              cx={cx}
              cy={cy}
              r={ringBoundary[ring]}
              fill="none"
              stroke={PANEL_BORDER}
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy - ringBoundary[ring] - 6}
              textAnchor="middle"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 9,
                letterSpacing: '0.18em',
                fill: 'rgba(255,255,255,0.32)',
              }}
            >
              {RING_LABELS[ring]}
            </text>
          </g>
        ))}

        {/* Radial edges (core ↔ node), state-styled (canon §4) */}
        {edges.map((edge) => {
          const from = posById.get(edge.from);
          const to = posById.get(edge.to);
          if (!from || !to) return null;
          const dimmed =
            connectedIds !== null &&
            !(connectedIds.has(edge.from) && connectedIds.has(edge.to));
          const color = ringColor(
            (from.node.ring || to.node.ring) as 0 | 1 | 2 | 3
          );
          const isGap = edge.state === 'gap';
          const strokeW =
            edge.strength >= 85 ? 2 : edge.strength >= 40 ? 1 : 0.5;
          let stroke = color;
          let opacity = 0.6;
          let dash: string | undefined;
          if (edge.state === 'verified_pending') opacity = 0.25;
          if (edge.state === 'in_progress') dash = '6 4';
          if (isGap) {
            stroke = GAP_GRAY;
            opacity = 1;
            dash = '5 4';
          }
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeDasharray={dash}
              opacity={dimmed ? 0.08 : opacity}
              data-edge-state={edge.state}
            />
          );
        })}

        {/* Session-load citation particles (D013 — event-driven, finite, one-shot).
            Rendered only for real SessionCitationEvents; empty ⇒ nothing renders.
            CSS-animated (single iteration), never a JS loop. */}
        {sessionEvents.map((ev, i) => {
          const src = posById.get(ev.entity_id_source);
          const perc = posById.get(ev.entity_id_perceiver);
          if (!src || !perc) return null;
          return (
            <circle
              key={`cite-${i}`}
              r={2.5}
              fill={PURPLE}
              className="em-cite-particle"
              data-testid="citation-particle"
            >
              <animateMotion
                dur="1.5s"
                fill="freeze"
                repeatCount="1"
                path={`M ${src.x} ${src.y} L ${perc.x} ${perc.y}`}
              />
            </circle>
          );
        })}

        {/* Nodes (canon §3, §6) */}
        {positioned.map((p) => {
          const n = p.node;
          const color = ringColor(n.ring);
          const isBrand = n.ring === 0;
          const isGap = n.connection_status === 'gap';
          const isSelected = n.id === selectedId;
          const isHovered = n.id === hoveredId;
          const dimmed =
            connectedIds !== null && !connectedIds.has(n.id) && !isBrand;
          const actionHot =
            hoveredActionId != null && n.linked_action_id === hoveredActionId;
          const actionExec =
            executingActionId != null &&
            n.linked_action_id === executingActionId;
          const scale = isSelected ? 1.3 : isHovered || actionHot ? 1.1 : 1;
          // Glow only on verified/active nodes — never on gap nodes (canon §12).
          const glow = !isGap ? `drop-shadow(0 0 12px ${color})` : undefined;
          const opacity = dimmed ? 0.2 : 1;

          return (
            <g
              key={n.id}
              transform={`translate(${p.x} ${p.y})`}
              style={{
                cursor: 'pointer',
                transition: 'opacity 200ms ease-out',
                opacity,
              }}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                selectNode(n.id);
                if (isGap && n.linked_action_id)
                  openLinkedAction(n.linked_action_id);
              }}
              data-testid={`entity-node-${n.id}`}
              data-ring={n.ring}
              data-gap={isGap ? 'true' : 'false'}
            >
              {isBrand && (
                <circle
                  r={p.radius}
                  fill="none"
                  stroke={PURPLE}
                  strokeWidth={1}
                  className="em-core-pulse"
                  data-testid="brand-core-pulse"
                />
              )}
              <circle
                r={p.radius * scale}
                fill={isGap ? 'rgba(10,10,14,0.9)' : `${color}22`}
                stroke={color}
                strokeWidth={isSelected ? 2 : 1}
                style={{
                  filter: glow,
                  transition: 'r 200ms ease-out',
                  strokeDasharray: isGap ? '4 3' : undefined,
                  animation: actionExec
                    ? 'em-action-pulse 1.2s ease-in-out infinite'
                    : undefined,
                }}
              />
              <text
                y={p.radius * scale + 12}
                textAnchor="middle"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: isBrand ? 11 : 9,
                  fontWeight: isBrand ? 700 : 500,
                  fill: isSelected
                    ? '#FFFFFF'
                    : dimmed
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.75)',
                }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip — type + affinity only (canon §6 Hover State) */}
      {hoveredId &&
        hoveredId !== selectedId &&
        (() => {
          const hp = posById.get(hoveredId);
          if (!hp) return null;
          const n = hp.node;
          return (
            <div
              className="pointer-events-none absolute z-20 rounded-md px-2 py-1"
              style={{
                left: hp.x + 12,
                top: hp.y - 8,
                background: PANEL_BG,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            >
              <span className="block text-[10px] uppercase tracking-wide text-white/50">
                {/* typography-allow: micro */}
                {n.kind.replace('_', ' ')}
              </span>
              <span
                className="block text-[11px] text-white/80"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                affinity {n.affinity_score}
              </span>
            </div>
          );
        })()}

      {/* Progressive disclosure panel (canon §6, D015 entity_insight) */}
      {selectedNode && (
        <div
          className="absolute right-3 top-3 z-30 w-[280px] p-3"
          style={{
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 6,
          }}
          data-testid="entity-disclosure-panel"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: `${ringColor(selectedNode.ring)}1F`,
                  color: ringColor(selectedNode.ring),
                }}
              >
                {selectedNode.kind.replace('_', ' ')}
              </span>
              <span className="truncate text-sm font-semibold text-white/90">
                {selectedNode.label}
              </span>
            </div>
            <button
              onClick={() => selectNode(selectedNode.id)}
              className="shrink-0 text-white/40 transition-colors hover:text-white/70"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                {/* typography-allow: micro */}
                Affinity
              </span>
              <p
                className="text-xs font-bold text-white/90"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {selectedNode.affinity_score}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                {/* typography-allow: micro */}
                Authority
              </span>
              <p
                className="text-xs font-bold text-white/90"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {selectedNode.authority_weight}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wide text-white/40">
              {/* typography-allow: micro */}
              Connection
            </span>
            <p className="mt-0.5 text-xs capitalize text-white/70">
              {selectedNode.connection_status.replaceAll('_', ' ')}
            </p>
          </div>

          {selectedNode.entity_insight && (
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                {/* typography-allow: micro */}
                Intelligence Brief
              </span>
              <p
                className="mt-0.5 text-xs leading-relaxed text-white/70"
                data-testid="entity-insight"
              >
                {selectedNode.entity_insight}
              </p>
            </div>
          )}

          {selectedNode.impact_pillars.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                {/* typography-allow: micro */}
                Pillar Impact
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                {selectedNode.impact_pillars.map((pl) => (
                  <span
                    key={pl}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/70"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  >
                    {pl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedNode.linked_action_id ? (
            <button
              onClick={() =>
                selectedNode.linked_action_id &&
                openLinkedAction(selectedNode.linked_action_id)
              }
              className="w-full rounded border px-2 py-1.5 text-left text-xs text-brand-cyan transition-colors hover:bg-brand-cyan/5"
              style={{ borderColor: 'rgba(0,217,255,0.2)' }}
              data-testid="open-linked-action"
            >
              Open linked action →
            </button>
          ) : (
            selectedNode.connection_status === 'gap' && (
              <p className="text-[10px] text-white/40">
                {/* typography-allow: micro */}
                No linked action yet — SAGE has not created a record for this
                gap.
              </p>
            )
          )}
        </div>
      )}

      {/* The ONLY continuous animation permitted on the canvas (canon §7).
          CSS keyframes — no requestAnimationFrame / setInterval loop. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .em-core-pulse {
          transform-origin: center;
          animation: em-core-pulse 3s ease-in-out infinite;
        }
        @keyframes em-core-pulse {
          0% { opacity: 0.15; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes em-action-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `,
        }}
      />
    </div>
  );
}

export default EntityMap;
