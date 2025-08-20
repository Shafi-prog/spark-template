import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Header } from './components/Header'
import { StudentGrid } from './components/StudentGrid'
import { StatusBar } from './components/StatusBar'
import { QuickActions } from './components/QuickActions'
import { DismissalRequest } from './components/DismissalRequest'
import { EarlyDismissal } from './components/EarlyDismissal'
import { DelegateManagement } from './components/DelegateManagement'
import { toast, Toaster } from 'sonner'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [user] = useKV('user', {
    name: 'أحمد محمد السعودي',
    phone: '+966501234567',
    id: '1234567890',
    distanceFromSchool: 1200
  })

  const [students] = useKV('students', [
    {
      id: '1',
      name: 'محمد أحمد',
      nameEn: 'Mohammed Ahmed', 
      grade: 'الصف الثالث',
      section: 'أ',
      school: 'مدرسة النور الابتدائية',
      photo: null,
      status: 'present',
      canRequestDismissal: true
    },
    {
      id: '2', 
      name: 'فاطمة أحمد',
      nameEn: 'Fatimah Ahmed',
      grade: 'الصف الأول',
      section: 'ب', 
      school: 'مدرسة النور الابتدائية',
      photo: null,
      status: 'present',
      canRequestDismissal: true
    }
  ])

  const [dismissalQueue] = useKV('dismissal_queue', {
    isActive: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitTime: 0,
    requestId: null
  })

  const [location, setLocation] = useKV('user_location', {
    latitude: 0,
    longitude: 0,
    distanceFromSchool: user.distanceFromSchool
  })

  const renderView = () => {
    switch(currentView) {
      case 'dismissal-request':
        return <DismissalRequest 
          students={students}
          onBack={() => setCurrentView('home')}
          onSubmit={() => {
            toast.success('تم إرسال طلب الانصراف بنجاح')
            setCurrentView('home')
          }}
        />
      case 'early-dismissal':
        return <EarlyDismissal 
          students={students}
          onBack={() => setCurrentView('home')}
          onSubmit={() => {
            toast.success('تم إرسال طلب الاستئذان المبكر')
            setCurrentView('home')
          }}
        />
      case 'delegates':
        return <DelegateManagement 
          onBack={() => setCurrentView('home')}
        />
      default:
        return (
          <>
            <Header user={user} />
            
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

  return (
    <div className="min-h-screen bg-background flex flex-col arabic-text">
      {renderView()}
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