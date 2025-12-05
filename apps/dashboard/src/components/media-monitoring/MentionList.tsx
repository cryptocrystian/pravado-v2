'use client';

/**
 * Mention List Component (Sprint S40)
 * Displays earned mentions with filtering
 */

import type { MentionSentiment, MentionWithArticle } from '@pravado/types';

import { SentimentBadge } from './SentimentBadge';

interface MentionListProps {
  mentions: MentionWithArticle[];
  onSelectMention: (mention: MentionWithArticle) => void;
  sentimentFilter: MentionSentiment | null;
  onSentimentFilterChange: (sentiment: MentionSentiment | null) => void;
  isLoading?: boolean;
}

export function MentionList({
  mentions,
  onSelectMention,
  sentimentFilter,
  onSentimentFilterChange,
  isLoading,
}: MentionListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const sentimentCounts = {
    positive: mentions.filter((m) => m.sentiment === 'positive').length,
    neutral: mentions.filter((m) => m.sentiment === 'neutral').length,
    negative: mentions.filter((m) => m.sentiment === 'negative').length,
  };

  const filteredMentions = sentimentFilter
    ? mentions.filter((m) => m.sentiment === sentimentFilter)
    : mentions;

  return (
    <div className="flex h-full flex-col">
      {/* Header with Filters */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Earned Mentions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSentimentFilterChange(null)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sentimentFilter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({mentions.length})
          </button>
          <button
            onClick={() => onSentimentFilterChange('positive')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sentimentFilter === 'positive'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Positive ({sentimentCounts.positive})
          </button>
          <button
            onClick={() => onSentimentFilterChange('neutral')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sentimentFilter === 'neutral'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Neutral ({sentimentCounts.neutral})
          </button>
          <button
            onClick={() => onSentimentFilterChange('negative')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sentimentFilter === 'negative'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Negative ({sentimentCounts.negative})
          </button>
        </div>
      </div>

      {/* Mention List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredMentions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {sentimentFilter
              ? `No ${sentimentFilter} mentions found.`
              : 'No mentions detected yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredMentions.map((mention) => (
              <li key={mention.id}>
                <button
                  onClick={() => onSelectMention(mention)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {mention.entity}
                        </span>
                        <SentimentBadge sentiment={mention.sentiment} />
                        {mention.isPrimaryMention && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {mention.snippet || mention.context}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {mention.article.title}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>{formatDate(mention.createdAt)}</div>
                      <div className="mt-1">
                        {Math.round(mention.confidence * 100)}% conf
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
