-- SEO Intelligence: SEO Keywords
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER, -- monthly search volume
  difficulty_score DECIMAL(5,2), -- keyword difficulty 0-100
  current_position INTEGER, -- current SERP position
  target_position INTEGER, -- desired SERP position
  tracked_url TEXT, -- URL we're tracking for this keyword
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, keyword, tracked_url)
);

CREATE TRIGGER update_seo_keywords_updated_at
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo keywords in their org"
  ON public.seo_keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_keywords.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seo keywords in their org"
  ON public.seo_keywords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_keywords.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seo keywords in their org"
  ON public.seo_keywords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_keywords.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seo keywords in their org"
  ON public.seo_keywords FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_keywords.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seo_keywords_org_id ON public.seo_keywords(org_id);
CREATE INDEX idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX idx_seo_keywords_status ON public.seo_keywords(status);

-- SEO Intelligence: SEO Pages
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1_tag TEXT,
  word_count INTEGER,
  internal_links_count INTEGER,
  external_links_count INTEGER,
  page_speed_score DECIMAL(5,2), -- 0-100
  mobile_friendly BOOLEAN DEFAULT true,
  indexed BOOLEAN DEFAULT false, -- is it indexed by search engines?
  last_crawled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, url)
);

CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo pages in their org"
  ON public.seo_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_pages.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seo pages in their org"
  ON public.seo_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_pages.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seo pages in their org"
  ON public.seo_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_pages.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seo pages in their org"
  ON public.seo_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_pages.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seo_pages_org_id ON public.seo_pages(org_id);
CREATE INDEX idx_seo_pages_url ON public.seo_pages(url);
CREATE INDEX idx_seo_pages_indexed ON public.seo_pages(indexed);

-- SEO Intelligence: SEO Opportunities
CREATE TABLE IF NOT EXISTS public.seo_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL, -- 'keyword_gap', 'content_refresh', 'broken_link', 'missing_meta', 'low_content'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  estimated_impact TEXT, -- e.g., '+500 monthly traffic', '+10 ranking positions'
  seo_page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  seo_keyword_id UUID REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'dismissed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_seo_opportunities_updated_at
  BEFORE UPDATE ON public.seo_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.seo_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo opportunities in their org"
  ON public.seo_opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_opportunities.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seo opportunities in their org"
  ON public.seo_opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_opportunities.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seo opportunities in their org"
  ON public.seo_opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_opportunities.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seo opportunities in their org"
  ON public.seo_opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_opportunities.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seo_opportunities_org_id ON public.seo_opportunities(org_id);
CREATE INDEX idx_seo_opportunities_type ON public.seo_opportunities(opportunity_type);
CREATE INDEX idx_seo_opportunities_status ON public.seo_opportunities(status);
CREATE INDEX idx_seo_opportunities_priority ON public.seo_opportunities(priority);

-- SEO Intelligence: SEO Competitors
CREATE TABLE IF NOT EXISTS public.seo_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  domain_authority DECIMAL(5,2), -- 0-100
  organic_traffic_estimate INTEGER, -- estimated monthly organic traffic
  top_keywords_count INTEGER, -- number of keywords they rank for
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, domain)
);

CREATE TRIGGER update_seo_competitors_updated_at
  BEFORE UPDATE ON public.seo_competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.seo_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo competitors in their org"
  ON public.seo_competitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_competitors.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seo competitors in their org"
  ON public.seo_competitors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_competitors.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update seo competitors in their org"
  ON public.seo_competitors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_competitors.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seo competitors in their org"
  ON public.seo_competitors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_competitors.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seo_competitors_org_id ON public.seo_competitors(org_id);
CREATE INDEX idx_seo_competitors_domain ON public.seo_competitors(domain);

-- SEO Intelligence: SEO Snapshots (SERP captures)
CREATE TABLE IF NOT EXISTS public.seo_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  seo_keyword_id UUID NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position INTEGER, -- our position in SERP
  serp_data JSONB DEFAULT '{}', -- full SERP data (top 10 results, features, etc.)
  our_url TEXT, -- which of our URLs is ranking
  competitor_urls TEXT[], -- competing URLs in top 10
  features_present TEXT[], -- 'featured_snippet', 'people_also_ask', 'local_pack', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo snapshots in their org"
  ON public.seo_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_snapshots.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert seo snapshots in their org"
  ON public.seo_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_snapshots.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete seo snapshots in their org"
  ON public.seo_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = seo_snapshots.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seo_snapshots_org_id ON public.seo_snapshots(org_id);
CREATE INDEX idx_seo_snapshots_keyword_id ON public.seo_snapshots(seo_keyword_id);
CREATE INDEX idx_seo_snapshots_captured_at ON public.seo_snapshots(captured_at);
