-- Sprint S-INT-05: CiteMind Citation Monitor tables
-- Stores LLM polling results and aggregated citation summaries

-- Individual citation monitoring results
CREATE TABLE citation_monitor_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  engine text NOT NULL CHECK (engine IN ('chatgpt', 'perplexity', 'claude', 'gemini')),
  query_prompt text NOT NULL,
  query_topic text NOT NULL,
  response_excerpt text,
  brand_mentioned boolean NOT NULL DEFAULT false,
  mention_type text CHECK (mention_type IN ('direct', 'indirect', 'competitor')),
  content_item_id uuid REFERENCES content_items(id),
  citation_url text,
  monitored_at timestamptz NOT NULL DEFAULT now(),
  job_id text
);

ALTER TABLE citation_monitor_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read citations" ON citation_monitor_results
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "service can insert citations" ON citation_monitor_results
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_citations_org_engine ON citation_monitor_results(org_id, engine, monitored_at DESC);
CREATE INDEX idx_citations_org_date ON citation_monitor_results(org_id, monitored_at DESC);

-- Org-level citation summary (cached aggregation, updated by worker)
CREATE TABLE citation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  period_days integer NOT NULL DEFAULT 30,
  total_queries integer NOT NULL DEFAULT 0,
  total_mentions integer NOT NULL DEFAULT 0,
  mention_rate numeric(5,4),
  by_engine jsonb,
  top_cited_topics jsonb,
  competitor_mentions jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, period_days)
);

ALTER TABLE citation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read summaries" ON citation_summaries
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "service can upsert summaries" ON citation_summaries
  FOR INSERT WITH CHECK (true);
