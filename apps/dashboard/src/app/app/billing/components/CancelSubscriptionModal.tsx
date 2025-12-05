/**
 * Cancel Subscription Modal Component (Sprint S33.2)
 * Confirmation dialog for subscription cancellation
 */

'use client';

import React, { useState } from 'react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (immediate: boolean) => Promise<void>;
  renewalDate?: string;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  renewalDate
}: CancelSubscriptionModalProps) {
  const [immediate, setImmediate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(immediate);
      onClose();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Subscription
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Are you sure you want to cancel?
                  </h4>
                  <p className="text-sm text-red-700">
                    {immediate
                      ? 'You will lose access to all features immediately.'
                      : renewalDate
                      ? `You will lose access to all features after ${formatDate(renewalDate)}.`
                      : 'You will lose access to all features at the end of your billing period.'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Once cancelled, you can resume your subscription anytime before it expires.
            </p>
          </div>

          {/* Cancellation Options */}
          <div className="mb-6 space-y-3">
            <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="cancelType"
                checked={!immediate}
                onChange={() => setImmediate(false)}
                className="mt-1 mr-3"
                disabled={isLoading}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Cancel at period end (Recommended)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {renewalDate
                    ? `Keep access until ${formatDate(renewalDate)}`
                    : 'Keep access until the end of your billing period'}
                </p>
              </div>
            </label>

            <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="cancelType"
                checked={immediate}
                onChange={() => setImmediate(true)}
                className="mt-1 mr-3"
                disabled={isLoading}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Cancel immediately
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Lose access right away (no refunds)
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-md font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keep Subscription
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
