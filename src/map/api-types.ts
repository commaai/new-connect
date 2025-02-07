import type { FeatureCollection, Point } from 'geojson'

/**
 * @see https://docs.mapbox.com/api/search/geocoding/#geocoding-response-object
 */
export interface ReverseGeocodingResponse extends FeatureCollection<Point, ReverseGeocodingFeatureProperties> {
  attribution: string
}

export type ReverseGeocodingFeature = ReverseGeocodingResponse['features'][number]

interface ReverseGeocodingFeatureProperties {
  name: string
  name_preferred: string
  place_formatted: string
  full_address: string
}
