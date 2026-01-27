# COMMAND CENTER GOLDEN FLOW

> **Status:** CANONICAL — FROZEN
> **Authority:** This document defines THE single prioritized user flow for Command Center V1.
> **Classification:** V1 Lock — Changes require formal change control
> **Last Updated:** 2026-01-13

---

## 1. Prime Directive

Command Center V1 optimizes for ONE flow:

> **Action appears → Hover explains → Entity Map visualizes gap → User executes → System responds**

Every feature, every component, every interaction in Command Center exists to support this flow. Features that don't serve this flow are deferred to V2.

---

## 2. The Golden Flow (5 Steps)

### Step 1: Action Appears

**What Happens:**
SAGE generates a proposal and it appears in the Action Stream.

**User Sees:**
- Action card with pillar badge (PR/Content/SEO)
- Priority indicator (Critical/High/Medium/Low)
- Confidence and Impact meters
- Mode badge (Manual/Copilot/Autopilot)
- Primary CTA (Execute, Review, Send, etc.)

**User Question Answered:**
> "What should I do next?"

**Contract Requirements:**
- Cards sorted by priority (Critical → High → Medium → Low)
- Within priority: sorted by confidence descending
- Comfortable mode is default for ≤8 cards
- All required card fields visible

---

### Step 2: Hover Explains

**What Happens:**
User hovers over an action card to understand context before deciding.

**User Sees:**
- Anchored HoverCard popover (left-positioned within Action Stream)
- "Why Now" section explaining strategic rationale
- "Next Step" section showing recommended action
- Key signals with tone colors
- Guardrails/warnings if applicable
- "Click card to review full details" hint

**User Question Answered:**
> "Why should I do this now, and what will happen?"

**Contract Requirements:**
- Hover delay: ~200ms open, ~250ms close
- Non-hovered cards dim to 40% opacity
- HoverCard stays open when cursor moves into it
- Arrow points to source card

---

### Step 3: Entity Map Visualizes Gap

**What Happens:**
While hovering, the Entity Map highlights the entities and relationships affected by this action.

**User Sees:**
- Affected entities glow with pillar color
- Non-affected entities dim to 40% opacity
- Affected edges illuminate
- Driver entity shows "action starts here" indicator
- Impact badges show expected change magnitude

**User Question Answered:**
> "What influence gap is this action closing?"

**Contract Requirements:**
- Highlight/dim transition: 150ms
- Driver node clearly identified
- Impact visible on affected nodes
- Zone layout remains stable (no movement)

---

### Step 4: User Executes

**What Happens:**
User clicks the Primary CTA to execute the action.

**User Sees:**
- Button enters loading state
- If ready state (confidence ≥0.8, no gate): executes immediately
- If not ready: opens confirmation or Action Modal

**User Actions:**
- Click Primary CTA to execute
- Click Secondary CTA to review details first
- Click card body to open Action Modal for investigation

**User Question Answered:**
> "How do I make this happen?"

**Contract Requirements:**
- Primary CTA always visible on card
- Ready state uses success styling (green glow)
- Non-ready uses pillar color
- Loading state on execution

---

### Step 5: System Responds

**What Happens:**
After execution, the system provides visual feedback across components.

**User Sees:**
- **Action Stream**: Card shows "Executed" state, then removes or moves to completed
- **Entity Map**: Ripple pulse propagates from driver entity through affected nodes
- **Strategy Panel**: EVI updates to reflect impact (if significant)
- **Calendar**: Item moves to "scheduled" or "published" status

**User Question Answered:**
> "Did it work, and what changed?"

**Contract Requirements:**
- Entity Map pulse: 800ms animation
- Cards transition smoothly (not jarring removal)
- Audit trail created
- Status updates within 2 seconds

---

## 3. Flow Timing Contract

### End-to-End Timing

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Action Appears | Instant (on load) | 0ms |
| Hover Intent | 200ms delay | 200ms |
| Entity Map Highlight | 150ms transition | 350ms |
| User Decision | Variable (human) | - |
| Execute Click | 50ms button feedback | 50ms |
| System Response | 800ms animation | 850ms |
| Confirmation | 2s total | 2.5s |

