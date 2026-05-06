/**
 * Shared types and helpers for the three-path audit funnel.
 *
 * Mirrors the API response shape from
 * apps/api/src/routes/siloTaxAudit/index.ts (D027 Phase 1A).
 * Used by AuditForm and EVIScorecardResults across the four entry
 * paths: /audit, /audit/pr, /audit/content, /audit/ai.
 */

import { Newspaper, FileText, Brain } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

// ── Canonical types ──────────────────────────────────────────
export type EVIBand = 'At Risk' | 'Emerging' | 'Competitive' | 'Dominant';
export type PillarKey = 'pr' | 'content' | 'ai';
export type EntryPath = 'pr' | 'content' | 'ai' | 'generic';
export type Severity = 'high' | 'medium' | 'low';

export interface PillarGap {
  title: string;
  description: string;
  severity: Severity;
  remediation: string;
}

export interface PillarScore {
  score: number;
  band: EVIBand;
  signals: Record<string, string>;
  gaps: PillarGap[];
}

export interface ScanResult {
  evi_score: number;
  evi_band: EVIBand;
  pillars: { pr: PillarScore; content: PillarScore; ai: PillarScore };
  variance: {
    spread: number;
    leading_pillar: PillarKey;
    lagging_pillar: PillarKey;
    orchestration_opportunity: string;
  };
  benchmark: {
    category_quartile: 1 | 2 | 3 | 4 | null;
    category_label: string | null;
  };
  scan_metadata: {
    brand_url: string;
    competitor_urls: string[];
    scanned_at: string;
    engines_consulted: string[];
  };
  magic_link_sent: boolean;
}

export interface ScanResponse extends ScanResult {
  audit_id: string | null;
  org_id: string;
  trial_expires_at: string;
  entry_path: EntryPath;
}

// ── EVI band logic — canonical 4-band per docs/canon/EARNED_VISIBILITY_INDEX.md
// Hex values are approved DS v3.1 tokens (semantic-danger / brand-amber /
// brand-cyan / semantic-success).
export function eviBand(score: number): { label: EVIBand; color: string; bgColor: string } {
  if (score <= 40) return { label: 'At Risk',     color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' };
  if (score <= 60) return { label: 'Emerging',    color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' };
  if (score <= 80) return { label: 'Competitive', color: '#00D9FF', bgColor: 'rgba(0,217,255,0.15)' };
  return                  { label: 'Dominant',    color: '#22C55E', bgColor: 'rgba(34,197,94,0.15)' };
}

export function sevColor(severity: Severity): string {
  switch (severity) {
    case 'high':   return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low':    return '#22C55E';
  }
}

export function sevLabel(severity: Severity): string {
  return severity.toUpperCase();
}

// Pillar-specific accent palette. Mapped from the marketing brand
// colors used elsewhere on pravado.io: PR pillar inherits the magenta
// CiteMind accent (PR's earned-media work feeds the citation graph),
// Content uses the iris SAGE accent (strategy/authority infrastructure),
// AI Citation uses the cyan CRAFT accent (the execution layer that
// drives AI engine surface presence).
export const PILLAR_CONFIG: Record<PillarKey, { label: string; accent: string; bgAccent: string; Icon: Icon }> = {
  pr:      { label: 'PR Authority',          accent: '#E879F9', bgAccent: 'rgba(232,121,249,0.10)', Icon: Newspaper },
  content: { label: 'Content Authority',     accent: '#A855F7', bgAccent: 'rgba(168,85,247,0.10)',  Icon: FileText  },
  ai:      { label: 'AI Citation Authority', accent: '#00D9FF', bgAccent: 'rgba(0,217,255,0.10)',   Icon: Brain     },
};

// Pillar order shown to the user is determined by entry_path so the
// buyer sees their entry-pillar first. Variance section renders after
// all three pillars regardless of order.
export function pillarOrder(entryPath: EntryPath): PillarKey[] {
  switch (entryPath) {
    case 'pr':      return ['pr', 'content', 'ai'];
    case 'content': return ['content', 'pr', 'ai'];
    case 'ai':      return ['ai', 'pr', 'content'];
    case 'generic':
    default:        return ['pr', 'content', 'ai'];
  }
}

// Mirror of the server-side regex in apps/api/src/routes/siloTaxAudit/index.ts.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
