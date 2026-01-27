/**
 * Living Canvas Editor
 *
 * Phase 6A.4: Minimal editor implementation with mode-driven behavior.
 * NOT a full rich-text editor - a focused authority orchestration surface.
 *
 * Mode Behaviors:
 * - Manual: Plain editing, no AI suggestions
 * - Copilot: Phantom/ghost text appears as suggestions (Tab to accept)
 * - Autopilot: AI auto-drafts, user reviews (not implemented in v1)
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from '../tokens';
import type { AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

interface LivingCanvasEditorProps {
  /** Current automation mode */
  mode: AutomationMode;
  /** Initial content */
  initialContent?: string;
  /** Handler for content changes */
  onContentChange?: (content: string) => void;
  /** Handler for entity mentions (for checklist updates) */
  onEntityMention?: (entity: string, count: number) => void;
  /** List of entities to track */
  trackedEntities?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// MOCK PHANTOM SUGGESTIONS
// ============================================

const MOCK_SUGGESTIONS: Record<string, string> = {
  'AI content creation': ' enables marketers to produce high-quality content at scale while maintaining brand consistency.',
  'Machine learning': ' algorithms analyze patterns in successful content to provide actionable recommendations.',
  'automation': ' reduces manual effort by 60% while improving content quality scores.',
  'marketing': ' teams can leverage these insights to drive more effective campaigns.',
  'content strategy': ' should align with both SEO objectives and audience engagement metrics.',
  'authority': ' is built through consistent, high-quality content that demonstrates expertise.',
};

function getPhantomSuggestion(text: string): string | null {
  // Find the last word being typed
  const words = text.split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase() || '';

  // Check if any suggestion key starts with the last word
  for (const [key, suggestion] of Object.entries(MOCK_SUGGESTIONS)) {
    if (lastWord.length > 2 && key.toLowerCase().startsWith(lastWord)) {
      const completion = key.slice(lastWord.length) + suggestion;
      return completion;
    }
  }

  // Also check for partial phrase matches
  const lastPhrase = text.toLowerCase().slice(-30);
  for (const [key, suggestion] of Object.entries(MOCK_SUGGESTIONS)) {
    if (lastPhrase.includes(key.toLowerCase().slice(0, 5))) {
      // Only suggest if we're at the end of typing the phrase
      const keyParts = key.toLowerCase().split(' ');
      const lastWordLower = lastWord.toLowerCase();
      if (keyParts.some(part => part.startsWith(lastWordLower) && part !== lastWordLower)) {
        continue;
      }
      if (lastPhrase.endsWith(key.toLowerCase().slice(0, lastWord.length))) {
        return suggestion;
      }
    }
  }

  return null;
}

// ============================================
// ENTITY HIGHLIGHTER
// ============================================

function findEntityMentions(text: string, entities: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entity of entities) {
    const regex = new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    counts.set(entity, matches?.length ?? 0);
  }

  return counts;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LivingCanvasEditor({
  mode,
  initialContent = '',
  onContentChange,
  onEntityMention,
  trackedEntities = [],
  placeholder = 'Start writing to build authority...',
  disabled = false,
}: LivingCanvasEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [phantomText, setPhantomText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Track entity mentions
  useEffect(() => {
    if (trackedEntities.length === 0 || !onEntityMention) return;

    const counts = findEntityMentions(content, trackedEntities);
    counts.forEach((count, entity) => {
      onEntityMention(entity, count);
    });
  }, [content, trackedEntities, onEntityMention]);

  // Generate phantom suggestions in Copilot mode
  useEffect(() => {
    if (mode !== 'copilot' || !isFocused) {
      setPhantomText(null);
      return;
    }

    // Debounce suggestion generation
    const timer = setTimeout(() => {
      const suggestion = getPhantomSuggestion(content);
      setPhantomText(suggestion);
    }, 300);

    return () => clearTimeout(timer);
  }, [content, mode, isFocused]);

  // Handle content change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  // Handle key events (Tab to accept phantom)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab to accept phantom suggestion
    if (e.key === 'Tab' && phantomText && mode === 'copilot') {
      e.preventDefault();
      const newContent = content + phantomText;
      setContent(newContent);
      setPhantomText(null);
      onContentChange?.(newContent);

      // Move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newContent.length;
          textareaRef.current.selectionEnd = newContent.length;
        }
      }, 0);
    }

    // Escape to dismiss phantom
    if (e.key === 'Escape' && phantomText) {
      setPhantomText(null);
    }
  }, [content, phantomText, mode, onContentChange]);

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Character count
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full">
      {/* Editor Container */}
      <div className={`
        relative flex-1 rounded-lg border bg-slate-1
        ${isFocused ? 'border-brand-iris/40 ring-1 ring-brand-iris/20' : 'border-slate-4'}
        ${motion.transition.fast}
      `}>
        {/* Main Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full h-full p-4 resize-none bg-transparent text-white/90 text-sm leading-relaxed
            placeholder:text-white/30 focus:outline-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ minHeight: '300px' }}
        />

        {/* Phantom Text Overlay (Copilot mode) */}
        {mode === 'copilot' && phantomText && isFocused && (
          <div className="absolute inset-0 pointer-events-none p-4 overflow-hidden">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {/* Invisible text to position phantom */}
              <span className="invisible">{content}</span>
              {/* Phantom suggestion */}
              <span className="text-brand-iris/50 italic">{phantomText}</span>
            </div>
          </div>
        )}

        {/* Phantom Accept Hint */}
        {mode === 'copilot' && phantomText && isFocused && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-slate-2/90 border border-slate-4 rounded text-[10px] text-white/50">
            <kbd className="px-1 py-0.5 bg-slate-4 rounded text-[9px] font-mono">Tab</kbd>
            <span>to accept</span>
            <span className="text-white/30">|</span>
            <kbd className="px-1 py-0.5 bg-slate-4 rounded text-[9px] font-mono">Esc</kbd>
            <span>to dismiss</span>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-1 py-2 text-[10px] text-white/40">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'copilot' && (
            <span className="text-brand-cyan">
              Copilot active
            </span>
          )}
          {mode === 'autopilot' && (
            <span className="text-brand-iris">
              Autopilot drafting
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// READONLY PREVIEW (for Autopilot review)
// ============================================

interface ReadonlyPreviewProps {
  content: string;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}

export function AutopilotDraftPreview({ content, onAccept, onReject, onEdit }: ReadonlyPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-brand-iris/10 border-b border-brand-iris/20 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-iris animate-pulse" />
          <span className="text-xs font-medium text-brand-iris">Autopilot Draft</span>
        </div>
        <span className="text-[10px] text-white/50">Review required before publishing</span>
      </div>

      {/* Content Preview */}
      <div className="flex-1 p-4 bg-slate-1 border-x border-slate-4 overflow-y-auto">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-2 border border-slate-4 rounded-b-lg">
        <button
          type="button"
          onClick={onReject}
          className="px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-slate-4 rounded transition-colors"
        >
          Reject Draft
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs text-white/70 bg-slate-4 hover:bg-slate-5 rounded transition-colors"
          >
            Edit Draft
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-1.5 text-xs font-medium text-white bg-brand-iris hover:bg-brand-iris/90 rounded transition-colors shadow-[0_0_12px_rgba(168,85,247,0.20)]"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default LivingCanvasEditor;
