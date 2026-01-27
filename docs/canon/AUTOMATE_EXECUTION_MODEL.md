# AUTOMATE EXECUTION MODEL

> **Status:** CANONICAL
> **Authority:** This document defines the execution governance framework for Pravado.
> **Classification:** Defensible IP (Trade Secret + Patent Eligible)
> **Last Updated:** 2026-01-14

---

## 1. Formal Definition

### 1.1 What AUTOMATE Is

**AUTOMATE** is the **execution governance layer** that converts SAGE proposals into controlled, auditable actions with explicit authority boundaries.

AUTOMATE is NOT:
- A workflow engine
- A task queue
- A cron scheduler
- A simple rule processor

AUTOMATE IS:
- A **decision authority framework** that determines who/what can approve and execute actions
- A **risk classification system** that categorizes actions by consequence and reversibility
- A **cost governor** that enforces resource consumption limits
- An **audit trail generator** that creates legally-defensible execution records
- A **trust ladder** that graduates automation based on proven reliability

### 1.2 Core Principle

> **No Silent Automation**
>
> Every action is visible, traceable, explainable, and interruptible.

This principle is non-negotiable. Any implementation that allows hidden, untraceable, or unexplainable automation is non-compliant.

---

## 2. Decision Authority Ladder

### 2.1 Authority Modes

AUTOMATE operates in three authority modes, each with explicit boundaries:

| Mode | Authority | User Role | System Role | Applicability |
|------|-----------|-----------|-------------|---------------|
| **Manual** | Human decides, human executes | Full control | Proposal only | High-risk, novel, destructive |
| **Copilot** | Human decides, system assists execution | Approve/reject | Execute with supervision | Moderate-risk, validated patterns |
| **Autopilot** | System decides and executes within bounds | Monitor, interrupt | Autonomous within guardrails | Low-risk, proven patterns |

### 2.2 Mode Transition Requirements

Modes are NOT user preferences. Mode eligibility is determined by:

```
Mode = f(Confidence, Risk, Reversibility, Trust, Plan)
```

**Mode Eligibility Matrix:**

| Factor | Manual (Required) | Copilot (Eligible) | Autopilot (Eligible) |
|--------|-------------------|-------------------|---------------------|
| **Confidence** | Any | ≥ 0.70 | ≥ 0.85 |
| **Risk Class** | High, Critical | Medium, Low | Low only |
| **Reversibility** | Any | Any | Reversible only |
| **Trust Level** | Any | Established | Proven |
| **Plan** | Any | Growth+ | Enterprise (selected actions) |

### 2.3 Trust Level Accumulation

Trust is earned through successful execution without incident:

| Trust Level | Requirements | Unlocks |
|-------------|--------------|---------|
| **New** | Fresh organization | Manual mode only |
| **Established** | 30+ successful executions, 0 critical failures | Copilot mode eligibility |
| **Proven** | 100+ successful executions, <2% failure rate, 90+ days active | Autopilot mode eligibility |
| **Veteran** | 500+ successful executions, <1% failure rate, 180+ days | Extended autopilot scope |

**Trust Decay:**
- Critical failure: Trust level drops one tier
- Moderate failure: Trust score reduces by 10%
- Inactivity >60 days: Trust score reduces by 20%

---

## 3. Confidence Thresholds

### 3.1 Confidence Definition

Confidence is the system's calculated probability that a proposed action will achieve its intended outcome without negative side effects.

```
Confidence = f(Signal Quality, Historical Success, Pattern Match, Risk Assessment)
```

### 3.2 Confidence Calculation

| Component | Weight | Description |
|-----------|--------|-------------|
| **Signal Quality** | 30% | How clear and unambiguous is the triggering signal? |
| **Historical Success** | 25% | Past success rate for similar actions |
| **Pattern Match** | 25% | How well does this match proven successful patterns? |
| **Risk Assessment** | 20% | Inverse of identified risk factors |

### 3.3 Confidence Thresholds

