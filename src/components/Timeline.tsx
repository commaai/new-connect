import { For, Show, createSignal, createEffect, onMount, onCleanup, Suspense } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { EngagementHover, TimelineEvent } from '~/api/derived'
import type { Route } from '~/api/types'
import { formatMs, getRouteDuration } from '~/utils/format'

const EVENT_STYLES = {
  engaged: { title: 'Engaged', classes: 'bg-green-800 min-w-[1px]', z: '1' },
  overriding: { title: 'Overriding', classes: 'bg-gray-500 min-w-[1px]', z: '2' },
  alert_1: { title: 'User prompt alert', classes: 'bg-amber-600 min-w-[2px]', z: '3' },
  alert_2: { title: 'Critical alert', classes: 'bg-red-600 min-w-[2px]', z: '3' },
  user_flag: { title: 'User flag', classes: 'bg-yellow-500 min-w-[2px]', z: '4' },
} as const

interface Segment {
  id: number
  left: number
  width: number
  durationMs: number
  title: string
  category: string
  classes: string
  z: string
}

function buildSegments(route: Route | undefined, events: TimelineEvent[]): Segment[] {
  if (!route) return []
  const duration = getRouteDuration(route)?.asMilliseconds() ?? 0
  if (duration === 0) return []

  const segments: Segment[] = []
  let id = 0

  const engaged = events
    .filter((e) => e.type === 'engaged')
    .map((e) => ({ start: e.route_offset_millis, end: (e as { end_route_offset_millis: number }).end_route_offset_millis }))
    .sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const eng of engaged) {
    if (eng.start > cursor) {
      const gapMs = eng.start - cursor
      segments.push({
        id: id++,
        left: (cursor / duration) * 100,
        width: (gapMs / duration) * 100,
        durationMs: gapMs,
        title: 'Disengaged',
        category: 'disengaged',
        classes: '',
        z: '0',
      })
    }
    cursor = Math.max(cursor, eng.end)
  }
  if (cursor < duration) {
    const gapMs = duration - cursor
    segments.push({
      id: id++,
      left: (cursor / duration) * 100,
      width: (gapMs / duration) * 100,
      durationMs: gapMs,
      title: 'Disengaged',
      category: 'disengaged',
      classes: '',
      z: '0',
    })
  }

  const merged: { type: string; start: number; end: number; alertStatus?: number }[] = []
  const sorted = [...events].sort((a, b) => a.route_offset_millis - b.route_offset_millis)
  for (const event of sorted) {
    const start = event.route_offset_millis
    const end = event.type === 'user_flag' ? start + 1000 : event.end_route_offset_millis
    const last = merged.at(-1)
    if (last && last.type === event.type && start - last.end < 2000) {
      last.end = Math.max(last.end, end)
    } else {
      merged.push({ type: event.type, start, end, ...(event.type === 'alert' ? { alertStatus: event.alertStatus } : {}) })
    }
  }

  for (const m of merged) {
    const durationMs = m.end - m.start
    const styleKey = m.type === 'alert' ? (`alert_${m.alertStatus}` as keyof typeof EVENT_STYLES) : (m.type as keyof typeof EVENT_STYLES)
    const style = EVENT_STYLES[styleKey] ?? EVENT_STYLES.alert_2
    const category = m.type === 'engaged' ? 'engaged' : m.type === 'overriding' ? 'overriding' : 'other'
    segments.push({
      id: id++,
      left: (m.start / duration) * 100,
      width: (durationMs / duration) * 100,
      durationMs,
      title: style.title,
      category,
      classes: style.classes,
      z: style.z,
    })
  }

  return segments
}

function renderTimelineEvents(segments: Segment[], hoverId: () => number | null, externalHover?: EngagementHover) {
  const shouldDim = (seg: Segment, externalHover: EngagementHover) => {
    if (externalHover) {
      if (externalHover.type === 'category') return seg.category !== externalHover.category
      if (externalHover.type === 'segment') {
        if (seg.id === externalHover.id) return false
        if (seg.category === externalHover.category) return false
        return true
      }
    }
    const hid = hoverId()
    if (hid === null || hid === seg.id || seg.z === '0') return false
    const hovered = segments.find((s) => s.id === hid)
    if (!hovered) return true
    if (seg.category === hovered.category) return false
    return true
  }

  return (
    <For each={segments}>
      {(seg) => (
        <div
          class={clsx('absolute top-0 h-full transition-all', seg.classes)}
          style={(() => {
            const isDisHighlight = seg.z === '0' && (externalHover ?? null) !== null && !shouldDim(seg, externalHover ?? null)
            return {
              left: `${seg.left}%`,
              width: `${seg.width}%`,
              'z-index': isDisHighlight ? '6' : seg.z,
              opacity: shouldDim(seg, externalHover ?? null) ? '0.1' : '1',
              'pointer-events': shouldDim(seg, externalHover ?? null) ? 'none' : 'auto',
              ...(isDisHighlight
                ? {
                    'background-color':
                      externalHover?.type === 'segment' && externalHover.id === seg.id
                        ? 'rgba(99, 102, 241, 0.8)'
                        : 'rgba(99, 102, 241, 0.25)',
                  }
                : {}),
            }
          })()}
        />
      )}
    </For>
  )
}

const MARKER_WIDTH = 3

interface HoverInfo {
  title: string
  duration: string
  id: number
}

