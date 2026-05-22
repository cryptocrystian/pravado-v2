/**
 * Auth callback page - handles redirects after authentication
 * Supports: Google OAuth, Microsoft OAuth, Magic Link, Error states
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PravadoLogo } from '@/components/brand/PravadoLogo';
import { supabase } from '@/lib/supabaseClient';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Map error codes to user-friendly messages
const getErrorMessage = (
  error: string | null,
  errorDescription: string | null
): string => {
  // Log raw error for debugging
  console.log('[Callback] Raw error:', error);
  console.log('[Callback] Raw error_description:', errorDescription);

  if (!error) return 'An unexpected error occurred';

  const normalizedError = error.toLowerCase();
  const normalizedDesc = (errorDescription || '').toLowerCase();

  // Expired OTP / Magic Link
  if (
    normalizedError.includes('otp_expired') ||
    normalizedDesc.includes('expired')
  ) {
    return 'Your sign-in link has expired. Please request a new one.';
  }

  // Invalid token
  if (
    normalizedError.includes('invalid_token') ||
    normalizedDesc.includes('invalid')
  ) {
    return 'The sign-in link is invalid. Please request a new one.';
  }

  // Access denied
  if (normalizedError.includes('access_denied')) {
    return 'Access was denied. Please try again or use a different sign-in method.';
  }

  // Provider mismatch - show actual error for debugging
  if (
    normalizedDesc.includes('provider') ||
    normalizedDesc.includes('mismatch')
  ) {
    const rawError =
      errorDescription?.replace(/_/g, ' ').replace(/\+/g, ' ') ||
      'Provider mismatch';
    return `Provider error: ${rawError}`;
  }

  // Generic error with description
  if (errorDescription) {
    return errorDescription.replace(/_/g, ' ').replace(/\+/g, ' ');
  }

  return 'Authentication failed. Please try again.';
};

// AI Presence Dot component
const AIPresenceDot = ({
  status,
}: {
  status: 'idle' | 'analyzing' | 'generating';
}) => {
  const statusClasses = {
    idle: 'bg-slate-6',
    analyzing: 'bg-brand-cyan animate-ai-pulse',
    generating: 'bg-brand-iris',
  };

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${statusClasses[status]}`}
      aria-label={`AI ${status}`}
    />
  );
};

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout — if auth doesn't resolve in 12 seconds, redirect to login
    const safetyTimer = setTimeout(() => {
      if (status === 'loading') {
        window.location.href = '/login?reason=auth_timeout';
      }
    }, 12000);

    const handleCallback = async () => {
      // Check for error parameters in URL
      const error = searchParams?.get('error') ?? null;
      const errorDescription = searchParams?.get('error_description') ?? null;

      if (error) {
        setErrorMessage(getErrorMessage(error, errorDescription));
        setStatus('error');
        return;
      }

      try {
        // Handle email confirmation via token_hash (new account signup / magic link)
        const tokenHash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');

        if (tokenHash) {
          const { data: otpData, error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: (type as 'signup' | 'magiclink' | 'recovery') || 'signup',
            });

          if (verifyError) {
            setErrorMessage(`Verification failed: ${verifyError.message}`);
            setStatus('error');
            return;
          }

          if (otpData.session) {
            // Magic-link / new-account-signup convergence point.
            // Must route through the same server-authoritative org check
            // as the OAuth path below (handleCallback's fall-through to
            // redirectBasedOnOrgs at line ~164). Without this, new users
            // (no org_members row) land in /app/command-center where the
            // panes crash on NO_ORG and Chrome's renderer freezes.
            // See docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md §1.
            console.log('[Callback] OTP verified — routing via org check');
            await redirectBasedOnOrgs();
            return;
          }
        }

        // First, try to get existing session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        let session = initialSession;

        if (sessionError) {
          console.error('getSession error:', sessionError);
        }

        // If no session, try to exchange the auth code (for OAuth flows)
        if (!session) {
          // Check if there's a code in the URL hash or search params
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const urlParams = new URLSearchParams(window.location.search);
          const hasAuthCode =
            hashParams.get('access_token') || urlParams.get('code');

          if (hasAuthCode) {
            // For PKCE flow, exchange code for session
            const { data, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(window.location.href);

            if (exchangeError) {
              console.error('Code exchange error:', exchangeError);
              // Don't fail immediately - the session might already be set
            } else if (data?.session) {
              session = data.session;
            }
          }

          // If still no session, try getSession again (session might have been set by auth state change)
          if (!session) {
            const retryResult = await supabase.auth.getSession();
            session = retryResult.data.session;
          }
        }

        if (!session) {
          setErrorMessage('No active session found. Please sign in again.');
          setStatus('error');
          return;
        }

        // Session established - determine where to redirect
        await redirectBasedOnOrgs();
      } catch (err) {
        console.error('Callback error:', err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to complete authentication'
        );
        setStatus('error');
      }
    };

    const redirectBasedOnOrgs = async () => {
      // Shared convergence target for BOTH callback paths:
      //   - Magic-link / new-account-signup (token_hash branch above)
      //   - OAuth / existing-session (getSession fall-through below)
      // Both paths must end here so the server-authoritative org check runs
      // exactly once per callback, regardless of which auth method was used.

      // Fire-and-forget welcome email for new users (backend handles idempotency)
      fetch('/api/auth/welcome-email', { method: 'POST' }).catch(() => {});

      // Phase 0 Track 0A: server-authoritative org check.
      // The client cannot read org_members directly (RLS), so we ask the
      // server which path this user should take. New users (no org_members
      // row) land on /onboarding/ai-intro; existing users on /app/command-center.
      // See docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md.
      try {
        const checkRes = await fetch('/api/auth/session-check', {
          credentials: 'include',
        });
        const checkBody = (await checkRes.json().catch(() => null)) as {
          hasOrg?: boolean;
          redirectTo?: string;
        } | null;

        const redirectTo = checkBody?.redirectTo ?? '/onboarding/ai-intro';
        console.log('[Callback] session-check →', {
          status: checkRes.status,
          hasOrg: checkBody?.hasOrg,
          redirectTo,
        });

        setStatus('success');
        // Full page navigation is more reliable than router.push for cross-shell hops
        window.location.href = redirectTo;
      } catch (err) {
        console.error('[Callback] session-check failed:', err);
        // Fail-safe: send to onboarding rather than the crash-prone command center
        setStatus('success');
        window.location.href = '/onboarding/ai-intro';
      }
    };

    handleCallback();

    return () => clearTimeout(safetyTimer);
  }, [searchParams, router]);

  // Error state UI
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
        {/* Background gradient effect */}
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, var(--brand-iris) 0%, transparent 50%)',
          }}
        />

        <div className="relative w-full max-w-md">
          <div className="auth-card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <PravadoLogo iconSize={36} fontSize="22px" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Authentication Error
              </h1>
            </div>

            {/* Error Alert */}
            <div className="alert-error">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Sign-in failed</p>
                  <p className="text-sm mt-1 opacity-90">{errorMessage}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="btn-primary w-full py-3"
              >
                Back to Sign In
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary w-full py-3"
              >
                Try Again
              </button>
            </div>

            {/* Help text */}
            <p className="text-center text-xs text-muted">
              If this problem persists, please contact{' '}
              <a
                href="mailto:support@pravado.com"
                className="text-brand-cyan hover:underline"
              >
                support@pravado.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
      {/* Background gradient effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, var(--brand-iris) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="auth-card p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PravadoLogo iconSize={36} fontSize="22px" />
              <AIPresenceDot status="analyzing" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Completing sign-in...
            </h1>
            <p className="text-sm text-muted">
              Please wait while we verify your authentication
            </p>
          </div>

          {/* Loading indicator */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-5 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-cyan rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-xs text-slate-6">
              Authenticating via{' '}
              {searchParams?.get('provider') || 'your provider'}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
