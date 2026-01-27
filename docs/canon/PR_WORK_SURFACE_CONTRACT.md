# PR WORK SURFACE CONTRACT

> **Status:** CANONICAL (V1 FREEZE)
> **Authority:** This document defines the V1 frozen contract for the PR Work Surface.
> **Classification:** V1 Release Specification
> **Last Updated:** 2026-01-14

---

## 1. Contract Purpose

This document defines the **V1 frozen contract** for the PR Work Surface. All implementations must conform to this specification. Any deviation requires a Canon Amendment PR.

---

## 2. Why Switch from Cision/Meltwater/Prezly

### 2.1 The Problem with Traditional PR Tools

| Tool | Primary Problem | Why Pravado is Different |
|------|-----------------|--------------------------|
| **Cision** | Distribution-first; volume over quality; no AI visibility | Relationship-first; quality metrics; CiteMind integration |
| **Meltwater** | Monitoring-heavy; weak outreach; siloed from content/SEO | Integrated pillar; cross-pillar reinforcement; SAGE orchestration |
| **Prezly** | CRM-like but no intelligence; no AI optimization | SAGE-driven proposals; CiteMind citation tracking |

### 2.2 The Pravado Advantage

| Capability | Traditional Tools | Pravado |
|------------|-------------------|---------|
| **Distribution model** | Pay-per-release wire | CiteMind AEO + optional wire |
| **Intelligence** | Separate monitoring tool | Integrated CiteMind Engine 3 |
| **Cross-pillar** | Isolated silo | PR → Content → SEO reinforcement |
| **AI visibility** | Not addressed | Native CiteMind citation building |
| **Automation** | Bulk send (dangerous) | Governed modes (safe) |
| **Measurement** | Vanity metrics (impressions) | Outcome metrics (coverage, citations) |

### 2.3 Value Proposition

**One sentence:** Pravado PR builds AI-visible influence through relationship-based outreach, not pay-per-blast distribution.

---

## 3. Automation Spectrum Definition

### 3.1 Mode Definitions for PR

| Mode | Description | User Role | System Role |
|------|-------------|-----------|-------------|
| **Manual** | User initiates and executes all actions | Full control | Research/context only |
| **Copilot** | System proposes and assists; user approves | Approve/modify | Draft, suggest, prepare |
| **Autopilot** | System executes within guardrails | Monitor | Execute low-risk internal actions |

### 3.2 Action-Mode Matrix (V1)

| Action | Manual | Copilot | Autopilot | V1 Default |
|--------|--------|---------|-----------|------------|
| Journalist research | Yes | Yes | Yes | Copilot |
| Media list building | Yes | Yes | Yes | Copilot |
| Coverage monitoring | Yes | Yes | Yes | Autopilot |
| Pitch draft | Yes | Yes | No | Copilot |
| Pitch send | Yes | No | No | Manual |
| Press release draft | Yes | Yes | No | Copilot |
| Pravado Newsroom publish | Yes | Yes | No | Copilot |
| Wire distribution | Yes | No | No | Manual |
| Follow-up sending | Yes | No | No | Manual |

### 3.3 Mode Ceiling Enforcement

**CRITICAL:** The following actions have hard mode ceilings that cannot be overridden:

| Action | Mode Ceiling | Rationale |
|--------|--------------|-----------|
| **Pitch send** | Manual | External, irreversible, relationship impact |
| **Wire distribution** | Manual | External, costly, compliance implications |
| **Follow-up sending** | Manual | Relationship sensitive |
| **Crisis response** | Manual | High stakes |

These ceilings apply regardless of:
- Plan tier (Enterprise included)
- Trust level (Veteran included)
- Confidence score (even at 1.0)

---

## 4. Distribution Model (V1)

### 4.1 CiteMind AEO Distribution

The primary distribution path in V1:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CITEMIND AEO DISTRIBUTION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │   Draft     │───►│   Schema    │───►│  Publish    │         │
│   │   Release   │    │   Generate  │    │  Newsroom   │         │
│   └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                                │                 │
│                                                ▼                 │
│                                         ┌─────────────┐         │
│                                         │  IndexNow   │         │
│                                         │  Notify     │         │
│                                         └──────┬──────┘         │
│                                                │                 │
│                                                ▼                 │
│                                         ┌─────────────┐         │
│                                         │  Citation   │         │
│                                         │  Tracking   │         │
│                                         └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**V1 Features:**
- Pravado Newsroom hosted page
- NewsArticle schema auto-generation
- IndexNow ping on publish
- CiteMind citation tracking enabled

