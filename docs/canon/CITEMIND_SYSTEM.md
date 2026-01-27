# CITEMIND™ SYSTEM

> **Status:** CANONICAL
> **Authority:** This document defines the CiteMind multi-engine system architecture.
> **Classification:** Defensible IP (Trade Secret + Patent Eligible) — RESTRICTED
> **Last Updated:** 2026-01-14

---

## 1. Formal Definition

### 1.1 What CiteMind Is

**CiteMind™** is Pravado's proprietary **multi-engine system** for AI visibility optimization, content transformation, and citation intelligence.

CiteMind is NOT:
- A single feature
- A content generator
- A wire distribution service
- An analytics dashboard

CiteMind IS:
- A **multi-engine system** comprising three specialized engines working in coordination
- A **governed subsystem** of AUTOMATE with explicit invocation rules and cost controls
- A **Signal → Authority → Momentum amplifier** feeding into SAGE and EVI
- A **cross-pillar intelligence layer** connecting PR, Content, and SEO surfaces

### 1.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CITEMIND™ SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│   │    ENGINE 1     │   │    ENGINE 2     │   │    ENGINE 3     │       │
│   │  AI Ingestion   │   │    Audio        │   │  Intelligence   │       │
│   │  & Citation     │   │ Transformation  │   │  & Monitoring   │       │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘       │
│            │                     │                     │                 │
│            └─────────────────────┼─────────────────────┘                 │
│                                  │                                       │
│                                  ▼                                       │
│                      ┌─────────────────────┐                            │
│                      │   AUTOMATE Layer    │  ← Governance              │
│                      │   (Cost + Approval) │                            │
│                      └──────────┬──────────┘                            │
│                                 │                                        │
│                                 ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      OUTPUT SURFACES                              │   │
│   ├─────────────┬─────────────┬─────────────┬─────────────────────┤   │
│   │ Entity Map  │    EVI      │ Action      │  Pillar Work        │   │
│   │             │  Feedback   │ Stream      │  Surfaces           │   │
│   └─────────────┴─────────────┴─────────────┴─────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Governance Principle

> **CiteMind is governed by AUTOMATE.**
>
> Every CiteMind engine operation is subject to:
> - Mode eligibility (Manual/Copilot/Autopilot)
> - Cost guardrails
> - Approval workflows
> - Audit trail generation

---

## 2. Engine 1: AI Ingestion & Citation Engine

### 2.1 Purpose

Engine 1 optimizes content for AI system comprehension and tracks resulting citations across AI answer surfaces.

### 2.2 Capabilities

| Capability | Description | Pillar Affinity |
|------------|-------------|-----------------|
| **Schema Generation** | Auto-generate NewsArticle, Organization, Person JSON-LD | SEO |
| **IndexNow Integration** | Instant notification to search engines on publish | SEO |
| **Google Indexing API** | Direct indexing request for high-priority content | SEO |
| **Pravado Newsroom** | AI-optimized press release hosting surface | PR |
| **Citation Detection** | Monitor AI systems for brand mentions/citations | All |
| **Citation Verification** | Validate citation accuracy and context | All |
| **Entity Reinforcement** | Strengthen entity recognition through structured data | All |

### 2.3 Schema Generation Specifications

| Schema Type | Trigger | Fields Generated |
|-------------|---------|------------------|
| **NewsArticle** | Press release, news content publish | headline, datePublished, author, publisher, articleBody, image |
| **Organization** | Brand entity page, about content | name, url, logo, sameAs, description, founder, foundingDate |
| **Person** | Executive bio, spokesperson content | name, jobTitle, worksFor, sameAs, image, description |
| **HowTo** | Tutorial/guide content | name, step[], totalTime, tool[], supply[] |
| **FAQPage** | FAQ sections | mainEntity[Question, Answer] |

### 2.4 Citation Detection Sources

| AI Surface | Detection Method | Latency | Confidence |
|------------|------------------|---------|------------|
| **ChatGPT** | Query sampling + web search verification | 4-24 hours | 85% |
| **Claude** | Query sampling + API probing | 4-24 hours | 80% |
| **Perplexity** | Direct API + web archive | 1-4 hours | 95% |
| **Gemini** | Query sampling + search verification | 4-24 hours | 80% |
| **Bing Copilot** | Query sampling + Bing API | 2-8 hours | 90% |

