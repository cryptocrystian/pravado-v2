/**
 * Stripe Billing Bootstrap Script (Sprint S88)
 *
 * Idempotently creates Stripe products, prices, and optionally configures webhooks.
 * Safe to run multiple times - will skip existing products/prices.
 *
 * Usage:
 *   pnpm --filter @pravado/api exec tsx src/scripts/bootstrapStripeBilling.ts
 *
 * Required ENV:
 *   STRIPE_SECRET_KEY - Your Stripe secret key (sk_live_... or sk_test_...)
 *
 * Optional ENV:
 *   RENDER_EXTERNAL_URL - API URL for webhook endpoint (e.g., https://your-api.render.com)
 *   STRIPE_WEBHOOK_SECRET - If set, skips webhook creation
 */

import Stripe from 'stripe';

// Plan configuration matching database schema
const PLANS = [
  {
    slug: 'starter',
    name: 'Pravado Starter',
    description: 'For individuals and small teams getting started with AI-powered marketing',
    monthlyPriceCents: 1000, // $10/month
    features: [
      '100,000 LLM tokens/month',
      '10 playbook runs/month',
      '1 team seat',
      'Email support',
    ],
  },
  {
    slug: 'growth',
    name: 'Pravado Growth',
    description: 'For growing teams scaling their marketing operations',
    monthlyPriceCents: 5000, // $50/month
    features: [
      '500,000 LLM tokens/month',
      '50 playbook runs/month',
      '5 team seats',
      'Priority support',
      'Advanced analytics',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Pravado Enterprise',
    description: 'For large organizations with advanced requirements',
    monthlyPriceCents: 50000, // $500/month
    features: [
      '5,000,000 LLM tokens/month',
      '500 playbook runs/month',
      '50 team seats',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

// Webhook events to subscribe to
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'checkout.session.completed',
];

interface BootstrapResult {
  products: Array<{ slug: string; productId: string; priceId: string }>;
  webhook?: { id: string; secret: string };
  skipped: string[];
  errors: string[];
}

async function bootstrapStripeBilling(): Promise<BootstrapResult> {
  const result: BootstrapResult = {
    products: [],
    skipped: [],
    errors: [],
  };

  // Validate environment
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  console.log('='.repeat(60));
  console.log('Pravado Stripe Billing Bootstrap');
  console.log('='.repeat(60));
  console.log(`Mode: ${stripeSecretKey.startsWith('sk_live_') ? 'PRODUCTION' : 'TEST'}`);
  console.log('');

  // Initialize Stripe
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  });

  // Test connection
  try {
    await stripe.accounts.retrieve();
    console.log('[OK] Stripe connection verified');
  } catch (error) {
    throw new Error(`Failed to connect to Stripe: ${error}`);
  }

  // Fetch existing products to check for duplicates
  console.log('\n--- Checking Existing Products ---');
  const existingProducts = await stripe.products.list({ limit: 100, active: true });
  const existingProductsBySlug = new Map<string, Stripe.Product>();

  for (const product of existingProducts.data) {
    const slug = product.metadata?.slug;
    if (slug) {
      existingProductsBySlug.set(slug, product);
    }
  }

  // Process each plan
  console.log('\n--- Creating Products & Prices ---');
  for (const plan of PLANS) {
    console.log(`\nProcessing: ${plan.name} (${plan.slug})`);

    // Check if product exists
    const existingProduct = existingProductsBySlug.get(plan.slug);
    if (existingProduct) {
      console.log(`  [SKIP] Product already exists: ${existingProduct.id}`);

      // Check for existing price
      const existingPrices = await stripe.prices.list({
        product: existingProduct.id,
        active: true,
        limit: 10,
      });

      const monthlyPrice = existingPrices.data.find(
        (p) => p.recurring?.interval === 'month' && p.unit_amount === plan.monthlyPriceCents
      );

      if (monthlyPrice) {
        console.log(`  [SKIP] Price already exists: ${monthlyPrice.id}`);
        result.skipped.push(`${plan.slug} (product: ${existingProduct.id}, price: ${monthlyPrice.id})`);
        result.products.push({
          slug: plan.slug,
          productId: existingProduct.id,
          priceId: monthlyPrice.id,
        });
        continue;
      }
    }

    try {
      // Create or use existing product
      let productId: string;
      if (existingProduct) {
        productId = existingProduct.id;
        console.log(`  [USE] Using existing product: ${productId}`);
      } else {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            slug: plan.slug,
            pravado_plan: 'true',
          },
          marketing_features: plan.features.map((f) => ({ name: f })),
        });
        productId = product.id;
        console.log(`  [NEW] Created product: ${productId}`);
      }

      // Create price
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.monthlyPriceCents,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          slug: plan.slug,
          pravado_price: 'true',
        },
      });
      console.log(`  [NEW] Created price: ${price.id}`);

      result.products.push({
        slug: plan.slug,
        productId,
        priceId: price.id,
      });
    } catch (error) {
      const errorMsg = `Failed to create ${plan.slug}: ${error}`;
      console.error(`  [ERROR] ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  // Configure webhook (optional)
  console.log('\n--- Webhook Configuration ---');
  const existingWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL;

  if (existingWebhookSecret) {
    console.log('[SKIP] STRIPE_WEBHOOK_SECRET already set, skipping webhook creation');
  } else if (!apiUrl) {
    console.log('[SKIP] No API URL provided (RENDER_EXTERNAL_URL or API_URL), skipping webhook creation');
    console.log('       Set RENDER_EXTERNAL_URL to enable automatic webhook creation');
  } else {
    const webhookUrl = `${apiUrl}/api/v1/billing/stripe/webhook`;
    console.log(`Creating webhook for: ${webhookUrl}`);

    try {
      // Check for existing webhook with same URL
      const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
      const existingWebhook = existingWebhooks.data.find((w) => w.url === webhookUrl);

      if (existingWebhook) {
        console.log(`[SKIP] Webhook already exists: ${existingWebhook.id}`);
        console.log('       To get the secret, run: stripe webhook_endpoints retrieve <id>');
      } else {
        const webhook = await stripe.webhookEndpoints.create({
          url: webhookUrl,
          enabled_events: WEBHOOK_EVENTS,
          description: 'Pravado billing webhook',
          metadata: {
            pravado_webhook: 'true',
          },
        });

        console.log(`[NEW] Created webhook: ${webhook.id}`);
        console.log(`      Secret: ${webhook.secret}`);

        result.webhook = {
          id: webhook.id,
          secret: webhook.secret || '',
        };
      }
    } catch (error) {
      const errorMsg = `Failed to create webhook: ${error}`;
      console.error(`[ERROR] ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('BOOTSTRAP COMPLETE');
  console.log('='.repeat(60));

  console.log('\n--- Environment Variables to Set ---');
  for (const product of result.products) {
    const envKey = `STRIPE_PRICE_${product.slug.toUpperCase()}`;
    console.log(`${envKey}=${product.priceId}`);
  }

  if (result.webhook) {
    console.log(`STRIPE_WEBHOOK_SECRET=${result.webhook.secret}`);
  }

  console.log('\n--- Summary ---');
  console.log(`Products created/verified: ${result.products.length}`);
  console.log(`Skipped (already exist): ${result.skipped.length}`);
  console.log(`Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n--- Errors ---');
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  return result;
}

// Run the bootstrap
bootstrapStripeBilling()
  .then((result) => {
    if (result.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[FATAL]', error);
    process.exit(1);
  });
