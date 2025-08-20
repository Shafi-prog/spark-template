import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast, Toaster } from 'sonner'

// App Components
import { ParentApp } from './apps/ParentApp'
import { SchoolDashboard } from './apps/SchoolDashboard'
import { TeacherApp } from './apps/TeacherApp'
import { LoginScreen } from './components/auth/LoginScreen'
import { UserSelection } from './components/auth/UserSelection'

function App() {
  const [currentUser, setCurrentUser] = useKV('current_user', null)
  const [authStep, setAuthStep] = useState('selection') // 'selection', 'login', 'app'

  // Initialize demo data
  useEffect(() => {
    // Initialize some demo data for testing
    const initDemoData = async () => {
      const demoSchool = {
        id: 'school-1',
        name: 'مدرسة النور الابتدائية',
        location: { lat: 24.7136, lng: 46.6753 },
        geofenceRadius: 100,
        dismissalTimes: {
          primary: '12:30',
          intermediate: '13:00'
        }
      }

      const demoStudents = [
        {
          id: 'student-1',
          name: 'محمد أحمد السعودي',
          nameEn: 'Mohammed Ahmed',
          grade: 'الصف الثالث',
          section: 'أ',
          schoolId: 'school-1',
          currentTeacherId: 'teacher-1',
          status: 'present',
          guardianId: 'parent-1'
        },
        {
          id: 'student-2',
          name: 'فاطمة أحمد السعودي', 
          nameEn: 'Fatimah Ahmed',
          grade: 'الصف الأول',
          section: 'ب',
          schoolId: 'school-1', 
          currentTeacherId: 'teacher-2',
          status: 'present',
          guardianId: 'parent-1'
        }
      ]

      const demoTeachers = [
        {
          id: 'teacher-1',
          name: 'أستاذة مريم العتيبي',
          schoolId: 'school-1',
          classes: [{ grade: 'الصف الثالث', section: 'أ' }],
          currentPeriod: { subject: 'الرياضيات', time: '10:30-11:15' }
        },
        {
          id: 'teacher-2', 
          name: 'أستاذة نورا الأحمد',
          schoolId: 'school-1',
          classes: [{ grade: 'الصف الأول', section: 'ب' }],
          currentPeriod: { subject: 'اللغة العربية', time: '11:15-12:00' }
        }
      ]

      // Store demo data
      await spark.kv.set('demo_school', demoSchool)
      await spark.kv.set('demo_students', demoStudents)
      await spark.kv.set('demo_teachers', demoTeachers)
    }

    initDemoData()
  }, [])

  const handleUserTypeSelect = (userType: string) => {
    setAuthStep('login')
    // In real app, this would set the user type for login context
  }

  const handleLogin = (userData: any) => {
    setCurrentUser(userData)
    setAuthStep('app')
    toast.success(`مرحباً ${userData.name}`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthStep('selection')
    toast.info('تم تسجيل الخروج بنجاح')
  }

  const renderApp = () => {
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

    // Render appropriate app based on user role
    switch (currentUser.role) {
      case 'parent':
        return <ParentApp user={currentUser} onLogout={handleLogout} />
      case 'school_admin':
      case 'principal':
        return <SchoolDashboard user={currentUser} onLogout={handleLogout} />
      case 'teacher':
        return <TeacherApp user={currentUser} onLogout={handleLogout} />
      default:
        return <div className="p-4 text-center">نوع المستخدم غير مدعوم</div>
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col arabic-text">
      {renderApp()}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            fontFamily: 'Cairo'
          }
        }}
      />
    </div>
  )
}

export default App