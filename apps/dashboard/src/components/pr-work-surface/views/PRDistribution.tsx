'use client';

/**
 * PR Distribution View - DS 3.0
 *
 * Press release creation + Distribution Decision Matrix.
 * Track 1 (CiteMind AEO) + Track 2 (Legacy Wire).
 *
 * NO autopilot distribution - all sends manual.
 *
 * @see /docs/canon/CITEMIND_SYSTEM.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 *
 * OMNI-TRAY INTEGRATION (TODO):
 * - Dispatch event when scheduled send approaching (action_required, high urgency)
 * - Dispatch event for release approval needed (approval_required)
 * - Dispatch event if scheduled send fails (risk_detected)
 * - See: /contracts/examples/omni-tray-pr-events.json
 */

import { useState, useMemo } from 'react';
import { DistributionDecisionMatrix } from '../components/DistributionDecisionMatrix';
import type { PressRelease, Distribution, DistributionTrack } from '../types';
import {
  buttonStyles,
  prAccent,
} from '../prWorkSurfaceStyles';

// ============================================
// TYPES - Scheduled Sends
// ============================================

interface ScheduledSend {
  id: string;
  type: 'pitch' | 'release';
  targetName: string;
  targetEmail?: string;
  subject: string;
  scheduledFor: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  // Relationship context
  relationshipStage?: 'cold' | 'warm' | 'engaged';
  lastInteraction?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_RELEASES: PressRelease[] = [
  {
    id: 'rel-1',
    headline: 'Pravado Launches AI-Powered PR Intelligence Platform',
    subheadline: 'New platform combines CiteMind technology with traditional PR workflows',
    body: 'Today, Pravado announced the launch of its revolutionary AI-powered PR intelligence platform...',
    boilerplate: 'Pravado is a leading marketing operations platform...',
    mediaContactInfo: 'press@pravado.com',
    status: 'ready',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    schema: { type: 'NewsArticle', generated: true },
  },
  {
    id: 'rel-2',
    headline: 'Q4 2024 Product Update: Enhanced Citation Tracking',
    body: 'We are excited to announce significant improvements to our citation tracking capabilities...',
    status: 'draft',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const MOCK_DISTRIBUTIONS: Distribution[] = [
  {
    id: 'dist-1',
    releaseId: 'rel-old',
    track: 'citemind_aeo',
    status: 'distributed',
    distributedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    citeMindEnabled: true,
    indexNowSent: true,
    citationTrackingEnabled: true,
  },
];

const MOCK_SCHEDULED_SENDS: ScheduledSend[] = [
  {
    id: 'sched-1',
    type: 'pitch',
    targetName: 'Sarah Chen',
    targetEmail: 'sarah.chen@techcrunch.com',
    subject: 'AI-Powered PR: Exclusive Early Look',
    scheduledFor: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours from now
    status: 'scheduled',
    relationshipStage: 'warm',
    lastInteraction: '3 days ago',
  },
  {
    id: 'sched-2',
    type: 'pitch',
    targetName: 'Michael Torres',
    targetEmail: 'mtorres@wired.com',
    subject: 'Thought Leadership: Future of Marketing AI',
    scheduledFor: new Date(Date.now() + 1 * 86400000 + 10 * 3600000).toISOString(), // Tomorrow 10am
    status: 'scheduled',
    relationshipStage: 'cold',
    lastInteraction: '45 days ago',
  },
  {
    id: 'sched-3',
    type: 'pitch',
    targetName: 'Jennifer Wong',
    targetEmail: 'jwong@forbes.com',
    subject: 'Executive Interview Opportunity',
    scheduledFor: new Date(Date.now() + 2 * 86400000 + 14 * 3600000).toISOString(), // Day after tomorrow 2pm
    status: 'scheduled',
    relationshipStage: 'engaged',
    lastInteraction: '1 day ago',
  },
];

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-white/10 text-white/60 border-white/20',
    ready: 'bg-semantic-success/15 text-semantic-success border-semantic-success/30',
    distributed: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
    pending_approval: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30',
    failed: 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30',
  };

  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${colors[status as keyof typeof colors] || colors.draft}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ============================================
// TRACK BADGE
// ============================================

function TrackBadge({ track }: { track: DistributionTrack }) {
  const config = {
    citemind_aeo: {
      bg: 'bg-brand-cyan/15',
      text: 'text-brand-cyan',
      border: 'border-brand-cyan/30',
      label: 'CiteMind AEO',
    },
    legacy_wire: {
      bg: 'bg-semantic-warning/15',
      text: 'text-semantic-warning',
      border: 'border-semantic-warning/30',
      label: 'Traditional Wire',
    },
  };

  const style = config[track];
  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${style.bg} ${style.text} ${style.border}`}>
      {style.label}
    </span>
  );
}

// ============================================
// FEATURE BADGE
// ============================================

function FeatureBadge({ label, variant }: { label: string; variant: 'success' | 'info' }) {
  const styles = {
    success: 'bg-semantic-success/15 text-semantic-success border-semantic-success/30',
    info: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  };

  return (
    <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase rounded border ${styles[variant]}`}>
      {label}
    </span>
  );
}

