import { createEffect, createSignal, Match, Suspense, Switch, type VoidComponent } from 'solid-js'
import { Navigate } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'

import { setRouteViewed } from '~/api/athena'
import { getDevice } from '~/api/devices'
import { getProfile } from '~/api/profile'
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

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  startTime: number
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(props.startTime)
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement>()

  const onTimelineChange = (newTime: number) => {
    const video = videoRef()
    if (video) video.currentTime = newTime
  }

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const route = createQuery(() => ({ queryKey: ['route', routeName()], queryFn: () => getRoute(routeName()) }))
  const device = createQuery(() => ({ queryKey: ['device', props.dongleId], queryFn: () => getDevice(props.dongleId) }))
  const profile = createQuery(() => ({ queryKey: ['profile'], queryFn: getProfile }))

  createEffect(() => {
    if (!device.isSuccess || !profile.isSuccess || (!device.data?.is_owner && !profile.data?.superuser)) return
    setRouteViewed(device.data!.dongle_id, props.dateStr).catch(console.error)
  })

  return (
    <>
      <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>
        {dayjs(route.data?.start_time)?.format('ddd, MMM D, YYYY')}
      </TopAppBar>

      <Switch>
        <Match when={route.isError}>
          <Navigate href="/" />
        </Match>
        <Match when={true}>
          <div class="flex flex-col gap-6 px-4 pb-4">
            <Suspense fallback={<div class="skeleton-loader h-[292px]" />}>
              <div class="flex flex-col">
                <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} startTime={seekTime()} onProgress={setSeekTime} />
                <Timeline class="mb-1" route={route.data} seekTime={seekTime()} updateTime={onTimelineChange} />
              </div>
            </Suspense>

            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              <div class="flex flex-col gap-2">
                <h3 class="text-label-sm uppercase">Route Info</h3>
                <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
                  <RouteStatistics class="p-5" route={route.data} />
                  <RouteActions routeName={routeName()} route={route.data} />
                </div>
              </div>
            </Suspense>

            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              <div class="flex flex-col gap-2">
                <h3 class="text-label-sm uppercase">Upload Files</h3>
                <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
                  <RouteUploadButtons route={route.data} />
                </div>
              </div>
            </Suspense>

            <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>
              <div class="flex flex-col gap-2">
                <h3 class="text-label-sm uppercase">Route Map</h3>
                <div class="aspect-square overflow-hidden rounded-lg">
                  <RouteStaticMap route={route.data} />
                </div>
              </div>
            </Suspense>
          </div>
        </Match>
      </Switch>
    </>
  )
}

export default RouteActivity
