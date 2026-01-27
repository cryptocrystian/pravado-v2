/**
 * Playbooks page
 * Styled according to Pravado Design System v2
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

      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch(`/api/playbooks?${params.toString()}`, {
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
      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch('/api/playbooks/templates', {
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
      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch('/api/playbooks', {
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
    switch (status) {
      case 'ACTIVE':
        return 'bg-semantic-success/10 text-semantic-success';
      case 'DRAFT':
        return 'bg-slate-5 text-slate-6';
      case 'ARCHIVED':
        return 'bg-brand-amber/10 text-brand-amber';
      case 'DEPRECATED':
        return 'bg-semantic-danger/10 text-semantic-danger';
      default:
        return 'bg-slate-5 text-slate-6';
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white-0 mb-2">Playbooks</h1>
        <p className="text-muted">Automated workflows for SEO, PR, and content tasks</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search playbooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field flex-1 max-w-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-slate-3 border border-border-subtle rounded-lg text-sm text-white-0 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 transition-all duration-sm"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>

        <button
          onClick={() => setShowTemplateDialog(true)}
          className="btn-primary"
        >
          Create from Template
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert-error mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
          <p className="mt-2 text-slate-6">Loading playbooks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && playbooks.length === 0 && (
        <div className="text-center py-12 panel-card">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-iris/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-muted mb-4">
            No playbooks yet. Create one from a template to get started.
          </p>
          <button
            onClick={() => setShowTemplateDialog(true)}
            className="btn-primary"
          >
            Create from Template
          </button>
        </div>
      )}

      {/* Playbooks Table */}
      {!loading && playbooks.length > 0 && (
        <div className="panel-card overflow-hidden">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-slate-3/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-6 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-6 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-6 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-6 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-6 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {playbooks.map((playbook) => (
                <tr
                  key={playbook.id}
                  className="hover:bg-slate-4/50 cursor-pointer transition-colors duration-sm"
                  onClick={() => (window.location.href = `/app/playbooks/${playbook.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white-0">{playbook.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-6">v{playbook.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(playbook.status)}`}>
                      {playbook.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-6">{playbook.tags?.join(', ') || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-6">
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
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white-0">Choose a Template</h2>
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="text-slate-6 hover:text-white-0 transition-colors duration-sm p-2 hover:bg-slate-4 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-border-subtle rounded-xl p-4 hover:border-brand-cyan cursor-pointer transition-all duration-sm bg-slate-3/30 hover:bg-slate-3/50"
                  onClick={() => createFromTemplate(template)}
                >
                  <h3 className="font-semibold text-lg text-white-0 mb-1">{template.name}</h3>
                  <p className="text-muted text-sm mb-3">{template.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-brand-iris/10 text-brand-iris text-xs rounded-md font-medium">
                      {template.category}
                    </span>
                    {template.templateTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-5 text-slate-6 text-xs rounded-md"
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
