# PRAVADO MASTER IMPLEMENTATION SPECIFICATION
## Complete Development Reference - v1.3a Handoff + Features + Business Logic

---

## 📋 **DOCUMENT PURPOSE**

This is the **single, comprehensive reference document** for all PRAVADO development. It combines:
- ✅ **v1.3a Handoff Specifications** - Exact design system and components
- ✅ **Technical Architecture** - Backend, database, and infrastructure  
- ✅ **Complete Feature Specifications** - Business logic and AI algorithms
- ✅ **User Workflows** - Detailed processes for all 11 roles
- ✅ **Quality Framework** - Validation checklists and success criteria

**Last Updated**: January 15, 2025  
**Version**: Master v1.0  
**Status**: Single Source of Truth

---

# SECTION 1: PROJECT OVERVIEW & HANDOFF INTEGRATION

## 🏗️ **PROJECT OVERVIEW**

### **Mission Statement**
Build PRAVADO as the world's first automation-first marketing intelligence platform combining Content Marketing + Public Relations + SEO Intelligence with revolutionary AI platform citation tracking (GEO).

### **Core Value Propositions**
1. **34K+ Journalist Database** - Most comprehensive media contact intelligence
2. **Cross-Pillar Attribution** - Unified Content + PR + SEO campaign tracking  
3. **GEO Citation Tracking** - AI platform dominance monitoring (ChatGPT, Claude, Perplexity, Gemini)
4. **Automation-First Workflow** - AI drives strategy, humans provide intelligent oversight
5. **Role-Based Intelligence** - 11 user types with adaptive interfaces


# SECTION 2: COMPONENT SPECIFICATIONS

## 🧩 **HANDOFF COMPONENT SPECIFICATIONS (EXACT NAMES)**

### **Core Components - MANDATORY Names and Interfaces**

#### **ProposalCard (Primary Interface Component)**
```tsx
interface ProposalCardProps {
  id: string;
  pillar: 'content' | 'pr' | 'seo';
  title: string;
  summary?: string;
  confidence: number;        // 0.0 to 1.0
  impact: number;            // 0.0 to 1.0
  diffUrl?: string;          // link to DiffViewer
  risk: 'internal' | 'external';
  gate: 'auto' | 'confirm';
  onApprove?: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
}

// CRITICAL: Must dominate 70% of visual hierarchy
// Usage from handoff documentation
<ProposalCard 
  id="p1"
  pillar="content"
  title="Refresh cornerstone article"
  confidence={0.92}
  impact={0.18}
  gate="confirm"
  risk="external"
  diffUrl="#"
/>
```

#### **ApprovalConfirmModal + HoldToConfirmButton**
```tsx
interface ApprovalConfirmModalProps {
  open: boolean;
  actionTitle: string;
  diffUrl?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  duration?: number; // Default 1200ms from handoff
}

// MANDATORY: Hold-to-confirm for all sensitive actions
<HoldToConfirmButton 
  onConfirm={handleConfirm}
  duration={1200}
/>
```

#### **Complete Handoff Component Set (EXACT NAMES)**
1. `ProposalCard` - Primary interface component
2. `ApprovalConfirmModal` - Sensitive action confirmation
3. `HoldToConfirmButton` - Hold-to-confirm pattern (1.2s)
4. `KbdHints` - Keyboard shortcuts display (A/S/E/D/B)
5. `AdjustPlanPanel` - Plan modification interface
6. `BatchQueueTable` - Bulk operations management
7. `DiffViewer` - Change visualization
8. `PublishingCalendar` - Content scheduling
9. `AppShell` - Layout container
10. `AppShellSidebar` - Navigation sidebar
11. `AppTopbar` - Top navigation bar

---

# SECTION 3: PAGE ARCHITECTURE

## 📄 **OFFICIAL PAGE COMPOSITIONS (EXACT STRUCTURE)**

### **Page Structure from Handoff**
```typescript
// Exact page exports from handoff package
export { default as DailyBrief } from '@/ui/react/src/pages/DailyBrief';             
export { default as Queue } from '@/ui/react/src/pages/Queue';                  
export { default as ContentEditor } from '@/ui/react/src/pages/ContentEditor';          
export { default as BriefBuilderPage } from '@/ui/react/src/pages/BriefBuilderPage';       
export { default as PublishingCalendarPage } from '@/ui/react/src/pages/PublishingCalendarPage'; 
export { default as MediaIntelligenceCenter } from '@/ui/react/src/pages/MediaIntelligenceCenter';
export { default as PitchComposerPage } from '@/ui/react/src/pages/PitchComposerPage';      
export { default as OutreachSchedulePage } from '@/ui/react/src/pages/OutreachSchedulePage';   
export { default as PitchTrackerPage } from '@/ui/react/src/pages/PitchTrackerPage';
```

