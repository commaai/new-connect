import type { VoidComponent } from 'solid-js'
import {
  createResource,
  createSignal,
  onMount,
  onCleanup,
  Show,
  createEffect,
} from 'solid-js'
import { createGeolocation } from '@solid-primitives/geolocation'
import { getDeviceLocation } from '~/api/devices'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapStyleId } from '~/map'
import { getThemeId } from '~/theme'
import { MAPBOX_TOKEN, MAPBOX_USERNAME } from '~/map/config'
import Icon from './material/Icon'
import { render } from 'solid-js/web'
import { DeviceLocation } from '~/types'
import { formatDateFromNow } from '~/utils/date'
import 'mapbox-gl/dist/mapbox-gl.css'


const PERSON_ICON = 'person'
const CAR_ICON = 'directions_car'

const MARKER_CLASS = 'marker'
const MAPBOX_CLASS = 'mapboxgl-canvas'

const VEHICLE_NAME_FALLBACK = 'Car'

const SAN_DIEGO: [number, number] = [-117.130775, 32.834686]
const DEFAULT_ZOOM = 10

type Location = {
  lat: number
  lng: number
  label: string
  address: string | null
  time: number
  type: 'device' | 'user'
}

type LocationBannerProps = {
  locationName: string
  locationTimestamp: number
  locationAddress: string
  onClose: () => void
}

const LocationBanner = (props: LocationBannerProps) => {
  return (
    <div class="absolute bottom-0 left-0 right-0 rounded-lg bg-surface-container-low px-8 py-4 m-2 shadow z-[5000]">
      <button
        onClick={() => props.onClose()}
        class="absolute top-0 left-0 p-1 bg-surface-container-lowest border border-gray-400/30 rounded-full -translate-y-1/4 -translate-x-1/4"
      >
        <Icon size="20">close</Icon>
      </button>
      <div class="flex justify-between items-center max-w-screen-xl mx-auto">
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-medium">{props.locationName}</h2>
          <p class="text-gray-400 text-sm">
            {formatDateFromNow(props.locationTimestamp)}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            onClick={() => {
              const address = encodeURIComponent(props.locationAddress)
              window.open(`https://maps.google.com?q=${address}`, '_blank')
            }}
            class="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-100"
          >
            open in maps
          </button>
        </div>
      </div>
      <div class="flex mt-4 max-w-screen-xl mx-auto">
        <p class="text-gray-300">{props.locationAddress}</p>
      </div>
    </div>
  )
}

const getStyleUrl = (): string => {
  const themeId = getThemeId()
  const mapStyleId = getMapStyleId(themeId)
  return `mapbox://styles/${MAPBOX_USERNAME}/${mapStyleId}`
}

async function getPlaceName(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
    )
    const data = (await response.json()) as {
      features?: { place_name?: string }[]
    }
    return data.features?.[0]?.place_name
  } catch {
    return null
  }
}

type DeviceLocationProps = {
  dongleId: string
  deviceName: string | undefined
}

