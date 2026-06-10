import { describe, it, expect } from 'vitest'
import { aggregate } from '../state/aggregations'

describe('aggregate', () => {
  describe('sum', () => {
    it('sums values', () => expect(aggregate([1, 2, 3], 'sum')).toBe(6))
    it('returns null for empty array', () => expect(aggregate([], 'sum')).toBeNull())
  })

  describe('avg', () => {
    it('averages values', () => expect(aggregate([10, 20, 30], 'avg')).toBe(20))
    it('returns null for empty array', () => expect(aggregate([], 'avg')).toBeNull())
  })

  describe('count', () => {
    it('returns length of array', () => expect(aggregate([1, 1, 1, 1], 'count')).toBe(4))
    it('returns 0 for empty array', () => expect(aggregate([], 'count')).toBe(0))
  })

  describe('min', () => {
    it('returns the minimum', () => expect(aggregate([5, 1, 3], 'min')).toBe(1))
    it('returns null for empty array', () => expect(aggregate([], 'min')).toBeNull())
  })

  describe('max', () => {
    it('returns the maximum', () => expect(aggregate([5, 1, 3], 'max')).toBe(5))
    it('returns null for empty array', () => expect(aggregate([], 'max')).toBeNull())
  })
})
