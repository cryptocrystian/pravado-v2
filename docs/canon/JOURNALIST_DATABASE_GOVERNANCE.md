# JOURNALIST DATABASE GOVERNANCE

> **Status:** CANONICAL
> **Authority:** This document defines the architecture, governance, and operational rules for the Pravado Media Contact Database.
> **Classification:** Product Definition + Technical Architecture
> **Last Updated:** 2026-02-26

---

## 1. Mission & Positioning

### 1.1 Database Mission

The Pravado Media Contact Database is not a contact directory. It is a **living intelligence system** — the most modernized, signal-rich, and well-governed media database in the industry.

The strategic bet: legacy competitors (Cision, Muck Rack, Meltwater) are zeroed in on traditional media. Everything is trending toward new, digital-first formats. Pravado capitalizes on this by providing a well-balanced, diverse media mix spanning four contact types with proactive AI-driven matching as the primary user experience.

### 1.2 The Four Contact Types

| Type | Definition | Outreach Mechanic | Scope Boundary |
|------|------------|-------------------|----------------|
| **journalist** | Staff or freelance reporters at traditional or digital outlets | Email pitch | Full outreach workflow |
| **digital_creator** | Newsletter authors, Substack writers, independent digital publishers | Email pitch | Full outreach workflow |
| **kol** | Key Opinion Leaders — platform influencers with topic authority and engaged audiences | Contact reference only | Discovery and contact data only — no campaign facilitation, no rate cards, no payment mechanics |
| **podcaster** | Podcast hosts across any platform | Email pitch framed as appearance proposal | Full outreach workflow (pitch surface only — no booking integration) |

**KOL Hard Boundary:** Pravado provides KOL profile data, platform metrics, and contact method. Nothing more. Rate cards, campaign briefs, gifting coordination, and payment facilitation are explicitly out of scope and must never appear in the product. This boundary is permanent.

**Podcaster Scope:** Pravado supports pitching podcast hosts for guest appearances. The pitch composer adapts framing to appearance proposal format. No booking workflow, scheduling integration, or calendar coordination.

### 1.3 Quality Over Volume

The database prioritizes signal depth over contact count. A contact with rich article history, verified email, current topic signals, and AI-derived engagement data is worth more than 100 contacts with name and outlet only.

SAGE proactive recommendations are the **primary intended discovery path**. The reactive search surface supports it. Users should increasingly learn to rely on SAGE matching rather than manual searches.

---

## 2. Data Acquisition & Corpus Architecture

### 2.1 Seed Corpus (V1)

**Source:** ~150K raw contacts scraped via Apify scripts from two primary sources:
- Apollo (targeted search by geo and specific publications)
- X/Twitter (KOL lookalike audiences based on specific profile targets)

**Geographic scope at V1:** United States and Latin America (LATAM). APAC held for V2 pending enterprise customer demand confirmation.

**Legal posture:** The corpus is treated as a **validation-gated seed** — not a direct production import. The identity-layer data (name, outlet, handle, location, bio) is what gets imported. No emails from the raw scrape are ever stored in production. All emails are freshly verified at JIT unlock time via the enrichment waterfall.

Data provenance is documented as "scraped from public web sources via targeted search criteria." The chain of custody (scrape date, source type, geographic scope) is recorded in the `corpus_metadata` table.

**Processing pipeline before import:**

```
Raw Apify corpus (~150K)
    ↓ Deduplication + format normalization
    ↓ Quality filter (completeness score, remove obvious junk)
    → Estimated 80–120K survive
    ↓ Enter as contact_state = 'identity_only' (no email, not pitch-eligible)
    ↓ JIT enrichment triggers on user discovery/unlock
    → Validated records graduate to 'pitch_eligible'
```

### 2.2 Signal-First Ingestion (Ongoing)

After seed import, ongoing ingestion follows a three-tier signal hierarchy:

| Tier | Source | Cadence | Purpose |
|------|--------|---------|---------|
| **Tier 1 — News Signals** | RSS/NewsAPI for 5K+ domains | Daily | Detect new journalists, track topic shifts, update activity signals |
| **Tier 2 — Social Signals** | Podcast directories (ListenNotes), KOL platforms (HypeAuditor) | Weekly refresh of active contacts | Update platform metrics, detect new creators |
| **Tier 3 — Seed Data** | Legacy Apollo/list data | On-demand lookup only | Used as lookup key to find identity-layer data for fresh verification — never as authoritative email source |

### 2.3 Identity vs. Contact Firewall

This is the most important architectural decision in the database. It is non-negotiable.

