'use client';

/**
 * Content Brief Work Surface
 *
 * Constraints-first work surface for content brief planning.
 * Features:
 * - Entities, allowed claims, required citations
 * - Outline and acceptance criteria
 * - "Generate Draft" CTA (Copilot only)
 * - CiteMind preview panel
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { card, text, label, interactive, surface, border, modeTokens, citeMindStatus as statusTokens } from '@/components/content/tokens';
import type { ContentBrief, CiteMindStatus, CiteMindIssue } from '@/components/content/types';

// ============================================
// TYPES
// ============================================

interface BriefPageProps {
  params: {
    id: string;
  };
}

interface OutlineSection {
  title: string;
  keyPoints: string[];
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_BRIEF: ContentBrief & {
  entities: string[];
  allowedClaims: string[];
  outline: { introduction: string; sections: OutlineSection[]; conclusion: string };
  acceptanceCriteria: string[];
} = {
  id: 'brief-1',
  organizationId: 'org-1',
  title: 'AI-Powered Content Creation Guide',
  status: 'draft',
  targetKeyword: 'AI content creation',
  targetIntent: 'informational',
  strategicObjective: 'Establish thought leadership in AI-assisted content creation',
  targetAudience: 'Marketing managers and content strategists at B2B companies',
  tone: 'authoritative',
  deadline: '2025-02-01T12:00:00.000Z',
  allowedAssertions: [
    'AI improves content efficiency by measurable percentages',
    'Human oversight remains essential for quality',
    'AI content tools integrate with existing workflows',
  ],
  requiredCitations: [
    'Content Marketing Institute Annual Report',
    'Gartner Marketing Technology Survey 2024',
    'HubSpot State of AI in Marketing',
  ],
  entities: ['AI Content Tools', 'Content Strategy', 'Marketing Automation', 'Brand Voice'],
  allowedClaims: [
    'AI can reduce content production time by 40-60%',
    'Human editors improve AI output quality by 85%',
    'AI-assisted content maintains brand consistency',
  ],
  outline: {
    introduction: 'Set the stage for AI in modern content marketing. Address common concerns while highlighting proven benefits.',
    sections: [
      {
        title: 'What is AI Content Creation?',
        keyPoints: ['Definition and scope', 'Types of AI content tools', 'Current capabilities and limitations'],
      },
      {
        title: 'Benefits for Marketing Teams',
        keyPoints: ['Time savings with citations', 'Consistency and scale', 'SEO optimization', 'Cost analysis'],
      },
      {
        title: 'Implementation Best Practices',
        keyPoints: ['Starting small', 'Training and workflow integration', 'Quality control processes'],
      },
      {
        title: 'Future Outlook',
        keyPoints: ['Emerging capabilities', 'Industry predictions', 'Preparing for change'],
      },
    ],
    conclusion: 'Summarize key takeaways and provide actionable next steps for readers.',
  },
  acceptanceCriteria: [
    'All statistics must be cited from approved sources',
    'Minimum 2,500 words for comprehensive coverage',
    'Include at least 3 real-world examples or case studies',
    'Must pass CiteMind verification before publication',
    'Maintain brand voice guidelines throughout',
  ],
  createdAt: '2025-01-22T12:00:00.000Z',
  updatedAt: '2025-01-24T12:00:00.000Z',
};

const MOCK_CITEMIND_PREVIEW: { status: CiteMindStatus; issues: CiteMindIssue[] } = {
  status: 'warning',
  issues: [
    { type: 'unverified_claim', severity: 'warning', message: 'Claim about 40-60% time savings needs specific source', section: 'Benefits' },
  ],
};

// ============================================
// CONSTRAINT CARD COMPONENT
// ============================================

function ConstraintCard({
  title,
  items,
  onAdd,
  onRemove,
  placeholder,
  accentColor = 'iris',
}: {
  title: string;
  items: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  placeholder?: string;
  accentColor?: 'iris' | 'cyan' | 'magenta';
}) {
  const [newItem, setNewItem] = useState('');
  const colorMap = {
    iris: 'brand-iris',
    cyan: 'brand-cyan',
    magenta: 'brand-magenta',
  };
  const color = colorMap[accentColor];

  const handleAdd = () => {
    if (newItem.trim() && onAdd) {
      onAdd();
      setNewItem('');
    }
  };

  return (
    <div className={`${card.base} p-4`}>
      <h3 className={`${label} mb-3`}>{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 p-2 bg-${color}/5 border border-${color}/20 rounded-lg`}
          >
            <span className={`w-1.5 h-1.5 mt-1.5 rounded-full bg-${color} shrink-0`} />
            <p className={`flex-1 text-xs ${text.secondary}`}>{item}</p>
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className={`p-1 ${text.hint} hover:${text.secondary} transition-colors`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {onAdd && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={placeholder || 'Add item...'}
              className={`flex-1 px-3 py-1.5 text-xs ${text.primary} bg-slate-2 border ${border.default} rounded-lg focus:outline-none focus:border-brand-iris/40`}
            />
            <button
              onClick={handleAdd}
              className={`px-3 py-1.5 text-xs font-medium text-${color} bg-${color}/10 hover:bg-${color}/20 rounded-lg transition-colors`}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// OUTLINE EDITOR COMPONENT
// ============================================

interface OutlineData {
  introduction: string;
  sections: OutlineSection[];
  conclusion: string;
}

function OutlineEditor({
  outline,
  onChange,
}: {
  outline: OutlineData;
  onChange: (outline: OutlineData) => void;
}) {
  return (
    <div className={`${card.base} p-4`}>
      <h3 className={`${label} mb-3`}>Content Outline</h3>

      {/* Introduction */}
      <div className="mb-4">
        <p className={`text-xs font-medium ${text.secondary} mb-1`}>Introduction</p>
        <textarea
          value={outline.introduction}
          onChange={(e) => onChange({ ...outline, introduction: e.target.value })}
          className={`w-full px-3 py-2 text-xs ${text.primary} bg-slate-2 border ${border.default} rounded-lg resize-none focus:outline-none focus:border-brand-iris/40`}
          rows={2}
        />
      </div>

      {/* Sections */}
      <div className="space-y-3 mb-4">
        {outline.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="pl-3 border-l-2 border-brand-iris/30">
            <input
              type="text"
              value={section.title}
              onChange={(e) => {
                const newSections = [...outline.sections];
                newSections[sectionIndex] = { ...section, title: e.target.value };
                onChange({ ...outline, sections: newSections });
              }}
              className={`w-full px-2 py-1 text-sm font-medium ${text.primary} bg-transparent border-none focus:outline-none`}
              placeholder="Section title..."
            />
            <ul className="mt-1 space-y-1">
              {section.keyPoints.map((point, pointIndex) => (
                <li key={pointIndex} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newSections = [...outline.sections];
                      const newPoints = [...section.keyPoints];
                      newPoints[pointIndex] = e.target.value;
                      newSections[sectionIndex] = { ...section, keyPoints: newPoints };
                      onChange({ ...outline, sections: newSections });
                    }}
                    className={`flex-1 px-1 py-0.5 text-xs ${text.secondary} bg-transparent border-none focus:outline-none`}
                    placeholder="Key point..."
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      <div>
        <p className={`text-xs font-medium ${text.secondary} mb-1`}>Conclusion</p>
        <textarea
          value={outline.conclusion}
          onChange={(e) => onChange({ ...outline, conclusion: e.target.value })}
          className={`w-full px-3 py-2 text-xs ${text.primary} bg-slate-2 border ${border.default} rounded-lg resize-none focus:outline-none focus:border-brand-iris/40`}
          rows={2}
        />
      </div>
    </div>
  );
}

