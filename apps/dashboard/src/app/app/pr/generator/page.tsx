/**
 * PR Generator Page (Sprint S99.2)
 * Server Component - fetches initial data via prDataServer
 */

import { fetchPressReleases } from '@/server/prDataServer';
import GeneratorClient from './GeneratorClient';

export default async function PRGeneratorPage() {
  try {
    const data = await fetchPressReleases({ limit: 20 });

    return <GeneratorClient initialReleases={data.releases} />;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for auth errors
    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800">Authentication Required</h2>
            <p className="text-red-700 mt-2">
              You must be logged in to use the press release generator. Please sign in to continue.
            </p>
            <a
              href="/login"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign In
            </a>
          </div>
        </div>
      );
    }

    // Generic error
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800">Error Loading Data</h2>
          <p className="text-red-700 mt-2">{message}</p>
          <p className="text-red-600 mt-2 text-sm">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }
}
