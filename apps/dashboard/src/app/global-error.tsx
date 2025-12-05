/**
 * Global error boundary for root-level errors
 */

'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-xl text-gray-600 mb-4">Something went wrong</p>
            {error.message && (
              <p className="text-sm text-gray-500 mb-8">{error.message}</p>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
