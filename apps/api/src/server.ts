/**
 * Fastify server setup
 */

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { FLAGS } from '@pravado/feature-flags';
import { createLogger } from '@pravado/utils';
import Fastify from 'fastify';

import { config } from './config';

import { authPlugin } from './plugins/auth';
import { mailerPlugin } from './plugins/mailer';
import { platformFreezePlugin } from './plugins/platformFreeze';
import { agentsRoutes } from './routes/agents';
import { auditRoutes } from './routes/audit'; // S35
import { auditReplayRoutes } from './routes/auditReplay'; // S37
import { authRoutes } from './routes/auth';
import { billingRoutes } from './routes/billing'; // S28
import { contentRoutes } from './routes/content';
import { contentBriefGeneratorRoutes } from './routes/contentBriefGenerator'; // S13
import { contentQualityRoutes } from './routes/contentQuality'; // S14
import { contentRewriteRoutes } from './routes/contentRewrite'; // S15
import { healthRoutes } from './routes/health';
import { invitesRoutes } from './routes/invites';
import { mediaMonitoringRoutes } from './routes/mediaMonitoring'; // S40
import { rssRoutes } from './routes/mediaMonitoring/rss'; // S41
import { opsRoutes } from './routes/ops'; // S27
import { orgsRoutes } from './routes/orgs';
import { personalitiesRoutes } from './routes/personalities'; // S11
import { playbookRunsRoutes } from './routes/playbookRuns'; // S19
import { playbooksRoutes } from './routes/playbooks';
import { prRoutes } from './routes/pr';
import { pressReleaseRoutes } from './routes/pressReleases'; // S38
import { prPitchRoutes } from './routes/prPitches'; // S39
import { riskRadarRoutes } from './routes/riskRadar'; // S60
import { schedulerRoutes } from './routes/scheduler'; // S42
import { mediaAlertsRoutes } from './routes/mediaAlerts'; // S43
import prOutreachRoutes from './routes/prOutreach'; // S44
import prOutreachDeliverabilityRoutes from './routes/prOutreachDeliverability'; // S45
import journalistGraphRoutes from './routes/journalistGraph'; // S46
import { mediaListRoutes } from './routes/mediaLists'; // S47
import { journalistDiscoveryRoutes } from './routes/journalistDiscovery'; // S48
import { journalistTimelineRoutes } from './routes/journalistTimeline'; // S49
import audiencePersonasRoutes from './routes/audiencePersonas'; // S51
import mediaPerformanceRoutes from './routes/mediaPerformance'; // S52
import competitorIntelligenceRoutes from './routes/competitorIntelligence'; // S53
import mediaBriefingRoutes from './routes/mediaBriefings'; // S54
import crisisRoutes from './routes/crisis'; // S55
import brandReputationRoutes from './routes/brandReputation'; // S56
import brandReputationAlertsRoutes from './routes/brandReputationAlerts'; // S57
import { governanceRoutes } from './routes/governance'; // S59
import { executiveCommandCenterRoutes } from './routes/executiveCommandCenter'; // S61
import { executiveDigestRoutes } from './routes/executiveDigests'; // S62
import { executiveBoardReportRoutes } from './routes/executiveBoardReports'; // S63
import { investorRelationsRoutes } from './routes/investorRelations'; // S64
import strategicIntelligenceRoutes from './routes/strategicIntelligence'; // S65
import unifiedGraphRoutes from './routes/unifiedGraph'; // S66
import scenarioPlaybookRoutes from './routes/scenarioPlaybook'; // S67
import unifiedNarrativeRoutes from './routes/unifiedNarratives'; // S70
import aiScenarioSimulationRoutes from './routes/aiScenarioSimulations'; // S71
import scenarioOrchestrationRoutes from './routes/scenarioOrchestrations'; // S72
import realityMapsRoutes from './routes/realityMaps'; // S73
import insightConflictRoutes from './routes/insightConflicts'; // S74
import { seoRoutes } from './routes/seo';
import { eviRoutes } from './routes/evi'; // S-INT-01
import { sageRoutes } from './routes/sage'; // S-INT-02
import { citeMindRoutes } from './routes/citeMind'; // S-INT-04
import { gscRoutes } from './routes/integrations/gsc'; // S-INT-06
import { journalistEnrichmentRoutes } from './routes/journalists/enrichment'; // S-INT-06
import { onboardingRoutes } from './routes/onboarding'; // S-INT-07
import { betaRoutes } from './routes/beta'; // S-INT-09
import { adminRoutes } from './routes/admin'; // Admin panel
import { clientLogsRoutes } from './routes/clientLogs'; // S79
import { notificationRoutes } from './routes/notifications';

