import polyline from '@mapbox/polyline'

import {
  MAPBOX_USERNAME,
  MAPBOX_LIGHT_STYLE_ID,
  MAPBOX_DARK_STYLE_ID,
  MAPBOX_TOKEN,
} from './config'
import { getThemeId } from '~/theme'

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

export function getTileUrl(): string {
  const themeId = getThemeId()
  const styleId = getMapStyleId(themeId)

  return `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${styleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
}

export async function getPlaceName(lat: number, lng: number): Promise<string | null> {
  type PlaceNameResponse = {
    features?: Array<{ place_name?: string }>
  }

  const rsp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`)

  if (!rsp.ok) {
    return null
  }

  const data = await rsp.json() as PlaceNameResponse
  return data.features?.[0]?.place_name ?? null
}