| Layer | What It Contains | Storage Rule |
|-------|------------------|--------------|
| **Identity Layer (Permanent)** | Name, outlet affiliations, LinkedIn URL, social handles, bio, location, topic tags, vector embedding | Stored permanently — this is the searchable asset |
| **Contact Layer (Ephemeral)** | Professional email address | Never stored from scrapes. Always fetched fresh at unlock via enrichment waterfall. Cached with verified_at timestamp and staleness timer. Stale after 60 days for active journalists, 14 days for contacts with recent outlet changes. |

Rationale: Email addresses decay at 25–30% annually. Journalists change outlets constantly. Static email storage produces a rotting database with deliverability collapse. JIT enrichment always returns the freshest verifiable email.

---

## 3. Unified Contact Schema

### 3.1 media_contacts (Core Identity Table)

```sql
media_contacts (
  id                      UUID PRIMARY KEY,
  contact_type            TEXT NOT NULL CHECK (contact_type IN ('journalist','digital_creator','kol','podcaster')),
  name                    TEXT NOT NULL,
  bio                     TEXT,
  location_city           TEXT,
  location_country        TEXT,
  location_region         TEXT,          -- 'us', 'latam', 'apac' — for geographic scoping
  linkedin_url            TEXT,
  twitter_handle          TEXT,
  instagram_handle        TEXT,
  website_url             TEXT,
  platform_metrics        JSONB,         -- type-specific, see Section 3.2
  ai_derived_signals      JSONB,         -- computed by AI pipeline, see Section 3.3
  vector_embedding        vector(1536),  -- pgvector, Supabase extension
  contact_state           TEXT NOT NULL DEFAULT 'identity_only',
  pitch_eligibility_score FLOAT,         -- 0–100, computed
  corpus_source           TEXT,          -- 'apify_apollo', 'apify_twitter', 'rss_signal', 'manual', etc.
  corpus_ingested_at      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
)
```

### 3.2 platform_metrics JSONB — Type-Specific Fields

```typescript
// journalist / digital_creator
{
  byline_count_90d: number,
  primary_content_format: 'long_form' | 'news_breaking' | 'analysis' | 'reviews' | 'profiles' | 'data_journalism' | 'newsletter',
  outlet_tier_primary: 'T1' | 'T2' | 'T3' | 'T4',
  audience_type: ('b2b_enterprise' | 'b2b_smb' | 'b2c_consumer' | 'investor' | 'technical')[],
  subscriber_count?: number,          // for newsletter/digital creators
  newsletter_open_rate?: number,
}

// podcaster
{
  podcast_name: string,
  episode_count: number,
  est_weekly_listeners: number,
  avg_episode_length_minutes: number,
  booking_lead_days_typical: number,
  primary_platform: 'spotify' | 'apple' | 'youtube' | 'independent',
  interview_format: boolean,          // true = takes guests
}

// kol
{
  primary_platform: 'twitter' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube',
  follower_count: number,
  engagement_rate: number,            // percentage
  audience_demo_primary: string,      // e.g., 'B2B SaaS founders'
  content_cadence: 'daily' | 'weekly' | 'irregular',
}
```

### 3.3 ai_derived_signals JSONB — AI Pipeline Fields

These are computed by the ingestion pipeline from article analysis and vector embeddings. Read-only — users can see them but cannot modify them.

```typescript
{
  current_topic_focus: string[],          // topics actively covered in last 30d
  topic_velocity_signals: {               // topics trending up or down vs 90d ago
    topic: string,
    direction: 'increasing' | 'decreasing',
    delta_magnitude: number
  }[],
  writing_style: 'data_driven' | 'narrative' | 'opinion_heavy' | 'neutral' | 'technical',
  pitch_receptivity_signal: 'high' | 'medium' | 'low' | 'unknown',  // platform-wide aggregate
  ai_citation_authority_score: number,    // CiteMind Engine 3 score
  sentiment_toward_categories: {          // how they write about specific topics
    category: string,
    sentiment: 'positive' | 'critical' | 'neutral'
  }[],
  last_embedding_refreshed_at: string,    // ISO datetime
}
```

### 3.4 contact_emails (JIT Ephemeral Table)

```sql
contact_emails (
  id               UUID PRIMARY KEY,
  contact_id       UUID NOT NULL REFERENCES media_contacts(id),
  email            TEXT NOT NULL,
  email_source     TEXT,              -- 'hunter', 'findymail', 'manual', etc.
  email_verified   BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  is_stale         BOOLEAN DEFAULT false,
  stale_reason     TEXT,              -- 'age', 'outlet_change_detected', 'bounce'
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
)
```

