/**
 * Migration 55: Smart Media Contact Enrichment Engine V1
 * Sprint: S50
 *
 * Creates tables and functions for journalist contact enrichment:
 * - journalist_enrichment_records: Stores enrichment data from multiple sources
 * - journalist_enrichment_jobs: Tracks async enrichment processing jobs
 * - journalist_enrichment_links: Links enrichments to journalist profiles
 *
 * Features:
 * - Multi-source enrichment (email verification, social scraping, outlet scoring)
 * - Contact confidence scoring (0-100)
 * - Deduplication merge suggestions
 * - Async job processing with retry logic
 * - Full RLS for org-level isolation
 */

-- =============================================
-- Table: journalist_enrichment_records
-- =============================================

CREATE TABLE journalist_enrichment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Source Information
  source_type TEXT NOT NULL CHECK (source_type IN (
    'email_verification',
    'social_scraping',
    'outlet_authority',
    'manual_entry',
    'api_integration',
    'web_scraping',
    'media_database',
    'contact_import'
  )),
  source_id TEXT, -- External reference (if applicable)
  source_url TEXT, -- URL of data source

  -- Enriched Contact Data
  email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_confidence FLOAT CHECK (email_confidence >= 0 AND email_confidence <= 1),
  email_verification_date TIMESTAMPTZ,
  email_verification_method TEXT,

  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_confidence FLOAT CHECK (phone_confidence >= 0 AND phone_confidence <= 1),

  -- Social Profiles
  social_profiles JSONB DEFAULT '{}', -- { twitter, linkedin, mastodon, bluesky, instagram, etc. }
  social_profiles_verified BOOLEAN DEFAULT FALSE,
  social_profiles_confidence FLOAT CHECK (social_profiles_confidence >= 0 AND social_profiles_confidence <= 1),

  -- Professional Information
  outlet TEXT,
  outlet_verified BOOLEAN DEFAULT FALSE,
  outlet_authority_score FLOAT CHECK (outlet_authority_score >= 0 AND outlet_authority_score <= 100),
  outlet_domain TEXT,
  outlet_metadata JSONB DEFAULT '{}', -- { alexa_rank, moz_da, monthly_visitors, etc. }

  job_title TEXT,
  beat TEXT[],
  beat_confidence FLOAT CHECK (beat_confidence >= 0 AND beat_confidence <= 1),

  location TEXT,
  location_verified BOOLEAN DEFAULT FALSE,
  timezone TEXT,

  bio TEXT,
  profile_image_url TEXT,

  -- Enrichment Quality Metrics
  overall_confidence_score FLOAT CHECK (overall_confidence_score >= 0 AND overall_confidence_score <= 100),
  data_freshness_score FLOAT CHECK (data_freshness_score >= 0 AND data_freshness_score <= 100),
  completeness_score FLOAT CHECK (completeness_score >= 0 AND completeness_score <= 100),

  -- Deduplication
  potential_duplicates UUID[], -- Array of journalist_profile IDs that might be duplicates
  merge_suggestions JSONB DEFAULT '[]', -- [{ target_id, confidence, reason, fields_to_merge }]

  -- Metadata
  enrichment_metadata JSONB DEFAULT '{}', -- Additional enrichment data
  quality_flags TEXT[], -- ['stale_data', 'low_confidence', 'missing_critical_fields', etc.]

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'merged',
    'archived'
  )),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enriched_at TIMESTAMPTZ, -- When enrichment was completed
  last_verified_at TIMESTAMPTZ -- When data was last verified
);

-- Indexes for journalist_enrichment_records
CREATE INDEX idx_enrichment_records_org ON journalist_enrichment_records(org_id);
CREATE INDEX idx_enrichment_records_source ON journalist_enrichment_records(source_type);
CREATE INDEX idx_enrichment_records_status ON journalist_enrichment_records(status);
CREATE INDEX idx_enrichment_records_email ON journalist_enrichment_records(email) WHERE email IS NOT NULL;
CREATE INDEX idx_enrichment_records_outlet ON journalist_enrichment_records(outlet) WHERE outlet IS NOT NULL;
CREATE INDEX idx_enrichment_records_confidence ON journalist_enrichment_records(overall_confidence_score DESC);
CREATE INDEX idx_enrichment_records_freshness ON journalist_enrichment_records(data_freshness_score DESC);
CREATE INDEX idx_enrichment_records_created ON journalist_enrichment_records(created_at DESC);
CREATE INDEX idx_enrichment_records_enriched ON journalist_enrichment_records(enriched_at DESC) WHERE enriched_at IS NOT NULL;
CREATE INDEX idx_enrichment_records_duplicates ON journalist_enrichment_records USING gin(potential_duplicates) WHERE potential_duplicates IS NOT NULL;

