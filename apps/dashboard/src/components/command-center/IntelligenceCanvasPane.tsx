'use client';

/**
 * IntelligenceCanvasPane - Knowledge Graph & Citation Feed
 *
 * Displays the intelligence canvas with:
 * - Node list (placeholder for full graph visualization)
 * - Citation feed showing AI model mentions
 *
 * @see /contracts/examples/intelligence-canvas.json
 */

import type { IntelligenceCanvasResponse, GraphNode, Citation, NodeKind } from './types';

interface IntelligenceCanvasPaneProps {
  data: IntelligenceCanvasResponse | null;
  isLoading: boolean;
  error: Error | null;
}

// Node kind styling
const nodeKindStyles: Record<NodeKind, { bg: string; text: string; icon: string }> = {
  brand: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', icon: 'B' },
  journalist: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', icon: 'J' },
  outlet: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', icon: 'O' },
  ai_model: { bg: 'bg-semantic-success/10', text: 'text-semantic-success', icon: 'AI' },
  topic: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', icon: 'T' },
  competitor: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', icon: 'C' },
};

// Platform icons
const platformIcons: Record<string, string> = {
  chatgpt: 'GPT',
  perplexity: 'PPX',
  claude: 'CL',
  gemini: 'GEM',
};

function NodeItem({ node }: { node: GraphNode }) {
  const style = nodeKindStyles[node.kind];

  return (
    <div className="flex items-center gap-3 p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg hover:border-slate-4 transition-colors">
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${style.bg} ${style.text} text-xs font-bold`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{node.label}</p>
        <p className="text-xs text-slate-6 capitalize">{node.kind.replace('_', ' ')}</p>
      </div>
      {node.meta.visibility_score !== undefined && (
        <div className="text-right">
          <p className="text-sm font-medium text-white">{node.meta.visibility_score}</p>
          <p className="text-[10px] text-slate-6">Visibility</p>
        </div>
      )}
      {node.meta.relationship_score !== undefined && (
        <div className="text-right">
          <p className="text-sm font-medium text-white">{Math.round(Number(node.meta.relationship_score) * 100)}%</p>
          <p className="text-[10px] text-slate-6">Relationship</p>
        </div>
      )}
    </div>
  );
}

function CitationItem({ citation }: { citation: Citation }) {
  const platformLabel = platformIcons[citation.platform] || citation.platform.toUpperCase();
  const timeAgo = getTimeAgo(citation.detected_at);

  return (
    <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg hover:border-brand-cyan/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="px-2 py-0.5 text-[10px] font-bold bg-semantic-success/10 text-semantic-success rounded">
          {platformLabel}
        </span>
        <span className="text-[10px] text-slate-6">{timeAgo}</span>
      </div>
      <p className="text-xs text-slate-6 mb-2 italic">&quot;{citation.query}&quot;</p>
      <p className="text-xs text-white line-clamp-2 mb-2">{citation.snippet}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-6">
            Position: <span className="text-brand-cyan font-medium">#{citation.position}</span>
          </span>
          <span className="text-[10px] text-slate-6">
            Quality: <span className="text-white font-medium">{citation.context_quality}/10</span>
          </span>
        </div>
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

  // Group nodes by kind for display
  const aiModels = data.nodes.filter((n) => n.kind === 'ai_model');
  const journalists = data.nodes.filter((n) => n.kind === 'journalist');
  const topics = data.nodes.filter((n) => n.kind === 'topic');
  const competitors = data.nodes.filter((n) => n.kind === 'competitor');

  return (
    <div className="p-4 space-y-6">
      {/* Graph Placeholder */}
      <div className="p-6 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-brand-iris/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm text-slate-6">Knowledge Graph Visualization</p>
            <p className="text-xs text-slate-5 mt-1">{data.nodes.length} nodes &middot; {data.edges.length} connections</p>
          </div>
        </div>
      </div>

      {/* AI Models Section */}
      {aiModels.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
            AI Models Tracking
          </h3>
          <div className="space-y-2">
            {aiModels.map((node) => (
              <NodeItem key={node.id} node={node} />
            ))}
          </div>
        </div>
      )}

      {/* Citation Feed */}
      {data.citation_feed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
            Recent Citations ({data.citation_feed.length})
          </h3>
          <div className="space-y-2">
            {data.citation_feed.slice(0, 5).map((citation) => (
              <CitationItem key={citation.id} citation={citation} />
            ))}
          </div>
        </div>
      )}

      {/* Key Relationships */}
      <div>
        <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
          Key Journalists ({journalists.length})
        </h3>
        <div className="space-y-2">
          {journalists.map((node) => (
            <NodeItem key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
            Key Topics ({topics.length})
          </h3>
          <div className="space-y-2">
            {topics.map((node) => (
              <NodeItem key={node.id} node={node} />
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
            Competitors ({competitors.length})
          </h3>
          <div className="space-y-2">
            {competitors.map((node) => (
              <NodeItem key={node.id} node={node} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
