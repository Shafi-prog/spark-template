/**
 * Enhanced logging and error monitoring system
 * Implements structured logging with proper error tracking
 */

import React from 'react'

interface LogLevel {
  name: string
  value: number
  color: string
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: Error
  userId?: string
  sessionId: string
  url: string
  userAgent: string
  stackTrace?: string
}

interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  enableStorage: boolean
  maxStorageEntries: number
}

// Define log levels
const LOG_LEVELS: Record<string, LogLevel> = {
  DEBUG: { name: 'DEBUG', value: 0, color: '#6B7280' },
  INFO: { name: 'INFO', value: 1, color: '#3B82F6' },
  WARN: { name: 'WARN', value: 2, color: '#F59E0B' },
  ERROR: { name: 'ERROR', value: 3, color: '#EF4444' },
  CRITICAL: { name: 'CRITICAL', value: 4, color: '#DC2626' },
} as const

class Logger {
  private config: LoggerConfig
  private sessionId: string
  private entries: LogEntry[] = []
  private userId?: string

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LOG_LEVELS.INFO,
      enableConsole: true,
      enableRemote: false,
      enableStorage: true,
      maxStorageEntries: 1000,
      ...config
    }

    this.sessionId = this.generateSessionId()
    this.initializeUserId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async initializeUserId() {
    try {
      const user = await spark.user()
      this.userId = user.id
    } catch {
      this.userId = 'anonymous'
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level.value >= this.config.level.value
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: error?.stack || new Error().stack
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString('ar-SA')
    const level = entry.level.name.padEnd(8)
    const userId = entry.userId ? `[${entry.userId}]` : '[anonymous]'
    
    return `${timestamp} ${level} ${userId} ${entry.message}`
  }

  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return

    const message = this.formatLogMessage(entry)
    const style = `color: ${entry.level.color}; font-weight: bold;`

    switch (entry.level.value) {
      case LOG_LEVELS.DEBUG.value:
        console.debug(`%c${message}`, style, entry.data, entry.error)
        break
      case LOG_LEVELS.INFO.value:
        console.info(`%c${message}`, style, entry.data)
        break
      case LOG_LEVELS.WARN.value:
        console.warn(`%c${message}`, style, entry.data, entry.error)
        break
      case LOG_LEVELS.ERROR.value:
      case LOG_LEVELS.CRITICAL.value:
        console.error(`%c${message}`, style, entry.data, entry.error)
        break
    }
  }

  private async logToStorage(entry: LogEntry) {
    if (!this.config.enableStorage) return

    try {
      this.entries.push(entry)
      
      // Trim entries if exceeding max storage
      if (this.entries.length > this.config.maxStorageEntries) {
        this.entries = this.entries.slice(-this.config.maxStorageEntries)
      }

      // Store critical errors immediately
      if (entry.level.value >= LOG_LEVELS.ERROR.value) {
        const criticalLogs = this.entries.filter(e => e.level.value >= LOG_LEVELS.ERROR.value)
        await spark.kv.set(`critical_logs_${this.sessionId}`, criticalLogs.slice(-50))
      }

      // Batch store all logs periodically
      if (this.entries.length % 50 === 0) {
        await spark.kv.set(`session_logs_${this.sessionId}`, this.entries.slice(-500))
      }
    } catch (error) {
      console.error('Failed to store log entry:', error)
    }
  }

  private async logToRemote(entry: LogEntry) {
    if (!this.config.enableRemote) return

    try {
      // In a real app, this would send to your logging service
      // For now, we'll just store it for demo purposes
      if (entry.level.value >= LOG_LEVELS.ERROR.value) {
        const errorReport = {
          ...entry,
          environment: import.meta.env.MODE,
          buildVersion: '1.0.0', // Would come from build process
          feature: this.extractFeatureFromUrl(entry.url)
        }

        await spark.kv.set(`error_report_${Date.now()}`, errorReport)
      }
    } catch (error) {
      console.error('Failed to send log to remote service:', error)
    }
  }

  private extractFeatureFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname
      const segments = pathname.split('/').filter(Boolean)
      return segments[0] || 'home'
    } catch {
      return 'unknown'
    }
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, data, error)

    this.logToConsole(entry)
    this.logToStorage(entry)
    this.logToRemote(entry)
  }

  // Public logging methods
  debug(message: string, data?: any) {
    this.log(LOG_LEVELS.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LOG_LEVELS.INFO, message, data)
  }

  warn(message: string, data?: any, error?: Error) {
    this.log(LOG_LEVELS.WARN, message, data, error)
  }

  error(message: string, error?: Error, data?: any) {
    this.log(LOG_LEVELS.ERROR, message, data, error)
  }

  critical(message: string, error?: Error, data?: any) {
    this.log(LOG_LEVELS.CRITICAL, message, data, error)
  }

  // Utility methods
  setUserId(userId: string) {
    this.userId = userId
  }

  setLogLevel(level: LogLevel) {
    this.config.level = level
  }

  async exportLogs(): Promise<LogEntry[]> {
    return [...this.entries]
  }

  async clearLogs() {
    this.entries = []
    try {
      await spark.kv.delete(`session_logs_${this.sessionId}`)
      await spark.kv.delete(`critical_logs_${this.sessionId}`)
    } catch (error) {
      console.error('Failed to clear stored logs:', error)
    }
  }

  // Performance logging
  timeStart(label: string) {
    console.time(label)
    this.debug(`Performance timing started: ${label}`)
  }

  timeEnd(label: string) {
    console.timeEnd(label)
    this.debug(`Performance timing ended: ${label}`)
  }

  // User action tracking
  trackUserAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data)
  }

  // API call logging
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean, error?: Error) {
    const message = `API ${method} ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`
    
    if (success) {
      this.info(message, { endpoint, method, duration })
    } else {
      this.error(message, error, { endpoint, method, duration })
    }
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, data?: any) {
    this.info(`Feature used: ${feature}`, data)
  }

  // Error context
  addErrorContext(context: Record<string, any>) {
    this.info('Error context added', context)
  }
}