-- Full-text search on bio and job title
CREATE INDEX idx_enrichment_records_search ON journalist_enrichment_records
  USING gin(to_tsvector('english', COALESCE(bio, '') || ' ' || COALESCE(job_title, '') || ' ' || COALESCE(outlet, '')));

-- Deduplication index (email uniqueness per org)
CREATE UNIQUE INDEX idx_enrichment_records_email_dedup ON journalist_enrichment_records(org_id, email)
  WHERE email IS NOT NULL AND status NOT IN ('merged', 'archived');

-- =============================================
-- Table: journalist_enrichment_jobs
-- =============================================

CREATE TABLE journalist_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Job Configuration
  job_type TEXT NOT NULL CHECK (job_type IN (
    'single_enrichment',
    'batch_enrichment',
    'email_verification_batch',
    'social_scraping_batch',
    'outlet_scoring_batch',
    'deduplication_scan',
    'auto_merge'
  )),

  -- Input Data
  input_data JSONB NOT NULL, -- { journalist_ids, emails, source_urls, etc. }
  enrichment_sources TEXT[] DEFAULT ARRAY['email_verification', 'social_scraping', 'outlet_authority'],

  -- Processing Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  )),

  -- Progress Tracking
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  progress_percentage FLOAT GENERATED ALWAYS AS (
    CASE
      WHEN total_items > 0 THEN (processed_items::FLOAT / total_items::FLOAT * 100)
      ELSE 0
    END
  ) STORED,

  -- Results
  enrichment_record_ids UUID[], -- IDs of created enrichment records
  error_log JSONB DEFAULT '[]', -- [{ item, error, timestamp }]
  result_summary JSONB DEFAULT '{}', -- { total_enriched, avg_confidence, sources_used, etc. }

  -- Retry Logic
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Performance Metrics
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_seconds INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for journalist_enrichment_jobs
CREATE INDEX idx_enrichment_jobs_org ON journalist_enrichment_jobs(org_id);
CREATE INDEX idx_enrichment_jobs_type ON journalist_enrichment_jobs(job_type);
CREATE INDEX idx_enrichment_jobs_status ON journalist_enrichment_jobs(status);
CREATE INDEX idx_enrichment_jobs_created ON journalist_enrichment_jobs(created_at DESC);
CREATE INDEX idx_enrichment_jobs_retry ON journalist_enrichment_jobs(next_retry_at) WHERE status = 'retrying';
CREATE INDEX idx_enrichment_jobs_user ON journalist_enrichment_jobs(created_by) WHERE created_by IS NOT NULL;

-- =============================================
-- Table: journalist_enrichment_links
-- =============================================

CREATE TABLE journalist_enrichment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  enrichment_record_id UUID NOT NULL REFERENCES journalist_enrichment_records(id) ON DELETE CASCADE,

  -- Link Metadata
  link_type TEXT NOT NULL CHECK (link_type IN (
    'primary',       -- Main enrichment for this journalist
    'alternate',     -- Alternative/secondary enrichment
    'historical',    -- Old enrichment data
    'suggested',     -- System-suggested link
    'rejected'       -- User rejected this link
  )),

  link_confidence FLOAT CHECK (link_confidence >= 0 AND link_confidence <= 1),
  link_reason TEXT, -- Why this link was created

  -- Merge Status
  is_merged BOOLEAN DEFAULT FALSE,
  merged_at TIMESTAMPTZ,
  merged_fields TEXT[], -- Which fields were merged: ['email', 'social_profiles', 'outlet']
  merge_strategy TEXT, -- 'overwrite', 'append', 'keep_existing'

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for journalist_enrichment_links
CREATE INDEX idx_enrichment_links_org ON journalist_enrichment_links(org_id);
CREATE INDEX idx_enrichment_links_journalist ON journalist_enrichment_links(journalist_id);
CREATE INDEX idx_enrichment_links_enrichment ON journalist_enrichment_links(enrichment_record_id);
CREATE INDEX idx_enrichment_links_type ON journalist_enrichment_links(link_type);
CREATE INDEX idx_enrichment_links_merged ON journalist_enrichment_links(is_merged) WHERE is_merged = TRUE;

-- Unique constraint: One primary enrichment per journalist
CREATE UNIQUE INDEX idx_enrichment_links_primary ON journalist_enrichment_links(journalist_id)
  WHERE link_type = 'primary' AND is_merged = FALSE;

-- =============================================
-- Helper Functions
-- =============================================

/**
 * Calculate overall confidence score for enrichment record
 * Weighted average of individual confidence scores
 */
