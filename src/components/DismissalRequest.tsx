import { useState } from 'react'
import { ArrowRight, Car, MapPin, Clock, CheckCircle, Users } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Student {
  id: string
  name: string
  grade: string
  section: string
  status: string
  canRequestDismissal: boolean
}

interface DismissalRequestProps {
  students: Student[]
  onBack: () => void
  onSubmit: (selectedStudents: string[], carInfo: any) => void
}

export function DismissalRequest({ students, onBack, onSubmit }: DismissalRequestProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [carLocation, setCarLocation] = useState('')
  const [carType, setCarType] = useState('')
  const [carColor, setCarColor] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const availableStudents = students.filter(s => s.canRequestDismissal)
  
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(availableStudents.map(s => s.id))
    }
  }

  const handleSubmit = () => {
    if (selectedStudents.length === 0) return
    
    const carInfo = {
      location: carLocation,
      type: carType,
      color: carColor,
      plateNumber: plateNumber,
      notes: notes
    }
    
    onSubmit(selectedStudents, carInfo)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">طلب انصراف</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>اختر الأبناء للانصراف</span>
              <Badge variant="outline">
                {selectedStudents.length} من {availableStudents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === availableStudents.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
            </div>

            <div className="space-y-3">
              {availableStudents.map((student) => (
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
                  <Badge variant="secondary" className="text-xs">
                    متاح
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              معلومات إضافية
              <span className="text-xs text-muted-foreground">
                {showDetails ? 'إخفاء' : 'عرض'}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="car-location">موقف السيارة</Label>
                  <Select value={carLocation} onValueChange={setCarLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موقف السيارة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-gate">البوابة الرئيسية</SelectItem>
                      <SelectItem value="side-gate">البوابة الجانبية</SelectItem>
                      <SelectItem value="parking-a">موقف أ</SelectItem>
                      <SelectItem value="parking-b">موقف ب</SelectItem>
                      <SelectItem value="street">الشارع الرئيسي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="car-type">نوع السيارة</Label>
                    <Select value={carType} onValueChange={setCarType}>
                      <SelectTrigger>
                        <SelectValue placeholder="النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camry">كامري</SelectItem>
                        <SelectItem value="accord">أكورد</SelectItem>
                        <SelectItem value="altima">التيما</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="car-color">لون السيارة</Label>
                    <Select value={carColor} onValueChange={setCarColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">أبيض</SelectItem>
                        <SelectItem value="black">أسود</SelectItem>
                        <SelectItem value="gray">رمادي</SelectItem>
                        <SelectItem value="silver">فضي</SelectItem>
                        <SelectItem value="blue">أزرق</SelectItem>
                        <SelectItem value="red">أحمر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="plate-number">رقم اللوحة (اختياري)</Label>
                  <Input
                    id="plate-number"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="مثل: أ ب ج 123"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات للمدرسة</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Summary */}
        {selectedStudents.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">ملخص الطلب</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <span>عدد الطلاب: {selectedStudents.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span>الوقت المتوقع: 10-15 دقيقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-secondary" />
                  <span>داخل النطاق</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-secondary" />
                  <span>جاهز للإرسال</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="p-4 border-t border-border bg-card">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedStudents.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Car size={16} className="ml-2" />
            إرسال الطلب
          </Button>
        </div>
      </footer>
    </div>
  )
}