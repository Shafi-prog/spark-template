/**
 * Accessibility utilities and React hooks for improved a11y support
 * Implements WCAG 2.1 AA compliance helpers
 */

import { useEffect, useRef, useCallback, useState } from 'react'

// Focus management utilities
export const focusManagement = {
  // Focus trap for modals and dialogs
  createFocusTrap: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    element.addEventListener('keydown', trapFocus)
    
    // Focus first element
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', trapFocus)
    }
  },

  // Restore focus to previous element
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && previousElement.focus) {
      previousElement.focus()
    }
  },

  // Find next focusable element
  getNextFocusableElement: (current: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)

    const currentIndex = focusableElements.indexOf(current)
    return focusableElements[currentIndex + 1] || focusableElements[0]
  },

  // Find previous focusable element
  getPreviousFocusableElement: (current: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)

    const currentIndex = focusableElements.indexOf(current)
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1]
  }
}

// ARIA utilities
export const ariaUtils = {
  // Generate unique ID for ARIA relationships
  generateId: (prefix = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message

    document.body.appendChild(announcer)
    
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  },

  // Set ARIA expanded state
  setExpanded: (element: HTMLElement, expanded: boolean): void => {
    element.setAttribute('aria-expanded', expanded.toString())
  },

  // Set ARIA pressed state
  setPressed: (element: HTMLElement, pressed: boolean): void => {
    element.setAttribute('aria-pressed', pressed.toString())
  },

  // Set ARIA selected state
  setSelected: (element: HTMLElement, selected: boolean): void => {
    element.setAttribute('aria-selected', selected.toString())
  },

  // Set ARIA disabled state
  setDisabled: (element: HTMLElement, disabled: boolean): void => {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true')
      element.setAttribute('tabindex', '-1')
    } else {
      element.removeAttribute('aria-disabled')
      element.removeAttribute('tabindex')
    }
  }
}

// Color contrast utilities
export const colorUtils = {
  // Calculate relative luminance
  getRelativeLuminance: (hex: string): number => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0

    const { r, g, b } = rgb
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const l1 = colorUtils.getRelativeLuminance(color1)
    const l2 = colorUtils.getRelativeLuminance(color2)
    
    const lightest = Math.max(l1, l2)
    const darkest = Math.min(l1, l2)
    
    return (lightest + 0.05) / (darkest + 0.05)
  },

  // Check if colors meet WCAG AA contrast requirements
  meetsWCAGAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = colorUtils.getContrastRatio(foreground, background)
    return isLargeText ? ratio >= 3 : ratio >= 4.5
  },

  // Check if colors meet WCAG AAA contrast requirements
  meetsWCAGAAA: (foreground: string, background: string, isLargeText = false): boolean => {
    const ratio = colorUtils.getContrastRatio(foreground, background)
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// React Hooks for Accessibility

/**
 * Hook for focus trap management
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Create focus trap
      cleanupRef.current = focusManagement.createFocusTrap(containerRef.current)
    }

    return () => {
      // Clean up focus trap
      if (cleanupRef.current) {
        cleanupRef.current()
      }

      // Restore previous focus
      if (!isActive && previousFocusRef.current) {
        focusManagement.restoreFocus(previousFocusRef.current)
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for ARIA live region announcements
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ariaUtils.announce(message, priority)
  }, [])

  return announce
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  onArrowDown?: () => void,
  onArrowUp?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        onArrowRight?.()
        break
      case 'Enter':
        event.preventDefault()
        onEnter?.()
        break
      case 'Escape':
        event.preventDefault()
        onEscape?.()
        break
    }
  }, [onArrowDown, onArrowUp, onArrowLeft, onArrowRight, onEnter, onEscape])

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      element.addEventListener('keydown', handleKeyDown)
      return () => element.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return ref
}

/**
 * Hook for managing focus within a roving tabindex pattern
 */
export function useRovingTabIndex(items: HTMLElement[], selectedIndex: number) {
  useEffect(() => {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.setAttribute('tabindex', '0')
        item.focus()
      } else {
        item.setAttribute('tabindex', '-1')
      }
    })
  }, [items, selectedIndex])
}

/**
 * Hook for reduced motion preferences
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for high contrast preferences
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}

/**
 * Hook for screen reader detection
 */
export function useScreenReader(): boolean {
  const [isScreenReader, setIsScreenReader] = useState(false)

  useEffect(() => {
    // Check for common screen reader indicators
    const hasScreenReader = 
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis !== undefined

    setIsScreenReader(hasScreenReader)
  }, [])

  return isScreenReader
}

/**
 * Hook for auto-generating ARIA IDs
 */
export function useAriaId(prefix = 'aria'): string {
  const idRef = useRef<string>('')

  if (!idRef.current) {
    idRef.current = ariaUtils.generateId(prefix)
  }

  return idRef.current
}

// Higher-order component for accessibility features
interface WithA11yProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  role?: string
  tabIndex?: number
}

export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<HTMLElement, P & WithA11yProps>(
    ({ ariaLabel, ariaDescribedBy, role, tabIndex, ...props }, ref) => {
      const announce = useAnnouncer()
      
      const enhancedProps = {
        ...props,
        ref,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        role,
        tabIndex,
        onFocus: (e: React.FocusEvent) => {
          if (ariaLabel) {
            announce(ariaLabel, 'polite')
          }
          ;(props as any).onFocus?.(e)
        }
      }

      return <Component {...enhancedProps} />
    }
  )
}

// Skip link component for keyboard navigation
interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:text-decoration-none"
      onFocus={() => ariaUtils.announce('رابط الانتقال السريع', 'polite')}
    >
      {children}
    </a>
  )
}

// Screen reader only text component
interface SROnlyProps {
  children: React.ReactNode
  live?: 'polite' | 'assertive'
}

export function SROnly({ children, live }: SROnlyProps) {
  return (
    <span 
      className="sr-only"
      aria-live={live}
      aria-atomic="true"
    >
      {children}
    </span>
  )
}

// Accessible form field wrapper
interface AccessibleFieldProps {
  id: string
  label: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
}

export function AccessibleField({ 
  id, 
  label, 
  error, 
  description, 
  required, 
  children 
}: AccessibleFieldProps) {
  const descriptionId = useAriaId(`${id}-description`)
  const errorId = useAriaId(`${id}-error`)

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium ${required ? 'after:content-["*"] after:text-destructive after:ml-1' : ''}`}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [description && descriptionId, error && errorId].filter(Boolean).join(' '),
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : 'false'
        })}
      </div>
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

// Export utilities
export { focusManagement, ariaUtils, colorUtils }