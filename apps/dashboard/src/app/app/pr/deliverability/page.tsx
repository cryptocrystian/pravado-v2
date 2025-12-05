'use client';

/**
 * PR Outreach Deliverability Dashboard (Sprint S45)
 * Main page for email deliverability and engagement analytics
 */

import { useEffect, useState } from 'react';
import type {
  DeliverabilitySummary,
  EmailMessageListResponse,
  EngagementMetricsListResponse,
  JournalistEngagement,
} from '@pravado/types';
import {
  getDeliverabilitySummary,
  listEmailMessages,
  listEngagementMetrics,
  getTopEngagedJournalists,
} from '../../../../lib/prOutreachDeliverabilityApi';

export default function DeliverabilityPage() {
  const [summary, setSummary] = useState<DeliverabilitySummary | null>(null);
  const [messages, setMessages] = useState<EmailMessageListResponse | null>(null);
  const [metrics, setMetrics] = useState<EngagementMetricsListResponse | null>(null);
  const [topEngaged, setTopEngaged] = useState<JournalistEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'engagement'>('overview');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, messagesData, metricsData, topEngagedData] = await Promise.all([
        getDeliverabilitySummary(),
        listEmailMessages({ limit: 20, offset: 0 }),
        listEngagementMetrics({ limit: 20, offset: 0 }),
        getTopEngagedJournalists(10),
      ]);

      setSummary(summaryData);
      setMessages(messagesData);
      setMetrics(metricsData);
      setTopEngaged(topEngagedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliverability data');
      console.error('Error loading deliverability data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading deliverability data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Deliverability & Engagement</h1>
        <p className="text-gray-600">Track email delivery, opens, clicks, and journalist engagement</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Email Messages
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'engagement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Engagement Metrics
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Total Messages</div>
              <div className="mt-2 text-3xl font-bold">{summary.totalMessages}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Delivery Rate</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {(summary.deliveryRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Open Rate</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {(summary.openRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600">Click Rate</div>
              <div className="mt-2 text-3xl font-bold text-purple-600">
                {(summary.clickRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Detailed Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Sent</div>
                  <div className="text-2xl font-semibold">{summary.totalSent}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Delivered</div>
                  <div className="text-2xl font-semibold text-green-600">{summary.totalDelivered}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Opened</div>
                  <div className="text-2xl font-semibold text-blue-600">{summary.totalOpened}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Clicked</div>
                  <div className="text-2xl font-semibold text-purple-600">{summary.totalClicked}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bounced</div>
                  <div className="text-2xl font-semibold text-orange-600">{summary.totalBounced}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Complained</div>
                  <div className="text-2xl font-semibold text-red-600">{summary.totalComplained}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="text-2xl font-semibold text-gray-600">{summary.totalFailed}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bounce Rate</div>
                  <div className="text-2xl font-semibold text-orange-600">
                    {(summary.bounceRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Engaged Journalists */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Top Engaged Journalists</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journalist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Click Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topEngaged.map((engagement) => (
                    <tr key={engagement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{engagement.journalist.name}</div>
                        <div className="text-sm text-gray-500">{engagement.journalist.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">
                          {(engagement.engagementScore * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(engagement.openRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(engagement.clickRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {engagement.totalSent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Email Messages Tab */}
      {activeTab === 'messages' && messages && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Email Messages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicked
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{message.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          message.sendStatus === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : message.sendStatus === 'bounced'
                              ? 'bg-orange-100 text-orange-800'
                              : message.sendStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : message.sendStatus === 'complained'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.sendStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.sentAt ? new Date(message.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.openedAt ? new Date(message.openedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.clickedAt ? new Date(message.clickedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
            Showing {messages.messages.length} of {messages.total} messages
          </div>
        </div>
      )}

      {/* Engagement Metrics Tab */}
      {activeTab === 'engagement' && metrics && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Journalist Engagement Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journalist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bounced
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{metric.journalist.name}</div>
                      <div className="text-sm text-gray-500">{metric.journalist.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">
                        {(metric.engagementScore * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalSent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalOpened} ({(metric.openRate * 100).toFixed(0)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalClicked} ({(metric.clickRate * 100).toFixed(0)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalReplied} ({(metric.replyRate * 100).toFixed(0)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalBounced} ({(metric.bounceRate * 100).toFixed(0)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
            Showing {metrics.metrics.length} of {metrics.total} journalists
          </div>
        </div>
      )}
    </div>
  );
}
