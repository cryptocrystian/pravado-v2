/**
 * Journalist Profile Detail Page (Sprint S97)
 * Shows full profile with activity history and relationship timeline
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as journalistGraphApi from '@/lib/journalistGraphApi';
import {
  getJournalistOutreachHistory,
  generateDraft,
  sendPitch,
  type JournalistOutreachHistory,
  type GeneratedDraft,
  type GenerateDraftInput,
} from '@/lib/prOutreachApi';

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

interface Activity {
  id: string;
  activityType: string;
  sourceSystem: string;
  activityData: Record<string, unknown>;
  sentiment: string | null;
  occurredAt: string;
}

export default function JournalistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const journalistId = params?.id as string;

  const [profile, setProfile] = useState<JournalistProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [outreachHistory, setOutreachHistory] = useState<JournalistOutreachHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Draft state (S98)
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<GeneratedDraft | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [sendingPitch, setSendingPitch] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (journalistId) {
      loadProfile();
    }
  }, [journalistId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const profileResponse = await journalistGraphApi.getProfile(journalistId);
      if (profileResponse.success) {
        setProfile(profileResponse.data);
      } else {
        setError('Profile not found');
        return;
      }

      // Load activities
      const activitiesResponse = await journalistGraphApi.listActivities({
        journalistId,
        limit: 20,
      });
      if (activitiesResponse.success) {
        setActivities(activitiesResponse.data.activities || []);
      }

      // Load outreach history (S98)
      try {
        const historyData = await getJournalistOutreachHistory(journalistId);
        setOutreachHistory(historyData);
      } catch {
        // Outreach history is optional - don't fail the whole page
        console.log('Could not load outreach history');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityType = (type: string): string => {
    const typeMap: Record<string, string> = {
      coverage_published: 'Published Coverage',
      pitch_sent: 'Pitch Sent',
      outreach_email: 'Outreach Email',
      email_opened: 'Email Opened',
      email_clicked: 'Email Clicked',
      email_replied: 'Reply Received',
      mention_detected: 'Mention Detected',
    };
    return typeMap[type] || type.replace(/_/g, ' ');
  };

  const getSentimentColor = (sentiment: string | null): string => {
    if (sentiment === 'positive') return 'text-green-500';
    if (sentiment === 'negative') return 'text-red-500';
    return 'text-slate-400';
  };

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{Math.round(value * 100)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className="bg-brand-iris h-2 rounded-full transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  // Generate AI draft (S98)
  const handleGenerateDraft = async (action: GenerateDraftInput['action']) => {
    if (!journalistId) return;

    setDraftLoading(true);
    setDraftError(null);
    setShowDraftEditor(true);
    setSendSuccess(false);

    try {
      const draft = await generateDraft({
        journalistId,
        action,
      });
      setCurrentDraft(draft);
      setEditedSubject(draft.subject);
      setEditedBody(draft.bodyText);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate draft';
      setDraftError(message);
    } finally {
      setDraftLoading(false);
    }
  };

  // Send pitch (S98)
  const handleSendPitch = async () => {
    if (!journalistId || !editedSubject.trim() || !editedBody.trim()) return;

    setSendingPitch(true);
    setDraftError(null);

    try {
      // Convert plain text to HTML for bodyHtml
      const bodyHtml = editedBody
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '')
        .filter(Boolean)
        .join('\n');

      await sendPitch({
        journalistId,
        subject: editedSubject,
        bodyHtml,
        bodyText: editedBody,
      });

      setSendSuccess(true);
      // Refresh outreach history
      const historyData = await getJournalistOutreachHistory(journalistId);
      setOutreachHistory(historyData);

      // Close editor after success
      setTimeout(() => {
        setShowDraftEditor(false);
        setCurrentDraft(null);
        setSendSuccess(false);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send pitch';
      setDraftError(message);
    } finally {
      setSendingPitch(false);
    }
  };

  // Close draft editor
  const handleCloseDraftEditor = () => {
    setShowDraftEditor(false);
    setCurrentDraft(null);
    setDraftError(null);
    setSendSuccess(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-3 rounded" />
          <div className="h-4 w-48 bg-slate-3 rounded" />
          <div className="h-64 bg-slate-3 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-1 p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400">Error</h2>
          <p className="text-red-300 mt-2">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-slate-3 text-white rounded-lg hover:bg-slate-4 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const metadata = profile.metadata as Record<string, unknown> || {};
  const topics = (metadata.topics as string[]) || [];
  const articlesCount = (metadata.articles_count as number) || 0;

  return (
    <div className="min-h-screen bg-slate-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-iris/20 to-brand-cyan/10 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href="/app/pr/journalists"
            className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Journalists
          </Link>

          <div className="flex items-start justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{profile.fullName}</h1>
              <p className="text-slate-300 mt-1">
                {profile.primaryOutlet && <span>{profile.primaryOutlet}</span>}
                {profile.beat && <span className="text-slate-400"> &middot; {profile.beat}</span>}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleGenerateDraft('pitch')}
                disabled={draftLoading}
                className="px-4 py-2 bg-brand-iris text-white rounded-lg hover:bg-brand-iris/80 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Create Pitch
              </button>
              <button
                onClick={() => handleGenerateDraft('respond')}
                disabled={draftLoading}
                className="px-4 py-2 bg-slate-3 text-white rounded-lg hover:bg-slate-4 transition-colors border border-border-subtle flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Draft Response
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Draft Editor (S98) */}
      {showDraftEditor && (
        <div className="bg-slate-2 border-b border-border-subtle">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-iris/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI-Generated Draft</h3>
                  {currentDraft && (
                    <p className="text-sm text-slate-400">
                      Generated for {currentDraft.journalist.name}
                      {currentDraft.journalist.outlet && ` at ${currentDraft.journalist.outlet}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseDraftEditor}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {draftLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-iris border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400">Generating personalized draft...</p>
                </div>
              </div>
            )}

            {draftError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400">{draftError}</p>
              </div>
            )}

            {sendSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-green-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pitch sent successfully!
                </p>
              </div>
            )}

            {currentDraft && !draftLoading && !sendSuccess && (
              <div className="space-y-4">
                {/* AI Reasoning */}
                {currentDraft.reasoning && (
                  <div className="bg-brand-iris/5 border border-brand-iris/20 rounded-lg p-3">
                    <p className="text-sm text-brand-iris/80">
                      <span className="font-medium">AI Approach:</span> {currentDraft.reasoning}
                    </p>
                  </div>
                )}

                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-3 border border-border-subtle rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-iris/50"
                    placeholder="Email subject..."
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-3 border border-border-subtle rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-iris/50 resize-none font-mono text-sm"
                    placeholder="Email body..."
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleGenerateDraft(currentDraft ? 'pitch' : 'pitch')}
                    disabled={draftLoading}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseDraftEditor}
                      className="px-4 py-2 bg-slate-3 text-white rounded-lg hover:bg-slate-4 transition-colors border border-border-subtle"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendPitch}
                      disabled={sendingPitch || !editedSubject.trim() || !editedBody.trim()}
                      className="px-6 py-2 bg-brand-iris text-white rounded-lg hover:bg-brand-iris/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingPitch ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Pitch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Primary Email</label>
                  <p className="text-white font-medium">{profile.primaryEmail}</p>
                </div>
                {profile.twitterHandle && (
                  <div>
                    <label className="text-slate-400 text-sm">Twitter</label>
                    <a
                      href={`https://twitter.com/${profile.twitterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline block"
                    >
                      {profile.twitterHandle}
                    </a>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <div>
                    <label className="text-slate-400 text-sm">LinkedIn</label>
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline block"
                    >
                      View Profile
                    </a>
                  </div>
                )}
                {profile.secondaryEmails && profile.secondaryEmails.length > 0 && (
                  <div>
                    <label className="text-slate-400 text-sm">Secondary Emails</label>
                    <p className="text-slate-300">{profile.secondaryEmails.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Topics / Beats */}
            {topics.length > 0 && (
              <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Coverage Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-brand-iris/10 text-brand-iris rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Relationship Timeline</h2>
              {activities.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 pb-4 border-b border-border-subtle last:border-0"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-brand-iris flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {formatActivityType(activity.activityType)}
                          </span>
                          <span className={`text-sm ${getSentimentColor(activity.sentiment)}`}>
                            {activity.sentiment || 'neutral'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          {new Date(activity.occurredAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {activity.activityData && Object.keys(activity.activityData).length > 0 && (
                          <div className="mt-2 text-sm text-slate-300">
                            {(activity.activityData as Record<string, string>).article_title && (
                              <p>Article: {(activity.activityData as Record<string, string>).article_title}</p>
                            )}
                            {(activity.activityData as Record<string, string>).pitch_subject && (
                              <p>Subject: {(activity.activityData as Record<string, string>).pitch_subject}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outreach History (S98) */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Outreach History</h2>
                {outreachHistory?.engagement && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-400">
                      {outreachHistory.engagement.totalOpened}/{outreachHistory.engagement.totalSent} opened
                    </span>
                    <span className="text-brand-cyan">
                      {outreachHistory.engagement.totalReplied} replies
                    </span>
                  </div>
                )}
              </div>

              {!outreachHistory || outreachHistory.messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No outreach emails sent yet</p>
                  <Link
                    href={`/app/pr/outreach?journalistId=${profile.id}&name=${encodeURIComponent(profile.fullName)}`}
                    className="inline-block mt-3 px-4 py-2 bg-brand-iris text-white rounded-lg hover:bg-brand-iris/80 transition-colors"
                  >
                    Send First Pitch
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {outreachHistory.messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start gap-3 p-3 bg-slate-3/50 rounded-lg border border-border-subtle"
                    >
                      <div className="flex-shrink-0">
                        {message.repliedAt ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </div>
                        ) : message.openedAt ? (
                          <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-4/50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{message.subject}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          {message.sentAt && (
                            <span>
                              Sent {new Date(message.sentAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          {message.openedAt && (
                            <span className="text-brand-cyan">• Opened</span>
                          )}
                          {message.clickedAt && (
                            <span className="text-purple-400">• Clicked</span>
                          )}
                          {message.repliedAt && (
                            <span className="text-green-400">• Replied</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Engagement Scores */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Engagement Scores</h2>
              <div className="space-y-4">
                <ScoreBar label="Engagement" value={profile.engagementScore} />
                <ScoreBar label="Responsiveness" value={profile.responsivenessScore} />
                <ScoreBar label="Relevance" value={profile.relevanceScore} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Articles Written</span>
                  <span className="text-white font-medium">{articlesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Activity</span>
                  <span className="text-white font-medium">
                    {profile.lastActivityAt
                      ? new Date(profile.lastActivityAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profile Created</span>
                  <span className="text-white font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
