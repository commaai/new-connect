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

export function getMapStyleId(themeId: string): string {
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

export function getPlaceFromCoords(lng: number | undefined, lat:number | undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    if(!lat || !lng) reject('supply valid coords') // keeps the calling code a bit cleaner
    fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}.733&types=address&worldview=us&access_token=${MAPBOX_TOKEN}`)
      .then(res => res.json())
      .then(res => {
        // if the object is not found, we can handle the error appropriately in the ui
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @stylistic/max-len
        const neighborhood = res.features[0].properties.context.neighborhood, region = res.features[0].properties.context.region
        if(neighborhood && region) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          resolve(`${neighborhood.name}, ${region.region_code}`)
        } else reject('coords dont have required details')
      })
      .catch(err => reject(err))
  })
}
