/**
 * Auth callback page - handles redirects after authentication
 * Supports: Google OAuth, Microsoft OAuth, Magic Link, Error states
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Map error codes to user-friendly messages
const getErrorMessage = (error: string | null, errorDescription: string | null): string => {
  if (!error) return 'An unexpected error occurred';

  const normalizedError = error.toLowerCase();
  const normalizedDesc = (errorDescription || '').toLowerCase();

  // Expired OTP / Magic Link
  if (normalizedError.includes('otp_expired') || normalizedDesc.includes('expired')) {
    return 'Your sign-in link has expired. Please request a new one.';
  }

  // Invalid token
  if (normalizedError.includes('invalid_token') || normalizedDesc.includes('invalid')) {
    return 'The sign-in link is invalid. Please request a new one.';
  }

  // Access denied
  if (normalizedError.includes('access_denied')) {
    return 'Access was denied. Please try again or use a different sign-in method.';
  }

  // Provider mismatch
  if (normalizedDesc.includes('provider') || normalizedDesc.includes('mismatch')) {
    return 'There was a mismatch with your sign-in provider. Please try again.';
  }

  // Generic error with description
  if (errorDescription) {
    return errorDescription.replace(/_/g, ' ').replace(/\+/g, ' ');
  }

  return 'Authentication failed. Please try again.';
};

// AI Presence Dot component
const AIPresenceDot = ({ status }: { status: 'idle' | 'analyzing' | 'generating' }) => {
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
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
        // Get session from Supabase (handles OAuth and Magic Link)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          // No session yet - might be waiting for OAuth callback to complete
          // Try to exchange the auth code if present
          const { data: { session: exchangedSession }, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);

          if (exchangeError || !exchangedSession) {
            setErrorMessage('No active session found. Please sign in again.');
            setStatus('error');
            return;
          }

          // Session established via code exchange
          await createBackendSession(exchangedSession.access_token);
          await redirectBasedOnOrgs();
          return;
        }

        // Session exists - create backend session
        await createBackendSession(session.access_token);
        await redirectBasedOnOrgs();
      } catch (err) {
        console.error('Callback error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to complete authentication');
        setStatus('error');
      }
    };

    const createBackendSession = async (accessToken: string) => {
      const response = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }
    };

    const redirectBasedOnOrgs = async () => {
      // Fetch user's orgs to determine redirect
      try {
        const response = await fetch('/api/v1/orgs', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const orgs = data.data?.items || [];

          if (orgs.length > 0) {
            setStatus('success');
            router.push('/app');
          } else {
            setStatus('success');
            router.push('/onboarding');
          }
        } else {
          // If we can't fetch orgs, redirect to onboarding
          setStatus('success');
          router.push('/onboarding');
        }
      } catch {
        // Default to onboarding on error
        setStatus('success');
        router.push('/onboarding');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  // Error state UI
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
        {/* Background gradient effect */}
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, var(--brand-iris) 0%, transparent 50%)',
          }}
        />

        <div className="relative w-full max-w-md">
          <div className="auth-card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
              </div>
              <h1 className="text-xl font-semibold text-white">
                Authentication Error
              </h1>
            </div>

            {/* Error Alert */}
            <div className="alert-error">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
              <a href="mailto:support@pravado.com" className="text-brand-cyan hover:underline">
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
          background: 'radial-gradient(ellipse at 50% 0%, var(--brand-iris) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="auth-card p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
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
              Authenticating via {searchParams?.get('provider') || 'your provider'}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