// Create global logger instance
export const logger = new Logger({
  level: import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
  enableConsole: true,
  enableRemote: import.meta.env.PROD,
  enableStorage: true
})

// Error boundary integration
export const errorBoundaryLogger = {
  logError: (error: Error, errorInfo: any, componentStack?: string) => {
    logger.critical('React Error Boundary caught error', error, {
      componentStack,
      errorInfo
    })
  },

  logRecovery: (componentName: string) => {
    logger.info(`Error boundary recovery in ${componentName}`)
  }
}

// Global error handlers
if (typeof window !== 'undefined') {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.critical('Unhandled promise rejection', event.reason, {
      promise: event.promise,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // Global JavaScript errors
  window.addEventListener('error', (event) => {
    logger.critical('Global JavaScript error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as any
      logger.error('Resource loading error', undefined, {
        type: target.tagName,
        source: target.src || target.href,
        message: event.message
      })
    }
  }, true)
}

// React hook for logging
export function useLogger() {
  const componentName = React.useRef<string>('')

  React.useEffect(() => {
    // Try to get component name from stack trace
    const stack = new Error().stack
    const match = stack?.match(/at (\w+)/)
    componentName.current = match?.[1] || 'Unknown Component'

    logger.debug(`Component mounted: ${componentName.current}`)

    return () => {
      logger.debug(`Component unmounted: ${componentName.current}`)
    }
  }, [])

  return {
    debug: (message: string, data?: any) => 
      logger.debug(`[${componentName.current}] ${message}`, data),
    
    info: (message: string, data?: any) => 
      logger.info(`[${componentName.current}] ${message}`, data),
    
    warn: (message: string, data?: any, error?: Error) => 
      logger.warn(`[${componentName.current}] ${message}`, data, error),
    
    error: (message: string, error?: Error, data?: any) => 
      logger.error(`[${componentName.current}] ${message}`, error, data),
    
    critical: (message: string, error?: Error, data?: any) => 
      logger.critical(`[${componentName.current}] ${message}`, error, data),

    trackAction: (action: string, data?: any) => 
      logger.trackUserAction(`${componentName.current}: ${action}`, data),

    trackFeature: (feature: string, data?: any) => 
      logger.trackFeatureUsage(`${componentName.current}: ${feature}`, data)
  }
}

// High-order component for automatic logging
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const LoggedComponent = (props: P) => {
    const log = useLogger()
    
    React.useEffect(() => {
      log.info('Component rendered with props', { propsKeys: Object.keys(props) })
    }, [props, log])

    return <Component {...props} />
  }

  LoggedComponent.displayName = `withLogging(${componentName || Component.displayName || Component.name})`
  return LoggedComponent
}

// Debugging utilities
export const debugUtils = {
  // Log component props changes
  logPropsChanges: <T extends Record<string, any>>(componentName: string, prevProps: T, nextProps: T) => {
    const changes: Record<string, { old: any; new: any }> = {}
    
    Object.keys({ ...prevProps, ...nextProps }).forEach(key => {
      if (prevProps[key] !== nextProps[key]) {
        changes[key] = {
          old: prevProps[key],
          new: nextProps[key]
        }
      }
    })

    if (Object.keys(changes).length > 0) {
      logger.debug(`Props changed in ${componentName}`, changes)
    }
  },

  // Log render reasons
  logRenderReason: (componentName: string, reason: string, data?: any) => {
    logger.debug(`${componentName} re-rendered: ${reason}`, data)
  },

  // Performance debugging
  measureRender: <T>(componentName: string, renderFn: () => T): T => {
    const start = performance.now()
    const result = renderFn()
    const duration = performance.now() - start
    
    logger.debug(`Render time for ${componentName}: ${duration.toFixed(2)}ms`)
    
    if (duration > 16) {
      logger.warn(`Slow render detected in ${componentName}`, { duration })
    }
    
    return result
  }
}

// Export log levels for external use
export { LOG_LEVELS }

// Export types
export type { LogEntry, LogLevel, LoggerConfig }