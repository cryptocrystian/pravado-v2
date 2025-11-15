-- Content Intelligence: Content Items
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'blog_post', 'social_post', 'long_form', 'video_script', 'newsletter'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  body TEXT, -- actual content
  url TEXT, -- if published
  published_at TIMESTAMPTZ,
  word_count INTEGER,
  reading_time_minutes INTEGER,
  performance_score DECIMAL(5,2), -- future: engagement/reach metrics
  metadata JSONB DEFAULT '{}', -- flexible field for platform-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content items in their org"
  ON public.content_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_items.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content items in their org"
  ON public.content_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_items.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content items in their org"
  ON public.content_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_items.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content items in their org"
  ON public.content_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_items.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_content_items_org_id ON public.content_items(org_id);
CREATE INDEX idx_content_items_type ON public.content_items(content_type);
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_items_published_at ON public.content_items(published_at);

-- Content Intelligence: Content Briefs
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_audience TEXT,
  target_keywords TEXT[], -- array of keywords to target
  outline TEXT, -- structured outline or bullet points
  tone TEXT, -- 'professional', 'casual', 'technical', 'friendly'
  min_word_count INTEGER,
  max_word_count INTEGER,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL, -- link to final content
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_content_briefs_updated_at
  BEFORE UPDATE ON public.content_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content briefs in their org"
  ON public.content_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_briefs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content briefs in their org"
  ON public.content_briefs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_briefs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content briefs in their org"
  ON public.content_briefs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_briefs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content briefs in their org"
  ON public.content_briefs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_briefs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_content_briefs_org_id ON public.content_briefs(org_id);
CREATE INDEX idx_content_briefs_status ON public.content_briefs(status);
CREATE INDEX idx_content_briefs_content_item_id ON public.content_briefs(content_item_id);

-- Content Intelligence: Content Topics (topic embeddings, stub)
CREATE TABLE IF NOT EXISTS public.content_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  embedding VECTOR(1536), -- for future OpenAI/semantic search
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_content_topics_updated_at
  BEFORE UPDATE ON public.content_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content topics in their org"
  ON public.content_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content topics in their org"
  ON public.content_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content topics in their org"
  ON public.content_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content topics in their org"
  ON public.content_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = content_topics.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE INDEX idx_content_topics_org_id ON public.content_topics(org_id);
CREATE INDEX idx_content_topics_content_item_id ON public.content_topics(content_item_id);
