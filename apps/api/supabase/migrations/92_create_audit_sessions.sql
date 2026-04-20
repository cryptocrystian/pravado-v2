CREATE TABLE IF NOT EXISTS public.audit_sessions (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id                   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  email                    text,
  brand_url                text NOT NULL,
  competitor_urls          text[] DEFAULT '{}',
  evi_score                integer,
  silo_tax_monthly         integer,
  monthly_cash_loss        integer,
  risk_premium             integer,
  authority_leakage        integer,
  ppc_replacement          integer,
  hallucination_overhead   integer,
  gaps                     jsonb DEFAULT '[]',
  top_competitor_advantage text,
  total_authority_void     boolean DEFAULT false,
  unlinked_mentions_estimate integer DEFAULT 0,
  citation_gap_queries     integer DEFAULT 0,
  entity_collision_risk_pct integer DEFAULT 0,
  stage                    text DEFAULT 'scanned'
                           CHECK (stage IN ('scanned','account_created','craft_used','converted')),
  trial_expires_at         timestamptz,
  created_at               timestamptz DEFAULT now()
);

-- Index for email lookup (drip campaigns)
CREATE INDEX IF NOT EXISTS idx_audit_sessions_email
  ON public.audit_sessions(email);

-- Index for org lookups
CREATE INDEX IF NOT EXISTS idx_audit_sessions_org
  ON public.audit_sessions(org_id);

-- Row level security
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API uses service role)
CREATE POLICY "Service role full access" ON public.audit_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
