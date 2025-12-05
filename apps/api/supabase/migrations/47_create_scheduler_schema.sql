-- Migration 47: Scheduler & Background Tasks (Sprint S42)
-- Scheduled job execution system for automated media crawling and cleanup

-- ========================================
-- ENUMS
-- ========================================

-- Task run status enum
DO $$ BEGIN
  CREATE TYPE public.scheduler_task_status AS ENUM ('success', 'failure');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- SCHEDULER TASKS TABLE
-- ========================================
-- System-wide scheduled tasks (cron-like)

CREATE TABLE IF NOT EXISTS public.scheduler_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  schedule TEXT NOT NULL, -- Cron expression (e.g., "0 * * * *")
  last_run_at TIMESTAMPTZ,
  last_run_status public.scheduler_task_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for scheduler_tasks
CREATE INDEX IF NOT EXISTS idx_scheduler_tasks_enabled
  ON public.scheduler_tasks(enabled);

CREATE INDEX IF NOT EXISTS idx_scheduler_tasks_last_run
  ON public.scheduler_tasks(last_run_at) WHERE enabled = true;

-- Enable RLS (admin-only access)
ALTER TABLE public.scheduler_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduler_tasks (admin-only)
CREATE POLICY "Admins can view all scheduler tasks"
  ON public.scheduler_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update scheduler tasks"
  ON public.scheduler_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- SCHEDULER TASK RUNS TABLE
-- ========================================
-- Audit log of task executions

CREATE TABLE IF NOT EXISTS public.scheduler_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.scheduler_tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status public.scheduler_task_status,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for scheduler_task_runs
CREATE INDEX IF NOT EXISTS idx_scheduler_task_runs_task
  ON public.scheduler_task_runs(task_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_task_runs_started
  ON public.scheduler_task_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduler_task_runs_status
  ON public.scheduler_task_runs(status);

-- Enable RLS (admin-only access)
ALTER TABLE public.scheduler_task_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduler_task_runs (admin-only)
CREATE POLICY "Admins can view all task runs"
  ON public.scheduler_task_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated_at trigger for scheduler_tasks
CREATE TRIGGER update_scheduler_tasks_updated_at
  BEFORE UPDATE ON public.scheduler_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SEED DATA
-- ========================================
-- Create default scheduled tasks for S42

INSERT INTO public.scheduler_tasks (name, description, schedule, enabled) VALUES
  ('crawl:hourly-fetch-rss', 'Fetch all active RSS feeds hourly and create crawl jobs', '0 * * * *', true),
  ('crawl:10min-queue-jobs', 'Enqueue pending crawl jobs every 10 minutes', '*/10 * * * *', true),
  ('crawl:nightly-cleanup', 'Clean up old crawl jobs and task runs daily at midnight', '0 0 * * *', true)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Get scheduler statistics
CREATE OR REPLACE FUNCTION public.get_scheduler_stats()
RETURNS TABLE (
  total_tasks INT,
  enabled_tasks INT,
  total_runs INT,
  successful_runs INT,
  failed_runs INT,
  last_24h_runs INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT st.id)::INT AS total_tasks,
    COUNT(DISTINCT st.id) FILTER (WHERE st.enabled = true)::INT AS enabled_tasks,
    COUNT(str.id)::INT AS total_runs,
    COUNT(str.id) FILTER (WHERE str.status = 'success')::INT AS successful_runs,
    COUNT(str.id) FILTER (WHERE str.status = 'failure')::INT AS failed_runs,
    COUNT(str.id) FILTER (WHERE str.started_at >= NOW() - INTERVAL '24 hours')::INT AS last_24h_runs
  FROM public.scheduler_tasks st
  LEFT JOIN public.scheduler_task_runs str ON str.task_id = st.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tasks that are due to run (based on cron schedule)
-- Note: This is a stub that returns all enabled tasks
-- Production would use pg_cron or similar for real cron expression parsing
CREATE OR REPLACE FUNCTION public.get_due_scheduler_tasks()
RETURNS TABLE (
  id UUID,
  name TEXT,
  schedule TEXT,
  last_run_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.name,
    st.schedule,
    st.last_run_at
  FROM public.scheduler_tasks st
  WHERE st.enabled = true
  ORDER BY st.last_run_at NULLS FIRST, st.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
