/**
 * PR Intelligence Hub (Sprint S95 - Best-in-Class Rebuild)
 *
 * A PR user should instantly understand:
 * - What changed (coverage, mentions, sentiment)
 * - What's risky (negative coverage, crisis signals)
 * - What's opportunistic (journalist interest, trend alignment)
 * - What actions to take (pitches, outreach, press releases)
 * - How it connects to other pillars (content, seo, exec, crisis)
 *
 * DS v2 Compliant with AI transparency
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { JournalistWithContext, PRList } from '@pravado/types';
import {
  PRSituationBrief,
  type PRSituationBriefData,
} from '@/components/pr-intelligence';
import {
  PRAIRecommendations,
  type PRAIRecommendationsData,
} from '@/components/pr-intelligence';
import {
  PRContinuityLinks,
  type PRContinuityLinksData,
} from '@/components/pr-intelligence';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Tab type
type PRTab = 'overview' | 'explorer' | 'actions';

// AI Dot component with enhanced visual presence
function AIDot({ status = 'idle', size = 'sm' }: { status?: 'idle' | 'analyzing' | 'generating'; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  const baseClasses = `${sizeClasses} rounded-full`;

  if (status === 'analyzing') {
    return (
      <span className="relative flex">
        <span className={`${baseClasses} bg-brand-cyan animate-pulse`} />
        <span className={`absolute ${baseClasses} bg-brand-cyan animate-ping opacity-50`} />
      </span>
    );
  }
  if (status === 'generating') {
    return (
      <span className="relative flex">
        <span className={`${baseClasses} bg-brand-iris animate-pulse`} />
        <span className={`absolute ${baseClasses} bg-brand-iris animate-ping opacity-50`} />
      </span>
    );
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  href,
  icon,
  color = 'iris',
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color?: 'iris' | 'cyan' | 'magenta' | 'amber';
  badge?: string;
}) {
  const colorClasses = {
    iris: 'bg-brand-iris/10 text-brand-iris ring-brand-iris/20 hover:bg-brand-iris/15',
    cyan: 'bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/20 hover:bg-brand-cyan/15',
    magenta: 'bg-brand-magenta/10 text-brand-magenta ring-brand-magenta/20 hover:bg-brand-magenta/15',
    amber: 'bg-brand-amber/10 text-brand-amber ring-brand-amber/20 hover:bg-brand-amber/15',
  };

  return (
    <Link
      href={href}
      className={`group p-5 rounded-xl border border-border-subtle bg-slate-3/30 hover:border-brand-${color}/30 transition-all hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]} ring-1`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-brand-iris transition-colors">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-semantic-success/10 text-semantic-success">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-11 mt-1">{description}</p>
        </div>
        <svg className="w-5 h-5 text-slate-10 group-hover:text-brand-iris group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function PRPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<PRTab>('overview');

  // Intelligence state
  const [situationBrief, setSituationBrief] = useState<PRSituationBriefData | null>(null);
  const [recommendations, setRecommendations] = useState<PRAIRecommendationsData | null>(null);
  const [continuityLinks, setContinuityLinks] = useState<PRContinuityLinksData | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(true);

  // Explorer state (preserved from original)
  const [journalists, setJournalists] = useState<JournalistWithContext[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingExplorer, setLoadingExplorer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedJournalists, setSelectedJournalists] = useState<Set<string>>(new Set());

  // Lists state
  const [lists, setLists] = useState<PRList[]>([]);
  const [selectedList, setSelectedList] = useState<PRList | null>(null);
  const [listMembers, setListMembers] = useState<JournalistWithContext[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Generate realistic mock data for intelligence (will be replaced with API calls)
  const generateIntelligenceData = () => {
    const now = new Date().toISOString();

    // Situation Brief
    const mockBrief: PRSituationBriefData = {
      generatedAt: now,
      timeWindow: 'today',
      changes: [
        {
          id: '1',
          type: 'new_coverage',
          title: 'TechCrunch features your product launch',
          description: 'Major coverage in TechCrunch startup section with positive sentiment',
          outlet: 'TechCrunch',
          // Generic journalist reference - actual journalist data comes from API
          journalist: 'Tech Reporter',
          sentiment: 'positive',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          // Context-preserving: filter to TechCrunch coverage
          linkUrl: '/app/pr/journalists?outlet=TechCrunch&sentiment=positive',
        },
        {
          id: '2',
          type: 'journalist_activity',
          title: 'Key journalist engaged with your content',
          description: 'A Forbes journalist shared your recent press release on LinkedIn',
          outlet: 'Forbes',
          // Generic journalist reference
          journalist: 'Forbes Reporter',
          sentiment: 'positive',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          // Context-preserving: filter to Forbes activity
          linkUrl: '/app/pr/journalists?outlet=Forbes&activity=recent',
        },
        {
          id: '3',
          type: 'sentiment_shift',
          title: 'Competitor coverage trending negative',
          description: 'Industry coverage shifting negative on main competitor - opportunity window',
          sentiment: 'neutral',
          timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
          // Context-preserving: view competitive analysis
          linkUrl: '/app/pr/journalists?filter=competitor-coverage&sentiment=negative',
        },
      ],
      signals: [
        {
          id: 's1',
          type: 'opportunity',
          severity: 85,
          title: 'Trending topic alignment detected',
          description: 'Your product category is trending in tech media. High opportunity for thought leadership placement.',
          confidence: 78,
          affectedPillars: ['content', 'seo'],
          // Context-preserving: opportunity-based pitch creation
          actionUrl: '/app/pr/pitches?context=trending-topic&action=create&type=thought-leadership',
        },
        {
          id: 's2',
          type: 'risk',
          severity: 72,
          title: 'Competitor PR surge incoming',
          description: 'Competitor scheduled major announcement next week. Consider preemptive positioning.',
          confidence: 65,
          affectedPillars: ['exec', 'crisis'],
          // Context-preserving: competitive positioning press release
          actionUrl: '/app/pr/generator?context=competitive&urgency=high&tone=differentiation',
        },
        {
          id: 's3',
          type: 'trend',
          severity: 60,
          title: 'Industry analyst interest rising',
          description: 'Three top analysts requested briefings this month - analyst relations opportunity.',
          confidence: 82,
          affectedPillars: ['content'],
          // Context-preserving: analyst outreach
          actionUrl: '/app/pr/outreach?type=analyst&action=schedule',
        },
      ],
      attentionItems: [
        {
          id: 'a1',
          priority: 'high',
          title: 'Respond to journalist inquiry',
          description: 'A TechCrunch reporter requested comment on industry trends - deadline EOD',
          actionLabel: 'Draft Response',
          // Context-preserving: includes outlet and inquiry context
          actionUrl: '/app/pr/outreach?outlet=TechCrunch&action=respond&context=inquiry&deadline=today',
          dueBy: new Date(Date.now() + 4 * 3600000).toISOString(),
        },
        {
          id: 'a2',
          priority: 'medium',
          title: 'Follow up on pending pitches',
          description: '3 pitches sent last week have not received responses - follow up recommended',
          actionLabel: 'View Pitches',
          // Context-preserving: filter to pending pitches needing follow-up
          actionUrl: '/app/pr/pitches?filter=pending&days=7&action=follow-up',
        },
      ],
      aiSummary: 'Your PR momentum is positive with strong coverage from TechCrunch. The trending topic alignment presents a significant opportunity for thought leadership. Prioritize responding to the pending journalist inquiry and consider preemptive positioning ahead of competitor announcements.',
      stats: {
        totalMentions: 47,
        positiveCoverage: 38,
        negativeCoverage: 3,
        journalistsEngaged: 12,
      },
    };

    // Recommendations - with context-preserving action URLs
    const mockRecommendations: PRAIRecommendationsData = {
      generatedAt: now,
      recommendations: [
        {
          id: 'r1',
          type: 'pitch',
          priority: 'high',
          title: 'Pitch thought leadership piece to Wired',
          description: 'Based on trending topic alignment and your recent product updates, a thought leadership piece would resonate well with Wired\'s audience.',
          rationale: 'Wired has covered similar topics 3x this month. Your messaging aligns with their editorial calendar.',
          confidence: 85,
          impact: { coverage: 'high', sentiment: 'positive', reach: 2500000 },
          actionLabel: 'Create Pitch',
          // Context-preserving URL: includes outlet and topic context
          actionUrl: '/app/pr/pitches?outlet=Wired&topic=thought-leadership&action=create',
          estimatedEffort: 'moderate',
          relatedJournalists: ['Alex Rivera', 'Jennifer Wong'],
          relatedOutlets: ['Wired', 'Ars Technica'],
          sourcePillars: ['content', 'seo'],
        },
        {
          id: 'r2',
          type: 'respond',
          priority: 'critical',
          title: 'Respond to TechCrunch inquiry',
          description: 'A journalist is writing about industry trends and specifically requested your perspective. This is a key opportunity.',
          rationale: 'TechCrunch coverage typically drives 3-5 follow-on articles.',
          confidence: 92,
          impact: { coverage: 'high', sentiment: 'positive', reach: 1800000 },
          actionLabel: 'Draft Response',
          // Context-preserving URL: includes outlet, action type, and context
          actionUrl: '/app/pr/outreach?outlet=TechCrunch&action=respond&context=inquiry&topic=industry-trends',
          estimatedEffort: 'quick',
          relatedJournalists: ['TechCrunch Reporter'],
          relatedOutlets: ['TechCrunch'],
          deadline: new Date(Date.now() + 4 * 3600000).toISOString(),
        },
        {
          id: 'r3',
          type: 'press_release',
          priority: 'medium',
          title: 'Prepare preemptive press release',
          description: 'Get ahead of competitor announcement with your own news. Focus on differentiation and unique value.',
          rationale: 'Competitor PR surge expected next week. First-mover advantage in narrative framing.',
          confidence: 71,
          impact: { coverage: 'medium', sentiment: 'positive', reach: 950000 },
          actionLabel: 'Generate PR',
          // Context-preserving URL: includes positioning context
          actionUrl: '/app/pr/generator?context=competitive&tone=differentiation&urgency=high',
          estimatedEffort: 'involved',
          sourcePillars: ['exec', 'crisis'],
        },
        {
          id: 'r4',
          type: 'follow_up',
          priority: 'medium',
          title: 'Follow up with pending pitches',
          description: 'Three pitches from last week haven\'t received responses. A gentle follow-up often yields results.',
          rationale: 'Industry average response time is 5-7 days. 30% of successful placements come from follow-ups.',
          confidence: 68,
          impact: { coverage: 'medium', sentiment: 'neutral', reach: 750000 },
          actionLabel: 'Send Follow-ups',
          // Context-preserving URL: filter to pending pitches
          actionUrl: '/app/pr/pitches?filter=pending&action=follow-up&status=awaiting-response',
          estimatedEffort: 'quick',
        },
        {
          id: 'r5',
          type: 'outreach',
          priority: 'low',
          title: 'Build analyst relations',
          description: 'Three top analysts have requested briefings. Consider scheduling calls to build relationships.',
          rationale: 'Analyst coverage influences enterprise buyers. Strong analyst relations = better market positioning.',
          confidence: 75,
          impact: { coverage: 'medium', sentiment: 'positive', reach: 500000 },
          actionLabel: 'Schedule Briefings',
          // Context-preserving URL: analyst-specific outreach
          actionUrl: '/app/pr/outreach?type=analyst&action=schedule&context=briefing-request',
          estimatedEffort: 'moderate',
          sourcePillars: ['content'],
        },
      ],
      totalOpportunityValue: 6500000,
      aiConfidence: 79,
    };

    // Continuity Links
    const mockContinuity: PRContinuityLinksData = {
      connections: [
        {
          pillar: 'content',
          status: 'active',
          signalCount: 8,
          lastSyncedAt: now,
          influence: 'informs',
          description: 'PR coverage trends inform content strategy. High-performing topics feed content calendar.',
          latestSignal: 'TechCrunch coverage suggests audience interest in product category deep-dives.',
          actionUrl: '/app/content',
          actionLabel: 'View Content Insights',
        },
        {
          pillar: 'seo',
          status: 'active',
          signalCount: 5,
          lastSyncedAt: now,
          influence: 'informs',
          description: 'Media mentions create backlink opportunities. Coverage topics inform keyword strategy.',
          latestSignal: '3 new backlinks detected from this week\'s coverage.',
          actionUrl: '/app/seo',
          actionLabel: 'View SEO Impact',
        },
        {
          pillar: 'exec',
          status: 'active',
          signalCount: 3,
          lastSyncedAt: now,
          influence: 'updates',
          description: 'High-priority PR signals update executive digest. Coverage metrics feed board reports.',
          latestSignal: 'Weekly coverage summary ready for executive review.',
          actionUrl: '/app/exec',
          actionLabel: 'View Exec Digest',
        },
        {
          pillar: 'crisis',
          status: 'pending',
          signalCount: 1,
          lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
          influence: 'affects',
          description: 'Negative coverage and risk signals trigger crisis workflows. Sentiment monitoring active.',
          latestSignal: 'Competitor negative coverage detected - monitoring for spillover.',
          actionUrl: '/app/crisis',
          actionLabel: 'View Crisis Radar',
        },
      ],
      orchestrationStatus: 'healthy',
      lastFullSyncAt: now,
    };

    setSituationBrief(mockBrief);
    setRecommendations(mockRecommendations);
    setContinuityLinks(mockContinuity);
    setLoadingIntel(false);
  };

  // S100.1: Fetch journalists via internal route handler
  const fetchJournalists = async (query?: string) => {
    try {
      setLoadingExplorer(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (query) params.set('q', query);
      if (selectedCountry) params.set('country', selectedCountry);
      if (selectedTier) params.set('tier', selectedTier);

      const response = await fetch(`/api/pr/journalists?${params.toString()}`);
      const data = await response.json();

      // Map backend response format to expected format
      if (data.profiles) {
        setJournalists(data.profiles.map((p: { id: string; fullName: string; primaryEmail?: string; primaryOutlet?: string; beat?: string }) => ({
          journalist: {
            id: p.id,
            fullName: p.fullName,
            email: p.primaryEmail,
            location: null,
            isFreelancer: false,
          },
          outlet: p.primaryOutlet ? { name: p.primaryOutlet, tier: null } : null,
          beats: p.beat ? [{ id: '1', name: p.beat }] : [],
        })));
        setTotal(data.total || data.profiles.length);
      }
    } catch (error) {
      console.error('Failed to fetch journalists:', error);
    } finally {
      setLoadingExplorer(false);
    }
  };

  // S100.1: Fetch lists via internal route handler
  const fetchLists = async () => {
    try {
      const response = await fetch('/api/pr/lists');
      const data = await response.json();
      if (data.success && data.data?.items) {
        setLists(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  // S100.1: Fetch list members via internal route handler
  const fetchListMembers = async (listId: string) => {
    try {
      const response = await fetch(`/api/pr/lists/${listId}`);
      const data = await response.json();
      if (data.success && data.data?.item?.members) {
        setListMembers(data.data.item.members);
      }
    } catch (error) {
      console.error('Failed to fetch list members:', error);
    }
  };

  // S100.1: Create list via internal route handler
  const createList = async () => {
    if (!newListName.trim()) return;
    try {
      const response = await fetch('/api/pr/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchLists();
        setShowCreateListModal(false);
        setNewListName('');
        setNewListDescription('');
      }
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  // S100.1: Add to list via internal route handler
  const addToList = async () => {
    if (!selectedList || selectedJournalists.size === 0) return;
    try {
      const response = await fetch(`/api/pr/lists/${selectedList.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalistIds: Array.from(selectedJournalists) }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedJournalists(new Set());
        await fetchListMembers(selectedList.id);
      }
    } catch (error) {
      console.error('Failed to add to list:', error);
    }
  };

  // S100.1: Remove from list via internal route handler
  const removeFromList = async (journalistId: string) => {
    if (!selectedList) return;
    try {
      const response = await fetch(`/api/pr/lists/${selectedList.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalistIds: [journalistId] }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchListMembers(selectedList.id);
      }
    } catch (error) {
      console.error('Failed to remove from list:', error);
    }
  };

  // Toggle selection (preserved)
  const toggleJournalistSelection = (journalistId: string) => {
    const newSelected = new Set(selectedJournalists);
    if (newSelected.has(journalistId)) {
      newSelected.delete(journalistId);
    } else {
      newSelected.add(journalistId);
    }
    setSelectedJournalists(newSelected);
  };

  // Initial load
  useEffect(() => {
    generateIntelligenceData();
    fetchLists();
  }, []);

  // Load explorer data when tab changes
  useEffect(() => {
    if (activeTab === 'explorer' && journalists.length === 0) {
      fetchJournalists();
    }
  }, [activeTab]);

  // Filter change effect (preserved)
  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchJournalists(searchQuery);
    }
  }, [selectedCountry, selectedTier]);

  // List selection effect (preserved)
  useEffect(() => {
    if (selectedList) {
      fetchListMembers(selectedList.id);
    }
  }, [selectedList]);

  // Build header AI reasoning
  const headerReasoningContext: AIReasoningContext = {
    triggerSource: 'PR Intelligence Hub',
    triggerDescription: 'Unified view of media intelligence, coverage tracking, and strategic PR recommendations',
    sourcePillar: 'pr',
    relatedPillars: [
      { pillar: 'content', influence: 'informs', description: 'Coverage trends inform content strategy' },
      { pillar: 'seo', influence: 'informs', description: 'Media mentions drive SEO opportunities' },
      { pillar: 'exec', influence: 'updates', description: 'High-priority signals update executive digest' },
    ],
    confidence: 85,
    nextActions: [
      { label: 'View All Coverage', href: '/app/pr/journalists', priority: 'high' },
      { label: 'Create Pitch', href: '/app/pr/pitches', priority: 'medium' },
    ],
    generatedAt: situationBrief?.generatedAt,
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Hero Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border-subtle bg-gradient-to-b from-slate-3/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand-iris/15 ring-1 ring-brand-iris/20">
                <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">PR Intelligence</h1>
                  <AIDot status={loadingIntel ? 'analyzing' : 'idle'} size="md" />
                </div>
                <p className="text-slate-10 mt-1">
                  Media intelligence, coverage tracking, and strategic recommendations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AIReasoningPopover context={headerReasoningContext} position="bottom" />
              <Link
                href="/app/pr/generator"
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-iris text-white font-medium rounded-lg hover:bg-brand-iris/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Press Release
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-6 border-b border-border-subtle -mb-px">
            {[
              { key: 'overview', label: 'Overview', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )},
              { key: 'explorer', label: 'Media Explorer', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )},
              { key: 'actions', label: 'Quick Actions', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )},
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as PRTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-slate-10 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Situation Brief - Full Width */}
            <PRSituationBrief
              data={situationBrief}
              loading={loadingIntel}
              onRefresh={generateIntelligenceData}
            />

            {/* Two Column: Recommendations + Continuity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommendations - 2/3 */}
              <div className="lg:col-span-2">
                <PRAIRecommendations
                  data={recommendations}
                  loading={loadingIntel}
                />
              </div>

              {/* Continuity Links - 1/3 */}
              <div className="lg:col-span-1">
                <PRContinuityLinks
                  data={continuityLinks}
                  loading={loadingIntel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Media Explorer (Left 2/3) */}
            <div className="lg:col-span-2">
              <div className="panel-card shadow-lg shadow-slate-1/20">
                <div className="p-6">
                  {/* Search and Filters */}
                  <div className="mb-6 space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        fetchJournalists(searchQuery);
                      }}
                      className="flex gap-3"
                    >
                      <input
                        type="text"
                        placeholder="Search journalists by name, email, or bio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field flex-1"
                      />
                      <button type="submit" className="btn-primary">
                        Search
                      </button>
                    </form>

                    <div className="flex gap-4">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="input-field"
                      >
                        <option value="">All Countries</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>

                      <select
                        value={selectedTier}
                        onChange={(e) => setSelectedTier(e.target.value)}
                        className="input-field"
                      >
                        <option value="">All Tiers</option>
                        <option value="top_tier">Top Tier</option>
                        <option value="trade">Trade</option>
                        <option value="niche">Niche</option>
                      </select>
                    </div>
                  </div>

                  {/* Add to List Button */}
                  {selectedJournalists.size > 0 && selectedList && (
                    <div className="mb-4 p-4 bg-brand-iris/10 border border-brand-iris/20 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-medium text-brand-iris">
                        {selectedJournalists.size} journalist(s) selected
                      </span>
                      <button onClick={addToList} className="btn-primary text-sm">
                        Add to &quot;{selectedList.name}&quot;
                      </button>
                    </div>
                  )}

                  {/* Results */}
                  {loadingExplorer ? (
                    <div className="text-center py-12">
                      <AIDot status="analyzing" size="md" />
                      <p className="text-muted mt-3">Loading journalists...</p>
                    </div>
                  ) : journalists.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-10 mb-4">
                        Found {total} journalist{total !== 1 ? 's' : ''}
                      </div>
                      {journalists.map((item) => (
                        <div
                          key={item.journalist.id}
                          className={`p-4 rounded-xl border transition-all ${
                            selectedJournalists.has(item.journalist.id)
                              ? 'border-brand-iris bg-brand-iris/10'
                              : 'border-border-subtle bg-slate-3/20 hover:bg-slate-3/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedJournalists.has(item.journalist.id)}
                              onChange={() => toggleJournalistSelection(item.journalist.id)}
                              className="mt-1 rounded border-slate-6"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white">
                                    {item.journalist.fullName}
                                    {item.journalist.isFreelancer && (
                                      <span className="ml-2 px-2 py-0.5 bg-brand-iris/10 text-brand-iris text-xs rounded-full">
                                        Freelancer
                                      </span>
                                    )}
                                  </h3>
                                  {item.outlet && (
                                    <p className="text-sm text-slate-11 mt-0.5">
                                      {item.outlet.name}
                                      {item.outlet.tier && (
                                        <span className="ml-2 text-xs text-slate-10">
                                          ({item.outlet.tier})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                {item.journalist.location && (
                                  <span className="text-xs text-slate-10">
                                    {item.journalist.location}
                                  </span>
                                )}
                              </div>
                              {item.beats.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {item.beats.map((beat) => (
                                    <span
                                      key={beat.id}
                                      className="px-2 py-0.5 bg-slate-4/60 text-slate-11 text-xs rounded-full"
                                    >
                                      {beat.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.journalist.email && (
                                <p className="text-sm text-slate-10 mt-2">
                                  {item.journalist.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted">
                      No journalists found. Try adjusting your search or filters.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lists Panel (Right 1/3) */}
            <div className="lg:col-span-1">
              <div className="panel-card shadow-lg shadow-slate-1/20 sticky top-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Lists</h2>
                    <button
                      onClick={() => setShowCreateListModal(true)}
                      className="btn-primary text-sm"
                    >
                      Create List
                    </button>
                  </div>

                  {lists.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      {lists.map((list) => (
                        <div
                          key={list.id}
                          onClick={() => setSelectedList(list)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedList?.id === list.id
                              ? 'bg-brand-iris/10 border-2 border-brand-iris'
                              : 'bg-slate-4/40 border-2 border-transparent hover:border-slate-5'
                          }`}
                        >
                          <div className="font-medium text-white text-sm">{list.name}</div>
                          {list.description && (
                            <div className="text-xs text-slate-10 mt-0.5">{list.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-10 text-sm">
                      No lists yet. Create one to get started.
                    </div>
                  )}

                  {selectedList && (
                    <div className="border-t border-border-subtle pt-4">
                      <h3 className="font-semibold text-white mb-3">
                        {selectedList.name} ({listMembers.length})
                      </h3>
                      {listMembers.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {listMembers.map((member) => (
                            <div
                              key={member.journalist.id}
                              className="p-3 bg-slate-4/40 rounded-lg text-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate">
                                    {member.journalist.fullName}
                                  </div>
                                  {member.outlet && (
                                    <div className="text-xs text-slate-10 truncate">
                                      {member.outlet.name}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeFromList(member.journalist.id)}
                                  className="ml-2 text-semantic-danger hover:text-semantic-danger/80 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-10 text-sm">
                          No members yet. Select journalists and add them.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            {/* Create Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Create</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickActionCard
                  title="Press Release Generator"
                  description="AI-powered press release creation with strategic messaging"
                  href="/app/pr/generator"
                  color="iris"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
                <QuickActionCard
                  title="Create Pitch"
                  description="Craft targeted pitches for specific journalists and outlets"
                  href="/app/pr/pitches"
                  color="cyan"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Manage Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Manage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Outreach Campaigns"
                  description="Track and manage ongoing media outreach"
                  href="/app/pr/outreach"
                  color="magenta"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  }
                />
                <QuickActionCard
                  title="Media Lists"
                  description="Organize journalists into targeted lists"
                  href="/app/pr/media-lists"
                  color="amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  }
                />
                <QuickActionCard
                  title="Journalist Discovery"
                  description="Find new journalists relevant to your industry"
                  href="/app/pr/discovery"
                  color="iris"
                  badge="AI"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Analyze Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Analyze</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Deliverability Insights"
                  description="Track email deliverability and engagement"
                  href="/app/pr/deliverability"
                  color="cyan"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
                <QuickActionCard
                  title="Journalist Enrichment"
                  description="AI-enhanced journalist profiles and insights"
                  href="/app/pr/enrichment"
                  color="magenta"
                  badge="AI"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <QuickActionCard
                  title="Journalist Network"
                  description="View journalist relationships and connections"
                  href="/app/pr/journalists"
                  color="amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-slate-1/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="panel-card p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create New List</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Tech Journalists"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list..."
                  rows={3}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateListModal(false);
                  setNewListName('');
                  setNewListDescription('');
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createList}
                disabled={!newListName.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
