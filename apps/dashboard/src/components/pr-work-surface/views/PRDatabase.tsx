'use client';

/**
 * PR Database View (CRM-Grade, V1.1) - DS 3.0
 *
 * Best-in-class media contact management with:
 * - Quick filter chips + Advanced Filters drawer
 * - Saved segments with persistent views
 * - Data Quality mode for hygiene management
 * - Entity-first CRM with quality signals
 * - Column chooser + density toggle
 *
 * WIRED TO REAL DATA: Fetches from /api/pr/journalists and /api/pr/lists
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import type {
  MediaContact,
  EntityType,
  RelationshipStage,
  OutletTier,
  OutletType,
  VerificationStatus,
  AudienceSignal,
  DatabaseFilterState,
  SavedSegment,
  DataQualityStats,
} from '../types';
import {
  prAccent,
  buttonStyles,
  typography,
} from '../prWorkSurfaceStyles';
import { ContactFormModal } from '../components/ContactFormModal';

// ============================================
// API TYPES & FETCHER
// ============================================

interface JournalistProfile {
  id: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet: string | null;
  beat: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  lastActivityAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface JournalistProfilesResponse {
  profiles: JournalistProfile[];
  total: number;
  limit: number;
  offset: number;
}

interface MediaListResponse {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  inputTopic: string;
  inputKeywords: string[];
  inputMarket: string | null;
  inputGeography: string | null;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
}

interface MediaListsResponse {
  lists: MediaListResponse[];
  total: number;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch data');
    throw error;
  }
  return res.json();
};

// Map JournalistProfile to MediaContact for UI compatibility
function mapJournalistToContact(profile: JournalistProfile): MediaContact & {
  geo?: string;
  language?: string;
  outletType?: OutletType;
  outletTier?: OutletTier;
  verificationStatus?: VerificationStatus;
  audienceSignal?: AudienceSignal;
} {
  // Determine relationship stage based on engagement score
  const getRelationshipStage = (score: number): RelationshipStage => {
    if (score >= 80) return 'advocate';
    if (score >= 60) return 'engaged';
    if (score >= 40) return 'warm';
    return 'cold';
  };

  // Determine outlet tier based on outlet name (simplified heuristic)
  const getOutletTier = (outlet: string | null): OutletTier => {
    if (!outlet) return 'niche';
    const tier1 = ['techcrunch', 'wired', 'forbes', 'nytimes', 'wsj', 'bloomberg', 'reuters'];
    const tier2 = ['venturebeat', 'zdnet', 'cnet', 'engadget', 'theverge'];
    const outletLower = outlet.toLowerCase();
    if (tier1.some(t => outletLower.includes(t))) return 't1';
    if (tier2.some(t => outletLower.includes(t))) return 't2';
    return 't3';
  };

  return {
    id: profile.id,
    entityType: 'journalist',
    name: profile.fullName,
    email: profile.primaryEmail,
    outlet: profile.primaryOutlet ?? undefined,
    beats: profile.beat ? [profile.beat] : [],
    topicCurrency: Math.round(profile.relevanceScore * 100),
    preferredChannels: ['email'],
    relationshipStage: getRelationshipStage(profile.engagementScore * 100),
    pitchEligibilityScore: Math.round(profile.responsivenessScore * 100),
    lastInteraction: profile.lastActivityAt ?? undefined,
    aiCitationScore: Math.round(profile.relevanceScore * 100),
    tags: [],
    outletTier: getOutletTier(profile.primaryOutlet),
    verificationStatus: profile.primaryEmail ? 'verified' : 'unverified',
    audienceSignal: 'stable',
  };
}

// Map MediaListResponse to SavedSegment for UI compatibility
function mapListToSegment(list: MediaListResponse): SavedSegment {
  return {
    id: list.id,
    name: list.name,
    description: list.description ?? undefined,
    filters: {
      entityTypes: [],
      relationshipStages: [],
      geos: list.inputGeography ? [list.inputGeography] : [],
      languages: [],
      outletTypes: [],
      outletTiers: [],
      beatTags: list.inputKeywords,
      topicCurrencyRange: {},
      lastTouchRange: {},
      pitchScoreRange: {},
      verificationStatuses: [],
      audienceSignals: [],
      searchQuery: list.inputTopic,
    },
    contactCount: list.entryCount ?? 0,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    isPinned: false,
  };
}

// ============================================
// TYPES
// ============================================

type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_CONTACTS: (MediaContact & {
  geo?: string;
  language?: string;
  outletType?: OutletType;
  outletTier?: OutletTier;
  verificationStatus?: VerificationStatus;
  audienceSignal?: AudienceSignal;
})[] = [
  {
    id: '1',
    entityType: 'journalist',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcrunch.com',
    outlet: 'TechCrunch',
    beats: ['AI', 'SaaS', 'Enterprise'],
    topicCurrency: 92,
    preferredChannels: ['email'],
    relationshipStage: 'engaged',
    pitchEligibilityScore: 88,
    lastInteraction: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    lastCitation: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    aiCitationScore: 78,
    tags: ['tier-1', 'responsive'],
    geo: 'US',
    language: 'en',
    outletType: 'blog',
    outletTier: 't1',
    verificationStatus: 'verified',
    audienceSignal: 'growing',
  },
  {
    id: '2',
    entityType: 'journalist',
    name: 'Michael Torres',
    email: 'mtorres@wired.com',
    outlet: 'Wired',
    beats: ['AI', 'Future of Work'],
    topicCurrency: 85,
    preferredChannels: ['email', 'social'],
    relationshipStage: 'warm',
    pitchEligibilityScore: 72,
    lastInteraction: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    aiCitationScore: 65,
    tags: ['tier-1'],
    geo: 'US',
    language: 'en',
    outletType: 'magazine',
    outletTier: 't1',
    verificationStatus: 'verified',
    audienceSignal: 'stable',
  },
  {
    id: '3',
    entityType: 'podcast',
    name: 'The AI Marketing Show',
    email: 'bookings@aimarketingshow.com',
    beats: ['AI Marketing', 'MarTech'],
    topicCurrency: 78,
    preferredChannels: ['form'],
    relationshipStage: 'cold',
    pitchEligibilityScore: 65,
    aiCitationScore: 45,
    tags: ['podcast', 'martech'],
    geo: 'US',
    language: 'en',
    outletType: 'podcast',
    outletTier: 'niche',
    verificationStatus: 'verified',
    audienceSignal: 'growing',
  },
  {
    id: '4',
    entityType: 'influencer',
    name: 'Alex Rivera',
    outlet: 'LinkedIn',
    beats: ['B2B Marketing', 'Growth'],
    topicCurrency: 88,
    preferredChannels: ['social'],
    relationshipStage: 'warm',
    pitchEligibilityScore: 70,
    lastInteraction: new Date(Date.now() - 21 * 24 * 3600000).toISOString(),
    aiCitationScore: 55,
    tags: ['influencer', 'linkedin-top-voice'],
    geo: 'US',
    language: 'en',
    outletTier: 't2',
    verificationStatus: 'unverified',
    audienceSignal: 'growing',
  },
  {
    id: '5',
    entityType: 'journalist',
    name: 'Jennifer Wong',
    email: 'jwong@forbes.com',
    outlet: 'Forbes',
    beats: ['Enterprise Tech', 'Leadership'],
    topicCurrency: 68,
    preferredChannels: ['email'],
    relationshipStage: 'cold',
    pitchEligibilityScore: 58,
    lastInteraction: new Date(Date.now() - 45 * 24 * 3600000).toISOString(),
    aiCitationScore: 72,
    tags: ['tier-1', 'needs-warming'],
    geo: 'US',
    language: 'en',
    outletType: 'magazine',
    outletTier: 't1',
    verificationStatus: 'outdated',
    audienceSignal: 'stable',
  },
  {
    id: '6',
    entityType: 'journalist',
    name: 'Hans Mueller',
    email: 'h.mueller@handelsblatt.de',
    outlet: 'Handelsblatt',
    beats: ['Tech', 'Startups', 'B2B'],
    topicCurrency: 75,
    preferredChannels: ['email'],
    relationshipStage: 'cold',
    pitchEligibilityScore: 55,
    aiCitationScore: 40,
    tags: ['german-market'],
    geo: 'DE',
    language: 'de',
    outletType: 'newspaper',
    outletTier: 't1',
    verificationStatus: 'needs_review',
    audienceSignal: 'stable',
  },
  {
    id: '7',
    entityType: 'kol',
    name: 'Dr. Priya Sharma',
    email: 'priya@airesearch.org',
    beats: ['AI Research', 'ML', 'Ethics'],
    topicCurrency: 95,
    preferredChannels: ['email', 'social'],
    relationshipStage: 'engaged',
    pitchEligibilityScore: 82,
    lastInteraction: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    aiCitationScore: 90,
    tags: ['academic', 'ai-expert'],
    geo: 'UK',
    language: 'en',
    outletTier: 't1',
    verificationStatus: 'verified',
    audienceSignal: 'growing',
  },
];

const MOCK_SAVED_SEGMENTS: SavedSegment[] = [
  {
    id: 'seg-1',
    name: 'Tier 1 Tech Press',
    description: 'Major tech publications, engaged relationships',
    filters: {
      entityTypes: ['journalist'],
      relationshipStages: ['warm', 'engaged'],
      geos: ['US'],
      languages: ['en'],
      outletTypes: [],
      outletTiers: ['t1'],
      beatTags: [],
      topicCurrencyRange: { min: 70 },
      lastTouchRange: {},
      pitchScoreRange: { min: 60 },
      verificationStatuses: ['verified'],
      audienceSignals: [],
      searchQuery: '',
    },
    contactCount: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    isPinned: true,
    color: 'magenta',
  },
  {
    id: 'seg-2',
    name: 'Podcast Opportunities',
    description: 'Active podcasts for guest appearances',
    filters: {
      entityTypes: ['podcast'],
      relationshipStages: [],
      geos: [],
      languages: ['en'],
      outletTypes: ['podcast'],
      outletTiers: [],
      beatTags: [],
      topicCurrencyRange: { min: 60 },
      lastTouchRange: {},
      pitchScoreRange: {},
      verificationStatuses: [],
      audienceSignals: ['growing', 'stable'],
      searchQuery: '',
    },
    contactCount: 1,
    createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    isPinned: false,
    color: 'iris',
  },
  {
    id: 'seg-3',
    name: 'Needs Data Cleanup',
    description: 'Contacts requiring verification or update',
    filters: {
      entityTypes: [],
      relationshipStages: [],
      geos: [],
      languages: [],
      outletTypes: [],
      outletTiers: [],
      beatTags: [],
      topicCurrencyRange: {},
      lastTouchRange: {},
      pitchScoreRange: {},
      verificationStatuses: ['unverified', 'outdated', 'needs_review'],
      audienceSignals: [],
      searchQuery: '',
    },
    contactCount: 3,
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    isPinned: false,
    color: 'warning',
  },
];

// ============================================
// INITIAL FILTER STATE
// ============================================

const INITIAL_FILTER_STATE: DatabaseFilterState = {
  entityTypes: [],
  relationshipStages: [],
  geos: [],
  languages: [],
  outletTypes: [],
  outletTiers: [],
  beatTags: [],
  topicCurrencyRange: {},
  lastTouchRange: {},
  pitchScoreRange: {},
  verificationStatuses: [],
  audienceSignals: [],
  searchQuery: '',
};

// ============================================
// FILTER OPTION CONFIGS
// ============================================

const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'journalist', label: 'Journalist' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'kol', label: 'KOL' },
  { value: 'outlet', label: 'Outlet' },
];

const RELATIONSHIP_STAGE_OPTIONS: { value: RelationshipStage; label: string; color: string }[] = [
  { value: 'cold', label: 'Cold', color: 'white' },
  { value: 'warm', label: 'Warm', color: 'warning' },
  { value: 'engaged', label: 'Engaged', color: 'success' },
  { value: 'advocate', label: 'Advocate', color: 'magenta' },
];

const OUTLET_TYPE_OPTIONS: { value: OutletType; label: string }[] = [
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'blog', label: 'Blog' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'wire', label: 'Wire Service' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'newsletter', label: 'Newsletter' },
];

const OUTLET_TIER_OPTIONS: { value: OutletTier; label: string; description: string }[] = [
  { value: 't1', label: 'Tier 1', description: 'Top-tier national/global' },
  { value: 't2', label: 'Tier 2', description: 'Major regional/industry' },
  { value: 't3', label: 'Tier 3', description: 'Local/niche' },
  { value: 'trade', label: 'Trade', description: 'Industry-specific' },
  { value: 'niche', label: 'Niche', description: 'Specialized audience' },
];

const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string; color: string }[] = [
  { value: 'verified', label: 'Verified', color: 'success' },
  { value: 'unverified', label: 'Unverified', color: 'white' },
  { value: 'outdated', label: 'Outdated', color: 'warning' },
  { value: 'needs_review', label: 'Needs Review', color: 'danger' },
];

const AUDIENCE_SIGNAL_OPTIONS: { value: AudienceSignal; label: string }[] = [
  { value: 'growing', label: 'Growing' },
  { value: 'stable', label: 'Stable' },
  { value: 'declining', label: 'Declining' },
  { value: 'unknown', label: 'Unknown' },
];

const GEO_OPTIONS = ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'IN', 'SG', 'JP'];
const LANGUAGE_OPTIONS = ['en', 'de', 'fr', 'es', 'pt', 'ja', 'zh'];

// ============================================
// DS3 BADGE COMPONENTS
// ============================================

function RelationshipBadge({ stage }: { stage: RelationshipStage }) {
  const config = {
    cold: { color: 'bg-white/10 text-white/60 border-white/20', label: 'Cold' },
    warm: { color: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30', label: 'Warm' },
    engaged: { color: 'bg-semantic-success/15 text-semantic-success border-semantic-success/30', label: 'Engaged' },
    advocate: { color: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30', label: 'Advocate' },
  };
  const { color, label } = config[stage];
  return <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${color}`}>{label}</span>;
}

function EntityTypeBadge({ type }: { type: EntityType }) {
  const config = {
    journalist: { color: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30' },
    podcast: { color: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30' },
    influencer: { color: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30' },
    kol: { color: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30' },
    outlet: { color: 'bg-semantic-success/15 text-semantic-success border-semantic-success/30' },
  };
  const { color } = config[type];
  const labels = {
    journalist: 'Journalist',
    podcast: 'Podcast',
    influencer: 'Influencer',
    kol: 'KOL',
    outlet: 'Outlet',
  };
  return (
    <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${color}`}>
      {labels[type]}
    </span>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = {
    verified: { color: 'bg-semantic-success text-white', icon: 'check' },
    unverified: { color: 'bg-white/20 text-white/60', icon: 'question' },
    outdated: { color: 'bg-semantic-warning text-white', icon: 'alert' },
    needs_review: { color: 'bg-semantic-danger text-white', icon: 'alert' },
  };
  const { color, icon } = config[status];
  return (
    <span className={`w-5 h-5 flex items-center justify-center text-[10px] rounded ${color}`}>
      {icon === 'check' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {icon === 'question' && '?'}
      {icon === 'alert' && '!'}
    </span>
  );
}

function TopicCurrencyIndicator({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const color = value >= 80 ? 'bg-semantic-success' : value >= 50 ? 'bg-semantic-warning' : 'bg-semantic-danger';
  const textColor = value >= 80 ? 'text-semantic-success' : value >= 50 ? 'text-semantic-warning' : 'text-semantic-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-[#1A1A24] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      {showLabel && <span className={`text-xs font-medium ${textColor}`}>{value}%</span>}
    </div>
  );
}

// ============================================
// FILTER CHIP COMPONENTS (DS3)
// ============================================

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
        active
          ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30 shadow-[0_0_12px_rgba(232,121,249,0.15)]'
          : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80 hover:border-[#2A2A36]'
      }`}
    >
      {label}
      {count !== undefined && <span className="ml-1.5 opacity-60">({count})</span>}
    </button>
  );
}

function ActiveFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full bg-brand-magenta/15 text-brand-magenta border border-brand-magenta/30">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-white transition-colors">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ============================================
// FILTER DRAWER COMPONENT (DS3)
// ============================================

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DatabaseFilterState;
  onFiltersChange: (filters: DatabaseFilterState) => void;
  availableBeats: string[];
}

function FilterDrawer({ isOpen, onClose, filters, onFiltersChange, availableBeats }: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(INITIAL_FILTER_STATE);
  };

  const toggleArrayValue = <T extends string>(array: T[], value: T): T[] => {
    return array.includes(value) ? array.filter((v) => v !== value) : [...array, value];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0D0D12] border-l border-[#1A1A24] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D12] border-b border-[#1A1A24] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${prAccent.bg} flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${prAccent.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h2 className={typography.titleMedium}>Advanced Filters</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Geography */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Geography</h3>
            <div className="flex flex-wrap gap-2">
              {GEO_OPTIONS.map((geo) => (
                <button
                  key={geo}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, geos: toggleArrayValue(localFilters.geos, geo) })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    localFilters.geos.includes(geo)
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                  }`}
                >
                  {geo}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Language</h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, languages: toggleArrayValue(localFilters.languages, lang) })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    localFilters.languages.includes(lang)
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Outlet Type */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Outlet Type</h3>
            <div className="flex flex-wrap gap-2">
              {OUTLET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, outletTypes: toggleArrayValue(localFilters.outletTypes, opt.value) })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    localFilters.outletTypes.includes(opt.value)
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outlet Tier */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Outlet Tier</h3>
            <div className="space-y-2">
              {OUTLET_TIER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, outletTiers: toggleArrayValue(localFilters.outletTiers, opt.value) })}
                  className={`w-full px-3 py-2.5 text-left rounded-lg border transition-all ${
                    localFilters.outletTiers.includes(opt.value)
                      ? 'bg-brand-magenta/10 border-brand-magenta/30'
                      : 'bg-white/5 border-[#1A1A24] hover:border-[#2A2A36]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${localFilters.outletTiers.includes(opt.value) ? 'text-brand-magenta' : 'text-white'}`}>
                      {opt.label}
                    </span>
                    {localFilters.outletTiers.includes(opt.value) && (
                      <svg className="w-4 h-4 text-brand-magenta" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Beats */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Beats / Topics</h3>
            <div className="flex flex-wrap gap-2">
              {availableBeats.map((beat) => (
                <button
                  key={beat}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, beatTags: toggleArrayValue(localFilters.beatTags, beat) })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    localFilters.beatTags.includes(beat)
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                  }`}
                >
                  {beat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Currency Range (Slider) */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Topic Currency Threshold</h3>
            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={100}
                value={localFilters.topicCurrencyRange.min ?? 0}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    topicCurrencyRange: { ...localFilters.topicCurrencyRange, min: Number(e.target.value) || undefined },
                  })
                }
                className="w-full h-2 bg-[#1A1A24] rounded-lg appearance-none cursor-pointer accent-brand-magenta"
              />
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Min: {localFilters.topicCurrencyRange.min ?? 0}%</span>
                <span>Max: 100%</span>
              </div>
            </div>
          </div>

          {/* Pitch Score Range */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Pitch Fit Score</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                min={0}
                max={100}
                value={localFilters.pitchScoreRange.min ?? ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    pitchScoreRange: { ...localFilters.pitchScoreRange, min: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="w-20 px-3 py-2 text-sm rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:border-brand-magenta/50"
              />
              <span className="text-white/55">to</span>
              <input
                type="number"
                placeholder="Max"
                min={0}
                max={100}
                value={localFilters.pitchScoreRange.max ?? ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    pitchScoreRange: { ...localFilters.pitchScoreRange, max: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="w-20 px-3 py-2 text-sm rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:border-brand-magenta/50"
              />
            </div>
          </div>

          {/* Last Touch Range */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Last Touch</h3>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={localFilters.lastTouchRange.from ?? ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    lastTouchRange: { ...localFilters.lastTouchRange, from: e.target.value || undefined },
                  })
                }
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white focus:outline-none focus:border-brand-magenta/50"
              />
              <span className="text-white/55">to</span>
              <input
                type="date"
                value={localFilters.lastTouchRange.to ?? ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    lastTouchRange: { ...localFilters.lastTouchRange, to: e.target.value || undefined },
                  })
                }
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white focus:outline-none focus:border-brand-magenta/50"
              />
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Verification Status</h3>
            <div className="flex flex-wrap gap-2">
              {VERIFICATION_STATUS_OPTIONS.map((opt) => {
                const colorClasses = {
                  success: 'bg-semantic-success/15 text-semantic-success border-semantic-success/30',
                  white: 'bg-white/10 text-white/70 border-white/20',
                  warning: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30',
                  danger: 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30',
                };
                const isActive = localFilters.verificationStatuses.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setLocalFilters({ ...localFilters, verificationStatuses: toggleArrayValue(localFilters.verificationStatuses, opt.value) })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      isActive
                        ? colorClasses[opt.color as keyof typeof colorClasses]
                        : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience Signals */}
          <div>
            <h3 className={`${typography.titleSmall} mb-3`}>Audience Signals</h3>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_SIGNAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, audienceSignals: toggleArrayValue(localFilters.audienceSignals, opt.value) })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    localFilters.audienceSignals.includes(opt.value)
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#0D0D12] border-t border-[#1A1A24] px-6 py-4 flex items-center justify-between">
          <button type="button" onClick={handleReset} className="text-sm text-white/55 hover:text-white transition-colors">
            Reset all
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`${buttonStyles.primary}`}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SAVED SEGMENTS PANEL (DS3)
// ============================================

interface SavedSegmentsPanelProps {
  segments: SavedSegment[];
  activeSegmentId: string | null;
  onSelectSegment: (segment: SavedSegment | null) => void;
  onSaveCurrentFilters: () => void;
}

function SavedSegmentsPanel({ segments, activeSegmentId, onSelectSegment, onSaveCurrentFilters }: SavedSegmentsPanelProps) {
  const colorMap: Record<string, string> = {
    magenta: 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/30',
    iris: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30',
    cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
    warning: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30',
    success: 'bg-semantic-success/10 text-semantic-success border-semantic-success/30',
  };

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center justify-between mb-3">
        <h3 className={typography.titleSmall}>Saved Segments</h3>
        <button
          type="button"
          onClick={onSaveCurrentFilters}
          className="text-xs text-brand-magenta hover:text-brand-magenta/80 transition-colors"
        >
          + Save current
        </button>
      </div>
      <div className="space-y-2">
        {/* All Contacts (clear filter) */}
        <button
          type="button"
          onClick={() => onSelectSegment(null)}
          className={`w-full px-3 py-2.5 text-left rounded-lg border transition-all ${
            activeSegmentId === null
              ? 'bg-white/10 border-white/20'
              : 'bg-white/5 border-transparent hover:border-[#1A1A24]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${activeSegmentId === null ? 'text-white' : 'text-white/70'}`}>All Contacts</span>
          </div>
        </button>

        {/* Saved Segments */}
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSelectSegment(segment)}
            className={`w-full px-3 py-2.5 text-left rounded-lg border transition-all ${
              activeSegmentId === segment.id
                ? colorMap[segment.color || 'magenta']
                : 'bg-white/5 border-transparent hover:border-[#1A1A24]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {segment.isPinned && <span className="text-[10px]">*</span>}
                <span className={`text-sm font-medium ${activeSegmentId === segment.id ? '' : 'text-white/70'}`}>{segment.name}</span>
              </div>
              <span className="text-xs text-white/50">{segment.contactCount}</span>
            </div>
            {segment.description && <p className="text-xs text-white/50 mt-0.5">{segment.description}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// DATA QUALITY PANEL (DS3)
// ============================================

interface DataQualityPanelProps {
  stats: DataQualityStats;
  isDataQualityMode: boolean;
  onToggle: () => void;
}

function DataQualityPanel({ stats, isDataQualityMode, onToggle }: DataQualityPanelProps) {
  const qualityColor = stats.qualityScore >= 80 ? 'text-semantic-success' : stats.qualityScore >= 60 ? 'text-semantic-warning' : 'text-semantic-danger';
  const qualityBg = stats.qualityScore >= 80 ? 'bg-semantic-success' : stats.qualityScore >= 60 ? 'bg-semantic-warning' : 'bg-semantic-danger';

  return (
    <div className={`p-4 rounded-xl border transition-colors ${isDataQualityMode ? 'bg-semantic-warning/10 border-semantic-warning/30' : 'bg-[#0D0D12] border-[#1A1A24]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className={typography.titleSmall}>Data Quality</h3>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-2 rounded-full bg-[#1A1A24] overflow-hidden`}>
              <div className={`h-full rounded-full ${qualityBg}`} style={{ width: `${stats.qualityScore}%` }} />
            </div>
            <span className={`text-sm font-bold ${qualityColor}`}>{stats.qualityScore}%</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
            isDataQualityMode
              ? 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30'
              : 'bg-white/5 text-white/55 border-[#1A1A24] hover:text-white/80'
          }`}
        >
          {isDataQualityMode ? 'Exit' : 'Enter'} Quality Mode
        </button>
      </div>

      {isDataQualityMode && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-[#0A0A0F]">
            <div className="text-lg font-bold text-semantic-success">{stats.verifiedCount}</div>
            <div className="text-[11px] text-white/50">Verified</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0A0A0F]">
            <div className="text-lg font-bold text-semantic-warning">{stats.outdatedCount}</div>
            <div className="text-[11px] text-white/50">Outdated</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0A0A0F]">
            <div className="text-lg font-bold text-semantic-danger">{stats.missingEmailCount}</div>
            <div className="text-[11px] text-white/50">Missing Email</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0A0A0F]">
            <div className="text-lg font-bold text-white/55">{stats.lowTopicCurrencyCount}</div>
            <div className="text-[11px] text-white/50">Low Currency</div>
          </div>
        </div>
      )}

      {!isDataQualityMode && (
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>{stats.verifiedCount} verified</span>
          <span className="text-semantic-warning">{stats.outdatedCount + stats.unverifiedCount} need attention</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// COLUMN CHOOSER (DS3)
// ============================================

interface ColumnChooserProps {
  columns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
}

function ColumnChooser({ columns, onToggleColumn, density, onDensityChange }: ColumnChooserProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/55 border border-[#1A1A24] rounded-lg hover:text-white/80 hover:border-[#2A2A36] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Columns
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-[#13131A] border border-[#1F1F28] rounded-xl shadow-elev-2 z-50">
            {/* Density Toggle */}
            <div className="mb-4 pb-4 border-b border-[#1A1A24]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Density</p>
              <div className="flex gap-1">
                {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onDensityChange(d)}
                    className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded transition-all ${
                      density === d
                        ? 'bg-brand-magenta/15 text-brand-magenta'
                        : 'text-white/55 hover:text-white/80'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Toggles */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Visible Columns</p>
            <div className="space-y-1">
              {columns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleColumn(col.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                >
                  <span className={`text-xs ${col.visible ? 'text-white/85' : 'text-white/40'}`}>{col.label}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    col.visible ? 'bg-brand-magenta border-brand-magenta' : 'border-white/30'
                  }`}>
                    {col.visible && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRDatabase() {
  // Fetch journalists from real API
  const { data: journalistsData, error: journalistsError, isLoading: isLoadingJournalists, mutate: mutateJournalists } = useSWR<JournalistProfilesResponse>(
    '/api/pr/journalists?limit=100',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch saved segments (media lists) from real API
  const { data: listsData, error: listsError, isLoading: isLoadingLists } = useSWR<MediaListsResponse>(
    '/api/pr/lists',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Map API data to UI format, fallback to mock data if no results
  const contacts = useMemo(() => {
    if (journalistsData?.profiles && journalistsData.profiles.length > 0) {
      return journalistsData.profiles.map(mapJournalistToContact);
    }
    // Fallback to mock data if API returns empty
    return MOCK_CONTACTS;
  }, [journalistsData]);

  const savedSegments = useMemo(() => {
    if (listsData?.lists && listsData.lists.length > 0) {
      return listsData.lists.map(mapListToSegment);
    }
    // Fallback to mock data if API returns empty
    return MOCK_SAVED_SEGMENTS;
  }, [listsData]);

  const isLoading = isLoadingJournalists || isLoadingLists;
  const hasError = journalistsError || listsError;

  const [filters, setFilters] = useState<DatabaseFilterState>(INITIAL_FILTER_STATE);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isDataQualityMode, setIsDataQualityMode] = useState(false);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'contact', label: 'Contact', visible: true },
    { id: 'type', label: 'Type', visible: true },
    { id: 'beats', label: 'Beats', visible: true },
    { id: 'currency', label: 'Currency', visible: true },
    { id: 'relationship', label: 'Relationship', visible: true },
    { id: 'score', label: 'Score', visible: true },
    { id: 'lastTouch', label: 'Last Touch', visible: true },
  ]);

  // Density-based row padding
  const rowPadding = {
    compact: 'py-2',
    comfortable: 'py-3',
    spacious: 'py-4',
  };

  // Extract available beats from contacts
  const availableBeats = useMemo(() => {
    const beats = new Set<string>();
    contacts.forEach((c) => c.beats.forEach((b) => beats.add(b)));
    return Array.from(beats).sort();
  }, [contacts]);

  // Calculate data quality stats
  const dataQualityStats = useMemo<DataQualityStats>(() => {
    const total = contacts.length;
    const verified = contacts.filter((c) => c.verificationStatus === 'verified').length;
    const unverified = contacts.filter((c) => c.verificationStatus === 'unverified').length;
    const outdated = contacts.filter((c) => c.verificationStatus === 'outdated' || c.verificationStatus === 'needs_review').length;
    const missingEmail = contacts.filter((c) => !c.email).length;
    const missingBeats = contacts.filter((c) => c.beats.length === 0).length;
    const lowCurrency = contacts.filter((c) => c.topicCurrency < 50).length;

    const qualityScore = Math.round(((verified * 2 + (total - missingEmail) + (total - lowCurrency)) / (total * 4)) * 100);

    return {
      totalContacts: total,
      verifiedCount: verified,
      unverifiedCount: unverified,
      outdatedCount: outdated,
      missingEmailCount: missingEmail,
      missingBeatsCount: missingBeats,
      lowTopicCurrencyCount: lowCurrency,
      qualityScore,
    };
  }, [contacts]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !contact.name.toLowerCase().includes(query) &&
          !contact.outlet?.toLowerCase().includes(query) &&
          !contact.beats.some((b) => b.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Entity types
      if (filters.entityTypes.length > 0 && !filters.entityTypes.includes(contact.entityType)) {
        return false;
      }

      // Relationship stages
      if (filters.relationshipStages.length > 0 && !filters.relationshipStages.includes(contact.relationshipStage)) {
        return false;
      }

      // Geos
      if (filters.geos.length > 0 && contact.geo && !filters.geos.includes(contact.geo)) {
        return false;
      }

      // Languages
      if (filters.languages.length > 0 && contact.language && !filters.languages.includes(contact.language)) {
        return false;
      }

      // Outlet types
      if (filters.outletTypes.length > 0 && contact.outletType && !filters.outletTypes.includes(contact.outletType)) {
        return false;
      }

      // Outlet tiers
      if (filters.outletTiers.length > 0 && contact.outletTier && !filters.outletTiers.includes(contact.outletTier)) {
        return false;
      }

      // Beat tags
      if (filters.beatTags.length > 0 && !contact.beats.some((b) => filters.beatTags.includes(b))) {
        return false;
      }

      // Topic currency range
      if (filters.topicCurrencyRange.min !== undefined && contact.topicCurrency < filters.topicCurrencyRange.min) {
        return false;
      }
      if (filters.topicCurrencyRange.max !== undefined && contact.topicCurrency > filters.topicCurrencyRange.max) {
        return false;
      }

      // Pitch score range
      if (filters.pitchScoreRange.min !== undefined && contact.pitchEligibilityScore < filters.pitchScoreRange.min) {
        return false;
      }
      if (filters.pitchScoreRange.max !== undefined && contact.pitchEligibilityScore > filters.pitchScoreRange.max) {
        return false;
      }

      // Last touch range
      if (filters.lastTouchRange.from && contact.lastInteraction) {
        if (new Date(contact.lastInteraction) < new Date(filters.lastTouchRange.from)) {
          return false;
        }
      }
      if (filters.lastTouchRange.to && contact.lastInteraction) {
        if (new Date(contact.lastInteraction) > new Date(filters.lastTouchRange.to)) {
          return false;
        }
      }

      // Verification status
      if (filters.verificationStatuses.length > 0 && contact.verificationStatus && !filters.verificationStatuses.includes(contact.verificationStatus)) {
        return false;
      }

      // Audience signals
      if (filters.audienceSignals.length > 0 && contact.audienceSignal && !filters.audienceSignals.includes(contact.audienceSignal)) {
        return false;
      }

      // Data quality mode - filter to items needing attention
      if (isDataQualityMode) {
        const needsAttention =
          contact.verificationStatus !== 'verified' ||
          !contact.email ||
          contact.topicCurrency < 50;
        if (!needsAttention) return false;
      }

      return true;
    });
  }, [contacts, filters, isDataQualityMode]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.geos.length) count++;
    if (filters.languages.length) count++;
    if (filters.outletTypes.length) count++;
    if (filters.outletTiers.length) count++;
    if (filters.beatTags.length) count++;
    if (filters.topicCurrencyRange.min !== undefined || filters.topicCurrencyRange.max !== undefined) count++;
    if (filters.pitchScoreRange.min !== undefined || filters.pitchScoreRange.max !== undefined) count++;
    if (filters.lastTouchRange.from || filters.lastTouchRange.to) count++;
    if (filters.verificationStatuses.length) count++;
    if (filters.audienceSignals.length) count++;
    return count;
  }, [filters]);

  // Handle segment selection
  const handleSelectSegment = useCallback((segment: SavedSegment | null) => {
    if (segment) {
      setFilters(segment.filters);
      setActiveSegmentId(segment.id);
    } else {
      setFilters(INITIAL_FILTER_STATE);
      setActiveSegmentId(null);
    }
  }, []);

  // Toggle quick filter
  const toggleEntityType = (type: EntityType) => {
    setFilters((prev) => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(type)
        ? prev.entityTypes.filter((t) => t !== type)
        : [...prev.entityTypes, type],
    }));
    setActiveSegmentId(null);
  };

  const toggleRelationshipStage = (stage: RelationshipStage) => {
    setFilters((prev) => ({
      ...prev,
      relationshipStages: prev.relationshipStages.includes(stage)
        ? prev.relationshipStages.filter((s) => s !== stage)
        : [...prev.relationshipStages, stage],
    }));
    setActiveSegmentId(null);
  };

  const toggleColumn = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
    );
  };

  // Contact form handlers
  const handleSaveContact = useCallback(async (formData: {
    fullName: string;
    primaryEmail: string;
    primaryOutlet: string;
    beat: string;
    twitterHandle: string;
    linkedinUrl: string;
  }, id?: string) => {
    const url = id ? `/api/pr/journalists/${id}` : '/api/pr/journalists';
    const method = id ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save contact');
    }

    // Revalidate the journalists list
    await mutateJournalists();
    setShowContactModal(false);
    setEditingContactId(null);
  }, [mutateJournalists]);

  const handleEditContact = useCallback((contactId: string) => {
    setEditingContactId(contactId);
    setShowContactModal(true);
  }, []);

  const handleOpenNewContact = useCallback(() => {
    setEditingContactId(null);
    setShowContactModal(true);
  }, []);

  // Get editing contact data for the modal
  const editingContactData = useMemo(() => {
    if (!editingContactId || !journalistsData?.profiles) return undefined;
    const profile = journalistsData.profiles.find(p => p.id === editingContactId);
    if (!profile) return undefined;
    return {
      id: profile.id,
      fullName: profile.fullName,
      primaryEmail: profile.primaryEmail,
      primaryOutlet: profile.primaryOutlet || '',
      beat: profile.beat || '',
      twitterHandle: profile.twitterHandle || '',
      linkedinUrl: profile.linkedinUrl || '',
    };
  }, [editingContactId, journalistsData?.profiles]);

  // Bulk selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  }, [filteredContacts, selectedIds.size]);

  const toggleSelectContact = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkAddToSegment = useCallback(() => {
    console.log('Add to segment:', Array.from(selectedIds));
    // Placeholder - would open segment selection modal
  }, [selectedIds]);

  const handleBulkMarkForVerification = useCallback(() => {
    console.log('Mark for verification:', Array.from(selectedIds));
    // Placeholder - would mark contacts for verification
    clearSelection();
  }, [selectedIds, clearSelection]);

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-semibold text-white">Media Database</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Select the right relationships to engage
          {isLoading && <span className="ml-2 text-brand-magenta">Loading...</span>}
        </p>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/30">
          <div className="flex items-center gap-2 text-semantic-error">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Failed to load data from server. Showing demo data.</span>
          </div>
        </div>
      )}

      {/* Top Bar: Search + Quick Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts, outlets, beats..."
            value={filters.searchQuery}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
              setActiveSegmentId(null);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0D0D12] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/30 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            activeFilterCount > 0
              ? `${prAccent.bg} ${prAccent.border} ${prAccent.text} ${prAccent.glow}`
              : 'bg-white/5 border-[#1A1A24] text-white/55 hover:text-white/80 hover:border-[#2A2A36]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-magenta text-white">{activeFilterCount}</span>
          )}
        </button>
        <ColumnChooser
          columns={columns}
          onToggleColumn={toggleColumn}
          density={density}
          onDensityChange={setDensity}
        />
        <button
          type="button"
          onClick={handleOpenNewContact}
          className={buttonStyles.primary}
        >
          Add Contact
        </button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 mr-2">Type:</span>
        {ENTITY_TYPE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={filters.entityTypes.includes(opt.value)}
            onClick={() => toggleEntityType(opt.value)}
          />
        ))}
        <div className="w-px h-5 bg-[#1A1A24] mx-2" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 mr-2">Stage:</span>
        {RELATIONSHIP_STAGE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={filters.relationshipStages.includes(opt.value)}
            onClick={() => toggleRelationshipStage(opt.value)}
          />
        ))}
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/50">Active filters:</span>
          {filters.geos.map((geo) => (
            <ActiveFilterTag key={geo} label={`Geo: ${geo}`} onRemove={() => setFilters((f) => ({ ...f, geos: f.geos.filter((g) => g !== geo) }))} />
          ))}
          {filters.languages.map((lang) => (
            <ActiveFilterTag key={lang} label={`Lang: ${lang.toUpperCase()}`} onRemove={() => setFilters((f) => ({ ...f, languages: f.languages.filter((l) => l !== lang) }))} />
          ))}
          {filters.outletTiers.map((tier) => (
            <ActiveFilterTag key={tier} label={`Tier: ${tier.toUpperCase()}`} onRemove={() => setFilters((f) => ({ ...f, outletTiers: f.outletTiers.filter((t) => t !== tier) }))} />
          ))}
          {filters.topicCurrencyRange.min !== undefined && (
            <ActiveFilterTag label={`Currency >= ${filters.topicCurrencyRange.min}%`} onRemove={() => setFilters((f) => ({ ...f, topicCurrencyRange: { ...f.topicCurrencyRange, min: undefined } }))} />
          )}
          {filters.pitchScoreRange.min !== undefined && (
            <ActiveFilterTag label={`Score >= ${filters.pitchScoreRange.min}`} onRemove={() => setFilters((f) => ({ ...f, pitchScoreRange: { ...f.pitchScoreRange, min: undefined } }))} />
          )}
          {filters.verificationStatuses.map((status) => (
            <ActiveFilterTag key={status} label={status} onRemove={() => setFilters((f) => ({ ...f, verificationStatuses: f.verificationStatuses.filter((s) => s !== status) }))} />
          ))}
          <button
            type="button"
            onClick={() => {
              setFilters(INITIAL_FILTER_STATE);
              setActiveSegmentId(null);
            }}
            className="text-xs text-semantic-danger hover:text-semantic-danger/80 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-magenta/10 border border-brand-magenta/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-magenta">
              {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-white/55 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkAddToSegment}
              className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-[#1A1A24] transition-colors"
            >
              Add to segment
            </button>
            <button
              type="button"
              onClick={handleBulkMarkForVerification}
              className="px-3 py-1.5 text-xs font-medium text-semantic-warning bg-semantic-warning/10 hover:bg-semantic-warning/20 rounded-lg border border-semantic-warning/30 transition-colors"
            >
              Mark for verification
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid: Sidebar + Table */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <SavedSegmentsPanel
            segments={savedSegments}
            activeSegmentId={activeSegmentId}
            onSelectSegment={handleSelectSegment}
            onSaveCurrentFilters={() => {
              console.log('Save current filters as segment');
            }}
          />
          <DataQualityPanel stats={dataQualityStats} isDataQualityMode={isDataQualityMode} onToggle={() => setIsDataQualityMode(!isDataQualityMode)} />
        </div>

        {/* Table Area */}
        <div className="flex-1">
          {/* Results count */}
          <div className="text-sm text-white/55 mb-4">
            Showing <span className="text-white font-medium">{filteredContacts.length}</span> of {contacts.length} contacts
            {isDataQualityMode && <span className="ml-2 text-semantic-warning">(Data Quality Mode)</span>}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-[#1A1A24] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0D0D12]">
                  {/* Bulk Select Checkbox */}
                  <th className="w-10 px-3 py-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selectedIds.size === filteredContacts.length && filteredContacts.length > 0
                          ? 'bg-brand-magenta border-brand-magenta'
                          : selectedIds.size > 0
                          ? 'bg-brand-magenta/50 border-brand-magenta/50'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {selectedIds.size === filteredContacts.length && filteredContacts.length > 0 && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {selectedIds.size > 0 && selectedIds.size < filteredContacts.length && (
                        <div className="w-2 h-0.5 bg-white rounded" />
                      )}
                    </button>
                  </th>
                  {visibleColumns.some((c) => c.id === 'contact') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Contact</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'type') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Type</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'beats') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Beats</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'currency') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Currency</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'relationship') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Relationship</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'score') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Score</th>
                  )}
                  {visibleColumns.some((c) => c.id === 'lastTouch') && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Last Touch</th>
                  )}
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A24]">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`transition-colors cursor-pointer ${
                      selectedIds.has(contact.id)
                        ? 'bg-brand-magenta/5'
                        : isDataQualityMode && contact.verificationStatus !== 'verified'
                        ? 'bg-semantic-warning/5 hover:bg-semantic-warning/10'
                        : 'bg-[#0A0A0F] hover:bg-[#111116]'
                    }`}
                    onClick={() => setSelectedContactId(contact.id)}
                  >
                    {/* Row Checkbox */}
                    <td className="w-10 px-3">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectContact(contact.id, e)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedIds.has(contact.id)
                            ? 'bg-brand-magenta border-brand-magenta'
                            : 'border-white/30 hover:border-white/50'
                        }`}
                      >
                        {selectedIds.has(contact.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                    {visibleColumns.some((c) => c.id === 'contact') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <div className="flex items-start gap-2">
                          {contact.verificationStatus && <VerificationBadge status={contact.verificationStatus} />}
                          <div>
                            <div className="font-medium text-white">{contact.name}</div>
                            {contact.outlet && <div className="text-sm text-white/55">{contact.outlet}</div>}
                            {contact.email && <div className="text-xs text-white/40">{contact.email}</div>}
                            {!contact.email && isDataQualityMode && (
                              <div className="text-xs text-semantic-danger">Missing email</div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'type') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <EntityTypeBadge type={contact.entityType} />
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'beats') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <div className="flex flex-wrap gap-1">
                          {contact.beats.slice(0, 2).map((beat) => (
                            <span key={beat} className="px-2 py-0.5 text-[11px] rounded bg-white/5 text-white/55 border border-[#1A1A24]">
                              {beat}
                            </span>
                          ))}
                          {contact.beats.length > 2 && (
                            <span className="px-2 py-0.5 text-[11px] rounded bg-white/5 text-white/55 border border-[#1A1A24]">+{contact.beats.length - 2}</span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'currency') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <TopicCurrencyIndicator value={contact.topicCurrency} />
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'relationship') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <RelationshipBadge stage={contact.relationshipStage} />
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'score') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        <span className={`text-sm font-medium ${contact.pitchEligibilityScore >= 80 ? 'text-semantic-success' : contact.pitchEligibilityScore >= 60 ? 'text-semantic-warning' : 'text-white/55'}`}>
                          {contact.pitchEligibilityScore}
                        </span>
                      </td>
                    )}
                    {visibleColumns.some((c) => c.id === 'lastTouch') && (
                      <td className={`px-4 ${rowPadding[density]}`}>
                        {contact.lastInteraction ? (
                          <span className="text-sm text-white/55">
                            {Math.floor((Date.now() - new Date(contact.lastInteraction).getTime()) / (24 * 3600000))}d ago
                          </span>
                        ) : (
                          <span className="text-sm text-white/40">Never</span>
                        )}
                      </td>
                    )}
                    <td className={`px-4 ${rowPadding[density]} text-right`}>
                      {/* Compact Action Group: Pitch · Log touch · Open */}
                      <div className="flex items-center justify-end gap-1 text-xs">
                        <button
                          type="button"
                          className="px-2 py-1 font-medium text-brand-magenta hover:text-white hover:bg-brand-magenta/15 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Create pitch for:', contact.name);
                          }}
                        >
                          Pitch
                        </button>
                        <span className="text-white/20">·</span>
                        <button
                          type="button"
                          className="px-2 py-1 font-medium text-white/55 hover:text-white hover:bg-white/5 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Log touch for:', contact.name);
                          }}
                        >
                          Log touch
                        </button>
                        <span className="text-white/20">·</span>
                        <button
                          type="button"
                          className="px-2 py-1 font-medium text-white/55 hover:text-white hover:bg-white/5 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContactId(contact.id);
                          }}
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredContacts.length === 0 && (
              <div className="p-12 text-center bg-[#0A0A0F]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0D0D12] border border-[#1A1A24] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className={typography.titleMedium}>No contacts found</h3>
                <p className="text-sm text-white/55 mt-1">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setActiveSegmentId(null);
        }}
        availableBeats={availableBeats}
      />

      {/* Contact Detail Drawer (DS3) */}
      {selectedContactId && (
        <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-[#0D0D12] border-l border-[#1A1A24] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={typography.titleLarge}>Contact Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedContactId(null)}
                  className="p-2 text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {(() => {
                const contact = contacts.find((c) => c.id === selectedContactId);
                if (!contact) return null;
                return (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      {contact.verificationStatus && <VerificationBadge status={contact.verificationStatus} />}
                      <div>
                        <h3 className="text-xl font-bold text-white">{contact.name}</h3>
                        {contact.outlet && <p className="text-white/55">{contact.outlet}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <EntityTypeBadge type={contact.entityType} />
                      <RelationshipBadge stage={contact.relationshipStage} />
                      {contact.geo && <span className="px-2 py-0.5 text-[11px] rounded bg-white/5 text-white/55 border border-[#1A1A24]">{contact.geo}</span>}
                      {contact.outletTier && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-white/5 text-white/55 border border-[#1A1A24]">
                          {OUTLET_TIER_OPTIONS.find((o) => o.value === contact.outletTier)?.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        <div className="text-xs text-white/50">Pitch Score</div>
                        <div className="text-2xl font-bold text-white">{contact.pitchEligibilityScore}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        <div className="text-xs text-white/50">Topic Currency</div>
                        <div className="text-2xl font-bold text-white">{contact.topicCurrency}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        <div className="text-xs text-white/50">AI Citation Score</div>
                        <div className="text-2xl font-bold text-white">{contact.aiCitationScore || 'N/A'}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        <div className="text-xs text-white/50">Audience Signal</div>
                        <div className="text-lg font-bold text-white capitalize">
                          {contact.audienceSignal || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Beats</h4>
                      <div className="flex flex-wrap gap-2">
                        {contact.beats.map((beat) => (
                          <span key={beat} className="px-3 py-1 text-sm rounded-lg bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/30">
                            {beat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Contact Info</h4>
                      <div className="space-y-2 p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/50">Email:</span>
                            <span className="text-white">{contact.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white/50">Preferred:</span>
                          <span className="text-white capitalize">{contact.preferredChannels.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Timeline</h4>
                      <div className="text-sm text-white/50 italic p-4 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
                        Interaction history timeline would appear here
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1A1A24] space-y-3">
                      <button
                        type="button"
                        className={`w-full ${buttonStyles.primary}`}
                      >
                        Create Pitch
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleEditContact(contact.id);
                          setSelectedContactId(null);
                        }}
                        className={`w-full ${buttonStyles.secondary}`}
                      >
                        Edit Contact
                      </button>
                      {isDataQualityMode && contact.verificationStatus !== 'verified' && (
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-sm font-semibold text-semantic-warning bg-semantic-warning/10 rounded-lg hover:bg-semantic-warning/20 transition-colors border border-semantic-warning/30"
                        >
                          Verify Contact
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactModal && (
        <ContactFormModal
          mode={editingContactId ? 'edit' : 'create'}
          initialData={editingContactData}
          onClose={() => {
            setShowContactModal(false);
            setEditingContactId(null);
          }}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
}