const logger = createLogger('api:server');

export async function createServer() {
  // ========================================
  // SENTRY INITIALIZATION (S-INT-08)
  // ========================================
  const sentryDsn = process.env.SENTRY_DSN;
  const isValidDsn = sentryDsn?.startsWith('https://');
  if (isValidDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    logger.info('Sentry initialized');
  } else if (sentryDsn) {
    logger.warn('Sentry DSN not configured or invalid format — skipping Sentry init');
  }

  const server = Fastify({
    logger: false, // We use our custom logger
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  });

  await server.register(cookie, {
    secret: config.COOKIE_SECRET,
  });

  // CORS (S-INT-10: production-hardened)
  await server.register(cors, {
    origin: config.NODE_ENV === 'production'
      ? config.CORS_ORIGIN.split(',').map((o: string) => o.trim())
      : true,
    credentials: true,
  });

  // Security headers (S-INT-10)
  await server.register(helmet, {
    contentSecurityPolicy: false, // CSP managed by Next.js / dashboard
  });

  await server.register(authPlugin);
  await server.register(mailerPlugin);

  // ========================================
  // RATE LIMITING (S-INT-08)
  // ========================================
  await server.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return (request as any).user?.orgId ?? (request as any).orgId ?? request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });

  // Platform Freeze plugin (S78) - must be registered before core routes
  // When PLATFORM_FREEZE=true, blocks write operations to core intelligence domains
  await server.register(platformFreezePlugin);

  // Add request logging + Sentry context tagging (S-INT-08)
  server.addHook('onRequest', async (request) => {
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      requestId: request.id,
    });

    // Tag Sentry with org context
    if (process.env.SENTRY_DSN) {
      const user = (request as any).user;
      if (user) {
        Sentry.setUser({ id: user.id, email: user.email });
        Sentry.setTag('org_id', user.orgId ?? 'unknown');
      } else {
        Sentry.setTag('org_id', 'unauthenticated');
      }
    }
  });

  // Add response logging
  server.addHook('onResponse', async (request, reply) => {
    logger.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: request.id,
    });
  });

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(clientLogsRoutes, { prefix: '/api/v1/logs' }); // S79 - Client logging
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(orgsRoutes, { prefix: '/api/v1/orgs' });
  await server.register(invitesRoutes, { prefix: '/api/v1/invites' });

  // Pillar routes (S3)
  await server.register(prRoutes, { prefix: '/api/v1/pr' });
  await server.register(contentRoutes, { prefix: '/api/v1/content' });
  await server.register(seoRoutes, { prefix: '/api/v1/seo' });
  await server.register(playbooksRoutes, { prefix: '/api/v1/playbooks' });
  await server.register(playbookRunsRoutes, { prefix: '/api/v1/playbook-runs' }); // S19
  await server.register(agentsRoutes, { prefix: '/api/v1/agents' });
  await server.register(personalitiesRoutes, { prefix: '/api/v1/personalities' }); // S11

  // Brief Generator routes (S13)
  // NOTE: Removed duplicate registration at /api/v1/content/briefs
  // This was conflicting with contentRoutes /briefs/:id endpoints
  // Generated briefs are now only accessible via /api/v1/content/generated-briefs
  await server.register(contentBriefGeneratorRoutes, {
    prefix: '/api/v1/content/generated-briefs',
  });

  // Content Quality routes (S14)
  await server.register(contentQualityRoutes, {
    prefix: '/api/v1/content/quality',
  });

  // Content Rewrite routes (S15)
  await server.register(contentRewriteRoutes, {
    prefix: '/api/v1/content/rewrites',
  });

  // Ops routes (S27)
  await server.register(opsRoutes, {
    prefix: '/api/v1/ops',
  });

  // Billing routes (S28)
  await server.register(billingRoutes, {
    prefix: '/api/v1/billing',
  });

  // Audit routes (S35)
  await server.register(auditRoutes, {
    prefix: '/api/v1/audit',
  });

  // Audit Replay routes (S37)
  await auditReplayRoutes(server);

  // Press Release Generator routes (S38)
  await pressReleaseRoutes(server);

  // PR Pitch & Outreach Sequence routes (S39)
  await prPitchRoutes(server);

  // Media Monitoring & Earned Coverage routes (S40)
  await mediaMonitoringRoutes(server);

  // Automated Media Crawling & RSS Ingestion routes (S41)
  await rssRoutes(server);

  // Scheduler & Background Tasks routes (S42)
  await schedulerRoutes(server);

  // Media Alerts & Smart Signals routes (S43)
  await mediaAlertsRoutes(server);

  // Automated Journalist Outreach routes (S44)
  await server.register(prOutreachRoutes, { prefix: '/api/v1/pr-outreach' });

  // PR Outreach Deliverability & Engagement Analytics routes (S45)
  await server.register(prOutreachDeliverabilityRoutes, {
    prefix: '/api/v1/pr-outreach-deliverability',
  });

  // Journalist Identity Graph & Contact Intelligence routes (S46)
  await server.register(journalistGraphRoutes, {
    prefix: '/api/v1/journalist-graph',
  });

  // AI Media List Builder routes (S47)
  await server.register(mediaListRoutes, {
    prefix: '/api/v1/media-lists',
  });

  // Journalist Discovery Engine routes (S48)
  await server.register(journalistDiscoveryRoutes, {
    prefix: '/api/v1/journalist-discovery',
  });

  // Journalist Relationship Timeline routes (S49)
  await server.register(journalistTimelineRoutes, {
    prefix: '/api/v1/journalist-timeline',
  });

  // Audience Persona Builder routes (S51)
  await server.register(audiencePersonasRoutes, {
    prefix: '/api/v1/personas',
  });

  // Advanced Media Performance Insights routes (S52)
  await server.register(mediaPerformanceRoutes, {
    prefix: '/api/v1/media-performance',
  });

  // Competitive Intelligence Engine routes (S53)
  await server.register(competitorIntelligenceRoutes, {
    prefix: '/api/v1/competitive-intelligence',
  });

  // Media Briefing & Executive Talking Points routes (S54)
  await server.register(mediaBriefingRoutes, {
    prefix: '/api/v1/media-briefings',
  });

  // Crisis Response & Escalation Engine routes (S55)
  await server.register(crisisRoutes, {
    prefix: '/api/v1/crisis',
  });

  // Brand Reputation Intelligence routes (S56)
  await server.register(brandReputationRoutes, {
    prefix: '/api/v1/reputation',
  });

  // Brand Reputation Alerts & Executive Reporting routes (S57)
  await server.register(brandReputationAlertsRoutes, {
    prefix: '/api/v1/reputation-alerts',
  });

  // Governance, Compliance & Audit Intelligence routes (S59)
  await server.register(governanceRoutes, {
    prefix: '/api/v1/governance',
  });

  // Executive Risk Radar & Predictive Crisis Forecasting routes (S60)
  await server.register(riskRadarRoutes, {
    prefix: '/api/v1/risk-radar',
  });

  // Executive Command Center & Cross-System Insights routes (S61)
  await server.register(executiveCommandCenterRoutes, {
    prefix: '/api/v1/exec-dashboards',
  });

  // Executive Digest Generator routes (S62)
  await server.register(executiveDigestRoutes, {
    prefix: '/api/v1/exec-digests',
  });

  // Executive Board Report Generator routes (S63)
  await server.register(executiveBoardReportRoutes, {
    prefix: '/api/v1/executive-board-reports',
  });

  // Investor Relations Pack & Earnings Narrative Engine routes (S64)
  await server.register(investorRelationsRoutes, {
    prefix: '/api/v1/investor-relations',
  });

  // Strategic Intelligence Narrative Engine routes (S65)
  await server.register(strategicIntelligenceRoutes, {
    prefix: '/api/v1/strategic-intelligence',
  });

  // Unified Intelligence Graph routes (S66)
  await server.register(unifiedGraphRoutes, {
    prefix: '/api/v1/unified-graph',
  });

  // Scenario Simulation & Autonomous Playbook Orchestration routes (S67)
  await server.register(scenarioPlaybookRoutes, {
    prefix: '/api/v1/scenario-playbooks',
  });

  // Unified Narrative Generator V2 routes (S70)
  await server.register(unifiedNarrativeRoutes, {
    prefix: '/api/v1/unified-narratives',
  });

  // AI Scenario Simulation Engine routes (S71)
  await server.register(aiScenarioSimulationRoutes, {
    prefix: '/api/v1/ai-scenario-simulations',
  });

  // Scenario Orchestration Engine routes (S72)
  await server.register(scenarioOrchestrationRoutes, {
    prefix: '/api/v1/scenario-orchestrations',
  });

  // Reality Maps Engine routes (S73)
  await server.register(realityMapsRoutes, {
    prefix: '/api/v1/reality-maps',
  });

  // Insight Conflict Resolution Engine routes (S74)
  await server.register(insightConflictRoutes, {
    prefix: '/api/v1/insight-conflicts',
  });

  // EVI (Earned Visibility Index) routes (S-INT-01)
  await server.register(eviRoutes, {
    prefix: '/api/v1/evi',
  });

  // SAGE Signal Intelligence routes (S-INT-02)
  await server.register(sageRoutes, {
    prefix: '/api/v1/sage',
  });

  // CiteMind Quality Scoring routes (S-INT-04)
  await server.register(citeMindRoutes, {
    prefix: '/api/v1/citemind',
  });

  // GSC Integration routes (S-INT-06)
  await server.register(gscRoutes, {
    prefix: '/api/v1/integrations/gsc',
  });

  // Journalist Enrichment routes (S-INT-06)
  await server.register(journalistEnrichmentRoutes, {
    prefix: '/api/v1/journalists',
  });

  // Onboarding Activation routes (S-INT-07)
  await server.register(onboardingRoutes, {
    prefix: '/api/v1/onboarding',
  });

  // Beta Request routes (S-INT-09)
  await server.register(betaRoutes, {
    prefix: '/api/v1/beta',
  });

  // Push notification device token routes
  await server.register(notificationRoutes, {
    prefix: '/api/v1/notifications',
  });

  // Admin panel routes
  await server.register(adminRoutes, {
    prefix: '/api/v1/admin',
  });

  // Root endpoint
  server.get('/', async () => {
    return {
      name: 'Pravado API',
      version: '0.0.1-s1',
      status: 'running',
    };
  });

  // 404 handler
  server.setNotFoundHandler(async () => {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    };
  });

  // Error handler (S-INT-08: Sentry capture)
  server.setErrorHandler(async (error, request, reply) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    });

    // Capture to Sentry (skip 4xx client errors)
    const statusCode = (error as any).statusCode || 500;
    if (statusCode >= 500 && process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          org_id: (request as any).user?.orgId ?? 'unknown',
          route: request.routeOptions?.url ?? request.url,
        },
      });
    }

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: (error as any).code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  });

  // ========================================
  // BULLMQ INITIALIZATION (S-INT-01)
  // ========================================
  if (FLAGS.ENABLE_EVI) {
    const { initializeBullMQ, setupEVIScheduler } = await import('./queue/bullmqQueue');
    const redisUrl = process.env.REDIS_URL;
    await initializeBullMQ({ redisUrl });
    await setupEVIScheduler({ redisUrl });
  }

  // ========================================
  // SCHEDULER INITIALIZATION (S42)
  // ========================================
  if (FLAGS.ENABLE_SCHEDULER) {
    logger.info('Starting scheduler cron tick (every 60 seconds)');

    // Import scheduler dependencies dynamically
    const { createMediaMonitoringService } = await import('./services/mediaMonitoringService');
    const { createMediaCrawlerService } = await import('./services/mediaCrawlerService');
    const { createSchedulerService } = await import('./services/schedulerService');

    const supabase = (server as any).supabase;
    const openaiApiKey = config.LLM_OPENAI_API_KEY;

    const monitoringService = createMediaMonitoringService({
      supabase,
      openaiApiKey,
      debugMode: config.NODE_ENV !== 'production',
    });

    const mediaCrawlerService = createMediaCrawlerService({
      supabase,
      monitoringService,
      debugMode: config.NODE_ENV !== 'production',
    });

    const schedulerService = createSchedulerService({
      supabase,
      mediaCrawlerService,
      debugMode: config.NODE_ENV !== 'production',
    });

    // Run scheduler tick every 60 seconds
    setInterval(
      () => {
        schedulerService.executeDueTasks().catch((error) => {
          logger.error('Scheduler tick error:', error);
        });
      },
      60_000 // 60 seconds
    );
  }

  return server;
}
