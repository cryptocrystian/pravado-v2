# PR PILLAR MODEL

> **Status:** CANONICAL
> **Authority:** This document defines the PR pillar operating model for Pravado.
> **Classification:** Product Definition
> **Last Updated:** 2026-02-26

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
- **Media database** with entity-level intelligence across four contact types
- **Coverage tracking** with SAGE attribution
- **CiteMind integration** for AI visibility optimization

### 1.2 Core Principle

> **Quality Over Volume**
>
> One well-researched, well-timed pitch to the right journalist is worth more than 100 generic emails to a purchased list.

This principle is non-negotiable. Any feature that encourages mass-blast outreach is anti-pattern.

SAGE proactive recommendations are the primary intended discovery path for users. The reactive search surface exists to support it — not replace it.

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

The Media Database is the foundation of the PR pillar — a curated, entity-enriched contact system spanning four contact types: traditional journalists, digital-first creators, KOLs, and podcasters.

**Key Characteristics:**
- **Entity-level intelligence**: Contact profile → Topics → Beat → Recent coverage → Response patterns
- **Four contact types**: Unified schema with type-specific metadata via JSONB platform_metrics
- **Relationship tracking**: Every interaction is logged and scored
- **AI-enriched**: Vector embeddings (pgvector) enable semantic matching; CiteMind provides citation signal data
- **Privacy-compliant**: Opt-out honoring, GDPR-ready architecture
- **JIT email enrichment**: Emails are never stored from static scrapes; fetched and validated on-demand via waterfall enrichment pipeline

**Contact Types:**

| Type | Definition | Primary Outreach Mechanic |
|------|------------|--------------------------|
| **journalist** | Staff or freelance reporters at traditional or digital outlets | Email pitch |
| **digital_creator** | Newsletter authors, Substack writers, independent digital publishers | Email pitch |
| **kol** | Key Opinion Leaders — platform influencers with topic authority | Contact/DM reference only — no campaign facilitation |
| **podcaster** | Podcast hosts across any platform | Email pitch framed as appearance proposal |

**KOL Scope Boundary:** KOLs are discovery and contact surfaces only. Pravado provides profile data, platform metrics, and contact method. No rate cards, campaign briefs, payment facilitation, or sponsored engagement. This is a hard product boundary with no exceptions.

**Media Database Fields:**

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| **contact_id** | UUID | System | Primary key |
| **contact_type** | Enum | System | journalist / digital_creator / kol / podcaster |
| **name** | String | Import/Manual | Display |
| **email** | Ephemeral/JIT | Enrichment pipeline | Outreach — never stored from static scrapes; fetched and validated on-demand, cached with staleness timer. See JOURNALIST_DATABASE_GOVERNANCE.md |
| **email_verified_at** | DateTime | Enrichment pipeline | Staleness tracking |
| **email_source** | String | Enrichment pipeline | Waterfall provider that returned this email |
| **outlet_affiliations** | Junction[] | Import/Manual | Many-to-many outlet relationships with role, primary flag, and beat per outlet |
| **platform_metrics** | JSONB | Import/AI-enriched | Type-specific metrics (beat, episode count, follower count, engagement rate, etc.) |
| **beat_tags** | String[] | System taxonomy + AI | Three-layer taxonomy — system controlled, AI-derived, org-scoped. See JOURNALIST_DATABASE_GOVERNANCE.md |
| **ai_derived_signals** | JSONB | AI pipeline | Current topic focus, writing style, pitch receptivity, topic velocity |
| **recent_coverage** | URL[] | Monitoring | Context |
| **response_rate** | Float | Calculated | Prioritization |
| **relationship_score** | Float | Calculated | Health indicator |
| **pitch_eligibility_score** | Float | Calculated | Gate score — must be ≥ 40 to pitch; < 40 is hard block |
| **pitch_saturation_score** | Float | Computed (platform-wide) | Rolling platform outreach concentration — not stored, computed from platform_pitch_events |
| **last_interaction** | DateTime | System | Recency |
| **ai_citation_score** | Float | CiteMind | Citation influence |
| **contact_state** | Enum | System | Full state machine — see JOURNALIST_DATABASE_GOVERNANCE.md |
| **vector_embedding** | pgvector | AI pipeline | Semantic matching via Supabase pgvector; refreshed on activity cadence |

### 2.2 Pitch Composer

The Pitch Composer is the primary outreach tool — AI-assisted but human-controlled. It serves all four contact types with AI context assembly adapting to contact_type automatically.

**Key Characteristics:**
- **Context-aware**: Pulls contact profile, recent coverage, relevant company news, type-specific framing
- **Type-adaptive AI framing**: Journalists receive story pitch framing; podcasters receive appearance proposal framing; KOLs receive collaboration inquiry framing
- **Template library**: Pre-approved templates by pitch type and contact type
- **Personalization scoring**: AI evaluates personalization level before send
- **Mandatory review**: All pitches require human approval before send
- **JIT enrichment trigger**: Opening pitch composer triggers background email verification so email is ready by send time