### **DailyBrief Page (Primary Landing)**
```tsx
// From handoff specifications - EXACT STRUCTURE
const DailyBrief = () => (
  <AppShell>
    <div className="space-y-6">
      <KpiRibbon /> {/* 4-column metrics from handoff */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ProposalCard impact="high" confidence={0.92} />
          <ProposalCard impact="medium" confidence={0.86} />
        </div>
        <div>
          <AdjustPlanPanel />
          <KbdHints />
        </div>
      </div>
    </div>
  </AppShell>
);
```

### **Queue Page (Batch Operations)**
```tsx
const Queue = () => (
  <AppShell>
    <BatchQueueTable 
      rows={proposals}
      onApprove={handleBatchApprove}
      onSnooze={handleBatchSnooze}
    />
  </AppShell>
);
```

### **ContentEditor Page (Light Theme Island)**
```tsx
const ContentEditor = () => (
  <AppShell>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="island p-3"> {/* Light background for editing */}
          <input className="w-full card p-2 mb-2" placeholder="Title" />
          <textarea className="w-full h-72 card p-2" />
        </div>
      </div>
      <div>
        <SEOChecksPanel />
        <PublishingOptions />
      </div>
    </div>
  </AppShell>
);
```

---

# SECTION 4: STATE MANAGEMENT

## 🔧 **ZUSTAND PATTERN (MANDATORY)**

### **State Management from Handoff**
```typescript
// From handoff implementation kit - EXACT PATTERN
import { create } from 'zustand';

interface BriefStore {
  proposals: AgentProposal[];
  approve: (id: string) => void;
  snooze: (id: string) => void;
  decline: (id: string) => void;
  load: (rows: AgentProposal[]) => void;
}

export const useBrief = create<BriefStore>((set) => ({
  proposals: [],
  approve: (id) => set((s) => ({ 
    proposals: s.proposals.filter(p => p.id !== id) 
  })),
  snooze: (id) => set((s) => ({ 
    proposals: s.proposals.filter(p => p.id !== id) 
  })),
  decline: (id) => set((s) => ({ 
    proposals: s.proposals.filter(p => p.id !== id) 
  })),
  load: (rows) => set({ proposals: rows }),
}));
```

### **Keyboard Shortcuts Hook**
```typescript
// From handoff - MANDATORY A/S/E/D/B shortcuts
export function useShortcuts(map: Partial<Record<'A'|'S'|'E'|'D'|'B', () => void>>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase() as keyof typeof map;
      if (map[k]) { 
        e.preventDefault(); 
        map[k]!(); 
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map]);
}
```

---

# SECTION 5: TECHNICAL ARCHITECTURE

## 🏗️ **TECHNOLOGY STACK**

### **Frontend Architecture (Handoff + Supabase)**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand (from handoff specifications)
- **Framework**: Next.js App Router
- **Component Library**: Exact handoff components + PRAVADO enhancements

### **Backend Architecture (Existing)**
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with Row Level Security
- **AI Services**: OpenAI, Anthropic Claude, Perplexity, Gemini
- **Deployment**: Lovable.dev platform

### **Database Schema (Core Tables)**
```sql
-- Multi-tenant with Row Level Security
tenants (id, name, domain, settings, created_at)
user_profiles (id, tenant_id, role, tier, full_name, email, permissions, created_at)
journalist_contacts (id, tenant_id, first_name, last_name, email, outlet, ai_match_score, relationship_score)
campaigns (id, tenant_id, name, type, status, goals, budget, created_by, created_at)
content_pieces (id, tenant_id, campaign_id, title, content, content_type, status, seo_data)
ai_citation_queries (id, tenant_id, query_text, ai_platform, citation_context, ranking_position)
```

