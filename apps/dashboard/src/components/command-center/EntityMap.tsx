'use client';

/**
 * EntityMap v3 — Concentric Ring Architecture
 *
 * MARKER: entity-map-v3
 *
 * Three concentric rings encode causal role:
 *   Ring 1 (Owned — topic clusters) → Ring 2 (Earned — journalists/publications) → Ring 3 (Perceived — AI engines)
 * Brand Core sits at the center (Ring 0).
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md v2.0
 * @see /docs/canon/ENTITY-MAP-SAGE.md v3.0
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { EntityNode, EntityEdge, EdgeState, SessionCitationEvent, ActionImpactMap } from './types';

// ── Constants ──────────────────────────────────────────────

const CX = 300;
const CY = 300;
const RING_RADII: Record<number, number> = { 1: 115, 2: 210, 3: 285 };
const BRAND_RADIUS = 28;
const MIN_ARC_GAP_DEG = 15;
const MAX_NODES_PER_RING = 8;

const PILLAR_COLORS: Record<string, string> = {
  PR: '#E879F9',
  SEO: '#00D9FF',
  AEO: '#A855F7',
};

const RING_LABELS: Record<number, string> = {
  1: 'OWNED',
  2: 'EARNED',
  3: 'PERCEIVED',
};

// ── Helpers ────────────────────────────────────────────────

function getNodeRadius(node: EntityNode): number {
  if (node.kind === 'brand') return BRAND_RADIUS;
  return 7 + (node.authority_weight / 100) * 10;
}

function getPillarColor(pillar: string | null): string {
  if (!pillar) return '#A855F7'; // Brand Core = iris purple
  return PILLAR_COLORS[pillar] ?? '#00D9FF';
}

function getEdgeVisuals(state: EdgeState): { dashArray: string; baseOpacity: number; animate: boolean } {
  switch (state) {
    case 'verified_solid':
      return { dashArray: '', baseOpacity: 0.6, animate: false };
    case 'verified_pending':
      return { dashArray: '', baseOpacity: 0.25, animate: false };
    case 'gap':
      return { dashArray: '5,4', baseOpacity: 0.3, animate: false };
    case 'in_progress':
      return { dashArray: '5,4', baseOpacity: 0.5, animate: true };
  }
}

function getEdgeWidth(strength: number): number {
  if (strength >= 85) return 2;
  if (strength >= 30) return 1;
  return 0.5;
}

/**
 * Position a node on its ring by affinity_score.
 * Top of ring (−π/2) = highest affinity. Clockwise.
 */
function computeNodePosition(
  node: EntityNode,
  sortedRingNodes: EntityNode[],
): { x: number; y: number } {
  if (node.kind === 'brand') return { x: CX, y: CY };

  const radius = RING_RADII[node.ring] ?? 200;
  const index = sortedRingNodes.findIndex((n) => n.id === node.id);
  const count = sortedRingNodes.length;

  const minGapRad = (MIN_ARC_GAP_DEG * Math.PI) / 180;
  const arcStep = Math.min((Math.PI * 2) / Math.max(count, 1), Math.PI * 2 - minGapRad);
  const usedArc = count > 1 ? arcStep : 0;

  const angle = -Math.PI / 2 + index * usedArc;

  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  };
}

// ── Types ──────────────────────────────────────────────────

interface EntityMapProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  sessionEvents?: SessionCitationEvent[];
  actionImpacts?: Record<string, ActionImpactMap>;
  hoveredActionId?: string | null;
  executingActionId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  zoom?: number; // 0.6 – 1.5, default 1.0
}

// ── Component ──────────────────────────────────────────────

