# S89 Orchestration & Cross-Pillar Workflow Map

## Overview

This document maps the intended cross-pillar orchestration flows in Pravado against the current implementation status. The goal is to identify which automated intelligence flows are working, partially working, or missing entirely.

---

## Golden Path #1: Executive & Unified Narrative Intelligence

### Intended Flow

```
Media & PR Intelligence ──┐
                          ├──> Executive Command Center ──> Unified Narratives
Crisis Detection ─────────┤                    │
                          │                    ↓
Reputation Insights ──────┘         Executive Digests ←── Board Reports
```

### Flow Components

| Step | Source | Destination | API Routes | UI Pages | Status |
|------|--------|-------------|------------|----------|--------|
| 1 | Media Monitoring | Exec Command Center | `/media-monitoring` | `/app/pr` | **Partially Wired** |
| 2 | PR Intelligence | Exec Command Center | `/pr`, `/press-releases` | `/app/pr` | **Partially Wired** |
| 3 | Crisis Detection | Exec Command Center | `/crisis` | `/app/scenarios` | **Partially Wired** |
| 4 | Reputation Insights | Exec Command Center | `/brand-reputation` | None visible | **Not Wired** |
| 5 | All Sources | Unified Narratives | `/unified-narratives` | `/app/exec` (embedded) | **Partially Wired** |
| 6 | Unified Narratives | Executive Digests | `/executive-digests` | `/app/exec/digests` | **API Only** |
| 7 | Unified Narratives | Board Reports | `/executive-board-reports` | `/app/exec/board-reports` | **API Only** |

### Detailed Analysis

#### Step 1-2: Media & PR to Exec Command Center

**Intended Behavior:**
- Media mentions flow into executive KPIs
- PR coverage metrics aggregate to dashboard
- AI generates insights from media patterns

**Current Status: Partially Wired**
- API: `executiveCommandCenterRoutes` exists (Sprint S61)
- Service: Aggregates from multiple sources via `refreshDashboard()`
- UI: `/app/exec/page.tsx` shows KPIs, insights, narratives
- **Gap**: No visible "this insight came from PR" attribution
- **Gap**: No real-time updates from media changes

#### Step 5: Unified Narratives

**Intended Behavior:**
- AI synthesizes cross-domain intelligence into executive narratives
- Sections show source system attribution
- Multiple format options (comprehensive, executive, crisis)

**Current Status: Partially Wired**
- API: Full CRUD + generation endpoints
- Feature Flag: `ENABLE_UNIFIED_NARRATIVE_V2`
- UI: Narrative panel exists in Exec dashboard
- **Gap**: No standalone narrative management UI
- **Gap**: Source attribution not visible in UI
- **Gap**: No edit/regenerate controls visible

#### Step 6-7: Digests & Board Reports

**Intended Behavior:**
- Weekly/daily digests auto-generated
- Board reports compiled from narratives
- Scheduled delivery and historical archive

**Current Status: API Only**
- API: Both routes exist
- UI: Pages exist at `/app/exec/digests` and `/app/exec/board-reports`
- **Gap**: Need to verify UI functionality against API
- **Gap**: No visible scheduling controls
- **Gap**: No digest preview/generation UI

---

## Golden Path #2: Crisis, Scenarios, Reality Maps & Conflicts

### Intended Flow

```
Crisis Detection ──> Scenario Simulations ──> Orchestration Suites
                                                      │
        Insight Conflicts ←── Reality Maps ←── Outcome Analysis
```

### Flow Components

| Step | Source | Destination | API Routes | UI Pages | Status |
|------|--------|-------------|------------|----------|--------|
| 1 | Crisis Detection | Scenario Simulations | `/crisis` → `/ai-scenario-simulations` | `/app/scenarios` | **Partially Wired** |
| 2 | Scenarios | Orchestration Suites | `/scenario-orchestrations` | `/app/scenarios/orchestrations` | **Partially Wired** |
| 3 | Scenarios | Reality Maps | `/ai-scenario-simulations` → `/reality-maps` | None | **Not Wired** |
| 4 | Reality Maps | Insight Conflicts | `/reality-maps` → `/insight-conflicts` | None | **Not Wired** |
| 5 | Conflicts | Exec Dashboard | `/insight-conflicts` → `/exec-dashboards` | `/app/exec` | **Not Wired** |

