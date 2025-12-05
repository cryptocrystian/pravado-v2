/**
 * Migration 34: LLM Usage Ledger (Sprint S27)
 *
 * Creates a ledger table for tracking all LLM API calls:
 * - Tokens usage per provider/model
 * - Latency and error tracking
 * - Association with playbook runs/steps for observability
 */

-- =====================================================
-- TABLE: llm_usage_ledger
-- =====================================================

CREATE TABLE IF NOT EXISTS public.llm_usage_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Organization context (nullable for system-wide events)
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,

  -- Playbook run context (when available)
  run_id UUID REFERENCES public.playbook_runs(id) ON DELETE SET NULL,
  step_run_id UUID REFERENCES public.playbook_step_runs(id) ON DELETE SET NULL,

  -- LLM provider details
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'stub')),
  model TEXT NOT NULL,

  -- Token usage
  tokens_prompt INTEGER NOT NULL,
  tokens_completion INTEGER NOT NULL,
  tokens_total INTEGER NOT NULL,

  -- Cost (nullable, computed later when pricing is added)
  cost_usd NUMERIC(12,6),

  -- Performance
  latency_ms INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_code TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Org-level queries (most common)
CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_org_created
  ON public.llm_usage_ledger(org_id, created_at DESC)
  WHERE org_id IS NOT NULL;

-- Provider analytics
CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_provider_created
  ON public.llm_usage_ledger(provider, created_at DESC);

-- Run association lookups
CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_run_id
  ON public.llm_usage_ledger(run_id)
  WHERE run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_step_run_id
  ON public.llm_usage_ledger(step_run_id)
  WHERE step_run_id IS NOT NULL;

-- Error tracking
CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_status_created
  ON public.llm_usage_ledger(status, created_at DESC)
  WHERE status = 'error';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.llm_usage_ledger ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view LLM usage for their org
-- Also allow viewing system-wide entries (org_id IS NULL) for internal ops
CREATE POLICY llm_usage_ledger_select_policy
  ON public.llm_usage_ledger
  FOR SELECT
  USING (
    org_id IS NULL OR
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create ledger entries for their org
-- System entries (org_id IS NULL) can be created by service role
CREATE POLICY llm_usage_ledger_insert_policy
  ON public.llm_usage_ledger
  FOR INSERT
  WITH CHECK (
    org_id IS NULL OR
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Not allowed (ledger is append-only)
-- No update policy needed

-- DELETE: Not allowed (ledger is append-only)
-- No delete policy needed

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.llm_usage_ledger IS
  'Append-only ledger tracking all LLM API calls for observability and cost analysis';

COMMENT ON COLUMN public.llm_usage_ledger.org_id IS
  'Organization that made the LLM call (NULL for system-wide calls)';

COMMENT ON COLUMN public.llm_usage_ledger.run_id IS
  'Associated playbook run (if applicable)';

COMMENT ON COLUMN public.llm_usage_ledger.step_run_id IS
  'Associated playbook step run (if applicable)';

COMMENT ON COLUMN public.llm_usage_ledger.provider IS
  'LLM provider: openai, anthropic, or stub';

COMMENT ON COLUMN public.llm_usage_ledger.model IS
  'Specific model used (e.g., gpt-4o-mini, claude-3-5-sonnet)';

COMMENT ON COLUMN public.llm_usage_ledger.cost_usd IS
  'Estimated cost in USD (computed when pricing is added in S28)';

COMMENT ON COLUMN public.llm_usage_ledger.latency_ms IS
  'End-to-end latency in milliseconds';

COMMENT ON COLUMN public.llm_usage_ledger.status IS
  'Call status: success or error';

COMMENT ON COLUMN public.llm_usage_ledger.error_code IS
  'Error code if status is error';
