'use client';

/**
 * Client component for accepting org invites
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface InviteAcceptClientProps {
  token: string;
}

type InviteStatus = 'loading' | 'accepting' | 'success' | 'error' | 'expired' | 'not_found';

export function InviteAcceptClient({ token }: InviteAcceptClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const acceptInvite = useCallback(async () => {
    setStatus('accepting');
    setError(null);

    try {
      // First, we need to find which org this invite belongs to
      // We'll need to query the API to get invite details
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setOrgName(data.data?.org?.name || 'the organization');

        // Redirect to app after 2 seconds
        setTimeout(() => {
          router.push('/app');
        }, 2000);
      } else {
        if (data.error?.code === 'INVITE_EXPIRED') {
          setStatus('expired');
        } else if (data.error?.code === 'INVITE_NOT_FOUND') {
          setStatus('not_found');
        } else {
          setStatus('error');
          setError(data.error?.message || 'Failed to accept invitation');
        }
      }
    } catch (err) {
      setStatus('error');
      setError('An error occurred while accepting the invitation');
    }
  }, [token, router]);

  useEffect(() => {
    acceptInvite();
  }, [acceptInvite]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {status === 'loading' || status === 'accepting' ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Invitation
              </h2>
              <p className="text-gray-600">
                Please wait while we accept your invitation...
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to {orgName}!
              </h2>
              <p className="text-gray-600 mb-4">
                You have successfully joined the organization.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          ) : status === 'expired' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invitation Expired
              </h2>
              <p className="text-gray-600 mb-4">
                This invitation has expired. Please contact the organization admin to send you a new invitation.
              </p>
              <button
                onClick={() => router.push('/app')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : status === 'not_found' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Invitation
              </h2>
              <p className="text-gray-600 mb-4">
                This invitation link is invalid or has already been accepted.
              </p>
              <button
                onClick={() => router.push('/app')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error
              </h2>
              <p className="text-gray-600 mb-4">{error || 'An error occurred'}</p>
              <button
                onClick={() => acceptInvite()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/app')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
