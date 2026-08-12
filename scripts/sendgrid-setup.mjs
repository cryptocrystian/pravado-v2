#!/usr/bin/env node
/**
 * SendGrid setup for PRAVADO PR outreach — idempotent, safe to re-run.
 *
 * Configures the SendGrid ACCOUNT (not the codebase) to match what the outreach
 * send path expects:
 *   1. Domain Authentication for the sending domain (DKIM/SPF via CNAMEs) — so
 *      mail from outreach@<domain> passes DMARC and lands in inboxes.
 *   2. Event Webhook → the prod deliverability webhook, with signed events on.
 *   3. Prints the signed-webhook PUBLIC KEY to set as SENDGRID_WEBHOOK_KEY.
 *
 * What this CANNOT do: add DNS records to your domain. Step 1 creates the auth
 * and prints the exact CNAMEs; you add them to your DNS zone, then re-run with
 * `--validate` to finalize.
 *
 * Usage:
 *   SENDGRID_API_KEY=SG.xxx node scripts/sendgrid-setup.mjs            # create + configure
 *   SENDGRID_API_KEY=SG.xxx node scripts/sendgrid-setup.mjs --validate # after adding DNS
 *
 * Optional env overrides:
 *   SENDGRID_DOMAIN   (default: pravado.io)
 *   SENDGRID_WEBHOOK_URL (default: the prod onrender deliverability webhook)
 *
 * Requires Node 18+ (global fetch). The API key needs Full Access (or at least
 * "Mail Settings" + "Sender Authentication"). The key is read from env and never
 * printed.
 */

const API = 'https://api.sendgrid.com';
const KEY = process.env.SENDGRID_API_KEY;
const DOMAIN = process.env.SENDGRID_DOMAIN || 'pravado.io';
const WEBHOOK_URL =
  process.env.SENDGRID_WEBHOOK_URL ||
  'https://pravado-api.onrender.com/api/v1/pr-outreach-deliverability/webhooks/sendgrid';
const VALIDATE = process.argv.includes('--validate');

if (!KEY) {
  console.error(
    'ERROR: SENDGRID_API_KEY is required.\n' +
      '  SENDGRID_API_KEY=SG.xxx node scripts/sendgrid-setup.mjs'
  );
  process.exit(1);
}

async function sg(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `SendGrid ${method} ${path} → ${res.status}: ${JSON.stringify(json)}`
    );
  }
  return json;
}

function printDnsRecords(dns) {
  // dns is an object of { key: { type, host, data, valid } }
  console.log('\n  Add these DNS records to your domain zone:');
  console.log(
    '  ┌─────────┬──────────────────────────────────────┬───────────────────────────────────────┐'
  );
  console.log(
    '  │  TYPE   │ HOST (NAME)                          │ VALUE (DATA)                          │'
  );
  console.log(
    '  ├─────────┼──────────────────────────────────────┼───────────────────────────────────────┤'
  );
  for (const rec of Object.values(dns)) {
    console.log(
      `  │ ${String(rec.type).toUpperCase().padEnd(7)} │ ${String(rec.host).padEnd(36)} │ ${String(rec.data).padEnd(37)} │`
    );
  }
  console.log(
    '  └─────────┴──────────────────────────────────────┴───────────────────────────────────────┘'
  );
  console.log(
    '  (CNAME host/value may need the trailing dot or your provider may add the zone automatically.)'
  );
}