### 2.5 Invocation Rules

| Action | Mode Eligibility | Trigger | Approval |
|--------|------------------|---------|----------|
| Schema generation | Autopilot | On content publish | None |
| IndexNow ping | Autopilot | On schema generation | None |
| Google Indexing request | Copilot | Manual or High-priority flag | Confirm |
| Citation scan | Autopilot | Scheduled (daily) | None |
| Citation verification | Copilot | On citation detection | Review |

### 2.6 Cost Profile

| Operation | Cost Class | Per-Unit Cost | Daily Cap (Starter/Growth/Pro) |
|-----------|------------|---------------|-------------------------------|
| Schema generation | Free | $0 | Unlimited |
| IndexNow | Free | $0 | Unlimited |
| Google Indexing | Low | ~$0.01 | 10 / 50 / 200 |
| Citation scan | Medium | ~$0.50 | 1 / 5 / 20 |
| Citation verification | Low | ~$0.10 | 5 / 25 / 100 |

---

## 3. Engine 2: Audio / Podcast Transformation Engine

### 3.1 Purpose

Engine 2 transforms written content into conversational audio briefings for distribution across podcast and audio AI surfaces.

### 3.2 Critical Constraint

> **MANDATORY: Podcast synthesis is NEVER default Autopilot in V1.**
>
> Audio transformation requires explicit user action due to:
> - High externality (public distribution)
> - Medium-High cost (voice synthesis)
> - Brand reputation risk (voice represents brand)
> - Irreversibility (once published, cannot be unpublished from all surfaces)

### 3.3 Transformation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Content   │───►│  Structured │───►│Conversational│───►│   Audio     │
│   Source    │    │  Briefing   │    │  Synthesis   │    │  Output     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │                  │                  │                  │
    Any pillar        AI-generated      Multi-voice         Podcast feeds
    content           outline          narrative            AI audio surfaces
