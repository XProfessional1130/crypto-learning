/**
 * Logger - Utility for standardized logging across the application
 * Provides different log levels and can be configured to send logs to a server
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteUrl: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
};

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

// Configure the logger
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

// Check if a log level should be logged
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const minLevelIndex = levels.indexOf(config.minLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= minLevelIndex;
}

// Format a log message
function formatLogMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

// Send a log to the remote server
async function sendRemoteLog(level: LogLevel, message: string, data?: any): Promise<void> {
  if (!config.enableRemote || !config.remoteUrl) return;
  
  try {
    await fetch(config.remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    });
  } catch (error) {
    // Don't use the logger here to avoid infinite loops
    console.error('Failed to send remote log:', error);
  }
}

// Log a message
async function log(level: LogLevel, message: string, data?: any): Promise<void> {
  if (!shouldLog(level)) return;
  
  const formattedMessage = formatLogMessage(level, message, data);
  
  // Log to console if enabled
  if (config.enableConsole) {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        break;
    }
  }
  
  // Send to remote server if enabled
  if (config.enableRemote) {
    await sendRemoteLog(level, message, data);
  }
}

// Public API
export const logger = {
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
  
  // Create a scoped logger
  createScope: (scope: string) => ({
    debug: (message: string, data?: any) => log(LogLevel.DEBUG, `[${scope}] ${message}`, data),
    info: (message: string, data?: any) => log(LogLevel.INFO, `[${scope}] ${message}`, data),
    warn: (message: string, data?: any) => log(LogLevel.WARN, `[${scope}] ${message}`, data),
    error: (message: string, data?: any) => log(LogLevel.ERROR, `[${scope}] ${message}`, data),
  }),
}; 