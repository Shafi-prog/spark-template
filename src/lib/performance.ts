/**
 * Performance monitoring and optimization utilities
 * Implements best practices for web performance tracking
 */

import { useEffect, useRef, useState } from 'react'

// Performance metric types
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
  tags?: Record<string, string>
}

interface ComponentPerformance {
  componentName: string
  renderTime: number
  mountTime: number
  updateCount: number
  rerenderReasons?: string[]
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private componentMetrics: Map<string, ComponentPerformance> = new Map()

  constructor() {
    this.initializeObservers()
  }

  // Initialize performance observers
  private initializeObservers() {
    if (typeof window === 'undefined') return

    try {
      // Long Task Observer
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              timestamp: entry.startTime,
              type: 'timing',
              tags: { type: entry.entryType }
            })

            // Log warning for long tasks
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`)
            }
          })
        })

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
          this.observers.push(longTaskObserver)
        } catch (e) {
          console.warn('Long task observer not supported')
        }

        // Layout Shift Observer
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.value > 0) {
              this.recordMetric({
                name: 'cumulative_layout_shift',
                value: entry.value,
                timestamp: entry.startTime,
                type: 'gauge'
              })
            }
          })
        })

        try {
          layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
          this.observers.push(layoutShiftObserver)
        } catch (e) {
          console.warn('Layout shift observer not supported')
        }

        // First Input Delay Observer
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'first_input_delay',
              value: entry.processingStart - entry.startTime,
              timestamp: entry.startTime,
              type: 'timing'
            })
          })
        })

        try {
          fidObserver.observe({ entryTypes: ['first-input'] })
          this.observers.push(fidObserver)
        } catch (e) {
          console.warn('First input delay observer not supported')
        }
      }
    } catch (error) {
      console.warn('Performance observers initialization failed:', error)
    }
  }

  // Record custom metric
  public recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send critical metrics to analytics
    this.sendToAnalytics(metric)
  }

  // Time a function execution
  public time<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordMetric({
      name,
      value: duration,
      timestamp: start,
      type: 'timing',
      tags
    })

    return result
  }

  // Time an async function execution
  public async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      this.recordMetric({
        name,
        value: duration,
        timestamp: start,
        type: 'timing',
        tags: { ...tags, success: 'true' }
      })

      return result
    } catch (error) {
      const duration = performance.now() - start

      this.recordMetric({
        name,
        value: duration,
        timestamp: start,
        type: 'timing',
        tags: { ...tags, success: 'false', error: error instanceof Error ? error.name : 'unknown' }
      })

      throw error
    }
  }

  // Record component performance
  public recordComponentMetric(componentName: string, metric: Partial<ComponentPerformance>) {
    const existing = this.componentMetrics.get(componentName) || {
      componentName,
      renderTime: 0,
      mountTime: 0,
      updateCount: 0,
      rerenderReasons: []
    }

    this.componentMetrics.set(componentName, {
      ...existing,
      ...metric,
      updateCount: existing.updateCount + (metric.renderTime ? 1 : 0)
    })
  }

  // Get performance summary
  public getPerformanceSummary() {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000) // Last minute

    const summary = {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      averageRenderTime: this.calculateAverage(recentMetrics.filter(m => m.name.includes('render')).map(m => m.value)),
      longTasks: recentMetrics.filter(m => m.name === 'long_task').length,
      layoutShifts: recentMetrics.filter(m => m.name === 'cumulative_layout_shift').length,
      componentMetrics: Array.from(this.componentMetrics.entries()).map(([name, metric]) => ({
        name,
        ...metric
      }))
    }

    return summary
  }

  // Get web vitals
  public getWebVitals() {
    const vitals: Record<string, number> = {}

    // First Contentful Paint
    const fcpEntries = performance.getEntriesByName('first-contentful-paint')
    if (fcpEntries.length > 0) {
      vitals.fcp = fcpEntries[0].startTime
    }

    // Largest Contentful Paint
    const lcpMetrics = this.metrics.filter(m => m.name === 'largest_contentful_paint')
    if (lcpMetrics.length > 0) {
      vitals.lcp = Math.max(...lcpMetrics.map(m => m.value))
    }

    // Cumulative Layout Shift
    const clsMetrics = this.metrics.filter(m => m.name === 'cumulative_layout_shift')
    if (clsMetrics.length > 0) {
      vitals.cls = clsMetrics.reduce((sum, metric) => sum + metric.value, 0)
    }

    // First Input Delay
    const fidMetrics = this.metrics.filter(m => m.name === 'first_input_delay')
    if (fidMetrics.length > 0) {
      vitals.fid = Math.max(...fidMetrics.map(m => m.value))
    }

    return vitals
  }

  // Calculate average
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  // Send metrics to analytics (placeholder)
  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // In a real app, this would send to your analytics service
      if (metric.name === 'long_task' && metric.value > 100) {
        await spark.kv.set(`perf_alert_${Date.now()}`, {
          metric,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      // Silently handle analytics errors
    }
  }

  // Cleanup observers
  public cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Create global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// React hooks for performance monitoring

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const mountStartTime = useRef<number>(0)
  const renderCount = useRef<number>(0)

  // Measure render time
  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    renderCount.current++

    performanceMonitor.recordComponentMetric(componentName, {
      renderTime,
      updateCount: renderCount.current
    })

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  })

  // Measure mount time
  useEffect(() => {
    mountStartTime.current = performance.now()
    
    return () => {
      const mountTime = performance.now() - mountStartTime.current
      performanceMonitor.recordComponentMetric(componentName, { mountTime })
    }
  }, [])
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        summary: performanceMonitor.getPerformanceSummary(),
        webVitals: performanceMonitor.getWebVitals()
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return metrics
}

/**
 * Hook to measure API call performance
 */
export function useApiPerformance() {
  const measureApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> => {
    return performanceMonitor.timeAsync(
      `api_${name}`,
      apiCall,
      tags
    )
  }

  return { measureApiCall }
}

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const PerformanceMonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown'
    useRenderPerformance(name)

    return <Component {...props} ref={ref} />
  })

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`

