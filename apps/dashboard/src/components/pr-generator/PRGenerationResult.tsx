'use client';

/**
 * PR Generation Result Component (Sprint S38)
 * Displays the generated press release — DS v3 dark theme
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
                ? 'bg-semantic-success/10 text-semantic-success'
                : release.status === 'generating'
                ? 'bg-brand-cyan/10 text-brand-cyan'
                : 'bg-slate-3 text-white/60'
            }`}
          >
            {release.status === 'complete' ? 'Complete' : release.status}
          </span>
          <span className="ml-2 text-sm text-white/50">
            {release.wordCount} words
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm border border-border-subtle rounded-md text-white/70 hover:bg-slate-3 transition-colors"
          >
            Copy to Clipboard
          </button>
          {onOptimize && (
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="px-3 py-1 text-sm bg-brand-iris text-white rounded-md hover:bg-brand-iris/90 disabled:opacity-50"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>
          )}
        </div>
      </div>

      {/* Press Release Content */}
      <div className="bg-slate-2 rounded-lg border border-border-subtle p-6 space-y-4">
        <h1 className="text-2xl font-bold text-white">{release.headline}</h1>

        {release.subheadline && (
          <p className="text-lg text-white/60 italic">{release.subheadline}</p>
        )}

        {release.dateline && (
          <p className="text-sm font-semibold text-white/70">{release.dateline}</p>
        )}

        <div className="max-w-none">
          {release.body?.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-white/70 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {release.quote1 && (
          <blockquote className="border-l-4 border-brand-iris pl-4 my-4">
            <p className="text-white/70 italic">&quot;{release.quote1}&quot;</p>
            <cite className="text-sm text-white/50 not-italic">
              - {release.quote1Attribution}
            </cite>
          </blockquote>
        )}

        {release.quote2 && (
          <blockquote className="border-l-4 border-brand-iris pl-4 my-4">
            <p className="text-white/70 italic">&quot;{release.quote2}&quot;</p>
            <cite className="text-sm text-white/50 not-italic">
              - {release.quote2Attribution}
            </cite>
          </blockquote>
        )}

        {release.boilerplate && (
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <p className="text-sm text-white/50">{release.boilerplate}</p>
          </div>
        )}
      </div>

      {release.seoSummary && (
        <SEOSummaryPanel seoSummary={release.seoSummary} />
      )}

      {release.angle && (
        <div className="bg-slate-3/30 rounded-lg border border-border-subtle p-4">
          <h4 className="text-sm font-semibold text-white/70 mb-2">Selected Angle</h4>
          <p className="text-white/60">{release.angle}</p>
        </div>
      )}
    </div>
  );
}

function SEOSummaryPanel({ seoSummary }: { seoSummary: PRSEOSummary }) {
  return (
    <div className="bg-slate-2 rounded-lg border border-border-subtle p-6">
      <h3 className="text-lg font-semibold text-white mb-4">SEO Analysis</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-3/50 rounded-lg">
          <div className="text-2xl font-bold text-brand-cyan">
            {seoSummary.readabilityScore?.toFixed(0) || 'N/A'}
          </div>
          <div className="text-xs text-white/40">Readability Score</div>
        </div>
        <div className="text-center p-3 bg-slate-3/50 rounded-lg">
          <div className="text-2xl font-bold text-semantic-success">
            {seoSummary.readabilityGrade || 'N/A'}
          </div>
          <div className="text-xs text-white/40">Reading Level</div>
        </div>
        <div className="text-center p-3 bg-slate-3/50 rounded-lg">
          <div className="text-2xl font-bold text-brand-iris">
            {seoSummary.sentenceCount}
          </div>
          <div className="text-xs text-white/40">Sentences</div>
        </div>
        <div className="text-center p-3 bg-slate-3/50 rounded-lg">
          <div className="text-2xl font-bold text-brand-amber">
            {seoSummary.avgSentenceLength.toFixed(1)}
          </div>
          <div className="text-xs text-white/40">Avg Words/Sentence</div>
        </div>
      </div>

      {seoSummary.primaryKeyword && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white/70 mb-2">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded text-sm">
              {seoSummary.primaryKeyword}
            </span>
            {seoSummary.secondaryKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-3 text-white/60 rounded text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {seoSummary.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/70 mb-2">Suggestions</h4>
          <ul className="space-y-2">
            {seoSummary.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`flex items-start text-sm p-2 rounded ${
                  suggestion.priority === 'high'
                    ? 'bg-semantic-danger/10 text-semantic-danger'
                    : suggestion.priority === 'medium'
                    ? 'bg-semantic-warning/10 text-semantic-warning'
                    : 'bg-slate-3/50 text-white/60'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 mr-2 ${
                    suggestion.priority === 'high'
                      ? 'bg-semantic-danger'
                      : suggestion.priority === 'medium'
                      ? 'bg-semantic-warning'
                      : 'bg-white/30'
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
