'use client';

import { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import type { IntakeField } from './content-mock-data';
import {
  thoughtLeadershipFields,
  advancedFields,
  exampleOutline,
} from './content-mock-data';

function FormField({ field }: { field: IntakeField }) {
  const labelEl = (
    <label className="block text-sm font-medium text-white mb-1.5">
      {field.label}
      {field.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  if (field.type === 'text') {
    return (
      <div>
        {labelEl}
        <input
          type="text"
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors"
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        {labelEl}
        <textarea
          rows={3}
          placeholder={field.placeholder}
          className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors resize-none"
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        {labelEl}
        <select
          defaultValue={field.defaultValue}
          className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-cyan/50 transition-colors appearance-none"
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="bg-cc-surface text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'multi-text') {
    return (
      <div>
        {labelEl}
        <div className="space-y-2">
          {Array.from({ length: field.count ?? 3 }).map((_, i) => (
            <div key={i}>
              <span className="text-xs text-white/45 block mb-1">
                {field.subLabels?.[i] ?? `Item ${i + 1}`}
              </span>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

interface TemplateIntakeFormProps {
  templateName: string;
}

export function TemplateIntakeForm({ templateName: _templateName }: TemplateIntakeFormProps) {
  // templateName will be used to load template-specific field schemas in integration sprint
  void _templateName;
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-8">
      {/* Left: Form */}
      <div>
        <div className="space-y-5">
          {thoughtLeadershipFields.map((field) => (
            <FormField key={field.name} field={field} />
          ))}
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-white/45 hover:text-white/70 mt-6 mb-3 transition-colors"
        >
          Advanced options
          {showAdvanced ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {showAdvanced && (
          <div className="space-y-5 mb-6">
            {advancedFields.map((field) => (
              <FormField key={field.name} field={field} />
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          className="w-full bg-cc-cyan text-cc-page rounded-xl px-6 py-3 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors mt-4"
        >
          Generate Draft
        </button>
        <p className="text-xs text-white/45 text-center mt-2">
          AI will generate a complete first draft. Takes about 10 seconds.
        </p>
      </div>

      {/* Right: Preview */}
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 h-fit lg:sticky lg:top-6">
        <span className="text-xs text-white/45 block mb-4">Example outline</span>

        <div className="space-y-3">
          {exampleOutline.map((heading, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs text-white/30 font-mono mt-0.5 w-5 flex-shrink-0">
                H2
              </span>
              <span className="text-sm text-white/70">{heading}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/45 italic mt-5 pt-4 border-t border-white/5">
          Your draft will be tailored to your brief inputs
        </p>
      </div>
    </div>
  );
}
