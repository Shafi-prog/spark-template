import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SoundSystem } from '../components/SoundSystem'
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
  Volume2
} from "@phosphor-icons/react"
import { toast } from 'sonner'

interface SchoolDashboardProps {
  user: any
  onLogout: () => void
}

export function SchoolDashboard({ user, onLogout }: SchoolDashboardProps) {
  const [dismissalRequests, setDismissalRequests] = useKV('school_dismissal_requests', [])
  const [earlyDismissalRequests, setEarlyDismissalRequests] = useKV('school_early_requests', [])
  const [activeQueue, setActiveQueue] = useKV('school_active_queue', [])
  const [schoolStats, setSchoolStats] = useKV('school_stats', {
    totalStudents: 450,
    presentToday: 432,
    dismissedToday: 0,
    pendingRequests: 0
  })

  // Load demo data
  useEffect(() => {
    const loadSchoolData = async () => {
      // Sample dismissal queue
      const sampleQueue = [
        {
          id: 'req1',
          parentName: 'أحمد السعودي',
          students: ['محمد أحمد', 'فاطمة أحمد'],
          arrivalTime: '12:25',
          position: 1,
          status: 'waiting',
          carInfo: { location: 'A1', description: 'كامري بيضاء' }
        },
        {
          id: 'req2', 
          parentName: 'سارة العتيبي',
          students: ['نورا سارة'],
          arrivalTime: '12:28',
          position: 2,
          status: 'waiting',
          carInfo: { location: 'B2', description: 'أكورد رمادية' }
        },
        {
          id: 'req3',
          parentName: 'محمد الأحمد', 
          students: ['عبدالله محمد'],
          arrivalTime: '12:30',
          position: 3,
          status: 'called',
          carInfo: { location: 'A3', description: 'كرولا سوداء' }
        }
      ]

      // Sample early dismissal requests
      const sampleEarlyRequests = [
        {
          id: 'early1',
          studentName: 'خالد أحمد',
          parentName: 'أحمد الخالد',
          grade: 'الصف الثاني',
          section: 'أ',
          reason: 'موعد طبي',
          reasonType: 'medical',
          requestTime: '10:30',
          status: 'pending',
          teacherId: 'teacher-1',
          attachments: []
        },
        {
          id: 'early2',
          studentName: 'رنا محمد',
          parentName: 'فاطمة السعد', 
          grade: 'الصف الأول',
          section: 'ب',
          reason: 'ظرف عائلي طارئ',
          reasonType: 'family',
          requestTime: '11:15',
          status: 'pending',
          teacherId: 'teacher-2',
          attachments: []
        }
      ]

      setActiveQueue(sampleQueue)
      setEarlyDismissalRequests(sampleEarlyRequests)
      setSchoolStats(prev => ({
        ...prev,
        pendingRequests: sampleEarlyRequests.filter(r => r.status === 'pending').length
      }))
    }

    loadSchoolData()
  }, [setActiveQueue, setEarlyDismissalRequests, setSchoolStats])

  const handleApproveEarlyRequest = async (requestId: string) => {
    try {
      const updatedRequests = earlyDismissalRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', approvedBy: user.name, approvedAt: new Date().toISOString() }
          : req
      )
      
      setEarlyDismissalRequests(updatedRequests)
      
      // Simulate notifying teacher
      toast.success('تم الموافقة على الطلب وإشعار المعلم')
      
      // Update stats
      setSchoolStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1
      }))
    } catch (error) {
      toast.error('حدث خطأ في الموافقة على الطلب')
    }
  }

  const handleRejectEarlyRequest = async (requestId: string) => {
    try {
      const updatedRequests = earlyDismissalRequests.map(req =>
        req.id === requestId
          ? { ...req, status: 'rejected', rejectedBy: user.name, rejectedAt: new Date().toISOString() }
          : req
      )
      
      setEarlyDismissalRequests(updatedRequests)
      toast.success('تم رفض الطلب وإشعار ولي الأمر')
      
      setSchoolStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1
      }))
    } catch (error) {
      toast.error('حدث خطأ في رفض الطلب')
    }
  }

  const handleCallNext = async () => {
    try {
      const nextStudent = activeQueue.find(req => req.status === 'waiting')
      if (nextStudent) {
        const updatedQueue = activeQueue.map(req =>
          req.id === nextStudent.id
            ? { ...req, status: 'called', calledAt: new Date().toISOString() }
            : req
        )
        setActiveQueue(updatedQueue)
        toast.success(`تم نداء: ${nextStudent.students.join(', ')}`)
      }
    } catch (error) {
      toast.error('حدث خطأ في النداء')
    }
  }

  const handleStudentCalled = async (studentName: string) => {
    try {
      const studentRequest = activeQueue.find(req => req.students.includes(studentName))
      if (studentRequest) {
        const updatedQueue = activeQueue.map(req =>
          req.id === studentRequest.id
            ? { ...req, status: 'called', calledAt: new Date().toISOString() }
            : req
        )
        setActiveQueue(updatedQueue)
      }
    } catch (error) {
      console.error('Error updating student call status:', error)
    }
  }

  const handleMarkPickedUp = async (requestId: string) => {
    try {
      const updatedQueue = activeQueue.map(req =>
        req.id === requestId
          ? { ...req, status: 'picked_up', pickedUpAt: new Date().toISOString() }
          : req
      )
      setActiveQueue(updatedQueue)
      
      setSchoolStats(prev => ({
        ...prev,
        dismissedToday: prev.dismissedToday + 1
      }))
      
      toast.success('تم تأكيد الاستلام')
    } catch (error) {
      toast.error('حدث خطأ في التأكيد')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <School size={20} className="text-primary-foreground" weight="duotone" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">لوحة تحكم المدرسة</h1>
                <p className="text-sm text-muted-foreground">مرحباً {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <SignOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الطلاب</p>
                  <p className="text-3xl font-bold">{schoolStats.totalStudents}</p>
                </div>
                <Users size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الحضور اليوم</p>
                  <p className="text-3xl font-bold text-secondary">{schoolStats.presentToday}</p>
                </div>
                <UserCheck size={24} className="text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تم الانصراف</p>
                  <p className="text-3xl font-bold text-accent">{schoolStats.dismissedToday}</p>
                </div>
                <CheckCircle size={24} className="text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">طلبات معلقة</p>
                  <p className="text-3xl font-bold text-warning">{schoolStats.pendingRequests}</p>
                </div>
                <AlertCircle size={24} className="text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="queue">طابور الانصراف</TabsTrigger>
            <TabsTrigger value="early-requests">طلبات الاستئذان</TabsTrigger>
            <TabsTrigger value="sound-system">النظام الصوتي</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Active Queue Management */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>طابور الانصراف المباشر</CardTitle>
                    <CardDescription>
                      إدارة طابور الانصراف الحالي - {activeQueue.filter(r => r.status !== 'picked_up').length} في الانتظار
                    </CardDescription>
                  </div>
                  <Button onClick={handleCallNext} className="gap-2">
                    <List size={16} />
                    نداء التالي
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeQueue.map((request) => (
                    <div key={request.id} className={`p-4 rounded-lg border-2 ${
                      request.status === 'called' ? 'border-warning bg-warning/5' :
                      request.status === 'picked_up' ? 'border-secondary bg-secondary/5' :
                      'border-border'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">{request.parentName}</span>
                            <Badge variant={
                              request.status === 'waiting' ? 'secondary' :
                              request.status === 'called' ? 'default' :
                              'outline'
                            }>
                              {request.status === 'waiting' ? 'في الانتظار' :
                               request.status === 'called' ? 'تم النداء' :
                               'تم الاستلام'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">#{request.position}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            الطلاب: {request.students.join(', ')}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>⏰ وصل الساعة: {request.arrivalTime}</span>
                            <span>🚗 {request.carInfo.description}</span>
                            <span>📍 موقف: {request.carInfo.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {request.status === 'called' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPickedUp(request.id)}
                              className="gap-1"
                            >
                              <CheckCircle size={14} />
                              تأكيد الاستلام
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Early Dismissal Requests */}
          <TabsContent value="early-requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>طلبات الاستئذان المبكر</CardTitle>
                <CardDescription>
                  مراجعة والموافقة على طلبات الاستئذان المبكر من أولياء الأمور
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earlyDismissalRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold">{request.studentName}</span>
                            <Badge variant={
                              request.reasonType === 'medical' ? 'destructive' :
                              request.reasonType === 'family' ? 'secondary' :
                              'default'
                            }>
                              {request.reasonType === 'medical' ? 'طبي' :
                               request.reasonType === 'family' ? 'عائلي' : 'أخرى'}
                            </Badge>
                            <Badge variant={
                              request.status === 'pending' ? 'default' :
                              request.status === 'approved' ? 'secondary' :
                              'destructive'
                            }>
                              {request.status === 'pending' ? 'في الانتظار' :
                               request.status === 'approved' ? 'تم القبول' : 'مرفوض'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.grade} - {request.section} • ولي الأمر: {request.parentName}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">⏰ {request.requestTime}</span>
                      </div>
                      
                      <p className="mb-3 p-3 bg-muted/30 rounded text-sm">
                        <strong>السبب:</strong> {request.reason}
                      </p>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveEarlyRequest(request.id)}
                            className="gap-1"
                          >
                            <CheckCircle size={14} />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectEarlyRequest(request.id)}
                            className="gap-1"
                          >
                            <XCircle size={14} />
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sound System Tab */}
          <TabsContent value="sound-system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SoundSystem 
                queue={activeQueue}
                onStudentCalled={handleStudentCalled}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 size={20} />
                    إعدادات النظام الصوتي
                  </CardTitle>
                  <CardDescription>
                    إدارة إعدادات البث والنداء
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>مستوى الصوت</span>
                      <Badge>80%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>سرعة النطق</span>
                      <Badge>عادي</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>نوع الصوت</span>
                      <Badge>أنثى - واضح</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تكرار النداء</span>
                      <Badge>مرتين</Badge>
                    </div>
                    
                    <Button className="w-full mt-4">
                      اختبار النظام الصوتي
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  التقارير والإحصائيات
                </CardTitle>
                <CardDescription>
                  تقارير الحضور والانصراف والإحصائيات الشاملة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">التقارير قيد التطوير</h3>
                  <p className="text-muted-foreground">
                    سيتم إضافة تقارير شاملة للحضور والانصراف قريباً
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings size={20} />
                    إعدادات النظام
                  </CardTitle>
                  <CardDescription>
                    إدارة إعدادات المدرسة والنظام
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>نطاق التفعيل التلقائي</span>
                      <Badge>100 متر</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>وقت الانصراف</span>
                      <Badge>12:30 - 13:00</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الحد الأقصى للانتظار</span>
                      <Badge>20 دقيقة</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الموافقة على الاستئذان</span>
                      <Badge>تلقائية للطوارئ</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={20} />
                    أفضل الممارسات للانصراف الآمن
                  </CardTitle>
                  <CardDescription>
                    إرشادات لضمان عملية انصراف سلسة وآمنة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>التفعيل التلقائي:</strong> يتم تفعيل طلب الانصراف تلقائياً عند دخول ولي الأمر نطاق 100 متر من المدرسة
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>الطابور المنظم:</strong> ترتيب الطلاب حسب وقت وصول أولياء الأمور لضمان العدالة
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>التحقق المزدوج:</strong> تأكيد هوية المستلم وموافقة ولي الأمر قبل تسليم الطالب
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>الإشعارات الذكية:</strong> تنبيه المعلمين تلقائياً لتحضير الطلاب قبل نداءهم
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>النداء الواضح:</strong> استخدام تقنية تحويل النص لصوت باللغة العربية الواضحة
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong>التوثيق الرقمي:</strong> حفظ جميع عمليات الانصراف مع الوقت والتاريخ والمستلم
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List size={20} />
                  دليل سير العمل المتكامل
                </CardTitle>
                <CardDescription>
                  شرح تفصيلي للدورة الكاملة لنظام الانصراف الذكي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Regular Dismissal Workflow */}
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">🔄 سير العمل للانصراف العادي:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">1</Badge>
                        <span>ولي الأمر يصل للمدرسة ويدخل النطاق الجغرافي (100م)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">2</Badge>
                        <span>التطبيق يفعّل طلب الانصراف تلقائياً في وقت الانصراف</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">3</Badge>
                        <span>ولي الأمر يختار الأبناء ويؤكد الطلب</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">4</Badge>
                        <span>النظام يضيف الطالب للطابور حسب وقت الوصول</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">5</Badge>
                        <span>النظام ينادي الطلاب بالترتيب عبر النظام الصوتي</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">6</Badge>
                        <span>ولي الأمر يؤكد الاستلام في التطبيق</span>
                      </div>
                    </div>
                  </div>

                  {/* Early Dismissal Workflow */}
                  <div>
                    <h4 className="font-semibold mb-3 text-warning">⏰ سير العمل للاستئذان المبكر:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">1</Badge>
                        <span>ولي الأمر يرسل طلب استئذان مع السبب والمرفقات</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">2</Badge>
                        <span>مدير المدرسة يراجع ويوافق/يرفض الطلب</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">3</Badge>
                        <span>النظام يحدد المعلم المسؤول حسب الجدول الدراسي</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">4</Badge>
                        <span>المعلم يستلم إشعار ويحضّر الطالب للانصراف</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">5</Badge>
                        <span>الطالب يتوجه للبوابة ويُسلم لولي الأمر</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">6</Badge>
                        <span>النظام يوثّق عملية الاستلام رقمياً</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}