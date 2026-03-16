# PRESS RELEASE DISTRIBUTION CONTRACT

> **Status:** CANONICAL
> **Authority:** This document defines the press release distribution architecture, wire fulfillment workflow, credit billing model, and API stub specification.
> **Classification:** Product Definition + Operations
> **Last Updated:** 2026-02-26

---

## 1. Dual Distribution Philosophy

Every press release in Pravado has two distribution paths. They are not mutually exclusive — both can be used for the same release.

| Path | Name | Purpose | Mode Ceiling | Cost Model |
|------|------|---------|--------------|------------|
| **Path 1** | CiteMind AEO Distribution | AI model ingestion, citation building, long-term authority | Copilot | Included in all plans |
| **Path 2** | Legacy Wire Distribution | Traditional reach, compliance, SEC requirements, broad syndication | Manual — permanent, no exceptions | Credits/add-on per submission |

**Path 1 is always the recommended primary path.** Path 2 is additive — used when compliance, investor relations, or broad traditional reach requirements demand it.

---

## 2. Path 1 — CiteMind AEO Distribution

### 2.1 What It Does

CiteMind AEO Distribution publishes press releases to the Pravado Newsroom — a hosted, AI-optimized publication surface — and notifies search engines via IndexNow. The goal is AI model ingestion and citation building, not wire syndication volume.

### 2.2 AEO Distribution Flow

```
1. User drafts press release in Release Editor
       │
       ▼
2. CiteMind Engine 1 generates structured data
   ├── NewsArticle schema (JSON-LD)
   ├── Person schema for spokesperson mentions
   └── Organization schema for brand entities
       │
       ▼
3. User reviews schema preview (Copilot — user confirms)
       │
       ▼
4. Publish to Pravado Newsroom
   ├── Canonical URL: newsroom.pravado.com/{org-slug}/{release-slug}
   ├── Schema embedded in page <head>
   └── Release indexed with full structured data
       │
       ▼
5. IndexNow ping sent to:
   ├── Google Search Console
   ├── Bing Webmaster
   └── Other IndexNow-compatible engines
       │
       ▼
6. CiteMind Engine 3 activates citation tracking
   └── Monitors AI mention of release content across LLM surfaces
```

### 2.3 AEO Distribution — Included in All Plans

Pravado Newsroom publishing has zero marginal cost. All plans include unlimited AEO distribution. There is no per-release charge, no credits required, and no daily limit.

---

## 3. Path 2 — Legacy Wire Distribution

### 3.1 Architecture Overview

Wire distribution operates on a **dual-mode architecture**: manual fulfillment at V1 with an API stub layer that enables transparent API integration when a suitable partner is identified. The manual fallback remains available permanently — it is never removed even after API integration is live.

This design ensures:
- V1 ships with full wire distribution capability immediately
- API migration requires zero changes to the user-facing flow or data model
- No single-point-of-failure dependency on an API provider

### 3.2 Supported Wire Services

| Wire Service | Primary Use Case | V1 Status | API Stub |
|--------------|-----------------|-----------|----------|
| **PR Newswire** | SEC compliance, broad US distribution, financial news | ✅ Available | Stub built |
| **BusinessWire** | Financial news, regulatory, investor relations | ✅ Available | Stub built |
| **GlobeNewswire** | International distribution | Roadmap (V2) | Roadmap |

### 3.3 V1 Manual Fulfillment Workflow

The complete end-to-end workflow for wire distribution at V1:

```
Step 1 — User Initiates Wire Distribution
  User clicks "Submit for Wire Distribution" in Release Editor
  System presents distribution options with wire service selector

Step 2 — Cost Review & Confirmation (REQUIRED — cannot be skipped)
  System displays:
    ├── Selected wire service
    ├── Distribution cost (credits deducted or charge amount)
    ├── Expected distribution timeline (within 4 business hours)
    ├── What "wire distribution" means (syndication to licensed media outlets)
    └── "Why choose wire" explainer (compliance, investor relations, broad reach)
  User must explicitly confirm to proceed

Step 3 — Payment / Credit Deduction
  System deducts credits from org balance OR initiates add-on purchase
  Confirmation number generated

Step 4 — Submission Package Generation (automated)
  System assembles:
    ├── Formatted press release (wire-compliant plain text + HTML version)
    ├── Metadata: headline, dateline, contact block, boilerplate
    ├── Distribution instructions (wire service, category, geography)
    └── Confirmation number + org ID

Step 5 — Handoff to Pravado Operations (automated)
  Submission package emailed to: wire-submissions@pravado.com
  Subject format: [WIRE-{confirmation_number}] {org_name} — {headline}
  wire_distribution_submissions table record created with status: pending

Step 6 — Manual Wire Submission (Pravado Operations)
  Ops staff submits to selected wire service via their web portal
  SLA: Within 4 business hours of package receipt
  Ops logs: wire service tracking ID, distribution timestamp, any issues

Step 7 — Confirmation Back to System
  Ops updates wire_distribution_submissions record:
    ├── tracking_id (wire service reference)
    ├── distributed_at timestamp
    └── status: distributed
  System sends notification to user with tracking ID

Step 8 — Citation Tracking Activation
  CiteMind Engine 3 begins monitoring for coverage derived from wire release
```