**Pitch Composer Workflow:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Contact    │───►│   Context   │───►│   Draft     │───►│   Review    │
│  Selection  │    │   Assembly  │    │   Compose   │    │   Approve   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
   Manual select      AI-assisted       AI-assisted        ALWAYS
   or SAGE signal     context pull      draft option       human final
   (primary path)     + type framing
```

**Personalization Minimum:**
- Pitches with personalization score < 60% receive warning
- Pitches with personalization score < 40% blocked from send
- Generic templates without customization are not sendable

### 2.3 Contact Timeline

The Contact Timeline shows the complete relationship history with each contact.

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
2. **Contact relationship** (contact timeline context)
3. **SAGE signal** (original opportunity)
4. **Cross-pillar contribution** (content/SEO assets used)

---

## 3. Distribution Model

### 3.1 Dual Distribution Philosophy

Pravado PR supports two distribution paths:

| Path | Description | Use Case | Mode Ceiling |
|------|-------------|----------|--------------|
| **CiteMind AEO Distribution** | Optimized for AI model ingestion via Pravado Newsroom | AI visibility, citation building | Copilot |
| **Legacy Wire Integration** | Third-party wire services via manual fulfillment (API stub ready) | Compliance, SEC requirements, broad reach | Manual only — no exceptions |

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

For compliance and broad reach requirements, Pravado supports wire distribution via a **dual-mode architecture** designed to operate across both manual fulfillment and future API integration seamlessly.

**V1 — Manual Fulfillment Model:**

Wire distribution in V1 is fulfilled manually by Pravado operations staff after user submission and payment/credit confirmation. There is no live API connection to wire services at V1 launch.

| Step | Actor | Action |
|------|-------|--------|
| 1 | User | Drafts and approves press release in Pravado |
| 2 | User | Selects wire distribution, reviews cost, confirms payment/credits |
| 3 | System | Generates submission package (formatted release + metadata) |
| 4 | System | Emails submission package to Pravado operations inbox |
| 5 | Pravado Ops | Manually submits to wire service within SLA (4 business hours) |
| 6 | Pravado Ops | Logs distribution confirmation and wire tracking ID back in system |
| 7 | System | Notifies user, activates citation tracking |

**API Stub Architecture (Future-Ready):**

The submission pipeline is architected with an API stub layer so that when a suitable wire API partner is identified, the manual fulfillment step (Steps 4–6) is replaced by an API call with zero changes to the user-facing flow or data model. The manual pathway remains available as a permanent fallback at all times — even after API integration is live — to ensure continuity if the API provider experiences downtime or is deprecated.

```
Distribution Request
       │
       ▼
┌─────────────────┐
│ Submission      │
│ Package Builder │  ← same for both paths
└────────┬────────┘
         │
         ▼
┌────────────────┐     ┌─────────────────┐
│  API Adapter   │ OR  │ Manual Fulfil-  │
│  (future)      │     │ ment Email      │
└────────┬───────┘     └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌─────────────────┐
         │ Tracking ID     │
         │ Logged +        │
         │ User Notified   │
         └─────────────────┘
