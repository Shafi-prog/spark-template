import { useEffect, useRef, useCallback } from 'react'

interface UseIntervalOptions {
  immediate?: boolean
  leading?: boolean
}

/**
 * Enhanced interval hook with proper cleanup and control
 * Implements best practices for timed operations
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: UseIntervalOptions = {}
): {
  start: () => void
  stop: () => void
  restart: () => void
  isRunning: boolean
} {
  const { immediate = false, leading = false } = options
  const savedCallback = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  const start = useCallback(() => {
    if (delay === null || intervalRef.current) return

    if (leading) {
      savedCallback.current()
    }

    intervalRef.current = setInterval(() => {
      savedCallback.current()
    }, delay)
    
    isRunningRef.current = true
  }, [delay, leading])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      isRunningRef.current = false
    }
  }, [])

  const restart = useCallback(() => {
    stop()
    start()
  }, [stop, start])

  // Set up the interval
  useEffect(() => {
    if (immediate && delay !== null) {
      start()
    }

    return () => {
      stop()
    }
  }, [delay, immediate, start, stop])

  return {
    start,
    stop,
    restart,
    isRunning: isRunningRef.current,
  }
}