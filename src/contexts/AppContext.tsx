import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { toast } from 'sonner'

// Action types
type ActionType = 
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'CLEAR_ERROR'
  | 'ADD_NOTIFICATION'
  | 'REMOVE_NOTIFICATION'
  | 'SET_USER'
  | 'SET_STUDENTS'
  | 'UPDATE_QUEUE'
  | 'ADD_REQUEST'
  | 'UPDATE_REQUEST'
  | 'REMOVE_REQUEST'

interface Action {
  type: ActionType
  payload?: any
}

// State interface
interface AppState {
  loading: boolean
  error: string | null
  notifications: any[]
  user: any | null
  students: any[]
  dismissalQueue: any
  activeRequests: any[]
}

// Initial state
const initialState: AppState = {
  loading: false,
  error: null,
  notifications: [],
  user: null,
  students: [],
  dismissalQueue: {
    isActive: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitTime: 0,
    requestId: null,
    calledStudents: []
  },
  activeRequests: [],
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  // Action creators
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  addNotification: (notification: any) => void
  removeNotification: (id: string) => void
  setUser: (user: any) => void
  setStudents: (students: any[]) => void
  updateQueue: (queue: any) => void
  addRequest: (request: any) => void
  updateRequest: (id: string, updates: any) => void
  removeRequest: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      if (action.payload) {
        toast.error(action.payload)
      }
      return { ...state, error: action.payload, loading: false }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'ADD_NOTIFICATION':
      const newNotification = { 
        ...action.payload, 
        id: action.payload.id || `notif_${Date.now()}`,
        timestamp: action.payload.timestamp || new Date().toISOString()
      }
      return { 
        ...state, 
        notifications: [newNotification, ...state.notifications.slice(0, 49)] // Keep max 50
      }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }

    case 'SET_USER':
      return { ...state, user: action.payload }

    case 'SET_STUDENTS':
      return { ...state, students: action.payload }

    case 'UPDATE_QUEUE':
      return { ...state, dismissalQueue: { ...state.dismissalQueue, ...action.payload } }

    case 'ADD_REQUEST':
      const request = { 
        ...action.payload, 
        id: action.payload.id || `req_${Date.now()}`,
        createdAt: action.payload.createdAt || new Date().toISOString()
      }
      return { 
        ...state, 
        activeRequests: [request, ...state.activeRequests]
      }

    case 'UPDATE_REQUEST':
      return {
        ...state,
        activeRequests: state.activeRequests.map(req => 
          req.id === action.payload.id 
            ? { ...req, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : req
        )
      }

    case 'REMOVE_REQUEST':
      return {
        ...state,
        activeRequests: state.activeRequests.filter(req => req.id !== action.payload)
      }

    default:
      return state
  }
}

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action creators
  const actions = {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    
    addNotification: (notification: any) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
      
      // Show toast for high priority notifications
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        toast.error(notification.title, {
          description: notification.message,
          duration: notification.priority === 'urgent' ? 0 : 5000, // Persistent for urgent
        })
      } else if (notification.type === 'success') {
        toast.success(notification.title, {
          description: notification.message,
        })
      } else {
        toast.info(notification.title, {
          description: notification.message,
        })
      }
    },
    
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    
    setUser: (user: any) => dispatch({ type: 'SET_USER', payload: user }),
    
    setStudents: (students: any[]) => dispatch({ type: 'SET_STUDENTS', payload: students }),
    
    updateQueue: (queue: any) => dispatch({ type: 'UPDATE_QUEUE', payload: queue }),
    
    addRequest: (request: any) => {
      dispatch({ type: 'ADD_REQUEST', payload: request })
      toast.success('تم إرسال الطلب بنجاح', {
        description: `طلب انصراف ${request.studentIds?.length || 1} طالب`
      })
    },
    
    updateRequest: (id: string, updates: any) => {
      dispatch({ type: 'UPDATE_REQUEST', payload: { id, updates } })
      
      // Show notifications for important status changes
      if (updates.status === 'approved') {
        toast.success('تم قبول الطلب', {
          description: 'يمكنك الآن التوجه لاستلام الطالب'
        })
      } else if (updates.status === 'rejected') {
        toast.error('تم رفض الطلب', {
          description: updates.reason || 'يرجى المحاولة مرة أخرى'
        })
      } else if (updates.status === 'completed') {
        toast.success('تم تسليم الطالب بنجاح')
      }
    },
    
    removeRequest: (id: string) => dispatch({ type: 'REMOVE_REQUEST', payload: id }),
  }

  const contextValue: AppContextType = {
    state,
    dispatch,
    ...actions,
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the app context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Selector hooks for specific state slices
export function useAppState() {
  const { state } = useApp()
  return state
}

export function useLoading() {
  const { state, setLoading } = useApp()
  return [state.loading, setLoading] as const
}

export function useError() {
  const { state, setError, clearError } = useApp()
  return [state.error, setError, clearError] as const
}

export function useNotifications() {
  const { state, addNotification, removeNotification } = useApp()
  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    unreadCount: state.notifications.filter(n => !n.read).length,
  }
}

export function useRequests() {
  const { state, addRequest, updateRequest, removeRequest } = useApp()
  return {
    requests: state.activeRequests,
    addRequest,
    updateRequest,
    removeRequest,
    pendingCount: state.activeRequests.filter(r => r.status === 'pending').length,
  }
}

export function useQueue() {
  const { state, updateQueue } = useApp()
  return [state.dismissalQueue, updateQueue] as const
}

// Custom hook for async operations with automatic loading/error handling
export function useAsyncAction() {
  const { setLoading, setError, clearError } = useApp()

  return async function<T>(
    asyncFn: () => Promise<T>,
    options: {
      successMessage?: string
      errorMessage?: string
      showLoading?: boolean
    } = {}
  ): Promise<T | null> {
    const { 
      successMessage, 
      errorMessage = 'حدث خطأ غير متوقع',
      showLoading = true 
    } = options

    try {
      if (showLoading) setLoading(true)
      clearError()
      
      const result = await asyncFn()
      
      if (successMessage) {
        toast.success(successMessage)
      }
      
      return result
    } catch (error: any) {
      const message = error?.message || errorMessage
      setError(message)
      return null
    } finally {
      if (showLoading) setLoading(false)
    }
  }
}