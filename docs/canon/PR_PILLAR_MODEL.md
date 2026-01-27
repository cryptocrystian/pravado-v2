# PR PILLAR MODEL

> **Status:** CANONICAL
> **Authority:** This document defines the PR pillar operating model for Pravado.
> **Classification:** Product Definition
> **Last Updated:** 2026-01-14

---

## 1. Formal Definition

### 1.1 What PR Is in Pravado

**PR (Public Relations) Pillar** is an **Influence Orchestration System** that builds and manages journalist relationships, coordinates strategic outreach, and generates earned media coverage as inputs to SAGE.

PR is NOT:
- Press release distribution (wire service)
- Mass email blasting
- "Spray and pray" outreach
- A Cision/Meltwater feature clone

PR IS:
- **Relationship-based** influence orchestration
- **Strategic pitching** informed by journalist tracking and timing
- **Media database** with entity-level intelligence
- **Coverage tracking** with SAGE attribution
- **CiteMind integration** for AI visibility optimization

### 1.2 Core Principle

> **Quality Over Volume**
>
> One well-researched, well-timed pitch to the right journalist is worth more than 100 generic emails to a purchased list.

This principle is non-negotiable. Any feature that encourages mass-blast outreach is anti-pattern.

### 1.3 Why NOT Distribution

Traditional PR tools optimize for **distribution**: send more releases to more outlets, maximize "impressions."

Pravado PR optimizes for **influence**: build relationships with decision-makers who drive narrative, get cited by AI systems, compound authority over time.

| Distribution Approach | Influence Approach |
|-----------------------|--------------------|
| Volume metrics (emails sent, releases distributed) | Quality metrics (response rate, coverage obtained, citation generated) |
| Pay-per-release pricing | Relationship-based ROI |
| One-way broadcast | Two-way engagement tracking |
| Outlet-centric (T1/T2/T3) | Journalist-centric (individual track record) |
| Campaign-based | Relationship-based |

---

## 2. PR Pillar Components

### 2.1 Media Database

The Media Database is the foundation of the PR pillar—a curated, entity-enriched contact system.

**Key Characteristics:**
- **Entity-level intelligence**: Journalist profile → Topics → Beat → Recent coverage → Response patterns
- **Relationship tracking**: Every interaction is logged and scored
- **AI-enriched**: CiteMind provides signal data on journalist AI visibility
- **Privacy-compliant**: Opt-out honoring, GDPR compliance

**Media Database Fields:**

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| **journalist_id** | UUID | System | Primary key |
| **name** | String | Import/Manual | Display |
| **email** | String | Import/Manual | Outreach |
| **outlet** | Entity | Import/Manual | Outlet relationship |
| **beat** | String[] | AI-enriched | Topic matching |
| **recent_coverage** | URL[] | Monitoring | Context |
| **response_rate** | Float | Calculated | Prioritization |
| **relationship_score** | Float | Calculated | Health indicator |
| **last_interaction** | DateTime | System | Recency |
| **ai_citation_score** | Float | CiteMind | Citation influence |
| **status** | Enum | Manual | Active/Paused/Blocked |

### 2.2 Pitch Composer

The Pitch Composer is the primary outreach tool—AI-assisted but human-controlled.

**Key Characteristics:**
- **Context-aware**: Pulls journalist profile, recent coverage, relevant company news
- **Template library**: Pre-approved templates by pitch type
- **Personalization scoring**: AI evaluates personalization level before send
- **Mandatory review**: All pitches require human approval before send

**Pitch Composer Workflow:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Journalist │───►│   Context   │───►│   Draft     │───►│   Review    │
│  Selection  │    │   Assembly  │    │   Compose   │    │   Approve   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │                  │                  │                  │
   Manual select      AI-assisted       AI-assisted        ALWAYS
   or SAGE signal     context pull      draft option       human final
```

**Personalization Minimum:**
- Pitches with personalization score < 60% receive warning
- Pitches with personalization score < 40% blocked from send
- Generic templates without customization are not sendable

### 2.3 Contact Timeline

The Contact Timeline shows the complete relationship history with each journalist.

**Timeline Entry Types:**

| Entry Type | Source | Significance |
|------------|--------|--------------|
| **Pitch Sent** | System | Outreach attempt |
| **Email Opened** | Tracking | Engagement indicator |
| **Reply Received** | Email integration | Response tracking |
| **Coverage Published** | Monitoring | Outcome attribution |
| **Meeting/Call** | Manual | Relationship milestone |
| **Social Interaction** | Integration | Ambient engagement |
| **Note** | Manual | Context/intelligence |

### 2.4 Coverage Tracking

Coverage tracking monitors earned media and attributes it back to PR activity.

**Coverage Sources:**
- Automated monitoring (brand mentions, outlet tracking)
- Manual submission (user-reported coverage)
- AI citation detection (CiteMind Engine 3)

**Coverage Attribution:**
Every piece of coverage is attributed to:
1. **Origin pitch** (if traceable)
2. **Journalist relationship** (contact timeline context)
3. **SAGE signal** (original opportunity)
4. **Cross-pillar contribution** (content/SEO assets used)

---

## 3. Distribution Model

### 3.1 Dual Distribution Philosophy

Pravado PR supports two distribution paths:

| Path | Description | Use Case | Mode Ceiling |
|------|-------------|----------|--------------|
| **CiteMind AEO Distribution** | Optimized for AI model ingestion via Pravado Newsroom | AI visibility, citation building | Copilot |
| **Legacy Wire Integration** | Third-party wire services (PR Newswire, BusinessWire) | Compliance, SEC requirements, broad reach | Manual only |

### 3.2 CiteMind AEO Distribution

CiteMind Engine 1 powers the AEO (AI Engine Optimization) distribution path:

**Pravado Newsroom:**
- Hosted press release surface optimized for AI comprehension
- Structured data (NewsArticle schema) auto-generated
- IndexNow notification on publish
- Citation tracking enabled

**AEO Distribution Flow:**
```
Press Release Draft
       │
       ▼
