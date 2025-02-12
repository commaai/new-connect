import {
  createResource,
  createSignal,
  lazy,
  Suspense,
  type VoidComponent,
  createMemo,
} from 'solid-js'

import { getRoute, getPreservedRoutes } from '~/api/route'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import Timeline from '~/components/Timeline'
import { dayjs } from '~/utils/format'

import RouteActions from '~/components/RouteActions'

const RouteVideoPlayer = lazy(() => import('~/components/RouteVideoPlayer'))

type RouteActivityProps = {
  dongleId: string
  dateStr: string
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(0)

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)
  const [startTime] = createResource(route, (route) => dayjs(route.start_time)?.format('ddd, MMM D, YYYY'))
  const [isPublic] = createResource(route, (route) => route.is_public)

  const [preservedRoutes] = createResource(
    () => props.dongleId,
    getPreservedRoutes,
  )

  const isPreserved = createMemo(() => {
    try {
      const currentRoute = route()
      const preserved = preservedRoutes()

      if (!currentRoute) return undefined
      if (currentRoute.is_preserved) return true
      if (!preserved) return undefined

      return preserved.some(r => r.fullname === currentRoute.fullname)
    } catch (err) {
      console.error('Error checking preserved status:', err)
      return undefined
    }
  })

  let videoRef: HTMLVideoElement

  function onTimelineChange(newTime: number) {
    videoRef.currentTime = newTime
  }

  return (
    <>
      <TopAppBar leading={<IconButton class="md:hidden" href={`/${props.dongleId}`}>arrow_back</IconButton>}>
        {startTime()}
      </TopAppBar>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <div class="flex flex-col">
          <Suspense
            fallback={
              <div class="skeleton-loader aspect-[241/151] rounded-lg bg-surface-container-low" />
            }
          >
            <RouteVideoPlayer ref={ref => videoRef = ref} routeName={routeName()} onProgress={setSeekTime} />
          </Suspense>
          <Timeline
            routeName={routeName()}
            seekTime={seekTime}
            updateTime={onTimelineChange}
          />
        </div>

        <Suspense fallback={<div class="h-10" />}>
          <RouteStatistics route={route()} />
        </Suspense>

        <Suspense fallback={<div class="skeleton-loader min-h-80 rounded-lg bg-surface-container-low" />}>
          <RouteActions
            routeName={routeName()}
            initialPublic={isPublic()}
            initialPreserved={isPreserved()}
            isPublic={isPublic}
            isPreserved={isPreserved}
          />
        </Suspense>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Map</h3>
          <div class="aspect-square overflow-hidden rounded-lg">
            <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>
              <RouteStaticMap route={route()} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
