/**
 * Content Orchestration Editor Route
 *
 * Phase 6A: Golden-path orchestration surface for content authority building.
 * This is an execution-focused editor, NOT a blank-page content generator.
 *
 * INVARIANT COMPLIANCE:
 * - Entry Point (§4): Context-required entry - no blank editor
 * - Mode-Driven (§5): Mode ceiling enforced by action type
 * - Explainability (§6): 3-level explain drawer (Phase 6A.5)
 * - Progress Feedback (§8): Micro-interactions for state changes (Phase 6A.6)
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  OrchestrationEditorShell,
  LivingCanvasEditor,
  ExplainabilityDrawer,
  type TriggerAction,
  type EntityChecklistItem,
  type TargetAIProfile,
} from '@/components/content';
import { motion } from '@/components/content/tokens';
import type { AutomationMode } from '@/components/content/types';

// ============================================
// MOCK DATA
// ============================================

const MOCK_TRIGGER_ACTIONS: Record<string, TriggerAction> = {
  'action-1': {
    id: 'action-1',
    title: 'Execute Brief: AI-Powered Content Creation Guide',
    type: 'brief_execution',
    sourceContext: {
      briefId: 'brief-1',
      briefTitle: 'AI-Powered Content Creation Guide',
      keyword: 'AI content creation',
    },
    modeCeiling: 'copilot',
    citeMindStatus: 'passed',
    pillar: 'content',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  'action-2': {
    id: 'action-2',
    title: 'Generate Derivatives: Marketing Automation Guide',
    type: 'derivative_generation',
    sourceContext: {
      assetId: 'asset-1',
      assetTitle: 'Ultimate Guide to Marketing Automation',
    },
    modeCeiling: 'copilot',
    citeMindStatus: 'analyzing',
    pillar: 'content',
    priority: 'normal',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  'action-3': {
    id: 'action-3',
    title: 'Optimize Authority: Content Strategy Best Practices',
    type: 'authority_optimization',
    sourceContext: {
      assetId: 'asset-2',
      assetTitle: 'Content Strategy Best Practices for 2024',
    },
    modeCeiling: 'manual',
    citeMindStatus: 'warning',
    pillar: 'content',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
};

const MOCK_ENTITY_CHECKLIST: EntityChecklistItem[] = [
  { id: 'e1', entity: 'AI content creation', state: 'satisfied', requiredMentions: 3, currentMentions: 4 },
  { id: 'e2', entity: 'Machine learning', state: 'mentioned', requiredMentions: 2, currentMentions: 1 },
  { id: 'e3', entity: 'Natural language processing', state: 'missing', requiredMentions: 2, currentMentions: 0 },
  { id: 'e4', entity: 'Content automation', state: 'satisfied', requiredMentions: 2, currentMentions: 3 },
];

const MOCK_AI_PROFILES: TargetAIProfile[] = [
  { id: 'chatgpt', name: 'ChatGPT', coverage: 85, status: 'optimal' },
  { id: 'gemini', name: 'Gemini', coverage: 72, status: 'partial' },
  { id: 'perplexity', name: 'Perplexity', coverage: 58, status: 'partial' },
];

const MOCK_SCHEMA = `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "AI-Powered Content Creation Guide",
  "author": {
    "@type": "Organization",
    "name": "Your Company"
  },
  "datePublished": "2026-01-27",
  "keywords": ["AI", "content creation", "automation"]
}`;

// ============================================
// CONTEXT REQUIRED EMPTY STATE
// ============================================

interface ContextRequiredEmptyStateProps {
  onNavigateBack: () => void;
}

function ContextRequiredEmptyState({ onNavigateBack }: ContextRequiredEmptyStateProps) {
  return (
    <div className="min-h-screen bg-slate-0 flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-white mb-2">Context Required</h1>

        {/* Explanation */}
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          The Orchestration Editor requires an action context to begin.
          Start from the Content Overview and select an action from Today&apos;s Work.
        </p>

        {/* Explainability hint */}
        <div className="bg-slate-2 border border-slate-4 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-brand-cyan/10">
              <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-white/80 mb-1">Why context is required</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Pravado is an orchestration platform, not a content generator.
                Each editing session is tied to a strategic action that feeds your authority signals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNavigateBack}
          className={`
            inline-flex items-center gap-2 px-5 py-2.5
            bg-brand-iris text-white text-sm font-medium rounded-lg
            hover:bg-brand-iris/90 shadow-[0_0_20px_rgba(168,85,247,0.20)]
            ${motion.transition.fast}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go to Content Overview
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ContentOrchestratePage() {
  const params = useParams();
  const router = useRouter();
  const actionId = params?.actionId as string | undefined;

  const [action, setAction] = useState<TriggerAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentMode, setCurrentMode] = useState<AutomationMode>('manual');
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  // Fetch action context (mock for now)
  useEffect(() => {
    if (!actionId) {
      setAction(null);
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    // Simulate API fetch delay
    const timer = setTimeout(() => {
      const foundAction = MOCK_TRIGGER_ACTIONS[actionId];
      if (foundAction) {
        setAction(foundAction);
        setNotFound(false);
        // Initialize mode to the ceiling (user can step down if needed)
        setCurrentMode(foundAction.modeCeiling);
      } else {
        setAction(null);
        setNotFound(true);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [actionId]);

  // Navigation handlers
  const handleNavigateBack = useCallback(() => {
    router.push('/app/content');
  }, [router]);

  // Action handlers
  const handleSaveDraft = useCallback(() => {
    // TODO: Implement save draft
    console.log('Saving draft...');
    setHasUnsavedChanges(false);
  }, []);

  const handleComplete = useCallback(() => {
    // TODO: Implement complete action
    console.log('Completing action...');
    router.push('/app/content');
  }, [router]);

  const handleExplainToggle = useCallback(() => {
    setIsExplainOpen((prev) => !prev);
  }, []);

  const handleModeChange = useCallback((newMode: AutomationMode) => {
    setCurrentMode(newMode);
    console.log(`Mode changed to: ${newMode}`);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-0 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-iris/30 border-t-brand-iris rounded-full animate-spin" />
          <span className="text-sm text-white/50">Loading action context...</span>
        </div>
      </div>
    );
  }

  // Context required (not found)
  if (notFound || !action) {
    return <ContextRequiredEmptyState onNavigateBack={handleNavigateBack} />;
  }

  // Render orchestration editor with the shell
  return (
    <>
      <OrchestrationEditorShell
        action={action}
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onBack={handleNavigateBack}
        onSaveDraft={handleSaveDraft}
        onComplete={handleComplete}
        onExplainToggle={handleExplainToggle}
        entityChecklist={MOCK_ENTITY_CHECKLIST}
        targetProfiles={MOCK_AI_PROFILES}
        schemaPreview={MOCK_SCHEMA}
        hasUnsavedChanges={hasUnsavedChanges}
        isLoading={false}
      >
        {/* Living Canvas Editor */}
        <LivingCanvasEditor
          mode={currentMode}
          initialContent=""
          onContentChange={(content) => {
            setHasUnsavedChanges(content.length > 0);
          }}
          trackedEntities={MOCK_ENTITY_CHECKLIST.map((e) => e.entity)}
          placeholder={`Start writing about "${action.sourceContext.keyword || action.title}"...

Try typing "AI content creation" or "automation" to see Copilot suggestions.`}
        />
      </OrchestrationEditorShell>

      {/* Explainability Drawer (Phase 6A.5 - §6 invariant) */}
      <ExplainabilityDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        action={action}
        currentMode={currentMode}
      />
    </>
  );
}
