# S89 Pillar Experience Matrix

## Overview

This document provides a pillar-by-pillar audit of current implementation vs. spec for each major workspace/feature area.

---

## 1. PR / Media Intelligence (`/app/pr`)

### Spec Summary
- Journalist database with intelligent filtering and AI-enriched profiles
- Media list builder with audience matching
- Press release generator with brand voice
- Outreach tracking and deliverability analytics
- Journalist relationship timeline

### Live Feature Set
- **Route**: `/app/pr/page.tsx` - Media Explorer
- Journalist search with filters (country, tier)
- Create and manage media lists
- Add/remove journalists from lists
- Basic journalist cards with beats and outlets

### AI Presence: **Weak**
- No AI suggestions for journalist matches
- No "AI recommends these journalists" prompts
- No smart outreach timing suggestions
- No relationship intelligence surfacing

### Integration/Orchestration: **None**
- No connection to Content pillar
- No connection to SEO insights
- No cross-pillar intelligence flow

### UX Quality: **Barebones but coherent**
- Functional list management
- Search works
- Layout is clean but generic
- Missing AI-first interactions

### DS v2 Compliance: **Medium**
- Uses panel-card, input-field classes
- Brand colors present but underutilized
- Missing depth and accent highlights

### Gap Summary
1. No AI-powered journalist recommendations
2. No press release generator UI (service exists)
3. No outreach tracking dashboard
4. No relationship timeline visualization

### Severity for Pilot: **Critical**

---

## 2. Content Intelligence (`/app/content`)

### Spec Summary
- Content library with quality scoring
- AI-generated content briefs
- Topic cluster visualization
- Content gap identification with SEO opportunities
- Rewrite engine for content optimization

### Live Feature Set
- **Route**: `/app/content/page.tsx`
- Three-panel layout: Library, Detail/Briefs, Clusters/Gaps
- Content item list with status filtering
- Brief generation modal (S13)
- Quality analysis button (S14)
- Topic clusters and content gaps display

### AI Presence: **Medium**
- Brief generation with personality selection
- Quality analysis with scoring
- Content gaps with SEO opportunity scores
- BUT: No proactive suggestions, user must initiate

### Integration/Orchestration: **Weak**
- Brief generation can target keywords
- Quality analysis provides SEO hints
- No direct flow to PR or playbooks
- No "this content could support your upcoming PR" suggestions

### UX Quality: **Barebones but coherent**
- Three-panel layout works well
- Functional CRUD operations
- Missing polish and personality
- Empty states are generic

### DS v2 Compliance: **Medium**
- Uses DS tokens
- Proper color coding for status
- Missing accent energy
- Needs more visual hierarchy

### Gap Summary
1. AI is reactive, not proactive
2. No cluster visualization (just list)
3. No content calendar integration
4. No PR/SEO cross-linking

### Severity for Pilot: **High**

---

## 3. SEO Intelligence (`/app/seo`)

### Spec Summary
- Keyword tracking with SERP analysis
- On-page optimization audits
- Backlink intelligence and monitoring
- Opportunity prioritization with AI recommendations
- Integration with Content for keyword targeting

### Live Feature Set
- **Route**: `/app/seo/page.tsx`
- Three tabs: Keywords & SERP, On-Page, Backlinks
- Keyword table with metrics (volume, difficulty, priority)
- SERP snapshot when keyword selected
- Opportunities panel with recommendations
- On-Page and Backlinks tabs are placeholder/coming soon states

### AI Presence: **Weak**
- Opportunity recommendations exist but aren't AI-generated live
- No "AI recommends focusing on..." prompts
- Priority scores exist but not explained
- No conversational SEO guidance

### Integration/Orchestration: **Weak**
- Content gaps link to SEO opportunities conceptually
- No actual click-through to create content brief for keyword
- No PR/Media intelligence integration

### UX Quality: **Barebones but coherent**
- Keywords tab is functional
- SERP display is informative
- Two tabs are empty shells
- Missing depth in keyword analysis

### DS v2 Compliance: **Medium**
- Good use of badge colors for intent
- Table styling is clean
- Opportunity cards use accents
- On-page/Backlinks placeholders feel hollow

### Gap Summary
1. On-Page and Backlinks tabs are not implemented
2. No AI conversational guidance
3. No "one-click create brief for this keyword" action
4. SERP analysis is read-only, no action prompts

### Severity for Pilot: **High**

---

## 4. Playbooks & Execution (`/app/playbooks`)

### Spec Summary
- Visual playbook editor with step-by-step flows
- Playbook versioning and branching (Git-like)
- Execution engine with real-time streaming
- Approval gates for human-in-the-loop
- Run history with replay capability

### Live Feature Set
- **Route**: `/app/playbooks/page.tsx`
- Playbook list view
- Create playbook functionality
- Playbook run initiation
- Run status tracking
- Version control UI (branches, commits)

### AI Presence: **Weak**
- Playbooks execute AI steps
- No AI suggestions for playbook creation
- No "recommended next playbook" prompts
- Execution is fire-and-forget, no interactive AI

