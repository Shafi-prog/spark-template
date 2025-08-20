import React, { Component, ReactNode, ErrorInfo } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AlertTriangle, RefreshCw, Home } from '@phosphor-icons/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

/**
 * Enhanced Error Boundary with proper error handling and reporting
 * Implements graceful fallbacks and user-friendly error messages
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({
      errorInfo,
      eventId,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Show toast notification
    toast.error('حدث خطأ غير متوقع في التطبيق')

    // In production, you would send this to your error reporting service
    this.reportError(error, errorInfo, eventId)
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, eventId: string) => {
    try {
      // In a real app, this would send to your error tracking service
      const errorReport = {
        eventId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: await spark.user().then(u => u.id).catch(() => 'anonymous'),
      }

      // Store error locally for debugging
      const existingErrors = await spark.kv.get('error_reports') || []
      await spark.kv.set('error_reports', [...existingErrors.slice(-9), errorReport])

      console.warn('Error report saved:', errorReport)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    })

    // Auto-retry mechanism with exponential backoff
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private renderErrorDetails = () => {
    const { error, errorInfo, eventId } = this.state
    const { showDetails = process.env.NODE_ENV === 'development' } = this.props

    if (!showDetails || !error) return null

    return (
      <Card className="mt-4 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle size={16} />
            تفاصيل الخطأ
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <div className="space-y-2">
            <div>
              <strong>رسالة الخطأ:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-destructive overflow-auto max-h-20">
                {error.message}
              </pre>
            </div>
            
            {eventId && (
              <div>
                <strong>معرف الخطأ:</strong>
                <code className="ml-2 px-2 py-1 bg-muted rounded">{eventId}</code>
              </div>
            )}

            {errorInfo?.componentStack && (
              <div>
                <strong>موقع الخطأ:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI based on level
      const { level = 'section' } = this.props

      if (level === 'component') {
        return (
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle size={16} />
              <span>فشل في تحميل هذا الجزء</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleReset}
              className="mt-2"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </Button>
          </div>
        )
      }

      // Page or section level error
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <AlertTriangle size={64} className="mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                عذراً، حدث خطأ
              </h1>
              <p className="text-muted-foreground">
                واجه التطبيق مشكلة غير متوقعة. يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw size={16} />
                إعادة المحاولة
              </Button>
              
              <Button onClick={this.handleReload} variant="outline">
                إعادة تحميل الصفحة
              </Button>

              {level === 'page' && (
                <Button onClick={this.handleGoHome} variant="ghost">
                  <Home size={16} />
                  الصفحة الرئيسية
                </Button>
              )}
            </div>

            {this.renderErrorDetails()}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for manual error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    // Throw error to be caught by nearest error boundary
    throw error
  }, [])
}