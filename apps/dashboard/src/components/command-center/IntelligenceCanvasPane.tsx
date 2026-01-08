'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * IntelligenceCanvasPane - Knowledge Graph & Citation Feed
 *
 * Features per reference:
 * - Intelligence Entity Map (network visualization with glowing nodes)
 * - Live Citation Feed with platform badges
 * - Statistics cards (Share of Model Voice, Citation Velocity, Media Coverage)
 * - Competitive Intelligence Dashboard
 * - Node focus interaction
 *
 * @see /contracts/examples/intelligence-canvas.json
 */

import { useState } from 'react';
import type { Citation, GraphEdge, GraphNode, IntelligenceCanvasResponse, NodeKind } from './types';

interface IntelligenceCanvasPaneProps {
  data: IntelligenceCanvasResponse | null;
  isLoading: boolean;
  error: Error | null;
}

// Node kind styling - DS v3 with glows
const nodeKindConfig: Record<NodeKind, {
  bg: string;
  text: string;
  border: string;
  glow: string;
  label: string;
}> = {
  brand: {
    bg: 'bg-brand-cyan/15',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/40',
    glow: 'shadow-[0_0_12px_rgba(0,217,255,0.3)]',
    label: 'Brand',
  },
  journalist: {
    bg: 'bg-brand-magenta/15',
    text: 'text-brand-magenta',
    border: 'border-brand-magenta/40',
    glow: 'shadow-[0_0_12px_rgba(232,121,249,0.3)]',
    label: 'Journalist',
  },
  outlet: {
    bg: 'bg-brand-iris/15',
    text: 'text-brand-iris',
    border: 'border-brand-iris/40',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    label: 'Outlet',
  },
  ai_model: {
    bg: 'bg-semantic-success/15',
    text: 'text-semantic-success',
    border: 'border-semantic-success/40',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    label: 'AI Model',
  },
  topic: {
    bg: 'bg-brand-amber/15',
    text: 'text-brand-amber',
    border: 'border-brand-amber/40',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    label: 'Topic',
  },
  competitor: {
    bg: 'bg-semantic-danger/15',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/40',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    label: 'Competitor',
  },
};

// Platform styling - DS v3
const platformConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  chatgpt: { label: 'GPT', bg: 'bg-[#10A37F]/15', text: 'text-[#10A37F]', icon: '🤖' },
  perplexity: { label: 'Perplexity', bg: 'bg-[#20B2AA]/15', text: 'text-[#20B2AA]', icon: '🔮' },
  claude: { label: 'Claude', bg: 'bg-brand-amber/15', text: 'text-brand-amber', icon: '🧠' },
  gemini: { label: 'Gemini', bg: 'bg-[#4285F4]/15', text: 'text-[#4285F4]', icon: '💎' },
};

function NodeIcon({ kind, className }: { kind: NodeKind; className?: string }) {
  const baseClass = `${className || 'w-4 h-4'}`;
  switch (kind) {
    case 'brand':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-.293.707l-3 3A1 1 0 0112 20H6a2 2 0 01-2-2V4zm5 0a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
      );
    case 'journalist':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      );
    case 'ai_model':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
        </svg>
      );
    default:
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
  }
}

