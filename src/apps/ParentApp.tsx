import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Header } from '../components/Header'
import { StudentGrid } from '../components/StudentGrid'
import { StatusBar } from '../components/StatusBar'
import { QuickActions } from '../components/QuickActions'
import { DismissalRequest } from '../components/DismissalRequest'
import { EarlyDismissal } from '../components/EarlyDismissal'
import { DelegateManagement } from '../components/DelegateManagement'
import { toast } from 'sonner'

interface ParentAppProps {
  user: any
  onLogout: () => void
}

export function ParentApp({ user, onLogout }: ParentAppProps) {
  const [currentView, setCurrentView] = useState('home')
  
  // Load student data for this parent
  const [students, setStudents] = useKV('parent_students', [])
  const [dismissalQueue, setDismissalQueue] = useKV('dismissal_queue', {
    isActive: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitTime: 0,
    requestId: null
  })
  
  const [location, setLocation] = useKV('user_location', {
    latitude: 0,
    longitude: 0,
    distanceFromSchool: 1200 // Default distance
  })

  // Load parent's children on mount
  useEffect(() => {
    const loadParentData = async () => {
      try {
        const demoStudents = await spark.kv.get('demo_students') || []
        const parentStudents = demoStudents.filter(s => s.guardianId === user.id)
        
        const studentsWithStatus = parentStudents.map(student => ({
          ...student,
          status: 'present',
          canRequestDismissal: true,
          school: 'مدرسة النور الابتدائية'
        }))
        
        setStudents(studentsWithStatus)
      } catch (error) {
        console.error('Error loading parent data:', error)
      }
    }

    loadParentData()
  }, [user.id, setStudents])

  // Simulate GPS tracking
  useEffect(() => {
    const updateLocation = () => {
      // Simulate getting closer to school during dismissal time
      const now = new Date()
      const dismissalHour = 12 // 12:30 PM
      const currentHour = now.getHours()
      
      if (currentHour >= dismissalHour - 1 && currentHour <= dismissalHour + 1) {
        // Gradually get closer during dismissal time
        const distance = Math.max(50, 1200 - (Math.random() * 200))
        setLocation(prev => ({ ...prev, distanceFromSchool: distance }))
      }
    }

    const interval = setInterval(updateLocation, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [setLocation])

  const handleDismissalRequest = async (selectedStudents: string[], carInfo: any) => {
    try {
      const request = {
        id: `req_${Date.now()}`,
        parentId: user.id,
        studentIds: selectedStudents,
        carInfo,
        status: 'pending',
        requestTime: new Date().toISOString(),
        queuePosition: Math.floor(Math.random() * 10) + 1,
        estimatedWaitTime: Math.floor(Math.random() * 15) + 5
      }

      await spark.kv.set('dismissal_request', request)
      
      setDismissalQueue({
        isActive: true,
        position: request.queuePosition,
        totalInQueue: request.queuePosition + Math.floor(Math.random() * 5),
        estimatedWaitTime: request.estimatedWaitTime,
        requestId: request.id
      })

      toast.success('تم إرسال طلب الانصراف بنجاح')
      setCurrentView('home')
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب')
    }
  }

  const handleEarlyDismissal = async (studentId: string, reason: string, attachments: any[]) => {
    try {
      const request = {
        id: `early_${Date.now()}`,
        parentId: user.id,
        studentId,
        reason,
        attachments,
        status: 'pending_approval',
        requestTime: new Date().toISOString()
      }

      await spark.kv.set('early_dismissal_request', request)
      toast.success('تم إرسال طلب الاستئذان المبكر، في انتظار موافقة الإدارة')
      setCurrentView('home')
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب')
    }
  }

  const renderView = () => {
    switch(currentView) {
      case 'dismissal-request':
        return <DismissalRequest 
          students={students}
          onBack={() => setCurrentView('home')}
          onSubmit={handleDismissalRequest}
        />
      case 'early-dismissal':
        return <EarlyDismissal 
          students={students}
          onBack={() => setCurrentView('home')}
          onSubmit={handleEarlyDismissal}
        />
      case 'delegates':
        return <DelegateManagement 
          onBack={() => setCurrentView('home')}
        />
      default:
        return (
          <>
            <Header user={user} onLogout={onLogout} />
            
            <StatusBar 
              distanceFromSchool={location.distanceFromSchool}
              dismissalQueue={dismissalQueue}
              onActivateRequest={() => setCurrentView('dismissal-request')}
            />
            
            <main className="flex-1 p-4 space-y-6">
              <StudentGrid 
                students={students}
                onRequestDismissal={() => setCurrentView('dismissal-request')}
                onEarlyDismissal={() => setCurrentView('early-dismissal')}
              />
              
              <QuickActions 
                onQuickDismissal={() => setCurrentView('dismissal-request')}
                onEmergencyRequest={() => setCurrentView('early-dismissal')} 
                onManageDelegates={() => setCurrentView('delegates')}
                onViewReports={() => toast.info('التقارير قيد التطوير')}
              />
            </main>
          </>
        )
    }
  }

  return renderView()
}