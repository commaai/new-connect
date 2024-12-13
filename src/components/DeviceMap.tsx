import { onMount, onCleanup, createEffect, type VoidComponent, Resource } from 'solid-js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import clsx from 'clsx'

import { MAPBOX_USERNAME, MAPBOX_TOKEN, MAPBOX_LIGHT_STYLE_ID, MAPBOX_DARK_STYLE_ID } from '~/map/config'
import { getThemeId } from '~/theme'
import { Device } from '~/types'
import Icon from '~/components/material/Icon'

type MapComponentProps = {
  center: [number, number]
  zoom: number
  class?: string
  device: Resource<Device>
  onMapClick?: () => void
}

type Location = {
  lat: number
  lng: number
}

const DeviceMap: VoidComponent<MapComponentProps> = (props) => {
  let mapContainer: HTMLDivElement | undefined
  let mapInstance: L.Map | undefined
  let locationMarker: L.CircleMarker | undefined
  let deviceMarker: L.Marker | undefined

  const getTileUrl = () => {
    const themeId = getThemeId()
    const styleId = themeId === 'light' ? MAPBOX_LIGHT_STYLE_ID : MAPBOX_DARK_STYLE_ID
    return `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  }

  const currentLocationMarker = (lng: number, lat: number) => {
    if (!mapInstance) return
    if (locationMarker) {
      locationMarker.setLatLng([lat, lng])
    } else {
      locationMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#F0F0F0',
        fillColor: '#2CA3EE',
        fillOpacity: 1,
        weight: 2,
      }).addTo(mapInstance)
    }
    mapInstance.setView([lat, lng], props.zoom)
  }

  const locateUser = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        currentLocationMarker(longitude, latitude)
      },
      (error) => {
        console.error('Error fetching location:', error)
      },
    )
  }

  onMount(() => {
    mapInstance = L.map(mapContainer!, {
      zoomControl: false,
      attributionControl: false,
      center: props.center,
      zoom: props.zoom,
    })

    L.tileLayer(getTileUrl(), {
      maxZoom: 18,
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(mapInstance)

    // Bug in leaflet that won't load tiles initially without a timeout invalidate cache
    setTimeout(function () {
      mapInstance?.whenReady(() => {
        mapInstance?.invalidateSize()
      })
    }, 700)

    const handleResize = () => mapInstance?.invalidateSize()
    window.addEventListener('resize', handleResize)

    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
      mapInstance?.remove()
    })
  })

  createEffect(() => {
    if (props.device.loading || props.device.error) return
    const fetchedDevice = props.device()
    if (fetchedDevice && mapInstance) {
      const { last_gps_lat: lat, last_gps_lng: lng } = fetchedDevice
      if (lat && lng) {
        void addMarker(mapInstance, { lat, lng }).then(() => {
          mapInstance!.setView([lat, lng], props.zoom)
        })
      }
    }
  })

  const addMarker = async (map: L.Map, location: Location) => {
    const image = new Image()
    image.src = '/images/map-pin.svg'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Failed to load the SVG image'))
    })

    const canvas = document.createElement('canvas')
    const size = 40
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(image, 4, 4, size - 8, size - 8)
    ctx.fillStyle = 'white'
    ctx.font = '16px "Material Symbols Outlined"'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('directions_car', size / 2, (size / 2) - size * 0.15)

    const customIconUrl = canvas.toDataURL('image/png')
    if (!customIconUrl) return

    const customIcon = L.icon({
      iconUrl: customIconUrl,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    deviceMarker = L.marker([location.lat, location.lng], {icon: customIcon})
      .addTo(map)
      .on('click', () => props.onMapClick?.())
  }

  return (
    <div class="relative size-full">
      <div
        class={clsx(
          'relative z-10 flex size-full max-h-[400px] overflow-hidden rounded-lg',
          props.class,
        )}
        ref={mapContainer}
      />
      <button
        class="absolute right-2 top-2 z-10 rounded-full bg-blue-500 p-2 text-white shadow-md transition  hover:bg-blue-600"
        onClick={() => locateUser()}
      >
        <Icon>my_location</Icon>
      </button>
    </div>
  )
}

export default DeviceMap
