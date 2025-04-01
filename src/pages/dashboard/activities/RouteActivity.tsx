import { createMemo, createResource, Show, createSignal, Suspense, type VoidComponent } from 'solid-js'

import { setRouteViewed } from '~/api/athena'
import { getDevice } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getRoute } from '~/api/route'
import { dayjs } from '~/utils/format'
import { getTimelineEvents, getTimelineStatistics, generateTimelineStatistics } from '~/api/derived'

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

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  // // TODO: get route from parent
  const [route] = createResource(routeName, getRoute)
  const startTime = createMemo(() => {
    const r = route();
    return r ? dayjs(r.start_time)?.format('ddd, MMM D, YYYY') : undefined;
  });
  // const startTime = () => "hi" //dayjs(route()?.start_time)?.format('ddd, MMM D, YYYY')

  // const onTimelineChange = (newTime: number) => {
  //   const video = videoRef()
  //   if (video) video.currentTime = newTime
  // }
  //
  // const [device] = createResource(() => props.dongleId, getDevice)
  // const [profile] = createResource(getProfile)
  // // TODO: we already fetch the timeline in RouteList, don't do this again
  // // const [timeline] = createResource(() => route(), getTimelineStatistics)
  // // const [events] = createResource(() => route(), getTimelineEvents, { initialValue: [] })
  // // const events = () => getTimelineEvents(route()!)  // TODO: why does createResource block UI? tested by not even using this. func works but not efficient
  //
  // createResource(
  //   () => [device(), profile(), props.dateStr] as const,
  //   async ([device, profile, dateStr]) => {
  //     if (!device || !profile || (!device.is_owner && !profile.superuser)) return
  //     await setRouteViewed(device.dongle_id, dateStr)
  //   },
  // )

  return (
    <>
      <Suspense fallback={<TopAppBar />}>
        <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>{dayjs(route()?.start_time)?.format('ddd, MMM D, YYYY')}</TopAppBar>
      </Suspense>
      <Show when={route()}>
        <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>{startTime()}</TopAppBar>
      </Show>

      <div class="flex flex-col gap-6 px-4 pb-4">
        {/*<div class="flex flex-col">*/}
        {/*  <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} startTime={seekTime()} onProgress={setSeekTime} />*/}
        {/*  /!*<Suspense fallback={<div class="skeleton-loader min-h-48" />}>*!/*/}
        {/*  /!*  <Timeline class="mb-1" route={route.latest} events={events()} seekTime={seekTime()} updateTime={onTimelineChange} />*!/*/}
        {/*  /!*</Suspense>*!/*/}
        {/*</div>*/}

        {/*<div class="flex flex-col gap-2">*/}
        {/*  <h3 class="text-label-sm uppercase">Route Info</h3>*/}
        {/*  <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">*/}
        {/*    /!*<RouteStatistics class="p-5" route={route()} timeline={timeline()} />*!/*/}
        {/*    /!*<RouteStatistics class="p-5" route={route()} timeline={events().then((timeline) => generateTimelineStatistics(route, timeline))} />*!/*/}
        {/*    /!*<RouteStatistics class="p-5" route={route()} timeline={generateTimelineStatistics(route()!, events())} />*!/*/}

        {/*    <Suspense fallback={<div class="skeleton-loader min-h-48" />}>*/}
        {/*      <RouteActions routeName={routeName()} route={route()} />*/}
        {/*    </Suspense>*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/*<div class="flex flex-col gap-2">*/}
        {/*  <h3 class="text-label-sm uppercase">Upload Files</h3>*/}
        {/*  <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">*/}
        {/*    <Suspense fallback={<div class="skeleton-loader min-h-48" />}>*/}
        {/*      <RouteUploadButtons route={route()} />*/}
        {/*    </Suspense>*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/*<div class="flex flex-col gap-2">*/}
        {/*  <h3 class="text-label-sm uppercase">Route Map</h3>*/}
        {/*  <div class="aspect-square overflow-hidden rounded-lg">*/}
        {/*    <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>*/}
        {/*      <RouteStaticMap route={route()} />*/}
        {/*    </Suspense>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    </>
  )
}

export default RouteActivity
