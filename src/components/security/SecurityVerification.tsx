import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner'
import { 
  Shield,
  ShieldCheck,
  ShieldWarning,
  Eye,
  Camera,
  Fingerprint,
  IdCard,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  User,
  Car,
  Warning
} from "@phosphor-icons/react"

interface SecurityVerificationProps {
  requestData: any
  onVerify: (verified: boolean, notes?: string) => void
  onCancel: () => void
  userRole: 'teacher' | 'school_admin' | 'security_guard'
}

interface VerificationStep {
  id: string
  name: string
  status: 'pending' | 'verified' | 'failed' | 'skipped'
  required: boolean
  description: string
  icon: React.ReactNode
}

export function SecurityVerification({ requestData, onVerify, onCancel, userRole }: SecurityVerificationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [securityLog, setSecurityLog] = useKV('security_verification_log', [])
  const [failureReason, setFailureReason] = useState('')

  const verificationSteps: VerificationStep[] = [
    {
      id: 'identity',
      name: 'التحقق من الهوية',
      status: 'pending',
      required: true,
      description: 'التأكد من هوية الشخص المستلم',
      icon: <IdCard size={20} />
    },
    {
      id: 'authorization',
      name: 'صحة التفويض',
      status: 'pending',
      required: true,
      description: 'التحقق من صحة تفويض الاستلام',
      icon: <Shield size={20} />
    },
    {
      id: 'location',
      name: 'التحقق من الموقع',
      status: 'pending',
      required: false,
      description: 'التأكد من وجود المستلم في المنطقة المحددة',
      icon: <MapPin size={20} />
    },
    {
      id: 'student_verification',
      name: 'التحقق من الطالب',
      status: 'pending',
      required: true,
      description: 'التأكد من هوية الطالب قبل التسليم',
      icon: <User size={20} />
    },
    {
      id: 'photo_verification',
      name: 'التحقق المرئي',
      status: 'pending',
      required: userRole === 'security_guard',
      description: 'التقاط صورة للتوثيق',
      icon: <Camera size={20} />
    }
  ]

  const [steps, setSteps] = useState(verificationSteps)

  const updateStepStatus = (stepId: string, status: 'verified' | 'failed' | 'skipped') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const handleStepVerification = (stepId: string, verified: boolean) => {
    if (verified) {
      updateStepStatus(stepId, 'verified')
      toast.success(`تم التحقق من: ${steps.find(s => s.id === stepId)?.name}`)
      
      // Auto-advance to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      updateStepStatus(stepId, 'failed')
      toast.error(`فشل التحقق من: ${steps.find(s => s.id === stepId)?.name}`)
    }
  }

  const skipStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (step && !step.required) {
      updateStepStatus(stepId, 'skipped')
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const canProceed = () => {
    const requiredSteps = steps.filter(s => s.required)
    const verifiedRequired = requiredSteps.filter(s => s.status === 'verified')
    return verifiedRequired.length === requiredSteps.length
  }

  const hasFailures = () => {
    return steps.some(s => s.status === 'failed')
  }

  const handleFinalVerification = async () => {
    const verificationRecord = {
      id: `verification_${Date.now()}`,
      requestId: requestData.id,
      verifiedBy: userRole,
      timestamp: new Date().toISOString(),
      steps: steps.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        required: s.required
      })),
      notes: verificationNotes,
      result: hasFailures() ? 'failed' : 'passed',
      studentIds: requestData.studentIds,
      requesterId: requestData.requesterId
    }

    // Add to security log
    const updatedLog = [verificationRecord, ...securityLog]
    setSecurityLog(updatedLog)

    if (hasFailures()) {
      // Log security incident
      const incident = {
        id: `incident_${Date.now()}`,
        type: 'verification_failure',
        severity: 'high',
        description: `فشل في التحقق من طلب الاستلام - ${failureReason}`,
        timestamp: new Date().toISOString(),
        involvedParties: {
          requester: requestData.requesterName,
          verifier: userRole,
          students: requestData.studentsData?.map((s: any) => s.name)
        },
        location: 'school_gate',
        resolved: false
      }

      const incidents = await spark.kv.get('security_incidents') || []
      incidents.unshift(incident)
      await spark.kv.set('security_incidents', incidents)
      
      toast.error('فشل في التحقق - تم رفض الطلب وتسجيل الحادث')
      onVerify(false, `فشل التحقق: ${failureReason}`)
    } else {
      toast.success('تم التحقق بنجاح - يمكن المتابعة مع الاستلام')
      onVerify(true, verificationNotes)
    }
  }

  const renderStepContent = (step: VerificationStep) => {
    switch (step.id) {
      case 'identity':
        return (
          <div className="space-y-4">
            <Alert>
              <IdCard size={16} />
              <AlertDescription>
                تحقق من بطاقة الهوية أو رخصة القيادة للشخص المستلم
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>اسم المستلم</Label>
                <p className="mt-1 p-2 bg-muted rounded">{requestData.requesterName}</p>
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <p className="mt-1 p-2 bg-muted rounded">{requestData.carInfo?.requesterInfo?.parentPhone || requestData.carInfo?.requesterInfo?.driverPhone}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleStepVerification('identity', true)}
              >
                <CheckCircle size={16} className="ml-2" />
                تم التحقق
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => {
                  setFailureReason('فشل التحقق من الهوية')
                  handleStepVerification('identity', false)
                }}
              >
                <X size={16} className="ml-2" />
                فشل التحقق
              </Button>
            </div>
          </div>
        )

      case 'authorization':
        return (
          <div className="space-y-4">
            <Alert>
              <Shield size={16} />
              <AlertDescription>
                تحقق من صحة تفويض الشخص لاستلام الطالب/الطلاب
              </AlertDescription>
            </Alert>

            {requestData.carInfo?.requesterInfo?.type === 'authorized_driver' && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded">
                <h4 className="font-medium text-warning-foreground mb-2">سائق مفوض</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">الاسم:</span> {requestData.carInfo.requesterInfo.driverName}</p>
                  <p><span className="font-medium">الصلة:</span> {requestData.carInfo.requesterInfo.relationship}</p>
                  <p><span className="font-medium">رقم الهوية:</span> {requestData.carInfo.requesterInfo.nationalId}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleStepVerification('authorization', true)}
              >
                <ShieldCheck size={16} className="ml-2" />
                التفويض صحيح
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => {
                  setFailureReason('تفويض غير صحيح أو منتهي الصلاحية')
                  handleStepVerification('authorization', false)
                }}
              >
                <ShieldWarning size={16} className="ml-2" />
                تفويض غير صحيح
              </Button>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-4">
            <Alert>
              <MapPin size={16} />
              <AlertDescription>
                تحقق من وجود المركبة في المنطقة المخصصة للاستلام
              </AlertDescription>
            </Alert>

            <div className="text-sm">
              <Label>معلومات المركبة</Label>
              <div className="mt-2 p-3 bg-muted rounded space-y-1">
                <p><span className="font-medium">النوع:</span> {requestData.carInfo?.type}</p>
                <p><span className="font-medium">اللون:</span> {requestData.carInfo?.color}</p>
                <p><span className="font-medium">رقم اللوحة:</span> {requestData.carInfo?.plateNumber}</p>
                <p><span className="font-medium">الموقع:</span> {requestData.carInfo?.location}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleStepVerification('location', true)}
              >
                <MapPin size={16} className="ml-2" />
                موقع صحيح
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => skipStep('location')}
              >
                تخطي
              </Button>
            </div>
          </div>
        )

      case 'student_verification':
        return (
          <div className="space-y-4">
            <Alert>
              <User size={16} />
              <AlertDescription>
                تحقق من هوية الطالب/الطلاب قبل التسليم
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-32">
              <div className="space-y-2">
                {requestData.studentsData?.map((student: any, index: number) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.grade} - {student.section}</p>
                    </div>
                    <Badge variant="secondary">{student.status}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleStepVerification('student_verification', true)}
              >
                <User size={16} className="ml-2" />
                تم التحقق
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => {
                  setFailureReason('عدم تطابق هوية الطالب')
                  handleStepVerification('student_verification', false)
                }}
              >
                <X size={16} className="ml-2" />
                عدم التطابق
              </Button>
            </div>
          </div>
        )

      case 'photo_verification':
        return (
          <div className="space-y-4">
            <Alert>
              <Camera size={16} />
              <AlertDescription>
                {step.required ? 'التقط صورة للتوثيق (مطلوب)' : 'التقط صورة للتوثيق (اختياري)'}
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button variant="outline" className="mb-4">
                <Camera size={16} className="ml-2" />
                التقاط صورة
              </Button>
              <p className="text-sm text-muted-foreground">
                سيتم حفظ الصورة مع السجل الأمني
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleStepVerification('photo_verification', true)}
              >
                <CheckCircle size={16} className="ml-2" />
                تم التقاط الصورة
              </Button>
              {!step.required && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => skipStep('photo_verification')}
                >
                  تخطي
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return <div>خطوة غير معروفة</div>
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield size={24} className="text-primary" />
            التحقق الأمني من طلب الاستلام
          </DialogTitle>
          <DialogDescription>
            اتبع خطوات التحقق للتأكد من صحة وأمان عملية الاستلام
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 px-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.status === 'verified' ? 'bg-secondary text-secondary-foreground' :
                    step.status === 'failed' ? 'bg-destructive text-destructive-foreground' :
                    step.status === 'skipped' ? 'bg-muted text-muted-foreground' :
                    index === currentStep ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'}
                `}>
                  {step.status === 'verified' ? <CheckCircle size={16} /> :
                   step.status === 'failed' ? <X size={16} /> :
                   step.status === 'skipped' ? <Warning size={16} /> :
                   step.icon}
                </div>
                <span className="text-xs text-center max-w-16">
                  {step.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <ScrollArea className="h-64 mb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                {steps[currentStep]?.icon}
                <div>
                  <h3 className="font-medium">{steps[currentStep]?.name}</h3>
                  <p className="text-sm text-muted-foreground">{steps[currentStep]?.description}</p>
                  {steps[currentStep]?.required && (
                    <Badge variant="destructive" className="text-xs mt-1">مطلوب</Badge>
                  )}
                </div>
              </div>

              {renderStepContent(steps[currentStep])}
            </div>
          </ScrollArea>

          {/* Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              التالي
            </Button>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              placeholder="أضف أي ملاحظات حول عملية التحقق..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          
          {hasFailures() ? (
            <Button 
              variant="destructive" 
              onClick={handleFinalVerification}
            >
              <X size={16} className="ml-2" />
              رفض الطلب
            </Button>
          ) : (
            <Button 
              onClick={handleFinalVerification}
              disabled={!canProceed()}
            >
              <CheckCircle size={16} className="ml-2" />
              الموافقة على الاستلام
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}