CREATE OR REPLACE FUNCTION calculate_enrichment_confidence_score(
  p_email_confidence FLOAT,
  p_phone_confidence FLOAT,
  p_social_confidence FLOAT,
  p_outlet_authority FLOAT,
  p_beat_confidence FLOAT
)
RETURNS FLOAT AS $$
DECLARE
  v_score FLOAT := 0;
  v_weight_count INTEGER := 0;
BEGIN
  -- Email confidence (weight: 30%)
  IF p_email_confidence IS NOT NULL THEN
    v_score := v_score + (p_email_confidence * 30);
    v_weight_count := v_weight_count + 30;
  END IF;

  -- Phone confidence (weight: 15%)
  IF p_phone_confidence IS NOT NULL THEN
    v_score := v_score + (p_phone_confidence * 15);
    v_weight_count := v_weight_count + 15;
  END IF;

  -- Social profiles confidence (weight: 20%)
  IF p_social_confidence IS NOT NULL THEN
    v_score := v_score + (p_social_confidence * 20);
    v_weight_count := v_weight_count + 20;
  END IF;

  -- Outlet authority (weight: 25%)
  IF p_outlet_authority IS NOT NULL THEN
    -- Normalize outlet authority to 0-1 range
    v_score := v_score + ((p_outlet_authority / 100.0) * 25);
    v_weight_count := v_weight_count + 25;
  END IF;

  -- Beat confidence (weight: 10%)
  IF p_beat_confidence IS NOT NULL THEN
    v_score := v_score + (p_beat_confidence * 10);
    v_weight_count := v_weight_count + 10;
  END IF;

  -- Calculate weighted average
  IF v_weight_count > 0 THEN
    RETURN (v_score / v_weight_count) * 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Calculate data completeness score for enrichment record
 * Percentage of filled fields
 */
CREATE OR REPLACE FUNCTION calculate_enrichment_completeness_score(
  p_email TEXT,
  p_phone TEXT,
  p_social_profiles JSONB,
  p_outlet TEXT,
  p_job_title TEXT,
  p_beat TEXT[],
  p_location TEXT,
  p_bio TEXT
)
RETURNS FLOAT AS $$
DECLARE
  v_total_fields INTEGER := 8;
  v_filled_fields INTEGER := 0;
  v_social_count INTEGER;
BEGIN
  IF p_email IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;
  IF p_phone IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;

  -- Check if social profiles has any data
  SELECT COUNT(*) INTO v_social_count
  FROM jsonb_object_keys(p_social_profiles);
  IF v_social_count > 0 THEN v_filled_fields := v_filled_fields + 1; END IF;

  IF p_outlet IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;
  IF p_job_title IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;
  IF p_beat IS NOT NULL AND array_length(p_beat, 1) > 0 THEN v_filled_fields := v_filled_fields + 1; END IF;
  IF p_location IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;
  IF p_bio IS NOT NULL THEN v_filled_fields := v_filled_fields + 1; END IF;

  RETURN (v_filled_fields::FLOAT / v_total_fields::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Calculate data freshness score for enrichment record
 * Based on how recent the enrichment and verification dates are
 */
CREATE OR REPLACE FUNCTION calculate_enrichment_freshness_score(
  p_enriched_at TIMESTAMPTZ,
  p_last_verified_at TIMESTAMPTZ
)
RETURNS FLOAT AS $$
DECLARE
  v_days_since_enrichment INTEGER;
  v_days_since_verification INTEGER;
  v_enrichment_score FLOAT;
  v_verification_score FLOAT;
BEGIN
  -- If never enriched, return 0
  IF p_enriched_at IS NULL THEN
    RETURN 0;
  END IF;

  v_days_since_enrichment := EXTRACT(DAY FROM (NOW() - p_enriched_at))::INTEGER;

  -- Enrichment freshness scoring (70% weight)
  IF v_days_since_enrichment <= 7 THEN
    v_enrichment_score := 100;
  ELSIF v_days_since_enrichment <= 30 THEN
    v_enrichment_score := 80;
  ELSIF v_days_since_enrichment <= 90 THEN
    v_enrichment_score := 60;
  ELSIF v_days_since_enrichment <= 180 THEN
    v_enrichment_score := 40;
  ELSIF v_days_since_enrichment <= 365 THEN
    v_enrichment_score := 20;
  ELSE
    v_enrichment_score := 10;
  END IF;

  -- Verification freshness scoring (30% weight)
  IF p_last_verified_at IS NOT NULL THEN
    v_days_since_verification := EXTRACT(DAY FROM (NOW() - p_last_verified_at))::INTEGER;

    IF v_days_since_verification <= 30 THEN
      v_verification_score := 100;
    ELSIF v_days_since_verification <= 90 THEN
      v_verification_score := 70;
    ELSIF v_days_since_verification <= 180 THEN
      v_verification_score := 40;
    ELSE
      v_verification_score := 20;
    END IF;
  ELSE
    v_verification_score := 0;
  END IF;

  RETURN (v_enrichment_score * 0.7) + (v_verification_score * 0.3);
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Find potential duplicate enrichment records
 * Based on email, phone, social profiles
 */
CREATE OR REPLACE FUNCTION find_duplicate_enrichments(
  p_org_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_social_profiles JSONB,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  enrichment_id UUID,
  match_score FLOAT,
  match_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS enrichment_id,
    (
      CASE WHEN r.email = p_email AND p_email IS NOT NULL THEN 0.5 ELSE 0 END +
      CASE WHEN r.phone = p_phone AND p_phone IS NOT NULL THEN 0.3 ELSE 0 END +
      CASE WHEN r.social_profiles ?| ARRAY(SELECT jsonb_object_keys(p_social_profiles)) THEN 0.2 ELSE 0 END
    ) AS match_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN r.email = p_email AND p_email IS NOT NULL THEN 'email' END,
      CASE WHEN r.phone = p_phone AND p_phone IS NOT NULL THEN 'phone' END,
      CASE WHEN r.social_profiles ?| ARRAY(SELECT jsonb_object_keys(p_social_profiles)) THEN 'social' END
    ], NULL) AS match_fields
  FROM journalist_enrichment_records r
  WHERE r.org_id = p_org_id
    AND r.status NOT IN ('merged', 'archived')
    AND (p_exclude_id IS NULL OR r.id != p_exclude_id)
    AND (
      (r.email = p_email AND p_email IS NOT NULL) OR
      (r.phone = p_phone AND p_phone IS NOT NULL) OR
      (r.social_profiles ?| ARRAY(SELECT jsonb_object_keys(p_social_profiles)) AND p_social_profiles::text != '{}'::text)
    )
  ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Update enrichment record with calculated scores
 * Trigger function to auto-update confidence, completeness, and freshness scores
 */
