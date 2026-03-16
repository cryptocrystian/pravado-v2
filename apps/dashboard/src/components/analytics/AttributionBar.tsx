'use client';

/**
 * AttributionBar — What drove your growth?
 * Shows empty state until SAGE has tracked enough visibility changes.
 */

export function AttributionBar() {
  // No real attribution data available yet — show guidance message
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">
        What drove your growth?
      </h3>
      <p className="text-sm text-white/50 leading-relaxed">
        Attribution data will appear once SAGE has tracked enough visibility changes to identify growth drivers.
      </p>
    </div>
  );
}
