/**
 * Content Intelligence pillar page (S3 placeholder)
 */

import type { ListContentItemsResponse } from '@pravado/types';

import { getCurrentUser } from '@/lib/getCurrentUser';

async function getContentItems() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/content/items', {
      cache: 'no-store',
    });
    const data: ListContentItemsResponse = await response.json();
    return data.success ? data.data?.items : [];
  } catch (error) {
    console.error('Failed to fetch content items:', error);
    return [];
  }
}

export default async function ContentPage() {
  await getCurrentUser();
  const items = await getContentItems();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Intelligence</h2>
          <p className="text-gray-600">
            AI-powered content planning, creation, and performance optimization
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">✍️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Content Intelligence - Coming Soon
              </h3>
              <p className="text-purple-800 mb-4">
                Sprint S3 establishes the foundation. Full content features launching in Sprint S4+
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📅 Content Calendar</h4>
                  <p className="text-sm text-gray-600">
                    AI-generated content calendars with optimal publishing schedules
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📝 Brief Generator</h4>
                  <p className="text-sm text-gray-600">
                    Automated content brief creation with SEO research and structure
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📈 Performance Tracking</h4>
                  <p className="text-sm text-gray-600">
                    Track content performance across all channels and platforms
                  </p>
                </div>
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🎯 Topic Clustering</h4>
                  <p className="text-sm text-gray-600">
                    AI-powered topic analysis and content gap identification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Model Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Foundation - Ready
          </h3>
          <p className="text-gray-600 mb-4">
            The following data models are now available in the database:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Content Items</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Content Briefs</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Content Topics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Tags & Assignments</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>API Ready:</strong> GET /api/v1/content/items | GET /api/v1/content/briefs
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Current items: {items?.length || 0} (populated in future sprints)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
