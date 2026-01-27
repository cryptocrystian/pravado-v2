# ORCHESTRATION CALENDAR CONTRACT

> **Status:** CANONICAL — FROZEN
> **Authority:** This document defines the semantic contract for the Orchestration Calendar component.
> **Classification:** V1 Lock — Changes require formal change control
> **Last Updated:** 2026-01-13

---

## 1. Prime Directive

The Orchestration Calendar answers ONE question:

> **"When will the system act, and when do I need to intervene?"**

Every item, every indicator, every interaction serves this question. The calendar shows AUTOMATE's execution timeline — what's scheduled, what's running, what needs approval, and what completed.

---

## 2. What the Calendar IS

| Attribute | Definition |
|-----------|------------|
| **AUTOMATE Timeline** | The visual representation of AUTOMATE's execution schedule |
| **Intervention Surface** | Shows where human input is required (approvals, reviews, decisions) |
| **Execution Monitor** | Displays status of running and completed actions |
| **Mode Indicator** | Shows which actions are Autopilot vs Copilot vs Manual |
| **Risk Surface** | Makes risk levels visible before execution |

### 2.1 Core Behaviors (FROZEN)

| Behavior | Specification |
|----------|---------------|
| **Fixed Height** | Container height is FIXED at `h-[280px]` — does not change between views |
| **View Modes** | Day, Week, Month — all within same fixed container |
| **Click Opens Modal** | Clicking a calendar item opens the Action Modal (never navigates away) |
| **Today Awareness** | "Today" button appears when not viewing current date |
| **Pillar Color Coding** | Items colored by pillar (PR/Content/SEO) |

---

## 3. What the Calendar IS NOT

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| **NOT a Task Planner** | Users don't create tasks here — SAGE proposes, Calendar shows |
| **NOT a Content Calendar** | We show execution items, not content ideas |
| **NOT a Project Manager** | No Gantt charts, no resource allocation |
| **NOT a Scheduling Tool** | Users don't drag-and-drop to reschedule |
| **NOT a Todo List** | Items are system-orchestrated, not user-created checklists |
| **NOT Navigation** | Clicking items opens modal, never navigates to another page |

---

## 4. Item Taxonomy

### 4.1 Required Fields (FROZEN)

Every calendar item MUST declare:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `date` | string | ISO date (YYYY-MM-DD) |
| `time` | string | Time slot (HH:MM) |
| `pillar` | enum | `pr` \| `content` \| `seo` |
| `title` | string | Human-readable action title |
| `status` | enum | Current execution status |
| `mode` | enum | AUTOMATE mode (manual/copilot/autopilot) |

### 4.2 Required Detail Fields

| Field | Type | Description |
|-------|------|-------------|
| `details.summary` | string | Brief explanation of the action |
| `details.owner` | enum | `AI` \| `User` |
| `details.risk` | enum | `low` \| `med` \| `high` |
| `details.estimated_duration` | string | Expected time to complete |
| `details.dependencies` | array | Blocking items or approvals |

### 4.3 Optional Linking Fields

| Field | Type | Description |
|-------|------|-------------|
| `linked.action_id` | string \| null | Link to Action Stream item |
| `linked.campaign_id` | string \| null | Parent campaign reference |

---

## 5. Status Progression

### 5.1 Status States (FROZEN)

| Status | Visual Indicator | Meaning |
|--------|------------------|---------|
| **planned** | Circle outline | Future action, not yet started |
| **drafting** | Pulsing dot | AI is actively working on deliverable |
| **awaiting_approval** | Amber badge | Requires human approval to proceed |
| **scheduled** | Solid dot | Confirmed for execution at specified time |
| **published** | Check mark | Successfully completed |
| **failed** | Red X | Execution failed, may need intervention |

### 5.2 Status Flow

```
planned → drafting → awaiting_approval → scheduled → published
                                    ↘
                                      failed (retry or abandon)
```

### 5.3 Status Urgency

| Status | Urgency | User Action Required |
|--------|---------|---------------------|
| awaiting_approval | HIGH | Must approve or reject |
| failed | HIGH | Must review and decide next step |
| drafting | MEDIUM | May want to review progress |
| scheduled | LOW | Can monitor, intervention optional |
| planned | NONE | Future state, no action needed |
| published | NONE | Complete, review optional |

