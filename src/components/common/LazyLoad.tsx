import React, { Suspense } from 'react'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  height?: string | number
  className?: string
}

/**
 * Enhanced lazy loading wrapper with intelligent fallbacks
 * Provides smooth loading states for code-split components
 */
export function LazyLoad({ 
  children, 
  fallback, 
  height = 'auto',
  className = '' 
}: LazyLoadProps) {
  // Default fallback with skeleton loading
  const defaultFallback = (
    <Card className={`p-4 animate-pulse ${className}`} style={{ height }}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

// Specific loading states for different component types
export const LoadingStates = {
  // Dashboard component loading
  Dashboard: () => (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  ),

  // Student grid loading
  StudentGrid: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </Card>
      ))}
    </div>
  ),

  // Form loading
  Form: () => (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </Card>
  ),

  // List loading
  List: () => (
    <Card>
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        ))}
      </div>
    </Card>
  ),

  // Table loading
  Table: () => (
    <Card>
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {/* Table header */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  ),

  // Minimal loading for small components
  Minimal: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  ),
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  )

  return (props: P) => (
    <LazyLoad fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  )
}