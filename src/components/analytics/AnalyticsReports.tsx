import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChartBar, 
  Clock, 
  TrendUp, 
  TrendDown, 
  CalendarCheck, 
  Users, 
  CheckCircle,
  AlertCircle,
  DownloadSimple,
  Student,
  CarProfile,
  Timer,
  Calendar as CalendarIcon
} from "@phosphor-icons/react"

interface AnalyticsReportsProps {
  onBack: () => void
}

export function AnalyticsReports({ onBack }: AnalyticsReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [analyticsData, setAnalyticsData] = useKV('school_analytics', {
    dailyStats: {
      totalStudents: 485,
      presentToday: 471,
      dismissedToday: 465,
      earlyDismissals: 6,
      avgDismissalTime: '12:45',
      avgWaitTime: 4.2
    },
    weeklyTrends: {
      dismissalRequests: [45, 52, 48, 61, 58],
      avgWaitTimes: [3.8, 4.2, 3.5, 5.1, 4.7],
      earlyDismissals: [2, 4, 3, 8, 6]
    },
    monthlyComparisons: {
      thisMonth: { requests: 1245, avgWait: 4.2, satisfaction: 92 },
      lastMonth: { requests: 1198, avgWait: 5.8, satisfaction: 85 }
    },
    topPatterns: [
      { time: '12:30-12:40', frequency: 35, avgWait: 2.3 },
      { time: '12:40-12:50', frequency: 28, avgWait: 3.8 },
      { time: '12:50-13:00', frequency: 22, avgWait: 5.2 },
      { time: '13:00-13:10', frequency: 15, avgWait: 3.1 }
    ]
  })

  const [reportsData, setReportsData] = useKV('school_reports', {
    incidents: [
      {
        id: 'inc-1',
        type: 'unauthorized_pickup_attempt',
        description: 'محاولة استلام غير مصرح بها للطالب أحمد',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'high',
        resolved: true
      },
      {
        id: 'inc-2', 
        type: 'location_verification_failed',
        description: 'فشل في التحقق من موقع الوالد خارج المنطقة المحددة',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'medium',
        resolved: true
      }
    ],
    performance: {
      systemUptime: 99.8,
      avgResponseTime: 1.2,
      errorRate: 0.05,
      userSatisfaction: 4.6
    }
  })

  // Generate mock data for different periods
  const generatePeriodData = (period: string) => {
    const baseData = analyticsData.dailyStats
    const multipliers = {
      'day': 1,
      'week': 7,
      'month': 30,
      'quarter': 90
    }
    const multiplier = multipliers[period as keyof typeof multipliers] || 1

    return {
      totalRequests: baseData.presentToday * multiplier,
      completedRequests: Math.floor(baseData.dismissedToday * multiplier * 0.98),
      avgWaitTime: baseData.avgWaitTime + (Math.random() * 2 - 1),
      earlyDismissals: baseData.earlyDismissals * multiplier,
      peakHours: period === 'day' ? ['12:30', '12:45'] : ['الأحد', 'الثلاثاء']
    }
  }

  const periodData = generatePeriodData(selectedPeriod)

  const exportReport = (format: string) => {
    // Mock export functionality
    const reportData = {
      period: selectedPeriod,
      date: selectedDate.toISOString(),
      data: periodData,
      analytics: analyticsData,
      reports: reportsData
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `school-report-${selectedPeriod}-${selectedDate.toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChartBar size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">التحليلات والتقارير</h1>
              <p className="text-sm text-muted-foreground">تحليل الأداء وتقارير النظام</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">يومي</SelectItem>
                <SelectItem value="week">أسبوعي</SelectItem>
                <SelectItem value="month">شهري</SelectItem>
                <SelectItem value="quarter">ربع سنوي</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon size={16} className="ml-2" />
                  {selectedDate.toLocaleDateString('ar-SA')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
            <TabsTrigger value="patterns">الأنماط</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users size={16} />
                    إجمالي الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{periodData.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% من الفترة السابقة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={16} />
                    طلبات مكتملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{periodData.completedRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    معدل إنجاز 98%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Timer size={16} />
                    متوسط الانتظار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{periodData.avgWaitTime.toFixed(1)} دقيقة</div>
                  <p className="text-xs text-secondary-foreground">
                    -15% تحسن
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    استئذان مبكر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{periodData.earlyDismissals}</div>
                  <p className="text-xs text-muted-foreground">
                    +5% من المعتاد
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Mock */}
            <Card>
              <CardHeader>
                <CardTitle>أداء النظام - آخر 7 أيام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 p-4 bg-muted/20 rounded">
                  {analyticsData.weeklyTrends.dismissalRequests.map((value, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div 
                        className="bg-primary rounded-t w-8 transition-all"
                        style={{ height: `${(value / 70) * 200}px` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي'][index]}
                      </span>
                      <span className="text-xs font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>وقت تشغيل النظام</span>
                    <Badge variant="secondary">{reportsData.performance.systemUptime}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>متوسط وقت الاستجابة</span>
                    <Badge variant="secondary">{reportsData.performance.avgResponseTime}ث</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>معدل الأخطاء</span>
                    <Badge variant="secondary">{reportsData.performance.errorRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>رضا المستخدمين</span>
                    <Badge variant="secondary">{reportsData.performance.userSatisfaction}/5</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أوقات الذروة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {analyticsData.topPatterns.map((pattern, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <div className="font-medium">{pattern.time}</div>
                            <div className="text-sm text-muted-foreground">{pattern.frequency} طلب</div>
                          </div>
                          <Badge variant="outline">{pattern.avgWait} دقيقة</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تحليل الأنماط</CardTitle>
                <CardDescription>الأنماط المتكررة في طلبات الانصراف</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">أكثر الأوقات ازدحاماً</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>12:30 - 12:40</span>
                        <span className="text-primary">35%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>12:40 - 12:50</span>
                        <span className="text-primary">28%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>12:50 - 13:00</span>
                        <span className="text-primary">22%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">أيام الأسبوع</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>الأحد</span>
                        <span className="text-secondary">عالي</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الثلاثاء</span>
                        <span className="text-secondary">عالي</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الخميس</span>
                        <span className="text-warning">متوسط</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">تقارير النظام</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportReport('pdf')}>
                  <DownloadSimple size={16} className="ml-2" />
                  تصدير PDF
                </Button>
                <Button variant="outline" onClick={() => exportReport('json')}>
                  <DownloadSimple size={16} className="ml-2" />
                  تصدير البيانات
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>تقرير الحوادث الأمنية</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {reportsData.incidents.map((incident, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{incident.description}</h4>
                          <Badge variant={incident.severity === 'high' ? 'destructive' : 'warning'}>
                            {incident.severity === 'high' ? 'عالي' : 'متوسط'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(incident.timestamp).toLocaleString('ar-SA')}
                        </div>
                        {incident.resolved && (
                          <Badge variant="secondary" className="mt-2">تم الحل</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}