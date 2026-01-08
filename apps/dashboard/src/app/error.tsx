/**
 * Custom error boundary for runtime errors
 * Styled according to Pravado Design System v2
 */

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      {/* Background gradient effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--semantic-danger) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-md text-center">
        <div className="auth-card p-8 space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-semantic-danger/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white-0">Error</h1>
            <p className="text-lg text-muted">Something went wrong</p>
          </div>

          {/* Error Message */}
          {error.message && (
            <div className="alert-error">
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary py-3 px-6"
            >
              Try again
            </button>
            <a
              href="/app/command-center"
              className="btn-secondary py-3 px-6"
            >
              Go to Command Center
            </a>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-6">
            If this problem persists, please contact{' '}
            <a href="mailto:support@pravado.com" className="text-brand-cyan hover:underline">
              support@pravado.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
