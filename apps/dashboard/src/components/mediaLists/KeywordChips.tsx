/**
 * Keyword Chips Component (Sprint S47)
 * Displays keyword tags as chips
 */

interface KeywordChipsProps {
  keywords: string[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function KeywordChips({ keywords, maxDisplay = 5, size = 'md' }: KeywordChipsProps) {
  const displayKeywords = keywords.slice(0, maxDisplay);
  const remainingCount = keywords.length - maxDisplay;

  if (keywords.length === 0) {
    return (
      <span className="text-sm text-gray-400 italic">No keywords</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayKeywords.map((keyword, index) => (
        <span
          key={index}
          className={`inline-flex items-center font-medium rounded-full bg-purple-100 text-purple-800 ${sizeClasses[size]}`}
        >
          {keyword}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-600 ${sizeClasses[size]}`}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
