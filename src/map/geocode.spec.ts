import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Position } from 'geojson'

import type { ReverseGeocodingFeature, ReverseGeocodingResponse } from './api-types'
import { getFullAddress, getPlaceName, reverseGeocode } from './geocode'
import { MAPBOX_TOKEN } from './config'

const fetchMock = vi.fn()

type MockContext = Partial<ReverseGeocodingFeature['properties']['context']>

function createFeature(fullAddress: string, context: MockContext = {}): ReverseGeocodingFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0],
    },
    properties: {
      feature_type: 'address',
      name: fullAddress,
      name_preferred: fullAddress,
      place_formatted: fullAddress,
      full_address: fullAddress,
      context,
    },
  } as ReverseGeocodingFeature
}

function createResponse(feature: ReverseGeocodingFeature): ReverseGeocodingResponse {
  return {
    type: 'FeatureCollection',
    attribution: 'test fixture',
    features: [feature],
  } as ReverseGeocodingResponse
}

function coordinateKey(position: Position): string {
  return `${position[0].toFixed(6)},${position[1].toFixed(6)}`
}

function mockReverseGeocode(featuresByCoordinate: Map<string, ReverseGeocodingFeature>) {
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const url = new URL(rawUrl)
    const key = `${url.searchParams.get('longitude')},${url.searchParams.get('latitude')}`
    const feature = featuresByCoordinate.get(key)
    if (!feature) throw new Error(`Unexpected reverse geocode lookup for ${key}`)

    return new Response(JSON.stringify(createResponse(feature)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('reverseGeocode', () => {
  test('return null if coords are [0, 0] without calling fetch', async () => {
    expect(await reverseGeocode([0, 0])).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('return first feature from reverse geocode response', async () => {
    const position: Position = [-0.10664, 51.514209]
    const feature = createFeature('133 Fleet Street, City of London, London, EC4A 2BB, United Kingdom')
    mockReverseGeocode(new Map([[coordinateKey(position), feature]]))

    expect(await reverseGeocode(position)).toEqual(feature)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('request includes expected Mapbox URL, params, and cache mode', async () => {
    const position: Position = [-0.10664, 51.514209]
    const feature = createFeature('133 Fleet Street, City of London, London, EC4A 2BB, United Kingdom')
    mockReverseGeocode(new Map([[coordinateKey(position), feature]]))

    await reverseGeocode(position)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [input, init] = fetchMock.mock.calls[0] as [string | URL | Request, RequestInit | undefined]
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const url = new URL(rawUrl)
    expect(`${url.origin}${url.pathname}`).toBe('https://api.mapbox.com/search/geocode/v6/reverse')
    expect(url.searchParams.get('longitude')).toBe('-0.106640')
    expect(url.searchParams.get('latitude')).toBe('51.514209')
    expect(url.searchParams.get('access_token')).toBe(MAPBOX_TOKEN)
    expect(init).toMatchObject({ cache: 'force-cache' })
  })

  test('return null when fetch rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    expect(await reverseGeocode([-0.10664, 51.514209])).toBeNull()
  })

  test('return null on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('denied', { status: 429, statusText: 'Too Many Requests' }))

    expect(await reverseGeocode([-0.10664, 51.514209])).toBeNull()
  })

  test('return null when response json cannot be parsed', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{', { status: 200, headers: { 'Content-Type': 'application/json' } }))

    expect(await reverseGeocode([-0.10664, 51.514209])).toBeNull()
  })
})

describe('getFullAddress', () => {
  test('return null if coords are [0, 0] without calling fetch', async () => {
    expect(await getFullAddress([0, 0])).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('normal usage', async () => {
    mockReverseGeocode(
      new Map([
        [coordinateKey([-0.10664, 51.514209]), createFeature('133 Fleet Street, City of London, London, EC4A 2BB, United Kingdom')],
        [coordinateKey([-2.076843, 51.894799]), createFeature('4 Montpellier Drive, Cheltenham, GL50 1TX, United Kingdom')],
      ]),
    )

    expect(await getFullAddress([-0.10664, 51.514209])).toBe('133 Fleet Street, City of London, London, EC4A 2BB, United Kingdom')
    expect(await getFullAddress([-2.076843, 51.894799])).toBe('4 Montpellier Drive, Cheltenham, GL50 1TX, United Kingdom')
  })
})

describe('getPlaceName', () => {
  test('return null if coords are [0, 0] without calling fetch', async () => {
    expect(await getPlaceName([0, 0])).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('normal usage', async () => {
    mockReverseGeocode(
      new Map([
        [coordinateKey([-117.168638, 32.723695]), createFeature('', { neighborhood: { name: 'Little Italy' } })],
        [coordinateKey([-118.192757, 33.763015]), createFeature('', { place: { name: 'Downtown Long Beach' } })],
        [coordinateKey([-0.113643, 51.504546]), createFeature('', { neighborhood: { name: 'Waterloo' } })],
        [coordinateKey([5.572254, 50.64428]), createFeature('', { locality: { name: 'Liège' } })],
        [coordinateKey([-2.236802, 53.480931]), createFeature('', { neighborhood: { name: 'Northern Quarter' } })],
      ]),
    )

    expect(await getPlaceName([-117.168638, 32.723695])).toBe('Little Italy')
    expect(await getPlaceName([-118.192757, 33.763015])).toBe('Downtown Long Beach')
    expect(await getPlaceName([-0.113643, 51.504546])).toBe('Waterloo')
    expect(await getPlaceName([5.572254, 50.64428])).toBe('Liège')
    expect(await getPlaceName([-2.236802, 53.480931])).toBe('Northern Quarter')
  })

  test('prefer more specific context values first', async () => {
    mockReverseGeocode(
      new Map([
        [
          coordinateKey([-122.4194, 37.7749]),
          createFeature('', {
            neighborhood: { name: 'Mission District' },
            place: { name: 'San Francisco' },
            locality: { name: 'California' },
          }),
        ],
      ]),
    )

    expect(await getPlaceName([-122.4194, 37.7749])).toBe('Mission District')
  })

  test('return empty string when no place context is available', async () => {
    mockReverseGeocode(new Map([[coordinateKey([1, 1]), createFeature('')]]))

    expect(await getPlaceName([1, 1])).toBe('')
  })
})
