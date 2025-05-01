import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDeviceStats, getFirehoseStats } from '~/api/devices'
import { formatDistance, formatDuration } from '~/utils/format'
import StatisticBar from './StatisticBar'

const DeviceStatistics: VoidComponent<{ class?: string; dongleId: string }> = (props) => {
  const [statistics] = createResource(() => props.dongleId, getDeviceStats)
  const [firehoseStatistics] = createResource(() => props.dongleId, getFirehoseStats)
  const allTime = () => statistics()?.all

  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: 'Distance', value: () => formatDistance(allTime()?.distance) },
        { label: 'Duration', value: () => formatDuration(allTime()?.minutes) },
        { label: 'Routes', value: () => allTime()?.routes },
        { label: 'Firehose', value: () => firehoseStatistics()?.firehose },
      ]}
    />
  )
}

export default DeviceStatistics
