import { createEffect, createResource, onMount, onCleanup, Show, type VoidComponent } from 'solid-js'
import L from 'leaflet'

import { getCoords, type EngagementHover, type GPSPathPoint, type TimelineEvent } from '~/api/derived'
import type { Route } from '~/api/types'
import { formatMs } from '~/utils/format'
import { getTileUrl } from '~/map'
import Icon from '~/components/material/Icon'

type EngagementMapProps = {
  route: Route | undefined
  events: TimelineEvent[]
  class?: string
  engagementHover?: EngagementHover
  onEngagementHover?: (h: EngagementHover) => void
}

const buildTraceSegments = (coords: GPSPathPoint[], events: TimelineEvent[]): { points: [number, number][]; engaged: boolean }[] => {
  if (coords.length === 0) return []

  const engagedEvents = events
    .filter((e) => e.type === 'engaged')
    .map((e) => ({ start: e.route_offset_millis, end: (e as { end_route_offset_millis: number }).end_route_offset_millis }))

  const isEngaged = (tMs: number) => engagedEvents.some((e) => tMs >= e.start && tMs <= e.end)

  const segments: { points: [number, number][]; engaged: boolean }[] = []
  let current: { points: [number, number][]; engaged: boolean } | null = null

  for (const coord of coords) {
    const tMs = coord.t * 1000
    const engaged = isEngaged(tMs)
    const point: [number, number] = [coord.lat, coord.lng]

    if (!current || current.engaged !== engaged) {
      if (current && current.points.length > 0) {
        current.points.push(point)
      }
      current = { points: [point], engaged }
      segments.push(current)
    } else {
      current.points.push(point)
    }
  }

  return segments
}

const RouteEngagementMap: VoidComponent<EngagementMapProps> = (props) => {
  let mapRef!: HTMLDivElement
  let mapInstance: L.Map | null = null
  const layersByCategory = new Map<string, L.Path[]>()

  const [coords] = createResource(() => props.route, getCoords, { initialValue: [] })

  onMount(() => {
    mapInstance = L.map(mapRef, { attributionControl: false, zoomControl: true })
    L.tileLayer(getTileUrl()).addTo(mapInstance)
    mapInstance.setView([32.7, -117.1], 10)

    const observer = new ResizeObserver(() => mapInstance?.invalidateSize())
    observer.observe(mapRef)
    onCleanup(() => {
      observer.disconnect()
      mapInstance?.remove()
    })
  })

  const updateMap = () => {
    if (!mapInstance || coords().length === 0) return

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) mapInstance!.removeLayer(layer)
    })

    layersByCategory.clear()
    layersByCategory.set('engaged', [])
    layersByCategory.set('disengaged', [])
    layersByCategory.set('overriding', [])

    const segments = buildTraceSegments(coords(), props.events)
    const allPoints: [number, number][] = []

    for (const seg of segments) {
      if (seg.points.length < 2) continue
      const durMs = seg.points.length * 1000
      const category = seg.engaged ? 'engaged' : 'disengaged'
      const line = L.polyline(seg.points, {
        color: seg.engaged ? '#22c55e' : '#6366f1',
        weight: 4,
        opacity: 0.9,
      }).bindTooltip(seg.engaged ? `Engaged ~${formatMs(durMs)}` : `Disengaged ~${formatMs(durMs)}`, { sticky: true })
      line.on('mouseover', () => props.onEngagementHover?.({ type: 'category', category }))
      line.on('mouseout', () => props.onEngagementHover?.(null))
      line.addTo(mapInstance)
      layersByCategory.get(category)!.push(line)
      allPoints.push(...seg.points)
    }

    const overrideEvents = props.events.filter((e) => e.type === 'overriding')
    for (const ovr of overrideEvents) {
      const tMs = ovr.route_offset_millis
      const durMs = (ovr as { end_route_offset_millis: number }).end_route_offset_millis - tMs
      const coord = coords().reduce((best, c) => (Math.abs(c.t * 1000 - tMs) < Math.abs(best.t * 1000 - tMs) ? c : best))
      if (coord) {
        const marker = L.circleMarker([coord.lat, coord.lng], {
          radius: 3,
          color: '#a0aec0',
          fillColor: '#a0aec0',
          fillOpacity: 0.7,
          weight: 0,
        }).bindTooltip(`Override ${formatMs(durMs)}`)
        marker.on('mouseover', () => props.onEngagementHover?.({ type: 'category', category: 'overriding' }))
        marker.on('mouseout', () => props.onEngagementHover?.(null))
        marker.addTo(mapInstance)
        layersByCategory.get('overriding')!.push(marker)
      }
    }

    if (allPoints.length > 0) {
      mapInstance.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] })
    }
  }

  createResource(
    () => [coords(), props.events] as const,
    () => {
      updateMap()
      return null
    },
  )

  createEffect(() => {
    const hover = props.engagementHover
    for (const [category, layers] of layersByCategory) {
      const dimmed = hover !== null && hover !== undefined && hover.category !== category
      for (const layer of layers) {
        layer.setStyle({ opacity: dimmed ? 0.2 : 0.9, fillOpacity: dimmed ? 0.2 : 0.7 })
      }
    }
  })

  return (
    <div class={props.class}>
      <Show when={coords().length === 0 && !props.route}>
        <div class="flex h-full items-center justify-center gap-2 text-xs text-on-surface-variant">
          <Icon name="satellite_alt" filled />
          No GPS data
        </div>
      </Show>
      <div ref={mapRef!} class="h-full w-full rounded-lg" onMouseLeave={() => props.onEngagementHover?.(null)} />
    </div>
  )
}

export default RouteEngagementMap
