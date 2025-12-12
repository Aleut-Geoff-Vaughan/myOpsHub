import { useCallback, useMemo } from 'react';
import { logger, type LogLevel } from '../services/loggingService';

/**
 * React hook for component-level logging.
 *
 * Usage:
 *   const { log, debug, info, warn, error } = useLogging('MyComponent');
 *   info('User clicked button', { buttonId: 'submit' });
 */
export function useLogging(component: string) {
  const log = useCallback(
    (level: LogLevel, message: string, data?: Record<string, unknown>) => {
      switch (level) {
        case 'verbose':
          logger.verbose(message, data, component);
          break;
        case 'debug':
          logger.debug(message, data, component);
          break;
        case 'info':
          logger.info(message, data, component);
          break;
        case 'warn':
          logger.warn(message, data, component);
          break;
        case 'error':
          logger.error(message, data, component);
          break;
      }
    },
    [component]
  );

  const verbose = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      logger.verbose(message, data, component);
    },
    [component]
  );

  const debug = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      logger.debug(message, data, component);
    },
    [component]
  );

  const info = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      logger.info(message, data, component);
    },
    [component]
  );

  const warn = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      logger.warn(message, data, component);
    },
    [component]
  );

  const error = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      logger.error(message, data, component);
    },
    [component]
  );

  const logError = useCallback(
    (err: Error, context?: Record<string, unknown>) => {
      logger.logError(err, context, component);
    },
    [component]
  );

  return useMemo(
    () => ({
      log,
      verbose,
      debug,
      info,
      warn,
      error,
      logError,
      enableVerbose: logger.enableVerbose.bind(logger),
      disableVerbose: logger.disableVerbose.bind(logger),
      isVerboseEnabled: logger.isVerboseEnabled.bind(logger),
      setLevel: logger.setLevel.bind(logger),
      getConfig: logger.getConfig.bind(logger),
    }),
    [log, verbose, debug, info, warn, error, logError]
  );
}

export type { LogLevel };
