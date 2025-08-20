/**
 * Testing utilities and helpers for the school dismissal system
 * Implements comprehensive testing patterns and mocks
 */

import React from 'react'

// Mock jest if not available (for runtime usage)
const jest = (typeof window !== 'undefined') ? {
  fn: () => ({
    mockResolvedValue: (value: any) => Promise.resolve(value),
    mockImplementation: (fn: any) => fn,
    mockImplementationOnce: (fn: any) => fn
  })
} : require('jest')

// Mock data generators
export const mockGenerators = {
  // Generate mock student data
  student: (overrides: Partial<any> = {}) => ({
    id: `student-${Math.random().toString(36).substr(2, 9)}`,
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
    authorizedDrivers: ['driver-1'],
    ...overrides
  }),

  // Generate mock parent data
  parent: (overrides: Partial<any> = {}) => ({
    id: `parent-${Math.random().toString(36).substr(2, 9)}`,
    name: 'أحمد السعودي',
    nameEn: 'Ahmed Al-Saudi',
    phone: '+966501111111',
    nationalId: '1111111111',
    children: ['student-1'],
    authorizedDrivers: ['driver-1'],
    location: { lat: 24.7136, lng: 46.6753 },
    role: 'parent',
    ...overrides
  }),

  // Generate mock teacher data
  teacher: (overrides: Partial<any> = {}) => ({
    id: `teacher-${Math.random().toString(36).substr(2, 9)}`,
    name: 'أستاذة مريم العتيبي',
    nameEn: 'Ms. Maryam Al-Otaibi',
    phone: '+966501234567',
    email: 'maryam@alnour.edu.sa',
    schoolId: 'school-1',
    classes: [{ grade: 'الصف الثالث', section: 'أ', isPrimary: true }],
    subjects: ['الرياضيات', 'العلوم'],
    role: 'teacher',
    permissions: {
      canReceiveDismissalRequests: true,
      canViewStudentProfiles: true
    },
    ...overrides
  }),

  // Generate mock dismissal request
  dismissalRequest: (overrides: Partial<any> = {}) => ({
    id: `req-${Math.random().toString(36).substr(2, 9)}`,
    parentId: 'parent-1',
    studentIds: ['student-1'],
    requestType: 'regular',
    status: 'pending',
    priority: 'medium',
    reason: 'انتهاء اليوم الدراسي',
    location: { lat: 24.7136, lng: 46.6753 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  // Generate mock notification
  notification: (overrides: Partial<any> = {}) => ({
    id: `notif-${Math.random().toString(36).substr(2, 9)}`,
    type: 'dismissal_request',
    title: 'طلب انصراف جديد',
    message: 'أحمد السعودي يطلب انصراف طالبين من الفصل',
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'medium',
    actionRequired: false,
    ...overrides
  })
}

// Mock API responses
export const mockApiResponses = {
  // Mock successful API response
  success: <T>(data: T) => ({
    success: true,
    data,
    message: 'تم بنجاح',
    timestamp: new Date().toISOString()
  }),

  // Mock error API response
  error: (message = 'حدث خطأ', code = 'UNKNOWN_ERROR') => ({
    success: false,
    message,
    code,
    timestamp: new Date().toISOString()
  }),

  // Mock validation error response
  validationError: (errors: Array<{ field: string; message: string }>) => ({
    success: false,
    message: 'خطأ في التحقق من البيانات',
    errors,
    timestamp: new Date().toISOString()
  })
}

// Test data sets
export const testData = {
  // Complete family data for testing
  family: {
    parent: mockGenerators.parent({
      id: 'test-parent-1',
      name: 'أحمد محمد السعودي',
      children: ['test-student-1', 'test-student-2']
    }),
    students: [
      mockGenerators.student({
        id: 'test-student-1',
        name: 'محمد أحمد السعودي',
        guardianId: 'test-parent-1',
        grade: 'الصف الثالث'
      }),
      mockGenerators.student({
        id: 'test-student-2',
        name: 'فاطمة أحمد السعودي',
        guardianId: 'test-parent-1',
        grade: 'الصف الأول'
      })
    ]
  },

  // School staff data
  school: {
    admin: {
      id: 'test-admin-1',
      name: 'سارة الفهد',
      role: 'school_admin',
      schoolId: 'test-school-1',
      permissions: {
        canManageSettings: true,
        canViewReports: true,
        canApproveEarlyDismissal: true
      }
    },
    teachers: [
      mockGenerators.teacher({
        id: 'test-teacher-1',
        name: 'مريم العتيبي',
        classes: [{ grade: 'الصف الثالث', section: 'أ' }]
      }),
      mockGenerators.teacher({
        id: 'test-teacher-2',
        name: 'نورا الأحمد',
        classes: [{ grade: 'الصف الأول', section: 'ب' }]
      })
    ]
  },

  // Sample requests for different scenarios
  requests: {
    pending: mockGenerators.dismissalRequest({
      id: 'test-req-1',
      status: 'pending',
      studentIds: ['test-student-1']
    }),
    approved: mockGenerators.dismissalRequest({
      id: 'test-req-2',
      status: 'approved',
      studentIds: ['test-student-2'],
      approvedBy: 'test-teacher-1',
      approvedAt: new Date().toISOString()
    }),
    completed: mockGenerators.dismissalRequest({
      id: 'test-req-3',
      status: 'completed',
      studentIds: ['test-student-1'],
      completedAt: new Date().toISOString()
    })
  }
}

// Mock KV service for testing
export class MockKVService {
  private data = new Map<string, any>()

  async get<T>(key: string): Promise<T | undefined> {
    return this.data.get(key)
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys())
  }

  clear(): void {
    this.data.clear()
  }

  seed(initialData: Record<string, any>): void {
    Object.entries(initialData).forEach(([key, value]) => {
      this.data.set(key, value)
    })
  }
}

// Mock Spark API
export const mockSpark = {
  kv: new MockKVService(),
  
  user: jest.fn().mockResolvedValue({
    id: 'test-user',
    login: 'testuser',
    avatarUrl: 'https://example.com/avatar.jpg',
    email: 'test@example.com',
    isOwner: true
  }),

  llmPrompt: jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
    return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '')
  }),

  llm: jest.fn().mockResolvedValue('Mock LLM response')
}

