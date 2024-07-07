import { VoidComponent, createSignal, onMount, createEffect, Show, Suspense } from 'solid-js'
import { MAPBOX_TOKEN, MAPBOX_USERNAME } from '~/map/config'
import { getMapStyleId, getPlaceFromCoords } from '~/map'
import { getThemeId } from '~/theme'
import MapGL, { Marker, Viewport } from 'solid-map-gl'
import { Device } from '~/types'
import Icon from './material/Icon'
import Button from './material/Button'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getDeviceName } from '~/utils/device'

type Location = {
  lat: number, lng: number, address: string,
  agent?: string
}
type PopUpProps = {
  location: Location | undefined,
}
const PopUp: VoidComponent<PopUpProps> = (props) => {
  const location = () => props.location
  const address = () => location()?.address
  const lat = () => location()?.lat
  const lng = () => location()?.lng
  return <Show when={location()}>
    <div class="absolute bottom-0 left-0 z-20 mb-2 h-24 w-full px-2">
      <div class="flex size-full rounded-md bg-surface-container-low p-4">
        <div class="flex basis-3/4 flex-col justify-center">
          <p>{location()?.agent}</p>
          <p class="text-body-md text-on-surface-variant">{address() || 'unknown address'}</p>
        </div>
        <div class="flex basis-1/4 items-center justify-end">
          <Button onClick={() => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat()},${lng()}`)
          }}>
            <p class="lg:hidden">maps</p>
            <p class="hidden lg:block">open in maps</p>
          </Button>
        </div>
      </div>
    </div>
  </Show>
}

type Props = {
  device: Device | undefined
}

const DeviceMap: VoidComponent<Props> = (props) => {
  
  const device = () => props.device

  const [userLocation, setUserLocation] = createSignal<Location>({ lng: 0, lat: 0, address: '' })
  const [deviceLocation, setDeviceLocation] = createSignal<Location>({ lng: 0, lat: 0, address: '' })
  const [popUp, setPopUp] = createSignal<Location>()
  const [viewport, setViewport] = createSignal({ center: [-122.41, 37.78], zoom: 11 } as Viewport)

  onMount(() => {
    navigator.geolocation.getCurrentPosition((location) => {
      setViewport({ center: [location.coords.longitude, location.coords.latitude], zoom: 15 } as Viewport)
      getPlaceFromCoords(location.coords.longitude, location.coords.latitude)
        .then(address => setUserLocation({ 
          lng: location.coords.longitude, lat: location.coords.latitude, address, agent: 'You', 
        }))
        .catch(err => console.error(err))
    })
  })

  createEffect(() => {
    const lat = device()?.last_gps_lat
    const lng = device()?.last_gps_lng
    if(lng && lat) {
      setViewport({ center: [lng, lat], zoom: 15 } as Viewport)
      getPlaceFromCoords(lng, lat)
        .then(address => setDeviceLocation({ lng, lat, address, agent: getDeviceName(device()) }))
        .catch(err => console.error(err))
    }
  })

  type MarkerProps = {
    icon: string
  }
  const MapMarker: VoidComponent<MarkerProps> = (props) => {
    return <div class="rounded-full bg-primary-container p-2">
      <Icon>{props.icon}</Icon>
    </div>
  }

  return <div class="relative h-3/4 w-full overflow-hidden" >
    <Suspense fallback={<div class="skeleton-loader size-full"/>}>
      <div class="size-full">
        <MapGL
          options={{
            accessToken: MAPBOX_TOKEN,
            style: `mapbox://styles/${MAPBOX_USERNAME}/${getMapStyleId(getThemeId())}`,
          }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
          style={{ position: 'absolute', inset: '0px', 'z-index': 1 }}
        >
          <Show when={userLocation().agent}>
            <Marker lngLat={userLocation()} onOpen={() => setPopUp(userLocation())} onClose={() => setPopUp()} options={{ element: <MapMarker icon="person" /> }} />
          </Show>
          <Show when={deviceLocation().agent}>
            <Marker lngLat={deviceLocation()} onOpen={() => setPopUp(deviceLocation())} onClose={() => setPopUp()} options={{ element: <MapMarker icon="directions_car" /> }} />
          </Show>
        </MapGL>
      </div>
    </Suspense>
    <PopUp location={popUp()} />
  </div>
}

export default DeviceMap
