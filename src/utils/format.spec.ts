import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatDate } from './format'


describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-02-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should format date', () => {
    expect(formatDate('2023/01/02')).toBe('January 2nd, 2023')
    expect(formatDate('2018/12/25')).toBe('December 25th, 2018')
  })

  it('should omit year for dates in the current year', () => {
    expect(formatDate('2025/01/01')).toBe('January 1st')
    expect(formatDate('2025/01/02')).toBe('January 2nd')
  })

  it('should parse unix timestamps', () => {
    expect(formatDate(0)).toBe('January 1st, 1970')
    expect(formatDate(1482652800)).toBe('December 25th, 2016')
    expect(formatDate(1738943059)).toBe('February 7th')
    expect(formatDate(1738943059000)).toBe('February 7th')
  })
})
