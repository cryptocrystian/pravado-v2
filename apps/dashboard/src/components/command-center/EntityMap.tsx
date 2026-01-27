'use client';

/**
 * EntityMap v2 - SAGE-Native Graph Visualization
 *
 * VISUAL AUTHORITY:
 * - Canon: /docs/canon/ENTITY-MAP-SAGE.md
 * - Design System: DS_V3_REFERENCE.png
 *
 * ZONE-BASED LAYOUT (SAGE-Native):
 * - Authority Zone: Brand at center
 * - Signal Zone: Journalists/Outlets (left hemisphere)
 * - Growth Zone: Topics/AI Models (right hemisphere)
 * - Exposure Zone: Competitors (bottom)
 *
 * ACTION STREAM INTEGRATION:
 * - Hover: Highlights impacted nodes/edges, dims others
 * - Execute: Triggers pulse animation on affected entities
 *
 * @see /contracts/examples/entity-map.json
 */

import { useMemo, useEffect, useState } from 'react';
import type { EntityNode, EntityEdge, EntityZone, ActionImpactMap, Pillar, NodeKind } from './types';

// ============================================
// TYPES
// ============================================

interface EntityMapProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  layoutSeed: string;
  actionImpacts: Record<string, ActionImpactMap>;
  /** Currently hovered action ID from Action Stream */
  hoveredActionId: string | null;
  /** Currently executing action ID from Action Stream */
  executingActionId: string | null;
  /** Optional callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

// ============================================
// CONSTANTS
// ============================================

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 280;
const NODE_RADIUS = 16;
const BRAND_NODE_RADIUS = 24;

// Zone positions (percentages of canvas)
// zone: authority/signal/growth/exposure - SAGE-native layout
const ZONE_POSITIONS: Record<EntityZone, { x: number; y: number; spread: number }> = {
  authority: { x: 0.5, y: 0.45, spread: 0 }, // Center - brand anchor
  signal: { x: 0.22, y: 0.5, spread: 0.15 }, // Left hemisphere - journalists/outlets
  growth: { x: 0.78, y: 0.5, spread: 0.15 }, // Right hemisphere - topics/ai_models
  exposure: { x: 0.5, y: 0.85, spread: 0.2 }, // Bottom - competitors
};

// Node kind icons
const NODE_ICONS: Record<NodeKind, string> = {
  brand: 'M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-.293.707l-3 3A1 1 0 0112 20H6a2 2 0 01-2-2V4z',
  journalist: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z',
  outlet: 'M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z',
  ai_model: 'M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z',
  topic: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z',
  competitor: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z',
};

// Node kind colors (fallback when pillar not available)
const NODE_KIND_COLORS: Record<NodeKind, { fill: string; stroke: string; text: string }> = {
  brand: { fill: '#00D9FF', stroke: '#00D9FF', text: '#00D9FF' },
  journalist: { fill: '#E879F9', stroke: '#E879F9', text: '#E879F9' },
  outlet: { fill: '#A855F7', stroke: '#A855F7', text: '#A855F7' },
  ai_model: { fill: '#22C55E', stroke: '#22C55E', text: '#22C55E' },
  topic: { fill: '#F59E0B', stroke: '#F59E0B', text: '#F59E0B' },
  competitor: { fill: '#EF4444', stroke: '#EF4444', text: '#EF4444' },
};

// Pillar RGB values for animations
const PILLAR_RGB: Record<Pillar, string> = {
  pr: '232,121,249',
  content: '168,85,247',
  seo: '0,217,255',
};

// ============================================
// UTILS
// ============================================

/**
 * Generate deterministic position from seed + node ID
 * Uses simple hash to ensure stable positioning
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed: string): number {
  const hash = hashCode(seed);
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculate node positions based on zone and deterministic seed
 */