```

**Supported Wire Services:**

| Wire Service | Use Case | V1 Status | API Stub Status |
|--------------|----------|-----------|-----------------|
| PR Newswire | SEC compliance, broad distribution | ✅ Manual fulfillment | Stub ready |
| BusinessWire | Financial news, regulatory | ✅ Manual fulfillment | Stub ready |
| GlobeNewswire | International distribution | Roadmap | Roadmap |

**Legacy Wire Constraints (all tiers, all times, permanent):**
- Mode ceiling: Manual only — Copilot and Autopilot are never permitted, ever
- Explicit cost display and confirmation required before every submission
- Cannot be triggered by SAGE proposals automatically
- Manual fallback path must remain operational even when API integration is active

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
| Contact research | Autopilot | Internal only |
| Media list building | Autopilot | Internal only |
| Coverage monitoring | Autopilot | Read-only |
| Pitch draft generation | Copilot | AI assist, human review |
| Pitch send | Manual | External, irreversible |
| Press release draft | Copilot | AI assist, human review |
| Pravado Newsroom publish | Copilot | External but controlled |
| Wire distribution | Manual | External, costly, irreversible |
| Contact follow-up | Manual | Relationship sensitive |

### 4.2 SAGE Integration

SAGE generates PR proposals based on signals:

| Signal Type | SAGE Proposal | Mode Ceiling |
|-------------|---------------|--------------|
| Contact trend detected | "Pitch [Contact] on [Topic]" | Copilot (prepare pitch) |
| Coverage gap identified | "Issue press release on [Topic]" | Copilot (draft release) |
| Competitor coverage | "Counter-pitch [Topic] to [Outlet]" | Copilot (prepare pitch) |
| Crisis signal | "Prepare response statement" | Manual (high risk) |
| Relationship decay | "Re-engage [Contact]" | Manual (relationship) |
| Inbound journalist request | "Respond to [Journalist] source request on [Topic]" | Manual |
| Press release published | "Pitch relevant contacts for coverage" | Copilot (ranked list) |

### 4.3 What PR Can NEVER Autopilot

The following actions are never eligible for Autopilot in any plan tier:

| Action | Reason |
|--------|--------|
| **Pitch sending** | External communication, relationship impact |
| **Wire distribution** | External publish, cost commitment, irreversible |
| **Contact follow-up** | Relationship sensitivity, requires human judgment |
| **Crisis response** | High stakes, requires human oversight |
| **New contact outreach** | First impression, requires human approval |

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
| **Saturation pile-on** | Burns out best contacts platform-wide, destroys database value for all users | Pitching contacts with saturation score > 80 without explicit acknowledgment |
| **Static list recycling** | Same contacts served repeatedly with no diversity or personal history adjustment | Search results not adjusted for interaction history or platform saturation |
| **KOL campaign facilitation** | FTC exposure, outside product scope | Any attempt to record rate cards, payments, or campaign briefs on KOL contacts |

### 5.2 Quality Gates

Quality gates prevent anti-patterns at the enforcement layer:

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| **Contact state gate** | contact_state must be `pitch_eligible` | Hard block — no override at any tier |
| **Pitch eligibility score** | Score ≥ 40 required to pitch | Score < 40: hard block with improvement path shown; score 40–49: warning, allowed |
| **Personalization minimum** | Score > 40% to send | Block send |
| **Personalization warning** | Score 40–60% | Warning banner, proceed allowed |
| **Platform saturation** | Score > 80: explicit acknowledgment required | Warn with journalist impact context; user must confirm to proceed |
| **Follow-up limit** | Max 2 per contact per 7 days | Block send |
| **Daily pitch cap** | Starter: 5/day · Pro: 25/day · Enterprise: 100/day default (custom negotiable) | Queue additional sends until next day |
| **Daily unlock cap** | Starter: 10/day · Pro: 50/day · Enterprise: 500/day default | Block until next day |
| **Daily contact view cap** | Starter: 30/hour · Pro: 100/hour · Enterprise: 300/hour | Rate limit |
| **New contact rate** | Max 20% new contacts per campaign | Warning |
| **Bounce rate monitor** | > 10% triggers review | Alert + send limit halved automatically |
| **Unsubscribe/opt-out honor** | Immediate, no override | Block contact globally and permanently |

---

## 6. Measurement Model

### 6.1 PR Pillar KPIs

PR contributes to SAGE and EVI through these measured outcomes:

| KPI | Definition | SAGE Component | Weight |
|-----|------------|----------------|--------|
| **Response Rate** | Contact replies / Pitches sent | Signal quality | 20% |
| **Coverage Rate** | Coverage obtained / Pitches sent | Growth | 25% |
| **Outlet Tier Quality** | Weighted tier of coverage | Authority | 30% |
| **Citation Rate** | AI citations from coverage | Exposure | 25% |

### 6.2 Relationship Health Score

Each contact relationship has a health score:

```
Relationship Score = (Recency × 0.3) + (Response Rate × 0.3) + (Coverage History × 0.4)

Where:
- Recency: Days since last interaction (decay function)
- Response Rate: Historical response rate to pitches
- Coverage History: Number of successful coverage outcomes
```

### 6.3 Pitch Eligibility Score

```
Pitch Eligibility Score = (Topic Currency × 0.4) + (Response Rate × 0.3) + (Relationship Recency × 0.3)

Where:
- Topic Currency: How recently and frequently they cover relevant beats (0–100)
- Response Rate: Historical platform-wide response rate (anonymized aggregate if no personal history)
- Relationship Recency: Decay function from last interaction (new contacts default to neutral 50)

