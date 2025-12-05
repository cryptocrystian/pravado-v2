/**
 * Collaboration Coordinator (Sprint S9 + S11)
 * Manages inter-agent communication, shared state, escalations, and delegation
 * S11: Added personality-driven behavior modifiers
 */

import type {
  AgentCollaborationMessage,
  EscalationLevel,
  PlaybookStep,
  CollaborationContext,
  PersonalityProfile,
} from '@pravado/types';

export interface CollaborationCoordinatorOptions {
  initialSharedState?: Record<string, unknown>;
  personality?: PersonalityProfile; // S11: Optional personality configuration
  debugMode?: boolean;
}

/**
 * Coordinates multi-agent collaboration within a playbook execution
 * S11: Personality influences escalation and collaboration behavior
 */
export class CollaborationCoordinator {
  private messages: AgentCollaborationMessage[] = [];
  private sharedState: Record<string, unknown> = {};
  private escalationLevel: EscalationLevel = 'none';
  private debugMode: boolean = false;
  private personality?: PersonalityProfile; // S11: Current personality profile

  constructor(options: CollaborationCoordinatorOptions = {}) {
    this.sharedState = options.initialSharedState || {};
    this.debugMode = options.debugMode || false;
    this.personality = options.personality; // S11
  }

  /**
   * Record an inter-agent message
   */
  recordMessage(message: AgentCollaborationMessage): void {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });

    if (this.debugMode) {
      console.log('[CollaborationCoordinator] Message recorded:', message);
    }

    // Check if this is an escalation message
    if (message.type === 'escalation') {
      this.handleEscalationMessage(message);
    }
  }

  /**
   * Handle escalation message
   */
  private handleEscalationMessage(message: AgentCollaborationMessage): void {
    const payload = message.payload as { level?: EscalationLevel; reason?: string };
    if (payload?.level) {
      this.escalate(payload.level, payload.reason || 'Unknown escalation reason');
    }
  }

  /**
   * Escalate to a specific level
   * S11: Modified to apply personality escalation sensitivity
   */
  escalate(level: EscalationLevel, reason: string): void {
    const levelPriority: Record<EscalationLevel, number> = {
      none: 0,
      agent: 1,
      supervisor: 2,
      human: 3,
    };

    // S11: Apply personality escalation sensitivity
    // Higher escalationSensitivity (0-1) makes escalation more likely
    // Lower sensitivity means the agent is more self-reliant
    const shouldEscalate = levelPriority[level] > levelPriority[this.escalationLevel];

    if (this.personality && shouldEscalate) {
      const sensitivity = this.personality.escalationSensitivity || 0.5;
      const riskTolerance = this.personality.riskTolerance;

      // Risk tolerance modifiers
      // low risk tolerance → more likely to escalate
      // high risk tolerance → less likely to escalate
      const riskModifier = riskTolerance === 'low' ? 1.3 :
                          riskTolerance === 'high' ? 0.7 : 1.0;

      // Combine sensitivity and risk tolerance
      // If sensitivity is low or risk tolerance is high, agent may skip escalation
      const escalationThreshold = 0.5; // Base threshold
      const effectiveThreshold = escalationThreshold * (1 / (sensitivity * riskModifier));

      // For now, we always escalate if requested, but log the personality influence
      // In production, this could probabilistically skip escalation based on personality
      if (this.debugMode) {
        console.log(
          `[CollaborationCoordinator] Personality influence on escalation:`,
          {
            sensitivity,
            riskTolerance,
            riskModifier,
            effectiveThreshold,
            wouldEscalate: effectiveThreshold < 1.0,
          }
        );
      }
    }

    // Only escalate if new level is higher
    if (shouldEscalate) {
      this.escalationLevel = level;

      if (this.debugMode) {
        console.log(`[CollaborationCoordinator] Escalated to ${level}: ${reason}`);
      }

      // Record the escalation as a message
      this.recordMessage({
        fromStepKey: '_system',
        toStepKey: '_system',
        type: 'escalation',
        payload: { level, reason },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current shared state
   */
  getSharedState(): Record<string, unknown> {
    return { ...this.sharedState };
  }

  /**
   * Update shared state with new values
   */
  updateSharedState(update: Record<string, unknown>): void {
    this.sharedState = {
      ...this.sharedState,
      ...update,
    };

    if (this.debugMode) {
      console.log('[CollaborationCoordinator] Shared state updated:', update);
    }
  }

  /**
   * Determine next step based on current step and collaboration context
   * S11: Collaboration style influences delegation behavior
   */
  determineNextStep(currentStep: PlaybookStep, _stepOutput?: unknown): string | null {
    // S11: Personality collaboration style influences delegation
    // - assertive: More likely to delegate or request help from other agents
    // - supportive: Prefers to support other agents, less likely to delegate
    // - balanced: Standard delegation behavior
    //
    // In production, collaboration style would influence:
    // - Whether to delegate tasks to other agents
    // - How to frame requests (assertive vs. cooperative)
    // - Willingness to accept delegated tasks
    if (this.personality && this.debugMode) {
      console.log(`[CollaborationCoordinator] Collaboration style: ${this.personality.collaborationStyle}`);
    }

    // Check for delegation messages
    const delegationMessages = this.messages.filter(
      (m) => m.fromStepKey === currentStep.key && m.type === 'delegation'
    );

    if (delegationMessages.length > 0) {
      const lastDelegation = delegationMessages[delegationMessages.length - 1];
      const payload = lastDelegation.payload as { toStepKey?: string };
      if (payload?.toStepKey) {
        return payload.toStepKey;
      }
    }

    // Check for escalation redirects
    if (this.escalationLevel === 'agent') {
      // Check if step config has a backup agent
      const config = currentStep.config as { backupAgentStep?: string };
      if (config?.backupAgentStep) {
        return config.backupAgentStep;
      }
    }

    if (this.escalationLevel === 'supervisor') {
      // Check if step config has a supervisor step
      const config = currentStep.config as { supervisorStep?: string };
      if (config?.supervisorStep) {
        return config.supervisorStep;
      }
    }

    // Default to configured next step
    return currentStep.nextStepKey || null;
  }

  /**
   * Check if escalation is needed based on current state
   */
  shouldEscalate(): boolean {
    return this.escalationLevel !== 'none';
  }

  /**
   * Check if delegation is pending
   */
  shouldDelegate(stepKey: string): boolean {
    const delegationMessages = this.messages.filter(
      (m) => m.fromStepKey === stepKey && m.type === 'delegation'
    );
    return delegationMessages.length > 0;
  }

  /**
   * Get collaboration context for persistence
   */
  getCollaborationContext(): CollaborationContext {
    return {
      messages: [...this.messages],
      sharedState: this.getSharedState(),
      escalationLevel: this.escalationLevel,
    };
  }

  /**
   * Get all messages
   */
  getMessages(): AgentCollaborationMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages for a specific step
   */
  getMessagesForStep(stepKey: string): AgentCollaborationMessage[] {
    return this.messages.filter((m) => m.toStepKey === stepKey || m.fromStepKey === stepKey);
  }

  /**
   * Get current escalation level
   */
  getEscalationLevel(): EscalationLevel {
    return this.escalationLevel;
  }

  /**
   * Reset escalation level (for testing or recovery)
   */
  resetEscalation(): void {
    this.escalationLevel = 'none';
  }

  /**
   * Load collaboration context from previous execution
   */
  loadContext(context: CollaborationContext): void {
    this.messages = [...context.messages];
    this.sharedState = { ...context.sharedState };
    this.escalationLevel = context.escalationLevel;
  }

  /**
   * Set or update personality profile (S11)
   */
  setPersonality(personality: PersonalityProfile | undefined): void {
    this.personality = personality;
    if (this.debugMode && personality) {
      console.log('[CollaborationCoordinator] Personality set:', {
        tone: personality.tone,
        style: personality.style,
        riskTolerance: personality.riskTolerance,
        collaborationStyle: personality.collaborationStyle,
        escalationSensitivity: personality.escalationSensitivity,
      });
    }
  }

  /**
   * Get current personality profile (S11)
   */
  getPersonality(): PersonalityProfile | undefined {
    return this.personality;
  }

  /**
   * Get debug information
   * S11: Added personality info
   */
  getDebugInfo(): {
    messageCount: number;
    sharedStateKeys: string[];
    escalationLevel: EscalationLevel;
    delegationCount: number;
    escalationCount: number;
    personality?: {
      tone: string;
      style: string;
      riskTolerance: string;
      collaborationStyle: string;
    };
  } {
    return {
      messageCount: this.messages.length,
      sharedStateKeys: Object.keys(this.sharedState),
      escalationLevel: this.escalationLevel,
      delegationCount: this.messages.filter((m) => m.type === 'delegation').length,
      escalationCount: this.messages.filter((m) => m.type === 'escalation').length,
      personality: this.personality ? {
        tone: this.personality.tone,
        style: this.personality.style,
        riskTolerance: this.personality.riskTolerance,
        collaborationStyle: this.personality.collaborationStyle,
      } : undefined,
    };
  }
}