### 4.2 Legacy Wire Integration (V1)

| Feature | V1 Status | Notes |
|---------|-----------|-------|
| PR Newswire submission | Available | Manual mode only |
| BusinessWire submission | Available | Manual mode only |
| GlobeNewswire submission | Roadmap | Not V1 |
| Cost preview | Required | Before submission |
| Draft preview | Required | Before submission |

**V1 Constraint:** Wire distribution always requires explicit user confirmation with cost display.

---

## 5. V1 Surface Layout

### 5.1 PR Work Surface Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                       PR WORK SURFACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────┐   ┌───────────────────────────────────┐ │
│   │   NAVIGATION      │   │           MAIN WORK AREA          │ │
│   │                   │   │                                   │ │
│   │   • Dashboard     │   │   [Context-dependent content]     │ │
│   │   • Media DB      │   │                                   │ │
│   │   • Pitches       │   │   • Media Database view           │ │
│   │   • Releases      │   │   • Pitch Composer                │ │
│   │   • Coverage      │   │   • Press Release Editor          │ │
│   │   • Analytics     │   │   • Coverage Dashboard            │ │
│   │                   │   │                                   │ │
│   └───────────────────┘   └───────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Required Views (V1)

| View | Route | Status | Description |
|------|-------|--------|-------------|
| PR Dashboard | `/app/pr` | Required | Overview, SAGE proposals, quick actions |
| Media Database | `/app/pr/media` | Required | Journalist contacts, search, lists |
| Pitch Composer | `/app/pr/pitch/[id]` | Required | Create/edit pitch with context |
| Contact Detail | `/app/pr/media/[id]` | Required | Journalist profile + timeline |
| Press Releases | `/app/pr/releases` | Required | Release management |
| Release Editor | `/app/pr/releases/[id]` | Required | Create/edit release |
| Coverage | `/app/pr/coverage` | Required | Coverage tracking |
| Analytics | `/app/pr/analytics` | Required | PR performance metrics |

### 5.3 Component Requirements

| Component | V1 Requirement | Description |
|-----------|----------------|-------------|
| **MediaDatabaseTable** | Required | Sortable, filterable journalist list |
| **JournalistCard** | Required | Compact journalist info display |
| **ContactTimeline** | Required | Interaction history |
| **PitchComposer** | Required | Draft/edit pitch with context |
| **PersonalizationScore** | Required | Real-time pitch quality indicator |
| **ReleaseEditor** | Required | Press release authoring |
| **CoverageCard** | Required | Coverage item display |
| **DistributionOptions** | Required | CiteMind AEO + Wire selector |

---

## 6. Interaction Patterns

### 6.1 Pitch Creation Flow

```
1. User selects journalist from Media DB
   OR
   SAGE proposes pitch opportunity

2. Pitch Composer opens with:
   - Journalist context (beat, recent coverage, history)
   - Suggested angles (SAGE-generated)
   - Template options

3. User drafts/modifies pitch
   - AI assistance available (Copilot mode)
   - Personalization score displayed real-time

4. User reviews final pitch
   - Context summary shown
   - Personalization gate enforced

5. User explicitly sends (Manual action)
   - Single-click send (no double-confirmation spam)
   - Immediately logged to timeline
```

### 6.2 Press Release Flow

```
1. User creates new release
   OR
   SAGE proposes release opportunity

2. Release Editor opens with:
   - Template options
   - Previous release reference
   - Content from other pillars (if relevant)

3. User drafts/modifies release
   - AI assistance available (Copilot mode)
   - Schema preview shown

4. Distribution selection:
   - CiteMind AEO (Pravado Newsroom) - default
   - Legacy Wire (with cost preview) - optional

5. User reviews and approves
   - For Newsroom: Copilot mode (confirm)
   - For Wire: Manual mode (explicit approval + cost confirm)
```

### 6.3 Coverage Attribution Flow

```
1. Coverage detected (automated or manual)

2. System attempts attribution:
   - Match to pitch (if traceable)
   - Match to journalist relationship
   - Match to SAGE signal

3. User reviews/confirms attribution
   - Can override system attribution
   - Can add context notes

4. Attribution feeds into:
   - SAGE (signal reinforcement)
   - EVI (visibility calculation)
   - Relationship score (journalist)
```

---

## 7. Guardrails and Gates

