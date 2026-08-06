-- =====================================================================
-- Migration 102: Unified Media Contact Schema (Identity/Contact Firewall)
-- =====================================================================
-- Canon: JOURNALIST_DATABASE_GOVERNANCE.md §2.3 (Identity/Contact Firewall),
--        §3 (media_contacts, contact_emails, outlet_affiliations, media_outlets)
--
-- Lane B+C — Journalist Governance + CAN-SPAM/Send Chokepoint.
--
-- STATUS: T3 — founder-approved DESIGN. This file is a MIGRATION FILE ONLY.
--         It has NOT been applied to the production Supabase project
--         (kroexsdyyqmlxfpbwajv). Apply on a Supabase dev/staging branch
--         under founder approval only. Never auto-apply to prod.
--
-- ADDITIVE ONLY: creates new tables (media_contacts, contact_emails,
--   outlet_affiliations) and additively extends the pre-existing
--   `media_outlets` table (created in migration 08). It does NOT drop or
--   alter existing journalist_* tables/columns — dual-read is handled in
--   the API layer and inline-email column retirement is a later PR.
--
-- CANON DRIFT FLAGGED: canon §3.6 specifies a PLATFORM-WIDE `media_outlets`
--   with `domain TEXT NOT NULL UNIQUE`, `domain_authority`,
--   `est_monthly_reach`, `geographic_focus` and no `org_id`. A legacy
--   ORG-SCOPED `media_outlets` already exists (migration 08:
--   org_id NOT NULL, nullable non-unique domain, `reach_estimate`). We
--   extend it additively here (ADD COLUMN IF NOT EXISTS) to move it toward
--   the canon shape without a destructive reshape. The platform-wide
--   reshape (drop org_id NOT NULL, add UNIQUE(domain)) is DEFERRED to the
--   same later "column retirement / reshape" PR that retires inline emails.
-- =====================================================================

-- pgvector extension for vector_embedding (Supabase-managed)
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- 3.6 media_outlets — additive extension of the legacy table
-- ---------------------------------------------------------------------
-- The legacy table (migration 08) is org-scoped. We add the canon columns
-- additively. NOTE: we intentionally do NOT add UNIQUE(domain) or drop
-- org_id NOT NULL here — those are non-additive on existing data and are
-- deferred to the reshape PR. See CANON DRIFT note above.
ALTER TABLE public.media_outlets
  ADD COLUMN IF NOT EXISTS domain_authority   INTEGER,
  ADD COLUMN IF NOT EXISTS est_monthly_reach  BIGINT,
  ADD COLUMN IF NOT EXISTS primary_audience   TEXT,
  ADD COLUMN IF NOT EXISTS geographic_focus   TEXT[];

COMMENT ON COLUMN public.media_outlets.domain_authority IS
  'Canon §3.6 — DA used for tier derivation (T1 80+, T2 50-79, T3 30-49, T4 <30).';
COMMENT ON COLUMN public.media_outlets.est_monthly_reach IS
  'Canon §3.6 — estimated monthly reach. Supersedes legacy reach_estimate.';

-- ---------------------------------------------------------------------
-- 3.1 media_contacts — Core Identity Table (PLATFORM-WIDE, permanent)
-- ---------------------------------------------------------------------
-- Identity Layer per §2.3: name, outlet affiliations, socials, bio,
-- location, topic tags, vector embedding. NO EMAIL COLUMN HERE — emails
-- live ONLY in contact_emails (the firewall). This is non-negotiable.
CREATE TABLE IF NOT EXISTS public.media_contacts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type            TEXT NOT NULL DEFAULT 'journalist'
                            CHECK (contact_type IN ('journalist','digital_creator','kol','podcaster')),
  name                    TEXT NOT NULL,
  bio                     TEXT,
  location_city           TEXT,
  location_country        TEXT,
  location_region         TEXT,          -- 'us' | 'latam' | 'apac'
  linkedin_url            TEXT,
  twitter_handle          TEXT,
  instagram_handle        TEXT,
  website_url             TEXT,
  platform_metrics        JSONB DEFAULT '{}'::jsonb,   -- §3.2 type-specific
  ai_derived_signals      JSONB DEFAULT '{}'::jsonb,   -- §3.3 AI pipeline
  vector_embedding        vector(1536),                -- §3.1 pgvector
  -- contact_state is the state machine (§4). The 8-state CHECK constraint
  -- and the contact_state_transitions audit log are added in migration 103.
  contact_state           TEXT NOT NULL DEFAULT 'identity_only',
  pitch_eligibility_score FLOAT,                        -- 0-100, computed
  corpus_source           TEXT,          -- 'apify_apollo' | 'apify_twitter' | 'rss_signal' | 'manual' | ...
  corpus_ingested_at      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.media_contacts IS
  'Canon §3.1 — platform-wide media contact identity. Identity/Contact Firewall (§2.3): NO email stored here; emails live only in contact_emails.';
