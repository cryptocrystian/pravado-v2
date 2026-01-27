# PR PITCH PIPELINE CONTRACT

> **Status:** CANONICAL (V1.1)
> **Authority:** This document defines the Pitch Pipeline specification.
> **Classification:** Product Definition
> **Last Updated:** 2026-01-14

---

## 1. Purpose

The **Pitch Pipeline** provides a visual, stage-based view of all pitches in progress, enabling users to track outreach status and manage follow-up workflows efficiently.

The Pitch Pipeline is NOT:
- A kanban board for drag-and-drop
- A sales pipeline clone
- A mass-send interface
- An auto-follow-up system

The Pitch Pipeline IS:
- A **stage-based visualization** of pitch progression
- A **follow-up workflow manager** with timing intelligence
- A **safe bulk action interface** for draft generation (never send)
- A **conversion tracking view** showing pitch-to-coverage outcomes

---

## 2. Pipeline Stages

### 2.1 Stage Definitions

| Stage | Description | Entry Condition | Exit Condition |
|-------|-------------|-----------------|----------------|
| **Drafting** | Pitch being composed | Pitch created | Marked ready or sent |
| **ReadyToSend** | Draft complete, awaiting send | Manually marked ready | Sent or returned to draft |
| **Sent** | Pitch delivered | Manual send action | Opens, reply, or timeout |
| **Opened** | Email opened (tracking detected) | Open tracking event | Reply or follow-up window |
| **Replied** | Journalist responded | Reply received | Won, lost, or continued conversation |
| **Won** | Coverage obtained | Manual marking + attribution | Terminal |
| **Lost** | No coverage / declined | Manual marking or timeout | Terminal |
| **FollowUpDue** | Follow-up window reached | Time-based trigger | Follow-up sent or conversation continued |

### 2.2 Stage Flow Diagram

```
                    ┌──────────────┐
                    │   Drafting   │
                    └──────┬───────┘
                           │ Mark Ready
                           ▼
                    ┌──────────────┐
                    │ ReadyToSend  │ ◄─── Return to Draft
                    └──────┬───────┘
                           │ Manual Send
                           ▼
                    ┌──────────────┐
                    │     Sent     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌─────────────┐
       │  Opened  │ │ Replied  │ │FollowUpDue  │
       └────┬─────┘ └────┬─────┘ └──────┬──────┘
            │            │              │
            └────────────┼──────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │   Won    │          │   Lost   │
        └──────────┘          └──────────┘
```

### 2.3 TypeScript Definition

```typescript
type PitchPipelineStage =
  | 'drafting'
  | 'ready_to_send'
  | 'sent'
  | 'opened'
  | 'replied'
  | 'won'
  | 'lost'
  | 'follow_up_due';

interface PitchPipelineItem {
  id: string;
  pitchId: string;
  pitch: Pitch;
  contact: MediaContact;

  stage: PitchPipelineStage;
  stageEnteredAt: string;

  // Follow-up tracking
  followUpWindow?: {
    opensAt: string;
    closesAt: string;
    suggestedTemplates: string[];
  };
  followUpCount: number;
  maxFollowUps: number; // Guardrail: max 2 per 7 days

  // Timing
  daysSinceLastActivity: number;
  isOverdue: boolean;

  // Context
  sageContributions?: SAGEContribution[];
  eviImpact?: EVIImpact;
}
```

---

## 3. Allowed Actions per Stage

### 3.1 Action Matrix

| Stage | Allowed Actions | Mode Ceiling |
|-------|-----------------|--------------|
| **Drafting** | Edit, Delete, Mark Ready | Autopilot (internal) |
| **ReadyToSend** | Edit, Send, Return to Draft | Manual (send only) |
| **Sent** | View, Mark Won/Lost | Manual |
| **Opened** | View, Generate Follow-up Draft | Copilot (draft only) |
| **Replied** | View, Continue Conversation, Mark Won/Lost | Manual |
| **Won** | View, Add to Coverage | N/A (terminal) |
| **Lost** | View, Archive, Reopen | Manual |
| **FollowUpDue** | Generate Follow-up Draft, Edit, Send | Manual (send only) |

### 3.2 Explicit Prohibitions

**The following actions are NEVER allowed in the Pipeline view:**

| Action | Reason |
|--------|--------|
| **Bulk Send** | External communication must be human-initiated per-item |
| **Auto-Send** | Mode ceiling violation |
| **Auto-Follow-up** | Mode ceiling violation |
| **Send All Ready** | Bulk external action prohibited |

---

## 4. Follow-up Workflow

### 4.1 Follow-up Window Logic

```typescript
interface FollowUpWindow {
  // Default: opens 3 days after send, closes 7 days after send
  defaultOpenDays: 3;
  defaultCloseDays: 7;

  // Maximum follow-ups per 7-day period
  maxFollowUpsPerWeek: 2;

  // Cooldown after reply (don't suggest follow-up)
  cooldownAfterReplyDays: 5;
}
```

### 4.2 Follow-up Generation (Copilot)

When a pitch enters FollowUpDue stage, the system MAY:

1. **Generate Follow-up Draft** (Copilot mode)
   - Uses original pitch context
   - References any opens/partial engagement
   - Applies follow-up templates
   - Creates draft in Drafting stage

2. **Suggest Templates** (Copilot mode)
   - Show relevant follow-up templates
   - Personalization suggestions
   - Timing recommendations

The system MUST NOT:
- Auto-send follow-ups
- Send follow-ups without user action
- Exceed follow-up guardrails

### 4.3 Follow-up Templates

| Template | Use Case | Variables |
|----------|----------|-----------|
| **Gentle Nudge** | First follow-up, no opens | `{contact_name}`, `{original_subject}`, `{days_since}` |
| **Added Value** | First follow-up, opened but no reply | `{contact_name}`, `{new_angle}`, `{supporting_data}` |
| **Last Chance** | Second follow-up | `{contact_name}`, `{deadline}`, `{exclusive_offer}` |
| **Alternative Angle** | Pivot pitch | `{contact_name}`, `{new_topic}`, `{relevance_reason}` |

---

## 5. Safe Bulk Actions

### 5.1 Allowed Bulk Actions

| Bulk Action | Description | Mode | Safeguards |
|-------------|-------------|------|------------|
| **Generate Drafts for Selected** | Create follow-up drafts for multiple pitches | Copilot | Drafts only, no send |
| **Queue for Review** | Mark selected items for batch review | Autopilot | Internal only |
| **Export List** | Export selected pitches to CSV | Autopilot | Read-only |
| **Archive Lost** | Move selected Lost items to archive | Autopilot | Internal only |

### 5.2 Prohibited Bulk Actions

| Action | Reason |
|--------|--------|
| **Send All** | External communication must be individual |
| **Send Selected** | External communication must be individual |
| **Auto-Follow-up All** | Mode ceiling violation |
| **Bulk Mark Won/Lost** | Requires individual attribution |

---

## 6. Pipeline View Requirements

### 6.1 Display Options

| View | Description | Best For |
|------|-------------|----------|
| **Column View** | Stage columns with cards | Visual overview |
| **Table View** | Sortable table with stage column | Bulk management |

### 6.2 Column View Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PITCH PIPELINE                                       [View: Column/Table]│
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│ Drafting │Ready     │ Sent     │ Opened   │Follow-Up │ Replied  │ Won    │
│   (3)    │To Send(2)│   (5)    │   (2)    │ Due (4)  │   (1)    │  (8)   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card] │
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │          │ [Card] │
│ [Card]   │          │ [Card]   │          │ [Card]   │          │ [Card] │
│          │          │ [Card]   │          │ [Card]   │          │ [Card] │
│          │          │ [Card]   │          │          │          │ [Card] │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

### 6.3 Pipeline Card Structure

```
┌─────────────────────────────────────────┐
│ [Outlet Badge]           [Days in Stage]│
│                                         │
│ [Contact Name]                          │
│ [Pitch Subject - truncated]             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Impact Strip]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Primary CTA]               [More ▼]   │
└─────────────────────────────────────────┘
```

---

## 7. Filters and Saved Views

### 7.1 Required Filters

| Filter | Options | Default |
|--------|---------|---------|
| **Stage** | All stages | All active (not Won/Lost) |
| **Contact** | Search contacts | None |
| **Time Range** | Last 7/30/90 days, All | Last 30 days |
| **Follow-up Status** | Due, Overdue, Not Yet | All |
| **Outlet Tier** | T1, T2, T3, Trade, Niche | All |

### 7.2 Saved Views

| View Name | Filters | Purpose |
|-----------|---------|---------|
| **Active Outreach** | Stage: Sent, Opened, FollowUpDue | Daily review |
| **Ready to Send** | Stage: ReadyToSend | Send queue |
| **Follow-ups Due** | Stage: FollowUpDue, Overdue: true | Urgent attention |
| **Recent Wins** | Stage: Won, Time: 30 days | Celebrate success |

---

## 8. Route Definition

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/pr/pitches/pipeline` | `PRPitchPipeline.tsx` | Pipeline view |

Alternatively, the Pipeline may be a tab within the existing `/app/pr` Pitches view.

---

## 9. Compliance Checklist

Pitch Pipeline implementations MUST satisfy:

- [ ] All stages render with correct actions
- [ ] Send action is Manual mode only
- [ ] No bulk send action exists
- [ ] Follow-up generation is Copilot (draft only)
- [ ] Follow-up guardrails enforced (max 2 per 7 days)
- [ ] Impact Strip displayed on cards
- [ ] Filters available and functional
- [ ] Column and Table views available
- [ ] Won/Lost are terminal states
- [ ] Export action available

---

## 10. Governance

### 10.1 Canon Authority

This document is the authoritative specification for Pitch Pipeline behavior. Any implementation that deviates is non-compliant.

### 10.2 Change Control

Modifications require:
1. Product review sign-off
2. Update to PR_WORK_SURFACE_CONTRACT.md
3. Update to CI guardrails

---

## 11. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial Pitch Pipeline Contract specification |