| Threshold | Confidence Range | Implications |
|-----------|------------------|--------------|
| **Insufficient** | 0.00 - 0.49 | Action not proposed; more information needed |
| **Low** | 0.50 - 0.69 | Proposal shown with warnings; Manual mode only |
| **Moderate** | 0.70 - 0.84 | Copilot eligible; user approval required |
| **High** | 0.85 - 0.94 | Autopilot eligible (if other criteria met) |
| **Very High** | 0.95 - 1.00 | Priority execution; recommended for automation |

### 3.4 Confidence Degradation

Confidence degrades over time as conditions change:

```
Confidence(t) = Confidence(t₀) × e^(-0.05 × days)
```

A proposal with initial confidence 0.90 degrades to:
- 0.86 after 1 week
- 0.74 after 1 month
- 0.55 after 2 months (drops to Manual only)

---

## 4. Reversibility Classification

### 4.1 Reversibility Definition

Reversibility measures how completely an action's effects can be undone if the action proves to be incorrect.

### 4.2 Reversibility Tiers

| Tier | Definition | Examples | Autopilot Eligible |
|------|------------|----------|-------------------|
| **Fully Reversible** | Action can be completely undone with no residual effects | Draft save, internal schedule change, tag update | Yes |
| **Partially Reversible** | Action can be mostly undone but some effects persist | Email draft to review, content unpublish, keyword pause | Copilot only |
| **Irreversible** | Action effects cannot be undone once executed | Email sent, press release published, public statement | Manual only |

### 4.3 Reversibility by Action Type

| Action Category | Reversibility | Mode Ceiling |
|-----------------|---------------|--------------|
| **Internal State Changes** | Fully | Autopilot |
| **Draft Creation** | Fully | Autopilot |
| **Schedule Modification** | Fully | Autopilot |
| **Content Publish (Owned)** | Partial | Copilot |
| **Email/Outreach (External)** | Irreversible | Manual |
| **Public Statement** | Irreversible | Manual |
| **API Integration Trigger** | Varies | Per-integration |
| **Spend Commitment** | Irreversible | Manual |

---

## 5. Risk Classification

### 5.1 Risk Dimensions

Risk is assessed across four dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Externality** | 35% | Internal vs. public-facing action |
| **Consequence Magnitude** | 30% | Scale of potential negative outcome |
| **Recovery Difficulty** | 20% | Effort required to remediate if wrong |
| **Precedent Sensitivity** | 15% | Whether this sets patterns for future actions |

### 5.2 Risk Calculation

```
Risk Score = Σ(Dimension Weight × Dimension Score)

Where Dimension Score ∈ [0, 1]
```

### 5.3 Risk Classes

| Risk Class | Score Range | Mode Ceiling | Approval Requirements |
|------------|-------------|--------------|----------------------|
| **Low** | 0.00 - 0.29 | Autopilot | None (within guardrails) |
| **Medium** | 0.30 - 0.59 | Copilot | Single user approval |
| **High** | 0.60 - 0.79 | Manual | Manager + user approval |
| **Critical** | 0.80 - 1.00 | Manual | Executive approval required |

### 5.4 Risk Matrix by Action Type

| Action Type | Externality | Magnitude | Recovery | Precedent | **Risk Class** |
|-------------|-------------|-----------|----------|-----------|----------------|
| Tag internal content | 0.0 | 0.1 | 0.1 | 0.1 | **Low** (0.08) |
| Schedule content | 0.2 | 0.2 | 0.2 | 0.2 | **Low** (0.20) |
| Publish blog post | 0.5 | 0.4 | 0.4 | 0.3 | **Medium** (0.42) |
| Send pitch email | 0.9 | 0.5 | 0.6 | 0.4 | **Medium** (0.58) |
| Issue press release | 1.0 | 0.8 | 0.9 | 0.8 | **High** (0.88) |
| Crisis response | 1.0 | 1.0 | 1.0 | 1.0 | **Critical** (1.0) |

---

## 6. Plan-Tier Guardrails

