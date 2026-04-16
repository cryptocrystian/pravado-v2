'use client';

/**
 * EntityMap v4 — 3D Force Graph
 *
 * MARKER: entity-map-v4
 *
 * Uses react-force-graph-3d for an interactive 3D entity visualization.
 * Nodes: Brand (large iris), AI engines (cyan), journalists (magenta),
 * topics (teal), competitors (dark with warning ring).
 * Edges: glowing lines, verified=solid, opportunity=dashed.
 * Ambient auto-rotation when idle. Labels on hover + top 5 nodes.
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { EntityNode, EntityEdge, EdgeState, SessionCitationEvent, ActionImpactMap } from './types';

// Dynamic import — react-force-graph-3d requires browser APIs
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// ── Color Map ──────────────────────────────────────────────

const KIND_COLORS: Record<string, string> = {
  brand: '#A855F7',         // iris
  ai_engine: '#00D9FF',     // cyan
  journalist: '#E879F9',    // magenta
  publication: '#E879F9',   // magenta
  topic_cluster: '#14B8A6', // teal
};

const PILLAR_COLORS: Record<string, string> = {
  PR: '#E879F9',
  SEO: '#00D9FF',
  AEO: '#A855F7',
};

function getNodeColor(node: EntityNode): string {
  return KIND_COLORS[node.kind] ?? '#00D9FF';
}

function getNodeSize(node: EntityNode): number {
  if (node.kind === 'brand') return 14;
  return 3 + (node.authority_weight / 100) * 8;
}

function getEdgeColor(edge: EntityEdge): string {
  if (edge.state === 'gap') return 'rgba(255,255,255,0.15)';
  return PILLAR_COLORS[edge.pillar ?? ''] ?? '#00D9FF';
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
  zoom?: number;
}

interface GraphNode {
  id: string;
  label: string;
  kind: string;
  color: string;
  size: number;
  ring: number;
  pillar: string | null;
  authorityWeight: number;
  affinityScore: number;
  connectionStatus: EdgeState;
  entityInsight: string;
  impactPillars: string[];
  linkedActionId: string | null;
  isTopNode: boolean;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
  width: number;
  dashed: boolean;
  id: string;
}

// ── Component ──────────────────────────────────────────────

export function EntityMap({
  nodes,
  edges,
  onNodeClick,
}: EntityMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRotating = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Top 5 nodes by authority for permanent labels
  const topNodeIds = useMemo(() => {
    const sorted = [...nodes]
      .filter(n => n.kind !== 'brand')
      .sort((a, b) => b.authority_weight - a.authority_weight);
    return new Set(sorted.slice(0, 5).map(n => n.id));
  }, [nodes]);

  // Build graph data
  const graphData = useMemo(() => {
    const graphNodes: GraphNode[] = nodes.map(n => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      color: getNodeColor(n),
      size: getNodeSize(n),
      ring: n.ring,
      pillar: n.pillar,
      authorityWeight: n.authority_weight,
      affinityScore: n.affinity_score,
      connectionStatus: n.connection_status,
      entityInsight: n.entity_insight ?? '',
      impactPillars: n.impact_pillars ?? [],
      linkedActionId: n.linked_action_id,
      isTopNode: n.kind === 'brand' || topNodeIds.has(n.id),
    }));

    const graphLinks: GraphLink[] = edges.map(e => ({
      source: e.from,
      target: e.to,
      color: getEdgeColor(e),
      width: e.state === 'verified_solid' ? 1.5 : 0.5,
      dashed: e.state === 'gap' || e.state === 'in_progress',
      id: e.id,
    }));

    return { nodes: graphNodes, links: graphLinks };
  }, [nodes, edges, topNodeIds]);

  // Auto-rotation
  useEffect(() => {
    if (!fgRef.current) return;
    const controls = fgRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
    }
  }, [mounted]);

  // Pause rotation on interaction, resume after idle
  const pauseRotation = useCallback(() => {
    if (fgRef.current?.controls()) {
      fgRef.current.controls().autoRotate = false;
      isRotating.current = false;
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (fgRef.current?.controls()) {
        fgRef.current.controls().autoRotate = true;
        isRotating.current = true;
      }
    }, 5000);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      pauseRotation();
      setSelectedNodeId(prev => (prev === node.id ? null : node.id));
      onNodeClick?.(node.id);
    },
    [onNodeClick, pauseRotation],
  );

  // Custom node rendering with Three.js + persistent SpriteText labels for top nodes
  const nodeThreeObject = useCallback(
    (node: GraphNode) => {
      if (typeof window === 'undefined') return undefined;
      const THREE = require('three');
      const SpriteText = require('three-spritetext').default;

      const group = new THREE.Group();

      // Sphere
      const geometry = new THREE.SphereGeometry(node.size, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: node.color,
        transparent: true,
        opacity: node.kind === 'brand' ? 1 : 0.85,
        emissive: node.color,
        emissiveIntensity: node.kind === 'brand' ? 0.5 : 0.2,
      });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);

      // Glow ring for brand
      if (node.kind === 'brand') {
        const glowGeo = new THREE.RingGeometry(node.size + 2, node.size + 4, 32);
        const glowMat = new THREE.MeshBasicMaterial({
          color: '#A855F7',
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(glowGeo, glowMat);
        group.add(ring);
      }

      // Persistent text label for brand + top-5 authority nodes
      if (node.isTopNode) {
        const sprite = new SpriteText(node.label);
        sprite.color = node.color;
        sprite.textHeight = node.kind === 'brand' ? 5 : 3.5;
        sprite.backgroundColor = 'rgba(10,10,15,0.75)';
        sprite.padding = 1.5;
        sprite.borderRadius = 2;
        sprite.position.y = node.size + 4;
        group.add(sprite);
      }

      return group;
    },
    [],
  );

  const selectedNode = selectedNodeId
    ? graphData.nodes.find(n => n.id === selectedNodeId)
    : null;

  // Container dimensions — ResizeObserver tracks actual container size
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  useEffect(() => {
    if (!containerRef.current) return;
    // Seed with current size immediately
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="entity-map-v4 relative" style={{ width: '100%', height: '100%', minHeight: 300 }}>
      {mounted && (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeThreeObject={nodeThreeObject as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          nodeThreeObjectExtend={false}
          nodeLabel={((node: any) => node.label) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          nodeVal={((node: any) => node.size) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          linkColor={((link: any) => link.color) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          linkWidth={((link: any) => link.width) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          linkOpacity={0.4}
          onNodeClick={handleNodeClick as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          onNodeHover={(() => { pauseRotation(); }) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
          showNavInfo={false}
          enableNodeDrag={true}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={50}
          cooldownTicks={100}
        />
      )}

      {/* ── Progressive Disclosure Panel ── */}
      {selectedNode && (
        <div
          className="absolute top-2 right-2 w-[240px] bg-slate-2 border border-border-subtle rounded-lg p-3 shadow-lg z-10"
          style={{ animation: 'slideInRight 250ms ease-out' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: `${selectedNode.color}15`,
                  color: selectedNode.color,
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

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Affinity</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedNode.affinityScore}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Authority</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedNode.authorityWeight}</p>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Connection</span>
            <p className="text-xs text-white/70 mt-0.5 capitalize">
              {selectedNode.connectionStatus.replaceAll('_', ' ')}
            </p>
          </div>

          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Intelligence</span>
            <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
              {selectedNode.entityInsight}
            </p>
          </div>

          {selectedNode.impactPillars.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Pillar Impact</span>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedNode.impactPillars.map((p) => (
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

          {selectedNode.linkedActionId && (
            <button className="w-full text-left px-2 py-1.5 text-xs text-brand-cyan hover:bg-brand-cyan/5 border border-brand-cyan/20 rounded transition-colors">
              Open linked action &rarr;
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default EntityMap;
