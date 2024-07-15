import { VoidComponent, createSignal, onMount, createEffect, Show, onCleanup } from 'solid-js'
import { render } from 'solid-js/web'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAPBOX_TOKEN, MAPBOX_USERNAME } from '~/map/config'
import { getMapStyleId, getPlaceFromCoords } from '~/map'
import { getThemeId } from '~/theme'
import { Device } from '~/types'
import Icon from './material/Icon'
import Button from './material/Button'
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
    <div class="absolute bottom-0 left-0 z-[1000] mb-2 h-24 w-full px-2">
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
  device: Device
}

const DeviceMap: VoidComponent<Props> = (props) => {
  const device = () => props.device

  const [userLocation, setUserLocation] = createSignal<Location>({ lng: 0, lat: 0, address: '' })
  const [deviceLocation, setDeviceLocation] = createSignal<Location>({ lng: 0, lat: 0, address: '' })
  const [popUp, setPopUp] = createSignal<Location>()
  const [map, setMap] = createSignal<L.Map | null>(null)

  onMount(() => {
    const mapInstance = L.map('map').setView([37.78, -122.41], 11)
    setMap(mapInstance)

    L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${getMapStyleId(getThemeId())}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`).addTo(mapInstance)

    navigator.geolocation.getCurrentPosition((location) => {
      mapInstance.setView([location.coords.latitude, location.coords.longitude], 15)
      getPlaceFromCoords(location.coords.longitude, location.coords.latitude)
        .then(address => {
          setUserLocation({ 
            lng: location.coords.longitude, 
            lat: location.coords.latitude, 
            address, 
            agent: 'You', 
          })
          addMarker(mapInstance, userLocation(), 'person')
        })
        .catch(err => console.error(err))
    })
  })

  onCleanup(() => {
    if (map()) {
      map()!.remove()
    }
  })

  createEffect(() => {
    const lat = device().last_gps_lat
    const lng = device().last_gps_lng
    if (lng && lat && map()) {
      map()!.setView([lat, lng], 15)
      getPlaceFromCoords(lng, lat)
        .then(address => {
          setDeviceLocation({ lng, lat, address, agent: getDeviceName(device()) })
          addMarker(map(), deviceLocation(), 'directions_car')
        })
        .catch(err => console.error(err))
    }
  })

  const addMarker = (map: L.Map | null, location: Location, iconName: string) => {
    if (!map) return
  
    const iconElement = document.createElement('div')
    render(() => 
      <div class="custom-icon-inner">
        <Icon>{iconName}</Icon>
      </div>, 
    iconElement,
    )
  
    const customIcon = L.divIcon({
      className: 'custom-icon',
      html: iconElement.innerHTML,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  
    L.marker([location.lat, location.lng], { icon: customIcon })
      .addTo(map)
      .on('click', () => setPopUp(location))
  }

  return (
    <div class="relative h-3/4 w-full overflow-hidden">
      <div id="map" class="size-full" />
      <PopUp location={popUp()} />
    </div>
  )
}

export default DeviceMap
