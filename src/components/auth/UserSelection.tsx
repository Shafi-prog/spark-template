import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, GraduationCap, Shield, Car } from '@phosphor-icons/react'

interface UserSelectionProps {
  onSelectUserType: (userType: string) => void
}

export function UserSelection({ onSelectUserType }: UserSelectionProps) {
  const userTypes = [
    {
      id: 'parent',
      title: 'ولي الأمر',
      titleEn: 'Parent/Guardian',
      description: 'طلب انصراف الأبناء ومتابعة حضورهم',
      icon: User,
      color: 'bg-primary text-primary-foreground',
      features: [
        'طلب الانصراف العادي والطارئ',
        'تفويض السائقين والأقارب',
        'متابعة حضور الأبناء',
        'استقبال الإشعارات الفورية'
      ]
    },
    {
      id: 'authorized_driver',
      title: 'السائق المفوض',
      titleEn: 'Authorized Driver',
      description: 'استلام الطلاب بتفويض من ولي الأمر',
      icon: Car,
      color: 'bg-secondary text-secondary-foreground',
      features: [
        'استلام الطلاب المفوض بهم',
        'تأكيد الاستلام',
        'تلقي إشعارات النداء',
        'عرض الطلاب المصرح لهم'
      ]
    },
    {
      id: 'teacher',
      title: 'المعلم/المعلمة',
      titleEn: 'Teacher',
      description: 'إدارة طلاب الفصل وتنسيق الانصراف',
      icon: GraduationCap,
      color: 'bg-accent text-accent-foreground',
      features: [
        'استقبال طلبات الاستئذان المعتمدة',
        'تحضير الطلاب للخروج',
        'تأكيد خروج الطلاب من الفصل',
        'متابعة الجدول الدراسي'
      ]
    },
    {
      id: 'school_admin',
      title: 'إدارة المدرسة',
      titleEn: 'School Administration',
      description: 'إدارة شاملة لنظام انصراف المدرسة',
      icon: Shield,
      color: 'bg-warning text-warning-foreground',
      features: [
        'مراقبة جميع طلبات الانصراف',
        'الموافقة على الاستئذان المبكر',
        'إدارة إعدادات المدرسة',
        'عرض التقارير والإحصائيات'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap size={48} className="text-primary-foreground" weight="fill" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            نظام إدارة انصراف الطلاب الذكي
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Smart School Dismissal Management System
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختر نوع المستخدم للدخول إلى النظام المناسب لك
          </p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {userTypes.map((userType) => {
            const IconComponent = userType.icon
            return (
              <Card key={userType.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 ${userType.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={32} weight="fill" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {userType.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {userType.titleEn}
                    </p>
                    <p className="text-muted-foreground">
                      {userType.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {userType.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => onSelectUserType(userType.id)}
                    className="w-full"
                    size="lg"
                  >
                    دخول كـ {userType.title}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* System Features */}
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">مميزات النظام</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Shield size={24} className="text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">أمان عالي</h3>
                <p className="text-sm text-muted-foreground">
                  تأكيد هوية المستلم وضمان تسليم آمن للطلاب
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                  <GraduationCap size={24} className="text-accent" />
                </div>
                <h3 className="font-semibold mb-2">سهولة الاستخدام</h3>
                <p className="text-sm text-muted-foreground">
                  واجهة بسيطة وسهلة لجميع أنواع المستخدمين
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                  <User size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-2">توفير الوقت</h3>
                <p className="text-sm text-muted-foreground">
                  تقليل وقت الانتظار من 30 دقيقة إلى أقل من 5 دقائق
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2024 نظام إدارة انصراف الطلاب الذكي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}