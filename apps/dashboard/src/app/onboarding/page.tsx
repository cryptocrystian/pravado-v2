/**
 * Onboarding page - redirects to AI-led introduction
 * Sprint S93: AI-Led Onboarding Flow
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// AI Presence Dot component
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has completed the AI intro
    const onboardingContext = localStorage.getItem('pravado_onboarding_context');

    if (!onboardingContext) {
      // Redirect to AI-led introduction for first-time users
      router.replace('/onboarding/ai-intro');
    } else {
      // User has completed AI intro but somehow landed here
      // This could happen if org creation failed
      // Redirect back to ai-intro to complete org creation
      router.replace('/onboarding/ai-intro');
    }
  }, [router]);

  // Show loading while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--brand-teal) 0%, transparent 50%)',
        }}
      />

      <div className="relative text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-2xl font-bold text-gradient-hero">Pravado</span>
          <AIDot status="analyzing" />
        </div>
        <p className="text-muted">Preparing your experience...</p>
      </div>
    </div>
  );
}
