-- Migration 87: MFA + Session Hardening (Sprint S-INT-10)
-- Adds org-level MFA enforcement setting.

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS require_mfa boolean DEFAULT false;

COMMENT ON COLUMN orgs.require_mfa IS 'When true, all org members must enroll TOTP MFA to access the application';
