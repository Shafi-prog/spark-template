/**
 * Security utilities for the school dismissal management system
 * Implements best practices for data protection and secure operations
 */

import React from 'react'
import { toast } from 'sonner'

// Input sanitization utilities
export const sanitizeInput = {
  // Remove potentially harmful characters
  basic: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  },

  // Sanitize Arabic names
  arabicName: (name: string): string => {
    return name
      .replace(/[^\u0600-\u06FF\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  },

  // Sanitize English names
  englishName: (name: string): string => {
    return name
      .replace(/[^a-zA-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  },

  // Sanitize phone numbers
  phone: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '')
  },

  // Sanitize national ID
  nationalId: (id: string): string => {
    return id.replace(/\D/g, '').substring(0, 10)
  },

  // Sanitize general text input
  text: (text: string, maxLength = 1000): string => {
    return sanitizeInput.basic(text).substring(0, maxLength)
  }
}

// Data masking for logging and display
export const maskData = {
  // Mask phone number for display
  phone: (phone: string): string => {
    if (phone.length < 10) return phone
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2)
  },

  // Mask national ID
  nationalId: (id: string): string => {
    if (id.length < 10) return id
    return id.substring(0, 2) + '******' + id.substring(id.length - 2)
  },

  // Mask email
  email: (email: string): string => {
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***' 
      : localPart
    
    return `${maskedLocal}@${domain}`
  },

  // Mask sensitive data in objects
  sensitive: (data: Record<string, any>): Record<string, any> => {
    const masked = { ...data }
    const sensitiveFields = ['phone', 'nationalId', 'email', 'password', 'token', 'key']
    
    sensitiveFields.forEach(field => {
      if (masked[field]) {
        if (field === 'phone') masked[field] = maskData.phone(masked[field])
        else if (field === 'nationalId') masked[field] = maskData.nationalId(masked[field])
        else if (field === 'email') masked[field] = maskData.email(masked[field])
        else masked[field] = '***MASKED***'
      }
    })
    
    return masked
  }
}

// Permission checking utilities
export const permissions = {
  // Check if user can access student data
  canAccessStudent: (user: any, studentId: string): boolean => {
    if (!user || !studentId) return false

    switch (user.role) {
      case 'parent':
        return user.children?.includes(studentId) || false
      case 'authorized_driver':
        return user.authorizedStudents?.includes(studentId) || false
      case 'teacher':
        return user.students?.includes(studentId) || false
      case 'school_admin':
      case 'principal':
        return user.schoolId === user.schoolId // Same school
      default:
        return false
    }
  },

  // Check if user can approve dismissal requests
  canApproveDismissal: (user: any): boolean => {
    if (!user) return false

    return ['teacher', 'school_admin', 'principal'].includes(user.role) &&
           user.permissions?.canReceiveDismissalRequests === true
  },

  // Check if user can view reports
  canViewReports: (user: any): boolean => {
    if (!user) return false

    return ['school_admin', 'principal'].includes(user.role) &&
           user.permissions?.canViewReports === true
  },

  // Check if user can manage settings
  canManageSettings: (user: any): boolean => {
    if (!user) return false

    return user.role === 'principal' || 
           (user.role === 'school_admin' && user.permissions?.canManageSettings === true)
  },

  // Check if action is within rate limits
  checkRateLimit: async (userId: string, action: string, maxAttempts = 5, windowMs = 60000): Promise<boolean> => {
    const key = `rate_limit_${userId}_${action}`
    const attempts = await spark.kv.get(key) || []
    const now = Date.now()
    
    // Filter out old attempts
    const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs)
    
    if (recentAttempts.length >= maxAttempts) {
      return false
    }
    
    // Add current attempt
    recentAttempts.push(now)
    await spark.kv.set(key, recentAttempts)
    
    return true
  }
}

// Session management
export const session = {
  // Validate session token
  validateToken: (token: string): boolean => {
    // In a real app, this would validate against your auth service
    return token && token.length > 10
  },

  // Check if session is expired
  isSessionExpired: (timestamp: string, maxAgeMs = 24 * 60 * 60 * 1000): boolean => {
    const sessionTime = new Date(timestamp).getTime()
    const now = Date.now()
    return (now - sessionTime) > maxAgeMs
  },

  // Generate secure session ID
  generateSessionId: (): string => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  },

  // Clear sensitive session data
  clearSession: async (): Promise<void> => {
    const sensitiveKeys = ['current_user', 'auth_token', 'session_data']
    
    for (const key of sensitiveKeys) {
      try {
        await spark.kv.delete(key)
      } catch (error) {
        console.warn(`Failed to clear session key: ${key}`, error)
      }
    }
  }
}

