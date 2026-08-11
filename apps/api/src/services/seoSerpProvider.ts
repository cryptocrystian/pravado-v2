/**
 * SEO SERP Provider
 * Wave-2: DataForSEO SERP provider abstraction — the real Layer-1 source that
 * powers the SEO Competitors surface (Share-of-Voice + competitor positions).
 *
 * Mirrors the verified keyword provider seam in `seoKeywordService.ts` (#142):
 *   - Injectable `fetchImpl` transport (trivially mockable, no real network).
 *   - HONEST degradation: on ANY failure (network throw, non-2xx, unexpected
 *     envelope, missing fields) it returns `[]`. It NEVER fabricates SERP data.
 *   - The factory returns the real DataForSEO provider ONLY when credentials are
 *     present, otherwise the Null provider (empty state). There is NO stub /
 *     fabrication path for SERP data — inventing competitor rankings is never
 *     permitted (canon SEO_AEO_PILLAR_CANON: buy real commodity data, never
 *     synthesize it).
 */

// ========================================
// TRANSPORT SEAM (mirrors keyword provider)
// ========================================

/**
 * Minimal HTTP response shape the SERP provider depends on. Kept narrow so the
 * transport is trivially mockable in unit tests (no real network).
 */
export interface SerpHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/**
 * Injectable fetch seam. Defaults to global `fetch`; unit tests pass a mock so
 * the mapping + honest-degradation logic can be verified without a network call.
 */
export type SerpFetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<SerpHttpResponse>;

const defaultSerpFetch: SerpFetchLike = (url, init) =>
  fetch(url, init) as unknown as Promise<SerpHttpResponse>;

// ========================================
// PROVIDER CONTRACT
// ========================================

/**
 * A single ORGANIC SERP position, mapped from the real DataForSEO response.
 * Non-organic items (ads, features, etc.) are excluded upstream.
 */
export interface SerpOrganicResult {
  /** Absolute position across the whole SERP (DataForSEO `rank_absolute`). */
  rankAbsolute: number;
  /** Position within the organic block (DataForSEO `rank_group`). */
  rankGroup: number | null;
  /** Ranking domain (DataForSEO `domain`), e.g. 'example.com'. */
  domain: string;
  /** Ranking URL. */
  url: string;
  /** Result title (nullable). */
  title: string | null;
}

export interface FetchSerpOptions {
  /** Location code (default 2840 = United States). */
  locationCode?: number;
  /** Language code (default 'en'). */
  languageCode?: string;
  /** Depth of organic results to request (default 10). */
  depth?: number;
}

/**
 * Provider interface. `fetchSerp` returns ONLY organic positions for a keyword,
 * or `[]` on any failure / no-data condition. Never throws for API errors.
 */
export interface SerpProvider {
  fetchSerp(
    keyword: string,
    options?: FetchSerpOptions
  ): Promise<SerpOrganicResult[]>;
}

// ========================================
// NULL PROVIDER (honest empty state)
// ========================================

/**
 * NullSerpProvider — the honest production default when NO real data source is
 * configured. Returns `[]` (no positions) rather than inventing any.
 *
 * This is the mechanism that GUARANTEES no fabricated competitor data reaches a
 * surface: absent DataForSEO credentials, the factory hands back this provider,
 * so a SERP refresh simply produces nothing — an empty, honest state.
 */
export class NullSerpProvider implements SerpProvider {
  async fetchSerp(): Promise<SerpOrganicResult[]> {
    return [];
  }
}

// ========================================
// DATAFORSEO PROVIDER (real bought Layer-1 data)
// ========================================

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

export interface DataForSEOSerpProviderOptions {
  /** DataForSEO base URL. Defaults to the production v3 REST base. */
  baseUrl?: string;
  /** Default location code (default 2840 = United States). */
  locationCode?: number;
  /** Default language code (default 'en'). */
  languageCode?: string;
  /** Default organic depth (default 10). */
  depth?: number;
}

/** DataForSEO "success" status code (per API envelope). */
const DATAFORSEO_OK = 20000;

/**
 * DataForSEOSerpProvider — calls DataForSEO's live SERP endpoint to fetch the
 * REAL Google organic results for a keyword and maps them to `SerpOrganicResult`.
 *
 * Endpoint used (VERIFIED live shape):
 *   POST `${base}serp/google/organic/live/advanced`
 *   body: `[{ keyword, location_code, language_code, depth }]`
 *   response: `tasks[0].result[0].items[]`, where organic entries have
 *     `type === 'organic'` and fields `rank_absolute`, `rank_group`, `domain`,
 *     `url`, `title`.
 *   cost: ~$0.002 / call.
 *
 * INERT-SAFE contract (mirrors DataForSEOKeywordProvider):
 *   - Only ever constructed by the factory when credentials are present.
 *   - On ANY failure (network throw, non-2xx, unexpected envelope, missing
 *     fields) it degrades HONESTLY — returns `[]` and logs. It NEVER fabricates.
 */
export class DataForSEOSerpProvider implements SerpProvider {
  private readonly baseUrl: string;
  private readonly locationCode: number;
  private readonly languageCode: string;
  private readonly depth: number;

