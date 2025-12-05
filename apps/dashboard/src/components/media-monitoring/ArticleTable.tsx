'use client';

/**
 * Article Table Component (Sprint S40)
 * Displays monitored articles with filtering and sorting
 */

import type { ArticleWithSource } from '@pravado/types';

import { RelevanceBadge } from './RelevanceBadge';

interface ArticleTableProps {
  articles: ArticleWithSource[];
  onSelectArticle: (article: ArticleWithSource) => void;
  isLoading?: boolean;
}

export function ArticleTable({ articles, onSelectArticle, isLoading }: ArticleTableProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">No articles found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ingest articles to start monitoring media coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Article
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Author
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Relevance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {articles.map((article) => (
            <tr
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-6 py-4">
                <div className="max-w-md">
                  <div className="font-medium text-gray-900 line-clamp-2">
                    {article.title}
                  </div>
                  {article.summary && (
                    <div className="mt-1 text-sm text-gray-500 line-clamp-1">
                      {article.summary}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {article.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {keyword}
                      </span>
                    ))}
                    {article.keywords.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{article.keywords.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {article.source ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {article.source.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      DA: {article.domainAuthority}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unknown</span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {article.author || <span className="text-gray-400">Unknown</span>}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(article.publishedAt)}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <RelevanceBadge score={article.relevanceScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