### **File Structure**
```
src/
├── components/
│   ├── handoff/                    # Exact handoff components
│   │   ├── ProposalCard.tsx
│   │   ├── ApprovalConfirmModal.tsx
│   │   └── HoldToConfirmButton.tsx
│   ├── pravado/                    # PRAVADO enhancements
│   │   ├── MarketingIntelligence.tsx
│   │   └── CrossPillarAttribution.tsx
│   └── layout/
│       ├── AppShell.tsx
│       └── Navigation.tsx
├── pages/                          # Handoff page compositions
│   ├── DailyBrief.tsx
│   ├── Queue.tsx
│   └── ContentEditor.tsx
├── hooks/                          # Custom hooks
│   ├── useBrief.ts                 # Zustand store
│   ├── useShortcuts.ts             # Keyboard shortcuts
│   └── useJournalists.ts           # Supabase integration
├── services/
│   ├── aiService.ts
│   └── mediaService.ts
└── types/
    ├── handoff.ts                  # Handoff component types
    └── pravado.ts                  # PRAVADO enhancements
```

---

# SECTION 6: FEATURE SPECIFICATIONS

## 🎯 **CORE FEATURE SPECIFICATIONS**

### **1. AI-Powered Proposal Generation System**

#### **ProposalCard Intelligence Engine**
```typescript
interface ProposalGenerationEngine {
  // Content Intelligence
  generateContentProposals: (userContext: UserContext) => Promise<ContentProposal[]>;
  analyzeContentPerformance: (content: ContentPiece) => ContentAnalysis;
  suggestContentOptimization: (content: ContentPiece) => OptimizationSuggestion[];
  
  // PR Intelligence  
  generatePRProposals: (campaign: Campaign) => Promise<PRProposal[]>;
  matchJournalists: (content: ContentPiece) => JournalistMatch[];
  analyzePitchSuccess: (pitch: PRPitch) => SuccessProbability;
  
  // SEO Intelligence
  generateSEOProposals: (content: ContentPiece) => Promise<SEOProposal[]>;
  analyzeKeywordOpportunities: (industry: string) => KeywordOpportunity[];
  trackGEOCitations: (query: string) => CitationData[];
  
  // Integrated Campaign Intelligence
  generateCrossPillarProposals: (objectives: CampaignObjectives) => IntegratedProposal[];
  calculateAttribution: (campaign: Campaign) => AttributionAnalysis;
  predictCampaignROI: (proposal: IntegratedProposal) => ROIProjection;
}
```

#### **Confidence Scoring Algorithm**
```typescript
interface ConfidenceCalculation {
  factors: {
    historicalPerformance: number;    // 0.0-1.0 (30% weight)
    audienceAlignment: number;        // 0.0-1.0 (25% weight)
    competitiveAnalysis: number;      // 0.0-1.0 (20% weight)
    resourceAvailability: number;     // 0.0-1.0 (15% weight)
    marketTiming: number;             // 0.0-1.0 (10% weight)
  };
  
  // Implementation formula
  confidence = (
    historicalPerformance * 0.30 +
    audienceAlignment * 0.25 +
    competitiveAnalysis * 0.20 +
    resourceAvailability * 0.15 +
    marketTiming * 0.10
  );
}
```

### **2. 200K+ Journalist Database Intelligence**

#### **Journalist Matching Algorithm**
```typescript
interface JournalistMatchingSystem {
  // Core matching engine
  findMatches: (content: ContentPiece, criteria: MatchCriteria) => JournalistMatch[];
  
  // Matching criteria weights
  criteria: {
    beatAlignment: number;            // Topic/industry relevance (40% weight)
    outletReach: number;             // Publication audience size (25% weight)
    relationshipHealth: number;       // Previous interaction success (20% weight)
    contentStyle: number;            // Writing style compatibility (10% weight)
    geographicRelevance: number;     // Location/market relevance (5% weight)
  };
  
  // AI-powered features
  generatePersonalizedPitch: (journalist: JournalistContact, content: ContentPiece) => PersonalizedPitch;
  predictResponseProbability: (pitch: PersonalizedPitch) => ResponseProbability;
  suggestOptimalTiming: (journalist: JournalistContact) => OptimalOutreachTiming;
}
```

### **3. Cross-Pillar Attribution System**

#### **Unified Campaign Tracking**
```typescript
interface CrossPillarAttribution {
  // Attribution models
  models: {
    firstTouch: 'First pillar interaction gets 100% credit';
    lastTouch: 'Last pillar interaction gets 100% credit';
    linear: 'Equal credit across all pillar touchpoints';
    timeDecay: 'More recent touchpoints get higher credit';
    positionBased: '40% first, 40% last, 20% middle';
    dataDriven: 'ML-based attribution using conversion patterns';
  };
  
  // Campaign journey tracking
  trackCampaignJourney: (campaignId: string) => CampaignJourney;
  calculatePillarContribution: (campaign: Campaign) => PillarContribution;
  attributeRevenue: (revenue: number, campaign: Campaign) => RevenueAttribution;
}
```

