/**
 * PR Deliverability Client Component (Sprint S100)
 * Client-side UI for email deliverability analytics
 *
 * INVARIANT: This component does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * S100: Types defined locally to avoid ANY dependency on prDataServer
 */
interface DeliverabilitySummary {
  totalMessages: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface EmailMessage {
  id: string;
  subject: string;
  sendStatus: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
}

interface JournalistEngagement {
  id: string;
  journalist: {
    name: string;
    email: string;
  };
  engagementScore: number;
  openRate: number;
  clickRate: number;
  totalSent: number;
}

interface DeliverabilityClientProps {
  initialSummary: DeliverabilitySummary;
  initialMessages: EmailMessage[];
  initialMessagesTotal: number;
  initialTopEngaged: JournalistEngagement[];
}

export default function DeliverabilityClient({
  initialSummary,
  initialMessages,
  initialMessagesTotal,
  initialTopEngaged,
}: DeliverabilityClientProps) {
  const [summary, setSummary] = useState<DeliverabilitySummary>(initialSummary);
  const [messages, setMessages] = useState<EmailMessage[]>(initialMessages);
  const [messagesTotal, setMessagesTotal] = useState(initialMessagesTotal);
  const [topEngaged, setTopEngaged] = useState<JournalistEngagement[]>(initialTopEngaged);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'engagement'>('overview');
  const [isInitialLoading, setIsInitialLoading] = useState(initialMessages.length === 0);

  const loadData = async () => {
    try {
      setError(null);

      const [summaryRes, messagesRes, topEngagedRes] = await Promise.all([
        fetch('/api/pr/deliverability/summary'),
        fetch('/api/pr/deliverability/messages?limit=20'),
        fetch('/api/pr/deliverability/top-engaged?limit=10'),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
        setMessagesTotal(data.total || 0);
      }
      if (topEngagedRes.ok) {
        setTopEngaged(await topEngagedRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // S100: Load data on mount via route handlers
  useEffect(() => {
    if (initialMessages.length === 0) {
      loadData();
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Deliverability & Engagement</h1>
        <p className="text-gray-600">Track email delivery, opens, clicks, and journalist engagement</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deliverability data...</p>
          </div>
        </div>
      )}

      {/* Tab Navigation and Content */}
      {!isInitialLoading && (
      <>
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
            Top Engaged
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
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
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Email Messages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((message) => (
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
            Showing {messages.length} of {messagesTotal} messages
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Engaged Journalists</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journalist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sent</th>
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
      )}
      </>
      )}
    </div>
  );
}
