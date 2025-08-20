/**
 * Service layer for API interactions and data management
 * Implements proper error handling, caching, and request management
 */

import { toast } from 'sonner'

// Base API configuration
const API_BASE_URL = '/api' // In real app, this would be your API endpoint
const API_TIMEOUT = 30000 // 30 seconds

// Request configuration
interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  cache?: boolean
}

// Error types
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class NetworkError extends Error {
  constructor(message = 'فشل في الاتصال بالخادم') {
    super(message)
    this.name = 'NetworkError'
  }
}

class TimeoutError extends Error {
  constructor(message = 'انتهت مهلة الطلب') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// Cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  clear() {
    this.cache.clear()
  }
}

// Create global cache instance
const apiCache = new ApiCache()

// Request queue for managing concurrent requests
const requestQueue = new Map<string, Promise<any>>()

// Base API service
class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_TIMEOUT,
      retries = 3,
      cache = false,
    } = config

    // Create cache key
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(body || {})}`
    
    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = apiCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check if same request is already in progress
    if (requestQueue.has(cacheKey)) {
      return requestQueue.get(cacheKey)
    }

    const requestPromise = this.executeRequest<T>(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      timeout,
    })

    // Add to request queue
    requestQueue.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise

      // Cache successful GET requests
      if (method === 'GET' && cache) {
        apiCache.set(cacheKey, result)
      }

      return result
    } catch (error: any) {
      // Retry logic
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(1000 * (4 - retries)) // Exponential backoff
        return this.makeRequest(endpoint, { ...config, retries: retries - 1 })
      }
      throw error
    } finally {
      // Remove from request queue
      requestQueue.delete(cacheKey)
    }
  }

  private async executeRequest<T>(
    endpoint: string,
    config: {
      method: string
      headers: Record<string, string>
      body?: any
      timeout: number
    }
  ): Promise<T> {
    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      // In a real app, this would be a fetch() call to your API
      // For this demo, we'll simulate API calls using the KV store
      const result = await this.simulateApiCall<T>(endpoint, config)
      return result
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new TimeoutError()
      }
      
      if (!navigator.onLine) {
        throw new NetworkError('لا يوجد اتصال بالإنترنت')
      }

      // Handle different error types
      if (error.status) {
        throw new ApiError(
          error.message || 'حدث خطأ في الخادم',
          error.status,
          error.code,
          error.data
        )
      }

      throw new NetworkError()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async simulateApiCall<T>(
    endpoint: string,
    config: { method: string; headers: Record<string, string>; body?: any }
  ): Promise<T> {
    // Simulate network delay
    await this.delay(100 + Math.random() * 300)

    // Parse endpoint and method to determine action
    const [, resource, id] = endpoint.split('/')
    const { method, body } = config

    try {
      switch (resource) {
        case 'students':
          return await this.handleStudentsEndpoint(method, id, body) as T

        case 'dismissal-requests':
          return await this.handleDismissalRequestsEndpoint(method, id, body) as T

        case 'notifications':
          return await this.handleNotificationsEndpoint(method, id, body) as T

        case 'queue':
          return await this.handleQueueEndpoint(method, id, body) as T

        default:
          throw new ApiError('Endpoint not found', 404)
      }
    } catch (error: any) {
      // Simulate server errors occasionally
      if (Math.random() < 0.05) { // 5% chance of server error
        throw new ApiError('خطأ في الخادم', 500)
      }
      throw error
    }
  }

  private async handleStudentsEndpoint(method: string, id?: string, body?: any) {
    const students = await spark.kv.get('demo_students') || []
    
    switch (method) {
      case 'GET':
        return id ? students.find(s => s.id === id) : students
      case 'POST':
        const newStudent = { ...body, id: `student-${Date.now()}` }
        await spark.kv.set('demo_students', [...students, newStudent])
        return newStudent
      case 'PUT':
        const updatedStudents = students.map(s => 
          s.id === id ? { ...s, ...body } : s
        )
        await spark.kv.set('demo_students', updatedStudents)
        return updatedStudents.find(s => s.id === id)
      case 'DELETE':
        const filteredStudents = students.filter(s => s.id !== id)
        await spark.kv.set('demo_students', filteredStudents)
        return { success: true }
      default:
        throw new ApiError('Method not allowed', 405)
    }
  }

  private async handleDismissalRequestsEndpoint(method: string, id?: string, body?: any) {
    const requests = await spark.kv.get('dismissal_requests') || []
    
    switch (method) {
      case 'GET':
        return id ? requests.find(r => r.id === id) : requests
      case 'POST':
        const newRequest = {
          ...body,
          id: `req-${Date.now()}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        await spark.kv.set('dismissal_requests', [...requests, newRequest])
        return newRequest
      case 'PUT':
        const updatedRequests = requests.map(r => 
          r.id === id ? { ...r, ...body, updatedAt: new Date().toISOString() } : r
        )
        await spark.kv.set('dismissal_requests', updatedRequests)
        return updatedRequests.find(r => r.id === id)
      default:
        throw new ApiError('Method not allowed', 405)
    }
  }

  private async handleNotificationsEndpoint(method: string, id?: string, body?: any) {
    const notifications = await spark.kv.get('notifications') || []
    
    switch (method) {
      case 'GET':
        return notifications
      case 'POST':
        const newNotification = {
          ...body,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        await spark.kv.set('notifications', [...notifications, newNotification])
        return newNotification
      case 'PUT':
        const updatedNotifications = notifications.map(n => 
          n.id === id ? { ...n, ...body } : n
        )
        await spark.kv.set('notifications', updatedNotifications)
        return updatedNotifications.find(n => n.id === id)
      default:
        throw new ApiError('Method not allowed', 405)
    }
  }

  private async handleQueueEndpoint(method: string, id?: string, body?: any) {
    const queue = await spark.kv.get('dismissal_queue') || {}
    
    switch (method) {
      case 'GET':
        return queue
      case 'PUT':
        const updatedQueue = { ...queue, ...body }
        await spark.kv.set('dismissal_queue', updatedQueue)
        return updatedQueue
      default:
        throw new ApiError('Method not allowed', 405)
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    return (
      error instanceof NetworkError ||
      error instanceof TimeoutError ||
      (error instanceof ApiError && error.status >= 500)
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public API methods
  public async get<T>(endpoint: string, options?: Partial<ApiRequestConfig>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  public async post<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body })
  }

  public async put<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body })
  }

  public async patch<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  public async delete<T>(endpoint: string, options?: Partial<ApiRequestConfig>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // Cache management
  public invalidateCache(pattern?: string) {
    apiCache.invalidate(pattern)
  }

  public clearCache() {
    apiCache.clear()
  }
}

