import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendUp,
  TrendDown,
  Calendar,
  MapPin,
  Car,
  School,
  StudentIcon as Student,
  Bell,
  Shield,
  BarChart3
} from "@phosphor-icons/react"

interface DashboardOverviewProps {
  userRole: 'parent' | 'teacher' | 'school_admin'
  userId: string
}

interface DashboardStats {
  totalStudents: number
  presentStudents: number
  dismissedStudents: number
  earlyDismissals: number
  pendingRequests: number
  activeRequests: number
  avgDismissalTime: string
  avgWaitTime: number
  parentSatisfaction: number
  securityIncidents: number
  systemUptime: number
}

interface RecentActivity {
  id: string
  type: 'dismissal' | 'early_dismissal' | 'approval' | 'security' | 'system'
  title: string
  description: string
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  user?: string
  studentName?: string
}

interface QuickStat {
  label: string
  value: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  color: string
}

export function DashboardOverview({ userRole, userId }: DashboardOverviewProps) {
  const [stats, setStats] = useKV(`dashboard_stats_${userRole}`, {
    totalStudents: 485,
    presentStudents: 471,
    dismissedStudents: 423,
    earlyDismissals: 6,
    pendingRequests: 12,
    activeRequests: 8,
    avgDismissalTime: '4.2',
    avgWaitTime: 4.2,
    parentSatisfaction: 94,
    securityIncidents: 0,
    systemUptime: 99.8
  })

  const [recentActivity, setRecentActivity] = useKV(`recent_activity_${userRole}`, [])
  const [quickStats, setQuickStats] = useState<QuickStat[]>([])

  // Initialize quick stats based on user role
  useEffect(() => {
    const initializeQuickStats = () => {
      let statsConfig: QuickStat[] = []

      if (userRole === 'parent') {
        statsConfig = [
          {
            label: 'أطفالي',
            value: 2,
            icon: <Student className="h-4 w-4" />,
            color: 'text-blue-600'
          },
          {
            label: 'ترتيبي في الطابور',
            value: stats.activeRequests > 0 ? '3' : '-',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-orange-600'
          },
          {
            label: 'وقت الانتظار',
            value: stats.activeRequests > 0 ? '8 دقائق' : '-',
            change: -12,
            changeType: 'positive',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-green-600'
          },
          {
            label: 'المسافة من المدرسة',
            value: '250 م',
            icon: <MapPin className="h-4 w-4" />,
            color: 'text-purple-600'
          }
        ]
      } else if (userRole === 'teacher') {
        statsConfig = [
          {
            label: 'طلابي',
            value: 28,
            icon: <Users className="h-4 w-4" />,
            color: 'text-blue-600'
          },
          {
            label: 'الحاضرين اليوم',
            value: 26,
            change: +2,
            changeType: 'positive',
            icon: <CheckCircle className="h-4 w-4" />,
            color: 'text-green-600'
          },
          {
            label: 'طلبات الاستئذان',
            value: 3,
            icon: <Bell className="h-4 w-4" />,
            color: 'text-orange-600'
          },
          {
            label: 'منصرفين',
            value: 23,
            icon: <Student className="h-4 w-4" />,
            color: 'text-gray-600'
          }
        ]
      } else if (userRole === 'school_admin') {
        statsConfig = [
          {
            label: 'إجمالي الطلاب',
            value: stats.totalStudents,
            change: +12,
            changeType: 'positive',
            icon: <School className="h-4 w-4" />,
            color: 'text-blue-600'
          },
          {
            label: 'معدل الانتظار',
            value: `${stats.avgWaitTime} دقيقة`,
            change: -8,
            changeType: 'positive',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-green-600'
          },
          {
            label: 'رضا الأولياء',
            value: `${stats.parentSatisfaction}%`,
            change: +3,
            changeType: 'positive',
            icon: <TrendUp className="h-4 w-4" />,
            color: 'text-green-600'
          },
          {
            label: 'استقرار النظام',
            value: `${stats.systemUptime}%`,
            icon: <Shield className="h-4 w-4" />,
            color: 'text-green-600'
          }
        ]
      }

      setQuickStats(statsConfig)
    }

    initializeQuickStats()
  }, [userRole, stats])

  // Initialize recent activity
  useEffect(() => {
    const initializeActivity = () => {
      let activities: RecentActivity[] = []

      if (userRole === 'parent') {
        activities = [
          {
            id: '1',
            type: 'dismissal',
            title: 'طلب انصراف مرسل',
            description: 'تم إرسال طلب انصراف لطفليك محمد وفاطمة',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            priority: 'medium',
            studentName: 'محمد وفاطمة'
          },
          {
            id: '2',
            type: 'approval',
            title: 'تم قبول الطلب',
            description: 'تم قبول طلب الانصراف وإضافتك لقائمة الانتظار',
            timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
            priority: 'high'
          },
          {
            id: '3',
            type: 'system',
            title: 'تحديث الموقع',
            description: 'تم تحديث موقعك: 250 متر من المدرسة',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            priority: 'low'
          }
        ]
      } else if (userRole === 'teacher') {
        activities = [
          {
            id: '1',
            type: 'early_dismissal',
            title: 'طلب استئذان مبكر',
            description: 'طلب استئذان من أحمد السالم لموعد طبي',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            priority: 'high',
            studentName: 'أحمد السالم'
          },
          {
            id: '2',
            type: 'dismissal',
            title: 'استدعاء طالب',
            description: 'تم استدعاء الطالبة سارة محمد للانصراف',
            timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            priority: 'medium',
            studentName: 'سارة محمد'
          },
          {
            id: '3',
            type: 'system',
            title: 'تحديث الحضور',
            description: 'تم تحديث حضور الطلاب للحصة الثانية',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            priority: 'low'
          }
        ]
      } else if (userRole === 'school_admin') {
        activities = [
          {
            id: '1',
            type: 'security',
            title: 'تنبيه أمني',
            description: 'محاولة استلام غير مصرح بها تم منعها',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            priority: 'urgent'
          },
          {
            id: '2',
            type: 'dismissal',
            title: 'ذروة الانصراف',
            description: '45 طلب انصراف نشط حالياً',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            priority: 'high'
          },
          {
            id: '3',
            type: 'system',
            title: 'نسخ احتياطي',
            description: 'تم إنشاء نسخة احتياطية تلقائية بنجاح',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            priority: 'low'
          }
        ]
      }

      setRecentActivity(activities)
    }

    if (recentActivity.length === 0) {
      initializeActivity()
    }
  }, [userRole, recentActivity])

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'dismissal': return <Student className="h-4 w-4" />
      case 'early_dismissal': return <Clock className="h-4 w-4" />
      case 'approval': return <CheckCircle className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'system': return <BarChart3 className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: RecentActivity['type'], priority: RecentActivity['priority']) => {
    if (priority === 'urgent') return 'text-red-500'
    if (priority === 'high') return 'text-orange-500'
    
    switch (type) {
      case 'dismissal': return 'text-blue-500'
      case 'early_dismissal': return 'text-yellow-500'
      case 'approval': return 'text-green-500'
      case 'security': return 'text-red-500'
      case 'system': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityBadge = (priority: RecentActivity['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">عاجل</Badge>
      case 'high':
        return <Badge variant="secondary" className="text-xs">مهم</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-xs">متوسط</Badge>
      default:
        return null
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000)

    if (diffInMinutes < 1) return 'الآن'
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `منذ ${diffInDays} يوم`
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change && (
                    <div className={`flex items-center gap-1 text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <TrendUp className="h-3 w-3" />
                      ) : (
                        <TrendDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(stat.change)}%</span>
                    </div>
                  )}
                </div>
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      {userRole === 'school_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              نظرة سريعة على الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">معدل الحضور</span>
                  <span className="text-sm font-medium">
                    {Math.round((stats.presentStudents / stats.totalStudents) * 100)}%
                  </span>
                </div>
                <Progress value={(stats.presentStudents / stats.totalStudents) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">نسبة الانصراف</span>
                  <span className="text-sm font-medium">
                    {Math.round((stats.dismissedStudents / stats.presentStudents) * 100)}%
                  </span>
                </div>
                <Progress value={(stats.dismissedStudents / stats.presentStudents) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">رضا الأولياء</span>
                  <span className="text-sm font-medium">{stats.parentSatisfaction}%</span>
                </div>
                <Progress value={stats.parentSatisfaction} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            النشاط الأخير
          </CardTitle>
          <CardDescription>
            آخر الأحداث والتحديثات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`${getActivityColor(activity.type, activity.priority)} mt-0.5`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(activity.priority)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.studentName && (
                      <div className="flex items-center gap-1 mt-1">
                        <Student className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{activity.studentName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* System Status (Admin Only) */}
      {userRole === 'school_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.systemUptime}%</div>
                <div className="text-sm text-muted-foreground">وقت التشغيل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pendingRequests}</div>
                <div className="text-sm text-muted-foreground">طلبات معلقة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.activeRequests}</div>
                <div className="text-sm text-muted-foreground">طلبات نشطة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.securityIncidents}</div>
                <div className="text-sm text-muted-foreground">حوادث أمنية</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}