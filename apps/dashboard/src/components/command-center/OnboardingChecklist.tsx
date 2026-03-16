'use client';

import { Check } from '@phosphor-icons/react';
import { onboardingSteps } from './cc-mock-data';

export function OnboardingChecklist() {
  const completed = onboardingSteps.filter((s) => s.completed).length;
  const total = onboardingSteps.length;
  const progressPct = (completed / total) * 100;

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-white">
          Set up your workspace
        </h3>
        <span className="text-xs text-white/45">
          {completed} of {total} complete
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {onboardingSteps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <div className="w-5 h-5 rounded-full bg-semantic-success/20 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-semantic-success" weight="bold" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />
            )}

            <span
              className={`text-sm flex-1 ${
                step.completed
                  ? 'text-white/45 line-through'
                  : 'text-white/70'
              }`}
            >
              {step.label}
            </span>

            {!step.completed && step.ctaLabel && (
              <button className="text-sm font-medium text-cc-cyan hover:text-cc-cyan/80 transition-colors cursor-pointer flex-shrink-0">
                {step.ctaLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-white/8 mt-5">
        <div
          className="h-full rounded-full bg-cc-cyan transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Footer note */}
      <p className="text-xs text-white/45 italic mt-4">
        After setup, SAGE will generate your first Situation Brief and EVI
        baseline. Takes about 24 hours.
      </p>
    </div>
  );
}