### **4. GEO (Generative Engine Optimization) Intelligence**

#### **AI Platform Citation Tracking**
```typescript
interface GEOIntelligenceSystem {
  // Platform monitoring
  platforms: ['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot'];
  
  // Citation tracking capabilities
  trackCitations: (query: string, platforms: AIPlatform[]) => CitationResults[];
  analyzeCitationContext: (citation: Citation) => ContextAnalysis;
  calculateCitationQuality: (citation: Citation) => QualityScore;
  
  // Competitive analysis
  trackCompetitorCitations: (competitors: string[]) => CompetitorCitationData;
  identifyContentGaps: (industry: string) => ContentGapAnalysis;
  suggestOptimizationStrategies: (currentPerformance: GEOPerformance) => OptimizationStrategy[];
}
```

---

# SECTION 7: USER ROLE SYSTEM

## 👥 **11 USER ROLE DEFINITIONS**

### **Agency Tier**
1. **Agency Owner** - Full platform access + client management
2. **Agency Admin** - Client management + team oversight  
3. **Account Manager** - Client-specific access + reporting

### **Enterprise Team Tier**
4. **Marketing Director** - Strategic oversight + team management
5. **Content Manager** - Content creation + editorial workflows
6. **PR Manager** - Media relations + journalist database
7. **SEO Specialist** - Technical SEO + GEO intelligence
8. **Team Member** - Task execution + collaboration

### **Enterprise Client Tier**
9. **Enterprise Admin** - Security + compliance + audit
10. **Department Head** - Cross-functional coordination
11. **Specialist** - Subject matter expertise

### **Self-Service Tier**
12. **Business Owner** - Strategic + ROI optimization (SMB)
13. **Marketing Manager** - Campaign execution + optimization
14. **Freelancer** - Project delivery + portfolio

### **Role-Based Landing Page Mapping**
- **Marketing Director / Business Owner** → DailyBrief (strategic oversight)
- **Content Manager** → ContentEditor (production focus)
- **PR Manager** → MediaIntelligenceCenter (journalist database)
- **SEO Specialist** → SEO tools + GEO citation tracking
- **Team Members** → Queue (task execution)

---

# SECTION 8: PRAVADO STRATEGIC ENHANCEMENTS

## 🚀 **ENHANCED COMPONENTS FOR MARKETING INTELLIGENCE**

### **Enhanced ProposalCard for PRAVADO**
```tsx
// Extend handoff ProposalCard with PRAVADO business logic
interface PRAVADOProposalProps extends ProposalCardProps {
  // Marketing Intelligence Enhancements
  pillar: 'content' | 'pr' | 'seo' | 'integrated'; // Add integrated campaigns
  marketingContext?: {
    audienceMatch: number;        // AI audience compatibility score
    competitiveAdvantage: number; // Market positioning advantage
    trendAlignment: number;       // Industry trend alignment
    crossPillarImpact: number;    // Multi-pillar campaign potential
  };
  
  // Cross-Pillar Integration Data
  citationOpportunities?: number;     // GEO platform citation potential
  journalistTargets?: JournalistMatch[]; // PR database matches
  seoKeywords?: KeywordOpportunity[];    // SEO optimization opportunities
  
  // Business Context
  revenueImpact?: number;         // Projected revenue impact
  executionComplexity?: 'low' | 'medium' | 'high';
  timeToValue?: number;           // Days to measurable results
}
```

### **Enhanced MediaIntelligenceCenter**
```tsx
// Enhance handoff MediaIntelligenceCenter with PRAVADO's journalist database
const MediaIntelligenceCenter = () => {
  const { journalists } = useJournalists(); // 34K+ contacts
  
  return (
    <div className="space-y-6">
      <JournalistSearch database={journalists} />
      <div className="grid grid-cols-4 gap-4">
        {journalists.map(j => (
          <MediaContactCard
            key={j.id}
            name={j.name}
            outlet={j.outlet}
            aiMatchScore={j.ai_match_score}
            relationshipHealth={j.relationship_score}
            recentActivity={j.recent_coverage}
            beats={j.beat}
          />
        ))}
      </div>
      
      <ProposalCard
        id="pr-opp-1"
        pillar="pr"
        title="High-Match Journalist Outreach"
        confidence={0.89}
        impact={0.15}
        gate="confirm"
        risk="external"
        journalistTargets={journalists.filter(j => j.ai_match_score > 0.8)}
      />
    </div>
  );
};
```

