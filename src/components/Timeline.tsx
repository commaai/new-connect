import { For, createResource, createSignal, createEffect, onMount, onCleanup, Suspense } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { TimelineEvent, getTimelineEvents } from '~/api/derived'
import type { Route } from '~/types'
import { getRouteDuration } from '~/utils/format'

function renderTimelineEvents(route: Route | undefined, events: TimelineEvent[]) {
  if (!route) return
  const duration = getRouteDuration(route)?.asMilliseconds() ?? 0
  return (
    <For each={events}>
      {(event) => {
        let left = ''
        let width = ''
        switch (event.type) {
          case 'engaged':
          case 'overriding':
          case 'alert': {
            const { route_offset_millis, end_route_offset_millis } = event
            const offsetPct = (route_offset_millis / duration) * 100
            const endOffsetPct = (end_route_offset_millis / duration) * 100
            const widthPct = endOffsetPct - offsetPct

            left = `${offsetPct}%`
            width = `${widthPct}%`
            break
          }
          case 'user_flag': {
            const { route_offset_millis } = event
            const offsetPct = (route_offset_millis / duration) * 100
            const widthPct = (1000 / duration) * 100

            left = `${offsetPct}%`
            width = `${widthPct}%`
            break
          }
        }

        let classes = ''
        let title = ''
        switch (event.type) {
          case 'engaged':
            title = 'Engaged'
            classes = 'bg-green-800 min-w-[1px]'
            break
          case 'overriding':
            title = 'Overriding'
            classes = 'bg-gray-500 min-w-[1px]'
            break
          case 'alert':
            if (event.alertStatus === 1) {
              title = 'User prompt alert'
              classes = 'bg-amber-600'
            } else {
              title = 'Critical alert'
              classes = 'bg-red-600'
            }
            classes += ' min-w-[2px]'
            break
          case 'user_flag':
            title = 'User flag'
            classes = 'bg-yellow-500  min-w-[2px]'
        }

        const zIndex = {
          engaged: '1',
          overriding: '2',
          alert: '3',
          user_flag: '4',
        }[event.type]

        return (
          <div
            title={title}
            class={clsx('absolute top-0 h-full', classes)}
            style={{
              left,
              width,
              'z-index': zIndex,
            }}
          />
        )
      }}
    </For>
  )
}

const MARKER_WIDTH = 3

interface TimelineProps {
  class?: string
  route?: Route
  seekTime: number
  updateTime: (time: number) => void
}

const Timeline: VoidComponent<TimelineProps> = (props) => {
  const route = () => props.route
  const [events] = createResource(route, getTimelineEvents, { initialValue: [] })
  // TODO: align to first camera frame event
  const [markerOffsetPct, setMarkerOffsetPct] = createSignal(0)
  const [duration] = createResource(route, (route) => getRouteDuration(route)?.asSeconds() ?? 0, { initialValue: 0 })

  let ref!: HTMLDivElement

  onMount(() => {
    const updateMarker = (clientX: number) => {
      const rect = ref.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width - MARKER_WIDTH)
      const fraction = x / rect.width
      // Update marker immediately without waiting for video
      setMarkerOffsetPct(fraction * 100)
      const newTime = duration() * fraction
      props.updateTime(newTime)
    }

    const onStart = () => {
      const onMouseMove = (ev: MouseEvent) => {
        updateMarker(ev.clientX)
      }
      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) return
        updateMarker(ev.touches[0].clientX)
      }
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('mouseup', onMouseUp)
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
    setMarkerOffsetPct((props.seekTime / duration()) * 100)
  })

  return (
    <div
      ref={ref!}
      class={clsx(
        'relative isolate flex h-6 cursor-pointer touch-none self-stretch overflow-hidden rounded-sm bg-blue-900',
        'after:absolute after:inset-0 after:bg-gradient-to-b after:from-[rgba(0,0,0,0)] after:via-[rgba(0,0,0,0.1)] after:to-[rgba(0,0,0,0.2)]',
        props.class,
      )}
      title="Disengaged"
    >
      <Suspense fallback={<div class="skeleton-loader size-full"></div>}>{renderTimelineEvents(props.route, events())}</Suspense>
      <div
        class="absolute top-0 z-10 h-full"
        style={{
          'background-color': 'rgba(255,255,255,0.7)',
          width: `${MARKER_WIDTH}px`,
          left: `${markerOffsetPct()}%`,
        }}
      />
    </div>
  )
}

export default Timeline
