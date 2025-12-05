'use client';

/**
 * Article Drawer Component (Sprint S40)
 * Slide-out drawer showing article details with mentions highlighted
 */

import type { ArticleWithMentions, EarnedMention } from '@pravado/types';
import { useEffect, useState } from 'react';

import { getArticleDetails } from '@/lib/mediaMonitoringApi';

import { RelevanceBadge } from './RelevanceBadge';
import { SentimentBadge } from './SentimentBadge';

interface ArticleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string | null;
}

export function ArticleDrawer({ isOpen, onClose, articleId }: ArticleDrawerProps) {
  const [article, setArticle] = useState<ArticleWithMentions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId || !isOpen) {
      setArticle(null);
      return;
    }

    const loadArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getArticleDetails(articleId);
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [articleId, isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 border-green-300';
      case 'negative':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  const highlightMentions = (content: string, mentions: EarnedMention[]) => {
    if (!mentions.length) return content;

    // Sort mentions by position (descending) to replace from end to start
    const sortedMentions = [...mentions].sort(
      (a, b) => (b.positionInArticle || 0) - (a.positionInArticle || 0)
    );

    let result = content;
    for (const mention of sortedMentions) {
      if (mention.snippet) {
        const colorClass = getSentimentColor(mention.sentiment);
        result = result.replace(
          mention.snippet,
          `<mark class="${colorClass} border rounded px-1">${mention.snippet}</mark>`
        );
      }
    }

    return result;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Article Details</h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">{error}</div>
            ) : article ? (
              <div className="p-6">
                {/* Article Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {article.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {article.author && (
                      <span>By {article.author}</span>
                    )}
                    <span>{formatDate(article.publishedAt)}</span>
                    {article.source && (
                      <span className="text-blue-600">{article.source.name}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RelevanceBadge score={article.relevanceScore} />
                    <span className="text-sm text-gray-500">
                      DA: {article.domainAuthority}
                    </span>
                    <span className="text-sm text-gray-500">
                      {article.wordCount} words
                    </span>
                  </div>
                </div>

                {/* Keywords */}
                {article.keywords.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentions */}
                {article.mentions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Detected Mentions ({article.mentions.length})
                    </h3>
                    <div className="space-y-2">
                      {article.mentions.map((mention) => (
                        <div
                          key={mention.id}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {mention.entity}
                            </span>
                            <SentimentBadge sentiment={mention.sentiment} />
                            <span className="text-xs text-gray-500">
                              {Math.round(mention.confidence * 100)}% confidence
                            </span>
                          </div>
                          {mention.snippet && (
                            <p className="text-sm text-gray-600 italic">
                              &ldquo;{mention.snippet}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {article.summary && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
                    <p className="text-gray-600">{article.summary}</p>
                  </div>
                )}

                {/* Content */}
                {article.content && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Full Content</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html: highlightMentions(article.content, article.mentions),
                      }}
                    />
                  </div>
                )}

                {/* Link */}
                <div className="border-t border-gray-200 pt-4">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    View Original Article
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