### Integration/Orchestration: **Medium**
- Playbooks can span PR, Content, SEO pillars
- Execution engine calls pillar services
- No visual flow showing cross-pillar execution

### UX Quality: **Functional but dry**
- CRUD operations work
- Run management exists
- Missing visual flow editor
- Missing execution streaming visualization

### DS v2 Compliance: **Medium**
- Uses panel cards
- Status badges present
- Missing the "energetic" feel
- Visual editor would add significant polish

### Gap Summary
1. No visual flow editor (just forms)
2. Execution streaming not visualized
3. No proactive playbook suggestions
4. Approval gates not prominently displayed

### Severity for Pilot: **High**

---

## 5. AI Agents / Automation (`/app/agents`)

### Spec Summary
- Agent personality registry
- Agent activity monitoring
- Memory and context management
- Agent collaboration coordination
- Per-agent performance metrics

### Live Feature Set
- **Route**: `/app/agents/page.tsx`
- Basic agent list/status page
- Links to personality management
- No real-time activity feed

### AI Presence: **Weak** (ironic for the agents page)
- Should be the showcase of AI capability
- Currently just a list page
- No agent activity stream
- No "agent is currently working on..." indicators

### Integration/Orchestration: **Weak**
- Agents page is isolated
- Should show agents working across pillars
- No visualization of agent collaboration

### UX Quality: **Empty shell**
- Minimal content
- No showcase of AI capability
- Feels like a placeholder

### DS v2 Compliance: **Low**
- Basic styling only
- Missing energy and AI-first feel
- Should be the most visually dynamic page

### Gap Summary
1. No real-time agent activity feed
2. No agent performance visualization
3. No "AI is working" presence indicators
4. Doesn't demonstrate AI value

### Severity for Pilot: **Critical** - This should be a showcase

---

## 6. Executive Command Center (`/app/exec`)

### Spec Summary
- Cross-system executive dashboard
- KPI aggregation from all pillars
- AI-generated insights and narratives
- Time-window filtering
- Risk and opportunity prioritization

### Live Feature Set
- **Route**: `/app/exec/page.tsx`
- Dashboard list and selection
- KPI grid display
- Insights feed panel
- Narrative generation
- Time window and focus filters

### AI Presence: **Medium**
- Narrative generation is AI-powered
- Insights are aggregated
- Refresh triggers AI regeneration
- Missing proactive "executive briefing ready" prompts

### Integration/Orchestration: **Medium**
- Aggregates data from PR, Content, SEO
- Shows cross-system insights
- Missing visual flow of data sources

### UX Quality: **Most complete pillar**
- Three-column layout works
- Functional CRUD and filtering
- Dashboard management is clean
- Still missing polish and energy

### DS v2 Compliance: **Medium**
- Good use of layout components
- Cards and badges present
- Could use more accent highlighting
- Narrative panel needs visual distinction

### Gap Summary
1. No proactive "your briefing is ready" notifications
2. Narrative formatting could be richer
3. KPIs need sparklines/trends
4. Missing "drill down" to source data

### Severity for Pilot: **Medium** - Most functional pillar

---

## 7. Exec Digests & Board Reports

### Spec Summary
- Automated executive digest generation
- Board report builder
- Scheduled delivery
- Historical archive

### Live Feature Set
- Services exist (`execDigests`, `boardReports` in seed)
- No dedicated UI pages found
- May be accessible via Executive Command Center

### AI Presence: **Unknown** (no UI)

### Integration/Orchestration: **Unknown**

### UX Quality: **Not visible in UI**

### DS v2 Compliance: **N/A**

### Gap Summary
1. No dedicated UI for digest management
2. No board report builder visible
3. Functionality may exist but isn't surfaced

### Severity for Pilot: **High** - Core exec feature missing UI

---

## 8. Unified Narratives (`/app/exec/narratives` or similar)

### Spec Summary
- Cross-pillar narrative synthesis
- Multiple format options (comprehensive, executive, crisis)
- Source system attribution
- Edit and approval workflow

### Live Feature Set
- Data seeded in `unified_narratives` table
- Narrative panel in Exec dashboard shows current narrative
- No dedicated narrative management UI

### AI Presence: **Partial**
- Narrative generation is AI-powered
- Visible in Exec dashboard
- No standalone narrative editor

### Integration/Orchestration: **Medium**
- Pulls from PR, crisis, reputation, strategy
- Source systems tracked

### UX Quality: **Embedded only**
- Only visible within Exec dashboard
- No dedicated workspace
- Missing editing capability

### DS v2 Compliance: **Medium**

### Gap Summary
1. No standalone narrative workspace
2. No narrative editing UI
3. No narrative history/versioning visible

### Severity for Pilot: **Medium**

---

## 9. Scenarios & Simulations (`/app/scenarios`)

