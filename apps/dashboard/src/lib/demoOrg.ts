/**
 * Demo Org Utilities (Sprint S98)
 * Helpers for detecting demo orgs and managing guided empty states
 */

/**
 * The canonical name of the demo organization
 * IMPORTANT: Must match the seed migration in 78_seed_pr_demo_data.sql
 */
export const DEMO_ORG_NAME = 'Demo Organization';
export const DEMO_ORG_SLUG = 'demo';

/**
 * Check if an organization is a demo org
 * Checks both name and slug for robustness
 */
export function isDemoOrg(orgName: string | null | undefined, orgSlug?: string | null): boolean {
  return orgName === DEMO_ORG_NAME || orgSlug === DEMO_ORG_SLUG;
}

/**
 * Check if organization should show demo badge
 */
export function shouldShowDemoBadge(orgName: string | null | undefined, orgSlug?: string | null): boolean {
  return isDemoOrg(orgName, orgSlug);
}

/**
 * Get the appropriate empty state message based on org type
 */
export function getEmptyStateMessage(
  orgName: string | null | undefined,
  feature: string,
  orgSlug?: string | null
): { title: string; description: string; action: string } {
  if (isDemoOrg(orgName, orgSlug)) {
    return {
      title: `Demo ${feature}`,
      description: `This is sample data from the demo organization. Create your own organization to get started with real ${feature.toLowerCase()}.`,
      action: 'Create Organization',
    };
  }

  return {
    title: `No ${feature} Yet`,
    description: `Start building your ${feature.toLowerCase()} by adding your first item.`,
    action: `Add ${feature}`,
  };
}

/**
 * Get feature-specific guidance for production orgs
 */
export function getGuidedEmptyState(feature: 'journalists' | 'coverage' | 'pitches' | 'outreach' | 'media') {
  const guidance: Record<string, {
    title: string;
    description: string;
    steps: string[];
    ctaLabel: string;
    ctaHref: string;
  }> = {
    journalists: {
      title: 'Build Your Media Network',
      description: 'Start by adding journalists and media contacts to your network.',
      steps: [
        'Add journalists from your target publications',
        'Import contacts from your existing database',
        'Use discovery to find new relevant journalists',
      ],
      ctaLabel: 'Add First Journalist',
      ctaHref: '/app/pr/discovery',
    },
    coverage: {
      title: 'Track Media Coverage',
      description: 'Monitor mentions of your brand across publications.',
      steps: [
        'Set up media monitoring keywords',
        'Add RSS feeds from target publications',
        'Configure alerts for breaking coverage',
      ],
      ctaLabel: 'Set Up Monitoring',
      ctaHref: '/app/media-monitoring',
    },
    pitches: {
      title: 'Start Pitching',
      description: 'Create and send personalized pitches to journalists.',
      steps: [
        'Build your journalist network first',
        'Craft compelling story angles',
        'Use AI to personalize your pitches',
      ],
      ctaLabel: 'Create First Pitch',
      ctaHref: '/app/pr/journalists',
    },
    outreach: {
      title: 'Automate Outreach',
      description: 'Set up automated outreach sequences for efficient journalist engagement.',
      steps: [
        'Create outreach sequences with multiple touchpoints',
        'Set timing and personalization rules',
        'Track opens, clicks, and replies',
      ],
      ctaLabel: 'Create Sequence',
      ctaHref: '/app/pr/outreach',
    },
    media: {
      title: 'Monitor Media',
      description: 'Stay on top of relevant news and coverage in your industry.',
      steps: [
        'Add RSS feeds from key publications',
        'Set up keyword alerts',
        'Track competitor mentions',
      ],
      ctaLabel: 'Add RSS Feed',
      ctaHref: '/app/media-monitoring',
    },
  };

  return guidance[feature] || guidance.journalists;
}
