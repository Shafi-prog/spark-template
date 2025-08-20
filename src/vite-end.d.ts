/// <reference types="vite/client" />

declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Enhanced environment variables
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_SENTRY_DSN: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type enhancements for browser APIs
declare global {
  interface Navigator {
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }

  interface NetworkInformation {
    downlink: number
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
    rtt: number
    saveData: boolean
    addEventListener(type: 'change', listener: () => void): void
    removeEventListener(type: 'change', listener: () => void): void
  }

  interface Window {
    requestIdleCallback?: (callback: (deadline: IdleDeadline) => void) => number
    cancelIdleCallback?: (id: number) => void
  }

  interface IdleDeadline {
    didTimeout: boolean
    timeRemaining(): number
  }

  // Performance Observer types
  interface PerformanceObserverEntryList {
    getEntries(): PerformanceEntry[]
    getEntriesByName(name: string, entryType?: string): PerformanceEntry[]
    getEntriesByType(entryType: string): PerformanceEntry[]
  }

  interface PerformanceObserver {
    observe(options: { entryTypes: string[] }): void
    disconnect(): void
  }

  const PerformanceObserver: {
    prototype: PerformanceObserver
    new(callback: (list: PerformanceObserverEntryList) => void): PerformanceObserver
  }
}

// Module declarations for assets
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.webm' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.wav' {
  const src: string
  export default src
}

declare module '*.pdf' {
  const src: string
  export default src
}

// CSS Module types
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}