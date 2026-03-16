# Onboarding — Gap Analysis & Redesign Brief
**Status:** Tabled — do not build until flagged  
**Priority:** High (conversion-critical)  
**Filed:** February 2026  
**References:** Sprint S93 (original build), `/apps/dashboard/src/app/onboarding/ai-intro/page.tsx`

---

## Current State

A 6-step linear onboarding wizard was built in Sprint S93 at `/onboarding/ai-intro`. It exists and routes correctly. It captures:
- Primary goals (6 options: PR, Content, SEO, Crisis, Investor, Executive)
- Risk tolerance (conservative / balanced / aggressive)
- Reporting cadence (daily / weekly / bi-weekly / monthly)
- Organization name

This data is saved to `localStorage` as `pravado_onboarding_context` and passed to the `/api/orgs` POST as `metadata.onboardingContext`.

**The flow ends and the user lands in an empty dashboard. Nothing downstream consumes the onboarding data to pre-populate any workspace.**

---

## Gaps vs. Original Vision

### 1. No Current-State Discovery
The original plan required the onboarding to interactively learn about the user's *existing situation* before building a plan. This means:
- What domain/brand are they working with?
- What PR coverage do they currently have (if any)?
- What tools are they replacing or running alongside?
- What does their current content output look like?
- Are they starting from zero or migrating an existing program?

None of this is asked or captured. The flow goes straight to abstract goals.

### 2. No Competitive Intelligence Pull
A core differentiator in the original spec: during onboarding, the user names 2–3 competitors and Pravado immediately runs a real competitive snapshot — share of voice, coverage tier comparison, keyword gap, CiteMind score if available. The user sees *their competitive position* before they've done anything. This is a conversion moment: they understand their gap and Pravado is already working.

Currently: competitors are never asked for.

### 3. No Initial Plan Generation
The original vision: onboarding ends with SAGE generating a **first 30-day plan** based on everything captured — goals, current state, competitive gaps, industry. The user lands in the dashboard with a pre-populated action plan, not an empty workspace.

Currently: `onboardingContext` is stored but no plan generation call is made. The downstream SAGE integration is entirely absent.

### 4. No "Wow Factor" Conversion Moment
The free-to-paid conversion driver was meant to be the moment the user sees their competitive gap and the initial plan side-by-side — "here's where you are, here's where you could be, here's the first 30 days." That moment doesn't exist. The current flow ends with "Launch Pravado" → empty dashboard.

### 5. Missing Data Points for Meaningful Personalization
The current flow captures goal category and risk tolerance but not:
- Industry / vertical
- Company size / team size
- Brand name + domain (for media monitoring seeding)
- Target audience
- Geographic focus
- Budget signal (for plan calibration)
- Urgency / timeline ("launching a product in 60 days" vs. "building long-term authority")

---

## Redesign Direction (When Unblocked)

### Phase 1: Discovery (3–4 steps, conversational)
Replace the static step cards with a conversational interface. The AI asks questions, the user answers. Each answer narrows the next question.

Key questions:
1. "What's your brand and domain?" → seeds monitoring, pulls initial coverage snapshot in background
2. "Who are your top 2–3 competitors?" → triggers competitive pull (coverage tier, keyword gap)
3. "What's your biggest challenge right now?" → freeform, sentiment-analyzed to map to pillar priorities
4. "Have you done PR/content/SEO before, or starting fresh?" → calibrates plan complexity

### Phase 2: Live Intelligence Moment (the wow)
While the user completes discovery, run in background:
- Media monitoring seed for their domain
- Competitive share-of-voice snapshot (lightweight, real data)
- CiteMind score for their domain if indexable
- Keyword gap preview (top 3 gaps vs. named competitor)

When they reach the "here's what we found" screen, show real data — even if partial. A spinner that resolves into actual numbers about their brand creates the conversion moment.

### Phase 3: Initial Plan Generation
SAGE generates a 30-day kickoff plan based on all captured data:
- 3–5 prioritized actions per active pillar
- First pitch target suggestions (if PR selected)
- Content calendar seed (if Content selected)
- Keyword cluster starting point (if SEO selected)

User lands in dashboard with this plan visible in the Command Center, not an empty workspace.

### Phase 4: Org Creation (reduced friction)
Move org naming to the *end* and reduce it to a single field. By this point the user has seen enough value that commitment is lower-friction.

---

## Technical Dependencies

| Dependency | Status | Notes |
|---|---|---|
| SAGE plan generation endpoint | Unknown | Needs audit — may exist as stub |
| Media monitoring seed API | Unknown | Check `/api/monitoring/seed` |
| Competitive snapshot API | Unknown | Likely not built for onboarding use case |
| CiteMind domain scoring | Unknown | Check CiteMind API surface |
| Onboarding context → Command Center | Not built | Needs new consumer in CC shell |
| Conversational step UI component | Not built | Would need new component, not current step pattern |

---

## Onboarding Context Schema (Expanded, when built)

```typescript
interface OnboardingContextV2 {
  // Basic
  primaryGoals: PrimaryGoal[];
  riskTolerance: RiskTolerance;
  reportingCadence: ReportingCadence;

  // Discovery (new)
  brandName: string;
  domain: string;
  industry: string;
  teamSize: 'solo' | 'small' | 'medium' | 'enterprise';
  maturityLevel: 'starting_fresh' | 'some_experience' | 'scaling_existing';
  urgency: string; // freeform or categorized
  geographicFocus: string[];
  competitors: string[]; // domain or brand name

  // Intelligence snapshot (captured async during flow)
  competitiveSnapshot?: {
    capturedAt: string;
    brandCoverageCount: number;
    topCompetitorGap: { competitor: string; gapScore: number };
    keywordGapCount: number;
    citeMindScore?: number;
  };

  // Plan seed
  initialPlanGenerated: boolean;
  initialPlanId?: string;

  completedAt: string;
  version: 2;
}
```

---

## Files to Modify When Unblocked

- `/apps/dashboard/src/app/onboarding/ai-intro/page.tsx` — full redesign
- `/apps/dashboard/src/app/onboarding/page.tsx` — routing logic update
- `/apps/dashboard/src/components/command-center/` — consume initial plan from onboarding context
- `/api/orgs` route — pass expanded context, trigger plan generation
- New: `/api/onboarding/competitive-snapshot` — lightweight competitive pull for onboarding

---

*Do not begin implementation until explicitly unblocked. This doc is the brief — no separate planning session needed when the time comes.*