COMMENT ON COLUMN public.media_contacts.contact_state IS
  'Canon §4 state machine. Default identity_only. 8-state CHECK added in migration 103.';

CREATE INDEX IF NOT EXISTS idx_media_contacts_contact_type  ON public.media_contacts (contact_type);
CREATE INDEX IF NOT EXISTS idx_media_contacts_contact_state ON public.media_contacts (contact_state);
CREATE INDEX IF NOT EXISTS idx_media_contacts_location      ON public.media_contacts (location_country, location_region);
CREATE INDEX IF NOT EXISTS idx_media_contacts_twitter       ON public.media_contacts (twitter_handle);
-- IVFFlat vector index (cosine). Built lazily; safe pre-backfill.
CREATE INDEX IF NOT EXISTS idx_media_contacts_embedding
  ON public.media_contacts USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------
-- 3.4 contact_emails — JIT Ephemeral Email Store (THE FIREWALL)
-- ---------------------------------------------------------------------
-- Emails live ONLY here, never inline on identity (§2.3). Always fetched
-- fresh at unlock, cached with verified_at + staleness timer.
CREATE TABLE IF NOT EXISTS public.contact_emails (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id        UUID NOT NULL REFERENCES public.media_contacts(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  email_source      TEXT,               -- 'hunter' | 'findymail' | 'manual' | 'migration_backfill' | ...
  email_verified    BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  is_stale          BOOLEAN NOT NULL DEFAULT false,
  stale_reason      TEXT,               -- 'age' | 'outlet_change_detected' | 'bounce'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contact_emails IS
  'Canon §3.4 — JIT ephemeral email store. The Identity/Contact Firewall: emails are stored ONLY here, never inline on media_contacts.';

CREATE INDEX IF NOT EXISTS idx_contact_emails_contact_id ON public.contact_emails (contact_id);
-- lower(email) index supports the suppression/bounce lookups in the send chokepoint.
CREATE INDEX IF NOT EXISTS idx_contact_emails_email_lower ON public.contact_emails (lower(email));

-- ---------------------------------------------------------------------
-- 3.5 outlet_affiliations — Many-to-Many Junction
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outlet_affiliations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID NOT NULL REFERENCES public.media_contacts(id) ON DELETE CASCADE,
  outlet_id      UUID NOT NULL REFERENCES public.media_outlets(id) ON DELETE CASCADE,
  role           TEXT CHECK (role IN ('staff','contributor','former','freelance','host')),
  is_primary     BOOLEAN NOT NULL DEFAULT false,
  beat_at_outlet TEXT[],
  start_date     DATE,
  end_date       DATE,                   -- NULL = current
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.outlet_affiliations IS
  'Canon §3.5 — many-to-many junction between media_contacts and media_outlets.';

CREATE INDEX IF NOT EXISTS idx_outlet_affiliations_contact ON public.outlet_affiliations (contact_id);
CREATE INDEX IF NOT EXISTS idx_outlet_affiliations_outlet  ON public.outlet_affiliations (outlet_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_outlet_affiliations_contact_outlet_role
  ON public.outlet_affiliations (contact_id, outlet_id, COALESCE(role, ''));

-- =====================================================================
-- Row-Level Security (§9.1 Data Isolation Model)
-- =====================================================================
-- Identity layer (media_contacts), contact_emails, media_outlets and
-- outlet_affiliations are PLATFORM-WIDE READ for all authenticated users.
-- Writes are service-role only (service role bypasses RLS). No write
-- policies for `authenticated` are created, so no org can mutate the
-- shared identity layer directly.
ALTER TABLE public.media_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_emails      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_contacts_read_all ON public.media_contacts;
CREATE POLICY media_contacts_read_all
  ON public.media_contacts FOR SELECT
  TO authenticated
  USING (true);

-- contact_emails read platform-wide (revealed on unlock at the app layer;
-- §9.1 lists contact_emails visibility as "All orgs (on unlock)"). The
-- unlock gating is enforced in the application/service layer, not RLS.
DROP POLICY IF EXISTS contact_emails_read_all ON public.contact_emails;
CREATE POLICY contact_emails_read_all
  ON public.contact_emails FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS outlet_affiliations_read_all ON public.outlet_affiliations;
CREATE POLICY outlet_affiliations_read_all
  ON public.outlet_affiliations FOR SELECT
  TO authenticated
  USING (true);

-- media_outlets already exists; ensure RLS + platform-wide read policy.
ALTER TABLE public.media_outlets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_outlets_read_all ON public.media_outlets;
CREATE POLICY media_outlets_read_all
  ON public.media_outlets FOR SELECT
  TO authenticated
  USING (true);

-- updated_at maintenance triggers (reuse existing set_updated_at if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_media_contacts_updated_at ON public.media_contacts;
    CREATE TRIGGER trg_media_contacts_updated_at
      BEFORE UPDATE ON public.media_contacts
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS trg_contact_emails_updated_at ON public.contact_emails;
    CREATE TRIGGER trg_contact_emails_updated_at
      BEFORE UPDATE ON public.contact_emails
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