### 3.5 outlet_affiliations (Many-to-Many Junction)

```sql
outlet_affiliations (
  id           UUID PRIMARY KEY,
  contact_id   UUID NOT NULL REFERENCES media_contacts(id),
  outlet_id    UUID NOT NULL REFERENCES media_outlets(id),
  role         TEXT CHECK (role IN ('staff','contributor','former','freelance','host')),
  is_primary   BOOLEAN DEFAULT false,
  beat_at_outlet TEXT[],             -- beat may differ by outlet
  start_date   DATE,
  end_date     DATE,                 -- NULL = current
  created_at   TIMESTAMPTZ DEFAULT now()
)
```

### 3.6 media_outlets

```sql
media_outlets (
  id              UUID PRIMARY KEY,
  name            TEXT NOT NULL,
  domain          TEXT NOT NULL UNIQUE,
  outlet_type     TEXT CHECK (outlet_type IN ('traditional','digital_first','podcast','newsletter','social','trade')),
  tier            TEXT CHECK (tier IN ('T1','T2','T3','T4')),
  domain_authority INTEGER,
  est_monthly_reach BIGINT,
  primary_audience TEXT,
  geographic_focus TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

**Tier definitions:**
- T1: DA 80+, 10M+ monthly reach
- T2: DA 50–79, 1M–10M monthly reach
- T3: DA 30–49, 100K–1M monthly reach
- T4: DA < 30, emerging or niche publications

---

## 4. Contact State Machine

### 4.1 State Definitions

| State | Description | Pitch Eligible |
|-------|-------------|----------------|
| `identity_only` | Imported identity data only — no email, not enriched | No |
| `enrichment_queued` | User triggered unlock, JIT enrichment in progress | No |
| `enriched` | Valid email returned by waterfall, quality gates pending | No |
| `pitch_eligible` | Meets all quality gates — full outreach access | **Yes** |
| `stale` | Cached email exceeds staleness threshold — re-verification required | No |
| `suppressed` | Contact opted out — permanent, global, irreversible | Never |
| `bounced` | Hard bounce received — auto-suppressed | Never |
| `do_not_contact` | Org-level flag — org-scoped, reversible by that org only | No (for that org) |

### 4.2 State Transition Rules

```
identity_only → enrichment_queued   User triggers "Create Pitch" or "Unlock Contact"
enrichment_queued → enriched         Enrichment waterfall returns valid, verified email
enrichment_queued → identity_only    Enrichment waterfall returns no result
enriched → pitch_eligible            Contact meets pitch eligibility quality gates
enriched → identity_only             Contact fails quality gates
pitch_eligible → stale               Staleness timer expires (60d active / 14d outlet-change)
stale → pitch_eligible               Re-verification succeeds
stale → bounced                      Re-verification fails (email invalid)
[any] → suppressed                   Opt-out received — irreversible, global
[any] → bounced                      Hard bounce event received
pitch_eligible → do_not_contact      Org-level flag applied (reversible)
do_not_contact → pitch_eligible      Org-level flag removed
```

### 4.3 State Audit Log

Every state transition is recorded in `contact_state_transitions`:

```sql
contact_state_transitions (
  id            UUID PRIMARY KEY,
  contact_id    UUID NOT NULL REFERENCES media_contacts(id),
  from_state    TEXT,
  to_state      TEXT NOT NULL,
  trigger       TEXT,      -- 'user_unlock', 'enrichment_success', 'opt_out', 'bounce', etc.
  actor_type    TEXT,      -- 'user', 'system', 'journalist'
  actor_id      UUID,
  occurred_at   TIMESTAMPTZ DEFAULT now()
)
```

This table is the GDPR compliance record. When a journalist asks "what data do you have and what have you done with it," this table provides the complete provenance trail.

---

## 5. JIT Enrichment Pipeline

### 5.1 Trigger Events

JIT enrichment fires on two user actions:
1. **"Create Pitch"** — Email verified in background while composer opens; ready before user finishes writing
2. **"Unlock Contact"** — Email verified immediately, contact added to org list

### 5.2 Enrichment Waterfall

```
Step 1: Hunter.io lookup (primary)
    ↓ If result returned → proceed to Step 3
    ↓ If no result →

Step 2: Findymail lookup (secondary)
    ↓ If result returned → proceed to Step 3
    ↓ If no result → mark contact email as not_found, remain in identity_only

