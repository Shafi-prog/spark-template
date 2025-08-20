import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Send
} from "@phosphor-icons/react"
import { toast } from 'sonner'

interface TeacherAppProps {
  user: any
  onLogout: () => void
}

export function TeacherApp({ user, onLogout }: TeacherAppProps) {
  const [notifications, setNotifications] = useKV('teacher_notifications', [])
  const [myStudents, setMyStudents] = useKV('my_students', [])
  const [schedule, setSchedule] = useKV('my_schedule', [])
  const [pendingDismissals, setPendingDismissals] = useKV('pending_dismissals', [])

  // Load teacher data
  useEffect(() => {
    const loadTeacherData = async () => {
      // Sample notifications for early dismissal approvals
      const sampleNotifications = [
        {
          id: 'notif1',
          type: 'early_dismissal_approved',
          studentName: 'خالد أحمد',
          studentId: 'student-3',
          grade: 'الصف الثاني',
          section: 'أ',
          reason: 'موعد طبي',
          approvedBy: 'الأستاذ خالد الأحمد',
          approvedAt: '11:30',
          status: 'pending_preparation',
          parentName: 'أحمد الخالد'
        },
        {
          id: 'notif2',
          type: 'early_dismissal_approved',
          studentName: 'رنا محمد',
          studentId: 'student-4',
          grade: 'الصف الأول', 
          section: 'ب',
          reason: 'ظرف عائلي طارئ',
          approvedBy: 'الأستاذ خالد الأحمد',
          approvedAt: '12:00',
          status: 'pending_preparation',
          parentName: 'فاطمة السعد'
        }
      ]

      // Sample students in teacher's classes
      const sampleStudents = [
        {
          id: 'student-1',
          name: 'محمد أحمد',
          grade: 'الصف الثالث',
          section: 'أ',
          status: 'present',
          arrivalTime: '07:15',
          seat: '12'
        },
        {
          id: 'student-2',
          name: 'فاطمة أحمد', 
          grade: 'الصف الثالث',
          section: 'أ',
          status: 'present',
          arrivalTime: '07:20',
          seat: '08'
        },
        {
          id: 'student-3',
          name: 'خالد أحمد',
          grade: 'الصف الثاني',
          section: 'أ', 
          status: 'present',
          arrivalTime: '07:10',
          seat: '15'
        }
      ]

      // Sample today's schedule
      const currentTime = new Date()
      const sampleSchedule = [
        {
          id: 'period1',
          period: 1,
          subject: 'الرياضيات',
          grade: 'الصف الثالث',
          section: 'أ',
          startTime: '08:00',
          endTime: '08:45',
          status: currentTime.getHours() >= 8 && currentTime.getHours() < 9 ? 'current' : 'completed',
          room: 'غرفة 101'
        },
        {
          id: 'period2',
          period: 2,
          subject: 'العلوم',
          grade: 'الصف الثالث', 
          section: 'أ',
          startTime: '08:45',
          endTime: '09:30',
          status: currentTime.getHours() >= 9 && currentTime.getHours() < 10 ? 'current' : currentTime.getHours() >= 10 ? 'completed' : 'upcoming',
          room: 'غرفة 101'
        },
        {
          id: 'break1',
          period: 'استراحة',
          subject: 'استراحة',
          startTime: '09:30',
          endTime: '09:50',
          status: currentTime.getHours() === 9 && currentTime.getMinutes() >= 30 ? 'current' : currentTime.getHours() >= 10 ? 'completed' : 'upcoming',
        },
        {
          id: 'period3',
          period: 3,
          subject: 'اللغة العربية',
          grade: 'الصف الثالث',
          section: 'أ', 
          startTime: '09:50',
          endTime: '10:35',
          status: currentTime.getHours() >= 10 && currentTime.getHours() < 11 ? 'current' : currentTime.getHours() >= 11 ? 'completed' : 'upcoming',
          room: 'غرفة 101'
        },
        {
          id: 'period4',
          period: 4,
          subject: 'التربية الإسلامية',
          grade: 'الصف الثالث',
          section: 'أ',
          startTime: '10:35',
          endTime: '11:20',
          status: currentTime.getHours() >= 11 && currentTime.getHours() < 12 ? 'current' : currentTime.getHours() >= 12 ? 'completed' : 'upcoming',
          room: 'غرفة 101'
        }
      ]

      setNotifications(sampleNotifications)
      setMyStudents(sampleStudents)
      setSchedule(sampleSchedule)
      setPendingDismissals(sampleNotifications)
    }

    loadTeacherData()
  }, [setNotifications, setMyStudents, setSchedule, setPendingDismissals])

  const handlePrepareStudent = async (notificationId: string) => {
    try {
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId
          ? { ...notif, status: 'student_prepared', preparedAt: new Date().toISOString() }
          : notif
      )
      
      setNotifications(updatedNotifications)
      
      const notification = notifications.find(n => n.id === notificationId)
      if (notification) {
        toast.success(`تم تحضير ${notification.studentName} للانصراف`)
        
        // Simulate sending student to gate
        setTimeout(() => {
          toast.info(`${notification.studentName} في طريقه إلى البوابة`)
        }, 2000)
      }
    } catch (error) {
      toast.error('حدث خطأ في تحضير الطالب')
    }
  }

  const currentPeriod = schedule.find(s => s.status === 'current')
  const nextPeriod = schedule.find(s => s.status === 'upcoming')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <GraduationCap size={20} className="text-secondary-foreground" weight="duotone" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">تطبيق المعلم</h1>
                <p className="text-sm text-muted-foreground">مرحباً {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative">
                <Bell size={16} />
                {notifications.filter(n => n.status === 'pending_preparation').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {notifications.filter(n => n.status === 'pending_preparation').length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <SignOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Status */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الحصة الحالية</p>
                  {currentPeriod ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary">جاري الآن</Badge>
                      <span className="font-medium">{currentPeriod.subject}</span>
                      <span className="text-sm text-muted-foreground">
                        ({currentPeriod.startTime} - {currentPeriod.endTime})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">لا توجد حصة حالياً</span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الحصة القادمة</p>
                  {nextPeriod ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">قادم</Badge>
                      <span className="font-medium">{nextPeriod.subject}</span>
                      <span className="text-sm text-muted-foreground">
                        ({nextPeriod.startTime})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">لا توجد حصص قادمة</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="schedule">الجدول</TabsTrigger>
            <TabsTrigger value="students">طلابي</TabsTrigger>
          </TabsList>

          {/* Notifications - Early Dismissal Approvals */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} />
                  طلبات الاستئذان المعتمدة
                </CardTitle>
                <CardDescription>
                  الطلاب الذين تم الموافقة على استئذانهم ويحتاجون تحضير للانصراف
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle size={48} className="mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium mb-1">لا توجد إشعارات جديدة</h3>
                    <p className="text-sm text-muted-foreground">
                      سيتم إشعارك عند الموافقة على أي طلبات استئذان
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 rounded-lg border-2 ${
                        notification.status === 'pending_preparation' ? 'border-warning bg-warning/5' :
                        'border-secondary bg-secondary/5'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-lg">{notification.studentName}</span>
                              <Badge variant={
                                notification.status === 'pending_preparation' ? 'default' : 'secondary'
                              }>
                                {notification.status === 'pending_preparation' ? 'يحتاج تحضير' : 'تم التحضير'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.grade} - {notification.section} • ولي الأمر: {notification.parentName}
                            </p>
                            <p className="text-sm mb-2">
                              <strong>سبب الاستئذان:</strong> {notification.reason}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ⏰ تمت الموافقة: {notification.approvedAt}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            تمت الموافقة من: {notification.approvedBy}
                          </div>
                          
                          {notification.status === 'pending_preparation' && (
                            <Button
                              onClick={() => handlePrepareStudent(notification.id)}
                              className="gap-2"
                              size="sm"
                            >
                              <Send size={14} />
                              تحضير الطالب للانصراف
                            </Button>
                          )}
                        </div>
                        
                        {notification.status === 'student_prepared' && (
                          <div className="mt-3 p-2 bg-secondary/20 rounded text-sm text-secondary-foreground">
                            ✅ تم تحضير الطالب وإرساله إلى البوابة
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  جدولي اليوم
                </CardTitle>
                <CardDescription>
                  جدولك الدراسي لهذا اليوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedule.map((period, index) => (
                    <div key={period.id} className={`p-4 rounded-lg border ${
                      period.status === 'current' ? 'border-primary bg-primary/5' :
                      period.status === 'completed' ? 'border-secondary bg-secondary/5' :
                      'border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {period.period === 'استراحة' ? (
                            <Clock size={20} className="text-muted-foreground" />
                          ) : (
                            <BookOpen size={20} className={
                              period.status === 'current' ? 'text-primary' :
                              period.status === 'completed' ? 'text-secondary' :
                              'text-muted-foreground'
                            } />
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{period.subject}</span>
                              {period.grade && (
                                <Badge variant="outline" className="text-xs">
                                  {period.grade} - {period.section}
                                </Badge>
                              )}
                              <Badge variant={
                                period.status === 'current' ? 'default' :
                                period.status === 'completed' ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {period.status === 'current' ? 'جاري الآن' :
                                 period.status === 'completed' ? 'منتهي' :
                                 'قادم'}
                              </Badge>
                            </div>
                            {period.room && (
                              <p className="text-sm text-muted-foreground">{period.room}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Students */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  طلاب فصلي
                </CardTitle>
                <CardDescription>
                  قائمة الطلاب في فصولك اليوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {myStudents.map((student) => (
                    <div key={student.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Student size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.grade} - {student.section} • مقعد {student.seat}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            student.status === 'present' ? 'secondary' :
                            student.status === 'absent' ? 'destructive' :
                            'outline'
                          }>
                            {student.status === 'present' ? 'حاضر' :
                             student.status === 'absent' ? 'غائب' : 'متأخر'}
                          </Badge>
                          
                          {student.arrivalTime && (
                            <span className="text-sm text-muted-foreground">
                              وصل: {student.arrivalTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}