/**
 * BullMQ Queue Setup (Sprint S-INT-01)
 *
 * Wires the existing queue abstraction to BullMQ + Redis.
 * Graceful fallback: if REDIS_URL is not set, logs a warning and skips queue operations.
 */

import { createLogger } from '@pravado/utils';

const logger = createLogger('queue:bullmq');

// ============================================================================
// Types
// ============================================================================

export interface BullMQConfig {
  redisUrl: string | undefined;
}

interface QueueInstance {
  add: (name: string, data: unknown, opts?: Record<string, unknown>) => Promise<unknown>;
  close: () => Promise<void>;
}

interface WorkerInstance {
  close: () => Promise<void>;
}

// ============================================================================
// State
// ============================================================================

let eviQueue: QueueInstance | null = null;
let eviWorker: WorkerInstance | null = null;
let sageQueue: QueueInstance | null = null;
let sageWorker: WorkerInstance | null = null;
let citeMindQueue: QueueInstance | null = null;
let citeMindWorker: WorkerInstance | null = null;
let citationMonitorQueue: QueueInstance | null = null;
let citationMonitorWorker: WorkerInstance | null = null;
let gscQueue: QueueInstance | null = null;
let gscWorker: WorkerInstance | null = null;
let journalistQueue: QueueInstance | null = null;
let journalistWorker: WorkerInstance | null = null;
let initialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize BullMQ queues and workers.
 * Must be called after environment is loaded.
 *
 * If REDIS_URL is not set, logs a warning and returns without initializing.
 * All enqueue operations will be no-ops in that case.
 */
export async function initializeBullMQ(config: BullMQConfig): Promise<void> {
  if (initialized) return;

  if (!config.redisUrl) {
    logger.warn('REDIS_URL not configured — BullMQ queues disabled. EVI recalculation will only run on-demand.');
    initialized = true;
    return;
  }

  try {
    // Dynamic import so the app doesn't crash if bullmq isn't installed
    const { Queue, Worker } = await import('bullmq');
    const { processEVIRecalculate } = await import('./workers/eviRecalculateWorker');

    // Parse Redis URL for BullMQ connection
    const connection = parseRedisUrl(config.redisUrl);

    // Pre-flight: verify Redis is reachable before creating queues
    try {
      const { default: Redis } = await import('ioredis');
      const testClient = new Redis({
        ...connection,
        connectTimeout: 3000,
        retryStrategy: () => null, // No retries for the test
        lazyConnect: true,
      });
      await testClient.connect();
      await testClient.ping();
      await testClient.quit();
      logger.info('Redis connection verified');
    } catch (pingErr) {
      const msg = pingErr instanceof Error ? pingErr.message : String(pingErr);
      logger.warn(`Redis not reachable (${msg}) — BullMQ queues disabled. Jobs will run on-demand only.`);
      initialized = true;
      return;
    }

    // Create the EVI recalculation queue
    eviQueue = new Queue('evi-recalculate', { connection });

    // Create the worker that processes EVI jobs
    eviWorker = new Worker(
      'evi-recalculate',
      async (job) => {
        logger.info(`Processing EVI job ${job.id} for org ${job.data.orgId}`);
        await processEVIRecalculate(job.data);
      },
      {
        connection,
        concurrency: 2,
      }
    );

    // Create the SAGE signal scan queue (S-INT-02)
    const { FLAGS } = await import('@pravado/feature-flags');
    if (FLAGS.ENABLE_SAGE_SIGNALS) {
      const { processSageSignalScan } = await import('./workers/sageSignalScanWorker');

      sageQueue = new Queue('sage-signal-scan', { connection });

      sageWorker = new Worker(
        'sage-signal-scan',
        async (job) => {
          logger.info(`Processing SAGE scan job ${job.id} for org ${job.data.orgId}`);
          await processSageSignalScan(job.data);
        },
        {
          connection,
          concurrency: 1,
        }
      );

      logger.info('SAGE signal scan queue initialized');
    }

    // Create the CiteMind scoring queue (S-INT-04)
    if (FLAGS.ENABLE_CITEMIND) {
      const { processCiteMindScore } = await import('./workers/citeMindScoringWorker');

      citeMindQueue = new Queue('citemind-score', { connection });

      citeMindWorker = new Worker(
        'citemind-score',
        async (job) => {
          logger.info(`Processing CiteMind job ${job.id} for content ${job.data.contentItemId}`);
          await processCiteMindScore(job.data);
        },
        {
          connection,
          concurrency: 2,
        }
      );

      logger.info('CiteMind scoring queue initialized');

      // Citation monitor queue (S-INT-05)
      const { processCitationMonitor } = await import('./workers/citationMonitorWorker');

      citationMonitorQueue = new Queue('citemind-monitor', { connection });

      citationMonitorWorker = new Worker(
        'citemind-monitor',
        async (job) => {
          logger.info(`Processing citation monitor job ${job.id} for org ${job.data.orgId}`);
          await processCitationMonitor(job.data);
        },
        {
          connection,
          concurrency: 1,
        }
      );

      // Schedule: every 6 hours
      await citationMonitorQueue.add(
        'citation-monitor-schedule',
        { type: 'scheduled' },
        {
          repeat: {
            pattern: '0 */6 * * *', // Every 6 hours
          },
          jobId: 'citemind-monitor-scheduler',
        }
      );

      logger.info('CiteMind citation monitor queue initialized (every 6h)');
    }

    // GSC Sync queue (S-INT-06)
    if (FLAGS.ENABLE_GSC_INTEGRATION) {
      const { processGscSync } = await import('./workers/gscSyncWorker');

      gscQueue = new Queue('gsc-sync', { connection });

      gscWorker = new Worker(
        'gsc-sync',
        async (job) => {
          logger.info(`Processing GSC sync job ${job.id}`);
          await processGscSync(job.data);
        },
        {
          connection,
          concurrency: 1,
        }
      );

      // Schedule: daily at 6am UTC
      await gscQueue.add(
        'gsc-sync-schedule',
        { type: 'scheduled' },
        {
          repeat: {
            pattern: '0 6 * * *', // 6am UTC daily
          },
          jobId: 'gsc-sync-scheduler',
        }
      );

      logger.info('GSC sync queue initialized (daily 6am UTC)');
    }

    // Journalist Enrichment queue (S-INT-06)
    if (FLAGS.ENABLE_JOURNALIST_ENRICHMENT) {
      const { processJournalistEnrich } = await import('./workers/journalistEnrichmentWorker');

      journalistQueue = new Queue('journalists-enrich-batch', { connection });

      journalistWorker = new Worker(
        'journalists-enrich-batch',
        async (job) => {
          logger.info(`Processing journalist enrichment job ${job.id}`);
          await processJournalistEnrich(job.data);
        },
        {
          connection,
          concurrency: 1,
        }
      );

      // Schedule: weekly Sunday at 11pm UTC
      await journalistQueue.add(
        'journalist-enrich-schedule',
        { type: 'scheduled' },
        {
          repeat: {
            pattern: '0 23 * * 0', // Sunday 11pm UTC
          },
          jobId: 'journalist-enrich-scheduler',
        }
      );

      logger.info('Journalist enrichment queue initialized (weekly Sunday 11pm UTC)');
    }

    logger.info('BullMQ initialized with EVI recalculation queue');
    initialized = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to initialize BullMQ: ${message}`);
    // Don't throw — graceful degradation
    initialized = true;
  }
}

// ============================================================================
// Queue Operations
// ============================================================================

/**
 * Enqueue an EVI recalculation job for a given org.
 * No-op if BullMQ is not initialized.
 */
export async function enqueueEVIRecalculate(orgId: string): Promise<void> {
  if (!eviQueue) {
    logger.warn(`Cannot enqueue EVI recalculate for org ${orgId} — queue not initialized`);
    return;
  }

  await eviQueue.add(
    'recalculate',
    { orgId },
    {
      // Deduplication: only one pending job per org
      jobId: `evi-recalculate-${orgId}`,
      // Remove completed jobs after 24 hours
      removeOnComplete: { age: 86400 },
      // Keep failed jobs for 7 days for debugging
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued EVI recalculation for org ${orgId}`);
}