Step 3: ZeroBounce real-time validation
    ↓ If VALID → cache email, set email_verified_at, transition to enriched
    ↓ If INVALID/CATCH-ALL → discard result, retry with next waterfall provider
    ↓ If all providers exhausted → contact remains identity_only

Step 4: Quality gate evaluation
    ↓ If pitch_eligibility_score ≥ 40 → transition to pitch_eligible
    ↓ If score < 40 → remain in enriched with improvement path shown
```

### 5.3 Staleness Rules

| Contact Activity Level | Email Cache Duration |
|------------------------|----------------------|
| Active (article in last 30d) | 60 days |
| Moderate (article in last 90d) | 60 days |
| Outlet change detected (RSS signal) | 14 days — immediate re-verification triggered |
| Inactive (no article in 90d+) | 90 days |

On staleness: contact transitions to `stale` state. Next pitch attempt triggers re-verification automatically. Stale contacts are visible in search results with a "Needs re-verification" indicator.

### 5.4 Enrichment Cost Model

At approximately $0.03–0.07 per email unlock (lookup + validation), enrichment costs are absorbed into the platform margin at lower tiers and factored into Enterprise pricing. The unlock cap limits enforce both abuse prevention and cost predictability.

---

## 6. Three-Layer Tagging Architecture

Deep, multi-dimensional classification is a core competitive differentiator. The system must support many ways to slice contacts — now and for any future need — without schema migrations.

### 6.1 Layer 1 — System Taxonomy (Platform-Wide, Curated)

Controlled vocabulary managed by Pravado. Consistent across all contacts, searchable globally, used by SAGE for semantic matching. Users cannot modify these tags.

```
beat_taxonomy (hierarchical)
├── Technology
│   ├── Artificial Intelligence
│   │   ├── Generative AI
│   │   ├── Machine Learning
│   │   ├── AI Infrastructure
│   │   └── AI Ethics & Policy
│   ├── Cybersecurity
│   ├── Enterprise Software
│   ├── Developer Tools
│   └── Consumer Technology
├── Business & Finance
│   ├── Startups & Venture Capital
│   ├── Enterprise & B2B
│   ├── Private Equity & M&A
│   ├── Public Markets & Equities
│   └── Small Business & SMB
├── Marketing & Media
│   ├── Digital Marketing
│   ├── PR & Communications
│   ├── Advertising & AdTech
│   └── Media Industry
├── [Additional top-level categories: Healthcare, Legal & Regulatory,
│   Real Estate, Retail & Commerce, Energy & Climate, Policy & Government]
│
content_format_tags (contact-level)
  long_form_investigative | news_breaking | analysis_opinion |
  product_reviews | profiles_interviews | data_journalism | newsletter

audience_type_tags (contact-level)
  b2b_enterprise | b2b_smb | b2c_consumer | investor_financial | technical_developer

outlet_tier (derived from domain_authority + reach — auto-assigned)
  T1 | T2 | T3 | T4

geographic_focus_tags (contact-level)
  national_us | regional_us_northeast | regional_us_southeast |
  regional_us_midwest | regional_us_west | latam | global
```

### 6.2 Layer 2 — AI-Derived Signals (System-Generated, Read-Only)

Computed by the ingestion pipeline from article and content analysis. More nuanced than Layer 1 — captures real-time topic focus, writing style, and engagement patterns. Stored in `ai_derived_signals` JSONB. See Section 3.3 for schema.

These signals are what enable the query: "journalists actively covering generative AI enterprise adoption who lean data-driven and write for T1/T2 outlets" — a query no competitor can execute with real-time signal data.

### 6.3 Layer 3 — Org-Scoped Custom Tags (User-Defined)

Free-form tags applied by an org for their own classification needs. Never visible to other orgs. Stored in `org_contact_tags`.

```sql
org_contact_tags (
  id           UUID PRIMARY KEY,
  org_id       UUID NOT NULL,
  contact_id   UUID NOT NULL REFERENCES media_contacts(id),
  custom_labels TEXT[],
  priority_tier TEXT CHECK (priority_tier IN ('A','B','C')),
  relationship_owner UUID,       -- user_id of team member who owns this relationship
  internal_notes TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
)
```

---

## 7. Search, Discovery & Result Diversity

### 7.1 Search Dimensions

Users can search and filter across any combination of:

- Keywords (matched against system taxonomy + AI-derived topic signals)
- Publication/outlet name
- Beat category (hierarchical drill-down)
- Contact type (journalist / podcaster / kol / digital_creator)
- Outlet tier (T1 / T2 / T3 / T4)
- Geographic focus
- Content format
- Audience type
- Activity recency (active in last 30/60/90 days)
- AI citation authority score range

### 7.2 Result Ranking Formula

Final rank score balances relevance with diversity and personal history:

```
Final Rank Score =
  (SAGE semantic match score × 0.65) +
  (Platform saturation inverse × 0.15) +   // less pitched = higher rank
  (Personal recency inverse × 0.10) +       // longer since user viewed = higher rank
  (Daily exploration bonus × 0.10)          // deterministic rotation, see below
