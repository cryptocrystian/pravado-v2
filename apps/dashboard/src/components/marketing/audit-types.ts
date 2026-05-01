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

// Network / 5xx fallback — three-pillar demo so the marketing page
// still works when the API is degraded. Never used for 4xx.
export function buildFallbackResult(entryPath: EntryPath): ScanResponse {
  return {
    evi_score: 52,
    evi_band: 'Emerging',
    pillars: {
      pr: {
        score: 50,
        band: 'Emerging',
        signals: { earned_media_frequency: 'Limited surfaced press archive on homepage; few named-spokesperson quotes detected.' },
        gaps: [
          { title: 'No named-spokesperson coverage detected', description: 'Brand mentions are organization-level, not person-attributed. Citation graphs weight named-quote coverage more heavily.', severity: 'medium', remediation: 'CRAFT operationalizes named-spokesperson positioning across the pitch pipeline with weekly journalist briefs.' },
          { title: 'Press archive not surfaced', description: 'No /press or /news section detected. Without surfaced earned coverage, AI engines cannot infer authority transfer.', severity: 'medium', remediation: 'CRAFT routes a structured press archive build with schema-marked authority signals.' },
        ],
      },
      content: {
        score: 55,
        band: 'Emerging',
        signals: { topical_coverage: 'Surface content covers product features, not category authority hubs.' },
        gaps: [
          { title: 'Topic-cluster gaps in primary category', description: 'No deep-coverage hubs detected for strategic topics. Authority infrastructure requires hub-and-spoke topic ownership.', severity: 'high', remediation: 'CRAFT generates topic-pillar content with structured FAQ and HowTo schema, governed by CiteMind for AEO citation worthiness.' },
        ],
      },
      ai: {
        score: 48,
        band: 'Emerging',
        signals: { citation_rate_estimate: 'Buyer-intent queries surface category leaders, not this brand.' },
        gaps: [
          { title: 'Buyer-intent queries surface competitors', description: 'Representative buyer questions in category cite competitors, not this brand. Engines learn category leadership from training data and crawl signals.', severity: 'high', remediation: 'CRAFT runs CiteMind\'s share-of-model program: weekly query monitoring, entity disambiguation, orchestrated content + PR pushes.' },
        ],
      },
    },
    variance: {
      spread: 7,
      leading_pillar: 'content',
      lagging_pillar: 'ai',
      orchestration_opportunity: 'Pillar scores are close enough that no single discipline is the obvious culprit. The compounding loop is broken: PR mentions are not echoing into AI answers, and content pieces are not being cited as supporting evidence.',
    },
    benchmark: { category_quartile: null, category_label: null },
    scan_metadata: {
      brand_url: '',
      competitor_urls: [],
      scanned_at: new Date().toISOString(),
      engines_consulted: ['ChatGPT', 'Perplexity', 'Gemini', 'Claude', 'Bing Copilot'],
    },
    magic_link_sent: false,
    audit_id: null,
    org_id: '',
    trial_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    entry_path: entryPath,
  };
}