const DeviceLocationMap: VoidComponent<DeviceLocationProps> = (props) => {
  let mapContainer!: HTMLDivElement
  const [map, setMap] = createSignal<mapboxgl.Map>()
  const [selectedLocation, setSelectedLocation] = createSignal<Location>()

  const [userLocation] = createGeolocation()
  const [deviceLocation] = createResource(
    () => props.dongleId,
    async (dongleId: string) => {
      return await getDeviceLocation(dongleId).catch(() => undefined)
    },
  )

  const [locationData] = createResource(
    () => ({
      deviceLocation: deviceLocation(),
      userLocation: userLocation(),
    }),
    async (args: {
      deviceLocation: DeviceLocation | undefined
      userLocation: GeolocationCoordinates | undefined
    }) => {
      const foundLocations: Location[] = []

      const deviceLocation = args.deviceLocation
      if (deviceLocation) {
        const address = await getPlaceName(
          deviceLocation.lat,
          deviceLocation.lng,
        )
        foundLocations.push({
          lat: deviceLocation.lat,
          lng: deviceLocation.lng,
          label: props.deviceName || VEHICLE_NAME_FALLBACK,
          address: address ?? '',
          time: deviceLocation.time,
          type: 'device',
        })
      }
      const userLocation = args.userLocation
      if (userLocation) {
        const addr = await getPlaceName(
          userLocation.latitude,
          userLocation.longitude,
        )

        foundLocations.push({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          label: 'You',
          address: addr ?? '',
          time: Date.now().valueOf(),
          type: 'user',
        })
      }

      return foundLocations
    },
  )

  createEffect(() => {
    const mapEntity = map()

    if (mapEntity && !locationData.loading) {
      const locations = locationData()
      if (!locations || locations.length === 0) return

      // Remove existing markers
      const existingMarkers = document.querySelectorAll(`.${MARKER_CLASS}`)
      existingMarkers.forEach((marker) => marker.remove())

      locations.forEach((loc) => {
        createMarker(
          loc,
          loc.type === 'user' ? PERSON_ICON : CAR_ICON,
          mapEntity,
        )
      })

      if (locations.length > 1) {
        const bounds = new mapboxgl.LngLatBounds()
        locations.forEach((loc) => {
          bounds.extend([loc.lng, loc.lat])
        })
        mapEntity.fitBounds(bounds, { padding: 50, animate: false })
      } else if (locations.length === 1) {
        mapEntity.setCenter([locations?.[0]?.lng, locations?.[0]?.lat])
      }
    }
  })

  onMount(() => {
    const mapboxMap = new mapboxgl.Map({
      container: mapContainer,
      style: getStyleUrl(),
      center: SAN_DIEGO,
      zoom: DEFAULT_ZOOM,
      accessToken: MAPBOX_TOKEN,
      attributionControl: false,
    })

    setMap(mapboxMap)

    const resizeObserver = new ResizeObserver(() => {
      mapboxMap.resize()
    })
    resizeObserver.observe(mapContainer)

    onCleanup(() => {
      resizeObserver.disconnect()
      mapboxMap.remove()
    })
  })

  const createMarker = (
    loc: Location,
    iconName: string,
    mapInstance: mapboxgl.Map,
  ) => {
    const el = document.createElement('div')
    el.className = MARKER_CLASS

    render(
      () => (
        <div
          class="flex size-[40px] items-center justify-center rounded-full bg-primary-container cursor-pointer"
          onClick={() => {
            setSelectedLocation(loc)
            const mapEntity = map()
            if (mapEntity) {
              mapEntity.flyTo({ center: [loc.lng, loc.lat] })
            }
          }}
        >
          <Icon>{iconName}</Icon>
        </div>
      ),
      el,
    )

    new mapboxgl.Marker(el).setLngLat([loc.lng, loc.lat]).addTo(mapInstance)
  }

  return (
    <div class="relative">
      <div
        ref={mapContainer}
        onClick={(e) => {
          // If the user clicks the map,
          // clear the selected location.
          if (e.target.classList.contains(MAPBOX_CLASS)) {
            setSelectedLocation(undefined)
          }
        }}
        class="h-[400px] w-full !bg-surface-container-low rounded-lg overflow-hidden [&_.mapboxgl-ctrl-logo]:hidden"
      />

      <Show when={locationData.loading}>
        <div class="absolute left-1/2 top-1/2 z-[5000] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-surface-variant px-4 py-2 shadow">
          <div class="mr-2 size-4 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" />
          <span class="text-sm">Loading...</span>
        </div>
      </Show>
      <Show when={selectedLocation()}>
        <LocationBanner
          onClose={() => setSelectedLocation(undefined)}
          locationName={selectedLocation()?.label || ''}
          locationTimestamp={selectedLocation()?.time || 0}
          locationAddress={selectedLocation()?.address || ''}
        />
      </Show>
    </div>
  )
}

export default DeviceLocationMap
