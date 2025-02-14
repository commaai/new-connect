import { describe, expect, test } from 'vitest'

import { getFullAddress, reverseGeocode } from './geocode'

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
    expect(await getFullAddress([-77.036551, 38.898104])).toBe('1600 Pennsylvania Avenue Northwest, Washington, District of Columbia 20500, United States')
    expect(await getFullAddress([-0.106640, 51.514209])).toBe('133 Fleet Street, City of London, London, EC4A 2BB, United Kingdom')
    expect(await getFullAddress([-2.076843, 51.894799])).toBe('4 Montpellier Drive, Cheltenham, GL50 1TX, United Kingdom')
  })
})
