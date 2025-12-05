/**
 * Event Bus for Execution Streaming (Sprint S21)
 * Simple in-memory event bus for publishing execution events to SSE subscribers
 */

import type { ExecutionEvent } from './eventTypes';

type EventHandler = (event: ExecutionEvent) => void;

interface Subscription {
  id: string;
  handler: EventHandler;
}

/**
 * In-memory event bus for execution streaming
 * Subscriptions are keyed by runId
 */
class ExecutionEventBus {
  private subscriptions: Map<string, Subscription[]>;
  private nextSubscriptionId: number;

  constructor() {
    this.subscriptions = new Map();
    this.nextSubscriptionId = 1;
  }

  /**
   * Subscribe to events for a specific run
   * @param runId - The playbook run ID to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  subscribe(runId: string, handler: EventHandler): () => void {
    const subscriptionId = `sub-${this.nextSubscriptionId++}`;
    const subscription: Subscription = {
      id: subscriptionId,
      handler,
    };

    // Get or create subscription list for this runId
    if (!this.subscriptions.has(runId)) {
      this.subscriptions.set(runId, []);
    }

    const subs = this.subscriptions.get(runId)!;
    subs.push(subscription);

    // Return unsubscribe function
    return () => {
      const currentSubs = this.subscriptions.get(runId);
      if (currentSubs) {
        const filtered = currentSubs.filter((sub) => sub.id !== subscriptionId);
        if (filtered.length === 0) {
          // No more subscribers for this runId, clean up
          this.subscriptions.delete(runId);
        } else {
          this.subscriptions.set(runId, filtered);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers of a run
   * @param event - The execution event to publish
   */
  publish(event: ExecutionEvent): void {
    const subs = this.subscriptions.get(event.runId);
    if (!subs || subs.length === 0) {
      // No subscribers for this run, skip
      return;
    }

    // Call all handlers synchronously
    for (const sub of subs) {
      try {
        sub.handler(event);
      } catch (error) {
        // Log errors but don't let one handler failure affect others
        console.error(
          `Error in event handler for run ${event.runId}:`,
          error
        );
      }
    }
  }

  /**
   * Get count of active subscriptions for a run (for debugging/monitoring)
   * @param runId - The playbook run ID
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(runId: string): number {
    const subs = this.subscriptions.get(runId);
    return subs ? subs.length : 0;
  }

  /**
   * Get total subscription count across all runs (for debugging/monitoring)
   * @returns Total number of active subscriptions
   */
  getTotalSubscriptionCount(): number {
    let total = 0;
    for (const subs of Array.from(this.subscriptions.values())) {
      total += subs.length;
    }
    return total;
  }

  /**
   * Clear all subscriptions (for testing/cleanup)
   */
  clear(): void {
    this.subscriptions.clear();
  }
}

// Singleton instance
export const executionEventBus = new ExecutionEventBus();

// Export class for testing
export { ExecutionEventBus };
