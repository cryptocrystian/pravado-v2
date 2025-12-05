/**
 * Risk Radar Service (Sprint S60)
 * Executive Risk Radar & Predictive Crisis Forecasting Engine
 *
 * Features:
 * - Snapshot management with risk index computation
 * - Indicator aggregation from integrated systems (S40-S59)
 * - Predictive forecasting with LLM-assisted narrative synthesis
 * - Driver identification and tracking
 * - Collaborative notes for executive teams
 * - Dashboard aggregation for real-time risk visibility
 * - Comprehensive audit logging
 */

import type {
  RiskRadarSnapshot,
  RiskRadarIndicator,
  RiskRadarForecast,
  RiskRadarDriver,
  RiskRadarNote,
  RiskRadarSignalMatrix,
  RiskRadarConcern,
  RiskRadarEmergingRisk,
  RiskRadarPositiveFactor,
  RiskRadarProjectionPoint,
  RiskRadarForecastAssumption,
  RiskRadarRecommendedAction,
  RiskRadarWatchItem,
  RiskRadarAffectedEntity,
  RiskRadarDashboard,
  RiskRadarTrendPoint,
  RiskRadarDistribution,
  RiskRadarComponentSummary,
  RiskRadarLevel,
  RiskRadarIndicatorType,
  RiskRadarForecastHorizon,
  RiskRadarDriverCategory,
  RiskRadarNoteType,
  RiskRadarTrendDirection,
  RiskRadarSnapshotsListResponse,
  RiskRadarSnapshotDetailResponse,
  RiskRadarIndicatorsListResponse,
  RiskRadarForecastsListResponse,
  RiskRadarDriversListResponse,
  RiskRadarNotesListResponse,
  RiskRadarRebuildIndicatorsResponse,
  RiskRadarForecastGenerationResponse,
  RiskRadarNarrativeContext,
  RiskRadarForecastNarrative,
  CreateRiskRadarSnapshotInput,
  UpdateRiskRadarSnapshotInput,
  CreateRiskRadarIndicatorInput,
  CreateRiskRadarForecastInput,
  RegenerateRiskRadarForecastInput,
  CreateRiskRadarDriverInput,
  CreateRiskRadarNoteInput,
  UpdateRiskRadarNoteInput,
  RiskRadarSnapshotsQuery,
  RiskRadarIndicatorsQuery,
  RiskRadarForecastsQuery,
  RiskRadarDriversQuery,
  RiskRadarNotesQuery,
  RiskRadarDashboardQuery,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('risk-radar-service');

// ========================================
// Database Record Types (snake_case)
// ========================================

interface SnapshotRecord {
  id: string;
  org_id: string;
  snapshot_date: string;
  title: string | null;
  description: string | null;
  overall_risk_index: number;
  risk_level: string;
  confidence_score: number | null;
  sentiment_score: number | null;
  velocity_score: number | null;
  alert_score: number | null;
  competitive_score: number | null;
  governance_score: number | null;
  persona_score: number | null;
  signal_matrix: Record<string, unknown>;
  key_concerns: unknown[];
  emerging_risks: unknown[];
  positive_factors: unknown[];
  is_active: boolean;
  is_archived: boolean;
  computation_method: string;
  model_version: string | null;
  computation_duration_ms: number | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface IndicatorRecord {
  id: string;
  org_id: string;
  snapshot_id: string;
  indicator_type: string;
  name: string;
  description: string | null;
  score: number;
  weight: number;
  normalized_score: number | null;
  previous_score: number | null;
  score_delta: number | null;
  trend_direction: string | null;
  velocity: number | null;
  source_system: string;
  source_reference_id: string | null;
  source_data: Record<string, unknown>;
  measurement_start: string | null;
  measurement_end: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ForecastRecord {
  id: string;
  org_id: string;
  snapshot_id: string;
  horizon: string;
  forecast_date: string;
  target_date: string;
  predicted_risk_index: number;
  predicted_risk_level: string;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  probability_of_crisis: number | null;
  projection_curve: unknown[];
  executive_summary: string | null;
  detailed_analysis: string | null;
  key_assumptions: unknown[];
  recommended_actions: unknown[];
  watch_items: unknown[];
  model_name: string | null;
  model_version: string | null;
  llm_model: string | null;
  tokens_used: number | null;
  generation_duration_ms: number | null;
  is_current: boolean;
  superseded_by: string | null;
  accuracy_score: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DriverRecord {
  id: string;
  org_id: string;
  snapshot_id: string;
  category: string;
  name: string;
  description: string | null;
  impact_score: number;
  contribution_percentage: number | null;
  urgency: string;
  source_system: string | null;
  source_reference_id: string | null;
  source_data: Record<string, unknown>;
  is_emerging: boolean;
  is_turning_point: boolean;
  first_detected_at: string | null;
  trend_velocity: number | null;
  affected_entities: unknown[];
  related_indicator_ids: string[];
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NoteRecord {
  id: string;
  org_id: string;
  snapshot_id: string;
  note_type: string;
  title: string | null;
  content: string;
  related_indicator_id: string | null;
  related_driver_id: string | null;
  related_forecast_id: string | null;
  is_executive_visible: boolean;
  is_pinned: boolean;
  metadata: Record<string, unknown>;
  tags: string[];
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLogRecord {
  id: string;
  org_id: string;
  operation: string;
  entity_type: string;
  entity_id: string | null;
  request_id: string | null;
  user_id: string | null;
  user_email: string | null;
  llm_model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  tokens_total: number | null;
  duration_ms: number | null;
  prompt_preview: string | null;
  response_preview: string | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ========================================
// Weight Configuration
// ========================================

interface IndicatorWeight {
  type: RiskRadarIndicatorType;
  weight: number;
}

const DEFAULT_INDICATOR_WEIGHTS: IndicatorWeight[] = [
  { type: 'sentiment', weight: 0.15 },
  { type: 'velocity', weight: 0.12 },
  { type: 'alerts', weight: 0.15 },
  { type: 'competitive', weight: 0.10 },
  { type: 'governance', weight: 0.12 },
  { type: 'persona', weight: 0.08 },
  { type: 'media_coverage', weight: 0.10 },
  { type: 'crisis_history', weight: 0.10 },
  { type: 'reputation', weight: 0.08 },
];

// ========================================
// Risk Radar Service Class
// ========================================

export class RiskRadarService {
  constructor(private supabase: SupabaseClient) {}

  // ========================================
  // Snapshot Methods
  // ========================================

  async createSnapshot(
    orgId: string,
    input: CreateRiskRadarSnapshotInput,
    userId?: string
  ): Promise<RiskRadarSnapshot> {
    const startTime = Date.now();
    const snapshotId = uuidv4();
    const snapshotDate = new Date();

    // Collect signals from integrated systems if not provided
    const signalMatrix = input.signalMatrix || await this.collectSignalMatrix(orgId);

    // Compute component scores from signal matrix
    const componentScores = this.computeComponentScores(signalMatrix);

    // Compute overall risk index
    const overallRiskIndex = this.computeOverallRiskIndex(componentScores);
    const riskLevel = this.classifyRiskLevel(overallRiskIndex);

    // Identify concerns and emerging risks
    const keyConcerns = this.identifyKeyConcerns(signalMatrix, componentScores);
    const emergingRisks = this.identifyEmergingRisks(signalMatrix, componentScores);
    const positiveFactors = this.identifyPositiveFactors(signalMatrix, componentScores);

    const computationDurationMs = Date.now() - startTime;

    const record: Omit<SnapshotRecord, 'created_at' | 'updated_at'> = {
      id: snapshotId,
      org_id: orgId,
      snapshot_date: snapshotDate.toISOString(),
      title: input.title || null,
      description: input.description || null,
      overall_risk_index: overallRiskIndex,
      risk_level: riskLevel,
      confidence_score: this.computeConfidenceScore(signalMatrix),
      sentiment_score: componentScores.sentimentScore ?? null,
      velocity_score: componentScores.velocityScore ?? null,
      alert_score: componentScores.alertScore ?? null,
      competitive_score: componentScores.competitiveScore ?? null,
      governance_score: componentScores.governanceScore ?? null,
      persona_score: componentScores.personaScore ?? null,
      signal_matrix: signalMatrix as Record<string, unknown>,
      key_concerns: keyConcerns,
      emerging_risks: emergingRisks,
      positive_factors: positiveFactors,
      is_active: true,
      is_archived: false,
      computation_method: input.computationMethod || 'weighted_aggregate',
      model_version: '1.0.0',
      computation_duration_ms: computationDurationMs,
      created_by: userId || null,
      updated_by: userId || null,
    };

    const { data, error } = await this.supabase
      .from('risk_radar_snapshots')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create snapshot', { error, orgId });
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }

    // Deactivate previous active snapshots
    await this.supabase
      .from('risk_radar_snapshots')
      .update({ is_active: false })
      .eq('org_id', orgId)
      .neq('id', snapshotId)
      .eq('is_active', true);

    // Log audit entry
    await this.logAudit(orgId, 'create_snapshot', 'snapshot', snapshotId, userId, {
      riskLevel,
      overallRiskIndex,
      computationDurationMs,
    });

    logger.info('Snapshot created', { orgId, snapshotId, riskLevel, overallRiskIndex });
    return this.mapSnapshotRecord(data);
  }

  async getSnapshot(orgId: string, snapshotId: string): Promise<RiskRadarSnapshot | null> {
    const { data, error } = await this.supabase
      .from('risk_radar_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get snapshot', { error, orgId, snapshotId });
      throw new Error(`Failed to get snapshot: ${error.message}`);
    }

    return this.mapSnapshotRecord(data);
  }

  async getSnapshotDetail(
    orgId: string,
    snapshotId: string
  ): Promise<RiskRadarSnapshotDetailResponse | null> {
    const snapshot = await this.getSnapshot(orgId, snapshotId);
    if (!snapshot) return null;

    const [indicatorsResult, driversResult, forecastsResult, notesResult] = await Promise.all([
      this.listIndicators(orgId, snapshotId, { limit: 100 }),
      this.listDrivers(orgId, snapshotId, { limit: 20 }),
      this.listForecasts(orgId, snapshotId, { isCurrent: true, limit: 1 }),
      this.listNotes(orgId, snapshotId, { limit: 10 }),
    ]);

    return {
      snapshot,
      indicators: indicatorsResult.indicators,
      drivers: driversResult.drivers,
      currentForecast: forecastsResult.forecasts[0],
      recentNotes: notesResult.notes,
    };
  }

  async listSnapshots(
    orgId: string,
    query: RiskRadarSnapshotsQuery = {}
  ): Promise<RiskRadarSnapshotsListResponse> {
    const {
      riskLevel,
      isActive,
      isArchived,
      startDate,
      endDate,
      minRiskIndex,
      maxRiskIndex,
      sortBy = 'snapshot_date',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('risk_radar_snapshots')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (riskLevel) {
      if (Array.isArray(riskLevel)) {
        dbQuery = dbQuery.in('risk_level', riskLevel);
      } else {
        dbQuery = dbQuery.eq('risk_level', riskLevel);
      }
    }

    if (isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', isActive);
    }

    if (isArchived !== undefined) {
      dbQuery = dbQuery.eq('is_archived', isArchived);
    }

    if (startDate) {
      dbQuery = dbQuery.gte('snapshot_date', startDate.toISOString());
    }

    if (endDate) {
      dbQuery = dbQuery.lte('snapshot_date', endDate.toISOString());
    }

    if (minRiskIndex !== undefined) {
      dbQuery = dbQuery.gte('overall_risk_index', minRiskIndex);
    }

    if (maxRiskIndex !== undefined) {
      dbQuery = dbQuery.lte('overall_risk_index', maxRiskIndex);
    }

    const sortColumn = sortBy === 'overall_risk_index' ? 'overall_risk_index' :
                       sortBy === 'created_at' ? 'created_at' : 'snapshot_date';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list snapshots', { error, orgId });
      throw new Error(`Failed to list snapshots: ${error.message}`);
    }

    const snapshots = (data || []).map(this.mapSnapshotRecord);
    const total = count || 0;

    return {
      snapshots,
      total,
      hasMore: offset + snapshots.length < total,
    };
  }

  async updateSnapshot(
    orgId: string,
    snapshotId: string,
    input: UpdateRiskRadarSnapshotInput,
    userId?: string
  ): Promise<RiskRadarSnapshot> {
    const updates: Record<string, unknown> = { updated_by: userId || null };

    if (input.title !== undefined) {
      updates.title = input.title;
    }
    if (input.description !== undefined) {
      updates.description = input.description;
    }
    if (input.isActive !== undefined) {
      updates.is_active = input.isActive;
    }
    if (input.isArchived !== undefined) {
      updates.is_archived = input.isArchived;
    }

    const { data, error } = await this.supabase
      .from('risk_radar_snapshots')
      .update(updates)
      .eq('id', snapshotId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update snapshot', { error, orgId, snapshotId });
      throw new Error(`Failed to update snapshot: ${error.message}`);
    }

    await this.logAudit(orgId, 'update_snapshot', 'snapshot', snapshotId, userId, { updates });

    logger.info('Snapshot updated', { orgId, snapshotId });
    return this.mapSnapshotRecord(data);
  }

  async archiveSnapshot(orgId: string, snapshotId: string, userId?: string): Promise<void> {
    await this.updateSnapshot(orgId, snapshotId, { isArchived: true, isActive: false }, userId);
    logger.info('Snapshot archived', { orgId, snapshotId });
  }

  async getActiveSnapshot(orgId: string): Promise<RiskRadarSnapshot | null> {
    const { data, error } = await this.supabase
      .from('risk_radar_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get active snapshot', { error, orgId });
      throw new Error(`Failed to get active snapshot: ${error.message}`);
    }

    return this.mapSnapshotRecord(data);
  }

  // ========================================
  // Indicator Methods
  // ========================================

  async createIndicator(
    orgId: string,
    snapshotId: string,
    input: CreateRiskRadarIndicatorInput
  ): Promise<RiskRadarIndicator> {
    // Get previous indicator of same type for delta calculation
    const previousIndicator = await this.getPreviousIndicator(orgId, snapshotId, input.indicatorType);
    const scoreDelta = previousIndicator ? input.score - previousIndicator.score : null;
    const trendDirection = this.calculateTrendDirection(scoreDelta);

    const record: Omit<IndicatorRecord, 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      org_id: orgId,
      snapshot_id: snapshotId,
      indicator_type: input.indicatorType,
      name: input.name,
      description: input.description || null,
      score: input.score,
      weight: input.weight ?? this.getDefaultWeight(input.indicatorType),
      normalized_score: this.normalizeScore(input.score),
      previous_score: previousIndicator?.score ?? null,
      score_delta: scoreDelta,
      trend_direction: trendDirection,
      velocity: this.calculateVelocity(scoreDelta, previousIndicator),
      source_system: input.sourceSystem,
      source_reference_id: input.sourceReferenceId || null,
      source_data: input.sourceData || {},
      measurement_start: input.measurementStart?.toISOString() || null,
      measurement_end: input.measurementEnd?.toISOString() || null,
      metadata: {},
      tags: input.tags || [],
    };

    const { data, error } = await this.supabase
      .from('risk_radar_indicators')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create indicator', { error, orgId, snapshotId });
      throw new Error(`Failed to create indicator: ${error.message}`);
    }

    logger.info('Indicator created', { orgId, snapshotId, indicatorType: input.indicatorType });
    return this.mapIndicatorRecord(data);
  }

  async listIndicators(
    orgId: string,
    snapshotId: string,
    query: RiskRadarIndicatorsQuery = {}
  ): Promise<RiskRadarIndicatorsListResponse> {
    const {
      indicatorType,
      sourceSystem,
      minScore,
      maxScore,
      trendDirection,
      sortBy = 'score',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('risk_radar_indicators')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId);

    if (indicatorType) {
      if (Array.isArray(indicatorType)) {
        dbQuery = dbQuery.in('indicator_type', indicatorType);
      } else {
        dbQuery = dbQuery.eq('indicator_type', indicatorType);
      }
    }

    if (sourceSystem) {
      dbQuery = dbQuery.eq('source_system', sourceSystem);
    }

    if (minScore !== undefined) {
      dbQuery = dbQuery.gte('score', minScore);
    }

    if (maxScore !== undefined) {
      dbQuery = dbQuery.lte('score', maxScore);
    }

    if (trendDirection) {
      dbQuery = dbQuery.eq('trend_direction', trendDirection);
    }

    const sortColumn = sortBy === 'created_at' ? 'created_at' :
                       sortBy === 'indicator_type' ? 'indicator_type' : 'score';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list indicators', { error, orgId, snapshotId });
      throw new Error(`Failed to list indicators: ${error.message}`);
    }

    const indicators = (data || []).map(this.mapIndicatorRecord);
    const total = count || 0;

    return {
      indicators,
      total,
      hasMore: offset + indicators.length < total,
    };
  }

  async rebuildIndicators(
    orgId: string,
    snapshotId: string,
    userId?: string
  ): Promise<RiskRadarRebuildIndicatorsResponse> {
    const startTime = Date.now();

    // Collect fresh signals
    const signalMatrix = await this.collectSignalMatrix(orgId);

    // Delete existing indicators for this snapshot
    await this.supabase
      .from('risk_radar_indicators')
      .delete()
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId);

    // Create new indicators from signal matrix
    const indicators = await this.createIndicatorsFromSignals(orgId, snapshotId, signalMatrix);

    // Recompute snapshot scores
    const componentScores = this.computeComponentScores(signalMatrix);
    const newRiskIndex = this.computeOverallRiskIndex(componentScores);
    const newRiskLevel = this.classifyRiskLevel(newRiskIndex);

    // Update snapshot with new scores
    await this.supabase
      .from('risk_radar_snapshots')
      .update({
        overall_risk_index: newRiskIndex,
        risk_level: newRiskLevel,
        sentiment_score: componentScores.sentimentScore,
        velocity_score: componentScores.velocityScore,
        alert_score: componentScores.alertScore,
        competitive_score: componentScores.competitiveScore,
        governance_score: componentScores.governanceScore,
        persona_score: componentScores.personaScore,
        signal_matrix: signalMatrix,
        updated_by: userId || null,
      })
      .eq('id', snapshotId)
      .eq('org_id', orgId);

    const durationMs = Date.now() - startTime;

    await this.logAudit(orgId, 'rebuild_indicators', 'snapshot', snapshotId, userId, {
      indicatorsCreated: indicators.length,
      newRiskIndex,
      newRiskLevel,
      durationMs,
    });

    logger.info('Indicators rebuilt', { orgId, snapshotId, count: indicators.length });

    return {
      indicatorsCreated: indicators.length,
      indicatorsUpdated: 0,
      newRiskIndex,
      newRiskLevel,
      durationMs,
    };
  }

  // ========================================
  // Forecast Methods
  // ========================================

  async createForecast(
    orgId: string,
    snapshotId: string,
    input: CreateRiskRadarForecastInput,
    userId?: string
  ): Promise<RiskRadarForecastGenerationResponse> {
    const startTime = Date.now();

    // Get snapshot and indicators
    const snapshot = await this.getSnapshot(orgId, snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const { indicators } = await this.listIndicators(orgId, snapshotId, { limit: 100 });
    const { drivers } = await this.listDrivers(orgId, snapshotId, { limit: 20 });

    // Calculate target date based on horizon
    const forecastDate = new Date();
    const targetDate = this.calculateTargetDate(forecastDate, input.horizon);

    // Generate projection curve
    const projectionCurve = this.generateProjectionCurve(
      snapshot.overallRiskIndex,
      indicators,
      drivers,
      input.horizon
    );

    // Calculate predicted values
    const predictedRiskIndex = projectionCurve[projectionCurve.length - 1]?.value ?? snapshot.overallRiskIndex;
    const predictedRiskLevel = this.classifyRiskLevel(predictedRiskIndex);
    const probabilityOfCrisis = this.calculateCrisisProbability(projectionCurve, drivers);

    // Generate narrative (with LLM if requested)
    let narrative: RiskRadarForecastNarrative | null = null;
    let tokensUsed = 0;

    if (input.useLlm) {
      const narrativeContext: RiskRadarNarrativeContext = {
        snapshot,
        indicators,
        drivers,
        horizon: input.horizon,
      };
      const narrativeResult = await this.generateNarrative(narrativeContext, input.llmModel, input.customPrompt);
      narrative = narrativeResult.narrative;
      tokensUsed = narrativeResult.tokensUsed;
    } else {
      narrative = this.generateBasicNarrative(snapshot, indicators, drivers, input.horizon);
    }

    // Mark previous forecasts as superseded
    await this.supabase
      .from('risk_radar_forecasts')
      .update({ is_current: false })
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId)
      .eq('horizon', input.horizon)
      .eq('is_current', true);

    const forecastId = uuidv4();
    const generationDurationMs = Date.now() - startTime;

    const record: Omit<ForecastRecord, 'created_at' | 'updated_at'> = {
      id: forecastId,
      org_id: orgId,
      snapshot_id: snapshotId,
      horizon: input.horizon,
      forecast_date: forecastDate.toISOString(),
      target_date: targetDate.toISOString(),
      predicted_risk_index: predictedRiskIndex,
      predicted_risk_level: predictedRiskLevel,
      confidence_interval_low: Math.max(0, predictedRiskIndex - 10),
      confidence_interval_high: Math.min(100, predictedRiskIndex + 10),
      probability_of_crisis: probabilityOfCrisis,
      projection_curve: projectionCurve,
      executive_summary: narrative?.executiveSummary || null,
      detailed_analysis: narrative?.detailedAnalysis || null,
      key_assumptions: narrative?.keyAssumptions || [],
      recommended_actions: narrative?.recommendedActions || [],
      watch_items: narrative?.watchItems || [],
      model_name: 'risk_radar_v1',
      model_version: '1.0.0',
      llm_model: input.llmModel || null,
      tokens_used: tokensUsed || null,
      generation_duration_ms: generationDurationMs,
      is_current: true,
      superseded_by: null,
      accuracy_score: null,
      created_by: userId || null,
    };

    const { data, error } = await this.supabase
      .from('risk_radar_forecasts')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create forecast', { error, orgId, snapshotId });
      throw new Error(`Failed to create forecast: ${error.message}`);
    }

    await this.logAudit(orgId, 'create_forecast', 'forecast', forecastId, userId, {
      horizon: input.horizon,
      predictedRiskIndex,
      predictedRiskLevel,
      probabilityOfCrisis,
      tokensUsed,
      generationDurationMs,
    }, input.llmModel, tokensUsed);

    logger.info('Forecast created', { orgId, snapshotId, forecastId, horizon: input.horizon });

    return {
      forecast: this.mapForecastRecord(data),
      tokensUsed,
      durationMs: generationDurationMs,
    };
  }

  async getForecast(orgId: string, forecastId: string): Promise<RiskRadarForecast | null> {
    const { data, error } = await this.supabase
      .from('risk_radar_forecasts')
      .select('*')
      .eq('id', forecastId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get forecast', { error, orgId, forecastId });
      throw new Error(`Failed to get forecast: ${error.message}`);
    }

    return this.mapForecastRecord(data);
  }

  async listForecasts(
    orgId: string,
    snapshotId: string,
    query: RiskRadarForecastsQuery = {}
  ): Promise<RiskRadarForecastsListResponse> {
    const {
      horizon,
      isCurrent,
      minProbability,
      maxProbability,
      sortBy = 'forecast_date',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('risk_radar_forecasts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId);

    if (horizon) {
      if (Array.isArray(horizon)) {
        dbQuery = dbQuery.in('horizon', horizon);
      } else {
        dbQuery = dbQuery.eq('horizon', horizon);
      }
    }

    if (isCurrent !== undefined) {
      dbQuery = dbQuery.eq('is_current', isCurrent);
    }

    if (minProbability !== undefined) {
      dbQuery = dbQuery.gte('probability_of_crisis', minProbability);
    }

    if (maxProbability !== undefined) {
      dbQuery = dbQuery.lte('probability_of_crisis', maxProbability);
    }

    const sortColumn = sortBy === 'predicted_risk_index' ? 'predicted_risk_index' :
                       sortBy === 'probability_of_crisis' ? 'probability_of_crisis' : 'forecast_date';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list forecasts', { error, orgId, snapshotId });
      throw new Error(`Failed to list forecasts: ${error.message}`);
    }

    const forecasts = (data || []).map(this.mapForecastRecord);
    const total = count || 0;

    return {
      forecasts,
      total,
      hasMore: offset + forecasts.length < total,
    };
  }

  async regenerateForecast(
    orgId: string,
    forecastId: string,
    input: RegenerateRiskRadarForecastInput,
    userId?: string
  ): Promise<RiskRadarForecastGenerationResponse> {
    const existingForecast = await this.getForecast(orgId, forecastId);
    if (!existingForecast) {
      throw new Error('Forecast not found');
    }

    // Mark existing as superseded
    await this.supabase
      .from('risk_radar_forecasts')
      .update({ is_current: false })
      .eq('id', forecastId)
      .eq('org_id', orgId);

    // Create new forecast with same horizon
    return this.createForecast(
      orgId,
      existingForecast.snapshotId,
      {
        horizon: existingForecast.horizon,
        useLlm: input.useLlm ?? true,
        llmModel: input.llmModel,
        customPrompt: input.customPrompt,
      },
      userId
    );
  }

  // ========================================
  // Driver Methods
  // ========================================

  async createDriver(
    orgId: string,
    snapshotId: string,
    input: CreateRiskRadarDriverInput
  ): Promise<RiskRadarDriver> {
    const record: Omit<DriverRecord, 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      org_id: orgId,
      snapshot_id: snapshotId,
      category: input.category,
      name: input.name,
      description: input.description || null,
      impact_score: input.impactScore,
      contribution_percentage: input.contributionPercentage || null,
      urgency: input.urgency || 'medium',
      source_system: input.sourceSystem || null,
      source_reference_id: input.sourceReferenceId || null,
      source_data: input.sourceData || {},
      is_emerging: input.isEmerging ?? false,
      is_turning_point: input.isTurningPoint ?? false,
      first_detected_at: input.isEmerging ? new Date().toISOString() : null,
      trend_velocity: null,
      affected_entities: input.affectedEntities || [],
      related_indicator_ids: input.relatedIndicatorIds || [],
      metadata: {},
      tags: input.tags || [],
    };

    const { data, error } = await this.supabase
      .from('risk_radar_drivers')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create driver', { error, orgId, snapshotId });
      throw new Error(`Failed to create driver: ${error.message}`);
    }

    logger.info('Driver created', { orgId, snapshotId, driverId: data.id, category: input.category });
    return this.mapDriverRecord(data);
  }

  async listDrivers(
    orgId: string,
    snapshotId: string,
    query: RiskRadarDriversQuery = {}
  ): Promise<RiskRadarDriversListResponse> {
    const {
      category,
      urgency,
      isEmerging,
      isTurningPoint,
      minImpactScore,
      sortBy = 'impact_score',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('risk_radar_drivers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId);

    if (category) {
      if (Array.isArray(category)) {
        dbQuery = dbQuery.in('category', category);
      } else {
        dbQuery = dbQuery.eq('category', category);
      }
    }

    if (urgency) {
      if (Array.isArray(urgency)) {
        dbQuery = dbQuery.in('urgency', urgency);
      } else {
        dbQuery = dbQuery.eq('urgency', urgency);
      }
    }

    if (isEmerging !== undefined) {
      dbQuery = dbQuery.eq('is_emerging', isEmerging);
    }

    if (isTurningPoint !== undefined) {
      dbQuery = dbQuery.eq('is_turning_point', isTurningPoint);
    }

    if (minImpactScore !== undefined) {
      dbQuery = dbQuery.gte('impact_score', minImpactScore);
    }

    const sortColumn = sortBy === 'contribution_percentage' ? 'contribution_percentage' :
                       sortBy === 'created_at' ? 'created_at' : 'impact_score';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list drivers', { error, orgId, snapshotId });
      throw new Error(`Failed to list drivers: ${error.message}`);
    }

    const drivers = (data || []).map(this.mapDriverRecord);
    const total = count || 0;

    return {
      drivers,
      total,
      hasMore: offset + drivers.length < total,
    };
  }

  async identifyDriversFromIndicators(
    orgId: string,
    snapshotId: string
  ): Promise<RiskRadarDriver[]> {
    const { indicators } = await this.listIndicators(orgId, snapshotId, { limit: 100 });

    const drivers: RiskRadarDriver[] = [];

    for (const indicator of indicators) {
      // Identify high-impact indicators as drivers
      if (indicator.score >= 70) {
        const driver = await this.createDriver(orgId, snapshotId, {
          category: this.mapIndicatorTypeToDriverCategory(indicator.indicatorType),
          name: `High ${indicator.name}`,
          description: `${indicator.name} score is elevated at ${indicator.score}`,
          impactScore: indicator.score,
          contributionPercentage: indicator.weight * 100,
          urgency: indicator.score >= 85 ? 'critical' : indicator.score >= 70 ? 'high' : 'medium',
          sourceSystem: indicator.sourceSystem,
          sourceReferenceId: indicator.sourceReferenceId || undefined,
          isEmerging: indicator.trendDirection === 'worsening',
          isTurningPoint: Math.abs(indicator.scoreDelta || 0) > 20,
          relatedIndicatorIds: [indicator.id],
        });
        drivers.push(driver);
      }

      // Identify rapidly changing indicators
      if (indicator.trendDirection === 'worsening' && (indicator.scoreDelta ?? 0) > 15) {
        const driver = await this.createDriver(orgId, snapshotId, {
          category: 'velocity_spike',
          name: `Rapid ${indicator.name} Change`,
          description: `${indicator.name} increased by ${indicator.scoreDelta} points`,
          impactScore: Math.min(100, indicator.score + (indicator.scoreDelta ?? 0)),
          urgency: 'high',
          sourceSystem: indicator.sourceSystem,
          isEmerging: true,
          relatedIndicatorIds: [indicator.id],
        });
        drivers.push(driver);
      }
    }

    logger.info('Drivers identified', { orgId, snapshotId, count: drivers.length });
    return drivers;
  }

  // ========================================
  // Note Methods
  // ========================================

  async createNote(
    orgId: string,
    snapshotId: string,
    input: CreateRiskRadarNoteInput,
    userId: string
  ): Promise<RiskRadarNote> {
    const record: Omit<NoteRecord, 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      org_id: orgId,
      snapshot_id: snapshotId,
      note_type: input.noteType || 'observation',
      title: input.title || null,
      content: input.content,
      related_indicator_id: input.relatedIndicatorId || null,
      related_driver_id: input.relatedDriverId || null,
      related_forecast_id: input.relatedForecastId || null,
      is_executive_visible: input.isExecutiveVisible ?? true,
      is_pinned: input.isPinned ?? false,
      metadata: {},
      tags: input.tags || [],
      created_by: userId,
      updated_by: null,
    };

    const { data, error } = await this.supabase
      .from('risk_radar_notes')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create note', { error, orgId, snapshotId });
      throw new Error(`Failed to create note: ${error.message}`);
    }

    logger.info('Note created', { orgId, snapshotId, noteId: data.id });
    return this.mapNoteRecord(data);
  }

  async updateNote(
    orgId: string,
    noteId: string,
    input: UpdateRiskRadarNoteInput,
    userId: string
  ): Promise<RiskRadarNote> {
    const updates: Record<string, unknown> = { updated_by: userId };

    if (input.title !== undefined) {
      updates.title = input.title;
    }
    if (input.content !== undefined) {
      updates.content = input.content;
    }
    if (input.isExecutiveVisible !== undefined) {
      updates.is_executive_visible = input.isExecutiveVisible;
    }
    if (input.isPinned !== undefined) {
      updates.is_pinned = input.isPinned;
    }
    if (input.tags !== undefined) {
      updates.tags = input.tags;
    }

    const { data, error } = await this.supabase
      .from('risk_radar_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update note', { error, orgId, noteId });
      throw new Error(`Failed to update note: ${error.message}`);
    }

    logger.info('Note updated', { orgId, noteId });
    return this.mapNoteRecord(data);
  }

  async deleteNote(orgId: string, noteId: string): Promise<void> {
    const { error } = await this.supabase
      .from('risk_radar_notes')
      .delete()
      .eq('id', noteId)
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to delete note', { error, orgId, noteId });
      throw new Error(`Failed to delete note: ${error.message}`);
    }

    logger.info('Note deleted', { orgId, noteId });
  }

  async listNotes(
    orgId: string,
    snapshotId: string,
    query: RiskRadarNotesQuery = {}
  ): Promise<RiskRadarNotesListResponse> {
    const {
      noteType,
      isExecutiveVisible,
      isPinned,
      createdBy,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('risk_radar_notes')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('snapshot_id', snapshotId);

    if (noteType) {
      if (Array.isArray(noteType)) {
        dbQuery = dbQuery.in('note_type', noteType);
      } else {
        dbQuery = dbQuery.eq('note_type', noteType);
      }
    }

    if (isExecutiveVisible !== undefined) {
      dbQuery = dbQuery.eq('is_executive_visible', isExecutiveVisible);
    }

    if (isPinned !== undefined) {
      dbQuery = dbQuery.eq('is_pinned', isPinned);
    }

    if (createdBy) {
      dbQuery = dbQuery.eq('created_by', createdBy);
    }

    const sortColumn = sortBy === 'note_type' ? 'note_type' : 'created_at';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list notes', { error, orgId, snapshotId });
      throw new Error(`Failed to list notes: ${error.message}`);
    }

    const notes = (data || []).map(this.mapNoteRecord);
    const total = count || 0;

    return {
      notes,
      total,
      hasMore: offset + notes.length < total,
    };
  }

  // ========================================
  // Dashboard Methods
  // ========================================

  async getDashboard(
    orgId: string,
    query: RiskRadarDashboardQuery = {}
  ): Promise<RiskRadarDashboard> {
    const {
      trendPeriodDays = 30,
      includeForecasts = true,
      topDriversLimit = 5,
      recentNotesLimit = 5,
    } = query;

    // Get current active snapshot
    const currentSnapshot = await this.getActiveSnapshot(orgId);

    // Get risk trend
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - trendPeriodDays);

    const { data: trendData } = await this.supabase
      .from('risk_radar_snapshots')
      .select('id, snapshot_date, overall_risk_index, risk_level')
      .eq('org_id', orgId)
      .gte('snapshot_date', startDate.toISOString())
      .order('snapshot_date', { ascending: true });

    const riskTrend: RiskRadarTrendPoint[] = (trendData || []).map(d => ({
      date: new Date(d.snapshot_date),
      riskIndex: d.overall_risk_index,
      riskLevel: d.risk_level as RiskRadarLevel,
      snapshotId: d.id,
    }));

    // Calculate risk distribution
    const riskDistribution = this.calculateRiskDistribution(trendData || []);

    // Get component summaries from current snapshot
    const componentSummaries = currentSnapshot
      ? this.getComponentSummaries(currentSnapshot)
      : [];

    // Get top drivers
    let topDrivers: RiskRadarDriver[] = [];
    if (currentSnapshot) {
      const { drivers } = await this.listDrivers(orgId, currentSnapshot.id, {
        sortBy: 'impact_score',
        sortOrder: 'desc',
        limit: topDriversLimit,
      });
      topDrivers = drivers;
    }

    // Get current forecast
    let currentForecast: RiskRadarForecast | undefined;
    if (currentSnapshot && includeForecasts) {
      const { forecasts } = await this.listForecasts(orgId, currentSnapshot.id, {
        isCurrent: true,
        limit: 1,
      });
      currentForecast = forecasts[0];
    }

    // Get recent notes
    let recentNotes: RiskRadarNote[] = [];
    if (currentSnapshot) {
      const { notes } = await this.listNotes(orgId, currentSnapshot.id, {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: recentNotesLimit,
      });
      recentNotes = notes;
    }

    // Calculate stats
    const { count: totalSnapshots } = await this.supabase
      .from('risk_radar_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const riskValues = (trendData || []).map(d => d.overall_risk_index);
    const avgRiskIndex = riskValues.length > 0
      ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length
      : 0;
    const peakRiskIndex = riskValues.length > 0
      ? Math.max(...riskValues)
      : 0;

    return {
      currentSnapshot: currentSnapshot || undefined,
      currentForecast,
      riskTrend,
      trendPeriodDays,
      riskDistribution,
      componentSummaries,
      topDrivers,
      emergingRisks: currentSnapshot?.emergingRisks || [],
      recentNotes,
      totalSnapshots: totalSnapshots || 0,
      snapshotsThisPeriod: trendData?.length || 0,
      avgRiskIndex: Math.round(avgRiskIndex),
      peakRiskIndex,
      lastUpdated: new Date(),
    };
  }

  // ========================================
  // Signal Collection Methods
  // ========================================

  async collectSignalMatrix(orgId: string): Promise<RiskRadarSignalMatrix> {
    // Collect signals from integrated systems
    // In a real implementation, this would query S40-S59 services
    // For now, we'll create a placeholder structure

    const signalMatrix: RiskRadarSignalMatrix = {
      rawSignals: [],
    };

    try {
      // Media monitoring signals (S40-S43)
      const mediaSignals = await this.collectMediaSignals(orgId);
      signalMatrix.mediaVolume = mediaSignals.volume;
      signalMatrix.mediaSentiment = mediaSignals.sentiment;
      signalMatrix.mediaReach = mediaSignals.reach;
      signalMatrix.alertCount = mediaSignals.alertCount;
      signalMatrix.alertSeverity = mediaSignals.alertSeverity;
    } catch (err) {
      logger.warn('Failed to collect media signals', { orgId, error: err });
    }

    try {
      // Crisis signals (S55)
      const crisisSignals = await this.collectCrisisSignals(orgId);
      signalMatrix.activeCrisisCount = crisisSignals.activeCrisisCount;
      signalMatrix.crisisSeverity = crisisSignals.crisisSeverity;
      signalMatrix.escalationCount = crisisSignals.escalationCount;
    } catch (err) {
      logger.warn('Failed to collect crisis signals', { orgId, error: err });
    }

    try {
      // Brand reputation signals (S56-S57)
      const reputationSignals = await this.collectReputationSignals(orgId);
      signalMatrix.reputationScore = reputationSignals.score;
      signalMatrix.reputationTrend = reputationSignals.trend;
      signalMatrix.sentimentShift = reputationSignals.sentimentShift;
    } catch (err) {
      logger.warn('Failed to collect reputation signals', { orgId, error: err });
    }

    try {
      // Competitive intelligence signals (S53)
      const competitiveSignals = await this.collectCompetitiveSignals(orgId);
      signalMatrix.competitivePressure = competitiveSignals.pressure;
      signalMatrix.marketShareChange = competitiveSignals.marketShareChange;
      signalMatrix.competitorMentions = competitiveSignals.competitorMentions;
    } catch (err) {
      logger.warn('Failed to collect competitive signals', { orgId, error: err });
    }

    try {
      // Governance signals (S59)
      const governanceSignals = await this.collectGovernanceSignals(orgId);
      signalMatrix.openFindings = governanceSignals.openFindings;
      signalMatrix.findingSeverity = governanceSignals.findingSeverity;
      signalMatrix.complianceScore = governanceSignals.complianceScore;
    } catch (err) {
      logger.warn('Failed to collect governance signals', { orgId, error: err });
    }

    try {
      // Persona signals (S51)
      const personaSignals = await this.collectPersonaSignals(orgId);
      signalMatrix.personaSensitivity = personaSignals.sensitivity;
      signalMatrix.audienceRisk = personaSignals.audienceRisk;
    } catch (err) {
      logger.warn('Failed to collect persona signals', { orgId, error: err });
    }

    try {
      // Media performance signals (S52)
      const performanceSignals = await this.collectPerformanceSignals(orgId);
      signalMatrix.performanceScore = performanceSignals.score;
      signalMatrix.coverageQuality = performanceSignals.coverageQuality;
    } catch (err) {
      logger.warn('Failed to collect performance signals', { orgId, error: err });
    }

    return signalMatrix;
  }

  private async collectMediaSignals(orgId: string): Promise<{
    volume: number;
    sentiment: number;
    reach: number;
    alertCount: number;
    alertSeverity: number;
  }> {
    // Query media monitoring tables
    const { data: mentions } = await this.supabase
      .from('media_mentions')
      .select('sentiment_score, reach')
      .eq('org_id', orgId)
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { count: alertCount } = await this.supabase
      .from('media_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (!mentions || mentions.length === 0) {
      return { volume: 0, sentiment: 50, reach: 0, alertCount: alertCount || 0, alertSeverity: 0 };
    }

    const avgSentiment = mentions.reduce((sum, m) => sum + (m.sentiment_score || 50), 0) / mentions.length;
    const totalReach = mentions.reduce((sum, m) => sum + (m.reach || 0), 0);

    return {
      volume: mentions.length,
      sentiment: avgSentiment,
      reach: totalReach,
      alertCount: alertCount || 0,
      alertSeverity: alertCount && alertCount > 5 ? 80 : alertCount ? alertCount * 15 : 0,
    };
  }

  private async collectCrisisSignals(orgId: string): Promise<{
    activeCrisisCount: number;
    crisisSeverity: number;
    escalationCount: number;
  }> {
    const { count: activeCrisis } = await this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['active', 'monitoring']);

    const { count: escalations } = await this.supabase
      .from('crisis_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_escalated', true)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return {
      activeCrisisCount: activeCrisis || 0,
      crisisSeverity: activeCrisis ? Math.min(100, (activeCrisis || 0) * 25) : 0,
      escalationCount: escalations || 0,
    };
  }

  private async collectReputationSignals(orgId: string): Promise<{
    score: number;
    trend: number;
    sentimentShift: number;
  }> {
    const { data: reputationData } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('overall_score, sentiment_score')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(2);

    if (!reputationData || reputationData.length === 0) {
      return { score: 50, trend: 0, sentimentShift: 0 };
    }

    const current = reputationData[0];
    const previous = reputationData[1];

    return {
      score: current.overall_score || 50,
      trend: previous ? (current.overall_score || 50) - (previous.overall_score || 50) : 0,
      sentimentShift: previous ? (current.sentiment_score || 50) - (previous.sentiment_score || 50) : 0,
    };
  }

  private async collectCompetitiveSignals(orgId: string): Promise<{
    pressure: number;
    marketShareChange: number;
    competitorMentions: number;
  }> {
    const { data: competitiveData } = await this.supabase
      .from('competitive_analysis')
      .select('competitive_pressure, market_position_delta')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { count: competitorMentions } = await this.supabase
      .from('competitive_mentions')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!competitiveData || competitiveData.length === 0) {
      return { pressure: 50, marketShareChange: 0, competitorMentions: competitorMentions || 0 };
    }

    return {
      pressure: competitiveData[0].competitive_pressure || 50,
      marketShareChange: competitiveData[0].market_position_delta || 0,
      competitorMentions: competitorMentions || 0,
    };
  }

  private async collectGovernanceSignals(orgId: string): Promise<{
    openFindings: number;
    findingSeverity: number;
    complianceScore: number;
  }> {
    const { count: openFindings } = await this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['open', 'acknowledged']);

    const { data: highSeverity } = await this.supabase
      .from('governance_findings')
      .select('severity')
      .eq('org_id', orgId)
      .in('status', ['open', 'acknowledged'])
      .in('severity', ['critical', 'high']);

    const { data: riskScores } = await this.supabase
      .from('governance_risk_scores')
      .select('overall_score')
      .eq('org_id', orgId)
      .eq('entity_type', 'organization')
      .order('computed_at', { ascending: false })
      .limit(1);

    return {
      openFindings: openFindings || 0,
      findingSeverity: highSeverity?.length ? Math.min(100, (highSeverity.length || 0) * 20) : 0,
      complianceScore: riskScores?.[0]?.overall_score || 50,
    };
  }

  private async collectPersonaSignals(orgId: string): Promise<{
    sensitivity: number;
    audienceRisk: number;
  }> {
    const { data: personaData } = await this.supabase
      .from('audience_personas')
      .select('risk_sensitivity, engagement_risk')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (!personaData || personaData.length === 0) {
      return { sensitivity: 50, audienceRisk: 50 };
    }

    const avgSensitivity = personaData.reduce((sum, p) => sum + (p.risk_sensitivity || 50), 0) / personaData.length;
    const avgRisk = personaData.reduce((sum, p) => sum + (p.engagement_risk || 50), 0) / personaData.length;

    return {
      sensitivity: avgSensitivity,
      audienceRisk: avgRisk,
    };
  }

  private async collectPerformanceSignals(orgId: string): Promise<{
    score: number;
    coverageQuality: number;
  }> {
    const { data: performanceData } = await this.supabase
      .from('media_performance_reports')
      .select('overall_score, coverage_quality')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!performanceData || performanceData.length === 0) {
      return { score: 50, coverageQuality: 50 };
    }

    return {
      score: performanceData[0].overall_score || 50,
      coverageQuality: performanceData[0].coverage_quality || 50,
    };
  }

  // ========================================
  // Computation Methods
  // ========================================

  private computeComponentScores(signalMatrix: RiskRadarSignalMatrix): {
    sentimentScore?: number;
    velocityScore?: number;
    alertScore?: number;
    competitiveScore?: number;
    governanceScore?: number;
    personaScore?: number;
  } {
    return {
      sentimentScore: signalMatrix.mediaSentiment !== undefined
        ? 100 - signalMatrix.mediaSentiment // Invert: lower sentiment = higher risk
        : undefined,
      velocityScore: signalMatrix.alertSeverity,
      alertScore: signalMatrix.alertCount !== undefined
        ? Math.min(100, (signalMatrix.alertCount || 0) * 10)
        : undefined,
      competitiveScore: signalMatrix.competitivePressure,
      governanceScore: signalMatrix.findingSeverity !== undefined
        ? signalMatrix.findingSeverity
        : (signalMatrix.complianceScore !== undefined ? 100 - signalMatrix.complianceScore : undefined),
      personaScore: signalMatrix.personaSensitivity,
    };
  }

  private computeOverallRiskIndex(componentScores: Record<string, number | undefined>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const weight of DEFAULT_INDICATOR_WEIGHTS) {
      const score = this.getComponentScoreByType(componentScores, weight.type);
      if (score !== undefined) {
        weightedSum += score * weight.weight;
        totalWeight += weight.weight;
      }
    }

    if (totalWeight === 0) return 50; // Default to medium risk
    return Math.round(weightedSum / totalWeight);
  }

  private getComponentScoreByType(
    scores: Record<string, number | undefined>,
    type: RiskRadarIndicatorType
  ): number | undefined {
    switch (type) {
      case 'sentiment':
        return scores.sentimentScore;
      case 'velocity':
        return scores.velocityScore;
      case 'alerts':
        return scores.alertScore;
      case 'competitive':
        return scores.competitiveScore;
      case 'governance':
        return scores.governanceScore;
      case 'persona':
        return scores.personaScore;
      default:
        return undefined;
    }
  }

  private classifyRiskLevel(riskIndex: number): RiskRadarLevel {
    if (riskIndex >= 75) return 'critical';
    if (riskIndex >= 50) return 'high';
    if (riskIndex >= 25) return 'medium';
    return 'low';
  }

  private computeConfidenceScore(signalMatrix: RiskRadarSignalMatrix): number {
    // Calculate confidence based on signal availability
    const signals = [
      signalMatrix.mediaVolume,
      signalMatrix.mediaSentiment,
      signalMatrix.alertCount,
      signalMatrix.reputationScore,
      signalMatrix.competitivePressure,
      signalMatrix.complianceScore,
      signalMatrix.personaSensitivity,
      signalMatrix.performanceScore,
    ];

    const availableSignals = signals.filter(s => s !== undefined).length;
    return availableSignals / signals.length;
  }

  private identifyKeyConcerns(
    signalMatrix: RiskRadarSignalMatrix,
    componentScores: Record<string, number | undefined>
  ): RiskRadarConcern[] {
    const concerns: RiskRadarConcern[] = [];

    // High sentiment risk
    if (componentScores.sentimentScore && componentScores.sentimentScore >= 70) {
      concerns.push({
        id: uuidv4(),
        title: 'Negative Sentiment Elevated',
        description: `Media sentiment indicates elevated negative perception (score: ${componentScores.sentimentScore})`,
        severity: componentScores.sentimentScore >= 85 ? 'critical' : 'high',
        source: 'media_monitoring',
        timestamp: new Date(),
      });
    }

    // High alert count
    if (signalMatrix.alertCount && signalMatrix.alertCount >= 5) {
      concerns.push({
        id: uuidv4(),
        title: 'Active Media Alerts',
        description: `${signalMatrix.alertCount} active media alerts requiring attention`,
        severity: signalMatrix.alertCount >= 10 ? 'critical' : 'high',
        source: 'media_alerts',
        timestamp: new Date(),
      });
    }

    // Active crisis
    if (signalMatrix.activeCrisisCount && signalMatrix.activeCrisisCount > 0) {
      concerns.push({
        id: uuidv4(),
        title: 'Active Crisis Situation',
        description: `${signalMatrix.activeCrisisCount} active crisis situation(s) in progress`,
        severity: 'critical',
        source: 'crisis',
        timestamp: new Date(),
      });
    }

    // Governance issues
    if (signalMatrix.openFindings && signalMatrix.openFindings >= 5) {
      concerns.push({
        id: uuidv4(),
        title: 'Open Governance Findings',
        description: `${signalMatrix.openFindings} open governance findings require resolution`,
        severity: signalMatrix.openFindings >= 10 ? 'high' : 'medium',
        source: 'governance',
        timestamp: new Date(),
      });
    }

    return concerns;
  }

  private identifyEmergingRisks(
    signalMatrix: RiskRadarSignalMatrix,
    _componentScores: Record<string, number | undefined>
  ): RiskRadarEmergingRisk[] {
    const emergingRisks: RiskRadarEmergingRisk[] = [];

    // Rapid sentiment decline
    if (signalMatrix.sentimentShift && signalMatrix.sentimentShift < -10) {
      emergingRisks.push({
        id: uuidv4(),
        name: 'Sentiment Deterioration',
        description: 'Rapid decline in media sentiment detected',
        probability: Math.min(1, Math.abs(signalMatrix.sentimentShift) / 30),
        potentialImpact: Math.abs(signalMatrix.sentimentShift) > 20 ? 'critical' : 'high',
        firstDetected: new Date(),
        velocity: Math.abs(signalMatrix.sentimentShift),
        indicators: ['sentiment', 'media_coverage'],
      });
    }

    // Competitive pressure increase
    if (signalMatrix.competitivePressure && signalMatrix.competitivePressure >= 70) {
      emergingRisks.push({
        id: uuidv4(),
        name: 'Competitive Pressure',
        description: 'Elevated competitive activity detected',
        probability: signalMatrix.competitivePressure / 100,
        potentialImpact: 'medium',
        firstDetected: new Date(),
        velocity: signalMatrix.marketShareChange ? Math.abs(signalMatrix.marketShareChange) : 0,
        indicators: ['competitive'],
      });
    }

    return emergingRisks;
  }

  private identifyPositiveFactors(
    signalMatrix: RiskRadarSignalMatrix,
    _componentScores: Record<string, number | undefined>
  ): RiskRadarPositiveFactor[] {
    const positiveFactors: RiskRadarPositiveFactor[] = [];

    // Strong reputation
    if (signalMatrix.reputationScore && signalMatrix.reputationScore >= 70) {
      positiveFactors.push({
        id: uuidv4(),
        name: 'Strong Brand Reputation',
        description: 'Established positive brand reputation provides buffer',
        impact: 15,
        source: 'brand_reputation',
      });
    }

    // Good compliance
    if (signalMatrix.complianceScore && signalMatrix.complianceScore >= 80) {
      positiveFactors.push({
        id: uuidv4(),
        name: 'High Compliance Score',
        description: 'Strong governance and compliance posture',
        impact: 10,
        source: 'governance',
      });
    }

    // Good media performance
    if (signalMatrix.performanceScore && signalMatrix.performanceScore >= 70) {
      positiveFactors.push({
        id: uuidv4(),
        name: 'Strong Media Performance',
        description: 'Consistent positive media coverage',
        impact: 10,
        source: 'media_performance',
      });
    }

    return positiveFactors;
  }

  // ========================================
  // Forecast Computation Methods
  // ========================================

  private calculateTargetDate(forecastDate: Date, horizon: RiskRadarForecastHorizon): Date {
    const target = new Date(forecastDate);
    switch (horizon) {
      case '24h':
        target.setHours(target.getHours() + 24);
        break;
      case '72h':
        target.setHours(target.getHours() + 72);
        break;
      case '7d':
        target.setDate(target.getDate() + 7);
        break;
      case '14d':
        target.setDate(target.getDate() + 14);
        break;
      case '30d':
        target.setDate(target.getDate() + 30);
        break;
    }
    return target;
  }

  private generateProjectionCurve(
    currentRiskIndex: number,
    indicators: RiskRadarIndicator[],
    drivers: RiskRadarDriver[],
    horizon: RiskRadarForecastHorizon
  ): RiskRadarProjectionPoint[] {
    const points: RiskRadarProjectionPoint[] = [];
    const now = new Date();
    const targetDate = this.calculateTargetDate(now, horizon);
    const hoursToTarget = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calculate trend velocity from indicators
    const avgVelocity = indicators.reduce((sum, i) => sum + (i.velocity || 0), 0) / (indicators.length || 1);

    // Calculate driver impact
    const driverImpact = drivers.reduce((sum, d) => {
      return sum + (d.isEmerging ? d.impactScore * 0.2 : d.impactScore * 0.1);
    }, 0) / (drivers.length || 1);

    // Generate hourly/daily points based on horizon
    const interval = hoursToTarget <= 72 ? 6 : 24; // 6 hours for short term, daily for longer
    const numPoints = Math.ceil(hoursToTarget / interval);

    for (let i = 0; i <= numPoints; i++) {
      const timestamp = new Date(now.getTime() + i * interval * 60 * 60 * 1000);
      const progress = i / numPoints;

      // Apply trend and driver effects with dampening
      const trendEffect = avgVelocity * progress * 0.5;
      const driverEffect = driverImpact * progress * 0.3;
      const randomVariance = (Math.random() - 0.5) * 5;

      const projectedValue = Math.max(0, Math.min(100,
        currentRiskIndex + trendEffect + driverEffect + randomVariance
      ));

      // Confidence decreases with time
      const confidence = 1 - (progress * 0.4);

      points.push({
        timestamp,
        value: Math.round(projectedValue),
        confidence: Math.round(confidence * 100) / 100,
        lowerBound: Math.max(0, projectedValue - 10 * (1 - confidence)),
        upperBound: Math.min(100, projectedValue + 10 * (1 - confidence)),
      });
    }

    return points;
  }

  private calculateCrisisProbability(
    projectionCurve: RiskRadarProjectionPoint[],
    drivers: RiskRadarDriver[]
  ): number {
    // Base probability from projection
    const finalValue = projectionCurve[projectionCurve.length - 1]?.value || 50;
    let baseProbability = finalValue / 100;

    // Adjust for emerging drivers
    const emergingCount = drivers.filter(d => d.isEmerging).length;
    baseProbability += emergingCount * 0.05;

    // Adjust for critical drivers
    const criticalCount = drivers.filter(d => d.urgency === 'critical').length;
    baseProbability += criticalCount * 0.1;

    return Math.min(1, Math.max(0, baseProbability));
  }

  private generateBasicNarrative(
    snapshot: RiskRadarSnapshot,
    indicators: RiskRadarIndicator[],
    drivers: RiskRadarDriver[],
    horizon: RiskRadarForecastHorizon
  ): RiskRadarForecastNarrative {
    const horizonLabel = this.getHorizonLabel(horizon);
    const riskTrend = indicators.some(i => i.trendDirection === 'worsening') ? 'increasing' : 'stable';

    const executiveSummary = `Risk outlook for the next ${horizonLabel}: The overall risk index is ${snapshot.overallRiskIndex}/100 (${snapshot.riskLevel} level). ` +
      `${drivers.length > 0 ? `Key drivers include ${drivers.slice(0, 3).map(d => d.name).join(', ')}.` : ''} ` +
      `Risk trajectory is ${riskTrend}.`;

    const detailedAnalysis = this.generateDetailedAnalysis(snapshot, indicators, drivers, horizonLabel);

    const keyAssumptions: RiskRadarForecastAssumption[] = [
      {
        assumption: 'Current market conditions remain relatively stable',
        confidence: 0.7,
        impact: 'medium',
      },
      {
        assumption: 'No major external crisis events occur',
        confidence: 0.8,
        impact: 'high',
      },
    ];

    const recommendedActions: RiskRadarRecommendedAction[] = [];
    if (snapshot.riskLevel === 'critical' || snapshot.riskLevel === 'high') {
      recommendedActions.push({
        action: 'Convene crisis response team for assessment',
        priority: snapshot.riskLevel === 'critical' ? 'immediate' : 'high',
        rationale: 'Elevated risk level requires coordinated response',
      });
    }

    for (const driver of drivers.filter(d => d.urgency === 'critical').slice(0, 3)) {
      recommendedActions.push({
        action: `Address ${driver.name} driver`,
        priority: 'high',
        rationale: driver.description || 'Critical urgency driver identified',
      });
    }

    const watchItems: RiskRadarWatchItem[] = drivers
      .filter(d => d.isEmerging)
      .slice(0, 5)
      .map(d => ({
        item: d.name,
        reason: 'Emerging driver - trajectory uncertain',
        currentValue: d.impactScore,
        threshold: 70,
      }));

    return {
      executiveSummary,
      detailedAnalysis,
      keyAssumptions,
      recommendedActions,
      watchItems,
      confidenceStatement: `This forecast is based on ${indicators.length} indicators and ${drivers.length} identified drivers. Confidence decreases over longer time horizons.`,
    };
  }

  private generateDetailedAnalysis(
    snapshot: RiskRadarSnapshot,
    indicators: RiskRadarIndicator[],
    drivers: RiskRadarDriver[],
    horizonLabel: string
  ): string {
    let analysis = `## ${horizonLabel} Risk Analysis\n\n`;

    analysis += `### Current State\n`;
    analysis += `The organization's risk index stands at ${snapshot.overallRiskIndex}/100, classified as ${snapshot.riskLevel} risk. `;

    if (snapshot.keyConcerns.length > 0) {
      analysis += `\n\n### Key Concerns\n`;
      for (const concern of snapshot.keyConcerns.slice(0, 5)) {
        analysis += `- **${concern.title}** (${concern.severity}): ${concern.description}\n`;
      }
    }

    if (drivers.length > 0) {
      analysis += `\n\n### Risk Drivers\n`;
      for (const driver of drivers.slice(0, 5)) {
        analysis += `- **${driver.name}** (Impact: ${driver.impactScore}/100): ${driver.description || 'Driver identified through signal analysis'}\n`;
      }
    }

    const worseningIndicators = indicators.filter(i => i.trendDirection === 'worsening');
    if (worseningIndicators.length > 0) {
      analysis += `\n\n### Deteriorating Indicators\n`;
      for (const ind of worseningIndicators.slice(0, 5)) {
        analysis += `- ${ind.name}: ${ind.score}/100 (${ind.scoreDelta && ind.scoreDelta > 0 ? '+' : ''}${ind.scoreDelta || 0} change)\n`;
      }
    }

    return analysis;
  }

  private getHorizonLabel(horizon: RiskRadarForecastHorizon): string {
    switch (horizon) {
      case '24h':
        return '24 hours';
      case '72h':
        return '72 hours';
      case '7d':
        return '7 days';
      case '14d':
        return '14 days';
      case '30d':
        return '30 days';
    }
  }

  private async generateNarrative(
    _context: RiskRadarNarrativeContext,
    _llmModel?: string,
    _customPrompt?: string
  ): Promise<{ narrative: RiskRadarForecastNarrative; tokensUsed: number }> {
    // In a real implementation, this would call the LLM service
    // For now, generate a basic narrative
    const narrative = this.generateBasicNarrative(
      _context.snapshot,
      _context.indicators,
      _context.drivers,
      _context.horizon
    );

    return { narrative, tokensUsed: 0 };
  }

  // ========================================
  // Helper Methods
  // ========================================

  private async createIndicatorsFromSignals(
    orgId: string,
    snapshotId: string,
    signalMatrix: RiskRadarSignalMatrix
  ): Promise<RiskRadarIndicator[]> {
    const indicators: RiskRadarIndicator[] = [];

    if (signalMatrix.mediaSentiment !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'sentiment',
        name: 'Media Sentiment',
        score: 100 - signalMatrix.mediaSentiment, // Invert for risk score
        sourceSystem: 'media_monitoring',
        sourceData: { mediaSentiment: signalMatrix.mediaSentiment },
      });
      indicators.push(indicator);
    }

    if (signalMatrix.alertSeverity !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'alerts',
        name: 'Alert Severity',
        score: signalMatrix.alertSeverity,
        sourceSystem: 'media_alerts',
        sourceData: { alertCount: signalMatrix.alertCount, alertSeverity: signalMatrix.alertSeverity },
      });
      indicators.push(indicator);
    }

    if (signalMatrix.competitivePressure !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'competitive',
        name: 'Competitive Pressure',
        score: signalMatrix.competitivePressure,
        sourceSystem: 'competitive_intelligence',
        sourceData: { competitivePressure: signalMatrix.competitivePressure },
      });
      indicators.push(indicator);
    }

    if (signalMatrix.findingSeverity !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'governance',
        name: 'Governance Findings',
        score: signalMatrix.findingSeverity,
        sourceSystem: 'governance',
        sourceData: { openFindings: signalMatrix.openFindings, findingSeverity: signalMatrix.findingSeverity },
      });
      indicators.push(indicator);
    }

    if (signalMatrix.reputationScore !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'reputation',
        name: 'Brand Reputation Risk',
        score: 100 - signalMatrix.reputationScore, // Invert for risk score
        sourceSystem: 'brand_reputation',
        sourceData: { reputationScore: signalMatrix.reputationScore },
      });
      indicators.push(indicator);
    }

    if (signalMatrix.crisisSeverity !== undefined) {
      const indicator = await this.createIndicator(orgId, snapshotId, {
        indicatorType: 'crisis_history',
        name: 'Crisis Activity',
        score: signalMatrix.crisisSeverity,
        sourceSystem: 'crisis',
        sourceData: { activeCrisisCount: signalMatrix.activeCrisisCount, crisisSeverity: signalMatrix.crisisSeverity },
      });
      indicators.push(indicator);
    }

    return indicators;
  }

  private async getPreviousIndicator(
    orgId: string,
    currentSnapshotId: string,
    indicatorType: RiskRadarIndicatorType
  ): Promise<RiskRadarIndicator | null> {
    // Get the previous snapshot
    const { data: currentSnapshot } = await this.supabase
      .from('risk_radar_snapshots')
      .select('snapshot_date')
      .eq('id', currentSnapshotId)
      .single();

    if (!currentSnapshot) return null;

    const { data: previousSnapshot } = await this.supabase
      .from('risk_radar_snapshots')
      .select('id')
      .eq('org_id', orgId)
      .lt('snapshot_date', currentSnapshot.snapshot_date)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (!previousSnapshot) return null;

    const { data: indicator } = await this.supabase
      .from('risk_radar_indicators')
      .select('*')
      .eq('org_id', orgId)
      .eq('snapshot_id', previousSnapshot.id)
      .eq('indicator_type', indicatorType)
      .single();

    if (!indicator) return null;

    return this.mapIndicatorRecord(indicator);
  }

  private calculateTrendDirection(scoreDelta: number | null): RiskRadarTrendDirection | null {
    if (scoreDelta === null) return null;
    if (scoreDelta > 10) return 'worsening';
    if (scoreDelta < -10) return 'improving';
    if (Math.abs(scoreDelta) > 20) return 'volatile';
    return 'stable';
  }

  private calculateVelocity(
    scoreDelta: number | null,
    previousIndicator: RiskRadarIndicator | null
  ): number | null {
    if (scoreDelta === null || !previousIndicator) return null;
    // Velocity is rate of change per day (simplified)
    return scoreDelta;
  }

  private getDefaultWeight(indicatorType: RiskRadarIndicatorType): number {
    const weight = DEFAULT_INDICATOR_WEIGHTS.find(w => w.type === indicatorType);
    return weight?.weight ?? 0.1;
  }

  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  private mapIndicatorTypeToDriverCategory(
    indicatorType: RiskRadarIndicatorType
  ): RiskRadarDriverCategory {
    const mapping: Record<RiskRadarIndicatorType, RiskRadarDriverCategory> = {
      sentiment: 'sentiment_shift',
      velocity: 'velocity_spike',
      alerts: 'media_surge',
      competitive: 'competitive_pressure',
      governance: 'governance_violation',
      persona: 'persona_sensitivity',
      media_coverage: 'media_surge',
      crisis_history: 'crisis_pattern',
      reputation: 'reputation_decline',
    };
    return mapping[indicatorType] || 'external_event';
  }

  private calculateRiskDistribution(
    snapshots: Array<{ risk_level: string }>
  ): RiskRadarDistribution {
    const distribution: RiskRadarDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const snapshot of snapshots) {
      if (snapshot.risk_level in distribution) {
        distribution[snapshot.risk_level as keyof RiskRadarDistribution]++;
      }
    }

    return distribution;
  }

  private getComponentSummaries(snapshot: RiskRadarSnapshot): RiskRadarComponentSummary[] {
    const summaries: RiskRadarComponentSummary[] = [];

    if (snapshot.sentimentScore !== undefined) {
      summaries.push({
        name: 'Sentiment',
        score: snapshot.sentimentScore,
        trend: 'stable',
        delta: 0,
      });
    }

    if (snapshot.velocityScore !== undefined) {
      summaries.push({
        name: 'Velocity',
        score: snapshot.velocityScore,
        trend: 'stable',
        delta: 0,
      });
    }

    if (snapshot.alertScore !== undefined) {
      summaries.push({
        name: 'Alerts',
        score: snapshot.alertScore,
        trend: 'stable',
        delta: 0,
      });
    }

    if (snapshot.competitiveScore !== undefined) {
      summaries.push({
        name: 'Competitive',
        score: snapshot.competitiveScore,
        trend: 'stable',
        delta: 0,
      });
    }

    if (snapshot.governanceScore !== undefined) {
      summaries.push({
        name: 'Governance',
        score: snapshot.governanceScore,
        trend: 'stable',
        delta: 0,
      });
    }

    if (snapshot.personaScore !== undefined) {
      summaries.push({
        name: 'Persona',
        score: snapshot.personaScore,
        trend: 'stable',
        delta: 0,
      });
    }

    return summaries;
  }

  // ========================================
  // Audit Logging
  // ========================================

  private async logAudit(
    orgId: string,
    operation: string,
    entityType: string,
    entityId?: string,
    userId?: string,
    metadata: Record<string, unknown> = {},
    llmModel?: string,
    tokensTotal?: number
  ): Promise<void> {
    try {
      const record: Omit<AuditLogRecord, 'created_at'> = {
        id: uuidv4(),
        org_id: orgId,
        operation,
        entity_type: entityType,
        entity_id: entityId || null,
        request_id: null,
        user_id: userId || null,
        user_email: null,
        llm_model: llmModel || null,
        tokens_input: null,
        tokens_output: null,
        tokens_total: tokensTotal || null,
        duration_ms: null,
        prompt_preview: null,
        response_preview: null,
        status: 'success',
        error_message: null,
        metadata,
      };

      await this.supabase.from('risk_radar_audit_log').insert(record);
    } catch (err) {
      logger.warn('Failed to log audit entry', { operation, entityType, error: err });
    }
  }

  // ========================================
  // Record Mappers
  // ========================================

  private mapSnapshotRecord = (record: SnapshotRecord): RiskRadarSnapshot => ({
    id: record.id,
    orgId: record.org_id,
    snapshotDate: new Date(record.snapshot_date),
    title: record.title ?? undefined,
    description: record.description ?? undefined,
    overallRiskIndex: record.overall_risk_index,
    riskLevel: record.risk_level as RiskRadarLevel,
    confidenceScore: record.confidence_score ?? undefined,
    sentimentScore: record.sentiment_score ?? undefined,
    velocityScore: record.velocity_score ?? undefined,
    alertScore: record.alert_score ?? undefined,
    competitiveScore: record.competitive_score ?? undefined,
    governanceScore: record.governance_score ?? undefined,
    personaScore: record.persona_score ?? undefined,
    signalMatrix: record.signal_matrix as RiskRadarSignalMatrix,
    keyConcerns: (record.key_concerns || []) as RiskRadarConcern[],
    emergingRisks: (record.emerging_risks || []) as RiskRadarEmergingRisk[],
    positiveFactors: (record.positive_factors || []) as RiskRadarPositiveFactor[],
    isActive: record.is_active,
    isArchived: record.is_archived,
    computationMethod: record.computation_method,
    modelVersion: record.model_version ?? undefined,
    computationDurationMs: record.computation_duration_ms ?? undefined,
    createdBy: record.created_by ?? undefined,
    updatedBy: record.updated_by ?? undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  });

  private mapIndicatorRecord = (record: IndicatorRecord): RiskRadarIndicator => ({
    id: record.id,
    orgId: record.org_id,
    snapshotId: record.snapshot_id,
    indicatorType: record.indicator_type as RiskRadarIndicatorType,
    name: record.name,
    description: record.description ?? undefined,
    score: record.score,
    weight: record.weight,
    normalizedScore: record.normalized_score ?? undefined,
    previousScore: record.previous_score ?? undefined,
    scoreDelta: record.score_delta ?? undefined,
    trendDirection: (record.trend_direction as RiskRadarTrendDirection) ?? undefined,
    velocity: record.velocity ?? undefined,
    sourceSystem: record.source_system,
    sourceReferenceId: record.source_reference_id ?? undefined,
    sourceData: record.source_data,
    measurementStart: record.measurement_start ? new Date(record.measurement_start) : undefined,
    measurementEnd: record.measurement_end ? new Date(record.measurement_end) : undefined,
    metadata: record.metadata,
    tags: record.tags || [],
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  });

  private mapForecastRecord = (record: ForecastRecord): RiskRadarForecast => ({
    id: record.id,
    orgId: record.org_id,
    snapshotId: record.snapshot_id,
    horizon: record.horizon as RiskRadarForecastHorizon,
    forecastDate: new Date(record.forecast_date),
    targetDate: new Date(record.target_date),
    predictedRiskIndex: record.predicted_risk_index,
    predictedRiskLevel: record.predicted_risk_level as RiskRadarLevel,
    confidenceIntervalLow: record.confidence_interval_low ?? undefined,
    confidenceIntervalHigh: record.confidence_interval_high ?? undefined,
    probabilityOfCrisis: record.probability_of_crisis ?? undefined,
    projectionCurve: (record.projection_curve || []) as RiskRadarProjectionPoint[],
    executiveSummary: record.executive_summary ?? undefined,
    detailedAnalysis: record.detailed_analysis ?? undefined,
    keyAssumptions: (record.key_assumptions || []) as RiskRadarForecastAssumption[],
    recommendedActions: (record.recommended_actions || []) as RiskRadarRecommendedAction[],
    watchItems: (record.watch_items || []) as RiskRadarWatchItem[],
    modelName: record.model_name ?? undefined,
    modelVersion: record.model_version ?? undefined,
    llmModel: record.llm_model ?? undefined,
    tokensUsed: record.tokens_used ?? undefined,
    generationDurationMs: record.generation_duration_ms ?? undefined,
    isCurrent: record.is_current,
    supersededBy: record.superseded_by ?? undefined,
    accuracyScore: record.accuracy_score ?? undefined,
    createdBy: record.created_by ?? undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  });

  private mapDriverRecord = (record: DriverRecord): RiskRadarDriver => ({
    id: record.id,
    orgId: record.org_id,
    snapshotId: record.snapshot_id,
    category: record.category as RiskRadarDriverCategory,
    name: record.name,
    description: record.description ?? undefined,
    impactScore: record.impact_score,
    contributionPercentage: record.contribution_percentage ?? undefined,
    urgency: record.urgency as RiskRadarLevel,
    sourceSystem: record.source_system ?? undefined,
    sourceReferenceId: record.source_reference_id ?? undefined,
    sourceData: record.source_data,
    isEmerging: record.is_emerging,
    isTurningPoint: record.is_turning_point,
    firstDetectedAt: record.first_detected_at ? new Date(record.first_detected_at) : undefined,
    trendVelocity: record.trend_velocity ?? undefined,
    affectedEntities: (record.affected_entities || []) as RiskRadarAffectedEntity[],
    relatedIndicatorIds: record.related_indicator_ids || [],
    metadata: record.metadata,
    tags: record.tags || [],
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  });

  private mapNoteRecord = (record: NoteRecord): RiskRadarNote => ({
    id: record.id,
    orgId: record.org_id,
    snapshotId: record.snapshot_id,
    noteType: record.note_type as RiskRadarNoteType,
    title: record.title ?? undefined,
    content: record.content,
    relatedIndicatorId: record.related_indicator_id ?? undefined,
    relatedDriverId: record.related_driver_id ?? undefined,
    relatedForecastId: record.related_forecast_id ?? undefined,
    isExecutiveVisible: record.is_executive_visible,
    isPinned: record.is_pinned,
    metadata: record.metadata,
    tags: record.tags || [],
    createdBy: record.created_by,
    updatedBy: record.updated_by ?? undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  });
}

// ========================================
// Factory Function
// ========================================

export function createRiskRadarService(supabase: SupabaseClient): RiskRadarService {
  return new RiskRadarService(supabase);
}
