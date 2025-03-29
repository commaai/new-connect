import { Accessor, Component, createEffect, createSignal, onMount, onCleanup } from 'solid-js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getTileUrl } from '~/map'
import { GPSPathPoint } from '~/api/derived'
import IconButton from './material/IconButton'
import Icon from './material/Icon'
import { render } from 'solid-js/web'

const findClosestPoint = (lng: number, lat: number, coords: GPSPathPoint[]): number => {
  let minDist = Infinity
  let closestIndex = 0
  coords.forEach((point, i) => {
    const dist = Math.sqrt((point.lng - lng) ** 2 + (point.lat - lat) ** 2)
    if (dist < minDist) {
      minDist = dist
      closestIndex = i
    }
  })
  return closestIndex
}

const createCarIcon = () => {
  const el = document.createElement('div')
  render(
    () => (
      <div class="flex size-[40px] items-center justify-center rounded-full bg-primary-container transition-transform duration-1000 ease-linear">
        <Icon name="directions_car" />
      </div>
    ),
    el,
  )
  return L.divIcon({ className: 'car-icon', html: el.innerHTML, iconSize: [40, 40], iconAnchor: [20, 20] })
}

export const PathMap: Component<{
  themeId: string
  duration: Accessor<number>
  seekTime: Accessor<number>
  updateTime: (newTime: number) => void
  coords: GPSPathPoint[]
  hidpi: boolean
  strokeWidth?: number
  color?: string
  opacity?: number
}> = (props) => {
  let mapRef!: HTMLDivElement
  const [map, setMap] = createSignal<L.Map | null>(null)
  const [position, setPosition] = createSignal(0)
  const [isLocked, setIsLocked] = createSignal(true)
  const [isDragging, setIsDragging] = createSignal(false)
  const [isMapInteractive, setIsMapInteractive] = createSignal(false)

  const mapCoords = () => props.coords.map((p) => [p.lat, p.lng] as [number, number])
  const pastCoords = () => mapCoords().slice(0, position() + 1)
  const futureCoords = () => mapCoords().slice(position())
  const currentCoord = () => mapCoords()[position()]

  let marker: L.Marker | null = null
  let pastPolyline: L.Polyline | null = null
  let futurePolyline: L.Polyline | null = null
  let hitboxPolyline: L.Polyline | null = null

  onMount(() => {
    const m = L.map(mapRef, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
    })

    L.tileLayer(getTileUrl()).addTo(m)
    m.setView([props.coords[0].lat, props.coords[0].lng], props.coords.length ? 14 : 10)

    pastPolyline = L.polyline([], { color: props.color || '#6F707F', weight: props.strokeWidth || 4 }).addTo(m)
    futurePolyline = L.polyline([], { color: props.color || '#dfe0ff', weight: props.strokeWidth || 4 }).addTo(m)
    hitboxPolyline = L.polyline(mapCoords(), { color: 'transparent', weight: 20, opacity: 0 }).addTo(m)
    marker = L.marker([props.coords[0].lat, props.coords[0].lng], { icon: createCarIcon(), draggable: true }).addTo(m)

    const updatePosition = (lng: number, lat: number) => {
      const idx = findClosestPoint(lng, lat, props.coords)
      const point = mapCoords()[idx]
      marker?.setLatLng(point)
      setPosition(idx)
      props.updateTime(props.coords[idx].t)
    }

    const enableMap = () => {
      setIsMapInteractive(true)
      m.dragging.enable()
      m.touchZoom.enable()
      m.doubleClickZoom.enable()
      m.scrollWheelZoom.enable()
      m.boxZoom.enable()
    }

    const handleDrag = (e: L.LeafletMouseEvent | L.LeafletEvent) => {
      setIsLocked(false)
      if (!isMapInteractive()) enableMap()
      const { lng, lat } = 'latlng' in e ? e.latlng : e.target.getLatLng()
      updatePosition(lng, lat)
      marker?.getElement()?.classList.add('no-transition')
    }

    marker
      .on('dragstart', () => {
        setIsDragging(true)
        marker?.getElement()?.classList.add('no-transition')
      })
      .on('drag', handleDrag)
      .on('dragend', () => {
        setIsDragging(false)
        marker?.getElement()?.classList.remove('no-transition')
      })

    m.on('mousemove', (e) => isDragging() && handleDrag(e)).on('mouseup', () => {
      setIsDragging(false)
      marker?.getElement()?.classList.remove('no-transition')
    })
    hitboxPolyline?.on('mousedown', handleDrag)
    setMap(m)
    onCleanup(() => m.remove())
  })

  createEffect(() => {
    const t = props.seekTime()
    if (!props.coords.length) return
    if (t < props.coords[0].t) {
      setPosition(0)
      return
    }
    const newPos = props.coords.findIndex((p, i) => i === props.coords.length - 1 || (t >= p.t && t < props.coords[i + 1].t))
    setPosition(newPos === -1 ? props.coords.length - 1 : newPos)
  })

  createEffect(() => {
    if (!map() || !props.coords.length) return

    pastPolyline?.setLatLngs(pastCoords())
    futurePolyline?.setLatLngs(futureCoords())
    marker?.setLatLng(currentCoord())

    if (isLocked() && !isDragging()) map()?.panTo(currentCoord(), { animate: true, duration: 2 })
  })

  return (
    <div ref={mapRef} class="h-full relative" style={{ 'background-color': 'rgb(19 19 24)' }}>
      <style>
        {`
          .leaflet-marker-pane > * {
            -webkit-transition: transform 1.2s linear;
            -moz-transition: transform 1.2s linear;
            -o-transition: transform 1.2s linear;
            -ms-transition: transform 1.2s linear;
            transition: transform 1.2s linear;
          }
          .leaflet-marker-pane > .no-transition {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
          }
        `}
      </style>
      <IconButton
        name="my_location"
        class={`absolute z-[1000] left-4 top-4 bg-primary-container ${isLocked() && 'hidden'}`}
        onClick={() => {
          setIsLocked(true)
          map()?.setView(currentCoord(), map()?.getZoom())
          setIsMapInteractive(false) // Reset to non-interactable
          const m = map()
          if (m) {
            m.dragging.disable()
            m.touchZoom.disable()
            m.doubleClickZoom.disable()
            m.scrollWheelZoom.disable()
            m.boxZoom.disable()
          }
        }}
      />
    </div>
  )
}