/**
 * Enqueue EVI recalculation for all orgs (nightly job).
 */
export async function enqueueEVIRecalculateAll(supabaseClient: import('@supabase/supabase-js').SupabaseClient): Promise<number> {
  const { data: orgs, error } = await supabaseClient
    .from('orgs')
    .select('id');

  if (error || !orgs) {
    logger.error(`Failed to fetch orgs for EVI recalculation: ${error?.message}`);
    return 0;
  }

  let enqueued = 0;
  for (const org of orgs) {
    await enqueueEVIRecalculate(org.id);
    enqueued++;
  }

  logger.info(`Enqueued EVI recalculation for ${enqueued} orgs`);
  return enqueued;
}

/**
 * Enqueue a SAGE signal scan job for a given org.
 * No-op if BullMQ or SAGE queue is not initialized.
 */
export async function enqueueSageSignalScan(orgId: string): Promise<void> {
  if (!sageQueue) {
    logger.warn(`Cannot enqueue SAGE scan for org ${orgId} — queue not initialized`);
    return;
  }

  await sageQueue.add(
    'signal-scan',
    { orgId },
    {
      jobId: `sage-scan-${orgId}-${Date.now()}`,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued SAGE signal scan for org ${orgId}`);
}

/**
 * Enqueue a CiteMind scoring job for a content item.
 * No-op if BullMQ or CiteMind queue is not initialized.
 */
export async function enqueueCiteMindScore(contentItemId: string, orgId: string): Promise<void> {
  if (!citeMindQueue) {
    logger.warn(`Cannot enqueue CiteMind score for ${contentItemId} — queue not initialized`);
    return;
  }

  await citeMindQueue.add(
    'score',
    { contentItemId, orgId },
    {
      jobId: `citemind-score-${contentItemId}-${Date.now()}`,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued CiteMind scoring for content ${contentItemId}`);
}

/**
 * Enqueue a citation monitoring job for an org.
 * No-op if BullMQ or citation monitor queue is not initialized.
 */
export async function enqueueCitationMonitor(orgId: string): Promise<void> {
  if (!citationMonitorQueue) {
    logger.warn(`Cannot enqueue citation monitor for org ${orgId} — queue not initialized`);
    return;
  }

  await citationMonitorQueue.add(
    'monitor',
    { orgId },
    {
      jobId: `citemind-monitor-${orgId}-${Date.now()}`,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued citation monitor for org ${orgId}`);
}

/**
 * Enqueue a GSC sync job for a given org.
 * No-op if BullMQ or GSC queue is not initialized.
 */
export async function enqueueGscSync(orgId: string): Promise<void> {
  if (!gscQueue) {
    logger.warn(`Cannot enqueue GSC sync for org ${orgId} — queue not initialized`);
    return;
  }

  await gscQueue.add(
    'sync',
    { orgId },
    {
      jobId: `gsc-sync-${orgId}-${Date.now()}`,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued GSC sync for org ${orgId}`);
}

/**
 * Enqueue a journalist enrichment batch job for a given org.
 * No-op if BullMQ or journalist queue is not initialized.
 */
export async function enqueueJournalistEnrichBatch(orgId: string): Promise<void> {
  if (!journalistQueue) {
    logger.warn(`Cannot enqueue journalist enrichment for org ${orgId} — queue not initialized`);
    return;
  }

  await journalistQueue.add(
    'enrich-batch',
    { orgId },
    {
      jobId: `journalist-enrich-${orgId}-${Date.now()}`,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  logger.info(`Enqueued journalist enrichment for org ${orgId}`);
}

// ============================================================================
// Scheduler
// ============================================================================

/**
 * Set up the nightly EVI recalculation schedule.
 * Runs at midnight UTC every day.
 */
export async function setupEVIScheduler(config: BullMQConfig): Promise<void> {
  if (!config.redisUrl || !eviQueue) {
    logger.info('EVI scheduler skipped — no Redis connection');
    return;
  }

  try {
    // Use BullMQ's built-in repeat option for scheduled jobs
    // We add a repeating job that triggers nightly
    await eviQueue.add(
      'nightly-recalculate-all',
      { type: 'recalculate-all' },
      {
        repeat: {
          pattern: '0 0 * * *', // Midnight UTC daily
        },
        jobId: 'evi-nightly-scheduler',
      }
    );

    logger.info('EVI nightly scheduler configured (midnight UTC)');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to set up EVI scheduler: ${message}`);
  }
}

// ============================================================================
// Shutdown
// ============================================================================

/**
 * Gracefully shut down BullMQ connections.
 */
export async function shutdownBullMQ(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (eviWorker) {
    closePromises.push(eviWorker.close());
  }
  if (eviQueue) {
    closePromises.push(eviQueue.close());
  }
  if (sageWorker) {
    closePromises.push(sageWorker.close());
  }
  if (sageQueue) {
    closePromises.push(sageQueue.close());
  }
  if (citeMindWorker) {
    closePromises.push(citeMindWorker.close());
  }
  if (citeMindQueue) {
    closePromises.push(citeMindQueue.close());
  }
  if (citationMonitorWorker) {
    closePromises.push(citationMonitorWorker.close());
  }
  if (citationMonitorQueue) {
    closePromises.push(citationMonitorQueue.close());
  }
  if (gscWorker) {
    closePromises.push(gscWorker.close());
  }
  if (gscQueue) {
    closePromises.push(gscQueue.close());
  }
  if (journalistWorker) {
    closePromises.push(journalistWorker.close());
  }
  if (journalistQueue) {
    closePromises.push(journalistQueue.close());
  }

  await Promise.all(closePromises);
  logger.info('BullMQ shut down gracefully');
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a Redis URL into BullMQ connection options.
 * Supports: redis://user:password@host:port
 */
interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: object;
  maxRetriesPerRequest: null;
  connectTimeout: number;
  retryStrategy: (times: number) => number | null;
  enableOfflineQueue: boolean;
}

function parseRedisUrl(url: string): RedisConnectionOptions {
  // Shared options: fail fast, don't block startup, limit retries
  const sharedOpts = {
    maxRetriesPerRequest: null as null, // Required by BullMQ
    connectTimeout: 5000,
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.warn(`Redis connection failed after ${times} retries — giving up`);
        return null; // Stop retrying
      }
      return Math.min(times * 500, 3000);
    },
    enableOfflineQueue: false,
  };

  try {
    const parsed = new URL(url);
    const connection: RedisConnectionOptions = {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      ...sharedOpts,
    };

    if (parsed.password) {
      connection.password = parsed.password;
    }
    if (parsed.username && parsed.username !== 'default') {
      connection.username = parsed.username;
    }

    // Upstash and Redis Cloud require TLS
    if (url.startsWith('rediss://') || parsed.hostname.includes('upstash') || parsed.hostname.includes('redislabs')) {
      connection.tls = {};
    }

    return connection;
  } catch {
    // Fallback for non-URL format (host:port)
    const [host, portStr] = url.split(':');
    return {
      host: host || 'localhost',
      port: parseInt(portStr || '6379', 10),
      ...sharedOpts,
    };
  }
}
