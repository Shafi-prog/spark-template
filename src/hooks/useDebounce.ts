import { useEffect, useRef, useCallback } from 'react'

interface UseDebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

/**
 * Enhanced debounce hook with configurable options
 * Useful for API calls, search inputs, and expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: UseDebounceOptions = {}
): (...args: Parameters<T>) => void {
  const {
    leading = false,
    trailing = true,
    maxWait,
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  const lastCallTimeRef = useRef<number>(0)
  const lastArgsRef = useRef<Parameters<T>>()

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    if (lastArgsRef.current) {
      const args = lastArgsRef.current
      lastArgsRef.current = undefined
      callbackRef.current(...args)
    }
    cancel()
  }, [cancel])

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    const currentTime = Date.now()
    lastArgsRef.current = args

    const shouldCallLeading = leading && (!timeoutRef.current || (currentTime - lastCallTimeRef.current) >= delay)

    if (shouldCallLeading) {
      lastCallTimeRef.current = currentTime
      callbackRef.current(...args)
    }

    cancel()

    // Set the trailing call timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (lastArgsRef.current && !shouldCallLeading) {
          callbackRef.current(...lastArgsRef.current)
        }
        timeoutRef.current = null
        lastArgsRef.current = undefined
      }, delay)
    }

    // Set max wait timeout if specified
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        flush()
      }, maxWait)
    }
  }, [delay, leading, trailing, maxWait, cancel, flush])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  // Attach cancel and flush methods to the debounced function
  const debouncedWithMethods = debouncedCallback as typeof debouncedCallback & {
    cancel: () => void
    flush: () => void
  }
  debouncedWithMethods.cancel = cancel
  debouncedWithMethods.flush = flush

  return debouncedWithMethods
}