import Link from 'next/link';

// ── Glassmorphism card wrapper ──
function GlassCard({
  children,
  accentColor,
  className = '',
}: {
  children: React.ReactNode;
  accentColor: string;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: 'rgba(8, 8, 18, 0.72)',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        border: `1px solid ${accentColor}35`,
        borderRadius: 16,
        boxShadow: `0 0 24px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Top frost line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', borderRadius: '16px 16px 0 0' }}
      />
      {children}
    </div>
  );
}

// ── Section wrapper ──
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-6xl mx-auto px-6 py-20 ${className}`}>{children}</section>;
}

// ── Constants ──
const PILLARS = [
  {
    name: 'PR & Earned Media',
    icon: '\u270E',
    color: '#E879F9',
    description: 'Pitch the right journalists at the right time. Track coverage that actually moves your EVI. Stop guessing what\u2019s working.',
  },
  {
    name: 'Content & Citation',
    icon: '\u25C8',
    color: '#14B8A6',
    description: 'Publish content that AI engines actually cite. CiteMind scans ChatGPT, Perplexity, Claude, and Gemini to show where you\u2019re winning \u2014 and where you\u2019re invisible.',
  },
  {
    name: 'SEO & AEO',
    icon: '\u2B21',
    color: '#00D9FF',
    description: 'Dominate both traditional search and AI-generated answers. SAGE identifies your highest-impact optimizations ranked by EVI improvement potential.',
  },
];

const STEPS = [
  { num: '01', label: 'Connect', description: 'Link Google Search Console, your content, your PR history' },
  { num: '02', label: 'Scan', description: 'SAGE scans AI engines 24/7 for citations, opportunities, and gaps' },
  { num: '03', label: 'Act', description: 'Your Action Stream surfaces exactly what to do next, ranked by impact' },
];

const PLANS = [
  { name: 'Starter', price: 'Free', desc: 'For individuals getting started', features: ['1 seat', '10K tokens/mo', '5 playbook runs/mo'] },
  { name: 'Growth', price: '$49/mo', desc: 'For growing teams', features: ['5 seats', '100K tokens/mo', '50 playbook runs/mo'] },
  { name: 'Pro', price: '$149/mo', desc: 'For professional teams', features: ['15 seats', '500K tokens/mo', '200 playbook runs/mo'] },
  { name: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['Unlimited seats', 'Custom limits', 'Dedicated support'] },
];

const ENGINES = ['ChatGPT', 'Perplexity', 'Claude', 'Gemini'];

export default function MarketingHomePage() {
  return (
    <div>
      {/* ============================================
          SECTION 1: HERO
          ============================================ */}
      <section className="relative overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 20% 60%, rgba(0,217,255,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 80% 70%, rgba(232,121,249,0.06) 0%, transparent 60%)
            `,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
          {/* Eyebrow */}
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-6"
            style={{ color: '#00D9FF' }}
          >
            Private Beta &middot; Limited Spots
          </p>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{
              background: 'linear-gradient(135deg, #ffffff 30%, #A855F7 70%, #00D9FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            The AI Platform That Runs Your PR, Content, and SEO &mdash; So You Can Focus on What Only You Can Do.
          </h1>

          {/* Subhead */}
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Pravado&apos;s AI engine SAGE monitors signals across your PR pipeline,
            content library, and SEO landscape around the clock &mdash; then tells you
            exactly what to do next.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/beta"
              className="px-8 py-3.5 text-base font-bold rounded-lg transition-all"
              style={{ background: '#00D9FF', color: '#0A0A0F' }}
            >
              Apply for Beta Access
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 text-base font-medium rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Sign In
            </Link>
          </div>

          {/* Hero visual — 3 pillar preview cards */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {PILLARS.map(p => (
              <GlassCard key={p.name} accentColor={p.color} className="p-4 text-center">
                <span className="text-2xl block mb-2">{p.icon}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: p.color, letterSpacing: '0.1em' }}>
                  {p.name.split(' ')[0]}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: THREE PILLARS
          ============================================ */}
      <Section>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          One Platform. Three Pillars.
        </h2>
        <p className="text-center mb-12" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto 3rem' }}>
          Everything moving in the same direction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map(p => (
            <GlassCard key={p.name} accentColor={p.color} className="p-6">
              <span className="text-3xl block mb-3">{p.icon}</span>
              <h3 className="text-lg font-bold mb-2" style={{ color: p.color }}>{p.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {p.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* ============================================
          SECTION 3: HOW SAGE WORKS
          ============================================ */}
      <Section>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How SAGE Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(0,217,255,0.1)',
                  border: '1px solid rgba(0,217,255,0.25)',
                  fontFamily: 'monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#00D9FF',
                }}
              >
                {step.num}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.label}</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {step.description}
              </p>
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2"
                  style={{ width: 40, height: 1, background: 'rgba(0,217,255,0.2)' }}
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================
          SECTION 4: EVI EXPLAINER
          ============================================ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,217,255,0.06) 0%, transparent 70%)',
          }}
        />
        <Section>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">What is Earned Visibility Index?</h2>

            {/* Big EVI number */}
            <div className="mb-8">
              <span
                className="text-8xl sm:text-9xl font-bold"
                style={{
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, #00D9FF, #A855F7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 40px rgba(0,217,255,0.3))',
                }}
              >
                74.2
              </span>
            </div>

            <p className="text-base max-w-2xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              EVI is Pravado&apos;s proprietary metric that measures how prominently your brand appears
              in AI-generated responses across ChatGPT, Perplexity, Claude, and Gemini. It&apos;s the
              single number that tells you if your PR, content, and SEO efforts are working.
            </p>

            {/* Engine logos */}
            <div className="flex items-center justify-center gap-8">
              {ENGINES.map(e => (
                <span
                  key={e}
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ============================================
          SECTION 5: PRICING / BETA CTA
          ============================================ */}
      <Section>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Private Beta &mdash; Free While We Build Together
        </h2>
        <p className="text-center mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
          During beta, all features are available at no cost.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map(plan => (
            <GlassCard key={plan.name} accentColor="#A855F7" className="p-6 flex flex-col">
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00D9FF' }}>{plan.price}</div>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.desc}</p>
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00D9FF' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <div
                className="text-center py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)' }}
              >
                Coming Soon
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CTA banner */}
        <GlassCard accentColor="#00D9FF" className="p-8 text-center">
          <p className="text-lg font-semibold mb-4">
            During beta, all features are available at no cost.
          </p>
          <Link
            href="/beta"
            className="inline-block px-8 py-3 text-base font-bold rounded-lg transition-all"
            style={{ background: '#00D9FF', color: '#0A0A0F' }}
          >
            Apply for Beta Access &rarr;
          </Link>
        </GlassCard>
      </Section>

      {/* ============================================
          SECTION 6: FOUNDER NOTE
          ============================================ */}
      <Section className="text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-base leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Built by Christian Dibrell, Founder of Saipien Labs &mdash;
            because AI is changing how brands get found, and most teams aren&apos;t ready.
          </p>
          <a
            href="https://www.linkedin.com/in/christiandibrell/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium transition-colors"
            style={{ color: '#00D9FF' }}
          >
            Connect on LinkedIn &rarr;
          </a>
        </div>
      </Section>
    </div>
  );
}
