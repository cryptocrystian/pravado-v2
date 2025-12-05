/**
 * Editor Event Bus Tests (Sprint S22)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EditorEventBus } from '../src/events/editor/editorEventBus';
import type { EditorEvent } from '../src/events/editor/editorEventTypes';

describe('EditorEventBus (S22)', () => {
  let eventBus: EditorEventBus;

  beforeEach(() => {
    eventBus = new EditorEventBus();
  });

  describe('subscribe / publish / unsubscribe', () => {
    it('should subscribe to events for a specific playbookId', () => {
      const playbookId = 'playbook-123';
      const events: EditorEvent[] = [];

      const unsubscribe = eventBus.subscribe(playbookId, (event) => {
        events.push(event);
      });

      eventBus.publish({
        type: 'cursor.update',
        playbookId,
        userId: 'user1',
        timestamp: new Date().toISOString(),
        payload: { position: { x: 100, y: 200 } },
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('cursor.update');
      expect(events[0].playbookId).toBe(playbookId);

      unsubscribe();
    });

    it('should support multiple subscribers for the same playbookId', () => {
      const playbookId = 'playbook-123';
      const events1: EditorEvent[] = [];
      const events2: EditorEvent[] = [];

      const unsub1 = eventBus.subscribe(playbookId, (event) => events1.push(event));
      const unsub2 = eventBus.subscribe(playbookId, (event) => events2.push(event));

      eventBus.publish({
        type: 'presence.join',
        playbookId,
        userId: 'user1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
      expect(events1[0].type).toBe('presence.join');
      expect(events2[0].type).toBe('presence.join');

      unsub1();
      unsub2();
    });

    it('should not leak subscriptions after unsubscribe', () => {
      const playbookId = 'playbook-123';
      const events: EditorEvent[] = [];

      const unsubscribe = eventBus.subscribe(playbookId, (event) => {
        events.push(event);
      });

      eventBus.publish({
        type: 'selection.update',
        playbookId,
        userId: 'user1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(events).toHaveLength(1);
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(1);

      unsubscribe();

      // After unsubscribe, should have 0 subscriptions
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(0);

      // Publishing after unsubscribe should not trigger handler
      eventBus.publish({
        type: 'selection.update',
        playbookId,
        userId: 'user2',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(events).toHaveLength(1); // Still 1, not 2
    });

    it('should only deliver events to subscribers of the matching playbookId', () => {
      const playbookId1 = 'playbook-123';
      const playbookId2 = 'playbook-456';
      const events1: EditorEvent[] = [];
      const events2: EditorEvent[] = [];

      const unsub1 = eventBus.subscribe(playbookId1, (event) => events1.push(event));
      const unsub2 = eventBus.subscribe(playbookId2, (event) => events2.push(event));

      eventBus.publish({
        type: 'cursor.update',
        playbookId: playbookId1,
        userId: 'user1',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      eventBus.publish({
        type: 'cursor.update',
        playbookId: playbookId2,
        userId: 'user2',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(events1).toHaveLength(1);
      expect(events1[0].playbookId).toBe(playbookId1);
      expect(events2).toHaveLength(1);
      expect(events2[0].playbookId).toBe(playbookId2);

      unsub1();
      unsub2();
    });

    it('should handle publishing when there are no subscribers', () => {
      // Should not throw
      expect(() => {
        eventBus.publish({
          type: 'graph.patch',
          playbookId: 'playbook-999',
          userId: 'user1',
          timestamp: new Date().toISOString(),
          payload: {},
        });
      }).not.toThrow();
    });

    it('should handle errors in subscriber handlers without affecting other subscribers', () => {
      const playbookId = 'playbook-123';
      const events: EditorEvent[] = [];

      const unsub1 = eventBus.subscribe(playbookId, () => {
        throw new Error('Handler error');
      });

      const unsub2 = eventBus.subscribe(playbookId, (event) => {
        events.push(event);
      });

      // Should not throw even though first handler throws
      expect(() => {
        eventBus.publish({
          type: 'graph.replace',
          playbookId,
          userId: 'user1',
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
      const playbookId = 'playbook-123';

      expect(eventBus.getSubscriptionCount(playbookId)).toBe(0);

      const unsub1 = eventBus.subscribe(playbookId, () => {});
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(1);

      const unsub2 = eventBus.subscribe(playbookId, () => {});
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(2);

      unsub1();
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(1);

      unsub2();
      expect(eventBus.getSubscriptionCount(playbookId)).toBe(0);
    });
  });

  describe('getTotalSubscriptionCount', () => {
    it('should return total subscription count across all playbookIds', () => {
      expect(eventBus.getTotalSubscriptionCount()).toBe(0);

      const unsub1 = eventBus.subscribe('playbook-1', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(1);

      const unsub2 = eventBus.subscribe('playbook-2', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(2);

      const unsub3 = eventBus.subscribe('playbook-1', () => {});
      expect(eventBus.getTotalSubscriptionCount()).toBe(3);

      unsub1();
      unsub2();
      unsub3();
      expect(eventBus.getTotalSubscriptionCount()).toBe(0);
    });
  });

  describe('getActivePlaybooks', () => {
    it('should return list of active playbook IDs', () => {
      expect(eventBus.getActivePlaybooks()).toEqual([]);

      const unsub1 = eventBus.subscribe('playbook-1', () => {});
      expect(eventBus.getActivePlaybooks()).toContain('playbook-1');

      const unsub2 = eventBus.subscribe('playbook-2', () => {});
      expect(eventBus.getActivePlaybooks()).toHaveLength(2);
      expect(eventBus.getActivePlaybooks()).toContain('playbook-2');

      unsub1();
      expect(eventBus.getActivePlaybooks()).toEqual(['playbook-2']);

      unsub2();
      expect(eventBus.getActivePlaybooks()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all subscriptions', () => {
      eventBus.subscribe('playbook-1', () => {});
      eventBus.subscribe('playbook-2', () => {});
      eventBus.subscribe('playbook-1', () => {});

      expect(eventBus.getTotalSubscriptionCount()).toBe(3);

      eventBus.clear();

      expect(eventBus.getTotalSubscriptionCount()).toBe(0);
      expect(eventBus.getSubscriptionCount('playbook-1')).toBe(0);
      expect(eventBus.getSubscriptionCount('playbook-2')).toBe(0);
      expect(eventBus.getActivePlaybooks()).toEqual([]);
    });
  });
});
