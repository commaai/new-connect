import {
  createResource,
  createSignal,
  lazy,
  Suspense,
  type VoidComponent,
} from 'solid-js'

import { getRoute } from '~/api/route'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import Typography from '~/components/material/Typography'

import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import Timeline from '~/components/Timeline'
import { parseDateStr } from '~/utils/date'

const RouteVideoPlayer = lazy(() => import('~/components/RouteVideoPlayer'))

type RouteActivityProps = {
  dongleId: string
  dateStr: string
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(0)

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)

  const approxTime = () => parseDateStr(props.dateStr)
  // let startTime = route
  //   ? DateTime.fromMillis(route.segment_start_times[0])
  //   : approxTime

  return (
    <>
      <TopAppBar
        leading={
          <IconButton href={`/${props.dongleId}`}>arrow_back</IconButton>
        }
      >
        {approxTime().format('ddd, MMM D, YYYY')}
      </TopAppBar>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <Suspense
          fallback={
            <div class="skeleton-loader aspect-[241/151] rounded-lg bg-surface-1" />
          }
        >
          <RouteVideoPlayer routeName={routeName()} onProgress={setSeekTime} />
        </Suspense>

        <div class="flex flex-col gap-2">
          <Typography as="h3" variant="label-sm">
            Timeline
          </Typography>
          <Timeline
            class="mb-1"
            routeName={routeName()}
            seekTime={seekTime()}
          />
          <Suspense fallback={<div class="h-10" />}>
            <RouteStatistics route={route()} />
          </Suspense>
        </div>

        <div class="flex flex-col gap-2">
          <Typography as="h3" variant="label-sm">
            Route Map
          </Typography>
          <div class="h-64 overflow-hidden rounded-lg">
            <Suspense
              fallback={
                <div class="skeleton-loader size-full bg-surface" />
              }
            >
              <RouteStaticMap route={route()} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
