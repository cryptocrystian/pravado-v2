'use client';

/**
 * Playbook Detail Page (Sprint S8 + S9 + S10)
 * Shows playbook details, allows Run/Simulate, and displays collaboration debug info
 * S10: Added memory debug tab for episodic traces and semantic memory
 */

import type { PlaybookDefinitionDTO, PlaybookRunWithStepsDTO } from '@pravado/types';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PlaybookDetailPage() {
  const params = useParams();
  const playbookId = params?.id as string;
  const [playbook, setPlaybook] = useState<PlaybookDefinitionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'collaboration' | 'memory'>('steps');
  const [lastRun, setLastRun] = useState<PlaybookRunWithStepsDTO | null>(null);
  const [memoryData, setMemoryData] = useState<any>(null);

  useEffect(() => {
    fetchPlaybook();
  }, [playbookId]);

  const fetchPlaybook = async () => {
    try {
      const response = await fetch(`/api/v1/playbooks/${playbookId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setPlaybook(data.data?.item || null);
    } catch (error) {
      console.error('Failed to fetch playbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const execute = async (simulate: boolean, withCollaboration = false, withMemory = false) => {
    setExecuting(true);
    try {
      let endpoint = `/api/v1/playbooks/${playbookId}/execute`;
      if (simulate && withCollaboration) {
        endpoint = `/api/v1/playbooks/${playbookId}/simulate/collaboration`;
      } else if (simulate) {
        endpoint = `/api/v1/playbooks/${playbookId}/simulate`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: {} }),
      });

      if (!response.ok) throw new Error('Execution failed');

      const data = await response.json();
      setLastRun(data.data?.run || null);

      if (withCollaboration) {
        setActiveTab('collaboration');
      } else if (withMemory) {
        // Fetch memory data for the run
        await fetchMemoryData(data.data?.run?.run?.id);
        setActiveTab('memory');
      }

      alert(simulate ? 'Simulation complete!' : 'Execution complete!');
    } catch (error: any) {
      alert(error.message || 'Failed to execute playbook');
    } finally {
      setExecuting(false);
    }
  };

  const fetchMemoryData = async (runId: string) => {
    if (!runId) return;

    try {
      const response = await fetch(`/api/v1/playbook-runs/${runId}/memory`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMemoryData(data.data || null);
    } catch (error) {
      console.error('Failed to fetch memory data:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Playbook not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{playbook.playbook.name}</h1>
        <p className="text-gray-600">Version {playbook.playbook.version}</p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => execute(false)}
          disabled={executing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {executing ? 'Running...' : 'Run Playbook'}
        </button>
        <button
          onClick={() => execute(true, false)}
          disabled={executing}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          Simulate
        </button>
        <button
          onClick={() => execute(true, true, false)}
          disabled={executing}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          Debug Collaboration
        </button>
        <button
          onClick={() => execute(true, false, true)}
          disabled={executing}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          Debug Memory
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'steps'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Steps
          </button>
          <button
            onClick={() => setActiveTab('collaboration')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'collaboration'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Collaboration Debug
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'memory'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Memory Debug
          </button>
        </div>
      </div>

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Steps ({playbook.steps.length})</h2>
          <div className="space-y-4">
            {playbook.steps.map((step) => (
              <div key={step.id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{step.name}</h3>
                    <p className="text-sm text-gray-600">Key: {step.key}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {step.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Next: {step.nextStepKey || '(end)'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaboration Debug Tab */}
      {activeTab === 'collaboration' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Collaboration Debug</h2>

          {!lastRun && (
            <div className="text-center py-8 text-gray-500">
              No collaboration data yet. Run &quot;Debug Collaboration&quot; to see inter-agent messages,
              shared state, and escalations.
            </div>
          )}

          {lastRun && (
            <div className="space-y-6">
              {/* Run Status */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Run Status</h3>
                <div className="flex gap-4">
                  <span className="text-sm">
                    Status: <span className="font-medium">{lastRun.run.status}</span>
                  </span>
                  <span className="text-sm">
                    Steps: <span className="font-medium">{lastRun.steps.length}</span>
                  </span>
                </div>
              </div>

              {/* Step Runs with Collaboration Context */}
              <div>
                <h3 className="font-semibold mb-3">Step Executions</h3>
                <div className="space-y-4">
                  {lastRun.steps.map((stepRun: any) => (
                    <div key={stepRun.id} className="border border-gray-200 rounded p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{stepRun.stepKey}</h4>
                          <p className="text-xs text-gray-500">
                            Status: {stepRun.status} | Escalation: {stepRun.escalationLevel || 'none'}
                          </p>
                        </div>
                      </div>

                      {stepRun.collaborationContext && (
                        <div className="mt-3 bg-gray-50 p-3 rounded text-xs">
                          <div className="font-medium mb-2">Collaboration Context:</div>
                          <div className="space-y-2">
                            {stepRun.collaborationContext.messages && stepRun.collaborationContext.messages.length > 0 && (
                              <div>
                                <span className="font-medium">Messages ({stepRun.collaborationContext.messages.length}):</span>
                                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                                  {stepRun.collaborationContext.messages.map((msg: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded border">
                                      <div className="flex justify-between">
                                        <span className="font-medium text-blue-600">{msg.type}</span>
                                        <span className="text-gray-500">{msg.fromStepKey} → {msg.toStepKey}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {stepRun.collaborationContext.sharedState && Object.keys(stepRun.collaborationContext.sharedState).length > 0 && (
                              <div>
                                <span className="font-medium">Shared State:</span>
                                <pre className="mt-1 bg-white p-2 rounded overflow-x-auto">
                                  {JSON.stringify(stepRun.collaborationContext.sharedState, null, 2)}
                                </pre>
                              </div>
                            )}

                            {stepRun.collaborationContext.escalationLevel && stepRun.collaborationContext.escalationLevel !== 'none' && (
                              <div>
                                <span className="font-medium text-red-600">
                                  Escalated to: {stepRun.collaborationContext.escalationLevel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Memory Debug Tab (S10) */}
      {activeTab === 'memory' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Memory Debug</h2>

          {!memoryData && (
            <div className="text-center py-8 text-gray-500">
              No memory data yet. Run &quot;Debug Memory&quot; to see episodic traces and semantic memory.
            </div>
          )}

          {memoryData && (
            <div className="space-y-6">
              {/* Episodic Traces */}
              <div>
                <h3 className="font-semibold mb-3">Episodic Traces ({memoryData.episodicTraces?.length || 0})</h3>
                {memoryData.episodicTraces && memoryData.episodicTraces.length > 0 ? (
                  <div className="space-y-4">
                    {memoryData.episodicTraces.map((trace: any) => (
                      <div key={trace.id} className="border border-gray-200 rounded p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{trace.stepKey}</h4>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(trace.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 bg-gray-50 p-3 rounded text-xs">
                          <div className="font-medium mb-2">Trace Content:</div>
                          <pre className="bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(trace.content, null, 2)}
                          </pre>
                        </div>

                        {trace.embedding && (
                          <div className="mt-2 text-xs text-gray-500">
                            Embedding dimensions: {trace.embedding.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No episodic traces recorded.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
