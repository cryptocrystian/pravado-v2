'use client';

import * as Sentry from '@sentry/nextjs';
import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary for Pravado Dashboard (Sprint S79)
 *
 * Captures render errors, logs them to the API, and displays a clean fallback UI.
 * This provides runtime stability for the RC1 release.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Report to Sentry (S-INT-08)
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? undefined } },
    });

    // Log error to API
    this.logErrorToApi(error, errorInfo);

    // Also log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Send error details to the API logging endpoint
   */
  private async logErrorToApi(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // Gate 1A: Use route handler, not direct backend call
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorMessage: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (logError) {
      // Silently fail if logging fails - don't crash the error boundary
      console.error('Failed to log error to API:', logError);
    }
  }

  /**
   * Reset the error state to allow retry
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default branded fallback UI (DS v3.1 dark theme — S-INT-08)
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-0 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-semantic-danger/10 border border-semantic-danger/20 mb-4">
                <svg
                  className="w-8 h-8 text-semantic-danger"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-[24px] font-bold text-white">Something went wrong</h1>
            </div>

            <p className="text-[14px] text-white/50 mb-6 leading-relaxed">
              An unexpected error occurred. Our team has been notified and is looking into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-slate-2 border border-slate-4 rounded-xl p-4">
                <summary className="cursor-pointer text-[13px] font-medium text-white/60">
                  Error Details
                </summary>
                <pre className="mt-2 text-[11px] text-semantic-danger/80 overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white/70 text-[14px] font-medium hover:border-slate-5 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-brand-iris rounded-xl text-white text-[14px] font-medium hover:bg-brand-iris/90 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <p className="mt-8 text-[12px] text-white/30">
              If this problem persists, contact{' '}
              <a href="mailto:support@pravado.com" className="text-brand-iris hover:underline">
                support@pravado.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
