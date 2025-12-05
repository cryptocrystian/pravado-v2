/**
 * Inspector Component (Sprint S17)
 * Right panel for configuring selected node
 */

'use client';

import { useState, useEffect } from 'react';

import type { EditorNode, AgentNodeConfig, DataNodeConfig, BranchNodeConfig, ApiNodeConfig } from '../types/graph';

export interface InspectorProps {
  selectedNode: EditorNode | null;
  onUpdateNode: (nodeId: string, data: Partial<EditorNode['data']>) => void;
}

export function Inspector({ selectedNode, onUpdateNode }: InspectorProps) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label);
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500 text-center mt-8">Select a node to configure</p>
      </div>
    );
  }

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdateNode(selectedNode.id, { label: newLabel });
  };

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdateNode(selectedNode.id, { config: newConfig });
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Configure Node</h2>

      {/* Label */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      {/* Type-specific config */}
      {selectedNode.type === 'AGENT' && (
        <AgentConfig config={config as unknown as AgentNodeConfig} onChange={handleConfigChange} />
      )}
      {selectedNode.type === 'DATA' && (
        <DataConfig config={config as unknown as DataNodeConfig} onChange={handleConfigChange} />
      )}
      {selectedNode.type === 'BRANCH' && (
        <BranchConfig config={config as unknown as BranchNodeConfig} onChange={handleConfigChange} />
      )}
      {selectedNode.type === 'API' && (
        <ApiConfig config={config as unknown as ApiNodeConfig} onChange={handleConfigChange} />
      )}

      {/* Errors */}
      {selectedNode.data.errors && selectedNode.data.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Validation Errors</h3>
          <ul className="text-xs text-red-700 space-y-1">
            {selectedNode.data.errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AgentConfig({ config, onChange }: { config: AgentNodeConfig; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Agent ID</label>
        <input
          type="text"
          value={config.agentId || ''}
          onChange={(e) => onChange('agentId', e.target.value)}
          placeholder="content-strategist"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          value={config.prompt || ''}
          onChange={(e) => onChange('prompt', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Key</label>
        <input
          type="text"
          value={config.outputKey || ''}
          onChange={(e) => onChange('outputKey', e.target.value)}
          placeholder="agentResponse"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}

function DataConfig({ config, onChange }: { config: DataNodeConfig; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Operation</label>
        <select
          value={config.operation || 'transform'}
          onChange={(e) => onChange('operation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="pluck">Pluck</option>
          <option value="map">Map</option>
          <option value="merge">Merge</option>
          <option value="filter">Filter</option>
          <option value="transform">Transform</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Source Key</label>
        <input
          type="text"
          value={config.sourceKey || ''}
          onChange={(e) => onChange('sourceKey', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Key</label>
        <input
          type="text"
          value={config.outputKey || ''}
          onChange={(e) => onChange('outputKey', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}

function BranchConfig({ config, onChange }: { config: BranchNodeConfig; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Condition (JS expression)</label>
        <textarea
          value={config.condition || ''}
          onChange={(e) => onChange('condition', e.target.value)}
          placeholder="input.score > 75"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
        />
      </div>

      <p className="text-xs text-gray-500">Connect true/false branches using handles on the node</p>
    </div>
  );
}

function ApiConfig({ config, onChange }: { config: ApiNodeConfig; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Method</label>
        <select
          value={config.method || 'GET'}
          onChange={(e) => onChange('method', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="text"
          value={config.url || ''}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Key</label>
        <input
          type="text"
          value={config.outputKey || ''}
          onChange={(e) => onChange('outputKey', e.target.value)}
          placeholder="apiResponse"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}
