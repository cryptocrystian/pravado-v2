/**
 * PR Pillar Schema Repair Script
 *
 * This script creates the minimal tables required for the PR pillar MVP.
 * Run this in the Supabase SQL Editor if tables are missing.
 *
 * Required tables:
 * - media_outlets
 * - journalist_profiles
 * - press_releases
 * - outreach_sequences / outreach_sequence_steps / outreach_runs
 * - media_monitoring_sources / media_monitoring_articles
 */

-- =============================================
-- 1. Media Outlets (from migration 08)
-- =============================================
CREATE TABLE IF NOT EXISTS media_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  outlet_type TEXT DEFAULT 'blog',
  tier TEXT DEFAULT 'tier3',
  reach_estimate INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT media_outlets_org_domain_unique UNIQUE (org_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_media_outlets_org_id ON media_outlets(org_id);
CREATE INDEX IF NOT EXISTS idx_media_outlets_domain ON media_outlets(domain);
CREATE INDEX IF NOT EXISTS idx_media_outlets_tier ON media_outlets(tier);

ALTER TABLE media_outlets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_outlets_org_isolation ON media_outlets;
CREATE POLICY media_outlets_org_isolation ON media_outlets
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =============================================
-- 2. Journalist Profiles (from migration 51)
-- =============================================
CREATE TABLE IF NOT EXISTS journalist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  secondary_emails TEXT[] DEFAULT '{}',
  primary_outlet TEXT,
  beat TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  last_activity_at TIMESTAMPTZ,
  engagement_score FLOAT DEFAULT 0.0,
  responsiveness_score FLOAT DEFAULT 0.0,
  relevance_score FLOAT DEFAULT 0.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT journalist_profiles_org_email_unique UNIQUE (org_id, primary_email)
);

CREATE INDEX IF NOT EXISTS idx_journalist_profiles_org_id ON journalist_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_journalist_profiles_primary_email ON journalist_profiles(primary_email);
CREATE INDEX IF NOT EXISTS idx_journalist_profiles_primary_outlet ON journalist_profiles(primary_outlet);
CREATE INDEX IF NOT EXISTS idx_journalist_profiles_beat ON journalist_profiles(beat);
CREATE INDEX IF NOT EXISTS idx_journalist_profiles_engagement_score ON journalist_profiles(engagement_score DESC);

ALTER TABLE journalist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journalist_profiles_org_isolation ON journalist_profiles;
CREATE POLICY journalist_profiles_org_isolation ON journalist_profiles
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =============================================
-- 3. Press Releases (from migration 37)
-- =============================================
CREATE TABLE IF NOT EXISTS press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  sub_headline TEXT,
  body TEXT NOT NULL,
  boilerplate TEXT,
  status TEXT DEFAULT 'draft',
  seo_score FLOAT,
  readability_score FLOAT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_releases_org_id ON press_releases(org_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);

ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS press_releases_org_isolation ON press_releases;
CREATE POLICY press_releases_org_isolation ON press_releases
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =============================================
-- 4. Outreach Sequences (from migration 49)
-- =============================================
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_runs_per_day INTEGER DEFAULT 50,
  stop_on_reply BOOLEAN DEFAULT true,
  pitch_id UUID,
  press_release_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_sequences_org_id ON outreach_sequences(org_id);

ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outreach_sequences_org_isolation ON outreach_sequences;
CREATE POLICY outreach_sequences_org_isolation ON outreach_sequences
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Outreach Sequence Steps
CREATE TABLE IF NOT EXISTS outreach_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES outreach_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  use_llm_generation BOOLEAN DEFAULT false,
  llm_prompt TEXT,
  llm_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outreach_steps_sequence_number_unique UNIQUE (sequence_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_outreach_steps_sequence_id ON outreach_sequence_steps(sequence_id);

ALTER TABLE outreach_sequence_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outreach_steps_via_sequence ON outreach_sequence_steps;
CREATE POLICY outreach_steps_via_sequence ON outreach_sequence_steps
  FOR ALL USING (sequence_id IN (
    SELECT id FROM outreach_sequences WHERE org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  ));

-- Outreach Runs
CREATE TABLE IF NOT EXISTS outreach_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES outreach_sequences(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outreach_runs_sequence_journalist_unique UNIQUE (sequence_id, journalist_id)
);

CREATE INDEX IF NOT EXISTS idx_outreach_runs_sequence_id ON outreach_runs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_outreach_runs_journalist_id ON outreach_runs(journalist_id);
CREATE INDEX IF NOT EXISTS idx_outreach_runs_status ON outreach_runs(status);

ALTER TABLE outreach_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outreach_runs_via_sequence ON outreach_runs;
CREATE POLICY outreach_runs_via_sequence ON outreach_runs
  FOR ALL USING (sequence_id IN (
    SELECT id FROM outreach_sequences WHERE org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  ));

-- =============================================
-- 5. Media Monitoring (from migration 45)
-- =============================================
CREATE TABLE IF NOT EXISTS media_monitoring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  source_type TEXT DEFAULT 'rss',
  crawl_frequency_hours INTEGER DEFAULT 24,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT media_sources_org_url_unique UNIQUE (org_id, url)
);

CREATE INDEX IF NOT EXISTS idx_media_sources_org_id ON media_monitoring_sources(org_id);

