'use client';

/**
 * PR Generator Form Component (Sprint S38)
 * Input form for press release generation
 */

import { useState } from 'react';

import type { PRGenerationInput, PRNewsType, PRTone } from '@pravado/types';

interface PRGeneratorFormProps {
  onSubmit: (input: PRGenerationInput) => void;
  isLoading?: boolean;
}

const NEWS_TYPES: { value: PRNewsType; label: string }[] = [
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'company_milestone', label: 'Company Milestone' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'funding', label: 'Funding' },
  { value: 'executive_hire', label: 'Executive Hire' },
  { value: 'award', label: 'Award' },
  { value: 'event', label: 'Event' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

const TONES: { value: PRTone; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
];

export function PRGeneratorForm({ onSubmit, isLoading }: PRGeneratorFormProps) {
  const [formData, setFormData] = useState<Partial<PRGenerationInput>>({
    newsType: 'product_launch',
    tone: 'professional',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.announcement || !formData.newsType) {
      return;
    }
    onSubmit(formData as PRGenerationInput);
  };

  const updateField = <K extends keyof PRGenerationInput>(
    field: K,
    value: PRGenerationInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName || ''}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              News Type *
            </label>
            <select
              value={formData.newsType || 'product_launch'}
              onChange={(e) => updateField('newsType', e.target.value as PRNewsType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NEWS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Announcement *
          </label>
          <textarea
            value={formData.announcement || ''}
            onChange={(e) => updateField('announcement', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the announcement or news you want to share..."
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Description
          </label>
          <textarea
            value={formData.companyDescription || ''}
            onChange={(e) => updateField('companyDescription', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of your company..."
          />
        </div>
      </div>

      {/* Quotes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotes & Attribution</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Spokesperson Name
            </label>
            <input
              type="text"
              value={formData.spokespersonName || ''}
              onChange={(e) => updateField('spokespersonName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spokesperson Title
            </label>
            <input
              type="text"
              value={formData.spokespersonTitle || ''}
              onChange={(e) => updateField('spokespersonTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CEO"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Spokesperson
            </label>
            <input
              type="text"
              value={formData.secondarySpokesperson || ''}
              onChange={(e) => updateField('secondarySpokesperson', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Title
            </label>
            <input
              type="text"
              value={formData.secondarySpokespersonTitle || ''}
              onChange={(e) => updateField('secondarySpokespersonTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VP of Marketing"
            />
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tone
                </label>
                <select
                  value={formData.tone || 'professional'}
                  onChange={(e) => updateField('tone', e.target.value as PRTone)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.targetAudience || ''}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enterprise customers, investors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.targetKeywords?.join(', ') || ''}
                  onChange={(e) =>
                    updateField(
                      'targetKeywords',
                      e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AI, innovation, enterprise"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Angle (optional)
              </label>
              <input
                type="text"
                value={formData.preferredAngle || ''}
                onChange={(e) => updateField('preferredAngle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Innovation leadership, Market disruption..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Context
              </label>
              <textarea
                value={formData.additionalContext || ''}
                onChange={(e) => updateField('additionalContext', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information that should be included..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !formData.companyName || !formData.announcement}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate Press Release</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
