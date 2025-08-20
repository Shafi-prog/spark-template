import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { 
  Wifi,
  WifiSlash,
  Circle,
  Warning,
  CheckCircle,
  Clock,
  ArrowClockwise
} from "@phosphor-icons/react"

interface RealTimeStatusProps {
  userRole: string
  userId: string
  onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void
}

interface ConnectionMetrics {
  latency: number
  lastHeartbeat: string
  reconnectAttempts: number
  uptime: number
}

export function RealTimeStatus({ userRole, userId, onStatusChange }: RealTimeStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [metrics, setMetrics] = useKV(`connection_metrics_${userId}`, {
    latency: 0,
    lastHeartbeat: new Date().toISOString(),
    reconnectAttempts: 0,
    uptime: 0
  })

  const [showDetails, setShowDetails] = useState(false)

  // Simulate WebSocket connection status
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout
    let connectionTimeout: NodeJS.Timeout
    let reconnectTimeout: NodeJS.Timeout

    const simulateConnection = () => {
      setConnectionStatus('connecting')
      
      // Simulate connection attempt
      connectionTimeout = setTimeout(() => {
        const connected = Math.random() > 0.1 // 90% success rate
        
        if (connected) {
          setConnectionStatus('connected')
          onStatusChange?.('connected')
          
          setMetrics(prev => ({
            ...prev,
            latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
            lastHeartbeat: new Date().toISOString(),
            reconnectAttempts: 0
          }))

          // Start heartbeat
          heartbeatInterval = setInterval(() => {
            const latency = Math.floor(Math.random() * 100) + 20
            const now = new Date().toISOString()
            
            setMetrics(prev => ({
              ...prev,
              latency,
              lastHeartbeat: now,
              uptime: prev.uptime + 5
            }))

            // Simulate occasional connection issues
            if (Math.random() < 0.02) { // 2% chance of disconnection
              clearInterval(heartbeatInterval)
              setConnectionStatus('disconnected')
              onStatusChange?.('disconnected')
              
              // Auto-reconnect after 3-8 seconds
              const delay = 3000 + Math.random() * 5000
              reconnectTimeout = setTimeout(simulateConnection, delay)
              
              setMetrics(prev => ({
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1
              }))
            }
          }, 5000) // Every 5 seconds

        } else {
          setConnectionStatus('disconnected')
          onStatusChange?.('disconnected')
          
          setMetrics(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }))

          // Retry connection after delay
          const delay = Math.min(1000 * Math.pow(2, metrics.reconnectAttempts), 30000) // Exponential backoff, max 30s
          reconnectTimeout = setTimeout(simulateConnection, delay)
        }
      }, 1000 + Math.random() * 2000) // 1-3 second connection time
    }

    // Initial connection
    simulateConnection()

    // Monitor online status
    const handleOnline = () => {
      if (connectionStatus === 'disconnected') {
        simulateConnection()
      }
    }

    const handleOffline = () => {
      setConnectionStatus('disconnected')
      onStatusChange?.('disconnected')
      clearInterval(heartbeatInterval)
      clearTimeout(connectionTimeout)
      clearTimeout(reconnectTimeout)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(heartbeatInterval)
      clearTimeout(connectionTimeout)
      clearTimeout(reconnectTimeout)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [metrics.reconnectAttempts])

  const manualReconnect = () => {
    setConnectionStatus('connecting')
    onStatusChange?.('connecting')
    
    // Force reconnection
    setTimeout(() => {
      setConnectionStatus('connected')
      onStatusChange?.('connected')
      setMetrics(prev => ({
        ...prev,
        lastHeartbeat: new Date().toISOString(),
        latency: Math.floor(Math.random() * 50) + 20
      }))
      toast.success('تم الاتصال بالخادم بنجاح')
    }, 2000)
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle size={16} className="text-secondary" />
      case 'connecting':
        return <Clock size={16} className="text-warning animate-pulse" />
      case 'disconnected':
        return <Warning size={16} className="text-destructive" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'secondary'
      case 'connecting':
        return 'warning'
      case 'disconnected':
        return 'destructive'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'متصل'
      case 'connecting':
        return 'جاري الاتصال'
      case 'disconnected':
        return 'غير متصل'
    }
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-secondary'
    if (latency < 100) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getStatusColor() as any} className="text-xs">
          {getStatusText()}
        </Badge>
        
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-1">
            <Circle 
              size={8} 
              className={`${getLatencyColor(metrics.latency)} animate-pulse`}
              fill="currentColor" 
            />
            <span className={`text-xs ${getLatencyColor(metrics.latency)}`}>
              {metrics.latency}ms
            </span>
          </div>
        )}
      </div>

      {/* Manual Reconnect Button */}
      {connectionStatus === 'disconnected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={manualReconnect}
          className="text-xs px-2 py-1 h-6"
        >
          <ArrowClockwise size={12} className="ml-1" />
          إعادة الاتصال
        </Button>
      )}

      {/* Details Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs px-2 py-1 h-6"
      >
        تفاصيل
      </Button>

      {/* Connection Details Modal/Popover */}
      {showDetails && (
        <div className="absolute top-12 left-0 bg-card border border-border rounded-lg shadow-lg p-4 min-w-64 z-50">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">تفاصيل الاتصال</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">الحالة:</span>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">زمن الاستجابة:</span>
                <div className={`mt-1 ${getLatencyColor(metrics.latency)}`}>
                  {metrics.latency}ms
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">آخر نبضة:</span>
                <div className="mt-1">
                  {new Date(metrics.lastHeartbeat).toLocaleTimeString('ar-SA')}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">محاولات الإعادة:</span>
                <div className="mt-1">
                  {metrics.reconnectAttempts}
                </div>
              </div>
            </div>

            {connectionStatus === 'connected' && (
              <div className="text-xs">
                <span className="text-muted-foreground">مدة التشغيل:</span>
                <div className="mt-1">
                  {Math.floor(metrics.uptime / 60)} دقيقة
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(false)}
              className="w-full text-xs"
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for components that need to react to connection status
export const useRealTimeConnection = (userId: string) => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [isStable, setIsStable] = useState(false)

  useEffect(() => {
    // Consider connection stable after being connected for 10 seconds
    if (status === 'connected') {
      const timer = setTimeout(() => setIsStable(true), 10000)
      return () => clearTimeout(timer)
    } else {
      setIsStable(false)
    }
  }, [status])

  return {
    status,
    setStatus,
    isConnected: status === 'connected',
    isStable,
    canSync: status === 'connected' && isStable
  }
}