  return PerformanceMonitoredComponent
}

/**
 * Performance-aware lazy loading component
 */
interface LazyComponentProps {
  children: React.ReactNode
  threshold?: number
  fallback?: React.ReactNode
}

export function PerformanceLazyComponent({ 
  children, 
  threshold = 0.1, 
  fallback 
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Use requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setIsLoaded(true))
      } else {
        setTimeout(() => setIsLoaded(true), 0)
      }
    }
  }, [isVisible, isLoaded])

  return (
    <div ref={ref}>
      {isLoaded ? children : (fallback || <div className="animate-pulse bg-muted h-32 rounded" />)}
    </div>
  )
}

// Utility functions for manual performance measurement
export const measure = {
  start: (name: string) => {
    performance.mark(`${name}-start`)
  },
  
  end: (name: string) => {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    performanceMonitor.recordMetric({
      name,
      value: measure.duration,
      timestamp: measure.startTime,
      type: 'timing'
    })
    
    // Clean up marks
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)
    performance.clearMeasures(name)
  }
}

// Performance budget checker
export const performanceBudget = {
  checkBudget: () => {
    const vitals = performanceMonitor.getWebVitals()
    const violations: string[] = []

    if (vitals.fcp > 2000) {
      violations.push(`FCP too slow: ${vitals.fcp}ms (budget: 2000ms)`)
    }
    
    if (vitals.lcp > 2500) {
      violations.push(`LCP too slow: ${vitals.lcp}ms (budget: 2500ms)`)
    }
    
    if (vitals.cls > 0.1) {
      violations.push(`CLS too high: ${vitals.cls} (budget: 0.1)`)
    }
    
    if (vitals.fid > 100) {
      violations.push(`FID too slow: ${vitals.fid}ms (budget: 100ms)`)
    }

    return {
      passed: violations.length === 0,
      violations
    }
  }
}

// Cleanup function for when app unmounts
export const cleanupPerformanceMonitoring = () => {
  performanceMonitor.cleanup()
}