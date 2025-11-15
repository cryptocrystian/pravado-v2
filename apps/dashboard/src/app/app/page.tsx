/**
 * Main app dashboard page
 */

import { getCurrentUser } from '@/lib/getCurrentUser';

export default async function AppPage() {
  const session = await getCurrentUser();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600 mb-8">
          Welcome to {session?.activeOrg?.name}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PR Coverage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="text-3xl">📰</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Coming in future sprints</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Content Pieces</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="text-3xl">✍️</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Coming in future sprints</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SEO Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Coming in future sprints</p>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sprint Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Sprint S1 - Foundation
                </span>
                <span className="text-sm font-medium text-green-600">✓ Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <ul className="mt-2 ml-4 text-xs text-gray-600 space-y-1">
                <li>✓ User authentication with Supabase</li>
                <li>✓ Organization management</li>
                <li>✓ Protected routes and middleware</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Sprint S2 - Team Collaboration
                </span>
                <span className="text-sm font-medium text-blue-600">In Progress</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <ul className="mt-2 ml-4 text-xs text-gray-600 space-y-1">
                <li>✓ App shell with sidebar navigation</li>
                <li>✓ Email invite delivery system</li>
                <li>⏳ Team management page</li>
                <li>⏳ Invite acceptance flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
