// Mock validation schemas and functions for demo mode
// Replaces Zod with simple validation logic

// Input validation schemas (mock implementations)
export const BarcodeSchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('Barcode must be a string')
    const trimmed = input.trim()
    if (trimmed.length === 0) throw new Error('Barcode cannot be empty')
    if (trimmed.length > 50) throw new Error('Barcode too long')
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) throw new Error('Barcode can only contain letters and numbers')

    // Allow ITM format (ITM001, ITM024, etc.) or plain numbers
    if (!(/^ITM\d{1,6}$/i.test(trimmed) || /^\d{1,6}$/.test(trimmed) || /^[A-Za-z0-9]{1,20}$/.test(trimmed))) {
      throw new Error('Invalid barcode format. Expected ITM followed by numbers or plain item ID')
    }
    return trimmed
  }
}

export const ItemIdSchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('Item ID must be a string')
    const trimmed = input.trim()
    if (trimmed.length === 0) throw new Error('Item ID cannot be empty')
    if (trimmed.length > 20) throw new Error('Item ID too long')
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) throw new Error('Item ID can only contain letters and numbers')

    // Allow ITM format, plain numbers, or alphanumeric IDs
    if (!(/^ITM\d{1,6}$/i.test(trimmed) || /^\d{1,6}$/.test(trimmed) || /^[A-Za-z0-9]{1,20}$/.test(trimmed))) {
      throw new Error('Invalid item ID format')
    }
    return trimmed
  }
}

export const QuantitySchema = {
  parse: (input: number) => {
    if (typeof input !== 'number' || !Number.isInteger(input)) throw new Error('Quantity must be a whole number')
    if (input < 1) throw new Error('Quantity must be at least 1')
    if (input > 1000) throw new Error('Quantity cannot exceed 1000')
    return input
  }
}

export const EmployeeIdSchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('Employee ID must be a string')
    const trimmed = input.trim()
    if (trimmed.length === 0) throw new Error('Employee ID cannot be empty')
    if (trimmed.length > 20) throw new Error('Employee ID too long')
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) throw new Error('Employee ID format invalid')
    return trimmed
  }
}

export const UsernameSchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('Username must be a string')
    const trimmed = input.trim()
    if (trimmed.length < 2) throw new Error('Username must be at least 2 characters')
    if (trimmed.length > 50) throw new Error('Username too long')
    if (!/^[A-Za-z0-9_.\s-]+$/.test(trimmed)) throw new Error('Username contains invalid characters')
    return trimmed
  }
}

export const ApiUrlSchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('URL must be a string')
    try {
      const url = new URL(input)
      if (!url.protocol.startsWith('http')) throw new Error('URL must start with http:// or https://')
      return input
    } catch {
      throw new Error('Invalid URL format')
    }
  }
}

export const SearchQuerySchema = {
  parse: (input: string) => {
    if (typeof input !== 'string') throw new Error('Search query must be a string')
    const trimmed = input.trim()
    if (trimmed.length > 100) throw new Error('Search query too long')
    if (!/^[A-Za-z0-9\s._-]*$/.test(trimmed)) throw new Error('Search query contains invalid characters')
    return trimmed
  }
}

// API response validation schemas (mock implementations)
export const ApiItemSchema = {
  parse: (input: any) => {
    if (!input || typeof input !== 'object') throw new Error('Invalid item data')

    const item = { ...input }

    // Transform item_no to string if it's a number
    if (typeof item.item_no === 'number') {
      item.item_no = String(item.item_no)
    } else if (typeof item.item_no === 'string') {
      if (item.item_no.length > 255) throw new Error('Item number too long')
    } else {
      throw new Error('Item number is required')
    }

    if (!item.item_name || typeof item.item_name !== 'string' || item.item_name.length === 0) {
      throw new Error('Item name is required')
    }

    // Set defaults for optional fields
    item.brand = item.brand || 'Unknown Brand'
    item.item_type = item.item_type || 'General'
    item.location = item.location || 'Unknown Location'

    // Validate balance
    if (typeof item.balance !== 'number' || item.balance < 0) {
      throw new Error('Balance must be a non-negative number')
    }

    return item
  }
}

export const ApiEmployeeSchema = {
  parse: (input: any) => {
    if (!input || typeof input !== 'object') throw new Error('Invalid employee data')

    // Basic validation - in demo mode, we accept most data
    const requiredFields = ['id', 'fullName', 'firstName', 'lastName', 'idNumber', 'idBarcode', 'position', 'department', 'status']
    for (const field of requiredFields) {
      if (!input[field]) throw new Error(`${field} is required`)
    }

    return input
  }
}

export const ApiResponseSchema = {
  parse: (input: any) => {
    if (!input || typeof input !== 'object') throw new Error('Invalid API response')
    // Basic validation - accept any object with success field
    if (typeof input.success !== 'boolean') throw new Error('Response must have success field')
    return input
  }
}

// Validation functions
export function validateBarcode(input: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const validated = BarcodeSchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid barcode" }
  }
}

export function validateItemId(input: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const validated = ItemIdSchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid item ID" }
  }
}

export function validateQuantity(input: number): { isValid: boolean; error?: string; value?: number } {
  try {
    const validated = QuantitySchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid quantity" }
  }
}

export function validateEmployeeId(input: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const validated = EmployeeIdSchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid employee ID" }
  }
}

export function validateApiUrl(input: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const validated = ApiUrlSchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid API URL" }
  }
}

export function validateSearchQuery(input: string): { isValid: boolean; error?: string; value?: string } {
  try {
    const validated = SearchQuerySchema.parse(input)
    return { isValid: true, value: validated }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid search query" }
  }
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

export function sanitizeForLog(input: any): string {
  if (typeof input === "string") {
    return sanitizeHtml(input).substring(0, 1000) // Limit length
  }
  if (typeof input === "object") {
    try {
      return sanitizeHtml(JSON.stringify(input)).substring(0, 1000)
    } catch {
      return "[Object]"
    }
  }
  return String(input).substring(0, 1000)
}

// Rate limiting helper (simple in-memory implementation)
class RateLimiter {
  private requests = new Map<string, number[]>()
  
  isAllowed(key: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const timestamps = this.requests.get(key)!
    // Remove old timestamps
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart)
    
    if (validTimestamps.length >= maxRequests) {
      return false
    }
    
    validTimestamps.push(now)
    this.requests.set(key, validTimestamps)
    return true
  }
  
  clear() {
    this.requests.clear()
  }
}

export const rateLimiter = new RateLimiter()

// Security headers helper
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const