CREATE OR REPLACE FUNCTION update_enrichment_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate overall confidence score
  NEW.overall_confidence_score := calculate_enrichment_confidence_score(
    NEW.email_confidence,
    NEW.phone_confidence,
    NEW.social_profiles_confidence,
    NEW.outlet_authority_score,
    NEW.beat_confidence
  );

  -- Calculate completeness score
  NEW.completeness_score := calculate_enrichment_completeness_score(
    NEW.email,
    NEW.phone,
    NEW.social_profiles,
    NEW.outlet,
    NEW.job_title,
    NEW.beat,
    NEW.location,
    NEW.bio
  );

  -- Calculate freshness score
  NEW.data_freshness_score := calculate_enrichment_freshness_score(
    NEW.enriched_at,
    NEW.last_verified_at
  );

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating scores
CREATE TRIGGER trg_update_enrichment_scores
  BEFORE INSERT OR UPDATE ON journalist_enrichment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_scores();

/**
 * Update job progress
 * Trigger function to auto-update job status based on progress
 */
CREATE OR REPLACE FUNCTION update_enrichment_job_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-complete job if all items processed
  IF NEW.processed_items >= NEW.total_items AND NEW.total_items > 0 THEN
    IF NEW.status = 'processing' THEN
      NEW.status := 'completed';
      NEW.completed_at := NOW();
    END IF;
  END IF;

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating job status
CREATE TRIGGER trg_update_enrichment_job_status
  BEFORE UPDATE ON journalist_enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_job_status();

-- =============================================
-- Row-Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE journalist_enrichment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_enrichment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journalist_enrichment_records
CREATE POLICY enrichment_records_org_isolation ON journalist_enrichment_records
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- RLS Policies for journalist_enrichment_jobs
CREATE POLICY enrichment_jobs_org_isolation ON journalist_enrichment_jobs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- RLS Policies for journalist_enrichment_links
CREATE POLICY enrichment_links_org_isolation ON journalist_enrichment_links
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE journalist_enrichment_records IS 'Stores enriched contact data from multiple sources with confidence scoring';
COMMENT ON TABLE journalist_enrichment_jobs IS 'Tracks async enrichment processing jobs with retry logic';
COMMENT ON TABLE journalist_enrichment_links IS 'Links enrichment records to journalist profiles';

COMMENT ON FUNCTION calculate_enrichment_confidence_score IS 'Calculates weighted confidence score (0-100) from individual field confidences';
COMMENT ON FUNCTION calculate_enrichment_completeness_score IS 'Calculates data completeness score (0-100) based on filled fields';
COMMENT ON FUNCTION calculate_enrichment_freshness_score IS 'Calculates data freshness score (0-100) based on recency';
COMMENT ON FUNCTION find_duplicate_enrichments IS 'Finds potential duplicate enrichment records based on email, phone, social profiles';
