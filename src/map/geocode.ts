import type { Position } from 'geojson'
import * as Sentry from '@sentry/browser'

import type { ReverseGeocodingResponse, ReverseGeocodingFeature } from '~/map/api-types'
import { MAPBOX_TOKEN } from '~/map/config'

export async function reverseGeocode(position: Position): Promise<ReverseGeocodingFeature | null> {
  if (Math.abs(position[0]) < 0.001 && Math.abs(position[1]) < 0.001) {
    return null
  }
  const query = new URLSearchParams({
    // 6dp is ~10cm accuracy
    longitude: position[0].toFixed(6),
    latitude: position[1].toFixed(6),
    access_token: MAPBOX_TOKEN,
  })
  let resp: Response
  try {
    resp = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${query.toString()}`, { cache: 'force-cache' })
  } catch (error) {
    console.error('[geocode] Reverse geocode lookup failed', error)
    return null
  }
  if (!resp.ok) {
    Sentry.captureException(new Error(`Reverse geocode lookup failed: ${resp.status} ${resp.statusText}`))
    return null
  }
  try {
    // TODO: validate
    const collection = (await resp.json()) as ReverseGeocodingResponse
    return collection?.features?.[0] ?? null
  } catch (error) {
    Sentry.captureException(new Error('Could not parse reverse geocode response', { cause: error }))
    return null
  }
}

export async function getFullAddress(position: Position): Promise<string | null> {
  const feature = await reverseGeocode(position)
  if (!feature) return null
  return feature.properties.full_address
}

export async function getPlaceName(position: Position): Promise<string | null> {
  const feature = await reverseGeocode(position)
  if (!feature) return null
  const {
    properties: { context },
  } = feature
  return (
    [
      // context.street?.name,
      context.neighborhood?.name,
      context.place?.name,
      context.locality?.name,
      context.district?.name,
      context.region?.name,
      context.country?.name,
    ].find(Boolean) || ''
  )
}