export function EntityMap({
  nodes,
  edges,
  sessionEvents = [],
  actionImpacts = {},
  hoveredActionId,
  executingActionId,
  onNodeClick,
  zoom = 1.0,
}: EntityMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pulsingNodes, setPulsingNodes] = useState<Set<string>>(new Set());

  // ── Group + sort nodes by ring ──
  const nodesByRing = useMemo(() => {
    const map = new Map<number, EntityNode[]>();
    for (const node of nodes) {
      if (!map.has(node.ring)) map.set(node.ring, []);
      map.get(node.ring)!.push(node);
    }
    // Sort each ring by affinity descending
    for (const [, ringNodes] of map) {
      ringNodes.sort((a, b) => b.affinity_score - a.affinity_score);
    }
    return map;
  }, [nodes]);

  // ── Handle cluster overflow (>8 per ring) ──
  const displayNodes = useMemo(() => {
    const result: EntityNode[] = [];
    for (const [ring, ringNodes] of nodesByRing) {
      if (ring === 0) {
        result.push(...ringNodes);
        continue;
      }
      if (ringNodes.length <= MAX_NODES_PER_RING) {
        result.push(...ringNodes);
      } else {
        // Keep top 7, cluster the rest
        const visible = ringNodes.slice(0, 7);
        const overflow = ringNodes.slice(7);
        result.push(...visible);
        // Synthetic cluster node
        const avgAffinity = overflow.reduce((s, n) => s + n.affinity_score, 0) / overflow.length;
        const avgAuthority = overflow.reduce((s, n) => s + n.authority_weight, 0) / overflow.length;
        result.push({
          id: `cluster-ring-${ring}`,
          kind: overflow[0].kind,
          label: `+${overflow.length} more`,
          ring: ring as 0 | 1 | 2 | 3,
          pillar: overflow[0].pillar,
          affinity_score: avgAffinity,
          authority_weight: avgAuthority,
          connection_status: 'verified_pending',
          linked_action_id: null,
          entity_insight: `${overflow.length} additional entities in this ring.`,
          impact_pillars: [],
          last_updated: new Date().toISOString(),
          meta: { is_cluster: true, count: overflow.length },
        });
      }
    }
    return result;
  }, [nodesByRing]);

  // ── Recompute sorted ring lists for display nodes ──
  const displayByRing = useMemo(() => {
    const map = new Map<number, EntityNode[]>();
    for (const node of displayNodes) {
      if (!map.has(node.ring)) map.set(node.ring, []);
      map.get(node.ring)!.push(node);
    }
    for (const [, ringNodes] of map) {
      ringNodes.sort((a, b) => b.affinity_score - a.affinity_score);
    }
    return map;
  }, [displayNodes]);

  // ── Compute positions ──
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    for (const node of displayNodes) {
      const sortedRing = displayByRing.get(node.ring) ?? [];
      pos.set(node.id, computeNodePosition(node, sortedRing));
    }
    return pos;
  }, [displayNodes, displayByRing]);

  // ── Chain illumination: connected nodes for selected node ──
  const chainNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const chain = new Set<string>([selectedNodeId, 'brand']);
    for (const edge of edges) {
      if (edge.from === selectedNodeId || edge.to === selectedNodeId) {
        chain.add(edge.from);
        chain.add(edge.to);
      }
    }
    return chain;
  }, [selectedNodeId, edges]);

  const chainEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const edge of edges) {
      if (edge.from === selectedNodeId || edge.to === selectedNodeId) {
        set.add(edge.id);
      }
    }
    return set;
  }, [selectedNodeId, edges]);

  // ── Action hover impact ──
  const hoveredImpact = useMemo(() => {
    if (hoveredActionId && actionImpacts[hoveredActionId]) {
      return actionImpacts[hoveredActionId];
    }
    return null;
  }, [hoveredActionId, actionImpacts]);

  // ── Execute pulse ──
  useEffect(() => {
    if (!executingActionId || !actionImpacts[executingActionId]) return;
    const impact = actionImpacts[executingActionId];
    setPulsingNodes(new Set(impact.impacted_nodes));
    const timer = setTimeout(() => setPulsingNodes(new Set()), 800);
    return () => clearTimeout(timer);
  }, [executingActionId, actionImpacts]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
      onNodeClick?.(nodeId);
    },
    [onNodeClick],
  );

  const selectedNode = selectedNodeId ? displayNodes.find((n) => n.id === selectedNodeId) : null;
  const hasChain = selectedNodeId !== null;
  const hasHover = hoveredImpact !== null;

  // ── Opacity logic ──
  function getNodeOpacity(node: EntityNode): number {
    if (hasChain) return chainNodes.has(node.id) ? 1 : 0.15;
    if (hasHover) return hoveredImpact!.impacted_nodes.includes(node.id) ? 1 : 0.3;
    return 1;
  }

  function getEdgeOpacity(edge: EntityEdge): number {
    const vis = getEdgeVisuals(edge.state);
    if (hasChain) return chainEdges.has(edge.id) ? Math.min(vis.baseOpacity * 1.5, 1) : 0.05;
    if (hasHover) return hoveredImpact!.impacted_edges.includes(edge.id) ? Math.min(vis.baseOpacity * 1.5, 1) : 0.05;
    return vis.baseOpacity;
  }

  return (
    <div className="entity-map-v3 relative w-full h-full">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(300, 300) scale(${zoom}) translate(-300, -300)`}>
        <defs>
          {/* Glow filters per pillar */}
          {Object.entries(PILLAR_COLORS).map(([key, color]) => (
            <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {/* Brand pulse gradient */}
          <radialGradient id="brand-pulse-grad">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
          {/* Ring zone fill gradients */}
          <radialGradient id="ring1-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0" />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.025" />
          </radialGradient>
          <radialGradient id="ring2-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E879F9" stopOpacity="0" />
            <stop offset="100%" stopColor="#E879F9" stopOpacity="0.02" />
          </radialGradient>
          <radialGradient id="ring3-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* ── Ring boundaries ── */}
        {[1, 2, 3].map((ring) => (
          <circle
            key={`ring-boundary-${ring}`}
            cx={CX}
            cy={CY}
            r={RING_RADII[ring]}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* ── Ring zone fills — subtle radial territory color ── */}
        {/* Ring 3 fill (outermost first so inner rings paint over) */}
        <circle cx={300} cy={300} r={285} fill="url(#ring3-fill)" />
        {/* Ring 2 fill */}
        <circle cx={300} cy={300} r={210} fill="url(#ring2-fill)" />
        {/* Ring 1 fill */}
        <circle cx={300} cy={300} r={115} fill="url(#ring1-fill)" />

        {/* ── Ring labels — upper-right quadrant (45° from top) ── */}
        {[1, 2, 3].map((ring) => {
          const angle = -Math.PI / 4; // 45° clockwise from top
          const lx = CX + Math.cos(angle) * RING_RADII[ring];
          const ly = CY + Math.sin(angle) * RING_RADII[ring];
          const label = RING_LABELS[ring];
          const charWidth = 6.5; // approximate per-char width at fontSize 9
          const pillW = label.length * charWidth + 12;
          const pillH = 16;

          return (
            <g key={`ring-label-${ring}`}>
              <rect
                x={lx - pillW / 2}
                y={ly - pillH / 2}
                width={pillW}
                height={pillH}
                rx={8}
                fill="rgba(0,0,0,0.45)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
              <text
                x={lx}
                y={ly + 3.5}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize={9}
                fontWeight={600}
                letterSpacing="0.1em"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Edges ── */}
        <g className="edges">
          {edges.map((edge) => {
            const fromPos = positions.get(edge.from);
            const toPos = positions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const vis = getEdgeVisuals(edge.state);
            const width = getEdgeWidth(edge.strength);
            const opacity = getEdgeOpacity(edge);
            const color = edge.state === 'gap' ? 'rgba(255,255,255,0.28)' : getPillarColor(edge.pillar);

            return (
              <line
                key={edge.id}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={color}
                strokeWidth={width}
                strokeOpacity={opacity}
                strokeDasharray={vis.dashArray || undefined}
                className={vis.animate ? 'animate-dash-travel' : ''}
                style={{ transition: 'stroke-opacity 200ms ease-out' }}
              />
            );
          })}
        </g>

        {/* ── Brand Core pulse ring ── */}
        <circle
          cx={CX}
          cy={CY}
          r={BRAND_RADIUS + 12}
          fill="url(#brand-pulse-grad)"
          className="animate-brand-pulse"
        />

        {/* ── Nodes ── */}
        <g className="nodes">
          {displayNodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const r = getNodeRadius(node);
            const color = getPillarColor(node.pillar);
            const opacity = getNodeOpacity(node);
            const isSelected = node.id === selectedNodeId;
            const isPulsing = pulsingNodes.has(node.id);
            const isVerified = node.connection_status === 'verified_solid';
            const scale = isSelected ? 1.3 : isPulsing ? 1.15 : 1;
            const isBrand = node.kind === 'brand';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
                style={{
                  opacity,
                  transition: 'opacity 200ms ease-out',
                }}
              >
                {/* Glow for verified-solid nodes */}
                {isVerified && !hasChain && (
                  <circle
                    r={r + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    filter={node.pillar ? `url(#glow-${node.pillar})` : undefined}
                  />
                )}

                {/* Node circle */}
                <circle
                  r={r}
                  fill={isBrand ? '#A855F7' : `${color}20`}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isBrand ? 1 : 0.6}
                />

                {/* Label */}
                <text
                  y={r + 12}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={
                    isSelected
                      ? 1
                      : hasChain
                        ? chainNodes.has(node.id)
                          ? 0.85
                          : 0.15
                        : 0.7
                  }
                  fontSize={isBrand ? 11 : 9}
                  fontWeight={isBrand ? 700 : 500}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── Session citation particles ── */}
        {sessionEvents.map((event, i) => {
          const sourcePos = positions.get(event.entity_id_source);
          const perceiverPos = positions.get(event.entity_id_perceiver);
          if (!sourcePos || !perceiverPos) return null;

          return (
            <circle key={`citation-particle-${i}`} r={3} fill="#00D9FF" opacity={0}>
              <animateMotion
                dur="1.5s"
                begin={`${i * 0.5}s`}
                fill="freeze"
                path={`M${sourcePos.x},${sourcePos.y} L${perceiverPos.x},${perceiverPos.y}`}
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0.4;0"
                dur="3s"
                begin={`${i * 0.5}s`}
                fill="freeze"
              />
            </circle>
          );
        })}

        </g>{/* close zoom wrapper */}
      </svg>

      {/* ── Progressive Disclosure Panel ── */}
      {selectedNode && (
        <div
          className="absolute top-2 right-2 w-[240px] bg-slate-2 border border-border-subtle rounded-lg p-3 shadow-lg"
          style={{ animation: 'slideInRight 250ms ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: `${getPillarColor(selectedNode.pillar)}15`,
                  color: getPillarColor(selectedNode.pillar),
                }}
              >
                {selectedNode.kind.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-white/90 truncate">{selectedNode.label}</span>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="shrink-0 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Affinity</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedNode.affinity_score}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Authority</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedNode.authority_weight}</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Connection</span>
            <p className="text-xs text-white/70 mt-0.5 capitalize">
              {selectedNode.connection_status.replaceAll('_', ' ')}
            </p>
          </div>

          {/* Intelligence Brief */}
          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Intelligence</span>
            <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
              {selectedNode.entity_insight}
            </p>
          </div>

          {/* Pillar Impact */}
          {selectedNode.impact_pillars.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Pillar Impact</span>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedNode.impact_pillars.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                    style={{
                      backgroundColor: `${PILLAR_COLORS[p] ?? '#00D9FF'}15`,
                      color: PILLAR_COLORS[p] ?? '#00D9FF',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked Action */}
          {selectedNode.linked_action_id && (
            <button className="w-full text-left px-2 py-1.5 text-xs text-brand-cyan hover:bg-brand-cyan/5 border border-brand-cyan/20 rounded transition-colors">
              Open linked action &rarr;
            </button>
          )}
        </div>
      )}

      {/* ── Animation styles ── */}
      <style jsx>{`
        @keyframes brand-pulse {
          0%,
          100% {
            opacity: 0.15;
            r: ${BRAND_RADIUS + 12};
          }
          50% {
            opacity: 0;
            r: ${BRAND_RADIUS + 24};
          }
        }
        .animate-brand-pulse {
          animation: brand-pulse 3s ease-in-out infinite;
        }
        @keyframes dash-travel {
          to {
            stroke-dashoffset: -18;
          }
        }
        .animate-dash-travel {
          animation: dash-travel 2s linear infinite;
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default EntityMap;