function calculateNodePositions(
  nodes: EntityNode[],
  layoutSeed: string
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const nodesByZone = new Map<EntityZone, EntityNode[]>();

  // Group nodes by zone
  for (const node of nodes) {
    const zone = node.zone;
    if (!nodesByZone.has(zone)) {
      nodesByZone.set(zone, []);
    }
    nodesByZone.get(zone)!.push(node);
  }

  // Calculate positions for each zone
  for (const [zone, zoneNodes] of nodesByZone) {
    const zoneConfig = ZONE_POSITIONS[zone];
    const centerX = zoneConfig.x * CANVAS_WIDTH;
    const centerY = zoneConfig.y * CANVAS_HEIGHT;

    zoneNodes.forEach((node, index) => {
      // Use seed + node ID for deterministic positioning
      const seedStr = `${layoutSeed}-${node.id}`;
      const randomOffset = seededRandom(seedStr);

      // Distribute nodes around zone center
      const angle = (index / zoneNodes.length) * Math.PI * 2 + randomOffset * 0.5;
      const radius = zone === 'authority' ? 0 : zoneConfig.spread * CANVAS_HEIGHT * (0.6 + randomOffset * 0.4);

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      positions.set(node.id, { x, y });
    });
  }

  return positions;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface EdgeLineProps {
  from: NodePosition;
  to: NodePosition;
  edge: EntityEdge;
  isHighlighted: boolean;
  isPulsing: boolean;
  isDimmed: boolean;
}

function EdgeLine({ from, to, edge, isHighlighted, isPulsing, isDimmed }: EdgeLineProps) {
  const pillarRgb = PILLAR_RGB[edge.pillar];
  const baseOpacity = isDimmed ? 0.1 : isHighlighted ? 0.8 : 0.3;
  const strokeWidth = isHighlighted ? 2 : 1;

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={`rgba(${pillarRgb}, ${baseOpacity})`}
      strokeWidth={strokeWidth}
      strokeDasharray={edge.strength < 0.5 ? '4,4' : undefined}
      className={isPulsing ? 'animate-edge-pulse' : ''}
      style={{
        transition: 'stroke-opacity 150ms ease-out, stroke-width 150ms ease-out',
        ['--pillar-rgb' as string]: pillarRgb,
        ['--base-width' as string]: `${strokeWidth}px`,
      }}
    />
  );
}

interface NodeCircleProps {
  node: EntityNode;
  position: NodePosition;
  isHighlighted: boolean;
  isPulsing: boolean;
  isDimmed: boolean;
  isDriver: boolean;
  onClick?: () => void;
}

