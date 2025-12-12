/**
 * Frontend Logging Service
 *
 * Provides structured logging with configurable levels and optional server-side shipping.
 * Supports correlation IDs for distributed tracing across frontend and backend.
 *
 * Usage:
 *   import { logger } from '../services/loggingService';
 *   logger.info('User action', { action: 'click', element: 'button' });
 *   logger.debug('Debug details', { data: someObject });
 *
 * Enable verbose mode:
 *   logger.enableVerbose(); // or via browser console: window.__mySchedulingLogger.enableVerbose()
 */

export type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  component?: string;
  userId?: string;
  tenantId?: string;
}

interface LoggingConfig {
  minLevel: LogLevel;
  isVerbose: boolean;
  enableConsole: boolean;
  enableServerShipping: boolean;
  serverEndpoint?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const LOG_STORAGE_KEY = 'myscheduling-logging-config';

class LoggingService {
  private config: LoggingConfig;
  private correlationId: string | null = null;
  private buffer: LogEntry[] = [];
  // Store interval ID for potential cleanup
  private _flushIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Load config from localStorage or use defaults
    this.config = this.loadConfig();

    // Start buffer flush interval for server shipping
    if (this.config.enableServerShipping) {
      this.startBufferFlush();
    }

    // Expose to window for console access
    if (typeof window !== 'undefined') {
      (window as unknown as { __mySchedulingLogger: LoggingService }).__mySchedulingLogger = this;
    }
  }

  private loadConfig(): LoggingConfig {
    const defaultConfig: LoggingConfig = {
      minLevel: 'info',
      isVerbose: false,
      enableConsole: true,
      enableServerShipping: false,
    };

    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        return { ...defaultConfig, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }

    return defaultConfig;
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.correlationId) {
      parts.push(`[${entry.correlationId}]`);
    }

    if (entry.component) {
      parts.push(`[${entry.component}]`);
    }

    parts.push(entry.message);

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, component?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId || undefined,
      data,
      component,
    };

    // Try to get user context from auth storage
    try {
      const authState = localStorage.getItem('auth-storage');
      if (authState) {
        const parsed = JSON.parse(authState);
        entry.userId = parsed.state?.user?.id;
        entry.tenantId = parsed.state?.currentWorkspace?.tenantId;
      }
    } catch {
      // Ignore
    }

    // Console output
    if (this.config.enableConsole) {
      const formatted = this.formatMessage(entry);
      const consoleData = data ? [formatted, data] : [formatted];

      switch (level) {
        case 'verbose':
        case 'debug':
          console.debug(...consoleData);
          break;
        case 'info':
          console.info(...consoleData);
          break;
        case 'warn':
          console.warn(...consoleData);
          break;
        case 'error':
          console.error(...consoleData);
          break;
      }
    }

    // Buffer for server shipping
    if (this.config.enableServerShipping) {
      this.buffer.push(entry);
    }
  }

  private startBufferFlush(): void {
    this._flushIntervalId = setInterval(() => {
      this.flushBuffer();
    }, 10000); // Every 10 seconds
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.serverEndpoint) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
    } catch {
      // Re-add to buffer on failure
      this.buffer.unshift(...entries);
    }
  }

  // Public API

  /**
   * Set the correlation ID for distributed tracing.
   * This ID will be included in all log entries and should match the X-Correlation-Id header.
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get the current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    this.correlationId = Math.random().toString(36).substring(2, 14);
    return this.correlationId;
  }

  /**
   * Enable verbose logging (includes all debug messages)
   */
  enableVerbose(): void {
    this.config.isVerbose = true;
    this.config.minLevel = 'verbose';
    this.saveConfig();
    this.info('Verbose logging enabled');
  }

  /**
   * Disable verbose logging (default to info level)
   */
  disableVerbose(): void {
    this.config.isVerbose = false;
    this.config.minLevel = 'info';
    this.saveConfig();
    this.info('Verbose logging disabled');
  }

  /**
   * Check if verbose mode is enabled
   */
  isVerboseEnabled(): boolean {
    return this.config.isVerbose;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
    this.config.isVerbose = level === 'verbose' || level === 'debug';
    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Stop the buffer flush interval (for cleanup)
   */
  stopBufferFlush(): void {
    if (this._flushIntervalId) {
      clearInterval(this._flushIntervalId);
      this._flushIntervalId = null;
    }
  }

  // Log methods
  verbose(message: string, data?: Record<string, unknown>, component?: string): void {
    this.log('verbose', message, data, component);
  }

  debug(message: string, data?: Record<string, unknown>, component?: string): void {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: Record<string, unknown>, component?: string): void {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: Record<string, unknown>, component?: string): void {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: Record<string, unknown>, component?: string): void {
    this.log('error', message, data, component);
  }

  /**
   * Log an error with stack trace
   */
  logError(error: Error, context?: Record<string, unknown>, component?: string): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    }, component);
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Export type for window augmentation
declare global {
  interface Window {
    __mySchedulingLogger: LoggingService;
  }
}
