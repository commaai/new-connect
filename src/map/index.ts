import polyline from '@mapbox/polyline'
import type { GeocodeResult } from '~/types'

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

// Concept for later use, if deceided to visualize car events on plotted line

/* type ColorSegment = {
  color: string;
  percentage: number;
};

export function getPathStaticMapUrl(
  themeId: string,
  coords: Coords,
  width: number,
  height: number,
  hidpi: boolean,
  strokeWidth: number = 4,
  colorSegments: ColorSegment[] = [{ color: 'DFE0FF', percentage: 100 }],
  opacity: number = 1,
): string {
  const styleId = getMapStyleId(themeId)
  const hidpiStr = hidpi ? '@2x' : ''
  let start = 0
  const paths = colorSegments.map(({ color, percentage }) => {
    const end = start + Math.floor((percentage / 100) * coords.length)
    const segment = coords.slice(start, end)
    start = end
    const encodedPolyline = polyline.encode(
      prepareCoords(segment, POLYLINE_SAMPLE_SIZE),
      POLYLINE_PRECISION,
    )
    return `path-${strokeWidth}+${color}-${opacity}(${encodeURIComponent(
      encodedPolyline,
    )})`
  }).join(',')
  return `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${styleId}/static/${paths}/auto/${width}x${height}${hidpiStr}?logo=false&attribution=false&padding=30,30,30,30&access_token=${MAPBOX_TOKEN}`
} */

export async function reverseGeocode(lng: number, lat: number): Promise<GeocodeResult> {
  const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}.733&types=address&worldview=us&access_token=${MAPBOX_TOKEN}`;
  try {
    const response = await fetch(url);
    const data = await (response.json() as Promise<GeocodeResult>);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}