// Stats Card Component
function StatsCard({ label, value, delta, trend, color }: {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  color: 'cyan' | 'iris' | 'magenta';
}) {
  const colors = {
    cyan: { text: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/30' },
    iris: { text: 'text-brand-iris', bg: 'bg-brand-iris/10', border: 'border-brand-iris/30' },
    magenta: { text: 'text-brand-magenta', bg: 'bg-brand-magenta/10', border: 'border-brand-magenta/30' },
  };
  const c = colors[color];

  return (
    <div className={`p-3 rounded-lg ${c.bg} border ${c.border}`}>
      <p className="text-[10px] text-slate-5 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {delta && (
        <p className={`text-[10px] mt-1 ${trend === 'up' ? 'text-semantic-success' : trend === 'down' ? 'text-semantic-danger' : 'text-slate-5'}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
        </p>
      )}
    </div>
  );
}

// Citation Card Component
function CitationCard({ citation }: { citation: Citation }) {
  const platform = platformConfig[citation.platform] || {
    label: citation.platform.toUpperCase(),
    bg: 'bg-slate-5/15',
    text: 'text-white',
    icon: '🔗',
  };

  const timeAgo = getTimeAgo(citation.detected_at);
  const qualityColor = citation.context_quality >= 8 ? 'text-semantic-success' : citation.context_quality >= 5 ? 'text-brand-amber' : 'text-semantic-danger';

  return (
    <div className="p-3 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-brand-cyan/30 hover:shadow-[0_0_16px_rgba(0,217,255,0.08)] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 text-[10px] font-bold ${platform.bg} ${platform.text} rounded border border-current/20`}>
          {platform.icon} {platform.label}
        </span>
        <span className="text-[9px] text-slate-6">{timeAgo}</span>
      </div>

      {/* Query */}
      <p className="text-[10px] text-slate-5 mb-1.5 italic truncate">&quot;{citation.query}&quot;</p>

      {/* Snippet */}
      <p className="text-[11px] text-white/90 line-clamp-2 mb-2 leading-relaxed">{citation.snippet}</p>

      {/* Metrics */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#1A1A24]">
        <span className="text-[9px] text-slate-5">
          Pos <span className="text-brand-cyan font-bold">#{citation.position}</span>
        </span>
        <span className="text-[9px] text-slate-5">
          Quality <span className={`font-bold ${qualityColor}`}>{citation.context_quality}/10</span>
        </span>
        {citation.source_url && (
          <a href={citation.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[9px] text-brand-cyan hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </a>
        )}
      </div>
    </div>
  );
}

// Network Graph Visualization (placeholder with node indicators)
function NetworkGraph({ nodes, edges, focusedNodeId, onNodeClick }: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}) {
  const focusedNode = focusedNodeId ? nodes.find(n => n.id === focusedNodeId) : null;
  const relatedEdges = focusedNodeId ? edges.filter(e => e.from === focusedNodeId || e.to === focusedNodeId) : [];

  return (
    <div className="relative bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden">
      {/* Graph area */}
      <div className="h-48 relative">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-brand-cyan/20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Node indicators - positioned around center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {focusedNode ? (
            // Focused node view
            <div className="text-center px-4">
              <div className={`w-14 h-14 mx-auto mb-2 rounded-full ${nodeKindConfig[focusedNode.kind].bg} ${nodeKindConfig[focusedNode.kind].glow} border ${nodeKindConfig[focusedNode.kind].border} flex items-center justify-center`}>
                <NodeIcon kind={focusedNode.kind} className={`w-7 h-7 ${nodeKindConfig[focusedNode.kind].text}`} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{focusedNode.label}</p>
              <p className="text-[10px] text-slate-5">{relatedEdges.length} connections</p>
              <button onClick={() => onNodeClick('')} className="mt-2 text-[10px] text-brand-cyan hover:underline">
                Clear focus
              </button>
            </div>
          ) : (
            // Default view with floating nodes
            <div className="relative w-full h-full">
              {/* Central brand node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-12 h-12 rounded-full bg-brand-cyan/15 border border-brand-cyan/40 shadow-[0_0_20px_rgba(0,217,255,0.3)] flex items-center justify-center animate-pulse`}>
                  <span className="text-lg">🏢</span>
                </div>
              </div>
              {/* Surrounding nodes - positioned manually for visual effect */}
              {nodes.slice(0, 6).map((node, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 70;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const config = nodeKindConfig[node.kind];
                return (
                  <button
                    key={node.id}
                    onClick={() => onNodeClick(node.id)}
                    className={`absolute w-8 h-8 rounded-full ${config.bg} border ${config.border} ${config.glow} flex items-center justify-center hover:scale-110 transition-transform`}
                    style={{ top: `calc(50% + ${y}px - 16px)`, left: `calc(50% + ${x}px - 16px)` }}
                  >
                    <NodeIcon kind={node.kind} className={`w-4 h-4 ${config.text}`} />
                  </button>
                );
              })}
              {/* Connection lines (decorative) */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                {nodes.slice(0, 6).map((_, i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  const radius = 70;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                    <line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`calc(50% + ${x}px)`}
                      y2={`calc(50% + ${y}px)`}
                      stroke="rgba(0,217,255,0.2)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-[#0A0A0F] border-t border-[#1A1A24] flex items-center justify-between">
        <span className="text-[10px] text-slate-5">
          {nodes.length} nodes · {edges.length} connections
        </span>
        <span className="text-[10px] text-brand-cyan">Click nodes to explore</span>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Graph skeleton */}
      <div className="h-48 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[#1A1A24]" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Citations skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <div className="p-3 bg-semantic-danger/8 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-semantic-danger">Failed to load intelligence</h4>
            <p className="text-[10px] text-slate-5 mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IntelligenceCanvasPane({ data, isLoading, error }: IntelligenceCanvasPaneProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return (
    <div className="p-6 text-center text-slate-5">
      <p className="text-xs">No intelligence data available</p>
    </div>
  );

  const handleNodeClick = (nodeId: string) => {
    setFocusedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Section: Intelligence Entity Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
            Intelligence Entity Map
          </h3>
          <span className="text-[9px] text-slate-5">Real-time connections</span>
        </div>
        <NetworkGraph
          nodes={data.nodes}
          edges={data.edges}
          focusedNodeId={focusedNodeId}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Section: Live Citation Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
            Live Citation Feed
          </h3>
          <span className="text-[9px] text-slate-5">{data.citation_feed.length} citations</span>
        </div>
        <div className="space-y-2">
          {data.citation_feed.slice(0, 4).map(citation => (
            <CitationCard key={citation.id} citation={citation} />
          ))}
        </div>
        {data.citation_feed.length > 4 && (
          <button className="w-full mt-2 py-2 text-[10px] text-brand-cyan hover:text-brand-cyan/80 transition-colors">
            View all {data.citation_feed.length} citations →
          </button>
        )}
      </div>

      {/* Section: Key Statistics */}
      <div>
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
          Key Statistics
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <StatsCard
            label="Share of Model Voice"
            value="23.4%"
            delta="+2.1% (7d)"
            trend="up"
            color="cyan"
          />
          <StatsCard
            label="Citation Velocity"
            value="847"
            delta="+12% (7d)"
            trend="up"
            color="iris"
          />
          <StatsCard
            label="Media Coverage"
            value="34"
            delta="+5 (7d)"
            trend="up"
            color="magenta"
          />
        </div>
      </div>

      {/* Section: Competitive Intelligence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-danger" />
            Competitive Intelligence
          </h3>
          <button className="text-[9px] text-slate-5 hover:text-brand-cyan transition-colors">
            Configure →
          </button>
        </div>
        <div className="bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-[#0A0A0F] border-b border-[#1A1A24] text-[9px] text-slate-5 uppercase tracking-wide">
            <span>Company</span>
            <span>Share</span>
            <span>Citations</span>
            <span>Sentiment</span>
            <span>Trend</span>
          </div>
          {/* Rows */}
          {[
            { name: 'Your Brand', share: '23.4%', citations: 847, sentiment: 8.2, trend: 'up', highlight: true },
            { name: 'Competitor A', share: '18.2%', citations: 623, sentiment: 7.1, trend: 'flat', highlight: false },
            { name: 'Competitor B', share: '15.5%', citations: 534, sentiment: 6.8, trend: 'down', highlight: false },
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-5 gap-2 px-3 py-2 text-[10px] ${row.highlight ? 'bg-brand-cyan/5' : ''} ${i !== 2 ? 'border-b border-[#1A1A24]' : ''}`}>
              <span className={`font-medium ${row.highlight ? 'text-brand-cyan' : 'text-white'}`}>{row.name}</span>
              <span className="text-white">{row.share}</span>
              <span className="text-white">{row.citations}</span>
              <span className={row.sentiment >= 8 ? 'text-semantic-success' : row.sentiment >= 6 ? 'text-brand-amber' : 'text-semantic-danger'}>{row.sentiment}</span>
              <span className={row.trend === 'up' ? 'text-semantic-success' : row.trend === 'down' ? 'text-semantic-danger' : 'text-slate-5'}>
                {row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
