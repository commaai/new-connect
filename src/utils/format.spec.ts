import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dateTimeToColorBetween, formatDate, formatDistance, formatDuration, getRouteSegment } from './format'

describe('formatDistance', () => {
  it('should format distance', () => {
    expect(formatDistance(0)).toBe('0.0 mi')
    expect(formatDistance(1.234)).toBe('1.2 mi')
  })
  it('should be undefined for undefined distance', () => {
    expect(formatDistance(undefined)).toBe(undefined)
  })
})

describe('formatDuration', () => {
  it('should format duration', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(12)).toBe('12 min')
    expect(formatDuration(12.34)).toBe('12 min')
    expect(formatDuration(90)).toBe('1 hr 30 min')
    expect(formatDuration(120)).toBe('2 hr 0 min')
  })
  it('should be undefined for undefined duration', () => {
    expect(formatDuration(undefined)).toBe(undefined)
  })
})

describe('getRouteSegment', () => {
  it('should map a playback time to its segment number', () => {
    expect(getRouteSegment(0)).toBe(0)
    expect(getRouteSegment(59.9)).toBe(0)
    expect(getRouteSegment(60)).toBe(1)
    expect(getRouteSegment(125)).toBe(2)
  })
  it('should never return a negative segment', () => {
    expect(getRouteSegment(-10)).toBe(0)
  })
  it('should clamp to the last available segment', () => {
    expect(getRouteSegment(120, 5)).toBe(2)
    expect(getRouteSegment(600, 3)).toBe(3)
    expect(getRouteSegment(60, 0)).toBe(0)
  })
})

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

describe('dateTimeToColorBetween', () => {
  it('should generate a color between two colors', () => {
    expect(
      dateTimeToColorBetween(new Date('2025-02-01T00:00:00.000Z'), new Date('2025-02-01T00:00:00.000Z'), [30, 57, 138], [218, 161, 28]),
    ).toBe('rgb(30, 57, 138)')
    expect(
      dateTimeToColorBetween(new Date('2025-02-01T06:00:00.000Z'), new Date('2025-02-01T06:00:00.000Z'), [30, 57, 138], [218, 161, 28]),
    ).toBe('rgb(93, 92, 101)')
    expect(
      dateTimeToColorBetween(new Date('2025-02-01T12:00:00.000Z'), new Date('2025-02-01T12:00:00.000Z'), [30, 57, 138], [218, 161, 28]),
    ).toBe('rgb(218, 161, 28)')
    expect(
      dateTimeToColorBetween(new Date('2025-02-01T18:00:00.000Z'), new Date('2025-02-01T18:00:00.000Z'), [30, 57, 138], [218, 161, 28]),
    ).toBe('rgb(218, 161, 28)')
  })
})
