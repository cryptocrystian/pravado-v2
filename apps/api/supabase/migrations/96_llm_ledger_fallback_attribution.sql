-- Migration 96: LLM Usage Ledger — fallback attribution
--
-- Context: LlmRouter previously swallowed real provider failures (e.g. a 404
-- not_found_error for a retired model) and wrote a stub row as
-- status='success', error_code=null — indistinguishable from a healthy call.
-- This migration lets a stub-fallback row record WHY the stub fired.
--
-- Changes (all additive / safe):
--   1. Allow status = 'fallback' (was CHECK IN ('success','error'))
--   2. Add error_message, attempted_model, attempted_provider columns
--   3. Partial index for fast fallback alerting queries

-- =====================================================
-- 1. Widen status CHECK to include 'fallback'
-- =====================================================

ALTER TABLE public.llm_usage_ledger
  DROP CONSTRAINT IF EXISTS llm_usage_ledger_status_check;

ALTER TABLE public.llm_usage_ledger
  ADD CONSTRAINT llm_usage_ledger_status_check
  CHECK (status IN ('success', 'error', 'fallback'));

-- =====================================================
-- 2. Failure attribution columns (nullable, additive)
-- =====================================================

ALTER TABLE public.llm_usage_ledger
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS attempted_model TEXT,
  ADD COLUMN IF NOT EXISTS attempted_provider TEXT;

COMMENT ON COLUMN public.llm_usage_ledger.error_message IS
  'Truncated (<=500 chars), secret-stripped provider error message. Populated on fallback/error rows.';

COMMENT ON COLUMN public.llm_usage_ledger.attempted_model IS
  'Model requested when a fallback fired (the row''s own model stays stub-v1).';

COMMENT ON COLUMN public.llm_usage_ledger.attempted_provider IS
  'Provider attempted before falling back to the stub (e.g. anthropic).';

-- =====================================================
-- 3. Index for fallback alerting/analytics
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_llm_usage_ledger_fallback_created
  ON public.llm_usage_ledger(status, created_at DESC)
  WHERE status = 'fallback';
