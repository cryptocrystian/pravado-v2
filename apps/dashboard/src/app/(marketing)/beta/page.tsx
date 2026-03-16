/**
 * Public Beta Request Page (Sprint S-INT-09)
 *
 * Landing page where users can request beta access to Pravado.
 * No authentication required.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function BetaRequestPage() {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [useCase, setUseCase] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');

    try {
      const res = await fetch('/api/beta/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          companyName: companyName || undefined,
          companySize: companySize || undefined,
          useCase: useCase || undefined,
          referralSource: referralSource || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setFormState('success');
        setMessage(json.data.message);
      } else {
        setFormState('error');
        setMessage(json.error?.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setFormState('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-lg">
        <div className="p-8 space-y-6 rounded-2xl border" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #A855F7, #00D9FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pravado
            </span>
            <h1 className="text-xl font-semibold text-white mt-2">
              Request Beta Access
            </h1>
            <p className="text-sm" style={{ color: '#7A7A8A' }}>
              Join the waitlist for Pravado — the AI-native Visibility Operating System.
            </p>
          </div>

          {formState === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <svg className="w-8 h-8" fill="none" stroke="#22C55E" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium">{message}</p>
              <p className="text-sm" style={{ color: '#7A7A8A' }}>
                We review requests daily and prioritize teams ready to transform their visibility strategy.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="beta-email" className="block text-sm font-medium text-white mb-1.5">
                  Work email *
                </label>
                <input
                  id="beta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="beta-company" className="block text-sm font-medium text-white mb-1.5">
                  Company name
                </label>
                <input
                  id="beta-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label htmlFor="beta-size" className="block text-sm font-medium text-white mb-1.5">
                  Team size
                </label>
                <select
                  id="beta-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                >
                  <option value="">Select size</option>
                  <option value="solo">Solo / Freelancer</option>
                  <option value="2-10">2-10 people</option>
                  <option value="11-50">11-50 people</option>
                  <option value="51-200">51-200 people</option>
                  <option value="200+">200+ people</option>
                </select>
              </div>

              <div>
                <label htmlFor="beta-usecase" className="block text-sm font-medium text-white mb-1.5">
                  What do you want to use Pravado for?
                </label>
                <textarea
                  id="beta-usecase"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors resize-none"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                  placeholder="PR outreach, content strategy, AEO monitoring..."
                />
              </div>

              <div>
                <label htmlFor="beta-referral" className="block text-sm font-medium text-white mb-1.5">
                  How did you hear about us?
                </label>
                <select
                  id="beta-referral"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                >
                  <option value="">Select one</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="referral">Friend / Colleague</option>
                  <option value="search">Google Search</option>
                  <option value="product_hunt">Product Hunt</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formState === 'error' && (
                <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={formState === 'submitting'}
                className="w-full py-3 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
              >
                {formState === 'submitting' ? 'Submitting...' : 'Request Access'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#3D3D4A' }}>
          By requesting access, you agree to Pravado&apos;s{' '}
          <a href="#" className="hover:underline" style={{ color: '#00D9FF' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="hover:underline" style={{ color: '#00D9FF' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
