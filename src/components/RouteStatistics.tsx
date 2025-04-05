import type { VoidComponent } from 'solid-js'

import type { TimelineStatistics } from '~/api/derived'
import { formatDistance, formatRouteDuration } from '~/utils/format'
import StatisticBar from './StatisticBar'
import { currentRoute } from '~/store'

const formatEngagement = (timeline: TimelineStatistics | undefined): string | undefined => {
  if (!timeline || timeline.duration === 0) return undefined
  const { engagedDuration, duration } = timeline
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}

const RouteStatistics: VoidComponent<{ class?: string; timeline: TimelineStatistics | undefined }> = (props) => {
  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: 'Distance', value: () => formatDistance(currentRoute()?.length) },
        { label: 'Duration', value: () => (currentRoute() ? formatRouteDuration(currentRoute()) : undefined) },
        { label: 'Engaged', value: () => formatEngagement(props.timeline) },
      ]}
    />
  )
}

export default RouteStatistics
