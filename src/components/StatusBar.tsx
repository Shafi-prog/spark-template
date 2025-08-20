import { MapPin, Clock, Users } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface StatusBarProps {
  distanceFromSchool: number
  dismissalQueue: {
    isActive: boolean
    position: number
    totalInQueue: number
    estimatedWaitTime: number
  }
  onActivateRequest: () => void
}

export function StatusBar({ distanceFromSchool, dismissalQueue, onActivateRequest }: StatusBarProps) {
  const isNearSchool = distanceFromSchool <= 50
  const isDismissalTime = new Date().getHours() >= 12 // افتراض أن الانصراف بعد الـ 12
  const canActivate = isNearSchool && isDismissalTime && !dismissalQueue.isActive

  if (dismissalQueue.isActive) {
    return (
      <Card className="m-4 border-accent bg-gradient-to-r from-accent/10 to-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="status-pulse">
                <div className="h-3 w-3 bg-accent rounded-full"></div>
              </div>
              <div>
                <div className="font-semibold text-accent-foreground">
                  ترتيبك: {dismissalQueue.position} من {dismissalQueue.totalInQueue}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock size={14} />
                  <span>الوقت المتوقع: {dismissalQueue.estimatedWaitTime} دقيقة</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              عرض القائمة
            </Button>
          </div>
          <Progress 
            value={(dismissalQueue.totalInQueue - dismissalQueue.position) / dismissalQueue.totalInQueue * 100} 
            className="mt-3"
          />
        </CardContent>
      </Card>
    )
  }

  if (canActivate) {
    return (
      <Card className="m-4 border-secondary bg-gradient-to-r from-secondary/10 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-secondary" />
              <div>
                <div className="font-semibold text-secondary-foreground">
                  أنت على بعد {distanceFromSchool}م من المدرسة
                </div>
                <div className="text-sm text-muted-foreground">
                  يمكنك الآن تفعيل طلب الانصراف
                </div>
              </div>
            </div>
            <Button onClick={onActivateRequest} className="bg-secondary hover:bg-secondary/90">
              تفعيل طلب الانصراف
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isNearSchool && !isDismissalTime) {
    return (
      <Card className="m-4 border-warning bg-gradient-to-r from-warning/10 to-warning/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-warning" />
            <div>
              <div className="font-semibold text-warning-foreground">
                أنت بالقرب من المدرسة ({distanceFromSchool}م)
              </div>
              <div className="text-sm text-muted-foreground">
                سيتم تفعيل طلب الانصراف تلقائياً عند وقت الانصراف (12:30 م)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4 border-muted bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-muted-foreground" />
            <div>
              <div className="font-semibold text-muted-foreground">
                المسافة من المدرسة: {(distanceFromSchool / 1000).toFixed(1)} كم
              </div>
              <div className="text-sm text-muted-foreground">
                سيتم تفعيل طلب الانصراف عند الاقتراب من المدرسة
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}