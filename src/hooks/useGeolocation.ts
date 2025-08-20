import { useState, useEffect, useCallback } from 'react'

export interface GeolocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
  error?: string
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
  watchPosition?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [location, setLocation] = useState<GeolocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    enableHighAccuracy = true,
    maximumAge = 60000, // 1 minute
    timeout = 10000, // 10 seconds
    watchPosition = false
  } = options

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('خدمة تحديد المواقع غير مدعومة في هذا المتصفح')
      return
    }

    setLoading(true)
    setError(null)

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      })
      setLoading(false)
    }

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'خطأ في الحصول على الموقع'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'تم رفض الإذن للوصول إلى الموقع'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'معلومات الموقع غير متاحة'
          break
        case error.TIMEOUT:
          errorMessage = 'انتهت مهلة طلب الموقع'
          break
      }
      
      setError(errorMessage)
      setLoading(false)
    }

    const geoOptions = {
      enableHighAccuracy,
      maximumAge,
      timeout
    }

    if (watchPosition) {
      return navigator.geolocation.watchPosition(
        successHandler,
        errorHandler,
        geoOptions
      )
    } else {
      navigator.geolocation.getCurrentPosition(
        successHandler,
        errorHandler,
        geoOptions
      )
    }
  }, [enableHighAccuracy, maximumAge, timeout, watchPosition])

  useEffect(() => {
    const watchId = getLocation()
    
    return () => {
      if (watchId && typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [getLocation])

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }, [])

  return {
    location,
    loading,
    error,
    getLocation,
    calculateDistance
  }
}