'use client';

import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    features: [
      '3 SAGE\u2122 actions/day',
      'Daily CiteMind\u2122 scans',
      '10 CRAFT\u2122 pieces/mo',
      '30-day history',
      '10K journalist contacts',
      '1 seat',
    ],
  },
  {
    name: 'Growth',
    price: '$49/mo',
    features: [
      '10 SAGE\u2122 actions/day',
      'Hourly CiteMind\u2122 scans',
      '50 CRAFT\u2122 pieces/mo',
      '90-day history',
      '50K journalist contacts',
      '5 seats',
    ],
  },
  {
    name: 'Pro',
    price: '$149/mo',
    features: [
      'Unlimited SAGE\u2122 actions',
      'Real-time CiteMind\u2122',
      'Unlimited CRAFT\u2122',
      '1-year history',
      'Full 283K database',
      '15 seats',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Dedicated CSM',
      'Custom integrations',
      'SLA guarantee',
      'Unlimited seats',
    ],
  },
];

const faqs = [
  {
    question: 'What is EVI\u2122 and how is it calculated?',
    answer:
      'EVI\u2122 (Earned Visibility Index) is a composite score that measures your brand\u2019s total earned visibility across AI engines and traditional search. It combines three weighted components: Visibility (40%), which tracks how often your brand appears in AI-generated answers and search results; Authority (35%), which measures citation quality, domain trust, and backlink strength; and Momentum (25%), which captures week-over-week growth trends. Your EVI\u2122 score is updated daily by CiteMind\u2122 scans across all monitored AI engines.',
  },
  {
    question: 'What AI engines does CiteMind\u2122 monitor?',
    answer:
      'CiteMind\u2122 currently monitors six major AI engines: ChatGPT (OpenAI), Perplexity, Claude (Anthropic), Gemini (Google), Google AI Overviews, and Bing Copilot (Microsoft). We continuously evaluate new AI surfaces and add monitoring coverage as they reach meaningful adoption. Each engine is queried with your tracked keywords and brand mentions are analyzed for citation context, sentiment, and positioning.',
  },
  {
    question: 'How does CRAFT\u2122 differ from marketing automation?',
    answer:
      'Traditional marketing automation runs on static workflows: if X happens, do Y. CRAFT\u2122 is fundamentally different because every content action is directed by SAGE\u2122 intelligence. SAGE\u2122 analyzes your real-time visibility data, competitor movements, and content gaps to determine what to create, when, and why. CRAFT\u2122 then executes with full context of your PR pipeline, SEO landscape, and CiteMind\u2122 citation signals \u2014 producing content that compounds across all three pillars.',
  },
  {
    question: 'Do I need to connect Google Search Console?',
    answer:
      'Connecting Google Search Console is optional but strongly recommended. Without it, SAGE\u2122 relies on third-party crawl data and CiteMind\u2122 signals to assess your search visibility. With GSC connected, SAGE\u2122 gains access to your actual impressions, click-through rates, and query-level performance \u2014 significantly improving the accuracy of its strategic recommendations and EVI\u2122 calculations.',
  },
  {
    question: 'Is my data used to train AI models?',
    answer:
      'No. Your data is never shared with third parties or used to train any AI models. Pravado processes your data solely to deliver platform functionality \u2014 visibility tracking, strategic recommendations, and content generation. All data is encrypted at rest and in transit, and you retain full ownership. We do not sell, license, or otherwise monetize customer data.',
  },
  {
    question: 'How does beta pricing work?',
    answer:
      'During our private beta, all plan features are completely free. We review every application within 48 hours and onboard accepted teams with full access to Pro-tier capabilities. When we launch publicly, beta users receive priority pricing locked in for 12 months \u2014 typically 40\u201360% below standard rates. There is no credit card required during the beta period and no automatic charges when beta ends.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh' }}>
      {/* SECTION 1 — HERO */}
      <section
        style={{
          padding: '100px 5%',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 16,
            }}
          >
            PRICING
          </p>
          <h1
            style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 32,
              maxWidth: 660,
              margin: '0 auto 32px',
            }}
          >
            Built for teams that take AI visibility seriously.
          </h1>
          <div
            style={{
              padding: '16px 24px',
              borderRadius: 10,
              border: '1px solid rgba(0,217,255,0.3)',
              background: 'rgba(0,217,255,0.05)',
              textAlign: 'center',
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 660,
              margin: '0 auto',
            }}
          >
            All plans free during private beta. We review applications within 48
            hours.
          </div>
        </div>
      </section>

      {/* SECTION 2 — PLAN CARDS */}
      <section
        style={{
          padding: '0 5% 100px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          className="grid gap-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                padding: 24,
                borderRadius: 12,
                background: 'rgba(8,8,18,0.72)',
                border: '1px solid rgba(168,85,247,0.15)',
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 8,
                }}
              >
                {plan.name}
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#00D9FF',
                  fontFamily: 'monospace',
                  marginBottom: 24,
                }}
              >
                {plan.price}
              </p>
              <ul className="flex flex-col gap-3" style={{ marginBottom: 24 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2"
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#00D9FF',
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <div
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  color: '#A855F7',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Coming Soon
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* SECTION 3 — FAQ */}
      <section
        style={{
          padding: '80px 5%',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 32,
            }}
          >
            FREQUENTLY ASKED QUESTIONS
          </p>
          <div style={{ maxWidth: 720 }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    padding: '20px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: '#ffffff',
                    }}
                  >
                    {faq.question}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.3)',
                      transition: 'transform 0.2s',
                      transform:
                        openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    &#9660;
                  </span>
                </div>
                {openFaq === index && (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1.75,
                      paddingBottom: 20,
                    }}
                  >
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