### Spec Summary
- AI scenario simulation engine
- What-if analysis for crisis, competitive, regulatory events
- Probability-based outcome modeling
- Playbook triggering from scenarios

### Live Feature Set
- **Route**: `/app/scenarios/page.tsx`
- Scenario list with tabs (Scenarios, Playbooks, Runs)
- Create scenario/playbook dialogs
- Simulation results panel
- Stats display

### AI Presence: **Medium**
- Simulations are AI-powered
- Results show predicted outcomes
- Missing proactive "you should simulate this" prompts

### Integration/Orchestration: **Medium**
- Scenarios can trigger playbooks
- Runs track execution
- No visual flow to reality maps

### UX Quality: **Functional**
- Tab-based navigation works
- Create dialogs are clean
- Simulation results are informative
- Missing visualization depth

### DS v2 Compliance: **Medium**
- Uses DS components
- Color coding for types
- Needs more visual energy

### Gap Summary
1. No scenario branching visualization
2. Simulation results are text-heavy
3. No "recommended scenarios" from AI
4. Missing link to Reality Maps

### Severity for Pilot: **Medium**

---

## 10. Reality Maps

### Spec Summary
- Probability tree visualization
- Outcome branching with confidence scores
- Path analysis
- Integration with scenarios

### Live Feature Set
- Data seeded (`reality_maps`, `reality_map_nodes`, `reality_map_edges`)
- No dedicated UI page found
- May be embedded in scenarios

### AI Presence: **Unknown** (no visible UI)

### Integration/Orchestration: **Unknown**

### UX Quality: **Not visible**

### DS v2 Compliance: **N/A**

### Gap Summary
1. No reality map visualization UI
2. Core differentiating feature not surfaced
3. Tree/graph visualization needed

### Severity for Pilot: **Critical** - Major feature invisible

---

## 11. Insight Conflict Resolution

### Spec Summary
- Detect conflicting insights across systems
- AI-assisted resolution recommendations
- Audit trail of decisions
- Integration with governance

### Live Feature Set
- Data seeded (`insight_conflicts`)
- No dedicated UI page found

### AI Presence: **Unknown**

### Integration/Orchestration: **Unknown**

### UX Quality: **Not visible**

### DS v2 Compliance: **N/A**

### Gap Summary
1. No conflict resolution UI
2. Unique feature completely hidden

### Severity for Pilot: **High**

---

## 12. Billing & Subscription (`/app/billing`)

### Spec Summary
- Plan management and upgrades
- Usage tracking and quotas
- Invoice history
- Overage handling

### Live Feature Set
- Extensive billing service and routes exist
- Dedicated billing page likely exists
- Usage alerts and quotas implemented

### AI Presence: **None** (appropriate for billing)

### Integration/Orchestration: **Standalone** (appropriate)

### UX Quality: **Unknown** - need to verify page exists

### DS v2 Compliance: **Unknown**

### Gap Summary
1. Verify UI exists and is functional
2. Check usage quota display

### Severity for Pilot: **Medium**

---

## 13. Settings / Team (`/app/settings`, `/app/team`)

### Spec Summary
- Organization settings
- Team member management
- Invite flow
- Role assignments

### Live Feature Set
- Team page exists for member management
- Invite functionality implemented
- Role-based access control

### AI Presence: **None** (appropriate)

### Integration/Orchestration: **Standalone** (appropriate)

### UX Quality: **Functional**
- Basic CRUD operations work
- Invite flow functional

### DS v2 Compliance: **Medium**

### Gap Summary
1. May need polish
2. Verify all flows work

### Severity for Pilot: **Low**

---

## Summary Table

| Pillar | AI Presence | Integration | UX Quality | DS v2 | Severity |
|--------|-------------|-------------|------------|-------|----------|
| PR / Media | Weak | None | Barebones | Medium | Critical |
| Content | Medium | Weak | Barebones | Medium | High |
| SEO | Weak | Weak | Barebones | Medium | High |
| Playbooks | Weak | Medium | Functional | Medium | High |
| AI Agents | Weak | Weak | Empty shell | Low | Critical |
| Exec Command | Medium | Medium | Most complete | Medium | Medium |
| Exec Digests | Unknown | Unknown | Not visible | N/A | High |
| Narratives | Partial | Medium | Embedded | Medium | Medium |
| Scenarios | Medium | Medium | Functional | Medium | Medium |
| Reality Maps | Unknown | Unknown | Not visible | N/A | Critical |
| Conflicts | Unknown | Unknown | Not visible | N/A | High |
| Billing | None | Standalone | Unknown | Unknown | Medium |
| Settings/Team | None | Standalone | Functional | Medium | Low |

---

## Why the App Feels Primitive

1. **AI is hidden** - The AI-first promise is not delivered in the UI
2. **Pillars are islands** - No cross-system intelligence flows
3. **Core features invisible** - Reality Maps, Conflicts, Digests have no UI
4. **Generic feel** - Missing the "Pravado personality" from DS v2
5. **Reactive not proactive** - Users must seek; system doesn't suggest