### 6.1 Guardrail Framework

Guardrails enforce hard limits by plan tier. These are not soft recommendations—they are enforced constraints.

### 6.2 Execution Guardrails by Plan

| Guardrail | Starter | Growth | Pro | Enterprise |
|-----------|---------|--------|-----|------------|
| **Max Actions/Day** | 10 | 50 | 200 | Unlimited* |
| **Autopilot Eligible** | No | No | Selected | Full |
| **External Actions/Day** | 2 | 10 | 50 | Custom |
| **Concurrent Executions** | 1 | 3 | 10 | Custom |
| **LLM Calls/Hour** | 20 | 100 | 500 | Custom |
| **Approval Chain Depth** | 1 | 2 | 3 | Custom |

*Enterprise "unlimited" still subject to rate limiting and abuse prevention.

### 6.3 Cost Guardrails

| Cost Type | Starter | Growth | Pro | Enterprise |
|-----------|---------|--------|-----|------------|
| **LLM Spend/Month** | $50 | $200 | $1,000 | Custom |
| **API Calls/Month** | 5,000 | 25,000 | 150,000 | Custom |
| **Storage/Month** | 1GB | 10GB | 100GB | Custom |

### 6.4 Guardrail Enforcement

When a guardrail is hit:

| Response Type | Behavior |
|---------------|----------|
| **Soft Limit (80%)** | Warning notification, continue execution |
| **Hard Limit (100%)** | Execution paused, user notification, queue actions |
| **Overage (>100%)** | Block new actions, emergency notification, require upgrade or wait |

### 6.5 Degradation Modes

When limits approach, system enters degradation modes:

| Degradation | Trigger | Behavior |
|-------------|---------|----------|
| **Model Downgrade** | LLM spend at 80% | Use cheaper model variants |
| **Frequency Reduction** | API calls at 90% | Reduce polling/check frequency |
| **Queue Mode** | Concurrent limit hit | Queue new actions, process FIFO |
| **Priority Mode** | All limits stressed | Critical actions only |

---

## 7. Auditability and Explainability

### 7.1 Audit Trail Requirements

Every action generates an immutable audit record containing:

| Field | Description | Retention |
|-------|-------------|-----------|
| **action_id** | Unique identifier | Permanent |
| **timestamp** | ISO 8601 execution time | Permanent |
| **actor** | User ID or system identifier | Permanent |
| **mode** | Manual/Copilot/Autopilot | Permanent |
| **proposal_id** | Link to originating SAGE proposal | Permanent |
| **confidence** | Confidence at execution time | Permanent |
| **risk_class** | Calculated risk classification | Permanent |
| **inputs** | Complete input data (hashed if sensitive) | 7 years |
| **outputs** | Complete output data (hashed if sensitive) | 7 years |
| **approvals** | Chain of approval decisions | Permanent |
| **outcome** | Success/failure with reason | Permanent |

### 7.2 Explainability Requirements

Every action must be explainable at three levels:

**Level 1: User Summary**
```
"This action [verb] because [signal]. Expected impact: [outcome]. Risk: [level]."

Example: "Sent pitch to Sarah Chen because she is covering AI marketing tools
with 48-hour deadline. Expected impact: TechCrunch coverage. Risk: Low."
```

**Level 2: Technical Detail**
```json
{
  "trigger_signal": "journalist_coverage_pattern",
  "signal_confidence": 0.92,
  "pattern_match": "ai_marketing_pitch_success",
  "risk_factors": ["deadline_pressure"],
  "mitigations_applied": ["template_personalization"],
  "expected_outcome": {
    "primary": "journalist_response",
    "probability": 0.34,
    "secondary": "coverage_publication",
    "probability": 0.18
  }
}
```

**Level 3: Causal Chain**
```
Signal Detection (t-48h): Journalist trend identified
  ↓
Proposal Generation (t-24h): Pitch opportunity proposed
  ↓
Approval (t-12h): User approved, mode: Copilot
  ↓
Preparation (t-1h): Email drafted, personalization applied
  ↓
Execution (t-0): Email sent via integration
  ↓
Outcome (t+48h): Response received → Success recorded
```

