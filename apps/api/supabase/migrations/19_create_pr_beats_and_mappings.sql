/**
 * Migration: PR Beats and Journalist Beats Mapping
 * Sprint: S6
 * Description: Create beats taxonomy and journalist-beat relationships
 */

-- ========================================
-- CREATE PR_BEATS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for pr_beats
CREATE INDEX idx_pr_beats_org_id ON public.pr_beats(org_id);
CREATE INDEX idx_pr_beats_org_name ON public.pr_beats(org_id, name);

-- Enable RLS on pr_beats
ALTER TABLE public.pr_beats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_beats
CREATE POLICY "Users can view beats in their org"
  ON public.pr_beats FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert beats in their org"
  ON public.pr_beats FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update beats in their org"
  ON public.pr_beats FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete beats in their org"
  ON public.pr_beats FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at on pr_beats
CREATE TRIGGER update_pr_beats_updated_at
  BEFORE UPDATE ON public.pr_beats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE JOURNALIST_BEATS MAPPING TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.journalist_beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalists(id) ON DELETE CASCADE,
  beat_id UUID NOT NULL REFERENCES public.pr_beats(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_journalist_beats_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.journalists WHERE id = journalist_id)
  ),
  CONSTRAINT fk_journalist_beats_beat_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.pr_beats WHERE id = beat_id)
  ),

  -- Prevent duplicate journalist-beat pairs
  UNIQUE(journalist_id, beat_id)
);

-- Indexes for journalist_beats
CREATE INDEX idx_journalist_beats_org_id ON public.journalist_beats(org_id);
CREATE INDEX idx_journalist_beats_journalist_id ON public.journalist_beats(journalist_id);
CREATE INDEX idx_journalist_beats_beat_id ON public.journalist_beats(beat_id);
CREATE INDEX idx_journalist_beats_org_journalist ON public.journalist_beats(org_id, journalist_id);

-- Enable RLS on journalist_beats
ALTER TABLE public.journalist_beats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journalist_beats
CREATE POLICY "Users can view journalist beats in their org"
  ON public.journalist_beats FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert journalist beats in their org"
  ON public.journalist_beats FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update journalist beats in their org"
  ON public.journalist_beats FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete journalist beats in their org"
  ON public.journalist_beats FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at on journalist_beats
CREATE TRIGGER update_journalist_beats_updated_at
  BEFORE UPDATE ON public.journalist_beats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
