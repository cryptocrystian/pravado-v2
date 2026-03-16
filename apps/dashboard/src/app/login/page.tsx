/**
 * Login/Signup page with Supabase Auth
 * Styled according to Pravado Design System v3 (AI-Native Command Center)
 * Canonical source: docs/canon/DS_v3_1_EXPRESSION.md
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// SVG Icons for OAuth providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 11.4H2V2h9.4v9.4z" fill="#F25022"/>
    <path d="M22 11.4h-9.4V2H22v9.4z" fill="#7FBA00"/>
    <path d="M11.4 22H2v-9.4h9.4V22z" fill="#00A4EF"/>
    <path d="M22 22h-9.4v-9.4H22V22z" fill="#FFB900"/>
  </svg>
);

// AI Presence Dot component (DS v3: cyber-blue for analyzing, electric-purple for generating)
const AIPresenceDot = ({ status }: { status: 'idle' | 'analyzing' | 'generating' }) => {
  // DS v3 colors: cyber-blue (#00D9FF) for analyzing, electric-purple (#A855F7) for generating
  const statusStyles: Record<string, React.CSSProperties> = {
    idle: { backgroundColor: '#3D3D4A' }, // --slate-6
    analyzing: { backgroundColor: '#00D9FF' }, // --cyber-blue
    generating: { backgroundColor: '#A855F7' }, // --electric-purple
  };

  return (
    <span
      className={`w-2 h-2 rounded-full ${status === 'analyzing' ? 'animate-ai-pulse' : ''}`}
      style={statusStyles[status]}
      aria-label={`AI ${status}`}
    />
  );
};

// Get the correct redirect URL based on environment
// OAuth uses /auth/callback (server-side route handler for reliable PKCE exchange)
// Magic links use /callback (client-side page)
const getRedirectUrl = (type: 'oauth' | 'magic_link' = 'oauth') => {
  const path = type === 'oauth' ? '/auth/callback' : '/callback';

  if (typeof window === 'undefined') {
    return `https://pravado-dashboard.vercel.app${path}`;
  }

  const isProduction = window.location.hostname === 'pravado-dashboard.vercel.app'
    || window.location.hostname.includes('vercel.app');

  if (isProduction) {
    return `https://pravado-dashboard.vercel.app${path}`;
  }

  return `${window.location.origin}${path}`;
};

// Beta invite gating — when true, signup requires a valid invite code
const BETA_INVITE_REQUIRED = process.env.NEXT_PUBLIC_BETA_INVITE_REQUIRED === 'true';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteValidated, setInviteValidated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Session expired detection (S-INT-10)
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('reason') === 'session_expired') {
      setMessage('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  // MFA challenge state (S-INT-10)
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaAttempts, setMfaAttempts] = useState(0);
  const [mfaLocked, setMfaLocked] = useState(false);

  // Check MFA enrollment after login
  const checkAndHandleMFA = async (): Promise<boolean> => {
    const { data, error: mfaErr } = await supabase.auth.mfa.listFactors();
    if (mfaErr || !data) return false;

    const verifiedFactors = (data.totp ?? []).filter(
      (f: { status: string }) => f.status === 'verified'
    );

    if (verifiedFactors.length > 0) {
      setMfaFactorId(verifiedFactors[0].id);
      setMfaRequired(true);
      return true;
    }
    return false;
  };

  // Handle MFA verification
  const handleMFAVerify = async () => {
    if (mfaCode.length !== 6) {
      setError('Enter a 6-digit code');
      return;
    }

    if (mfaLocked) {
      setError('Too many attempts. Please wait 30 minutes and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      });

      if (verifyErr) {
        const newAttempts = mfaAttempts + 1;
        setMfaAttempts(newAttempts);
        if (newAttempts >= 5) {
          setMfaLocked(true);
          setError('Too many failed attempts. Account locked for 30 minutes.');
          setTimeout(() => setMfaLocked(false), 30 * 60 * 1000);
        } else {
          setError(`Incorrect code. ${5 - newAttempts} attempts remaining.`);
        }
        return;
      }

      // MFA verified, proceed to app
      window.location.href = '/app';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Validate invite code if beta gating is enabled
        if (BETA_INVITE_REQUIRED && !inviteValidated) {
          if (!inviteCode.trim()) {
            setError('Invite code required for beta access');
            setLoading(false);
            return;
          }

          const validateRes = await fetch('/api/beta/validate-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteCode: inviteCode.trim() }),
          });
          const validateData = await validateRes.json();

          if (!validateData.success) {
            setError(validateData.error?.message || 'Invalid invite code');
            setLoading(false);
            return;
          }
          setInviteValidated(true);
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl('magic_link'),
          },
        });

        if (error) throw error;

        // Mark invite code as used after successful signup
        if (BETA_INVITE_REQUIRED && inviteCode.trim()) {
          fetch('/api/beta/mark-used', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteCode: inviteCode.trim() }),
          }).catch(() => { /* non-critical */ });
        }

        setMessage('Check your email for the confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // Check if MFA is enrolled — if so, show challenge before proceeding
          const hasMFA = await checkAndHandleMFA();
          if (!hasMFA) {
            window.location.href = '/app';
          }
          // If hasMFA is true, the MFA challenge UI will be shown
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    setOauthLoading(provider === 'azure' ? 'microsoft' : 'google');
    setError(null);

    try {
      console.log('[OAuth] Starting sign-in with provider:', provider);
      console.log('[OAuth] Redirect URL:', getRedirectUrl());

      // Clear any stale session first to prevent cookie conflicts
      await supabase.auth.signOut();

      // Use signInWithOAuth — server-side route handler for reliable PKCE exchange
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl('oauth'),
        },
      });

      console.log('[OAuth] Response:', { data, error });

      if (error) {
        console.error('[OAuth] Error:', error);
        throw error;
      }

      // If skipBrowserRedirect wasn't used, Supabase handles redirect automatically
      // But if we get a URL back, redirect manually
      if (data?.url) {
        console.log('[OAuth] Redirecting to:', data.url);
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('[OAuth] Caught error:', err);
      const error = err as Error;
      setError(error.message || `Failed to sign in with ${provider === 'azure' ? 'Microsoft' : 'Google'}`);
      setOauthLoading(null);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setMagicLinkLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl('magic_link'),
        },
      });

      if (error) throw error;

      setMessage('Check your email for the magic link!');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to send magic link');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Background gradient effect (DS v3: electric-purple glow) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* MFA Challenge Card — shown when MFA is required after login */}
        {mfaRequired ? (
          <div className="auth-card p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Two-Factor Authentication</h1>
              <p className="text-sm text-muted">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="input-field text-center font-mono tracking-[0.3em] text-lg"
                placeholder="000000"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleMFAVerify(); }}
              />

              {error && (
                <div className="alert-error"><p>{error}</p></div>
              )}

              <button
                onClick={handleMFAVerify}
                disabled={loading || mfaCode.length !== 6 || mfaLocked}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <AIPresenceDot status="analyzing" />
                    <span>Verifying...</span>
                  </span>
                ) : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setMfaCode('');
                  setMfaAttempts(0);
                  setError(null);
                  supabase.auth.signOut();
                }}
                className="text-sm w-full text-center transition-colors"
                style={{ color: '#3D3D4A' }}
              >
                Sign in with a different account
              </button>
            </div>
          </div>
        ) : (
        /* Auth Card */
        <div className="auth-card p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
              <AIPresenceDot status={loading || oauthLoading ? 'analyzing' : 'idle'} />
            </div>
            <h1 className="text-xl font-semibold text-white">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted">
              {isSignUp
                ? 'Start orchestrating your PR, content, and SEO'
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading || oauthLoading !== null}
              className="btn-oauth"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
              {oauthLoading === 'google' && (
                <span className="ml-auto">
                  <AIPresenceDot status="analyzing" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn('azure')}
              disabled={loading || oauthLoading !== null}
              className="btn-oauth"
            >
              <MicrosoftIcon />
              <span>Continue with Microsoft</span>
              {oauthLoading === 'microsoft' && (
                <span className="ml-auto">
                  <AIPresenceDot status="analyzing" />
                </span>
              )}
            </button>
          </div>

          {/* Divider (DS v3) */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#1F1F28' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2" style={{ backgroundColor: '#13131A', color: '#3D3D4A' }}>or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4" onSubmit={handleAuth}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>

              {/* Beta invite code field — only shown during signup when gating is enabled */}
              {isSignUp && BETA_INVITE_REQUIRED && (
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-white mb-1.5">
                    Invite code
                  </label>
                  <input
                    id="invite-code"
                    name="invite-code"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      setInviteValidated(false);
                    }}
                    className="input-field font-mono tracking-wider"
                    placeholder="PRAVADO-XXXXXXXX"
                  />
                  <p className="text-xs mt-1" style={{ color: '#3D3D4A' }}>
                    Don&apos;t have a code?{' '}
                    <a href="/beta" className="hover:underline" style={{ color: '#00D9FF' }}>Request beta access</a>
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert-error">
                <p>{error}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="alert-success">
                <p>{message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || oauthLoading !== null || magicLinkLoading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <AIPresenceDot status="analyzing" />
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>

            {/* Magic Link Divider (DS v3) */}
            {!isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: '#1F1F28' }} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2" style={{ backgroundColor: '#13131A', color: '#3D3D4A' }}>or sign in with</span>
                  </div>
                </div>

                {/* Magic Link Button */}
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loading || oauthLoading !== null || magicLinkLoading || !email}
                  className="btn-magic-link w-full"
                >
                  {magicLinkLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <AIPresenceDot status="analyzing" />
                      <span>Sending magic link...</span>
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Send Magic Link</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Toggle Sign Up / Sign In (DS v3) */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm transition-colors"
                style={{ color: '#00D9FF' }}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Footer (DS v3) */}
        <p className="mt-6 text-center text-xs" style={{ color: '#3D3D4A' }}>
          By continuing, you agree to Pravado&apos;s{' '}
          <a href="#" className="hover:underline" style={{ color: '#00D9FF' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="hover:underline" style={{ color: '#00D9FF' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