### Detailed Analysis

#### Step 1: Crisis to Scenarios

**Intended Behavior:**
- Active crisis triggers scenario recommendations
- Crisis type informs simulation parameters
- "What if" analysis for response options

**Current Status: Partially Wired**
- API: Both routes exist independently
- Service: `aiScenarioSimulationRoutes` can reference scenarios
- UI: `/app/scenarios` shows crisis-type scenarios
- **Gap**: No automatic triggering from crisis
- **Gap**: No "AI recommends simulating this crisis" prompt
- **Gap**: No visual link from crisis to relevant scenarios

#### Step 3: Scenarios to Reality Maps

**Intended Behavior:**
- Completed scenarios generate probability trees
- Outcome branches visualized with confidence scores
- Multiple paths analyzed simultaneously

**Current Status: Not Wired**
- API: Reality Maps routes exist (Sprint S73)
- Feature Flag: `ENABLE_REALITY_MAPS`
- **Critical Gap**: No UI page for Reality Maps
- **Critical Gap**: No visible link from scenarios to maps
- **Critical Gap**: Tree visualization not implemented

#### Step 4: Reality Maps to Insight Conflicts

**Intended Behavior:**
- Conflicting outcome predictions detected
- Cross-system contradictions surfaced
- AI-assisted resolution recommendations

**Current Status: Not Wired**
- API: `insightConflictsRoutes` exists
- Service: Conflict detection logic implemented
- **Critical Gap**: No UI for conflict management
- **Critical Gap**: No link from reality maps to conflicts
- **Critical Gap**: Resolution workflow not visible

---

## Cross-Pillar Intelligence Flows

### PR to Content Flow

**Intended Behavior:**
- PR coverage success → content optimization suggestions
- Journalist interests → content topic recommendations
- Media gaps → content brief generation

**Current Status: Not Wired**

| Component | API | UI | Wired |
|-----------|-----|-----|-------|
| PR Metrics | `/pr`, `/media-monitoring` | `/app/pr` | Yes |
| Content Library | `/content` | `/app/content` | Yes |
| PR → Content Suggestions | None | None | **No** |
| "Create brief for this coverage" | None | None | **No** |

### Content to SEO Flow

**Intended Behavior:**
- Content published → keyword tracking
- SEO opportunities → content brief suggestions
- Content gaps identified from keyword analysis

**Current Status: Partially Wired**

| Component | API | UI | Wired |
|-----------|-----|-----|-------|
| Content Quality | `/content-quality` | `/app/content` | Yes |
| SEO Keywords | `/seo` | `/app/seo` | Yes |
| Content Gaps | `/content` | `/app/content` (panel) | Yes |
| SEO → Brief Action | None | None | **No** |

### SEO to PR Flow

**Intended Behavior:**
- High-value keywords → PR targeting suggestions
- Backlink opportunities → journalist outreach
- Search visibility → media strategy

**Current Status: Not Wired**

| Component | API | UI | Wired |
|-----------|-----|-----|-------|
| Keyword Analytics | `/seo` | `/app/seo` | Yes |
| Journalist Database | `/pr`, `/media-lists` | `/app/pr` | Yes |
| SEO → PR Suggestions | None | None | **No** |
| Backlink → Outreach | None | None | **No** |

---

## Playbook Cross-Pillar Execution

### Intended Behavior

Playbooks should orchestrate actions across pillars:

```
Playbook Step 1: Generate content brief (Content Pillar)
         ↓
Playbook Step 2: Analyze SEO fit (SEO Pillar)
         ↓
Playbook Step 3: Identify journalists (PR Pillar)
         ↓
Playbook Step 4: Update exec narrative (Executive Pillar)
```

