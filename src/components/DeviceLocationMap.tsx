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
import { render } from 'solid-js/web'
import { DeviceLocation } from '~/types'
import { formatDateFromNow } from '~/utils/date'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './material/Icon'
import { getMapStyleId } from '~/map'
import { getThemeId } from '~/theme'
import { MAPBOX_TOKEN, MAPBOX_USERNAME } from '~/map/config'


const PERSON_ICON = 'person'
const CAR_ICON = 'directions_car'


const VEHICLE_NAME_FALLBACK = 'Car'

const SAN_DIEGO: [number, number] = [32.834686, -117.130775]
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
    <div class="absolute inset-x-0 bottom-0 z-[5000] m-2 rounded-lg bg-surface-container-high px-8 py-4 shadow">
      <button
        onClick={() => props.onClose()}
        class="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded-full border border-gray-400/30 bg-surface-container-lowest p-1"
      >
        <Icon size="20">close</Icon>
      </button>
      <div class="mx-auto flex max-w-screen-xl items-center justify-between">
        <div class="flex flex-col gap-0.5">
          <h2 class="text-lg font-medium">{props.locationName}</h2>
          <p class="text-sm text-gray-400">
            {formatDateFromNow(props.locationTimestamp)}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            onClick={() => {
              const address = encodeURIComponent(props.locationAddress)
              window.open(`https://maps.google.com?q=${address}`, '_blank')
            }}
            class="rounded-full bg-white px-4 py-2 text-black hover:bg-gray-100"
          >
            open in maps
          </button>
        </div>
      </div>
      <div class="mx-auto mt-4 flex max-w-screen-xl">
        <p class="text-gray-300">{props.locationAddress}</p>
      </div>
    </div>
  )
}

const getTileUrl = () => {
  return `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${getMapStyleId(getThemeId())}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
}
const getPlaceName = async (lat: number, lng: number) => {
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
  const [map, setMap] = createSignal<L.Map>()
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
    const mapInstance = map()

    if (mapInstance && !locationData.loading) {
      const locations = locationData()
      if (!locations || locations.length === 0) return

    

      locations.forEach((loc) => {
        createMarker(loc, loc.type === 'user' ? PERSON_ICON : CAR_ICON, mapInstance)
      })

      if (locations.length > 1) {
        
        setTimeout(() => {
          const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
          mapInstance.fitBounds(bounds, { padding: [50, 50] })
          mapInstance.invalidateSize()
        }, 200)

      } else if (locations.length === 1) {
        mapInstance.setView([locations[0].lat, locations[0].lng], DEFAULT_ZOOM)
      }
    }
  })

  onMount(() => {
    const mapInstance = L.map(mapContainer, {
      attributionControl: false,
      zoomControl: false,
      center: SAN_DIEGO,
      zoom: DEFAULT_ZOOM,
    })
    
    L.tileLayer(getTileUrl()).addTo(mapInstance)

    setMap(mapInstance)
    mapInstance.invalidateSize()

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.invalidateSize()
    })
    resizeObserver.observe(mapContainer)

    onCleanup(() => {
      resizeObserver.disconnect()
      mapInstance.remove()
    })
  })

  const createMarker = (
    loc: Location,
    iconName: string,
    mapInstance: L.Map,
  ): L.Marker => {

    const el = document.createElement('div')

    render(
      () => (
        <div
          class="flex size-[40px] cursor-pointer items-center justify-center rounded-full bg-primary-container"
          onClick={() => {
            setSelectedLocation(loc)
            const mapEntity = map()
            if (mapEntity) {
              mapEntity.setView([loc.lat, loc.lng])
            }
          }}
        >
          <Icon>{iconName}</Icon>
        </div>
      ),
      el,
    )

    const icon = L.divIcon({
      html: el,
      className: 'border-none bg-none',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })


    return L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstance)
  }

  return (
    <div class="relative">
      <div
        ref={mapContainer}
        onClick={(e) => {
          if (e.target === mapContainer) {
            setSelectedLocation(undefined)
          }
        }}
        class="h-[350px] w-full overflow-hidden rounded-lg !bg-surface-container-low"
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
