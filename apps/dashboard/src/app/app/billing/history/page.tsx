/**
 * Billing History Page (Sprint S34)
 * Displays invoice list with ability to view details and download PDFs
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getBillingHistory,
  syncInvoices,
  formatCurrency,
  getInvoiceStatusColor,
  formatInvoicePeriod,
  type BillingHistorySummary,
} from '@/lib/billingApi';

export default function BillingHistoryPage() {
  const [summary, setSummary] = useState<BillingHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load billing history
  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBillingHistory();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load billing history:', err);
      setError(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual invoice sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await syncInvoices();

      if (result.success) {
        alert(result.data?.message || 'Invoices synced successfully');
        // Reload billing history
        await loadBillingHistory();
      } else {
        alert(result.error?.message || 'Failed to sync invoices');
      }
    } catch (error) {
      console.error('Failed to sync invoices:', error);
      alert('Failed to sync invoices. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Sort invoices
  const sortedInvoices = React.useMemo(() => {
    if (!summary?.last12Invoices) return [];

    const sorted = [...summary.last12Invoices];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime();
          break;
        case 'amount':
          comparison = a.amountDue - b.amountDue;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [summary, sortField, sortDirection]);

  // Toggle sort
  const toggleSort = (field: 'date' | 'amount' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get status badge styles
  const getStatusBadgeClass = (status: string) => {
    const color = getInvoiceStatusColor(status);
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';

    switch (color) {
      case 'green':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'yellow':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'red':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading billing history...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !summary) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load billing history'}
        </div>
        <button
          onClick={loadBillingHistory}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing History</h1>
          <p className="text-gray-600">View past invoices and payment history</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/billing"
            className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Billing
          </Link>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Invoices'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Total Paid (12 Months)</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.totalPaid12Mo)}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Average Monthly Cost</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.averageMonthlyCost)}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Highest Invoice</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.highestInvoice)}
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('date')}
                >
                  Invoice Period {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('amount')}
                >
                  Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('status')}
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No invoices found. Invoices will appear here once billing begins.
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatInvoicePeriod(invoice.periodStart, invoice.periodEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.invoiceNumber || 'Draft'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amountDue)}
                      {summary.overageCostsPerInvoice[invoice.stripeInvoiceId] && (
                        <span className="ml-2 text-xs text-orange-600">
                          (+{formatCurrency(summary.overageCostsPerInvoice[invoice.stripeInvoiceId])} overage)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/app/billing/invoice/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download PDF
                          </a>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View on Stripe
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State Message */}
      {sortedInvoices.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            You don't have any invoices yet. They will appear here once you start a paid subscription.
          </p>
          <Link
            href="/app/billing"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
