import { describe, expect, test } from 'vitest'

import { getFullAddress, getPlaceName, reverseGeocode } from './geocode'

describe('reverseGeocode', () => {
  test('return null if coords are [0, 0]', async () => {
    expect(await reverseGeocode([0, 0])).toBeNull()
  })
})

describe('getFullAddress', () => {
  test('return null if coords are [0, 0]', async () => {
    expect(await getFullAddress([0, 0])).toBeNull()
  })

  test('normal usage', async () => {
    expect(await getFullAddress([-0.10664, 51.514209])).toMatch(/131 Fleet Street/)
    expect(await getFullAddress([-2.076843, 51.894799])).toBe('4 Montpellier Drive, Cheltenham, GL50 1TX, United Kingdom')
  })
})

describe('getPlaceName', () => {
  test('return null if coords are [0, 0]', async () => {
    expect(await getPlaceName([0, 0])).toBeNull()
  })

  test('normal usage', async () => {
    expect(await getPlaceName([-117.168638, 32.723695])).toBe('Little Italy')
    expect(await getPlaceName([-118.192757, 33.763015])).toBe('Downtown Long Beach')
    expect(await getPlaceName([-0.113643, 51.504546])).toBe('Waterloo')
    expect(await getPlaceName([5.572254, 50.64428])).toBe('Liège')
    expect(await getPlaceName([-2.236802, 53.480931])).toBe('Northern Quarter')
  })
})
