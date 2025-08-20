/**
 * Centralized export for all custom hooks
 */

// Existing hooks
export { useLanguage } from './useLanguage'
export { useGeolocation } from './useGeolocation'
export { useMobile } from './use-mobile'

// New enhanced hooks
export { useAsync } from './useAsync'
export { useDebounce } from './useDebounce'
export { useInterval } from './useInterval'
export { useLocalStorage } from './useLocalStorage'
export { useNetwork } from './useNetwork'

// Performance hooks
export { 
  useRenderPerformance, 
  usePerformanceMetrics,
  useApiPerformance,
  withPerformanceMonitoring,
  PerformanceLazyComponent,
  performanceMonitor 
} from '../lib/performance'

// Accessibility hooks
export {
  useFocusTrap,
  useAnnouncer,
  useKeyboardNavigation,
  useRovingTabIndex,
  useReducedMotion,
  useHighContrast,
  useScreenReader,
  useAriaId,
  withAccessibility
} from '../lib/accessibility'

// Context hooks
export {
  useApp,
  useAppState,
  useLoading,
  useError,
  useNotifications,
  useRequests,
  useQueue,
  useAsyncAction
} from '../contexts/AppContext'