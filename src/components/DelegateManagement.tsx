import { useState } from 'react'
import { ArrowRight, Plus, UserPlus, Trash, Calendar, Clock, Phone, Shield } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface Delegate {
  id: string
  name: string
  phone: string
  nationalId: string
  relationship: string
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'permanent'
  validFrom: string
  validUntil: string
  specificDates?: string[]
  daysOfWeek?: string[]
  timeRestrictions?: { from: string; to: string }
  students: string[]
  isActive: boolean
  usedCount: number
  maxUses?: number
  otpVerified: boolean
}

interface DelegateManagementProps {
  onBack: () => void
}

export function DelegateManagement({ onBack }: DelegateManagementProps) {
  const [delegates, setDelegates] = useKV<Delegate[]>('delegates', [
    {
      id: '1',
      name: 'سعد محمد الأحمدي',
      phone: '+966501234567',
      nationalId: '1234567890',
      relationship: 'uncle',
      type: 'weekly',
      validFrom: '2024-01-01',
      validUntil: '2024-06-30',
      daysOfWeek: ['1', '3'], // الأحد والثلاثاء
      students: ['1'],
      isActive: true,
      usedCount: 5,
      maxUses: 20,
      otpVerified: true
    }
  ])

  const [students] = useKV('students', [
    { id: '1', name: 'محمد أحمد', grade: 'الصف الثالث', section: 'أ' },
    { id: '2', name: 'فاطمة أحمد', grade: 'الصف الأول', section: 'ب' }
  ])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDelegate, setNewDelegate] = useState({
    name: '',
    phone: '',
    nationalId: '',
    relationship: '',
    type: 'once' as Delegate['type'],
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    students: [] as string[]
  })

  const relationshipOptions = [
    { value: 'grandfather', label: 'الجد' },
    { value: 'grandmother', label: 'الجدة' },
    { value: 'uncle', label: 'العم' },
    { value: 'aunt', label: 'العمة' },
    { value: 'driver', label: 'السائق' },
    { value: 'relative', label: 'قريب' },
    { value: 'friend', label: 'صديق العائلة' },
    { value: 'other', label: 'أخرى' }
  ]

  const typeOptions = [
    { value: 'once', label: 'مرة واحدة', description: 'تاريخ محدد' },
    { value: 'daily', label: 'يومي', description: 'أيام محددة من الأسبوع' },
    { value: 'weekly', label: 'أسبوعي', description: 'كل أسبوع' },
    { value: 'monthly', label: 'شهري', description: 'كل شهر' },
    { value: 'permanent', label: 'دائم', description: 'بدون انتهاء' }
  ]

  const getDayName = (dayNumber: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    return days[parseInt(dayNumber)]
  }

  const getStatusBadge = (delegate: Delegate) => {
    if (!delegate.isActive) {
      return <Badge variant="destructive">غير مفعل</Badge>
    }
    if (!delegate.otpVerified) {
      return <Badge variant="secondary">في انتظار التحقق</Badge>
    }
    const now = new Date()
    const validUntil = new Date(delegate.validUntil)
    if (validUntil < now) {
      return <Badge variant="outline">منتهي الصلاحية</Badge>
    }
    return <Badge variant="secondary" className="bg-secondary">نشط</Badge>
  }

  const handleAddDelegate = () => {
    if (!newDelegate.name || !newDelegate.phone || !newDelegate.nationalId || !newDelegate.relationship) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }

    const delegate: Delegate = {
      id: Date.now().toString(),
      ...newDelegate,
      validUntil: newDelegate.validUntil || '2025-12-31',
      isActive: true,
      usedCount: 0,
      otpVerified: false
    }

    setDelegates(current => [...current, delegate])
    setNewDelegate({
      name: '',
      phone: '',
      nationalId: '',
      relationship: '',
      type: 'once',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      students: []
    })
    setShowAddDialog(false)
    toast.success('تم إضافة المفوض بنجاح. سيتم إرسال رمز التحقق.')
  }

  const handleDeactivateDelegate = (delegateId: string) => {
    setDelegates(current => 
      current.map(d => 
        d.id === delegateId 
          ? { ...d, isActive: false }
          : d
      )
    )
    toast.success('تم إلغاء تفعيل المفوض')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowRight size={20} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">إدارة المفوضين</h1>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="ml-2" />
                إضافة مفوض
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مفوض جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={newDelegate.name}
                    onChange={(e) => setNewDelegate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم المفوض"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الجوال *</Label>
                  <Input
                    id="phone"
                    value={newDelegate.phone}
                    onChange={(e) => setNewDelegate(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966501234567"
                  />
                </div>

                <div>
                  <Label htmlFor="nationalId">رقم الهوية/الإقامة *</Label>
                  <Input
                    id="nationalId"
                    value={newDelegate.nationalId}
                    onChange={(e) => setNewDelegate(prev => ({ ...prev, nationalId: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <Label>صلة القرابة *</Label>
                  <Select
                    value={newDelegate.relationship}
                    onValueChange={(value) => setNewDelegate(prev => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صلة القرابة" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>نوع التفويض</Label>
                  <Select
                    value={newDelegate.type}
                    onValueChange={(value) => setNewDelegate(prev => ({ ...prev, type: value as Delegate['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="validFrom">من تاريخ</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={newDelegate.validFrom}
                      onChange={(e) => setNewDelegate(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="validUntil">إلى تاريخ</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={newDelegate.validUntil}
                      onChange={(e) => setNewDelegate(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddDelegate}>
                    <UserPlus size={16} className="ml-2" />
                    إضافة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {delegates.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <UserPlus size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد مفوضون</h3>
              <p className="text-muted-foreground mb-4">
                قم بإضافة الأشخاص المفوضين لاستلام أبنائك من المدرسة
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus size={16} className="ml-2" />
                إضافة مفوض
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {delegates.map((delegate) => (
              <Card key={delegate.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                          {delegate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{delegate.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {relationshipOptions.find(r => r.value === delegate.relationship)?.label}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone size={12} />
                          {delegate.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(delegate)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivateDelegate(delegate.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>النوع: {typeOptions.find(t => t.value === delegate.type)?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <span>صالح حتى: {new Date(delegate.validUntil).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>

                  {delegate.daysOfWeek && (
                    <div>
                      <span className="text-sm font-medium">الأيام المحددة: </span>
                      <div className="flex gap-1 mt-1">
                        {delegate.daysOfWeek.map(day => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {getDayName(day)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium">الطلاب المفوض باستلامهم: </span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {delegate.students.map(studentId => {
                        const student = students.find(s => s.id === studentId)
                        return student ? (
                          <Badge key={studentId} variant="secondary" className="text-xs">
                            {student.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>عدد مرات الاستخدام: {delegate.usedCount}</div>
                    <div>الحد الأقصى: {delegate.maxUses || 'غير محدود'}</div>
                  </div>

                  {!delegate.otpVerified && (
                    <div className="bg-warning/10 border border-warning/20 rounded p-3">
                      <div className="flex items-center gap-2 text-warning">
                        <Shield size={16} />
                        <span className="text-sm font-medium">يتطلب تحقق</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        سيتم إرسال رمز التحقق للمفوض قبل أول استخدام
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Shield size={16} />
              إرشادات الأمان
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• تأكد من صحة أرقام الجوال للمفوضين</li>
              <li>• راجع صلاحية التفويضات بانتظام</li>
              <li>• يمكنك إلغاء التفويض في أي وقت</li>
              <li>• سيتم التحقق من هوية المفوض قبل التسليم</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}