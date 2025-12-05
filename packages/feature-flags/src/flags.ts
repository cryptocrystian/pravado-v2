/**
 * Feature flag definitions
 * All flags are defined here with their default values
 */

export const FLAGS = {
  // API flags
  ENABLE_API_V2: false,
  ENABLE_RATE_LIMITING: false,
  ENABLE_WEBHOOKS: false,

  // Dashboard flags
  ENABLE_DARK_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_ADVANCED_SEARCH: false,

  // Mobile flags
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BIOMETRICS: false,
  ENABLE_OFFLINE_MODE: false,

  // System flags
  ENABLE_DEBUG_MODE: false,
  ENABLE_MAINTENANCE_MODE: false,
  ENABLE_LLM: true, // S16: LLM router integration (enabled by default, gated by API keys)

  // Billing flags (S28+)
  ENABLE_BILLING_HARD_LIMITS: true, // S29: Hard quota enforcement (throws errors when limits exceeded)
  ENABLE_STRIPE_BILLING: true, // S30: Stripe subscription management and payment processing
  ENABLE_OVERAGE_BILLING: true, // S31: Overage-based billing calculations and tracking
  ENABLE_USAGE_ALERTS: true, // S32: Billing usage alerts and notifications
  ENABLE_ADMIN_INVOICE_SYNC: true, // S34: Manual invoice sync from Stripe (admin feature)

  // Playbook execution flags (S21)
  ENABLE_EXECUTION_STREAMING: true, // S21: Real-time execution updates via SSE

  // Audit logging flags (S35)
  ENABLE_AUDIT_LOGGING: true, // S35: Comprehensive audit logging & compliance ledger
  ENABLE_AUDIT_EXPORTS: true, // S36: Audit log CSV exports and governance UI
  ENABLE_AUDIT_REPLAY: true, // S37: Audit replay engine for state reconstruction

  // PR Generator flags (S38)
  ENABLE_PR_GENERATOR: true, // S38: AI-powered press release generation engine

  // PR Pitch Engine flags (S39)
  ENABLE_PR_PITCH_ENGINE: true, // S39: PR pitch & outreach sequence engine

  // Media Monitoring flags (S40)
  ENABLE_MEDIA_MONITORING: true, // S40: Media monitoring & earned coverage engine

  // Media Crawling flags (S41)
  ENABLE_MEDIA_CRAWLING: true, // S41: Automated media crawling & RSS ingestion

  // Scheduler flags (S42)
  ENABLE_SCHEDULER: true, // S42: Scheduled background tasks & cron jobs

  // Media Alerts flags (S43)
  ENABLE_MEDIA_ALERTS: true, // S43: Media monitoring alerts & smart signals

  // PR Outreach flags (S44)
  ENABLE_PR_OUTREACH: true, // S44: Automated journalist outreach engine

  // PR Outreach Deliverability flags (S45)
  ENABLE_PR_OUTREACH_DELIVERABILITY: true, // S45: Email deliverability & engagement analytics

  // Journalist Graph flags (S46)
  ENABLE_JOURNALIST_GRAPH: true, // S46: Journalist identity graph & contact intelligence

  // AI Media List Builder flags (S47)
  ENABLE_MEDIA_LISTS: true, // S47: AI-powered media list builder with fit scoring

  // Journalist Discovery Engine flags (S48)
  ENABLE_JOURNALIST_DISCOVERY: true, // S48: Automated journalist discovery & enrichment engine

  // Journalist Relationship Timeline flags (S49)
  ENABLE_JOURNALIST_TIMELINE: true, // S49: Journalist relationship timeline & narrative builder

  // Audience Persona Builder flags (S51)
  ENABLE_AUDIENCE_PERSONAS: true, // S51: AI-powered audience persona builder & intelligence engine

  // Media Performance Analytics flags (S52)
  ENABLE_MEDIA_PERFORMANCE: true, // S52: Advanced media performance insights & unified analytics

  // Competitive Intelligence Engine flags (S53)
  ENABLE_COMPETITIVE_INTELLIGENCE: true, // S53: Competitive intelligence engine with comparative analytics

  // Media Briefing & Talking Points flags (S54)
  ENABLE_MEDIA_BRIEFINGS: true, // S54: AI-powered media briefing & executive talking points generator

  // Crisis Response & Escalation Engine flags (S55)
  ENABLE_CRISIS_ENGINE: true, // S55: AI-powered crisis detection, incident management & escalation engine

  // Brand Reputation Intelligence flags (S56)
  ENABLE_BRAND_REPUTATION: true, // S56: Real-time brand reputation scoring & executive radar dashboard

  // Brand Reputation Alerts & Executive Reporting flags (S57)
  ENABLE_BRAND_REPUTATION_ALERTS: true, // S57: Brand reputation alerts & executive reporting engine

  // Governance, Compliance & Audit Intelligence flags (S59)
  ENABLE_GOVERNANCE: true, // S59: Governance, compliance & audit intelligence engine

  // Executive Risk Radar & Predictive Crisis Forecasting flags (S60)
  ENABLE_RISK_RADAR: true, // S60: Executive risk radar & predictive crisis forecasting engine

  // Executive Command Center & Cross-System Insights flags (S61)
  ENABLE_EXECUTIVE_COMMAND_CENTER: true, // S61: Executive command center & cross-system insights engine

  // Executive Digest Generator flags (S62)
  ENABLE_EXEC_DIGESTS: true, // S62: Automated strategic briefs & exec weekly digest generator

  // Executive Board Report Generator flags (S63)
  ENABLE_EXEC_BOARD_REPORTS: true, // S63: Board reporting & quarterly executive pack generator

  // Investor Relations Pack & Earnings Narrative Engine flags (S64)
  ENABLE_INVESTOR_RELATIONS: true, // S64: Investor relations pack & earnings narrative engine

  // Strategic Intelligence Narrative Engine flags (S65)
  ENABLE_STRATEGIC_INTELLIGENCE: true, // S65: AI-powered CEO-level strategic intelligence narrative engine

  // Unified Intelligence Graph flags (S66)
  ENABLE_UNIFIED_INTELLIGENCE_GRAPH: true, // S66: Global insight fabric & unified intelligence graph engine

  // Scenario Playbook Orchestration flags (S67)
  ENABLE_SCENARIO_PLAYBOOK: true, // S67: Scenario simulation & autonomous playbook orchestration engine

  // Unified Narrative Generator V2 flags (S70)
  ENABLE_UNIFIED_NARRATIVE_V2: true, // S70: Cross-domain synthesis engine for multi-layer narrative documents

  // AI Scenario Simulation Engine flags (S71)
  ENABLE_AI_SCENARIO_SIMULATIONS: true, // S71: Autonomous multi-agent scenario simulation engine

  // Scenario Orchestration Engine flags (S72)
  ENABLE_SCENARIO_ORCHESTRATION: true, // S72: Multi-scenario orchestration & conditional branching engine

  // Reality Maps Engine flags (S73)
  ENABLE_REALITY_MAPS: true, // S73: AI-driven multi-outcome reality maps engine

  // Insight Conflict Resolution Engine flags (S74)
  ENABLE_INSIGHT_CONFLICTS: true, // S74: Autonomous insight conflict resolution engine
} as const;

export type FlagName = keyof typeof FLAGS;
export type FlagValue = (typeof FLAGS)[FlagName];
