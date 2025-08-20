import { useState, useEffect, useRef } from 'react'

interface UseLocalStorageOptions {
  serializer?: {
    parse: (value: string) => any
    stringify: (value: any) => string
  }
  syncAcrossTabs?: boolean
}

/**
 * Enhanced localStorage hook with proper serialization and error handling
 * Implements best practices for client-side storage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = JSON,
    syncAcrossTabs = true,
  } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return serializer.parse(item)
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, serializer.stringify(valueToStore))
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }

  // Listen for changes in other tabs/windows
  const eventListenerRef = useRef<((e: StorageEvent) => void) | null>(null)

  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        try {
          const newValue = e.newValue === null 
            ? initialValue 
            : serializer.parse(e.newValue)
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    eventListenerRef.current = handleStorageChange
    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (eventListenerRef.current) {
        window.removeEventListener('storage', eventListenerRef.current)
      }
    }
  }, [key, initialValue, serializer, syncAcrossTabs])

  return [storedValue, setValue, removeValue]
}