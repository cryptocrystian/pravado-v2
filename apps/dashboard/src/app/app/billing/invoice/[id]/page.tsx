/**
 * Invoice Details Page (Sprint S34)
 * Displays detailed invoice breakdown with line items, usage snapshot, and alerts
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getInvoiceDetails,
  formatCurrency,
  getInvoiceStatusColor,
  formatInvoicePeriod,
  type InvoiceDetails,
  type InvoiceLineItem,
} from '@/lib/billingApi';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load invoice details
  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails();
    }
  }, [invoiceId]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvoiceDetails(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      console.error('Failed to load invoice details:', err);
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge styles
  const getStatusBadgeClass = (status: string) => {
    const color = getInvoiceStatusColor(status);
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';

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

  // Get line item type badge
  const getLineItemTypeBadge = (type: InvoiceLineItem['type']) => {
    const badges: Record<InvoiceLineItem['type'], { label: string; class: string }> = {
      plan: { label: 'Plan', class: 'bg-blue-100 text-blue-800' },
      overage: { label: 'Overage', class: 'bg-orange-100 text-orange-800' },
      discount: { label: 'Discount', class: 'bg-green-100 text-green-800' },
      proration: { label: 'Proration', class: 'bg-purple-100 text-purple-800' },
      tax: { label: 'Tax', class: 'bg-gray-100 text-gray-800' },
      other: { label: 'Other', class: 'bg-gray-100 text-gray-800' },
    };

    const badge = badges[type];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !invoice) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Invoice not found'}
        </div>
        <Link
          href="/app/billing/history"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Billing History
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Invoice {invoice.invoice.invoiceNumber || 'Draft'}
            </h1>
            <p className="text-gray-600">
              {formatInvoicePeriod(invoice.invoice.periodStart, invoice.invoice.periodEnd)}
            </p>
          </div>
          <Link
            href="/app/billing/history"
            className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>

      {/* Invoice Summary Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Invoice Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Status</div>
              <div className="mt-1">
                <span className={getStatusBadgeClass(invoice.invoice.status)}>
                  {invoice.invoice.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">Billing Period</div>
              <div className="mt-1 text-gray-900">
                {formatInvoicePeriod(invoice.invoice.periodStart, invoice.invoice.periodEnd)}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">Invoice ID</div>
              <div className="mt-1 text-gray-900 font-mono text-sm">
                {invoice.invoice.stripeInvoiceId}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">
                {formatCurrency(invoice.breakdown.total)}
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              {invoice.invoice.invoicePdf && (
                <a
                  href={invoice.invoice.invoicePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Download PDF
                </a>
              )}
              {invoice.invoice.hostedInvoiceUrl && (
                <a
                  href={invoice.invoice.hostedInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View on Stripe
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">Plan Charges</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoice.breakdown.planCost)}</span>
          </div>

          {invoice.breakdown.tokenOverages > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Token Overages</span>
              <span className="font-medium text-orange-600">+{formatCurrency(invoice.breakdown.tokenOverages)}</span>
            </div>
          )}

          {invoice.breakdown.runOverages > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Playbook Run Overages</span>
              <span className="font-medium text-orange-600">+{formatCurrency(invoice.breakdown.runOverages)}</span>
            </div>
          )}

          {invoice.breakdown.prorations !== 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Prorations</span>
              <span className={`font-medium ${invoice.breakdown.prorations > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                {invoice.breakdown.prorations > 0 ? '+' : ''}{formatCurrency(invoice.breakdown.prorations)}
              </span>
            </div>
          )}

          {invoice.breakdown.discounts > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Discounts</span>
              <span className="font-medium text-green-600">-{formatCurrency(invoice.breakdown.discounts)}</span>
            </div>
          )}

          {invoice.breakdown.tax > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Tax</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.breakdown.tax)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.breakdown.total)}</span>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Line Items</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.lineItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm">{getLineItemTypeBadge(item.type)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">
                    {item.quantity !== null ? item.quantity.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Snapshot */}
      {invoice.usageSnapshot && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Usage During This Period</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">LLM Tokens</div>
              <div className="text-2xl font-bold text-gray-900">
                {invoice.usageSnapshot.tokens.toLocaleString()}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Playbook Runs</div>
              <div className="text-2xl font-bold text-gray-900">
                {invoice.usageSnapshot.playbookRuns.toLocaleString()}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Team Seats Used</div>
              <div className="text-2xl font-bold text-gray-900">
                {invoice.usageSnapshot.seats}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Alerts */}
      {invoice.relatedAlerts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Related Alerts</h2>

          <div className="space-y-3">
            {invoice.relatedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase ml-4">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
