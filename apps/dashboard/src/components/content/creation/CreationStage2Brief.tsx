'use client';

/**
 * CreationStage2Brief — Brief intake form + live AI panel.
 *
 * Left column: structured form (universal + type-specific fields).
 * Right column: sticky AI panel (CiteMind preview, SAGE context, cross-pillar signal).
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  Article,
  BookOpenText,
  EnvelopeSimple,
  ShareNetwork,
  Megaphone,
  Lightning,
} from '@phosphor-icons/react';
import type { AutomationMode, CreationContentType } from '../types';
import { CREATION_TYPE_CONFIG } from '../types';

// ============================================
// ICON MAP
// ============================================

const ICON_MAP: Record<string, PhosphorIcon> = {
  Article,
  BookOpenText,
  EnvelopeSimple,
  ShareNetwork,
  Megaphone,
};

// ============================================
// CITEMIND MOCK SCORING
// ============================================

function computeCiteMindScore(formData: Record<string, string>): number {
  let score = 55;
  if ((formData.topic?.length || 0) > 20) score += 10;
  if (formData.targetKeyword?.length) score += 8;
  const filledPoints = [formData.keyPoint1, formData.keyPoint2, formData.keyPoint3].filter(
    (p) => p && p.length > 0
  ).length;
  if (filledPoints >= 2) score += 5;
  if (formData.audience && formData.audience !== '') score += 6;
  return Math.min(score, 89);
}

function getCiteColor(score: number): string {
  if (score >= 75) return 'text-semantic-success';
  if (score >= 55) return 'text-brand-cyan';
  return 'text-amber-400';
}

// ============================================
// FORM INPUT COMPONENTS
// ============================================

function FormInput({
  label,
  name,
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/70 mb-1.5">
        {label}
        {required && <span className="text-semantic-danger ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-brand-iris/40 transition-colors"
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/70 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-brand-iris/40 transition-colors appearance-none"
      >
        <option value="" className="bg-slate-2 text-white">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-2 text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/70 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-brand-iris/40 transition-colors resize-none"
      />
    </div>
  );
}

// ============================================
// PROPS
// ============================================

interface CreationStage2BriefProps {
  mode: AutomationMode;
  selectedContentType: CreationContentType | null;
  selectedSageBriefId: string | null;
  briefFormData: Record<string, string>;
  onBriefFormChange: (data: Record<string, string>) => void;
  onGenerateOutline: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreationStage2Brief({
  mode,
  selectedContentType,
  selectedSageBriefId,
  briefFormData,
  onBriefFormChange,
  onGenerateOutline,
}: CreationStage2BriefProps) {
  const [citeMindScore, setCiteMindScore] = useState(55);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveType = selectedContentType || 'blog_post';
  const typeConfig = CREATION_TYPE_CONFIG[effectiveType];
  const IconComponent = ICON_MAP[typeConfig.iconName];

  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      const updated = { ...briefFormData, [name]: value };
      onBriefFormChange(updated);

      // Debounced CiteMind score recalculation
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setCiteMindScore(computeCiteMindScore(updated));
      }, 600);
    },
    [briefFormData, onBriefFormChange]
  );

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const f = (name: string) => briefFormData[name] || '';

  const copilotSuggestions = mode === 'copilot'
    ? [
        { field: 'targetKeyword', label: 'Keyword', value: 'enterprise AEO strategy' },
        { field: 'audience', label: 'Audience', value: 'Enterprise CMO' },
        { field: 'keyPoint1', label: 'Angle', value: 'Why traditional SEO underestimates AI citation impact' },
      ]
    : [];

  return (
    <div className="px-8 py-6 flex gap-0 h-full">
      {/* LEFT — Brief Form */}
      <div className="flex-[3] min-w-0 pr-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {IconComponent && (
            <IconComponent className="w-5 h-5 text-brand-iris" weight="regular" />
          )}
          <span className="text-base font-semibold text-white/90">{typeConfig.label}</span>
        </div>
        <p className="text-[13px] text-white/50 mb-6">
          Fill in the brief. AI will generate a structured first draft.
        </p>

        {/* Universal fields */}
        <div className="space-y-4 mb-6">
          <FormInput
            label="Title / Working Headline"
            name="title"
            placeholder="Working title — doesn't need to be final"
            required
            value={f('title')}
            onChange={handleFieldChange}
          />
          <FormInput
            label="Primary Topic"
            name="topic"
            placeholder="What is this piece about? (e.g. 'Enterprise AEO strategy for B2B SaaS')"
            required
            value={f('topic')}
            onChange={handleFieldChange}
          />
          <FormInput
            label="Target Keyword"
            name="targetKeyword"
            placeholder="Primary keyword or phrase to rank for"
            value={f('targetKeyword')}
            onChange={handleFieldChange}
          />
          <FormSelect
            label="Target Audience"
            name="audience"
            options={['Enterprise CMO', 'Marketing Manager', 'SEO Specialist', 'PR Manager', 'Founder/CEO', 'General Business']}
            value={f('audience')}
            onChange={handleFieldChange}
          />
          <FormSelect
            label="Tone"
            name="tone"
            options={['Authoritative', 'Conversational', 'Educational', 'Thought Leadership', 'Neutral']}
            value={f('tone')}
            onChange={handleFieldChange}
          />

          {/* Key Points */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-1.5">Key Points to Cover</label>
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n}>
                  <span className="text-[11px] text-white/40 block mb-1">Point {n}</span>
                  <input
                    type="text"
                    value={f(`keyPoint${n}`)}
                    onChange={(e) => handleFieldChange(`keyPoint${n}`, e.target.value)}
                    placeholder="Main argument, claim, or section you want included"
                    className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-brand-iris/40 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Type-specific fields */}
        <div className="space-y-4 mb-6">
          {effectiveType === 'blog_post' && (
            <FormSelect
              label="Target Word Count"
              name="wordCount"
              options={['800', '1000', '1200', '1500']}
              value={f('wordCount')}
              onChange={handleFieldChange}
            />
          )}
          {effectiveType === 'long_form_article' && (
            <>
              <FormInput label="Author Name" name="author" placeholder="Byline author" value={f('author')} onChange={handleFieldChange} />
              <FormSelect label="Target Word Count" name="wordCount" options={['2000', '2500', '3000', '4000+']} value={f('wordCount')} onChange={handleFieldChange} />
            </>
          )}
          {effectiveType === 'newsletter' && (
            <>
              <FormInput label="Newsletter Name / Series" name="newsletterName" placeholder="e.g. The Authority Brief" value={f('newsletterName')} onChange={handleFieldChange} />
              <FormInput label="Issue Number / Date" name="issueNumber" placeholder="e.g. Issue #12 or March 2026" value={f('issueNumber')} onChange={handleFieldChange} />
              <FormInput label="Primary CTA" name="primaryCta" placeholder="What action should readers take?" value={f('primaryCta')} onChange={handleFieldChange} />
            </>
          )}
          {effectiveType === 'social_series' && (
            <>
              <FormSelect label="Platform" name="platform" options={['LinkedIn', 'X/Twitter', 'Instagram', 'Multi-platform']} value={f('platform')} onChange={handleFieldChange} />
              <FormSelect label="Number of Posts" name="postCount" options={['3', '5', '7', '10']} value={f('postCount')} onChange={handleFieldChange} />
            </>
          )}
          {effectiveType === 'press_release' && (
            <>
              <FormSelect label="Announcement Type" name="announcementType" options={['Product Launch', 'Partnership', 'Milestone', 'Event', 'Award']} value={f('announcementType')} onChange={handleFieldChange} />
              <FormInput label="Quote Attribution" name="quoteAttribution" placeholder="Name and title of person quoted" value={f('quoteAttribution')} onChange={handleFieldChange} />
              <FormTextarea label="Boilerplate" name="boilerplate" placeholder="Standard company description paragraph" value={f('boilerplate')} onChange={handleFieldChange} />
            </>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onGenerateOutline}
          className="w-full px-6 py-3 bg-brand-iris text-white/95 text-sm font-semibold rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
        >
          Generate Outline →
        </button>
        <p className="text-[13px] text-white/40 text-center mt-2">
          SAGE will generate a structured outline. ~5 seconds.
        </p>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-white/[0.08] self-stretch mx-0 shrink-0" />

      {/* RIGHT — Live AI Panel */}
      <div className="flex-[2] min-w-0 pl-6 overflow-y-auto">
        <div className="sticky top-6 bg-slate-2 border border-border-subtle rounded-xl p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4 block">
            SAGE Intelligence
          </span>

          {/* Copilot pre-fill suggestions */}
          {copilotSuggestions.length > 0 && (
            <div className="mb-4 pb-4 border-b border-border-subtle">
              <p className="text-[13px] text-white/60 mb-2">SAGE suggests for this brief:</p>
              <div className="flex flex-wrap gap-1.5">
                {copilotSuggestions.map((s) => (
                  <button
                    key={s.field}
                    type="button"
                    onClick={() => handleFieldChange(s.field, s.value)}
                    className="bg-brand-iris/10 border border-brand-iris/20 text-brand-iris text-[13px] rounded-full px-2.5 py-0.5 cursor-pointer hover:bg-brand-iris/20 transition-colors"
                  >
                    {s.label}: {s.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECTION A — CiteMind Preview */}
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
              CiteMind Forecast
            </span>
            {!f('topic') ? (
              <>
                <span className="text-2xl font-bold text-white/20">—</span>
                <p className="text-[13px] text-white/40 mt-1">Fill in topic to see citation potential</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums ${getCiteColor(citeMindScore)}`}>
                    {citeMindScore}
                  </span>
                  <span className="text-lg text-white/30">/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-iris transition-all duration-500"
                    style={{ width: `${citeMindScore}%` }}
                  />
                </div>
                <p className="text-[13px] text-white/60 mt-2">
                  Expert Guides with structured Q&A average 84+
                </p>
              </>
            )}
          </div>

          {/* SECTION B — SAGE Context */}
          {(selectedSageBriefId || (f('topic').length > 15)) && (
            <div className="bg-brand-iris/5 border border-brand-iris/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightning className="w-3.5 h-3.5 text-brand-iris" weight="fill" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-iris">
                  SAGE has context
                </span>
              </div>
              <p className="text-[13px] text-white/70 mb-2">
                A competitor has a guide on this topic frequently cited on ChatGPT.
              </p>
              <button
                type="button"
                className="text-[13px] text-brand-iris hover:text-brand-iris/80 transition-colors"
              >
                Load SAGE brief →
              </button>
            </div>
          )}

          {/* SECTION C — Cross-Pillar Signal (press_release only) */}
          {effectiveType === 'press_release' && (
            <div className="bg-brand-magenta/5 border border-brand-magenta/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Megaphone className="w-3.5 h-3.5 text-brand-magenta" weight="regular" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-magenta">
                  PR Surface Sync
                </span>
              </div>
              <p className="text-[13px] text-white/70">
                A linked draft will be created in your PR surface when you save.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