async function step1DomainAuth() {
  console.log(`\n[1/3] Domain Authentication for "${DOMAIN}"`);
  const existing = await sg(
    'GET',
    `/v3/whitelabel/domains?domain=${encodeURIComponent(DOMAIN)}&limit=50`
  );
  let domain = Array.isArray(existing)
    ? existing.find((d) => d.domain === DOMAIN)
    : undefined;

  if (!domain) {
    console.log('  No existing authentication found — creating one…');
    domain = await sg('POST', '/v3/whitelabel/domains', {
      domain: DOMAIN,
      automatic_security: true, // CNAME-based DKIM/SPF, SendGrid-managed
      default: true,
    });
    console.log(`  Created domain auth id=${domain.id}.`);
    printDnsRecords(domain.dns);
    console.log(
      '\n  → Add the records above, then re-run with --validate to finalize.'
    );
    return { validated: false };
  }

  console.log(
    `  Found existing domain auth id=${domain.id}, valid=${domain.valid}.`
  );
  if (domain.valid) {
    console.log('  ✓ Domain is already authenticated (DNS validated).');
    return { validated: true };
  }

  if (VALIDATE) {
    console.log('  Validating DNS…');
    const result = await sg(
      'POST',
      `/v3/whitelabel/domains/${domain.id}/validate`
    );
    if (result.valid) {
      console.log('  ✓ Domain authentication VALIDATED.');
      return { validated: true };
    }
    console.log('  ✗ Not valid yet. Outstanding records:');
    printDnsRecords(domain.dns);
    console.log(
      `  Validation detail: ${JSON.stringify(result.validation_results ?? result)}`
    );
    return { validated: false };
  }

  console.log('  Not yet validated. DNS records still needed:');
  printDnsRecords(domain.dns);
  console.log('  → Add them, then re-run with --validate.');
  return { validated: false };
}

async function step2EventWebhook() {
  console.log(`\n[2/3] Event Webhook → ${WEBHOOK_URL}`);
  await sg('PATCH', '/v3/user/webhooks/event/settings', {
    enabled: true,
    url: WEBHOOK_URL,
    // Events the deliverability service consumes (delivery + engagement + suppression signals).
    delivered: true,
    open: true,
    click: true,
    bounce: true,
    dropped: true,
    deferred: true,
    spam_report: true,
    unsubscribe: true,
    group_unsubscribe: true,
    group_resubscribe: true,
    processed: false,
  });
  console.log(
    '  ✓ Event Webhook enabled and pointed at the deliverability route.'
  );
}

async function step3SignedWebhookKey() {
  console.log('\n[3/3] Signed Event Webhook (verification key)');
  const signed = await sg('PATCH', '/v3/user/webhooks/event/settings/signed', {
    enabled: true,
  });
  const publicKey =
    signed.public_key ||
    (await sg('GET', '/v3/user/webhooks/event/settings/signed')).public_key;
  console.log('  ✓ Signed events enabled. Set this as SENDGRID_WEBHOOK_KEY:\n');
  console.log(`SENDGRID_WEBHOOK_KEY=${publicKey}\n`);
  return publicKey;
}

async function main() {
  console.log('PRAVADO · SendGrid setup');
  console.log('========================');
  console.log(`  domain:  ${DOMAIN}`);
  console.log(`  webhook: ${WEBHOOK_URL}`);
  console.log(
    `  mode:    ${VALIDATE ? 'create + VALIDATE DNS' : 'create + configure'}`
  );

  const domainResult = await step1DomainAuth();
  await step2EventWebhook();
  const publicKey = await step3SignedWebhookKey();

  console.log('\n────────────────────────────────────────────────────────');
  console.log('Summary');
  console.log(
    `  Domain auth: ${domainResult.validated ? '✓ validated' : '⏳ pending DNS (add records, re-run --validate)'}`
  );
  console.log('  Event webhook: ✓ configured');
  console.log('  Signed key: ✓ printed above');
  console.log('\nEnv vars to set in Render (API service):');
  console.log('  EMAIL_PROVIDER=sendgrid');
  console.log('  SENDGRID_API_KEY=<the key you used here>');
  console.log(`  SENDGRID_FROM_EMAIL=outreach@${DOMAIN}`);
  console.log('  SENDGRID_FROM_NAME=Pravado');
  console.log(`  SENDGRID_WEBHOOK_KEY=${publicKey}`);
  console.log(
    domainResult.validated
      ? '\nDone — outreach is ready once the env vars are set.'
      : '\nAlmost — add the DNS records, re-run with --validate, then set the env vars.'
  );
}

main().catch((err) => {
  console.error(`\nFAILED: ${err.message}`);
  process.exit(1);
});
