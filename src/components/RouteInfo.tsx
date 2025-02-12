import { createResource, Suspense, type VoidComponent } from 'solid-js'
import clsx from 'clsx'
import type { Route } from '~/types'
import { TimelineStatistics, getTimelineStatistics } from '~/api/derived'
import { formatDistance, formatRouteDuration } from '~/utils/format'
import Icon from '~/components/material/Icon'

const formatEngagement = (timeline?: TimelineStatistics): string => {
  if (!timeline) return ''
  const { engagedDuration, duration } = timeline
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}

const formatUserFlags = (timeline?: TimelineStatistics): string => {
  return timeline?.userFlags.toString() ?? ''
}

type RouteInfoProps = {
  class?: string
  route?: Route
}

const RouteInfo: VoidComponent<RouteInfoProps> = (props) => {
  const [timeline] = createResource(() => props.route, getTimelineStatistics)

  return (
    <div class={clsx('flex flex-col rounded-t-md bg-surface-container-low p-5', props.class)}>
      <div class="flex size-full items-center gap-8">
        <div class="flex grow flex-col items-start">
          <span class="text-body-sm text-on-surface-variant">Distance</span>
          <span class="flex w-full items-center justify-center gap-2 font-mono text-[20px] uppercase">
            <Icon>route</Icon>
            {formatDistance(props.route?.length)}
          </span>
        </div>

        <div class="flex grow flex-col items-start">
          <span class="text-body-sm text-on-surface-variant">Duration</span>
          <span class="flex w-full items-center justify-center gap-2 font-mono text-[20px] uppercase">
            <Icon>schedule</Icon>
            {formatRouteDuration(props.route)}
          </span>
        </div>

        <div class="hidden grow flex-col items-start xs:flex">
          <span class="text-body-sm text-on-surface-variant">Engaged</span>
          <Suspense>
            <span class="flex w-full items-center justify-center gap-2 font-mono text-[20px] uppercase">
              <Icon>speed</Icon>
              {formatEngagement(timeline())}
            </span>
          </Suspense>
        </div>

        <div class="flex grow flex-col items-start">
          <span class="text-body-sm text-on-surface-variant">User flags</span>
          <Suspense>
            <span class="flex w-full items-center justify-center gap-2 font-mono text-[20px] uppercase">
              <Icon>flag</Icon>
              {formatUserFlags(timeline())}
            </span>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default RouteInfo 
