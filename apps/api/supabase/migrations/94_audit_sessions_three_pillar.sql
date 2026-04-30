-- Three-pillar EVI scorecard schema for audit_sessions.
--
-- Per docs/canon/DECISIONS_LOG.md D027 (Audit Funnel Repositioning:
-- Silo Tax → Three-Path EVI Scorecard) and the work order at
-- docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md (Phase 1A).
--
-- The audit produces a top-line EVI plus three pillar sub-scores
-- (PR Authority, Content Authority, AI Citation Authority), variance
-- across pillars (the orchestration story), and an optional
-- category-relative benchmark.
--
-- All new columns are nullable. Pre-existing rows written under the
-- Silo Tax framing (silo_tax_monthly / monthly_cash_loss / etc.) are
-- left intact for one deprecation window; a subsequent janitorial
-- migration drops the legacy columns once D027 Phase 1 is fully shipped
-- and no consumer reads them.

-- ── Pillar sub-scores ────────────────────────────────────────────
ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS pr_score      integer,
  ADD COLUMN IF NOT EXISTS pr_band       text,
  ADD COLUMN IF NOT EXISTS pr_signals    jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pr_gaps       jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS content_score   integer,
  ADD COLUMN IF NOT EXISTS content_band    text,
  ADD COLUMN IF NOT EXISTS content_signals jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_gaps    jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS ai_score      integer,
  ADD COLUMN IF NOT EXISTS ai_band       text,
  ADD COLUMN IF NOT EXISTS ai_signals    jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_gaps       jsonb DEFAULT '[]'::jsonb;

-- ── Variance / orchestration narrative ───────────────────────────
ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS variance_spread          integer,
  ADD COLUMN IF NOT EXISTS leading_pillar           text,
  ADD COLUMN IF NOT EXISTS lagging_pillar           text,
  ADD COLUMN IF NOT EXISTS orchestration_opportunity text;

-- ── Category-relative benchmark (optional) ───────────────────────
ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS category_quartile integer,
  ADD COLUMN IF NOT EXISTS category_label    text;

-- ── Acquisition entry path ───────────────────────────────────────
-- Used to template the results page narrative ordering and to
-- segment funnel analytics. NULL on legacy rows; new rows always
-- pass one of the four enum values via ScanBody.entry_path
-- (default 'generic').
ALTER TABLE public.audit_sessions
  ADD COLUMN IF NOT EXISTS entry_path text;

-- Drop and recreate the CHECK constraint idempotently. Postgres
-- has no IF NOT EXISTS for CHECK constraints; the DROP IF EXISTS
-- pattern keeps the migration replayable.
ALTER TABLE public.audit_sessions
  DROP CONSTRAINT IF EXISTS audit_sessions_entry_path_check;
ALTER TABLE public.audit_sessions
  ADD CONSTRAINT audit_sessions_entry_path_check
  CHECK (entry_path IN ('pr', 'content', 'ai', 'generic') OR entry_path IS NULL);

-- Funnel analytics: queries like "conversions by entry_path".
CREATE INDEX IF NOT EXISTS idx_audit_sessions_entry_path
  ON public.audit_sessions(entry_path);
