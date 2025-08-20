import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { 
  QrCode,
  Copy,
  Download,
  Share,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Shield,
  Smartphone,
  ArrowsClockwise
} from "@phosphor-icons/react"

interface QRCodeData {
  id: string
  studentId: string
  studentName: string
  parentId: string
  driverId?: string
  expiryTime: string
  purpose: 'dismissal' | 'early_dismissal' | 'emergency'
  securityCode: string
  timestamp: string
  used: boolean
}

interface QRCodeGeneratorProps {
  studentId: string
  parentId: string
  driverId?: string
  onCodeGenerated?: (qrData: QRCodeData) => void
}

export function QRCodeGenerator({ studentId, parentId, driverId, onCodeGenerated }: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [purpose, setPurpose] = useState<'dismissal' | 'early_dismissal' | 'emergency'>('dismissal')
  const [validDuration, setValidDuration] = useState('30') // minutes
  const [generatedCode, setGeneratedCode] = useState<QRCodeData | null>(null)

  const generateSecurityCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const generateQRData = (data: any): string => {
    // In a real implementation, this would generate actual QR code data
    // For demo purposes, we'll create a data URL
    const qrData = JSON.stringify(data)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    canvas.width = 200
    canvas.height = 200
    
    // Simple QR-like pattern (for demo)
    ctx.fillStyle = '#000000'
    const blockSize = 10
    const pattern = data.securityCode
    
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern.charCodeAt(i)
      for (let j = 0; j < 20; j++) {
        for (let k = 0; k < 20; k++) {
          if ((char + j + k) % 3 === 0) {
            ctx.fillRect(j * blockSize, k * blockSize, blockSize, blockSize)
          }
        }
      }
    }
    
    return canvas.toDataURL()
  }

  const generateQRCode = async () => {
    const securityCode = generateSecurityCode()
    const expiryTime = new Date(Date.now() + parseInt(validDuration) * 60 * 1000).toISOString()
    
    const qrData: QRCodeData = {
      id: `qr_${Date.now()}`,
      studentId,
      studentName: 'محمد أحمد السعودي', // In real app, fetch from student data
      parentId,
      driverId,
      expiryTime,
      purpose,
      securityCode,
      timestamp: new Date().toISOString(),
      used: false
    }

    setQrCodes(prev => [qrData, ...prev])
    setGeneratedCode(qrData)
    onCodeGenerated?.(qrData)
    
    toast.success('تم إنشاء رمز QR بنجاح')
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ الكود الأمني')
    }).catch(() => {
      toast.error('فشل في نسخ الكود')
    })
  }

  const downloadQRCode = (qrData: QRCodeData) => {
    const dataUrl = generateQRData(qrData)
    const link = document.createElement('a')
    link.download = `qr-code-${qrData.studentName}-${qrData.timestamp}.png`
    link.href = dataUrl
    link.click()
    
    toast.success('تم تحميل رمز QR')
  }

  const isExpired = (expiryTime: string): boolean => {
    return new Date() > new Date(expiryTime)
  }

  const getTimeRemaining = (expiryTime: string): string => {
    const now = new Date().getTime()
    const expiry = new Date(expiryTime).getTime()
    const diff = expiry - now
    
    if (diff <= 0) return 'منتهي الصلاحية'
    
    const minutes = Math.floor(diff / 1000 / 60)
    const seconds = Math.floor((diff / 1000) % 60)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPurposeText = (purpose: string): string => {
    switch (purpose) {
      case 'dismissal': return 'انصراف عادي'
      case 'early_dismissal': return 'استئذان مبكر'
      case 'emergency': return 'حالة طوارئ'
      default: return purpose
    }
  }

  const getPurposeBadgeVariant = (purpose: string) => {
    switch (purpose) {
      case 'dismissal': return 'default'
      case 'early_dismissal': return 'secondary'
      case 'emergency': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                مولد رموز QR
              </CardTitle>
              <CardDescription>
                إنشاء رموز QR آمنة لاستلام الطلاب
              </CardDescription>
            </div>
            <Button onClick={() => setShowGenerator(true)}>
              إنشاء رمز جديد
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Generated QR Codes */}
      <div className="space-y-3">
        {qrCodes.map((qr) => (
          <Card key={qr.id} className={`${isExpired(qr.expiryTime) || qr.used ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPurposeBadgeVariant(qr.purpose)}>
                      {getPurposeText(qr.purpose)}
                    </Badge>
                    {qr.used && <Badge variant="outline">مستخدم</Badge>}
                    {isExpired(qr.expiryTime) && <Badge variant="destructive">منتهي</Badge>}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span>{qr.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>كود الأمان: {qr.securityCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(qr.securityCode)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {isExpired(qr.expiryTime) ? 'منتهي الصلاحية' : `متبقي: ${getTimeRemaining(qr.expiryTime)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* QR Code Display Area */}
                  <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQRCode(qr)}
                      disabled={isExpired(qr.expiryTime) || qr.used}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `رمز QR - ${qr.studentName}`,
                            text: `كود الأمان: ${qr.securityCode}`,
                          })
                        } else {
                          copyToClipboard(`كود الأمان: ${qr.securityCode}`)
                        }
                      }}
                    >
                      <Share className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">لا توجد رموز QR</h3>
            <p className="text-sm text-muted-foreground mb-4">
              لم يتم إنشاء أي رموز QR بعد. انقر على "إنشاء رمز جديد" للبدء.
            </p>
            <Button onClick={() => setShowGenerator(true)}>
              إنشاء أول رمز QR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              إنشاء رمز QR جديد
            </DialogTitle>
            <DialogDescription>
              اختر إعدادات رمز QR الأمني للطالب
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">الغرض من الرمز</Label>
              <Select value={purpose} onValueChange={(value: any) => setPurpose(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dismissal">انصراف عادي</SelectItem>
                  <SelectItem value="early_dismissal">استئذان مبكر</SelectItem>
                  <SelectItem value="emergency">حالة طوارئ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">مدة صلاحية الرمز</Label>
              <Select value={validDuration} onValueChange={setValidDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                  <SelectItem value="360">6 ساعات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {purpose === 'emergency' && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  رموز QR للطوارئ لها أولوية عالية ولا تحتاج موافقات إضافية
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerator(false)}>
              إلغاء
            </Button>
            <Button onClick={generateQRCode}>
              <QrCode className="h-4 w-4 mr-2" />
              إنشاء الرمز
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recently Generated Code Alert */}
      {generatedCode && !isExpired(generatedCode.expiryTime) && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-green-800">تم إنشاء رمز QR بنجاح!</span>
                <div className="text-sm text-green-700 mt-1">
                  كود الأمان: <span className="font-mono font-bold">{generatedCode.securityCode}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedCode.securityCode)}
                >
                  نسخ الكود
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadQRCode(generatedCode)}
                >
                  تحميل
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}