-- Migration 90: Add extra beta request fields from the form
-- job_title, company_website, current_tools, feedback_call

ALTER TABLE beta_requests
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS company_website TEXT,
  ADD COLUMN IF NOT EXISTS current_tools TEXT[],
  ADD COLUMN IF NOT EXISTS feedback_call TEXT;