```

### 7.3 Platform Saturation Scoring

Every contact carries a live `pitch_saturation_score` computed from the platform-wide pitch event log. It is not stored on the contact — it is computed at query time.

```
pitch_saturation_score =
  (unlocks in last 7 days × 0.4) +
  (pitches sent in last 7 days × 0.4) +
  (pitches sent in last 30 days × 0.2)
  → normalized to 0–100

Thresholds:
  0–30:   No indicator — freely surfaced
  31–60:  Moderate badge shown
  61–80:  High badge shown — deprioritized in ranking
  81–100: Very high — significant deprioritization + explicit warning shown before pitch
```

Contacts with saturation score > 80 can still be pitched, but the user must explicitly acknowledge the warning about journalist over-saturation. This protects journalist relationships platform-wide and is a published feature of Pravado's quality commitment.

### 7.4 Personal Interaction State Overlay

Every contact in a search result is re-ranked based on the user's org-level interaction history. This makes results a live status dashboard, not a static directory query.

| Interaction State | Rank Modifier | UI Display |
|-------------------|---------------|------------|
| Never seen | No modifier | Standard |
| Profile viewed | −5 | No badge (minor deprioritization) |
| Added to list | −10 | "In your list" badge |
| Unlocked | −15 | "Unlocked [date]" badge |
| Pitched | −25 | Pitch status shown inline |
| Pitched, no response | −25 | "No response [X days]" warning |
| Replied | +0 to +10 | "Replied" badge with positive indicator |
| Coverage obtained | +20 | "Coverage" badge — surface for re-engagement |
| Dismissed | Filter out from this query context | Hidden (unless name-searched directly) |
| Do not contact | Filter out entirely | Never shown |

### 7.5 Result Diversity Injection

Before results are returned, a diversity post-processor enforces minimum variety:

| Dimension | Rule |
|-----------|------|
| Outlet concentration | Max 2 contacts from the same outlet per page of 20 — exception: user is explicitly searching a specific outlet |
| Contact type diversity | At least 20% non-journalist types per page when not type-filtered |
| Outlet tier diversity | Results span at least 3 tiers — prevents T1-only result sets |
| Geographic diversity | No more than 60% from the same metro/region when not geo-filtered |

### 7.6 Daily Exploration Rotation

A deterministic daily rotation bonus prevents the same contacts from always topping results:

```
exploration_bonus = normalize(hash(contact_id + current_date))
```

This produces a score that is:
- **Consistent within a day**: Same user sees same order on repeated same-day searches
- **Different across days**: Rankings shift daily, ensuring different users searching on different days see meaningfully different result sets
- **Not random**: Deterministic — no unpredictable behavior, no ML required

Combined with saturation scoring and personal rank adjustment, the probability of all users converging on the same 20 journalists drops dramatically. This solves the Press Ranger "same 50 contacts" problem structurally.

### 7.7 Result Display — What Users See

**Ungated (no unlock required):**

```
┌──────────────────────────────────────────────────────────┐
│ [Avatar] Sarah Chen                    TechCrunch  T1    │
│          Senior Reporter                                  │
│          ████████████ email hidden                        │
│                                                           │
│  Beats: AI/ML · Enterprise Tech · Startups               │
│  Activity: HIGH  ●  AI Citation Authority: 94  ↑         │
│  Saturation: ●● (moderate)                               │
│  Relationship: None established              [+ Add]     │
│                                                           │
│  [View Profile]              [SAGE Score: 87% match]     │
└──────────────────────────────────────────────────────────┘
```

**Gated — full profile (consumes 1 daily view credit):**
Name, outlet, title, beat tags, recent articles (last 5), AI-derived topic signals, writing style signal, pitch receptivity, social handles, org interaction history, SAGE match explanation, Next Best Action. Email still hidden.

**Gated — email (consumes 1 daily unlock credit):**
Email revealed only via pitch composer intent ("Create Pitch") or explicit "Unlock Contact" action. JIT enrichment fires at this point.

---

## 8. SAGE Proactive Matching

SAGE proactive recommendations are the **primary intended path** for users to discover relevant contacts. The reactive search surface supports SAGE — it does not replace it.

### 8.1 Five Proactive Signal Types

**Signal 1 — Topic Surge Detection**
RSS monitoring detects a contact published 3+ pieces on a specific topic within 7 days. Their `current_topic_focus` vector shifts. If that topic overlaps with the user's configured topic clusters, SAGE surfaces them as a "Hot Contact" with specific context.

**Signal 2 — Relationship Decay Alert**
A contact in `warm` or `engaged` state hasn't been touched in 45 days (warm) or 30 days (engaged). SAGE surfaces a re-engagement suggestion with a specific hook pulled from their recent coverage.

**Signal 3 — Competitive Coverage Alert**
A contact covers a competitor. SAGE identifies the angle, checks if the user org has a differentiated counter-story, and surfaces a counter-pitch opportunity with a 72-hour window before the topic goes cold.

**Signal 4 — Press Release → Contact Match**
When a user publishes a press release in the Pravado Newsroom, SAGE automatically runs a semantic match against the contact database and surfaces the top 10–15 most relevant contacts ranked by: topic alignment + relationship score + outlet tier + response rate history.

**Signal 5 — Inbound Request Matching**
Pravado monitors journalist source request feeds (HARO, Qwoted, ProfNet). SAGE matches requests against the user's topic clusters and expertise profile, surfacing inbound opportunities where a journalist is actively seeking sources. This is the highest-quality PR activity — responding to active demand rather than cold pitching.

---

## 9. Org-Level Multi-Tenancy

### 9.1 Data Isolation Model

| Data Layer | Scope | Visibility |
|------------|-------|------------|
| `media_contacts` identity | Platform-wide | All orgs (read-only) |
| `contact_emails` | Platform-wide (ephemeral) | All orgs (on unlock) |
| `media_outlets` | Platform-wide | All orgs |
| Relationship ledger data | Org-scoped | Own org only |
| Pitch history | Org-scoped | Own org only |
| Relationship score | Org-scoped | Own org only (separate from platform saturation) |
| `org_contact_tags` | Org-scoped | Own org only |
| `do_not_contact` flag | Org-scoped | Own org only |

Row-level security (RLS) in Supabase enforces org isolation on all org-scoped tables. The shared identity layer is read-only for all orgs — no org can modify the platform contact record.

### 9.2 Agency Mode

Orgs with `org_type = 'agency'` can create child `brand_workspaces`. Each brand workspace gets its own fully isolated relationship layer. Agency admins can view across workspaces; workspace users cannot see other workspaces.

```sql
brand_workspaces (
  id           UUID PRIMARY KEY,
  org_id       UUID NOT NULL,     -- parent agency org
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
)
```

All org-scoped tables include `workspace_id` (nullable) for agency workspace scoping. Non-agency orgs leave workspace_id null.

---

## 10. Sending Infrastructure

### 10.1 Primary Model — Bring Your Own Email (BYOE)

BYOE is the primary sending model. Users connect their own Gmail or Outlook account via OAuth. Pravado composes in the browser and sends via the connected account's SMTP.

**Why BYOE is correct for Pravado's positioning:**
- Pitches from `christian@acmebrand.com` land differently than from shared sending infrastructure
- Aligns with quality-over-quantity philosophy — personal accounts enforce authenticity
- No shared domain reputation risk — one bad actor cannot impact other users
- Journalists receive correspondence from a real person's real email address

**OAuth providers supported:**
- Gmail (Google OAuth 2.0)
- Outlook / Microsoft 365 (Microsoft Graph API)

**Tracking:** Opens and clicks tracked via Pravado-hosted redirect domain and invisible pixel — Pravado's tracking infrastructure, not the user's mail provider.

### 10.2 Pravado-Managed Sending (Add-On)

Available as a paid add-on at Pro+ tiers for legitimate use cases:

| Legitimate Use Case | Explanation |
|--------------------|-------------|
| Corporate IT restrictions | Enterprise users whose IT policy blocks third-party OAuth integration |
| Non-Gmail/Outlook email | Users on Zoho, Fastmail, or custom SMTP setups |
| Agency multi-client management | Agencies managing multiple client brands cannot practically connect multiple client accounts |
| Automated follow-up sequences | BYOE OAuth token refresh failures can cause silent sequence failures |

Pricing: Flat monthly add-on fee with volume cap. Cost is structured to prevent spray-and-pray economics.

Managed sending uses dedicated sending subdomains (`brand.pitch.pravado.com`) with:
- Full DKIM/SPF/DMARC authentication
- Isolated IP pool per customer (no shared reputation)
- Domain warm-up protocol before first send
- Feedback loop registration with major ISPs

### 10.3 Sending Guardrails (Both Models)

Daily send limits enforced at the platform layer regardless of sending method:

| Tier | Daily Pitches | Daily Unlocks | Sequences Active | Contact Views/Hour |
|------|--------------|---------------|------------------|--------------------|
| Starter | 5 | 10 | 2 | 30 |
| Pro | 25 | 50 | 10 | 100 |
| Enterprise | 100 (custom) | 500 (custom) | Unlimited | 300 |

Additional guardrails:
- Bounce rate > 10%: Send limit halved automatically, alert generated
- Bounce rate > 25%: Account flagged for review, sending suspended
- Spam complaint received: Decrement User Health Score, immediate alert
- Sequential access pattern detected (IDs in linear sequence): Rate-limited, CAPTCHA required

---

## 11. User & Org Health Score

Every org has a dynamic `health_score` (0–100) that affects sending limits and platform access.

```
health_score modifiers:
  DECREMENT events:
    Hard bounce received            -5
    Spam complaint received         -15
    Personalization gate violated   -2 (attempted send below 40%)
    Excessive follow-up attempt     -3 (attempted to exceed 2 in 7 days)

  INCREMENT events:
    Pitch reply received            +3
    Coverage obtained               +10
    Journalist positive feedback    +5 (from journalist portal)

