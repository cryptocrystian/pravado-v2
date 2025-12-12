/**
 * AI Proactivity Thresholds Hook (Sprint S94)
 *
 * Determines when AI should proactively notify users:
 * - High-signal triggers only (no spam)
 * - Configurable thresholds per pillar
 * - User preference awareness
 *
 * Purpose: "AI should surface information when it matters, not constantly"
 */

import { useMemo, useCallback } from 'react';

// Signal Types
export type SignalCategory = 'risk' | 'opportunity' | 'milestone' | 'change' | 'alert';
export type SignalUrgency = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Signal definition
export interface AISignal {
  id: string;
  category: SignalCategory;
  urgency: SignalUrgency;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  title: string;
  description?: string;
  confidence: number; // 0-100
  timestamp: string;
  sourceSystem: string;
  affectedPillars?: ('pr' | 'content' | 'seo' | 'exec' | 'crisis')[];
  metadata?: Record<string, unknown>;
}

// Threshold configuration per pillar and category
export interface ThresholdConfig {
  // Minimum severity to trigger notification (0-100)
  minimumSeverity: number;
  // Minimum confidence to show (0-100)
  minimumConfidence: number;
  // Cooldown period between notifications (minutes)
  cooldownMinutes: number;
  // Maximum notifications per day
  maxDailyNotifications: number;
}

// Pillar-specific threshold overrides
export interface PillarThresholds {
  pr?: Partial<ThresholdConfig>;
  content?: Partial<ThresholdConfig>;
  seo?: Partial<ThresholdConfig>;
  exec?: Partial<ThresholdConfig>;
  crisis?: Partial<ThresholdConfig>;
}

// Category-specific threshold overrides
export interface CategoryThresholds {
  risk?: Partial<ThresholdConfig>;
  opportunity?: Partial<ThresholdConfig>;
  milestone?: Partial<ThresholdConfig>;
  change?: Partial<ThresholdConfig>;
  alert?: Partial<ThresholdConfig>;
}

// User preferences
export interface AIProactivityPreferences {
  // Master toggle
  enabled: boolean;
  // Override default thresholds
  baseThresholds?: Partial<ThresholdConfig>;
  // Pillar-specific overrides
  pillarOverrides?: PillarThresholds;
  // Category-specific overrides
  categoryOverrides?: CategoryThresholds;
  // Quiet hours (24h format)
  quietHours?: {
    start: number; // 0-23
    end: number; // 0-23
  };
  // Days to suppress (0=Sunday, 6=Saturday)
  quietDays?: number[];
}

// Default thresholds (conservative to avoid spam)
const DEFAULT_THRESHOLDS: ThresholdConfig = {
  minimumSeverity: 60, // Only high+ severity
  minimumConfidence: 70, // Need 70%+ confidence
  cooldownMinutes: 30, // 30 min between similar notifications
  maxDailyNotifications: 20, // Max 20 per day
};

// Default pillar thresholds (crisis is more sensitive)
const DEFAULT_PILLAR_THRESHOLDS: PillarThresholds = {
  crisis: {
    minimumSeverity: 40, // Crisis gets lower threshold
    cooldownMinutes: 15, // Faster notifications
  },
  exec: {
    minimumSeverity: 50, // Exec sees more signals
    minimumConfidence: 65,
  },
};

// Default category thresholds (risks need lower threshold)
const DEFAULT_CATEGORY_THRESHOLDS: CategoryThresholds = {
  risk: {
    minimumSeverity: 50, // Risks get lower threshold
    cooldownMinutes: 20,
  },
  alert: {
    minimumSeverity: 40, // Alerts are important
    cooldownMinutes: 15,
  },
  opportunity: {
    minimumSeverity: 65, // Opportunities need higher bar
    cooldownMinutes: 60,
  },
};

// Urgency to numeric score mapping
const URGENCY_SCORES: Record<SignalUrgency, number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
  info: 20,
};

