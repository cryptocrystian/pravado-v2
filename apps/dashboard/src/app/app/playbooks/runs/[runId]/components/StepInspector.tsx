/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * StepInspector Component (Sprint S19)
 * Right panel showing detailed step information: logs, output, memory, collaboration
 */

'use client';

import type { StepRunView } from '@pravado/types';
import { useState } from 'react';

interface StepInspectorProps {
  step: StepRunView | null;
}

/**
 * Collapsible section component
 */
function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: any; // Changed from React.ReactNode to any for type compatibility
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
        <span className="text-gray-500">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="px-6 pb-4">{children}</div>}
    </div>
  );
}

/**
 * JSON viewer component
 */
function JsonViewer({ data }: { data: unknown }) {
  if (!data) return <div className="text-gray-500 text-sm italic">No data</div>;

  try {
    return (
      <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  } catch {
    return <div className="text-red-600 text-sm">Invalid JSON</div>;
  }
}

export function StepInspector({ step }: StepInspectorProps) {
  if (!step) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-sm">Select a step to view details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-y-auto h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{step.type === 'AGENT' ? '🤖' : step.type === 'DATA' ? '⚙️' : step.type === 'BRANCH' ? '◆' : '🌐'}</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{step.name}</h2>
            <div className="text-xs text-gray-600 font-mono">{step.key}</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div>
        {/* Status Info */}
        <Section title="Status" defaultOpen={true}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">State:</span>
              <span className="font-semibold uppercase">{step.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attempt:</span>
              <span>
                {step.attempt + 1} / {step.maxAttempts}
              </span>
            </div>
            {step.startedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span>{new Date(step.startedAt).toLocaleString()}</span>
              </div>
            )}
            {step.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span>{new Date(step.completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Section>

        {/* Worker Info */}
        {step.workerInfo && (
          <Section title="Worker Info">
            <JsonViewer data={step.workerInfo} />
          </Section>
        )}

        {/* Logs */}
        {/* @ts-ignore */}
        <Section title="Logs" defaultOpen={Boolean(step.logs && Array.isArray(step.logs) && (step.logs as any[]).length > 0)}>
          {(step.logs as any[] | null | undefined) && (step.logs as any[]).length > 0 ? (
            <div className="bg-gray-900 text-gray-100 rounded p-3 text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
              {(step.logs as any[]).map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">No logs available</div>
          )}
        </Section>

        {/* Input */}
        {/* @ts-ignore */}
        <Section title="Input" defaultOpen={false}>
          <JsonViewer data={step.input as any} />
        </Section>

        {/* Output */}
        <Section title="Output" defaultOpen={step.output !== null}>
          <JsonViewer data={step.output} />
        </Section>

        {/* Error */}
        {step.error && (
          <Section title="Error" defaultOpen={true}>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <JsonViewer data={step.error} />
            </div>
          </Section>
        )}

        {/* Personality (AGENT steps only) */}
        {step.personality && (
          <Section title="Personality">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">Name</div>
                <div className="font-semibold">{step.personality.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Slug</div>
                <div className="font-mono text-sm">{step.personality.slug}</div>
              </div>
              {step.personality.description && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Description</div>
                  <div className="text-sm text-gray-700">{step.personality.description}</div>
                </div>
              )}
              {step.personality.configuration && (
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-2">Configuration</div>
                  <JsonViewer data={step.personality.configuration} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Collaboration Context */}
        {step.collaborationContext && (
          <Section title="Collaboration Context">
            <JsonViewer data={step.collaborationContext} />
          </Section>
        )}

        {/* Episodic Memory */}
        {step.episodicTraces && step.episodicTraces.length > 0 && (
          <Section title={`Episodic Memory (${step.episodicTraces.length})`}>
            <div className="space-y-3">
              {step.episodicTraces.map((trace) => (
                <div key={trace.id} className="border border-gray-200 rounded p-3 text-sm">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{new Date(trace.createdAt).toLocaleString()}</span>
                    <span className="font-mono">{trace.id.slice(0, 8)}</span>
                  </div>
                  <JsonViewer data={trace.content} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
