import { createResource, Suspense } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { TimelineStatistics, getTimelineStatistics } from '~/api/derived'
import type { Route } from '~/types'
import { formatRouteDistance, formatRouteDuration } from '~/utils/date'

import Typography from '~/components/material/Typography'

const formatEngagement = (timeline?: TimelineStatistics): string => {
  if (!timeline) return ''
  const { engagedDuration, duration } = timeline
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}

const formatUserFlags = (timeline?: TimelineStatistics): string => {
  return timeline?.userFlags.toString() ?? ''
}

type RouteStatisticsProps = {
  class?: string
  route?: Route
}

const RouteStatistics: VoidComponent<RouteStatisticsProps> = (props) => {
  const [timeline] = createResource(() => props.route, getTimelineStatistics)

  return (
    <div class={clsx('flex h-10 w-full items-stretch gap-8', props.class)}>
      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          Distance
        </Typography>
        <Typography variant="label-lg">
          {formatRouteDistance(props.route)}
        </Typography>
      </div>

      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          Duration
        </Typography>
        <Typography variant="label-lg">
          {formatRouteDuration(props.route)}
        </Typography>
      </div>

      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          Engaged
        </Typography>
        <Suspense>
          <Typography variant="label-lg">
            {formatEngagement(timeline())}
          </Typography>
        </Suspense>
      </div>

      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          User flags
        </Typography>
        <Suspense>
          <Typography variant="label-lg">
            {formatUserFlags(timeline())}
          </Typography>
        </Suspense>
      </div>
    </div>
  )
}

export default RouteStatistics
