/**
 * Agents page (S3 + S90 AI Presence Enhancement)
 * AI Agent registry with presence indicators
 */

import type { ListAgentsResponse } from '@pravado/types';

import { getCurrentUser } from '@/lib/getCurrentUser';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// AI Dot component for presence indication (server component version)
function AIDot() {
  return <span className="w-2.5 h-2.5 rounded-full ai-dot" />;
}

// AI Insight Banner component (server component version)
function AIInsightBanner({ message, type = 'info' }: { message: string; type?: 'info' | 'success' }) {
  const borderColor = type === 'success' ? 'border-l-semantic-success' : 'border-l-brand-cyan';
  const bgColor = type === 'success' ? 'bg-semantic-success/5' : 'bg-brand-cyan/5';

  return (
    <div className={`panel-card p-4 border-l-4 ${borderColor} ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AIDot />
          <span className="text-xs font-medium text-brand-cyan">Pravado Insight</span>
        </div>
        <p className="text-sm text-white flex-1">{message}</p>
      </div>
    </div>
  );
}

async function getAgents() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/agents', {
      cache: 'no-store',
    });
    const data: ListAgentsResponse = await response.json();
    return data.success ? data.data?.agents : [];
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return [];
  }
}

export default async function AgentsPage() {
  await getCurrentUser();
  const agents = await getAgents();

  const prAgents = agents?.filter((a) => a.category === 'pr') || [];
  const contentAgents = agents?.filter((a) => a.category === 'content') || [];
  const seoAgents = agents?.filter((a) => a.category === 'seo') || [];
  const generalAgents = agents?.filter((a) => a.category === 'general') || [];

  // Calculate agent stats
  const totalCapabilities = agents?.reduce((sum, a) => sum + a.capabilities.length, 0) || 0;

  return (
    <div className="p-8 bg-page min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with AI Status */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-2">
              <AIDot />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white-0 mb-2">AI Agents</h2>
              <p className="text-muted">
                Specialized AI agents available for playbook workflows and automation
              </p>
            </div>
          </div>
        </div>

        {/* AI Insight Banner */}
        <div className="mb-8">
          <AIInsightBanner
            message={`${agents?.length || 0} specialized AI agents ready across ${4} categories. ${totalCapabilities} unique capabilities available for workflow orchestration.`}
            type="success"
          />
        </div>

        {/* PR Agents */}
        {prAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white-0 mb-4 flex items-center">
              <span className="text-2xl mr-2">📰</span>
              PR Intelligence Agents ({prAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prAgents.map((agent) => (
                <div key={agent.id} className="panel-card p-5 hover:border-brand-cyan/30 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <AIDot />
                    <h4 className="text-lg font-semibold text-white-0">{agent.name}</h4>
                  </div>
                  <p className="text-sm text-muted mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-6">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-slate-6">
                        <span className="font-medium">Duration:</span> {agent.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Agents */}
        {contentAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white-0 mb-4 flex items-center">
              <span className="text-2xl mr-2">✍️</span>
              Content Intelligence Agents ({contentAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentAgents.map((agent) => (
                <div key={agent.id} className="panel-card p-5 hover:border-brand-iris/30 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <AIDot />
                    <h4 className="text-lg font-semibold text-white-0">{agent.name}</h4>
                  </div>
                  <p className="text-sm text-muted mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-6">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-0.5 bg-brand-iris/10 text-brand-iris rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-slate-6">
                        <span className="font-medium">Duration:</span> {agent.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO Agents */}
        {seoAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white-0 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔍</span>
              SEO Intelligence Agents ({seoAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seoAgents.map((agent) => (
                <div key={agent.id} className="panel-card p-5 hover:border-semantic-success/30 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <AIDot />
                    <h4 className="text-lg font-semibold text-white-0">{agent.name}</h4>
                  </div>
                  <p className="text-sm text-muted mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-6">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-0.5 bg-semantic-success/10 text-semantic-success rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-slate-6">
                        <span className="font-medium">Duration:</span> {agent.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Agents */}
        {generalAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white-0 mb-4 flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              General Purpose Agents ({generalAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generalAgents.map((agent) => (
                <div key={agent.id} className="panel-card p-5 hover:border-brand-magenta/30 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <AIDot />
                    <h4 className="text-lg font-semibold text-white-0">{agent.name}</h4>
                  </div>
                  <p className="text-sm text-muted mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-6">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-slate-5 text-slate-6 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-slate-6">
                        <span className="font-medium">Duration:</span> {agent.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
