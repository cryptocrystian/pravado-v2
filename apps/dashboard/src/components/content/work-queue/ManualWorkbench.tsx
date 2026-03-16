'use client';

/**
 * ManualWorkbench - Document-first Content Manual Mode
 *
 * LAYOUT PATTERN:
 * +----------------+--------------------------------------+---------------+
 * | DocumentRail   | PravadoEditor                        | ContextRail   |
 * | 220px fixed    | flex-1 (dominant)                    | 280px / 0px   |
 * |                | [Editable title]                     | Collapsible   |
 * | Document       | TipTap editor                        | CiteMind score|
 * | list           | Full-height, floating toolbar        | AEO readiness |
 * | + New button   | on text select                       | Entity list   |
 * +----------------+--------------------------------------+---------------+
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ContentAsset } from '../types';
import { PravadoEditor } from '../editor/PravadoEditor';
import { DocumentRail } from '../editor/DocumentRail';
import { ContextRailEditor, type ContextRailEditorProps } from '../editor/ContextRailEditor';

// ============================================
// TYPES
// ============================================

export interface ManualWorkbenchProps {
  /** Document list to display in left rail */
  documents: ContentAsset[];
  /** Currently selected document ID */
  selectedId: string | null;
  /** Selection handler */
  onSelect: (id: string) => void;
  /** Create new document handler */
  onCreateNew: () => void;
  /** Save handler */
  onSave?: (data: { title: string; content: string }) => void;
  /** Publish handler (triggers CiteMind gate) */
  onPublish?: (assetId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Context data for selected document */
  contextData?: ContextRailEditorProps['contextData'];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ManualWorkbench({
  documents,
  selectedId,
  onSelect,
  onCreateNew,
  onSave,
  onPublish,
  isLoading,
  contextData,
}: ManualWorkbenchProps) {
  // Context rail collapsed by default
  const [contextCollapsed, setContextCollapsed] = useState(true);
  // Track editor key to force remount when doc changes
  const [editorKey, setEditorKey] = useState(0);

  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedId) || null,
    [documents, selectedId]
  );

  // Force editor remount when selected doc changes
  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [selectedId]);

  // Auto-expand context rail when doc has CiteMind issues
  useEffect(() => {
    if (selectedDoc && contextData?.citeMindStatus && contextData.citeMindStatus !== 'passed') {
      setContextCollapsed(false);
    }
  }, [selectedDoc?.id, contextData?.citeMindStatus]);

  const handlePublish = useCallback(() => {
    if (selectedDoc && onPublish) {
      onPublish(selectedDoc.id);
    }
  }, [selectedDoc, onPublish]);

  return (
    <div className="h-full flex bg-slate-1 overflow-hidden">
      {/* LEFT: Document Rail - 220px fixed */}
      <div className="w-[220px] shrink-0 border-r border-slate-4 bg-slate-2">
        <DocumentRail
          documents={documents}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateNew={onCreateNew}
          isLoading={isLoading}
        />
      </div>

      {/* CENTER: Editor - dominant */}
      <div className="flex-1 min-w-0 h-full">
        {selectedDoc ? (
          <PravadoEditor
            key={editorKey}
            initialTitle={selectedDoc.title}
            initialContent={selectedDoc.body || ''}
            status={selectedDoc.status}
            onTitleChange={(title) => onSave?.({ title, content: selectedDoc.body || '' })}
            onContentChange={(html) => onSave?.({ title: selectedDoc.title, content: html })}
            onSave={onSave}
            autoSaveDelay={2000}
          />
        ) : (
          /* Empty state: Create New Document CTA */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-3 border border-slate-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white/70 mb-1">Create New Document</h3>
            <p className="text-sm text-white/40 mb-6 max-w-sm">
              Select a document from the list, or create a new one to get started.
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
            >
              + Create New Document
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Context Rail - 280px or collapsed */}
      <div className={`shrink-0 border-l border-slate-4 bg-slate-1 transition-all duration-200 ${
        contextCollapsed ? 'w-6' : 'w-[280px]'
      }`}>
        <ContextRailEditor
          asset={selectedDoc}
          isCollapsed={contextCollapsed}
          onToggleCollapse={() => setContextCollapsed(!contextCollapsed)}
          onPublish={selectedDoc ? handlePublish : undefined}
          contextData={contextData}
        />
      </div>
    </div>
  );
}
