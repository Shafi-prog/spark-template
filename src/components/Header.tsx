import React from 'react'
import { Bell, User, Menu, SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from './notifications/NotificationCenter'
import { RealTimeStatus } from './realtime/RealTimeStatus'

interface HeaderProps {
  user: {
    name: string
    phone: string
    photo?: string
    role?: string
    id?: string
  }
  onLogout?: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  })

  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  return (
    <header className="bg-card border-b border-border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.photo} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              مرحباً {user.name.split(' ')[0]}
            </h1>
            <div className="text-sm text-muted-foreground">
              <span>{currentDate}</span>
              <span className="mx-2">•</span>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <RealTimeStatus 
              userRole={user.role as any || 'parent'}
              userId={user.id || 'default'}
            />
          </div>
          
          <div className="relative">
            <NotificationCenter 
              userRole={user.role as any || 'parent'}
              userId={user.id || 'default'}
            />
          </div>
          
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <SignOut size={20} />
            </Button>
          )}
          
          <Button variant="ghost" size="icon">
            <Menu size={20} />
          </Button>
        </div>
      </div>
    </header>
  )
}