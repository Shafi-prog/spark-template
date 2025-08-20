import { useState } from 'react'
import { ArrowRight, Clock, FileText, Camera, Send } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  grade: string
  section: string
}

interface EarlyDismissalProps {
  students: Student[]
  onBack: () => void
  onSubmit: (studentId: string, reason: string, attachments: any[]) => void
}

export function EarlyDismissal({ students, onBack, onSubmit }: EarlyDismissalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [requestType, setRequestType] = useState('')
  const [reason, setReason] = useState('')
  const [expectedTime, setExpectedTime] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleFileAttachment = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        setAttachments(prev => [...prev, ...files])
        toast.success(`تم إرفاق ${files.length} ملف`)
      }
    }
    input.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (selectedStudents.length === 0 || !requestType || !reason) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }
    
    // For now, handle single student (you can extend for multiple)
    const studentId = selectedStudents[0]
    onSubmit(studentId, reason, attachments)
  }

  const requestTypes = [
    { value: 'medical', label: 'طبي', description: 'موعد طبي أو علاج' },
    { value: 'family', label: 'عائلي', description: 'ظرف عائلي طارئ' },
    { value: 'official', label: 'رسمي', description: 'معاملة حكومية' },
    { value: 'travel', label: 'سفر', description: 'سفر ضروري' },
    { value: 'other', label: 'أخرى', description: 'أسباب أخرى' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">طلب استئذان مبكر</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle>اختر الطالب/الطلاب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30">
                <Checkbox
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => handleStudentToggle(student.id)}
                />
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{student.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {student.grade} - {student.section}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Request Type */}
        <Card>
          <CardHeader>
            <CardTitle>نوع الاستئذان</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الاستئذان" />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Reason Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل السبب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason">وصف مفصل للسبب *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب الاستئذان بالتفصيل..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="expected-time">وقت الحضور المتوقع</Label>
              <Input
                id="expected-time"
                type="time"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                اتركه فارغاً إذا لن يعود الطالب اليوم
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>المرفقات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleFileAttachment}
              className="w-full border-dashed"
            >
              <Camera size={16} className="ml-2" />
              إرفاق مستندات (صور المواعيد الطبية، إلخ)
            </Button>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      حذف
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              يفضل إرفاق مستندات مثل مواعيد المستشفى أو الأوراق الرسمية لتسريع الموافقة
            </p>
          </CardContent>
        </Card>

        {/* Approval Process Info */}
        <Card className="bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock size={16} />
              مسار الموافقة
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>1. سيتم إرسال الطلب لمدير المدرسة للمراجعة</div>
              <div>2. بعد الموافقة، سيتم إشعار المعلم لتحضير الطالب</div>
              <div>3. ستتلقى إشعاراً عند كل خطوة</div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 border-t border-border bg-card">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedStudents.length === 0 || !requestType || !reason}
            className="flex-1 bg-accent hover:bg-accent/90"
          >
            <Send size={16} className="ml-2" />
            إرسال للموافقة
          </Button>
        </div>
      </footer>
    </div>
  )
}