---

# SECTION 9: WORKFLOW SPECIFICATIONS

## 🔄 **ROLE-BASED WORKFLOWS**

### **Marketing Director Workflow**
```typescript
interface MarketingDirectorWorkflows {
  // Daily intelligence brief
  dailyIntelligenceBrief: () => {
    crossPillarPerformance: CrossPillarMetrics;
    aiRecommendations: StrategicRecommendation[];
    teamProductivity: TeamProductivityMetrics;
    budgetUtilization: BudgetUtilizationReport;
    competitiveIntelligence: CompetitiveInsights;
  };
  
  // Strategic approval workflows
  campaignApprovalFlow: (campaign: Campaign) => ApprovalWorkflow;
  budgetReallocationFlow: (request: BudgetRequest) => ApprovalWorkflow;
  teamResourceAllocation: (request: ResourceRequest) => ApprovalWorkflow;
}
```

### **Content Manager Workflow**
```typescript
interface ContentManagerWorkflows {
  // AI-assisted content creation
  aiAssistedContentCreation: (brief: ContentBrief) => {
    contentOutline: ContentOutline;
    seoOptimizations: SEOOptimization[];
    prAngles: PRAngle[];
    distributionStrategy: DistributionPlan;
  };
  
  // Content performance optimization  
  contentPerformanceAnalysis: (content: ContentPiece) => PerformanceAnalysis;
  crossPillarImpactTracking: (content: ContentPiece) => CrossPillarImpact;
}
```

### **PR Manager Workflow**
```typescript
interface PRManagerWorkflows {
  // Journalist outreach workflow
  journalistOutreachWorkflow: (campaign: PRCampaign) => {
    targetJournalists: JournalistMatch[];
    personalizedPitches: PersonalizedPitch[];
    outreachTimeline: OutreachSchedule;
    followUpStrategy: FollowUpPlan;
  };
  
  // Coverage impact analysis
  coverageImpactAnalysis: (coverage: MediaCoverage[]) => ImpactAnalysis;
  relationshipHealthMonitoring: () => RelationshipHealthReport;
}
```

---

# SECTION 10: MOBILE EXPERIENCE

## 📱 **MOBILE EXECUTIVE INTERFACE**

### **Touch-Optimized ProposalCard**
```tsx
<ProposalCard
  // Handoff foundation
  id="mobile-proposal"
  pillar="integrated"
  confidence={0.94}
  impact={0.23}
  gate="confirm"
  
  // Mobile adaptations
  className="touch-optimized" // 44px minimum touch targets
  onSwipeRight={handleApprove}
  onSwipeLeft={handleDecline}
  
  // Executive context
  executiveContext={{
    revenueImpact: 25000,
    timeToValue: 7,
    riskLevel: 'low'
  }}
/>
```

### **Executive Approval Interface**
```typescript
interface ExecutiveApprovalInterface {
  // Streamlined proposal presentation
  executiveProposalView: (proposal: Proposal) => {
    executiveSummary: ExecutiveSummary;
    keyMetrics: KeyMetric[];
    riskAssessment: RiskAssessment;
    recommendedAction: RecommendedAction;
    oneClickActions: ExecutiveAction[];
  };
  
  // Touch gestures
  swipeGestures: {
    swipeRight: 'approve_proposal';
    swipeLeft: 'decline_proposal';
    swipeUp: 'view_details';
    swipeDown: 'dismiss_notification';
  };
}
```

---

# SECTION 11: QUALITY FRAMEWORK

## ✅ **IMPLEMENTATION VALIDATION FRAMEWORK**

### **Phase 1: Handoff Foundation Validation (MANDATORY)**
- [ ] **theme.dark.ink.css imported** globally
- [ ] **All handoff components** implemented exactly as specified
- [ ] **Page compositions** match handoff structure
- [ ] **Zustand state management** functional
- [ ] **Keyboard shortcuts** (A/S/E/D/B) operational
- [ ] **HoldToConfirmButton** implemented for sensitive actions
- [ ] **ARIA compliance** achieved

