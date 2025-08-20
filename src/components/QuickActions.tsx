import { Car, Warning, Users, ChartBar } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface QuickActionsProps {
  userRole?: string
  onQuickDismissal: () => void
  onEmergencyRequest: () => void
  onManageDelegates: () => void
  onViewReports: () => void
}

export function QuickActions({ 
  userRole = 'parent',
  onQuickDismissal, 
  onEmergencyRequest, 
  onManageDelegates, 
  onViewReports 
}: QuickActionsProps) {
  const getActionsForRole = () => {
    if (userRole === 'authorized_driver') {
      // Simplified actions for authorized drivers
      return [
        {
          icon: Car,
          title: 'استلام سريع',
          subtitle: 'للطلاب المفوض بهم',
          color: 'bg-primary text-primary-foreground',
          onClick: onQuickDismissal
        },
        {
          icon: ChartBar,
          title: 'سجل الاستلام',
          subtitle: 'عمليات سابقة',
          color: 'bg-secondary text-secondary-foreground',
          onClick: onViewReports
        }
      ]
    }
    
    // Full actions for parents
    return [
      {
        icon: Car,
        title: 'انصراف سريع',
        subtitle: 'لجميع الأبناء',
        color: 'bg-primary text-primary-foreground',
        onClick: onQuickDismissal
      },
      {
        icon: Warning,
        title: 'طلب طارئ',
        subtitle: 'حالة طوارئ',
        color: 'bg-destructive text-destructive-foreground',
        onClick: onEmergencyRequest
      },
      {
        icon: Users,
        title: 'السائقون المفوضون',
        subtitle: 'إدارة التفويض',
        color: 'bg-accent text-accent-foreground',
        onClick: onManageDelegates
      },
      {
        icon: ChartBar,
        title: 'التقارير',
        subtitle: 'إحصائيات الحضور',
        color: 'bg-secondary text-secondary-foreground',
        onClick: onViewReports
      }
    ]
  }

  const actions = getActionsForRole()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">العمليات السريعة</h2>
      
      <div className={`grid gap-4 ${actions.length === 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {actions.map((action, index) => (
          <Card 
            key={index}
            className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 cursor-pointer group"
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon size={24} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {action.subtitle}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              💡 نصيحة: {userRole === 'authorized_driver' 
                ? 'تأكد من وجود التفويض قبل الوصول للمدرسة'
                : 'يمكنك تفعيل طلب الانصراف تلقائياً عند الاقتراب من المدرسة'
              }
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              تعرف على المزيد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}