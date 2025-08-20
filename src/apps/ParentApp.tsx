import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { Header } from '../components/Header'
import { StudentGrid } from '../components/StudentGrid'
import { StatusBar } from '../components/StatusBar'
import { QuickActions } from '../components/QuickActions'
import { DismissalRequest } from '../components/DismissalRequest'
import { EarlyDismissal } from '../components/EarlyDismissal'
import { DelegateManagement } from '../components/DelegateManagement'
import { AuthorizedDriverView } from '../components/AuthorizedDriverView'
import { LocationService } from '../components/location/LocationService'
import { OfflineManager } from '../components/offline/OfflineManager'

interface ParentAppProps {
  user: any
  onLogout: () => void
}

export function ParentApp({ user, onLogout }: ParentAppProps) {
  const [currentView, setCurrentView] = useState('home')
  
  // Load student data based on user role
  const [students, setStudents] = useKV('user_students', [])
  const [dismissalQueue, setDismissalQueue] = useKV('dismissal_queue', {
    isActive: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitTime: 0,
    requestId: null,
    calledStudents: []
  })
  
  const [location, setLocation] = useKV('user_location', {
    latitude: 24.7136,
    longitude: 46.6753,
    distanceFromSchool: 1200 // Default distance in meters
  })

  const [activeRequests, setActiveRequests] = useKV('active_requests', [])

  // Load user's authorized students based on role
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const demoStudents = await spark.kv.get('demo_students') || []
        let authorizedStudents = []

        if (user?.role === 'parent' && user?.children && Array.isArray(user.children)) {
          // Parent can access their own children
          authorizedStudents = (Array.isArray(demoStudents) ? demoStudents : [])
            .filter(s => user.children.includes(s?.id))
        } else if (user?.role === 'authorized_driver' && user?.authorizedStudents && Array.isArray(user.authorizedStudents)) {
          // Authorized driver can access delegated children
          authorizedStudents = (Array.isArray(demoStudents) ? demoStudents : [])
            .filter(s => user.authorizedStudents.includes(s?.id))
        }
        
        const studentsWithStatus = (Array.isArray(authorizedStudents) ? authorizedStudents : [])
          .map(student => ({
          ...student,
          status: getCurrentStudentStatus(student),
          canRequestDismissal: canRequestDismissal(student),
          canRequestEarly: user?.role === 'parent', // Only parents can request early dismissal
          school: 'مدرسة النور الابتدائية'
        }))
        
        setStudents(studentsWithStatus)
      } catch (error) {
        console.error('Error loading user data:', error)
        setStudents([]) // Ensure students is always an array
      }
    }

    if (user) {
      loadUserData()
    }
  }, [user])

  // Helper functions
  const getCurrentStudentStatus = (student: any) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // School hours: 7:30 AM - 12:30 PM
    if (currentHour < 7 || (currentHour === 7 && currentMinute < 30)) {
      return 'not_arrived'
    } else if (currentHour > 12 || (currentHour === 12 && currentMinute > 30)) {
      return 'dismissed'
    } else {
      return 'present'
    }
  }

  const canRequestDismissal = (student: any) => {
    const now = new Date()
    const dismissalTime = new Date()
    dismissalTime.setHours(12, 20, 0) // 10 minutes before official dismissal
    
    return now >= dismissalTime && location.distanceFromSchool <= 100
  }

  // Simulate GPS tracking with more realistic behavior
  useEffect(() => {
    const updateLocation = () => {
      const now = new Date()
      const dismissalHour = 12
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Simulate approaching school during dismissal time
      if (currentHour >= dismissalHour - 1 && currentHour <= dismissalHour + 1) {
        // Gradually get closer to school
        const timeToDismisal = (dismissalHour * 60 + 30) - (currentHour * 60 + currentMinute)
        if (timeToDismisal <= 30 && timeToDismisal >= -30) {
          // Within 30 minutes of dismissal time
          const maxDistance = Math.max(30, Math.abs(timeToDismisal) * 20)
          setLocation(prev => ({ 
            ...prev, 
            distanceFromSchool: Math.max(25, maxDistance + (Math.random() * 20 - 10))
          }))
        }
      }
    }

    const interval = setInterval(updateLocation, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Handle dismissal request
  const handleDismissalRequest = async (selectedStudents: string[], carInfo: any, requestType = 'regular') => {
    try {
      const studentsData = (Array.isArray(students) ? students : []).filter(s => selectedStudents.includes(s?.id))
      
      const request = {
        id: `req_${Date.now()}`,
        requesterId: user.id,
        requesterName: user.name,
        requesterRole: user.role,
        studentIds: selectedStudents,
        studentsData,
        carInfo,
        type: requestType,
        status: 'queued',
        requestTime: new Date().toISOString(),
        location: location,
        queuePosition: Math.floor(Math.random() * 8) + 1,
        estimatedWaitTime: Math.floor(Math.random() * 12) + 3
      }

      // Add to active requests queue
      const currentRequests = await spark.kv.get('active_requests') || []
      currentRequests.push(request)
      await spark.kv.set('active_requests', currentRequests)
      
      setDismissalQueue({
        isActive: true,
        position: request.queuePosition,
        totalInQueue: request.queuePosition + Math.floor(Math.random() * 7) + 2,
        estimatedWaitTime: request.estimatedWaitTime,
        requestId: request.id,
        calledStudents: []
      })

      // Notify school dashboard
      const schoolNotification = {
        id: `notif_${Date.now()}`,
        type: 'dismissal_request',
        title: 'طلب انصراف جديد',
        message: `${user.name} يطلب انصراف ${studentsData.length} طالب`,
        data: request,
        timestamp: new Date().toISOString(),
        read: false
      }
      
      const notifications = await spark.kv.get('school_notifications') || []
      notifications.unshift(schoolNotification)
      await spark.kv.set('school_notifications', notifications)

      toast.success(`تم إرسال طلب الانصراف بنجاح - ترتيبك ${request.queuePosition}`)
      setCurrentView('home')

      // Simulate queue progression
      simulateQueueProgress(request.id)
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب')
    }
  }

  // Handle early dismissal request (parents only)
  const handleEarlyDismissal = async (studentId: string, reason: string, reasonCategory: string, attachments: any[]) => {
    if (user.role !== 'parent') {
      toast.error('السائقون المفوضون لا يمكنهم طلب الاستئذان المبكر')
      return
    }

    try {
      const studentData = (Array.isArray(students) ? students : []).find(s => s?.id === studentId)
      
      const request = {
        id: `early_${Date.now()}`,
        parentId: user.id,
        parentName: user.name,
        studentId,
        studentData,
        reason,
        reasonCategory,
        attachments,
        status: 'pending_approval',
        requestTime: new Date().toISOString(),
        priority: reasonCategory === 'medical' ? 'high' : 'normal'
      }

      // Store request for approval workflow
      const earlyRequests = await spark.kv.get('pending_early_dismissals') || []
      earlyRequests.unshift(request)
      await spark.kv.set('pending_early_dismissals', earlyRequests)

      // Notify school administration
      const adminNotification = {
        id: `admin_notif_${Date.now()}`,
        type: 'early_dismissal_request',
        title: 'طلب استئذان مبكر',
        message: `${user.name} يطلب استئذان مبكر لـ ${studentData.name}`,
        data: request,
        timestamp: new Date().toISOString(),
        read: false,
        priority: request.priority
      }
      
      const adminNotifications = await spark.kv.get('admin_notifications') || []
      adminNotifications.unshift(adminNotification)
      await spark.kv.set('admin_notifications', adminNotifications)

      toast.success('تم إرسال طلب الاستئذان المبكر، في انتظار موافقة الإدارة')
      setCurrentView('home')
    } catch (error) {
      toast.error('حدث خطأ في إرسال الطلب')
    }
  }

  // Simulate queue progression and calling
  const simulateQueueProgress = async (requestId: string) => {
    const progressSteps = [
      { delay: 30000, position: -1, status: 'called', message: 'تم نداء الطلاب - توجه للبوابة' },
      { delay: 45000, status: 'completed', message: 'تم استلام الطلاب بنجاح' }
    ]

    progressSteps.forEach(({ delay, position, status, message }) => {
      setTimeout(async () => {
        if (dismissalQueue.requestId === requestId) {
          if (position !== undefined) {
            setDismissalQueue(prev => ({ 
              ...prev, 
              position,
              estimatedWaitTime: position > 0 ? Math.max(1, prev.estimatedWaitTime - 5) : 0
            }))
          }
          
          if (status === 'called') {
            setDismissalQueue(prev => ({ ...prev, calledStudents: Array.isArray(students) ? students.map(s => s?.id).filter(Boolean) : [] }))
          }
          
          if (status === 'completed') {
            setDismissalQueue({
              isActive: false,
              position: 0,
              totalInQueue: 0,
              estimatedWaitTime: 0,
              requestId: null,
              calledStudents: []
            })
          }

          toast.success(message)
        }
      }, delay)
    })
  }

  // Memoize location update callback to prevent infinite re-renders
  const handleLocationUpdate = useCallback((locationData: any, isNearSchool: boolean) => {
    setLocation(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      distanceFromSchool: isNearSchool ? 25 : 1200,
      isGPSActive: true
    }))
  }, [])

  const renderView = () => {
    // For authorized drivers, show a simplified view
    if (user.role === 'authorized_driver') {
      switch(currentView) {
        case 'dismissal-request':
          return <DismissalRequest 
            students={students}
            user={user}
            isAuthorizedDriver={true}
            onBack={() => setCurrentView('home')}
            onSubmit={handleDismissalRequest}
          />
        default:
          return <AuthorizedDriverView 
            user={user}
            students={students}
            dismissalQueue={dismissalQueue}
            location={location}
            onRequestDismissal={() => setCurrentView('dismissal-request')}
            onLogout={onLogout}
          />
      }
    }

    // Full parent interface
    switch(currentView) {
      case 'dismissal-request':
        return <DismissalRequest 
          students={students}
          user={user}
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
          user={user}
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
              <OfflineManager 
                userRole={user.role}
                userId={user.id}
              />

              <LocationService
                schoolLocation={{ lat: 24.7136, lng: 46.6753 }}
                geofenceRadius={100}
                onLocationUpdate={handleLocationUpdate}
              />

              <StudentGrid 
                students={students}
                userRole={user.role}
                onRequestDismissal={() => setCurrentView('dismissal-request')}
                onEarlyDismissal={() => setCurrentView('early-dismissal')}
              />
              
              <QuickActions 
                userRole={user.role}
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {renderView()}
    </div>
  )
}