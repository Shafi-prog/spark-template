import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, GraduationCap, School, Users } from "@phosphor-icons/react"

interface UserSelectionProps {
  onSelectUserType: (userType: string) => void
}

export function UserSelection({ onSelectUserType }: UserSelectionProps) {
  const userTypes = [
    {
      id: 'parent',
      title: 'ولي أمر',
      description: 'لطلب انصراف الأبناء ومتابعة حالتهم',
      icon: UserCheck,
      color: 'bg-primary',
      textColor: 'text-primary-foreground'
    },
    {
      id: 'teacher', 
      title: 'معلم/معلمة',
      description: 'لاستلام الإشعارات وتحضير الطلاب',
      icon: GraduationCap,
      color: 'bg-secondary',
      textColor: 'text-secondary-foreground'
    },
    {
      id: 'school_admin',
      title: 'إدارة المدرسة',
      description: 'لإدارة النظام ومراقبة العمليات',
      icon: School,
      color: 'bg-accent',
      textColor: 'text-accent-foreground'
    },
    {
      id: 'delegate',
      title: 'مفوض',
      description: 'لاستلام الطلاب بالنيابة عن ولي الأمر',
      icon: Users,
      color: 'bg-warning',
      textColor: 'text-warning-foreground'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
            <School size={40} className="text-primary-foreground" weight="duotone" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">نظام إدارة انصراف الطلاب</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            نظام ذكي لإدارة عملية انصراف الطلاب بطريقة آمنة ومنظمة
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userTypes.map((userType) => {
            const IconComponent = userType.icon
            return (
              <Card 
                key={userType.id}
                className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/20 cursor-pointer group"
                onClick={() => onSelectUserType(userType.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${userType.color} rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300`}>
                    <IconComponent size={32} className={userType.textColor} weight="duotone" />
                  </div>
                  <CardTitle className="text-2xl">{userType.title}</CardTitle>
                  <CardDescription className="text-base">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    دخول كـ {userType.title}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 نظام إدارة انصراف الطلاب الذكي - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  )
}