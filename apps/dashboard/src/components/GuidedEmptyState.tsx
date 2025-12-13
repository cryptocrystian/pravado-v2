/**
 * Guided Empty State Component (Sprint S98)
 * Shows contextual guidance for production organizations with no data
 */

'use client';

import Link from 'next/link';

interface GuidedEmptyStateProps {
  title: string;
  description: string;
  steps?: string[];
  ctaLabel: string;
  ctaHref: string;
  icon?: React.ReactNode;
  showDemoBanner?: boolean;
}

export function GuidedEmptyState({
  title,
  description,
  steps,
  ctaLabel,
  ctaHref,
  icon,
  showDemoBanner = false,
}: GuidedEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Demo Banner */}
      {showDemoBanner && (
        <div className="mb-8 px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg">
          <p className="text-sm text-brand-cyan flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Switch to the Demo Organization to see sample data
          </p>
        </div>
      )}

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-slate-3/50 flex items-center justify-center mb-6">
        {icon || (
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2 text-center">{title}</h2>

      {/* Description */}
      <p className="text-slate-400 text-center max-w-md mb-8">{description}</p>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <div className="bg-slate-3/30 rounded-xl p-6 mb-8 max-w-md w-full">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Getting Started:</h3>
          <ul className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="w-5 h-5 rounded-full bg-brand-iris/20 text-brand-iris flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA Button */}
      <Link
        href={ctaHref}
        className="px-6 py-3 bg-brand-iris text-white rounded-lg hover:bg-brand-iris/80 transition-colors flex items-center gap-2 font-medium"
      >
        {ctaLabel}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}

/**
 * Demo Data Banner Component
 * Shows when viewing demo org data
 */
export function DemoDataBanner() {
  return (
    <div className="bg-brand-cyan/10 border-b border-brand-cyan/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-brand-cyan">
          You&apos;re viewing <span className="font-medium">demo data</span>. Create your own organization to start using Pravado for real.
        </p>
      </div>
    </div>
  );
}

/**
 * Simple Empty State for inline use
 */
export function SimpleEmptyState({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-3/50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-slate-400 mb-4">{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-iris/10 text-brand-iris rounded-lg hover:bg-brand-iris/20 transition-colors text-sm"
        >
          {action}
        </button>
      )}
    </div>
  );
}