### **Phase 2: PRAVADO Integration Validation**  
- [ ] **34K+ journalist database** accessible through MediaIntelligenceCenter
- [ ] **Cross-pillar proposals** showing unified campaign data
- [ ] **GEO citation tracking** integrated with confidence scoring
- [ ] **Role-based navigation** and content adaptation working
- [ ] **Marketing intelligence data** enhancing proposals
- [ ] **Mobile optimization** with touch-friendly interactions

### **Phase 3: Enterprise Quality Validation**
- [ ] **Professional appearance** supporting premium pricing
- [ ] **Zero broken workflows** or incomplete features
- [ ] **Performance under 2 seconds** page load times
- [ ] **Comprehensive error handling** and offline capabilities
- [ ] **Security compliance** with multi-tenant isolation
- [ ] **Scalability for enterprise** team collaboration

---

# SECTION 12: SUCCESS METRICS

## 🎯 **SUCCESS CRITERIA BY CATEGORY**

### **Technical Success Metrics**
- **100% handoff compliance** - No specification violations
- **Zero TypeScript errors** - Clean build process
- **<2 second page loads** - Performance optimization
- **WCAG 2.1 AA compliance** - Full accessibility
- **Mobile optimization** - Touch-friendly interactions

### **AI Intelligence Success Metrics**
- **Proposal Relevance**: >85% user approval rate for AI-generated proposals
- **Confidence Accuracy**: Confidence scores correlate with actual performance (R² >0.8)
- **Time Savings**: 70% reduction in manual campaign planning time
- **ROI Prediction**: Forecast accuracy within 15% of actual results

### **Journalist Database Success Metrics**
- **Match Quality**: >90% relevance for top 10 journalist matches
- **Response Rate**: 25% improvement in journalist response rates
- **Relationship Health**: Quantifiable relationship scoring accuracy
- **Database Utilization**: >60% of campaigns use journalist recommendations

### **Cross-Pillar Attribution Success Metrics**
- **Attribution Accuracy**: Multi-touch attribution within 10% of actual contribution
- **Campaign Insights**: Actionable insights for 95% of tracked campaigns
- **ROI Visibility**: Complete revenue attribution across all pillars
- **Optimization Impact**: 20% improvement in campaign efficiency

---

# SECTION 13: IMPLEMENTATION ROADMAP

## 📋 **PHASE-BY-PHASE IMPLEMENTATION PLAN**

### **Pre-Development Setup**
- [ ] Repository cloned and dependencies installed
- [ ] Handoff assets copied from `PRAVADO_Handoff_v1_3a`
- [ ] Environment variables configured (OpenAI, Anthropic, etc.)
- [ ] Database schema verified in Supabase
- [ ] AI service API keys tested

### **Phase 1: Handoff Foundation (Sessions 1-2)**
```bash
# Import handoff assets
cp -r C:\Users\cdibr\Downloads\PRAVADO_Handoff_v1_3a\css ./src/styles/
cp -r C:\Users\cdibr\Downloads\PRAVADO_Handoff_v1_3a\react ./src/components/handoff/
cp C:\Users\cdibr\Downloads\PRAVADO_Handoff_v1_3a\tailwind\tailwind.config.cjs ./

# Install dependencies
npm i zustand clsx

# Import theme
echo "@import './styles/theme.dark.ink.css';" >> src/app/globals.css
```

**Phase 1 Checklist:**
- [ ] Core components implemented (ProposalCard, ApprovalConfirmModal, HoldToConfirmButton)
- [ ] Page structures created (DailyBrief, Queue, ContentEditor)
- [ ] Zustand state management setup
- [ ] Keyboard shortcuts implemented (A/S/E/D/B)
- [ ] Basic navigation and routing functional

### **Phase 2: PRAVADO Integration (Sessions 3-4)**
- [ ] Supabase data integration with handoff components
- [ ] 34K+ journalist database connected to MediaIntelligenceCenter
- [ ] Cross-pillar attribution system implemented
- [ ] GEO citation tracking integrated
- [ ] Role-based navigation and content adaptation
- [ ] AI services integration for proposal generation

### **Phase 3: Enterprise Polish (Sessions 5-6)**
- [ ] Mobile executive interface optimization
- [ ] Performance optimization and caching
- [ ] Advanced error handling and offline capabilities
- [ ] Team collaboration workflows
- [ ] Security and compliance validation
- [ ] Final quality assurance and testing

