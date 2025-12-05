'use client';

/**
 * PR Generation Result Component (Sprint S38)
 * Displays the generated press release
 */

import type { PRGeneratedRelease, PRSEOSummary } from '@pravado/types';

interface PRGenerationResultProps {
  release: PRGeneratedRelease;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

export function PRGenerationResult({
  release,
  onOptimize,
  isOptimizing,
}: PRGenerationResultProps) {
  const copyToClipboard = async () => {
    const fullText = `${release.headline}\n\n${release.subheadline}\n\n${release.dateline}\n\n${release.body}\n\n${release.quote1 ? `"${release.quote1}"\n- ${release.quote1Attribution}\n\n` : ''}${release.quote2 ? `"${release.quote2}"\n- ${release.quote2Attribution}\n\n` : ''}###\n\n${release.boilerplate}`;

    await navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              release.status === 'complete'
                ? 'bg-green-100 text-green-800'
                : release.status === 'generating'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {release.status === 'complete' ? 'Complete' : release.status}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            {release.wordCount} words
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Copy to Clipboard
          </button>
          {onOptimize && (
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>
          )}
        </div>
      </div>

      {/* Press Release Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900">{release.headline}</h1>

        {/* Subheadline */}
        {release.subheadline && (
          <p className="text-lg text-gray-600 italic">{release.subheadline}</p>
        )}

        {/* Dateline */}
        {release.dateline && (
          <p className="text-sm font-semibold text-gray-700">{release.dateline}</p>
        )}

        {/* Body */}
        <div className="prose prose-gray max-w-none">
          {release.body?.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Quotes */}
        {release.quote1 && (
          <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
            <p className="text-gray-700 italic">&quot;{release.quote1}&quot;</p>
            <cite className="text-sm text-gray-600 not-italic">
              - {release.quote1Attribution}
            </cite>
          </blockquote>
        )}

        {release.quote2 && (
          <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
            <p className="text-gray-700 italic">&quot;{release.quote2}&quot;</p>
            <cite className="text-sm text-gray-600 not-italic">
              - {release.quote2Attribution}
            </cite>
          </blockquote>
        )}

        {/* Boilerplate */}
        {release.boilerplate && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">{release.boilerplate}</p>
          </div>
        )}
      </div>

      {/* SEO Summary */}
      {release.seoSummary && (
        <SEOSummaryPanel seoSummary={release.seoSummary} />
      )}

      {/* Angle Info */}
      {release.angle && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Angle</h4>
          <p className="text-gray-600">{release.angle}</p>
        </div>
      )}
    </div>
  );
}

function SEOSummaryPanel({ seoSummary }: { seoSummary: PRSEOSummary }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {seoSummary.readabilityScore?.toFixed(0) || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Readability Score</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {seoSummary.readabilityGrade || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Reading Level</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {seoSummary.sentenceCount}
          </div>
          <div className="text-xs text-gray-500">Sentences</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {seoSummary.avgSentenceLength.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Avg Words/Sentence</div>
        </div>
      </div>

      {/* Keywords */}
      {seoSummary.primaryKeyword && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {seoSummary.primaryKeyword}
            </span>
            {seoSummary.secondaryKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {seoSummary.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
          <ul className="space-y-2">
            {seoSummary.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`flex items-start text-sm p-2 rounded ${
                  suggestion.priority === 'high'
                    ? 'bg-red-50 text-red-700'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 mr-2 ${
                    suggestion.priority === 'high'
                      ? 'bg-red-500'
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}
                />
                {suggestion.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