┌─────────────┐
│ Schema Gen  │ ← CiteMind Engine 1
│ (NewsArticle)│
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ Pravado     │───►│ IndexNow    │ → Search engines notified
│ Newsroom    │    │ Ping        │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│ Citation    │ ← CiteMind Engine 3
│ Tracking    │
└─────────────┘
```

### 3.3 Legacy Wire Integration

For compliance and broad reach requirements, Pravado integrates with legacy wire services:

| Wire Service | Integration Type | Use Case |
|--------------|------------------|----------|
| PR Newswire | API (submit) | SEC compliance, broad distribution |
| BusinessWire | API (submit) | Financial news, regulatory |
| GlobeNewswire | API (submit) | International distribution |

**Legacy Wire Constraints:**
- Mode ceiling: Manual only
- No autopilot distribution
- Explicit cost confirmation before submit
- Cannot be triggered by SAGE proposals automatically

### 3.4 Distribution Decision Matrix

| Content Type | Recommended Path | Rationale |
|--------------|------------------|-----------|
| General news | CiteMind AEO only | AI visibility focus |
| Product launch | CiteMind AEO + Legacy Wire | Broad reach + AI |
| SEC/Regulatory | Legacy Wire only | Compliance requirement |
| Thought leadership | CiteMind AEO only | Long-term authority |
| Crisis response | Legacy Wire + CiteMind | Immediate reach + record |

---

## 4. Automation Spectrum

### 4.1 Mode Eligibility by Action

PR actions have conservative mode ceilings due to external impact:

| Action | Mode Ceiling | Rationale |
|--------|--------------|-----------|
| Journalist research | Autopilot | Internal only |
| Media list building | Autopilot | Internal only |
| Coverage monitoring | Autopilot | Read-only |
| Pitch draft generation | Copilot | AI assist, human review |
| Pitch send | Manual | External, irreversible |
| Press release draft | Copilot | AI assist, human review |
| Pravado Newsroom publish | Copilot | External but controlled |
| Wire distribution | Manual | External, costly, irreversible |
| Journalist follow-up | Manual | Relationship sensitive |

### 4.2 SAGE Integration

SAGE generates PR proposals based on signals:

| Signal Type | SAGE Proposal | Mode Ceiling |
|-------------|---------------|--------------|
| Journalist trend detected | "Pitch [Journalist] on [Topic]" | Copilot (prepare pitch) |
| Coverage gap identified | "Issue press release on [Topic]" | Copilot (draft release) |
| Competitor coverage | "Counter-pitch [Topic] to [Outlet]" | Copilot (prepare pitch) |
| Crisis signal | "Prepare response statement" | Manual (high risk) |
| Relationship decay | "Re-engage [Journalist]" | Manual (relationship) |

### 4.3 What PR Can NEVER Autopilot

The following actions are never eligible for Autopilot in any plan tier:

| Action | Reason |
|--------|--------|
| **Pitch sending** | External communication, relationship impact |
| **Wire distribution** | External publish, cost commitment, irreversible |
| **Journalist follow-up** | Relationship sensitivity, requires human judgment |
| **Crisis response** | High stakes, requires human oversight |
| **New journalist contact** | First impression, requires human approval |

---

## 5. Anti-Patterns

### 5.1 Prohibited Practices

The following practices are explicitly prohibited in Pravado PR:

| Anti-Pattern | Why Prohibited | Detection |
|--------------|----------------|-----------|
| **Mass blast pitching** | Damages relationships, low quality | > 10 identical pitches in 24 hours |
| **Spray and pray** | Anti-relationship, damages brand | Low personalization + high volume |
| **Auto-send pitches** | No human judgment on external comms | Autopilot mode on pitch send |
| **Purchased list outreach** | Unknown contacts, spam risk | Contacts without relationship history |
| **Template-only pitches** | No personalization, low response | Personalization score < 40% |
| **Excessive follow-up** | Damages relationship | > 2 follow-ups in 7 days |

### 5.2 Quality Gates

Quality gates prevent anti-patterns:

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| **Personalization minimum** | Score > 40% to send | Block send |
| **Follow-up limit** | Max 2 per journalist per 7 days | Block send |
| **Daily pitch cap** | Plan-tier dependent | Queue additional |
| **New contact rate** | Max 20% new contacts per campaign | Warning |
| **Bounce rate monitor** | > 10% triggers review | Alert |
| **Unsubscribe honor** | Immediate, no override | Block contact |

---

## 6. Measurement Model

### 6.1 PR Pillar KPIs

PR contributes to SAGE and EVI through these measured outcomes:

| KPI | Definition | SAGE Component | Weight |
|-----|------------|----------------|--------|
| **Response Rate** | Journalist replies / Pitches sent | Signal quality | 20% |
| **Coverage Rate** | Coverage obtained / Pitches sent | Growth | 25% |
| **Outlet Tier Quality** | Weighted tier of coverage | Authority | 30% |
| **Citation Rate** | AI citations from coverage | Exposure | 25% |

### 6.2 Relationship Health Score

Each journalist relationship has a health score:

```
Relationship Score = (Recency × 0.3) + (Response Rate × 0.3) + (Coverage History × 0.4)

