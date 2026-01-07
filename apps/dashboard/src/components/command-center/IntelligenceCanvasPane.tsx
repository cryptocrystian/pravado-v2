'use client';

/**
 * IntelligenceCanvasPane - Knowledge Graph & Citation Feed
 *
 * Displays the intelligence canvas with:
 * - Node list with icons and focus interaction
 * - Citation feed showing AI model mentions
 * - Mini graph visualization placeholder
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

// Node kind styling with SVG icon components
const nodeKindConfig: Record<
  NodeKind,
  {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    borderFocus: string;
    glow: string;
    label: string;
  }
> = {
  brand: {
    bg: 'bg-brand-cyan/10',
    bgHover: 'bg-brand-cyan/20',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/20',
    borderFocus: 'border-brand-cyan/60',
    glow: 'shadow-[0_0_12px_rgba(0,217,255,0.15)]',
    label: 'Brand',
  },
  journalist: {
    bg: 'bg-brand-magenta/10',
    bgHover: 'bg-brand-magenta/20',
    text: 'text-brand-magenta',
    border: 'border-brand-magenta/20',
    borderFocus: 'border-brand-magenta/60',
    glow: 'shadow-[0_0_12px_rgba(232,121,249,0.15)]',
    label: 'Journalist',
  },
  outlet: {
    bg: 'bg-brand-iris/10',
    bgHover: 'bg-brand-iris/20',
    text: 'text-brand-iris',
    border: 'border-brand-iris/20',
    borderFocus: 'border-brand-iris/60',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]',
    label: 'Outlet',
  },
  ai_model: {
    bg: 'bg-semantic-success/10',
    bgHover: 'bg-semantic-success/20',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    borderFocus: 'border-semantic-success/60',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.15)]',
    label: 'AI Model',
  },
  topic: {
    bg: 'bg-brand-amber/10',
    bgHover: 'bg-brand-amber/20',
    text: 'text-brand-amber',
    border: 'border-brand-amber/20',
    borderFocus: 'border-brand-amber/60',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    label: 'Topic',
  },
  competitor: {
    bg: 'bg-semantic-danger/10',
    bgHover: 'bg-semantic-danger/20',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/20',
    borderFocus: 'border-semantic-danger/60',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]',
    label: 'Competitor',
  },
};

// Platform styling
const platformConfig: Record<string, { label: string; bg: string; text: string }> = {
  chatgpt: { label: 'ChatGPT', bg: 'bg-[#10A37F]/10', text: 'text-[#10A37F]' },
  perplexity: { label: 'Perplexity', bg: 'bg-[#20B2AA]/10', text: 'text-[#20B2AA]' },
  claude: { label: 'Claude', bg: 'bg-brand-amber/10', text: 'text-brand-amber' },
  gemini: { label: 'Gemini', bg: 'bg-[#4285F4]/10', text: 'text-[#4285F4]' },
};

// SVG Icons for node kinds
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
    case 'outlet':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
          <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
        </svg>
      );
    case 'ai_model':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
        </svg>
      );
    case 'topic':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'competitor':
      return (
        <svg className={baseClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
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

interface NodeItemProps {
  node: GraphNode;
  isFocused?: boolean;
  relatedEdges?: GraphEdge[];
  onClick?: () => void;
}

function NodeItem({ node, isFocused, relatedEdges, onClick }: NodeItemProps) {
  const config = nodeKindConfig[node.kind];
  const hasConnections = relatedEdges && relatedEdges.length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        flex items-center gap-3 p-3 bg-[#13131A] rounded-lg cursor-pointer
        border transition-all duration-200
        ${isFocused ? `${config.borderFocus} ${config.glow}` : 'border-[#1F1F28] hover:border-slate-4'}
        focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:ring-offset-2 focus:ring-offset-[#0A0A0F]
      `}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 flex items-center justify-center rounded-lg ${config.bg} ${config.text}`}
      >
        <NodeIcon kind={node.kind} className="w-5 h-5" />
      </div>

      {/* Label & Kind */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{node.label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-6">{config.label}</span>
          {hasConnections && (
            <span className="text-[10px] text-slate-5">
              {relatedEdges.length} connection{relatedEdges.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Visibility Score */}
      {node.meta.visibility_score !== undefined && (
        <div className="text-right">
          <p className={`text-sm font-bold ${config.text}`}>{node.meta.visibility_score}</p>
          <p className="text-[10px] text-slate-6">Visibility</p>
        </div>
      )}

      {/* Relationship Score */}
      {node.meta.relationship_score !== undefined && (
        <div className="text-right">
          <p className={`text-sm font-bold ${config.text}`}>
            {Math.round(Number(node.meta.relationship_score) * 100)}%
          </p>
          <p className="text-[10px] text-slate-6">Relationship</p>
        </div>
      )}

      {/* Focus indicator */}
      {isFocused && (
        <svg
          className={`w-4 h-4 ${config.text} flex-shrink-0`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}

function CitationItem({ citation }: { citation: Citation }) {
  const platform = platformConfig[citation.platform] || {
    label: citation.platform.toUpperCase(),
    bg: 'bg-slate-4',
    text: 'text-white',
  };
  const timeAgo = getTimeAgo(citation.detected_at);

  // Quality indicator color
  const qualityColor =
    citation.context_quality >= 8
      ? 'text-semantic-success'
      : citation.context_quality >= 5
        ? 'text-brand-amber'
        : 'text-semantic-danger';

  return (
    <div className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg hover:border-brand-cyan/30 hover:shadow-[0_0_12px_rgba(0,217,255,0.08)] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 text-[10px] font-bold ${platform.bg} ${platform.text} rounded`}>
          {platform.label}
        </span>
        <span className="text-[10px] text-slate-5">{timeAgo}</span>
      </div>

      {/* Query */}
      <p className="text-xs text-slate-5 mb-2 italic line-clamp-1">
        &quot;{citation.query}&quot;
      </p>

      {/* Snippet */}
      <p className="text-sm text-white line-clamp-2 mb-3 leading-relaxed">
        {citation.snippet}
      </p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 pt-3 border-t border-[#1F1F28]">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-slate-6">
            Position <span className="text-brand-cyan font-bold">#{citation.position}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-slate-6">
            Quality <span className={`font-bold ${qualityColor}`}>{citation.context_quality}/10</span>
          </span>
        </div>
        {citation.source_url && (
          <a
            href={citation.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[10px] text-brand-cyan hover:underline flex items-center gap-1"
          >
            View source
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
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
    <div className="p-4 space-y-6">
      {/* Graph placeholder skeleton */}
      <div className="p-6 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="h-48 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 mx-auto mb-3 bg-slate-4 rounded-full" />
            <div className="h-4 w-32 mx-auto bg-slate-5 rounded" />
          </div>
        </div>
      </div>
      {/* Node list skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-4 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-4 rounded mb-1" />
                <div className="h-3 w-16 bg-slate-5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-semantic-danger">Failed to load intelligence</h4>
            <p className="text-xs text-slate-6 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IntelligenceCanvasPane({ data, isLoading, error }: IntelligenceCanvasPaneProps) {
  // Focus state for node selection
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-slate-6">
        <p className="text-sm">No intelligence data available</p>
      </div>
    );
  }

  // Get edges related to focused node
  const getRelatedEdges = (nodeId: string): GraphEdge[] => {
    return data.edges.filter((e) => e.from === nodeId || e.to === nodeId);
  };

  // Handle node focus toggle
  const handleNodeClick = (nodeId: string) => {
    setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  // Group nodes by kind for display
  const aiModels = data.nodes.filter((n) => n.kind === 'ai_model');
  const journalists = data.nodes.filter((n) => n.kind === 'journalist');
  const topics = data.nodes.filter((n) => n.kind === 'topic');
  const competitors = data.nodes.filter((n) => n.kind === 'competitor');

  // Get focused node for display
  const focusedNode = focusedNodeId
    ? data.nodes.find((n) => n.id === focusedNodeId)
    : null;
  const focusedEdges = focusedNodeId ? getRelatedEdges(focusedNodeId) : [];

  // Render a node section with focus support
  const renderNodeSection = (
    title: string,
    nodes: GraphNode[],
    showCount = true
  ) => {
    if (nodes.length === 0) return null;

    return (
      <div>
        <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
          {title} {showCount && `(${nodes.length})`}
        </h3>
        <div className="space-y-2">
          {nodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node}
              isFocused={focusedNodeId === node.id}
              relatedEdges={getRelatedEdges(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Graph Visualization Placeholder */}
      <div className="p-6 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="h-48 flex items-center justify-center">
          {focusedNode ? (
            // Show focused node connections
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-2 mb-3">
                <NodeIcon
                  kind={focusedNode.kind}
                  className={`w-6 h-6 ${nodeKindConfig[focusedNode.kind].text}`}
                />
                <h4 className="text-lg font-semibold text-white">{focusedNode.label}</h4>
              </div>
              <p className="text-sm text-slate-6 mb-4">
                {focusedEdges.length} connection{focusedEdges.length !== 1 ? 's' : ''}
              </p>
              {focusedEdges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto px-4">
                  {focusedEdges.map((edge) => {
                    const targetId = edge.from === focusedNodeId ? edge.to : edge.from;
                    const targetNode = data.nodes.find((n) => n.id === targetId);
                    const targetConfig = targetNode
                      ? nodeKindConfig[targetNode.kind]
                      : null;

                    return (
                      <div
                        key={edge.id}
                        className={`
                          px-2.5 py-1 rounded text-xs
                          ${targetConfig?.bg || 'bg-slate-4'} ${targetConfig?.text || 'text-white'}
                          border ${targetConfig?.border || 'border-slate-5'}
                        `}
                      >
                        <span className="opacity-60">{edge.rel}:</span>{' '}
                        {targetNode?.label || targetId}
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setFocusedNodeId(null)}
                className="mt-4 text-xs text-brand-cyan hover:underline"
              >
                Clear focus
              </button>
            </div>
          ) : (
            // Default graph placeholder
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-brand-iris/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-brand-iris"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-6">Knowledge Graph Visualization</p>
              <p className="text-xs text-slate-5 mt-1">
                {data.nodes.length} nodes &middot; {data.edges.length} connections
              </p>
              <p className="text-[10px] text-slate-5 mt-2 italic">
                Click a node below to explore connections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Models Section */}
      {renderNodeSection('AI Models Tracking', aiModels)}

      {/* Citation Feed */}
      {data.citation_feed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
            Recent Citations ({data.citation_feed.length})
          </h3>
          <div className="space-y-3">
            {data.citation_feed.slice(0, 5).map((citation) => (
              <CitationItem key={citation.id} citation={citation} />
            ))}
          </div>
        </div>
      )}

      {/* Key Journalists */}
      {renderNodeSection('Key Journalists', journalists)}

      {/* Topics */}
      {renderNodeSection('Key Topics', topics)}

      {/* Competitors */}
      {renderNodeSection('Competitors', competitors)}
    </div>
  );
}