---

# SECTION 14: NON-NEGOTIABLE REQUIREMENTS

## 🔒 **CRITICAL REQUIREMENTS - NO EXCEPTIONS**

### **Handoff Compliance (MANDATORY)**
1. **Use EXACT component names** - ProposalCard (not AIRecommendationCard)
2. **Import theme.dark.ink.css** - No custom color systems
3. **Follow page compositions** - DailyBrief, Queue, ContentEditor structure
4. **Implement Zustand state management** - As specified in handoff
5. **Include keyboard shortcuts** - A/S/E/D/B functionality
6. **HoldToConfirmButton for sensitive actions** - Publishing, outreach, campaigns
7. **ARIA compliance** - Proper accessibility attributes

### **PRAVADO Strategic Requirements**
1. **34K+ journalist database** - Real Supabase data integration
2. **Cross-pillar attribution** - Unified Content + PR + SEO tracking
3. **GEO citation tracking** - AI platform dominance monitoring
4. **Role-based adaptations** - 11 user types with contextual interfaces
5. **Mobile executive experience** - Touch-optimized approval workflows
6. **Enterprise quality** - Supporting $299-$2,999 pricing tiers

### **NEVER DO THESE THINGS**
- ❌ **Modify handoff component names** - Use exact specifications
- ❌ **Create custom color systems** - Use theme.dark.ink.css only
- ❌ **Skip HoldToConfirmButton** - Required for sensitive actions
- ❌ **Ignore keyboard shortcuts** - A/S/E/D/B must work
- ❌ **Use mock data** - Connect real Supabase data
- ❌ **Skip ARIA attributes** - Accessibility is mandatory

### **ALWAYS DO THESE THINGS**
- ✅ **Reference this document** - Single source of truth
- ✅ **Follow handoff specifications exactly** - Zero interpretations
- ✅ **Enhance with PRAVADO context** - Don't replace, enhance
- ✅ **Test on mobile devices** - Executive experience critical
- ✅ **Validate quality gates** - Use provided checklists

---

# SECTION 15: DEVELOPMENT WORKFLOW

## 🔧 **HOW TO USE THIS DOCUMENT**

### **Start Every Development Session:**
1. **Reference this master document** for all specifications
2. **Review current phase** implementation checklist
3. **Validate against handoff specifications** before proceeding
4. **Check quality gates** for completed work

### **During Development:**
- **Component decisions** → Section 2 (Component Specifications)
- **Page structure** → Section 3 (Page Architecture)
- **State management** → Section 4 (State Management)
- **Feature logic** → Section 6 (Feature Specifications)
- **User workflows** → Section 9 (Workflow Specifications)
- **Quality validation** → Section 11 (Quality Framework)

### **Component Enhancement Strategy:**
```typescript
// 1. Implement exact handoff component first
<ProposalCard 
  // Handoff required props
  id="p1"
  pillar="content"
  confidence={0.92}
  impact={0.18}
  gate="confirm"
/>

// 2. Then enhance with PRAVADO business logic
<ProposalCard 
  // Handoff props
  id="p1"
  pillar="integrated"
  confidence={0.92}
  impact={0.18}
  gate="confirm"
  
  // PRAVADO enhancements
  marketingContext={{
    audienceMatch: 0.91,
    crossPillarImpact: 0.89
  }}
  citationOpportunities={47}
  journalistTargets={matchedJournalists}
  revenueImpact={15000}
/>
```

---

## 🎯 **READY FOR IMPLEMENTATION**

This master document provides **complete, comprehensive specifications** for implementing PRAVADO:

✅ **v1.3a Handoff Integration** - Exact design system and component specifications  
✅ **Technical Architecture** - Backend, database, and infrastructure requirements  
✅ **Complete Feature Specifications** - AI algorithms, business logic, and workflows  
✅ **User Role System** - 11 roles with detailed workflow requirements  
✅ **Quality Framework** - Phase-by-phase validation checklists  
✅ **Implementation Roadmap** - Step-by-step development plan  
✅ **Mobile Experience** - Executive approval interface specifications  
✅ **Success Metrics** - Measurable criteria for each feature category

**This single document contains everything needed for Claude Code to transform PRAVADO from existing foundation into a revenue-ready, enterprise-grade marketing intelligence platform.**

---

*Document Version: Master v1.0*  
*Last Updated: January 15, 2025*  
*Status: Single Source of Truth - Ready for Implementation*