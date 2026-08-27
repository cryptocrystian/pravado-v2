/**
 * DataForSEO AI-Overview provider — the data source for the two AI SEARCH-SURFACE
 * CiteMind engines: Google AI Overviews and Bing Copilot.
 *
 * There is no official Microsoft/Google API for the consumer AI answer, but
 * DataForSEO's advanced SERP endpoints parse the AI summary + its cited sources
 * into an `ai_overview` item:
 *   Google AI Overviews → POST serp/google/organic/live/advanced
 *   Bing Copilot        → POST serp/bing/organic/live/advanced
 * The `ai_overview` item carries the generated summary (as `ai_overview_element`
 * children) plus `references` (name / domain / title / snippet / url).
 *
 * HONEST-DATA / INERT-SAFE (mirrors DataForSEOSerpProvider): only constructed
 * when credentials exist; on ANY failure or unexpected envelope it returns
 * `{ present: false, ... }` and logs — it NEVER fabricates an overview.
 *
 * Parsing is deliberately DEFENSIVE: DataForSEO's ai_overview shape varies
 * (nested element items, reference arrays, occasional async placeholders), so we
 * recursively collect text and pull references from whatever fields are present
 * rather than assuming one exact schema.
 */

import { createLogger } from '../../lib/logger';

const logger = createLogger('citemind:ai-overview');

/** DataForSEO "success" status code (per API envelope). */
const DATAFORSEO_OK = 20000;

export type AiSurface = 'google' | 'bing';

export interface AiOverviewReference {
  domain: string;
  url: string;
  title: string;
  snippet: string;
}

export interface AiOverviewResult {
  /** True when the surface returned an AI overview/summary for the query. */
  present: boolean;
  /** Concatenated summary text of the AI answer (empty when not present). */
  summaryText: string;
  /** Sources the AI answer cited. */
  references: AiOverviewReference[];
}

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const ENDPOINT: Record<AiSurface, string> = {
  google: 'serp/google/organic/live/advanced',
  bing: 'serp/bing/organic/live/advanced',
};

const EMPTY: AiOverviewResult = {
  present: false,
  summaryText: '',
  references: [],
};

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Pull an `ai_overview` item out of a DataForSEO items[] array and normalize it.
 * Exported for unit testing against captured/sample envelopes.
 */
export function parseAiOverview(items: unknown): AiOverviewResult {
  if (!Array.isArray(items)) return EMPTY;
  const overview = items.find(
    (it) =>
      it &&
      typeof it === 'object' &&
      (it as { type?: string }).type === 'ai_overview'
  ) as Record<string, unknown> | undefined;
  if (!overview) return EMPTY;

  // --- summary text: recursively collect `text`/`title` strings ---
  const texts: string[] = [];
  const collect = (node: unknown, depth = 0): void => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) {
      node.forEach((n) => collect(n, depth + 1));
      return;
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>;
      if (typeof o.title === 'string' && o.title.trim()) texts.push(o.title);
      if (typeof o.text === 'string' && o.text.trim()) texts.push(o.text);
      if (Array.isArray(o.items)) collect(o.items, depth + 1);
    }
  };
  collect(overview.items);
  const summaryText = texts.join('\n').trim();

  // --- references: from `references` (and any nested `links`/`references`) ---
  const refs: AiOverviewReference[] = [];
  const seen = new Set<string>();
  const collectRefs = (node: unknown, depth = 0): void => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) {
      node.forEach((n) => collectRefs(n, depth + 1));
      return;
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>;
      const url = typeof o.url === 'string' ? o.url : '';
      const domain =
        (typeof o.domain === 'string' && o.domain) ||
        (url ? domainFromUrl(url) : '');
      if (url || domain) {
        const key = url || domain;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push({
            domain,
            url,
            title:
              (typeof o.title === 'string' && o.title) ||
              (typeof o.source === 'string' && o.source) ||
              '',
            snippet:
              (typeof o.snippet === 'string' && o.snippet) ||
              (typeof o.text === 'string' && o.text) ||
              '',
          });
        }
      }
      if (Array.isArray(o.references)) collectRefs(o.references, depth + 1);
      if (Array.isArray(o.links)) collectRefs(o.links, depth + 1);
    }
  };
  collectRefs(overview.references);
  collectRefs(overview.items);

  return {
    present: summaryText.length > 0 || refs.length > 0,
    summaryText,
    references: refs,
  };
}

export class DataForSEOAiOverviewProvider {
  private readonly baseUrl: string;
  private readonly locationCode: number;
  private readonly languageCode: string;

  constructor(
    private readonly credentials: DataForSEOCredentials,
    private readonly fetchImpl: FetchLike = ((url, init) =>
      fetch(url, init) as unknown as ReturnType<FetchLike>) as FetchLike,
    options: {
      baseUrl?: string;
      locationCode?: number;
      languageCode?: string;
    } = {}
  ) {
    const base = options.baseUrl ?? 'https://api.dataforseo.com/v3/';
    this.baseUrl = base.endsWith('/') ? base : `${base}/`;
    this.locationCode = options.locationCode ?? 2840; // United States
    this.languageCode = options.languageCode ?? 'en';
  }

  private authHeader(): string {
    const token = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString('base64');
    return `Basic ${token}`;
  }

  async fetchAiOverview(
    surface: AiSurface,
    keyword: string
  ): Promise<AiOverviewResult> {
    const trimmed = keyword?.trim();
    if (!trimmed) return EMPTY;

    const url = `${this.baseUrl}${ENDPOINT[surface]}`;
    const body = JSON.stringify([
      {
        keyword: trimmed,
        location_code: this.locationCode,
        language_code: this.languageCode,
        depth: 10,
      },
    ]);

    let payload: {
      tasks?: Array<{
        status_code?: number;
        status_message?: string;
        result?: Array<{ items?: unknown }>;
      }>;
    };
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
        },
        body,
      });
      if (!res.ok) {
        logger.warn(
          `[ai-overview:${surface}] HTTP ${res.status} — degrading to no overview`
        );
        return EMPTY;
      }
      payload = (await res.json()) as typeof payload;
    } catch (err) {
      logger.warn(
        `[ai-overview:${surface}] request failed — degrading to no overview: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return EMPTY;
    }

    const task = payload?.tasks?.[0];
    if (
      !task ||
      task.status_code !== DATAFORSEO_OK ||
      !Array.isArray(task.result)
    ) {
      logger.warn(
        `[ai-overview:${surface}] unexpected envelope (${task?.status_code ?? 'none'}) — no overview`
      );
      return EMPTY;
    }

    return parseAiOverview(task.result[0]?.items);
  }
}

/** Factory: returns a provider only when DataForSEO credentials are configured. */
export function resolveAiOverviewProvider(): DataForSEOAiOverviewProvider | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return null;
  return new DataForSEOAiOverviewProvider({ login, password });
}