function NodeCircle({
  node,
  position,
  isHighlighted,
  isPulsing,
  isDimmed,
  isDriver,
  onClick,
}: NodeCircleProps) {
  const isBrand = node.kind === 'brand';
  const radius = isBrand ? BRAND_NODE_RADIUS : NODE_RADIUS;
  const pillarRgb = PILLAR_RGB[node.pillar];
  const kindColors = NODE_KIND_COLORS[node.kind];

  const opacity = isDimmed ? 0.4 : 1;
  const glowSize = isHighlighted ? 12 : isPulsing ? 20 : 0;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      className={`cursor-pointer transition-opacity duration-150 ${isPulsing ? 'animate-entity-pulse' : ''}`}
      style={{
        opacity,
        ['--pillar-rgb' as string]: pillarRgb,
      }}
    >
      {/* Glow effect */}
      {(isHighlighted || isPulsing) && (
        <circle
          r={radius + 4}
          fill="none"
          stroke={`rgba(${pillarRgb}, 0.4)`}
          strokeWidth={2}
          style={{
            filter: `drop-shadow(0 0 ${glowSize}px rgba(${pillarRgb}, 0.6))`,
          }}
        />
      )}

      {/* Node background */}
      <circle
        r={radius}
        fill={`rgba(${pillarRgb}, 0.15)`}
        stroke={kindColors.stroke}
        strokeWidth={isHighlighted || isDriver ? 2 : 1}
        strokeOpacity={isDimmed ? 0.3 : 0.6}
      />

      {/* Node icon */}
      <svg
        x={-radius * 0.5}
        y={-radius * 0.5}
        width={radius}
        height={radius}
        viewBox="0 0 20 20"
        fill={kindColors.text}
        fillOpacity={isDimmed ? 0.4 : 0.9}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={NODE_ICONS[node.kind]} />
      </svg>

      {/* Label (only on highlight or brand) */}
      {(isHighlighted || isBrand) && (
        <text
          y={radius + 14}
          textAnchor="middle"
          fill="white"
          fillOpacity={isDimmed ? 0.3 : 0.85}
          fontSize={11}
          fontWeight={500}
        >
          {node.label}
        </text>
      )}

      {/* Driver indicator */}
      {isDriver && (
        <circle
          r={3}
          cx={radius - 4}
          cy={-radius + 4}
          fill="#22C55E"
          stroke="#0A0A0F"
          strokeWidth={1}
        />
      )}
    </g>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * EntityMap v2 - SAGE-Native Graph
 *
 * MARKER: entity-map-v2 (for CI guardrail check)
 */
export function EntityMap({
  nodes,
  edges,
  layoutSeed,
  actionImpacts,
  hoveredActionId,
  executingActionId,
  onNodeClick,
}: EntityMapProps) {
  // Track pulse animation state
  const [pulsingNodes, setPulsingNodes] = useState<Set<string>>(new Set());
  const [pulsingEdges, setPulsingEdges] = useState<Set<string>>(new Set());

  // Calculate positions once based on layout_seed (deterministic)
  const nodePositions = useMemo(
    () => calculateNodePositions(nodes, layoutSeed),
    [nodes, layoutSeed]
  );

  // Get current impact map
  const currentImpact = useMemo(() => {
    if (hoveredActionId && actionImpacts[hoveredActionId]) {
      return actionImpacts[hoveredActionId];
    }
    if (executingActionId && actionImpacts[executingActionId]) {
      return actionImpacts[executingActionId];
    }
    return null;
  }, [hoveredActionId, executingActionId, actionImpacts]);

  // Trigger pulse animation on execute
  useEffect(() => {
    if (!executingActionId || !actionImpacts[executingActionId]) {
      return;
    }

    const impact = actionImpacts[executingActionId];

    // Start pulse animation
    setPulsingNodes(new Set(impact.impacted_nodes));
    setPulsingEdges(new Set(impact.impacted_edges));

    // Clear after animation duration
    const timer = setTimeout(() => {
      setPulsingNodes(new Set());
      setPulsingEdges(new Set());
    }, 800);

    return () => clearTimeout(timer);
  }, [executingActionId, actionImpacts]);

  // Check if any action is affecting the map
  const hasActiveHighlight = currentImpact !== null;

  return (
    <div className="entity-map-v2 relative w-full h-full bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden">
      {/* Background grid */}
      <svg
        className="absolute inset-0 opacity-20 pointer-events-none"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="entity-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#entity-grid)" />
      </svg>

      {/* Zone labels */}
      <div className="absolute top-2 left-2 text-[10px] text-white/30 uppercase tracking-wide">
        Signal
      </div>
      <div className="absolute top-2 right-2 text-[10px] text-white/30 uppercase tracking-wide">
        Growth
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 uppercase tracking-wide">
        Exposure
      </div>

      {/* Main SVG canvas */}
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        <g className="edges">
          {edges.map((edge) => {
            const fromPos = nodePositions.get(edge.from);
            const toPos = nodePositions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const isHighlighted = currentImpact?.impacted_edges.includes(edge.id) ?? false;
            const isPulsing = pulsingEdges.has(edge.id);
            const isDimmed = hasActiveHighlight && !isHighlighted;

            return (
              <EdgeLine
                key={edge.id}
                from={fromPos}
                to={toPos}
                edge={edge}
                isHighlighted={isHighlighted}
                isPulsing={isPulsing}
                isDimmed={isDimmed}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const position = nodePositions.get(node.id);
            if (!position) return null;

            const isHighlighted = currentImpact?.impacted_nodes.includes(node.id) ?? false;
            const isPulsing = pulsingNodes.has(node.id);
            const isDimmed = hasActiveHighlight && !isHighlighted;
            const isDriver = currentImpact?.driver_node === node.id;

            return (
              <NodeCircle
                key={node.id}
                node={node}
                position={position}
                isHighlighted={isHighlighted}
                isPulsing={isPulsing}
                isDimmed={isDimmed}
                isDriver={isDriver}
                onClick={() => onNodeClick?.(node.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Stats overlay */}
      <div className="absolute bottom-2 right-2 text-[10px] text-white/40">
        {nodes.length} entities
      </div>

      {/* Pulse animation styles */}
      <style jsx>{`
        @keyframes entity-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes edge-pulse {
          0% { stroke-opacity: 0.3; stroke-width: 1px; }
          50% { stroke-opacity: 1; stroke-width: 3px; }
          100% { stroke-opacity: 0.5; stroke-width: 1.5px; }
        }
        .animate-entity-pulse {
          animation: entity-pulse 800ms ease-out;
        }
        .animate-edge-pulse {
          animation: edge-pulse 600ms ease-out;
        }
      `}</style>
    </div>
  );
}

export default EntityMap;
