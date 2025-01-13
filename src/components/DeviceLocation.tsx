import { createResource, createSignal, onMount, onCleanup, Show, type VoidComponent } from 'solid-js'
import { render } from 'solid-js/web'
import clsx from 'clsx'
import L from 'leaflet'

import Icon from './material/Icon'
import Button from './material/Button'

import { getDeviceLocation } from '~/api/devices'
import { getTileUrl, getPlaceName } from '~/map'

type Location = {
  lat: number
  lng: number
  label: string
  address: string | null
}

const SAN_DIEGO: [number, number] = [32.711483, -117.161052]

type DeviceLocationProps = {
  dongleId: string
  deviceName: string
}

const DeviceLocation: VoidComponent<DeviceLocationProps> = (props) => {
  let mapRef!: HTMLDivElement

  const [map, setMap] = createSignal<L.Map | null>(null)
  const [selectedLocation, setSelectedLocation] = createSignal<Location | null>(null)
  const [userPosition, setUserPosition] = createSignal<GeolocationPosition | null>(null)
  const [deviceLocation] = createResource(
    () => props.dongleId,
    (dongleId: string) => getDeviceLocation(dongleId).catch(() => null),
  )

  onMount(() => {
    navigator.permissions.query({ name: 'geolocation' }).then(permission => {
      permission.addEventListener('change', requestUserLocation)

      if (permission.state === 'granted') {
        requestUserLocation()
      }
    }).catch(() => setUserPosition(null))

    const tileUrl = getTileUrl()
    const tileLayer = L.tileLayer(tileUrl)

    const m = L.map(
      mapRef,
      {
        attributionControl: false,
        zoomControl: false,
        layers: [tileLayer],
      },
    )
    m.setView(SAN_DIEGO, 10)
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
    deviceName: props.deviceName,
    deviceLocation: deviceLocation(),
    userPosition: userPosition(),
  }), async (args) => {
    if (!args.map) {
      return []
    }

    const foundLocations: Location[] = []

    const location = deviceLocation()
    if (location) {
      const address = await getPlaceName(location.lat, location.lng)
      const deviceLoc: Location = {
        lat: location.lat,
        lng: location.lng,
        label: args.deviceName,
        address,
      }

      addMarker(args.map, deviceLoc, 'directions_car')
      foundLocations.push(deviceLoc)
    }

    if (args.userPosition) {
      const addr = await getPlaceName(args.userPosition.coords.latitude, args.userPosition.coords.longitude)
      const userLoc: Location = {
        lat: args.userPosition.coords.latitude,
        lng: args.userPosition.coords.longitude,
        label: 'You',
        address: addr,
      }

      addMarker(args.map, userLoc, 'person', 'bg-primary')
      foundLocations.push(userLoc)
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

  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      setUserPosition,
      (err) => {
        console.log('Error getting user\'s position', err)
        setUserPosition(null)
      },
    )
  }

  return (
    <div class="relative">
      <div ref={mapRef} class="h-[200px] w-full !bg-surface-container-low" />

      <Show when={!userPosition()}>
        <div class="absolute bottom-2 right-2 z-[9999]">
          <Button
            title="Show your current location"
            color="secondary"
            class="bg-surface-container-low text-on-surface-variant"
            onClick={() => void requestUserLocation()}
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

export default DeviceLocation