```

### 3.4 Stage Specifications

| Stage | Description | Mode Ceiling | Output |
|-------|-------------|--------------|--------|
| **Briefing Generation** | Extract key points, structure narrative | Copilot | Markdown briefing document |
| **Conversational Synthesis** | Transform briefing into dialogue | Manual | Multi-speaker script |
| **Voice Rendering** | Generate audio from script | Manual | WAV/MP3 audio file |
| **Distribution** | Publish to feeds and surfaces | Manual | Published episode |

### 3.5 Conversational Synthesis (NOT TTS)

**IMPORTANT:** Engine 2 produces **conversational synthesis**, not text-to-speech.

| Approach | Description | Used in CiteMind |
|----------|-------------|------------------|
| Text-to-Speech (TTS) | Robotic reading of text | NO |
| Conversational Synthesis | Multi-voice expert dialogue with natural flow | YES |

Conversational synthesis creates:
- Multiple speaker personas (e.g., "Host" + "Expert")
- Natural dialogue with questions and elaboration
- Appropriate pacing, emphasis, and tone
- Podcast-native format with intro/outro

### 3.6 Voice Persona Library

| Persona | Use Case | Characteristics |
|---------|----------|-----------------|
| **Industry Expert** | Deep-dive analysis | Authoritative, measured, technical |
| **Host** | Narrative framing | Conversational, curious, accessible |
| **News Anchor** | Breaking updates | Professional, urgent, clear |
| **Thought Leader** | Opinion content | Confident, forward-looking, provocative |

### 3.7 Invocation Rules

| Action | Mode Eligibility | Approval Required | Plan Minimum |
|--------|------------------|-------------------|--------------|
| Briefing generation | Copilot | Confirm | Starter |
| Script review | Manual | N/A (human step) | Growth |
| Voice synthesis | Manual | Approve | Growth |
| Distribution | Manual | Approve + Review | Growth |
| Full automated run | NOT AVAILABLE IN V1 | N/A | N/A |

### 3.8 Automation Progression (V2+ Roadmap)

| Phase | Mode | Conditions | Timeline |
|-------|------|------------|----------|
| **V1** | Manual with AI assist | All stages require human action | Current |
| **V2** | Copilot | Briefing auto-generated, human reviews script | Future |
| **V3** | Conditional Autopilot | Pre-approved templates, brand voice locked | Future |

### 3.9 Cost Profile

| Operation | Cost Class | Per-Unit Cost | Monthly Cap (Starter/Growth/Pro) |
|-----------|------------|---------------|----------------------------------|
| Briefing generation | Low | ~$0.25 | 5 / 20 / 100 |
| Script synthesis | Medium | ~$1.50 | 0 / 10 / 50 |
| Voice rendering (per minute) | High | ~$0.50/min | 0 / 30 / 200 min |
| Distribution | Free | $0 | Unlimited |

### 3.10 Risk Classification

| Risk Dimension | Score | Rationale |
|----------------|-------|-----------|
| **Externality** | 0.9 | Public distribution, represents brand |
| **Magnitude** | 0.6 | Reputation impact if quality is poor |
| **Recovery** | 0.7 | Cannot unpublish from all aggregators |
| **Precedent** | 0.5 | Sets expectations for future content |
| **Overall** | **Medium-High (0.68)** | Manual mode ceiling |

---

## 4. Engine 3: Intelligence & Monitoring Engine

### 4.1 Purpose

Engine 3 provides continuous monitoring and intelligence gathering across citation surfaces, competitor activity, and narrative dynamics.

### 4.2 Capabilities

| Capability | Description | Output Surface |
|------------|-------------|----------------|
| **Citation Tracking** | Monitor text and audio citations | EVI → Visibility |
| **Narrative Drift Detection** | Identify messaging divergence | Action Stream alert |
| **Competitive Entity Movement** | Track competitor citation changes | Strategy Panel |
| **Topic Saturation Analysis** | Measure topic coverage depth | Content pillar |
| **Signal Decay Detection** | Identify weakening signals | SAGE feedback |

### 4.3 Citation Tracking (Text + Audio)

| Citation Type | Detection Method | Attribution |
|---------------|------------------|-------------|
| **Direct Text Citation** | Entity mention in AI response | Visibility + Authority |
| **Paraphrase Citation** | Semantic match without attribution | Visibility only |
| **Audio Citation** | Transcription analysis of podcasts/audio | Visibility + Authority |
| **Visual Citation** | Brand/logo in generated images | Visibility only |

### 4.4 Narrative Drift Detection

| Drift Type | Trigger | Action |
|------------|---------|--------|
| **Messaging Inconsistency** | Brand described differently across surfaces | Alert + Brief suggestion |
| **Negative Sentiment Shift** | 10%+ sentiment decline in 7 days | Crisis alert |
| **Competitor Narrative Gain** | Competitor gaining share on brand topics | Competitive alert |
| **Topic Misattribution** | AI attributing brand's topics to competitors | Correction campaign suggestion |

### 4.5 Signal → EVI Feedback Loop

```
Citation Detected
       │
       ▼
