import { createResource, createSignal, onMount, onCleanup, Show, type VoidComponent } from 'solid-js'
import { render } from 'solid-js/web'
import L from 'leaflet'

import Icon from './material/Icon'
import Button from './material/Button'

import { getDeviceLocation } from '~/api/devices'
import Card from '~/components/material/Card'
import type { IconName } from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import { getTileUrl } from '~/map'
import { getFullAddress } from '~/map/geocode'
import { cn } from '~/utils/style'

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
  const [showSelectedLocation, setShowSelectedLocation] = createSignal(false)
  const [userPosition, setUserPosition] = createSignal<GeolocationPosition | null>(null)
  const [deviceLocation] = createResource(
    () => props.dongleId,
    (dongleId) => getDeviceLocation(dongleId),
  )

  onMount(() => {
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        permission.addEventListener('change', requestUserLocation)

        if (permission.state === 'granted') {
          requestUserLocation()
        }
      })
      .catch(() => setUserPosition(null))

    const tileUrl = getTileUrl()
    const tileLayer = L.tileLayer(tileUrl)

    const m = L.map(mapRef, {
      attributionControl: false,
      zoomControl: false,
      layers: [tileLayer],
    })
    m.setView(SAN_DIEGO, 10)
    m.on('click', () => setShowSelectedLocation(false))

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

  const [locationData] = createResource(
    () => ({
      map: map(),
      deviceName: props.deviceName,
      deviceLocation: deviceLocation(),
      userPosition: userPosition(),
    }),
    async (args) => {
      if (!args.map) {
        return []
      }

      const foundLocations: Location[] = []

      const location = deviceLocation()
      if (location) {
        const address = await getFullAddress([location.lng, location.lat])
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
        const { longitude, latitude } = args.userPosition.coords
        const address = await getFullAddress([longitude, latitude])
        const userLoc: Location = {
          lat: latitude,
          lng: longitude,
          label: 'You',
          address,
        }

        addMarker(args.map, userLoc, 'person', 'bg-primary')
        foundLocations.push(userLoc)
      }

      if (foundLocations.length > 1) {
        args.map.fitBounds(L.latLngBounds(foundLocations.map((l) => [l.lat, l.lng])), { padding: [50, 50] })
      } else if (foundLocations.length === 1) {
        args.map.setView([foundLocations[0]!.lat, foundLocations[0]!.lng], 15)
      } else {
        throw new Error('Offline')
      }

      return foundLocations
    },
  )

  const addMarker = (instance: L.Map, loc: Location, iconName: IconName, iconClass?: string) => {
    const el = document.createElement('div')

    render(
      () => (
        <div class={cn('flex size-[40px] items-center justify-center rounded-full bg-primary-container', iconClass)}>
          <Icon name={iconName} />
        </div>
      ),
      el,
    )

    const icon = L.divIcon({
      className: 'border-none bg-none',
      html: el.innerHTML,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    L.marker([loc.lat, loc.lng], { icon })
      .addTo(instance)
      .on('click', () => {
        setSelectedLocation(loc)
        setShowSelectedLocation(true)
      })
  }

  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition(setUserPosition, (err) => {
      console.log("Error getting user's position", err)
      setUserPosition(null)
    })
  }

  return (
    <div class="relative">
      <div ref={mapRef} class="h-[240px] w-full !bg-surface-container-low" />

      <Show when={!userPosition() && !showSelectedLocation()}>
        <div class="absolute bottom-2 right-2 z-[9999]">
          <Button
            title="Show your current location"
            color="secondary"
            class="bg-surface-container-low text-on-surface-variant"
            onClick={() => void requestUserLocation()}
            leading={<Icon name="my_location" size="20" />}
          >
            Show my location
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
          <Icon class="mr-2" name="error" size="20" />
          <span class="text-sm">{(locationData.error as Error).message}</span>
        </div>
      </Show>

      <Card
        class={cn(
          'absolute inset-2 top-auto z-[9999] flex !bg-surface-container-high p-4 pt-3 transition-opacity duration-150',
          showSelectedLocation() ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div class="mb-2 flex flex-row items-center justify-between gap-4">
          <span class="truncate text-md">{selectedLocation()?.label}</span>
          <IconButton name="close" onClick={() => setShowSelectedLocation(false)} />
        </div>
        <div class="flex flex-col items-end gap-3 xs:flex-row">
          <span class="text-sm text-on-surface-variant">{selectedLocation()?.address}</span>
          <Button
            color="secondary"
            onClick={() => window.open(`https://www.google.com/maps?q=${selectedLocation()!.lat},${selectedLocation()!.lng}`, '_blank')}
            trailing={<Icon name="open_in_new" size="20" />}
          >
            Open in Maps
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default DeviceLocation
