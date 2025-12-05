'use client';

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      await fetch(`${apiUrl}/api/v1/logs/client`, {
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

      // Default branded fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {/* Pravado Logo/Brand */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. An unexpected error has occurred.
              Our team has been notified.
            </p>

            {/* Error Details (collapsed by default in production) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Support Link */}
            <p className="mt-8 text-sm text-gray-500">
              If this problem persists, please contact{' '}
              <a href="mailto:support@pravado.com" className="text-blue-600 hover:underline">
                support@pravado.com
              </a>
            </p>

            {/* Version Info */}
            <p className="mt-4 text-xs text-gray-400">
              Pravado v1.0.0-rc1
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
