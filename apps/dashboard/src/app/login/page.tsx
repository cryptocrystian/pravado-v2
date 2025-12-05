/**
 * Login/Signup page with Supabase Auth
 * Styled according to Pravado Design System v2
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { useState } from 'react';
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

// AI Presence Dot component
const AIPresenceDot = ({ status }: { status: 'idle' | 'analyzing' | 'generating' }) => {
  const statusClasses = {
    idle: 'bg-slate-6',
    analyzing: 'bg-brand-cyan animate-ai-pulse',
    generating: 'bg-brand-iris',
  };

  return (
    <span
      className={`w-2 h-2 rounded-full ${statusClasses[status]}`}
      aria-label={`AI ${status}`}
    />
  );
};

// Get the correct redirect URL based on environment
const getRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://pravado-dashboard.vercel.app/callback';
  }

  // Use production URL if on Vercel, otherwise use window.location.origin
  const isProduction = window.location.hostname === 'pravado-dashboard.vercel.app'
    || window.location.hostname.includes('vercel.app');

  if (isProduction) {
    return 'https://pravado-dashboard.vercel.app/callback';
  }

  return `${window.location.origin}/callback`;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        });

        if (error) throw error;

        setMessage('Check your email for the confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          const response = await fetch('/api/v1/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: data.session.access_token,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }

          window.location.href = '/callback';
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      });

      if (error) throw error;
    } catch (err) {
      const error = err as Error;
      setError(error.message || `Failed to sign in with ${provider === 'azure' ? 'Microsoft' : 'Google'}`);
      setOauthLoading(null);
    }
  };

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
        {/* Auth Card */}
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-2 px-2 text-muted">or continue with email</span>
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
              disabled={loading || oauthLoading !== null}
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

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors duration-sm"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          By continuing, you agree to Pravado&apos;s{' '}
          <a href="#" className="text-brand-cyan hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-brand-cyan hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
