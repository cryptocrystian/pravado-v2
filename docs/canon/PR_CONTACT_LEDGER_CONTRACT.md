# PR CONTACT LEDGER / RELATIONSHIP TIMELINE CONTRACT

> **Status:** CANONICAL (V1.1)
> **Authority:** This document defines the Contact Timeline / Relationship Ledger specification.
> **Classification:** Product Definition (Core Differentiator)
> **Last Updated:** 2026-01-14

---

## 1. Purpose

The **Contact Ledger** (also called Relationship Timeline) is the complete, chronological record of all interactions with a media contact. It is a core differentiator that transforms Pravado from a media database into a relationship intelligence system.

The Contact Ledger is NOT:
- A simple activity feed
- A CRM note field
- A pitch history list
- An email thread viewer

The Contact Ledger IS:
- A **comprehensive timeline** of all relationship events with context
- A **relationship state machine** with explicit stages and transitions
- An **explainable intelligence layer** showing why scores change
- A **next-best-action surface** with mode-aware recommendations

---

## 2. Timeline Event Types

### 2.1 Event Schema

```typescript
type LedgerEventType =
  | 'pitch_drafted'
  | 'pitch_sent'
  | 'pitch_opened'
  | 'reply_received'
  | 'coverage_won'
  | 'coverage_lost'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'relationship_stage_changed'
  | 'topic_currency_changed'
  | 'enrichment_suggested'
  | 'enrichment_approved'
  | 'enrichment_rejected'
  | 'meeting_logged'
  | 'social_interaction'
  | 'citation_detected';

interface LedgerEvent {
  id: string;
  contactId: string;
  type: LedgerEventType;
  timestamp: string; // ISO datetime

  // Event details
  title: string;
  description?: string;
  icon: string; // Icon identifier

  // Related entities
  relatedPitchId?: string;
  relatedCoverageId?: string;
  relatedTaskId?: string;

  // Metadata
  metadata: Record<string, unknown>;

  // For stage/score changes - explainability
  change?: {
    field: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string; // Human-readable explanation
  };

  // Actor
  actor: {
    type: 'user' | 'system' | 'contact';
    id?: string;
    name?: string;
  };

  // SAGE/EVI context
  sageContribution?: SAGEContribution;
  eviImpact?: EVIImpact;
}
```

### 2.2 Event Type Specifications

| Event Type | Icon | Actor | Triggers |
|------------|------|-------|----------|
| `pitch_drafted` | Draft icon | User/System | Pitch creation |
| `pitch_sent` | Send icon | User | Manual send |
| `pitch_opened` | Eye icon | System | Email tracking |
| `reply_received` | Reply icon | Contact | Email integration |
| `coverage_won` | Trophy icon | System | Coverage attribution |
| `coverage_lost` | X icon | User | Manual marking |
| `note_added` | Note icon | User | Manual note |
| `task_created` | Task icon | User/System | Task creation |
| `task_completed` | Check icon | User | Task completion |
| `relationship_stage_changed` | Arrow icon | System | Stage transition |
| `topic_currency_changed` | Trend icon | System | Currency decay/refresh |
| `enrichment_suggested` | Sparkle icon | System | CiteMind suggestion |
| `enrichment_approved` | Check icon | User | User approval |
| `enrichment_rejected` | X icon | User | User rejection |
| `meeting_logged` | Calendar icon | User | Manual entry |
| `social_interaction` | Social icon | System | Integration |
| `citation_detected` | Quote icon | System | CiteMind Engine 3 |

---

## 3. Relationship Stage Model

### 3.1 Stage Definitions

| Stage | Definition | Entry Criteria | Exit Criteria |
|-------|------------|----------------|---------------|
| **Cold** | No prior relationship | Default for new contacts | Any positive interaction |
| **Warm** | Initial contact established | Response to pitch OR manual outreach | Sustained engagement |
| **Engaged** | Active relationship | Multiple interactions + positive response rate | Coverage OR decay |
| **Advocate** | Strong relationship | Coverage obtained + continued engagement | Significant decay |

### 3.2 Stage Transition Rules

```
Cold → Warm:
  - Condition: First reply received OR manual "warm" flag
  - Reason: "Contact responded to outreach" OR "Manually marked as warm"

Warm → Engaged:
  - Condition: (response_rate > 30%) AND (interactions >= 3 in 90 days)
  - Reason: "Consistent engagement pattern established"

Engaged → Advocate:
  - Condition: (coverage_obtained) AND (positive_interactions >= 2 after coverage)
  - Reason: "Coverage published and relationship maintained"

[Any] → Cold (Decay):
  - Condition: No interaction in 180 days
  - Reason: "Relationship decayed due to inactivity"

Advocate → Engaged (Decay):
  - Condition: No interaction in 90 days
  - Reason: "Relationship strength reduced due to inactivity"
```

### 3.3 Stage Display Requirements

Each stage change event MUST display:
- Previous stage
- New stage
- Reason for change (human-readable)
- Date of change
- Suggested action to maintain/improve

---

## 4. Explainability Requirements

### 4.1 Score Change Explainability

When any score changes (relationship score, topic currency, pitch eligibility), the system MUST:

1. Create a timeline event
2. Show previous value and new value
3. Provide human-readable reason
4. Link to contributing factors

**Example Reasons:**

| Score | Change | Example Reason |
|-------|--------|----------------|
| Relationship Score | +5 | "Journalist responded to pitch within 24 hours" |
| Relationship Score | -10 | "No interaction in 60 days (decay)" |
| Topic Currency | +15 | "Recent article on relevant beat published" |
| Topic Currency | -8 | "Topic hasn't been covered in 30 days" |
| Pitch Eligibility | +10 | "Response rate improved to 40%" |
| Pitch Eligibility | -20 | "2 consecutive pitches without response" |

### 4.2 Explainability UI Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] Topic Currency Changed                     [Time ago]    │
│                                                                 │
│ Currency dropped from 78 → 62                                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Why: Journalist hasn't published on AI topics in 45 days.   │ │
│ │ Their recent focus has shifted to cybersecurity.            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Suggestion: Consider pitching on cybersecurity angle instead.  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Next Best Action Module

### 5.1 Purpose

The Next Best Action (NBA) module sits at the top of the Contact Ledger and provides a single, contextual recommendation for advancing the relationship.

### 5.2 NBA Rules

| Relationship State | Signal | NBA Recommendation | Mode Ceiling |
|--------------------|---------|--------------------|--------------|
| Cold + Recent pitch | No response 72h | "Send follow-up with new angle" | Manual |
| Warm + Trending topic | Topic match | "Pitch on [topic] - journalist active" | Manual |
| Engaged + Coverage gap | 30+ days | "Re-engage with exclusive offer" | Manual |
| Advocate + Milestone | Anniversary | "Send relationship maintenance note" | Manual |
| Any + Decay warning | Score dropping | "Take action to prevent decay" | Manual |

### 5.3 NBA Display

```
┌─────────────────────────────────────────────────────────────────┐
│ NEXT BEST ACTION                                   [Mode Badge] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Icon] Pitch on AI Marketing Trends                            │
│                                                                 │
│ Sarah has published 3 articles on AI marketing in the past     │
│ week. Topic currency is high (87) and she's responded to       │
│ 40% of pitches historically.                                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [SAGE: Signal + Authority]  [EVI: +Visibility]  [Manual]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Primary CTA: Create Pitch]                      [Dismiss]     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Mode Ceiling Enforcement

**All NBA CTAs for external actions MUST be Manual mode.** This includes:
- Sending pitches
- Sending follow-ups
- Any external communication

The NBA may suggest, but never auto-execute relationship actions.

---

## 6. Drawer Layout

### 6.1 Required Sections

The ContactDetailDrawer enhanced with Ledger MUST contain:

1. **Header**: Name, outlet, relationship stage, overall health
2. **Quick Stats**: Topic currency, pitch score, last interaction, AI citation score
3. **Next Best Action**: Single contextual recommendation
4. **Relationship Ledger**: Chronological timeline with all events
5. **Contact Info**: Email, channels, beats
6. **Notes**: User-added notes
7. **Actions**: Create Pitch, Edit Contact

### 6.2 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header: Name + Outlet + Stage Badge]              [Close]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐      │
│ │Topic Currency│ Pitch Score │ Last Touch  │ AI Citation │      │
│ │    [78]      │    [85]     │   [3d ago]  │    [62]     │      │
│ └─────────────┴─────────────┴─────────────┴─────────────┘      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ NEXT BEST ACTION                              [Mode Badge]  │ │
│ │ [Recommendation with CTA]                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ RELATIONSHIP LEDGER                      [Filter] [Search]  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [Event 1]                                                   │ │
│ │ [Event 2]                                                   │ │
│ │ [Event 3]                                                   │ │
│ │ ...                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Beats] [Contact Info] [Notes]                                 │
│                                                                 │
│ [Create Pitch]                               [Edit Contact]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Component Requirements

### 7.1 Required Component

| Component | Location | Purpose |
|-----------|----------|---------|
| `ContactRelationshipLedger.tsx` | `components/pr-work-surface/components/` | Timeline display |

### 7.2 Integration

The ledger component MUST be integrated into:
- `ContactDetailDrawer.tsx` as a primary section
- PR Database view (inline preview on hover)
- Pitch Composer (context panel)

---

## 8. Compliance Checklist

Contact Ledger implementations MUST satisfy:

- [ ] All event types render with appropriate icons
- [ ] Stage changes show previous/new/reason
- [ ] Score changes show previous/new/reason (explainability)
- [ ] Topic currency changes are explained
- [ ] Next Best Action module present at top
- [ ] NBA respects mode ceilings (Manual for external actions)
- [ ] Timeline is chronological (newest first by default)
- [ ] Events link to related entities
- [ ] Impact Strip integration on NBA
- [ ] No auto-execution of relationship actions

---

## 9. Governance

### 9.1 Canon Authority

This document is the authoritative specification for Contact Ledger behavior. Any implementation that deviates is non-compliant.

### 9.2 Change Control

Modifications require:
1. Product review sign-off
2. Update to PR_WORK_SURFACE_CONTRACT.md
3. Update to CI guardrails

---

## 10. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial Contact Ledger Contract specification |