Thresholds:
- Score ≥ 50: Pitch eligible, no gate
- Score 40–49: Warning shown, pitch allowed
- Score < 40: Hard block — improvement path shown (e.g., "Wait for new article on relevant topic")
```

### 6.4 EVI Contribution

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
| Contact relationship established | Growth signal | Future pitch opportunity |
| Press release distributed | Visibility signal | Citation tracking activation |
| Crisis coverage | Threat signal | All-pillar response trigger |

### 7.2 SAGE → PR Inputs

| SAGE Signal | PR Proposal |
|-------------|-------------|
| Contact trending on relevant topic | Pitch opportunity |
| Competitor coverage gap | Counter-narrative opportunity |
| Content published (pillar page) | Press release opportunity |
| SEO ranking achieved | Proof point for pitch |
| Authority threshold crossed | Media tour opportunity |
| Inbound journalist source request | Respond to active request |
| Press release published | Ranked contact match for outreach |

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
- **Competitive monitoring**: Track competitor media presence and share of voice
- **Contact AI influence**: Score contacts by citation generation potential

---

## 9. Competitive Landscape

### 9.1 Competitor Summary

| Competitor | Strength | Structural Ceiling |
|------------|----------|--------------------|
| **Cision / Meltwater** | Massive journalist databases, monitoring depth, wire access | Distribution-first; no AEO layer; no cross-pillar attribution; treats coverage as impressions metric |
| **Muck Rack** | Best journalist database accuracy, strong relationship tracking | No AEO/AI citation layer; no content or SEO pillar integration |
| **Propel PRM** | Clean CRM-like interface, good relationship tools | Limited database depth; no AI citation tracking; siloed |
| **Press Ranger** | 500K+ contacts, fast-growing (8K users April 2025), one-click outreach, Forbes 2026 recognition, emerging AEO awareness | One-click model encourages spray-and-pray; basic CRM; no relationship intelligence or scoring; wholesale distribution is sponsored placement not editorial; no cross-pillar attribution |

### 9.2 Shared Structural Gap

No competitor has all three visibility layers (PR → Content → AEO → Share of Model) instrumented in a single system. None can show the causal chain: this TechCrunch coverage drove an 18% increase in ChatGPT citation rate. That attribution capability is Pravado's exclusive differentiator and requires all three pillars active.

### 9.3 Press Ranger — Primary Emerging Threat

Press Ranger targets bootstrapped founders doing DIY PR with zero budget. Pravado targets SMBs and mid-market brands with actual communications teams who want sustainable authority building. Different primary customers today — but Press Ranger is moving upmarket (their Campaigns tool explicitly targets AI chatbot ranking) and must be watched.

Pravado's defensible advantage over Press Ranger: relationship intelligence, scoring algorithms, governance rails that prevent journalist burnout, cross-pillar attribution, and AEO as a native architecture rather than a bolt-on feature.

---

## 10. Compliance Checklist

PR implementations MUST satisfy:

- [ ] No auto-send pitches (Manual mode ceiling enforced)
- [ ] Contact state gate enforced before pitch (pitch_eligible required)
- [ ] Pitch eligibility score gate enforced (< 40 hard block)
- [ ] Personalization gate prevents template-only pitches (< 40% blocked)
- [ ] Platform saturation warning shown for contacts with score > 80
- [ ] Relationship timeline tracks all interactions
- [ ] Coverage attribution connects to SAGE signals
- [ ] Wire distribution requires explicit cost confirmation
- [ ] Wire manual fallback path exists alongside API stub
- [ ] Follow-up limits prevent over-contact (max 2 per 7 days)
- [ ] Daily pitch and unlock caps enforced by tier
- [ ] Unsubscribe/opt-out honored immediately and globally
- [ ] CiteMind schema generation on press release publish
- [ ] KOL contacts have no campaign, payment, or rate card fields accessible

---

## 11. Governance

### 11.1 Canon Authority

This document is the authoritative specification for PR pillar behavior. Any implementation that deviates is non-compliant.

### 11.2 Dependent Specifications

| Document | Purpose |
|----------|---------|
| `JOURNALIST_DATABASE_GOVERNANCE.md` | Full contact database architecture, four contact types, JIT enrichment, state machine, tagging, saturation scoring, result diversity, BYOE sending model |
| `PRESS_RELEASE_DISTRIBUTION_CONTRACT.md` | Wire distribution model, manual fulfillment workflow, credit billing, API stub specification |
| `PR_CONTACT_LEDGER_CONTRACT.md` | Relationship timeline, stage model, explainability |
| `PR_PITCH_PIPELINE_CONTRACT.md` | Pitch pipeline stages and follow-up workflow |
| `PR_INBOX_CONTRACT.md` | PR work queue and action surface |
| `PR_WORK_SURFACE_CONTRACT.md` | V1 frozen surface contract |

### 11.3 Change Control

Modifications require:
1. Product review sign-off
2. Legal review for compliance implications
3. Sales review for positioning impact
4. Update to dependent specifications

---

## 12. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial PR Pillar Model specification |
| 2026-02-26 | 1.1 | Email field updated to JIT ephemeral model; four contact types added with KOL scope boundary; contact_state and pitch_eligibility_score added; wire integration updated to dual-mode manual fulfillment + API stub architecture; saturation and static list recycling anti-patterns added; full quality gates with concrete tier limits added; pitch eligibility score formula added; competitive landscape section added; SAGE inbound request signal added; dependent specifications table added |