### 7.3 Compliance Reporting

System generates compliance-ready reports:

| Report | Frequency | Contents |
|--------|-----------|----------|
| **Action Summary** | Daily | All actions, outcomes, approval chains |
| **Automation Audit** | Weekly | Autopilot actions, success rates, interventions |
| **Cost Report** | Monthly | LLM spend, API usage, by action type |
| **Failure Analysis** | On-demand | Failed actions, root causes, remediation |
| **Authority Report** | Quarterly | Mode usage, trust progression, guardrail hits |

---

## 8. Execution State Machine

### 8.1 Action States

```
┌──────────────────────────────────────────────────────────────────┐
│                      ACTION STATE MACHINE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│   │PROPOSED │───►│ QUEUED  │───►│APPROVED │───►│EXECUTING│       │
│   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘       │
│        │              │              │              │             │
│        │              │              │              ▼             │
│        │              │              │         ┌─────────┐        │
│        │              │              │         │COMPLETED│        │
│        │              │              │         └─────────┘        │
│        │              │              │              │             │
│        ▼              ▼              ▼              ▼             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│   │DECLINED │    │ EXPIRED │    │REJECTED │    │ FAILED  │       │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 State Definitions

| State | Definition | Duration | Transitions |
|-------|------------|----------|-------------|
| **Proposed** | SAGE generated proposal | Until user interaction or timeout | → Queued, Declined |
| **Queued** | Awaiting execution slot | Until slot available or timeout | → Approved, Expired |
| **Approved** | User authorized execution | Until execution begins | → Executing, Rejected |
| **Executing** | Action in progress | Until completion or failure | → Completed, Failed |
| **Completed** | Successful execution | Terminal | None |
| **Declined** | User declined proposal | Terminal | None |
| **Expired** | Timeout without action | Terminal | None |
| **Rejected** | Guardrail or policy block | Terminal | None |
| **Failed** | Execution error | Terminal (may retry) | → Queued (if retry eligible) |

### 8.3 State Timeouts

| Transition | Timeout | On Timeout |
|------------|---------|------------|
| Proposed → Expired | 48 hours (default, configurable) | Move to Expired |
| Queued → Expired | 24 hours | Move to Expired |
| Approved → Rejected | 1 hour (safety timeout) | Move to Rejected |
| Executing → Failed | 5 minutes (action-specific) | Move to Failed |

### 8.4 Retry Policy

| Failure Type | Retry Eligible | Max Retries | Backoff |
|--------------|----------------|-------------|---------|
| **Transient** (network, rate limit) | Yes | 3 | Exponential (1s, 2s, 4s) |
| **Recoverable** (API error, format issue) | Yes | 2 | Linear (60s, 120s) |
| **Permanent** (auth failure, policy block) | No | 0 | N/A |
| **Unknown** | Yes (with degraded confidence) | 1 | 300s |

---

## 9. Approval Workflows

### 9.1 Approval Types

| Type | Description | Trigger |
|------|-------------|---------|
| **None** | Action executes without approval | Low risk + Autopilot eligible |
| **Confirm** | Single-click confirmation | Copilot mode actions |
| **Review** | Detailed review required | Medium risk + Copilot |
| **Approve** | Explicit approval with reason | High risk actions |
| **Chain** | Multi-party approval | Critical risk or enterprise policy |

### 9.2 Approval Chain Structure

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Initiator  │───►│  Approver 1 │───►│  Approver 2 │───► Execute
│   (User)    │    │  (Manager)  │    │ (Executive) │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Reject    │    │   Reject    │
                   └─────────────┘    └─────────────┘
```

### 9.3 Approval SLAs

| Approval Type | Expected Response | Escalation |
|---------------|-------------------|------------|
| **Confirm** | Immediate | N/A |
| **Review** | 1 hour | Reminder at 30 min |
| **Approve** | 4 hours | Escalate at 2 hours |
| **Chain (each step)** | 8 hours | Escalate at 4 hours |

