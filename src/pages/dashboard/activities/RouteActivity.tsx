import { Show, createEffect, createResource, createSignal, Suspense, type VoidComponent } from 'solid-js'
import { A } from '@solidjs/router'

import { setRouteViewed } from '~/api/athena'
import { getRouteStatistics } from '~/api/derived'
import { getRoute } from '~/api/route'
import { dayjs } from '~/utils/format'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import RouteActions from '~/components/RouteActions'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatisticsBar from '~/components/RouteStatisticsBar'
import RouteVideoPlayer from '~/components/RouteVideoPlayer'
import RouteUploadButtons from '~/components/RouteUploadButtons'
import Timeline from '~/components/Timeline'
import { createQuery, queryOptions } from '@tanstack/solid-query'
import { Route } from '~/api/types'
import { getPlaceName } from '~/map/geocode'
import { queries as deviceQueries } from './DeviceActivity'
import { queries as dashboardQueries } from '../Dashboard'

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  startTime: number
  endTime: number | undefined
}

export const queries = {
  route: ['route'],
  statistics: () => [...queries.route, 'statistics'],
  location: () => [...queries.route, 'location'],
  forRoute: (routeName: string) => [...queries.route, routeName],
  forRouteStatistics: (routeName: string) => [...queries.statistics(), routeName],
  forRouteLocation: (routeName: string) => [...queries.location(), routeName],
  getRoute: (routeName: string) => queryOptions({ queryKey: queries.forRoute(routeName), queryFn: () => getRoute(routeName) }),
  getRouteStatistics: (route?: Route) =>
    queryOptions({
      queryKey: queries.forRouteStatistics(route?.fullname ?? ''),
      queryFn: () => getRouteStatistics(route!),
      enabled: !!route,
    }),
  getRouteLocation: (route?: Route) =>
    queryOptions({
      queryKey: queries.forRouteLocation(route?.fullname ?? ''),
      queryFn: async () => {
        const startPos = [route?.start_lng || 0, route?.start_lat || 0]
        const endPos = [route?.end_lng || 0, route?.end_lat || 0]
        const startPlace = await getPlaceName(startPos)
        const endPlace = await getPlaceName(endPos)
        if (!startPlace && !endPlace) return ''
        if (!endPlace || startPlace === endPlace) return startPlace
        if (!startPlace) return endPlace
        return `${startPlace} to ${endPlace}`
      },
      enabled: !!route,
    }),
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(props.startTime)
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement>()

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const routeQuery = createQuery(() => queries.getRoute(routeName()))
  const route = () => routeQuery.data
  const [startTime] = createResource(route, (route) => dayjs(route?.start_time)?.format('dddd, MMM D, YYYY'))

  const selection = () => ({ startTime: props.startTime, endTime: props.endTime })

  const statistics = createQuery(() => queries.getRouteStatistics(route()))

  const onTimelineChange = (newTime: number) => {
    const video = videoRef()
    if (video) video.currentTime = newTime
  }

  createEffect(() => {
    routeName() // track changes
    setSeekTime(props.startTime)
    onTimelineChange(props.startTime)
  })

  const device = createQuery(() => deviceQueries.getDevice(props.dongleId))
  const profile = createQuery(dashboardQueries.getProfile)
  createEffect(() => {
    if (device.data && profile.data) {
      if (!device.data.is_owner && !profile.data.superuser) return
      setRouteViewed(device.data.dongle_id, props.dateStr)
    }
  })

  return (
    <>
      <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>{startTime()}</TopAppBar>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <div class="flex flex-col">
          <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} selection={selection()} onProgress={setSeekTime} />
          <Timeline class="mb-1" seekTime={seekTime()} updateTime={onTimelineChange} statistics={statistics.data} />

          <Show when={selection().startTime || selection().endTime}>
            <A
              class="flex items-center justify-center text-center text-label-lg text-gray-500 mt-4"
              href={`/${props.dongleId}/${props.dateStr}`}
            >
              Clear current route selection
              <IconButton name="close_small" />
            </A>
          </Show>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-label-md uppercase">Route Info</span>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <RouteStatisticsBar class="p-5" route={route()} statistics={statistics.data} />

            <RouteActions routeName={routeName()} route={route()} />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-label-md uppercase">Upload Files</span>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <RouteUploadButtons route={route()} />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-label-md uppercase">Route Map</span>
          <div class="aspect-square overflow-hidden rounded-lg">
            <Suspense fallback={<div class="h-full w-full skeleton-loader bg-surface-container" />}>
              <RouteStaticMap route={route()} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
