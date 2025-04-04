import { For, createResource, createSignal, createEffect, onMount, onCleanup, Suspense } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { TimelineEvent } from '~/api/derived'
import type { Route } from '~/api/types'
import { getRouteDuration } from '~/utils/format'

export type Selection = { startTime: number; endTime: number }

interface TimelineProps {
  class?: string
  route: Route | undefined
  seekTime: number
  updateTime: (time: number) => void
  events: TimelineEvent[]
  setSelection?: (selection: Selection) => void
  selection?: Selection | null
}

function renderTimelineEvents(
  route: Route | undefined,
  events: TimelineEvent[],
  selection?: Selection | null,
) {
  if (!route) return
  if (selection) {
    // Zoom mode – working in seconds.
    const selectionDuration = selection.endTime - selection.startTime
    return (
      <For each={events}>
        {(event) => {
          let left = ''
          let width = ''
          switch (event.type) {
            case 'engaged':
            case 'overriding':
            case 'alert': {
              const eventStart = event.route_offset_millis / 1000
              const eventEnd = event.end_route_offset_millis / 1000
              // Skip events completely outside the selection.
              if (eventEnd < selection.startTime || eventStart > selection.endTime) return null
              // Clamp event boundaries to the selection.
              const clampedStart = Math.max(eventStart, selection.startTime)
              const clampedEnd = Math.min(eventEnd, selection.endTime)
              const offsetPct = ((clampedStart - selection.startTime) / selectionDuration) * 100
              const endOffsetPct = ((clampedEnd - selection.startTime) / selectionDuration) * 100
              const widthPct = endOffsetPct - offsetPct
              left = `${offsetPct}%`
              width = `${widthPct}%`
              break
            }
            case 'user_flag': {
              const eventTime = event.route_offset_millis / 1000
              if (eventTime < selection.startTime || eventTime > selection.endTime) return null
              const offsetPct = ((eventTime - selection.startTime) / selectionDuration) * 100
              // Assume a fixed width of 1 second.
              const widthPct = (1 / selectionDuration) * 100
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
              classes = 'bg-yellow-500 min-w-[2px]'
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
  } else {
    // Full timeline mode.
    const fullDurationMs = getRouteDuration(route)?.asMilliseconds() ?? 0
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
              const offsetPct = (route_offset_millis / fullDurationMs) * 100
              const endOffsetPct = (end_route_offset_millis / fullDurationMs) * 100
              const widthPct = endOffsetPct - offsetPct
              left = `${offsetPct}%`
              width = `${widthPct}%`
              break
            }
            case 'user_flag': {
              const { route_offset_millis } = event
              const offsetPct = (route_offset_millis / fullDurationMs) * 100
              const widthPct = (1000 / fullDurationMs) * 100
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
              classes = 'bg-yellow-500 min-w-[2px]'
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
}

const MARKER_WIDTH = 3

const Timeline: VoidComponent<TimelineProps> = (props) => {
  const route = () => props.route
  // Full timeline duration (in seconds).
  const [fullDuration] = createResource(route, (route) => getRouteDuration(route)?.asSeconds() ?? 0, { initialValue: 0 })
  const [markerOffsetPct, setMarkerOffsetPct] = createSignal(0)

  let ref!: HTMLDivElement

  onMount(() => {
    let pressHoldTimer: number | null = null
    const PRESS_HOLD_THRESHOLD = 500 // ms
    let isSelecting = false
    let selectionStartPct: number | null = null

    const cancelPressHoldTimer = () => {
      if (pressHoldTimer !== null) {
        clearTimeout(pressHoldTimer)
        pressHoldTimer = null
      }
    }

    // Compute fraction relative to the timeline element.
    const getFraction = (clientX: number) => {
      const rect = ref.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width - MARKER_WIDTH)
      return x / rect.width
    }

    const updateMarker = (clientX: number) => {
      const fraction = getFraction(clientX)
      setMarkerOffsetPct(fraction * 100)
      let newTime: number
      if (props.selection) {
        const selectionDuration = props.selection.endTime - props.selection.startTime
        newTime = props.selection.startTime + fraction * selectionDuration
      } else {
        newTime = fullDuration() * fraction
      }
      props.updateTime(newTime)
    }

    const handleMove = (clientX: number) => {
      const fraction = getFraction(clientX)
      const currentPct = fraction * 100

      if (isSelecting && selectionStartPct !== null) {
        const activeDuration = props.selection
          ? props.selection.endTime - props.selection.startTime
          : fullDuration()
        const startTime = (selectionStartPct / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)
        const currentTime = (currentPct / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)
        console.log(`Selection: from ${startTime.toFixed(2)}s to ${currentTime.toFixed(2)}s`)
      } else {
        setMarkerOffsetPct(currentPct)
        let newTime: number
        if (props.selection) {
          const selectionDuration = props.selection.endTime - props.selection.startTime
          newTime = props.selection.startTime + fraction * selectionDuration
        } else {
          newTime = fullDuration() * fraction
        }
        props.updateTime(newTime)
      }
    }

    const onStart = () => {
      const onMouseMove = (ev: MouseEvent) => {
        handleMove(ev.clientX)
      }
      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) return
        handleMove(ev.touches[0].clientX)
      }
      const onStop = (ev: MouseEvent | TouchEvent) => {
        cancelPressHoldTimer()
        if (isSelecting && selectionStartPct !== null) {
          const fraction = ev instanceof MouseEvent
            ? getFraction(ev.clientX)
            : getFraction(ev.changedTouches[0].clientX)
          const endPct = fraction * 100
          const activeDuration = props.selection
            ? props.selection.endTime - props.selection.startTime
            : fullDuration()
          const startTime = (selectionStartPct / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)
          const endTime = (endPct / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)
          console.log(`Final selection: from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`)
          props.setSelection && props.setSelection({ startTime, endTime })
        }
        isSelecting = false
        selectionStartPct = null
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
      const fraction = getFraction(ev.clientX)
      setMarkerOffsetPct(fraction * 100)
      let newTime: number
      if (props.selection) {
        const selectionDuration = props.selection.endTime - props.selection.startTime
        newTime = props.selection.startTime + fraction * selectionDuration
      } else {
        newTime = fullDuration() * fraction
      }
      props.updateTime(newTime)
      pressHoldTimer = window.setTimeout(() => {
        isSelecting = true
        selectionStartPct = fraction * 100
        const activeDuration = props.selection
          ? props.selection.endTime - props.selection.startTime
          : fullDuration()
        console.log(`Selection started at ${((selectionStartPct! / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)).toFixed(2)}s`)
      }, PRESS_HOLD_THRESHOLD)
      onStart()
    }

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1 || !props.route) return
      const fraction = getFraction(ev.touches[0].clientX)
      setMarkerOffsetPct(fraction * 100)
      let newTime: number
      if (props.selection) {
        const selectionDuration = props.selection.endTime - props.selection.startTime
        newTime = props.selection.startTime + fraction * selectionDuration
      } else {
        newTime = fullDuration() * fraction
      }
      props.updateTime(newTime)
      pressHoldTimer = window.setTimeout(() => {
        isSelecting = true
        selectionStartPct = fraction * 100
        const activeDuration = props.selection
          ? props.selection.endTime - props.selection.startTime
          : fullDuration()
        console.log(`Selection started at ${((selectionStartPct! / 100) * activeDuration + (props.selection ? props.selection.startTime : 0)).toFixed(2)}s`)
      }, PRESS_HOLD_THRESHOLD)
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
    if (props.selection) {
      const selectionDuration = props.selection.endTime - props.selection.startTime
      // Clamp seekTime to selection boundaries.
      const clamped = Math.max(props.selection.startTime, Math.min(props.seekTime, props.selection.endTime))
      setMarkerOffsetPct(((clamped - props.selection.startTime) / selectionDuration) * 100)
    } else {
      setMarkerOffsetPct((props.seekTime / fullDuration()) * 100)
    }
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
        <Suspense fallback={<div class="skeleton-loader size-full"></div>}>
          {renderTimelineEvents(props.route, props.events, props.selection)}
        </Suspense>
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
