/**
 * Sidebar Component (Sprint S17)
 * Left sidebar with node palette
 */

'use client';

import type { NodeType } from '../types/graph';

export interface SidebarProps {
  onAddNode: (type: NodeType) => void;
}

const nodeTemplates: { type: NodeType; label: string; icon: string; description: string }[] = [
  { type: 'AGENT', label: 'Agent', icon: '🤖', description: 'AI agent step' },
  { type: 'DATA', label: 'Data', icon: '⚙️', description: 'Data transformation' },
  { type: 'BRANCH', label: 'Branch', icon: '◆', description: 'Conditional branching' },
  { type: 'API', label: 'API', icon: '🌐', description: 'External API call' },
];

export function Sidebar({ onAddNode }: SidebarProps) {
  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-semibold mb-4 text-gray-700">Node Types</h2>

      <div className="space-y-2">
        {nodeTemplates.map((template) => (
          <button
            key={template.type}
            onClick={() => onAddNode(template.type)}
            className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:border-blue-500 hover:shadow transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{template.label}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-xs font-semibold mb-2 text-gray-600">Instructions</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click nodes to add to canvas</li>
          <li>• Drag nodes to reposition</li>
          <li>• Connect nodes with edges</li>
          <li>• Select to configure</li>
        </ul>
      </div>
    </div>
  );
}
