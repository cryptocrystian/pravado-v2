'use client';

/**
 * Topic Currency Indicator - DS 3.0
 *
 * Visual indicator for contact topic currency (freshness decay).
 * Higher = more recent relevant coverage, lower = stale.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

interface Props {
  currency: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function TopicCurrencyIndicator({ currency, showLabel = false, size = 'sm' }: Props) {
  const getColor = (value: number) => {
    if (value >= 80) return { bar: 'bg-semantic-success', text: 'text-semantic-success', label: 'Hot' };
    if (value >= 60) return { bar: 'bg-semantic-warning', text: 'text-semantic-warning', label: 'Warm' };
    if (value >= 40) return { bar: 'bg-brand-magenta', text: 'text-brand-magenta', label: 'Cooling' };
    return { bar: 'bg-white/30', text: 'text-white/50', label: 'Cold' };
  };

  const { bar, text, label } = getColor(currency);
  const widthClasses = size === 'sm' ? 'w-12' : 'w-20';
  const heightClasses = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      <div className={`${widthClasses} ${heightClasses} rounded-full bg-[#1A1A24] overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${currency}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${text}`}>
        {showLabel ? label : `${currency}`}
      </span>
    </div>
  );
}
