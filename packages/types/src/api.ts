/**
 * API-specific types
 */

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    database?: CheckStatus;
    redis?: CheckStatus;
    storage?: CheckStatus;
  };
}

export interface CheckStatus {
  status: 'up' | 'down';
  responseTime?: number;
  message?: string;
}

export interface ApiConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}
