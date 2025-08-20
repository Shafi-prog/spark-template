import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Phone } from "@phosphor-icons/react"

interface LoginScreenProps {
  onLogin: (userData: any) => void
  onBack: () => void
}

export function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)

  // Demo users for different roles
  const demoUsers = {
    '+966501234567': {
      id: 'parent-1',
      name: 'أحمد محمد السعودي',
      role: 'parent',
      phone: '+966501234567',
      children: ['student-1', 'student-2']
    },
    '+966501234568': {
      id: 'teacher-1', 
      name: 'أستاذة مريم العتيبي',
      role: 'teacher',
      phone: '+966501234568',
      schoolId: 'school-1',
      classes: [{ grade: 'الصف الثالث', section: 'أ' }]
    },
    '+966501234569': {
      id: 'admin-1',
      name: 'الأستاذ خالد الأحمد',
      role: 'school_admin', 
      phone: '+966501234569',
      schoolId: 'school-1',
      position: 'مدير المدرسة'
    }
  }

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setStep('otp')
  }

  const handleVerifyOTP = async () => {
    if (otp !== '123456') {
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Find demo user or create parent user
    const userData = demoUsers[phone as keyof typeof demoUsers] || {
      id: 'demo-user',
      name: 'مستخدم تجريبي',
      role: 'parent',
      phone: phone,
      children: []
    }

    setIsLoading(false)
    onLogin(userData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute right-4 top-4"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Phone size={24} className="text-primary-foreground" weight="duotone" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'تسجيل الدخول' : 'رمز التحقق'}
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'أدخل رقم جوالك لإرسال رمز التحقق'
              : `تم إرسال رمز التحقق إلى ${phone}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="5xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone('+966' + e.target.value.replace(/^\+966/, ''))}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <Button 
                className="w-full"
                size="lg"
                onClick={handleSendOTP}
                disabled={isLoading || !phone || phone.length < 13}
              >
                {isLoading ? 'جار الإرسال...' : 'إرسال رمز التحقق'}
              </Button>

              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                <p className="font-medium mb-2">للتجربة استخدم:</p>
                <p>• +966501234567 (ولي أمر)</p>
                <p>• +966501234568 (معلمة)</p>
                <p>• +966501234569 (إدارة)</p>
                <p className="mt-2 text-xs">رمز التحقق: 123456</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button
                className="w-full"
                size="lg" 
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'جار التحقق...' : 'تأكيد'}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('phone')}
              >
                تغيير رقم الجوال
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}