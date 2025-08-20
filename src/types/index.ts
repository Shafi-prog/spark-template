/**
 * Core type definitions for the Smart School Dismissal Management System
 */

// User Types
export interface User {
  id: string
  name: string
  nameEn?: string
  phone?: string
  email?: string
  nationalId?: string
  role: UserRole
  avatarUrl?: string
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

export type UserRole = 'parent' | 'teacher' | 'school_admin' | 'principal' | 'authorized_driver'

// Student Types
export interface Student {
  id: string
  name: string
  nameEn?: string
  nationalId: string
  grade: string
  section: string
  schoolId: string
  currentTeacherId: string
  status: StudentStatus
  guardianId: string
  photoUrl?: string
  medicalNotes?: string
  authorizedDrivers: string[]
  emergencyContacts?: EmergencyContact[]
  createdAt?: string
  updatedAt?: string
}

export type StudentStatus = 'present' | 'dismissed' | 'absent' | 'early_dismissal' | 'authorized_leave'

export interface EmergencyContact {
  id: string
  name: string
  nameEn?: string
  phone: string
  relationship: string
  relationshipEn?: string
  priority: number
}

// Location Types
export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: string
  address?: string
  distanceFromSchool?: number
}

export interface GeofenceArea {
  center: LocationData
  radius: number // meters
  name?: string
  type?: 'pickup_zone' | 'parking_area' | 'restricted_area'
}

// Dismissal Request Types
export interface DismissalRequest {
  id: string
  parentId: string
  studentIds: string[]
  requestType: DismissalRequestType
  status: DismissalRequestStatus
  queuePosition?: number
  estimatedWaitTime?: number
  reason?: string
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  location?: LocationData
  notes?: string
  priority: RequestPriority
  createdAt: string
  updatedAt: string
}

export type DismissalRequestType = 'regular' | 'early' | 'emergency' | 'authorized_driver'
export type DismissalRequestStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'

// Notification Types
export interface Notification {
  id: string
  type: NotificationType
  title: string
  titleEn?: string
  message: string
  messageEn?: string
  recipientId?: string
  recipientRole?: UserRole
  timestamp: string
  read: boolean
  priority: RequestPriority
  actionRequired: boolean
  actionUrl?: string
  data?: Record<string, any>
  expiresAt?: string
}

export type NotificationType = 
  | 'dismissal_request'
  | 'early_dismissal'
  | 'security_alert'
  | 'system_maintenance'
  | 'queue_update'
  | 'approval_needed'
  | 'student_ready'
  | 'pickup_complete'

// School Types
export interface School {
  id: string
  name: string
  nameEn?: string
  location: LocationData
  address: string
  addressEn?: string
  geofenceRadius: number
  dismissalTimes: DismissalTimes
  settings: SchoolSettings
  contactInfo?: ContactInfo
  principalId?: string
  createdAt?: string
  updatedAt?: string
}

export interface DismissalTimes {
  primary: string
  intermediate?: string
  secondary?: string
  customTimes?: Record<string, string>
}

export interface SchoolSettings {
  autoApprovalEnabled: boolean
  maxWaitTime: number // minutes
  earlyDismissalCutoff: string // time
  emergencyContactRequired: boolean
  geofenceRequired: boolean
  qrCodeEnabled: boolean
  soundSystemEnabled: boolean
  maxStudentsPerRequest: number
  allowedDismissalWindow: number // minutes before/after official time
}

export interface ContactInfo {
  phone: string
  email: string
  website?: string
  socialMedia?: Record<string, string>
}

// Queue Types
export interface DismissalQueue {
  isActive: boolean
  position: number
  totalInQueue: number
  estimatedWaitTime: number
  requestId: string | null
  calledStudents: string[]
  currentlyProcessing: string[]
  completedToday: number
  averageProcessingTime: number
}

// Authorization Types
export interface AuthorizedDriver {
  id: string
  name: string
  nameEn?: string
  phone: string
  nationalId: string
  relationship: string
  relationshipEn?: string
  authorizedBy: string
  authorizedStudents: string[]
  permissions: DriverPermissions
  verified: boolean
  photoUrl?: string
  licenseInfo?: LicenseInfo
  vehicleInfo?: VehicleInfo
  createdAt?: string
  updatedAt?: string
}

export interface DriverPermissions {
  type: 'temporary' | 'permanent'
  validFrom: string
  validUntil: string
  daysOfWeek: number[] // 0-6, Sunday to Saturday
  timeRestrictions?: TimeRestriction
  locationRestrictions?: GeofenceArea[]
}

export interface TimeRestriction {
  from: string
  to: string
}

export interface LicenseInfo {
  number: string
  expiryDate: string
  issueAuthority: string
}

export interface VehicleInfo {
  make: string
  model: string
  year?: number
  color: string
  plateNumber: string
  registrationExpiry?: string
}

// Analytics Types
export interface AnalyticsData {
  date: string
  totalRequests: number
  completedRequests: number
  averageWaitTime: number
  peakHours: string[]
  cancellationRate: number
  parentSatisfactionScore?: number
  securityIncidents: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  messageEn?: string
  errors?: ValidationError[]
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  messageEn?: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
  retryable?: boolean
}

// Form Types
export interface DismissalRequestForm {
  studentIds: string[]
  requestType: DismissalRequestType
  reason?: string
  pickupTime?: string
  authorizedDriverId?: string
  emergencyContact?: string
  notes?: string
}

export interface EarlyDismissalForm {
  studentId: string
  reason: string
  pickupTime: string
  parentContact: string
  emergencyContact?: string
  medicalDocuments?: File[]
  approvalRequired: boolean
}

// Real-time Event Types
export interface RealtimeEvent {
  type: EventType
  id: string
  timestamp: string
  data: Record<string, any>
  userId?: string
  schoolId: string
}

export type EventType = 
  | 'queue_updated'
  | 'student_called'
  | 'request_approved'
  | 'request_completed'
  | 'emergency_alert'
  | 'system_status'
  | 'location_update'

// Permission Types
export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
  conditions?: Record<string, any>
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  restrictions?: Record<string, any>
}

// Settings Types
export interface UserSettings {
  userId: string
  language: 'ar' | 'en'
  notifications: NotificationSettings
  privacy: PrivacySettings
  accessibility: AccessibilitySettings
}

export interface NotificationSettings {
  push: boolean
  sms: boolean
  email: boolean
  types: NotificationType[]
  quietHours: TimeRestriction
}

export interface PrivacySettings {
  shareLocation: boolean
  sharePhoneNumber: boolean
  allowDataAnalytics: boolean
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  screenReader: boolean
  reduceMotion: boolean
}