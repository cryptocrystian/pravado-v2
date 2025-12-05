/**
 * Editor Session Manager (Sprint S22)
 * Tracks active users, cursors, selections, and soft locks per playbook
 *
 * All in-memory, no DB persistence
 */

import type {
  UserPresence,
  CursorPosition,
  NodeSelection,
} from './editorEventTypes';

/**
 * User session data
 */
interface UserSession {
  presence: UserPresence;
  cursor: CursorPosition | null;
  selection: NodeSelection | null;
  lastActivityAt: string;
}

/**
 * Playbook session data
 */
interface PlaybookSession {
  users: Map<string, UserSession>;
  softLocks: Map<string, string>; // nodeId -> userId (who has it locked)
}

/**
 * Editor Session Manager
 * Manages active editing sessions per playbook
 */
export class EditorSessionManager {
  private sessions: Map<string, PlaybookSession>;
  private readonly ACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessions = new Map();
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of inactive sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60000); // Check every minute
  }

  /**
   * Stop cleanup interval (for testing/shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleanup inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();

    for (const [playbookId, session] of this.sessions.entries()) {
      for (const [userId, userSession] of session.users.entries()) {
        const lastActivity = new Date(userSession.lastActivityAt).getTime();
        if (now - lastActivity > this.ACTIVITY_TIMEOUT_MS) {
          this.leave(playbookId, userId);
        }
      }

      // Remove empty playbook sessions
      if (session.users.size === 0) {
        this.sessions.delete(playbookId);
      }
    }
  }

  /**
   * Get or create playbook session
   */
  private getOrCreateSession(playbookId: string): PlaybookSession {
    let session = this.sessions.get(playbookId);
    if (!session) {
      session = {
        users: new Map(),
        softLocks: new Map(),
      };
      this.sessions.set(playbookId, session);
    }
    return session;
  }

  /**
   * User joins a playbook editing session
   */
  join(playbookId: string, presence: UserPresence): void {
    const session = this.getOrCreateSession(playbookId);

    session.users.set(presence.userId, {
      presence: {
        ...presence,
        joinedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      },
      cursor: null,
      selection: null,
      lastActivityAt: new Date().toISOString(),
    });
  }

  /**
   * User leaves a playbook editing session
   */
  leave(playbookId: string, userId: string): void {
    const session = this.sessions.get(playbookId);
    if (!session) return;

    // Release any soft locks held by this user
    for (const [nodeId, lockUserId] of session.softLocks.entries()) {
      if (lockUserId === userId) {
        session.softLocks.delete(nodeId);
      }
    }

    session.users.delete(userId);

    // Clean up empty sessions
    if (session.users.size === 0) {
      this.sessions.delete(playbookId);
    }
  }

  /**
   * Update user cursor position
   */
  updateCursor(
    playbookId: string,
    userId: string,
    position: CursorPosition
  ): void {
    const session = this.sessions.get(playbookId);
    if (!session) return;

    const userSession = session.users.get(userId);
    if (!userSession) return;

    userSession.cursor = position;
    userSession.lastActivityAt = new Date().toISOString();
  }

  /**
   * Update user selection
   */
  updateSelection(
    playbookId: string,
    userId: string,
    selection: NodeSelection,
    lock: boolean = false
  ): void {
    const session = this.sessions.get(playbookId);
    if (!session) return;

    const userSession = session.users.get(userId);
    if (!userSession) return;

    // Release previous locks
    for (const [nodeId, lockUserId] of session.softLocks.entries()) {
      if (lockUserId === userId) {
        session.softLocks.delete(nodeId);
      }
    }

    userSession.selection = selection;
    userSession.lastActivityAt = new Date().toISOString();

    // Apply new locks if requested
    if (lock) {
      for (const nodeId of selection.nodeIds) {
        session.softLocks.set(nodeId, userId);
      }
    }
  }

  /**
   * Get list of active users in a playbook
   */
  listUsers(playbookId: string): UserPresence[] {
    const session = this.sessions.get(playbookId);
    if (!session) return [];

    return Array.from(session.users.values()).map((userSession) => ({
      ...userSession.presence,
      lastActivityAt: userSession.lastActivityAt,
    }));
  }

  /**
   * Get user cursor position
   */
  getUserCursor(playbookId: string, userId: string): CursorPosition | null {
    const session = this.sessions.get(playbookId);
    if (!session) return null;

    const userSession = session.users.get(userId);
    return userSession?.cursor || null;
  }

  /**
   * Get user selection
   */
  getUserSelection(playbookId: string, userId: string): NodeSelection | null {
    const session = this.sessions.get(playbookId);
    if (!session) return null;

    const userSession = session.users.get(userId);
    return userSession?.selection || null;
  }

  /**
   * Check if a node is locked by another user
   */
  isNodeLocked(playbookId: string, nodeId: string, userId: string): boolean {
    const session = this.sessions.get(playbookId);
    if (!session) return false;

    const lockUserId = session.softLocks.get(nodeId);
    return lockUserId !== undefined && lockUserId !== userId;
  }

  /**
   * Get lock owner for a node
   */
  getNodeLockOwner(playbookId: string, nodeId: string): string | null {
    const session = this.sessions.get(playbookId);
    if (!session) return null;

    return session.softLocks.get(nodeId) || null;
  }

  /**
   * Get all cursors for a playbook
   */
  getAllCursors(playbookId: string): Record<string, CursorPosition> {
    const session = this.sessions.get(playbookId);
    if (!session) return {};

    const cursors: Record<string, CursorPosition> = {};
    for (const [userId, userSession] of session.users.entries()) {
      if (userSession.cursor) {
        cursors[userId] = userSession.cursor;
      }
    }
    return cursors;
  }

  /**
   * Get all selections for a playbook
   */
  getAllSelections(playbookId: string): Record<string, NodeSelection> {
    const session = this.sessions.get(playbookId);
    if (!session) return {};

    const selections: Record<string, NodeSelection> = {};
    for (const [userId, userSession] of session.users.entries()) {
      if (userSession.selection) {
        selections[userId] = userSession.selection;
      }
    }
    return selections;
  }

  /**
   * Get active playbook count
   */
  getActivePlaybookCount(): number {
    return this.sessions.size;
  }

  /**
   * Get total active user count across all playbooks
   */
  getTotalActiveUsers(): number {
    let total = 0;
    for (const session of this.sessions.values()) {
      total += session.users.size;
    }
    return total;
  }

  /**
   * Clear all sessions (for testing/cleanup)
   */
  clear(): void {
    this.sessions.clear();
  }
}

/**
 * Singleton instance of the editor session manager
 */
export const editorSessionManager = new EditorSessionManager();
