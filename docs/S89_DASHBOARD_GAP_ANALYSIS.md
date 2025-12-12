# S89 Dashboard Gap Analysis

## Overview

This document compares the current `/app` dashboard implementation against the UX-Pilot reference design and Design System v2 specifications.

## UX-Pilot Dashboard Reference Summary

Based on the design system and handoff documents, the intended dashboard should include:

### Data Regions
1. **Cross-Pillar Summary Cards** - PR, Content, SEO metrics at a glance
2. **AI Activity Feed** - Real-time AI agent actions and recommendations
3. **Recent Playbook Activity** - Current and recent playbook executions
4. **Quick Actions Panel** - One-click access to common workflows
5. **Unified Narrative Preview** - Executive summary synthesis
6. **Alert/Risk Indicators** - Crisis and reputation alerts

### Key Metrics & Visualizations
- PR: Media mentions, journalist engagement score, coverage trend
- Content: Published pieces, quality scores, content gaps identified
- SEO: Ranking improvements, keyword opportunities, backlink growth
- Playbooks: Active runs, success rate, pending approvals

### AI Affordances
- AI Presence Dot (active/analyzing/generating states)
- Proactive AI suggestions based on current data
- "Ask Pravado" input for natural language queries
- Contextual AI tips and recommendations
- One-click AI actions ("Generate brief", "Simulate scenario")

### Visual Hierarchy
- Hero metric cards with gradient accents
- Three-column layout for density
- DS v2 color tokens (iris, cyan, magenta accents)
- Depth via subtle shadows (elevation-card-sm)
- Motion on interactions (duration-sm transitions)

---

## Current `/app` Dashboard Implementation

### What's Present
| Element | Status | Notes |
|---------|--------|-------|
| Welcome message | Present | Personalized with user's first name |
| Stats cards | Present | 3 cards: Media Mentions, Content Published, Active Playbooks |
| Getting Started section | Present | 5 pillar cards with links |
| Recent Activity | Present | Empty state placeholder |
| Panel cards | Present | Using `panel-card` CSS class |
| DS v2 tokens | Partial | Uses brand-iris, brand-cyan colors |

### What's Missing

| Spec Element | Current Status | Gap Description | Impact |
|--------------|----------------|-----------------|--------|
| AI Activity Feed | Not Implemented | No real-time AI action display | Critical |
| AI Presence Indicators | Minimal | Only static dot in layout header | High |
| Cross-pillar orchestration | Not Implemented | No unified view of PR→Content→SEO flow | Critical |
| Proactive AI suggestions | Not Implemented | No AI recommendations or prompts | Critical |
| Executive narrative preview | Not Implemented | No synthesis of cross-system insights | High |
| Real metrics from data | Not Implemented | All values hardcoded to "0" | Critical |
| Alert/Risk indicators | Not Implemented | No crisis or reputation alerts | High |
| Playbook activity widget | Not Implemented | No running/recent playbook display | Medium |
| Quick actions panel | Not Implemented | No one-click AI actions | High |
| "Ask Pravado" input | Not Implemented | No conversational interface | Medium |
| Charts/sparklines | Not Implemented | No trend visualizations | Medium |

---

## Gap Analysis Table

| Spec Element | Current Implementation | Status | Gap Description | Impact |
|--------------|----------------------|--------|-----------------|--------|
| Hero metric cards | Static stat cards | Poor | Show "0" instead of real data, no trends | Critical |
| AI Activity Feed | None | Not Implemented | Missing entirely; no agent visibility | Critical |
| Cross-pillar summary | Static cards with links | Poor | No actual metrics, just navigation | Critical |
| Proactive AI | Static AI dot only | Poor | No suggestions, actions, or intelligence | Critical |
| Unified narrative | None | Not Implemented | Key differentiator not surfaced | Critical |
| Risk/Alert panel | None | Not Implemented | No crisis or reputation awareness | High |
| Playbook widget | None | Not Implemented | Active runs not visible | High |
| Quick actions | "Get Started" cards | Partial | Navigation only, no AI actions | High |
| Color/accent usage | Partial | Partial | Uses some tokens but feels flat | Medium |
| Visual hierarchy | Basic | Partial | Missing depth, motion, energy | Medium |
| Empty states | Generic | Poor | No helpful guidance or AI prompts | Medium |

---

## Key Findings

### 1. No AI Proactivity on Dashboard
The dashboard shows zero AI intelligence despite being an "AI-first" platform. There are:
- No AI suggestions
- No agent activity visibility
- No "what should I do next" guidance
- No surfacing of insights from the engines

**This is the single biggest gap affecting perceived value.**

### 2. No Cross-Pillar Orchestration
The dashboard treats pillars as isolated silos:
- No PR→Content→SEO flow visualization
- No unified narrative or synthesis
- No "this PR coverage could inform your SEO strategy" connections

### 3. Static/Fake Data Display
All metrics show "0" with "This month" labels:
- Not connected to real backend data
- Feels like a demo shell, not a real tool
- Undermines credibility immediately

### 4. Generic Feel
Despite using DS v2 tokens, the dashboard feels generic:
- No distinctive Pravado personality
- Copy is standard ("Here's what's happening...")
- Missing the energy and premium feel specified in DS v2
- No motion or micro-interactions

---

## Recommendations for Experience Completion Sprint

### Must-Have Fixes (Critical)
1. **Connect stats to real data** - Wire dashboard cards to actual API counts
2. **Add AI Activity widget** - Show last 5 agent actions/recommendations
3. **Add proactive AI suggestion** - At least one "Pravado recommends..." item
4. **Surface unified narrative** - Show latest executive summary snippet

### High-Priority Fixes
5. **Add risk/alert indicator** - Show active crisis/reputation alerts
6. **Show active playbooks** - List running playbook executions
7. **Improve empty states** - Add AI-generated guidance for new users

### Medium-Priority Fixes
8. **Add trend sparklines** - Show 7-day trends on stat cards
9. **Implement quick actions** - One-click AI actions panel
10. **Enhance motion** - Add subtle animations on card hover

---

## Conclusion

The current dashboard is a navigation hub, not an intelligence dashboard. It completely fails to showcase Pravado's AI-first value proposition. A design partner customer landing here would see:
- Zero insight from the AI
- Zero cross-pillar intelligence
- Zero reason to believe this is different from other marketing tools

Priority should be given to surfacing actual AI value on this page.
