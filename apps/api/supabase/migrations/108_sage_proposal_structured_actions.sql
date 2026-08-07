-- Migration 108: SAGE structured actions (Wave-2 — SAGE proposals that ACT)
--
-- Before this migration a SAGE proposal carried only display text (`title` +
-- free-text recommendation folded into `rationale`). There was no
-- machine-executable action, so the CRAFT loop (migration 107) could only run a
-- governed no-op. This migration adds the STRUCTURED action contract that the
-- Content executor (and later PR/SEO executors) dispatch on:
--
--   1. sage_proposals.action_type   — the per-pillar action VOCABULARY. A closed
--                                      CHECK enum so an unknown/typo action can
--                                      never be persisted (fail closed).
--   2. sage_proposals.action_params — the JSON payload the executor consumes
--                                      (e.g. content.create_brief → {topic, keyword}).
--
-- VOCABULARY (initial, per pillar). Only Content `create_brief` is IMPLEMENTED in
-- this slice; the rest are DEFINED/reserved so the enum is stable and future
-- executors register against a fixed contract:
--   Content : content.create_brief (IMPLEMENTED), content.generate_draft, content.publish
--   PR      : pr.send_pitch, pr.add_to_list
--   SEO     : seo.generate_schema
--
-- `suggested_action` (display) stays free-text; `action_type`/`action_params` are
-- the machine-executable half — the two are intentionally NOT merged.
--
-- NULLABILITY: action_type is nullable so pre-existing rows remain valid, but a
-- non-null value is constrained to the vocabulary. The backfill below assigns a
-- safe per-pillar default to every existing active/pending proposal so the CRAFT
-- dispatcher always has a concrete action_type to route on; unmapped/legacy rows
-- that stay NULL degrade to the governed no-op (never a fabricated effect).

-- ============================================================================
-- 1. Structured action columns + closed vocabulary
-- ============================================================================

ALTER TABLE sage_proposals
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS action_params jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Closed per-pillar action vocabulary. NULL is allowed (legacy/unmapped rows →
-- governed no-op); any non-null value MUST be one of the enumerated actions.
ALTER TABLE sage_proposals
  ADD CONSTRAINT sage_proposals_action_type_check CHECK (
    action_type IS NULL OR action_type IN (
      -- Content
      'content.create_brief',
      'content.generate_draft',
      'content.publish',
      -- PR
      'pr.send_pitch',
      'pr.add_to_list',
      -- SEO
      'seo.generate_schema'
    )
  );

COMMENT ON COLUMN sage_proposals.action_type IS
  'Machine-executable action the CRAFT executor registry dispatches on (closed per-pillar vocabulary). NULL → governed no-op. SAGE_v2 proposal contract / CRAFT_v2 Executors.';
COMMENT ON COLUMN sage_proposals.action_params IS
  'JSON payload consumed by the action executor (e.g. content.create_brief → {topic, keyword}).';

CREATE INDEX IF NOT EXISTS idx_sage_proposals_action_type
  ON sage_proposals(org_id, action_type)
  WHERE action_type IS NOT NULL;

-- ============================================================================
-- 2. Backfill a safe per-pillar default for existing proposals with no action
--    (the generator sets this on new rows; this covers rows written before 108).
--    Defaults mirror sageActionMapper.defaultActionTypeForPillar in TS.
-- ============================================================================

UPDATE sage_proposals
SET action_type = CASE pillar
    WHEN 'Content' THEN 'content.create_brief'
    WHEN 'PR'      THEN 'pr.send_pitch'
    WHEN 'SEO'     THEN 'seo.generate_schema'
  END
WHERE action_type IS NULL
  AND pillar IN ('Content', 'PR', 'SEO');