### 7.1 V1 Guardrails

| Guardrail | Threshold | Enforcement |
|-----------|-----------|-------------|
| **Pitch personalization** | > 40% to send | Block |
| **Daily pitch cap** | Plan-tier dependent | Queue |
| **Follow-up limit** | Max 2 per journalist per 7 days | Block |
| **New contact rate** | Warning at > 20% new per campaign | Warn |
| **Wire distribution cost** | Must confirm cost before submit | Block |

### 7.2 V1 Quality Gates

| Gate | Condition | Action |
|------|-----------|--------|
| **Personalization minimum** | Score < 40% | Block send, show improvement suggestions |
| **Personalization warning** | Score 40-60% | Warning banner, allow proceed |
| **Follow-up blocked** | > 2 in 7 days | Block send, show history |
| **Relationship decay** | No interaction > 90 days | Warning on pitch |
| **Bounce detected** | Previous bounce on contact | Warning, suggest verify |

---

## 8. Data Model (V1)

### 8.1 Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Journalist** | Media contact | id, name, email, outlet, beat, status |
| **Outlet** | Media outlet | id, name, tier, domain, type |
| **Pitch** | Outreach message | id, journalist_id, subject, body, status, sent_at |
| **Release** | Press release | id, title, body, schema, status, published_at |
| **Coverage** | Earned media | id, url, headline, outlet_id, journalist_id, attribution |
| **Interaction** | Timeline entry | id, journalist_id, type, timestamp, notes |

### 8.2 Key Relationships

```
Journalist ─┬─ belongs_to ─── Outlet
            ├─ has_many ───── Pitch
            ├─ has_many ───── Coverage
            └─ has_many ───── Interaction

Release ────┬─ has_many ───── Coverage (attributed)
            └─ has_one ────── Distribution (Newsroom or Wire)

Pitch ──────┬─ belongs_to ─── Journalist
            └─ may_have ───── Coverage (attributed)
```

---

## 9. SAGE Integration (V1)

### 9.1 Inbound Signals

| Signal | Source | PR Proposal Generated |
|--------|--------|----------------------|
| Journalist topic trend | CiteMind Engine 3 | Pitch opportunity |
| Coverage gap | Competitive monitoring | Press release opportunity |
| Content published | Content pillar | Distribution opportunity |
| Relationship decay | Internal calculation | Re-engagement suggestion |

### 9.2 Outbound Signals

| PR Event | Signal Emitted | Cross-Pillar Effect |
|----------|----------------|---------------------|
| Pitch sent | Activity signal | Timeline update |
| Coverage obtained | Authority signal | Content brief trigger |
| Relationship established | Growth signal | Future opportunity |
| Release published | Visibility signal | SEO schema boost |

---

## 10. Compliance Checklist

V1 PR Work Surface MUST satisfy:

- [ ] Media Database displays journalist entities with timeline
- [ ] Pitch Composer enforces personalization gate (> 40%)
- [ ] Pitch send is Manual mode only (no auto-send)
- [ ] Follow-up limit enforced (max 2 per 7 days)
- [ ] Press Release Editor includes schema preview
- [ ] Distribution Options shows CiteMind AEO and Wire paths
- [ ] Wire distribution shows cost before confirmation
- [ ] Coverage tracking with attribution to pitch/release
- [ ] SAGE proposals display in PR Dashboard
- [ ] Contact Timeline shows complete interaction history

---

## 11. CI Guardrails

The following CI checks must pass for PR Work Surface changes:

| Check | File | Validates |
|-------|------|-----------|
| `check-pr-mode-ceilings.mjs` | PR components | No auto-send on pitch/wire |
| `check-pr-personalization-gate.mjs` | PitchComposer | Personalization score enforced |
| `check-pr-contact-limits.mjs` | Pitch logic | Follow-up limits enforced |

---

## 12. Governance

### 12.1 Contract Authority

This document defines the V1 frozen contract. Any implementation that deviates requires a Canon Amendment PR with:
1. Justification for deviation
2. Product review sign-off
3. Update to this contract document

### 12.2 Amendment Process

To modify this contract:
1. Create PR with proposed changes
2. Tag as `canon-amendment`
3. Require product owner approval
4. Update revision history

---

## 13. V1.1 Best-in-Class Upgrades

### 13.1 Overview

V1.1 transforms PR from "modules" into a unified **Influence Orchestration System** with short task routes, CRM depth, and visible SAGE/EVI/AUTOMATE interoperability.

