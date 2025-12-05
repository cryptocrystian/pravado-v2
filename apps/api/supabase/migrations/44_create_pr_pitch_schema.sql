-- Migration 44: PR Pitch & Outreach Sequence Schema (Sprint S39)
-- Creates tables for personalized PR pitches and outreach sequences

-- ========================================
-- ENUMS
-- ========================================

-- Sequence status enum
DO $$ BEGIN
  CREATE TYPE public.pr_pitch_sequence_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Contact status enum
DO $$ BEGIN
  CREATE TYPE public.pr_pitch_contact_status AS ENUM ('queued', 'sending', 'sent', 'opened', 'replied', 'bounced', 'opted_out', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step type enum
DO $$ BEGIN
  CREATE TYPE public.pr_pitch_step_type AS ENUM ('email', 'social_dm', 'phone', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Event type enum
DO $$ BEGIN
  CREATE TYPE public.pr_pitch_event_type AS ENUM ('queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- PR PITCH SEQUENCES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  press_release_id UUID REFERENCES public.pr_generated_releases(id) ON DELETE SET NULL,
  status public.pr_pitch_sequence_status NOT NULL DEFAULT 'draft',

  -- Default templates
  default_subject TEXT,
  default_preview_text TEXT,

  -- Sequence settings (send windows, follow-up delays, max attempts)
  settings JSONB NOT NULL DEFAULT '{
    "sendWindow": {"startHour": 9, "endHour": 17, "timezone": "America/New_York"},
    "followUpDelayDays": 3,
    "maxAttempts": 3,
    "excludeWeekends": true
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for pr_pitch_sequences
CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_org
  ON public.pr_pitch_sequences(org_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_org_status
  ON public.pr_pitch_sequences(org_id, status);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_user
  ON public.pr_pitch_sequences(user_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_press_release
  ON public.pr_pitch_sequences(press_release_id);

-- Enable RLS
ALTER TABLE public.pr_pitch_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_pitch_sequences
CREATE POLICY pr_pitch_sequences_select_policy
  ON public.pr_pitch_sequences
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_sequences_insert_policy
  ON public.pr_pitch_sequences
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_sequences_update_policy
  ON public.pr_pitch_sequences
  FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_sequences_delete_policy
  ON public.pr_pitch_sequences
  FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_pr_pitch_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_pr_pitch_sequences_updated_at ON public.pr_pitch_sequences;
CREATE TRIGGER tr_pr_pitch_sequences_updated_at
  BEFORE UPDATE ON public.pr_pitch_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pr_pitch_sequences_updated_at();

-- ========================================
-- PR PITCH STEPS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.pr_pitch_sequences(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 1, -- 1 = initial pitch, 2+ = follow-ups
  step_type public.pr_pitch_step_type NOT NULL DEFAULT 'email',

  -- Templates
  subject_template TEXT,
  body_template TEXT NOT NULL,

  -- Timing
  wait_days INT NOT NULL DEFAULT 3, -- days after previous step

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for pr_pitch_steps
CREATE INDEX IF NOT EXISTS idx_pr_pitch_steps_org
  ON public.pr_pitch_steps(org_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_steps_sequence
  ON public.pr_pitch_steps(sequence_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_steps_sequence_position
  ON public.pr_pitch_steps(sequence_id, position);

-- Enable RLS
ALTER TABLE public.pr_pitch_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_pitch_steps
CREATE POLICY pr_pitch_steps_select_policy
  ON public.pr_pitch_steps
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_steps_insert_policy
  ON public.pr_pitch_steps
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_steps_update_policy
  ON public.pr_pitch_steps
  FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_steps_delete_policy
  ON public.pr_pitch_steps
  FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_pr_pitch_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_pr_pitch_steps_updated_at ON public.pr_pitch_steps;
CREATE TRIGGER tr_pr_pitch_steps_updated_at
  BEFORE UPDATE ON public.pr_pitch_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pr_pitch_steps_updated_at();

-- ========================================
-- PR PITCH CONTACTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.pr_pitch_sequences(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalists(id) ON DELETE CASCADE,
  status public.pr_pitch_contact_status NOT NULL DEFAULT 'queued',

  -- Progress tracking
  current_step_position INT NOT NULL DEFAULT 1,
  last_event_at TIMESTAMPTZ,

  -- External IDs and metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one journalist per sequence
  UNIQUE(sequence_id, journalist_id)
);

-- Indexes for pr_pitch_contacts
CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_org
  ON public.pr_pitch_contacts(org_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_sequence
  ON public.pr_pitch_contacts(sequence_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_journalist
  ON public.pr_pitch_contacts(journalist_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_status
  ON public.pr_pitch_contacts(status);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_sequence_status
  ON public.pr_pitch_contacts(sequence_id, status);

-- Enable RLS
ALTER TABLE public.pr_pitch_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_pitch_contacts
CREATE POLICY pr_pitch_contacts_select_policy
  ON public.pr_pitch_contacts
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_contacts_insert_policy
  ON public.pr_pitch_contacts
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_contacts_update_policy
  ON public.pr_pitch_contacts
  FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_contacts_delete_policy
  ON public.pr_pitch_contacts
  FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_pr_pitch_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_pr_pitch_contacts_updated_at ON public.pr_pitch_contacts;
CREATE TRIGGER tr_pr_pitch_contacts_updated_at
  BEFORE UPDATE ON public.pr_pitch_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pr_pitch_contacts_updated_at();

-- ========================================
-- PR PITCH EVENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.pr_pitch_contacts(id) ON DELETE CASCADE,
  step_position INT NOT NULL,
  event_type public.pr_pitch_event_type NOT NULL,

  -- Event payload (provider response, error details, etc.)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for pr_pitch_events
CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_org
  ON public.pr_pitch_events(org_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_contact
  ON public.pr_pitch_events(contact_id);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_contact_step
  ON public.pr_pitch_events(contact_id, step_position);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_type
  ON public.pr_pitch_events(event_type);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_created
  ON public.pr_pitch_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.pr_pitch_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_pitch_events
CREATE POLICY pr_pitch_events_select_policy
  ON public.pr_pitch_events
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_pitch_events_insert_policy
  ON public.pr_pitch_events
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Get sequence contact statistics
CREATE OR REPLACE FUNCTION public.get_pr_pitch_sequence_stats(p_sequence_id UUID)
RETURNS TABLE (
  total_contacts BIGINT,
  queued_count BIGINT,
  sent_count BIGINT,
  opened_count BIGINT,
  replied_count BIGINT,
  bounced_count BIGINT,
  failed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_contacts,
    COUNT(*) FILTER (WHERE status = 'queued')::BIGINT AS queued_count,
    COUNT(*) FILTER (WHERE status = 'sent')::BIGINT AS sent_count,
    COUNT(*) FILTER (WHERE status = 'opened')::BIGINT AS opened_count,
    COUNT(*) FILTER (WHERE status = 'replied')::BIGINT AS replied_count,
    COUNT(*) FILTER (WHERE status = 'bounced')::BIGINT AS bounced_count,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS failed_count
  FROM public.pr_pitch_contacts
  WHERE sequence_id = p_sequence_id;
END;
$$;

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_pitch_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_pitch_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_pitch_contacts TO authenticated;
GRANT SELECT, INSERT ON public.pr_pitch_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pr_pitch_sequence_stats TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.pr_pitch_sequences IS 'PR outreach sequences with personalized pitches (Sprint S39)';
COMMENT ON TABLE public.pr_pitch_steps IS 'Individual steps within an outreach sequence (initial pitch + follow-ups)';
COMMENT ON TABLE public.pr_pitch_contacts IS 'Journalists attached to a sequence with their outreach status';
COMMENT ON TABLE public.pr_pitch_events IS 'Event log for tracking outreach activity per contact';
