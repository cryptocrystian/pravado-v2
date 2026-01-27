# PR INBOX / WORK QUEUE CONTRACT

> **Status:** CANONICAL (V1.1)
> **Authority:** This document defines the PR Inbox / Work Queue specification.
> **Classification:** Product Definition
> **Last Updated:** 2026-01-14

---

## 1. Purpose

The **PR Inbox** is the daily driver for PR users. It surfaces all actionable items across the PR pillar in a single, prioritized queue that enables one-click continuation into the correct next state.

The PR Inbox is NOT:
- A notification feed
- An email inbox clone
- A todo list
- A passive activity log

The PR Inbox IS:
- A **unified work queue** across all PR activity types
- A **prioritized action surface** with urgency and SLA semantics
- A **one-click continuation system** that routes users directly to context-rich next screens
- A **guardrail-aware interface** that respects automation ceilings

---

## 2. Inbox Item Types

### 2.1 Item Type Definitions

| Type | Description | Source | Mode Ceiling |
|------|-------------|--------|--------------|
| **Inquiry** | Inbound media request requiring response | Monitoring, email integration | Manual |
| **FollowUpDue** | Pitch follow-up window reached | System calculation | Manual |
| **CoverageTriage** | New coverage detected, needs attribution | Monitoring | Copilot |
| **RelationshipDecay** | Relationship score dropped below threshold | System calculation | Manual |
| **ApprovalQueue** | Copilot-generated draft awaiting review | SAGE/Copilot | Manual |
| **DataHygiene** | Contact enrichment or dedupe suggestion | CiteMind Engine 3 | Copilot |

### 2.2 TypeScript Definition

```typescript
type InboxItemType =
  | 'inquiry'
  | 'follow_up_due'
  | 'coverage_triage'
  | 'relationship_decay'
  | 'approval_queue'
  | 'data_hygiene';

interface InboxItem {
  id: string;
  type: InboxItemType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueAt?: string; // ISO datetime
  urgency: number; // 0-100, affects sort order
  confidence?: number; // 0-100, system confidence in suggestion
  risk?: 'none' | 'low' | 'medium' | 'high'; // Risk of inaction

  // Related entities
  relatedContactId?: string;
  relatedPitchId?: string;
  relatedCoverageId?: string;
  relatedReleaseId?: string;

  // Primary CTA
  primaryAction: {
    label: string;
    targetRoute: string;
    preloadContext?: Record<string, unknown>;
  };

  // Automation context
  modeCeiling: AutomationMode;
  sageContributions?: SAGEContribution[];
  eviImpact?: EVIImpact;

  createdAt: string;
  expiresAt?: string;
}
```

---

## 3. SLA Semantics

### 3.1 Due Date Calculation

| Item Type | SLA Default | Urgency Calculation |
|-----------|-------------|---------------------|
| **Inquiry** | 4 hours | `urgency = 100 - (hoursRemaining / 4 * 100)` |
| **FollowUpDue** | From pitch follow-up window | Based on follow-up rules |
| **CoverageTriage** | 24 hours | Standard decay |
| **RelationshipDecay** | 48 hours (warning) | Based on decay rate |
| **ApprovalQueue** | 24 hours | Standard |
| **DataHygiene** | 7 days | Low urgency |

### 3.2 Risk Classification

| Risk Level | Visual Indicator | Interpretation |
|------------|------------------|----------------|
| **None** | No indicator | Item can wait |
| **Low** | Subtle border | Should address soon |
| **Medium** | Amber highlight | Prioritize today |
| **High** | Red pulse | Immediate attention required |

---

## 4. One-Click Continuation

### 4.1 Core Requirement

**Every Inbox item MUST have a primary CTA that takes the user directly into the next screen state with full context preloaded.**

This is the defining characteristic of the PR Inbox. Users should never have to hunt for where to take action.

### 4.2 Continuation Routes

| Item Type | Primary CTA | Target Screen State |
|-----------|-------------|---------------------|
| **Inquiry** | "Respond" | PitchComposer with contact + inquiry context + suggested angles |
| **FollowUpDue** | "Draft Follow-up" | Pitch detail with follow-up editor + templates |
| **CoverageTriage** | "Review Coverage" | Coverage detail with attribution fields + "Confirm citation" actions |
| **RelationshipDecay** | "Re-engage" | ContactDetailDrawer → Relationship Ledger with suggested next touch |
| **ApprovalQueue** | "Review Draft" | Draft review modal with approve/edit/save-to-drafts (NOT send) |
| **DataHygiene** | "Review Suggestion" | Data quality modal with approve/reject enrichment |