// ============================================
// CITEMIND PREVIEW PANEL
// ============================================

function CiteMindPreviewPanel({
  status,
  issues,
}: {
  status: CiteMindStatus;
  issues: CiteMindIssue[];
}) {
  const tokens = statusTokens[status];

  return (
    <div className="p-4">
      <h3 className={`${label} mb-3`}>CiteMind Preview</h3>

      {/* Status */}
      <div className={`p-3 rounded-lg border ${tokens.bg} ${tokens.border} mb-3`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tokens.dot}`} />
          <span className={`text-sm font-medium ${tokens.text} capitalize`}>
            {status === 'passed' ? 'Ready to Generate' : status}
          </span>
        </div>
        <p className={`text-xs ${text.secondary} mt-1`}>
          {status === 'passed'
            ? 'Brief passes all CiteMind constraints'
            : status === 'warning'
            ? 'Some constraints need attention'
            : status === 'blocked'
            ? 'Critical issues must be resolved'
            : 'Analyzing brief constraints...'}
        </p>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                issue.severity === 'error'
                  ? 'bg-semantic-danger/5 border border-semantic-danger/20'
                  : 'bg-semantic-warning/5 border border-semantic-warning/20'
              }`}
            >
              <p className={`text-xs font-medium ${
                issue.severity === 'error' ? 'text-semantic-danger' : 'text-semantic-warning'
              }`}>
                {issue.type.replace(/_/g, ' ')}
              </p>
              <p className={`text-[10px] ${text.secondary}`}>{issue.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function BriefWorkSurfacePage({ params }: BriefPageProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<typeof MOCK_BRIEF | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [citeMindPreview] = useState(MOCK_CITEMIND_PREVIEW);

  // Editable state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedObjective, setEditedObjective] = useState('');
  const [editedOutline, setEditedOutline] = useState<typeof MOCK_BRIEF.outline | null>(null);

  // Fetch brief data
  useEffect(() => {
    async function fetchBrief() {
      setIsLoading(true);
      try {
        // In production: const res = await fetch(`/api/content/briefs/${params.id}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setBrief(MOCK_BRIEF);
        setEditedTitle(MOCK_BRIEF.title);
        setEditedObjective(MOCK_BRIEF.strategicObjective || '');
        setEditedOutline(MOCK_BRIEF.outline);
      } catch (error) {
        console.error('Failed to fetch brief:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBrief();
  }, [params.id]);

  // Handlers
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In production: await fetch(`/api/content/briefs/${params.id}`, { method: 'PATCH', body: ... });
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleGenerateDraft = useCallback(async () => {
    if (citeMindPreview.status === 'blocked') return;

    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // In production: const res = await fetch('/api/content/briefs/generate', { method: 'POST', body: { briefId: params.id } });
      // Then navigate to the generated asset
      router.push('/app/content/asset/new-draft');
    } finally {
      setIsGenerating(false);
    }
  }, [citeMindPreview.status, router]);

  if (isLoading || !brief || !editedOutline) {
    return (
      <div className={`min-h-screen ${surface.page} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-iris border-t-transparent rounded-full animate-spin" />
          <span className={text.secondary}>Loading brief...</span>
        </div>
      </div>
    );
  }

  const isBlocked = citeMindPreview.status === 'blocked';
  const modeStyle = modeTokens.copilot;

  return (
    <div className={`min-h-screen ${surface.page}`}>
      {/* Header */}
      <div className={`border-b ${border.default} bg-slate-1`}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/app/content')}
              className={`p-2 rounded-lg ${interactive.ghost}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={`text-xl font-semibold ${text.primary} bg-transparent border-none focus:outline-none flex-1`}
                  placeholder="Brief title..."
                />
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  brief.status === 'approved' ? 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20' :
                  brief.status === 'in_progress' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' :
                  'bg-slate-4 text-white/60 border border-slate-5'
                }`}>
                  {brief.status.replace('_', ' ')}
                </span>
              </div>
              <p className={`text-xs ${text.muted} mt-1`}>
                Target: {brief.targetKeyword} · Due: {new Date(brief.deadline || '').toLocaleDateString()}
              </p>
            </div>

            {/* Mode Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${modeStyle.bg} ${modeStyle.border}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`text-xs font-medium ${modeStyle.text}`}>{modeStyle.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Constraints Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Strategic Objective */}
          <div className={`${card.base} p-4`}>
            <h3 className={`${label} mb-2`}>Strategic Objective</h3>
            <textarea
              value={editedObjective}
              onChange={(e) => setEditedObjective(e.target.value)}
              placeholder="What authority does this content reinforce?"
              className={`w-full px-3 py-2 text-sm ${text.primary} bg-slate-2 border ${border.default} rounded-lg resize-none focus:outline-none focus:border-brand-iris/40`}
              rows={2}
            />
          </div>

          {/* Two-column layout for constraints */}
          <div className="grid grid-cols-2 gap-4">
            {/* Entities */}
            <ConstraintCard
              title="Target Entities"
              items={brief.entities}
              placeholder="Add entity..."
              accentColor="iris"
            />

            {/* Required Citations */}
            <ConstraintCard
              title="Required Citations"
              items={brief.requiredCitations || []}
              placeholder="Add citation source..."
              accentColor="cyan"
            />
          </div>

          {/* Allowed Claims */}
          <ConstraintCard
            title="Allowed Claims (CiteMind Governed)"
            items={brief.allowedClaims}
            placeholder="Add verifiable claim..."
            accentColor="magenta"
          />

          {/* Outline */}
          <OutlineEditor
            outline={editedOutline}
            onChange={setEditedOutline}
          />

          {/* Acceptance Criteria */}
          <ConstraintCard
            title="Acceptance Criteria"
            items={brief.acceptanceCriteria}
            placeholder="Add criterion..."
          />
        </div>

        {/* Right Rail */}
        <div className={`w-[320px] border-l ${border.default} bg-slate-1 overflow-y-auto`}>
          {/* Brief Details */}
          <div className="p-4 space-y-3">
            <h3 className={label}>Brief Details</h3>

            <div>
              <p className={`text-[10px] ${text.hint}`}>Target Keyword</p>
              <p className={`text-sm ${text.primary}`}>{brief.targetKeyword}</p>
            </div>

            <div>
              <p className={`text-[10px] ${text.hint}`}>Search Intent</p>
              <p className={`text-sm ${text.primary} capitalize`}>{brief.targetIntent}</p>
            </div>

            <div>
              <p className={`text-[10px] ${text.hint}`}>Target Audience</p>
              <p className={`text-xs ${text.secondary}`}>{brief.targetAudience}</p>
            </div>

            <div>
              <p className={`text-[10px] ${text.hint}`}>Tone</p>
              <p className={`text-sm ${text.primary} capitalize`}>{brief.tone}</p>
            </div>
          </div>

          <div className={`border-t ${border.default}`} />

          {/* CiteMind Preview */}
          <CiteMindPreviewPanel
            status={citeMindPreview.status}
            issues={citeMindPreview.issues}
          />

          <div className={`border-t ${border.default}`} />

          {/* Generate CTA */}
          <div className="p-4">
            <button
              onClick={handleGenerateDraft}
              disabled={isBlocked || isGenerating}
              className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isBlocked
                  ? 'bg-slate-4 text-white/30 cursor-not-allowed'
                  : isGenerating
                  ? 'bg-brand-iris/20 text-brand-iris cursor-wait'
                  : interactive.primary
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Draft...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Draft (Copilot)
                </span>
              )}
            </button>
            {isBlocked && (
              <p className="mt-2 text-[10px] text-semantic-danger text-center">
                Resolve CiteMind issues to generate
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className={`flex items-center justify-between p-4 border-t ${border.default} bg-slate-1`}>
        <p className={`text-xs ${text.muted}`}>
          Last updated {new Date(brief.updatedAt).toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/app/content')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${interactive.button}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${interactive.primary}`}
          >
            {isSaving ? 'Saving...' : 'Save Brief'}
          </button>
        </div>
      </div>
    </div>
  );
}
