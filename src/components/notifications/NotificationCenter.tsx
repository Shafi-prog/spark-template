import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from 'sonner'
import { 
  Bell,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Car,
  Student,
  CheckCircle,
  Eye,
  Trash,
  BellRinging,
  BellSlash
} from "@phosphor-icons/react"

interface Notification {
  id: string
  type: 'dismissal_request' | 'early_dismissal' | 'security_alert' | 'system_update' | 'approval_needed'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  data?: any
  actionRequired?: boolean
}

interface NotificationCenterProps {
  userRole: 'parent' | 'teacher' | 'school_admin' | 'authorized_driver'
  userId: string
}

export function NotificationCenter({ userRole, userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useKV(`${userRole}_notifications_${userId}`, [])
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Load notifications based on user role
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        let allNotifications: Notification[] = []
        
        // Load role-specific notifications
        const roleNotifications = await spark.kv.get(`${userRole}_notifications`) || []
        allNotifications = [...roleNotifications]

        // Load global notifications for all users
        const globalNotifications = await spark.kv.get('global_notifications') || []
        allNotifications = [...allNotifications, ...globalNotifications]

        // Sort by timestamp and priority
        allNotifications.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        setNotifications(allNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
    
    // Set up periodic refresh
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [userRole, userId, setNotifications])

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map((n: Notification) => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    setNotifications(updated)
    
    // Update in global store too
    const globalNotifications = await spark.kv.get('global_notifications') || []
    const updatedGlobal = globalNotifications.map((n: Notification) => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    await spark.kv.set('global_notifications', updatedGlobal)
  }

  const markAllAsRead = async () => {
    const updated = notifications.map((n: Notification) => ({ ...n, read: true }))
    setNotifications(updated)
    toast.success('تم تمييز جميع الإشعارات كمقروءة')
  }

  const deleteNotification = async (notificationId: string) => {
    const updated = notifications.filter((n: Notification) => n.id !== notificationId)
    setNotifications(updated)
    toast.success('تم حذف الإشعار')
  }

  const clearAllNotifications = async () => {
    setNotifications([])
    toast.success('تم مسح جميع الإشعارات')
  }

  const handleNotificationAction = async (notification: Notification, action: 'approve' | 'deny') => {
    if (notification.type === 'early_dismissal' || notification.type === 'dismissal_request') {
      // Handle approval/denial logic
      const requests = await spark.kv.get('pending_early_dismissals') || []
      const updatedRequests = requests.map((req: any) => {
        if (req.id === notification.data?.requestId) {
          return { ...req, status: action === 'approve' ? 'approved' : 'denied' }
        }
        return req
      })
      
      await spark.kv.set('pending_early_dismissals', updatedRequests)
      await markAsRead(notification.id)
      
      toast.success(action === 'approve' ? 'تم الموافقة على الطلب' : 'تم رفض الطلب')
      setShowDetails(false)
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { 
      size: 20, 
      className: priority === 'urgent' ? 'text-destructive' : 
                 priority === 'high' ? 'text-warning' : 'text-primary' 
    }

    switch (type) {
      case 'dismissal_request':
        return <Car {...iconProps} />
      case 'early_dismissal':
        return <Clock {...iconProps} />
      case 'security_alert':
        return <AlertTriangle {...iconProps} />
      case 'approval_needed':
        return <CheckCircle {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'warning'
      case 'medium':
        return 'secondary'
      case 'low':
      default:
        return 'secondary'
    }
  }

  return (
    <>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        {unreadCount > 0 ? <BellRinging size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">الإشعارات</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    تمييز الكل كمقروء
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                لديك {unreadCount} إشعار جديد
              </p>
            )}
          </div>

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BellSlash size={32} className="mx-auto mb-2 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-muted/30 hover:bg-muted/50' 
                        : 'bg-muted/60 hover:bg-muted/80 border-l-4 border-l-primary'
                    }`}
                    onClick={() => {
                      setSelectedNotification(notification)
                      setShowDetails(true)
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <Badge 
                            variant={getPriorityColor(notification.priority) as any}
                            className="text-xs"
                          >
                            {notification.priority === 'urgent' ? 'عاجل' :
                             notification.priority === 'high' ? 'عالي' :
                             notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString('ar-SA')}
                          </p>
                          
                          {notification.actionRequired && (
                            <Badge variant="warning" className="text-xs">
                              يتطلب إجراء
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                onClick={clearAllNotifications}
              >
                مسح جميع الإشعارات
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {getNotificationIcon(selectedNotification.type, selectedNotification.priority)}
                  {selectedNotification.title}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedNotification.timestamp).toLocaleString('ar-SA')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-sm">{selectedNotification.message}</p>
                
                {selectedNotification.data && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-2">تفاصيل إضافية:</h4>
                    <div className="text-xs space-y-1">
                      {Object.entries(selectedNotification.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                {selectedNotification.actionRequired && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleNotificationAction(selectedNotification, 'deny')}
                    >
                      رفض
                    </Button>
                    <Button
                      onClick={() => handleNotificationAction(selectedNotification, 'approve')}
                    >
                      موافق
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  onClick={() => deleteNotification(selectedNotification.id)}
                >
                  <Trash size={16} />
                </Button>
                
                <Button variant="ghost" onClick={() => setShowDetails(false)}>
                  إغلاق
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}