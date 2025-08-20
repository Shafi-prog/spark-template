import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Pause, Play, SkipForward } from "@phosphor-icons/react"
import { toast } from 'sonner'

interface SoundSystemProps {
  queue: any[]
  onStudentCalled: (studentName: string) => void
}

export function SoundSystem({ queue, onStudentCalled }: SoundSystemProps) {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoMode, setAutoMode] = useState(true)

  // Simulate automatic announcements
  useEffect(() => {
    if (!autoMode || queue.length === 0) return

    const nextStudent = queue.find(req => req.status === 'waiting')
    if (!nextStudent) return

    const timer = setTimeout(() => {
      handleCallStudent(nextStudent.students[0], nextStudent.id)
    }, 3000) // Auto-call next student every 3 seconds

    return () => clearTimeout(timer)
  }, [queue, autoMode])

  const handleCallStudent = async (studentName: string, requestId?: string) => {
    try {
      setCurrentAnnouncement(`يُرجى من الطالب ${studentName} التوجه إلى البوابة الرئيسية`)
      setIsPlaying(true)
      
      // Simulate text-to-speech
      toast.info(`📢 يتم الآن نداء: ${studentName}`)
      
      // Simulate announcement duration
      setTimeout(() => {
        setIsPlaying(false)
        onStudentCalled(studentName)
      }, 2000)

    } catch (error) {
      toast.error('حدث خطأ في النداء الصوتي')
    }
  }

  const manualCall = () => {
    const nextStudent = queue.find(req => req.status === 'waiting')
    if (nextStudent) {
      handleCallStudent(nextStudent.students[0], nextStudent.id)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 size={20} className="text-primary" />
          نظام البث الصوتي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Announcement */}
        <div className={`p-4 rounded-lg border-2 ${isPlaying ? 'border-warning bg-warning/5' : 'border-border'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isPlaying ? 'default' : 'secondary'}>
              {isPlaying ? 'يتم البث الآن' : 'جاهز للبث'}
            </Badge>
            {isPlaying && <Volume2 size={16} className="text-warning animate-pulse" />}
          </div>
          
          <p className="text-sm">
            {currentAnnouncement || 'في انتظار الطلب التالي...'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={manualCall}
            disabled={isPlaying || queue.filter(q => q.status === 'waiting').length === 0}
            className="gap-2"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'جار البث' : 'نداء التالي'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoMode(!autoMode)}
          >
            وضع {autoMode ? 'يدوي' : 'تلقائي'}
          </Button>
        </div>

        {/* Queue Preview */}
        <div className="text-sm">
          <p className="text-muted-foreground mb-2">الطوابير القادمة:</p>
          <div className="space-y-1">
            {queue.filter(q => q.status === 'waiting').slice(0, 3).map((request, index) => (
              <div key={request.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span>{request.students.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}