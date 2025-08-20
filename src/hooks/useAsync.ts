import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface AsyncActions<T> {
  execute: (...args: any[]) => Promise<T | void>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: string | null) => void
}

/**
 * Enhanced async hook for handling asynchronous operations with loading states
 * Implements proper error handling and loading management patterns
 */
export function useAsync<T = any>(
  asyncFunction?: (...args: any[]) => Promise<T>,
  immediate = false
): AsyncState<T> & AsyncActions<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const result = asyncFunction ? await asyncFunction(...args) : null
        setState({
          data: result as T,
          loading: false,
          error: null,
        })
        return result
      } catch (error: any) {
        const errorMessage = error?.message || 'حدث خطأ غير متوقع'
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        })
        
        // Show toast notification for errors
        toast.error(errorMessage)
        throw error
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, error: null }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  // Execute immediately if requested
  useState(() => {
    if (immediate && asyncFunction) {
      execute()
    }
  })

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  }
}