---

## 6. Mode Display Rules

### 6.1 Mode Definitions (FROZEN)

| Mode | Badge | Meaning | User Expectation |
|------|-------|---------|-----------------|
| **manual** | "Manual" | Human must initiate and execute | Full user control |
| **copilot** | "Copilot" | AI prepares, human approves | Review required |
| **autopilot** | "Auto" | AI executes within guardrails | Monitor only |

### 6.2 Mode Visual Hierarchy

| Mode | Badge Style | Prominence |
|------|-------------|------------|
| manual | Outline, neutral | Low — user already in control |
| copilot | Solid, pillar-tinted | Medium — indicates AI assistance |
| autopilot | Solid, cyan glow | High — emphasizes autonomous execution |

### 6.3 Mode and Status Relationship

| Mode | Typical Status Flow |
|------|---------------------|
| manual | planned → scheduled → (user acts) → published |
| copilot | planned → drafting → awaiting_approval → scheduled → published |
| autopilot | planned → scheduled → published (automatic) |

---

## 7. Risk Indicators

### 7.1 Risk Levels (FROZEN)

| Risk | Visual | Meaning | Examples |
|------|--------|---------|----------|
| **low** | No indicator | Internal or reversible action | SEO tweak, internal draft |
| **med** | Amber dot | External but recoverable | Email outreach, content publish |
| **high** | Red dot | External with reputation impact | Press release, analyst briefing |

### 7.2 Risk and Mode Relationship

| Risk Level | Autopilot Allowed | Approval Required |
|------------|-------------------|-------------------|
| low | Yes | No |
| med | Yes (with guardrails) | Copilot: Yes |
| high | No | Always |

### 7.3 Risk Display Rules

- Risk indicator appears on item badges
- High-risk items should be visually prominent
- Risk tooltip explains why the classification

---

## 8. Authority Markers

### 8.1 Owner Field (FROZEN)

| Owner | Meaning | Visual |
|-------|---------|--------|
| **AI** | SAGE/AUTOMATE is responsible | AI icon or "AI" label |
| **User** | Human is responsible | User icon or no special marker |

### 8.2 Authority Implications

| Owner | Expectation |
|-------|-------------|
| AI + autopilot | System will execute without intervention |
| AI + copilot | System prepares, user must approve |
| User + manual | User initiates and completes |
| User + copilot | AI assists, user drives |

---

## 9. View Specifications

### 9.1 Day View (FROZEN)

| Element | Specification |
|---------|---------------|
| **Header** | Large single-day display with navigation arrows |
| **Grouping** | Hourly agenda groups (Early Morning, Morning, Midday, Afternoon, Evening) |
| **Item Display** | Full item cards with all badges |
| **Scroll** | Vertical scroll within fixed container |

### 9.2 Week View (FROZEN)

| Element | Specification |
|---------|---------------|
| **Header** | 7-day horizontal strip with selectable days |
| **Day Selection** | Clicking a day updates agenda list below |
| **Agenda Panel** | Shows items for selected date |
| **Indicators** | Pillar dots on days with scheduled items |

### 9.3 Month View (FROZEN)

| Element | Specification |
|---------|---------------|
| **Grid** | Compact 6-row calendar grid |
| **Day Cells** | Show pillar dot indicators, not full items |
| **Split View** | Desktop: Calendar left, Agenda right |
| **Mobile** | Segmented "Calendar | Agenda" tabs |

---

## 10. Interaction Contract

### 10.1 Click Behavior (FROZEN)

| Target | Action | Result |
|--------|--------|--------|
| **Calendar item** | Click | Opens Action Modal (centered overlay) |
| **Day cell** | Click | Selects date, updates agenda |
| **View toggle** | Click | Switches between Day/Week/Month |
| **Today button** | Click | Returns to current date |
| **Navigation arrows** | Click | Previous/next period |

### 10.2 What MUST NOT Happen

| Forbidden Action | Reason |
|------------------|--------|
| Navigate to different page | Calendar is self-contained |
| Drag-and-drop rescheduling | Users don't schedule, SAGE proposes |
| Inline editing | Edit happens in Action Modal |
| Create new item from calendar | Items come from SAGE proposals |

