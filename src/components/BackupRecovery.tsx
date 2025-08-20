import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from 'sonner'
import { 
  CloudArrowDown,
  CloudArrowUp,
  Database,
  CheckCircle,
  Warning,
  Clock,
  HardDrive,
  ArrowsClockwise,
  Download,
  Upload,
  ShieldCheck
} from "@phosphor-icons/react"

interface BackupData {
  id: string
  timestamp: string
  size: number
  tables: string[]
  checksum: string
  compressed: boolean
}

interface SyncOperation {
  id: string
  type: 'backup' | 'restore' | 'sync'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: string
  endTime?: string
  error?: string
  itemsProcessed: number
  totalItems: number
}

interface BackupRecoveryProps {
  userRole: 'school_admin' | 'technical_support'
  onBackupComplete?: (backup: BackupData) => void
  onRestoreComplete?: (success: boolean) => void
}

export function BackupRecovery({ userRole, onBackupComplete, onRestoreComplete }: BackupRecoveryProps) {
  const [backupHistory, setBackupHistory] = useKV('backup_history', [])
  const [syncOperations, setSyncOperations] = useKV('sync_operations', [])
  const [autoBackupEnabled, setAutoBackupEnabled] = useKV('auto_backup_enabled', true)
  const [lastSyncTime, setLastSyncTime] = useKV('last_sync_time', null)
  
  const [currentOperation, setCurrentOperation] = useState<SyncOperation | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null)
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    total: 0
  })

  // Critical data tables that need backup
  const criticalTables = [
    'demo_school',
    'demo_students', 
    'demo_teachers',
    'demo_parents',
    'demo_drivers',
    'dismissal_queue',
    'early_dismissal_requests',
    'active_requests',
    'school_notifications',
    'emergency_contacts',
    'security_logs'
  ]

  // Calculate storage usage
  useEffect(() => {
    const calculateStorageUsage = async () => {
      try {
        let totalSize = 0
        const allKeys = await spark.kv.keys()
        
        for (const key of allKeys) {
          const data = await spark.kv.get(key)
          if (data) {
            totalSize += JSON.stringify(data).length
          }
        }
        
        const availableSpace = 5 * 1024 * 1024 // Assume 5MB limit
        setStorageInfo({
          used: totalSize,
          available: availableSpace - totalSize,
          total: availableSpace
        })
      } catch (error) {
        console.error('Error calculating storage:', error)
      }
    }
    
    calculateStorageUsage()
    
    // Recalculate every minute
    const interval = setInterval(calculateStorageUsage, 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-backup every hour if enabled
  useEffect(() => {
    if (!autoBackupEnabled) return
    
    const autoBackup = async () => {
      const now = new Date()
      const lastBackup = backupHistory[0]
      
      if (!lastBackup || (new Date(now.getTime() - new Date(lastBackup.timestamp).getTime()).getTime() > 60 * 60 * 1000)) {
        await performBackup(true)
      }
    }
    
    const interval = setInterval(autoBackup, 60 * 60 * 1000) // Every hour
    return () => clearInterval(interval)
  }, [autoBackupEnabled, backupHistory])

  const performBackup = async (isAuto = false) => {
    const operationId = `backup_${Date.now()}`
    const operation: SyncOperation = {
      id: operationId,
      type: 'backup',
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      itemsProcessed: 0,
      totalItems: criticalTables.length
    }
    
    setCurrentOperation(operation)
    setSyncOperations((prev: SyncOperation[]) => [operation, ...prev])

    try {
      const backupData: Record<string, any> = {}
      let processedItems = 0

      for (const table of criticalTables) {
        const data = await spark.kv.get(table)
        if (data) {
          backupData[table] = data
        }
        
        processedItems++
        const progress = Math.round((processedItems / criticalTables.length) * 100)
        
        setCurrentOperation(prev => prev ? { ...prev, progress, itemsProcessed: processedItems } : null)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Create backup record
      const backupRecord: BackupData = {
        id: `backup_${Date.now()}`,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        tables: criticalTables,
        checksum: generateChecksum(JSON.stringify(backupData)),
        compressed: false
      }

      // Store backup data
      await spark.kv.set(`backup_${backupRecord.id}`, backupData)
      
      // Update backup history
      const updatedHistory = [backupRecord, ...backupHistory].slice(0, 10) // Keep last 10 backups
      setBackupHistory(updatedHistory)

      // Complete operation
      const completedOperation: SyncOperation = {
        ...operation,
        status: 'completed',
        progress: 100,
        endTime: new Date().toISOString(),
        itemsProcessed: criticalTables.length
      }
      
      setCurrentOperation(null)
      setSyncOperations((prev: SyncOperation[]) => 
        prev.map(op => op.id === operationId ? completedOperation : op)
      )

      onBackupComplete?.(backupRecord)
      toast.success(isAuto ? 'تم إنشاء نسخة احتياطية تلقائية' : 'تم إنشاء النسخة الاحتياطية بنجاح')

    } catch (error) {
      const failedOperation: SyncOperation = {
        ...operation,
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      }
      
      setCurrentOperation(null)
      setSyncOperations((prev: SyncOperation[]) => 
        prev.map(op => op.id === operationId ? failedOperation : op)
      )
      
      toast.error('فشل في إنشاء النسخة الاحتياطية')
    }
  }

  const performRestore = async (backup: BackupData) => {
    const operationId = `restore_${Date.now()}`
    const operation: SyncOperation = {
      id: operationId,
      type: 'restore',
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      itemsProcessed: 0,
      totalItems: backup.tables.length
    }
    
    setCurrentOperation(operation)
    setSyncOperations((prev: SyncOperation[]) => [operation, ...prev])

    try {
      const backupData = await spark.kv.get(`backup_${backup.id}`)
      if (!backupData) {
        throw new Error('لم يتم العثور على بيانات النسخة الاحتياطية')
      }

      // Verify checksum
      const currentChecksum = generateChecksum(JSON.stringify(backupData))
      if (currentChecksum !== backup.checksum) {
        throw new Error('فشل التحقق من سلامة البيانات - الملف تالف')
      }

      let processedItems = 0

      for (const table of backup.tables) {
        if (backupData[table]) {
          await spark.kv.set(table, backupData[table])
        }
        
        processedItems++
        const progress = Math.round((processedItems / backup.tables.length) * 100)
        
        setCurrentOperation(prev => prev ? { ...prev, progress, itemsProcessed: processedItems } : null)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Complete operation
      const completedOperation: SyncOperation = {
        ...operation,
        status: 'completed',
        progress: 100,
        endTime: new Date().toISOString(),
        itemsProcessed: backup.tables.length
      }
      
      setCurrentOperation(null)
      setSyncOperations((prev: SyncOperation[]) => 
        prev.map(op => op.id === operationId ? completedOperation : op)
      )

      setLastSyncTime(new Date().toISOString())
      onRestoreComplete?.(true)
      setShowRestoreDialog(false)
      toast.success('تم استعادة البيانات بنجاح')

    } catch (error) {
      const failedOperation: SyncOperation = {
        ...operation,
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      }
      
      setCurrentOperation(null)
      setSyncOperations((prev: SyncOperation[]) => 
        prev.map(op => op.id === operationId ? failedOperation : op)
      )
      
      onRestoreComplete?.(false)
      toast.error('فشل في استعادة البيانات')
    }
  }

  const generateChecksum = (data: string): string => {
    // Simple checksum algorithm
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: SyncOperation['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <Warning className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            معلومات التخزين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>المساحة المستخدمة</span>
              <span>{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}</span>
            </div>
            <Progress value={(storageInfo.used / storageInfo.total) * 100} />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{backupHistory.length}</div>
              <div className="text-sm text-muted-foreground">نسخة احتياطية</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{criticalTables.length}</div>
              <div className="text-sm text-muted-foreground">جدول بيانات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString('ar-SA') : 'لم يتم'}
              </div>
              <div className="text-sm text-muted-foreground">آخر مزامنة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Operation */}
      {currentOperation && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <ArrowsClockwise className="h-5 w-5 animate-spin" />
              {currentOperation.type === 'backup' ? 'جاري إنشاء نسخة احتياطية' : 'جاري استعادة البيانات'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={currentOperation.progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>العناصر المعالجة: {currentOperation.itemsProcessed} / {currentOperation.totalItems}</span>
              <span>{currentOperation.progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudArrowUp className="h-5 w-5" />
            إدارة النسخ الاحتياطية
          </CardTitle>
          <CardDescription>
            إنشاء واستعادة النسخ الاحتياطية للبيانات المهمة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => performBackup(false)} disabled={!!currentOperation}>
              <Upload className="h-4 w-4 mr-2" />
              إنشاء نسخة احتياطية
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
            >
              <Database className="h-4 w-4 mr-2" />
              {autoBackupEnabled ? 'إيقاف' : 'تفعيل'} النسخ التلقائي
            </Button>
          </div>

          {autoBackupEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                تم تفعيل النسخ الاحتياطية التلقائية. سيتم إنشاء نسخة احتياطية كل ساعة.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            سجل النسخ الاحتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupHistory.length > 0 ? (
            <div className="space-y-3">
              {backupHistory.map((backup: BackupData) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {new Date(backup.timestamp).toLocaleString('ar-SA')}
                      </span>
                      <Badge variant="secondary">{formatBytes(backup.size)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {backup.tables.length} جدول • Checksum: {backup.checksum.slice(0, 8)}...
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBackup(backup)
                      setShowRestoreDialog(true)
                    }}
                    disabled={!!currentOperation}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    استعادة
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                لم يتم إنشاء أي نسخ احتياطية بعد. انقر على "إنشاء نسخة احتياطية" لبدء العملية.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sync Operations Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowsClockwise className="h-5 w-5" />
            سجل العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncOperations.slice(0, 5).map((operation: SyncOperation) => (
              <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(operation.status)}
                  <div>
                    <div className="font-medium">
                      {operation.type === 'backup' ? 'نسخ احتياطي' : 
                       operation.type === 'restore' ? 'استعادة بيانات' : 'مزامنة'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(operation.startTime).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={operation.status === 'completed' ? 'default' : 
                                  operation.status === 'failed' ? 'destructive' : 'secondary'}>
                    {operation.status === 'completed' ? 'مكتمل' : 
                     operation.status === 'failed' ? 'فشل' : 'جاري'}
                  </Badge>
                  {operation.error && (
                    <div className="text-xs text-red-600 mt-1">{operation.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Warning className="h-5 w-5" />
              تأكيد استعادة البيانات
            </DialogTitle>
            <DialogDescription>
              هذا الإجراء سيستبدل البيانات الحالية بالبيانات من النسخة الاحتياطية المحددة. 
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>تاريخ النسخة:</strong> {new Date(selectedBackup.timestamp).toLocaleString('ar-SA')}</div>
                    <div><strong>حجم البيانات:</strong> {formatBytes(selectedBackup.size)}</div>
                    <div><strong>عدد الجداول:</strong> {selectedBackup.tables.length}</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBackup && performRestore(selectedBackup)}
              disabled={!!currentOperation}
            >
              <Download className="h-4 w-4 mr-2" />
              استعادة البيانات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}