ALTER TABLE media_monitoring_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_sources_org_isolation ON media_monitoring_sources;
CREATE POLICY media_sources_org_isolation ON media_monitoring_sources
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Media Monitoring Articles
CREATE TABLE IF NOT EXISTS media_monitoring_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES media_monitoring_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  sentiment_score FLOAT,
  relevance_score FLOAT,
  outlet_name TEXT,
  journalist_id UUID REFERENCES journalist_profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT media_articles_org_url_unique UNIQUE (org_id, url)
);

CREATE INDEX IF NOT EXISTS idx_media_articles_org_id ON media_monitoring_articles(org_id);
CREATE INDEX IF NOT EXISTS idx_media_articles_source_id ON media_monitoring_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_media_articles_published_at ON media_monitoring_articles(published_at DESC);

ALTER TABLE media_monitoring_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_articles_org_isolation ON media_monitoring_articles;
CREATE POLICY media_articles_org_isolation ON media_monitoring_articles
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =============================================
-- 6. Seed Demo Data for user's organization
-- Get the first org with "Pravado Test" in the name
-- =============================================
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get user's org (the one named "Pravado Test 01" or first available)
  SELECT id INTO v_org_id
  FROM orgs
  WHERE name LIKE 'Pravado Test%'
  ORDER BY created_at
  LIMIT 1;

  IF v_org_id IS NULL THEN
    -- Fallback to any org
    SELECT id INTO v_org_id FROM orgs LIMIT 1;
  END IF;

  IF v_org_id IS NOT NULL THEN
    -- Insert sample media outlets
    INSERT INTO media_outlets (org_id, name, domain, outlet_type, tier, reach_estimate, metadata)
    VALUES
      (v_org_id, 'TechCrunch', 'techcrunch.com', 'blog', 'tier1', 18000000, '{"category": "technology"}'),
      (v_org_id, 'Forbes', 'forbes.com', 'magazine', 'tier1', 140000000, '{"category": "business"}'),
      (v_org_id, 'Wall Street Journal', 'wsj.com', 'newspaper', 'tier1', 45000000, '{"category": "finance"}'),
      (v_org_id, 'Bloomberg', 'bloomberg.com', 'newspaper', 'tier1', 96000000, '{"category": "finance"}'),
      (v_org_id, 'The Verge', 'theverge.com', 'blog', 'tier2', 10000000, '{"category": "technology"}'),
      (v_org_id, 'Wired', 'wired.com', 'magazine', 'tier2', 25000000, '{"category": "technology"}')
    ON CONFLICT (org_id, domain) DO NOTHING;

    -- Insert sample journalist profiles
    INSERT INTO journalist_profiles (org_id, full_name, primary_email, primary_outlet, beat, twitter_handle, engagement_score, responsiveness_score, relevance_score, last_activity_at, metadata)
    VALUES
      (v_org_id, 'Maria Rodriguez', 'maria.rodriguez@techcrunch.com', 'TechCrunch', 'Enterprise', '@mariarodriguez', 0.85, 0.72, 0.91, NOW() - INTERVAL '2 days', '{"topics": ["SaaS", "Cloud", "AI"], "articles_count": 342}'),
      (v_org_id, 'James Chen', 'james.chen@forbes.com', 'Forbes', 'Technology', '@jameschen_tech', 0.78, 0.65, 0.88, NOW() - INTERVAL '5 days', '{"topics": ["Startups", "VC", "IPOs"], "articles_count": 567}'),
      (v_org_id, 'Emily Watson', 'emily.watson@wsj.com', 'Wall Street Journal', 'Tech & Finance', '@emilywatson_wsj', 0.92, 0.58, 0.95, NOW() - INTERVAL '1 day', '{"topics": ["Tech Stocks", "M&A", "Earnings"], "articles_count": 891}'),
      (v_org_id, 'David Kim', 'david.kim@bloomberg.com', 'Bloomberg', 'AI & Machine Learning', '@davidkim_ai', 0.88, 0.81, 0.93, NOW() - INTERVAL '3 days', '{"topics": ["AI", "ML", "Automation"], "articles_count": 234}'),
      (v_org_id, 'Sarah Thompson', 'sarah.thompson@theverge.com', 'The Verge', 'Consumer Tech', '@sthompson_verge', 0.75, 0.70, 0.82, NOW() - INTERVAL '4 days', '{"topics": ["Gadgets", "Reviews", "Apple"], "articles_count": 678}'),
      (v_org_id, 'Alex Morgan', 'alex.morgan@wired.com', 'Wired', 'Cybersecurity', '@alexmorgan_wired', 0.82, 0.88, 0.79, NOW() - INTERVAL '1 day', '{"topics": ["Security", "Hacking", "Privacy"], "articles_count": 445}')
    ON CONFLICT (org_id, primary_email) DO NOTHING;

    RAISE NOTICE 'Seeded PR data for org_id: %', v_org_id;
  ELSE
    RAISE NOTICE 'No org found to seed';
  END IF;
END $$;

-- =============================================
-- Update timestamps trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['media_outlets', 'journalist_profiles', 'press_releases',
                               'outreach_sequences', 'outreach_sequence_steps', 'outreach_runs',
                               'media_monitoring_sources', 'media_monitoring_articles'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- =============================================
-- Verification
-- =============================================
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'media_outlets', 'journalist_profiles', 'press_releases',
  'outreach_sequences', 'outreach_sequence_steps', 'outreach_runs',
  'media_monitoring_sources', 'media_monitoring_articles'
);

SELECT 'Row counts:' as status;
SELECT 'journalist_profiles' as table_name, COUNT(*) as row_count FROM journalist_profiles
UNION ALL
SELECT 'media_outlets', COUNT(*) FROM media_outlets;
