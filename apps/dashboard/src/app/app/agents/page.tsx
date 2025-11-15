/**
 * Agents page (S3 placeholder with static agent definitions)
 */

import type { ListAgentsResponse } from '@pravado/types';

import { getCurrentUser } from '@/lib/getCurrentUser';

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Agents</h2>
          <p className="text-gray-600">
            Specialized AI agents available for playbook workflows and automation
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Agent Runtime - Coming in S4+
              </h3>
              <p className="text-amber-800 mb-2">
                Below are available agent definitions. Sprint S4+ will implement the full execution
                runtime.
              </p>
              <p className="text-sm text-amber-700">
                Total agents: {agents?.length || 0} | Categories: PR, Content, SEO, General
              </p>
            </div>
          </div>
        </div>

        {/* PR Agents */}
        {prAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📰</span>
              PR Intelligence Agents ({prAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-gray-500">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">✍️</span>
              Content Intelligence Agents ({contentAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-gray-500">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔍</span>
              SEO Intelligence Agents ({seoAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seoAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-gray-500">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              General Purpose Agents ({generalAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generalAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Capabilities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    {agent.estimatedDuration && (
                      <div className="text-gray-500">
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
