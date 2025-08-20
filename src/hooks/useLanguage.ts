import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export type Language = 'ar' | 'en'

interface LanguageHook {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  isRTL: boolean
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App Title
    'app.title': 'نظام إدارة انصراف الطلاب الذكي',
    
    // Auth
    'auth.welcome': 'مرحباً بك',
    'auth.selectRole': 'اختر نوع المستخدم',
    'auth.parent': 'ولي أمر',
    'auth.teacher': 'معلم/معلمة',
    'auth.admin': 'إدارة المدرسة',
    'auth.driver': 'سائق مفوض',
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.phone': 'رقم الجوال',
    'auth.password': 'كلمة المرور',
    'auth.nationalId': 'رقم الهوية',
    
    // Navigation
    'nav.dashboard': 'الرئيسية',
    'nav.students': 'الطلاب',
    'nav.notifications': 'الإشعارات',
    'nav.settings': 'الإعدادات',
    'nav.reports': 'التقارير',
    'nav.queue': 'قائمة الانتظار',
    'nav.profile': 'الملف الشخصي',
    
    // Students
    'student.name': 'اسم الطالب',
    'student.grade': 'الصف',
    'student.section': 'الشعبة',
    'student.status': 'الحالة',
    'student.present': 'حاضر',
    'student.dismissed': 'منصرف',
    'student.absent': 'غائب',
    'student.early': 'استئذان مبكر',
    
    // Dismissal
    'dismissal.request': 'طلب انصراف',
    'dismissal.queue': 'قائمة الانتظار',
    'dismissal.position': 'ترتيبك في الطابور',
    'dismissal.waitTime': 'وقت الانتظار المتوقع',
    'dismissal.early': 'استئذان مبكر',
    'dismissal.reason': 'سبب الاستئذان',
    'dismissal.approved': 'تم الموافقة',
    'dismissal.pending': 'في الانتظار',
    'dismissal.rejected': 'مرفوض',
    
    // Location
    'location.enable': 'تفعيل الموقع',
    'location.distance': 'المسافة من المدرسة',
    'location.nearSchool': 'قريب من المدرسة',
    'location.farFromSchool': 'بعيد عن المدرسة',
    
    // Time
    'time.now': 'الآن',
    'time.minutes': 'دقائق',
    'time.hours': 'ساعات',
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    
    // Actions
    'action.submit': 'إرسال',
    'action.cancel': 'إلغاء',
    'action.confirm': 'تأكيد',
    'action.approve': 'موافقة',
    'action.reject': 'رفض',
    'action.save': 'حفظ',
    'action.edit': 'تعديل',
    'action.delete': 'حذف',
    'action.back': 'رجوع',
    'action.next': 'التالي',
    'action.previous': 'السابق',
    
    // Status Messages
    'status.success': 'تم بنجاح',
    'status.error': 'حدث خطأ',
    'status.loading': 'جاري التحميل...',
    'status.noData': 'لا توجد بيانات',
    'status.offline': 'غير متصل',
    'status.online': 'متصل',
    
    // Notifications
    'notification.new': 'إشعار جديد',
    'notification.dismissalRequest': 'طلب انصراف',
    'notification.approved': 'تم الموافقة على طلبك',
    'notification.rejected': 'تم رفض طلبك',
    'notification.studentCalled': 'تم استدعاء الطالب',
    
    // Settings
    'settings.language': 'اللغة',
    'settings.arabic': 'العربية',
    'settings.english': 'English',
    'settings.notifications': 'الإشعارات',
    'settings.location': 'الموقع',
    'settings.privacy': 'الخصوصية'
  },
  en: {
    // App Title
    'app.title': 'Smart Student Dismissal Management System',
    
    // Auth
    'auth.welcome': 'Welcome',
    'auth.selectRole': 'Select User Type',
    'auth.parent': 'Parent',
    'auth.teacher': 'Teacher',
    'auth.admin': 'School Admin',
    'auth.driver': 'Authorized Driver',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.phone': 'Phone Number',
    'auth.password': 'Password',
    'auth.nationalId': 'National ID',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.reports': 'Reports',
    'nav.queue': 'Queue',
    'nav.profile': 'Profile',
    
    // Students
    'student.name': 'Student Name',
    'student.grade': 'Grade',
    'student.section': 'Section',
    'student.status': 'Status',
    'student.present': 'Present',
    'student.dismissed': 'Dismissed',
    'student.absent': 'Absent',
    'student.early': 'Early Dismissal',
    
    // Dismissal
    'dismissal.request': 'Dismissal Request',
    'dismissal.queue': 'Queue',
    'dismissal.position': 'Your Position in Queue',
    'dismissal.waitTime': 'Estimated Wait Time',
    'dismissal.early': 'Early Dismissal',
    'dismissal.reason': 'Reason',
    'dismissal.approved': 'Approved',
    'dismissal.pending': 'Pending',
    'dismissal.rejected': 'Rejected',
    
    // Location
    'location.enable': 'Enable Location',
    'location.distance': 'Distance from School',
    'location.nearSchool': 'Near School',
    'location.farFromSchool': 'Far from School',
    
    // Time
    'time.now': 'Now',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    
    // Actions
    'action.submit': 'Submit',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.save': 'Save',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.previous': 'Previous',
    
    // Status Messages
    'status.success': 'Success',
    'status.error': 'Error',
    'status.loading': 'Loading...',
    'status.noData': 'No Data',
    'status.offline': 'Offline',
    'status.online': 'Online',
    
    // Notifications
    'notification.new': 'New Notification',
    'notification.dismissalRequest': 'Dismissal Request',
    'notification.approved': 'Your request has been approved',
    'notification.rejected': 'Your request has been rejected',
    'notification.studentCalled': 'Student has been called',
    
    // Settings
    'settings.language': 'Language',
    'settings.arabic': 'العربية',
    'settings.english': 'English',
    'settings.notifications': 'Notifications',
    'settings.location': 'Location',
    'settings.privacy': 'Privacy'
  }
}

export function useLanguage(): LanguageHook {
  const [language, setLanguageState] = useKV('app_language', 'ar' as Language)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language]?.[key] || translations['ar']?.[key] || fallback || key
    return translation
  }

  const isRTL = language === 'ar'

  // Set initial direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  return {
    language,
    setLanguage,
    t,
    isRTL
  }
}