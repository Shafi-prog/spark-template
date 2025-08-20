import { useState, useEffect } from 'react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, CheckCircle, AlertCircle, Clock } from "@phosphor-icons/react"
import { toast } from 'sonner'

interface LocationServiceProps {
  schoolLocation: { lat: number; lng: number }
  geofenceRadius: number // in meters
  onLocationUpdate: (location: any, isNearSchool: boolean) => void
}

export function LocationService({ schoolLocation, geofenceRadius, onLocationUpdate }: LocationServiceProps) {
  const [isLocationEnabled, setIsLocationEnabled] = useKV('location_enabled', false)
  const [lastKnownLocation, setLastKnownLocation] = useKV('last_known_location', null)
  const [isNearSchool, setIsNearSchool] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)

  const { location, loading, error, calculateDistance } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 30000, // 30 seconds
    timeout: 15000, // 15 seconds
    watchPosition: isLocationEnabled
  })

  // Update location and check proximity to school
  useEffect(() => {
    if (location) {
      const distanceToSchool = calculateDistance(
        location.latitude,
        location.longitude,
        schoolLocation.lat,
        schoolLocation.lng
      )

      setDistance(distanceToSchool)
      setLastKnownLocation(location)

      const nearSchool = distanceToSchool <= geofenceRadius
      setIsNearSchool(nearSchool)

      onLocationUpdate(location, nearSchool)

      // Notify when entering/leaving geofence
      if (nearSchool && distance && distance > geofenceRadius) {
        toast.success('🎯 وصلت إلى المدرسة - يمكنك الآن طلب الانصراف')
      }
    }
  }, [location?.latitude, location?.longitude, schoolLocation.lat, schoolLocation.lng, geofenceRadius, distance, onLocationUpdate])

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      toast.error('خدمة تحديد المواقع غير مدعومة في هذا المتصفح')
      return
    }

    // Request permission
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        toast.error('تم رفض إذن الموقع. يرجى تمكينه من إعدادات المتصفح')
        return
      }
      
      setIsLocationEnabled(true)
      toast.success('تم تفعيل خدمة تحديد الموقع')
    }).catch(() => {
      // Fallback - try to get location anyway
      setIsLocationEnabled(true)
    })
  }

  const handleDisableLocation = () => {
    setIsLocationEnabled(false)
    setIsNearSchool(false)
    setDistance(null)
    toast.info('تم إيقاف خدمة تحديد الموقع')
  }

  const formatDistance = (distanceInMeters: number) => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} م`
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)} كم`
    }
  }

  const getLocationStatus = () => {
    if (!isLocationEnabled) {
      return { status: 'disabled', text: 'خدمة الموقع غير مفعلة', color: 'secondary' }
    }
    if (loading) {
      return { status: 'loading', text: 'جاري تحديد الموقع...', color: 'secondary' }
    }
    if (error) {
      return { status: 'error', text: 'خطأ في الموقع', color: 'destructive' }
    }
    if (isNearSchool) {
      return { status: 'near', text: 'قريب من المدرسة', color: 'secondary' }
    }
    if (distance) {
      return { status: 'away', text: `بعيد عن المدرسة`, color: 'secondary' }
    }
    return { status: 'unknown', text: 'حالة الموقع غير معروفة', color: 'secondary' }
  }

  const locationStatus = getLocationStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <MapPin size={24} className="text-primary" />
          خدمة تحديد الموقع
        </CardTitle>
        <CardDescription>
          تفعيل خدمة الموقع لطلب الانصراف التلقائي عند الوصول للمدرسة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {locationStatus.status === 'loading' && <Clock size={20} className="text-muted-foreground animate-spin" />}
            {locationStatus.status === 'near' && <CheckCircle size={20} className="text-secondary" />}
            {locationStatus.status === 'error' && <AlertCircle size={20} className="text-destructive" />}
            {(locationStatus.status === 'away' || locationStatus.status === 'disabled') && <MapPin size={20} className="text-muted-foreground" />}
            
            <div>
              <p className="font-medium">{locationStatus.text}</p>
              {distance && (
                <p className="text-sm text-muted-foreground">
                  المسافة من المدرسة: {formatDistance(distance)}
                </p>
              )}
            </div>
          </div>
          
          <Badge variant={locationStatus.color as any}>
            {locationStatus.text}
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Geofence Status */}
        {isLocationEnabled && location && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>منطقة المدرسة:</span>
              <span>{geofenceRadius} متر</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>حالة المنطقة:</span>
              <span className={isNearSchool ? 'text-secondary font-medium' : 'text-muted-foreground'}>
                {isNearSchool ? 'داخل المنطقة ✓' : 'خارج المنطقة'}
              </span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isLocationEnabled ? (
            <Button onClick={handleEnableLocation} className="flex-1">
              <MapPin size={16} className="ml-2" />
              تفعيل خدمة الموقع
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleDisableLocation}
                className="flex-1"
              >
                إيقاف الخدمة
              </Button>
              {isNearSchool && (
                <Badge variant="secondary" className="px-3 py-1">
                  <CheckCircle size={14} className="ml-1" />
                  جاهز للانصراف
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Location Info */}
        {location && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            آخر تحديث: {new Date(location.timestamp).toLocaleTimeString('ar-SA')}
            {location.accuracy && ` • دقة: ${Math.round(location.accuracy)}م`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}