  constructor(
    private readonly credentials: DataForSEOCredentials,
    private readonly fetchImpl: SerpFetchLike = defaultSerpFetch,
    options: DataForSEOSerpProviderOptions = {}
  ) {
    const base = options.baseUrl ?? 'https://api.dataforseo.com/v3/';
    this.baseUrl = base.endsWith('/') ? base : `${base}/`;
    this.locationCode = options.locationCode ?? 2840;
    this.languageCode = options.languageCode ?? 'en';
    this.depth = options.depth ?? 10;
  }

  private authHeader(): string {
    const token = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString('base64');
    return `Basic ${token}`;
  }

  async fetchSerp(
    keyword: string,
    options: FetchSerpOptions = {}
  ): Promise<SerpOrganicResult[]> {
    const trimmed = keyword?.trim();
    if (!trimmed) {
      return [];
    }

    const url = `${this.baseUrl}serp/google/organic/live/advanced`;
    const body = JSON.stringify([
      {
        keyword: trimmed,
        location_code: options.locationCode ?? this.locationCode,
        language_code: options.languageCode ?? this.languageCode,
        depth: options.depth ?? this.depth,
      },
    ]);

    let payload: any;
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
        // Honest degradation: log and return no data (never fabricate).
        console.warn(
          `[DataForSEOSerpProvider] HTTP ${res.status} from serp/organic — degrading to no data`
        );
        return [];
      }

      payload = await res.json();
    } catch (err) {
      console.warn(
        '[DataForSEOSerpProvider] request failed — degrading to no data (no fabrication)',
        err
      );
      return [];
    }

    const task = payload?.tasks?.[0];
    if (
      !task ||
      task.status_code !== DATAFORSEO_OK ||
      !Array.isArray(task.result)
    ) {
      console.warn(
        '[DataForSEOSerpProvider] unexpected task envelope — degrading to no data',
        task?.status_code,
        task?.status_message
      );
      return [];
    }

    const positions: SerpOrganicResult[] = [];
    for (const result of task.result) {
      const items = Array.isArray(result?.items) ? result.items : [];
      for (const item of items) {
        const mapped = this.mapOrganicItem(item);
        if (mapped) {
          positions.push(mapped);
        }
      }
    }
    return positions;
  }

  /**
   * Map a single SERP item to a `SerpOrganicResult`, or `null` when it is not a
   * usable organic entry. Only `type === 'organic'` items with a numeric
   * `rank_absolute`, a `domain` and a `url` are kept — everything else (ads,
   * features, malformed rows) is dropped rather than guessed.
   */
  private mapOrganicItem(item: any): SerpOrganicResult | null {
    if (!item || item.type !== 'organic') {
      return null;
    }
    const rankAbsolute =
      typeof item.rank_absolute === 'number' ? item.rank_absolute : null;
    const domain = typeof item.domain === 'string' ? item.domain.trim() : '';
    const url = typeof item.url === 'string' ? item.url : '';

    if (rankAbsolute === null || !domain || !url) {
      return null;
    }

    return {
      rankAbsolute,
      rankGroup: typeof item.rank_group === 'number' ? item.rank_group : null,
      domain: domain.replace(/^www\./, ''),
      url,
      title: typeof item.title === 'string' ? item.title : null,
    };
  }
}

// ========================================
// PROVIDER FACTORY / SELECTION
// ========================================

export interface SerpProviderConfig {
  /** DataForSEO API login (env DATAFORSEO_LOGIN). */
  dataForSeoLogin?: string;
  /** DataForSEO API password (env DATAFORSEO_PASSWORD). */
  dataForSeoPassword?: string;
  /** Process NODE_ENV (accepted for parity with the keyword factory). */
  nodeEnv?: string;
}

export interface ResolveSerpProviderDeps {
  /** Injectable transport for the DataForSEO provider (tests pass a mock). */
  fetchImpl?: SerpFetchLike;
  /** Optional provider option overrides (base URL, defaults). */
  options?: DataForSEOSerpProviderOptions;
}

/** Read provider config from the environment (lazily, at call time). */
export function serpProviderConfigFromEnv(): SerpProviderConfig {
  return {
    dataForSeoLogin: process.env.DATAFORSEO_LOGIN,
    dataForSeoPassword: process.env.DATAFORSEO_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
  };
}

/**
 * resolveSerpProvider — the SINGLE runtime seam that decides which SERP provider
 * is active. Selection order:
 *
 *   1. DataForSEO credentials set → DataForSEOSerpProvider (real bought data).
 *   2. Otherwise                  → NullSerpProvider (NO data — honest empty).
 *
 * There is deliberately NO stub / fabrication branch: inventing competitor
 * rankings is never permitted. With no credentials the result is the Null
 * provider, so a refresh produces nothing rather than fake positions.
 */
export function resolveSerpProvider(
  cfg: SerpProviderConfig = serpProviderConfigFromEnv(),
  deps: ResolveSerpProviderDeps = {}
): SerpProvider {
  const login = cfg.dataForSeoLogin?.trim();
  const password = cfg.dataForSeoPassword?.trim();

  if (login && password) {
    return new DataForSEOSerpProvider(
      { login, password },
      deps.fetchImpl,
      deps.options
    );
  }

  // No credentials → NO data (honest empty state). Never fabricated.
  return new NullSerpProvider();
}