Enforcement thresholds:
  Score 80–100: Standard limits
  Score 60–79: Warning banner, 20% limit reduction
  Score 40–59: Formal warning, 40% limit reduction, require acknowledgment
  Score < 40:  Account review required, sending suspended
```

Health score is org-level, not user-level. A single team member's bad behavior affects the whole org — creating a self-policing incentive.

---

## 12. Journalist Transparency Portal

### 12.1 Purpose

The Journalist Transparency Portal (branded as **"Pravado for Journalists"** — not a compliance page) gives contacts agency over their data and preferences. This transforms a regulatory requirement into a competitive moat: journalists who participate make the platform better for everyone, including themselves.

### 12.2 Contact-Facing Features

| Feature | Description | Value to Journalist |
|---------|-------------|---------------------|
| **Visibility into research** (opt-in) | See how many brands in which categories have added them to media lists this month | Intelligence about which industries are targeting their coverage |
| **Topic preference signals** | Self-update current beat focus — "I'm covering enterprise AI, not consumer tech right now" | Immediately routes pitches more accurately; fewer irrelevant pitches |
| **Pitch preferences** | Set: Email only / No AI-generated pitches / Preferred days/times / Exclusive only | Pitches that reach them are more likely to be relevant |
| **One-click opt-out** | Global opt-out from all Pravado-facilitated outreach | Permanently suppressed — hashed to prevent re-ingestion |
| **Opt-out with reason** (optional) | Specify why: too many pitches / wrong topics / changing focus / on leave | System learns; future pitchers get better matching |
| **Pitch quality feedback** (opt-in) | Thumbs up/down on pitches received via Pravado | Positive increments sender health score; negative decrements it |

### 12.3 Opt-Out Protocol

1. Contact submits opt-out at `app.pravado.com/for-journalists`
2. System transitions contact to `suppressed` state within 60 seconds
3. Email address hashed and stored in `suppressed_email_hashes` table
4. Hash checked at every enrichment waterfall result — prevents re-ingestion
5. All org-level interaction data for that contact is frozen (not deleted — needed for audit trail)
6. State transition recorded in `contact_state_transitions` with actor_type = 'journalist'

---

## 13. Vector Embedding Refresh Cadence

Embeddings are generated from journalist bio + last 5 articles/pieces of content using `text-embedding-3-small` via Supabase pgvector.

| Activity Level | Definition | Refresh Cadence |
|----------------|------------|-----------------|
| Active | Article/post in last 30 days | Weekly |
| Moderate | Article/post in last 90 days | Monthly |
| Inactive | No content in 90+ days | Quarterly |
| Dead | No content in 12+ months | No refresh — flagged for review |

Refresh triggers:
- **Time-based**: Scheduled job per cadence above
- **Event-based**: RSS signal detects new article → immediate re-embed for that contact

Estimated monthly cost at full scale (~100K contacts, mixed activity distribution): $30–50. Do not optimize prematurely.

---

## 14. Competitive PR Intelligence

### 14.1 What SAGE Tracks Per Competitor

Competitors are configured by the user org. SAGE monitors:

- Share of voice by outlet (mentions per week at key publications)
- Journalist coverage patterns (which journalists are writing about them — warm counter-pitch targets)
- Coverage velocity (accelerating or decelerating)
- Topic clustering (what narratives they are owning)
- AI citation share (CiteMind Engine 3 — percentage of AI responses including them vs. client)

### 14.2 Counter-Pitch Signal

When competitor share of voice spikes on a topic:
1. SAGE identifies the journalists who covered the competitor
2. Checks if the user org has a differentiated counter-narrative
3. Surfaces a counter-pitch proposal with a specific angle and a time window
4. Ranks the journalists by contact accessibility (relationship score + saturation score + outlet tier)

### 14.3 Data Sources

Competitive intelligence is derived entirely from existing infrastructure:
- RSS/NewsAPI monitoring (Tier 1 ingestion — already running)
- CiteMind Engine 3 citation tracking
- No third-party competitive intelligence purchase required

---

## 15. Data Security

| Control | Specification |
|---------|---------------|
| PII encryption at rest | AES-256 for all email addresses and personal identifiers |
| In transit | TLS 1.3 |
| Bulk CSV export | Disabled at Starter and Pro. Enterprise only — watermarked exports with audit log |
| Velocity ceiling | > 20 profile views in 60 seconds → mandatory CAPTCHA |
| Sequential access detection | Linear ID pattern access → rate limit + flag for review |
| Opt-out hash check | Suppressed email hashes checked at every enrichment result before storage |
| Data minimization | No home addresses, personal phone numbers, or non-professional identifiers in database |

---

## 16. Compliance Summary

| Requirement | Approach |
|-------------|---------|
| GDPR (future EU expansion) | US-first architecture with GDPR-ready data residency flag (`data_region` on orgs table). No EU customers at V1 — flag flipped when compliance infrastructure is live |
| CCPA | California users covered by opt-out portal, data minimization, and no-sale policy |
| FTC (KOL) | Hard product boundary — no compensation facilitation; contacts-only for KOL type |
| CAN-SPAM | Unsubscribe/opt-out honored within 60 seconds globally |
| CASL (Canada) | LATAM scope — Canada excluded from V1 corpus (CASL requires opt-in, not opt-out) |

---

## 17. Compliance Checklist

- [ ] Four contact types implemented with unified schema and type-specific platform_metrics JSONB
- [ ] KOL contacts have no campaign, payment, or rate card fields
- [ ] Identity/Contact Firewall enforced — no emails stored from static scrape
- [ ] JIT enrichment waterfall operational (Hunter → Findymail → ZeroBounce)
- [ ] Contact state machine implemented with full transition rules
- [ ] State transition audit log recording all state changes
- [ ] pitch_eligibility_score computed and gating enforced
- [ ] pitch_saturation_score computed from platform_pitch_events at query time
- [ ] Three-layer tagging architecture implemented
- [ ] Daily exploration rotation active in search ranking
- [ ] Personal interaction state overlay active in search results
- [ ] Result diversity injection enforced (outlet cap, type diversity, tier spread)
- [ ] SAGE proactive signals operational (5 signal types)
- [ ] BYOE OAuth integration live (Gmail + Outlook)
- [ ] Journalist Transparency Portal live before public launch
- [ ] Opt-out hashing and suppression pipeline operational
- [ ] Org Health Score tracking and enforcement active
- [ ] Vector embeddings on pgvector with refresh cadence jobs
- [ ] Agency workspace isolation (brand_workspaces) in schema

---

## 18. Governance

### 18.1 Canon Authority

This document is the authoritative specification for the Pravado Media Contact Database architecture and governance. Any implementation that deviates is non-compliant.

### 18.2 Dependent Specifications

| Document | Relationship |
|----------|-------------|
| `PR_PILLAR_MODEL.md` | Parent — pillar-level model, references this doc |
| `PR_WORK_SURFACE_CONTRACT.md` | Data model entities defined here |
| `PR_CONTACT_LEDGER_CONTRACT.md` | Interaction events feed contact_state and org health score |

### 18.3 Change Control

Modifications require:
1. Product review sign-off
2. Legal review for any compliance implications
3. Update to dependent specifications
4. Migration plan if schema changes affect existing data

---

## 19. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-02-26 | 1.0 | Initial specification — four contact types, Identity/Contact Firewall, JIT enrichment, state machine, three-layer tagging, result diversity and saturation scoring, BYOE sending model, journalist transparency portal, SAGE proactive signals, org multi-tenancy, competitive intelligence |
