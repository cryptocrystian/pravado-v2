-- PR Intelligence: Media Outlets
CREATE TABLE IF NOT EXISTS public.media_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  outlet_type TEXT, -- 'newspaper', 'magazine', 'blog', 'podcast', 'tv', 'radio'
  tier TEXT, -- 'tier1', 'tier2', 'tier3', 'niche'
  reach_estimate INTEGER, -- estimated monthly unique visitors/listeners
  metadata JSONB DEFAULT '{}', -- flexible field for additional data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_media_outlets_updated_at
  BEFORE UPDATE ON public.media_outlets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.media_outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media outlets in their org"
  ON public.media_outlets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_outlets.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert media outlets in their org"
  ON public.media_outlets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_outlets.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media outlets in their org"
  ON public.media_outlets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_outlets.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media outlets in their org"
  ON public.media_outlets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_outlets.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_media_outlets_org_id ON public.media_outlets(org_id);
CREATE INDEX idx_media_outlets_domain ON public.media_outlets(domain);

-- PR Intelligence: Journalists
CREATE TABLE IF NOT EXISTS public.journalists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  twitter_handle TEXT,
  media_outlet_id UUID REFERENCES public.media_outlets(id) ON DELETE SET NULL,
  beat TEXT, -- e.g., 'tech', 'finance', 'health'
  metadata JSONB DEFAULT '{}', -- stub for future ML/enrichment data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_journalists_updated_at
  BEFORE UPDATE ON public.journalists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.journalists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view journalists in their org"
  ON public.journalists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = journalists.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert journalists in their org"
  ON public.journalists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = journalists.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update journalists in their org"
  ON public.journalists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = journalists.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete journalists in their org"
  ON public.journalists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = journalists.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_journalists_org_id ON public.journalists(org_id);
CREATE INDEX idx_journalists_outlet_id ON public.journalists(media_outlet_id);
CREATE INDEX idx_journalists_email ON public.journalists(email);

-- PR Intelligence: PR Sources
CREATE TABLE IF NOT EXISTS public.pr_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'press_release', 'backlink', 'mention', 'earned_media'
  title TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  media_outlet_id UUID REFERENCES public.media_outlets(id) ON DELETE SET NULL,
  journalist_id UUID REFERENCES public.journalists(id) ON DELETE SET NULL,
  sentiment TEXT, -- 'positive', 'neutral', 'negative' (future ML scoring)
  evi_score DECIMAL(5,2), -- future: Earned Value Index score
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pr_sources_updated_at
  BEFORE UPDATE ON public.pr_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.pr_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pr sources in their org"
  ON public.pr_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pr sources in their org"
  ON public.pr_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pr sources in their org"
  ON public.pr_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pr sources in their org"
  ON public.pr_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_pr_sources_org_id ON public.pr_sources(org_id);
CREATE INDEX idx_pr_sources_type ON public.pr_sources(source_type);
CREATE INDEX idx_pr_sources_published_at ON public.pr_sources(published_at);
CREATE INDEX idx_pr_sources_media_outlet_id ON public.pr_sources(media_outlet_id);

-- PR Intelligence: PR Events (for future EVI scoring inputs)
CREATE TABLE IF NOT EXISTS public.pr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'campaign_launch', 'pr_outreach', 'media_alert', 'pitch_sent'
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  pr_source_id UUID REFERENCES public.pr_sources(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pr_events_updated_at
  BEFORE UPDATE ON public.pr_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.pr_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pr events in their org"
  ON public.pr_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_events.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pr events in their org"
  ON public.pr_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_events.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pr events in their org"
  ON public.pr_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_events.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pr events in their org"
  ON public.pr_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_events.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_pr_events_org_id ON public.pr_events(org_id);
CREATE INDEX idx_pr_events_event_date ON public.pr_events(event_date);
CREATE INDEX idx_pr_events_type ON public.pr_events(event_type);

-- PR Intelligence: PR Topics (topic embeddings, stub only)
CREATE TABLE IF NOT EXISTS public.pr_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  embedding VECTOR(1536), -- for future OpenAI/semantic search
  pr_source_id UUID REFERENCES public.pr_sources(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pr_topics_updated_at
  BEFORE UPDATE ON public.pr_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.pr_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pr topics in their org"
  ON public.pr_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pr topics in their org"
  ON public.pr_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pr topics in their org"
  ON public.pr_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pr topics in their org"
  ON public.pr_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = pr_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_pr_topics_org_id ON public.pr_topics(org_id);
CREATE INDEX idx_pr_topics_source_id ON public.pr_topics(pr_source_id);
