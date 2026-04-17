'use client';

import Link from 'next/link';

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'monospace',
  letterSpacing: '0.15em',
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase' as const,
  marginBottom: 24,
};

const headlineStyle: React.CSSProperties = {
  fontSize: 'clamp(28px, 3.5vw, 42px)',
  fontWeight: 800,
  color: '#ffffff',
  lineHeight: 1.2,
  marginBottom: 24,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 16,
  color: 'rgba(255,255,255,0.65)',
  lineHeight: 1.75,
  marginBottom: 20,
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#0A0A0F', minHeight: '100vh' }}>
      {/* SECTION 1 — MISSION */}
      <section style={{ backgroundColor: '#0A0A0F', padding: '100px 5%' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={labelStyle}>OUR MISSION</div>
          <h1 style={headlineStyle}>
            Build the operating system for AI-era marketing.
          </h1>
          <p style={{ ...bodyStyle, maxWidth: 660 }}>
            The way buyers discover products has fundamentally changed. They ask ChatGPT
            before they ask Google. AI engines synthesize answers, make recommendations,
            and shape purchase decisions&mdash;often without a single click to your website.
            The brands that thrive in this new world won&rsquo;t be the ones with the best
            SEO tricks. They&rsquo;ll be the ones whose authority is so deeply embedded in
            the knowledge layer that AI systems can&rsquo;t help but cite them.
          </p>
          <p style={{ ...bodyStyle, maxWidth: 660 }}>
            Most marketing teams don&rsquo;t have the infrastructure to operate in this
            reality. They&rsquo;re stitching together point tools built for a world that&rsquo;s
            disappearing&mdash;one for PR, another for content, another for search&mdash;with
            no unified strategy, no citation intelligence, and no way to measure what
            actually matters. Pravado is that infrastructure. Powered by SAGE&trade;,
            CRAFT&trade;, CiteMind&trade;, and EVI&trade;, it&rsquo;s the first platform
            where PR, Content, and SEO compound each other through shared strategy and
            governed execution.
          </p>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM WE'RE OBSESSED WITH */}
      <section style={{ backgroundColor: '#0D0D14', padding: '100px 5%' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={labelStyle}>THE PROBLEM</div>
          <h2 style={{ ...headlineStyle, marginBottom: 48 }}>
            The problem we&rsquo;re obsessed with.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
              marginBottom: 48,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#00D9FF',
                  marginBottom: 8,
                }}
              >
                77%
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                of searches now end with an AI answer, not a click
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#00D9FF',
                  marginBottom: 8,
                }}
              >
                43%
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                of purchase decisions influenced by AI recommendations
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#00D9FF',
                  marginBottom: 8,
                }}
              >
                $1T
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                in commerce projected to shift to AI assistants by 2029
              </div>
            </div>
          </div>

          <p style={{ ...bodyStyle, maxWidth: 660 }}>
            The entire marketing stack&mdash;every tool, every playbook, every
            metric&mdash;was built for Google&rsquo;s world: rank on page one, win
            the click, convert the visitor. That world is ending. AI engines don&rsquo;t
            send clicks. They synthesize answers from the sources they trust most. The
            question is no longer &ldquo;how do we rank?&rdquo; but &ldquo;how do we
            become the source AI trusts?&rdquo; Pravado is built for what replaces it.
          </p>
        </div>
      </section>

      {/* SECTION 3 — THE COMPANY */}
      <section style={{ backgroundColor: '#0A0A0F', padding: '100px 5%' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={labelStyle}>THE COMPANY</div>
          <h2 style={headlineStyle}>
            Who we are.
          </h2>
          <p style={{ ...bodyStyle, maxWidth: 660 }}>
            Pravado is built by Saipien Labs LLC, a venture studio focused on
            AI-native infrastructure for marketing and communications. We&rsquo;re
            not a feature factory chasing trends&mdash;we&rsquo;re building the
            foundational operating system that marketing teams will run on for the
            next decade.
          </p>
          <p style={{ ...bodyStyle, maxWidth: 660 }}>
            We&rsquo;re currently in private beta, working with select teams who
            understand that the shift to AI-mediated discovery isn&rsquo;t coming&mdash;it&rsquo;s
            here. If you&rsquo;re ready to build authority that compounds across every
            channel, we&rsquo;d love to hear from you.
          </p>
          <p style={{ ...bodyStyle, maxWidth: 660, marginBottom: 40 }}>
            Get in touch:{' '}
            <a
              href="mailto:hello@pravado.io"
              style={{ color: '#00D9FF', textDecoration: 'none' }}
            >
              hello@pravado.io
            </a>
          </p>
          <Link
            href="/beta"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#00D9FF',
              color: '#0A0A0F',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 6,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Apply for Early Access
          </Link>
        </div>
      </section>
    </div>
  );
}
