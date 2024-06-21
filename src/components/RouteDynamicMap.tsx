/* eslint-disable */
/* tslint:disable */
import { createResource, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { videoTimeStore, speedStore } from './store/driveReplayStore'

import {
  MAPBOX_TOKEN,
} from '~/map/config'

import { getCoords } from '~/api/derived'
import type { Route } from '~/types'

import mapboxgl from 'mapbox-gl'

type RouteDynamicMapProps = {
  class?: string
  route: Route | undefined
}

const RouteDynamicMap: VoidComponent<RouteDynamicMapProps> = (props) => {
  const [coords] = createResource(() => props.route, getCoords)

  let [mapContainer, setMapContainer] = createSignal<HTMLDivElement | null>(null)
  let map: mapboxgl.Map | null = null

  const { videoTime } = videoTimeStore()
  const { setSpeed } = speedStore()

  createEffect(() => {
    const coordinates = coords();
    if (coordinates) {
      onMount(() => {
        console.log(coordinates)
        const { lng: initLng, lat: initLat } = coordinates[0]
        mapboxgl.accessToken = MAPBOX_TOKEN // replace with your Mapbox access token
        map = new mapboxgl.Map({
          container: mapContainer(), // get the current value of the signal
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [initLng, initLat],
          zoom: 9,
          attributionControl: false,
        });

        if (coordinates) {
          const line = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates.map(({ lng, lat }) => [lng, lat]),
            },
          }

          map.on('load', () => {
            const canvas = map.getCanvasContainer().firstChild as HTMLCanvasElement
            canvas.style.borderRadius = '10px'
            canvas.style.width = '100%'

            map.addSource('route', {
              type: 'geojson',
              data: line,
            })

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#888', 'line-width': 8 },
            })

            // Add a circle at the start of the line
            map.addSource('startPoint', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: line.geometry.coordinates[0],
                },
              },
            })

            map.addLayer({
              id: 'startPoint',
              type: 'circle',
              source: 'startPoint',
              paint: {
                'circle-radius': 7,
                'circle-color': '#f00',
              },
            })

            createEffect(() => {
              const currentVideoTime = videoTime()
              const roundedVideoTime = Math.round(currentVideoTime)
              const currentCoordsIndex = coordinates.findIndex(item => item.t === roundedVideoTime)
              if (currentCoordsIndex !== undefined && currentCoordsIndex < coordinates.length - 1 && map) {
                const currentCoords = coordinates[currentCoordsIndex]
                const nextCoords = coordinates[currentCoordsIndex + 1]

                if (currentCoords && nextCoords) {
                  const coordWindowSize = 10
                  // Calculate the bearing between the current point and the next point
                  const bearing = calculateAverageBearing(coordinates.slice(currentCoordsIndex, currentCoordsIndex + coordWindowSize))

                  map.getSource('startPoint').setData({
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [currentCoords.lng, currentCoords.lat],
                    },
                  })

                  setSpeed(currentCoords.speed)

                  map.flyTo({ center: [currentCoords.lng, currentCoords.lat], bearing: bearing, pitch: 60, zoom: 15 })
                }
              }
            })
            interface Coordinate {
              lat: number;
              lng: number;
            }

            // Function to calculate the bearing between two points
            function calculateBearing(start: Coordinate, end: Coordinate) {
              const startLat = radians(start.lat)
              const startLng = radians(start.lng)
              const endLat = radians(end.lat)
              const endLng = radians(end.lng)
              let dLng = endLng - startLng
            
              const dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0))
              if (Math.abs(dLng) > Math.PI) {
                dLng = dLng > 0.0 ? -(2.0 * Math.PI - dLng) : (2.0 * Math.PI + dLng)
              }
            
              return (degrees(Math.atan2(dLng, dPhi)) + 360.0) % 360.0
            }

            // Function to calculate the average bearing over a window of points
            function calculateAverageBearing(points: Coordinate[]) {
              const bearings = []
              for (let i = 0; i < points.length - 1; i++) {
                const bearing = calculateBearing(points[i], points[i + 1])
                bearings.push(bearing)
              }
              const sum = bearings.reduce((a, b) => a + b, 0)
              return sum / bearings.length
            }

            function radians(degrees: number) {
              return degrees * Math.PI / 180.0;
            }

            function degrees(radians: number) {
              return radians * 180.0 / Math.PI
            }

            // Zoom map to fit the line bounds
            const bounds = line.geometry.coordinates.reduce(
              (bounds, coord) => bounds.extend(coord), 
              new mapboxgl.LngLatBounds(
                line.geometry.coordinates[0], 
                line.geometry.coordinates[0]
              )
            )
            map.fitBounds(bounds, { padding: 20 })
          })
        }
      })
    }
  })

  onCleanup(() => {
    if (map) {
      map.remove()
    }
  })

  return (
    <div
      class={clsx(
        'my-4 h-[270px] w-full',
        props.class,
      )}
      ref={setMapContainer}
    >
      {/* ...existing code... */}
    </div>
  )
}

export default RouteDynamicMap
