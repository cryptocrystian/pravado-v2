/**
 * Editor Event Bus (Sprint S22)
 * In-memory pub/sub system for real-time collaborative editing events
 *
 * Separate from execution event bus - handles editor-specific events
 * keyed by playbookId instead of runId
 */

import type { EditorEvent } from './editorEventTypes';

type EventHandler = (event: EditorEvent) => void;

interface Subscription {
  id: string;
  handler: EventHandler;
}

/**
 * Editor Event Bus
 * Manages subscriptions and publishes editor collaboration events
 */
export class EditorEventBus {
  private subscriptions: Map<string, Subscription[]>;
  private nextSubscriptionId: number;

  constructor() {
    this.subscriptions = new Map();
    this.nextSubscriptionId = 1;
  }

  /**
   * Subscribe to editor events for a specific playbookId
   * @param playbookId - The playbook ID to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  subscribe(playbookId: string, handler: EventHandler): () => void {
    const subscriptionId = `sub-${this.nextSubscriptionId++}`;

    const subscription: Subscription = {
      id: subscriptionId,
      handler,
    };

    // Get or create subscription array for this playbookId
    const playbookSubs = this.subscriptions.get(playbookId) || [];
    playbookSubs.push(subscription);
    this.subscriptions.set(playbookId, playbookSubs);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(playbookId);
      if (!subs) return;

      const index = subs.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
      }

      // Clean up empty subscription arrays
      if (subs.length === 0) {
        this.subscriptions.delete(playbookId);
      }
    };
  }

  /**
   * Publish an editor event to all subscribers of the playbookId
   * @param event - The editor event to publish
   */
  publish(event: EditorEvent): void {
    const subs = this.subscriptions.get(event.playbookId);
    if (!subs || subs.length === 0) {
      return;
    }

    // Deliver event to all subscribers
    // Use try-catch to isolate errors in individual handlers
    for (const sub of subs) {
      try {
        sub.handler(event);
      } catch (error) {
        console.error(
          `Error in event handler for playbook ${event.playbookId}:`,
          error
        );
      }
    }
  }

  /**
   * Get subscription count for a specific playbookId
   * @param playbookId - The playbook ID
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(playbookId: string): number {
    const subs = this.subscriptions.get(playbookId);
    return subs ? subs.length : 0;
  }

  /**
   * Get total subscription count across all playbooks (for debugging/monitoring)
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
   * Get list of playbook IDs with active subscriptions
   * @returns Array of playbook IDs
   */
  getActivePlaybooks(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Clear all subscriptions (for testing/cleanup)
   */
  clear(): void {
    this.subscriptions.clear();
  }
}

/**
 * Singleton instance of the editor event bus
 */
export const editorEventBus = new EditorEventBus();
