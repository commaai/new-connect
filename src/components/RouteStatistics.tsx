import type { VoidComponent } from 'solid-js'

import type { TimelineStatistics } from '~/api/derived'
import type { Route } from '~/api/types'
import { formatDistance, formatRouteDuration } from '~/utils/format'
import StatisticBar from './StatisticBar'

const formatEngagement = (timeline: TimelineStatistics | undefined): string | undefined => {
  if (!timeline || timeline.duration === 0) return undefined
  const { engagedDuration, duration } = timeline
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}

const RouteStatistics: VoidComponent<{ class?: string; route: Route | undefined; timeline: TimelineStatistics | undefined }> = (props) => {
  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: 'Distance', value: () => formatDistance(props.route?.length) },
        { label: 'Duration', value: () => (props.route ? formatRouteDuration(props.route) : undefined) },
        { label: 'Engaged', value: () => formatEngagement(props.timeline) },
      ]}
    />
  )
}

export default RouteStatistics
