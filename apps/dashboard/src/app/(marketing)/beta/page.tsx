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

const TOOL_OPTIONS = [
  'Semrush or Ahrefs',
  'Cision or Muck Rack',
  'Meltwater or Brandwatch',
  'HubSpot',
  'None of these',
];

const FEEDBACK_OPTIONS = [
  'Yes — happy to',
  'Maybe',
  'No thanks',
];

export default function BetaRequestPage() {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [useCase, setUseCase] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [currentTools, setCurrentTools] = useState<string[]>([]);
  const [feedbackCall, setFeedbackCall] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');

    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com',
      'outlook.com', 'icloud.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && freeDomains.includes(domain)) {
      setEmailError('Please use your work email address.');
      setFormState('idle');
      return;
    }
    setEmailError('');

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
          jobTitle: jobTitle || undefined,
          companyWebsite: companyWebsite || undefined,
          currentTools: currentTools.length > 0 ? currentTools : undefined,
          feedbackCall: feedbackCall || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setFormState('success');
        setMessage(json.data.message);
      } else {
        setFormState('error');
        setMessage(json.error?.message || 'Something went wrong. Please try again or email hello@pravado.io directly.');
      }
    } catch {
      setFormState('error');
      setMessage('Something went wrong. Please try again or email hello@pravado.io directly.');
    }
  };

  const toggleTool = (tool: string) => {
    setCurrentTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const inputStyle = { backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-3xl">
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight">
          The AI Platform That Runs Your PR, Content, and SEO —
          <br className="hidden md:block" />
          So You Can Focus on What Only You Can Do.
        </h1>

        {/* Subheadline */}
        <p className="mt-4 mb-2 text-center text-base md:text-lg" style={{ color: '#7A7A8A' }}>
          Pravado&apos;s AI engine — SAGE — monitors signals across your PR pipeline,
          content library, and SEO landscape around the clock. It surfaces exactly
          what to do next, then helps you do it. One platform. Three pillars.
          Everything moving in the same direction.
        </p>

        {/* Social proof */}
        <p className="text-center text-sm mb-8" style={{ color: '#5A5A6A' }}>
          Private beta. Limited spots. We review applications within 48 hours.
        </p>

        {/* Value prop cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-xl border" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-sm font-semibold text-white mb-2">SAGE identifies your next move</h3>
            <p className="text-sm" style={{ color: '#7A7A8A' }}>
              Continuously analyzes PR, content, and SEO signals to surface your
              highest-impact actions — ranked by EVI improvement potential.
            </p>
          </div>
          <div className="p-6 rounded-xl border" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-sm font-semibold text-white mb-2">Execute across all three pillars</h3>
            <p className="text-sm" style={{ color: '#7A7A8A' }}>
              From pitch to publish to ranking — manage every visibility action
              from one command center without switching between five tools.
            </p>
          </div>
          <div className="p-6 rounded-xl border" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
            <div className="text-2xl mb-3">📡</div>
            <h3 className="text-sm font-semibold text-white mb-2">Know exactly where you stand with AI engines</h3>
            <p className="text-sm" style={{ color: '#7A7A8A' }}>
              Your Earned Visibility Index tells you how your brand registers in
              ChatGPT, Perplexity, and Google — and what&apos;s moving it.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-lg mx-auto p-8 space-y-6 rounded-2xl border" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #A855F7, #00D9FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pravado
            </span>
            <h2 className="text-xl font-semibold text-white mt-2">
              Apply for Private Beta Access
            </h2>
          </div>

          {formState === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <svg className="w-8 h-8" fill="none" stroke="#22C55E" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">You&apos;re on the list.</h3>
              <p className="text-sm" style={{ color: '#7A7A8A' }}>
                We review applications every day and prioritize teams ready to
                stop managing PR, content, and SEO separately. If approved, you&apos;ll
                get a personal email from Christian with your invite code.
              </p>
              <p className="text-xs" style={{ color: '#5A5A6A' }}>
                One thing to do now — connect on LinkedIn. That&apos;s where
                the research behind Pravado comes out first.
              </p>
              <a
                href="https://linkedin.com/in/cdibrell"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
              >
                Connect on LinkedIn →
              </a>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Work email */}
              <div>
                <label htmlFor="beta-email" className="block text-sm font-medium text-white mb-1.5">
                  Work email *
                </label>
                <input
                  id="beta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors"
                  style={inputStyle}
                  placeholder="you@company.com"
                />
                {emailError && (
                  <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{emailError}</p>
                )}
              </div>

              {/* Job title */}
              <div>
                <label htmlFor="beta-job-title" className="block text-sm font-medium text-white mb-1.5">
                  Job title *
                </label>
                <input
                  id="beta-job-title"
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors"
                  style={inputStyle}
                  placeholder="VP Marketing, CMO, Director of Content..."
                />
              </div>

              {/* Company name */}
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
                  style={inputStyle}
                  placeholder="Acme Inc."
                />
              </div>

              {/* Company website */}
              <div>
                <label htmlFor="beta-website" className="block text-sm font-medium text-white mb-1.5">
                  Company website *
                </label>
                <input
                  id="beta-website"
                  type="text"
                  required
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#3D3D4A] outline-none transition-colors"
                  style={inputStyle}
                  placeholder="acme.com"
                />
              </div>

              {/* Team size */}
              <div>
                <label htmlFor="beta-size" className="block text-sm font-medium text-white mb-1.5">
                  Team size
                </label>
                <select
                  id="beta-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                  style={inputStyle}
                >
                  <option value="">Select size</option>
                  <option value="solo">Solo / Freelancer</option>
                  <option value="2-10">2-10 people</option>
                  <option value="11-50">11-50 people</option>
                  <option value="51-200">51-200 people</option>
                  <option value="200+">200+ people</option>
                </select>
              </div>

              {/* Use case */}
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
                  style={inputStyle}
                  placeholder="PR outreach, content strategy, AEO monitoring..."
                />
              </div>

              {/* Current tools */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tools you currently use (select all that apply)
                </label>
                <div className="space-y-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <label key={tool} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={currentTools.includes(tool)}
                        onChange={() => toggleTool(tool)}
                        className="w-4 h-4 rounded border accent-purple-500"
                        style={{ accentColor: '#A855F7' }}
                      />
                      <span className="text-sm" style={{ color: '#7A7A8A' }}>{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Referral source */}
              <div>
                <label htmlFor="beta-referral" className="block text-sm font-medium text-white mb-1.5">
                  How did you hear about us?
                </label>
                <select
                  id="beta-referral"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                  style={inputStyle}
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

              {/* Feedback call */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Open to a 15-minute feedback call during beta?
                </label>
                <div className="space-y-2">
                  {FEEDBACK_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackCall"
                        value={option}
                        checked={feedbackCall === option}
                        onChange={(e) => setFeedbackCall(e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#A855F7' }}
                      />
                      <span className="text-sm" style={{ color: '#7A7A8A' }}>{option}</span>
                    </label>
                  ))}
                </div>
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
                {formState === 'submitting' ? 'Submitting...' : 'Request Early Access →'}
              </button>

              <p className="text-center text-xs" style={{ color: '#5A5A6A' }}>
                By applying you agree to our{' '}
                <a href="/legal/terms" className="hover:underline" style={{ color: '#00D9FF' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/legal/privacy" className="hover:underline" style={{ color: '#00D9FF' }}>Privacy Policy</a>.
                <br />
                We review applications within 48 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
