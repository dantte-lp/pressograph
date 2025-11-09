import { describe, it, expect, vi } from 'vitest'
import { isValidTestNumberFormat, validateCustomTestNumber } from './test-number'

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
  },
}))

describe('Test Number Utilities', () => {
  describe('isValidTestNumberFormat', () => {
    it('should validate a correct sequential test number format', () => {
      const result = isValidTestNumberFormat('PT-2025-001')
      expect(result).toBe(true)
    })

    it('should validate test number with different prefix', () => {
      const result = isValidTestNumberFormat('TEST-2024-042')
      expect(result).toBe(true)
    })

    it('should validate alphanumeric test numbers', () => {
      const result = isValidTestNumberFormat('PT-ABC123')
      expect(result).toBe(true)
    })

    it('should validate test numbers with underscores', () => {
      const result = isValidTestNumberFormat('PT_2025_001')
      expect(result).toBe(true)
    })

    it('should reject empty strings', () => {
      const result = isValidTestNumberFormat('')
      expect(result).toBe(false)
    })

    it('should reject test numbers that are too short', () => {
      const result = isValidTestNumberFormat('PT')
      expect(result).toBe(false)
    })

    it('should reject test numbers with invalid characters', () => {
      const result = isValidTestNumberFormat('PT-2025-001!')
      expect(result).toBe(false)
    })

    it('should reject test numbers starting with hyphen', () => {
      const result = isValidTestNumberFormat('-PT-2025-001')
      expect(result).toBe(false)
    })
  })

  describe('validateCustomTestNumber', () => {
    it('should validate a valid custom test number', async () => {
      const result = await validateCustomTestNumber('PT-2025-001', 'org123')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty test number', async () => {
      const result = await validateCustomTestNumber('', 'org123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Test number is required')
    })

    it('should reject test number that is too short', async () => {
      const result = await validateCustomTestNumber('PT', 'org123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Test number must be at least 3 characters')
    })

    it('should trim whitespace and validate', async () => {
      const result = await validateCustomTestNumber('  PT-2025-001  ', 'org123')
      expect(result.valid).toBe(true)
    })

    it('should reject test numbers with invalid format', async () => {
      const result = await validateCustomTestNumber('PT-2025-001!', 'org123')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('letters, numbers, hyphens, and underscores')
    })
  })
})
