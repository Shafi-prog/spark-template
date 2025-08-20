import React, { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast, Toaster } from 'sonner'

// App Components
import { ParentApp } from './apps/ParentApp'
import { SchoolDashboard } from './apps/SchoolDashboard'
import { TeacherApp } from './apps/TeacherApp'
import { LoginScreen } from './components/auth/LoginScreen'
import { UserSelection } from './components/auth/UserSelection'
import { LanguageSwitcher } from './components/ui/LanguageSwitcher'

// Enhanced Components
import { ErrorBoundary } from './components/ErrorBoundary'
import { LazyLoad, LoadingStates } from './components/common/LazyLoad'
import { AppProvider } from './contexts/AppContext'

// Hooks
import { useLanguage } from './hooks/useLanguage'
import { useNetwork } from './hooks/useNetwork'
import { useAsync } from './hooks/useAsync'

// Services
import { apiService } from './services/api'

// Types
import type { User } from './types'

// Lazy load main app components for better performance
const LazyParentApp = React.lazy(() => import('./apps/ParentApp').then(module => ({ default: module.ParentApp })))
const LazySchoolDashboard = React.lazy(() => import('./apps/SchoolDashboard').then(module => ({ default: module.SchoolDashboard })))
const LazyTeacherApp = React.lazy(() => import('./apps/TeacherApp').then(module => ({ default: module.TeacherApp })))

