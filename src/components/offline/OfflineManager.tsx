import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from 'sonner'
import { 
  WifiSlash,
  Wifi,
  CloudArrowUp,
  Warning,
  CheckCircle,
  Clock,
  ArrowClockwise
} from "@phosphor-icons/react"

interface OfflineManagerProps {
  userRole: string
  userId: string
}

interface OfflineAction {
  id: string
  type: string
  data: any
  timestamp: string
  retryCount: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

export function OfflineManager({ userRole, userId }: OfflineManagerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingActions, setPendingActions] = useKV(`offline_actions_${userId}`, [])
  const [syncProgress, setSyncProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useKV(`last_sync_${userId}`, null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('🌐 تم الاتصال بالإنترنت - سيتم مزامنة البيانات')
      syncPendingActions()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('⚠️ انقطع الاتصال بالإنترنت - سيتم حفظ العمليات محلياً')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions()
    }
  }, [isOnline])

  // Store action for offline execution
  const storeOfflineAction = async (type: string, data: any) => {
    const action: OfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    }

    const updated = [...pendingActions, action]
    setPendingActions(updated)

    if (isOnline) {
      syncPendingActions()
    } else {
      toast.info('تم حفظ العملية محلياً - ستتم المزامنة عند الاتصال')
    }

    return action.id
  }

  // Sync pending actions when online
  const syncPendingActions = async () => {
    if (!isOnline || isSyncing || pendingActions.length === 0) return

    setIsSyncing(true)
    setSyncProgress(0)

    const failedActions: OfflineAction[] = []
    const syncedActions: string[] = []

    for (let i = 0; i < pendingActions.length; i++) {
      const action = pendingActions[i]
      setSyncProgress((i / pendingActions.length) * 100)

      try {
        // Update action status to syncing
        const updatedActions = pendingActions.map(a => 
          a.id === action.id ? { ...a, status: 'syncing' as const } : a
        )
        setPendingActions(updatedActions)

        // Simulate API call for different action types
        await simulateAPICall(action)

        syncedActions.push(action.id)
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
          status: 'failed' as const
        }

        if (updatedAction.retryCount < 3) {
          failedActions.push(updatedAction)
        } else {
          toast.error(`فشل في مزامنة العملية: ${action.type}`)
        }
      }
    }

    // Remove synced actions
    const remaining = pendingActions.filter(action => 
      !syncedActions.includes(action.id)
    )
    
    // Add failed actions back for retry
    setPendingActions([...remaining, ...failedActions])

    setSyncProgress(100)
    setLastSyncTime(new Date().toISOString())
    
    setTimeout(() => {
      setIsSyncing(false)
      setSyncProgress(0)
    }, 1000)

    if (syncedActions.length > 0) {
      toast.success(`تم مزامنة ${syncedActions.length} عملية بنجاح`)
    }
  }

  // Simulate different API calls based on action type
  const simulateAPICall = async (action: OfflineAction) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    switch (action.type) {
      case 'dismissal_request':
        // Add to active requests
        const currentRequests = await spark.kv.get('active_requests') || []
        currentRequests.push(action.data)
        await spark.kv.set('active_requests', currentRequests)
        break
        
      case 'early_dismissal':
        // Add to early dismissal requests
        const earlyRequests = await spark.kv.get('pending_early_dismissals') || []
        earlyRequests.push(action.data)
        await spark.kv.set('pending_early_dismissals', earlyRequests)
        break
        
      case 'location_update':
        // Update user location
        await spark.kv.set(`user_location_${action.data.userId}`, action.data.location)
        break
        
      default:
        // Generic data update
        await spark.kv.set(action.data.key, action.data.value)
    }
    
    // Simulate potential failure (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Network error')
    }
  }

  const manualSync = () => {
    if (isOnline) {
      syncPendingActions()
    } else {
      toast.error('لا يوجد اتصال بالإنترنت')
    }
  }

  const clearFailedActions = () => {
    const filtered = pendingActions.filter((action: OfflineAction) => action.status !== 'failed')
    setPendingActions(filtered)
    toast.success('تم حذف العمليات الفاشلة')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'syncing':
        return 'warning'
      case 'synced':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار'
      case 'syncing':
        return 'جاري المزامنة'
      case 'synced':
        return 'تم المزامنة'
      case 'failed':
        return 'فشل'
      default:
        return 'غير معروف'
    }
  }

  // Don't show component if no offline actions
  if (pendingActions.length === 0 && isOnline) return null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          {isOnline ? (
            <Wifi size={20} className="text-secondary" />
          ) : (
            <WifiSlash size={20} className="text-destructive" />
          )}
          حالة الاتصال والمزامنة
        </CardTitle>
        <CardDescription>
          {isOnline ? 'متصل بالإنترنت' : 'غير متصل - الوضع دون اتصال نشط'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'secondary' : 'destructive'}>
              {isOnline ? 'متصل' : 'غير متصل'}
            </Badge>
            {lastSyncTime && (
              <span className="text-sm text-muted-foreground">
                آخر مزامنة: {new Date(lastSyncTime).toLocaleTimeString('ar-SA')}
              </span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={manualSync}
            disabled={!isOnline || isSyncing}
          >
            <ArrowClockwise size={16} className={`ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
            مزامنة يدوية
          </Button>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>جاري المزامنة...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="w-full" />
          </div>
        )}

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">العمليات المعلقة ({pendingActions.length})</h4>
              {pendingActions.some((a: OfflineAction) => a.status === 'failed') && (
                <Button variant="ghost" size="sm" onClick={clearFailedActions}>
                  حذف الفاشلة
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pendingActions.slice(0, 5).map((action: OfflineAction) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    {action.status === 'syncing' && <ArrowClockwise size={14} className="animate-spin" />}
                    {action.status === 'failed' && <Warning size={14} className="text-destructive" />}
                    {action.status === 'synced' && <CheckCircle size={14} className="text-secondary" />}
                    {action.status === 'pending' && <Clock size={14} className="text-muted-foreground" />}
                    
                    <span className="font-medium">
                      {action.type === 'dismissal_request' && 'طلب انصراف'}
                      {action.type === 'early_dismissal' && 'استئذان مبكر'}
                      {action.type === 'location_update' && 'تحديث الموقع'}
                      {!['dismissal_request', 'early_dismissal', 'location_update'].includes(action.type) && action.type}
                    </span>
                  </div>
                  
                  <Badge variant={getStatusColor(action.status) as any} className="text-xs">
                    {getStatusText(action.status)}
                  </Badge>
                </div>
              ))}
              
              {pendingActions.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  و {pendingActions.length - 5} عمليات أخرى...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Offline Notice */}
        {!isOnline && (
          <Alert>
            <WifiSlash size={16} />
            <AlertDescription>
              أنت تعمل في الوضع دون اتصال. ستتم مزامنة جميع العمليات عند استعادة الاتصال.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Export the store function for use in other components
export const storeOfflineAction = async (userId: string, type: string, data: any) => {
  const actions = await spark.kv.get(`offline_actions_${userId}`) || []
  
  const action: OfflineAction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending'
  }

  actions.push(action)
  await spark.kv.set(`offline_actions_${userId}`, actions)
  
  return action.id
}