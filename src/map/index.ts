import polyline from '@mapbox/polyline'

import {
  MAPBOX_USERNAME,
  MAPBOX_LIGHT_STYLE_ID,
  MAPBOX_DARK_STYLE_ID,
  MAPBOX_TOKEN,
} from './config'

export type Coords = [number, number][]

const POLYLINE_SAMPLE_SIZE = 50
const POLYLINE_PRECISION = 4

function getMapStyleId(themeId: string): string {
  return themeId === 'light' ? MAPBOX_LIGHT_STYLE_ID : MAPBOX_DARK_STYLE_ID
}

function prepareCoords(coords: Coords, sampleSize: number): Coords {
  const sample = []
  const step = Math.max(Math.floor(coords.length / sampleSize), 1)
  for (let i = 0; i < coords.length; i += step) {
    const point = coords[i]
    // 1. mapbox uses lng,lat order
    // 2. polyline output is off by 10x when precision is 4
    sample.push([point[1] * 10, point[0] * 10] as [number, number])
  }
  return sample
}

export function openCoordinates(latitude: number, longitude: number) {
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  let mapUrl

  if (isAppleDevice) {
    mapUrl = `https://maps.apple.com/?ll=${latitude},${longitude}`
  } else {
    mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
  }

  window.open(mapUrl, '_blank')
}


class EsriAddress {
  Match_addr?: string
}

class EsriGeocodeResponse {
  address?: EsriAddress
}

export async function reverseGeocode (lat: number, lng: number) {
  const response = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`,
  )

  if (!response.ok) {
    throw new Error(`Error fetching address: ${response.status}`)
  }

  const data: EsriGeocodeResponse = await response.json() as EsriGeocodeResponse
  return data.address?.Match_addr || 'Unknown address'
}

// TODO: get path colour from theme
export function getPathStaticMapUrl(
  themeId: string,
  coords: Coords,
  width: number,
  height: number,
  hidpi: boolean,
  strokeWidth: number = 4,
  color: string = 'DFE0FF',
  opacity: number = 1,
): string {
  const styleId = getMapStyleId(themeId)
  const hidpiStr = hidpi ? '@2x' : ''
  const encodedPolyline = polyline.encode(
    prepareCoords(coords, POLYLINE_SAMPLE_SIZE),
    POLYLINE_PRECISION,
  )
  const path = `path-${strokeWidth}+${color}-${opacity}(${encodeURIComponent(
    encodedPolyline,
  )})`
  return `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${styleId}/static/${path}/auto/${width}x${height}${hidpiStr}?logo=false&attribution=false&padding=30,30,30,30&access_token=${MAPBOX_TOKEN}`
}