// Signal evaluation result
export interface SignalEvaluation {
  signal: AISignal;
  shouldNotify: boolean;
  shouldDisplay: boolean;
  reason: string;
  effectiveThreshold: ThresholdConfig;
  score: number;
}

// Hook state
interface ProactivityState {
  lastNotificationTimes: Map<string, number>;
  dailyNotificationCount: number;
  lastResetDate: string;
}

/**
 * Hook to manage AI proactivity thresholds
 */
export function useAIProactivity(preferences?: AIProactivityPreferences) {
  // Build effective thresholds
  const buildEffectiveThreshold = useCallback(
    (pillar: AISignal['pillar'], category: SignalCategory): ThresholdConfig => {
      const base = {
        ...DEFAULT_THRESHOLDS,
        ...preferences?.baseThresholds,
      };

      const pillarOverride = {
        ...DEFAULT_PILLAR_THRESHOLDS[pillar],
        ...preferences?.pillarOverrides?.[pillar],
      };

      const categoryOverride = {
        ...DEFAULT_CATEGORY_THRESHOLDS[category],
        ...preferences?.categoryOverrides?.[category],
      };

      return {
        ...base,
        ...pillarOverride,
        ...categoryOverride,
      };
    },
    [preferences]
  );

  // Check if currently in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!preferences?.quietHours) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Check quiet days
    if (preferences.quietDays?.includes(currentDay)) {
      return true;
    }

    // Check quiet hours
    const { start, end } = preferences.quietHours;
    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      // Handles overnight quiet hours (e.g., 22-6)
      return currentHour >= start || currentHour < end;
    }
  }, [preferences]);

  // Calculate signal score
  const calculateSignalScore = useCallback((signal: AISignal): number => {
    const urgencyScore = URGENCY_SCORES[signal.urgency] || 50;
    const confidenceWeight = signal.confidence / 100;
    const crossPillarBonus = (signal.affectedPillars?.length || 0) * 5;

    // Base score from urgency
    let score = urgencyScore;

    // Weight by confidence
    score *= confidenceWeight;

    // Bonus for cross-pillar impact
    score += crossPillarBonus;

    // Cap at 100
    return Math.min(100, Math.round(score));
  }, []);

  // Evaluate a single signal
  const evaluateSignal = useCallback(
    (signal: AISignal, state?: ProactivityState): SignalEvaluation => {
      const threshold = buildEffectiveThreshold(signal.pillar, signal.category);
      const score = calculateSignalScore(signal);

      // Check if proactivity is disabled
      if (preferences && !preferences.enabled) {
        return {
          signal,
          shouldNotify: false,
          shouldDisplay: true, // Still display, just don't notify
          reason: 'AI proactivity disabled',
          effectiveThreshold: threshold,
          score,
        };
      }

      // Check quiet hours
      if (isInQuietHours()) {
        return {
          signal,
          shouldNotify: false,
          shouldDisplay: true,
          reason: 'In quiet hours',
          effectiveThreshold: threshold,
          score,
        };
      }

      // Check minimum severity
      if (score < threshold.minimumSeverity) {
        return {
          signal,
          shouldNotify: false,
          shouldDisplay: score >= threshold.minimumSeverity * 0.7, // Show if close to threshold
          reason: `Score ${score} below threshold ${threshold.minimumSeverity}`,
          effectiveThreshold: threshold,
          score,
        };
      }

      // Check minimum confidence
      if (signal.confidence < threshold.minimumConfidence) {
        return {
          signal,
          shouldNotify: false,
          shouldDisplay: true,
          reason: `Confidence ${signal.confidence}% below threshold ${threshold.minimumConfidence}%`,
          effectiveThreshold: threshold,
          score,
        };
      }

      // Check cooldown (if state provided)
      if (state) {
        const signalKey = `${signal.pillar}-${signal.category}-${signal.sourceSystem}`;
        const lastNotification = state.lastNotificationTimes.get(signalKey);
        if (lastNotification) {
          const minutesSince = (Date.now() - lastNotification) / 60000;
          if (minutesSince < threshold.cooldownMinutes) {
            return {
              signal,
              shouldNotify: false,
              shouldDisplay: true,
              reason: `In cooldown (${Math.round(threshold.cooldownMinutes - minutesSince)}m remaining)`,
              effectiveThreshold: threshold,
              score,
            };
          }
        }

        // Check daily limit
        if (state.dailyNotificationCount >= threshold.maxDailyNotifications) {
          return {
            signal,
            shouldNotify: false,
            shouldDisplay: true,
            reason: 'Daily notification limit reached',
            effectiveThreshold: threshold,
            score,
          };
        }
      }

      // Signal passes all thresholds
      return {
        signal,
        shouldNotify: true,
        shouldDisplay: true,
        reason: 'Signal meets all thresholds',
        effectiveThreshold: threshold,
        score,
      };
    },
    [buildEffectiveThreshold, calculateSignalScore, isInQuietHours, preferences]
  );

  // Filter and sort signals by priority
  const prioritizeSignals = useCallback(
    (signals: AISignal[], state?: ProactivityState): SignalEvaluation[] => {
      return signals
        .map((signal) => evaluateSignal(signal, state))
        .sort((a, b) => {
          // Sort by: shouldNotify first, then by score
          if (a.shouldNotify !== b.shouldNotify) {
            return a.shouldNotify ? -1 : 1;
          }
          return b.score - a.score;
        });
    },
    [evaluateSignal]
  );

  // Get high-priority signals only (for notifications)
  const getHighPrioritySignals = useCallback(
    (signals: AISignal[], state?: ProactivityState): AISignal[] => {
      return prioritizeSignals(signals, state)
        .filter((e) => e.shouldNotify)
        .map((e) => e.signal);
    },
    [prioritizeSignals]
  );

  // Get displayable signals (for UI)
  const getDisplayableSignals = useCallback(
    (signals: AISignal[], state?: ProactivityState): AISignal[] => {
      return prioritizeSignals(signals, state)
        .filter((e) => e.shouldDisplay)
        .map((e) => e.signal);
    },
    [prioritizeSignals]
  );

  return useMemo(
    () => ({
      evaluateSignal,
      prioritizeSignals,
      getHighPrioritySignals,
      getDisplayableSignals,
      buildEffectiveThreshold,
      isInQuietHours,
      calculateSignalScore,
      DEFAULT_THRESHOLDS,
      URGENCY_SCORES,
    }),
    [
      evaluateSignal,
      prioritizeSignals,
      getHighPrioritySignals,
      getDisplayableSignals,
      buildEffectiveThreshold,
      isInQuietHours,
      calculateSignalScore,
    ]
  );
}

/**
 * Simple utility to check if a signal is high-priority
 */
export function isHighPrioritySignal(signal: AISignal): boolean {
  const urgencyScore = URGENCY_SCORES[signal.urgency] || 50;
  const score = urgencyScore * (signal.confidence / 100);
  return score >= DEFAULT_THRESHOLDS.minimumSeverity;
}

/**
 * Get recommended notification text based on signal
 */
export function getSignalNotificationText(signal: AISignal): { title: string; body: string } {
  const pillarLabels: Record<string, string> = {
    pr: 'PR Intelligence',
    content: 'Content Hub',
    seo: 'SEO',
    exec: 'Executive',
    crisis: 'Crisis',
  };

  const categoryLabels: Record<SignalCategory, string> = {
    risk: 'Risk Alert',
    opportunity: 'Opportunity',
    milestone: 'Milestone',
    change: 'Change Detected',
    alert: 'Alert',
  };

  return {
    title: `${categoryLabels[signal.category]} - ${pillarLabels[signal.pillar]}`,
    body: signal.title,
  };
}

export default useAIProactivity;
