import { createMemo, createSignal, Show, type VoidComponent } from 'solid-js'
import { getRoute } from '~/api/route'
import { dayjs } from '~/utils/format'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import RouteActions from '~/components/RouteActions'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import RouteVideoPlayer from '~/components/RouteVideoPlayer'
import RouteUploadButtons from '~/components/RouteUploadButtons'
import Timeline from '~/components/Timeline'
import { generateTimelineStatistics, getTimelineEvents } from '~/api/derived'
import { createQuery } from '@tanstack/solid-query'

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  startTime: number
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(props.startTime)
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement>()

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const route = createQuery(() => ({
    queryKey: ['route', routeName()],
    queryFn: () => getRoute(routeName()),
  }))

  const startTime = createMemo(() => {
    if (!route.isSuccess) return undefined
    return dayjs(route.data?.start_time)?.format('ddd, MMM D, YYYY')
  })

  const events = createQuery(() => ({
    queryKey: ['events', routeName()],
    queryFn: () => getTimelineEvents(route.data!),
    placeholderData: [],
    enabled: !!route.data,
  }))

  const timeline = createMemo(() => generateTimelineStatistics(route.data, events.data!))

  const onTimelineChange = (newTime: number) => {
    const video = videoRef()
    if (video) video.currentTime = newTime
  }

  return (
    <>
      <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>
        <Show when={startTime()} fallback={<div class="skeleton-loader min-h-16" />}>
          {startTime()}
        </Show>
      </TopAppBar>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <div class="flex flex-col">
          <Show when={route.isSuccess && events.isSuccess} fallback={<div class="skeleton-loader h-[335px]" />}>
            <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} startTime={seekTime()} onProgress={setSeekTime} />
            <Timeline class="mb-1" route={route.data} seekTime={seekTime()} updateTime={onTimelineChange} events={events.data!} />
          </Show>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Info</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <Show when={route.isSuccess} fallback={<div class="skeleton-loader min-h-48" />}>
              <RouteStatistics class="p-5" route={route.data} timeline={timeline()} />
              <RouteActions routeName={routeName()} route={route.data} />
            </Show>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Upload Files</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <Show when={route.isSuccess} fallback={<div class="skeleton-loader min-h-48" />}>
              <RouteUploadButtons route={route.data} />
            </Show>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Map</h3>
          <div class="aspect-square overflow-hidden rounded-lg">
            <Show when={route.isSuccess} fallback={<div class="skeleton-loader size-full bg-surface" />}>
              <RouteStaticMap route={route.data} />
            </Show>
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
