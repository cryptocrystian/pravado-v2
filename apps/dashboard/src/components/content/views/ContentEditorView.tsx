'use client';

/**
 * ContentEditorView — Stage 4 editor handoff from the creation flow.
 *
 * Converts outline sections into initial HTML, renders PravadoEditor
 * pre-populated with the brief title and scaffold content.
 * Optional dismissible brief-context strip above the editor.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { PravadoEditor } from '../editor/PravadoEditor';
import { CREATION_TYPE_CONFIG } from '../types';
import type { EditorInitData, AutomationMode, OutlineSection } from '../types';

// ============================================
// OUTLINE → HTML
// ============================================

function buildInitialContent(outline: OutlineSection[]): string {
  return outline
    .map((section) => `<h2>${section.title}</h2><p></p>`)
    .join('\n');
}

// ============================================
// PROPS
// ============================================

interface ContentEditorViewProps {
  initData: EditorInitData;
  mode: AutomationMode;
  onWordCountChange?: (count: number) => void;
  onTitleChange?: (title: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ContentEditorView({
  initData,
  mode,
  onWordCountChange,
  onTitleChange,
}: ContentEditorViewProps) {
  void mode;
  const [showBriefContext, setShowBriefContext] = useState(true);

  const typeLabel = initData.contentType
    ? CREATION_TYPE_CONFIG[initData.contentType]?.label
    : null;

  const contextParts = [
    typeLabel,
    initData.topic,
    initData.keyword ? `Keyword: ${initData.keyword}` : null,
    initData.audience ? `Audience: ${initData.audience}` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Brief context strip — dismissible */}
      {showBriefContext && contextParts.length > 0 && (
        <div className="bg-white/[0.03] border-b border-border-subtle px-8 py-2 flex items-center gap-4 text-[13px] text-white/50 shrink-0">
          <span className="flex items-center gap-3 min-w-0 truncate">
            {contextParts.map((part, i) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <span className="w-px h-3 bg-white/10 shrink-0" />}
                <span className="truncate">{part}</span>
              </span>
            ))}
          </span>
          <button
            type="button"
            onClick={() => setShowBriefContext(false)}
            className="ml-auto p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" weight="regular" />
          </button>
        </div>
      )}

      {/* PravadoEditor — flex-1 fills remaining space */}
      <div className="flex-1 min-h-0">
        <PravadoEditor
          initialTitle={initData.title}
          initialContent={buildInitialContent(initData.outline)}
          status="draft"
          onTitleChange={onTitleChange}
          onWordCountChange={onWordCountChange}
        />
      </div>
    </div>
  );
}