### 3.4 API Stub Architecture

When a suitable wire API partner is identified, Steps 5 and 6 are replaced by an API call with zero changes to user experience or data model.

```typescript
// Wire distribution adapter interface — implemented by both manual and API modes
interface WireDistributionAdapter {
  submit(package: SubmissionPackage): Promise<SubmissionResult>;
  getStatus(trackingId: string): Promise<DistributionStatus>;
}

// V1 implementation: ManualFulfillmentAdapter
// Future implementation: WireApiAdapter (drop-in replacement)
class ManualFulfillmentAdapter implements WireDistributionAdapter {
  async submit(package: SubmissionPackage): Promise<SubmissionResult> {
    // Emails submission package to Pravado ops inbox
    // Creates pending record in wire_distribution_submissions
    // Returns confirmation number
  }
}
```

The adapter pattern means the API integration is a new class implementing the same interface — not a rewrite.

### 3.5 API Migration Trigger Criteria

The decision to activate API integration for a wire service requires all of the following:

- API partner identified with cost per submission ≤ current manual processing cost
- API reliability SLA ≥ 99.5% uptime guarantee
- API supports all required submission fields (headline, dateline, body, contact block, boilerplate, category, geo)
- Manual fallback adapter remains functional and tested
- Zero breaking changes to user-facing flow confirmed

---

## 4. Wire Distribution Data Model

### 4.1 wire_distribution_submissions

```sql
wire_distribution_submissions (
  id                  UUID PRIMARY KEY,
  org_id              UUID NOT NULL,
  release_id          UUID NOT NULL REFERENCES press_releases(id),
  wire_service        TEXT NOT NULL CHECK (wire_service IN ('pr_newswire','businesswire','globenewswire')),
  distribution_mode   TEXT NOT NULL CHECK (distribution_mode IN ('manual','api')),
  confirmation_number TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','submitted','distributed','failed')),
  credits_used        INTEGER,
  cost_amount         DECIMAL(10,2),
  submission_package  JSONB,        -- full package for audit trail
  submitted_at        TIMESTAMPTZ,
  distributed_at      TIMESTAMPTZ,
  wire_tracking_id    TEXT,         -- ID returned by wire service
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
)
```

### 4.2 press_release_distribution_status (View)

A computed view for user-facing status display:

| Status | Display | User Message |
|--------|---------|--------------|
| `pending` | ⏳ Queued | "Submission received. Distribution in progress (within 4 business hours)." |
| `submitted` | 🔄 Processing | "Submitted to wire service. Awaiting confirmation." |
| `distributed` | ✅ Distributed | "Distributed via {wire_service}. Tracking ID: {id}" |
| `failed` | ❌ Failed | "Distribution failed. {failure_reason}. Credits refunded." |

---

## 5. Credit & Billing Model

### 5.1 Wire Distribution Credit System

Wire distribution uses a credits system across all tiers. Credits are consumed per wire submission. AEO distribution (Pravado Newsroom) is always free and does not consume credits.

| Tier | Wire Credits Included | Additional Credits |
|------|----------------------|-------------------|
| Starter | 0 included | Add-on purchase only |
| Pro | 1 per month | Additional credits purchasable |
| Business | 3 per month | Additional credits purchasable, bulk discount |
| Enterprise | 5 per month default (custom) | Bundled credits negotiated in contract |

**Credit rollover:** Monthly credits do not roll over. Purchased additional credits expire after 12 months.

**Credit value:** 1 credit = 1 wire submission to 1 wire service. Submitting the same release to both PR Newswire and BusinessWire = 2 credits.

### 5.2 Credit Add-On Pricing

| Bundle | Credits | Price | Per-Credit Cost |
|--------|---------|-------|-----------------|
| Single | 1 | $35 | $35.00 |
| Pack | 5 | $150 | $30.00 |
| Bundle | 12 | $300 | $25.00 |
| Enterprise block | 25+ | Custom | Negotiated |

Pricing is designed to recover the $30/release fulfillment cost while maintaining a sustainable margin. Bulk discounts incentivize Enterprise commitment.

### 5.3 Credit Flow

