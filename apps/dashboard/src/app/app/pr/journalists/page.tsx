/**
 * Journalist Intelligence Dashboard (Sprint S99.2)
 * Server Component - fetches data via canonical prDataServer
 */

import { fetchJournalistProfiles } from '@/server/prDataServer';
import JournalistsClient from './JournalistsClient';

export default async function JournalistsPage() {
  try {
    const data = await fetchJournalistProfiles({
      sortBy: 'engagement_score',
      sortOrder: 'desc',
      limit: 50,
    });

    return (
      <JournalistsClient
        initialProfiles={data.profiles}
        initialTotal={data.total}
      />
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for auth errors specifically
    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800">Authentication Required</h2>
            <p className="text-red-700 mt-2">
              You must be logged in to view journalist data. Please sign in to continue.
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