function AppContent() {
  const [currentUser, setCurrentUser] = useKV<User | null>('current_user', null)
  const [authStep, setAuthStep] = useState<'selection' | 'login' | 'app'>('selection')
  const { t, language } = useLanguage()
  const { isOnline, isSlowConnection, retry } = useNetwork()

  // Initialize demo data with proper error handling
  const { loading: initializingData, error: initError, execute: initializeData } = useAsync(async () => {
    await initDemoData()
  }, false)

  // Initialize demo data on mount
  useEffect(() => {
    initializeData()
  }, [])

  // Initialize comprehensive demo data with enhanced error handling
  const initDemoData = async () => {
      try {
        // Check if demo data already exists
        const existingSchool = await spark.kv.get('demo_school')
        if (existingSchool) return // Demo data already initialized

        const demoSchool = {
          id: 'school-1',
          name: 'مدرسة النور الابتدائية',
          nameEn: 'Al-Nour Primary School',
          location: { lat: 24.7136, lng: 46.6753 },
          address: 'حي النرجس، الرياض 13241',
          geofenceRadius: 100,
          dismissalTimes: {
            primary: '12:30',
            intermediate: '13:00',
            secondary: '13:30'
          },
          settings: {
            autoApprovalEnabled: false,
            maxWaitTime: 30,
            earlyDismissalCutoff: '11:00',
            emergencyContactRequired: true
          }
        }

        const demoStudents = [
          {
            id: 'student-1',
            name: 'محمد أحمد السعودي',
            nameEn: 'Mohammed Ahmed Al-Saudi',
            nationalId: '1234567890',
            grade: 'الصف الثالث',
            section: 'أ',
            schoolId: 'school-1',
            currentTeacherId: 'teacher-1',
            status: 'present',
            guardianId: 'parent-1',
            photoUrl: '/assets/images/student-placeholder.png',
            medicalNotes: '',
            authorizedDrivers: ['driver-1']
          },
          {
            id: 'student-2',
            name: 'فاطمة أحمد السعودي', 
            nameEn: 'Fatimah Ahmed Al-Saudi',
            nationalId: '1234567891',
            grade: 'الصف الأول',
            section: 'ب',
            schoolId: 'school-1', 
            currentTeacherId: 'teacher-2',
            status: 'present',
            guardianId: 'parent-1',
            photoUrl: '/assets/images/student-placeholder.png',
            medicalNotes: '',
            authorizedDrivers: ['driver-1']
          }
        ]

        const demoTeachers = [
          {
            id: 'teacher-1',
            name: 'أستاذة مريم العتيبي',
            nameEn: 'Ms. Maryam Al-Otaibi',
            phone: '+966501234567',
            email: 'maryam@alnour.edu.sa',
            schoolId: 'school-1',
            classes: [{ grade: 'الصف الثالث', section: 'أ', isPrimary: true }],
            subjects: ['الرياضيات', 'العلوم'],
            currentPeriod: { 
              subject: 'الرياضيات', 
              time: '10:30-11:15',
              location: 'الفصل 3أ'
            },
            permissions: {
              canReceiveDismissalRequests: true,
              canViewStudentProfiles: true
            }
          },
          {
            id: 'teacher-2', 
            name: 'أستاذة نورا الأحمد',
            nameEn: 'Ms. Noura Al-Ahmad',
            phone: '+966501234568',
            email: 'noura@alnour.edu.sa',
            schoolId: 'school-1',
            classes: [{ grade: 'الصف الأول', section: 'ب', isPrimary: true }],
            subjects: ['اللغة العربية', 'التربية الإسلامية'],
            currentPeriod: { 
              subject: 'اللغة العربية', 
              time: '11:15-12:00',
              location: 'الفصل 1ب'
            },
            permissions: {
              canReceiveDismissalRequests: true,
              canViewStudentProfiles: true
            }
          }
        ]

        const demoParents = [
          {
            id: 'parent-1',
            name: 'أحمد السعودي',
            nameEn: 'Ahmed Al-Saudi',
            phone: '+966501111111',
            nationalId: '1111111111',
            children: ['student-1', 'student-2'],
            authorizedDrivers: ['driver-1'],
            location: { lat: 24.7136, lng: 46.6753 },
            carInfo: {
              make: 'تويوتا',
              model: 'كامري',
              color: 'أبيض',
              plateNumber: 'أ ب ج 123'
            }
          }
        ]

        const demoDrivers = [
          {
            id: 'driver-1',
            name: 'خالد السعودي',
            nameEn: 'Khalid Al-Saudi',
            phone: '+966502222222',
            nationalId: '2222222222',
            relationship: 'أخ',
            relationshipEn: 'Brother',
            authorizedBy: 'parent-1',
            authorizedStudents: ['student-1', 'student-2'],
            permissions: {
              type: 'permanent',
              validFrom: new Date().toISOString(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              daysOfWeek: [0, 1, 2, 3, 4], // Sunday to Thursday
              timeRestrictions: { from: '12:00', to: '14:00' }
            },
            verified: true
          }
        ]

        const demoSchoolAdmin = {
          id: 'admin-1',
          name: 'سارة الفهد',
          nameEn: 'Sarah Al-Fahd',
          phone: '+966503333333',
          email: 'sarah@alnour.edu.sa',
          role: 'principal',
          schoolId: 'school-1',
          permissions: {
            canApproveEarlyDismissal: true,
            canManageSettings: true,
            canViewReports: true,
            canManageStaff: true,
            canDelegatePermissions: true
          }
        }

        // Store demo data with proper keys
        await spark.kv.set('demo_school', demoSchool)
        await spark.kv.set('demo_students', demoStudents)
        await spark.kv.set('demo_teachers', demoTeachers)
        await spark.kv.set('demo_parents', demoParents)
        await spark.kv.set('demo_drivers', demoDrivers)
        await spark.kv.set('demo_school_admin', demoSchoolAdmin)
        
        // Initialize empty queues and requests
        await spark.kv.set('dismissal_queue', [])
        await spark.kv.set('early_dismissal_requests', [])
        await spark.kv.set('pending_approvals', [])
        await spark.kv.set('active_requests', [])
        
        // Initialize demo notifications
        const demoNotifications = [
          {
            id: `notif_${Date.now()}_1`,
            type: 'dismissal_request',
            title: 'طلب انصراف جديد',
            message: 'أحمد السعودي يطلب انصراف طالبين من الفصل',
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'medium',
            actionRequired: false,
            data: { parentName: 'أحمد السعودي', studentCount: 2 }
          },
          {
            id: `notif_${Date.now()}_2`,
            type: 'early_dismissal',
            title: 'طلب استئذان مبكر',
            message: 'طلب استئذان للطالب محمد أحمد لموعد طبي',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            read: false,
            priority: 'high',
            actionRequired: true,
            data: { studentName: 'محمد أحمد', reason: 'موعد طبي' }
          },
          {
            id: `notif_${Date.now()}_3`,
            type: 'security_alert',
            title: 'تنبيه أمني',
            message: 'محاولة استلام غير مصرح بها تم منعها',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: true,
            priority: 'urgent',
            actionRequired: false,
            data: { location: 'البوابة الرئيسية', time: '12:45' }
          }
        ]

        await spark.kv.set('school_notifications', demoNotifications)
        await spark.kv.set('teacher_notifications', demoNotifications.slice(0, 2))
        await spark.kv.set('parent_notifications_parent-1', [demoNotifications[0]])
        await spark.kv.set('global_notifications', [demoNotifications[2]])
        
        // Initialize API cache
        apiService.clearCache()
        
      } catch (error) {
        console.error('Error initializing demo data:', error)
        throw new Error('فشل في تحميل البيانات الأولية')
      }
    }

    initDemoData()
  }, [])

  const handleUserTypeSelect = (userType: string) => {
    setAuthStep('login')
    // In real app, this would set the user type for login context
  }

  const handleLogin = (userData: User) => {
    setCurrentUser(userData)
    setAuthStep('app')
    toast.success(`${t('auth.welcome')} ${userData.name}`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthStep('selection')
    // Clear sensitive cache data on logout
    apiService.invalidateCache('notifications|requests|queue')
    toast.info(t('status.success'))
  }

  const renderApp = () => {
    // Show loading state during initialization
    if (initializingData) {
      return <LoadingStates.Dashboard />
    }

    // Show error state if initialization failed
    if (initError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">فشل في تحميل التطبيق</h1>
            <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات الأولية</p>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => initializeData()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                إعادة المحاولة
              </button>
              {!isOnline && (
                <button 
                  onClick={retry}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
                >
                  فحص الاتصال
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (!currentUser) {
      switch (authStep) {
        case 'selection':
          return <UserSelection onSelectUserType={handleUserTypeSelect} />
        case 'login':
          return <LoginScreen onLogin={handleLogin} onBack={() => setAuthStep('selection')} />
        default:
          return <UserSelection onSelectUserType={handleUserTypeSelect} />
      }
    }

    // Render appropriate app based on user role with lazy loading and error boundaries
    switch (currentUser.role) {
      case 'parent':
      case 'authorized_driver':
        return (
          <LazyLoad fallback={<LoadingStates.Dashboard />}>
            <LazyParentApp user={currentUser} onLogout={handleLogout} />
          </LazyLoad>
        )
      case 'school_admin':
      case 'principal':
        return (
          <LazyLoad fallback={<LoadingStates.Dashboard />}>
            <LazySchoolDashboard user={currentUser} onLogout={handleLogout} />
          </LazyLoad>
        )
      case 'teacher':
        return (
          <LazyLoad fallback={<LoadingStates.Dashboard />}>
            <LazyTeacherApp user={currentUser} onLogout={handleLogout} />
          </LazyLoad>
        )
      default:
        return <div className="p-4 text-center">نوع المستخدم غير مدعوم</div>
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col arabic-text">
      {/* Language Switcher - positioned at top right */}
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Network status indicator */}
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm">
          لا يوجد اتصال بالإنترنت - العمل في الوضع غير المتصل
        </div>
      )}
      
      {isSlowConnection && (
        <div className="bg-warning text-warning-foreground p-2 text-center text-sm">
          اتصال إنترنت بطيء - قد تتأخر بعض العمليات
        </div>
      )}
      
      {renderApp()}
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            fontFamily: language === 'ar' ? 'Cairo' : 'system-ui'
          }
        }}
      />
    </div>
  )
}

// Main App component with providers and error boundary
function App() {
  return (
    <ErrorBoundary level="page">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App