// Create and export API service instance
export const apiService = new ApiService()

// Specific service classes
export class StudentsService {
  static async getAll(cache = true) {
    return apiService.get('/students', { cache })
  }

  static async getById(id: string, cache = true) {
    return apiService.get(`/students/${id}`, { cache })
  }

  static async create(student: any) {
    const result = await apiService.post('/students', student)
    apiService.invalidateCache('/students')
    return result
  }

  static async update(id: string, updates: any) {
    const result = await apiService.put(`/students/${id}`, updates)
    apiService.invalidateCache('/students')
    return result
  }

  static async delete(id: string) {
    const result = await apiService.delete(`/students/${id}`)
    apiService.invalidateCache('/students')
    return result
  }
}

export class DismissalService {
  static async getRequests(cache = false) {
    return apiService.get('/dismissal-requests', { cache })
  }

  static async createRequest(request: any) {
    return apiService.post('/dismissal-requests', request)
  }

  static async updateRequest(id: string, updates: any) {
    return apiService.put(`/dismissal-requests/${id}`, updates)
  }

  static async getQueue() {
    return apiService.get('/queue', { cache: false })
  }

  static async updateQueue(queueData: any) {
    return apiService.put('/queue', queueData)
  }
}

export class NotificationService {
  static async getAll() {
    return apiService.get('/notifications', { cache: false })
  }

  static async create(notification: any) {
    return apiService.post('/notifications', notification)
  }

  static async markAsRead(id: string) {
    return apiService.put(`/notifications/${id}`, { read: true })
  }
}

// Export error classes for handling
export { ApiError, NetworkError, TimeoutError }