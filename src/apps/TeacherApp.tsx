import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Icons
import { 
  GraduationCap,
  SignOut,
  Bell,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BookOpen,
  Student,
  Send,
  Eye,
  Check,
  X,
  Warning,
  UserMinus,
  ClipboardText,
  Chalkboard
} from "@phosphor-icons/react"

interface TeacherAppProps {
  user: any
  onLogout: () => void
}

export function TeacherApp({ user, onLogout }: TeacherAppProps) {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedDismissal, setSelectedDismissal] = useState<any>(null)
  const [showDismissalDialog, setShowDismissalDialog] = useState(false)
  const [dismissalNotes, setDismissalNotes] = useState('')

  // Data states
  const [teacherNotifications, setTeacherNotifications] = useKV('teacher_notifications', [])
  const [myStudents, setMyStudents] = useKV('teacher_students', [])
  const [currentSchedule, setCurrentSchedule] = useKV('teacher_current_schedule', {})
  const [earlyDismissalRequests, setEarlyDismissalRequests] = useKV('teacher_early_dismissals', [])
  const [classroomStats, setClassroomStats] = useKV('classroom_stats', {
    totalStudents: 25,
    presentToday: 24,
    earlyDismissals: 1,
    pendingDismissals: 0
  })

  // Load teacher data
  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        // Load students assigned to this teacher
        const demoStudents = await spark.kv.get('demo_students') || []
        const teacherStudents = demoStudents.filter(s => s.currentTeacherId === user.id)
        
        const studentsWithStatus = teacherStudents.map(student => ({
          ...student,
          attendanceStatus: 'present',
          dismissalStatus: 'in_class',
          lastActivity: new Date().toISOString()
        }))
        
        setMyStudents(studentsWithStatus)

        // Load teacher notifications
        const notifications = await spark.kv.get('teacher_notifications') || []
        const myNotifications = notifications.filter(n => n.teacherId === user.id)
        setTeacherNotifications(myNotifications)

        // Load early dismissal requests for my students
        const earlyRequests = await spark.kv.get('approved_early_dismissals') || []
        const myRequests = earlyRequests.filter(r => 
          teacherStudents.some(s => s.id === r.studentId)
        )
        setEarlyDismissalRequests(myRequests)

        // Set current period info
        const now = new Date()
        const currentHour = now.getHours()
        
        let currentPeriod = user.currentPeriod || {}
        
        // Dynamic period based on time
        if (currentHour >= 8 && currentHour < 9) {
          currentPeriod = { subject: 'الحصة الأولى', time: '08:00-08:45', location: `فصل ${user.classes[0]?.grade}${user.classes[0]?.section}` }
        } else if (currentHour >= 9 && currentHour < 10) {
          currentPeriod = { subject: 'الحصة الثانية', time: '09:00-09:45', location: `فصل ${user.classes[0]?.grade}${user.classes[0]?.section}` }
        } else if (currentHour >= 10 && currentHour < 11) {
          currentPeriod = { subject: 'الحصة الثالثة', time: '10:00-10:45', location: `فصل ${user.classes[0]?.grade}${user.classes[0]?.section}` }
        } else if (currentHour >= 11 && currentHour < 12) {
          currentPeriod = { subject: 'الحصة الرابعة', time: '11:00-11:45', location: `فصل ${user.classes[0]?.grade}${user.classes[0]?.section}` }
        } else {
          currentPeriod = { subject: 'انتهاء الحصص', time: 'استعداد للانصراف', location: `فصل ${user.classes[0]?.grade}${user.classes[0]?.section}` }
        }
        
        setCurrentSchedule(currentPeriod)

        // Update classroom stats
        setClassroomStats({
          totalStudents: teacherStudents.length,
          presentToday: teacherStudents.filter(s => s.attendanceStatus === 'present').length,
          earlyDismissals: myRequests.length,
          pendingDismissals: myNotifications.filter(n => n.type === 'early_dismissal_approved' && !n.processed).length
        })
      } catch (error) {
        console.error('Error loading teacher data:', error)
      }
    }

    loadTeacherData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadTeacherData, 30000)
    return () => clearInterval(interval)
  }, [user.id])

  // Handle early dismissal preparation
  const handlePrepareDismissal = async (requestId: string, studentId: string) => {
    try {
      const student = myStudents.find(s => s.id === studentId)
      if (!student) return

      // Update student status
      const updatedStudents = myStudents.map(s =>
        s.id === studentId
          ? { ...s, dismissalStatus: 'preparing', lastActivity: new Date().toISOString() }
          : s
      )
      setMyStudents(updatedStudents)

      // Mark notification as processed
      const updatedNotifications = teacherNotifications.map(n =>
        n.id === requestId ? { ...n, processed: true, processedAt: new Date().toISOString() } : n
      )
      setTeacherNotifications(updatedNotifications)

      toast.success(`تم تحضير ${student.name} للخروج`)
    } catch (error) {
      toast.error('حدث خطأ في تحضير الطالب')
    }
  }

  // Handle student dismissal confirmation
  const handleConfirmDismissal = async (studentId: string, notes: string) => {
    try {
      const student = myStudents.find(s => s.id === studentId)
      if (!student) return

      // Update student status
      const updatedStudents = myStudents.map(s =>
        s.id === studentId
          ? { 
              ...s, 
              dismissalStatus: 'dismissed',
              dismissalTime: new Date().toISOString(),
              dismissalNotes: notes,
              lastActivity: new Date().toISOString()
            }
          : s
      )
      setMyStudents(updatedStudents)

      // Log dismissal activity
      const dismissalLog = {
        id: `log_${Date.now()}`,
        studentId,
        studentName: student.name,
        teacherId: user.id,
        teacherName: user.name,
        dismissalTime: new Date().toISOString(),
        notes,
        type: 'early_dismissal'
      }

      const logs = await spark.kv.get('dismissal_logs') || []
      logs.unshift(dismissalLog)
      await spark.kv.set('dismissal_logs', logs)

      // Update classroom stats
      setClassroomStats(prev => ({
        ...prev,
        presentToday: prev.presentToday - 1,
        earlyDismissals: prev.earlyDismissals + 1
      }))

      toast.success(`تم تأكيد خروج ${student.name}`)
      setShowDismissalDialog(false)
      setSelectedDismissal(null)
      setDismissalNotes('')
    } catch (error) {
      toast.error('حدث خطأ في تأكيد الخروج')
    }
  }

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Current Period Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Chalkboard size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{currentSchedule.subject}</h3>
                <p className="text-muted-foreground">{currentSchedule.time}</p>
                <p className="text-sm text-muted-foreground">{currentSchedule.location}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString('ar-SA')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classroom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                <p className="text-2xl font-bold">{classroomStats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حاضر اليوم</p>
                <p className="text-2xl font-bold text-secondary">{classroomStats.presentToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">استئذان مبكر</p>
                <p className="text-2xl font-bold text-warning">{classroomStats.earlyDismissals}</p>
              </div>
              <UserMinus className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                <p className="text-2xl font-bold text-destructive">{classroomStats.pendingDismissals}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Early Dismissals */}
      {teacherNotifications.filter(n => n.type === 'early_dismissal_approved' && !n.processed).length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle size={20} />
              طلبات استئذان معتمدة تحتاج تحضير
            </CardTitle>
            <CardDescription>
              هذه الطلبات تم اعتمادها من الإدارة وتحتاج تحضير الطلاب للخروج
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teacherNotifications
                .filter(n => n.type === 'early_dismissal_approved' && !n.processed)
                .map(notification => (
                <div key={notification.id} className="flex items-center justify-between p-4 bg-warning/5 rounded-lg border-l-4 border-l-warning">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-warning/20">
                        {notification.data.studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{notification.data.studentData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.data.reasonCategory === 'medical' ? '🏥 سبب طبي' : 
                         notification.data.reasonCategory === 'family' ? '👨‍👩‍👧‍👦 سبب عائلي' : '📝 سبب آخر'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        معتمد من: {notification.data.approvedBy} | {new Date(notification.timestamp).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDismissal({
                          ...notification.data,
                          notificationId: notification.id
                        })
                        setShowDismissalDialog(true)
                      }}
                    >
                      <Eye size={16} className="ml-2" />
                      عرض
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePrepareDismissal(notification.id, notification.data.studentId)}
                    >
                      <Check size={16} className="ml-2" />
                      تحضير
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Students */}
      <Card>
        <CardHeader>
          <CardTitle>طلاب الفصل</CardTitle>
          <CardDescription>
            {user.classes?.map(c => `${c.grade} ${c.section}`).join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {myStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.grade} - {student.section}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      student.dismissalStatus === 'dismissed' ? 'secondary' :
                      student.dismissalStatus === 'preparing' ? 'default' : 'outline'
                    }>
                      {student.dismissalStatus === 'dismissed' ? 'منصرف' :
                       student.dismissalStatus === 'preparing' ? 'يتم التحضير' : 'في الفصل'}
                    </Badge>
                    
                    <Badge variant={
                      student.attendanceStatus === 'present' ? 'default' : 'secondary'
                    }>
                      {student.attendanceStatus === 'present' ? 'حاضر' : 'غائب'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotifications = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teacherNotifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg border-l-4 ${
                notification.read ? 'border-l-muted bg-muted/30' : 'border-l-primary bg-primary/5'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.timestamp).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant={notification.read ? 'secondary' : 'default'}>
                    {notification.read ? 'تم القراءة' : 'جديد'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {teacherNotifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد إشعارات
              </div>
            )}
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
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <GraduationCap size={20} className="text-accent-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="font-bold text-xl">تطبيق المعلم</h1>
              <p className="text-sm text-muted-foreground">مرحباً {user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={18} />
              {teacherNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
                  {teacherNotifications.filter(n => !n.read).length}
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ClipboardText size={16} />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              الإشعارات
              {teacherNotifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {teacherNotifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar size={16} />
              الجدول
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
          <TabsContent value="notifications">{renderNotifications()}</TabsContent>
          <TabsContent value="schedule">
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">الجدول الدراسي قيد التطوير</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dismissal Detail Dialog */}
      <Dialog open={showDismissalDialog} onOpenChange={setShowDismissalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد خروج الطالب</DialogTitle>
            <DialogDescription>
              قم بتحضير الطالب وتأكيد خروجه من الفصل
            </DialogDescription>
          </DialogHeader>
          
          {selectedDismissal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الطالب</Label>
                  <p className="font-medium">{selectedDismissal.studentData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDismissal.studentData.grade} - {selectedDismissal.studentData.section}
                  </p>
                </div>
                <div>
                  <Label>ولي الأمر</Label>
                  <p className="font-medium">{selectedDismissal.parentName}</p>
                </div>
              </div>
              
              <div>
                <Label>سبب الاستئذان</Label>
                <p className="text-sm bg-muted p-3 rounded">{selectedDismissal.reason}</p>
              </div>
              
              <div>
                <Label>ملاحظات المعلم</Label>
                <Textarea
                  value={dismissalNotes}
                  onChange={(e) => setDismissalNotes(e.target.value)}
                  placeholder="أي ملاحظات حول خروج الطالب..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDismissalDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => handleConfirmDismissal(selectedDismissal?.studentId, dismissalNotes)}
            >
              <Check size={16} className="ml-2" />
              تأكيد الخروج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}