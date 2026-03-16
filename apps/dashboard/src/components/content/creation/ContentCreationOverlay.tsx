'use client';

/**
 * ContentCreationOverlay — Full-screen overlay for 4-stage content creation.
 *
 * Headerless body panel — the chrome bar in ContentWorkSurfaceShell morphs
 * to show back/step-pills/close when this overlay is open.
 * Routes between Stage 1 (Entry), Stage 2 (Brief), Stage 3 (Scaffold).
 * Stage 4 hands off to PravadoEditor (follow-on sprint).
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import type { AutomationMode, CreationContentType, OutlineSection } from '../types';
import { CreationStage1Entry } from './CreationStage1Entry';
import { CreationStage2Brief } from './CreationStage2Brief';
import { CreationStage3Scaffold } from './CreationStage3Scaffold';

export interface ContentCreationOverlayProps {
  mode: AutomationMode;
  stage: 1 | 2 | 3;
  selectedContentType: CreationContentType | null;
  selectedSageBriefId: string | null;
  briefFormData: Record<string, string>;
  generatedOutline: OutlineSection[] | null;
  onStageChange: (stage: 1 | 2 | 3) => void;
  onContentTypeSelect: (type: CreationContentType | null) => void;
  onSageBriefSelect: (id: string | null) => void;
  onBriefFormChange: (data: Record<string, string>) => void;
  onOutlineReady: (outline: OutlineSection[] | null) => void;
  onClose: () => void;
  onLaunchEditor: (briefData: Record<string, string>, outline: OutlineSection[] | null) => void;
}

export function ContentCreationOverlay({
  mode,
  stage,
  selectedContentType,
  selectedSageBriefId,
  briefFormData,
  generatedOutline,
  onStageChange,
  onContentTypeSelect,
  onSageBriefSelect,
  onBriefFormChange,
  onOutlineReady,
  onClose,
  onLaunchEditor,
}: ContentCreationOverlayProps) {
  return (
    <div className="fixed top-24 left-0 right-0 bottom-0 z-50 bg-slate-0 transition-transform duration-300">
      <div className="max-w-[960px] mx-auto h-full overflow-y-auto">
        {stage === 1 && (
          <CreationStage1Entry
            mode={mode}
            onContentTypeSelect={(type) => {
              onContentTypeSelect(type);
              onStageChange(2);
            }}
            onSageBriefSelect={(id) => {
              onSageBriefSelect(id);
              onStageChange(2);
            }}
            onClose={onClose}
          />
        )}
        {stage === 2 && (
          <CreationStage2Brief
            mode={mode}
            selectedContentType={selectedContentType}
            selectedSageBriefId={selectedSageBriefId}
            briefFormData={briefFormData}
            onBriefFormChange={onBriefFormChange}
            onGenerateOutline={() => onStageChange(3)}
          />
        )}
        {stage === 3 && (
          <CreationStage3Scaffold
            mode={mode}
            briefFormData={briefFormData}
            selectedContentType={selectedContentType}
            generatedOutline={generatedOutline}
            onOutlineReady={onOutlineReady}
            onEditBrief={() => onStageChange(2)}
            onLaunchEditor={onLaunchEditor}
          />
        )}
      </div>
    </div>
  );
}
