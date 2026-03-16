'use client';

import {
  EnvelopeSimple,
  Phone,
  ChartBar,
  TwitterLogo,
  LinkedinLogo,
  CheckCircle,
  PencilSimple,
} from '@phosphor-icons/react';
import type { Journalist } from './pr-mock-data';
import { citationBadgeConfig, relationshipDotConfig } from './pr-mock-data';

interface JournalistProfileProps {
  journalist: Journalist;
  onNewPitch?: () => void;
}

export function JournalistProfile({ journalist, onNewPitch }: JournalistProfileProps) {
  const citBadge = citationBadgeConfig[journalist.aiCitation];
  const relDot = relationshipDotConfig[journalist.relationship];

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ── Profile Header ────────────────────────────── */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-brand-magenta/15 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-brand-magenta">{journalist.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">{journalist.name}</h2>
          <p className="text-sm text-white/70">
            {journalist.jobTitle} &middot; {journalist.publication}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-white/45">{journalist.email}</span>
            {journalist.verified && (
              <span className="flex items-center gap-1 text-xs bg-semantic-success/10 text-semantic-success px-1.5 py-0.5 rounded-full">
                <CheckCircle size={10} weight="fill" />
                Verified
              </span>
            )}
          </div>
          {(journalist.socialTwitter || journalist.socialLinkedin) && (
            <div className="flex items-center gap-3 mt-1.5">
              {journalist.socialTwitter && (
                <span className="flex items-center gap-1 text-xs text-brand-magenta">
                  <TwitterLogo size={12} />
                  {journalist.socialTwitter}
                </span>
              )}
              {journalist.socialLinkedin && (
                <span className="flex items-center gap-1 text-xs text-brand-magenta">
                  <LinkedinLogo size={12} />
                  LinkedIn
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Beats ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {journalist.beats.map((beat) => (
          <span key={beat} className="bg-slate-3 text-white/70 text-xs px-2 py-1 rounded-full">
            {beat}
          </span>
        ))}
      </div>

      {/* ── AI Citation Intelligence ──────────────────── */}
      {journalist.citationStats && (
        <div className="bg-brand-magenta/5 border border-brand-magenta/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-magenta">
              AI Citation Intelligence
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${citBadge.bg} ${citBadge.text}`}>
              {journalist.aiCitation.toUpperCase()} &uarr;
            </span>
          </div>
          <p className="text-sm text-white/70 mb-3">{journalist.citationStats.description}</p>
          <div className="flex items-center gap-4 text-xs text-white/45">
            <span>{journalist.citationStats.totalCitations} citations</span>
            <span>{journalist.citationStats.aiEngines} AI engines</span>
            <span>Top article cited {journalist.citationStats.topArticleCitations}x</span>
          </div>
        </div>
      )}

      {/* ── Relationship ──────────────────────────────── */}
      {journalist.relationshipStats && (
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3">
            Relationship
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${relDot}`} />
            <span className="text-sm text-white capitalize">{journalist.relationship}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45 mb-3">
            <span>Owned by: {journalist.relationshipStats.owner}</span>
            <span>Last contact: {journalist.relationshipStats.lastContact}</span>
            <span>Interactions: {journalist.relationshipStats.totalInteractions}</span>
            <span>Coverage: {journalist.relationshipStats.coverageReceived} articles</span>
          </div>
          {/* Warmth bar */}
          <div className="w-full h-1.5 bg-slate-4 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-magenta transition-all duration-500"
              style={{ width: `${journalist.relationshipStats.warmthScore}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Recent Articles ───────────────────────────── */}
      {journalist.recentArticles && journalist.recentArticles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3">
            Recent Articles
          </h3>
          <div className="space-y-2">
            {journalist.recentArticles.map((article, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-white/30 text-xs mt-0.5">&bull;</span>
                <div>
                  <span className="text-sm text-white hover:text-brand-magenta cursor-pointer transition-colors">
                    {article.title}
                  </span>
                  <span className="text-xs text-white/30 ml-2">{article.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-brand-magenta mt-2 hover:text-brand-magenta/80 transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {/* ── Activity Timeline ─────────────────────────── */}
      {journalist.activityTimeline && journalist.activityTimeline.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3">
            Team Activity
          </h3>
          <div className="relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-[3px] top-1 bottom-1 w-0.5 bg-brand-magenta/20" />

            {journalist.activityTimeline.map((entry, i) => (
              <div key={i} className="relative pb-3 last:pb-0">
                {/* Dot */}
                <div className={`absolute left-[-14px] top-1 w-2 h-2 rounded-full ${
                  entry.type === 'replied' ? 'bg-brand-magenta' : 'bg-white/30'
                }`} />
                <div className="flex items-start gap-2">
                  <span className="text-xs text-white/30 flex-shrink-0 w-12">{entry.date}</span>
                  <span className={`text-sm ${
                    entry.type === 'replied' ? 'text-white' : 'text-white/70'
                  }`}>
                    {entry.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              className="text-xs text-brand-magenta hover:text-brand-magenta/80 transition-colors"
            >
              + Log activity
            </button>
            <button
              type="button"
              className="text-xs text-brand-magenta hover:text-brand-magenta/80 transition-colors"
            >
              + Add note
            </button>
          </div>
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────── */}
      {journalist.notes && (
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3">
            Notes
          </h3>
          <div className="bg-slate-2 border border-slate-4 rounded-xl p-3">
            <p className="text-sm text-white/70 italic">{journalist.notes}</p>
            <div className="text-right mt-2">
              <button
                type="button"
                className="text-xs text-brand-magenta flex items-center gap-1 ml-auto hover:text-brand-magenta/80 transition-colors"
              >
                <PencilSimple size={10} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Buttons ────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-4">
        <button
          type="button"
          onClick={onNewPitch}
          className="flex items-center gap-1.5 bg-brand-magenta text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-magenta/90 shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-colors"
        >
          <EnvelopeSimple size={14} />
          New Pitch
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 bg-slate-3 border border-slate-4 rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-slate-4 transition-colors"
        >
          <Phone size={14} />
          Log Call
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 bg-slate-3 border border-slate-4 rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-slate-4 transition-colors"
        >
          <ChartBar size={14} />
          View Coverage
        </button>
      </div>
    </div>
  );
}