### Total Flow Time (excluding human decision)
**~2.5 seconds** from hover to confirmed execution.

---

## 4. Component Responsibilities

### 4.1 Action Stream

| Responsibility | Behavior |
|----------------|----------|
| Display proposals | Prioritized, density-adaptive cards |
| Enable hover | Trigger HoverCard with context |
| Broadcast hover state | `hoveredActionId` prop to Entity Map |
| Handle execution | Primary CTA triggers action |
| Broadcast execute state | `executingActionId` prop to Entity Map |

### 4.2 Entity Map

| Responsibility | Behavior |
|----------------|----------|
| Receive hover state | Highlight affected entities |
| Receive execute state | Trigger pulse animation |
| Show gaps | Visualize weak/missing relationships |
| Answer "what gap" | Impact badges on hover |

### 4.3 HoverCard (Micro-Brief)

| Responsibility | Behavior |
|----------------|----------|
| Explain "why now" | Strategic context |
| Show next step | Clear recommendation |
| Display signals | Key metrics with tone |
| Warn on guardrails | Approval/limit warnings |

### 4.4 Strategy Panel

| Responsibility | Behavior |
|----------------|----------|
| Display EVI | North Star KPI |
| Explain drivers | Visibility/Authority/Momentum breakdown |
| Show impact | Delta after actions |
| NO actions | Diagnostic only |

### 4.5 Calendar

| Responsibility | Behavior |
|----------------|----------|
| Show timeline | When things will happen |
| Indicate mode | Autopilot/Copilot/Manual |
| Status updates | After execution |

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMMAND CENTER                            │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐ │
│  │ Action Stream │────▶│  HoverCard   │     │  Strategy Panel  │ │
│  │              │     │  (on hover)   │     │  (diagnostic)    │ │
│  │ • Cards      │     │              │     │  • EVI           │ │
│  │ • CTAs       │     │  • Why Now   │     │  • Drivers       │ │
│  │ • Hover      │     │  • Next Step │     │  • Narratives    │ │
│  │              │     │  • Signals   │     │                  │ │
│  └──────┬───────┘     └──────────────┘     └──────────────────┘ │
│         │                                                        │
│         │ hoveredActionId / executingActionId                    │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │  Entity Map   │◀───│ actionImpacts│                          │
│  │              │     │  (mapping)   │                          │
│  │ • Highlight  │     │              │                          │
│  │ • Dim others │     │ • nodes      │                          │
│  │ • Pulse      │     │ • edges      │                          │
│  │ • Show gaps  │     │ • driver     │                          │
│  └──────────────┘     └──────────────┘                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Calendar Peek                         │   │
│  │  • Timeline  • Status updates  • Mode indicators          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. State Coordination

### 6.1 Hover State

```typescript
// Action Stream manages hover state
const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);

// Passed to Entity Map
<EntityMap
  hoveredActionId={hoveredActionId}
  actionImpacts={actionImpacts}
  // ...
/>
```

### 6.2 Execute State

```typescript
// Action Stream manages execute state
const [executingActionId, setExecutingActionId] = useState<string | null>(null);

// Passed to Entity Map for pulse
<EntityMap
  executingActionId={executingActionId}
  // ...
/>
```

### 6.3 Action Impacts Mapping

```typescript
// Maps action IDs to affected entities
const actionImpacts: Record<string, ActionImpactMap> = {
  "act_123": {
    driver_node: "brand_001",
    impacted_nodes: ["journalist_001", "topic_002"],
    impacted_edges: ["edge_001", "edge_002"],
  }
};
```

---

## 7. Edge Cases and Fallbacks

### 7.1 No Hover Support (Touch Devices)

| Scenario | Fallback |
|----------|----------|
| Touch screen | Tap opens Action Modal directly |
| No hover | Skip Step 2, Entity Map shows impact on tap |

