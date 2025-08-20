import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface NetworkState {
  isOnline: boolean
  isSlowConnection: boolean
  effectiveType: string
  downlink: number
  saveData: boolean
}

interface UseNetworkReturn extends NetworkState {
  retry: () => void
  isConnected: boolean
}

/**
 * Enhanced network status hook with connection quality detection
 * Implements proper offline/online handling for the school system
 */
export function useNetwork(): UseNetworkReturn {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    effectiveType: 'unknown',
    downlink: 0,
    saveData: false,
  })

  const updateNetworkState = useCallback(() => {
    const connection = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection
    
    const newState: NetworkState = {
      isOnline: navigator.onLine,
      isSlowConnection: connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      saveData: connection?.saveData || false,
    }

    setNetworkState(prevState => {
      // Show notifications only when state changes
      if (prevState.isOnline && !newState.isOnline) {
        toast.error('انقطع الاتصال بالإنترنت - سيتم العمل في الوضع غير المتصل')
      } else if (!prevState.isOnline && newState.isOnline) {
        toast.success('تم استعادة الاتصال بالإنترنت')
      } else if (newState.isSlowConnection && !prevState.isSlowConnection) {
        toast.warning('اتصال إنترنت بطيء - قد تتأخر بعض العمليات')
      }

      return newState
    })
  }, [])

  const retry = useCallback(() => {
    updateNetworkState()
    // Force a network check by making a small request
    fetch('/favicon.ico', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    }).catch(() => {
      // Silently handle errors - this is just for network detection
    })
  }, [updateNetworkState])

  useEffect(() => {
    const handleOnline = () => updateNetworkState()
    const handleOffline = () => updateNetworkState()
    
    // Listen for connection changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection quality changes
    const connection = (navigator as any)?.connection
    if (connection) {
      connection.addEventListener('change', updateNetworkState)
    }

    // Initial state update
    updateNetworkState()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateNetworkState)
      }
    }
  }, [updateNetworkState])

  return {
    ...networkState,
    retry,
    isConnected: networkState.isOnline,
  }
}