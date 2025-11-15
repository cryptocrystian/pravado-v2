/**
 * Playbooks page (S3 placeholder with static templates)
 */

import type { ListPlaybooksResponse } from '@pravado/types';

import { getCurrentUser } from '@/lib/getCurrentUser';

async function getPlaybooks() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/playbooks', {
      cache: 'no-store',
    });
    const data: ListPlaybooksResponse = await response.json();
    return data.success ? data.data?.playbooks : [];
  } catch (error) {
    console.error('Failed to fetch playbooks:', error);
    return [];
  }
}

export default async function PlaybooksPage() {
  await getCurrentUser();
  const playbooks = await getPlaybooks();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Playbooks</h2>
          <p className="text-gray-600">
            Multi-agent workflows for automated PR, content, and SEO operations
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">📚</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                Visual Playbook Editor - Coming in S4+
              </h3>
              <p className="text-indigo-800 mb-4">
                Below are static playbook templates. Sprint S4+ will add drag-and-drop editing,
                execution, and monitoring.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🎨 Visual Editor</h4>
                  <p className="text-sm text-gray-600">
                    Drag-and-drop interface for building multi-agent workflows
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">▶️ Execution Engine</h4>
                  <p className="text-sm text-gray-600">
                    Run playbooks with real-time monitoring and result tracking
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🔄 Conditional Logic</h4>
                  <p className="text-sm text-gray-600">
                    Add branching, conditionals, and retry policies to workflows
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Analytics</h4>
                  <p className="text-sm text-gray-600">
                    Track playbook performance, success rates, and optimization opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Playbook Templates */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Template Playbooks ({playbooks?.length || 0})
          </h3>
          <p className="text-gray-600 mb-6">
            Pre-built workflows demonstrating the multi-agent system capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks && playbooks.length > 0 ? (
            playbooks.map((playbook) => (
              <div key={playbook.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {playbook.category === 'pr'
                        ? '📰'
                        : playbook.category === 'content'
                          ? '✍️'
                          : playbook.category === 'seo'
                            ? '🔍'
                            : '🤖'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        playbook.category === 'pr'
                          ? 'bg-blue-100 text-blue-800'
                          : playbook.category === 'content'
                            ? 'bg-purple-100 text-purple-800'
                            : playbook.category === 'seo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {playbook.category.toUpperCase()}
                    </span>
                  </div>
                  {playbook.difficulty && (
                    <span className="text-xs text-gray-500 capitalize">{playbook.difficulty}</span>
                  )}
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-2">{playbook.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{playbook.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="font-medium mr-2">Nodes:</span>
                    <span>{playbook.nodes.length} agents</span>
                  </div>
                  {playbook.estimatedDuration && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium mr-2">Duration:</span>
                      <span>{playbook.estimatedDuration}</span>
                    </div>
                  )}
                </div>

                {playbook.tags && playbook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {playbook.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              No playbooks available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