### 7.2 Entity Map Not Visible (Mobile)

| Scenario | Fallback |
|----------|----------|
| Single-column layout | Entity Map hidden, HoverCard still works |
| Small screen | Action Stream + HoverCard is complete flow |

### 7.3 Slow Network

| Scenario | Fallback |
|----------|----------|
| Action takes >2s | Show progress indicator |
| Timeout | Show error with retry option |

### 7.4 Action Fails

| Scenario | Fallback |
|----------|----------|
| Execution error | Card shows error state |
| Entity Map | Red flash instead of pulse |
| Retry available | Retry button appears |

---

## 8. Anti-Patterns (FORBIDDEN)

| Anti-Pattern | Why It Breaks Flow | Alternative |
|--------------|--------------------|-------------|
| **Multiple modals open** | Confuses user about state | One modal at a time |
| **Hover opens new page** | Breaks investigate-then-act | Hover shows popover |
| **Execute navigates away** | Loses context | Stay on Command Center |
| **Entity Map as primary nav** | Not its purpose | Entity Map is visualization |
| **Strategy Panel has buttons** | Breaks diagnostic-only rule | Actions in Action Stream |
| **Calendar inline editing** | Not a planner | Calendar shows timeline |

---

## 9. Success Metrics

### 9.1 Flow Completion

| Metric | Target |
|--------|--------|
| Hover → Execute rate | >40% of hovers lead to action |
| Time to first action | <30 seconds after page load |
| Error rate on execute | <1% of executions fail |

### 9.2 User Understanding

| Metric | Target |
|--------|--------|
| Hover to understand | >80% hover before executing |
| Use of HoverCard | >50% of actions previewed via hover |
| Entity Map engagement | >30% notice Entity Map changes |

---

## 10. What MUST NOT Change

The following are FROZEN for V1:

1. **The 5-step flow** — Appears → Hover → Visualize → Execute → Respond
2. **Hover coordination** — hoveredActionId syncs Action Stream and Entity Map
3. **Execute coordination** — executingActionId triggers pulse
4. **Single-action focus** — One action highlighted at a time
5. **Stay on page** — No navigation during flow
6. **Strategy Panel is diagnostic** — No action buttons

---

## 11. Compliance Checklist

Golden Flow implementations MUST satisfy:

- [ ] Hover on Action Stream card highlights Entity Map entities
- [ ] HoverCard appears with context (Why Now, Next Step, Signals)
- [ ] Non-affected entities dim during hover
- [ ] Driver node shows origin indicator
- [ ] Execute triggers Entity Map pulse animation
- [ ] Pulse propagates through affected entities
- [ ] Strategy Panel has NO action buttons
- [ ] Calendar click opens modal, not navigation
- [ ] Error states have recovery path
- [ ] Flow completes in <3 seconds (excluding user decision)

---

## 12. Pillar Examples: PR Golden Flow

The following illustrates the Golden Flow with a real PR pillar action: **Manual Pitch Send**.

### 12.1 Step-by-Step: Manual Pitch Send

#### Step 1: Action Appears

SAGE detects a high-fit journalist in the pipeline who hasn't been pitched. A proposal appears:

```json
{
  "id": "act_pr_001",
  "pillar": "pr",
  "title": "Send pitch to Sarah Chen @ TechCrunch",
  "priority": "high",
  "confidence": 0.85,
  "impact": 0.72,
  "mode": "manual",
  "primaryCta": "Send Pitch",
  "deepLink": "/app/pr?view=pipeline&sequenceId=seq_123&contactId=cnt_456"
}
```

**Card displays:**
- PR pillar badge (magenta accent)
- "Manual" mode badge (user-initiated only)
- "Send Pitch" primary CTA

#### Step 2: Hover Explains

User hovers to understand context:

```json
{
  "whyNow": "Sarah Chen covers enterprise AI — 92% beat alignment with your product launch. She has 18k followers and published 3 relevant articles this month.",
  "nextStep": "Send personalized pitch via the PR Pipeline. Opens pitch editor in context.",
  "signals": [
    { "label": "Beat Fit", "value": "92%", "tone": "positive" },
    { "label": "Response Rate", "value": "24%", "tone": "neutral" },
    { "label": "Last Contact", "value": "Never", "tone": "neutral" }
  ],
  "guardrails": []
}
```

#### Step 3: Entity Map Visualizes Gap

Entity Map highlights:
- **Driver node**: `brand_pravado` (your brand)
- **Impacted nodes**: `journalist_sarah_chen`, `outlet_techcrunch`, `topic_enterprise_ai`
- **Gap shown**: No edge between brand and journalist (opportunity)

```typescript
actionImpacts["act_pr_001"] = {
  driver_node: "brand_pravado",
  impacted_nodes: ["journalist_sarah_chen", "outlet_techcrunch", "topic_enterprise_ai"],
  impacted_edges: [], // No existing edge — this action creates one
};
```

#### Step 4: User Executes

User clicks **"Send Pitch"**:
1. Deep link opens PR Work Surface at pitch editor
2. User customizes pitch (SAGE draft pre-filled)
3. User clicks **"Manual Send"** in PR Work Surface
4. API call to `/api/pr/pitches/manual-send`:

```json
{
  "sequenceId": "seq_123",
  "contactId": "cnt_456",
  "stepPosition": 1
}
```

#### Step 5: System Responds

Backend returns with EVI attribution:

```json
{
  "success": true,
  "eventId": "evt_789",
  "newStatus": "sent",
  "eviAttribution": {
    "pillar": "pr",
    "driver": "visibility",
    "direction": "positive",
    "delta": 2.3,
    "explanation": "Outreach to tier-1 outlet increases visibility score",
    "timestamp": "2026-01-21T10:30:00Z",
    "entityRefs": {
      "journalistId": "cnt_456",
      "sequenceId": "seq_123"
    }
  }
}
```

**Visual feedback:**
- **Action Stream**: Card shows "Executed ✓", fades to completed section
- **Entity Map**: Pulse animation from brand → journalist → outlet
- **Strategy Panel**: EVI "Visibility" driver shows +2.3 movement
- **Calendar**: "Pitch: Sarah Chen" appears in today's completed section

### 12.2 EVI Attribution Flow

PR actions emit EVI attribution events that flow to the Strategy Panel:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PR Work    │────▶│  Backend    │────▶│  Command    │────▶│  Strategy   │
│  Surface    │     │  API        │     │  Center     │     │  Panel      │
│             │     │             │     │             │     │             │
│ Manual Send │     │ eviAttrib   │     │ EVI Mover   │     │ Δ Visibility│
│             │     │ in response │     │ animation   │     │ +2.3        │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 12.3 PR Action Types and Their EVI Drivers

| PR Action | Mode | EVI Driver | Typical Delta |
|-----------|------|------------|---------------|
| Send pitch to tier-1 outlet | Manual | Visibility | +2.0–3.0 |
| Send pitch to tier-2 outlet | Manual | Visibility | +1.0–1.5 |
| Send follow-up | Copilot | Momentum | +0.5–1.0 |
| Log coverage mention | Manual | Authority | +3.0–5.0 |
| Add journalist to list | Manual | N/A (setup) | 0 |

### 12.4 Deep Link Integration

PR actions in Command Center link directly to PR Work Surface views:

| Action Type | Deep Link Pattern |
|-------------|-------------------|
| Send pitch | `/app/pr?view=pipeline&sequenceId={id}&contactId={id}` |
| Review journalist | `/app/pr?view=database&contactId={id}` |
| View coverage | `/app/pr?view=database&tab=inbox` |
| Create sequence | `/app/pr?view=pipeline&action=new-sequence` |

---

## 13. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-21 | 1.1 | Added PR Golden Flow examples (Section 12) |
| 2026-01-13 | 1.0 | V1 Golden Flow lock — frozen for release |

