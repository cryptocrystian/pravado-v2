  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // CiteMind Engine 1 — indexation ping (Lane D).
  // IndexNow: instant search-engine notification on publish (Autopilot; canon
  // CITEMIND_SYSTEM §2.5 / SEO_AEO_PILLAR_CANON §3D). Free, keyed POST.
  INDEXNOW_KEY: z.string().optional(),
  // Public URL that hosts `${INDEXNOW_KEY}.txt` (defaults to `<host>/<key>.txt`).
  INDEXNOW_KEY_LOCATION: z.string().url().optional(),
  // Google Indexing API — direct indexing request (Copilot/high-priority; canon
  // §2.5). Service-account credentials used to mint a short-lived access token.
  GOOGLE_INDEXING_SA_EMAIL: z.string().optional(),
  GOOGLE_INDEXING_SA_PRIVATE_KEY: z.string().optional(),