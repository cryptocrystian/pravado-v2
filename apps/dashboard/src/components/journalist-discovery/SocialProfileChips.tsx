/**
 * Social Profile Chips Component (Sprint S48.2)
 * Displays social media profile links as interactive chips
 */

import type { SocialProfileLinks } from '@pravado/types';

interface SocialProfileChipsProps {
  socialLinks: SocialProfileLinks;
  size?: 'sm' | 'md';
  maxDisplay?: number;
  clickable?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

const platformColors: Record<string, string> = {
  twitter: 'bg-sky-100 text-sky-800',
  linkedin: 'bg-blue-100 text-blue-800',
  mastodon: 'bg-purple-100 text-purple-800',
  bluesky: 'bg-indigo-100 text-indigo-800',
  website: 'bg-gray-100 text-gray-800',
};

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  linkedin: 'in',
  mastodon: '🦣',
  bluesky: '🦋',
  website: '🌐',
};

export function SocialProfileChips({
  socialLinks,
  size = 'md',
  maxDisplay = 5,
  clickable = true,
}: SocialProfileChipsProps) {
  const platforms = Object.entries(socialLinks || {}).filter(([_, url]) => url);

  if (platforms.length === 0) {
    return (
      <span className="text-sm text-gray-400 italic">No social profiles</span>
    );
  }

  const displayPlatforms = platforms.slice(0, maxDisplay);
  const remainingCount = platforms.length - maxDisplay;

  const renderChip = (platform: string, url: string) => {
    const colorClass = platformColors[platform] || 'bg-gray-100 text-gray-800';
    const icon = platformIcons[platform] || '•';
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);

    const chipContent = (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full ${colorClass} ${sizeClasses[size]} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </span>
    );

    if (clickable) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {chipContent}
        </a>
      );
    }

    return chipContent;
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayPlatforms.map(([platform, url]) => (
        <div key={platform}>{renderChip(platform, url as string)}</div>
      ))}
      {remainingCount > 0 && (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-600 ${sizeClasses[size]}`}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
