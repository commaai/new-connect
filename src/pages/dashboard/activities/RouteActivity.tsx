import {createEffect, createMemo, createResource, createSignal, Show, Suspense, type VoidComponent} from 'solid-js'

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
import { generateTimelineStatistics, getTimelineEvents, type TimelineEvent } from '~/api/derived'

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  urlStartTime: number
  events: TimelineEvent[]
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(props.urlStartTime)
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement>()
  console.log('in RouteActivity')
  //
  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)
  // const route = createMemo(() => getRoute(routeName()))
  // const [startTime] = createResource(route, (route) => dayjs(route.start_time)?.format('ddd, MMM D, YYYY'))

  // createEffect(() => {
  //   console.log('routeName', routeName())
  // })

  //
  // const [events] = createResource(route, getTimelineEvents, { initialValue: [] })
  // const [events] = createResource(() => route(), getTimelineEvents, { initialValue: [] })
  // const events = createMemo(async () => route.loading ? [] : await getTimelineEvents(route.latest!))
  // const [events] = createResource(
  //   () => !route.loading ? route() : null,
  //   getTimelineEvents,
  //   { initialValue: [] }
  // )
//   const [events] = createResource(
//   () => props.dateStr || null,  // only change when needed
//   async (key) => {
//     if (!key) return []
//     return await getTimelineEvents(key)
//   },
//   {
//     initialValue: [],            // gives you something immediately
//     deferStream: true            // Solid starts using new value once ready
//   }
// )

  // const events = () => (route.loading ? [] : getTimelineEvents(route.latest!))
// const [events] = createResource(
//   () => routeName(),
//   async (routeId) => {
//     if (!routeId) return []
//
//     const route = await getRoute(routeId) // ✅ wait for this first
//     if (!route) return []
//     return await getTimelineEvents(route) // ✅ only call if route is ready
//   },
//   {
//     initialValue: [], // prevents render blocking
//   }
// )

  // const [events, setEvents] = createSignal([])

  // createEffect(() => {
  //   // console.log('events', events())
  //   const r = route()
  //   if (r) {
  //     getTimelineEvents(r).then(setEvents)
  //   }
  // })
  // const [timeline] = createResource(
  //   () => [route(), events()] as const,
  //   ([r, e]) => generateTimelineStatistics(r, e),
  // )
  //
  const onTimelineChange = (newTime: number) => {
    const video = videoRef()
    if (video) video.currentTime = newTime
  }
  //
  // const [device] = createResource(() => props.dongleId, getDevice)
  // const [profile] = createResource(getProfile)
  // createResource(
  //   () => [device(), profile(), props.dateStr] as const,
  //   async ([device, profile, dateStr]) => {
  //     if (!device || !profile || (!device.is_owner && !profile.superuser)) return
  //     await setRouteViewed(device.dongle_id, dateStr)
  //   },
  // )

  return (
    <>
      {/*<TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>{startTime()}</TopAppBar>*/}

      <div class="flex flex-col gap-6 px-4 pb-4">
        <div class="flex flex-col">
          {/*<Suspense>*/}
            <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} startTime={seekTime()} onProgress={setSeekTime} />
          {/*</Suspense>*/}
          {/*<Suspense fallback={<div class="skeleton-loader min-h-48" />}>*/}
          {/*  <Timeline class="mb-1" route={route.latest} seekTime={seekTime()} updateTime={onTimelineChange} events={props.events} />*/}
          {/*</Suspense>*/}
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Info</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            {/*<Show when={!route.loading} fallback={<div class="skeleton-loader h-[76px]" />}>*/}
            {/*<Suspense>*/}
            {/*  <RouteStatistics class="p-5" route={route()} timeline={undefined} />*/}
            {/*<Show when={route()}>*/}
            {/*TODO: add skeleton animation to each StatisticBar*/}
            <RouteStatistics class="p-5" route={route.latest} timeline={undefined} />
            {/*</Show>*/}
            {/*</Suspense>*/}
            {/*</Show>*/}
            {/*<Show when={route()} fallback={<div class="skeleton-loader w-12 h-5" />}>*/}
            {/*  {(r) => <div>Distance: {r.length}</div>}*/}
            {/*</Show>*/}
            {/*<Suspense fallback={<div class="skeleton-loader min-h-48" />}>*/}
            {/*  <Show when={!route.loading} fallback={<div class="skeleton-loader min-h-48" />}>*/}
            {/*  <div>Distance: {route.latest?.length}</div>*/}
            {/*  </Show>*/}
            {/*</Suspense>*/}

            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              {/*{route.latest?.fullname}*/}
              <RouteActions routeName={routeName()} route={route()} />
            </Suspense>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Upload Files</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              <RouteUploadButtons route={route()} />
            </Suspense>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Map</h3>
          <div class="aspect-square overflow-hidden rounded-lg">
            {/*<Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>*/}
            {/*  <RouteStaticMap route={route()} />*/}
            {/*</Suspense>*/}
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
