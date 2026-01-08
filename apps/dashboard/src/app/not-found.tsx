/**
 * Custom 404 Not Found page
 * Styled according to Pravado Design System v2
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      {/* Background gradient effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--brand-iris) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-md text-center">
        <div className="auth-card p-8 space-y-6">
          {/* 404 Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-brand-iris/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* 404 Title */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gradient-hero">404</h1>
            <p className="text-lg text-white-0">Page not found</p>
            <p className="text-sm text-muted">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/app/command-center"
              className="btn-primary py-3 px-6 w-full"
            >
              Go to Command Center
            </Link>
            <Link
              href="/login"
              className="btn-secondary py-3 px-6 w-full"
            >
              Sign In
            </Link>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-6">
            Need help?{' '}
            <a href="mailto:support@pravado.com" className="text-brand-cyan hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
