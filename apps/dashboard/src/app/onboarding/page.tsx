/**
 * Onboarding page - create first organization
 * Styled according to Pravado Design System v2
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Onboarding] Create org button clicked, org name:', orgName);
    setLoading(true);
    setError(null);

    try {
      console.log('[Onboarding] Making fetch request to /api/v1/orgs');

      // Get the current session to pass the access token
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      console.log('[Onboarding] Session found:', !!session);
      console.log('[Onboarding] Access token present:', !!session?.access_token);

      if (!session?.access_token) {
        throw new Error('No active session. Please sign in again.');
      }

      const response = await fetch('/api/v1/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: orgName,
        }),
      });

      console.log('[Onboarding] Response status:', response.status);
      console.log('[Onboarding] Response ok:', response.ok);

      const responseText = await response.text();
      console.log('[Onboarding] Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to create organization';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      console.log('[Onboarding] Success! Redirecting to /app');
      // Use window.location for more reliable redirect
      window.location.href = '/app';
    } catch (err) {
      console.error('[Onboarding] Error caught:', err);
      const error = err as Error;
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-12">
      {/* Background gradient effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--brand-teal) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Onboarding Card */}
        <div className="auth-card p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
              <AIPresenceDot status={loading ? 'analyzing' : 'idle'} />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Create your organization
            </h1>
            <p className="text-sm text-muted">
              Get started by creating your first organization to begin orchestrating your PR, content, and SEO campaigns.
            </p>
          </div>

          {/* Onboarding Steps Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-iris flex items-center justify-center text-white text-sm font-medium">
                1
              </div>
              <span className="text-sm text-white font-medium">Create Org</span>
            </div>
            <div className="w-8 h-px bg-border-subtle" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-4 flex items-center justify-center text-muted text-sm font-medium">
                2
              </div>
              <span className="text-sm text-muted">Dashboard</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleCreateOrg}>
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-white mb-1.5">
                Organization name
              </label>
              <input
                id="orgName"
                name="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
                placeholder="e.g., Acme Corporation"
              />
              <p className="mt-2 text-xs text-muted">
                This will be your workspace where you manage campaigns and team members.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert-error">
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <AIPresenceDot status="analyzing" />
                  <span>Creating organization...</span>
                </span>
              ) : (
                'Create organization'
              )}
            </button>
          </form>

          {/* AI Hint */}
          <div className="alert-info">
            <div className="flex items-start gap-3">
              <AIPresenceDot status="generating" />
              <div>
                <p className="font-medium">AI Tip</p>
                <p className="mt-1 text-xs opacity-80">
                  Once your organization is created, our AI agents will help you set up campaigns, discover media opportunities, and optimize your content strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