### 9.4 Delegation Rules

- Approvers can delegate within their tier
- Delegation requires explicit grant (not implicit)
- Delegation is audited as approval chain extension
- Auto-delegation on absence requires pre-configuration

---

## 10. Integration with SAGE

### 10.1 Proposal Ingestion

AUTOMATE receives proposals from SAGE with:

| Field | Source | Usage |
|-------|--------|-------|
| **proposal_id** | SAGE | Linking |
| **action_type** | SAGE | Risk classification |
| **confidence** | SAGE | Mode eligibility |
| **signals** | SAGE | Explainability |
| **expected_impact** | SAGE | Outcome tracking |
| **pillar** | SAGE | Cross-pillar coordination |

### 10.2 Outcome Feedback

AUTOMATE feeds execution outcomes back to SAGE:

| Outcome | Feedback to SAGE |
|---------|------------------|
| **Success** | Pattern reinforcement, confidence boost for similar |
| **Failure** | Pattern penalty, confidence reduction for similar |
| **Timeout** | Signal decay indication |
| **Rejection** | Guardrail indication, proposal tuning signal |

### 10.3 Cross-Pillar Coordination

When an action in one pillar completes, AUTOMATE:
1. Notifies SAGE of outcome
2. SAGE evaluates cross-pillar reinforcement effects
3. SAGE generates follow-on proposals in related pillars
4. AUTOMATE queues new proposals

Example flow:
```
PR Action Completed: TechCrunch coverage published
  ↓ (AUTOMATE → SAGE)
SAGE Evaluates: PR → Content reinforcement (0.50)
  ↓
SAGE Proposes: Content brief for related topic
  ↓ (SAGE → AUTOMATE)
AUTOMATE Queues: Content brief proposal with PR attribution
```

---

## 11. Failure Modes

### 11.1 System Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| **Execution Service Down** | Health check failure | Queue all actions, alert operators |
| **Integration Failure** | API error rate >10% | Disable affected integrations, queue actions |
| **Database Unavailable** | Connection failure | Halt execution, preserve pending state |
| **Rate Limit Exceeded** | 429 responses | Activate degradation mode |

### 11.2 Process Failures

| Failure | Detection | Response |
|---------|-----------|----------|
| **Approval Deadlock** | SLA breach | Escalation + timeout |
| **Guardrail Conflict** | Multiple guardrails triggered | Strictest guardrail wins |
| **Trust Regression** | Failure rate spike | Automatic mode downgrade |
| **Cost Overrun** | Spend exceeds budget | Halt new commitments |

### 11.3 Recovery Procedures

| Failure Type | Recovery |
|--------------|----------|
| **Transient** | Automatic retry with backoff |
| **Service** | Failover to backup, manual intervention |
| **Data** | Restore from audit log, reconciliation |
| **Policy** | Human review, exception or configuration fix |

---

## 12. CiteMind Subsystem Governance

### 12.1 CiteMind as Governed Subsystem

CiteMind is a multi-engine system operating under AUTOMATE governance. Each CiteMind engine is subject to the full AUTOMATE authority framework, with engine-specific risk profiles determining mode eligibility.

**Reference:** See `/docs/canon/CITEMIND_SYSTEM.md` for complete system specification.

### 12.2 Engine-Specific Risk Profiles

| Engine | Risk Class | Mode Ceiling | Rationale |
|--------|-----------|--------------|-----------|
| **Engine 1: AI Ingestion & Citation** | Low | Autopilot | Internal optimization only; no external publish; schema generation and indexing are reversible |
| **Engine 2: Audio/Podcast Transformation** | Medium-High | Manual | External publish; brand voice representation; irreversible once distributed to aggregators |
| **Engine 3: Intelligence & Monitoring** | Low | Autopilot | Read-only monitoring; no external actions; alert generation is internal |