interface TimelineProps {
  class?: string
  route: Route | undefined
  seekTime: number
  updateTime: (time: number) => void
  events: TimelineEvent[]
  engagementHover?: EngagementHover
  onEngagementHover?: (h: EngagementHover) => void
}

const Timeline: VoidComponent<TimelineProps> = (props) => {
  const [hoverInfo, setHoverInfo] = createSignal<HoverInfo | null>(null)
  const [hoverPct, setHoverPct] = createSignal(0)
  const hoverId = () => hoverInfo()?.id ?? null
  const segments = () => buildSegments(props.route, props.events)
  // TODO: align to first camera frame event
  const [markerOffsetPct, setMarkerOffsetPct] = createSignal(0)
  const duration = () => getRouteDuration(props.route)?.asSeconds() ?? 0

  let ref!: HTMLDivElement

  onMount(() => {
    const updateMarker = (clientX: number) => {
      const rect = ref.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width - MARKER_WIDTH)
      const fraction = x / rect.width
      // Update marker immediately without waiting for video
      setMarkerOffsetPct(fraction * 100)
      props.updateTime(duration() * fraction)
    }

    const onStart = () => {
      const onMouseMove = (ev: MouseEvent) => {
        updateMarker(ev.clientX)
      }
      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) return
        updateMarker(ev.touches[0].clientX)
      }
      const onStop = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('mouseup', onStop)
        window.removeEventListener('touchend', onStop)
        window.removeEventListener('touchcancel', onStop)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('mouseup', onStop)
      window.addEventListener('touchend', onStop)
      window.addEventListener('touchcancel', onStop)
    }

    const onMouseDown = (ev: MouseEvent) => {
      if (!props.route) return
      updateMarker(ev.clientX)
      onStart()
    }

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1 || !props.route) return
      updateMarker(ev.touches[0].clientX)
      onStart()
    }

    ref.addEventListener('mousedown', onMouseDown)
    ref.addEventListener('touchstart', onTouchStart)
    onCleanup(() => {
      ref.removeEventListener('mousedown', onMouseDown)
      ref.removeEventListener('touchstart', onTouchStart)
    })
  })

  createEffect(() => {
    if (duration() === 0) setMarkerOffsetPct(0)
    else setMarkerOffsetPct((props.seekTime / duration()) * 100)
  })

  return (
    <div class="flex flex-col">
      <div class="relative h-6">
        <div class="absolute bottom-0 h-1 w-full bg-surface-container-high">
          <div class="h-full bg-white" style={{ width: `calc(${markerOffsetPct()}% + 1px)` }} />
        </div>
        <Show when={hoverInfo()}>
          {(info) => (
            <div
              class="absolute bottom-1.5 -translate-x-1/2 rounded bg-surface-container-highest px-2 py-0.5 text-[11px] text-on-surface whitespace-nowrap shadow-lg pointer-events-none z-20"
              style={{ left: `clamp(40px, ${hoverPct()}%, calc(100% - 40px))` }}
            >
              <span class="font-medium">{info().title}</span>
              <Show when={info().duration}>
                <span class="text-on-surface-variant"> {info().duration}</span>
              </Show>
            </div>
          )}
        </Show>
      </div>
      <div
        ref={ref!}
        class={clsx(
          'relative isolate flex h-8 cursor-pointer touch-none self-stretch rounded-b-md bg-blue-900',
          'after:absolute after:inset-0 after:rounded-b-md after:bg-gradient-to-b after:from-black/0 after:via-black/10 after:to-black/30',
          props.class,
        )}
        onMouseMove={(e) => {
          const rect = ref.getBoundingClientRect()
          const pct = ((e.clientX - rect.left) / rect.width) * 100
          setHoverPct(pct)
          const allSegs = segments()
          const topSeg = [...allSegs].sort((a, b) => Number(b.z) - Number(a.z)).find((s) => pct >= s.left && pct <= s.left + s.width)
          if (topSeg) {
            setHoverInfo({ title: topSeg.title, duration: topSeg.durationMs >= 500 ? formatMs(topSeg.durationMs) : '', id: topSeg.id })
            const offset = allSegs
              .filter((s) => s.category === topSeg.category && s.id < topSeg.id)
              .reduce((sum, s) => sum + s.durationMs, 0)
            props.onEngagementHover?.({
              type: 'segment',
              id: topSeg.id,
              category: topSeg.category,
              offsetInCategory: offset,
              durationMs: topSeg.durationMs,
            })
          } else {
            setHoverInfo(null)
            props.onEngagementHover?.(null)
          }
        }}
        onMouseLeave={() => {
          setHoverInfo(null)
          props.onEngagementHover?.(null)
        }}
      >
        <div class="absolute inset-0 size-full rounded-b-md overflow-hidden">
          <Suspense fallback={<div class="skeleton-loader size-full" />}>
            {renderTimelineEvents(segments(), hoverId, props.engagementHover)}
          </Suspense>
        </div>
        <div
          class="absolute top-0 z-10 h-full"
          style={{
            width: `${MARKER_WIDTH}px`,
            left: `${markerOffsetPct()}%`,
          }}
        >
          <div class="absolute inset-x-0 h-full w-px bg-white" />
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-[calc(50%+1px)]">
            <div class="size-0 border-x-8 border-b-[12px] border-x-transparent border-b-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