┌─────────────────┐
│ Attribution     │
│ Analysis        │
│                 │
│ • Source tier   │
│ • Context       │
│ • Sentiment     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ EVI Component   │───►│ SAGE Proposal   │
│ Update          │    │ Generation      │
│                 │    │                 │
│ • Visibility    │    │ "Reinforce this │
│ • Authority     │    │  citation"      │
│ • Momentum      │    │                 │
└─────────────────┘    └─────────────────┘
```

### 4.6 Invocation Rules

| Action | Mode Eligibility | Frequency | Approval |
|--------|------------------|-----------|----------|
| Scheduled citation scan | Autopilot | Daily | None |
| Narrative drift analysis | Autopilot | Weekly | None |
| Competitive monitoring | Autopilot | Daily | None |
| Alert generation | Autopilot | On detection | None |
| Correction campaign | Copilot | On drift detection | Review |

### 4.7 Cost Profile

| Operation | Cost Class | Per-Unit Cost | Included in Plan |
|-----------|------------|---------------|------------------|
| Daily citation scan | Medium | ~$0.50 | All plans |
| Competitive monitoring | Low | ~$0.10 | Growth+ |
| Narrative analysis | Medium | ~$0.75 | Growth+ |
| Alert generation | Free | $0 | All plans |

---

## 5. Integration Map

### 5.1 CiteMind → SAGE

| CiteMind Output | SAGE Input | Effect |
|-----------------|------------|--------|
| Citation detected | Signal | New opportunity or validation signal |
| Narrative drift | Signal | Correction campaign trigger |
| Competitor movement | Signal | Competitive response trigger |
| Topic saturation | Authority | Topical authority score adjustment |
| Entity recognition | Authority | Entity strength update |

### 5.2 CiteMind → EVI

| CiteMind Output | EVI Component | Weight |
|-----------------|---------------|--------|
| AI citation count | Visibility | 35% of Visibility |
| Citation quality (tier) | Authority | 20% of Authority |
| Citation velocity | Momentum | 40% of Momentum |
| Competitive citation share | Exposure | Benchmark comparison |

### 5.3 CiteMind → Pillar Surfaces

| Engine | PR Pillar | Content Pillar | SEO Pillar |
|--------|-----------|----------------|------------|
| **Engine 1** | Pravado Newsroom hosting | Schema for content | Full schema + indexing |
| **Engine 2** | Press release → podcast | Blog → audio briefing | N/A |
| **Engine 3** | Coverage monitoring | Content performance | Ranking + citation tracking |

### 5.4 CiteMind → Entity Map

| CiteMind Event | Entity Map Effect |
|----------------|-------------------|
| Citation detected | Entity node glow increase |
| Citation quality high | Entity edge thickness increase |
| Competitor citation gain | Competitor node movement |
| New AI model citation | New node creation in Growth zone |

---

## 6. AUTOMATE Governance

### 6.1 CiteMind as Governed Subsystem

CiteMind operates under AUTOMATE governance with:

| Governance Layer | CiteMind Implementation |
|------------------|------------------------|
| **Mode Eligibility** | Per-engine, per-action eligibility matrix |
| **Cost Guardrails** | Per-engine budget caps |
| **Approval Workflows** | Required for high-externality actions |
| **Audit Trail** | Complete logging of all engine operations |

### 6.2 Engine-Specific Risk Profiles

| Engine | Risk Class | Mode Ceiling | Rationale |
|--------|------------|--------------|-----------|
| **Engine 1** | Low | Autopilot | Internal optimization, no external publish |
| **Engine 2** | Medium-High | Manual | External publish, brand voice, irreversible |
| **Engine 3** | Low | Autopilot | Read-only monitoring, no external action |

### 6.3 Plan-Tier Feature Gating

| Feature | Starter | Growth | Pro | Enterprise |
|---------|---------|--------|-----|------------|
| Schema generation | Yes | Yes | Yes | Yes |
| IndexNow | Yes | Yes | Yes | Yes |
| Citation tracking (basic) | 5/day | 20/day | Unlimited | Unlimited |
| Citation verification | No | Yes | Yes | Yes |
| Audio briefing | No | 10/mo | 50/mo | Custom |
| Voice synthesis | No | 30 min/mo | 200 min/mo | Custom |
| Competitive monitoring | No | Yes | Yes | Yes |
| Narrative drift alerts | No | Yes | Yes | Yes |

---

## 7. Compliance Checklist

CiteMind implementations MUST satisfy:

- [ ] Engine 1 schema generation follows structured data specifications
- [ ] Engine 2 audio transformation requires explicit user action in V1
- [ ] Engine 3 monitoring operates within cost guardrails
- [ ] All operations generate audit trail entries
- [ ] Mode eligibility follows AUTOMATE governance
- [ ] Cost caps enforced per-engine
- [ ] Citation detection feeds into EVI calculation
- [ ] Entity Map reflects CiteMind intelligence

---

## 8. Governance

### 8.1 Canon Authority

This document is the authoritative specification for CiteMind system behavior. Any implementation that deviates is non-compliant.

### 8.2 Change Control

Modifications require:
1. Product review sign-off
2. IP/Legal review for patent implications
3. Engineering cost assessment
4. Update to AUTOMATE and SAGE dependent specifications

### 8.3 Trade Secret Classification

| Component | Classification | Disclosure |
|-----------|---------------|------------|
| Engine architecture | Trade Secret | NEVER |
| Invocation rules | INTERNAL | Employees only |
| Cost profile | INTERNAL | Employees only |
| Integration map | CUSTOMER | With agreement |
| Capability descriptions | PUBLIC | Marketing approved |

---

## 9. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-14 | 1.0 | Initial CiteMind system specification |