### 12.3 Engine 2 Risk Classification (Audio Transformation)

Engine 2 (Audio/Podcast Transformation) requires explicit risk classification due to its unique characteristics:

| Risk Dimension | Score | Rationale |
|----------------|-------|-----------|
| **Externality** | 0.9 | Public distribution across podcast platforms |
| **Magnitude** | 0.6 | Brand reputation impact if quality is poor |
| **Recovery** | 0.7 | Cannot unpublish from all aggregators once distributed |
| **Precedent** | 0.5 | Sets expectations for future audio content |
| **Overall Score** | **0.68** | Medium-High Risk Class |

**Mode Ceiling Determination:**
```
Risk Score 0.68 → Risk Class: High (0.60-0.79)
Mode Ceiling = Manual (per Section 5.3)
```

**V1 Constraint:** Podcast synthesis is NEVER eligible for Autopilot in V1, regardless of trust level or confidence score.

### 12.4 CiteMind Action Classification

| Action | Engine | Risk Class | Mode Ceiling | Approval |
|--------|--------|------------|--------------|----------|
| Schema generation | 1 | Low | Autopilot | None |
| IndexNow ping | 1 | Low | Autopilot | None |
| Google Indexing request | 1 | Medium | Copilot | Confirm |
| Citation scan | 1 | Low | Autopilot | None |
| Citation verification | 1 | Low | Copilot | Review |
| Briefing generation | 2 | Medium | Copilot | Confirm |
| Script review | 2 | N/A | Manual | Human step |
| Voice synthesis | 2 | High | Manual | Approve |
| Audio distribution | 2 | High | Manual | Approve + Review |
| Daily citation scan | 3 | Low | Autopilot | None |
| Narrative drift analysis | 3 | Low | Autopilot | None |
| Competitive monitoring | 3 | Low | Autopilot | None |
| Alert generation | 3 | Low | Autopilot | None |
| Correction campaign | 3 | Medium | Copilot | Review |

### 12.5 CiteMind Cost Guardrails

CiteMind engines are subject to plan-tier cost guardrails in addition to general AUTOMATE guardrails:

| CiteMind Operation | Starter | Growth | Pro | Enterprise |
|-------------------|---------|--------|-----|------------|
| Google Indexing/day | 10 | 50 | 200 | Custom |
| Citation scans/day | 1 | 5 | 20 | Custom |
| Citation verifications/day | 5 | 25 | 100 | Custom |
| Audio briefings/month | 5 | 20 | 100 | Custom |
| Voice synthesis min/month | 0 | 30 | 200 | Custom |

### 12.6 CiteMind Audit Trail Extension

In addition to standard AUTOMATE audit fields, CiteMind actions include:

| Field | Description | Retention |
|-------|-------------|-----------|
| **engine_id** | Which CiteMind engine (1, 2, or 3) | Permanent |
| **engine_action** | Specific engine action type | Permanent |
| **content_source_id** | Link to source content | 7 years |
| **distribution_targets** | Where content was published (Engine 2) | 7 years |
| **citation_surface** | AI system where citation detected (Engine 3) | 7 years |

---

## 13. Governance

### 13.1 Canon Authority

This document is the authoritative specification for AUTOMATE behavior. Any implementation that deviates is non-compliant.

### 13.2 Compliance Verification

AUTOMATE implementations must demonstrate:
- [ ] No action executes without audit trail
- [ ] Mode eligibility follows specified matrix
- [ ] Confidence thresholds are enforced
- [ ] Reversibility is correctly classified
- [ ] Risk classification matches action types
- [ ] Plan-tier guardrails are enforced
- [ ] Approval workflows match specifications
- [ ] SAGE feedback loop is operational

### 13.3 Change Control

Modifications require:
1. Product review sign-off
2. Security review for authorization changes
3. Legal review for audit/compliance changes
4. Update to dependent specifications

---

## 14. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | Initial canonical specification |
| 2026-01-14 | 1.1 | Added Section 12: CiteMind Subsystem Governance |