```
User initiates wire distribution
    ↓
System checks org credit balance
    ↓ (if balance ≥ 1)
Display cost confirmation with credit deduction preview
    ↓ (user confirms)
Credit deducted from org balance
    ↓
Submission proceeds (Step 4 in workflow)
    ↓ (if distribution fails)
Credit refunded automatically + failure notification sent

    ↓ (if balance = 0)
Display "No credits available" + purchase options
User either purchases credits or cancels
```

---

## 6. Submission Package Specification

Every wire submission package contains the following, regardless of whether delivered via manual fulfillment or API:

```typescript
interface SubmissionPackage {
  // Release content
  headline: string;           // max 170 characters
  subheadline?: string;        // max 255 characters
  dateline: string;           // e.g., "AUSTIN, TX, February 26, 2026"
  body_html: string;          // full release HTML
  body_plain: string;         // plain text version

  // Contact block (required by wire services)
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone?: string;
  contact_company: string;
  contact_website: string;

  // Boilerplate
  about_company: string;       // "About [Company]" section

  // Distribution metadata
  wire_service: 'pr_newswire' | 'businesswire';
  industry_categories: string[];  // wire service taxonomy categories
  geography: 'national' | 'regional' | 'state';
  geography_detail?: string;      // e.g., "Texas" for state distribution

  // Pravado metadata
  org_id: string;
  release_id: string;
  confirmation_number: string;
  submitted_by_user_id: string;
}
```

---

## 7. Distribution Decision Matrix

| Content Type | Recommended Path(s) | Rationale |
|--------------|---------------------|-----------|
| General company news | AEO only | AI visibility priority; wire not justified for cost |
| Product launch | AEO + Wire (optional) | Broad reach for major launches; AEO always first |
| Funding announcement | AEO + Wire | Investor and press community expectation |
| SEC / regulatory filing | Wire only | Compliance requirement; AEO supplementary |
| Thought leadership | AEO only | Long-term authority; wire not designed for this |
| Crisis response | Wire + AEO | Immediate broad reach + permanent record |
| Partnership announcement | AEO + Wire (optional) | Depends on partner PR requirements |
| Award recognition | AEO only | Wire cost not justified; AEO sufficient |

---

## 8. Mode Constraints

Wire distribution mode constraints are **permanent and non-negotiable**:

| Mode | Wire Distribution Permitted |
|------|---------------------------|
| Autopilot | ❌ Never |
| Copilot | ❌ Never |
| Manual | ✅ Only mode permitted |

This ceiling applies to:
- All plan tiers including Enterprise
- All trust levels including Veteran
- All confidence scores including 1.0
- SAGE-generated proposals (SAGE may propose wire distribution, but cannot execute it)

Rationale: Wire distribution is an external, costly, irreversible action. Human judgment is required at every submission.

---

## 9. SLA & Operations

| Metric | Commitment |
|--------|-----------|
| Submission processing SLA | Within 4 business hours of package receipt |
| Business hours definition | Monday–Friday 8am–6pm US Central |
| Weekend/holiday submissions | Queued, processed next business day |
| Failure notification | Within 30 minutes of failure detection |
| Credit refund on failure | Automatic, within 1 hour |
| Tracking ID delivery | Within 30 minutes of wire service confirmation |

---

## 10. Compliance Checklist

- [ ] AEO distribution available on all plans, no credit required
- [ ] Wire distribution requires explicit cost display before confirmation
- [ ] Wire distribution mode ceiling is Manual — enforced in code
- [ ] Credit balance checked and displayed before submission
- [ ] Credit deducted only after user confirms
- [ ] Credit refunded automatically on distribution failure
- [ ] Submission package includes all required wire service fields
- [ ] wire_distribution_submissions table records all submissions with full audit trail
- [ ] Manual fulfillment email generates with correct format and confirmation number
- [ ] API stub adapter interface implemented (ManualFulfillmentAdapter)
- [ ] Status updates propagated back to user (pending → submitted → distributed / failed)
- [ ] CiteMind Engine 3 citation tracking activated on distribution

---

## 11. Governance

### 11.1 Canon Authority

This document is the authoritative specification for press release distribution. Any implementation that deviates is non-compliant.

### 11.2 Dependent Specifications

| Document | Relationship |
|----------|-------------|
| `PR_PILLAR_MODEL.md` | Parent — distribution model references this doc |
| `PR_WORK_SURFACE_CONTRACT.md` | Release Editor and distribution UI contract |

### 11.3 Change Control

Modifications require:
1. Product review sign-off
2. Finance review for any billing model changes
3. Legal review for compliance implications (SEC, regulatory)
4. Operations review for SLA and fulfillment workflow changes

---

## 12. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-02-26 | 1.0 | Initial specification — dual distribution model, manual fulfillment workflow, API stub architecture, credit billing model, submission package specification, mode constraints |
