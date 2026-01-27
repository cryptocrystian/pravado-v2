'use client';

/**
 * EVI Forecast Panel
 *
 * 30-day EVI projection with scenario toggles.
 * Shows baseline forecast and impact of planned actions.
 *
 * @see /docs/canon/EVI_SPEC.md
 */

import { useState, useMemo } from 'react';
import type { EVIForecast, ForecastScenario, EVIDriverType } from './types';

interface EVIForecastPanelProps {
  forecast: EVIForecast | null;
  isLoading?: boolean;
}

// Driver colors for scenario badges
const driverColors: Record<EVIDriverType, string> = {
  visibility: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
  authority: 'text-brand-iris bg-brand-iris/10 border-brand-iris/30',
  momentum: 'text-brand-magenta bg-brand-magenta/10 border-brand-magenta/30',
};

// Scenario toggle card
function ScenarioCard({
  scenario,
  isActive,
  onToggle,
}: {
  scenario: ForecastScenario;
  isActive: boolean;
  onToggle: () => void;
}) {
  const deltaColor = scenario.delta_evi >= 0 ? 'text-semantic-success' : 'text-semantic-danger';

  return (
    <button
      onClick={onToggle}
      className={`
        w-full p-3 rounded-lg border text-left transition-all
        ${isActive
          ? 'bg-brand-cyan/5 border-brand-cyan/30'
          : 'bg-[#0A0A0F] border-[#1A1A24] hover:border-[#2A2A34]'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
              {scenario.label}
            </span>
            <span className={`text-xs font-bold ${deltaColor}`}>
              {scenario.delta_evi >= 0 ? '+' : ''}{scenario.delta_evi.toFixed(1)} pts
            </span>
          </div>
          <p className="text-[13px] text-white/50 line-clamp-2">{scenario.description}</p>
          <div className="flex gap-1.5 mt-2">
            {scenario.drivers.map((driver) => (
              <span
                key={driver}
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${driverColors[driver]}`}
              >
                {driver}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all
            ${isActive
              ? 'bg-brand-cyan border-brand-cyan'
              : 'border-white/30'
            }
          `}
        >
          {isActive && (
            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

// Simple forecast bar visualization
function ForecastBar({
  label,
  low,
  expected,
  high,
  current,
}: {
  label: string;
  low: number;
  expected: number;
  high: number;
  current: number;
}) {
  const range = high - low;
  const expectedPct = ((expected - low) / range) * 100;
  const currentPct = ((current - low) / range) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/50">{label}</span>
        <span className="text-sm font-bold text-white">{expected.toFixed(1)}</span>
      </div>
      <div className="relative h-2 bg-[#1A1A24] rounded-full overflow-hidden">
        {/* Range bar */}
        <div
          className="absolute h-full bg-brand-cyan/30 rounded-full"
          style={{ left: '0%', width: '100%' }}
        />
        {/* Expected marker */}
        <div
          className="absolute h-full w-1 bg-brand-cyan rounded-full"
          style={{ left: `${Math.min(expectedPct, 100)}%` }}
        />
        {/* Current position marker */}
        <div
          className="absolute -top-0.5 w-2 h-3 bg-white rounded-sm"
          style={{ left: `${Math.min(Math.max(currentPct, 0), 100)}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-white/30">
        <span>{low.toFixed(0)}</span>
        <span>{high.toFixed(0)}</span>
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-6 bg-[#1A1A24] rounded animate-pulse w-1/3" />
      <div className="h-16 bg-[#1A1A24] rounded animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#1A1A24] rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function EVIForecastPanel({ forecast, isLoading }: EVIForecastPanelProps) {
  const [activeScenarios, setActiveScenarios] = useState<Set<string>>(
    () => new Set(forecast?.scenarios.filter((s) => s.is_active).map((s) => s.id) || [])
  );

  // Calculate forecast with active scenarios
  const projectedForecast = useMemo(() => {
    if (!forecast) return null;

    const activeDeltas = forecast.scenarios
      .filter((s) => activeScenarios.has(s.id))
      .reduce((sum, s) => sum + s.delta_evi, 0);

    return {
      baseline: forecast.baseline,
      withScenarios: {
        low: Math.min(forecast.baseline.low + activeDeltas - 2, 100),
        expected: Math.min(forecast.baseline.expected + activeDeltas, 100),
        high: Math.min(forecast.baseline.high + activeDeltas + 2, 100),
      },
      totalDelta: activeDeltas,
    };
  }, [forecast, activeScenarios]);

  const toggleScenario = (id: string) => {
    setActiveScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!forecast || !projectedForecast) {
    return (
      <div className="p-4 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#1A1A24] flex items-center justify-center">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm text-white/50">No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-semibold">
            30-Day Forecast
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-iris/10 text-brand-iris border border-brand-iris/30">
            BETA
          </span>
        </div>
        <span className="text-xs text-white/40">
          Updated {new Date(forecast.updated_at).toLocaleDateString()}
        </span>
      </div>

      {/* Current vs Projected */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
          <div className="text-[11px] text-white/50 mb-1">Current EVI</div>
          <div className="text-2xl font-bold text-white">{forecast.current_score.toFixed(1)}</div>
        </div>
        <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg">
          <div className="text-[11px] text-brand-cyan mb-1">Projected EVI</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-cyan">
              {projectedForecast.withScenarios.expected.toFixed(1)}
            </span>
            {projectedForecast.totalDelta !== 0 && (
              <span className={`text-xs font-bold ${projectedForecast.totalDelta >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                {projectedForecast.totalDelta >= 0 ? '+' : ''}{projectedForecast.totalDelta.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Bar */}
      <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
        <ForecastBar
          label="30d projection"
          low={projectedForecast.withScenarios.low}
          expected={projectedForecast.withScenarios.expected}
          high={projectedForecast.withScenarios.high}
          current={forecast.current_score}
        />
      </div>

      {/* Scenarios */}
      {forecast.scenarios.length > 0 && (
        <div>
          <h4 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2">
            Active Scenarios
          </h4>
          <div className="space-y-2">
            {forecast.scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isActive={activeScenarios.has(scenario.id)}
                onToggle={() => toggleScenario(scenario.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-white/30 text-center">
        Forecasts are based on historical patterns and active scenarios. Actual results may vary.
      </p>
    </div>
  );
}