// Test utilities
export const testUtils = {
  // Wait for next tick
  waitForNextTick: (): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, 0)),

  // Wait for specific time
  wait: (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock event
  mockEvent: (overrides: Partial<Event> = {}): Event => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: null,
    currentTarget: null,
    ...overrides
  } as any),

  // Create mock form event
  mockFormEvent: (value: string = ''): React.ChangeEvent<HTMLInputElement> => ({
    target: { value },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  } as any),

  // Simulate user interaction
  simulateUserAction: async (action: () => void) => {
    action()
    await testUtils.waitForNextTick()
  },

  // Mock geolocation
  mockGeolocation: (coords: { latitude: number; longitude: number }) => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementationOnce((success) => 
        Promise.resolve(success({
          coords,
          timestamp: Date.now()
        }))
      ),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    }

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    })

    return mockGeolocation
  },

  // Mock network status
  mockNetworkStatus: (online: boolean) => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: online,
      writable: true
    })

    // Mock connection API
    Object.defineProperty(global.navigator, 'connection', {
      value: {
        effectiveType: online ? '4g' : 'slow-2g',
        downlink: online ? 10 : 0.5,
        saveData: false
      },
      writable: true
    })
  }
}

// Custom render function for React components with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    initialKVData?: Record<string, any>
    user?: any
    mockApis?: boolean
  } = {}
) => {
  const { initialKVData = {}, user, mockApis = true } = options

  // Setup mock KV with initial data
  if (initialKVData) {
    mockSpark.kv.seed(initialKVData)
  }

  // Setup user mock
  if (user) {
    mockSpark.user.mockResolvedValue(user)
  }

  // Mock global spark if needed
  if (mockApis) {
    (global as any).spark = mockSpark
  }

  // Here you would wrap with your providers
  // For example: AppProvider, ThemeProvider, etc.
  return ui
}

