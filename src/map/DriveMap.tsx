/* eslint-disable solid/style-prop */
import { VoidComponent, createEffect, createSignal } from 'solid-js'
import MapGL, { Source, Layer, Viewport } from 'solid-map-gl'
import { MAPBOX_TOKEN, MAPBOX_USERNAME } from './config'
import { GPSPathPoint } from '~/api/derived'
import { getMapStyleId } from '.'
import { getThemeId } from '~/theme'
import { calculateAverageBearing } from './bearing'

type Props = {
  coords: GPSPathPoint[],
  point: number
}

const DriveMap: VoidComponent<Props> = (props) => {
  
  const coords = () => props.coords
  const point = () => props.point

  const [marker, setMarker] = createSignal([coords()[0].lng, coords()[0].lat])
  const [viewport, setViewport] = createSignal({
    // eslint-disable-next-line solid/reactivity
    center: marker(),
    zoom: 12,
  } as Viewport)

  let lastBearing: number = 180
  const BEARING_THRESHOLD = 15

  const getBearing = (time: number) => {
    const start = coords().findIndex(coord => coord.t === Math.round(time))
    const path = coords().slice(start, Math.min(start + 10, coords().length))

    const newBearing = calculateAverageBearing(path)
    if(Math.abs(newBearing - lastBearing) > BEARING_THRESHOLD) {
      lastBearing = newBearing
      return newBearing
    }
    return lastBearing
  }

  createEffect(() => {
    const coord = coords().find(coord => coord.t === Math.round(point()))
    if(coord?.lat && coord.lng) {
      setMarker([coord.lng, coord.lat])
      setViewport({
        center: [coord.lng, coord.lat],
        zoom: 15,
        pitch: 45,
        bearing: getBearing(coord.t),
      })
    }
  })

  return (
    <div class="relative mt-2 size-full overflow-hidden rounded-lg">
      <div class="size-full">
        <MapGL
          options={{
            accessToken: MAPBOX_TOKEN,
            style: `mapbox://styles/${MAPBOX_USERNAME}/${getMapStyleId(getThemeId())}`,
          }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
        >
          <Source
            source={{
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coords().map(coord => [coord.lng, coord.lat]),
                },
              },
            }}
          >
            <Layer
              style={{
                type: 'line',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#DFE0FF',
                  'line-width': 5,
                },
              }}
            />
          </Source>
          <Source
            source={{
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: marker(),
                },
              },
            }}
          >
            <Layer
              style={{
                type: 'circle',
                paint: {
                  'circle-radius': 8,
                  'circle-color': 'red',
                },
              }}
            />
          </Source>
        </MapGL>
      </div>
    </div>
  )
}

export default DriveMap