Where:
- Recency: Days since last interaction (decay function)
- Response Rate: Historical response rate to pitches
- Coverage History: Number of successful coverage outcomes
```

### 6.3 EVI Contribution

PR actions contribute to EVI through:

| PR Outcome | EVI Component | Contribution |
|------------|---------------|--------------|
| Coverage published | Visibility | +2-8 points (tier-weighted) |
| High-tier mention | Authority | +1-5 points (outlet factor) |
| Citation detected | Exposure | +1-3 points (surface factor) |
| Relationship maintained | Growth velocity | Decay prevention |

---

## 7. SAGE Integration

### 7.1 PR → SAGE Outputs

| PR Event | SAGE Signal | Cross-Pillar Effect |
|----------|-------------|---------------------|
| Coverage published | Authority signal | Content brief trigger, SEO backlink opportunity |
| Journalist relationship established | Growth signal | Future pitch opportunity |
| Press release distributed | Visibility signal | Citation tracking activation |
| Crisis coverage | Threat signal | All-pillar response trigger |

### 7.2 SAGE → PR Inputs

| SAGE Signal | PR Proposal |
|-------------|-------------|
| Journalist trending on relevant topic | Pitch opportunity |
| Competitor coverage gap | Counter-narrative opportunity |
| Content published (pillar page) | Press release opportunity |
| SEO ranking achieved | Proof point for pitch |
| Authority threshold crossed | Media tour opportunity |

### 7.3 Cross-Pillar Reinforcement

PR reinforces other pillars:

| Reinforcement | Coefficient | Mechanism |
|---------------|-------------|-----------|
| PR → Content | 0.50 | Coverage creates content brief triggers |
| PR → SEO | 0.35 | Media backlinks boost domain authority |
| PR → PR | 1.00 | Coverage begets coverage |

---

## 8. CiteMind Integration

### 8.1 Engine 1: AI Ingestion Support

CiteMind Engine 1 optimizes PR content for AI comprehension:

- **NewsArticle schema** auto-generated for press releases
- **Person schema** for spokesperson mentions
- **IndexNow** notification on Pravado Newsroom publish
- **Entity reinforcement** for brand mentions

### 8.2 Engine 2: Audio Transformation

CiteMind Engine 2 can transform PR content:

- Press release → Audio briefing (for pitch collateral)
- Coverage summary → Podcast episode
- **Mode ceiling: Manual** (V1 constraint)

### 8.3 Engine 3: Intelligence

CiteMind Engine 3 provides PR intelligence:

- **Citation tracking**: Monitor AI mentions of brand/coverage
- **Narrative drift detection**: Alert on messaging divergence
- **Competitive monitoring**: Track competitor media presence
- **Journalist AI influence**: Score journalists by citation generation

---

## 9. Compliance Checklist

PR implementations MUST satisfy:

- [ ] No auto-send pitches (Manual mode ceiling enforced)
- [ ] Personalization gate prevents template-only pitches
- [ ] Relationship timeline tracks all interactions
- [ ] Coverage attribution connects to SAGE signals
- [ ] Wire distribution requires explicit cost confirmation
- [ ] Follow-up limits prevent over-contact
- [ ] Unsubscribe/opt-out honored immediately
- [ ] CiteMind schema generation on press release publish

---

## 10. Governance

### 10.1 Canon Authority

This document is the authoritative specification for PR pillar behavior. Any implementation that deviates is non-compliant.

### 10.2 Change Control

Modifications require:
1. Product review sign-off
2. Legal review for compliance implications
3. Sales review for positioning impact
4. Update to dependent specifications

---

## 11. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial PR Pillar Model specification |
