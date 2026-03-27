import { describe, expect, test } from 'vitest'

import { getFullAddress, getPlaceName, reverseGeocode } from './geocode'

const describeLive = process.env.RUN_LIVE_MAP_TESTS === '1' ? describe : describe.skip

describeLive('live geocode smoke tests', () => {
  test('reverseGeocode returns a feature for a known coordinate', async () => {
    expect(await reverseGeocode([-0.10664, 51.514209])).not.toBeNull()
  }, 15000)

  test('getFullAddress returns a non-empty string', async () => {
    const fullAddress = await getFullAddress([-0.10664, 51.514209])
    expect(fullAddress).toBeTruthy()
    expect(typeof fullAddress).toBe('string')
  }, 15000)

  test('getPlaceName returns a non-empty string', async () => {
    const placeName = await getPlaceName([-117.168638, 32.723695])
    expect(placeName).toBeTruthy()
    expect(typeof placeName).toBe('string')
  }, 15000)
})