// Test scenario builders
export const scenarios = {
  // Parent with students scenario
  parentWithStudents: () => ({
    user: testData.family.parent,
    kvData: {
      current_user: testData.family.parent,
      demo_students: testData.family.students,
      dismissal_queue: {
        isActive: false,
        position: 0,
        totalInQueue: 0
      }
    }
  }),

  // Teacher with active requests
  teacherWithRequests: () => ({
    user: testData.school.teachers[0],
    kvData: {
      current_user: testData.school.teachers[0],
      dismissal_requests: [testData.requests.pending],
      demo_students: testData.family.students
    }
  }),

  // School admin with oversight
  adminWithOversight: () => ({
    user: testData.school.admin,
    kvData: {
      current_user: testData.school.admin,
      dismissal_requests: Object.values(testData.requests),
      demo_students: testData.family.students,
      school_notifications: [
        mockGenerators.notification({
          type: 'security_alert',
          priority: 'urgent'
        })
      ]
    }
  })
}

// Performance testing utilities
export const performanceUtils = {
  // Measure render time
  measureRenderTime: async (component: React.ReactElement): Promise<number> => {
    const start = performance.now()
    renderWithProviders(component)
    await testUtils.waitForNextTick()
    return performance.now() - start
  },

  // Measure memory usage (if available)
  measureMemoryUsage: (): number => {
    return (performance as any).memory?.usedJSHeapSize || 0
  },

  // Create performance budget assertion
  assertPerformanceBudget: (actualTime: number, budgetMs: number, operation: string) => {
    if (actualTime > budgetMs) {
      throw new Error(`Performance budget exceeded for ${operation}: ${actualTime}ms > ${budgetMs}ms`)
    }
  }
}

// Accessibility testing helpers
export const a11yUtils = {
  // Check if element has proper ARIA attributes
  hasProperAria: (element: HTMLElement): boolean => {
    const requiredAttrs = ['aria-label', 'aria-labelledby', 'aria-describedby']
    return requiredAttrs.some(attr => element.hasAttribute(attr))
  },

  // Check color contrast (simplified)
  hasGoodContrast: (foreground: string, background: string): boolean => {
    // Simplified contrast check - in real tests you'd use a proper library
    return foreground !== background
  },

  // Check keyboard navigation
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex')
    return tabIndex !== '-1' && !element.hasAttribute('disabled')
  }
}

// Export Jest matchers (would be in a separate setup file)
export const customMatchers = {
  // Custom Jest matcher for accessibility
  toBeAccessible: (received: HTMLElement) => {
    const isAccessible = a11yUtils.hasProperAria(received) && 
                        a11yUtils.isKeyboardAccessible(received)
    
    return {
      message: () => `Expected element to be accessible`,
      pass: isAccessible
    }
  },

  // Custom Jest matcher for performance
  toMeetPerformanceBudget: (received: number, budget: number) => {
    const passes = received <= budget
    
    return {
      message: () => `Expected ${received}ms to be under budget of ${budget}ms`,
      pass: passes
    }
  }
}

// Integration test helpers
export const integrationHelpers = {
  // Setup complete test environment
  setupTestEnvironment: async () => {
    // Mock all necessary APIs
    testUtils.mockNetworkStatus(true)
    testUtils.mockGeolocation({ latitude: 24.7136, longitude: 46.6753 })
    
    // Setup KV with realistic data
    const kvData = {
      demo_school: {
        id: 'test-school-1',
        name: 'مدرسة النور الابتدائية',
        location: { lat: 24.7136, lng: 46.6753 }
      },
      ...scenarios.adminWithOversight().kvData
    }
    
    mockSpark.kv.seed(kvData)
    
    return { mockSpark, kvData }
  },

  // Simulate complete user workflow
  simulateUserWorkflow: async (steps: Array<() => Promise<void>>) => {
    for (const step of steps) {
      await step()
      await testUtils.waitForNextTick()
    }
  },

  // Cleanup test environment
  cleanupTestEnvironment: () => {
    mockSpark.kv.clear()
    jest.clearAllMocks()
  }
}

// Export everything
export {
  mockGenerators,
  mockApiResponses,
  testData,
  MockKVService,
  mockSpark,
  testUtils,
  renderWithProviders,
  scenarios,
  performanceUtils,
  a11yUtils,
  customMatchers,
  integrationHelpers
}