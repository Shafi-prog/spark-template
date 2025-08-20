import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner'
import { 
  Phone,
  PhoneCall,
  Warning,
  CheckCircle,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Plus,
  Trash,
  Edit,
  Heart
} from "@phosphor-icons/react"

interface EmergencyContact {
  id: string
  name: string
  nameEn: string
  phone: string
  relationship: string
  relationshipEn: string
  priority: number
  verified: boolean
  canPickup: boolean
  notes?: string
  lastContacted?: string
}

interface EmergencyProtocol {
  id: string
  situation: string
  steps: string[]
  contactOrder: string[]
  escalationTime: number // minutes
  requiresApproval: boolean
  medicalAlert?: boolean
}

interface EmergencySystemProps {
  studentId: string
  userRole: 'parent' | 'teacher' | 'school_admin'
  onEmergencyDeclared?: (type: string, details: any) => void
}

export function EmergencySystem({ studentId, userRole, onEmergencyDeclared }: EmergencySystemProps) {
  const [emergencyContacts, setEmergencyContacts] = useKV(`emergency_contacts_${studentId}`, [])
  const [emergencyProtocols, setEmergencyProtocols] = useKV('emergency_protocols', [])
  const [activeEmergencies, setActiveEmergencies] = useKV('active_emergencies', [])
  
  const [showAddContact, setShowAddContact] = useState(false)
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocol | null>(null)
  const [emergencyDetails, setEmergencyDetails] = useState('')
  const [contactingOrder, setContactingOrder] = useState<string[]>([])
  
  const [newContact, setNewContact] = useState({
    name: '',
    nameEn: '',
    phone: '',
    relationship: '',
    relationshipEn: '',
    canPickup: false,
    notes: ''
  })

  // Initialize default emergency protocols
  useEffect(() => {
    const initializeProtocols = async () => {
      const existingProtocols = await spark.kv.get('emergency_protocols')
      if (!existingProtocols || existingProtocols.length === 0) {
        const defaultProtocols: EmergencyProtocol[] = [
          {
            id: 'medical_emergency',
            situation: 'طوارئ طبية',
            steps: [
              'الاتصال بالإسعاف فوراً',
              'إخطار ولي الأمر',
              'إخطار إدارة المدرسة',
              'توثيق الحادث',
              'متابعة الحالة'
            ],
            contactOrder: ['medical_services', 'primary_guardian', 'school_admin'],
            escalationTime: 5,
            requiresApproval: false,
            medicalAlert: true
          },
          {
            id: 'natural_disaster',
            situation: 'كوارث طبيعية',
            steps: [
              'تفعيل خطة الطوارئ',
              'إخلاء آمن للطلاب',
              'إخطار أولياء الأمور',
              'التنسيق مع الجهات المختصة',
              'إعداد تقرير شامل'
            ],
            contactOrder: ['emergency_services', 'all_guardians', 'education_ministry'],
            escalationTime: 2,
            requiresApproval: true,
            medicalAlert: false
          },
          {
            id: 'security_threat',
            situation: 'تهديد أمني',
            steps: [
              'تأمين المبنى',
              'إخطار الشرطة',
              'عزل التهديد',
              'إخطار أولياء الأمور',
              'التحقق من سلامة الجميع'
            ],
            contactOrder: ['police', 'school_security', 'all_guardians'],
            escalationTime: 3,
            requiresApproval: true,
            medicalAlert: false
          },
          {
            id: 'student_injury',
            situation: 'إصابة طالب',
            steps: [
              'تقديم الإسعافات الأولية',
              'تقييم شدة الإصابة',
              'إخطار ولي الأمر',
              'نقل للمستشفى إذا لزم الأمر',
              'توثيق الحادث'
            ],
            contactOrder: ['school_nurse', 'primary_guardian', 'medical_services'],
            escalationTime: 10,
            requiresApproval: false,
            medicalAlert: true
          }
        ]
        
        await spark.kv.set('emergency_protocols', defaultProtocols)
        setEmergencyProtocols(defaultProtocols)
      }
    }
    
    initializeProtocols()
  }, [])

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }

    const contact: EmergencyContact = {
      id: `contact_${Date.now()}`,
      ...newContact,
      priority: emergencyContacts.length + 1,
      verified: false
    }

    const updatedContacts = [...emergencyContacts, contact]
    setEmergencyContacts(updatedContacts)
    
    // Reset form
    setNewContact({
      name: '',
      nameEn: '',
      phone: '',
      relationship: '',
      relationshipEn: '',
      canPickup: false,
      notes: ''
    })
    
    setShowAddContact(false)
    toast.success('تم إضافة جهة الاتصال للطوارئ')
  }

  const handleRemoveContact = async (contactId: string) => {
    const updatedContacts = emergencyContacts.filter((contact: EmergencyContact) => contact.id !== contactId)
    setEmergencyContacts(updatedContacts)
    toast.success('تم حذف جهة الاتصال')
  }

  const handleDeclareEmergency = async () => {
    if (!selectedProtocol) {
      toast.error('يرجى اختيار نوع الطارئ')
      return
    }

    const emergency = {
      id: `emergency_${Date.now()}`,
      studentId,
      protocolId: selectedProtocol.id,
      situation: selectedProtocol.situation,
      details: emergencyDetails,
      declaredBy: userRole,
      declaredAt: new Date().toISOString(),
      status: 'active',
      contactsNotified: [],
      stepsCompleted: []
    }

    const updatedEmergencies = [...activeEmergencies, emergency]
    setActiveEmergencies(updatedEmergencies)

    // Start emergency protocol
    startEmergencyProtocol(emergency, selectedProtocol)
    
    onEmergencyDeclared?.(selectedProtocol.situation, emergency)
    setShowEmergencyDialog(false)
    toast.error(`تم إعلان حالة طوارئ: ${selectedProtocol.situation}`)
  }

  const startEmergencyProtocol = async (emergency: any, protocol: EmergencyProtocol) => {
    // Start contacting according to protocol order
    const contactOrder = protocol.contactOrder
    setContactingOrder(contactOrder)

    // Simulate emergency notifications
    for (let i = 0; i < contactOrder.length; i++) {
      const contactType = contactOrder[i]
      
      setTimeout(() => {
        toast.info(`جاري الاتصال بـ: ${getContactTypeName(contactType)}`)
      }, i * 2000)
    }
  }

  const getContactTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'medical_services': 'الخدمات الطبية',
      'primary_guardian': 'ولي الأمر الأساسي',
      'school_admin': 'إدارة المدرسة',
      'emergency_services': 'خدمات الطوارئ',
      'all_guardians': 'جميع أولياء الأمور',
      'police': 'الشرطة',
      'school_security': 'أمن المدرسة',
      'school_nurse': 'ممرضة المدرسة'
    }
    return names[type] || type
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="destructive">الأول</Badge>
    if (priority === 2) return <Badge variant="secondary">الثاني</Badge>
    return <Badge variant="outline">{priority}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Emergency Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-destructive" />
            جهات الاتصال للطوارئ
          </CardTitle>
          <CardDescription>
            إدارة جهات الاتصال في حالات الطوارئ للطالب
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {emergencyContacts.length} جهة اتصال مسجلة
            </div>
            <Button onClick={() => setShowAddContact(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              إضافة جهة اتصال
            </Button>
          </div>

          <div className="space-y-3">
            {emergencyContacts.map((contact: EmergencyContact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    {getPriorityBadge(contact.priority)}
                  </div>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {contact.relationship} • {contact.phone}
                    </div>
                    {contact.canPickup && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        مفوض بالاستلام
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contact.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContact(contact.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {emergencyContacts.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لم يتم إضافة أي جهات اتصال للطوارئ بعد. يُنصح بإضافة جهتين على الأقل.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Emergency Protocols Section */}
      {userRole === 'school_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              بروتوكولات الطوارئ
            </CardTitle>
            <CardDescription>
              إدارة وتفعيل بروتوكولات الطوارئ المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyProtocols.map((protocol: EmergencyProtocol) => (
                <div key={protocol.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{protocol.situation}</h3>
                    {protocol.medicalAlert && (
                      <Heart className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {protocol.steps.length} خطوات • زمن التصعيد: {protocol.escalationTime} دقائق
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedProtocol(protocol)
                      setShowEmergencyDialog(true)
                    }}
                  >
                    تفعيل البروتوكول
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Emergencies */}
      {activeEmergencies.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              حالات الطوارئ النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {activeEmergencies.map((emergency: any) => (
                  <Alert key={emergency.id} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{emergency.situation}</div>
                      <div className="text-xs opacity-80">
                        {new Date(emergency.declaredAt).toLocaleString('ar-SA')}
                      </div>
                      {emergency.details && (
                        <div className="text-sm mt-1">{emergency.details}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة جهة اتصال للطوارئ</DialogTitle>
            <DialogDescription>
              أدخل معلومات جهة الاتصال التي يمكن الوصول إليها في حالات الطوارئ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم بالعربية</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="nameEn"
                  value={newContact.nameEn}
                  onChange={(e) => setNewContact(prev => ({ ...prev, nameEn: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+966501234567"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="relationship">صلة القرابة (عربي)</Label>
                <Select onValueChange={(value) => setNewContact(prev => ({ ...prev, relationship: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر صلة القرابة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أب">أب</SelectItem>
                    <SelectItem value="أم">أم</SelectItem>
                    <SelectItem value="أخ">أخ</SelectItem>
                    <SelectItem value="أخت">أخت</SelectItem>
                    <SelectItem value="عم">عم</SelectItem>
                    <SelectItem value="خال">خال</SelectItem>
                    <SelectItem value="جد">جد</SelectItem>
                    <SelectItem value="جدة">جدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="relationshipEn">Relationship (English)</Label>
                <Select onValueChange={(value) => setNewContact(prev => ({ ...prev, relationshipEn: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Uncle">Uncle</SelectItem>
                    <SelectItem value="Grandfather">Grandfather</SelectItem>
                    <SelectItem value="Grandmother">Grandmother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                placeholder="أي ملاحظات مهمة..."
                value={newContact.notes}
                onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddContact}>
              إضافة جهة الاتصال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Declaration Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              إعلان حالة طوارئ
            </DialogTitle>
            <DialogDescription>
              اختر نوع الطارئ وأدخل التفاصيل. سيتم تفعيل البروتوكول المناسب فوراً.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>نوع الطارئ</Label>
              <Select onValueChange={(value) => {
                const protocol = emergencyProtocols.find((p: EmergencyProtocol) => p.id === value)
                setSelectedProtocol(protocol)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطارئ" />
                </SelectTrigger>
                <SelectContent>
                  {emergencyProtocols.map((protocol: EmergencyProtocol) => (
                    <SelectItem key={protocol.id} value={protocol.id}>
                      <div className="flex items-center gap-2">
                        {protocol.medicalAlert && <Heart className="h-4 w-4 text-red-500" />}
                        {protocol.situation}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProtocol && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">خطوات البروتوكول:</div>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {selectedProtocol.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="emergencyDetails">تفاصيل الحالة</Label>
              <Textarea
                id="emergencyDetails"
                placeholder="وصف مفصل للحالة الطارئة..."
                value={emergencyDetails}
                onChange={(e) => setEmergencyDetails(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeclareEmergency}
              disabled={!selectedProtocol}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              إعلان الطوارئ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}