---

## 11. Action Modal Integration

### 11.1 Modal Content (when item clicked)

The Action Modal displays:

| Section | Content |
|---------|---------|
| **Header** | Title, pillar badge, mode badge |
| **Summary** | Full action description |
| **Metadata** | Date, time, duration, owner, risk |
| **Dependencies** | Blocking items or approvals needed |
| **Actions** | Approve/Reject (if awaiting), Pause/Cancel (if scheduled) |
| **Audit Trail** | Status history and timestamps |

### 11.2 Modal Actions by Status

| Status | Available Actions |
|--------|-------------------|
| planned | No actions (future state) |
| drafting | Preview draft, Pause |
| awaiting_approval | Approve, Reject, Request Changes |
| scheduled | Pause, Cancel |
| published | View details only |
| failed | Retry, Abandon, Investigate |

---

## 12. Dependencies Display

### 12.1 Dependency Types

| Type | Display | Meaning |
|------|---------|---------|
| **Item Dependency** | Linked item chip | Must wait for another action to complete |
| **Approval Dependency** | Approval badge | Requires explicit human approval |
| **External Dependency** | External chip | Depends on third-party action |

### 12.2 Blocking Visualization

When an item has unmet dependencies:

- Status shows as "blocked" state variant
- Dependencies listed with status indicators
- Unmet dependencies highlighted in amber/red

---

## 13. CalendarPeek Contract

### 13.1 CalendarPeek Purpose

The `CalendarPeek` component is the Command Center's calendar summary view:

| Attribute | Specification |
|-----------|---------------|
| **Location** | Bottom of center pane in Command Center |
| **Container** | Fixed `h-[280px]` — IMMUTABLE |
| **Default View** | Week view with today selected |
| **Item Limit** | Next 5 upcoming items in peek mode |

### 13.2 CalendarPeek Behaviors

| Behavior | Specification |
|----------|---------------|
| **Item Click** | Opens Action Modal (NOT drawer) |
| **View All Link** | Links to `/app/calendar` for full view |
| **Today Button** | Appears when not viewing today |
| **Status Summary** | Shows count of items by status |

---

## 14. Performance Constraints

### 14.1 Limits (FROZEN)

| Constraint | Limit | Rationale |
|------------|-------|-----------|
| **Items per day** | 20 max displayed | Cognitive load |
| **Date range** | 60 days past/future | Performance |
| **Concurrent fetches** | 1 per view change | API throttling |

### 14.2 Loading States

| State | Display |
|-------|---------|
| **Loading** | Skeleton grid/items |
| **Empty** | "No scheduled items" message |
| **Error** | Error banner with retry option |

---

## 15. What MUST NOT Change

The following are FROZEN for V1:

1. **Fixed height container** — `h-[280px]` is immutable
2. **View modes** — Day/Week/Month only
3. **Click opens modal** — Never navigate away
4. **Status states** — The 6 status values are complete
5. **Mode values** — manual/copilot/autopilot only
6. **Risk levels** — low/med/high only
7. **The Prime Directive question** — Calendar answers ONE question only

---

## 16. Change Control

### 16.1 Modification Requirements

Any change to this contract requires:

1. Product review documenting necessity
2. Impact analysis on AUTOMATE integration
3. Canon update through formal process
4. CI gate verification

### 16.2 Allowed Extensions

V2 may extend (not modify):

- Additional status states (must integrate into flow)
- Additional metadata fields (must not break existing)
- Enhanced filtering (must not change core behavior)
- Notification integration (must not add navigation)

---

## 17. Compliance Checklist

Implementations MUST satisfy:

- [ ] Container height is fixed at `h-[280px]`
- [ ] Clicking items opens Action Modal (not drawer, not navigation)
- [ ] All items have required fields (id, date, time, pillar, title, status, mode)
- [ ] All items have required detail fields (summary, owner, risk, estimated_duration, dependencies)
- [ ] Status badges match specification
- [ ] Mode badges match specification
- [ ] Risk indicators display correctly
- [ ] View switching works (Day/Week/Month)
- [ ] Today button appears when not viewing today
- [ ] No drag-and-drop or inline editing

---

## 18. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | V1 semantic lock — frozen for release |