**Non-negotiables:**
- Manual/Copilot/Autopilot ceilings MUST remain enforced
- No spray-and-pray patterns
- No auto-send of relationship actions

### 13.2 V1.1 Dependent Contracts

| Contract | Purpose | Reference |
|----------|---------|-----------|
| `PR_INBOX_CONTRACT.md` | PR Inbox / Work Queue specification | Daily driver with one-click continuation |
| `PR_CONTACT_LEDGER_CONTRACT.md` | Contact Timeline / Relationship Ledger | Core differentiator with explainability |
| `PR_PITCH_PIPELINE_CONTRACT.md` | Pitch Pipeline specification | Stage-based pitch tracking and follow-up |

### 13.3 Impact Strip Requirement

All PR surfaces MUST display the **Impact Strip** showing:
- **SAGE contribution tags** (Signal / Authority / Growth / Exposure)
- **EVI driver direction** (Visibility / Authority / Momentum +/0/-)
- **AUTOMATE mode badge** (Manual / Copilot / Autopilot) with tooltip

This strip makes the system feel like an "organism," not disconnected modules.

### 13.4 Distribution Decision Matrix V1.1

The Distribution view MUST distinguish between:

**Track 1: CiteMind AEO** (Primary)
- Schema generation → Newsroom publish → IndexNow → Citation monitoring
- Should feel like a cohesive, integrated flow

**Track 2: Legacy Wire** (Secondary)
- Add-on commerce decision
- Cost must be shown
- Explicit confirmation required
- Expected outcomes explained
- "Why choose this track?" explainer required

