import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Car, 
  MapPin, 
  Clock, 
  UserCheck, 
  GraduationCap as Student,
  Phone,
  SignOut
} from '@phosphor-icons/react'

interface AuthorizedDriverViewProps {
  user: any
  students: any[]
  dismissalQueue: any
  location: any
  onRequestDismissal: () => void
  onLogout: () => void
}

export function AuthorizedDriverView({ 
  user, 
  students = [], 
  dismissalQueue, 
  location, 
  onRequestDismissal,
  onLogout 
}: AuthorizedDriverViewProps) {
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}م`
    }
    return `${(distance / 1000).toFixed(1)}كم`
  }

  const studentsArray = Array.isArray(students) ? students : []
  const canRequestPickup = location?.distanceFromSchool <= 100 && studentsArray.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Car size={20} className="text-secondary-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">أهلاً {user.name}</h1>
              <p className="text-sm text-muted-foreground">سائق مفوض</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <SignOut size={18} />
          </Button>
        </div>
      </header>

      {/* Status Bar */}
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <span className="text-sm">المسافة من المدرسة:</span>
                <Badge variant={location.distanceFromSchool <= 100 ? "default" : "secondary"}>
                  {formatDistance(location.distanceFromSchool)}
                </Badge>
              </div>
              {dismissalQueue.isActive && (
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-warning" />
                  <span className="text-sm">ترتيبك: {dismissalQueue.position}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <main className="px-4 space-y-4">
        {/* Authorization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck size={20} />
              معلومات التفويض
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">مفوض من:</span>
              <span className="font-medium">ولي الأمر الأساسي</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">صلة القرابة:</span>
              <span className="font-medium">{user.relationship}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">رقم الجوال:</span>
              <span className="font-medium">{user.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">حالة التفويض:</span>
              <Badge variant="default">مفعل</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Authorized Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Student size={20} />
              الطلاب المفوض باستلامهم ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="space-y-3">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Student size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.grade} - {student.section}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={student.status === 'present' ? 'default' : 'secondary'}
                    >
                      {student.status === 'present' ? 'حاضر' : 'منصرف'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                لا توجد طلاب مفوض باستلامهم حالياً
              </p>
            )}
          </CardContent>
        </Card>

        {/* Queue Status */}
        {dismissalQueue.isActive && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">حالة طلب الاستلام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>ترتيبك في القائمة:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {dismissalQueue.position}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>إجمالي الطلبات:</span>
                <span>{dismissalQueue.totalInQueue}</span>
              </div>
              <div className="flex justify-between">
                <span>الوقت المتوقع:</span>
                <span className="font-medium text-primary">
                  {dismissalQueue.estimatedWaitTime} دقيقة
                </span>
              </div>
              
              {dismissalQueue.calledStudents.length > 0 && (
                <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
                  <p className="font-medium text-secondary mb-2">
                    📢 تم نداء الطلاب - توجه للبوابة
                  </p>
                  <div className="space-y-1">
                    {dismissalQueue.calledStudents.map((studentId: string) => {
                      const student = students.find(s => s.id === studentId)
                      return student ? (
                        <p key={studentId} className="text-sm">{student.name}</p>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          size="lg"
          className="w-full"
          onClick={onRequestDismissal}
          disabled={!canRequestPickup || dismissalQueue.isActive}
        >
          <Car className="w-5 h-5 ml-2" />
          {dismissalQueue.isActive 
            ? 'طلب الاستلام قيد التنفيذ' 
            : canRequestPickup 
              ? `طلب استلام ${students.length} طالب` 
              : 'اقترب من المدرسة لتفعيل الطلب'
          }
        </Button>
        
        {!canRequestPickup && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            يجب أن تكون على بعد أقل من 100 متر من المدرسة
          </p>
        )}
      </div>

      {/* Contact Support */}
      <div className="px-4 pb-20">
        <Card className="mt-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              في حالة وجود مشكلة أو استفسار
            </p>
            <Button variant="outline" size="sm">
              <Phone size={16} className="ml-2" />
              اتصال بالمدرسة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}