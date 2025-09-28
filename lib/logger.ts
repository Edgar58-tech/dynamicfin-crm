
// Sistema de logging avanzado para DynamicFin CRM
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export class Logger {
  private context: string;
  private logLevel: LogLevel;

  constructor(context: string = 'App', logLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = logLevel;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${levelName}] [${this.context}] ${message}${metaStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private writeLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry.level, entry.message, entry.metadata);
    
    // En desarrollo, usar console
    if (process.env.NODE_ENV === 'development') {
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // En producción, enviar a servicio de logging
    // TODO: Integrar con servicio externo como Winston, Sentry, etc.
  }

  error(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog({
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message,
        context: this.context,
        metadata
      });
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog({
        timestamp: new Date(),
        level: LogLevel.WARN,
        message,
        context: this.context,
        metadata
      });
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog({
        timestamp: new Date(),
        level: LogLevel.INFO,
        message,
        context: this.context,
        metadata
      });
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog({
        timestamp: new Date(),
        level: LogLevel.DEBUG,
        message,
        context: this.context,
        metadata
      });
    }
  }

  trace(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.writeLog({
        timestamp: new Date(),
        level: LogLevel.TRACE,
        message,
        context: this.context,
        metadata
      });
    }
  }

  // Métodos específicos para el CRM
  logUserAction(userId: string, action: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, { 
      userId, 
      action, 
      ...metadata 
    });
  }

  logAPICall(endpoint: string, method: string, duration: number, status: number): void {
    this.info(`API call: ${method} ${endpoint}`, {
      endpoint,
      method,
      duration,
      status,
      type: 'api_call'
    });
  }

  logError(error: Error, context?: string): void {
    this.error(`${context ? context + ': ' : ''}${error.message}`, {
      errorName: error.name,
      stack: error.stack,
      context
    });
  }

  logProspectEvent(prospectId: string, event: string, details?: Record<string, any>): void {
    this.info(`Prospect event: ${event}`, {
      prospectId,
      event,
      type: 'prospect_event',
      ...details
    });
  }

  logSystemEvent(event: string, details?: Record<string, any>): void {
    this.info(`System event: ${event}`, {
      event,
      type: 'system_event',
      ...details
    });
  }
}

// Loggers predefinidos para diferentes contextos
export const appLogger = new Logger('App');
export const apiLogger = new Logger('API');
export const dbLogger = new Logger('Database');
export const authLogger = new Logger('Auth');
export const crmLogger = new Logger('CRM');
export const monitoringLogger = new Logger('Monitoring');
export const testLogger = new Logger('Testing');

// Factory function para crear loggers contextuales
export function createLogger(context: string, level?: LogLevel): Logger {
  return new Logger(context, level);
}
