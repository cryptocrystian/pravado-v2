/**
 * AI-Led Onboarding Experience (Sprint S93)
 *
 * A comprehensive AI-guided introduction to Pravado that:
 * - Explains what Pravado is and how it works
 * - Demonstrates pillar orchestration
 * - Captures user goals and preferences
 * - Stores onboarding context for downstream AI services
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types
type OnboardingStep =
  | 'welcome'
  | 'pillars'
  | 'orchestration'
  | 'goals'
  | 'preferences'
  | 'create-org';

type PrimaryGoal =
  | 'pr_media'
  | 'content_marketing'
  | 'seo_visibility'
  | 'crisis_management'
  | 'investor_relations'
  | 'executive_strategy';

type RiskTolerance = 'conservative' | 'balanced' | 'aggressive';
type ReportingCadence = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

interface OnboardingContext {
  primaryGoals: PrimaryGoal[];
  riskTolerance: RiskTolerance;
  reportingCadence: ReportingCadence;
  industryFocus?: string;
  teamSize?: string;
  completedAt?: string;
}

// AI Presence Dot
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-3 h-3 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}

// Progress indicator
function ProgressSteps({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              index < currentStep
                ? 'bg-semantic-success text-white'
                : index === currentStep
                ? 'bg-brand-iris text-white'
                : 'bg-slate-4 text-muted'
            }`}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                index < currentStep ? 'bg-semantic-success' : 'bg-slate-4'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Pillar Card Component
function PillarCard({
  icon,
  title,
  description,
  color,
  capabilities,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  capabilities: string[];
}) {
  return (
    <div className="panel-card p-5 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${color}/10 flex items-center justify-center ${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-muted mb-4">{description}</p>
      <ul className="space-y-1.5">
        {capabilities.map((cap) => (
          <li key={cap} className="flex items-center gap-2 text-xs text-slate-6">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {cap}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Goal Option Component
function GoalOption({
  id,
  label,
  description,
  icon,
  selected,
  onToggle,
}: {
  id: PrimaryGoal;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onToggle: (id: PrimaryGoal) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        selected
          ? 'border-brand-cyan bg-brand-cyan/10'
          : 'border-border-subtle bg-slate-3/30 hover:border-slate-5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-slate-4 text-muted'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${selected ? 'text-brand-cyan' : 'text-white'}`}>{label}</p>
            {selected && (
              <svg className="w-4 h-4 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-xs text-muted mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

// Main Onboarding Component
export default function AIIntroPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [aiStatus, setAIStatus] = useState<'idle' | 'analyzing' | 'generating'>('idle');
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Form state
  const [selectedGoals, setSelectedGoals] = useState<PrimaryGoal[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('balanced');
  const [reportingCadence, setReportingCadence] = useState<ReportingCadence>('weekly');
  const [orgName, setOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step definitions
  const stepOrder: OnboardingStep[] = ['welcome', 'pillars', 'orchestration', 'goals', 'preferences', 'create-org'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  // Typewriter effect for AI messages
  const typeMessage = (message: string, callback?: () => void) => {
    setTypedText('');
    setIsTyping(true);
    setAIStatus('generating');

    let index = 0;
    const interval = setInterval(() => {
      if (index < message.length) {
        setTypedText(message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setAIStatus('idle');
        callback?.();
      }
    }, 20);

    return () => clearInterval(interval);
  };

  // Welcome message on mount
  useEffect(() => {
    if (currentStep === 'welcome') {
      const cleanup = typeMessage(
        "Hello! I'm Pravado, your AI-powered decision intelligence platform. I'll guide you through setting up your workspace and show you how I can help orchestrate your PR, content, and SEO strategies."
      );
      return cleanup;
    }
    return undefined;
  }, []);

  // Step change messages
  useEffect(() => {
    if (currentStep === 'pillars') {
      typeMessage(
        "Pravado operates through three interconnected intelligence pillars. Each pillar works independently while sharing insights across the system."
      );
    } else if (currentStep === 'orchestration') {
      typeMessage(
        "The real power comes from orchestration. When one pillar detects a signal, I automatically evaluate its impact across all domains and suggest coordinated actions."
      );
    } else if (currentStep === 'goals') {
      typeMessage(
        "Let's personalize your experience. Select your primary objectives and I'll prioritize intelligence streams accordingly."
      );
    } else if (currentStep === 'preferences') {
      typeMessage(
        "Finally, let's configure how I communicate insights to you. This helps me calibrate alert thresholds and report timing."
      );
    } else if (currentStep === 'create-org') {
      typeMessage(
        "Excellent! Now let's create your organization. I'll begin monitoring and analyzing data as soon as you're set up."
      );
    }
  }, [currentStep]);

  // Navigation
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  // Toggle goal selection
  const toggleGoal = (goal: PrimaryGoal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Save onboarding context
  const saveOnboardingContext = () => {
    const context: OnboardingContext = {
      primaryGoals: selectedGoals,
      riskTolerance,
      reportingCadence,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('pravado_onboarding_context', JSON.stringify(context));
    return context;
  };

  // Create organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Save onboarding preferences
      const onboardingContext = saveOnboardingContext();

      // Get session
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session. Please sign in again.');
      }

      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: orgName,
          metadata: {
            onboardingContext,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create organization';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Redirect to dashboard
      router.push('/app');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  // Icons
  const icons = {
    pr: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    content: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    seo: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    crisis: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    investor: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    strategy: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    orchestrate: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  };

  // Goal options
  const goalOptions: { id: PrimaryGoal; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'pr_media', label: 'PR & Media Relations', description: 'Media monitoring, journalist outreach, press releases', icon: icons.pr },
    { id: 'content_marketing', label: 'Content Marketing', description: 'Content strategy, brief generation, quality scoring', icon: icons.content },
    { id: 'seo_visibility', label: 'SEO & Visibility', description: 'Search performance, keyword tracking, competitive analysis', icon: icons.seo },
    { id: 'crisis_management', label: 'Crisis Management', description: 'Risk detection, scenario simulation, reputation monitoring', icon: icons.crisis },
    { id: 'investor_relations', label: 'Investor Relations', description: 'Investor updates, board reporting, stakeholder comms', icon: icons.investor },
    { id: 'executive_strategy', label: 'Executive Strategy', description: 'Strategic intelligence, executive digests, decision support', icon: icons.strategy },
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, var(--brand-iris) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, var(--brand-cyan) 0%, transparent 40%)',
        }}
      />

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gradient-hero">Pravado</span>
            <AIDot status={aiStatus} />
          </div>
          {currentStepIndex > 0 && currentStep !== 'create-org' && (
            <button onClick={goBack} className="text-sm text-muted hover:text-white transition-colors">
              Back
            </button>
          )}
        </header>

        {/* Progress */}
        <div className="px-6">
          <ProgressSteps
            currentStep={currentStepIndex}
            steps={['Welcome', 'Pillars', 'Orchestration', 'Goals', 'Preferences', 'Setup']}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-4xl">
            {/* AI Message */}
            <div className="mb-8 p-5 panel-card border-l-4 border-l-brand-cyan">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0">
                  <AIDot status={aiStatus} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-brand-cyan">Pravado AI</span>
                    {isTyping && (
                      <span className="text-xs text-muted animate-pulse">thinking...</span>
                    )}
                  </div>
                  <p className="text-white leading-relaxed">
                    {typedText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 'welcome' && (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-grad-hero/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Welcome to Pravado</h1>
                <p className="text-muted max-w-lg mx-auto mb-8">
                  Your AI-powered decision intelligence platform that orchestrates PR, content, and SEO strategies through unified intelligence.
                </p>
                <button onClick={goNext} className="btn-primary px-8 py-3 text-lg">
                  Get Started
                </button>
              </div>
            )}

            {currentStep === 'pillars' && (
              <div>
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  The Three Intelligence Pillars
                </h2>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <PillarCard
                    icon={icons.pr}
                    title="PR Intelligence"
                    description="Media monitoring, journalist relationships, and outreach automation"
                    color="text-brand-iris"
                    capabilities={[
                      'Real-time media monitoring',
                      'Journalist discovery & enrichment',
                      'Pitch generation & tracking',
                      'Press release distribution',
                    ]}
                  />
                  <PillarCard
                    icon={icons.content}
                    title="Content Intelligence"
                    description="Content strategy, quality scoring, and brief generation"
                    color="text-brand-cyan"
                    capabilities={[
                      'Content brief generation',
                      'Quality scoring & feedback',
                      'SEO optimization insights',
                      'Audience persona alignment',
                    ]}
                  />
                  <PillarCard
                    icon={icons.seo}
                    title="SEO Intelligence"
                    description="Search visibility, performance tracking, and competitive analysis"
                    color="text-brand-magenta"
                    capabilities={[
                      'Keyword performance tracking',
                      'Competitive gap analysis',
                      'SERP position monitoring',
                      'Technical SEO insights',
                    ]}
                  />
                </div>
                <div className="text-center">
                  <button onClick={goNext} className="btn-primary px-8 py-3">
                    See How They Work Together
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'orchestration' && (
              <div>
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Intelligent Orchestration
                </h2>
                <div className="panel-card p-6 mb-8">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-brand-iris/10 flex items-center justify-center text-brand-iris">
                      {icons.pr}
                    </div>
                    <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="w-16 h-16 rounded-xl bg-brand-amber/10 flex items-center justify-center text-brand-amber">
                      {icons.orchestrate}
                    </div>
                    <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="w-16 h-16 rounded-xl bg-brand-magenta/10 flex items-center justify-center text-brand-magenta">
                      {icons.seo}
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-muted">Example: Media coverage detected triggers content updates and SEO optimization</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 rounded-lg bg-slate-3/50">
                      <p className="font-medium text-brand-iris mb-1">1. Signal Detected</p>
                      <p className="text-muted text-xs">PR pillar detects trending media coverage about your industry</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-3/50">
                      <p className="font-medium text-brand-amber mb-1">2. Cross-Pillar Analysis</p>
                      <p className="text-muted text-xs">AI evaluates impact on content calendar and SEO targets</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-3/50">
                      <p className="font-medium text-brand-magenta mb-1">3. Coordinated Action</p>
                      <p className="text-muted text-xs">Recommendations surface across all relevant dashboards</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button onClick={goNext} className="btn-primary px-8 py-3">
                    Set My Priorities
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'goals' && (
              <div>
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  What are your primary objectives?
                </h2>
                <p className="text-muted text-center mb-8">
                  Select all that apply. I'll prioritize intelligence streams accordingly.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {goalOptions.map((option) => (
                    <GoalOption
                      key={option.id}
                      id={option.id}
                      label={option.label}
                      description={option.description}
                      icon={option.icon}
                      selected={selectedGoals.includes(option.id)}
                      onToggle={toggleGoal}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    onClick={goNext}
                    disabled={selectedGoals.length === 0}
                    className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                  {selectedGoals.length === 0 && (
                    <p className="text-xs text-muted mt-2">Select at least one objective</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'preferences' && (
              <div>
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Configure Your Preferences
                </h2>
                <div className="max-w-xl mx-auto space-y-8">
                  {/* Risk Tolerance */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Risk Tolerance
                    </label>
                    <p className="text-xs text-muted mb-4">
                      How aggressively should I surface potential risks and opportunities?
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {(['conservative', 'balanced', 'aggressive'] as RiskTolerance[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setRiskTolerance(option)}
                          className={`p-4 rounded-xl border text-center transition-all ${
                            riskTolerance === option
                              ? 'border-brand-cyan bg-brand-cyan/10'
                              : 'border-border-subtle bg-slate-3/30 hover:border-slate-5'
                          }`}
                        >
                          <p className={`font-medium capitalize ${riskTolerance === option ? 'text-brand-cyan' : 'text-white'}`}>
                            {option}
                          </p>
                          <p className="text-xs text-muted mt-1">
                            {option === 'conservative' && 'High-confidence only'}
                            {option === 'balanced' && 'Balanced signals'}
                            {option === 'aggressive' && 'Early indicators'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reporting Cadence */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Reporting Cadence
                    </label>
                    <p className="text-xs text-muted mb-4">
                      How often should I deliver executive summaries and digests?
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {(['daily', 'weekly', 'bi-weekly', 'monthly'] as ReportingCadence[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setReportingCadence(option)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            reportingCadence === option
                              ? 'border-brand-cyan bg-brand-cyan/10'
                              : 'border-border-subtle bg-slate-3/30 hover:border-slate-5'
                          }`}
                        >
                          <p className={`font-medium capitalize text-sm ${reportingCadence === option ? 'text-brand-cyan' : 'text-white'}`}>
                            {option.replace('-', ' ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <button onClick={goNext} className="btn-primary px-8 py-3">
                    Create Organization
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'create-org' && (
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Create Your Organization
                </h2>
                <form onSubmit={handleCreateOrg} className="space-y-6">
                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-white mb-2">
                      Organization Name
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g., Acme Corporation"
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-muted mt-2">
                      This will be your workspace for campaigns and team members.
                    </p>
                  </div>

                  {error && (
                    <div className="alert-error">
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Onboarding Summary */}
                  <div className="panel-card p-4 space-y-3">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">Your Configuration</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Primary Goals:</span>
                        <span className="text-white">{selectedGoals.length} selected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Risk Tolerance:</span>
                        <span className="text-white capitalize">{riskTolerance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Reporting:</span>
                        <span className="text-white capitalize">{reportingCadence.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating || !orgName.trim()}
                    className="btn-primary w-full py-3"
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <AIDot status="analyzing" />
                        <span>Creating...</span>
                      </span>
                    ) : (
                      'Launch Pravado'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
