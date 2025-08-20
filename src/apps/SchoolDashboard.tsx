import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

// Components
import { SoundSystem } from '../components/SoundSystem'

// Icons
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Calendar,
  SignOut,
  Bell,
  Settings,
  BarChart3,
  School,
  UserCheck,
  List,
  Volume2,
  Eye,
  Check,
  X,
  MapPin,
  Phone,
  Car,
  Student as StudentIcon,
  GraduationCap,
  Warning,
  ChartBar
} from "@phosphor-icons/react"

interface SchoolDashboardProps {
  user: any
  onLogout: () => void
}

export function SchoolDashboard({ user, onLogout }: SchoolDashboardProps) {
  const [currentTab, setCurrentTab] = useState('overview')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  // Data states
  const [dismissalQueue, setDismissalQueue] = useKV('dismissal_queue_live', [])
  const [pendingApprovals, setPendingApprovals] = useKV('pending_early_dismissals', [])
  const [schoolNotifications, setSchoolNotifications] = useKV('school_notifications', [])
  const [todayStats, setTodayStats] = useKV('today_school_stats', {
    totalStudents: 485,
    presentToday: 471,
    dismissedToday: 12,
    earlyDismissals: 3,
    activeRequests: 0,
    completedRequests: 8
  })
  
  const [schoolSettings, setSchoolSettings] = useKV('school_settings', {
    autoApprovalEnabled: false,
    maxWaitTime: 30,
    earlyDismissalCutoff: '11:00',
    emergencyContactRequired: true,
    soundSystemEnabled: true,
    gpsValidationRequired: true,
    location: { lat: 24.7136, lng: 46.6753 },
    geofenceRadius: 100,
    dismissalTimes: {
      primary: '12:30',
      intermediate: '13:00',
      secondary: '13:30'
    }
  })

  // Load live data
  useEffect(() => {
    const loadLiveData = async () => {
      try {
        // Load active requests
        const activeRequests = await spark.kv.get('active_requests') || []
        setDismissalQueue(activeRequests)
        
        // Load pending approvals
        const earlyRequests = await spark.kv.get('pending_early_dismissals') || []
        setPendingApprovals(earlyRequests)
        
        // Load notifications
        const notifications = await spark.kv.get('school_notifications') || []
        setSchoolNotifications(notifications)

        // Update stats
        setTodayStats(prev => ({
          ...prev,
          activeRequests: activeRequests.length,
          pendingEarlyDismissals: earlyRequests.length
        }))
      } catch (error) {
        console.error('Error loading live data:', error)
        // Ensure all arrays are properly initialized
        setDismissalQueue([])
        setPendingApprovals([])
        setSchoolNotifications([])
      }
    }

    loadLiveData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadLiveData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle early dismissal approval
  const handleApproveEarlyDismissal = async (requestId: string, approved: boolean) => {
    try {
      const request = (Array.isArray(pendingApprovals) ? pendingApprovals : []).find(r => r?.id === requestId)
      if (!request) return

      const updatedRequest = {
        ...request,
        status: approved ? 'approved' : 'rejected',
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
        approvalNotes: approvalNotes,
        rejectionReason: !approved ? approvalNotes : undefined
      }

      // Update pending requests
      const updatedPending = (Array.isArray(pendingApprovals) ? pendingApprovals : []).filter(r => r?.id !== requestId)
      setPendingApprovals(updatedPending)
      await spark.kv.set('pending_early_dismissals', updatedPending)

      if (approved) {
        // Notify the assigned teacher
        const teacherNotification = {
          id: `teacher_notif_${Date.now()}`,
          type: 'early_dismissal_approved',
          title: 'طلب استئذان معتمد',
          message: `${request.studentData.name} - ${request.reasonCategory}`,
          data: updatedRequest,
          timestamp: new Date().toISOString(),
          read: false,
          teacherId: request.studentData.currentTeacherId
        }

        const teacherNotifications = await spark.kv.get('teacher_notifications') || []
        teacherNotifications.unshift(teacherNotification)
        await spark.kv.set('teacher_notifications', teacherNotifications)

        // Notify parent
        const parentNotification = {
          id: `parent_notif_${Date.now()}`,
          type: 'early_dismissal_approved',
          title: 'تم اعتماد طلب الاستئذان المبكر',
          message: `تم الموافقة على استئذان ${request.studentData.name}`,
          timestamp: new Date().toISOString(),
          parentId: request.parentId
        }
        
        // Store parent notification (would be sent via push/SMS in real implementation)
        toast.success(`تم اعتماد طلب الاستئذان وإشعار المعلم`)
      } else {
        toast.info('تم رفض طلب الاستئذان مع إشعار ولي الأمر')
      }

      setShowApprovalDialog(false)
      setSelectedRequest(null)
      setApprovalNotes('')
    } catch (error) {
      toast.error('حدث خطأ في معالجة الطلب')
    }
  }

  // Handle dismissal request management
  const handleCallNextInQueue = async () => {
    const queueArray = Array.isArray(dismissalQueue) ? dismissalQueue : []
    if (queueArray.length === 0) return

    const nextRequest = queueArray.find(r => r?.status === 'queued')
    if (!nextRequest) return

    try {
      // Update request status to called
      const updatedQueue = queueArray.map(r => 
        r?.id === nextRequest.id 
          ? { ...r, status: 'called', calledAt: new Date().toISOString() }
          : r
      )
      
      setDismissalQueue(updatedQueue)
      await spark.kv.set('active_requests', updatedQueue)

      // Trigger sound system
      const studentsNames = nextRequest.studentsData.map(s => s.name)
      toast.success(`تم نداء: ${studentsNames.join(' و ')}`)

      // Here you would integrate with the actual sound system
      // playAnnouncementSound(studentsNames)
    } catch (error) {
      toast.error('حدث خطأ في نداء الطلاب')
    }
  }

  const handleCompletePickup = async (requestId: string) => {
    try {
      const updatedQueue = dismissalQueue.map(r =>
        r.id === requestId
          ? { ...r, status: 'completed', completedAt: new Date().toISOString() }
          : r
      )
      
      setDismissalQueue(updatedQueue)
      await spark.kv.set('active_requests', updatedQueue)
      
      setTodayStats(prev => ({
        ...prev,
        dismissedToday: prev.dismissedToday + 1,
        completedRequests: prev.completedRequests + 1
      }))

      toast.success('تم تأكيد استلام الطلاب')
    } catch (error) {
      toast.error('حدث خطأ في تأكيد الاستلام')
    }
  }

  // Update school settings
  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const updatedSettings = { ...schoolSettings, ...newSettings }
      setSchoolSettings(updatedSettings)
      await spark.kv.set('school_settings', updatedSettings)
      toast.success('تم حفظ الإعدادات')
    } catch (error) {
      toast.error('حدث خطأ في حفظ الإعدادات')
    }
  }

  // Render different tabs
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                <p className="text-2xl font-bold">{todayStats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حاضر اليوم</p>
                <p className="text-2xl font-bold text-secondary">{todayStats.presentToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم انصرافهم</p>
                <p className="text-2xl font-bold text-accent">{todayStats.dismissedToday}</p>
              </div>
              <UserCheck className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">طلبات نشطة</p>
                <p className="text-2xl font-bold text-warning">{todayStats.activeRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Dismissal Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة الانصراف المباشرة</span>
            <Button onClick={handleCallNextInQueue} disabled={dismissalQueue.filter(r => r.status === 'queued').length === 0}>
              <Volume2 size={16} className="ml-2" />
              نداء التالي
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {dismissalQueue.filter(r => r.status !== 'completed').map((request, index) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{request.requesterName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.studentsData.map(s => s.name).join(' • ')}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Car size={12} />
                          {request.carInfo?.type} {request.carInfo?.color}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={12} />
                          {request.requesterRole === 'authorized_driver' ? 'سائق مفوض' : 'ولي أمر'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      request.status === 'called' ? 'default' : 
                      request.status === 'queued' ? 'secondary' : 'outline'
                    }>
                      {request.status === 'called' ? 'تم النداء' : 
                       request.status === 'queued' ? 'في الانتظار' : request.status}
                    </Badge>
                    {request.status === 'called' && (
                      <Button size="sm" onClick={() => handleCompletePickup(request.id)}>
                        تأكيد الاستلام
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {dismissalQueue.filter(r => r.status !== 'completed').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات انصراف نشطة
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderEarlyDismissals = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>طلبات الاستئذان المبكر ({pendingApprovals.length})</CardTitle>
          <CardDescription>
            طلبات تحتاج لموافقة الإدارة قبل إشعار المعلم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingApprovals.map(request => (
              <Card key={request.id} className="border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {request.studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.studentData.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.studentData.grade} - {request.studentData.section}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm"><strong>ولي الأمر:</strong> {request.parentName}</p>
                        <p className="text-sm"><strong>نوع السبب:</strong> 
                          <Badge variant="outline" className="mr-2">
                            {request.reasonCategory === 'medical' ? 'طبي' : 
                             request.reasonCategory === 'family' ? 'عائلي' : 'أخرى'}
                          </Badge>
                        </p>
                        <p className="text-sm"><strong>التفاصيل:</strong> {request.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          طُلب في: {new Date(request.requestTime).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowApprovalDialog(true)
                        }}
                      >
                        <Eye size={16} className="ml-2" />
                        مراجعة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {pendingApprovals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد طلبات استئذان مبكر في انتظار الموافقة
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      {/* School Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات المدرسة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اسم المدرسة</Label>
              <Input value="مدرسة النور الابتدائية" />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value="+966112345678" />
            </div>
          </div>
          
          <div>
            <Label>العنوان</Label>
            <Input value="حي النرجس، الرياض 13241" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>انصراف الابتدائي</Label>
              <Input 
                type="time" 
                value={schoolSettings.dismissalTimes.primary}
                onChange={(e) => handleUpdateSettings({
                  dismissalTimes: {
                    ...schoolSettings.dismissalTimes,
                    primary: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>انصراف المتوسط</Label>
              <Input 
                type="time" 
                value={schoolSettings.dismissalTimes.intermediate}
                onChange={(e) => handleUpdateSettings({
                  dismissalTimes: {
                    ...schoolSettings.dismissalTimes,
                    intermediate: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>انصراف الثانوي</Label>
              <Input 
                type="time" 
                value={schoolSettings.dismissalTimes.secondary}
                onChange={(e) => handleUpdateSettings({
                  dismissalTimes: {
                    ...schoolSettings.dismissalTimes,
                    secondary: e.target.value
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات النظام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">الموافقة التلقائية على الاستئذان</p>
              <p className="text-sm text-muted-foreground">الموافقة على الطلبات غير الطبية تلقائياً</p>
            </div>
            <Switch 
              checked={schoolSettings.autoApprovalEnabled}
              onCheckedChange={(checked) => handleUpdateSettings({ autoApprovalEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">نظام الصوت</p>
              <p className="text-sm text-muted-foreground">تشغيل النداء الصوتي للطلاب</p>
            </div>
            <Switch 
              checked={schoolSettings.soundSystemEnabled}
              onCheckedChange={(checked) => handleUpdateSettings({ soundSystemEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">التحقق من الموقع</p>
              <p className="text-sm text-muted-foreground">التأكد من وجود ولي الأمر في النطاق</p>
            </div>
            <Switch 
              checked={schoolSettings.gpsValidationRequired}
              onCheckedChange={(checked) => handleUpdateSettings({ gpsValidationRequired: checked })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نطاق التفعيل (متر)</Label>
              <Input 
                type="number" 
                value={schoolSettings.geofenceRadius}
                onChange={(e) => handleUpdateSettings({ geofenceRadius: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>حد الاستئذان المبكر</Label>
              <Input 
                type="time" 
                value={schoolSettings.earlyDismissalCutoff}
                onChange={(e) => handleUpdateSettings({ earlyDismissalCutoff: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <School size={20} className="text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="font-bold text-xl">لوحة تحكم المدرسة</h1>
              <p className="text-sm text-muted-foreground">مرحباً {user.name} - {user.position}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={18} />
              {schoolNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
                  {schoolNotifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <SignOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 size={16} />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="early-dismissal" className="flex items-center gap-2">
              <AlertCircle size={16} />
              الاستئذان المبكر
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <ChartBar size={16} />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="early-dismissal">{renderEarlyDismissals()}</TabsContent>
          <TabsContent value="reports">
            <Card>
              <CardContent className="p-8 text-center">
                <ChartBar size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">التقارير والإحصائيات قيد التطوير</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">{renderSettings()}</TabsContent>
        </Tabs>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مراجعة طلب الاستئذان المبكر</DialogTitle>
            <DialogDescription>
              راجع تفاصيل الطلب واتخذ القرار المناسب
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الطالب</Label>
                  <p className="font-medium">{selectedRequest.studentData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.studentData.grade} - {selectedRequest.studentData.section}
                  </p>
                </div>
                <div>
                  <Label>ولي الأمر</Label>
                  <p className="font-medium">{selectedRequest.parentName}</p>
                </div>
              </div>
              
              <div>
                <Label>نوع السبب</Label>
                <Badge variant={selectedRequest.reasonCategory === 'medical' ? 'destructive' : 'secondary'}>
                  {selectedRequest.reasonCategory === 'medical' ? 'طبي' : 
                   selectedRequest.reasonCategory === 'family' ? 'عائلي' : 'أخرى'}
                </Badge>
              </div>
              
              <div>
                <Label>تفاصيل السبب</Label>
                <p className="text-sm bg-muted p-3 rounded">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <Label>ملاحظات الموافقة/الرفض</Label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="اكتب ملاحظات أو سبب الرفض..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleApproveEarlyDismissal(selectedRequest?.id, false)}
            >
              <X size={16} className="ml-2" />
              رفض
            </Button>
            <Button 
              onClick={() => handleApproveEarlyDismissal(selectedRequest?.id, true)}
            >
              <Check size={16} className="ml-2" />
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sound System Component */}
      <SoundSystem 
        enabled={schoolSettings.soundSystemEnabled}
        onAnnouncement={(message) => toast.info(`تم البث: ${message}`)}
      />
    </div>
  )
}