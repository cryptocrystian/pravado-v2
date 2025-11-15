/**
 * Simple structured logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  constructor(
    private readonly context: string,
    private readonly level: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, message: string, meta?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta,
    };

    const method = level === 'debug' ? 'log' : level;
    console[method](JSON.stringify(logData));
  }

  debug(message: string, meta?: LogContext): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogContext): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogContext): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogContext): void {
    this.log('error', message, meta);
  }
}

export function createLogger(context: string, level?: LogLevel): Logger {
  return new Logger(context, level);
}
