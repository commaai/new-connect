import { For, createSignal, createEffect, onMount, onCleanup, Suspense } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { TimelineEvent } from '~/api/derived'
import type { Route } from '~/api/types'
import { getRouteDuration } from '~/utils/format'

const EVENT_STYLES = {
  engaged: { title: 'Engaged', classes: 'bg-green-800 min-w-[1px]', z: '1' },
  overriding: { title: 'Overriding', classes: 'bg-gray-500 min-w-[1px]', z: '2' },
  alert_1: { title: 'User prompt alert', classes: 'bg-amber-600 min-w-[2px]', z: '3' },
  alert_2: { title: 'Critical alert', classes: 'bg-red-600 min-w-[2px]', z: '3' },
  user_flag: { title: 'User flag', classes: 'bg-yellow-500 min-w-[2px]', z: '4' },
} as const

function renderTimelineEvents(route: Route | undefined, events: TimelineEvent[]) {
  if (!route) return
  const duration = getRouteDuration(route)?.asMilliseconds() ?? 0
  return (
    <For each={events}>
      {(event) => {
        const pct = (ms: number) => `${(ms / duration) * 100}%`
        const left = pct(event.route_offset_millis)
        const width = event.type === 'user_flag' ? pct(1000) : pct(event.end_route_offset_millis - event.route_offset_millis)
        const styleKey = event.type === 'alert' ? (`alert_${event.alertStatus}` as keyof typeof EVENT_STYLES) : event.type
        const style = EVENT_STYLES[styleKey] ?? EVENT_STYLES.alert_2

        return <div title={style.title} class={clsx('absolute top-0 h-full', style.classes)} style={{ left, width, 'z-index': style.z }} />
      }}
    </For>
  )
}

const MARKER_WIDTH = 3

interface TimelineProps {
  class?: string
  route: Route | undefined
  seekTime: number
  updateTime: (time: number) => void
  events: TimelineEvent[]
}

const Timeline: VoidComponent<TimelineProps> = (props) => {
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
      <div class="h-1 bg-surface-container-high">
        <div class="h-full bg-white" style={{ width: `calc(${markerOffsetPct()}% + 1px)` }} />
      </div>
      <div
        ref={ref!}
        class={clsx(
          'relative isolate flex h-8 cursor-pointer touch-none self-stretch rounded-b-md bg-blue-900',
          'after:absolute after:inset-0 after:rounded-b-md after:bg-gradient-to-b after:from-black/0 after:via-black/10 after:to-black/30',
          props.class,
        )}
        title="Disengaged"
      >
        <div class="absolute inset-0 size-full rounded-b-md overflow-hidden">
          <Suspense fallback={<div class="skeleton-loader size-full" />}>{renderTimelineEvents(props.route, props.events)}</Suspense>
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
