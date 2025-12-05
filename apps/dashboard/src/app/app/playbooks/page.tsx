/**
 * Playbooks page (Sprint S8)
 * Lists all playbooks with filtering and template creation
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import type { PlaybookListItemDTO, PlaybookRuntimeTemplate } from '@pravado/types';
import { useState, useEffect } from 'react';

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<PlaybookListItemDTO[]>([]);
  const [templates, setTemplates] = useState<PlaybookRuntimeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlaybooks();
    fetchTemplates();
  }, [statusFilter, searchQuery]);

  const fetchPlaybooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);

      const response = await fetch(`/api/v1/playbooks?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playbooks');
      }

      const data = await response.json();
      setPlaybooks(data.data?.items || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load playbooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/playbooks/templates', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const createFromTemplate = async (template: PlaybookRuntimeTemplate) => {
    try {
      const response = await fetch('/api/v1/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: template.definition.playbook.name,
          version: 1,
          status: 'DRAFT',
          inputSchema: template.definition.playbook.inputSchema,
          outputSchema: template.definition.playbook.outputSchema,
          timeoutSeconds: template.definition.playbook.timeoutSeconds,
          maxRetries: template.definition.playbook.maxRetries,
          tags: template.definition.playbook.tags,
          steps: template.definition.steps.map((step) => ({
            key: step.key,
            name: step.name,
            type: step.type,
            config: step.config,
            position: step.position,
            nextStepKey: step.nextStepKey,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create playbook from template');
      }

      setShowTemplateDialog(false);
      fetchPlaybooks();
    } catch (err: any) {
      alert(err.message || 'Failed to create playbook');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'ACTIVE':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'DRAFT':
        return `${baseClass} bg-gray-100 text-gray-800`;
      case 'ARCHIVED':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'DEPRECATED':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Playbooks</h1>
        <p className="text-gray-600">Automated workflows for SEO, PR, and content tasks</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search playbooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md flex-1 max-w-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>

        <button
          onClick={() => setShowTemplateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create from Template
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading playbooks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && playbooks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            No playbooks yet. Create one from a template to get started.
          </p>
          <button
            onClick={() => setShowTemplateDialog(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create from Template
          </button>
        </div>
      )}

      {/* Playbooks Table */}
      {!loading && playbooks.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {playbooks.map((playbook) => (
                <tr
                  key={playbook.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/app/playbooks/${playbook.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{playbook.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">v{playbook.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadgeClass(playbook.status)}>{playbook.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{playbook.tags?.join(', ') || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(playbook.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Choose a Template</h2>
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                  onClick={() => createFromTemplate(template)}
                >
                  <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {template.category}
                    </span>
                    {template.templateTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
