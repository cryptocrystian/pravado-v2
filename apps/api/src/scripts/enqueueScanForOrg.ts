/**
 * Enqueue a SAGE signal scan for a single org (operational / verification tool).
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/enqueueScanForOrg.ts <orgId>
 *
 * Add-only by design: this creates a BullMQ *producer* and pushes one job onto
 * the shared 'sage-signal-scan' queue, then exits. It does NOT start a worker,
 * so the job is processed by the deployed API worker (with its deployed code +
 * environment, e.g. LLM_ANTHROPIC_MODEL) rather than locally. This mirrors the
 * queue/job shape of enqueueSageSignalScan() in src/queue/bullmqQueue.ts.
 */
import { Queue } from 'bullmq';
import { config as loadEnv } from 'dotenv';

// Best-effort env load: prefer apps/api/.env, then repo-root .env.local.
loadEnv({ path: 'apps/api/.env' });
loadEnv({ path: '.env.local' });

const QUEUE_NAME = 'sage-signal-scan';
const JOB_NAME = 'signal-scan';

/**
 * Parse a Redis URL into ioredis/BullMQ connection options, applying TLS for
 * rediss:// or managed hosts (matches parseRedisUrl in bullmqQueue.ts).
 */
function parseRedisConnection(url: string) {
  const parsed = new URL(url);
  const connection: Record<string, unknown> = {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    maxRetriesPerRequest: null, // required by BullMQ
    connectTimeout: 5000,
    enableOfflineQueue: true,
  };
  if (parsed.password) connection.password = parsed.password;
  if (parsed.username && parsed.username !== 'default')
    connection.username = parsed.username;
  // TLS is driven by the rediss:// scheme ONLY. Hostname inference (upstash/
  // redislabs) was deliberately removed in fix(queue) 258e288 because forcing
  // TLS on Redis Cloud hosts broke BullMQ queue init in production.
  if (url.startsWith('rediss://')) {
    connection.tls = {};
  }
  return connection;
}

async function main(): Promise<void> {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error(
      'Usage: npx tsx apps/api/src/scripts/enqueueScanForOrg.ts <orgId>'
    );
    process.exit(1);
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error(
      'REDIS_URL not set — cannot enqueue. Set it in apps/api/.env or the shell.'
    );
    process.exit(1);
  }

  // Match the worker's BullMQ prefix so the job lands on the queue the
  // deployed worker consumes. Prod leaves BULLMQ_PREFIX unset (default 'bull');
  // staging sets BULLMQ_PREFIX=pravado-staging for env isolation on the shared
  // Redis instance.
  const prefix = process.env.BULLMQ_PREFIX || 'bull';
  const queue = new Queue(QUEUE_NAME, {
    connection: parseRedisConnection(redisUrl),
    prefix,
  });

  const jobId = `sage-scan-${orgId}-${Date.now()}`;
  const enqueuedAt = new Date().toISOString();

  await queue.add(
    JOB_NAME,
    { orgId },
    {
      jobId,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  );

  console.log(
    JSON.stringify(
      { enqueued: true, queue: QUEUE_NAME, prefix, orgId, jobId, enqueuedAt },
      null,
      2
    )
  );

  await queue.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Enqueue failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
