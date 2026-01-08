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
 * IntelligenceCanvasPane - 2-Row Layout with Tabs
 *
 * DS v3 density-optimized layout:
 * - TOP ROW: Intelligence Entity Map (fixed height, network visualization)
 * - BOTTOM ROW: Tabbed content with internal scroll
 *   - Tab 1: Live Citation Feed
 *   - Tab 2: Competitive Intelligence
 *
 * Designed for minimal vertical scroll at 1440p viewport.
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

// Network Graph Visualization - Fixed height for top row
function NetworkGraph({ nodes, edges, focusedNodeId, onNodeClick }: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}) {
  const focusedNode = focusedNodeId ? nodes.find(n => n.id === focusedNodeId) : null;
  const relatedEdges = focusedNodeId ? edges.filter(e => e.from === focusedNodeId || e.to === focusedNodeId) : [];

  return (
    <div className="relative bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden h-full">
      {/* Graph area - fills container */}
      <div className="h-full relative min-h-[180px]">
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
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${nodeKindConfig[focusedNode.kind].bg} ${nodeKindConfig[focusedNode.kind].glow} border ${nodeKindConfig[focusedNode.kind].border} flex items-center justify-center`}>
                <NodeIcon kind={focusedNode.kind} className={`w-6 h-6 ${nodeKindConfig[focusedNode.kind].text}`} />
              </div>
              <p className="text-sm font-semibold text-white mb-0.5">{focusedNode.label}</p>
              <p className="text-[9px] text-slate-5">{relatedEdges.length} connections</p>
              <button onClick={() => onNodeClick('')} className="mt-1.5 text-[9px] text-brand-cyan hover:underline">
                Clear focus
              </button>
            </div>
          ) : (
            // Default view with floating nodes
            <div className="relative w-full h-full">
              {/* Central brand node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-10 h-10 rounded-full bg-brand-cyan/15 border border-brand-cyan/40 shadow-[0_0_20px_rgba(0,217,255,0.3)] flex items-center justify-center animate-pulse`}>
                  <span className="text-base">🏢</span>
                </div>
              </div>
              {/* Surrounding nodes */}
              {nodes.slice(0, 6).map((node, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 60;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const config = nodeKindConfig[node.kind];
                return (
                  <button
                    key={node.id}
                    onClick={() => onNodeClick(node.id)}
                    className={`absolute w-7 h-7 rounded-full ${config.bg} border ${config.border} ${config.glow} flex items-center justify-center hover:scale-110 transition-transform`}
                    style={{ top: `calc(50% + ${y}px - 14px)`, left: `calc(50% + ${x}px - 14px)` }}
                  >
                    <NodeIcon kind={node.kind} className={`w-3.5 h-3.5 ${config.text}`} />
                  </button>
                );
              })}
              {/* Connection lines (decorative) */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                {nodes.slice(0, 6).map((_, i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  const radius = 60;
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

        {/* Legend overlay - bottom left */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
          {(['ai_model', 'journalist', 'topic'] as NodeKind[]).map(kind => (
            <span key={kind} className={`px-1.5 py-0.5 text-[8px] font-medium rounded ${nodeKindConfig[kind].bg} ${nodeKindConfig[kind].text}`}>
              {nodeKindConfig[kind].label}
            </span>
          ))}
        </div>

        {/* Stats overlay - bottom right */}
        <div className="absolute bottom-2 right-2 text-[9px] text-slate-5">
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>
    </div>
  );
}

// Citation Card - Compact version
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
    <div className="p-2.5 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-brand-cyan/30 hover:shadow-[0_0_12px_rgba(0,217,255,0.06)] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`px-1.5 py-0.5 text-[9px] font-bold ${platform.bg} ${platform.text} rounded border border-current/20`}>
          {platform.icon} {platform.label}
        </span>
        <span className="text-[8px] text-slate-6">{timeAgo}</span>
      </div>

      {/* Query */}
      <p className="text-[9px] text-slate-5 mb-1 italic truncate">&quot;{citation.query}&quot;</p>

      {/* Snippet */}
      <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">{citation.snippet}</p>

      {/* Metrics */}
      <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-[#1A1A24]">
        <span className="text-[8px] text-slate-5">
          Pos <span className="text-brand-cyan font-bold">#{citation.position}</span>
        </span>
        <span className="text-[8px] text-slate-5">
          Quality <span className={`font-bold ${qualityColor}`}>{citation.context_quality}/10</span>
        </span>
        {citation.source_url && (
          <a href={citation.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[8px] text-brand-cyan hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </a>
        )}
      </div>
    </div>
  );
}

// Competitive Intelligence Table - Compact
function CompetitiveIntelTable() {
  const competitors = [
    { name: 'Your Brand', share: '23.4%', citations: 847, sentiment: 8.2, trend: 'up' as const, highlight: true },
    { name: 'Competitor A', share: '18.2%', citations: 623, sentiment: 7.1, trend: 'flat' as const, highlight: false },
    { name: 'Competitor B', share: '15.5%', citations: 534, sentiment: 6.8, trend: 'down' as const, highlight: false },
    { name: 'Competitor C', share: '12.1%', citations: 412, sentiment: 7.4, trend: 'up' as const, highlight: false },
  ];

  return (
    <div className="bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-[#0A0A0F] border-b border-[#1A1A24] text-[8px] text-slate-5 uppercase tracking-wide">
        <span>Company</span>
        <span>Share</span>
        <span>Citations</span>
        <span>Sentiment</span>
        <span>Trend</span>
      </div>
      {/* Rows */}
      {competitors.map((row, i) => (
        <div key={i} className={`grid grid-cols-5 gap-2 px-3 py-2 text-[10px] ${row.highlight ? 'bg-brand-cyan/5' : ''} ${i !== competitors.length - 1 ? 'border-b border-[#1A1A24]' : ''}`}>
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
  );
}

// Stats Cards Row - Compact inline
function StatsRow() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="p-2 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
        <p className="text-[8px] text-slate-5 uppercase tracking-wide">Share of Voice</p>
        <p className="text-lg font-bold text-brand-cyan">23.4%</p>
        <p className="text-[8px] text-semantic-success">↑ +2.1%</p>
      </div>
      <div className="p-2 rounded-lg bg-brand-iris/10 border border-brand-iris/30">
        <p className="text-[8px] text-slate-5 uppercase tracking-wide">Citations</p>
        <p className="text-lg font-bold text-brand-iris">847</p>
        <p className="text-[8px] text-semantic-success">↑ +12%</p>
      </div>
      <div className="p-2 rounded-lg bg-brand-magenta/10 border border-brand-magenta/30">
        <p className="text-[8px] text-slate-5 uppercase tracking-wide">Coverage</p>
        <p className="text-lg font-bold text-brand-magenta">34</p>
        <p className="text-[8px] text-semantic-success">↑ +5</p>
      </div>
    </div>
  );
}

// Tab Content Components
type TabId = 'citations' | 'competitive';

interface TabConfig {
  id: TabId;
  label: string;
  count?: number;
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
    <div className="h-full flex flex-col p-3">
      {/* Top: Graph skeleton */}
      <div className="h-[200px] bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse flex items-center justify-center mb-3">
        <div className="w-10 h-10 rounded-full bg-[#1A1A24]" />
      </div>
      {/* Bottom: Tabs + content skeleton */}
      <div className="flex-1 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
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
  const [activeTab, setActiveTab] = useState<TabId>('citations');

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

  const tabs: TabConfig[] = [
    { id: 'citations', label: 'Citations', count: data.citation_feed.length },
    { id: 'competitive', label: 'Competitive Intel' },
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* TOP ROW: Intelligence Entity Map (fixed height) */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
            Intelligence Entity Map
          </h3>
          <span className="text-[9px] text-slate-5">Real-time connections</span>
        </div>
        <div className="h-[200px]">
          <NetworkGraph
            nodes={data.nodes}
            edges={data.edges}
            focusedNodeId={focusedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      {/* BOTTOM ROW: Tabbed Content (flexible height with internal scroll) */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center border-b border-[#1A1A24] px-1 bg-[#0A0A0F]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-3 py-2 text-[10px] font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-brand-cyan'
                  : 'text-slate-5 hover:text-white'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1 py-0.5 text-[8px] rounded ${activeTab === tab.id ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-slate-5/20 text-slate-5'}`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'citations' && (
            <div className="space-y-3">
              {/* Stats Row */}
              <StatsRow />

              {/* Citation Feed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-semibold text-slate-5 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-semantic-success animate-pulse" />
                    Live Feed
                  </h4>
                </div>
                <div className="space-y-2">
                  {data.citation_feed.slice(0, 5).map(citation => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                </div>
                {data.citation_feed.length > 5 && (
                  <button className="w-full mt-2 py-1.5 text-[9px] text-brand-cyan hover:text-brand-cyan/80 transition-colors border border-brand-cyan/20 rounded hover:bg-brand-cyan/5">
                    View all {data.citation_feed.length} citations →
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'competitive' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-semibold text-slate-5 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-semantic-danger" />
                  Competitive Landscape
                </h4>
                <button className="text-[8px] text-slate-5 hover:text-brand-cyan transition-colors">
                  Configure →
                </button>
              </div>
              <CompetitiveIntelTable />

              {/* Trend Chart Placeholder */}
              <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
                <h5 className="text-[9px] text-slate-5 uppercase tracking-wide mb-2">Share of Voice Trend</h5>
                <div className="h-20 flex items-end gap-1">
                  {[40, 42, 38, 45, 48, 52, 56, 54, 58, 62, 65, 70].map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-brand-cyan/30 rounded-t hover:bg-brand-cyan/50 transition-colors"
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[8px] text-slate-6">
                  <span>12 weeks ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