// ============================================
// MINI CALENDAR (Week View)
// ============================================

function MiniCalendar({ scheduledSends, onDayClick }: { scheduledSends: ScheduledSend[]; onDayClick?: (date: Date) => void }) {
  const today = new Date();
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const sendsOnDay = scheduledSends.filter((s) => {
        const schedDate = new Date(s.scheduledFor);
        return schedDate.toDateString() === date.toDateString();
      });
      result.push({ date, sends: sendsOnDay, isToday: i === 0 });
    }
    return result;
  }, [scheduledSends, today]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
          Next 7 Days
        </span>
        <span className="text-[13px] text-white/40">
          {scheduledSends.filter((s) => s.status === 'scheduled').length} scheduled
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, sends, isToday }, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onDayClick?.(date)}
            className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${
              isToday
                ? 'bg-brand-magenta/15 border border-brand-magenta/30'
                : sends.length > 0
                ? 'bg-brand-cyan/10 border border-brand-cyan/20 hover:border-brand-cyan/40'
                : 'bg-[#0A0A0F] border border-transparent hover:border-[#1A1A24]'
            }`}
          >
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              {dayNames[date.getDay()]}
            </span>
            <span className={`text-sm font-semibold ${isToday ? 'text-brand-magenta' : 'text-white/85'}`}>
              {date.getDate()}
            </span>
            {sends.length > 0 && (
              <span className={`mt-1 w-1.5 h-1.5 rounded-full ${
                isToday ? 'bg-brand-magenta' : 'bg-brand-cyan'
              }`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SCHEDULED SENDS LIST
// ============================================

function ScheduledSendsList({
  sends,
  onCancel,
  onReschedule,
}: {
  sends: ScheduledSend[];
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}) {
  const sortedSends = useMemo(
    () => [...sends].sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
    [sends]
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24 && diffDays === 0) {
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / 60000);
        return `In ${diffMins}m`;
      }
      return `In ${diffHours}h`;
    } else if (diffDays === 1) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (sends.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-[#2A2A36] bg-[#0D0D12]/50">
        <p className="text-sm text-white/55">No scheduled sends</p>
        <p className="text-[13px] text-white/40 mt-1">Use "Send Later" to schedule outreach</p>
      </div>
    );
  }

  // Relationship stage styling
  const stageStyle = (stage: string) => {
    const styles: Record<string, string> = {
      cold: 'text-white/40',
      warm: 'text-semantic-warning',
      engaged: 'text-semantic-success',
    };
    return styles[stage] || 'text-white/40';
  };

  return (
    <div className="space-y-2">
      {sortedSends.map((send) => (
        <div
          key={send.id}
          className="p-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24] hover:border-[#2A2A36] transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                  send.type === 'pitch'
                    ? 'bg-brand-magenta/15 text-brand-magenta'
                    : 'bg-brand-iris/15 text-brand-iris'
                }`}>
                  {send.type}
                </span>
                <span className="text-[13px] text-brand-cyan font-medium">
                  {formatTime(send.scheduledFor)}
                </span>
              </div>
              <p className="text-sm text-white/85 truncate">{send.subject}</p>
              <p className="text-[13px] text-white/50 truncate">To: {send.targetName}</p>
              {/* Relationship context */}
              {send.relationshipStage && (
                <div className="flex items-center gap-1.5 mt-1 text-[13px] text-white/30">
                  <span className={stageStyle(send.relationshipStage)}>{send.relationshipStage}</span>
                  {send.lastInteraction && (
                    <>
                      <span>·</span>
                      <span>{send.lastInteraction}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onReschedule?.(send.id)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Reschedule"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onCancel?.(send.id)}
                className="p-1.5 text-white/40 hover:text-semantic-danger hover:bg-semantic-danger/10 rounded transition-colors"
                title="Cancel"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// SEND LATER DATETIME PICKER
// ============================================

function SendLaterPicker({
  isOpen,
  onClose,
  onSchedule,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');

  if (!isOpen) return null;

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const date = new Date(selectedDate);
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      onSchedule(date);
      onClose();
    }
  };

  // Generate time options in 30-minute increments
  const timeOptions = [];
  for (let h = 6; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm p-6 bg-[#0D0D12] border border-[#1A1A24] rounded-2xl shadow-elev-3">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Schedule Send</h3>
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

        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
              Date
            </label>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white focus:outline-none focus:border-brand-magenta/50 transition-colors"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
              Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white focus:outline-none focus:border-brand-magenta/50 transition-colors"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[13px] text-white/40">
            Note: Send will be added to queue. Manual confirmation required before actual delivery.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!selectedDate}
            className={`flex-1 ${buttonStyles.primary} ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Schedule Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRDistribution() {
  const [releases] = useState<PressRelease[]>(MOCK_RELEASES);
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null);
  const [, setShowComposer] = useState(false);
  const [scheduledSends, setScheduledSends] = useState<ScheduledSend[]>(MOCK_SCHEDULED_SENDS);
  const [showSendLaterPicker, setShowSendLaterPicker] = useState(false);

  const handleDistribute = (tracks: DistributionTrack[]) => {
    // In real implementation, this would call the API
    console.log('Distributing to tracks:', tracks);
    alert(`Distribution initiated for tracks: ${tracks.join(', ')}`);
  };

  const handleCancelScheduledSend = (id: string) => {
    setScheduledSends((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReschedule = (id: string) => {
    console.log('Reschedule:', id);
    setShowSendLaterPicker(true);
  };

  const handleScheduleSend = (date: Date) => {
    console.log('New scheduled send at:', date);
    // In real implementation, this would update the scheduled send
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Distribution</h2>
          <p className="text-[13px] text-white/40 mt-0.5">Amplify your message with precision timing</p>
        </div>
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className={buttonStyles.primary}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Release
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Release List */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Press Releases
          </h3>

          <div className="space-y-3">
            {releases.map((release) => (
              <button
                key={release.id}
                type="button"
                onClick={() => setSelectedRelease(release)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRelease?.id === release.id
                    ? 'border-brand-magenta/50 bg-brand-magenta/5 ring-1 ring-brand-magenta/30'
                    : 'border-[#1A1A24] bg-[#0D0D12] hover:border-[#2A2A36] hover:bg-[#111116]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <StatusBadge status={release.status} />
                  {release.schema?.generated && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                      Schema
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-white/90 text-sm line-clamp-2 mb-1">
                  {release.headline}
                </h4>
                <p className="text-[13px] text-white/50">
                  Updated {new Date(release.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}

            {releases.length === 0 && (
              <div className="p-8 text-center rounded-xl border border-dashed border-[#2A2A36] bg-[#0D0D12]/50">
                <p className="text-sm text-white/55">No press releases yet</p>
                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="mt-2 text-sm text-brand-magenta hover:underline"
                >
                  Create your first release
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Distribution Matrix */}
        <div className="lg:col-span-6">
          {selectedRelease ? (
            <div className="space-y-6">
              {/* Selected Release Preview */}
              <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <StatusBadge status={selectedRelease.status} />
                    <h3 className="text-xl font-semibold text-white mt-2">
                      {selectedRelease.headline}
                    </h3>
                    {selectedRelease.subheadline && (
                      <p className="text-sm text-white/55 mt-1">{selectedRelease.subheadline}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={buttonStyles.tertiary}
                  >
                    Edit Release
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[13px] text-white/50">
                  <span>Created {new Date(selectedRelease.createdAt).toLocaleDateString()}</span>
                  {selectedRelease.schema?.generated && (
                    <span className="flex items-center gap-1 text-brand-cyan">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      NewsArticle schema ready
                    </span>
                  )}
                </div>
              </div>

              {/* Distribution Decision Matrix */}
              {selectedRelease.status === 'ready' ? (
                <DistributionDecisionMatrix
                  releaseId={selectedRelease.id}
                  onDistribute={handleDistribute}
                />
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#2A2A36] bg-[#0D0D12]/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#13131A] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/55 mb-2">
                    This release is in <strong className="text-white">{selectedRelease.status}</strong> status
                  </p>
                  <p className="text-[13px] text-white/40">
                    Mark it as "ready" to enable distribution options
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center p-12 rounded-xl border border-dashed border-[#2A2A36] bg-[#0D0D12]/50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#13131A] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <p className="text-sm text-white/55 mb-2">Select a press release to distribute</p>
                <p className="text-[13px] text-white/40">
                  Choose from existing releases or create a new one
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Scheduled Sends Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Scheduled Sends
            </h3>
            <button
              type="button"
              onClick={() => setShowSendLaterPicker(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${prAccent.bg} ${prAccent.text} hover:bg-brand-magenta/20`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Send Later
            </button>
          </div>

          {/* Mini Calendar */}
          <MiniCalendar scheduledSends={scheduledSends} />

          {/* Scheduled Sends List */}
          <div className="space-y-2">
            <span className="text-[13px] text-white/50">Upcoming</span>
            <ScheduledSendsList
              sends={scheduledSends.filter((s) => s.status === 'scheduled')}
              onCancel={handleCancelScheduledSend}
              onReschedule={handleReschedule}
            />
          </div>

          {/* Manual Send Notice */}
          <div className="p-3 rounded-lg bg-semantic-warning/5 border border-semantic-warning/20">
            <p className="text-[13px] text-semantic-warning font-medium">
              Manual Confirmation Required
            </p>
            <p className="text-[13px] text-white/50 mt-0.5">
              Scheduled sends require manual approval before delivery. No bulk send.
            </p>
          </div>
        </div>
      </div>

      {/* Send Later Picker Modal */}
      <SendLaterPicker
        isOpen={showSendLaterPicker}
        onClose={() => setShowSendLaterPicker(false)}
        onSchedule={handleScheduleSend}
      />

      {/* Recent Distributions */}
      <div className="mt-8">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-4">
          Recent Distributions
        </h3>

        <div className="overflow-hidden rounded-xl border border-[#1A1A24]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#13131A]">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Release
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Track
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Distributed
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Features
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A24]">
              {MOCK_DISTRIBUTIONS.length > 0 ? (
                MOCK_DISTRIBUTIONS.map((dist) => (
                  <tr key={dist.id} className="hover:bg-[#111116] transition-colors">
                    <td className="px-4 py-3 text-sm text-white/85">
                      Release #{dist.releaseId}
                    </td>
                    <td className="px-4 py-3">
                      <TrackBadge track={dist.track} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dist.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white/55">
                      {dist.distributedAt
                        ? new Date(dist.distributedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {dist.indexNowSent && (
                          <FeatureBadge label="IndexNow" variant="success" />
                        )}
                        {dist.citationTrackingEnabled && (
                          <FeatureBadge label="Citations" variant="info" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/55">
                    No distributions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