### Current Status: Partially Wired

**API Level:**
- Playbook Execution Engine (S7, S9, S10, S11) exists
- Step types: AGENT, DATA, BRANCH, API
- Collaboration coordinator supports multi-agent
- Memory system integration for context

**Service Integration:**
- Services exist independently
- Playbook can call services via API steps
- No native cross-service orchestration

**UI Level:**
- `/app/playbooks` shows playbook list and runs
- No visual flow showing cross-pillar execution
- No "which pillars are involved" indicator

### Wiring Status Table

| Capability | API | Service | UI | Status |
|------------|-----|---------|-----|--------|
| Define cross-pillar playbook | Yes | Yes | Partial | **Functional** |
| Execute across services | Yes | Via API calls | N/A | **Functional** |
| Visualize pillar involvement | No | No | No | **Not Implemented** |
| Show execution streaming | Partial | Yes | No | **API Only** |
| Cross-pillar output aggregation | Yes | Yes | No | **API Only** |

---

## Data Flow Summary

### Fully Wired Flows

1. **Auth → Org → User Context**: Complete authentication and org-scoping
2. **Individual Pillar CRUD**: Each pillar has working API + UI for basic operations
3. **Playbook Definition → Execution**: Playbooks run successfully

### Partially Wired Flows

1. **Media → Exec Dashboard**: Data flows but attribution missing
2. **Content → Content Gaps**: Gaps shown but no action flow
3. **Scenarios → Orchestration Suites**: Linked but visualization weak

### Not Wired Flows

1. **Reality Maps → UI**: No visualization page
2. **Insight Conflicts → UI**: No management interface
3. **PR → Content suggestions**: No AI recommendation flow
4. **SEO → PR targeting**: No cross-pillar intelligence
5. **Cross-Pillar Playbook Visualization**: No UI for showing pillar involvement

---

## Flow Wiring Matrix

| From Pillar | To Pillar | Data Flows | AI Suggests | UI Shows | Overall |
|-------------|-----------|------------|-------------|----------|---------|
| PR | Exec | Partial | No | Partial | **Weak** |
| PR | Content | No | No | No | **None** |
| Content | Exec | Partial | No | Partial | **Weak** |
| Content | SEO | Yes | No | Partial | **Partial** |
| SEO | Content | Partial | No | Partial | **Partial** |
| SEO | PR | No | No | No | **None** |
| Crisis | Scenarios | Partial | No | Yes | **Partial** |
| Scenarios | Reality Maps | No | No | No | **None** |
| Reality Maps | Conflicts | No | No | No | **None** |
| Conflicts | Exec | No | No | No | **None** |
| Playbooks | All Pillars | Yes (API) | No | No | **API Only** |

---

## Recommendations

### Critical Fixes for Pilot

1. **Reality Maps UI**: Create basic visualization page
2. **Insight Conflicts UI**: Surface existing conflicts data
3. **Cross-Pillar Indicators**: Show which systems feed each view

### High Priority

4. **Source Attribution**: Show "insight from PR" in Exec dashboard
5. **Action Prompts**: Add "generate brief for this" buttons
6. **Playbook Pillar Visualization**: Show which pillars a playbook touches

### Medium Priority

7. **AI Suggestion Engine**: Proactive cross-pillar recommendations
8. **Automated Triggering**: Crisis auto-triggers relevant scenarios
9. **Digest Generation UI**: Allow manual generation and preview

---

## Conclusion

The orchestration layer is **API-complete but UI-incomplete**. All the services exist and can theoretically communicate, but:

1. **No visible cross-pillar intelligence** - Users don't see how PR informs Content
2. **Core features missing UI** - Reality Maps and Conflicts have no pages
3. **AI proactivity absent** - System doesn't suggest cross-pillar actions
4. **Attribution missing** - Users don't know where insights came from

The platform architecture supports orchestration, but the experience doesn't deliver it.
