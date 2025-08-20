import React, { useState } from 'react'

// Validation rule types
interface ValidationRule {
  type: string
  value?: any
  message?: string
  messageEn?: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
  messageEn?: string
  type: string
}

// Common validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+966|966|0)?[5][0-9]{8}$/,
  nationalId: /^[12][0-9]{9}$/,
  plateNumber: /^[أ-ي\s]+\d{1,4}$/,
  arabicName: /^[\u0600-\u06FF\s]+$/,
  englishName: /^[a-zA-Z\s]+$/,
  mixedText: /^[\u0600-\u06FF\sa-zA-Z\d\-_.]+$/,
} as const

// Pre-defined validation rules
const VALIDATION_RULES = {
  required: (message = 'هذا الحقل مطلوب'): ValidationRule => ({
    type: 'required',
    message,
    messageEn: 'This field is required',
  }),

  email: (message = 'يرجى إدخال بريد إلكتروني صحيح'): ValidationRule => ({
    type: 'email',
    message,
    messageEn: 'Please enter a valid email address',
  }),

  phone: (message = 'يرجى إدخال رقم هاتف صحيح (05XXXXXXXX)'): ValidationRule => ({
    type: 'phone',
    message,
    messageEn: 'Please enter a valid phone number',
  }),

  nationalId: (message = 'يرجى إدخال رقم هوية صحيح (10 أرقام)'): ValidationRule => ({
    type: 'nationalId',
    message,
    messageEn: 'Please enter a valid national ID (10 digits)',
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `يجب أن يكون الطول ${length} أحرف على الأقل`,
    messageEn: `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `يجب أن لا يتجاوز الطول ${length} حرف`,
    messageEn: `Must not exceed ${length} characters`,
  }),

  min: (value: number, message?: string): ValidationRule => ({
    type: 'min',
    value,
    message: message || `القيمة يجب أن تكون ${value} أو أكثر`,
    messageEn: `Value must be ${value} or greater`,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    type: 'max',
    value,
    message: message || `القيمة يجب أن تكون ${value} أو أقل`,
    messageEn: `Value must be ${value} or less`,
  }),

  pattern: (regex: RegExp, message: string, messageEn?: string): ValidationRule => ({
    type: 'pattern',
    value: regex,
    message,
    messageEn,
  }),

  arabicName: (message = 'يرجى إدخال اسم بالعربية فقط'): ValidationRule => ({
    type: 'pattern',
    value: PATTERNS.arabicName,
    message,
    messageEn: 'Please enter name in Arabic only',
  }),

  englishName: (message = 'يرجى إدخال اسم بالإنجليزية فقط'): ValidationRule => ({
    type: 'pattern',
    value: PATTERNS.englishName,
    message,
    messageEn: 'Please enter name in English only',
  }),

  plateNumber: (message = 'يرجى إدخال رقم لوحة صحيح'): ValidationRule => ({
    type: 'pattern',
    value: PATTERNS.plateNumber,
    message,
    messageEn: 'Please enter a valid plate number',
  }),

  future: (message = 'التاريخ يجب أن يكون في المستقبل'): ValidationRule => ({
    type: 'future',
    message,
    messageEn: 'Date must be in the future',
  }),

  past: (message = 'التاريخ يجب أن يكون في الماضي'): ValidationRule => ({
    type: 'past',
    message,
    messageEn: 'Date must be in the past',
  }),

  time: (message = 'يرجى إدخال وقت صحيح (HH:MM)'): ValidationRule => ({
    type: 'time',
    message,
    messageEn: 'Please enter a valid time (HH:MM)',
  }),

  custom: (validator: (value: any) => boolean, message: string, messageEn?: string): ValidationRule => ({
    type: 'custom',
    value: validator,
    message,
    messageEn,
  }),
} as const

// Main validator class
class Validator {
  private schema: Record<string, ValidationRule[]> = {}

  // Define validation schema
  public define(schema: Record<string, ValidationRule[]>): Validator {
    this.schema = { ...this.schema, ...schema }
    return this
  }

  // Add field validation
  public field(name: string, rules: ValidationRule[]): Validator {
    this.schema[name] = rules
    return this
  }

  // Validate single value
  public validateField(value: any, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = []

    for (const rule of rules) {
      const error = this.applyRule(value, rule)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  // Validate entire object
  public validate(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = []

    for (const [fieldName, rules] of Object.entries(this.schema)) {
      const value = data[fieldName]
      const fieldErrors = this.validateField(value, rules)
      
      errors.push(...fieldErrors.map(error => ({
        ...error,
        field: fieldName,
      })))
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Apply individual validation rule
  private applyRule(value: any, rule: ValidationRule): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'email':
        if (value && !PATTERNS.email.test(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'phone':
        if (value && !PATTERNS.phone.test(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'nationalId':
        if (value && !PATTERNS.nationalId.test(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'minLength':
        if (value && value.length < rule.value) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'maxLength':
        if (value && value.length > rule.value) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'min':
        if (value !== null && value !== undefined && Number(value) < rule.value) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'max':
        if (value !== null && value !== undefined && Number(value) > rule.value) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'pattern':
        if (value && !rule.value.test(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'future':
        if (value && new Date(value) <= new Date()) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'past':
        if (value && new Date(value) >= new Date()) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'time':
        if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break

      case 'custom':
        if (value && !rule.value(value)) {
          return {
            field: '',
            type: rule.type,
            message: rule.message!,
            messageEn: rule.messageEn,
          }
        }
        break
    }

    return null
  }
}

// Utility functions
export const validateEmail = (email: string): boolean => PATTERNS.email.test(email)
export const validatePhone = (phone: string): boolean => PATTERNS.phone.test(phone)
export const validateNationalId = (id: string): boolean => PATTERNS.nationalId.test(id)
export const validateArabicName = (name: string): boolean => PATTERNS.arabicName.test(name)
export const validateEnglishName = (name: string): boolean => PATTERNS.englishName.test(name)

// Common validation schemas
export const COMMON_SCHEMAS = {
  parentRegistration: {
    name: [VALIDATION_RULES.required(), VALIDATION_RULES.arabicName()],
    nameEn: [VALIDATION_RULES.englishName()],
    phone: [VALIDATION_RULES.required(), VALIDATION_RULES.phone()],
    nationalId: [VALIDATION_RULES.required(), VALIDATION_RULES.nationalId()],
    email: [VALIDATION_RULES.email()],
  },

  studentRegistration: {
    name: [VALIDATION_RULES.required(), VALIDATION_RULES.arabicName()],
    nameEn: [VALIDATION_RULES.englishName()],
    nationalId: [VALIDATION_RULES.required(), VALIDATION_RULES.nationalId()],
    grade: [VALIDATION_RULES.required()],
    section: [VALIDATION_RULES.required()],
    guardianId: [VALIDATION_RULES.required()],
  },

  dismissalRequest: {
    studentIds: [
      VALIDATION_RULES.required('يجب اختيار طالب واحد على الأقل'),
      VALIDATION_RULES.custom(
        (value) => Array.isArray(value) && value.length > 0,
        'يجب اختيار طالب واحد على الأقل'
      ),
    ],
    reason: [VALIDATION_RULES.maxLength(500)],
    pickupTime: [VALIDATION_RULES.time()],
  },

  earlyDismissal: {
    studentId: [VALIDATION_RULES.required()],
    reason: [VALIDATION_RULES.required(), VALIDATION_RULES.minLength(10)],
    pickupTime: [VALIDATION_RULES.required(), VALIDATION_RULES.time()],
    parentContact: [VALIDATION_RULES.required(), VALIDATION_RULES.phone()],
  },

  driverAuthorization: {
    name: [VALIDATION_RULES.required(), VALIDATION_RULES.arabicName()],
    phone: [VALIDATION_RULES.required(), VALIDATION_RULES.phone()],
    nationalId: [VALIDATION_RULES.required(), VALIDATION_RULES.nationalId()],
    relationship: [VALIDATION_RULES.required()],
    authorizedStudents: [
      VALIDATION_RULES.required('يجب اختيار طالب واحد على الأقل'),
      VALIDATION_RULES.custom(
        (value) => Array.isArray(value) && value.length > 0,
        'يجب اختيار طالب واحد على الأقل'
      ),
    ],
  },

  carInfo: {
    make: [VALIDATION_RULES.required()],
    model: [VALIDATION_RULES.required()],
    color: [VALIDATION_RULES.required()],
    plateNumber: [VALIDATION_RULES.required(), VALIDATION_RULES.plateNumber()],
  },
} as const

// Export main classes and utilities
export { Validator, VALIDATION_RULES, PATTERNS }
export type { ValidationRule, ValidationResult, ValidationError }

// Create and export default validator instance
export const validator = new Validator()

// Quick validation functions for common use cases
export const createValidator = (schema: Record<string, ValidationRule[]>) => 
  new Validator().define(schema)

export const validateForm = (data: Record<string, any>, schema: Record<string, ValidationRule[]>) => 
  new Validator().define(schema).validate(data)

// React hook for form validation
export const useFormValidation = (schema: Record<string, ValidationRule[]>) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateField = (name: string, value: any) => {
    const fieldRules = schema[name] || []
    const fieldErrors = new Validator().validateField(value, fieldRules)
    
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[0]?.message || '',
    }))

    return fieldErrors.length === 0
  }

  const validateForm = (data: Record<string, any>) => {
    const result = new Validator().define(schema).validate(data)
    
    const newErrors: Record<string, string> = {}
    result.errors.forEach(error => {
      newErrors[error.field] = error.message
    })
    
    setErrors(newErrors)
    return result.isValid
  }

  const clearErrors = () => setErrors({})
  
  const clearFieldError = (name: string) => {
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.values(errors).some(error => error !== ''),
  }
}