import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import L from 'leaflet'
import { MAPBOX_USERNAME, MAPBOX_TOKEN } from '~/map/config'
import { getThemeId } from '~/theme'
import { getMapStyleId } from '~/map'
import { Device } from '~/types'
import { render } from 'solid-js/web'
import Icon from './material/Icon'
import clsx from 'clsx'
import Button from './material/Button'
import { createResource } from 'solid-js'

type Location = {
  lat: number
  lng: number
  label: string
  address: string | null
}

const THE_GUNDO: [number, number] = [33.9192, -118.4165]

const DeviceLocation: VoidComponent<{ device: Device; deviceName: string }> = (props) => {
  let mapRef!: HTMLDivElement

  const [map, setMap] = createSignal<L.Map | null>(null)
  const [selectedLocation, setSelectedLocation] = createSignal<Location | null>(null)
  const [locationPermission, setLocationPermission] = createSignal<'granted' | 'denied' | 'prompt'>('prompt')

  onMount(() => {
    navigator.permissions.query({ name: 'geolocation' }).then(permission => {
      setLocationPermission(permission.state)
      permission.addEventListener('change', () => setLocationPermission(permission.state))
    }).catch(() => setLocationPermission('denied'))

    const tileLayer = L.tileLayer(
      `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${getMapStyleId(getThemeId())}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
    )

    const m = L.map(
      mapRef,
      {
        attributionControl: false,
        zoomControl: false,
        layers: [tileLayer],
      },
    )
    m.setView(THE_GUNDO, 10)
    m.on('click', () => setSelectedLocation(null))

    setMap(m)

    // fix: leaflet sometimes misses resize events
    // and leaves unrendered gray tiles
    const observer = new ResizeObserver(() => m.invalidateSize())
    observer.observe(mapRef)

    onCleanup(() => {
      observer.disconnect()
      m.remove()
    })
  })

  const [locationData] = createResource(() => ({
    map: map(),
    device: props.device,
    deviceName: props.deviceName,
    locationPermission: locationPermission(),
  }), async (args) => {
    if (!args.map) {
      return []
    }

    const foundLocations: Location[] = []

    if (args.device.last_gps_lat && args.device.last_gps_lng) {
      const address = await getPlaceName(args.device.last_gps_lat, args.device.last_gps_lng)
      const deviceLoc: Location = {
        lat: args.device.last_gps_lat,
        lng: args.device.last_gps_lng,
        label: args.deviceName,
        address,
      }

      addMarker(args.map, deviceLoc, 'directions_car')
      foundLocations.push(deviceLoc)
    }

    const permission = await navigator.permissions.query({ name: 'geolocation' })
    if (permission.state === 'granted') {
      const position = await getUserPosition().catch(() => null)

      if (position) {
        const addr = await getPlaceName(position.coords.latitude, position.coords.longitude)
        const userLoc: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'You',
          address: addr,
        }

        addMarker(args.map, userLoc, 'person', 'bg-primary')
        foundLocations.push(userLoc)
      }
    }

    if (foundLocations.length > 1) {
      args.map.fitBounds(L.latLngBounds(foundLocations.map(l => [l.lat, l.lng])), { padding: [50, 50] })
    } else if (foundLocations.length === 1) {
      args.map.setView([foundLocations[0].lat, foundLocations[0].lng], 15)
    } else {
      throw new Error('Offline')
    }

    return foundLocations
  })


  const addMarker = (instance: L.Map, loc: Location, iconName: string, iconClass?: string) => {
    const el = document.createElement('div')

    render(() =>
      <div class={clsx('flex size-[40px] items-center justify-center rounded-full bg-primary-container', iconClass)}>
        <Icon>{iconName}</Icon>
      </div>, el)

    const icon = L.divIcon({
      className: 'border-none bg-none',
      html: el.innerHTML,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    L.marker([loc.lat, loc.lng], { icon })
      .addTo(instance)
      .on('click', () => setSelectedLocation(loc))
  }

  const getUserPosition = () => {
    return new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject),
    )
  }

  const requestLocation = async () => {
    const position = await getUserPosition()
    if (position) {
      setLocationPermission('granted')
    }
  }

  return (
    <div class="relative">
      <div ref={mapRef} class="h-[200px] w-full !bg-surface-container-low" />

      <Show when={locationPermission() !== 'granted'}>
        <div class="absolute bottom-2 right-2 z-[9999]">
          <Button
            title="Show your current location"
            color="secondary"
            class="bg-surface-container-low text-on-surface-variant"
            onClick={() => void requestLocation()}
            trailing={<span class="pr-2 text-sm">Show my location</span>}
          >
            <Icon size="20">my_location</Icon>
          </Button>
        </div>
      </Show>

      <Show when={locationData.loading}>
        <div class="absolute left-1/2 top-1/2 z-[5000] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-surface-variant px-4 py-2 shadow">
          <div class="mr-2 size-4 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" />
          <span class="text-sm">Locating...</span>
        </div>
      </Show>

      <Show when={(locationData.error as Error)?.message}>
        <div class="absolute left-1/2 top-1/2 z-[5000] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-surface-variant px-4 py-2 shadow">
          <Icon class="mr-2" size="20">error</Icon>
          <span class="text-sm">{(locationData.error as Error).message}</span>
        </div>
      </Show>

      <div class={clsx(
        'absolute bottom-0 left-0 z-[9999] w-full p-2 transition-opacity duration-150',
        selectedLocation() ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}>
        <div class="flex w-full gap-4 rounded-lg bg-surface-container-high p-4 shadow-lg">
          <div class="flex-auto">
            <h3 class="mb-2 font-bold">{selectedLocation()?.label}</h3>
            <p class="mb-2 text-sm text-on-surface-variant">{selectedLocation()?.address}</p>
          </div>
          <div class="shrink-0 self-end">
            <Button
              color="secondary"
              onClick={() => window.open(`https://www.google.com/maps?q=${selectedLocation()!.lat},${selectedLocation()!.lng}`, '_blank')}
              trailing={<Icon size="20">open_in_new</Icon>}
              class="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-black"
            >
              Open in Maps
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function getPlaceName(lat: number, lng: number) {
  try {
    const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`)
    const data = await r.json() as { features?: { place_name?: string }[] }
    return data.features?.[0]?.place_name ?? null
  } catch {
    return null
  }
}

export default DeviceLocation