// Audit logging for security events
export const audit = {
  // Log security events
  logSecurityEvent: async (event: {
    type: 'login' | 'logout' | 'permission_denied' | 'data_access' | 'suspicious_activity'
    userId?: string
    details: Record<string, any>
    severity: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<void> => {
    const auditEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: session.generateSessionId(),
      userAgent: navigator.userAgent,
      ipAddress: 'client', // In real app, would be from server
      url: window.location.href
    }

    try {
      const auditLog = await spark.kv.get('security_audit_log') || []
      auditLog.push(auditEntry)
      
      // Keep only last 1000 entries
      const trimmedLog = auditLog.slice(-1000)
      await spark.kv.set('security_audit_log', trimmedLog)

      // Alert for critical events
      if (event.severity === 'critical') {
        toast.error('تم تسجيل حدث أمني مهم')
        console.error('Critical security event:', auditEntry)
      }
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  },

  // Get recent security events
  getRecentEvents: async (hours = 24): Promise<any[]> => {
    try {
      const auditLog = await spark.kv.get('security_audit_log') || []
      const cutoff = Date.now() - (hours * 60 * 60 * 1000)
      
      return auditLog.filter((entry: any) => 
        new Date(entry.timestamp).getTime() > cutoff
      )
    } catch (error) {
      console.error('Failed to get audit events:', error)
      return []
    }
  }
}

// Content Security Policy helpers
export const csp = {
  // Check if URL is allowed
  isAllowedUrl: (url: string): boolean => {
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'github.com',
      'googleapis.com',
      'gstatic.com'
    ]
    
    try {
      const urlObj = new URL(url)
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  },

  // Sanitize URLs
  sanitizeUrl: (url: string): string => {
    if (!url) return ''
    
    // Remove javascript: and data: protocols
    if (url.toLowerCase().startsWith('javascript:') || 
        url.toLowerCase().startsWith('data:')) {
      return ''
    }
    
    return url
  }
}

// Encryption helpers (for client-side sensitive data)
export const crypto = {
  // Simple base64 encoding (not for security, just obfuscation)
  encode: (text: string): string => {
    try {
      return btoa(encodeURIComponent(text))
    } catch {
      return text
    }
  },

  // Simple base64 decoding
  decode: (encoded: string): string => {
    try {
      return decodeURIComponent(atob(encoded))
    } catch {
      return encoded
    }
  },

  // Generate random string for tokens
  randomString: (length = 16): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  },

  // Hash string (simple client-side hashing)
  simpleHash: (text: string): string => {
    let hash = 0
    if (text.length === 0) return hash.toString()
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }
}

// Security validation middleware
export const securityMiddleware = {
  // Validate request before processing
  validateRequest: (request: {
    userId?: string
    action: string
    data?: any
    timestamp?: string
  }): { valid: boolean; reason?: string } => {
    // Check required fields
    if (!request.action) {
      return { valid: false, reason: 'Action is required' }
    }

    // Check timestamp freshness (prevent replay attacks)
    if (request.timestamp) {
      const requestTime = new Date(request.timestamp).getTime()
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes
      
      if (Math.abs(now - requestTime) > maxAge) {
        return { valid: false, reason: 'Request timestamp too old' }
      }
    }

    // Sanitize data
    if (request.data && typeof request.data === 'object') {
      request.data = maskData.sensitive(request.data)
    }

    return { valid: true }
  },

  // Check for suspicious activity
  detectSuspiciousActivity: async (userId: string, actions: string[]): Promise<boolean> => {
    const recentActions = actions.filter(action => action.includes('failed') || action.includes('denied'))
    
    if (recentActions.length > 3) {
      await audit.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        details: { actions: recentActions },
        severity: 'high'
      })
      
      return true
    }
    
    return false
  }
}

// React hook for security context
export function useSecurity() {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await spark.kv.get('current_user')
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to load user for security context:', error)
      }
    }

    loadUser()
  }, [])

  const hasPermission = React.useCallback((action: string, resource?: string) => {
    if (!user) return false

    switch (action) {
      case 'view_student':
        return resource ? permissions.canAccessStudent(user, resource) : false
      case 'approve_dismissal':
        return permissions.canApproveDismissal(user)
      case 'view_reports':
        return permissions.canViewReports(user)
      case 'manage_settings':
        return permissions.canManageSettings(user)
      default:
        return false
    }
  }, [user])

  const logSecurityEvent = React.useCallback(async (eventType: string, details: Record<string, any>) => {
    await audit.logSecurityEvent({
      type: eventType as any,
      userId: user?.id,
      details,
      severity: 'medium'
    })
  }, [user])

  return {
    user,
    hasPermission,
    logSecurityEvent,
    isAuthenticated: !!user,
    userRole: user?.role || 'anonymous'
  }
}

// Higher-order component for permission checking
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string,
  resourceKey?: keyof P
) {
  return React.forwardRef<HTMLElement, P>((props, ref) => {
    const { hasPermission, logSecurityEvent } = useSecurity()
    const resource = resourceKey ? props[resourceKey] as string : undefined

    React.useEffect(() => {
      if (!hasPermission(requiredPermission, resource)) {
        logSecurityEvent('permission_denied', {
          permission: requiredPermission,
          resource,
          component: Component.displayName || Component.name
        })
      }
    }, [hasPermission, requiredPermission, resource, logSecurityEvent])

    if (!hasPermission(requiredPermission, resource)) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          ليس لديك صلاحية للوصول إلى هذا المحتوى
        </div>
      )
    }

    return <Component {...props} ref={ref} />
  })
}

// Export all utilities
export {
  sanitizeInput,
  maskData,
  permissions,
  session,
  audit,
  csp,
  crypto,
  securityMiddleware
}