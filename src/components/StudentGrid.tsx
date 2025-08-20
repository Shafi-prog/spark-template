import { CheckCircle, XCircle, Clock, Bus, Home, User } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Student {
  id: string
  name: string
  nameEn?: string
  grade: string
  section: string
  school: string
  photo?: string
  status: 'present' | 'absent' | 'late' | 'pending' | 'picked_up' | 'in_bus'
  canRequestDismissal: boolean
  canRequestEarly?: boolean
}

interface StudentGridProps {
  students: Student[]
  userRole?: string
  onRequestDismissal: () => void
  onEarlyDismissal: () => void
}

const statusConfig = {
  present: { 
    icon: CheckCircle, 
    color: 'bg-secondary text-secondary-foreground', 
    label: 'حاضر',
    iconColor: 'text-secondary'
  },
  absent: { 
    icon: XCircle, 
    color: 'bg-destructive text-destructive-foreground', 
    label: 'غائب',
    iconColor: 'text-destructive'
  },
  late: { 
    icon: Clock, 
    color: 'bg-warning text-warning-foreground', 
    label: 'متأخر',
    iconColor: 'text-warning'
  },
  pending: { 
    icon: Clock, 
    color: 'bg-muted text-muted-foreground', 
    label: 'لم يصل بعد',
    iconColor: 'text-muted-foreground'
  },
  picked_up: { 
    icon: Home, 
    color: 'bg-primary text-primary-foreground', 
    label: 'تم الاستلام',
    iconColor: 'text-primary'
  },
  in_bus: { 
    icon: Bus, 
    color: 'bg-accent text-accent-foreground', 
    label: 'في الحافلة',
    iconColor: 'text-accent'
  }
}

export function StudentGrid({ students = [], userRole = 'parent', onRequestDismissal, onEarlyDismissal }: StudentGridProps) {
  // Ensure students is always an array
  const studentsArray = Array.isArray(students) ? students : []

  const getRoleLabel = () => {
    switch (userRole) {
      case 'authorized_driver':
        return 'الطلاب المفوض بهم'
      case 'parent':
      default:
        return 'الأبناء'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{getRoleLabel()}</h2>
        <Badge variant="outline" className="text-sm">
          {studentsArray.length} طالب
        </Badge>
      </div>

      {studentsArray.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-2">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد بيانات طلاب</h3>
            <p className="text-sm text-muted-foreground">سيتم عرض الطلاب هنا عند توفر البيانات</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {studentsArray.map((student) => {
            const StatusIcon = statusConfig[student.status]?.icon || User
            const statusStyle = statusConfig[student.status] || statusConfig.pending
            
            return (
              <Card key={student.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/5 text-primary font-semibold">
                        {student?.name?.split(' ')?.map(n => n?.[0])?.join('')?.slice(0, 2) || 'طالب'}
                      </AvatarFallback>
                    </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg leading-tight">
                      {student?.name || 'غير محدد'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student?.grade || ''} - {student?.section || ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student?.school || ''}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${statusStyle.color} text-xs px-2 py-1 flex items-center gap-1`}>
                      <StatusIcon size={12} />
                      {statusStyle.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={onRequestDismissal}
                    disabled={!student?.canRequestDismissal}
                  >
                    <User size={14} className="ml-1" />
                    {userRole === 'authorized_driver' ? 'طلب استلام' : 'طلب انصراف'}
                  </Button>
                  
                  {/* Only show early dismissal for parents */}
                  {userRole === 'parent' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={onEarlyDismissal}
                      disabled={!student?.canRequestEarly}
                    >
                      <Clock size={14} className="ml-1" />
                      استئذان مبكر
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}