### 4.3 Context Preload

When routing to target screen, the system MUST preload:

```typescript
interface PreloadContext {
  // Source context
  inboxItemId: string;
  itemType: InboxItemType;

  // Entity context
  contact?: MediaContact;
  pitch?: Pitch;
  coverage?: Coverage;
  release?: PressRelease;

  // Suggested content (Copilot)
  suggestedAngles?: string[];
  suggestedTemplate?: string;
  draftContent?: string;

  // Intelligence
  sageSignals?: Signal[];
  competitiveContext?: string;
  timingRationale?: string;
}
```

---

## 5. Automation Ceilings

### 5.1 Mode Ceiling Enforcement

| Item Type | Mode Ceiling | Rationale |
|-----------|--------------|-----------|
| **Inquiry** | Manual | External communication, relationship impact |
| **FollowUpDue** | Manual | External communication, relationship sensitive |
| **CoverageTriage** | Copilot | Attribution can be suggested, but human confirms |
| **RelationshipDecay** | Manual | Relationship decisions require human judgment |
| **ApprovalQueue** | Manual | By definition, requires human approval |
| **DataHygiene** | Copilot | Enrichment can be suggested, human confirms |

### 5.2 Approval Queue Special Rules

Items in ApprovalQueue are Copilot-generated drafts. The approval interface MUST:

- Show "Approve & Save" (NOT "Approve & Send")
- Show "Edit Draft"
- Show "Reject"
- Display confidence score and rationale
- Show SAGE/EVI context

**The system MUST NOT allow direct send from approval queue.** Approved drafts go to the Pitches view for manual send.

---

## 6. Anti-Patterns

### 6.1 Prohibited Practices

| Anti-Pattern | Why Prohibited | Detection |
|--------------|----------------|-----------|
| **Dead-end cards** | Forces users to hunt for next action | Card without primaryAction |
| **Auto-send** | External comms must be human-approved | Any auto-send logic |
| **Spammy batch actions** | Damages relationships | Bulk action without safeguards |
| **Hunt-and-find** | User must click through multiple screens | CTA that doesn't land in context |
| **Notification overload** | Low-value items drown high-value | No priority filtering |

### 6.2 Required Safeguards

- Inbox items expire after their window closes
- Expired items move to archive, not delete
- User can snooze items (max 48 hours)
- Critical items cannot be snoozed
- No more than 10 items shown at once (pagination)

---

## 7. UI Requirements

### 7.1 Grouped Sections

The Inbox MUST display items in grouped sections with counts:

1. **Inbound Inquiries** — Count badge
2. **Follow-ups Due** — Count badge + urgency indicator
3. **Coverage Triage** — Count badge
4. **Relationship Decay** — Count badge + risk indicator
5. **Approval Queue** — Count badge
6. **Data Hygiene** — Count badge

### 7.2 Item Card Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Priority Badge] [Item Type Badge]                     [Time]   │
│                                                                 │
│ [Title - max 2 lines]                                          │
│                                                                 │
│ [Description - max 2 lines]                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [SAGE Tags]  [EVI Direction]  [Mode Badge]                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Primary CTA Button]                              [Secondary]   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Impact Strip Integration

Every Inbox item MUST display the Impact Strip showing:
- SAGE contribution tags (Signal / Authority / Growth / Exposure)
- EVI driver direction (Visibility/Authority/Momentum +/0/-)
- AUTOMATE mode badge (Manual/Copilot/Autopilot)

---

## 8. Route Definition

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/pr/inbox` | `PRInbox.tsx` | PR Inbox / Work Queue view |

---

## 9. Compliance Checklist

PR Inbox implementations MUST satisfy:

- [ ] All item types have one-click primary CTA
- [ ] Primary CTA routes to correct screen with context preloaded
- [ ] Mode ceilings enforced (no auto-send)
- [ ] Approval queue items cannot directly send
- [ ] Impact Strip displayed on all items
- [ ] Grouped sections with counts
- [ ] Urgency/risk indicators displayed
- [ ] Items expire appropriately
- [ ] No dead-end cards
- [ ] No hunt-and-find patterns

---

## 10. Governance

### 10.1 Canon Authority

This document is the authoritative specification for PR Inbox behavior. Any implementation that deviates is non-compliant.

### 10.2 Change Control

Modifications require:
1. Product review sign-off
2. Update to PR_WORK_SURFACE_CONTRACT.md
3. Update to CI guardrails
4. Update to type definitions

---

## 11. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial PR Inbox Contract specification |
