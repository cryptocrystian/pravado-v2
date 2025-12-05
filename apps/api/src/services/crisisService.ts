/**
 * Crisis Response & Escalation Engine Service (Sprint S55)
 *
 * Comprehensive service for AI-powered crisis detection, incident management,
 * escalation rules, action recommendations, and crisis briefing generation.
 *
 * Integrates with:
 * - S40: Media Monitoring (coverage detection)
 * - S41: Media Crawling (signal sources)
 * - S43: Media Alerts (trigger signals)
 * - S49: Journalist Timeline (relationship context)
 * - S52: Media Performance (impact metrics)
 * - S53: Competitive Intelligence (competitor context)
 * - S54: Media Briefings (briefing generation patterns)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CrisisSignal,
  CrisisIncident,
  CrisisAction,
  CrisisBrief,
  CrisisBriefSection,
  CrisisEscalationRule,
  CrisisSeverity,
  CrisisSourceSystem,
  CrisisTrajectory,
  CrisisPropagationLevel,
  CrisisBriefFormat,
  CrisisBriefSectionType,
  CrisisActionType,
  CrisisActionStatus,
  IncidentStatus,
  CrisisUrgency,
  EscalationRuleType,
  EscalationAction,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  CreateActionRequest,
  UpdateActionRequest,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  GenerateCrisisBriefRequest,
  CrisisRegenerateSectionRequest,
  CrisisUpdateSectionRequest,
  TriggerDetectionRequest,
  IncidentFilters,
  SignalFilters,
  ActionFilters,
  BriefFilters,
  GetIncidentsResponse,
  GetSignalsResponse,
  GetActionsResponse,
  GetBriefsResponse,
  DetectionResultResponse,
  BriefGenerationResponse,
  CrisisSectionRegenerationResponse,
  CrisisDashboardStats,
  RiskAssessment,
  ActionRecommendation,
  BulletPoint,
  CRISIS_SECTION_CONFIGS,
  MitigationLevel,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';

const logger = createLogger('crisis-service');

// ============================================================================
// LLM PROMPTS
// ============================================================================

const CRISIS_SYSTEM_PROMPT = `You are an expert crisis communications strategist helping PR teams respond to emerging crises. Generate professional, actionable content based on the intelligence provided. Be direct, strategic, and focus on protecting reputation while maintaining transparency.`;

const SECTION_PROMPTS: Record<CrisisBriefSectionType, string> = {
  [CrisisBriefSectionType.SITUATION_OVERVIEW]: `Generate a concise situation overview (2-3 paragraphs) covering:
1. What happened and when it was detected
2. Current scope and severity
3. Key parties involved or affected
Be factual and avoid speculation.`,

  [CrisisBriefSectionType.TIMELINE_OF_EVENTS]: `Create a chronological timeline of key events:
1. Initial detection and first reports
2. Key developments and escalation points
3. Response actions taken
4. Current status
Format as clear timestamped entries.`,

  [CrisisBriefSectionType.MEDIA_LANDSCAPE]: `Analyze the current media landscape:
1. Which outlets have covered this
2. Tone and angle of coverage
3. Key journalists driving the narrative
4. Potential upcoming coverage threats`,

  [CrisisBriefSectionType.KEY_STAKEHOLDERS]: `Identify key stakeholders:
1. Internal stakeholders (executives, employees, board)
2. External stakeholders (customers, partners, investors)
3. Media and influencers
4. Regulators or government entities
For each, note their concerns and communication needs.`,

  [CrisisBriefSectionType.SENTIMENT_ANALYSIS]: `Provide sentiment analysis:
1. Overall public sentiment
2. Sentiment by stakeholder group
3. Sentiment trajectory over time
4. Key drivers of negative sentiment
5. Opportunities for sentiment recovery`,

  [CrisisBriefSectionType.PROPAGATION_ANALYSIS]: `Analyze crisis propagation:
1. How the story is spreading
2. Key amplification channels
3. Viral risk assessment
4. Geographic spread
5. Predicted peak and decay timeline`,

  [CrisisBriefSectionType.RECOMMENDED_ACTIONS]: `Provide strategic recommendations:
1. Immediate actions (next 24 hours)
2. Short-term actions (this week)
3. Medium-term actions (next month)
Prioritize by impact and urgency.`,

  [CrisisBriefSectionType.TALKING_POINTS]: `Generate key talking points:
1. Primary message (must lead with)
2. Supporting messages
3. Bridge statements for tough questions
4. Things to avoid saying
Keep each point concise and quotable.`,

  [CrisisBriefSectionType.QA_PREPARATION]: `Prepare Q&A for likely questions:
1. Most likely questions from media
2. Recommended responses
3. Pivot strategies for hostile questions
4. Facts and figures to reference
Format as clear Q&A pairs.`,

  [CrisisBriefSectionType.RISK_ASSESSMENT]: `Assess risks:
1. Reputation risk level and factors
2. Financial risk exposure
3. Legal/regulatory risk
4. Operational impact
5. Long-term brand damage potential
Rate each on severity and likelihood.`,

  [CrisisBriefSectionType.MITIGATION_STATUS]: `Report on mitigation efforts:
1. Actions already taken
2. Effectiveness of response so far
3. Gaps in current response
4. Resources needed
5. Barriers to effective mitigation`,

  [CrisisBriefSectionType.NEXT_STEPS]: `Outline next steps:
1. Immediate priorities (next 4 hours)
2. Today's action items
3. Tomorrow's focus areas
4. Week-ahead planning
Assign clear ownership where possible.`,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CrisisService {
  private llmRouter: LlmRouter | null = null;

  constructor(
    private supabase: SupabaseClient,
    llmRouter?: LlmRouter
  ) {
    this.llmRouter = llmRouter || null;
  }

  // =========================================================================
  // INCIDENT ENGINE
  // =========================================================================

  /**
   * Create a new crisis incident
   */
  async createIncident(
    orgId: string,
    userId: string,
    data: CreateIncidentRequest
  ): Promise<CrisisIncident> {
    const incidentCode = await this.generateIncidentCode(orgId);

    const row = {
      org_id: orgId,
      title: data.title,
      description: data.description || null,
      incident_code: incidentCode,
      severity: data.severity || CrisisSeverity.MEDIUM,
      trajectory: CrisisTrajectory.UNKNOWN,
      propagation_level: CrisisPropagationLevel.CONTAINED,
      crisis_type: data.crisisType || null,
      affected_products: data.affectedProducts || [],
      affected_regions: data.affectedRegions || [],
      affected_stakeholders: data.affectedStakeholders || [],
      keywords: data.keywords || [],
      topics: data.topics || [],
      linked_signal_ids: data.linkedSignalIds || [],
      linked_event_ids: data.linkedEventIds || [],
      linked_mention_ids: data.linkedMentionIds || [],
      linked_alert_ids: data.linkedAlertIds || [],
      linked_article_ids: [],
      linked_competitor_ids: data.linkedCompetitorIds || [],
      mention_count: 0,
      estimated_reach: 0,
      sentiment_history: [],
      mention_history: [],
      status: IncidentStatus.ACTIVE,
      is_escalated: false,
      escalation_level: 0,
      first_detected_at: new Date(),
      owner_id: data.ownerId || null,
      team_ids: data.teamIds || [],
      created_by: userId,
    };

    const { data: incident, error } = await this.supabase
      .from('crisis_incidents')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create incident: ${error.message}`);

    // Link signals to incident
    if (data.linkedSignalIds?.length) {
      await this.supabase
        .from('crisis_signals')
        .update({ linked_incident_id: incident.id })
        .in('id', data.linkedSignalIds)
        .eq('org_id', orgId);
    }

    await this.logAuditEvent(orgId, userId, incident.id, 'create_incident', 'incident', incident.id, null, {
      title: data.title,
      severity: data.severity,
    });

    return this.mapIncidentFromDb(incident);
  }

  /**
   * Get single incident by ID
   */
  async getIncident(orgId: string, incidentId: string): Promise<CrisisIncident> {
    const { data: incident, error } = await this.supabase
      .from('crisis_incidents')
      .select('*')
      .eq('id', incidentId)
      .eq('org_id', orgId)
      .single();

    if (error || !incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    return this.mapIncidentFromDb(incident);
  }

  /**
   * Get incidents with filters and pagination
   */
  async getIncidents(
    orgId: string,
    filters: IncidentFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetIncidentsResponse> {
    let query = this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.severity?.length) {
      query = query.in('severity', filters.severity);
    }
    if (filters.trajectory?.length) {
      query = query.in('trajectory', filters.trajectory);
    }
    if (filters.propagationLevel?.length) {
      query = query.in('propagation_level', filters.propagationLevel);
    }
    if (filters.crisisType) {
      query = query.eq('crisis_type', filters.crisisType);
    }
    if (filters.ownerId) {
      query = query.eq('owner_id', filters.ownerId);
    }
    if (filters.isEscalated !== undefined) {
      query = query.eq('is_escalated', filters.isEscalated);
    }
    if (filters.escalationLevelGte !== undefined) {
      query = query.gte('escalation_level', filters.escalationLevelGte);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortColumn = this.mapSortColumn(sortBy);
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: incidents, count, error } = await query;

    if (error) throw new Error(`Failed to fetch incidents: ${error.message}`);

    return {
      incidents: incidents?.map((i) => this.mapIncidentFromDb(i)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Update existing incident
   */
  async updateIncident(
    orgId: string,
    userId: string,
    incidentId: string,
    data: UpdateIncidentRequest
  ): Promise<CrisisIncident> {
    const original = await this.getIncident(orgId, incidentId);

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.severity !== undefined) updates.severity = data.severity;
    if (data.trajectory !== undefined) updates.trajectory = data.trajectory;
    if (data.propagationLevel !== undefined) updates.propagation_level = data.propagationLevel;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === IncidentStatus.CONTAINED && !original.containedAt) {
        updates.contained_at = new Date();
      }
      if (data.status === IncidentStatus.RESOLVED && !original.resolvedAt) {
        updates.resolved_at = new Date();
      }
      if (data.status === IncidentStatus.CLOSED && !original.closedAt) {
        updates.closed_at = new Date();
      }
    }
    if (data.crisisType !== undefined) updates.crisis_type = data.crisisType;
    if (data.affectedProducts !== undefined) updates.affected_products = data.affectedProducts;
    if (data.affectedRegions !== undefined) updates.affected_regions = data.affectedRegions;
    if (data.affectedStakeholders !== undefined) updates.affected_stakeholders = data.affectedStakeholders;
    if (data.keywords !== undefined) updates.keywords = data.keywords;
    if (data.topics !== undefined) updates.topics = data.topics;
    if (data.linkedSignalIds !== undefined) updates.linked_signal_ids = data.linkedSignalIds;
    if (data.linkedEventIds !== undefined) updates.linked_event_ids = data.linkedEventIds;
    if (data.linkedMentionIds !== undefined) updates.linked_mention_ids = data.linkedMentionIds;
    if (data.linkedAlertIds !== undefined) updates.linked_alert_ids = data.linkedAlertIds;
    if (data.linkedCompetitorIds !== undefined) updates.linked_competitor_ids = data.linkedCompetitorIds;
    if (data.ownerId !== undefined) updates.owner_id = data.ownerId;
    if (data.teamIds !== undefined) updates.team_ids = data.teamIds;
    if (data.escalationLevel !== undefined) {
      updates.escalation_level = data.escalationLevel;
      if (data.escalationLevel > 0 && !original.isEscalated) {
        updates.is_escalated = true;
        updates.escalated_at = new Date();
      }
    }

    const { data: incident, error } = await this.supabase
      .from('crisis_incidents')
      .update(updates)
      .eq('id', incidentId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update incident: ${error.message}`);

    await this.logAuditEvent(
      orgId,
      userId,
      incidentId,
      'update_incident',
      'incident',
      incidentId,
      { severity: original.severity, status: original.status },
      { updates: Object.keys(updates) }
    );

    return this.mapIncidentFromDb(incident);
  }

  /**
   * Close incident
   */
  async closeIncident(
    orgId: string,
    userId: string,
    incidentId: string,
    resolutionNotes?: string
  ): Promise<CrisisIncident> {
    const { data: incident, error } = await this.supabase
      .from('crisis_incidents')
      .update({
        status: IncidentStatus.CLOSED,
        closed_at: new Date(),
        summary: resolutionNotes || undefined,
      })
      .eq('id', incidentId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to close incident: ${error.message}`);

    await this.logAuditEvent(orgId, userId, incidentId, 'close_incident', 'incident', incidentId, null, {
      resolutionNotes,
    });

    return this.mapIncidentFromDb(incident);
  }

  /**
   * Escalate incident
   */
  async escalateIncident(
    orgId: string,
    userId: string,
    incidentId: string,
    level: number
  ): Promise<CrisisIncident> {
    const { data: incident, error } = await this.supabase
      .from('crisis_incidents')
      .update({
        is_escalated: true,
        escalation_level: level,
        escalated_at: new Date(),
      })
      .eq('id', incidentId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to escalate incident: ${error.message}`);

    await this.logAuditEvent(orgId, userId, incidentId, 'escalate_incident', 'incident', incidentId, null, {
      level,
    });

    return this.mapIncidentFromDb(incident);
  }

  // =========================================================================
  // DETECTION ENGINE
  // =========================================================================

  /**
   * Run crisis detection across source systems
   */
  async runDetection(
    orgId: string,
    userId: string,
    options: TriggerDetectionRequest = {}
  ): Promise<DetectionResultResponse> {
    const startTime = Date.now();
    const timeWindow = options.timeWindowMinutes || 60;
    const windowStart = new Date(Date.now() - timeWindow * 60 * 1000);

    const sourceSystems = options.sourceSystems || [
      CrisisSourceSystem.MEDIA_MONITORING,
      CrisisSourceSystem.MEDIA_ALERTS,
      CrisisSourceSystem.MEDIA_CRAWLING,
    ];

    let eventsProcessed = 0;
    const newSignals: CrisisSignal[] = [];
    const newIncidents: CrisisIncident[] = [];
    let escalationsTriggered = 0;

    // Detect signals from each source system
    for (const source of sourceSystems) {
      const result = await this.detectSignalsFromSource(orgId, source, windowStart, options.keywords);
      eventsProcessed += result.eventsProcessed;
      newSignals.push(...result.signals);
    }

    // Evaluate escalation rules for new signals
    for (const signal of newSignals) {
      const triggered = await this.evaluateEscalationRulesForSignal(orgId, userId, signal);
      if (triggered) {
        escalationsTriggered++;

        // Auto-create incident for high-severity signals
        if ((['high', 'critical', 'severe'] as CrisisSeverity[]).includes(signal.severity)) {
          const incident = await this.createIncident(orgId, userId, {
            title: signal.title,
            description: signal.description,
            severity: signal.severity,
            linkedSignalIds: [signal.id],
            keywords: [],
          });
          newIncidents.push(incident);
        }
      }
    }

    await this.logAuditEvent(orgId, userId, null, 'run_detection', 'signal', null, null, {
      timeWindow,
      sourceSystems,
      eventsProcessed,
      signalsGenerated: newSignals.length,
      incidentsCreated: newIncidents.length,
      escalationsTriggered,
    });

    return {
      eventsProcessed,
      signalsGenerated: newSignals.length,
      incidentsCreated: newIncidents.length,
      escalationsTriggered,
      signals: newSignals,
      incidents: newIncidents,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Detect signals from a specific source system
   */
  private async detectSignalsFromSource(
    orgId: string,
    source: CrisisSourceSystem,
    windowStart: Date,
    _keywords?: string[]
  ): Promise<{ eventsProcessed: number; signals: CrisisSignal[] }> {
    const signals: CrisisSignal[] = [];
    let eventsProcessed = 0;

    switch (source) {
      case CrisisSourceSystem.MEDIA_MONITORING: {
        // Check media mentions from S40
        const { data: mentions } = await this.supabase
          .from('media_mentions')
          .select('*')
          .eq('org_id', orgId)
          .gte('published_at', windowStart.toISOString())
          .order('published_at', { ascending: false })
          .limit(100);

        if (mentions) {
          eventsProcessed = mentions.length;
          const negativeMentions = mentions.filter((m) => (m.sentiment_score ?? 0) < -0.3);

          if (negativeMentions.length >= 3) {
            const signal = await this.createSignal(orgId, {
              signalType: 'negative_sentiment_cluster',
              title: `Negative coverage detected (${negativeMentions.length} articles)`,
              description: `Cluster of negative mentions detected from media monitoring`,
              severity: negativeMentions.length >= 10 ? CrisisSeverity.HIGH : CrisisSeverity.MEDIUM,
              sourceSystem: source,
              sourceEvents: negativeMentions.map((m) => m.id),
              windowStart,
              windowEnd: new Date(),
              sentimentScore: negativeMentions.reduce((sum, m) => sum + (m.sentiment_score ?? 0), 0) / negativeMentions.length,
            });
            signals.push(signal);
          }
        }
        break;
      }

      case CrisisSourceSystem.MEDIA_ALERTS: {
        // Check triggered alerts from S43
        const { data: alerts } = await this.supabase
          .from('media_alerts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_triggered', true)
          .gte('triggered_at', windowStart.toISOString())
          .order('triggered_at', { ascending: false })
          .limit(50);

        if (alerts) {
          eventsProcessed = alerts.length;

          for (const alert of alerts) {
            // Check if signal already exists for this alert
            const { data: existing } = await this.supabase
              .from('crisis_signals')
              .select('id')
              .eq('org_id', orgId)
              .contains('source_events', [alert.id])
              .single();

            if (!existing) {
              const signal = await this.createSignal(orgId, {
                signalType: 'media_alert_trigger',
                title: `Alert triggered: ${alert.name}`,
                description: alert.description,
                severity: this.mapAlertSeverity(alert.priority),
                sourceSystem: source,
                sourceEvents: [alert.id],
                windowStart,
                windowEnd: new Date(),
              });
              signals.push(signal);
            }
          }
        }
        break;
      }

      case CrisisSourceSystem.MEDIA_CRAWLING: {
        // Check crawled articles from S41 with negative sentiment
        const { data: articles } = await this.supabase
          .from('crawled_articles')
          .select('*')
          .eq('org_id', orgId)
          .gte('crawled_at', windowStart.toISOString())
          .order('crawled_at', { ascending: false })
          .limit(100);

        if (articles) {
          eventsProcessed = articles.length;
          const highVelocity = articles.length >= 20;

          if (highVelocity) {
            const signal = await this.createSignal(orgId, {
              signalType: 'high_mention_velocity',
              title: `High mention velocity detected (${articles.length} articles)`,
              description: `Unusual spike in coverage volume`,
              severity: articles.length >= 50 ? CrisisSeverity.HIGH : CrisisSeverity.MEDIUM,
              sourceSystem: source,
              sourceEvents: articles.slice(0, 20).map((a) => a.id),
              windowStart,
              windowEnd: new Date(),
              mentionVelocity: articles.length,
            });
            signals.push(signal);
          }
        }
        break;
      }

      default:
        logger.debug(`Skipping unsupported source system: ${source}`);
    }

    return { eventsProcessed, signals };
  }

  /**
   * Create a crisis signal
   */
  private async createSignal(
    orgId: string,
    data: {
      signalType: string;
      title: string;
      description?: string;
      severity: CrisisSeverity;
      sourceSystem: CrisisSourceSystem;
      sourceEvents: string[];
      windowStart: Date;
      windowEnd: Date;
      sentimentScore?: number;
      mentionVelocity?: number;
    }
  ): Promise<CrisisSignal> {
    const row = {
      org_id: orgId,
      signal_type: data.signalType,
      title: data.title,
      description: data.description || null,
      severity: data.severity,
      confidence_score: 75,
      priority_score: this.calculatePriorityScore(data.severity),
      detection_method: 'automated',
      trigger_conditions: {},
      source_events: data.sourceEvents,
      source_systems: [data.sourceSystem],
      sentiment_score: data.sentimentScore || null,
      mention_velocity: data.mentionVelocity || null,
      window_start: data.windowStart,
      window_end: data.windowEnd,
      is_active: true,
      is_escalated: false,
    };

    const { data: signal, error } = await this.supabase
      .from('crisis_signals')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create signal: ${error.message}`);

    return this.mapSignalFromDb(signal);
  }

  // =========================================================================
  // SIGNAL MANAGEMENT
  // =========================================================================

  /**
   * Get signals with filters
   */
  async getSignals(
    orgId: string,
    filters: SignalFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetSignalsResponse> {
    let query = this.supabase
      .from('crisis_signals')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.severity?.length) {
      query = query.in('severity', filters.severity);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isEscalated !== undefined) {
      query = query.eq('is_escalated', filters.isEscalated);
    }
    if (filters.sourceSystems?.length) {
      query = query.overlaps('source_systems', filters.sourceSystems);
    }
    if (filters.linkedIncidentId) {
      query = query.eq('linked_incident_id', filters.linkedIncidentId);
    }
    if (filters.windowFrom) {
      query = query.gte('window_start', filters.windowFrom.toISOString());
    }
    if (filters.windowTo) {
      query = query.lte('window_end', filters.windowTo.toISOString());
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'priorityScore' ? 'priority_score' : 'severity';
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data: signals, count, error } = await query;

    if (error) throw new Error(`Failed to fetch signals: ${error.message}`);

    return {
      signals: signals?.map((s) => this.mapSignalFromDb(s)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Acknowledge a signal
   */
  async acknowledgeSignal(
    orgId: string,
    userId: string,
    signalId: string,
    linkedIncidentId?: string,
    resolutionNotes?: string
  ): Promise<CrisisSignal> {
    const updates: Record<string, unknown> = {
      is_active: false,
      acknowledged_at: new Date(),
      acknowledged_by: userId,
    };

    if (linkedIncidentId) {
      updates.linked_incident_id = linkedIncidentId;
    }
    if (resolutionNotes) {
      updates.resolution_notes = resolutionNotes;
    }

    const { data: signal, error } = await this.supabase
      .from('crisis_signals')
      .update(updates)
      .eq('id', signalId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to acknowledge signal: ${error.message}`);

    await this.logAuditEvent(orgId, userId, linkedIncidentId || null, 'acknowledge_signal', 'signal', signalId, null, {
      linkedIncidentId,
    });

    return this.mapSignalFromDb(signal);
  }

  // =========================================================================
  // ACTION RECOMMENDATION ENGINE
  // =========================================================================

  /**
   * Create a crisis action
   */
  async createAction(
    orgId: string,
    userId: string,
    data: CreateActionRequest
  ): Promise<CrisisAction> {
    const row = {
      org_id: orgId,
      incident_id: data.incidentId,
      title: data.title,
      description: data.description || null,
      action_type: data.actionType,
      status: CrisisActionStatus.RECOMMENDED,
      priority_score: data.priorityScore || 50,
      urgency: data.urgency || CrisisUrgency.NORMAL,
      due_at: data.dueAt || null,
      estimated_duration_mins: data.estimatedDurationMins || null,
      is_ai_generated: false,
      assigned_to: data.assignedTo || null,
      linked_content_ids: [],
      attachments: [],
      created_by: userId,
    };

    const { data: action, error } = await this.supabase
      .from('crisis_actions')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create action: ${error.message}`);

    await this.logAuditEvent(orgId, userId, data.incidentId, 'create_action', 'action', action.id, null, {
      actionType: data.actionType,
    });

    return this.mapActionFromDb(action);
  }

  /**
   * Get actions with filters
   */
  async getActions(
    orgId: string,
    filters: ActionFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetActionsResponse> {
    let query = this.supabase
      .from('crisis_actions')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.incidentId) {
      query = query.eq('incident_id', filters.incidentId);
    }
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.actionType?.length) {
      query = query.in('action_type', filters.actionType);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters.isAiGenerated !== undefined) {
      query = query.eq('is_ai_generated', filters.isAiGenerated);
    }
    if (filters.dueBefore) {
      query = query.lte('due_at', filters.dueBefore.toISOString());
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'priorityScore' ? 'priority_score' : 'due_at';
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data: actions, count, error } = await query;

    if (error) throw new Error(`Failed to fetch actions: ${error.message}`);

    return {
      actions: actions?.map((a) => this.mapActionFromDb(a)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Update action
   */
  async updateAction(
    orgId: string,
    userId: string,
    actionId: string,
    data: UpdateActionRequest
  ): Promise<CrisisAction> {
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === CrisisActionStatus.APPROVED) {
        updates.approved_by = userId;
        updates.approved_at = new Date();
      }
      if (data.status === CrisisActionStatus.IN_PROGRESS) {
        updates.started_at = new Date();
      }
      if (data.status === CrisisActionStatus.COMPLETED) {
        updates.completed_at = new Date();
      }
    }
    if (data.priorityScore !== undefined) updates.priority_score = data.priorityScore;
    if (data.urgency !== undefined) updates.urgency = data.urgency;
    if (data.dueAt !== undefined) updates.due_at = data.dueAt;
    if (data.assignedTo !== undefined) updates.assigned_to = data.assignedTo;
    if (data.completionNotes !== undefined) updates.completion_notes = data.completionNotes;
    if (data.outcome !== undefined) updates.outcome = data.outcome;
    if (data.outcomeNotes !== undefined) updates.outcome_notes = data.outcomeNotes;

    const { data: action, error } = await this.supabase
      .from('crisis_actions')
      .update(updates)
      .eq('id', actionId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update action: ${error.message}`);

    await this.logAuditEvent(orgId, userId, action.incident_id, 'update_action', 'action', actionId, null, {
      updates: Object.keys(updates),
    });

    return this.mapActionFromDb(action);
  }

  /**
   * Generate AI action recommendations for an incident
   */
  async generateActionRecommendations(
    orgId: string,
    userId: string,
    incidentId: string
  ): Promise<CrisisAction[]> {
    const incident = await this.getIncident(orgId, incidentId);
    const context = await this.assembleIncidentContext(orgId, incident);

    if (!this.llmRouter) {
      // Return default recommendations without LLM
      return this.createDefaultRecommendations(orgId, userId, incidentId, incident);
    }

    const prompt = this.buildRecommendationsPrompt(incident, context);

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 1500,
      temperature: 0.7,
      systemPrompt: CRISIS_SYSTEM_PROMPT,
    });

    const recommendations = this.parseRecommendationsResponse(llmResponse.completion);
    const createdActions: CrisisAction[] = [];

    for (const rec of recommendations) {
      const action = await this.createAiGeneratedAction(orgId, userId, incidentId, rec, llmResponse.model);
      createdActions.push(action);
    }

    await this.logAuditEvent(orgId, userId, incidentId, 'generate_recommendations', 'action', null, null, {
      count: createdActions.length,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    });

    return createdActions;
  }

  private async createAiGeneratedAction(
    orgId: string,
    userId: string,
    incidentId: string,
    rec: ActionRecommendation,
    llmModel: string
  ): Promise<CrisisAction> {
    const row = {
      org_id: orgId,
      incident_id: incidentId,
      title: rec.title,
      description: rec.description,
      action_type: rec.actionType,
      status: CrisisActionStatus.RECOMMENDED,
      priority_score: rec.priority,
      urgency: rec.urgency,
      estimated_duration_mins: rec.estimatedDurationMins || null,
      is_ai_generated: true,
      generation_context: { rationale: rec.rationale, expectedOutcome: rec.expectedOutcome },
      llm_model: llmModel,
      confidence_score: 75,
      linked_content_ids: [],
      attachments: [],
      created_by: userId,
    };

    const { data: action, error } = await this.supabase
      .from('crisis_actions')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create AI action: ${error.message}`);

    return this.mapActionFromDb(action);
  }

  private async createDefaultRecommendations(
    orgId: string,
    userId: string,
    incidentId: string,
    _incident: CrisisIncident
  ): Promise<CrisisAction[]> {
    const defaultRecs: Partial<CrisisAction>[] = [
      {
        title: 'Issue holding statement',
        description: 'Prepare and release initial holding statement acknowledging the situation',
        actionType: CrisisActionType.STATEMENT_RELEASE,
        priorityScore: 90,
        urgency: CrisisUrgency.IMMEDIATE,
      },
      {
        title: 'Brief internal stakeholders',
        description: 'Conduct internal briefing for leadership and key teams',
        actionType: CrisisActionType.INTERNAL_COMMS,
        priorityScore: 85,
        urgency: CrisisUrgency.URGENT,
      },
      {
        title: 'Increase media monitoring',
        description: 'Set up enhanced monitoring for mentions and coverage',
        actionType: CrisisActionType.MONITORING_INCREASE,
        priorityScore: 80,
        urgency: CrisisUrgency.URGENT,
      },
    ];

    const createdActions: CrisisAction[] = [];
    for (const rec of defaultRecs) {
      const action = await this.createAction(orgId, userId, {
        incidentId,
        title: rec.title!,
        description: rec.description,
        actionType: rec.actionType!,
        priorityScore: rec.priorityScore,
        urgency: rec.urgency,
      });
      createdActions.push(action);
    }

    return createdActions;
  }

  // =========================================================================
  // CRISIS BRIEFING ENGINE
  // =========================================================================

  /**
   * Generate crisis brief for an incident
   */
  async generateCrisisBrief(
    orgId: string,
    userId: string,
    incidentId: string,
    data: GenerateCrisisBriefRequest = {}
  ): Promise<BriefGenerationResponse> {
    const startTime = Date.now();
    let totalTokens = 0;

    const incident = await this.getIncident(orgId, incidentId);
    const context = await this.assembleIncidentContext(orgId, incident);

    const format = data.format || CrisisBriefFormat.FULL_BRIEF;
    const sectionsToGenerate = data.includeSections || this.getDefaultSectionsForFormat(format);
    const sectionsToExclude = data.excludeSections || [];
    const finalSections = sectionsToGenerate.filter((s) => !sectionsToExclude.includes(s));

    // Mark previous briefs as not current
    await this.supabase
      .from('crisis_briefs')
      .update({ is_current: false })
      .eq('incident_id', incidentId)
      .eq('org_id', orgId);

    // Get next version number
    const { count } = await this.supabase
      .from('crisis_briefs')
      .select('*', { count: 'exact', head: true })
      .eq('incident_id', incidentId)
      .eq('org_id', orgId);

    const version = (count || 0) + 1;

    // Create brief record
    const briefRow = {
      org_id: orgId,
      incident_id: incidentId,
      title: `Crisis Brief: ${incident.title}`,
      subtitle: `Version ${version}`,
      format,
      version,
      status: 'draft',
      is_current: true,
      key_takeaways: [],
      recommendations: [],
      total_tokens_used: 0,
      shared_with: [],
      distribution_channels: [],
      created_by: userId,
    };

    const { data: brief, error: briefError } = await this.supabase
      .from('crisis_briefs')
      .insert(briefRow)
      .select()
      .single();

    if (briefError) throw new Error(`Failed to create brief: ${briefError.message}`);

    // Generate each section
    const generatedSections: CrisisBriefSection[] = [];
    for (let i = 0; i < finalSections.length; i++) {
      const sectionType = finalSections[i];
      const result = await this.generateBriefSection(
        orgId,
        userId,
        brief.id,
        sectionType,
        incident,
        context,
        i,
        data.customInstructions
      );
      generatedSections.push(result.section);
      totalTokens += result.tokensUsed;
    }

    // Generate executive summary
    const summaryResult = await this.generateExecutiveSummary(orgId, incident, context);
    totalTokens += summaryResult.tokensUsed;

    // Generate key takeaways
    const takeawaysResult = await this.generateKeyTakeaways(incident, context);
    totalTokens += takeawaysResult.tokensUsed;

    // Generate risk assessment
    const riskResult = await this.generateRiskAssessment(incident, context);
    totalTokens += riskResult.tokensUsed;

    // Update brief with generated content
    const { data: updatedBrief, error: updateError } = await this.supabase
      .from('crisis_briefs')
      .update({
        status: 'generated',
        executive_summary: summaryResult.content,
        key_takeaways: takeawaysResult.takeaways,
        risk_assessment: riskResult.assessment,
        total_tokens_used: totalTokens,
        generation_duration_ms: Date.now() - startTime,
        generated_at: new Date(),
      })
      .eq('id', brief.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update brief: ${updateError.message}`);

    await this.logAuditEvent(orgId, userId, incidentId, 'generate_brief', 'brief', brief.id, null, {
      format,
      sectionsGenerated: generatedSections.length,
      totalTokens,
    });

    return {
      brief: this.mapBriefFromDb(updatedBrief),
      sections: generatedSections,
      tokensUsed: totalTokens,
      generationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Get briefs for an incident
   */
  async getBriefs(
    orgId: string,
    filters: BriefFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetBriefsResponse> {
    let query = this.supabase
      .from('crisis_briefs')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.incidentId) {
      query = query.eq('incident_id', filters.incidentId);
    }
    if (filters.format?.length) {
      query = query.in('format', filters.format);
    }
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.isCurrent !== undefined) {
      query = query.eq('is_current', filters.isCurrent);
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : 'version';
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data: briefs, count, error } = await query;

    if (error) throw new Error(`Failed to fetch briefs: ${error.message}`);

    return {
      briefs: briefs?.map((b) => this.mapBriefFromDb(b)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Get current brief for incident
   */
  async getCurrentBrief(orgId: string, incidentId: string): Promise<CrisisBrief | null> {
    const { data: brief, error } = await this.supabase
      .from('crisis_briefs')
      .select('*')
      .eq('incident_id', incidentId)
      .eq('org_id', orgId)
      .eq('is_current', true)
      .single();

    if (error || !brief) return null;

    const mapped = this.mapBriefFromDb(brief);

    // Load sections
    const { data: sections } = await this.supabase
      .from('crisis_brief_sections')
      .select('*')
      .eq('brief_id', brief.id)
      .order('sort_order', { ascending: true });

    mapped.sections = sections?.map((s) => this.mapSectionFromDb(s)) || [];

    return mapped;
  }

  /**
   * Regenerate a specific section
   */
  async regenerateBriefSection(
    orgId: string,
    userId: string,
    briefId: string,
    sectionId: string,
    data: CrisisRegenerateSectionRequest = {}
  ): Promise<CrisisSectionRegenerationResponse> {
    const startTime = Date.now();

    // Get brief and section
    const { data: brief, error: briefError } = await this.supabase
      .from('crisis_briefs')
      .select('*')
      .eq('id', briefId)
      .eq('org_id', orgId)
      .single();

    if (briefError || !brief) throw new Error(`Brief not found: ${briefId}`);

    const { data: section, error: sectionError } = await this.supabase
      .from('crisis_brief_sections')
      .select('*')
      .eq('id', sectionId)
      .eq('brief_id', briefId)
      .single();

    if (sectionError || !section) throw new Error(`Section not found: ${sectionId}`);

    if (data.preserveManualEdits && section.is_manually_edited) {
      throw new Error('Section has manual edits. Set preserveManualEdits=false to overwrite.');
    }

    const incident = await this.getIncident(orgId, brief.incident_id);
    const context = await this.assembleIncidentContext(orgId, incident);

    const result = await this.generateBriefSection(
      orgId,
      userId,
      briefId,
      section.section_type,
      incident,
      context,
      section.sort_order,
      data.customInstructions,
      sectionId
    );

    await this.logAuditEvent(orgId, userId, brief.incident_id, 'regenerate_section', 'brief', briefId, null, {
      sectionId,
      sectionType: section.section_type,
    });

    return {
      section: result.section,
      tokensUsed: result.tokensUsed,
      generationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Update section content manually
   */
  async updateSection(
    orgId: string,
    userId: string,
    briefId: string,
    sectionId: string,
    data: CrisisUpdateSectionRequest
  ): Promise<CrisisBriefSection> {
    const updates: Record<string, unknown> = {
      is_manually_edited: true,
      edited_at: new Date(),
      edited_by: userId,
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.bulletPoints !== undefined) updates.bullet_points = data.bulletPoints;

    const { data: section, error } = await this.supabase
      .from('crisis_brief_sections')
      .update(updates)
      .eq('id', sectionId)
      .eq('brief_id', briefId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update section: ${error.message}`);

    return this.mapSectionFromDb(section);
  }

  // =========================================================================
  // ESCALATION RULES
  // =========================================================================

  /**
   * Create escalation rule
   */
  async createEscalationRule(
    orgId: string,
    userId: string,
    data: CreateEscalationRuleRequest
  ): Promise<CrisisEscalationRule> {
    const row = {
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      rule_type: data.ruleType,
      conditions: data.conditions,
      escalation_actions: data.escalationActions,
      escalation_level: data.escalationLevel || 1,
      notify_channels: data.notifyChannels || [],
      notify_roles: data.notifyRoles || [],
      notify_user_ids: data.notifyUserIds || [],
      is_active: true,
      is_system: false,
      trigger_count: 0,
      cooldown_minutes: data.cooldownMinutes || 60,
      created_by: userId,
    };

    const { data: rule, error } = await this.supabase
      .from('crisis_escalation_rules')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create escalation rule: ${error.message}`);

    await this.logAuditEvent(orgId, userId, null, 'create_rule', 'rule', rule.id, null, {
      name: data.name,
      ruleType: data.ruleType,
    });

    return this.mapRuleFromDb(rule);
  }

  /**
   * Get escalation rules
   */
  async getEscalationRules(
    orgId: string,
    isActive?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ rules: CrisisEscalationRule[]; total: number }> {
    let query = this.supabase
      .from('crisis_escalation_rules')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rules, count, error } = await query;

    if (error) throw new Error(`Failed to fetch rules: ${error.message}`);

    return {
      rules: rules?.map((r) => this.mapRuleFromDb(r)) || [],
      total: count || 0,
    };
  }

  /**
   * Update escalation rule
   */
  async updateEscalationRule(
    orgId: string,
    userId: string,
    ruleId: string,
    data: UpdateEscalationRuleRequest
  ): Promise<CrisisEscalationRule> {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.conditions !== undefined) updates.conditions = data.conditions;
    if (data.escalationActions !== undefined) updates.escalation_actions = data.escalationActions;
    if (data.escalationLevel !== undefined) updates.escalation_level = data.escalationLevel;
    if (data.notifyChannels !== undefined) updates.notify_channels = data.notifyChannels;
    if (data.notifyRoles !== undefined) updates.notify_roles = data.notifyRoles;
    if (data.notifyUserIds !== undefined) updates.notify_user_ids = data.notifyUserIds;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    if (data.cooldownMinutes !== undefined) updates.cooldown_minutes = data.cooldownMinutes;

    const { data: rule, error } = await this.supabase
      .from('crisis_escalation_rules')
      .update(updates)
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update rule: ${error.message}`);

    await this.logAuditEvent(orgId, userId, null, 'update_rule', 'rule', ruleId, null, {
      updates: Object.keys(updates),
    });

    return this.mapRuleFromDb(rule);
  }

  /**
   * Delete escalation rule
   */
  async deleteEscalationRule(orgId: string, userId: string, ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('crisis_escalation_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .eq('is_system', false);

    if (error) throw new Error(`Failed to delete rule: ${error.message}`);

    await this.logAuditEvent(orgId, userId, null, 'delete_rule', 'rule', ruleId, null, {});
  }

  /**
   * Evaluate escalation rules for a signal
   */
  private async evaluateEscalationRulesForSignal(
    orgId: string,
    userId: string,
    signal: CrisisSignal
  ): Promise<boolean> {
    const { data: rules } = await this.supabase
      .from('crisis_escalation_rules')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (!rules?.length) return false;

    let triggered = false;

    for (const rule of rules) {
      const conditions = rule.conditions as Record<string, unknown>;

      // Check cooldown
      if (rule.last_triggered_at) {
        const cooldownEnd = new Date(rule.last_triggered_at).getTime() + rule.cooldown_minutes * 60 * 1000;
        if (Date.now() < cooldownEnd) continue;
      }

      // Evaluate conditions
      let matches = true;

      if (conditions.severityGte) {
        const severityOrder = [CrisisSeverity.LOW, CrisisSeverity.MEDIUM, CrisisSeverity.HIGH, CrisisSeverity.CRITICAL, CrisisSeverity.SEVERE];
        const signalIndex = severityOrder.indexOf(signal.severity);
        const conditionIndex = severityOrder.indexOf(conditions.severityGte as CrisisSeverity);
        if (signalIndex < conditionIndex) matches = false;
      }

      if (conditions.sentimentLte !== undefined && signal.sentimentScore !== undefined) {
        if (signal.sentimentScore > (conditions.sentimentLte as number)) matches = false;
      }

      if (conditions.mentionVelocityGte !== undefined && signal.mentionVelocity !== undefined) {
        if (signal.mentionVelocity < (conditions.mentionVelocityGte as number)) matches = false;
      }

      if (matches) {
        triggered = true;

        // Update signal as escalated
        await this.supabase
          .from('crisis_signals')
          .update({
            is_escalated: true,
            escalated_at: new Date(),
            escalated_by: userId,
          })
          .eq('id', signal.id);

        // Update rule trigger count
        await this.supabase
          .from('crisis_escalation_rules')
          .update({
            last_triggered_at: new Date(),
            trigger_count: rule.trigger_count + 1,
          })
          .eq('id', rule.id);

        await this.logAuditEvent(orgId, userId, null, 'rule_triggered', 'rule', rule.id, null, {
          signalId: signal.id,
          ruleName: rule.name,
        });

        break; // Only trigger first matching rule
      }
    }

    return triggered;
  }

  // =========================================================================
  // DASHBOARD & STATS
  // =========================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(orgId: string): Promise<CrisisDashboardStats> {
    // Active incidents count
    const { count: activeIncidents } = await this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', IncidentStatus.ACTIVE);

    // Active signals count
    const { count: activeSignals } = await this.supabase
      .from('crisis_signals')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true);

    // Pending actions count
    const { count: pendingActions } = await this.supabase
      .from('crisis_actions')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', [CrisisActionStatus.RECOMMENDED, CrisisActionStatus.APPROVED]);

    // Escalated count
    const { count: escalatedCount } = await this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_escalated', true)
      .eq('status', IncidentStatus.ACTIVE);

    // By severity
    const { data: bySeverityData } = await this.supabase
      .from('crisis_incidents')
      .select('severity')
      .eq('org_id', orgId)
      .eq('status', IncidentStatus.ACTIVE);

    const bySeverity: Record<CrisisSeverity, number> = {
      [CrisisSeverity.LOW]: 0,
      [CrisisSeverity.MEDIUM]: 0,
      [CrisisSeverity.HIGH]: 0,
      [CrisisSeverity.CRITICAL]: 0,
      [CrisisSeverity.SEVERE]: 0,
    };
    bySeverityData?.forEach((i) => {
      bySeverity[i.severity as CrisisSeverity]++;
    });

    // By trajectory
    const { data: byTrajectoryData } = await this.supabase
      .from('crisis_incidents')
      .select('trajectory')
      .eq('org_id', orgId)
      .eq('status', IncidentStatus.ACTIVE);

    const byTrajectory: Record<CrisisTrajectory, number> = {
      [CrisisTrajectory.IMPROVING]: 0,
      [CrisisTrajectory.STABLE]: 0,
      [CrisisTrajectory.WORSENING]: 0,
      [CrisisTrajectory.CRITICAL]: 0,
      [CrisisTrajectory.RESOLVED]: 0,
      [CrisisTrajectory.UNKNOWN]: 0,
    };
    byTrajectoryData?.forEach((i) => {
      byTrajectory[i.trajectory as CrisisTrajectory]++;
    });

    return {
      activeIncidents: activeIncidents || 0,
      activeSignals: activeSignals || 0,
      pendingActions: pendingActions || 0,
      escalatedCount: escalatedCount || 0,
      bySeverity,
      byTrajectory,
      recentActivity: [],
      sentimentTrend: [],
    };
  }

  // =========================================================================
  // PRIVATE GENERATION HELPERS
  // =========================================================================

  private async generateBriefSection(
    orgId: string,
    _userId: string,
    briefId: string,
    sectionType: CrisisBriefSectionType,
    incident: CrisisIncident,
    context: Record<string, unknown>,
    sortOrder: number,
    customInstructions?: string,
    existingSectionId?: string
  ): Promise<{ section: CrisisBriefSection; tokensUsed: number }> {
    const prompt = this.buildSectionPrompt(sectionType, incident, context, customInstructions);
    const config = CRISIS_SECTION_CONFIGS[sectionType];

    if (!this.llmRouter) {
      // Create placeholder section
      const row: Record<string, unknown> = {
        org_id: orgId,
        brief_id: briefId,
        section_type: sectionType,
        title: config.label,
        sort_order: sortOrder,
        content: `[Placeholder: ${sectionType} content]`,
        summary: null,
        bullet_points: [],
        supporting_data: {},
        source_references: [],
        is_generated: false,
        is_manually_edited: false,
      };

      if (existingSectionId) {
        await this.supabase.from('crisis_brief_sections').update(row).eq('id', existingSectionId);
        row.id = existingSectionId;
      } else {
        const { data: section } = await this.supabase.from('crisis_brief_sections').insert(row).select().single();
        Object.assign(row, section);
      }

      return { section: this.mapSectionFromDb(row), tokensUsed: 0 };
    }

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: CRISIS_SYSTEM_PROMPT,
    });

    const tokensUsed = (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0);
    const { content, bulletPoints } = this.parseSectionResponse(llmResponse.completion);

    const row = {
      org_id: orgId,
      brief_id: briefId,
      section_type: sectionType,
      title: config.label,
      sort_order: sortOrder,
      content,
      summary: content.substring(0, 200),
      bullet_points: bulletPoints,
      supporting_data: {},
      source_references: [],
      is_generated: true,
      is_manually_edited: false,
      generation_prompt: prompt.substring(0, 500),
      llm_model: llmResponse.model,
      tokens_used: tokensUsed,
      generation_duration_ms: 0, // Duration not tracked in this code path
      generated_at: new Date(),
    };

    let section;
    if (existingSectionId) {
      const { data } = await this.supabase.from('crisis_brief_sections').update(row).eq('id', existingSectionId).select().single();
      section = data;
    } else {
      const { data } = await this.supabase.from('crisis_brief_sections').insert(row).select().single();
      section = data;
    }

    return { section: this.mapSectionFromDb(section), tokensUsed };
  }

  private async generateExecutiveSummary(
    _orgId: string,
    incident: CrisisIncident,
    _context: Record<string, unknown>
  ): Promise<{ content: string; tokensUsed: number }> {
    if (!this.llmRouter) {
      return { content: `Executive summary for: ${incident.title}`, tokensUsed: 0 };
    }

    const prompt = `Generate a concise executive summary (2-3 paragraphs) for this crisis:

Incident: ${incident.title}
Severity: ${incident.severity}
Trajectory: ${incident.trajectory}
Status: ${incident.status}
${incident.description ? `Description: ${incident.description}` : ''}

Key points to cover:
1. What happened and current status
2. Impact and severity assessment
3. Key actions being taken
4. Outlook and next steps

Be direct and executive-friendly.`;

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 500,
      temperature: 0.7,
      systemPrompt: CRISIS_SYSTEM_PROMPT,
    });

    return {
      content: llmResponse.completion,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    };
  }

  private async generateKeyTakeaways(
    incident: CrisisIncident,
    _context: Record<string, unknown>
  ): Promise<{ takeaways: { title: string; content: string; priority: number }[]; tokensUsed: number }> {
    if (!this.llmRouter) {
      return {
        takeaways: [{ title: 'Key Point', content: incident.title, priority: 1 }],
        tokensUsed: 0,
      };
    }

    const prompt = `Generate 3-5 key takeaways for this crisis situation. Return as JSON array with objects having: title, content, priority (1-5 where 1 is highest).

Incident: ${incident.title}
Severity: ${incident.severity}
Description: ${incident.description || 'No description'}`;

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 600,
      temperature: 0.7,
      systemPrompt: 'You are a JSON generator. Return only valid JSON.',
    });

    let takeaways: { title: string; content: string; priority: number }[] = [];
    try {
      takeaways = JSON.parse(llmResponse.completion);
    } catch {
      takeaways = [{ title: 'Key Point', content: incident.title, priority: 1 }];
    }

    return {
      takeaways,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    };
  }

  private async generateRiskAssessment(
    incident: CrisisIncident,
    _context: Record<string, unknown>
  ): Promise<{ assessment: RiskAssessment; tokensUsed: number }> {
    const defaultAssessment: RiskAssessment = {
      overallRisk: 50,
      reputationRisk: 50,
      financialRisk: 30,
      operationalRisk: 30,
      legalRisk: 20,
      factors: [],
      mitigationStatus: MitigationLevel.NONE,
    };

    if (!this.llmRouter) {
      return { assessment: defaultAssessment, tokensUsed: 0 };
    }

    const prompt = `Assess risks for this crisis. Return JSON with: overallRisk (0-100), reputationRisk (0-100), financialRisk (0-100), operationalRisk (0-100), legalRisk (0-100), factors (array of {name, description, severity, likelihood, impact}).

Incident: ${incident.title}
Severity: ${incident.severity}
Trajectory: ${incident.trajectory}`;

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 800,
      temperature: 0.7,
      systemPrompt: 'You are a JSON generator. Return only valid JSON.',
    });

    let assessment = defaultAssessment;
    try {
      const parsed = JSON.parse(llmResponse.completion);
      assessment = {
        ...defaultAssessment,
        ...parsed,
        mitigationStatus: MitigationLevel.NONE,
      };
    } catch {
      // Use default
    }

    return {
      assessment,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    };
  }

  private async assembleIncidentContext(
    _orgId: string,
    incident: CrisisIncident
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      incident: {
        title: incident.title,
        severity: incident.severity,
        trajectory: incident.trajectory,
        status: incident.status,
        mentionCount: incident.mentionCount,
        estimatedReach: incident.estimatedReach,
      },
    };

    // Get linked signals
    if (incident.linkedSignalIds.length) {
      const { data: signals } = await this.supabase
        .from('crisis_signals')
        .select('*')
        .in('id', incident.linkedSignalIds.slice(0, 10));
      context.signals = signals || [];
    }

    // Get actions
    const { data: actions } = await this.supabase
      .from('crisis_actions')
      .select('*')
      .eq('incident_id', incident.id)
      .order('priority_score', { ascending: false })
      .limit(10);
    context.actions = actions || [];

    return context;
  }

  private buildSectionPrompt(
    sectionType: CrisisBriefSectionType,
    incident: CrisisIncident,
    _context: Record<string, unknown>,
    customInstructions?: string
  ): string {
    const basePrompt = SECTION_PROMPTS[sectionType] || `Generate content for: ${sectionType}`;

    return `${basePrompt}

Context:
- Incident: ${incident.title}
- Severity: ${incident.severity}
- Trajectory: ${incident.trajectory}
- Status: ${incident.status}
${incident.description ? `- Description: ${incident.description}` : ''}
${incident.affectedProducts.length ? `- Affected Products: ${incident.affectedProducts.join(', ')}` : ''}
${incident.affectedRegions.length ? `- Affected Regions: ${incident.affectedRegions.join(', ')}` : ''}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}`;
  }

  private buildRecommendationsPrompt(
    incident: CrisisIncident,
    _context: Record<string, unknown>
  ): string {
    return `Generate action recommendations for this crisis incident.

Incident: ${incident.title}
Severity: ${incident.severity}
Trajectory: ${incident.trajectory}
Description: ${incident.description || 'No description'}

Return JSON array with 3-5 recommendations. Each should have:
- actionType: one of [statement_release, media_outreach, social_response, internal_comms, stakeholder_briefing, legal_review, executive_escalation, monitoring_increase, content_creation]
- title: short action title
- description: detailed description
- priority: 1-100
- urgency: one of [immediate, urgent, normal, low]
- rationale: why this action is needed
- expectedOutcome: what success looks like`;
  }

  private parseRecommendationsResponse(response: string): ActionRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.map((r: Record<string, unknown>) => ({
          actionType: (r.actionType as CrisisActionType) || CrisisActionType.OTHER,
          title: (r.title as string) || 'Action',
          description: (r.description as string) || '',
          priority: Math.min(100, Math.max(1, (r.priority as number) || 50)),
          urgency: (r.urgency as CrisisUrgency) || CrisisUrgency.NORMAL,
          rationale: (r.rationale as string) || '',
          expectedOutcome: (r.expectedOutcome as string) || '',
        }));
      }
    } catch {
      logger.warn('Failed to parse recommendations JSON');
    }
    return [];
  }

  private parseSectionResponse(response: string): { content: string; bulletPoints: BulletPoint[] } {
    const lines = response.split('\n').filter((l) => l.trim());
    const bulletPoints: BulletPoint[] = [];
    const contentLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\./)) {
        bulletPoints.push({
          text: trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''),
        });
      } else {
        contentLines.push(trimmed);
      }
    }

    return {
      content: contentLines.join('\n\n'),
      bulletPoints,
    };
  }

  private getDefaultSectionsForFormat(format: CrisisBriefFormat): CrisisBriefSectionType[] {
    switch (format) {
      case CrisisBriefFormat.FULL_BRIEF:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.TIMELINE_OF_EVENTS,
          CrisisBriefSectionType.MEDIA_LANDSCAPE,
          CrisisBriefSectionType.SENTIMENT_ANALYSIS,
          CrisisBriefSectionType.PROPAGATION_ANALYSIS,
          CrisisBriefSectionType.RISK_ASSESSMENT,
          CrisisBriefSectionType.RECOMMENDED_ACTIONS,
          CrisisBriefSectionType.TALKING_POINTS,
          CrisisBriefSectionType.QA_PREPARATION,
          CrisisBriefSectionType.NEXT_STEPS,
        ];
      case CrisisBriefFormat.EXECUTIVE_SUMMARY:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.RISK_ASSESSMENT,
          CrisisBriefSectionType.RECOMMENDED_ACTIONS,
          CrisisBriefSectionType.NEXT_STEPS,
        ];
      case CrisisBriefFormat.SITUATION_REPORT:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.TIMELINE_OF_EVENTS,
          CrisisBriefSectionType.MEDIA_LANDSCAPE,
          CrisisBriefSectionType.MITIGATION_STATUS,
        ];
      case CrisisBriefFormat.STAKEHOLDER_BRIEF:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.KEY_STAKEHOLDERS,
          CrisisBriefSectionType.TALKING_POINTS,
          CrisisBriefSectionType.NEXT_STEPS,
        ];
      case CrisisBriefFormat.MEDIA_RESPONSE:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.TALKING_POINTS,
          CrisisBriefSectionType.QA_PREPARATION,
        ];
      case CrisisBriefFormat.LEGAL_BRIEF:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.TIMELINE_OF_EVENTS,
          CrisisBriefSectionType.RISK_ASSESSMENT,
        ];
      default:
        return [
          CrisisBriefSectionType.SITUATION_OVERVIEW,
          CrisisBriefSectionType.RECOMMENDED_ACTIONS,
          CrisisBriefSectionType.NEXT_STEPS,
        ];
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  private async generateIncidentCode(orgId: string): Promise<string> {
    const { count } = await this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const num = (count || 0) + 1;
    const date = new Date();
    return `CR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(num).padStart(4, '0')}`;
  }

  private calculatePriorityScore(severity: CrisisSeverity): number {
    switch (severity) {
      case CrisisSeverity.SEVERE:
        return 100;
      case CrisisSeverity.CRITICAL:
        return 90;
      case CrisisSeverity.HIGH:
        return 75;
      case CrisisSeverity.MEDIUM:
        return 50;
      case CrisisSeverity.LOW:
        return 25;
      default:
        return 50;
    }
  }

  private mapAlertSeverity(priority: string): CrisisSeverity {
    switch (priority) {
      case 'critical':
        return CrisisSeverity.CRITICAL;
      case 'high':
        return CrisisSeverity.HIGH;
      case 'medium':
        return CrisisSeverity.MEDIUM;
      default:
        return CrisisSeverity.LOW;
    }
  }

  private mapSortColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      severity: 'severity',
      riskScore: 'risk_score',
      mentionCount: 'mention_count',
    };
    return mapping[sortBy] || 'created_at';
  }

  // =========================================================================
  // AUDIT LOGGING
  // =========================================================================

  private async logAuditEvent(
    orgId: string,
    userId: string | null,
    incidentId: string | null,
    action: string,
    entityType: 'incident' | 'action' | 'brief' | 'signal' | 'rule' | 'event',
    entityId: string | null,
    oldValue: Record<string, unknown> | null,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('crisis_audit_log').insert({
        org_id: orgId,
        user_id: userId,
        incident_id: incidentId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_value: oldValue,
        new_value: null,
        metadata,
      });
    } catch (error) {
      logger.error('Failed to log audit event', { error, action });
    }
  }

  // =========================================================================
  // DATABASE MAPPERS
  // =========================================================================

  private mapIncidentFromDb(row: Record<string, unknown>): CrisisIncident {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      summary: row.summary as string | undefined,
      incidentCode: row.incident_code as string | undefined,
      severity: row.severity as CrisisSeverity,
      trajectory: row.trajectory as CrisisTrajectory,
      propagationLevel: row.propagation_level as CrisisPropagationLevel,
      crisisType: row.crisis_type as string | undefined,
      affectedProducts: (row.affected_products as string[]) || [],
      affectedRegions: (row.affected_regions as string[]) || [],
      affectedStakeholders: (row.affected_stakeholders as string[]) || [],
      keywords: (row.keywords as string[]) || [],
      topics: (row.topics as string[]) || [],
      linkedSignalIds: (row.linked_signal_ids as string[]) || [],
      linkedEventIds: (row.linked_event_ids as string[]) || [],
      linkedMentionIds: (row.linked_mention_ids as string[]) || [],
      linkedAlertIds: (row.linked_alert_ids as string[]) || [],
      linkedArticleIds: (row.linked_article_ids as string[]) || [],
      linkedCompetitorIds: (row.linked_competitor_ids as string[]) || [],
      sentimentScore: row.sentiment_score as number | undefined,
      sentimentTrend: row.sentiment_trend as number | undefined,
      mentionCount: (row.mention_count as number) || 0,
      estimatedReach: (row.estimated_reach as number) || 0,
      mediaValueImpact: row.media_value_impact as number | undefined,
      propagationScore: row.propagation_score as number | undefined,
      riskScore: row.risk_score as number | undefined,
      sentimentHistory: (row.sentiment_history as { timestamp: Date; score: number }[]) || [],
      mentionHistory: (row.mention_history as { timestamp: Date; count: number }[]) || [],
      status: row.status as IncidentStatus,
      isEscalated: (row.is_escalated as boolean) || false,
      escalationLevel: (row.escalation_level as number) || 0,
      firstDetectedAt: new Date(row.first_detected_at as string),
      escalatedAt: row.escalated_at ? new Date(row.escalated_at as string) : undefined,
      containedAt: row.contained_at ? new Date(row.contained_at as string) : undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      closedAt: row.closed_at ? new Date(row.closed_at as string) : undefined,
      ownerId: row.owner_id as string | undefined,
      teamIds: (row.team_ids as string[]) || [],
      createdBy: row.created_by as string,
      llmModel: row.llm_model as string | undefined,
      llmGeneratedSummary: row.llm_generated_summary as string | undefined,
      llmRiskAssessment: row.llm_risk_assessment as RiskAssessment | undefined,
      llmRecommendations: row.llm_recommendations as ActionRecommendation[] | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapSignalFromDb(row: Record<string, unknown>): CrisisSignal {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      signalType: row.signal_type as string,
      title: row.title as string,
      description: row.description as string | undefined,
      severity: row.severity as CrisisSeverity,
      confidenceScore: (row.confidence_score as number) || 0,
      priorityScore: (row.priority_score as number) || 0,
      detectionMethod: row.detection_method as string,
      triggerConditions: (row.trigger_conditions as Record<string, unknown>) || {},
      sourceEvents: (row.source_events as string[]) || [],
      sourceSystems: (row.source_systems as CrisisSourceSystem[]) || [],
      sentimentScore: row.sentiment_score as number | undefined,
      sentimentVelocity: row.sentiment_velocity as number | undefined,
      mentionVelocity: row.mention_velocity as number | undefined,
      estimatedImpact: row.estimated_impact as number | undefined,
      propagationScore: row.propagation_score as number | undefined,
      windowStart: new Date(row.window_start as string),
      windowEnd: new Date(row.window_end as string),
      isActive: (row.is_active as boolean) || false,
      isEscalated: (row.is_escalated as boolean) || false,
      escalatedAt: row.escalated_at ? new Date(row.escalated_at as string) : undefined,
      escalatedBy: row.escalated_by as string | undefined,
      linkedIncidentId: row.linked_incident_id as string | undefined,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at as string) : undefined,
      acknowledgedBy: row.acknowledged_by as string | undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      resolvedBy: row.resolved_by as string | undefined,
      resolutionNotes: row.resolution_notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapActionFromDb(row: Record<string, unknown>): CrisisAction {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      incidentId: row.incident_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      actionType: row.action_type as CrisisActionType,
      status: row.status as CrisisActionStatus,
      priorityScore: (row.priority_score as number) || 0,
      urgency: row.urgency as CrisisUrgency | undefined,
      dueAt: row.due_at ? new Date(row.due_at as string) : undefined,
      estimatedDurationMins: row.estimated_duration_mins as number | undefined,
      isAiGenerated: (row.is_ai_generated as boolean) || false,
      generationContext: row.generation_context as Record<string, unknown> | undefined,
      llmModel: row.llm_model as string | undefined,
      confidenceScore: row.confidence_score as number | undefined,
      assignedTo: row.assigned_to as string | undefined,
      approvedBy: row.approved_by as string | undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
      startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      completionNotes: row.completion_notes as string | undefined,
      outcome: row.outcome as 'success' | 'partial' | 'failed' | undefined,
      outcomeNotes: row.outcome_notes as string | undefined,
      impactAssessment: row.impact_assessment as Record<string, unknown> | undefined,
      linkedContentIds: (row.linked_content_ids as string[]) || [],
      attachments: (row.attachments as { id: string; name: string; url: string; type: string }[]) || [],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
    };
  }

  private mapBriefFromDb(row: Record<string, unknown>): CrisisBrief {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      incidentId: row.incident_id as string,
      title: row.title as string,
      subtitle: row.subtitle as string | undefined,
      format: row.format as CrisisBriefFormat,
      version: (row.version as number) || 1,
      executiveSummary: row.executive_summary as string | undefined,
      keyTakeaways: (row.key_takeaways as { title: string; content: string; priority: number }[]) || [],
      riskAssessment: row.risk_assessment as RiskAssessment | undefined,
      recommendations: (row.recommendations as ActionRecommendation[]) || [],
      status: row.status as 'draft' | 'generated' | 'reviewed' | 'approved',
      isCurrent: (row.is_current as boolean) || false,
      generatedAt: row.generated_at ? new Date(row.generated_at as string) : undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : undefined,
      reviewedBy: row.reviewed_by as string | undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
      approvedBy: row.approved_by as string | undefined,
      llmModel: row.llm_model as string | undefined,
      llmTemperature: row.llm_temperature as number | undefined,
      totalTokensUsed: (row.total_tokens_used as number) || 0,
      generationDurationMs: row.generation_duration_ms as number | undefined,
      generationContext: row.generation_context as Record<string, unknown> | undefined,
      sharedWith: (row.shared_with as string[]) || [],
      sharedAt: row.shared_at ? new Date(row.shared_at as string) : undefined,
      distributionChannels: (row.distribution_channels as string[]) || [],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
    };
  }

  private mapSectionFromDb(row: Record<string, unknown>): CrisisBriefSection {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      briefId: row.brief_id as string,
      sectionType: row.section_type as CrisisBriefSectionType,
      title: row.title as string | undefined,
      sortOrder: (row.sort_order as number) || 0,
      content: row.content as string | undefined,
      summary: row.summary as string | undefined,
      bulletPoints: (row.bullet_points as BulletPoint[]) || [],
      supportingData: (row.supporting_data as Record<string, unknown>) || {},
      sourceReferences: (row.source_references as { type: string; id?: string; title: string }[]) || [],
      isGenerated: (row.is_generated as boolean) || false,
      isManuallyEdited: (row.is_manually_edited as boolean) || false,
      generationPrompt: row.generation_prompt as string | undefined,
      llmModel: row.llm_model as string | undefined,
      tokensUsed: row.tokens_used as number | undefined,
      generationDurationMs: row.generation_duration_ms as number | undefined,
      generatedAt: row.generated_at ? new Date(row.generated_at as string) : undefined,
      editedAt: row.edited_at ? new Date(row.edited_at as string) : undefined,
      editedBy: row.edited_by as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRuleFromDb(row: Record<string, unknown>): CrisisEscalationRule {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      ruleType: row.rule_type as EscalationRuleType,
      conditions: (row.conditions as Record<string, unknown>) || {},
      escalationActions: (row.escalation_actions as EscalationAction[]) || [],
      escalationLevel: (row.escalation_level as number) || 1,
      notifyChannels: (row.notify_channels as string[]) || [],
      notifyRoles: (row.notify_roles as string[]) || [],
      notifyUserIds: (row.notify_user_ids as string[]) || [],
      isActive: (row.is_active as boolean) || false,
      isSystem: (row.is_system as boolean) || false,
      lastTriggeredAt: row.last_triggered_at ? new Date(row.last_triggered_at as string) : undefined,
      triggerCount: (row.trigger_count as number) || 0,
      cooldownMinutes: (row.cooldown_minutes as number) || 60,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
    };
  }
}
