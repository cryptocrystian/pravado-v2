/**
 * Event Bus Tests (Sprint S21)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionEventBus } from '../src/events/eventBus';
import type { ExecutionEvent } from '../src/events/eventTypes';

describe('ExecutionEventBus (S21)', () => {
  let eventBus: ExecutionEventBus;

  beforeEach(() => {
    eventBus = new ExecutionEventBus();
  });

  describe('subscribe / publish / unsubscribe', () => {
    it('should subscribe to events for a specific runId', () => {
      const runId = 'run-123';
      const events: ExecutionEvent[] = [];

      const unsubscribe = eventBus.subscribe(runId, (event) => {
        events.push(event);
      });

      eventBus.publish({
        type: 'step.updated',
        runId,
        stepKey: 'step1',
        timestamp: new Date().toISOString(),
        payload: { status: 'RUNNING' },
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('step.updated');
      expect(events[0].runId).toBe(runId);

      unsubscribe();
    });

    it('should support multiple subscribers for the same runId', () => {
      const runId = 'run-123';
      const events1: ExecutionEvent[] = [];
      const events2: ExecutionEvent[] = [];

      const unsub1 = eventBus.subscribe(runId, (event) => events1.push(event));
      const unsub2 = eventBus.subscribe(runId, (event) => events2.push(event));

      eventBus.publish({
        type: 'run.updated',
        runId,
        timestamp: new Date().toISOString(),
        payload: { status: 'RUNNING' },
      });

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
      expect(events1[0].type).toBe('run.updated');
      expect(events2[0].type).toBe('run.updated');

      unsub1();
      unsub2();
    });

    it('should not leak subscriptions after unsubscribe', () => {
      const runId = 'run-123';
      const events: ExecutionEvent[] = [];

      const unsubscribe = eventBus.subscribe(runId, (event) => {
        events.push(event);
      });

      eventBus.publish({
        type: 'step.completed',
        runId,
        stepKey: 'step1',
        timestamp: new Date().toISOString(),
        payload: { status: 'SUCCESS' },
      });

      expect(events).toHaveLength(1);
      expect(eventBus.getSubscriptionCount(runId)).toBe(1);

      unsubscribe();

      // After unsubscribe, should have 0 subscriptions
      expect(eventBus.getSubscriptionCount(runId)).toBe(0);

      // Publishing after unsubscribe should not trigger handler
      eventBus.publish({
        type: 'step.completed',
        runId,
        stepKey: 'step2',
        timestamp: new Date().toISOString(),
        payload: { status: 'SUCCESS' },
      });

      expect(events).toHaveLength(1); // Still 1, not 2
    });

    it('should only deliver events to subscribers of the matching runId', () => {
      const runId1 = 'run-123';
      const runId2 = 'run-456';
      const events1: ExecutionEvent[] = [];
      const events2: ExecutionEvent[] = [];

      const unsub1 = eventBus.subscribe(runId1, (event) => events1.push(event));
      const unsub2 = eventBus.subscribe(runId2, (event) => events2.push(event));

      eventBus.publish({
        type: 'step.updated',
        runId: runId1,
        stepKey: 'step1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      eventBus.publish({
        type: 'step.updated',
        runId: runId2,
        stepKey: 'step1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(events1).toHaveLength(1);
      expect(events1[0].runId).toBe(runId1);
      expect(events2).toHaveLength(1);
      expect(events2[0].runId).toBe(runId2);

      unsub1();
      unsub2();
    });

    it('should handle publishing when there are no subscribers', () => {
      // Should not throw
      expect(() => {
        eventBus.publish({
          type: 'run.completed',
          runId: 'run-999',
          timestamp: new Date().toISOString(),
          payload: {},
        });
      }).not.toThrow();
    });

    it('should handle errors in subscriber handlers without affecting other subscribers', () => {
      const runId = 'run-123';
      const events: ExecutionEvent[] = [];

      const unsub1 = eventBus.subscribe(runId, () => {
        throw new Error('Handler error');
      });

      const unsub2 = eventBus.subscribe(runId, (event) => {
        events.push(event);
      });

      // Should not throw even though first handler throws
      expect(() => {
        eventBus.publish({
          type: 'step.failed',
          runId,
          stepKey: 'step1',
          timestamp: new Date().toISOString(),
          payload: {},
        });
      }).not.toThrow();

      // Second handler should still receive event
      expect(events).toHaveLength(1);

      unsub1();
      unsub2();
    });
  });

  describe('getSubscriptionCount', () => {
    it('should return correct subscription count', () => {
      const runId = 'run-123';

      expect(eventBus.getSubscriptionCount(runId)).toBe(0);

      const unsub1 = eventBus.subscribe(runId, () => {});
      expect(eventBus.getSubscriptionCount(runId)).toBe(1);

      const unsub2 = eventBus.subscribe(runId, () => {});
      expect(eventBus.getSubscriptionCount(runId)).toBe(2);

      unsub1();
      expect(eventBus.getSubscriptionCount(runId)).toBe(1);

      unsub2();
      expect(eventBus.getSubscriptionCount(runId)).toBe(0);
    });
  });

  describe('getTotalSubscriptionCount', () => {
    it('should return total subscription count across all runIds', () => {
      expect(eventBus.getTotalSubscriptionCount()).toBe(0);

      const unsub1 = eventBus.subscribe('run-1', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(1);

      const unsub2 = eventBus.subscribe('run-2', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(2);

      const unsub3 = eventBus.subscribe('run-1', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(3);

      unsub1();
      unsub2();
      unsub3();
      expect(eventBus.getTotalSubscriptionCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all subscriptions', () => {
      eventBus.subscribe('run-1', () => {});
      eventBus.subscribe('run-2', () => {});
      eventBus.subscribe('run-1', () => {});

      expect(eventBus.getTotalSubscriptionCount()).toBe(3);

      eventBus.clear();

      expect(eventBus.getTotalSubscriptionCount()).toBe(0);
      expect(eventBus.getSubscriptionCount('run-1')).toBe(0);
      expect(eventBus.getSubscriptionCount('run-2')).toBe(0);
    });
  });
});