### 13.5 V1.1 Route Additions

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/pr/inbox` | `PRInbox.tsx` | PR Inbox / Work Queue |
| `/app/pr/pitches/pipeline` | `PRPitchPipeline.tsx` | Pitch Pipeline view |

### 13.6 V1.1 Component Additions

| Component | Location | Purpose |
|-----------|----------|---------|
| `PRInbox.tsx` | `views/` | PR Inbox / Work Queue view |
| `ContactRelationshipLedger.tsx` | `components/` | Timeline with explainability |
| `PRPitchPipeline.tsx` | `views/` | Stage-based pitch tracking |
| `ImpactStrip.tsx` | `components/` | SAGE/EVI/AUTOMATE indicator |

### 13.7 V1.1 Compliance Checklist

- [ ] PR Inbox exists at `/app/pr/inbox`
- [ ] Inbox items have one-click continuation CTAs
- [ ] Contact Ledger integrated into ContactDetailDrawer
- [ ] Relationship stage changes show "why" reasons
- [ ] Score changes show previous/new/reason (explainability)
- [ ] Pitch Pipeline exists at `/app/pr/pitches/pipeline` or as tab
- [ ] No bulk send actions exist
- [ ] Impact Strip displayed on Inbox, Pitches, Coverage, Distribution
- [ ] Distribution Matrix shows CiteMind as hero track
- [ ] Legacy Wire shows cost and confirmation requirement

---

## 14. V1.2 Operational Workflows

### 14.1 Overview

V1.2 delivers **minimum real workflows** that allow end-to-end PR operations with database persistence. These workflows are fully functional and testable.

**Non-negotiables enforced:**
- `send_pitch` = **Manual-only** (SYSTEM ENFORCED)
- `send_followup` = **Copilot max** (requires human review)
- No bulk send, no spray-and-pray

### 14.2 Journalists CRUD (Database Tab)

#### Create Journalist

| Method | Endpoint | Required Fields |
|--------|----------|-----------------|
| `POST` | `/api/pr/journalists` | `fullName`, `primaryEmail`, `primaryOutlet` |

**UI Flow:**
1. Click "Add Contact" in Database header
2. Fill form: Name, Email, Outlet, Beat (optional), Social links (optional)
3. Submit → Contact appears in Database list

**Validation:**
- Name: Required
- Email: Required, valid format
- Outlet: Required
- Dedupe warning: (name + outlet) combination within org

#### Update Journalist

| Method | Endpoint | Fields |
|--------|----------|--------|
| `PATCH` | `/api/pr/journalists/:id` | Any editable field |

**UI Flow:**
1. Click contact row → Drawer opens
2. Click "Edit Contact"
3. Modify fields → Save

#### Delete Journalist (Soft)

| Method | Endpoint | Effect |
|--------|----------|--------|
| `DELETE` | `/api/pr/journalists/:id` | Sets `metadata.archived = true` |

### 14.3 Pitch Sequences Lifecycle (Pitches Tab)

#### Sequence Stages

```
Draft → Ready → Sent → Opened → Replied
```

| Stage | Description | User Action |
|-------|-------------|-------------|
| `draft` | Initial creation | Edit, add contacts |
| `active` | Ready to send | Manual send available |
| `sent` | Pitch sent | Await response |
| `paused` | Temporarily held | Resume later |
| `completed` | Sequence finished | Archive |
| `archived` | Soft deleted | Restore if needed |

#### Create Sequence

| Method | Endpoint | Required |
|--------|----------|----------|
| `POST` | `/api/pr/pitches/sequences` | `name` |

#### Update Sequence

| Method | Endpoint | Fields |
|--------|----------|--------|
| `PATCH` | `/api/pr/pitches/sequences/:id` | `name`, `status`, `settings` |

### 14.4 Manual Send Workflow

**This is the key "it works" moment for V1.2.**

| Method | Endpoint | Required |
|--------|----------|----------|
| `POST` | `/api/pr/pitches/manual-send` | `sequenceId`, `contactId` |

**On Success:**
1. Creates `pr_pitch_events` entry (type: `sent`)
2. Updates `pr_pitch_sequences.status` if applicable
3. Inserts `journalist_activity_log` entry (type: `pitch_sent`)
4. Returns EVI attribution data for Command Center

**UI Effect:**
- Sequence moves to **Sent** stage in Kanban
- Ledger shows new event in Contact Timeline
- Toast: "Pitch recorded as sent"

**EVI Attribution:**
```json
{
  "pillar": "pr",
  "driver": "visibility",
  "direction": "positive",
  "delta": 0.5,
  "explanation": "Manual pitch sent - direct media outreach contributes to visibility"
}
```

### 14.5 Touches Logging

| Method | Endpoint | Required |
|--------|----------|----------|
| `POST` | `/api/pr/touches` | `journalistId`, `activityType` |

**Activity Types:**
- `email` - Email interaction
- `call` - Phone call
- `meeting` - In-person or video meeting
- `note` - General note
- `social_interaction` - Social media interaction

**On Success:**
- Updates `journalist.last_activity_at`
- Creates `journalist_activity_log` entry
- Relationship ledger reflects new touch

### 14.6 Command Center Interoperability

#### Deep Links

PR-related Action Stream items include `deep_link` pointing to:
- `/app/pr?tab=database&contactId=<id>` - Focus on contact
- `/app/pr?tab=pitches&sequenceId=<id>` - Focus on sequence
- `/app/pr?tab=inbox` - PR Inbox

#### EVI Attribution Events

PR actions emit EVI attribution data that powers:
- **Top Movers** in Command Center
- **Strategy Panel** driver explanations
- **Entity Map** ripple effects

### 14.7 V1.2 API Summary

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/pr/journalists` | GET, POST | List/Create journalists |
| `/api/pr/journalists/:id` | GET, PATCH, DELETE | Individual journalist CRUD |
| `/api/pr/pitches/sequences` | GET, POST | List/Create sequences |
| `/api/pr/pitches/sequences/:id` | GET, PATCH, DELETE | Individual sequence CRUD |
| `/api/pr/pitches/manual-send` | POST | Manual pitch send (NON-NEGOTIABLE) |
| `/api/pr/touches` | GET, POST | Activity log |
| `/api/pr/lists` | GET, POST | Media lists |
| `/api/pr/inbox` | GET | Computed inbox items |
| `/api/pr/status` | GET | Backend diagnostics |

### 14.8 V1.2 Compliance Checklist

- [ ] Journalist CRUD (Create, Edit, View) operational
- [ ] Pitch Sequence create/update/stage-change operational
- [ ] Manual Send creates event + updates status + logs activity
- [ ] Manual Send returns EVI attribution
- [ ] Touches API logs interactions and updates `last_activity_at`
- [ ] Deep links work from Command Center to PR entities
- [ ] No auto-send patterns in codebase (CI enforced)
- [ ] Contact Form validates required fields

---

## 15. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial V1 PR Work Surface Contract |
| 2026-01-14 | 1.1 | Added V1.1 Best-in-Class Upgrades section |
| 2026-01-21 | 1.2 | Added V1.2 Operational Workflows (CRUD, Manual Send, EVI attribution) |
