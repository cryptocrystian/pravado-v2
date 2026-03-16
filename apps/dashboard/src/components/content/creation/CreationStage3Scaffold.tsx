'use client';

/**
 * CreationStage3Scaffold — Streaming outline generation + approval.
 *
 * Phase A: Sections stream in one at a time (mock, 400ms each).
 * Phase B: Editable outline with drag handles, delete, add, and CiteMind forecast.
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lightning,
  CheckCircle,
  Circle,
  DotsSixVertical,
  Trash,
  Plus,
} from '@phosphor-icons/react';
import type { AutomationMode, CreationContentType, OutlineSection } from '../types';

// ============================================
// MOCK OUTLINE BUILDER
// ============================================

function buildMockSections(title: string, topic: string): OutlineSection[] {
  const titleCtx = title || 'your topic';
  const topicCtx = topic || 'the subject';
  return [
    { id: 'sec-1', title: `Introduction — ${titleCtx}`, status: 'pending' },
    { id: 'sec-2', title: `Section 1 — Why ${topicCtx} matters now`, status: 'pending' },
    { id: 'sec-3', title: `Section 2 — Current landscape and competitive gaps`, status: 'pending' },
    { id: 'sec-4', title: `Section 3 — Implementation framework`, status: 'pending' },
    { id: 'sec-5', title: 'Conclusion & Key Takeaways', status: 'pending' },
  ];
}

// ============================================
// CITEMIND SCORING (reused from Stage 2)
// ============================================

function computeFinalScore(formData: Record<string, string>): number {
  let score = 55;
  if ((formData.topic?.length || 0) > 20) score += 10;
  if (formData.targetKeyword?.length) score += 8;
  const filledPoints = [formData.keyPoint1, formData.keyPoint2, formData.keyPoint3].filter(
    (p) => p && p.length > 0
  ).length;
  if (filledPoints >= 2) score += 5;
  if (formData.audience && formData.audience !== '') score += 6;
  // Outline bonus: +3 to +8
  score += 5;
  return Math.min(score, 94);
}

function getCiteColor(score: number): string {
  if (score >= 75) return 'text-semantic-success';
  if (score >= 55) return 'text-brand-cyan';
  return 'text-amber-400';
}

// ============================================
// PROPS
// ============================================

interface CreationStage3ScaffoldProps {
  mode: AutomationMode;
  briefFormData: Record<string, string>;
  selectedContentType: CreationContentType | null;
  generatedOutline: OutlineSection[] | null;
  onOutlineReady: (outline: OutlineSection[] | null) => void;
  onEditBrief: () => void;
  onLaunchEditor: (briefData: Record<string, string>, outline: OutlineSection[] | null) => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreationStage3Scaffold({
  mode,
  briefFormData,
  selectedContentType,
  generatedOutline,
  onOutlineReady,
  onEditBrief,
  onLaunchEditor,
}: CreationStage3ScaffoldProps) {
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamIndexRef = useRef(0);

  void selectedContentType;

  const citeMindScore = computeFinalScore(briefFormData);

  // Stream sections in one by one (400ms each)
  useEffect(() => {
    let cancelled = false;

    // If we already have a generated outline (coming back from editor), use it
    if (generatedOutline && generatedOutline.length > 0) {
      setSections(generatedOutline);
      setIsGenerating(false);
      return () => { cancelled = true; };
    }

    const mockSections = buildMockSections(
      briefFormData.title || '',
      briefFormData.topic || ''
    );

    setSections(mockSections);
    streamIndexRef.current = 0;

    function tick() {
      if (cancelled) return;
      const i = streamIndexRef.current;

      if (i >= mockSections.length) {
        const completed = mockSections.map(
          (s) => ({ ...s, status: 'complete' as const })
        );
        setSections(completed);
        onOutlineReady(completed);
        setIsGenerating(false);
        return;
      }

      setSections(
        mockSections.map((s, idx) => ({
          ...s,
          status: idx < i ? 'complete' : idx === i ? 'generating' : 'pending',
        } as OutlineSection))
      );

      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        streamIndexRef.current = i + 1;
        tick();
      }, 400);
    }

    tick();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editable outline handlers
  const handleSectionTitleChange = useCallback((id: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  }, []);

  const handleDeleteSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAddSection = useCallback(() => {
    const newSection: OutlineSection = {
      id: `sec-new-${Date.now()}`,
      title: 'New Section',
      status: 'complete',
    };
    setSections((prev) => [...prev, newSection]);
  }, []);

  const isReview = !isGenerating;

  return (
    <div className="px-8 py-8 max-w-[720px] mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        {isGenerating ? (
          <>
            <Lightning className="w-8 h-8 text-brand-iris animate-pulse mx-auto mb-4" weight="fill" />
            <h2 className="text-lg font-semibold text-white/90 mb-1">
              SAGE is building your outline...
            </h2>
            <p className="text-[13px] text-white/50">
              {briefFormData.title || 'Your content'}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white/90 mb-1">
              Your outline is ready
            </h2>
            <p className="text-[13px] text-white/50">
              Review and edit before SAGE writes the full draft.
            </p>
          </>
        )}
      </div>

      {/* Sections list */}
      <div className="space-y-1 mb-6">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center gap-3 py-2.5 group">
            {/* Status icon */}
            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
              {section.status === 'complete' ? (
                <CheckCircle className="w-4 h-4 text-semantic-success" weight="fill" />
              ) : section.status === 'generating' ? (
                <div className="w-3 h-3 rounded-full bg-brand-iris animate-pulse" />
              ) : (
                <Circle className="w-4 h-4 text-white/20" weight="regular" />
              )}
            </div>

            {/* Section content */}
            {isReview ? (
              <>
                <DotsSixVertical className="w-4 h-4 text-white/25 cursor-grab shrink-0" weight="regular" />
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                  className="flex-1 text-sm text-white/85 bg-transparent border-b border-transparent focus:border-border-subtle outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSection(section.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/25 hover:text-semantic-danger transition-all"
                >
                  <Trash className="w-4 h-4" weight="regular" />
                </button>
              </>
            ) : (
              <span
                className={`text-sm ${
                  section.status === 'complete' ? 'text-white/85' : 'text-white/70'
                }`}
              >
                {section.title}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Add section (review mode only) */}
      {isReview && (
        <button
          type="button"
          onClick={handleAddSection}
          className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-brand-iris transition-colors mb-8"
        >
          <Plus className="w-3.5 h-3.5" weight="regular" />
          Add section
        </button>
      )}

      {/* CiteMind forecast bar */}
      <div className="border-t border-border-subtle pt-4 mb-8">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
          CiteMind forecast
        </span>
        <div className="flex items-baseline gap-1 mb-2">
          <span className={`text-2xl font-bold tabular-nums ${getCiteColor(citeMindScore)}`}>
            {citeMindScore}
          </span>
          <span className="text-sm text-white/30">/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-iris transition-all duration-500"
            style={{ width: `${citeMindScore}%` }}
          />
        </div>
      </div>

      {/* CTA row (review mode only) */}
      {isReview && (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onEditBrief}
              className="px-4 py-2 border border-white/15 text-white/60 text-sm font-medium rounded-lg hover:text-white/80 hover:border-white/25 hover:bg-white/5 transition-all"
            >
              ← Edit brief
            </button>
            <button
              type="button"
              onClick={() => onLaunchEditor(briefFormData, sections)}
              className="px-6 py-2.5 bg-brand-iris text-white/95 text-sm font-semibold rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
            >
              Open in Editor →
            </button>
          </div>

          {/* Manual mode: skip outline link */}
          {mode === 'manual' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => onLaunchEditor(briefFormData, null)}
                className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
              >
                Skip outline, open blank editor
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
